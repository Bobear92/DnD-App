import { describe, it, expect } from 'vitest';
import { buildClassCoverage } from './report-class-coverage.mjs';

const coverage = buildClassCoverage();
const find = (edition, cls, name) =>
  [...coverage[edition][cls].mechanized, ...coverage[edition][cls].proseOnly].find((f) => f.name === name);

describe('buildClassCoverage', () => {
  it('covers both editions and all 13 classes', () => {
    expect(Object.keys(coverage).sort()).toEqual(['5.5e', '5e']);
    expect(Object.keys(coverage['5e'])).toHaveLength(13);
    expect(coverage['5e'].Sorcerer).toBeDefined();
    expect(coverage['5e'].Artificer).toBeDefined();
  });

  it('counts total = mechanized + prose-only for every class', () => {
    for (const edition of Object.keys(coverage)) {
      for (const cls of Object.keys(coverage[edition])) {
        const c = coverage[edition][cls];
        expect(c.total).toBe(c.mechanized.length + c.proseOnly.length);
        expect(c.total).toBeGreaterThan(0);
      }
    }
  });

  it('classifies Ability Score Improvement as the asi bucket', () => {
    const asi = find('5e', 'Sorcerer', 'Ability Score Improvement');
    expect(asi.bucket).toBe('asi');
    expect(coverage['5e'].Sorcerer.mechanized).toContainEqual(asi);
  });

  it('classifies a level-choice pool feature (Sorcerer Metamagic) as the choice bucket', () => {
    const mm = coverage['5e'].Sorcerer.mechanized.find((f) => f.name === 'Metamagic' && f.level === 3);
    expect(mm).toBeDefined();
    expect(mm.bucket).toBe('choice');
  });

  it('classifies an action-map feature (Fighter Second Wind) as the action bucket', () => {
    const sw = find('5e', 'Fighter', 'Second Wind');
    expect(sw.bucket).toBe('action');
    expect(coverage['5e'].Fighter.mechanized).toContainEqual(sw);
  });

  it('leaves an unmapped feature (Barbarian Rage) prose-only', () => {
    const rage = find('5e', 'Barbarian', 'Rage');
    expect(rage.bucket).toBe('prose-only');
    expect(coverage['5e'].Barbarian.proseOnly).toContainEqual(rage);
  });

  it('de-dupes a feature repeated at the same level (no double-count)', () => {
    // Every entry within a class is a unique level:name pair.
    for (const edition of Object.keys(coverage)) {
      for (const cls of Object.keys(coverage[edition])) {
        const all = [...coverage[edition][cls].mechanized, ...coverage[edition][cls].proseOnly];
        const keys = all.map((f) => `${f.level}:${f.name}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });
});
