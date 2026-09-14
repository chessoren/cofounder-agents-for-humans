// Shared Memory Bus — the single source of truth the three internal layers read
// from and write to. It is process-local and never exposed outside the agent.
//
// It also carries the only outward-facing channel: `emit(event)`, which surfaces
// just three kinds of things to the UI — a reflection (Cofounder's narration), a
// cursor action (what the hand does), and terminal done/error. Nothing about the
// internal layering ever crosses this boundary.
class Bus {
  constructor(emit) {
    this._emit = typeof emit === 'function' ? emit : () => {};
    this.reset();
  }

  reset() {
    this.goal = '';
    this.milestones = [];      // [{ id, text, status: 'pending'|'active'|'done' }]
    this.currentMilestone = 0;
    this.lastAction = null;
    this.screenState = null;   // latest OS state snapshot (accessibility tree, foreground, bounds)
    this.speculative = [];     // predicted upcoming actions (N+1, N+2)
    this.history = [];         // kept intentionally tiny — see state-stripping below
    this.aborted = false;
  }

  // state-stripping: we never let history grow. Successful past steps are dropped;
  // only the final goal, the active milestone and the present screen state matter.
  remember(entry) {
    this.history.push(entry);
    if (this.history.length > 3) this.history.shift();
  }

  // Outward events (UI-visible) — deliberately small surface.
  reflection(text) { if (text) this._emit({ type: 'reflection', text }); }
  cursor(action) { this._emit({ type: 'cursor', action }); }
  done(summary, reflections) { this._emit({ type: 'done', summary, reflections }); }
  error(message) { this._emit({ type: 'error', message }); }
}

module.exports = { Bus };
