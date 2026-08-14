import { describe, it, expect } from 'vitest';
import { getCompanions, echoArmorClass, COMPANIONS } from './companionData';

const echoKnight = (level) => ({
  charClass: 'Fighter', subclass: 'Echo Knight', edition: '5e', level,
});

describe('echoArmorClass', () => {
  it('is 14 + proficiency bonus', () => {
    expect(echoArmorClass(3)).toBe(16);   // PB +2
    expect(echoArmorClass(5)).toBe(17);   // PB +3
    expect(echoArmorClass(17)).toBe(20);  // PB +6
  });
});

describe('getCompanions', () => {
  it('gives an Echo Knight their echo from level 3', () => {
    const [echo] = getCompanions(echoKnight(3));
    expect(echo.name).toBe('Echo');
    expect(echo.source).toBe('Manifest Echo');
    expect(echo.count).toBe(1);
  });

  it('returns nothing below the unlock level', () => {
    expect(getCompanions(echoKnight(2))).toEqual([]);
  });

  it('returns nothing for another Fighter subclass', () => {
    expect(getCompanions({ ...echoKnight(10), subclass: 'Champion' })).toEqual([]);
  });

  it('returns nothing for a character with no subclass', () => {
    expect(getCompanions({ charClass: 'Fighter', subclass: undefined, edition: '5e', level: 10 })).toEqual([]);
  });

  it('returns nothing for a 2024 Fighter — Echo Knight is 5e only', () => {
    expect(getCompanions({ ...echoKnight(10), edition: '5.5e' })).toEqual([]);
  });

  it("computes the echo's AC from the character's level, not a fixed number", () => {
    const ac = (level) => getCompanions(echoKnight(level))[0].stats.find((s) => s.key === 'ac');
    expect(ac(3).breakdown.total).toBe(16);
    expect(ac(17).breakdown.total).toBe(20);
  });

  it('shows the AC arithmetic rather than just the total', () => {
    const ac = getCompanions(echoKnight(5))[0].stats.find((s) => s.key === 'ac');
    expect(ac.breakdown.parts.map((p) => p.value)).toEqual([14, 3]);
  });

  it('carries the echo\'s fixed statblock values', () => {
    const stats = Object.fromEntries(
      getCompanions(echoKnight(3))[0].stats.map((s) => [s.key, s.value]),
    );
    expect(stats.hp).toBe('1');
    expect(stats.size).toBe('Medium');
    expect(stats.duration).toBe('1 minute');
  });

  it('gives two echoes at level 18 (Legion of One), with the plural authored not derived', () => {
    const echo = getCompanions(echoKnight(18))[0];
    expect(echo.count).toBe(2);
    expect(echo.plural).toBe('Echoes');
    expect(echo.countNote).toMatch(/third destroys the previous two/i);
  });

  it('has one echo and no count note at level 17', () => {
    const echo = getCompanions(echoKnight(17))[0];
    expect(echo.count).toBe(1);
    expect(echo.countNote).toBeNull();
  });

  it('adds the Legion of One trait only at level 18', () => {
    const traitKeys = (level) => getCompanions(echoKnight(level))[0].traits.map((t) => t.key);
    expect(traitKeys(17)).not.toContain('legion');
    expect(traitKeys(18)).toContain('legion');
  });

  it('always describes how the companion ends', () => {
    const traits = getCompanions(echoKnight(3))[0].traits;
    expect(traits.map((t) => t.key)).toContain('destroyed');
    expect(traits.find((t) => t.key === 'destroyed').text).toMatch(/30 feet/);
  });
});

describe('COMPANIONS table', () => {
  it('every entry has the fields the resolver and panel require', () => {
    for (const c of COMPANIONS) {
      expect(typeof c.key).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(typeof c.source).toBe('string');
      expect(typeof c.charClass).toBe('string');
      expect(typeof c.minLevel).toBe('number');
      expect(typeof c.count).toBe('function');
      expect(Array.isArray(c.stats(c.minLevel))).toBe(true);
      expect(Array.isArray(c.traits(c.minLevel))).toBe(true);
    }
  });

  it('has unique keys', () => {
    const keys = COMPANIONS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
