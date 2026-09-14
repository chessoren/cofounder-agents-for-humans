// WORKFLOWS — the bridge to the Strands workflow agent.
//
// Sends the last week of observed activity (plus what memory already knows) to
// the agent and merges the answer into memory. Two transports, same payload:
//   • Amazon Bedrock AgentCore Runtime — when a runtime ARN is configured
//     (COFOUNDER_AGENT_RUNTIME_ARN or agentcore-runtime.json at the app root);
//   • a local Strands server on :8080 (strands-agent/main.py), started here with
//     uv when no runtime is configured.
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const observer = require('./observer.cjs');
const memory = require('./memory.cjs');

const APP_ROOT = path.join(__dirname, '..');
const AGENT_DIR = path.join(APP_ROOT, 'strands-agent');
const LOCAL_URL = process.env.COFOUNDER_STRANDS_URL || 'http://127.0.0.1:8080/invocations';
const INTERVAL_MS = Number(process.env.COFOUNDER_ANALYZE_INTERVAL_MS || 30 * 60 * 1000);
const MIN_EVENTS = 20;

function runtimeArn() {
  if (process.env.COFOUNDER_AGENT_RUNTIME_ARN) return process.env.COFOUNDER_AGENT_RUNTIME_ARN;
  try { return JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'agentcore-runtime.json'), 'utf8')).agentRuntimeArn || ''; } catch (_) { return ''; }
}

function transport() { return runtimeArn() ? 'agentcore' : 'local'; }

async function invokeAgentCore(payload) {
  const { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } = require('@aws-sdk/client-bedrock-agentcore');
  const arn = runtimeArn();
  const region = arn.split(':')[3] || process.env.AWS_REGION || 'us-west-2';
  const client = new BedrockAgentCoreClient({ region });
  const out = await client.send(new InvokeAgentRuntimeCommand({
    agentRuntimeArn: arn,
    runtimeSessionId: `cofounder-${crypto.randomUUID()}`, // must be ≥ 33 characters
    contentType: 'application/json',
    accept: 'application/json',
    payload: Buffer.from(JSON.stringify(payload)),
  }));
  const text = await out.response.transformToString();
  return JSON.parse(text);
}

let sidecar = null;
function ensureSidecar() {
  if (sidecar || !fs.existsSync(AGENT_DIR)) return;
  // A GUI-launched app does not inherit the shell PATH: uv usually lives in ~/.local/bin.
  const PATH = [path.join(os.homedir(), '.local', 'bin'), '/opt/homebrew/bin', '/usr/local/bin', process.env.PATH].join(':');
  try {
    sidecar = spawn('uv', ['run', 'python', 'main.py'], { cwd: AGENT_DIR, env: { ...process.env, PATH }, stdio: 'ignore' });
    sidecar.on('exit', () => { sidecar = null; });
    sidecar.on('error', () => { sidecar = null; });
  } catch (_) { sidecar = null; }
}

async function invokeLocal(payload) {
  ensureSidecar();
  let lastErr = null;
  // The sidecar needs a few seconds to boot on first use.
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const r = await fetch(LOCAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5 * 60 * 1000),
      });
      if (!r.ok) throw new Error(`agent answered ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return await r.json();
    } catch (err) {
      lastErr = err;
      if (!/ECONNREFUSED|fetch failed/i.test(String(err && (err.cause?.code || err.message)))) break;
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  throw lastErr || new Error('local workflow agent unreachable');
}

let running = null;
let agentCoreDownUntil = 0;
let lastRun = { at: null, summary: '', error: '', transport: '' };

async function analyze({ request } = {}) {
  if (running) return running;
  running = (async () => {
    const events = observer.recentEvents(168).map(({ t, app, bundle, title, url }) => ({ t, app, bundle, title, url }));
    const known = memory.known();
    if (events.length < MIN_EVENTS) {
      lastRun = { at: new Date().toISOString(), summary: `Only ${events.length} activity events so far — keep working, Cofounder needs a little more to spot patterns.`, error: '', transport: transport() };
      return { ok: true, ...lastRun, detected: [], memory: memory.list() };
    }
    const payload = { events, known_workflows: known.workflows, known_facts: known.facts, request };
    const via = transport();
    try {
      let out;
      let usedVia = via;
      if (via === 'agentcore' && Date.now() >= agentCoreDownUntil) {
        try {
          out = await Promise.race([
            invokeAgentCore(payload),
            new Promise((_, reject) => setTimeout(() => reject(new Error('AgentCore did not answer within 120 s')), 120000)),
          ]);
          if (out && out.error) throw new Error(String(out.error));
        } catch (err) {
          // The cloud agent cannot reach a model (e.g. Bedrock quota not granted yet):
          // run the same Strands agent locally, which can fall back to a local model.
          agentCoreDownUntil = Date.now() + 15 * 60 * 1000; // do not wait on it again for every run
          usedVia = `local (AgentCore failed: ${String((err && err.message) || err).slice(0, 160)})`;
          out = await invokeLocal(payload);
        }
      } else {
        if (via === 'agentcore') usedVia = 'local (AgentCore paused after a recent failure)';
        out = await invokeLocal(payload);
      }
      if (out && out.error) throw new Error(String(out.error));
      const before = new Set(memory.list().workflows.map((w) => w.id));
      const mem = memory.merge({ workflows: out.workflows || [], facts: out.facts || [] });
      const detected = (out.workflows || []).filter((w) => !before.has(w.id));
      lastRun = { at: new Date().toISOString(), summary: out.summary || '', error: '', transport: usedVia, modelProvider: out.model_provider || '' };
      return { ok: true, ...lastRun, detected, memory: mem };
    } catch (err) {
      lastRun = { at: new Date().toISOString(), summary: '', error: String((err && err.message) || err), transport: via };
      return { ok: false, ...lastRun, detected: [], memory: memory.list() };
    }
  })().finally(() => { running = null; });
  return running;
}

let timer = null;
function start({ onResult } = {}) {
  if (timer) return;
  const tick = () => analyze().then((res) => { if (onResult) onResult(res); }).catch(() => {});
  setTimeout(tick, 2 * 60 * 1000);
  timer = setInterval(tick, INTERVAL_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  try { if (sidecar) sidecar.kill(); } catch (_) { /* gone */ }
  sidecar = null;
}

function status() { return { ...lastRun, running: !!running, transport: transport(), runtimeArn: runtimeArn() }; }

module.exports = { analyze, start, stop, status };
