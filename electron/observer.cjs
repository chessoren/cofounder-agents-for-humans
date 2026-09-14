// OBSERVER — Cofounder watches how you work, never what you type.
//
// Every POLL_MS we ask macOS (System Events, via osascript) which application is
// frontmost, the title of its front window and, for browsers, the URL of the
// active tab. A line is appended to observation.jsonl only when that changes.
// That stream is what the Strands workflow agent mines for repeated workflows.
//
// Never recorded: keystrokes, clipboard, field contents, screenshots.
// Needs: Accessibility (window titles) and Automation for browsers (URLs).
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const POLL_MS = 2000;
const LOG_CAP_BYTES = 8 * 1024 * 1024;

const CHROMIUM = new Set([
  'com.google.Chrome', 'com.google.Chrome.canary', 'com.brave.Browser', 'com.microsoft.edgemac',
  'company.thebrowser.Browser', 'com.vivaldi.Vivaldi', 'com.operasoftware.Opera',
]);
const SAFARI = new Set(['com.apple.Safari', 'com.apple.SafariTechnologyPreview']);

// One osascript call returns "app \t bundle \t title". The URL is a second call,
// made only for browsers, so a non-browser app never triggers an Automation prompt.
const FRONT_SCRIPT = `
tell application "System Events"
  set p to first application process whose frontmost is true
  set appName to name of p
  set bid to ""
  try
    set bid to bundle identifier of p
  end try
  set t to ""
  try
    set t to name of front window of p
  end try
end tell
return appName & tab & bid & tab & t`;

let dataDir = '';
let timer = null;
let paused = false;
let last = null;
let lastError = '';
let eventsToday = 0;
let stateHandler = null;

function logPath() { return path.join(dataDir, 'observation.jsonl'); }
function prefsPath() { return path.join(dataDir, 'observer-prefs.json'); }

function osa(script, timeout = 1500) {
  return new Promise((resolve) => {
    execFile('osascript', ['-e', script], { timeout }, (err, stdout, stderr) => {
      resolve(err ? { ok: false, error: String(stderr || err.message).trim() } : { ok: true, out: String(stdout).replace(/\n$/, '') });
    });
  });
}

async function browserUrl(bundle) {
  let script = '';
  if (CHROMIUM.has(bundle)) script = `tell application id "${bundle}" to get URL of active tab of front window`;
  else if (SAFARI.has(bundle)) script = `tell application id "${bundle}" to get URL of front document`;
  if (!script) return '';
  const r = await osa(script, 1200);
  return r.ok ? r.out.trim() : '';
}

async function sample() {
  const r = await osa(FRONT_SCRIPT);
  if (!r.ok) {
    lastError = /not allowed|assistive|1719|-25211/i.test(r.error)
      ? 'Accessibility permission is missing for Cofounder (System Settings › Privacy & Security › Accessibility).'
      : r.error;
    emitState();
    return null;
  }
  lastError = '';
  const [app, bundle, title] = r.out.split('\t');
  return { app: app || '', bundle: bundle || '', title: title || '', url: await browserUrl(bundle) };
}

function append(ev) {
  try {
    const p = logPath();
    try {
      if (fs.statSync(p).size > LOG_CAP_BYTES) {
        const keep = fs.readFileSync(p, 'utf8').split('\n').slice(-20000).join('\n');
        fs.writeFileSync(p, keep);
      }
    } catch (_) { /* first write */ }
    fs.appendFileSync(p, JSON.stringify(ev) + '\n');
    eventsToday++;
  } catch (err) {
    lastError = `Cannot write the activity log: ${err.message}`;
  }
}

async function tick() {
  if (paused) return;
  const s = await sample();
  if (!s || !s.app) return;
  const sig = `${s.bundle}|${s.title}|${s.url}`;
  if (last && last.sig === sig) return;
  last = { sig, at: Date.now() };
  append({ t: Date.now() / 1000, app: s.app, bundle: s.bundle, title: s.title.slice(0, 300), url: s.url.slice(0, 500) });
  emitState();
}

function loadPrefs() {
  try { return JSON.parse(fs.readFileSync(prefsPath(), 'utf8')); } catch (_) { return { paused: false }; }
}

function start({ dir, onState } = {}) {
  dataDir = dir;
  stateHandler = onState || null;
  fs.mkdirSync(dataDir, { recursive: true });
  paused = !!loadPrefs().paused;
  if (process.platform !== 'darwin') { lastError = 'Observation is only available on macOS.'; return false; }
  if (!timer) timer = setInterval(() => { tick().catch(() => {}); }, POLL_MS);
  tick().catch(() => {});
  return true;
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function setPaused(value) {
  paused = !!value;
  try { fs.writeFileSync(prefsPath(), JSON.stringify({ paused })); } catch (_) { /* ignore */ }
  emitState();
  return state();
}

function erase() {
  try { fs.unlinkSync(logPath()); } catch (_) { /* nothing to erase */ }
  last = null;
  eventsToday = 0;
  emitState();
  return state();
}

function countEvents() {
  try { return fs.readFileSync(logPath(), 'utf8').split('\n').filter(Boolean).length; } catch (_) { return 0; }
}

function state() {
  return {
    running: !!timer && !paused,
    paused,
    error: lastError,
    events: countEvents(),
    lastApp: last ? last.sig.split('|')[0] : '',
    logPath: dataDir ? logPath() : '',
  };
}

function emitState() { try { if (stateHandler) stateHandler(state()); } catch (_) { /* ignore */ } }

// Recent events for the workflow agent, oldest first.
function recentEvents(hours = 168, max = 4000) {
  let raw = '';
  try { raw = fs.readFileSync(logPath(), 'utf8'); } catch (_) { return []; }
  const horizon = Date.now() / 1000 - hours * 3600;
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line) continue;
    try { const e = JSON.parse(line); if (Number(e.t) >= horizon) out.push(e); } catch (_) { /* torn line */ }
  }
  return out.slice(-max);
}

module.exports = { start, stop, setPaused, erase, state, recentEvents };
