// OS Interface (macOS) — the only place that touches the real machine. Reads come
// from the accessibility engine first (text, fast); screenshots are a strong-tier
// fallback only. Writes go through nut.js (mouse + keyboard), which works in
// logical points on Retina displays — the same space System Events reports.
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const nodeOs = require('os');
const acc = require('./acc.cjs');

let nut = null;
function getNut() {
  if (nut) return nut;
  const lib = require('@nut-tree-fork/nut-js');
  lib.mouse.config.mouseSpeed = 2200;
  lib.keyboard.config.autoDelayMs = 3;
  nut = lib;
  return nut;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function run(cmd, args, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      execFile(cmd, args, { timeout, encoding: 'utf8' }, (err, stdout, stderr) =>
        resolve({ ok: !err, stdout: stdout || '', error: err ? String(stderr || err.message || err).trim() : null }));
    } catch (err) {
      resolve({ ok: false, stdout: '', error: String(err.message || err) });
    }
  });
}

// ---------------------------------------------------------------------------
// Key names. The planner speaks macOS ("Cmd", "Option", "Return"); nut.js enum
// names ("LeftCmd", "Enter", "Num1") keep working too.
// ---------------------------------------------------------------------------
const KEY_ALIASES = {
  cmd: 'LeftCmd', command: 'LeftCmd', meta: 'LeftCmd', super: 'LeftCmd', win: 'LeftCmd', '⌘': 'LeftCmd',
  ctrl: 'LeftControl', control: 'LeftControl', '⌃': 'LeftControl',
  option: 'LeftAlt', opt: 'LeftAlt', alt: 'LeftAlt', '⌥': 'LeftAlt',
  shift: 'LeftShift', '⇧': 'LeftShift',
  enter: 'Enter', return: 'Return', '↩': 'Return',
  tab: 'Tab', escape: 'Escape', esc: 'Escape',
  space: 'Space', spacebar: 'Space', ' ': 'Space',
  backspace: 'Backspace', delete: 'Backspace', del: 'Backspace', forwarddelete: 'Delete',
  up: 'Up', down: 'Down', left: 'Left', right: 'Right',
  arrowup: 'Up', arrowdown: 'Down', arrowleft: 'Left', arrowright: 'Right',
  uparrow: 'Up', downarrow: 'Down', leftarrow: 'Left', rightarrow: 'Right',
  home: 'Home', end: 'End', pageup: 'PageUp', pagedown: 'PageDown', fn: 'Fn', capslock: 'CapsLock',
  ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', "'": 'Quote', '[': 'LeftBracket', ']': 'RightBracket',
  '\\': 'Backslash', '-': 'Minus', '=': 'Equal', '`': 'Grave', '+': 'Equal',
  comma: 'Comma', period: 'Period', slash: 'Slash', minus: 'Minus', equal: 'Equal', plus: 'Equal',
};

// Every nut.js Key enum name, so exact enum names pass through without loading nut.
const NUT_KEY_NAMES = new Set(('Escape F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 F13 F14 F15 F16 F17 F18 F19 F20 F21 F22 F23 F24 ' +
  'Print ScrollLock Pause Grave Num1 Num2 Num3 Num4 Num5 Num6 Num7 Num8 Num9 Num0 Minus Equal Backspace Insert Home PageUp ' +
  'NumLock NumPadEqual Divide Multiply Subtract Tab Q W E R T Y U I O P LeftBracket RightBracket Backslash Delete End PageDown ' +
  'NumPad7 NumPad8 NumPad9 Add CapsLock A S D F G H J K L Semicolon Quote Return NumPad4 NumPad5 NumPad6 LeftShift Z X C V B N M ' +
  'Comma Period Slash RightShift Up NumPad1 NumPad2 NumPad3 Enter LeftControl LeftSuper LeftWin LeftCmd LeftAlt LeftMeta ' +
  'RightControl RightSuper RightWin RightAlt RightCmd RightMeta Space Menu Fn Left Down Right NumPad0 Decimal Clear').split(' '));

// Map one key token to a nut.js Key enum name, or null if unknown.
function keyName(k) {
  if (k === null || k === undefined) return null;
  const raw = String(k);
  if (raw === ' ') return 'Space';
  const s = raw.trim();
  if (!s) return null;
  if (NUT_KEY_NAMES.has(s)) return s;                       // exact nut.js name
  const lower = s.toLowerCase();
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower];
  if (/^[a-z]$/i.test(s)) return s.toUpperCase();          // letters
  if (/^[0-9]$/.test(s)) return `Num${s}`;                  // digits
  if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(s)) return s.toUpperCase();
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (NUT_KEY_NAMES.has(cap)) return cap;
  return null;
}

// Accepts ["Cmd","L"], "Cmd+L", ["Cmd+Shift","T"]. Returns { names, unknown }.
function parseKeys(keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const tokens = [];
  for (const item of list) {
    const s = String(item === undefined || item === null ? '' : item);
    if (s.length > 1 && s.includes('+')) {
      // "Cmd++" -> Cmd, +
      const parts = s.split('+');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '' && i === parts.length - 1 && parts.length > 1 && parts[i - 1] === '') tokens.push('+');
        else if (parts[i] !== '') tokens.push(parts[i]);
      }
    } else if (s) {
      tokens.push(s);
    }
  }
  const names = [];
  const unknown = [];
  for (const t of tokens) {
    const n = keyName(t);
    if (n) { if (!names.includes(n)) names.push(n); } else unknown.push(t);
  }
  return { names, unknown };
}

