/**
 * Maximum HP — frontend/backend parity.
 *
 * The sheet computes max HP at display time (`effectiveMaxHp`); the backend has to compute the
 * same number to restore HP on a long rest (`service._effective_max_hp`). Two implementations of
 * one rule drift, so both run the SAME cases from backend/tests/fixtures/max_hp_cases.json — add a
 * case there and both suites pick it up. (The backend used to read a stored `hp_max` that nothing
 * writes any more, so a long rest silently restored nobody.)
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { effectiveMaxHp } from './combatBonuses';

const FIXTURE = path.resolve(process.cwd(), '../backend/tests/fixtures/max_hp_cases.json');
const { cases } = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8'));

const conMod = (score) => Math.floor(((score ?? 10) - 10) / 2);

describe('effectiveMaxHp — shared fixture with the backend long-rest restore', () => {
  it('the fixture is not empty (a moved file must fail, not pass vacuously)', () => {
    expect(cases.length).toBeGreaterThan(10);
  });

  it.each(cases.map((c) => [c.name, c]))('%s', (_name, c) => {
    const cd = c.character_data;
    const result = effectiveMaxHp(cd, {
      level: c.level,
      conMod: conMod(c.constitution),
      charClass: c.char_class,
      subclass: cd.subclass,
      raceTraits: cd.race_traits ?? [],
      feats: cd.feats ?? [],
    });
    expect(result).toBe(c.expected);
  });
});
