/**
 * Class-feature mechanization coverage report.
 *
 * Walks every class feature (all 13 classes × 20 levels × both editions) and prints, per
 * edition + class, which features are wired into real mechanics vs. which are still
 * prose-only — a description card with no interactive behavior. This is the "what still needs
 * implementing" worklist for turning class/subclass rules text into mechanics, mirroring the
 * backend's report_feat_effects.py.
 *
 * A feature counts as MECHANIZED when it is recognized by one of the data-driven systems:
 *   - asi      — an Ability Score Improvement (handled generically by the LevelUpWizard)
 *   - choice   — a "pick N from a pool" level-up choice (levelChoicesData.js)
 *   - action   — appears in the action-economy feature map (actionEconomyData.js)
 *
 * CONSERVATIVE BY DESIGN: features wired ONLY inside a class config or hand-written sheet
 * (locked choices like Fighting Style, rest-resource trackers not also in the action map)
 * are NOT detected here yet — the configs are .jsx (React imports) and can't load in plain
 * Node, so they're intentionally left out. Those show as prose-only, i.e. the report
 * UNDER-counts mechanization. That keeps the TODO list a safe over-estimate rather than
 * hiding real gaps; tighten it as the data-only sources grow.
 *
 * Run: npm run report:class-coverage   (from frontend/)
 */
import { CLASS_FEATURES_5E } from '../src/characters/components/classData/classFeatures5e.js';
import { CLASS_FEATURES_2024 } from '../src/characters/components/classData/classFeatures2024.js';
import { LEVEL_CHOICES } from '../src/characters/components/classData/levelChoicesData.js';
import {
  CLASS_FEATURE_ACTIONS_5E,
  CLASS_FEATURE_ACTIONS_2024,
  normalizeFeatureName,
} from '../src/characters/components/combat/actionEconomyData.js';

const EDITIONS = [
  { id: '5e', features: CLASS_FEATURES_5E, actions: CLASS_FEATURE_ACTIONS_5E },
  { id: '5.5e', features: CLASS_FEATURES_2024, actions: CLASS_FEATURE_ACTIONS_2024 },
];

const lc = (s) => (s || '').toLowerCase();

/** Pool labels (lowercased) the class can choose from this edition, e.g. ['metamagic']. */
function poolLabels(className, editionId) {
  const list = LEVEL_CHOICES[className]?.[editionId] || [];
  return list.map((c) => lc(c.label));
}

/**
 * Classify one feature name → { mechanized, bucket }.
 * bucket ∈ 'asi' | 'choice' | 'action' | 'prose-only'.
 */
function classifyFeature(name, className, editionId, actionsForClass) {
  if (/ability score improvement/i.test(name)) return { mechanized: true, bucket: 'asi' };

  const nameLc = lc(name);
  if (poolLabels(className, editionId).some((label) => nameLc.includes(label))) {
    return { mechanized: true, bucket: 'choice' };
  }

  const norm = normalizeFeatureName(name);
  if (actionsForClass && actionsForClass[norm]) {
    return { mechanized: true, bucket: 'action' };
  }

  return { mechanized: false, bucket: 'prose-only' };
}

/** Build per-edition, per-class coverage rows. */
export function buildClassCoverage() {
  const out = {};
  for (const { id, features, actions } of EDITIONS) {
    out[id] = {};
    for (const className of Object.keys(features).sort()) {
      const levels = features[className] || {};
      const mechanized = [];
      const proseOnly = [];
      const seen = new Set(); // de-dupe features that repeat across levels (e.g. ASI)
      for (let level = 1; level <= 20; level++) {
        for (const feat of levels[level] || []) {
          const key = `${level}:${feat.name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const { mechanized: ok, bucket } = classifyFeature(feat.name, className, id, actions[className]);
          (ok ? mechanized : proseOnly).push({ level, name: feat.name, bucket });
        }
      }
      out[id][className] = { mechanized, proseOnly, total: mechanized.length + proseOnly.length };
    }
  }
  return out;
}

/**
 * Machine-readable coverage totals — the shape the ratchet test + baseline file use.
 * { editions: { '5e': {mechanized,total}, '5.5e': {...} }, overall: {mechanized,total} }
 */
export function coverageTotals() {
  const coverage = buildClassCoverage();
  const totals = { editions: {}, overall: { mechanized: 0, total: 0 } };
  for (const { id } of EDITIONS) {
    const classes = coverage[id];
    const mechanized = Object.values(classes).reduce((s, c) => s + c.mechanized.length, 0);
    const total = Object.values(classes).reduce((s, c) => s + c.total, 0);
    totals.editions[id] = { mechanized, total };
    totals.overall.mechanized += mechanized;
    totals.overall.total += total;
  }
  return totals;
}

function fmt({ level, name, bucket }) {
  return bucket && bucket !== 'prose-only' ? `${name} (L${level}·${bucket})` : `${name} (L${level})`;
}

function report() {
  const coverage = buildClassCoverage();
  console.log('=== Class feature coverage ===');
  console.log('(conservative: only ASI, level-choice pools, and the action-economy map count as');
  console.log(' mechanized. Features wired only in a class config/sheet show as prose-only — an');
  console.log(' intentional under-count. Shrink the TODO lists by mechanizing what they list.)');

  for (const { id } of EDITIONS) {
    const classes = coverage[id];
    const totMech = Object.values(classes).reduce((s, c) => s + c.mechanized.length, 0);
    const totAll = Object.values(classes).reduce((s, c) => s + c.total, 0);
    const pct = totAll ? Math.round((totMech / totAll) * 100) : 0;
    console.log(`\n──────── ${id}: ${totMech}/${totAll} features mechanized (${pct}%) ────────`);
    for (const className of Object.keys(classes)) {
      const c = classes[className];
      const pctC = c.total ? Math.round((c.mechanized.length / c.total) * 100) : 0;
      console.log(`\n  ${className}: ${c.mechanized.length}/${c.total} (${pctC}%)`);
      if (c.mechanized.length) console.log('    mechanized: ' + c.mechanized.map(fmt).join(', '));
      if (c.proseOnly.length) console.log(`    prose-only (${c.proseOnly.length} to do): ` + c.proseOnly.map(fmt).join(', '));
    }
  }
}

/** Rewrite scripts/coverage-baseline.json from the current numbers (intentional ratchet bump). */
function writeBaseline() {
  const totals = coverageTotals();
  const path = new URL('./coverage-baseline.json', import.meta.url);
  writeFileSync(path, `${JSON.stringify(totals, null, 2)}\n`);
  console.log('Wrote coverage-baseline.json:', JSON.stringify(totals.overall));
}

// Print only when run directly (`node …report-class-coverage.mjs`), not when imported by a test.
import { argv } from 'node:process';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  if (argv.includes('--write-baseline')) writeBaseline();
  else report();
}
