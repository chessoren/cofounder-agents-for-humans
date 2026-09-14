// Amazon Bedrock — the one model client for the whole desktop app.
//
// Onboarding chat, the computer-use planner, element picking and summaries all
// go through `converse`. Credentials come from the standard AWS chain
// (~/.aws/credentials, env vars, SSO); nothing is embedded in the app.
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
const MODEL_ID = process.env.COFOUNDER_BEDROCK_MODEL || 'global.anthropic.claude-sonnet-4-6';
// Amazon Nova needs no Marketplace agreement: when the Anthropic model is not yet
// enabled on the account, every call falls back to it instead of failing.
const FALLBACK_MODEL_ID = process.env.COFOUNDER_BEDROCK_FALLBACK_MODEL || 'us.amazon.nova-pro-v1:0';
let activeModel = MODEL_ID;
const ACCESS_ERRORS = /AccessDenied|ResourceNotFound|ValidationException|not authorized|don't have access|model access|INVALID_PAYMENT|agreement/i;

let client = null;
function getClient() {
  if (!client) client = new BedrockRuntimeClient({ region: REGION });
  return client;
}

// Tolerant JSON extraction: models sometimes wrap JSON in prose or fences.
function parseJSON(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const startArr = candidate.indexOf('[');
  const s = start === -1 ? startArr : startArr === -1 ? start : Math.min(start, startArr);
  if (s === -1) return null;
  const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
  try { return JSON.parse(candidate.slice(s, end + 1)); } catch (_) { return null; }
}

/**
 * One-shot completion.
 * @param {object} o
 * @param {string} o.system
 * @param {string} [o.prompt]            single user turn
 * @param {{role:'user'|'assistant', text:string}[]} [o.messages]  multi-turn history (overrides prompt)
 * @param {string[]} [o.images]          base64 PNGs attached to the last user turn
 * @param {boolean} [o.json]             ask for JSON only
 * @returns {Promise<{ok:true,text:string}|{ok:false,error:string}>}
 */
async function converse({ system, prompt, messages, images, json = false, maxTokens = 1024, temperature } = {}) {
  let turns = Array.isArray(messages) && messages.length
    ? messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: [{ text: String(m.text || ' ') }] }))
    : [{ role: 'user', content: [{ text: String(prompt || ' ') }] }];
  // Bedrock requires the conversation to start with a user turn and alternate roles.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  turns = turns.reduce((acc, t) => {
    const last = acc[acc.length - 1];
    if (last && last.role === t.role) last.content.push(...t.content);
    else acc.push(t);
    return acc;
  }, []);
  if (!turns.length) turns = [{ role: 'user', content: [{ text: ' ' }] }];
  const lastUser = [...turns].reverse().find((t) => t.role === 'user');
  for (const b64 of images || []) {
    if (b64) lastUser.content.unshift({ image: { format: 'png', source: { bytes: Buffer.from(b64, 'base64') } } });
  }
  if (turns[turns.length - 1].role !== 'user') turns.push({ role: 'user', content: [{ text: 'Continue.' }] });

  const sys = String(system || '') + (json ? '\nReply with ONLY valid JSON, no prose, no code fences.' : '');
  const call = (modelId) => getClient().send(new ConverseCommand({
    modelId,
    system: sys.trim() ? [{ text: sys }] : undefined,
    messages: turns,
    inferenceConfig: { maxTokens, temperature: temperature ?? (json ? 0.1 : 0.5) },
  }));
  try {
    let out;
    try {
      out = await call(activeModel);
    } catch (err) {
      if (activeModel === FALLBACK_MODEL_ID || !ACCESS_ERRORS.test(`${err.name} ${err.message}`)) throw err;
      activeModel = FALLBACK_MODEL_ID;
      out = await call(activeModel);
    }
    const text = (out.output?.message?.content || []).map((c) => c.text || '').join('').trim();
    return { ok: true, text, model: activeModel };
  } catch (err) {
    return { ok: false, error: `${err.name || 'BedrockError'}: ${err.message || err}` };
  }
}

// Cheap reachability probe for the onboarding "connecting" step.
async function check() {
  const r = await converse({ system: 'Reply with the single word: ready', prompt: 'ping', maxTokens: 5 });
  return r.ok ? { ok: true, model: r.model, region: REGION } : { ok: false, error: r.error, model: activeModel, region: REGION };
}

module.exports = { converse, check, parseJSON, MODEL_ID, FALLBACK_MODEL_ID, REGION };
