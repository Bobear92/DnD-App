import { describe, it, expect } from 'vitest';
import { getEquipmentFeatures, EQUIPMENT_FEATURES, ITEM_SCOPES } from './equipmentFeatures';

const melee = { uid: 'w1', category: 'weapons', name: 'Longsword', weapon_type: 'Melee' };
const ranged = { uid: 'w2', category: 'weapons', name: 'Longbow', weapon_type: 'Ranged' };
const shield = { uid: 'a1', category: 'armor', name: 'Shield', armor_type: 'Shield' };
const plate = { uid: 'a2', category: 'armor', name: 'Plate', armor_type: 'Heavy' };
const potion = { uid: 'p1', category: 'potions', name: 'Potion of Healing' };

const cavalier = { charClass: 'Fighter', subclass: 'Cavalier', level: 7, edition: '5e', characterData: {} };
const sources = (entry, ctx) => getEquipmentFeatures(entry, ctx).map((f) => f.source);

describe('getEquipmentFeatures — Warding Maneuver', () => {
  it('shows on a melee weapon and on a shield — the two things RAW lets you wield', () => {
    expect(sources(melee, cavalier)).toContain('Warding Maneuver');
    expect(sources(shield, cavalier)).toContain('Warding Maneuver');
  });

  it('does not show on a ranged weapon, body armor, or an unrelated item', () => {
    expect(sources(ranged, cavalier)).not.toContain('Warding Maneuver');
    expect(sources(plate, cavalier)).not.toContain('Warding Maneuver');
    expect(sources(potion, cavalier)).toEqual([]);
  });

  it('is level-gated to 7 and subclass-gated to Cavalier', () => {
    expect(sources(melee, { ...cavalier, level: 6 })).not.toContain('Warding Maneuver');
    expect(sources(melee, { ...cavalier, subclass: 'Champion' })).not.toContain('Warding Maneuver');
    expect(sources(melee, { ...cavalier, charClass: 'Barbarian' })).not.toContain('Warding Maneuver');
  });

  it('states the reaction and its effect, but repeats no use counter', () => {
    const note = getEquipmentFeatures(shield, cavalier).find((f) => f.source === 'Warding Maneuver');
    expect(note.text).toMatch(/reaction/i);
    expect(note.text).toMatch(/d8/);
    expect(note.text).toMatch(/resistance/i);
    // The pool lives on the Action Economy card that spends it — two counters would drift.
    expect(note.text).not.toMatch(/Constitution modifier|per long rest/i);
  });
});

// The table absorbed four notes that used to be hand-written into the row; these guard that
// each still resolves through it, on the same item kinds and with the same test ids.
describe('getEquipmentFeatures — the notes folded into the table', () => {
  it('Savage Attacks on melee weapons only, for a Half-Orc', () => {
    const halfOrc = { characterData: { race_traits: ['Savage Attacks'] } };
    expect(sources(melee, halfOrc)).toContain('Savage Attacks');
    expect(sources(ranged, halfOrc)).not.toContain('Savage Attacks');
    expect(sources(melee, { characterData: {} })).not.toContain('Savage Attacks');
  });

  it('Great Weapon Master on melee weapons only, for the feat holder', () => {
    const gwm = { characterData: { feats: [{ name: 'Great Weapon Master' }] } };
    expect(sources(melee, gwm)).toContain('Great Weapon Master');
    expect(sources(ranged, gwm)).not.toContain('Great Weapon Master');
  });

  it('Eldritch Strike on any weapon for an Eldritch Knight L10+, in violet', () => {
    const ek = { charClass: 'Fighter', subclass: 'Eldritch Knight', level: 10, edition: '5e', characterData: {} };
    expect(sources(melee, ek)).toContain('Eldritch Strike');
    expect(sources(ranged, ek)).toContain('Eldritch Strike');
    expect(sources(shield, ek)).not.toContain('Eldritch Strike'); // a shield is not a weapon
    expect(getEquipmentFeatures(melee, ek).find((f) => f.source === 'Eldritch Strike').tone).toBe('violet');
    expect(sources(melee, { ...ek, level: 9 })).not.toContain('Eldritch Strike');
  });

  it("Remarkable Athlete's move for a 2024 Champion only", () => {
    const champ2024 = { charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e', characterData: {} };
    expect(sources(melee, champ2024)).toContain('Remarkable Athlete');
    expect(sources(melee, { ...champ2024, edition: '5e' })).not.toContain('Remarkable Athlete');
  });
});

describe('getEquipmentFeatures — contract', () => {
  it('returns nothing for a null entry or an empty context', () => {
    expect(getEquipmentFeatures(null, cavalier)).toEqual([]);
    expect(getEquipmentFeatures(melee)).toEqual([]);
  });

  it('stacks every applicable feature on one item', () => {
    const both = {
      charClass: 'Fighter', subclass: 'Cavalier', level: 7, edition: '5e',
      characterData: { race_traits: ['Savage Attacks'], feats: [{ name: 'Great Weapon Master' }] },
    };
    expect(sources(melee, both)).toEqual(['Warding Maneuver', 'Savage Attacks', 'Great Weapon Master']);
  });

  it('every entry declares a testId, a text resolver and known scopes', () => {
    for (const f of EQUIPMENT_FEATURES) {
      expect(f.testId, f.source).toMatch(/^[a-z0-9-]+$/);
      expect(typeof f.text, f.source).toBe('function');
      expect(typeof f.applies, f.source).toBe('function');
      for (const s of f.scopes) expect(ITEM_SCOPES[s], `${f.source} scope ${s}`).toBeTruthy();
    }
  });

  it('test ids are unique, so two notes on one row cannot collide', () => {
    const ids = EQUIPMENT_FEATURES.map((f) => f.testId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('ITEM_SCOPES', () => {
  it('classifies weapons by melee/ranged and armor by shield/body', () => {
    expect(ITEM_SCOPES.meleeWeapon(melee)).toBe(true);
    expect(ITEM_SCOPES.meleeWeapon(ranged)).toBe(false);
    expect(ITEM_SCOPES.rangedWeapon(ranged)).toBe(true);
    expect(ITEM_SCOPES.weapon(melee)).toBe(true);
    expect(ITEM_SCOPES.weapon(shield)).toBe(false);
    expect(ITEM_SCOPES.shield(shield)).toBe(true);
    expect(ITEM_SCOPES.shield(plate)).toBe(false);
    expect(ITEM_SCOPES.bodyArmor(plate)).toBe(true);
    expect(ITEM_SCOPES.bodyArmor(shield)).toBe(false);
  });

  it('detects a finesse weapon from the seeded JSON-string properties field', () => {
    expect(ITEM_SCOPES.finesseWeapon({ category: 'weapons', properties: '["Finesse", "Light"]' })).toBe(true);
    expect(ITEM_SCOPES.finesseWeapon({ category: 'weapons', properties: '["Versatile"]' })).toBe(false);
  });
});
