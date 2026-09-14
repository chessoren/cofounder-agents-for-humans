// Accessibility engine (macOS) — the fast "eyes" of Cofounder. Enumerates the
// frontmost application's front window through System Events (JXA via
// `osascript -l JavaScript`) and returns its interactable elements with center
// coordinates in logical screen points (the same space nut.js moves the mouse in).
// Text, not pixels: far cheaper than sending screenshots to a model.
//
// Requires the Accessibility permission for the host process (Electron in dev,
// the packaged app in prod). Without it, or on any failure, enumerate() returns
// an empty snapshot and the orchestrator escalates instead.
const { execFile } = require('child_process');

const MAX_ELEMENTS = 150;
const TIMEOUT_MS = 2500;

// Bounded breadth-first walk over `UI elements`. Never uses `entire contents`
// (it can take many seconds on big windows). Properties are fetched per level in
// batch (one Apple Event per property for all siblings), with a per-element
// fallback when a batch call throws.
const JXA = String.raw`
function run(argv) {
  var t0 = Date.now();
  var maxEls = parseInt(argv[0], 10) || 150;
  var budget = parseInt(argv[1], 10) || 2000;
  var MAX_DEPTH = 9, MAX_VISITED = 700;
  var KEEP = { AXButton:1, AXTextField:1, AXTextArea:1, AXLink:1, AXMenuButton:1, AXCheckBox:1,
    AXRadioButton:1, AXPopUpButton:1, AXTab:1, AXStaticText:1, AXComboBox:1, AXSearchField:1,
    AXMenuItem:1, AXSlider:1, AXIncrementor:1, AXDisclosureTriangle:1 };
  // Leaves: their children are never interesting and can be expensive.
  var LEAF = { AXStaticText:1, AXTextField:1, AXTextArea:1, AXButton:1, AXCheckBox:1, AXRadioButton:1,
    AXPopUpButton:1, AXMenuButton:1, AXComboBox:1, AXSlider:1, AXImage:1, AXIncrementor:1,
    AXValueIndicator:1, AXScrollBar:1, AXDisclosureTriangle:1 };
  var out = { title: '', app: '', elements: [], truncated: false };
  function str(v) { return (v === null || v === undefined) ? '' : (typeof v === 'string' ? v : ''); }
  function batch(coll, prop, n) {
    try { var r = coll[prop](); if (r && r.length === n) return r; } catch (e) {}
    var a = [];
    for (var i = 0; i < n; i++) { try { a.push(coll[i][prop]()); } catch (e) { a.push(null); } }
    return a;
  }
  try {
    var se = Application('System Events');
    var proc = se.processes.whose({ frontmost: true })[0];
    out.app = str(proc.name());
    var win = null;
    try { win = proc.windows[0]; win.role(); } catch (e) { win = null; }
    if (!win) return JSON.stringify(out);
    try { out.title = str(win.name()); } catch (e) {}
    // Big collections (file lists, tables) are sampled: only their first rows are walked.
    var COLLECTION = { AXTable:1, AXOutline:1, AXList:1, AXGrid:1, AXBrowser:1, AXRow:0 };
    var queue = [{ el: win, depth: 0, role: 'AXWindow' }];
    var visited = 0;
    while (queue.length) {
      if (Date.now() - t0 > budget || out.elements.length >= maxEls || visited >= MAX_VISITED) { out.truncated = true; break; }
      var node = queue.shift();
      var kids = node.el.uiElements;
      // One Apple Event for all sibling roles (also gives the count).
      var roles;
      try { roles = kids.role(); } catch (e) { roles = []; }
      var n = Math.min(roles ? roles.length : 0, 200);
      if (!n) continue;
      var any = false;
      for (var r0 = 0; r0 < n; r0++) if (KEEP[str(roles[r0])]) { any = true; break; }
      // Pure container level: skip the property fetches, just descend.
      var names = null, descs = null, rdescs = null, pos = null, sizes = null, values = null;
      if (any) {
        names = batch(kids, 'name', n);
        descs = batch(kids, 'description', n);
        pos = batch(kids, 'position', n);
        sizes = batch(kids, 'size', n);
      }
      for (var i = 0; i < n; i++) {
        visited++;
        var role = str(roles[i]);
        if (any && KEEP[role] && out.elements.length < maxEls) {
          var p = pos[i], s = sizes[i];
          if (p && s && s[0] > 0 && s[1] > 0) {
            var name = str(names[i]);
            var d = str(descs[i]);
            if (!name && d) {
              // System Events falls back to the role description ("button") when
              // there is no AXDescription; a one-word role description is not a label.
              if (/\s/.test(d)) name = d;
              else {
                if (!rdescs) rdescs = batch(kids, 'roleDescription', n);
                if (d !== str(rdescs[i])) name = d;
              }
            }
            if (!name && role === 'AXStaticText') {
              if (!values) values = batch(kids, 'value', n);
              name = str(values[i]);
            }
            if (name) name = name.replace(/\s+/g, ' ').slice(0, 120);
            if (name || role !== 'AXStaticText') {
              out.elements.push({ name: name, role: role, x: Math.round(p[0] + s[0] / 2), y: Math.round(p[1] + s[1] / 2) });
            }
          }
        }
        if (!LEAF[role] && node.depth + 1 < MAX_DEPTH && !(COLLECTION[node.role] && i >= 12)) {
          queue.push({ el: kids[i], depth: node.depth + 1, role: role });
        }
      }
    }
  } catch (e) {
    out.error = String(e);
  }
  out.ms = Date.now() - t0;
  return JSON.stringify(out);
}
`;

const EMPTY = () => ({ title: '', elements: [] });

// Parse the raw JXA JSON into the public shape. Exported for tests.
function parseSnapshot(raw) {
  try {
    const o = JSON.parse(String(raw || '').trim());
    const arr = Array.isArray(o.elements) ? o.elements : [];
    return {
      title: String(o.title || ''),
      app: String(o.app || ''),
      elements: arr
        .filter((e) => e && Number.isFinite(e.x) && Number.isFinite(e.y))
        .slice(0, MAX_ELEMENTS)
        .map((e, i) => ({ id: i, name: String(e.name || ''), role: String(e.role || ''), cx: e.x, cy: e.y })),
      ms: o.ms,
      truncated: !!o.truncated,
      error: o.error,
    };
  } catch (_) {
    return EMPTY();
  }
}

const children = new Set();

// Returns { title, elements:[{id,name,role,cx,cy}] } or empty on any failure.
function enumerate(timeoutMs = TIMEOUT_MS) {
  if (process.platform !== 'darwin') return Promise.resolve(EMPTY());
  return new Promise((resolve) => {
    let child;
    try {
      // Leave ~400 ms of the budget for osascript startup and JSON transfer.
      const budget = Math.max(500, timeoutMs - 400);
      child = execFile(
        'osascript',
        ['-l', 'JavaScript', '-e', JXA, String(MAX_ELEMENTS), String(budget)],
        { timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' },
        (err, stdout) => {
          children.delete(child);
          if (err || !stdout) return resolve(EMPTY());
          resolve(parseSnapshot(stdout));
        }
      );
      children.add(child);
    } catch (_) {
      resolve(EMPTY());
    }
  });
}

function dispose() {
  for (const c of children) { try { c.kill('SIGKILL'); } catch (_) { /* ignore */ } }
  children.clear();
}

module.exports = { enumerate, dispose, parseSnapshot };
