// Seed the desktop app with the synthetic bookkeeper week from
// strands-agent/demo/sample-observation.jsonl, shifted so it ends one hour ago.
// For demos and judging on a machine with no real history yet. No real
// person's data is involved.
//
//   node scripts/seed-demo-activity.cjs          # appends to the app's activity log
//   node scripts/seed-demo-activity.cjs --reset  # replaces it
const fs = require('fs');
const os = require('os');
const path = require('path');

const SAMPLE = path.join(__dirname, '..', 'strands-agent', 'demo', 'sample-observation.jsonl');
const DATA_DIR = process.env.COFOUNDER_DATA_DIR
  || path.join(os.homedir(), 'Library', 'Application Support', 'Cofounder Agents for Humans');
const LOG = path.join(DATA_DIR, 'observation.jsonl');

const events = fs.readFileSync(SAMPLE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const shift = Date.now() / 1000 - 3600 - events[events.length - 1].t;
const lines = events.map((e) => JSON.stringify({ ...e, t: e.t + shift })).join('\n') + '\n';

fs.mkdirSync(DATA_DIR, { recursive: true });
if (process.argv.includes('--reset')) fs.writeFileSync(LOG, lines);
else fs.appendFileSync(LOG, lines);
console.log(`Seeded ${events.length} demo events into ${LOG}`);
