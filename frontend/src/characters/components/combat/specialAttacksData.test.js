import { describe, it, expect } from 'vitest';
import {
  oneSizeLarger, sizeLimitNote, specialMeleeAttacks, specialAttackEntries,
} from './specialAttacksData';

describe('oneSizeLarger', () => {
  it('steps up one size on the track', () => {
    expect(oneSizeLarger('Small')).toBe('Medium');
    expect(oneSizeLarger('Medium')).toBe('Large');
    expect(oneSizeLarger('Large')).toBe('Huge');
    expect(oneSizeLarger('Huge')).toBe('Gargantuan');
  });

  // Nothing is bigger than Gargantuan, so the limit stops rather than running off the end.
  it('stops at Gargantuan', () => {
    expect(oneSizeLarger('Gargantuan')).toBe('Gargantuan');
  });

  it('falls back to the top of the track for an unknown size', () => {
    expect(oneSizeLarger('Enormous')).toBe('Gargantuan');
  });
});

describe('sizeLimitNote', () => {
  it("names the character's own size first, then what it reaches", () => {
    expect(sizeLimitNote('Medium', 'grapple'))
      .toBe('You are Medium — you can grapple a creature up to Large.');
  });

  // The whole point of computing this: Giant's Might makes you Large and the ceiling moves itself.
  it('moves the ceiling when the character is larger', () => {
    expect(sizeLimitNote('Large', 'grapple'))
      .toBe('You are Large — you can grapple a creature up to Huge.');
    expect(sizeLimitNote('Huge', 'shove'))
      .toBe('You are Huge — you can shove a creature up to Gargantuan.');
  });

  it('uses the verb it is given, so a Shove card never says "grapple"', () => {
    expect(sizeLimitNote('Small', 'shove'))
      .toBe('You are Small — you can shove a creature up to Medium.');
  });

  it('says "any size" at the top of the track rather than naming Gargantuan twice', () => {
    expect(sizeLimitNote('Gargantuan', 'grapple'))
      .toBe('You are Gargantuan — you can grapple a creature of any size.');
  });
});

describe('specialMeleeAttacks', () => {
  it('offers Grapple and Shove in both editions', () => {
    for (const ed of ['5e', '5.5e']) {
      expect(specialMeleeAttacks(ed).map((a) => a.name)).toEqual(['Grapple', 'Shove']);
    }
  });

  // 2014 resolves the attempt with a contested check; 2024 with a save against your own DC. That
  // difference is the reason the page carries an edition toggle.
  it('resolves 2014 as a contested Athletics check', () => {
    const g = specialMeleeAttacks('5e').find((a) => a.name === 'Grapple');
    expect(g.detail).toMatch(/contested by/i);
    expect(g.detail).toMatch(/Athletics/);
    expect(g.detail).not.toMatch(/saving throw/i);
  });

  it('resolves 2024 as a saving throw against your Unarmed Strike DC', () => {
    const g = specialMeleeAttacks('5.5e').find((a) => a.name === 'Grapple');
    expect(g.detail).toMatch(/saving throw/i);
    expect(g.detail).toMatch(/Unarmed Strike/i);
    expect(g.detail).not.toMatch(/contested/i);
  });

  it('treats "2024" as an alias for 5.5e', () => {
    expect(specialMeleeAttacks('2024')).toEqual(specialMeleeAttacks('5.5e'));
  });

  it('says each replaces an attack rather than costing an action of its own', () => {
    expect(specialMeleeAttacks('5e').every((a) => /Attack action/.test(a.detail))).toBe(true);
    expect(specialMeleeAttacks('5.5e').every((a) => /Attack action/.test(a.detail))).toBe(true);
  });
});

describe('specialAttackEntries', () => {
  const byName = (entries, name) => entries.find((e) => e.name === name);

  it('keys the entries into the universal namespace so a rider can target them', () => {
    expect(specialAttackEntries().map((e) => e.key))
      .toEqual(['universal:Grapple', 'universal:Shove']);
  });

  // Filing them as "action" would say you must choose between grappling and attacking.
  it('badges the cost as replacing one attack, not as an action', () => {
    expect(specialAttackEntries().every((e) => e.cost === 'replaces one attack')).toBe(true);
  });

  it('carries a size note per entry, each using its own verb', () => {
    const e = specialAttackEntries({ size: 'Medium' });
    expect(byName(e, 'Grapple').sizeNote).toMatch(/grapple a creature up to Large/);
    expect(byName(e, 'Shove').sizeNote).toMatch(/shove a creature up to Large/);
  });

  it('raises the limit for a Large character without naming the effect that grew them', () => {
    const e = specialAttackEntries({ size: 'Large' });
    expect(byName(e, 'Grapple').sizeNote).toMatch(/up to Huge/);
    expect(byName(e, 'Grapple').sizeNote).not.toMatch(/Giant/i);
  });

  // RAW a grapple needs a free hand. A shove does not in 2014, but does in 2024, where it is an
  // Unarmed Strike option.
  it('warns about a full grip only where the edition requires a free hand', () => {
    const full5e = specialAttackEntries({ handFree: false, edition: '5e' });
    expect(byName(full5e, 'Grapple').warning).toMatch(/free hand/);
    expect(byName(full5e, 'Shove').warning).toBeNull();

    const full2024 = specialAttackEntries({ handFree: false, edition: '5.5e' });
    expect(byName(full2024, 'Grapple').warning).toMatch(/free hand/);
    expect(byName(full2024, 'Shove').warning).toMatch(/free hand/);
  });

  it('warns nobody while a hand is free', () => {
    expect(specialAttackEntries({ handFree: true, edition: '5.5e' })
      .every((e) => e.warning === null)).toBe(true);
  });

  it('points every entry at the special-attacks mechanics page', () => {
    expect(specialAttackEntries().every((e) => e.mechanicsSlug === 'special-attacks')).toBe(true);
  });
});