// ---------------------------------------------------------------------------

async function screenSize() {
  // Logical points. Electron's screen is authoritative inside the app; nut.js
  // (CGDisplayPixelsWide) also reports points on Retina.
  try {
    if (process.versions.electron) {
      const { screen, app } = require('electron');
      if (screen && (!app || app.isReady())) {
        const { width, height } = screen.getPrimaryDisplay().size;
        if (width && height) return { width, height };
      }
    }
  } catch (_) { /* fall through */ }
  try {
    const { screen } = getNut();
    return { width: await screen.width(), height: await screen.height() };
  } catch (_) {
    return { width: 1440, height: 900 };
  }
}

// The fast path: a live, text-only snapshot of the front window and its
// interactable elements (names + center coordinates).
async function getState() {
  const snap = await acc.enumerate();
  return { foreground: { title: snap.title || '', app: snap.app || '' }, elements: snap.elements || [] };
}
// Back-compat alias.
const getAccessibilityTree = getState;

// Launch an app: `open -a "<name>"`, falling back to Spotlight (Cmd+Space, type, Return).
async function launchApp(name) {
  const app = String(name || '').trim();
  if (!app) return { ok: false, error: 'no app name' };
  const res = await run('open', ['-a', app], 10000);
  if (res.ok) {
    await sleep(1200);
    return { ok: true, via: 'open' };
  }
  try {
    const { keyboard, Key } = getNut();
    await keyboard.pressKey(Key.LeftCmd, Key.Space);
    await keyboard.releaseKey(Key.LeftCmd, Key.Space);
    await sleep(500);
    await keyboard.type(app);
    await sleep(700);
    await keyboard.pressKey(Key.Return);
    await keyboard.releaseKey(Key.Return);
    await sleep(1200);
    return { ok: true, via: 'spotlight' };
  } catch (err) {
    return { ok: false, error: `${res.error || 'open failed'}; spotlight: ${String(err.message || err)}` };
  }
}

function isSafeUrl(url) {
  return /^https?:\/\/[^\s"'<>]+$/i.test(String(url || '').trim());
}

// Open a web page in the default browser.
async function openUrl(url) {
  const u = String(url || '').trim();
  if (!isSafeUrl(u)) return { ok: false, error: `refusing to open non-http(s) url: ${u}` };
  const res = await run('open', [u], 10000);
  if (res.ok) await sleep(1500);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

// Screenshot as base64 PNG, downscaled (long edge <= 1568 px) for the model.
async function screenshotBase64() {
  try {
    const { desktopCapturer } = require('electron');
    if (desktopCapturer) {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1568, height: 1568 } });
      const img = sources && sources[0] && sources[0].thumbnail;
      if (img && !img.isEmpty()) return img.toPNG().toString('base64');
    }
  } catch (_) { /* fall through */ }
  if (process.platform !== 'darwin') return null;
  const file = path.join(nodeOs.tmpdir(), `cofounder-shot-${process.pid}-${Date.now()}.png`);
  try {
    const cap = await run('screencapture', ['-x', '-t', 'png', file], 8000);
    if (!cap.ok || !fs.existsSync(file)) return null;
    await run('sips', ['-Z', '1568', file], 8000); // best effort downscale
    const b64 = fs.readFileSync(file).toString('base64');
    return b64 || null;
  } catch (_) {
    return null;
  } finally {
    try { fs.unlinkSync(file); } catch (_) { /* ignore */ }
  }
}

// Resolve a named element to coordinates when the tree provides it, else trust
// the explicit coordinates the Actor produced.
function resolve(action, tree) {
  if (action.elementId !== undefined && action.elementId !== null && tree && tree.elements) {
    const el = tree.elements.find((e) => e.id === action.elementId);
    if (el) return { x: el.cx, y: el.cy };
  }
  if (typeof action.x === 'number' && typeof action.y === 'number') return { x: action.x, y: action.y };
  return null;
}

// The single write primitive. Returns the coordinates actually used so the UI
// can move the visible cursor to match exactly.
async function execute(action, tree) {
  if (action.type === 'wait') {
    await sleep(action.ms || 400);
    return { ok: true, point: null };
  }
  const { mouse, keyboard, Button, Point, Key } = getNut();
  const pt = resolve(action, tree);
  switch (action.type) {
    case 'move':
      if (pt) await mouse.setPosition(new Point(Math.round(pt.x), Math.round(pt.y)));
      return { ok: true, point: pt };
    case 'click':
      if (pt) await mouse.setPosition(new Point(Math.round(pt.x), Math.round(pt.y)));
      await mouse.click(Button.LEFT);
      return { ok: true, point: pt };
    case 'double_click':
      if (pt) await mouse.setPosition(new Point(Math.round(pt.x), Math.round(pt.y)));
      await mouse.doubleClick(Button.LEFT);
      return { ok: true, point: pt };
    case 'type':
      await keyboard.type(String(action.text || ''));
      return { ok: true, point: pt };
    case 'key': {
      const { names, unknown } = parseKeys(action.keys);
      const keys = names.map((n) => Key[n]).filter((k) => k !== undefined);
      if (keys.length) { await keyboard.pressKey(...keys); await keyboard.releaseKey(...keys); }
      return { ok: keys.length > 0, point: pt, unknown };
    }
    default:
      return { ok: false, error: `unknown action ${action.type}` };
  }
}

module.exports = {
  screenSize, getState, getAccessibilityTree, launchApp, openUrl, isSafeUrl,
  screenshotBase64, execute, keyName, parseKeys,
};
