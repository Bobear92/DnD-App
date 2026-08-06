import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: no user-facing text may tag a feature with the level it was gained, e.g.
 * "Arcane Charge (L15)", "Tactical Mind (L2)", "Improved War Magic, L18".
 *
 * Every surface that shows a feature already only shows it once the character HAS it —
 * class sheets level-gate their blocks, `notes` entries carry `minLevel`, and the Action
 * Economy tab lists what you can do right now. So the annotation is redundant, and it reads
 * as clutter on a sheet the player is scanning mid-combat.
 *
 * Write the level into a level gate, not into the label. Where the level genuinely IS the
 * information (a not-yet-unlocked placeholder, a progression list), spell it out in words —
 * "Level 2+", "7th at 13" — rather than the terse L-number form.
 *
 * Lives in the test suite rather than ESLint for the same reason as noNestedComponents:
 * `npx eslint .` reports hundreds of pre-existing errors, so a lint rule would go unread,
 * while `npm test` is enforced by the Stop hook and CI.
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// "L" + digits used as a level tag: (L15), , L18), "L2+". Requires a non-word char before the
// L so identifiers like WARLOCK_SPELLS_L1_2024 and SVG path data ("M32 8L40 24") don't match.
const LEVEL_TAG = /(?:^|[^A-Za-z0-9_])L\d+\b/;

// Lines that are comments — developer-facing, so a level reference there is fine and often useful.
const COMMENT = /^\s*(?:\/\/|\/\*|\*)/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(e.name) && !/\.test\.(js|jsx)$/.test(e.name) ? [full] : [];
  });
}

/** True when a line renders an L-number to the user (in a string literal or as JSX text). */
export function hasRenderedLevelTag(line) {
  if (COMMENT.test(line)) return false;
  // Strip SVG path data — coordinate pairs like "M32 8L40 24H56" are not level tags.
  const cleaned = line.replace(/\sd=\{?["'][^"']*["']\}?/g, '');
  if (!LEVEL_TAG.test(cleaned)) return false;
  // Must appear in a quoted string or as JSX text between tags to be user-visible.
  const inString = /(['"`])[^'"`]*(?:^|[^A-Za-z0-9_])L\d+\b[^'"`]*\1/.test(cleaned);
  const inJsxText = />[^<>{]*(?:^|[^A-Za-z0-9_])L\d+\b/.test(cleaned);
  return inString || inJsxText;
}

function findLevelTags(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  return lines.flatMap((line, i) =>
    (hasRenderedLevelTag(line) ? [`${path.relative(SRC, file)}:${i + 1}  ${line.trim()}`] : []));
}

describe('no level annotations in user-facing text', () => {
  // A guard that cannot fail is worthless — prove the detector fires on the real offenders
  // this rule was written for, and stays quiet on the things that legitimately contain "L<n>".
  it('detects the level tags this rule exists to catch', () => {
    [
      "      surge.detail += ' Arcane Charge (L15): when you use Action Surge…';",
      "    { label: 'Tactical Mind (L2)', text: 'When you fail an ability check…', minLevel: 2 },",
      "        detail: `Cast a spell (Improved War Magic, L18) with your action`,",
      '          <span className="font-medium text-foreground">Wild Resurgence (L5)</span>',
      "          <div className=\"font-bold text-lg\">{level >= 2 ? wildShapeMaxCR(level) : 'L2+'}</div>",
      "      <Field label=\"Divine Order (L1)\">",
    ].forEach((line) => expect(hasRenderedLevelTag(line), line).toBe(true));
  });

  it('does not flag identifiers, SVG path data, or developer comments', () => {
    [
      '  // Eldritch Knight\'s Eldritch Strike (L10) — an on-hit weapon-attack rider',
      '   * four "any school" slots over 20 levels. (At L3 the EK learns three 1st-level',
      '        <SpellPickerCreation limit={2} options={WARLOCK_SPELLS_L1_2024} />',
      '  const WIZARD_L1_SPELLS_5E = [];',
      '                <path d="M32 8L40 24H56L44 36L48 52L32 42L16 52L20 36L8 24H24L32 8Z" />',
      "    { label: 'Tactical Mind', text: 'When you fail an ability check…', minLevel: 2 },",
    ].forEach((line) => expect(hasRenderedLevelTag(line), line).toBe(false));
  });

  it('never labels a feature with the level it was gained', () => {
    const offenders = walk(SRC).flatMap(findLevelTags);
    expect(
      offenders,
      `Found level tags in rendered text. Level-gate the feature (or write the level in words) `
      + `instead of labelling it:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
