// Learned Reflexes — the macro memory. Every successful task is distilled into a
// reusable program of steps (keyed by a normalized goal). A known task replays
// deterministically with ZERO model calls; the more Cofounder is used, the faster it
// gets. (Cofounder)
// Steps store target DESCRIPTIONS (not absolute coordinates), so replay
// re-resolves elements live and stays robust to moved windows.
const path = require('path');
const { readFileSync, writeFileSync, existsSync } = require('fs');

let store = null;
let filePath = null;

function init(userDataDir) {
  const dir = userDataDir || process.cwd();
  filePath = path.join(dir, 'cofounder-macros.json');
  const legacy = path.join(dir, 'mira-macros.json');
  const src = existsSync(filePath) ? filePath : existsSync(legacy) ? legacy : null;
  try { store = src ? JSON.parse(readFileSync(src, 'utf-8')) : {}; }
  catch { store = {}; }
}

// Unicode-aware: keeps letters/digits of every script. Latin diacritics are folded
// ("Créer une facture" -> "creer une facture") so accented and unaccented typing
// map to the same reflex; marks on other scripts are preserved.
function normalize(goal) {
  return String(goal || '')
    .normalize('NFD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Jaccard over goal tokens — finds a previously-learned task close to this one.
function find(goal, threshold = 0.7) {
  if (!store) return null;
  const g = new Set(normalize(goal).split(' ').filter(Boolean));
  if (!g.size) return null;
  let best = null;
  for (const key of Object.keys(store)) {
    const k = new Set(normalize(key).split(' ').filter(Boolean));
    let inter = 0;
    for (const w of g) if (k.has(w)) inter++;
    const union = new Set([...g, ...k]).size;
    const j = union ? inter / union : 0;
    if (!best || j > best.j) best = { j, macro: store[key] };
  }
  return best && best.j >= threshold ? best.macro : null;
}

function save(goal, steps) {
  if (!store) return;
  const key = normalize(goal);
  if (!key || !Array.isArray(steps) || !steps.length) return;
  store[key] = { goal, steps, savedAt: Date.now(), runs: (store[key]?.runs || 0) + 1 };
  try { writeFileSync(filePath, JSON.stringify(store, null, 2)); } catch { /* ignore */ }
}

module.exports = { init, find, save, normalize };
