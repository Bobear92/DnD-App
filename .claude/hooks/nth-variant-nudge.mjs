/**
 * PreToolUse(Write) nudge — the automatic trigger for the /grill alignment gate (factory item #1).
 *
 * The "breadth-before-vertical" tripwire in CLAUDE.md is a judgment call I can skip. This turns it
 * into an actual interrupt: when a Write would create the Nth file of a known fan-out pattern (a
 * hand-written class sheet, a class config, a per-class subclass-data file) and ≥2 siblings already
 * exist, the hook blocks that ONE write with a reminder to run /grill or confirm a vertical slice is
 * proven. It fires ONCE per pattern per session (a tmp marker keyed by session_id + rule), so after
 * you acknowledge and re-issue the Write it gets out of the way — no loop, minimal friction.
 *
 * Mechanism: exit 2 + stderr is the version-proof way for a PreToolUse hook to block and feed the
 * message back to Claude. Any error → exit 0 (fail-open): a detector bug must never break a Write.
 *
 * Scope is deliberately narrow (specific scaffold dirs) to keep false positives near zero. Add a
 * rule here when a new fan-out pattern emerges.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const norm = (p) => (p || '').replace(/\\/g, '/');
const isTest = (f) => /\.test\.[jt]sx?$/.test(f);

// Each rule: the dir the file must live in (suffix match), which filenames count, and the min
// number of existing siblings that makes a new file "the Nth variant".
const RULES = [
  {
    key: 'class-sheet',
    dirEndsWith: ['/characters/components/sheets', '/characters/components/sheets/2024'],
    matches: (f) => /Sheet\.jsx$/.test(f) && !isTest(f),
    min: 2,
    message:
      'another hand-written class SHEET. We are consolidating these into data-driven configs '
      + '(the /class-config skill + configs/). Before adding one: confirm it genuinely cannot be a '
      + 'config, or that one config slice is proven end-to-end.',
  },
  {
    key: 'class-config',
    dirEndsWith: ['/sheets/classSheet/configs'],
    matches: (f) => /\.js$/.test(f) && !isTest(f) && f !== 'index.jsx' && f !== 'index.js',
    min: 2,
    message:
      'another class CONFIG. Confirm ONE config is proven end-to-end (creation → use → rest/reset → '
      + 'level-up) before fanning out. The golden-config contract + coverage ratchet guard the shape '
      + 'and coverage, not whether the interaction model is right.',
  },
  {
    key: 'subclass-data',
    dirEndsWith: ['/classData/subclassData'],
    matches: (f) => /\.js$/.test(f) && !isTest(f) && f !== 'index.js',
    min: 2,
    message:
      'another per-class subclass-data file. Confirm the subclass-feature model (see /subclass-features) '
      + 'is proven on one class before replicating across the rest.',
  },
];

function main() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { process.exit(0); }
  let payload;
  try { payload = JSON.parse(raw); } catch { process.exit(0); }

  if (payload.tool_name !== 'Write') process.exit(0);
  const filePath = norm(payload.tool_input?.file_path);
  if (!filePath) process.exit(0);

  // Only nudge on NEW files — editing/overwriting an existing variant isn't fanning out.
  if (fs.existsSync(filePath)) process.exit(0);

  const dir = path.posix.dirname(filePath);
  const base = path.posix.basename(filePath);

  const rule = RULES.find((r) => r.dirEndsWith.some((d) => dir.endsWith(d)) && r.matches(base));
  if (!rule) process.exit(0);

  let siblings = 0;
  try {
    siblings = fs.readdirSync(dir).filter((f) => f !== base && rule.matches(f)).length;
  } catch { process.exit(0); }
  if (siblings < rule.min) process.exit(0);

  // One interrupt per pattern per session.
  const session = String(payload.session_id || 'no-session').replace(/[^\w.-]/g, '_');
  const marker = path.join(os.tmpdir(), `grill-nudge-${session}-${rule.key}`);
  if (fs.existsSync(marker)) process.exit(0);
  try { fs.writeFileSync(marker, new Date().toISOString()); } catch { process.exit(0); }

  process.stderr.write(
    `⛔ /grill checkpoint — you're about to create ${rule.message}\n\n`
    + `This is the "breadth-before-vertical" tripwire (CLAUDE.md). If you have NOT confirmed a proven `
    + `vertical slice, run /grill ${filePath} to work through it. If you already have, just re-issue `
    + `the Write — this fires once per pattern per session and will now let it through.\n`,
  );
  process.exit(2);
}

try { main(); } catch { process.exit(0); }
