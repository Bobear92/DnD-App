import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: the small helpers everything derives from are each written in ONE place —
 *   • ability modifier, proficiency bonus, signed printers → `characters/components/shared/abilityMath.js`
 *   • the 2024-edition check (`normEdition` / `isEdition2024`) → `characters/components/shared/featureGate.js`
 *
 * They had spread to three exported copies, about fifteen local `mod` / `abMod` / `conMod`
 * helpers and a dozen inline expressions, and the copies disagreed about a missing score (some
 * returned NaN, some 0, one treated an empty input as −5). A new copy is easy to write — it is one
 * line — so this fails the build on any of them and names the helper to import instead.
 *
 * The edition check had the same disease: `normEdition` was defined in seven modules and the
 * two-spelling comparison (`edition === '5.5e' || edition === '2024'`) written inline in a dozen
 * more, while other tables compared the raw string and silently missed a campaign stored as "2024".
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOME = 'characters/components/shared/abilityMath.js';
const GATE_HOME = 'characters/components/shared/featureGate.js';

export const PATTERNS = [
  {
    name: 'ability modifier written out — import abilityMod from shared/abilityMath',
    home: HOME,
    regex: /Math\.floor\(\s*\(+[^;\n]{1,80}?-\s*10\s*\)\s*\/\s*2\s*\)/,
  },
  {
    name: 'proficiency bonus written out — import profBonus from shared/abilityMath',
    home: HOME,
    regex: /Math\.ceil\([^;\n]{1,60}?\/\s*4\s*\)\s*\+\s*1|2\s*\+\s*Math\.floor\(\s*\([^;\n]{1,40}?-\s*1\s*\)\s*\/\s*4\s*\)|Math\.floor\(\s*\([^;\n]{1,40}?-\s*1\s*\)\s*\/\s*4\s*\)\s*\+\s*2/,
  },
  {
    name: 'a second definition of a shared helper — import it from shared/abilityMath',
    home: HOME,
    regex: /(?:function\s+(?:abilityMod|profBonus|formatSigned|formatBonus)\s*\(|(?:const|let|var)\s+(?:abilityMod|profBonus|formatSigned|formatBonus)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/,
  },
  {
    name: '2024-edition check written out — use isEdition2024 / normEdition from shared/featureGate',
    home: GATE_HOME,
    regex: /===\s*'5\.5e'\s*\|\|[^;\n]{1,40}?===\s*'2024'|===\s*'2024'\s*\|\|[^;\n]{1,40}?===\s*'5\.5e'|!==\s*'5\.5e'\s*&&[^;\n]{1,40}?!==\s*'2024'|!==\s*'2024'\s*&&[^;\n]{1,40}?!==\s*'5\.5e'/,
  },
  {
    name: 'a second definition of an edition helper — import it from shared/featureGate',
    home: GATE_HOME,
    regex: /(?:function\s+(?:normEdition|isEdition2024)\s*\(|(?:const|let|var)\s+(?:normEdition|isEdition2024)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/,
  },
];

/** Drop comments so prose that MENTIONS the formula (like this file's header) is not flagged. */
export function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

/** `file:line — what` for every offending line in `source`. */
export function findDuplicateMath(source, label = 'input') {
  const hits = [];
  stripComments(source).split(/\r?\n/).forEach((line, i) => {
    for (const { name, regex, home } of PATTERNS) {
      if (label === home) continue; // the one module allowed to write it
      if (regex.test(line)) hits.push(`${label}:${i + 1} — ${name}`);
    }
  });
  return hits;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name) ? [full] : [];
  });
}

describe('shared helpers are each written in one module', () => {
  const files = walk(SRC).map((f) => [path.relative(SRC, f).replace(/\\/g, '/'), f]);

  it('scans the source tree (a broken walk must fail, not pass vacuously)', () => {
    expect(files.length).toBeGreaterThan(100);
    expect(files.some(([rel]) => rel === HOME)).toBe(true);
    expect(files.some(([rel]) => rel === GATE_HOME)).toBe(true);
  });

  it('no file writes a formula or edition check out, or redefines a helper, outside its home', () => {
    const offenders = files
      .flatMap(([rel, full]) => findDuplicateMath(fs.readFileSync(full, 'utf8'), rel));
    expect(offenders).toEqual([]);
  });

  it('the home modules themselves are what the patterns describe', () => {
    // Scanned under another label (so the home exemption is off): if they stopped matching, the
    // patterns have drifted from the real code and the scan above would pass vacuously.
    const math = findDuplicateMath(fs.readFileSync(path.join(SRC, HOME), 'utf8'), 'elsewhere.js');
    expect(math.some((h) => h.includes('ability modifier'))).toBe(true);
    expect(math.some((h) => h.includes('proficiency bonus'))).toBe(true);
    const gate = findDuplicateMath(fs.readFileSync(path.join(SRC, GATE_HOME), 'utf8'), 'elsewhere.js');
    expect(gate.some((h) => h.includes('2024-edition check'))).toBe(true);
    expect(gate.some((h) => h.includes('edition helper'))).toBe(true);
  });

  it('each home is exempt only from its OWN patterns', () => {
    const line = "const m = Math.floor((score - 10) / 2); const e = edition === '5.5e' || edition === '2024';";
    expect(findDuplicateMath(line, HOME).join(' ')).toMatch(/2024-edition check/);
    expect(findDuplicateMath(line, HOME).join(' ')).not.toMatch(/ability modifier/);
    expect(findDuplicateMath(line, GATE_HOME).join(' ')).toMatch(/ability modifier/);
    expect(findDuplicateMath(line, GATE_HOME).join(' ')).not.toMatch(/2024-edition check/);
  });
});

describe('the detector catches the shapes it guards against', () => {
  it.each([
    ['const m = Math.floor((score - 10) / 2);'],
    ['const m = Math.floor(((score ?? 10) - 10) / 2);'],
    ['const dexMod = Math.floor(((scores.dexterity ?? 10) - 10) / 2);'],
    ['return Math.floor((form.constitution + (asi.constitution ?? 0) - 10) / 2);'],
    ['const m = Math.floor((score-10)/2);'],
    ['const abMod = score => Math.floor(((score ?? 10) - 10) / 2);'],
  ])('ability modifier: %s', (line) => {
    expect(findDuplicateMath(line).join(' ')).toMatch(/ability modifier/);
  });

  it.each([
    ['const pb = Math.ceil(level / 4) + 1;'],
    ['const pb = Math.ceil((Number(level) || 1) / 4) + 1;'],
    ['const pb = 2 + Math.floor((level - 1) / 4);'],
    ['const pb = Math.floor((level - 1) / 4) + 2;'],
  ])('proficiency bonus: %s', (line) => {
    expect(findDuplicateMath(line).join(' ')).toMatch(/proficiency bonus/);
  });

  it.each([
    ['function abilityMod(score) { return lookup[score]; }'],
    ['export const profBonus = (level) => TABLE[level];'],
    ['const formatSigned = n => String(n);'],
    ['export function formatBonus(n) { return n; }'],
  ])('second definition: %s', (line) => {
    expect(findDuplicateMath(line).join(' ')).toMatch(/second definition/);
  });

  it.each([
    ["import { abilityMod, profBonus } from '@/characters/components/shared/abilityMath';"],
    ['const dexMod = abilityMod(scores.dexterity);'],
    ['const pb = profBonus(level);'],
    // A local VALUE that happens to share the name (passiveSkills returns these as fields).
    ['const abilityMod = mod(abilityScores?.[entry.ability]);'],
    ['const profBonus = isExpert ? pb * 2 : isProficient ? pb : 0;'],
    // Unrelated arithmetic that merely looks similar.
    ['const half = Math.floor(level / 2);'],
    ['const recovered = Math.max(1, Math.floor(total / 2));'],
    ['const slots = Math.ceil(level / 2);'],
    ['const tier = Math.ceil(level / 4);'],
    ['const jump = Math.floor((strength - 10) / 4);'],
  ])('leaves alone: %s', (line) => {
    expect(findDuplicateMath(line)).toEqual([]);
  });

  it.each([
    ["const is2024 = edition === '5.5e' || edition === '2024';"],
    ["if (edition === '2024' || edition === '5.5e') {"],
    ["if (campaign?.edition === '5.5e' || campaign?.edition === '2024') return null;"],
    ["const is5e = edition !== '5.5e' && edition !== '2024';"],
  ])('edition check: %s', (line) => {
    expect(findDuplicateMath(line).join(' ')).toMatch(/2024-edition check/);
  });

  it.each([
    ["const normEdition = (edition) => (isNew(edition) ? '5.5e' : '5e');"],
    ['function isEdition2024(edition) { return lookup(edition); }'],
  ])('second edition helper: %s', (line) => {
    expect(findDuplicateMath(line).join(' ')).toMatch(/edition helper/);
  });

  it.each([
    ['const ed = normEdition(edition);'],
    ['if (isEdition2024(edition)) return null;'],
    // A check of ONE spelling is an ordinary comparison, not the two-spelling formula.
    ["if (normEdition(edition) === '5.5e') {"],
    ["const ClassSheet = (edition === '5.5e' ? SHEETS_2024 : SHEETS_5E)[cls];"],
    ['const is2024 = isEdition2024;'],
  ])('leaves alone: %s', (line) => {
    expect(findDuplicateMath(line)).toEqual([]);
  });

  it('ignores a formula that only appears in a comment', () => {
    expect(findDuplicateMath('// was: Math.floor((score - 10) / 2)')).toEqual([]);
    expect(findDuplicateMath('/* Math.ceil(level / 4) + 1 */ const pb = profBonus(level);')).toEqual([]);
    expect(findDuplicateMath('/**\n * old: Math.floor((score - 10) / 2)\n */\nconst x = 1;')).toEqual([]);
  });

  it('still reports code that follows a comment on the same line', () => {
    expect(findDuplicateMath('/* note */ const m = Math.floor((score - 10) / 2);')).toHaveLength(1);
  });

  it('does not mistake a URL for a comment', () => {
    expect(stripComments("const u = 'https://example.test/a';")).toContain('https://example.test/a');
  });

  it('reports the line number', () => {
    expect(findDuplicateMath('const a = 1;\nconst m = Math.floor((s - 10) / 2);', 'x.js')[0]).toMatch(/^x\.js:2 /);
  });
});
