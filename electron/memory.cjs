// MEMORY — what Cofounder knows about how you work.
//
// Two kinds of entries, both written by the Strands workflow agent and both
// editable by the user from the app:
//   • workflows — named, evidenced, with an automation mission;
//   • facts     — durable, precise statements ("Books supplier invoices in Pennylane").
// A single JSON file in the user data dir: readable, portable, erasable.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let file = '';
let db = { workflows: [], facts: [] };

function init(dir) {
  fs.mkdirSync(dir, { recursive: true });
  file = path.join(dir, 'cofounder-memory.json');
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    db = { workflows: Array.isArray(raw.workflows) ? raw.workflows : [], facts: Array.isArray(raw.facts) ? raw.facts : [] };
  } catch (_) {
    db = { workflows: [], facts: [] };
  }
}

function save() {
  if (!file) return;
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, file); // atomic: a crash mid-write never leaves half a memory
}

const factId = (text) => `fact_${crypto.createHash('sha1').update(String(text).trim().toLowerCase()).digest('hex').slice(0, 12)}`;

// Merge one agent run. A re-detected workflow keeps its first-seen date and
// counts how many runs confirmed it; a repeated fact is reconfirmed, not duplicated.
function merge({ workflows = [], facts = [] } = {}) {
  const now = new Date().toISOString();
  for (const wf of workflows) {
    if (!wf || !wf.id) continue;
    const prev = db.workflows.find((w) => w.id === wf.id);
    if (prev && prev.dismissed) continue; // the user said no: do not bring it back
    const entry = { ...prev, ...wf, firstSeen: prev?.firstSeen || now, confirmedAt: now, confirmations: (prev?.confirmations || 0) + 1 };
    db.workflows = db.workflows.filter((w) => w.id !== wf.id).concat(entry);
  }
  for (const f of facts) {
    if (!f || !f.fact) continue;
    const id = factId(f.fact);
    const prev = db.facts.find((x) => x.id === id);
    const entry = { id, fact: String(f.fact), concepts: f.concepts || [], firstSeen: prev?.firstSeen || now, confirmedAt: now, confirmations: (prev?.confirmations || 0) + 1 };
    db.facts = db.facts.filter((x) => x.id !== id).concat(entry);
  }
  save();
  return list();
}

function list() {
  return {
    workflows: db.workflows.filter((w) => !w.dismissed).sort((a, b) => (b.minutes_saved_per_week || 0) - (a.minutes_saved_per_week || 0)),
    facts: [...db.facts].sort((a, b) => String(b.confirmedAt).localeCompare(String(a.confirmedAt))),
  };
}

function forget(id) {
  const wf = db.workflows.find((w) => w.id === id);
  if (wf) wf.dismissed = true; // remembered as "declined" so detection does not resurrect it
  db.facts = db.facts.filter((f) => f.id !== id);
  save();
  return list();
}

function get(id) { return db.workflows.find((w) => w.id === id) || null; }

// What the agent should know before a run, so it updates instead of duplicating.
function known() {
  return { workflows: db.workflows, facts: db.facts.map((f) => ({ fact: f.fact, concepts: f.concepts })) };
}

module.exports = { init, merge, list, forget, get, known };
