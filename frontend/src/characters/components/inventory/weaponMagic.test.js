import { describe, it, expect } from 'vitest';
import { magicalAttackSource, MAGIC_ATTACK_SOURCES } from '@/characters/components/inventory/weaponMagic';

const AA = { charClass: 'Fighter', subclass: 'Arcane Archer', level: 7, edition: '5e' };
const LONGBOW = { name: 'Longbow' };
const SHORTBOW = { name: 'Shortbow' };

describe('magicalAttackSource', () => {
  it('names the source rather than returning a bare boolean', () => {
    expect(magicalAttackSource(LONGBOW, AA)).toEqual({
      source: 'Magic Arrow',
      note: expect.stringMatching(/nonmagical attacks and damage/i),
    });
  });

  it('applies to both bows Magic Arrow covers', () => {
    expect(magicalAttackSource(SHORTBOW, AA)?.source).toBe('Magic Arrow');
    expect(magicalAttackSource(LONGBOW, AA)?.source).toBe('Magic Arrow');
  });

  // The whole reason this is asked per weapon: the archer's other weapons stay mundane.
  it('leaves the same character other weapons unmarked', () => {
    expect(magicalAttackSource({ name: 'Dagger' }, AA)).toBeNull();
    expect(magicalAttackSource({ name: 'Longsword' }, AA)).toBeNull();
  });

  // RAW is "an arrow from a shortbow or longbow" — a bolt is not an arrow.
  it('does not cover crossbows', () => {
    expect(magicalAttackSource({ name: 'Heavy Crossbow' }, AA)).toBeNull();
    expect(magicalAttackSource({ name: 'Hand Crossbow' }, AA)).toBeNull();
  });

  it('is gated at the level the feature is gained', () => {
    expect(magicalAttackSource(LONGBOW, { ...AA, level: 6 })).toBeNull();
    expect(magicalAttackSource(LONGBOW, { ...AA, level: 7 })).not.toBeNull();
    expect(magicalAttackSource(LONGBOW, { ...AA, level: 20 })).not.toBeNull();
  });

  it('is gated on the subclass and the class', () => {
    expect(magicalAttackSource(LONGBOW, { ...AA, subclass: 'Champion' })).toBeNull();
    expect(magicalAttackSource(LONGBOW, { ...AA, charClass: 'Ranger' })).toBeNull();
  });

  // Arcane Archer is an XGE (5e) subclass; it has no 2024 feature table.
  it('is gated on the edition', () => {
    expect(magicalAttackSource(LONGBOW, { ...AA, edition: '5.5e' })).toBeNull();
  });

  it('returns null for a missing weapon', () => {
    expect(magicalAttackSource(null, AA)).toBeNull();
    expect(magicalAttackSource(undefined, AA)).toBeNull();
  });

  it('every authored source carries the fields the resolver and the badge need', () => {
    for (const s of MAGIC_ATTACK_SOURCES) {
      expect(typeof s.source).toBe('string');
      expect(typeof s.charClass).toBe('string');
      expect(typeof s.appliesTo).toBe('function');
      expect(typeof s.note).toBe('string');
      expect(s.minLevel).toBeGreaterThanOrEqual(1);
    }
  });
});
