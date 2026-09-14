// Deterministic checks for the macOS / Bedrock computer-use layer.
// Run: node scripts/verify-agent-macos.cjs   (no AWS, no UI, no nut.js calls)
const path = require('path');
const fs = require('fs');
const nodeOs = require('os');
const assert = require('assert');

const AGENT = path.join(__dirname, '..', 'electron', 'agent');
const BEDROCK = path.join(__dirname, '..', 'electron', 'bedrock.cjs');

let passed = 0;
let failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok   ${name}`); }
  catch (err) { failed++; console.log(`  FAIL ${name}\n       ${err && err.message}`); }
}

// Stub Bedrock before anything loads it: every call fails like a machine with no AWS creds.
let bedrockCalls = 0;
require.cache[require.resolve(BEDROCK)] = {
  id: BEDROCK, filename: BEDROCK, loaded: true,
  exports: {
    MODEL_ID: 'test-model', REGION: 'us-west-2',
    converse: async () => { bedrockCalls++; return { ok: false, error: 'CredentialsProviderError: Could not load credentials from any providers' }; },
    check: async () => ({ ok: false }),
    parseJSON: (text) => {
      if (!text) return null;
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const c = fenced ? fenced[1] : text;
      const a = c.indexOf('{'), b = c.indexOf('[');
      const s = a === -1 ? b : b === -1 ? a : Math.min(a, b);
      if (s === -1) return null;
      const e = Math.max(c.lastIndexOf('}'), c.lastIndexOf(']'));
      try { return JSON.parse(c.slice(s, e + 1)); } catch (_) { return null; }
    },
  },
};

// Stub the OS layer for the orchestrator tests: no osascript, no mouse.
const osPath = require.resolve(path.join(AGENT, 'os.cjs'));
const realOs = require(osPath);
const osCalls = [];
let fakeElements = [];
require.cache[osPath].exports = {
  ...realOs,
  getState: async () => ({ foreground: { title: 'Test', app: 'Test' }, elements: fakeElements }),
  screenSize: async () => ({ width: 1512, height: 982 }),
  screenshotBase64: async () => null,
  launchApp: async (app) => { osCalls.push(['launch', app]); return { ok: true }; },
  openUrl: async (url) => { osCalls.push(['open_url', url]); return { ok: true }; },
  execute: async (a) => { osCalls.push(['execute', a.type, a.keys || a.text || [a.x, a.y]]); return { ok: true }; },
};

const matcher = require(path.join(AGENT, 'matcher.cjs'));
const macros = require(path.join(AGENT, 'macros.cjs'));
const model = require(path.join(AGENT, 'model.cjs'));
const actor = require(path.join(AGENT, 'actor.cjs'));
const planner = require(path.join(AGENT, 'planner.cjs'));
const acc = require(path.join(AGENT, 'acc.cjs'));
const orchestrator = require(path.join(AGENT, 'orchestrator.cjs'));

(async () => {
  console.log('key names');
  await test('macOS modifier aliases', () => {
    assert.deepStrictEqual(realOs.parseKeys(['Cmd', 'L']).names, ['LeftCmd', 'L']);
    assert.deepStrictEqual(realOs.parseKeys(['Command', 'Shift', 't']).names, ['LeftCmd', 'LeftShift', 'T']);
    assert.strictEqual(realOs.keyName('Meta'), 'LeftCmd');
    assert.strictEqual(realOs.keyName('Ctrl'), 'LeftControl');
    assert.strictEqual(realOs.keyName('Control'), 'LeftControl');
    assert.strictEqual(realOs.keyName('Option'), 'LeftAlt');
    assert.strictEqual(realOs.keyName('Alt'), 'LeftAlt');
    assert.strictEqual(realOs.keyName('Shift'), 'LeftShift');
  });
  await test('named keys, letters, digits, arrows', () => {
    assert.strictEqual(realOs.keyName('Enter'), 'Enter');
    assert.strictEqual(realOs.keyName('Return'), 'Return');
    assert.strictEqual(realOs.keyName('tab'), 'Tab');
    assert.strictEqual(realOs.keyName('Escape'), 'Escape');
    assert.strictEqual(realOs.keyName('esc'), 'Escape');
    assert.strictEqual(realOs.keyName('a'), 'A');
    assert.strictEqual(realOs.keyName('7'), 'Num7');
    assert.strictEqual(realOs.keyName('ArrowUp'), 'Up');
    assert.strictEqual(realOs.keyName('down'), 'Down');
    assert.strictEqual(realOs.keyName('F5'), 'F5');
    assert.strictEqual(realOs.keyName('space'), 'Space');
  });
  await test('nut.js enum names still work', () => {
    for (const k of ['LeftControl', 'LeftCmd', 'LeftSuper', 'Num1', 'Backspace', 'PageDown', 'RightShift']) assert.strictEqual(realOs.keyName(k), k);
  });
  await test('chord strings and unknown keys', () => {
    assert.deepStrictEqual(realOs.parseKeys('Cmd+Shift+N').names, ['LeftCmd', 'LeftShift', 'N']);
    assert.deepStrictEqual(realOs.parseKeys(['Cmd+Option', 'Escape']).names, ['LeftCmd', 'LeftAlt', 'Escape']);
    const r = realOs.parseKeys(['Cmd', 'Hyperdrive']);
    assert.deepStrictEqual(r.names, ['LeftCmd']);
    assert.deepStrictEqual(r.unknown, ['Hyperdrive']);
    // All mapped names must exist in the real nut.js enum.
    const { Key } = require('@nut-tree-fork/shared');
    for (const n of realOs.parseKeys(['Cmd', 'Control', 'Option', 'Shift', 'Return', 'Enter', 'Tab', 'Esc', 'Up', 'Left', 'q', '0', '/', ',']).names) {
      assert.notStrictEqual(Key[n], undefined, `Key.${n} missing`);
    }
  });
  await test('only http(s) urls are opened', () => {
    assert.ok(realOs.isSafeUrl('https://www.apple.com/fr/'));
    assert.ok(!realOs.isSafeUrl('file:///etc/passwd'));
    assert.ok(!realOs.isSafeUrl('javascript:alert(1)'));
    assert.ok(!realOs.isSafeUrl('https://x.com/"; rm -rf ~'));
  });

  console.log('matcher');
  const els = [
    { id: 0, name: 'Bouton de fermeture', role: 'AXButton', cx: 24, cy: 57 },
    { id: 1, name: 'Rechercher', role: 'AXTextField', cx: 400, cy: 90 },
    { id: 2, name: 'Nouvelle note', role: 'AXButton', cx: 300, cy: 60 },
    { id: 3, name: 'Envoyer', role: 'AXButton', cx: 900, cy: 700 },
    { id: 4, name: 'Search', role: 'AXSearchField', cx: 600, cy: 40 },
    { id: 5, name: 'Réglages', role: 'AXButton', cx: 50, cy: 500 },
  ];
  await test('exact and partial labels', () => {
    assert.strictEqual(matcher.match('Envoyer', els).element.id, 3);
    assert.strictEqual(matcher.match('the Nouvelle note button', els).element.id, 2);
  });
  await test('accent-insensitive and role affinity', () => {
    assert.strictEqual(matcher.match('reglages', els).element.id, 5);
    assert.strictEqual(matcher.match('search field', els).element.id, 4);
  });
  await test('no confident match returns null', () => {
    assert.strictEqual(matcher.match('Checkout basket', els), null);
  });

  console.log('macros');
  await test('Unicode-aware normalize', () => {
    assert.strictEqual(macros.normalize('Créer une note « Réunion » à 15h !'), 'creer une note reunion a 15h');
    assert.strictEqual(macros.normalize('Écris à Zoë'), 'ecris a zoe');
    assert.strictEqual(macros.normalize('שלום עולם'), 'שלום עולם');
    assert.strictEqual(macros.normalize('日本語 テスト'), '日本語 テスト');
  });
  const dir = fs.mkdtempSync(path.join(nodeOs.tmpdir(), 'cofounder-macros-'));
  await test('save/find with accents', () => {
    macros.init(dir);
    macros.save('Créer une nouvelle note dans Notes', [{ action: 'launch', app: 'Notes' }]);
    assert.ok(fs.existsSync(path.join(dir, 'cofounder-macros.json')));
    assert.ok(macros.find('créer une nouvelle note dans notes'));
    assert.ok(macros.find('Creer une nouvelle note dans Notes'));
    assert.strictEqual(macros.find('Envoyer un email à Paul'), null);
  });

  console.log('model');
  await test('parseJSON tolerates fences and prose', () => {
    assert.deepStrictEqual(model.parseJSON('```json\n{"steps":[{"action":"wait"}]}\n```'), { steps: [{ action: 'wait' }] });
    assert.deepStrictEqual(model.parseJSON('Sure! {"index": 3} hope that helps'), { index: 3 });
    assert.deepStrictEqual(model.parseJSON('[1,2]'), [1, 2]);
    assert.strictEqual(model.parseJSON('no json here'), null);
    assert.strictEqual(model.parseJSON(''), null);
  });
  await test('complete() surfaces unreachable Bedrock', async () => {
    const r = await model.complete('m', 'sys', 'hi', { json: true });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.unreachable, true);
    assert.match(model.describeBedrockError(r.error), /Amazon Bedrock is not reachable: no AWS credentials/);
    assert.match(model.describeBedrockError('AccessDeniedException: nope'), /not allowed to call test-model/);
    assert.strictEqual(model.isUnreachable('ValidationException: bad input'), false);
  });

  console.log('planner / actor / acc');
  await test('planner prompt is macOS + Cofounder, sanitize keeps open_url', () => {
    assert.match(planner.SYSTEM, /macOS/);
    assert.match(planner.SYSTEM, /Cofounder/);
    assert.match(planner.SYSTEM, /open_url/);
    assert.doesNotMatch(planner.SYSTEM, /Mira/);
    const s = planner.sanitize([
      { action: 'open_url', url: 'https://apple.com' }, { action: 'open_url', url: 'file:///x' },
      { action: 'launch', app: 'Notes' }, { action: 'click' }, { action: 'format_disk' }, { action: 'key', keys: ['Cmd', 'N'] },
    ]);
    assert.deepStrictEqual(s.map((x) => x.action), ['open_url', 'launch', 'key']);
  });
  await test('vision coordinates: screenshot pixels -> logical points', () => {
    // 1568x1018 downscaled shot of a 1512x982-point Retina screen.
    assert.deepStrictEqual(actor.scaleToScreen({ x: 784, y: 509 }, { width: 1568, height: 1018 }, { width: 1512, height: 982 }), { x: 756, y: 491 });
    assert.deepStrictEqual(actor.scaleToScreen({ x: 3024, y: 1964 }, { width: 3024, height: 1964 }, { width: 1512, height: 982 }), { x: 1511, y: 981 });
    const png = Buffer.alloc(33);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png, 0);
    png.writeUInt32BE(13, 8); png.write('IHDR', 12, 'ascii'); png.writeUInt32BE(1568, 16); png.writeUInt32BE(1018, 20);
    assert.deepStrictEqual(actor.pngSize(png.toString('base64')), { width: 1568, height: 1018 });
    assert.strictEqual(actor.pngSize('bm90IGEgcG5n'), null);
  });
  await test('acc parseSnapshot shape and failure', () => {
    const s = acc.parseSnapshot(JSON.stringify({ title: 'Calc', app: 'Calculator', elements: [{ name: '7', role: 'AXButton', x: 10, y: 20 }, { name: 'bad' }] }));
    assert.strictEqual(s.title, 'Calc');
    assert.deepStrictEqual(s.elements, [{ id: 0, name: '7', role: 'AXButton', cx: 10, cy: 20 }]);
    assert.deepStrictEqual(acc.parseSnapshot('garbage'), { title: '', elements: [] });
  });
  await test('bedrock tier allows vision', () => {
    assert.ok(orchestrator.STRONG_TIERS.has('bedrock'));
  });

  console.log('orchestrator');
  await test('Bedrock failure emits an error event, never a fake done', async () => {
    macros.init(fs.mkdtempSync(path.join(nodeOs.tmpdir(), 'cofounder-empty-')));
    const events = [];
    osCalls.length = 0;
    bedrockCalls = 0;
    const out = await orchestrator.run('Ouvre Notes et crée une note', { model: 'test-model', tier: 'bedrock', emit: (e) => events.push(e) });
    assert.strictEqual(out, null);
    assert.strictEqual(events.filter((e) => e.type === 'done').length, 0, 'no done event');
    assert.strictEqual(events.filter((e) => e.type === 'cursor').length, 0, 'no fake cursor choreography');
    const errs = events.filter((e) => e.type === 'error');
    assert.strictEqual(errs.length, 1);
    assert.match(errs[0].message, /Amazon Bedrock is not reachable/);
    assert.strictEqual(osCalls.length, 0, 'nothing executed on the machine');
    assert.ok(bedrockCalls >= 1);
  });
  await test('learned macro replays with zero model calls when Bedrock is down', async () => {
    const d = fs.mkdtempSync(path.join(nodeOs.tmpdir(), 'cofounder-replay-'));
    macros.init(d);
    macros.save('Ouvre Notes et crée une note', [
      { action: 'launch', app: 'Notes', narration: "J'ouvre Notes." },
      { action: 'key', keys: ['Cmd', 'N'], narration: 'Nouvelle note.' },
      { action: 'click', target: 'Rechercher', narration: 'Je clique.' },
      { action: 'type', text: 'Réunion à 15h' },
    ]);
    fakeElements = els;
    const events = [];
    osCalls.length = 0;
    bedrockCalls = 0;
    const out = await orchestrator.run('ouvre notes et cree une note', { model: 'test-model', tier: 'bedrock', emit: (e) => events.push(e) });
    const dones = events.filter((e) => e.type === 'done');
    assert.strictEqual(dones.length, 1);
    assert.strictEqual(typeof out, 'string');
    assert.deepStrictEqual(osCalls[0], ['launch', 'Notes']);
    assert.deepStrictEqual(osCalls[1], ['execute', 'key', ['Cmd', 'N']]);
    assert.ok(events.some((e) => e.type === 'cursor' && e.action.x === 400 && e.action.y === 90));
    // Only the (optional) summary may try Bedrock; its failure falls back to plain text.
    assert.ok(bedrockCalls <= 1, `bedrock calls: ${bedrockCalls}`);
    assert.match(dones[0].summary, /Done/);
  });
  await test('replay that cannot find its target escalates, and reports Bedrock down', async () => {
    fakeElements = [{ id: 0, name: 'Something else', role: 'AXButton', cx: 1, cy: 1 }];
    const events = [];
    await orchestrator.run('ouvre notes et cree une note', { model: 'test-model', tier: 'bedrock', emit: (e) => events.push(e) });
    assert.strictEqual(events.filter((e) => e.type === 'done').length, 0);
    assert.match(events.filter((e) => e.type === 'error')[0].message, /Amazon Bedrock is not reachable/);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
