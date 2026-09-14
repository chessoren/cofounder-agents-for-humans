// API handlers shared by the packaged app (electron/server.cjs) and the Vite dev
// middleware (vite.config.ts), so dev and prod run one implementation.
//
//   /api/chat          onboarding chat, served by Amazon Bedrock
//   /api/auth          local account store (no cloud, no secrets)
//   /api/save-session  local onboarding session store
//
// Nothing here embeds credentials: Bedrock uses the default AWS credential chain,
// and accounts/sessions live in a JSON file in the user's data directory.
const os = require('os');
const path = require('path');
const { scryptSync, randomBytes, timingSafeEqual } = require('crypto');
const { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } = require('fs');
const bedrock = require('./bedrock.cjs');

const SIGNUP_CREDITS = 1000;

// Electron main sets COFOUNDER_DATA_DIR to app.getPath('userData'); otherwise ~/.cofounder.
function dataDir() {
  const dir = process.env.COFOUNDER_DATA_DIR || path.join(os.homedir(), '.cofounder');
  try { mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
  return dir;
}
const accountsFile = () => path.join(dataDir(), 'accounts.json');
const sessionsFile = () => path.join(dataDir(), 'sessions.json');

function readJSON(file) {
  try { return existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : {}; } catch { return {}; }
}
function writeJSON(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(tmp, file);
}

// ---------------------------------------------------------------------------
// Onboarding chat (Amazon Bedrock)
// ---------------------------------------------------------------------------
function systemFor(stage, { jobRole, origin, mode, tools }) {
  if (stage === 'origin')
    return `You are Cofounder, an AI with hands that controls the Mac's mouse and keyboard. The user just told you their job: "${jobRole || ''}".
React in ONE or TWO short, warm, natural sentences in English, riffing on their job, then ask where they heard about us. Do NOT list options yourself.
Respond in JSON: { "text": "...", "tools": [], "tasks": [] }`;
  if (stage === 'mode')
    return `You are Cofounder, an AI with hands. The user (${jobRole || 'user'}) heard about us via: "${origin || ''}".
React briefly and warmly in English (1 sentence), then explain in 1 sentence that before starting you need to know what permissions they grant you to control their Mac, and invite them to choose their mode. Do NOT list the modes yourself.
Respond in JSON: { "text": "...", "tools": [], "tasks": [] }`;
  if (stage === 'suggestions')
    return `You are Cofounder, driving the Mac's mouse and keyboard. User — job: "${jobRole || ''}", via: "${origin || ''}", mode: "${mode || 'Standard'}".
Generate exactly 4 concrete, short, impressive action suggestions (max 8 words each) tailored to their job. No intro.
Respond in JSON: { "text": "", "tools": [], "tasks": [], "suggestions": ["...","...","...","..."] }`;
  // 'final' or anything else: a brief helpful reply.
  return `You are Cofounder, an AI that controls the user's Mac (tools: ${(tools || []).join(', ')}). Reply helpfully in English, conversational, short.
Respond in JSON: { "text": "...", "tools": [], "tasks": [] }`;
}

const asStrings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

async function handleChat(body) {
  const { history = [], stage, tools, jobRole, origin, mode } = body || {};
  const messages = (Array.isArray(history) ? history : [])
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }));

  const r = await bedrock.converse({
    system: systemFor(stage, { jobRole, origin, mode, tools }),
    messages: messages.length ? messages : undefined,
    prompt: messages.length ? undefined : 'Hello',
    json: true,
    maxTokens: 600,
  });

  if (!r.ok) {
    return {
      text: "I can't reach Amazon Bedrock right now. Configure AWS credentials (~/.aws/credentials) with Bedrock model access, then try again.",
      tools: [],
      tasks: [],
      ...(stage === 'suggestions' ? { suggestions: [] } : {}),
      error: r.error,
    };
  }

  const parsed = bedrock.parseJSON(r.text);
  const obj = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  const out = {
    text: obj && typeof obj.text === 'string' ? obj.text : (obj ? '' : r.text),
    tools: asStrings(obj && obj.tools),
    tasks: asStrings(obj && obj.tasks),
  };
  if (obj && Array.isArray(obj.suggestions)) out.suggestions = asStrings(obj.suggestions).slice(0, 4);
  else if (stage === 'suggestions') out.suggestions = [];
  return out;
}

// ---------------------------------------------------------------------------
// Session save (local JSON)
// ---------------------------------------------------------------------------
async function handleSaveSession(body) {
  const { sessionId, jobRole, selectedTools, selectedTasks, email, messages } = body || {};
  if (!sessionId) throw new Error('sessionId required');
  const file = sessionsFile();
  const db = readJSON(file);
  db[String(sessionId)] = {
    id: String(sessionId),
    job_role: jobRole || null,
    selected_tools: selectedTools || null,
    selected_tasks: selectedTasks || null,
    email: email || null,
    messages: messages || null,
    updated_at: new Date().toISOString(),
  };
  writeJSON(file, db);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Auth + credits (local JSON store, scrypt password hashing)
// ---------------------------------------------------------------------------
function hashPw(password, salt) {
  return scryptSync(String(password), salt, 64).toString('hex');
}
function verifyPw(password, stored) {
  const [scheme, salt, digest] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !salt || !digest) return false;
  const a = Buffer.from(hashPw(password, salt), 'hex');
  const b = Buffer.from(digest, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
const publicAccount = (a) => ({ email: a.email, credits: a.credits, plan: a.plan, waitlistBonus: false });

async function handleAuth(body) {
  const { action, email: rawEmail, password } = body || {};
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email || !password) return { code: 400, json: { error: 'Email and password required.' } };

  const file = accountsFile();
  const db = readJSON(file);
  const existing = db[email] || null;

  if (action === 'signup') {
    if (existing) return { code: 409, json: { error: 'An account already exists with this email. Please log in.' } };
    const salt = randomBytes(16).toString('hex');
    const account = {
      email,
      pass_hash: `scrypt$${salt}$${hashPw(password, salt)}`,
      credits: SIGNUP_CREDITS,
      plan: 'free_150',
      created_at: new Date().toISOString(),
    };
    db[email] = account;
    try { writeJSON(file, db); } catch (e) { return { code: 500, json: { error: `Could not save account: ${e.message}` } }; }
    return { code: 200, json: { ok: true, created: true, onWaitlist: false, ...publicAccount(account) } };
  }
  if (action === 'login') {
    if (!existing) return { code: 404, json: { error: 'No account found. Create one first.' } };
    if (!verifyPw(password, existing.pass_hash)) return { code: 401, json: { error: 'Incorrect password.' } };
    return { code: 200, json: { ok: true, created: false, onWaitlist: false, ...publicAccount(existing) } };
  }
  return { code: 400, json: { error: 'Unknown action.' } };
}

module.exports = { handleChat, handleSaveSession, handleAuth, dataDir };
