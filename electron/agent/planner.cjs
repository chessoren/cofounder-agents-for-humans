// Macro layer — a COMPILER. One deep model call turns the goal into an ordered
// program of concrete UI steps. After this, execution is deterministic (the
// matcher resolves targets live) — the brain is not woken per click.
const { complete, parseJSON } = require('./model.cjs');

const ACTIONS = new Set(['launch', 'open_url', 'click', 'double_click', 'type', 'key', 'hotkey', 'wait']);

const SYSTEM = `You are Cofounder's planner. Cofounder operates the user's Mac (macOS) with mouse and keyboard.
Compile the user's goal into an ordered list of concrete UI steps a person would do on macOS.
Allowed steps:
{"action":"launch","app":"<exact macOS app name, e.g. Safari, Notes, Mail, TextEdit>","narration":"Opening …"}   // runs: open -a "<app>"
{"action":"open_url","url":"https://…","narration":"…"}   // opens the page in the default browser
{"action":"click","target":"<visible label of the thing to click>","narration":"…"}
{"action":"double_click","target":"<label>","narration":"…"}
{"action":"type","text":"<text>","narration":"…"}
{"action":"key","keys":["Cmd","N"],"narration":"…"}   // macOS names: Cmd, Option, Control, Shift, Return, Tab, Escape, Space, Backspace, Up/Down/Left/Right, letters, digits
{"action":"wait","ms":800,"narration":"…"}
Rules:
- This is macOS: use Cmd shortcuts (Cmd+N new, Cmd+S save, Cmd+L address bar, Cmd+T new tab, Cmd+W close, Cmd+V paste), never Ctrl or the Windows key.
- To open an app use "launch"; to visit a website use "open_url" (http or https only) instead of typing into a browser.
- Add a short "wait" after launch/open_url when the next step needs the window to be ready.
- target must be a short label that is visible on screen (buttons, fields, links, menu names). Labels may be in the user's language.
- 2 to 12 steps. narration = one short first-person sentence, natural, in the user's language, no internals.
- Never enter passwords, payment details or other secrets; never confirm purchases or send messages unless the goal explicitly asks.
Reply ONLY JSON: {"steps":[ ... ]}`;

// Keep only well-formed steps. Exported for tests.
function sanitize(steps) {
  return (Array.isArray(steps) ? steps : [])
    .filter((s) => s && typeof s === 'object' && ACTIONS.has(s.action))
    .filter((s) => {
      if (s.action === 'launch') return typeof s.app === 'string' && s.app.trim();
      if (s.action === 'open_url') return /^https?:\/\//i.test(String(s.url || ''));
      if (s.action === 'click' || s.action === 'double_click') return typeof s.target === 'string' && s.target.trim();
      if (s.action === 'type') return typeof s.text === 'string';
      if (s.action === 'key' || s.action === 'hotkey') return s.keys && (Array.isArray(s.keys) ? s.keys.length : String(s.keys).trim());
      return true;
    })
    .slice(0, 14);
}

// Returns { ok:true, steps } | { ok:false, error, unreachable }.
async function plan(model, goal, state) {
  const els = (state?.elements || []).slice(0, 40)
    .map((e) => `${String(e.role || '').replace(/^AX/, '')}: ${e.name}`)
    .filter((l) => !/:\s*$/.test(l))
    .join('; ');
  const fg = state?.foreground || {};
  const ctx = `Goal: ${goal}\nFront app: ${fg.app || 'unknown'}\nFront window: ${fg.title || 'none'}\nVisible elements: ${els || 'unknown'}`;
  const res = await complete(model, SYSTEM, ctx, { json: true, maxTokens: 1500 });
  if (!res.ok) return { ok: false, error: res.error, unreachable: !!res.unreachable };
  const parsed = parseJSON(res.text);
  const steps = sanitize(parsed && (Array.isArray(parsed) ? parsed : parsed.steps));
  if (!steps.length) return { ok: false, error: 'the plan came back empty or unreadable', unreachable: false };
  return { ok: true, steps };
}

module.exports = { plan, sanitize, SYSTEM };
