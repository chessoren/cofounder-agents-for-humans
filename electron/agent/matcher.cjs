// Deterministic intent -> element resolver. No model call: this is what lets
// Cofounder run dozens of steps without ever waking the brain. Given a target
// description ("the search box", "Send button") and the live element list, it
// scores by token overlap + substring + role affinity and returns the best hit.

const STOP = new Set(['the', 'a', 'an', 'to', 'on', 'in', 'of', 'for', 'button', 'icon', 'field', 'box', 'menu', 'item', 'click', 'open', 'go', 'and',
  'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'bouton', 'champ']);

function tokens(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N} ]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

// Role affinity: hints in the target description nudge toward a control type.
function roleBonus(target, role) {
  const t = target.toLowerCase();
  // Roles: macOS AX roles (AXTextField, AXButton, AXLink, ...) and legacy UIA names.
  const r = (role || '').toLowerCase();
  const isText = /edit|textfield|textarea|searchfield|combobox/.test(r);
  if (/(search|type|input|email|password|field|text box|address|write|message)/.test(t) && isText) return 0.25;
  if (/(send|submit|save|ok|confirm|next|button|sign|login|continue|done)/.test(t) && r.includes('button')) return 0.2;
  if (/(link|open|go to)/.test(t) && /hyperlink|axlink/.test(r)) return 0.2;
  if (/(tab)/.test(t) && r.includes('tab')) return 0.2;
  if (/(check|toggle|enable)/.test(t) && r.includes('check')) return 0.2;
  if (/(menu|dropdown|select|choose)/.test(t) && /popupbutton|menubutton|combobox/.test(r)) return 0.2;
  return 0;
}

function score(target, el) {
  const tt = tokens(target);
  const nt = tokens(el.name);
  if (!tt.length || !nt.length) {
    // fall back to raw substring containment
    const a = String(target).toLowerCase().trim();
    const b = String(el.name || '').toLowerCase().trim();
    if (b && (a.includes(b) || b.includes(a))) return 0.6 + roleBonus(target, el.role);
    return roleBonus(target, el.role);
  }
  const nset = new Set(nt);
  let inter = 0;
  for (const w of new Set(tt)) if (nset.has(w)) inter++;
  const union = new Set([...tt, ...nt]).size;
  const jaccard = union ? inter / union : 0;
  const nameStr = nt.join(' ');
  const subBonus = tt.some((w) => nameStr.includes(w)) ? 0.1 : 0;
  return jaccard + subBonus + roleBonus(target, el.role);
}

// Returns { element, score } or null if nothing clears the confidence bar.
function match(target, elements, threshold = 0.34) {
  let best = null;
  for (const el of elements || []) {
    const s = score(target, el);
    if (!best || s > best.score) best = { element: el, score: s };
  }
  if (best && best.score >= threshold) return best;
  return null;
}

module.exports = { match, tokens };
