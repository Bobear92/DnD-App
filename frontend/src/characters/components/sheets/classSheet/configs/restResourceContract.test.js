/**
 * Rest resources — frontend/backend contract.
 *
 * A rest tracker row on a class config (`restResources`) only SPENDS a counter; the backend's
 * `_REST_RESOURCES` table is what gives it back on a rest. The two are written in different
 * languages, so they are checked against each other through a committed snapshot of the backend
 * table: backend/tests/fixtures/rest_resources_contract.json (pytest fails if that file is stale).
 *
 * What this catches: a tracker whose counter no rest ever resets, one labelled for the wrong rest
 * type, one the backend only starts resetting at a LATER level than the sheet shows it, and a
 * racial table that has drifted from its backend mirror.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CONFIGS } from './index';
import { RACIAL_REST_RESOURCES } from '@/characters/components/race/racialRestResources';

const FIXTURE = path.resolve(process.cwd(), '../backend/tests/fixtures/rest_resources_contract.json');
const CONTRACT = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8'));

const includesOrAny = (list, value) => list == null || list.includes(value);

/** Problems with one frontend rest row, checked against the backend rows. [] = in agreement. */
export function restRowProblems(row, { charClass, edition }, contract = CONTRACT) {
  const where = `${charClass} ${edition} › ${row.key}`;
  const matching = contract.class_resources.filter((spec) => (
    spec.keys.includes(row.key)
    && includesOrAny(spec.char_class, charClass)
    && (spec.edition == null || spec.edition === edition)
    // A backend row scoped to a subclass only covers a frontend row scoped to that subclass.
    && (spec.subclass == null || (row.subclass != null && spec.subclass.includes(row.subclass)))
  ));
  if (matching.length === 0) {
    return [`${where}: no backend _REST_RESOURCES row resets this counter — no rest will ever give it back`];
  }
  const problems = [];
  // A 'short' backend row also fires on a long rest, so any short row makes the resource short.
  const backendRecharge = matching.some((spec) => spec.recharge === 'short') ? 'short' : 'long';
  if (backendRecharge !== row.recharge) {
    problems.push(`${where}: sheet says it recharges on a ${row.recharge} rest, backend resets it on a ${backendRecharge} rest`);
  }
  const backendMinLevel = Math.min(...matching.filter((spec) => spec.recharge === backendRecharge).map((spec) => spec.min_level));
  // Earlier on the backend is harmless (it zeroes a counter nobody can spend yet); LATER means
  // the sheet shows a pool the rest does not yet restore.
  if (backendMinLevel > (row.minLevel ?? 1)) {
    problems.push(`${where}: sheet shows it from level ${row.minLevel ?? 1}, backend only resets it from level ${backendMinLevel}`);
  }
  return problems;
}

const liveRows = [];
for (const [edition, classes] of Object.entries(CONFIGS)) {
  for (const [charClass, config] of Object.entries(classes)) {
    for (const row of config.restResources ?? []) liveRows.push({ row, charClass, edition });
  }
}

describe('rest resource contract — class configs vs the backend table', () => {
  it('the contract fixture and the live registry are both populated', () => {
    expect(CONTRACT.class_resources.length).toBeGreaterThan(20);
    expect(liveRows.length).toBeGreaterThan(20);
  });

  it.each(liveRows.map((r) => [`${r.charClass} ${r.edition} › ${r.row.key}`, r]))(
    '%s is reset by the backend, on the same rest',
    (_name, { row, charClass, edition }) => {
      expect(restRowProblems(row, { charClass, edition })).toEqual([]);
    },
  );

  it('every rest row declares a recharge the backend understands', () => {
    for (const { row } of liveRows) expect(['short', 'long']).toContain(row.recharge);
  });
});

describe('rest resource contract — the checker itself', () => {
  const ctx = { charClass: 'Fighter', edition: '5e' };

  it('flags a counter the backend never resets', () => {
    const problems = restRowProblems({ key: 'made_up_used', recharge: 'short', minLevel: 1 }, ctx);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/no backend _REST_RESOURCES row/);
  });

  it('flags a sheet row labelled for the wrong rest type', () => {
    const problems = restRowProblems({ key: 'indomitable_used', recharge: 'short', minLevel: 9 }, ctx);
    expect(problems.join(' ')).toMatch(/short rest, backend resets it on a long rest/);
  });

  it('flags a pool the sheet shows before the backend starts resetting it', () => {
    const problems = restRowProblems({ key: 'indomitable_used', recharge: 'long', minLevel: 5 }, ctx);
    expect(problems.join(' ')).toMatch(/from level 5, backend only resets it from level 9/);
  });

  it('accepts a backend row that starts EARLIER than the sheet row', () => {
    // Channel Rune: the backend zeroes all six rune counters from 3rd; the Hill rune's row
    // appears at 7th. Resetting a counter nobody can spend yet is harmless.
    expect(restRowProblems(
      { key: 'channel_rune_hill_used', recharge: 'short', minLevel: 7, subclass: 'Rune Knight' }, ctx,
    )).toEqual([]);
  });

  it('flags a subclass pool shown to the whole class', () => {
    // The backend resets Fighting Spirit for a Samurai only; a row with no subclass gate would
    // put a tracker on every Fighter that no rest restores.
    const problems = restRowProblems({ key: 'fighting_spirit_used', recharge: 'long', minLevel: 3 }, ctx);
    expect(problems[0]).toMatch(/no backend _REST_RESOURCES row/);
  });

  it('flags a pool attributed to the wrong subclass', () => {
    const problems = restRowProblems(
      { key: 'fighting_spirit_used', recharge: 'long', minLevel: 3, subclass: 'Cavalier' }, ctx,
    );
    expect(problems[0]).toMatch(/no backend _REST_RESOURCES row/);
  });

  it('flags an edition-only backend row used by the other edition', () => {
    const problems = restRowProblems(
      { key: 'memorize_spell_used', recharge: 'long', minLevel: 1 }, { charClass: 'Wizard', edition: '5e' },
    );
    expect(problems[0]).toMatch(/no backend _REST_RESOURCES row/);
  });

  it('flags a key that belongs to another class', () => {
    const problems = restRowProblems(
      { key: 'rages_used', recharge: 'long', minLevel: 1 }, ctx,
    );
    expect(problems[0]).toMatch(/no backend _REST_RESOURCES row/);
  });
});

describe('rest resource contract — racial resources', () => {
  const shape = (rows) => rows
    .map((r) => `${r.trait}|${r.key}|${r.recharge}|${r.min_level ?? r.minLevel}`)
    .sort();

  it('the frontend racial table and the backend mirror list the same resources', () => {
    expect(CONTRACT.racial_resources.length).toBeGreaterThan(0);
    expect(shape(RACIAL_REST_RESOURCES)).toEqual(shape(CONTRACT.racial_resources));
  });
});
