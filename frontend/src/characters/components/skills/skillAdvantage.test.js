import { describe, it, expect } from 'vitest';
import {
  getSkillAdvantages,
  getSkillAdvantageNames,
  skillAdvantageSourcesFor,
  skillAdvantageLegend,
} from '@/characters/components/skills/skillAdvantage';

const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
const bow = { uid: 'w2', category: 'weapons', name: 'Longbow', equipped: false };

const runeKnight = (runeItems = {}, runes = ['Cloud Rune', 'Frost Rune']) => ({
  charClass: 'Fighter',
  subclass: 'Rune Knight',
  level: 7,
  edition: '5e',
  characterData: { subclass: 'Rune Knight', runes, rune_items: runeItems, inventory: [axe, bow] },
});

describe('no sources', () => {
  it('returns nothing for a plain character', () => {
    const ctx = { charClass: 'Wizard', level: 10, edition: '5e', characterData: {} };
    expect(getSkillAdvantages(ctx)).toEqual([]);
    expect(getSkillAdvantageNames(ctx)).toEqual([]);
    expect(skillAdvantageLegend(ctx)).toBeNull();
  });
});

describe('Remarkable Athlete (the source this table absorbed)', () => {
  const champion = (level, edition) => ({
    charClass: 'Fighter', subclass: 'Champion', level, edition, characterData: {},
  });

  it('gives a 2024 Champion advantage on Athletics from level 3', () => {
    expect(getSkillAdvantageNames(champion(3, '5.5e'))).toEqual(['Athletics']);
  });

  it('gives nothing below level 3', () => {
    expect(getSkillAdvantageNames(champion(2, '5.5e'))).toEqual([]);
  });

  it('gives a 5e Champion NOTHING — its version is a numeric half-PB bonus, not advantage', () => {
    expect(getSkillAdvantageNames(champion(7, '5e'))).toEqual([]);
  });

  it('keeps the legend wording the sheet already showed', () => {
    expect(skillAdvantageLegend(champion(3, '5.5e'))).toBe('Teal = advantage (Remarkable Athlete)');
  });
});

describe('Rune Carving', () => {
  it('grants nothing for a rune that is merely known', () => {
    expect(getSkillAdvantageNames(runeKnight())).toEqual([]);
  });

  it('grants both of a carved rune\'s skills once the bearing item is equipped', () => {
    expect(getSkillAdvantageNames(runeKnight({ 'Cloud Rune': 'w1' })))
      .toEqual(['Sleight of Hand', 'Deception']);
  });

  it('grants nothing while the bearing item is unequipped', () => {
    expect(getSkillAdvantageNames(runeKnight({ 'Cloud Rune': 'w2' }))).toEqual([]);
  });

  it('names the rune and the item it is carved on', () => {
    const [adv] = getSkillAdvantages(runeKnight({ 'Cloud Rune': 'w1' }));
    expect(adv).toMatchObject({ skill: 'Sleight of Hand', source: 'Cloud Rune', note: 'Carved on Battleaxe' });
  });

  it('combines two carved runes', () => {
    const ctx = runeKnight({ 'Cloud Rune': 'w1', 'Frost Rune': 'w1' });
    // One rune per object, so carving Frost onto the axe is only possible via the patch helper;
    // here both are mapped to prove the resolver unions rather than picks one.
    expect(getSkillAdvantageNames(ctx))
      .toEqual(['Sleight of Hand', 'Deception', 'Animal Handling', 'Intimidation']);
  });

  it('grants nothing for a rune with no skills (Fire is a tool bonus)', () => {
    const ctx = runeKnight({ 'Fire Rune': 'w1' }, ['Fire Rune']);
    expect(getSkillAdvantageNames(ctx)).toEqual([]);
  });

  it('lists both sources in the legend when a rune and a subclass feature are both live', () => {
    const ctx = {
      charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e',
      characterData: {
        subclass: 'Rune Knight', runes: ['Cloud Rune'], rune_items: { 'Cloud Rune': 'w1' },
        inventory: [axe],
      },
    };
    expect(skillAdvantageLegend(ctx)).toBe('Teal = advantage (Remarkable Athlete & Cloud Rune)');
  });
});

describe('skillAdvantageSourcesFor', () => {
  it('returns only the sources for the named skill', () => {
    const ctx = runeKnight({ 'Cloud Rune': 'w1' });
    expect(skillAdvantageSourcesFor('Deception', ctx).map((a) => a.source)).toEqual(['Cloud Rune']);
    expect(skillAdvantageSourcesFor('Athletics', ctx)).toEqual([]);
  });
});

// Giant's Might grants advantage on Strength CHECKS — the whole ability, not a named skill —
// so the source fans an ability out to every skill keyed off it. Before this, switching the
// effect on changed the damage die and the size and left Athletics looking untouched.
describe("active effects (Rune Knight Giant's Might)", () => {
  const runeKnight = ({ level = 3, active = ['giants_might'], edition = '5e' } = {}) => ({
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    level,
    edition,
    characterData: { subclass: 'Rune Knight', active_effects: active },
  });

  it('grants advantage on the Strength skill while the effect is switched on', () => {
    expect(getSkillAdvantageNames(runeKnight())).toEqual(['Athletics']);
  });

  it('grants nothing while the effect is switched off, though the feature is earned', () => {
    expect(getSkillAdvantageNames(runeKnight({ active: [] }))).toEqual([]);
    expect(skillAdvantageLegend(runeKnight({ active: [] }))).toBeNull();
  });

  it('grants nothing before the feature is earned, even with the key set', () => {
    expect(getSkillAdvantageNames(runeKnight({ level: 2 }))).toEqual([]);
  });

  it('names the effect as the source, so the tag says what it came from', () => {
    expect(skillAdvantageSourcesFor('Athletics', runeKnight()).map((a) => a.source))
      .toEqual(["Giant's Might"]);
    expect(skillAdvantageLegend(runeKnight())).toBe("Teal = advantage (Giant's Might)");
  });

  it('leaves skills of other abilities alone', () => {
    expect(skillAdvantageSourcesFor('Stealth', runeKnight())).toEqual([]);
    expect(skillAdvantageSourcesFor('Perception', runeKnight())).toEqual([]);
  });

  it('does not reach another subclass that happens to carry the key', () => {
    expect(getSkillAdvantageNames({
      charClass: 'Fighter', subclass: 'Champion', level: 10, edition: '5e',
      characterData: { subclass: 'Champion', active_effects: ['giants_might'] },
    })).toEqual([]);
  });
});
