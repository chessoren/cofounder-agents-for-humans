// The conductor — Cofounder's "take it over" loop on macOS, Amazon Bedrock brain.
//   1) Known task?  -> replay the learned macro deterministically (ZERO model calls
//      unless a target won't resolve).
//   2) New task?    -> ONE planning call compiles a step program.
//   3) Execute steps deterministically: the matcher resolves each target from the
//      live accessibility tree. The model is woken ONLY when a target won't resolve.
//   4) On success, the task is distilled into a macro (it gets faster next time).
// If Bedrock can't be reached we say so plainly — no pretend choreography.
const { Bus } = require('./bus.cjs');
const os = require('./os.cjs');
const planner = require('./planner.cjs');
const matcher = require('./matcher.cjs');
const macros = require('./macros.cjs');
const actor = require('./actor.cjs');
const { complete, describeBedrockError } = require('./model.cjs');

// Tiers allowed to use the screenshot/vision fallback.
const STRONG_TIERS = new Set(['bedrock', '26b', '31b']);
const STEP_PAUSE_MS = 110;

async function summarize(model, goal, reflections) {
  const fallback = `Done — I took care of: ${goal}.`;
  const res = await complete(
    model,
    'You are Cofounder, working on the user\'s Mac. In 1-2 warm first-person sentences, in the language of the goal, tell the user what you just did on their computer. No internals, no model talk.',
    `Goal: ${goal}\nSteps you took: ${reflections.join(' | ')}`,
    { maxTokens: 200 }
  );
  return res.ok && res.text.trim() ? res.text.trim() : fallback;
}

async function emitCursor(bus, kind, point, text) {
  if (!point && kind !== 'type') return;
  bus.cursor({ kind, x: point ? Math.round(point.x) : null, y: point ? Math.round(point.y) : null, text: text || '' });
  await new Promise((r) => setTimeout(r, STEP_PAUSE_MS));
}

// Resolve a click target -> screen coordinates (logical points). Deterministic
// first; the model is a rare escalation, and only strong tiers may use vision.
// Returns { x, y, lastResort } | { error, unreachable } | null.
async function locate(model, target, tier, allowEscalate) {
  const state = await os.getState();
  const hit = matcher.match(target, state.elements);
  if (hit) return { x: hit.element.cx, y: hit.element.cy, lastResort: false };

  if (!allowEscalate) return null;

  if (state.elements.length) {
    const pick = await actor.pickElement(model, target, state.elements);
    if (pick.unreachable) return { error: pick.error, unreachable: true };
    const el = pick.index >= 0 ? state.elements[pick.index] : null;
    if (el) return { x: el.cx, y: el.cy, lastResort: true };
  }
  if (STRONG_TIERS.has(tier)) {
    const shot = await os.screenshotBase64();
    if (shot) {
      const screen = await os.screenSize();
      const vis = await actor.locateByVision(model, target, shot, screen);
      if (vis.unreachable) return { error: vis.error, unreachable: true };
      if (vis.point) return { ...vis.point, lastResort: true };
    }
  }
  return null;
}

// Execute a compiled program of steps.
// Returns { ok:true } | { ok:false, reason, unreachable?, error? }.
async function runSteps(bus, steps, { model, tier, allowEscalate }) {
  let fails = 0;
  let lastMissing = '';
  for (const step of steps) {
    if (bus.aborted) return { ok: false, reason: 'stopped' };
    if (step.narration) { bus.reflection(step.narration); bus.remember({ text: step.narration }); }

    if (step.action === 'launch') {
      const r = await os.launchApp(step.app || '');
      if (!r.ok) return { ok: false, reason: `I couldn't open ${step.app}.` };
      const { width, height } = await os.screenSize();
      await emitCursor(bus, 'move', { x: Math.round(width / 2), y: Math.round(height / 2) });
      continue;
    }
    if (step.action === 'open_url') {
      const r = await os.openUrl(step.url || '');
      if (!r.ok) return { ok: false, reason: `I couldn't open ${step.url}.` };
      continue;
    }
    if (step.action === 'click' || step.action === 'double_click') {
      const pt = await locate(model, step.target || '', tier, allowEscalate);
      if (pt && pt.unreachable) return { ok: false, unreachable: true, error: pt.error };
      if (!pt) {
        lastMissing = step.target || '';
        fails++;
        if (fails >= 3) return { ok: false, reason: `I couldn't find “${lastMissing}” on the screen.` };
        continue;
      }
      await emitCursor(bus, 'move', pt);
      await os.execute({ type: step.action, x: pt.x, y: pt.y });
      await emitCursor(bus, 'click', pt);
      continue;
    }
    if (step.action === 'type') {
      await os.execute({ type: 'type', text: step.text || '' });
      bus.cursor({ kind: 'type', x: null, y: null, text: step.text || '' });
      continue;
    }
    if (step.action === 'key' || step.action === 'hotkey') {
      await os.execute({ type: 'key', keys: step.keys || [] });
      continue;
    }
    if (step.action === 'wait') {
      await os.execute({ type: 'wait', ms: Math.min(Number(step.ms) || 600, 5000) });
      continue;
    }
  }
  if (fails) return { ok: false, reason: `I couldn't find “${lastMissing}” on the screen.` };
  return { ok: true };
}

function reflectionsOf(bus) {
  return bus.history.map((h) => h.text).filter(Boolean);
}

async function run(goal, { model, tier, emit, onBus } = {}) {
  const bus = new Bus(emit);
  // Lets the caller stop a running mission: runSteps checks bus.aborted between steps.
  if (typeof onBus === 'function') onBus(bus);
  bus.goal = goal;

  try {
    // 1) Learned Reflex — replay a known task deterministically.
    const macro = macros.find(goal);
    if (macro) {
      bus.reflection("I've done this before — let me just do it.");
      const r = await runSteps(bus, macro.steps, { model, tier, allowEscalate: true });
      if (r.ok) {
        const summary = await summarize(model, goal, reflectionsOf(bus));
        bus.done(summary, reflectionsOf(bus));
        return summary;
      }
      if (r.unreachable) { bus.error(describeBedrockError(r.error)); return null; }
      if (r.reason === 'stopped') return null;
      bus.reflection('That shortcut did not work this time — let me work it out again.');
    }

    // 2) New task — compile once.
    bus.reflection('Thinking through the best way to do this…');
    const state = await os.getState();
    const planned = await planner.plan(model, goal, state);
    if (!planned.ok) {
      bus.error(planned.unreachable
        ? describeBedrockError(planned.error)
        : `I couldn't work out a plan for that (${planned.error}).`);
      return null;
    }

    // 3) Execute deterministically; brain only on unresolved targets.
    const r = await runSteps(bus, planned.steps, { model, tier, allowEscalate: true });
    if (!r.ok) {
      if (r.unreachable) bus.error(describeBedrockError(r.error));
      else if (r.reason !== 'stopped') bus.error(`I couldn't finish that one. ${r.reason}`);
      return null;
    }

    // 4) Learn it for next time.
    macros.save(goal, planned.steps);

    const summary = await summarize(model, goal, reflectionsOf(bus));
    bus.done(summary, reflectionsOf(bus));
    return summary;
  } catch (err) {
    const msg = String((err && err.message) || err || '');
    const hint = /accessib|permission|not allowed|not trusted/i.test(msg)
      ? ' Cofounder needs Accessibility permission (System Settings > Privacy & Security > Accessibility).'
      : '';
    bus.error(`I couldn't finish that one — something went wrong on the machine${msg ? `: ${msg}` : ''}.${hint}`);
    return null;
  }
}

module.exports = { run, runSteps, locate, STRONG_TIERS };
