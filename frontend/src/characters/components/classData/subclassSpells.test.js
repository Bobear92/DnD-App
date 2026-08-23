import { describe, it, expect } from 'vitest';
import {
  SUBCLASS_SPELL_GRANTS,
  getSubclassGrantedSpells,
  hasSubclassGrantedSpells,
} from './subclassSpells';

const psiWarrior = (level, edition = '5e') => getSubclassGrantedSpells({
  charClass: 'Fighter', subclass: 'Psi Warrior', level, edition,
});

describe('getSubclassGrantedSpells', () => {
  it('grants Telekinesis to a Psi Warrior at level 18', () => {
    const { leveled } = psiWarrior(18);
    expect(leveled).toHaveLength(1);
    expect(leveled[0].spell).toBe('Telekinesis');
  });

  it('files Telekinesis at its own spell level (5th), not the level it is gained', () => {
    // The tab it lands under is the SPELL's level; 18 is the gate, not the filing.
    expect(psiWarrior(18).leveled[0].level).toBe(5);
  });

  it('does not grant Telekinesis below level 18', () => {
    expect(psiWarrior(17).leveled).toHaveLength(0);
    expect(hasSubclassGrantedSpells({ charClass: 'Fighter', subclass: 'Psi Warrior', level: 17 })).toBe(false);
  });

  it('grants it in BOTH editions — the 2024 revision moves no level', () => {
    expect(psiWarrior(18, '5e').leveled).toHaveLength(1);
    expect(psiWarrior(18, '5.5e').leveled).toHaveLength(1);
    expect(psiWarrior(18, '2024').leveled).toHaveLength(1);
  });

  it('marks the grant at will, with Intelligence, and names the feature responsible', () => {
    const g = psiWarrior(20).leveled[0];
    expect(g.atWill).toBe(true);
    expect(g.ability).toBe('Intelligence');
    expect(g.feature).toBe('Telekinetic Master');
  });

  it('grants nothing to another Fighter subclass at the same level', () => {
    expect(hasSubclassGrantedSpells({ charClass: 'Fighter', subclass: 'Champion', level: 20 })).toBe(false);
    expect(hasSubclassGrantedSpells({ charClass: 'Fighter', subclass: 'Battle Master', level: 20 })).toBe(false);
  });

  it('grants nothing to another class, and nothing with no subclass chosen', () => {
    expect(hasSubclassGrantedSpells({ charClass: 'Wizard', subclass: 'Psi Warrior', level: 20 })).toBe(false);
    expect(hasSubclassGrantedSpells({ charClass: 'Fighter', subclass: null, level: 20 })).toBe(false);
  });

  it('returns both arrays even for an unknown class, so callers need no null check', () => {
    const res = getSubclassGrantedSpells({});
    expect(res.cantrips).toEqual([]);
    expect(res.leveled).toEqual([]);
  });

  it('every authored grant carries the fields the Spells tab renders', () => {
    for (const [cls, subclasses] of Object.entries(SUBCLASS_SPELL_GRANTS)) {
      for (const [sub, grants] of Object.entries(subclasses)) {
        for (const g of grants) {
          const where = `${cls} / ${sub} / ${g.spell}`;
          expect(typeof g.spell, where).toBe('string');
          expect(typeof g.level, where).toBe('number');
          expect(typeof g.minLevel, where).toBe('number');
          expect(typeof g.feature, where).toBe('string');
          expect(g.minLevel, where).toBeGreaterThan(0);
        }
      }
    }
  });
});
