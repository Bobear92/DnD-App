/**
 * The features that fire when you attack WITH a weapon you hold — Savage Attacks, Great Weapon
 * Master's bonus attack, Eldritch Strike, Remarkable Athlete's move — are defined ONCE, in
 * EQUIPMENT_FEATURES, and shown on two surfaces: the item's row in the Items tab and the attack's
 * card in the Action Economy tab.
 *
 * They used to be authored twice — a table row for the Items tab, plus a bespoke field on every
 * weapon entry (`savageAttacksNote`, `greatWeaponMasterNote`, `eldritchStrikeNote`,
 * `remarkableMoveNote`) with its own render branch in the tab. These tests pin the single
 * definition: the same character sees the same text on both surfaces, on the same weapons.
 */
import { describe, it, expect } from 'vitest';
import { buildActionEconomy, ATTACK_RIDERS } from '@/characters/components/combat/actionEconomyData';
import {
  EQUIPMENT_FEATURES, attackCardFeatures, getEquipmentFeatures,
} from '@/characters/components/inventory/equipmentFeatures';

const SHARED = ['Savage Attacks', 'Great Weapon Master', 'Eldritch Strike', 'Remarkable Athlete'];

const longsword = { uid: 'w1', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' };
const longbow = { uid: 'w2', name: 'Longbow', category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Ammunition", "Two-Handed"]' };
const GWM = { name: 'Great Weapon Master' };

const build = ({ level = 10, edition = '5e', subclass, characterData = {}, weapons = [longsword] } = {}) => buildActionEconomy({
  charClass: 'Fighter', subclass, level, edition, characterData,
  inventory: weapons,
  attacks: weapons.map((w) => ({ uid: w.uid, name: w.name, toHit: '+5', damage: '1d8 + 3 slashing', proficient: true })),
  scores: { strength: 16 },
  spellIndex: {},
});
const card = (ec, name) => ec.action.find((e) => e.name === name);
const riderSources = (entry) => (entry?.riders ?? []).map((r) => r.source);
const riderText = (entry, source) => (entry?.riders ?? []).find((r) => r.source === source)?.text ?? null;

describe('attackCardFeatures — the rows that ride on attack cards', () => {
  it('is exactly the four shared features', () => {
    expect(attackCardFeatures().map((r) => r.source).sort()).toEqual([...SHARED].sort());
  });

  it('leaves out equipment features that are not attack riders', () => {
    const sources = attackCardFeatures().map((r) => r.source);
    // A reaction with a card of its own, and an armor benefit.
    expect(sources).not.toContain('Warding Maneuver');
    expect(sources).not.toContain('Heavy Armor Master');
  });

  it('returns rows in the ATTACK_RIDERS shape', () => {
    for (const row of attackCardFeatures()) {
      expect(typeof row.source).toBe('string');
      expect(['weapon', 'meleeWeapon']).toContain(row.scope);
      expect(typeof row.text).toBe('function');
      expect(row.fromEquipmentFeature).toBe(true);
    }
  });

  it('scopes each feature to the same weapons on both surfaces', () => {
    // The item scope a row declares for the Items tab includes the scope it rides attacks with.
    for (const feature of EQUIPMENT_FEATURES.filter((f) => f.attackScope)) {
      expect(feature.scopes, feature.source).toContain(feature.attackScope);
    }
  });

  it('ATTACK_RIDERS includes them, each exactly once', () => {
    for (const source of SHARED) {
      expect(ATTACK_RIDERS.filter((r) => r.source === source), source).toHaveLength(1);
    }
  });

  it('no rider source is defined twice', () => {
    const sources = ATTACK_RIDERS.map((r) => r.source);
    expect(new Set(sources).size).toBe(sources.length);
  });
});

describe('one definition, two surfaces — the same text on the item row and the attack card', () => {
  const cases = [
    ['Savage Attacks', { characterData: { race_traits: ['Savage Attacks'] } }],
    ['Great Weapon Master', { characterData: { feats: [GWM] } }],
    ['Eldritch Strike', { subclass: 'Eldritch Knight', level: 10 }],
    ['Remarkable Athlete', { subclass: 'Champion', level: 3, edition: '5.5e' }],
  ];

  it.each(cases)('%s', (source, opts) => {
    const ctx = { charClass: 'Fighter', level: 10, edition: '5e', characterData: {}, ...opts };
    const onItem = getEquipmentFeatures(longsword, ctx).find((f) => f.source === source);
    const onCard = riderText(card(build(opts), 'Longsword'), source);
    expect(onItem?.text, 'the Items-tab note').toBeTruthy();
    expect(onCard, 'the attack-card rider').toBe(onItem.text);
  });

  it.each(cases)('%s is on neither surface for a character without it', (source) => {
    const plain = { charClass: 'Fighter', subclass: 'Battle Master', level: 10, edition: '5e', characterData: {} };
    expect(getEquipmentFeatures(longsword, plain).map((f) => f.source)).not.toContain(source);
    expect(riderSources(card(build({ subclass: 'Battle Master' }), 'Longsword'))).not.toContain(source);
  });
});

describe('rider scopes — which attack cards a feature lands on', () => {
  it("'meleeWeapon': Savage Attacks and Great Weapon Master ride a melee weapon, not a bow", () => {
    const ec = build({ characterData: { race_traits: ['Savage Attacks'], feats: [GWM] }, weapons: [longsword, longbow] });
    expect(riderSources(card(ec, 'Longsword'))).toEqual(expect.arrayContaining(['Savage Attacks', 'Great Weapon Master']));
    expect(riderSources(card(ec, 'Longbow'))).not.toContain('Savage Attacks');
    expect(riderSources(card(ec, 'Longbow'))).not.toContain('Great Weapon Master');
  });

  it("'weapon': Eldritch Strike rides ANY real weapon, melee or ranged", () => {
    const ec = build({ subclass: 'Eldritch Knight', level: 10, weapons: [longsword, longbow] });
    expect(riderSources(card(ec, 'Longsword'))).toContain('Eldritch Strike');
    expect(riderSources(card(ec, 'Longbow'))).toContain('Eldritch Strike');
  });

  it('none of the four ride an unarmed strike — it is not a weapon', () => {
    const ec = build({
      subclass: 'Eldritch Knight', level: 10, weapons: [],
      characterData: { race_traits: ['Savage Attacks'], feats: [GWM] },
    });
    const unarmed = card(ec, 'Unarmed Strike');
    expect(unarmed).toBeTruthy();
    for (const source of SHARED) expect(riderSources(unarmed), source).not.toContain(source);
  });

  it("a 'melee' rider still lands on an unarmed strike, unlike a 'meleeWeapon' one", () => {
    // Unwavering Mark keys on a melee ATTACK; Savage Attacks on a melee WEAPON.
    const ec = build({ subclass: 'Cavalier', level: 3, weapons: [], characterData: { race_traits: ['Savage Attacks'] } });
    const unarmed = card(ec, 'Unarmed Strike');
    expect(riderSources(unarmed)).toContain('Unwavering Mark');
    expect(riderSources(unarmed)).not.toContain('Savage Attacks');
  });

  it('marks each weapon card with whether it is a real melee weapon', () => {
    const ec = build({ weapons: [longsword, longbow] });
    expect(card(ec, 'Longsword').meleeWeapon).toBe(true);
    expect(card(ec, 'Longbow').meleeWeapon).toBe(false);
    expect(card(build({ weapons: [] }), 'Unarmed Strike').meleeWeapon).toBe(false);
  });
});

describe('gating still holds once the notes are riders', () => {
  it('Eldritch Strike arrives at 10th, not before', () => {
    expect(riderSources(card(build({ subclass: 'Eldritch Knight', level: 9 }), 'Longsword'))).not.toContain('Eldritch Strike');
    expect(riderSources(card(build({ subclass: 'Eldritch Knight', level: 10 }), 'Longsword'))).toContain('Eldritch Strike');
  });

  it("Remarkable Athlete's move is the 2024 Champion's only", () => {
    expect(riderSources(card(build({ subclass: 'Champion', level: 3, edition: '5.5e' }), 'Longsword'))).toContain('Remarkable Athlete');
    expect(riderSources(card(build({ subclass: 'Champion', level: 3, edition: '2024' }), 'Longsword'))).toContain('Remarkable Athlete');
    expect(riderSources(card(build({ subclass: 'Champion', level: 3, edition: '5e' }), 'Longsword'))).not.toContain('Remarkable Athlete');
    expect(riderSources(card(build({ subclass: 'Battle Master', level: 3, edition: '5.5e' }), 'Longsword'))).not.toContain('Remarkable Athlete');
  });

  it('several features stack on one card, each as its own rider', () => {
    const ec = build({
      subclass: 'Eldritch Knight', level: 10,
      characterData: { race_traits: ['Savage Attacks'], feats: [GWM] },
    });
    const sources = riderSources(card(ec, 'Longsword'));
    expect(sources).toEqual(expect.arrayContaining(['Savage Attacks', 'Great Weapon Master', 'Eldritch Strike']));
    expect(new Set(sources).size).toBe(sources.length);
  });

  it('a rider never has empty text', () => {
    const ec = build({
      subclass: 'Eldritch Knight', level: 10, weapons: [longsword, longbow],
      characterData: { race_traits: ['Savage Attacks'], feats: [GWM] },
    });
    for (const entry of ec.action) {
      for (const rider of entry.riders ?? []) expect(rider.text, `${entry.name} › ${rider.source}`).toBeTruthy();
    }
  });
});

describe('the bespoke note fields are gone', () => {
  it('no entry carries the four old per-note fields', () => {
    const ec = build({
      subclass: 'Eldritch Knight', level: 10,
      characterData: { race_traits: ['Savage Attacks'], feats: [GWM] },
    });
    const all = Object.values(ec).filter(Array.isArray).flat();
    expect(all.length).toBeGreaterThan(5);
    for (const entry of all) {
      for (const field of ['savageAttacksNote', 'greatWeaponMasterNote', 'eldritchStrikeNote', 'remarkableMoveNote']) {
        expect(entry, `${entry.name} still has ${field}`).not.toHaveProperty(field);
      }
    }
  });

  it('the notes that are NOT rules text stay where they were', () => {
    // Crit range is a number on the card, not a rider.
    const champion = card(build({ subclass: 'Champion', level: 3 }), 'Longsword');
    expect(champion.critRange).toBe('19–20');
    expect(riderSources(champion)).not.toContain('Improved Critical');
  });
});
