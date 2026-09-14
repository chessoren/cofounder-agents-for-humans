// Verification layer — runs asynchronously, off the critical path. Looks at the
// result of the last action and decides if it landed. When it didn't, it returns
// a correction hint so the tactical layer can retry WITHOUT waking the planner.
const { complete, parseJSON } = require('./model.cjs');

const SYSTEM = `You are Cofounder's verifier. Cofounder operates the user's Mac (macOS).
You verify whether the last computer action achieved its intent.
Given the action and the resulting screen (front window title + optional screenshot), answer if it succeeded.
Reply ONLY as JSON: {"ok":true|false,"reason":"...","hint":"what to try instead on macOS if it failed"}`;

async function critique(model, action, beforeState, afterState, screenshot) {
  const ctx = [
    `Action: ${JSON.stringify({ type: action.type, text: action.text, keys: action.keys, x: action.x, y: action.y })}`,
    `Before window: ${beforeState?.foreground?.title || 'desktop'}`,
    `After window: ${afterState?.foreground?.title || 'desktop'}`,
  ].join('\n');
  const opts = { json: true, maxTokens: 200 };
  if (screenshot) opts.images = [screenshot];
  const res = await complete(model, SYSTEM, ctx, opts);
  if (res.ok) {
    const v = parseJSON(res.text);
    if (v && typeof v.ok === 'boolean') return v;
    return { ok: true, reason: 'unverified' };
  }
  // The critic never blocks the flow; the caller can inspect `unverified`/`error`.
  return { ok: true, reason: 'unverified', error: res.error, unreachable: !!res.unreachable };
}

module.exports = { critique };
