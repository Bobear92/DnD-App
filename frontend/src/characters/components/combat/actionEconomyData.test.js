import { describe, it, expect } from 'vitest';
import {
  classifyCastingTime, characterSpellNames, attacksPerAction, canTwoWeaponFight,
  normalizeFeatureName, featuresKnownAtLevel, buildActionEconomy, powerAttackVariant,
  subclassFeaturesKnownAtLevel,
} from '@/characters/components/combat/actionEconomyData';

describe('classifyCastingTime', () => {
  it('buckets by casting time (bonus before action)', () => {
    expect(classifyCastingTime('1 bonus action')).toEqual({ tab: 'bonus', cost: 'bonus action' });
    expect(classifyCastingTime('1 reaction')).toEqual({ tab: 'reaction', cost: 'reaction' });
    expect(classifyCastingTime('1 action')).toEqual({ tab: 'action', cost: 'action' });
  });
  it('returns null for longer-than-a-turn casting times', () => {
    expect(classifyCastingTime('1 minute')).toBeNull();
    expect(classifyCastingTime('10 minutes')).toBeNull();
    expect(classifyCastingTime('')).toBeNull();
  });
});

describe('characterSpellNames', () => {
  it('unions cantrips + prepared + known, deduped, excludes spellbook', () => {
    const names = characterSpellNames({
      cantrips: ['Fire Bolt'],
      prepared_spells: ['Healing Word', 'Fire Bolt'],
      known_spells: ['Shield'],
      spellbook: ['Fireball'],
    });
    expect(names).toEqual(['Fire Bolt', 'Healing Word', 'Shield']);
    expect(names).not.toContain('Fireball');
  });
  it('handles missing arrays', () => {
    expect(characterSpellNames({})).toEqual([]);
  });
});

describe('attacksPerAction', () => {
  it('Fighter gains extra attacks at 5/11/20', () => {
    expect(attacksPerAction('Fighter', 1)).toBe(1);
    expect(attacksPerAction('Fighter', 5)).toBe(2);
    expect(attacksPerAction('Fighter', 11)).toBe(3);
    expect(attacksPerAction('Fighter', 20)).toBe(4);
  });
  it('defaults to 1 for classes without authored tiers', () => {
    expect(attacksPerAction('Wizard', 20)).toBe(1);
  });
});

describe('powerAttackVariant', () => {
  it('subtracts 5 from to-hit and adds 10 to the flat damage modifier', () => {
    const v = powerAttackVariant({ toHit: '+6', toHitBreakdown: [{ label: 'STR', value: 3 }, { label: 'Proficiency', value: 2 }], damage: '2d6 + 3 slashing' });
    expect(v.toHit).toBe('+1');
    expect(v.damage).toBe('2d6 + 13 slashing');
    expect(v.toHitBreakdown).toContainEqual({ label: 'Great Weapon Master', value: -5 });
  });
  it('adds +10 when the weapon has no existing flat modifier', () => {
    expect(powerAttackVariant({ toHit: '+4', damage: '1d12 slashing' }).damage).toBe('1d12 + 10 slashing');
  });
  it('folds a negative existing modifier into the +10', () => {
    expect(powerAttackVariant({ toHit: '+0', damage: '2d6 - 1 bludgeoning' }).damage).toBe('2d6 + 9 bludgeoning');
  });
  // The same mechanic serves Sharpshooter, which only differs by the label on the breakdown.
  it('labels the breakdown with the feat that granted it', () => {
    const v = powerAttackVariant({ toHit: '+8', toHitBreakdown: [{ label: 'DEX', value: 4 }], damage: '1d8 + 4 piercing' }, 'Sharpshooter');
    expect(v.toHit).toBe('+3');
    expect(v.damage).toBe('1d8 + 14 piercing');
    expect(v.toHitBreakdown).toContainEqual({ label: 'Sharpshooter', value: -5 });
  });
});

describe('canTwoWeaponFight', () => {
  const light = (uid, equipped) => ({ uid, category: 'weapons', equipped, weapon_type: 'Melee', properties: '["Finesse", "Light"]' });
  it('true with two equipped light melee weapons', () => {
    expect(canTwoWeaponFight([light('a', true), light('b', true)])).toBe(true);
  });
  it('false with only one equipped', () => {
    expect(canTwoWeaponFight([light('a', true), light('b', false)])).toBe(false);
  });
  it('false when the second weapon is non-light (Heavy)', () => {
    const heavy = { uid: 'c', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Heavy"]' };
    expect(canTwoWeaponFight([light('a', true), heavy])).toBe(false);
  });

  const oneHanded = (uid) => ({ uid, category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' });
  const ranged = (uid) => ({ uid, category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Light", "Ammunition"]' });
  const dualWielder = [{ name: 'Dual Wielder', effects: [{ kind: 'ac_mod', amount: 1, condition: 'two_melee_weapons' }] }];

  it('false when one equipped weapon is ranged (even if light)', () => {
    expect(canTwoWeaponFight([light('a', true), ranged('b')])).toBe(false);
  });
  it('false when both equipped weapons are ranged', () => {
    expect(canTwoWeaponFight([ranged('a'), ranged('b')])).toBe(false);
  });
  it('false for a ranged weapon even with Dual Wielder', () => {
    expect(canTwoWeaponFight([oneHanded('a'), ranged('b')], dualWielder)).toBe(false);
  });

  it('false for two non-light one-handed melee weapons without Dual Wielder', () => {
    expect(canTwoWeaponFight([oneHanded('a'), oneHanded('b')])).toBe(false);
  });
  it('true for two non-light one-handed melee weapons with Dual Wielder', () => {
    expect(canTwoWeaponFight([oneHanded('a'), oneHanded('b')], dualWielder)).toBe(true);
  });
  it('still false with Dual Wielder if one weapon is two-handed', () => {
    const twoHanded = { uid: 'c', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Two-Handed", "Heavy"]' };
    expect(canTwoWeaponFight([oneHanded('a'), twoHanded], dualWielder)).toBe(false);
  });
});

describe('normalizeFeatureName + featuresKnownAtLevel', () => {
  it('strips trailing use-count parentheticals but keeps distinct names', () => {
    expect(normalizeFeatureName('Action Surge (1/rest)')).toBe('Action Surge');
    expect(normalizeFeatureName('Indomitable (2/LR)')).toBe('Indomitable');
    expect(normalizeFeatureName('Indomitable Might')).toBe('Indomitable Might');
  });
  it('returns the Fighter features known at level 9, deduped', () => {
    const f = featuresKnownAtLevel('Fighter', 9, '5e');
    expect(f).toContain('Second Wind');
    expect(f).toContain('Action Surge');
    expect(f).toContain('Indomitable');
    expect(f.filter((n) => n === 'Indomitable')).toHaveLength(1); // appears at 9/13/17 → once
  });
});

describe('buildActionEconomy — Fighter', () => {
  const fighterArgs = (level, edition) => ({
    charClass: 'Fighter',
    level,
    edition,
    characterData: {},
    inventory: [],
    attacks: [{ uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true }],
    scores: { strength: 16 },
    spellIndex: {},
  });

  it('lists weapon attacks + universal Attack under Actions (5e)', () => {
    const ec = buildActionEconomy(fighterArgs(5, '5e'));
    const names = ec.action.map((e) => e.name);
    expect(names).toContain('Longsword');
    expect(names).toContain('Attack'); // universal
    expect(ec.attacksPerAction).toBe(2);
  });

  it('flags a disadvantaged weapon attack in its detail', () => {
    const args = fighterArgs(5, '5e');
    args.attacks = [{ uid: 'gs1', name: 'Greatsword', toHit: '+5', damage: '2d6 + 3 slashing', proficient: true, disadvantage: true, warning: 'Heavy weapon — Small creatures attack with it at disadvantage.' }];
    const ec = buildActionEconomy(args);
    const gs = ec.action.find((e) => e.name === 'Greatsword');
    expect(gs.detail).toMatch(/disadvantage/);
  });

  it('carries the to-hit breakdown + detailRest onto the weapon entry', () => {
    const args = fighterArgs(13, '5e');
    args.attacks = [{
      uid: 'lb1', name: 'Longbow', toHit: '+9', damage: '1d8 + 3 Piercing', proficient: true,
      toHitBreakdown: [{ label: 'DEX', value: 3 }, { label: 'Proficiency', value: 4 }, { label: 'Archery fighting style', value: 2 }],
    }];
    const ec = buildActionEconomy(args);
    const bow = ec.action.find((e) => e.name === 'Longbow');
    expect(bow.toHit).toBe('+9');
    expect(bow.toHitBreakdown).toHaveLength(3);
    expect(bow.detailRest).toBe('to hit · 1d8 + 3 Piercing');
  });

  it('puts the unarmed fallback at disadvantage while wearing non-proficient armor (STR-based attack)', () => {
    const chainMail = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    const ec = buildActionEconomy({
      ...fighterArgs(1, '5e'), attacks: [], inventory: [chainMail], armorProfText: 'None',
    });
    const ua = ec.action.find((e) => e.name === 'Unarmed Strike');
    expect(ua.detail).toMatch(/· disadvantage/);
    expect(ua.warning).toMatch(/Chain Mail without proficiency/i);
    // Proficient (or no armor ctx breach) → no flag.
    const ok = buildActionEconomy({
      ...fighterArgs(1, '5e'), attacks: [], inventory: [chainMail], armorProfText: 'All armor, shields',
    });
    expect(ok.action.find((e) => e.name === 'Unarmed Strike').detail).not.toMatch(/disadvantage/);
  });

  it('rides a Champion crit range onto weapon attacks (not the unarmed fallback / non-Champions)', () => {
    const args = { ...fighterArgs(3, '5e'), subclass: 'Champion' };
    const ec = buildActionEconomy(args);
    const ls = ec.action.find((e) => e.name === 'Longsword');
    expect(ls.critRange).toBe('19–20');
    expect(ls.critSource).toBe('Improved Critical');

    // Level 15 → Superior Critical 18–20.
    const superior = buildActionEconomy({ ...fighterArgs(15, '5e'), subclass: 'Champion' });
    expect(superior.action.find((e) => e.name === 'Longsword').critRange).toBe('18–20');

    // A Battle Master gets no crit range; the unarmed fallback (no weapon) never does.
    const bm = buildActionEconomy({ ...fighterArgs(3, '5e'), subclass: 'Battle Master' });
    expect(bm.action.find((e) => e.name === 'Longsword').critRange).toBeNull();
    const unarmed = buildActionEconomy({ ...fighterArgs(3, '5e'), subclass: 'Champion', attacks: [] });
    expect(unarmed.action.find((e) => e.name === 'Unarmed Strike').critRange).toBeNull();
  });

  it('rides the 2024 Champion Remarkable Athlete post-crit move onto weapon attacks (not 5e / non-Champion / unarmed)', () => {
    const ec = buildActionEconomy({ ...fighterArgs(3, '5.5e'), subclass: 'Champion' });
    const ls = ec.action.find((e) => e.name === 'Longsword');
    expect(ls.remarkableMoveNote).toContain('half your Speed');

    // 5e Champion has no such rider.
    const e5e = buildActionEconomy({ ...fighterArgs(3, '5e'), subclass: 'Champion' });
    expect(e5e.action.find((e) => e.name === 'Longsword').remarkableMoveNote).toBeNull();

    // Non-Champion and the unarmed fallback never get it.
    const bm = buildActionEconomy({ ...fighterArgs(3, '5.5e'), subclass: 'Battle Master' });
    expect(bm.action.find((e) => e.name === 'Longsword').remarkableMoveNote).toBeNull();
    const unarmed = buildActionEconomy({ ...fighterArgs(3, '5.5e'), subclass: 'Champion', attacks: [] });
    expect(unarmed.action.find((e) => e.name === 'Unarmed Strike').remarkableMoveNote).toBeNull();
  });

  it('adds a spacing note (disadvantage within 5 ft) to a ranged weapon attack', () => {
    const args = fighterArgs(5, '5e');
    args.attacks = [{ uid: 'lb1', name: 'Longbow', toHit: '+7', damage: '1d8 + 3 Piercing', proficient: true }];
    args.inventory = [{ uid: 'lb1', name: 'Longbow', category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Ammunition", "Two-Handed"]' }];
    const bow = buildActionEconomy(args).action.find((e) => e.name === 'Longbow');
    expect(bow.spacingNote).toMatch(/disadvantage while an enemy is within 5 ft/i);
  });

  it('Crossbow Expert flips the ranged spacing note to "no disadvantage"', () => {
    const args = fighterArgs(5, '5e');
    args.attacks = [{ uid: 'hc1', name: 'Hand Crossbow', toHit: '+7', damage: '1d6 + 3 Piercing', proficient: true }];
    args.inventory = [{ uid: 'hc1', name: 'Hand Crossbow', category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Ammunition", "Light"]' }];
    args.characterData = { feats: [{ name: 'Crossbow Expert' }] };
    const bow = buildActionEconomy(args).action.find((e) => e.name === 'Hand Crossbow');
    expect(bow.spacingNote).toMatch(/no disadvantage/i);
    expect(bow.spacingNote).toMatch(/Crossbow Expert/);
  });

  it('adds a spacing note to a thrown weapon', () => {
    const args = fighterArgs(5, '5e');
    args.attacks = [{ uid: 'ha1', name: 'Handaxe', toHit: '+5', damage: '1d6 + 3 Slashing', proficient: true }];
    args.inventory = [{ uid: 'ha1', name: 'Handaxe', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Light", "Thrown"]' }];
    const axe = buildActionEconomy(args).action.find((e) => e.name === 'Handaxe');
    expect(axe.spacingNote).toBeTruthy();
  });

  it('no spacing note on a melee-only weapon', () => {
    const args = fighterArgs(5, '5e');
    args.inventory = [{ uid: 'w1', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' }];
    const ls = buildActionEconomy(args).action.find((e) => e.name === 'Longsword');
    expect(ls.spacingNote).toBeNull();
  });

  it('adds a Savage Attacks note to a melee weapon for a Half-Orc', () => {
    const args = fighterArgs(5, '5e');
    args.characterData = { race_traits: ['Menacing', 'Savage Attacks', 'Relentless Endurance'] };
    args.inventory = [{ uid: 'w1', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' }];
    const ls = buildActionEconomy(args).action.find((e) => e.name === 'Longsword');
    expect(ls.savageAttacksNote).toMatch(/Savage Attacks/i);
  });

  it('no Savage Attacks note on a ranged weapon even for a Half-Orc', () => {
    const args = fighterArgs(5, '5e');
    args.characterData = { race_traits: ['Savage Attacks'] };
    args.attacks = [{ uid: 'lb1', name: 'Longbow', toHit: '+7', damage: '1d8 + 3 Piercing', proficient: true }];
    args.inventory = [{ uid: 'lb1', name: 'Longbow', category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Ammunition", "Two-Handed"]' }];
    const bow = buildActionEconomy(args).action.find((e) => e.name === 'Longbow');
    expect(bow.savageAttacksNote).toBeNull();
  });

  it('no Savage Attacks note without the trait', () => {
    const args = fighterArgs(5, '5e');
    args.inventory = [{ uid: 'w1', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' }];
    const ls = buildActionEconomy(args).action.find((e) => e.name === 'Longsword');
    expect(ls.savageAttacksNote).toBeNull();
  });

  it('gives the unarmed strike a to-hit breakdown too', () => {
    const args = fighterArgs(5, '5e');
    args.attacks = [];
    args.inventory = [];
    const ec = buildActionEconomy(args);
    const unarmed = ec.action.find((e) => e.name === 'Unarmed Strike');
    expect(unarmed.toHitBreakdown).toEqual([
      { label: 'STR', value: 3 },
      { label: 'Proficiency', value: 3 },
    ]);
  });

  it('puts Second Wind under Bonus and Action Surge under No Action (5e)', () => {
    const ec = buildActionEconomy(fighterArgs(3, '5e'));
    expect(ec.bonus.map((e) => e.name)).toContain('Second Wind');
    expect(ec.no_action.map((e) => e.name)).toContain('Action Surge');
    expect(ec.action.map((e) => e.name)).not.toContain('Action Surge');
    const surge = ec.no_action.find((e) => e.name === 'Action Surge');
    expect(surge.cost).toMatch(/no action/);
  });

  it('Action Surge description has no "twice at level 17" overview text (5e + 2024)', () => {
    for (const ed of ['5e', '5.5e']) {
      const ec = buildActionEconomy(fighterArgs(20, ed));
      const surge = ec.no_action.find((e) => e.name === 'Action Surge');
      expect(surge.detail).not.toMatch(/level 17/i);
      expect(surge.detail).not.toMatch(/twice/i);
    }
  });

  it('tags rest-rechargeable features with a resourceKey', () => {
    const ec = buildActionEconomy(fighterArgs(9, '5e'));
    const surge = ec.no_action.find((e) => e.name === 'Action Surge');
    const wind = ec.bonus.find((e) => e.name === 'Second Wind');
    const indom = ec.no_action.find((e) => e.name === 'Indomitable');
    expect(surge.resourceKey).toBe('action_surge_used');
    expect(wind.resourceKey).toBe('second_wind_used');
    expect(indom.resourceKey).toBe('indomitable_used');
  });

  it('puts Indomitable under No Action at level 9; Opportunity Attack stays a Reaction (5e)', () => {
    const ec = buildActionEconomy(fighterArgs(9, '5e'));
    expect(ec.no_action.map((e) => e.name)).toContain('Indomitable');
    expect(ec.reaction.map((e) => e.name)).toContain('Opportunity Attack');
    expect(ec.reaction.map((e) => e.name)).not.toContain('Indomitable');
  });

  it('Action+Bonus is empty for a Fighter without two light weapons', () => {
    expect(buildActionEconomy(fighterArgs(5, '5e'))['action+bonus']).toHaveLength(0);
  });

  it('Second Wind (bonus) / Action Surge + Indomitable (no action) also map in 2024', () => {
    const ec = buildActionEconomy(fighterArgs(9, '5.5e'));
    expect(ec.bonus.map((e) => e.name)).toContain('Second Wind');
    expect(ec.no_action.map((e) => e.name)).toContain('Action Surge');
    expect(ec.no_action.map((e) => e.name)).toContain('Indomitable');
    expect(ec.action.map((e) => e.name)).toContain('Study'); // 2024 universal action
  });

  it('collapses known spells into one "Cast a Spell" entry per casting-time bucket', () => {
    const args = fighterArgs(3, '5e');
    args.characterData = { prepared_spells: ['Healing Word', 'Shield', 'Fireball', 'Mage Hand'] };
    args.spellIndex = {
      'healing word': { casting_time: '1 bonus action', level: 1, school: 'Evocation' },
      shield: { casting_time: '1 reaction', level: 1, school: 'Abjuration' },
      fireball: { casting_time: '1 action', level: 3, school: 'Evocation' },
      'mage hand': { casting_time: '1 action', level: 0, school: 'Conjuration' },
    };
    const ec = buildActionEconomy(args);
    // Individual spells are no longer listed — one generic entry per bucket.
    const spellActions = ec.action.filter((e) => e.source === 'Spell');
    expect(spellActions).toHaveLength(1);
    expect(spellActions[0].name).toBe('Cast a Spell');
    expect(ec.action.map((e) => e.name)).not.toContain('Fireball');
    expect(ec.action.map((e) => e.name)).not.toContain('Mage Hand');
    expect(ec.bonus.find((e) => e.source === 'Spell').name).toBe('Cast a Spell');
    expect(ec.reaction.find((e) => e.source === 'Spell').name).toBe('Cast a Spell');
  });

  it('shows no "Cast a Spell" entry when the character can cast nothing', () => {
    const args = fighterArgs(3, '5e');
    const ec = buildActionEconomy(args);
    expect(ec.action.some((e) => e.source === 'Spell')).toBe(false);
    expect(ec.bonus.some((e) => e.source === 'Spell')).toBe(false);
    expect(ec.reaction.some((e) => e.source === 'Spell')).toBe(false);
  });

  it('falls back to an Unarmed Strike when no weapons are equipped', () => {
    const args = fighterArgs(1, '5e');
    args.attacks = [];
    const ec = buildActionEconomy(args);
    const unarmed = ec.action.find((e) => e.name === 'Unarmed Strike');
    expect(unarmed).toBeTruthy();
    expect(unarmed.detail).toMatch(/bludgeoning/);
  });

  it('adds Two-Weapon Fighting with main-hand/off-hand rows for two light melee weapons', () => {
    const args = fighterArgs(5, '5e');
    args.scores = { strength: 16 };
    args.inventory = [
      { uid: 'a', name: 'Shortsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Light"]', damage: '1d6', damage_type: 'piercing' },
      { uid: 'b', name: 'Dagger', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Light", "Finesse"]', damage: '1d4', damage_type: 'piercing' },
    ];
    args.attacks = [
      { uid: 'a', name: 'Shortsword', toHit: '+6', damage: '1d6 + 3 piercing', proficient: true },
      { uid: 'b', name: 'Dagger', toHit: '+6', damage: '1d4 + 3 piercing', proficient: true },
    ];
    const twf = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Two-Weapon Fighting');
    expect(twf).toBeTruthy();
    expect(twf.subAttacks).toHaveLength(2);
    const [mh, oh] = twf.subAttacks;
    expect(mh).toMatchObject({ label: 'Main hand', name: 'Shortsword', toHit: '+6', damage: '1d6 + 3 piercing' });
    // Off-hand drops the ability modifier from its damage (no TWF fighting style here).
    expect(oh).toMatchObject({ label: 'Off hand', name: 'Dagger', toHit: '+6', damage: '1d4 piercing' });
  });

  it('off-hand retains the ability modifier when the character has the Two-Weapon Fighting style', () => {
    const args = fighterArgs(5, '5e');
    args.characterData = { ...args.characterData, fighting_style: 'Two-Weapon Fighting' };
    args.inventory = [
      { uid: 'a', name: 'Shortsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Light"]', damage: '1d6', damage_type: 'piercing' },
      { uid: 'b', name: 'Dagger', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Light"]', damage: '1d4', damage_type: 'piercing' },
    ];
    args.attacks = [
      { uid: 'a', name: 'Shortsword', toHit: '+6', damage: '1d6 + 3 piercing', proficient: true },
      { uid: 'b', name: 'Dagger', toHit: '+6', damage: '1d4 + 3 piercing', proficient: true },
    ];
    const twf = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Two-Weapon Fighting');
    expect(twf.subAttacks[1].damage).toBe('1d4 + 3 piercing');
  });

  it('adds Two-Weapon Fighting with two non-light one-handed weapons when the character has Dual Wielder', () => {
    const args = fighterArgs(5, '5e');
    args.characterData = {
      ...args.characterData,
      feats: [{ name: 'Dual Wielder', effects: [{ kind: 'ac_mod', amount: 1, condition: 'two_melee_weapons' }] }],
    };
    args.inventory = [
      { uid: 'a', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]', damage: '1d8', damage_type: 'slashing' },
      { uid: 'b', name: 'Rapier', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Finesse"]', damage: '1d8', damage_type: 'piercing' },
    ];
    const twf = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Two-Weapon Fighting');
    expect(twf).toBeTruthy();
    expect(twf.detail).toMatch(/Dual Wielder/);
    expect(twf.subAttacks.map((s) => s.name)).toEqual(['Longsword', 'Rapier']);
  });

  it('does NOT add Two-Weapon Fighting with two non-light weapons without Dual Wielder', () => {
    const args = fighterArgs(5, '5e');
    args.inventory = [
      { uid: 'a', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' },
      { uid: 'b', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' },
    ];
    expect(buildActionEconomy(args)['action+bonus'].map((e) => e.name)).not.toContain('Two-Weapon Fighting');
  });

  it('surfaces a Dragonborn Breath Weapon as an Action', () => {
    const args = fighterArgs(1, '5e');
    args.characterData = { race_traits: ['Breath Weapon'] };
    expect(buildActionEconomy(args).action.map((e) => e.name)).toContain('Breath Weapon');
  });

  describe('Breath Weapon', () => {
    // The trait's damage, save DC, shape and damage type all vary by level + chosen ancestry.
    // A static description showed a level-1 card to a level-16 Dragonborn.
    const dragonbornArgs = (level, ancestry, con = 16) => {
      const args = fighterArgs(level, '5e');
      args.characterData = { race_traits: ['Breath Weapon'], draconic_ancestry: ancestry };
      args.scores = { strength: 16, constitution: con };
      return args;
    };
    const breathOf = (args) => buildActionEconomy(args).action.find((e) => e.name === 'Breath Weapon');

    it('computes damage, save DC and area from the level + ancestry', () => {
      const entry = breathOf(dragonbornArgs(6, { name: 'Red', damage: 'Fire', breath: '15 ft cone' }));
      expect(entry.detail).toContain('3d6 fire damage'); // scaled at 6th
      expect(entry.detail).toContain('DC 14 DEX save');  // 8 + PB 3 + CON 3
      expect(entry.detail).toContain('15 ft cone');
      expect(entry.detail).toContain('Recharges on a short or long rest.');
    });

    it('scales the damage with level rather than showing a fixed string', () => {
      const red = { name: 'Red', damage: 'Fire', breath: '15 ft cone' };
      expect(breathOf(dragonbornArgs(1, red)).detail).toContain('2d6');
      expect(breathOf(dragonbornArgs(11, red)).detail).toContain('4d6');
      expect(breathOf(dragonbornArgs(16, red)).detail).toContain('5d6');
    });

    it('uses a CON save for a cold-breathing ancestry', () => {
      const entry = breathOf(dragonbornArgs(1, { name: 'White', damage: 'Cold', breath: '15 ft cone' }, 14));
      expect(entry.detail).toContain('DC 12 CON save');
      expect(entry.detail).toContain('2d6 cold damage');
    });

    it('carries the racial resource key so the card gets a Use button', () => {
      const entry = breathOf(dragonbornArgs(5, { name: 'Blue', damage: 'Lightning', breath: '5×30 ft line' }));
      expect(entry.resourceKey).toBe('breath_weapon_used');
    });

    it('falls back to a generic area when no ancestry was stored', () => {
      const entry = breathOf(dragonbornArgs(5, null));
      expect(entry.detail).toContain('in a line or cone');
      expect(entry.detail).toContain('2d6 damage');
    });

    it('leaves other racial traits on their static description', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { race_traits: ['Savage Attacks'] };
      // Savage Attacks isn't an action at all — no entry, and no crash from the compute path.
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Savage Attacks')).toBeFalsy();
    });
  });

  describe('feat effects', () => {
    const TAVERN_BRAWLER = {
      id: 14, name: 'Tavern Brawler', level: 4,
      effects: [
        { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
        { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', trigger: 'After an unarmed hit', description: 'Grapple the target.' },
      ],
    };

    it('presents the Tavern Brawler grapple as an Action+Bonus combo, not a standalone bonus', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const ec = buildActionEconomy(args);
      // No standalone bonus grapple entry — it's folded into the combo.
      expect(ec.bonus.find((e) => /grapple/i.test(e.name))).toBeFalsy();
      const combo = ec['action+bonus'].find((e) => e.name === 'Tavern Brawler');
      expect(combo).toBeTruthy();
      expect(combo.source).toBe('Feat');
      expect(combo.cost).toBe('action + bonus action');
      // Action row = Unarmed Strike (no improvised weapon equipped); Bonus row = Grapple.
      const labels = combo.subAttacks.map((s) => s.label);
      expect(labels).toEqual(['Action', 'Bonus']);
      expect(combo.subAttacks[0].name).toBe('Unarmed Strike');
      expect(combo.subAttacks[0].damage).toMatch(/1d4/);
      expect(combo.subAttacks[1].name).toBe('Grapple');
      expect(combo.subAttacks[1].detail).toMatch(/grapple/i);
    });

    it('uses an equipped Improvised Weapon as the Action half of the grapple combo', () => {
      const args = fighterArgs(5, '5e');
      const improvised = {
        uid: 'iw', name: 'Improvised Weapon', category: 'weapons', equipped: true,
        weapon_category: 'Improvised', weapon_type: 'Melee', damage: '1d4', damage_type: 'bludgeoning',
      };
      args.inventory = [improvised];
      args.attacks = [{ uid: 'iw', name: 'Improvised Weapon', toHit: '+6', damage: '1d4 + 3 bludgeoning', proficient: true }];
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const combo = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Tavern Brawler');
      expect(combo.subAttacks[0].name).toBe('Improvised Weapon');
      expect(combo.subAttacks[0].toHit).toBe('+6');
      expect(combo.subAttacks[1].name).toBe('Grapple');
    });

    it('shows the feat unarmed die (1d4) even with a weapon equipped', () => {
      const args = fighterArgs(5, '5e'); // already has a Longsword in attacks
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const unarmed = buildActionEconomy(args).action.find((e) => e.name === 'Unarmed Strike');
      expect(unarmed).toBeTruthy();
      expect(unarmed.detail).toMatch(/1d4/);
    });

    it('no Feat-source entries and no unarmed row when the character has no feats and a weapon', () => {
      const ec = buildActionEconomy(fighterArgs(5, '5e'));
      expect(ec.action.find((e) => e.name === 'Unarmed Strike')).toBeFalsy();
      expect([...ec.action, ...ec.bonus].some((e) => e.source === 'Feat')).toBe(false);
    });

    it('hides the Tavern Brawler combo when both hands are full and no improvised weapon is equipped', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [
        { uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' },
        { uid: 'hc', name: 'Crossbow, Hand', category: 'weapons', equipped: true, hand: 'off', weapon_type: 'Ranged', properties: '["Light", "Ammunition"]' },
      ];
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const ec = buildActionEconomy(args);
      expect(ec['action+bonus'].find((e) => e.name === 'Tavern Brawler')).toBeFalsy();
      expect(ec.bonus.find((e) => /grapple/i.test(e.name))).toBeFalsy();
    });

    it('shows the Tavern Brawler combo when a hand is free (Unarmed Strike lead)', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [
        { uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' },
      ]; // off hand free
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const combo = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Tavern Brawler');
      expect(combo).toBeTruthy();
      expect(combo.subAttacks[0].name).toBe('Unarmed Strike');
    });

    const POLEARM_MASTER = {
      id: 28, name: 'Polearm Master', level: 4,
      effects: [
        { kind: 'action', name: 'Polearm Butt (Bonus Attack)', economy: 'bonus', trigger: 'Attack with a glaive, halberd, quarterstaff, or spear', description: 'Bonus-action attack with the opposite end (1d4 bludgeoning).' },
      ],
    };

    it('hides the Polearm Master bonus attack when no qualifying polearm is equipped', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [{ uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' }];
      args.characterData = { feats: [POLEARM_MASTER] };
      expect(buildActionEconomy(args).bonus.find((e) => /polearm/i.test(e.name))).toBeFalsy();
    });

    it('shows the Polearm Master bonus attack when a polearm is equipped', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [{ uid: 'gl', name: 'Glaive', category: 'weapons', equipped: true, hand: 'both', weapon_type: 'Melee', properties: '["Heavy", "Two-Handed", "Reach"]' }];
      args.characterData = { feats: [POLEARM_MASTER] };
      expect(buildActionEconomy(args).bonus.find((e) => /polearm/i.test(e.name))).toBeTruthy();
    });

    const DEFENSIVE_DUELIST = {
      id: 6, name: 'Defensive Duelist', level: 4,
      effects: [
        { kind: 'action', name: 'Defensive Parry', economy: 'reaction', trigger: "When hit by a melee attack while wielding a finesse weapon", description: 'Add your proficiency bonus to your AC against that attack.' },
      ],
    };

    it('hides Defensive Duelist when no finesse weapon is equipped', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [{ uid: 'ls', name: 'Longsword', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Versatile (1d10)"]' }];
      args.characterData = { feats: [DEFENSIVE_DUELIST] };
      expect(buildActionEconomy(args).reaction.find((e) => e.name === 'Defensive Parry')).toBeFalsy();
    });

    it('shows Defensive Duelist with the +PB AC bonus when a finesse weapon is equipped', () => {
      const args = fighterArgs(14, '5e'); // PB +5 at level 14
      args.inventory = [{ uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' }];
      args.characterData = { feats: [DEFENSIVE_DUELIST] };
      const parry = buildActionEconomy(args).reaction.find((e) => e.name === 'Defensive Parry');
      expect(parry).toBeTruthy();
      expect(parry.detail).toMatch(/\+5 AC/);
    });
  });

  describe('Great Weapon Master', () => {
    const GWM = {
      id: 30, name: 'Great Weapon Master', level: 4,
      effects: [
        { kind: 'ability_score', ability: 'strength', amount: 1 },
        { kind: 'action', name: 'Cleave (Bonus Attack)', economy: 'bonus', trigger: 'When you score a crit or drop a creature to 0 HP with a melee weapon', description: 'Make one melee weapon attack as a bonus action.' },
      ],
    };
    const greatsword = { uid: 'gs', name: 'Greatsword', category: 'weapons', equipped: true, hand: 'both', weapon_type: 'Melee', properties: '["Heavy", "Two-Handed"]', damage: '2d6', damage_type: 'slashing' };

    it('hides the standalone bonus attack when no melee weapon is equipped', () => {
      const args = fighterArgs(4, '5e');
      args.inventory = [];
      args.attacks = [];
      args.characterData = { feats: [GWM] };
      expect(buildActionEconomy(args).bonus.find((e) => /cleave/i.test(e.name))).toBeFalsy();
    });

    it('shows the standalone bonus attack in the Bonus bucket when a melee weapon is equipped', () => {
      const args = fighterArgs(4, '5e');
      args.inventory = [greatsword];
      args.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', damage: '2d6 + 3 slashing', proficient: true }];
      args.characterData = { feats: [GWM] };
      expect(buildActionEconomy(args).bonus.find((e) => /cleave/i.test(e.name))).toBeTruthy();
    });

    it('attaches the crit/kill bonus-attack note to a melee weapon entry (both editions)', () => {
      for (const ed of ['5e', '5.5e']) {
        const args = fighterArgs(4, ed);
        args.inventory = [greatsword];
        args.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', damage: '2d6 + 3 slashing', proficient: true }];
        args.characterData = { feats: [GWM] };
        const row = buildActionEconomy(args).action.find((e) => e.name === 'Greatsword');
        expect(row.greatWeaponMasterNote).toMatch(/critical hit.*bonus action/i);
      }
    });

    it('does not attach the bonus-attack note without the feat, on a ranged weapon, or to the unarmed fallback', () => {
      // No feat
      const noFeat = fighterArgs(4, '5e');
      noFeat.inventory = [greatsword];
      noFeat.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', damage: '2d6 + 3 slashing', proficient: true }];
      expect(buildActionEconomy(noFeat).action.find((e) => e.name === 'Greatsword').greatWeaponMasterNote).toBeNull();

      // Ranged weapon — GWM's bonus attack is melee-only
      const ranged = fighterArgs(4, '5e');
      const bow = { uid: 'lb', name: 'Longbow', category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Ammunition", "Two-Handed"]', damage: '1d8', damage_type: 'piercing' };
      ranged.inventory = [bow];
      ranged.attacks = [{ uid: 'lb', name: 'Longbow', toHit: '+5', damage: '1d8 + 2 piercing', proficient: true }];
      ranged.characterData = { feats: [GWM] };
      expect(buildActionEconomy(ranged).action.find((e) => e.name === 'Longbow').greatWeaponMasterNote).toBeNull();

      // Unarmed fallback (no weapon equipped) carries no note
      const unarmed = fighterArgs(4, '5e');
      unarmed.inventory = [];
      unarmed.attacks = [];
      unarmed.characterData = { feats: [GWM] };
      const unarmedRow = buildActionEconomy(unarmed).action.find((e) => /unarmed/i.test(e.name));
      expect(unarmedRow?.greatWeaponMasterNote ?? null).toBeNull();
    });

    it('attaches a −5/+10 powerAttack variant to a proficient Heavy melee weapon (5e)', () => {
      const args = fighterArgs(4, '5e');
      args.inventory = [greatsword];
      args.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', toHitBreakdown: [{ label: 'STR', value: 3 }, { label: 'Proficiency', value: 2 }], damage: '2d6 + 3 slashing', proficient: true }];
      args.characterData = { feats: [GWM] };
      const row = buildActionEconomy(args).action.find((e) => e.name === 'Greatsword');
      expect(row.powerAttack).toBeTruthy();
      expect(row.powerAttack.toHit).toBe('+1');
      expect(row.powerAttack.detailRest).toContain('2d6 + 13 slashing');
      expect(row.powerAttack.toHitBreakdown).toContainEqual({ label: 'Great Weapon Master', value: -5 });
    });

    it('does not attach powerAttack without the feat, to a non-heavy weapon, or when not proficient', () => {
      const base = () => {
        const a = fighterArgs(4, '5e');
        a.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', damage: '2d6 + 3 slashing', proficient: true }];
        a.inventory = [greatsword];
        return a;
      };
      // No feat
      expect(buildActionEconomy(base()).action.find((e) => e.name === 'Greatsword').powerAttack).toBeNull();
      // Non-heavy weapon
      const nonHeavy = base();
      nonHeavy.characterData = { feats: [GWM] };
      nonHeavy.inventory = [{ uid: 'gs', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile (1d10)"]' }];
      expect(buildActionEconomy(nonHeavy).action.find((e) => e.name === 'Greatsword').powerAttack).toBeNull();
      // Not proficient
      const notProf = base();
      notProf.characterData = { feats: [GWM] };
      notProf.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+3', damage: '2d6 + 3 slashing', proficient: false }];
      expect(buildActionEconomy(notProf).action.find((e) => e.name === 'Greatsword').powerAttack).toBeNull();
    });

    it('does not attach the −5/+10 powerAttack in 2024 (the feat has no such option)', () => {
      const args = fighterArgs(4, '5.5e');
      args.inventory = [greatsword];
      args.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', damage: '2d6 + 3 slashing', proficient: true }];
      args.characterData = { feats: [GWM] };
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Greatsword').powerAttack).toBeNull();
    });
  });

  describe('Crossbow Expert', () => {
    const CROSSBOW_EXPERT = {
      id: 99, name: 'Crossbow Expert', level: 4,
      effects: [
        {
          kind: 'action', name: 'Hand Crossbow (Bonus Attack)', economy: 'bonus',
          trigger: 'After you make a one-handed attack',
          description: "Make an attack with a hand crossbow you're holding as a bonus action.",
        },
        { kind: 'note', text: 'Ignore the loading property of proficient crossbows.' },
      ],
    };
    const scimitar = { uid: 's', name: 'Scimitar', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Finesse", "Light"]', damage: '1d6', damage_type: 'slashing' };
    // 5e API comma-inverted name form — must still be detected as a hand crossbow.
    const handCrossbow = { uid: 'hc', name: 'Crossbow, Hand', category: 'weapons', equipped: true, weapon_type: 'Ranged', properties: '["Light", "Ammunition", "Loading"]', damage: '1d6', damage_type: 'piercing' };
    const attackRows = [
      { uid: 's', name: 'Scimitar', toHit: '+5', damage: '1d6 + 3 slashing', proficient: true },
      { uid: 'hc', name: 'Crossbow, Hand', toHit: '+5', damage: '1d6 + 3 piercing', proficient: true },
    ];

    it('presents the feat as an Action+Bonus combo (melee Action → hand crossbow Bonus) and drops the standalone bonus entry', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [CROSSBOW_EXPERT] };
      args.inventory = [scimitar, handCrossbow];
      args.attacks = attackRows;
      const ec = buildActionEconomy(args);

      const combo = ec['action+bonus'].find((e) => e.name === 'Crossbow Expert');
      expect(combo).toBeTruthy();
      expect(combo.source).toBe('Feat');
      expect(combo.cost).toBe('action + bonus action');
      expect(combo.subAttacks.map((s) => [s.label, s.name])).toEqual([
        ['Action', 'Scimitar'],
        ['Bonus', 'Crossbow, Hand'],
      ]);
      // The bonus hand-crossbow attack keeps its ability modifier on damage (unlike TWF off-hand).
      expect(combo.subAttacks[1].damage).toBe('1d6 + 3 piercing');
      expect(combo.detail).toMatch(/Scimitar/);
      expect(combo.detail).toMatch(/Crossbow Expert/);

      // The standalone bonus-action entry is suppressed (moved into the combo above).
      expect(ec.bonus.find((e) => e.name === 'Hand Crossbow (Bonus Attack)')).toBeFalsy();
    });

    it('shows nothing for Crossbow Expert in any bucket when no hand crossbow is equipped', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [CROSSBOW_EXPERT] };
      args.inventory = [scimitar];
      args.attacks = [attackRows[0]];
      const ec = buildActionEconomy(args);

      // No combo, and the standalone bonus-action entry is gone too (no hand crossbow to fire).
      expect(ec['action+bonus'].find((e) => e.name === 'Crossbow Expert')).toBeFalsy();
      expect(ec.bonus.find((e) => e.name === 'Hand Crossbow (Bonus Attack)')).toBeFalsy();
      expect([...ec.action, ...ec.bonus, ...ec['action+bonus']].some((e) => e.source === 'Feat')).toBe(false);
    });

    it('adds no combo without the Crossbow Expert feat, even with a hand crossbow equipped', () => {
      const args = fighterArgs(5, '5e');
      args.inventory = [scimitar, handCrossbow];
      args.attacks = attackRows;
      expect(buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Crossbow Expert')).toBeFalsy();
    });

    it('uses the hand crossbow itself as the Action weapon when no one-handed melee weapon is equipped', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [CROSSBOW_EXPERT] };
      args.inventory = [handCrossbow];
      args.attacks = [attackRows[1]];
      const combo = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Crossbow Expert');
      expect(combo).toBeTruthy();
      expect(combo.subAttacks.map((s) => s.name)).toEqual(['Crossbow, Hand', 'Crossbow, Hand']);
    });

    it('carries a weapon attack row loadingNote onto its Action entry', () => {
      const args = fighterArgs(5, '5e');
      args.attacks = [{ uid: 'lx', name: 'Crossbow, Light', toHit: '+5', damage: '1d8 + 2 piercing', proficient: true, loadingNote: 'Loading: only one attack per action, even with Extra Attack.' }];
      const entry = buildActionEconomy(args).action.find((e) => e.name === 'Crossbow, Light');
      expect(entry.loadingNote).toMatch(/only one attack per action/i);
    });
  });

  describe('Charger', () => {
    const CHARGER = { id: 50, name: 'Charger', level: 4, effects: [{ kind: 'note', text: 'Dash then bonus attack/shove.' }] };
    const longsword = { uid: 'w1', name: 'Longsword', category: 'weapons', equipped: true, weapon_type: 'Melee', properties: '["Versatile"]', damage: '1d8', damage_type: 'slashing' };

    it('adds a Dash + attack/shove Action+Bonus combo when a melee weapon is equipped', () => {
      const args = fighterArgs(4, '5e');
      args.characterData = { feats: [CHARGER] };
      args.inventory = [longsword]; // default attacks already carry a Longsword row (uid w1)
      const combo = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Charger');
      expect(combo).toBeTruthy();
      expect(combo.source).toBe('Feat');
      expect(combo.cost).toBe('action + bonus action');
      expect(combo.subAttacks.map((s) => [s.label, s.name])).toEqual([
        ['Action', 'Dash'],
        ['Bonus', 'Longsword'],
        ['or Shove', 'Shove'],
      ]);
      // The bonus melee attack shows the equipped weapon's real to-hit/damage.
      expect(combo.subAttacks[1].toHit).toBe('+5');
      expect(combo.detail).toMatch(/Longsword/);
      expect(combo.detail).toMatch(/Charger/);
    });

    it('shows only Dash + Shove when no melee weapon is equipped', () => {
      const args = fighterArgs(4, '5e');
      args.characterData = { feats: [CHARGER] };
      args.inventory = [];
      args.attacks = [];
      const combo = buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Charger');
      expect(combo).toBeTruthy();
      expect(combo.subAttacks.map((s) => [s.label, s.name])).toEqual([
        ['Action', 'Dash'],
        ['Bonus', 'Shove'],
      ]);
      expect(combo.subAttacks.some((s) => s.name === 'Longsword')).toBe(false);
      expect(combo.detail).toMatch(/Equip a melee weapon/);
    });

    it('does not add the combo without the Charger feat', () => {
      const args = fighterArgs(4, '5e');
      args.inventory = [longsword];
      expect(buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Charger')).toBeFalsy();
    });

    it('does not add the combo in 2024 (Charger is a different mechanic there)', () => {
      const args = fighterArgs(4, '5.5e');
      args.characterData = { feats: [CHARGER] };
      args.inventory = [longsword];
      expect(buildActionEconomy(args)['action+bonus'].find((e) => e.name === 'Charger')).toBeFalsy();
    });

    it('adds a 2024 "Charge" Action entry (attack + 1d8/push options) when a melee weapon is equipped', () => {
      const args = fighterArgs(4, '5.5e');
      args.characterData = { feats: [CHARGER] };
      args.inventory = [longsword];
      const ec = buildActionEconomy(args);
      const charge = ec.action.find((e) => e.name === 'Charge');
      expect(charge).toBeTruthy();
      expect(charge.source).toBe('Feat');
      expect(charge.cost).toBe('action'); // 2024 Charge is an Action, not Action+Bonus
      expect(charge.subAttacks.map((s) => [s.label, s.name])).toEqual([
        ['Attack', 'Longsword'],
        ['+1d8', 'Extra damage'],
        ['or Push', 'Push 10 ft'],
      ]);
      expect(charge.subAttacks[0].toHit).toBe('+5');
      expect(charge.detail).toMatch(/\+10 ft of Speed/); // Dash bonus noted
      // Not shown as an Action+Bonus combo in 2024.
      expect(ec['action+bonus'].find((e) => e.name === 'Charge')).toBeFalsy();
    });

    it('does not add the 2024 Charge entry when no melee weapon is equipped', () => {
      const args = fighterArgs(4, '5.5e');
      args.characterData = { feats: [CHARGER] };
      args.inventory = [];
      args.attacks = [];
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Charge')).toBeFalsy();
    });

    it('does not add the 2024 Charge entry without the Charger feat', () => {
      const args = fighterArgs(4, '5.5e');
      args.inventory = [longsword];
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Charge')).toBeFalsy();
    });

    it('does not add the 2024 Charge Action entry in 5e', () => {
      const args = fighterArgs(4, '5e');
      args.characterData = { feats: [CHARGER] };
      args.inventory = [longsword];
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Charge')).toBeFalsy();
    });
  });
});

// A weapon that fires ammunition carries the flag + uid the tab needs to render the shared
// ammo control on its attack card (the control reads the live inventory itself).
describe('buildActionEconomy — Ammunition weapons', () => {
  const ammoArgs = (inventory, attacks) => ({
    charClass: 'Fighter', subclass: null, level: 5, edition: '5e',
    characterData: {}, inventory, attacks,
    scores: { strength: 12, dexterity: 16 }, spellIndex: {},
  });
  const longbow = {
    uid: 'lb1', category: 'weapons', name: 'Longbow', equipped: true,
    properties: '["Ammunition", "Heavy", "Two-Handed"]', damage: '1d8', damage_type: 'Piercing',
  };
  const longsword = {
    uid: 'ls1', category: 'weapons', name: 'Longsword', equipped: true,
    properties: '["Versatile"]', damage: '1d8', damage_type: 'Slashing',
  };
  const atk = (uid, name) => ({ uid, name, toHit: '+6', damage: '1d8 + 3', proficient: true });

  it('flags an Ammunition weapon and carries its uid', () => {
    const bow = buildActionEconomy(ammoArgs([longbow], [atk('lb1', 'Longbow')]))
      .action.find((e) => e.name === 'Longbow');
    expect(bow.needsAmmo).toBe(true);
    expect(bow.weaponUid).toBe('lb1');
  });

  it('does not flag a weapon without the Ammunition property', () => {
    const sword = buildActionEconomy(ammoArgs([longsword], [atk('ls1', 'Longsword')]))
      .action.find((e) => e.name === 'Longsword');
    expect(sword.needsAmmo).toBe(false);
  });

  it('does not flag the unarmed-strike fallback (no weapon behind it)', () => {
    const unarmed = buildActionEconomy(ammoArgs([], [])).action.find((e) => /unarmed/i.test(e.name));
    expect(unarmed.needsAmmo).toBe(false);
    expect(unarmed.weaponUid).toBeNull();
  });
});

describe('buildActionEconomy — Arcane Archer (Fighter subclass)', () => {
  const aaArgs = (level, extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Arcane Archer',
    level,
    edition: '5e',
    characterData: {},
    inventory: [],
    attacks: [{ uid: 'b1', name: 'Longbow', toHit: '+7', damage: '1d8 + 4 piercing', proficient: true }],
    scores: { dexterity: 18 },
    spellIndex: {},
    ...extra,
  });

  // Arcane Shot rides on an arrow you were already firing, so it attaches to the bow attack
  // card rather than floating as its own entry you'd have to cross-reference mid-combat.
  it('attaches Arcane Shot to the bow attack instead of a standalone entry', () => {
    const ec = buildActionEconomy(aaArgs(3, {
      characterData: { arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow'] },
    }));
    expect(ec.no_action.find((e) => e.name === 'Arcane Shot')).toBeFalsy();
    const bow = ec.action.find((e) => e.name === 'Longbow');
    expect(bow.arcaneShot).toBeTruthy();
    // No action-cost badge on the attached block — it rides on the bow's Attack action, so a
    // "No Action" tag would read as a second thing to spend. The standalone fallback keeps one.
    expect(bow.arcaneShot.cost).toBeUndefined();
    // The uses are the one shared pool, so the bow card carries the same resource key.
    expect(bow.resourceKey).toBe('arcane_shot_used');
  });

  it('spells out each known option (with its description) on the bow card', () => {
    const bow = buildActionEconomy(aaArgs(3, {
      characterData: { arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow'] },
    })).action.find((e) => e.name === 'Longbow');
    expect(bow.arcaneShot.options.map((o) => o.name)).toEqual(['Bursting Arrow', 'Shadow Arrow']);
    expect(bow.arcaneShot.options[0].description).toMatch(/detonates/i);
    expect(bow.arcaneShot.emptyNote).toBeNull();
    expect(bow.arcaneShot.note).toMatch(/Longbow/);
  });

  it('computes the save DC from level + Intelligence', () => {
    // L7 → PB 3, INT 16 → +3 ⇒ 8 + 3 + 3 = 14
    const bow = buildActionEconomy(aaArgs(7, { scores: { dexterity: 18, intelligence: 16 } }))
      .action.find((e) => e.name === 'Longbow');
    expect(bow.arcaneShot.saveDc).toBe(14);
  });

  // The card shows the DC as a clickable number, so the arithmetic has to travel with it —
  // and its total can never disagree with the plain `saveDc` next to it.
  it('carries the save DC arithmetic alongside the number', () => {
    const bow = buildActionEconomy(aaArgs(7, { scores: { dexterity: 18, intelligence: 16 } }))
      .action.find((e) => e.name === 'Longbow');
    expect(bow.arcaneShot.saveDcBreakdown.total).toBe(bow.arcaneShot.saveDc);
    expect(bow.arcaneShot.saveDcBreakdown.parts.map((p) => p.label))
      .toEqual(['Base', 'Proficiency bonus', 'INT modifier']);
  });

  // Superior Arcane Shot rewrites the option's own text rather than appending a rider, so the
  // card can't show "2d6 force damage" and "increases to 4d6" side by side.
  it('swaps in the upgraded option text only from level 18', () => {
    const at = (lvl) => buildActionEconomy(aaArgs(lvl, {
      characterData: { arcane_shot_options: ['Bursting Arrow'] },
    })).action.find((e) => e.name === 'Longbow').arcaneShot.options[0];
    expect(at(17).description).toMatch(/each take 2d6 force damage/);
    expect(at(17).improved).toBe(false);
    expect(at(18).description).toMatch(/each take 4d6 force damage/);
    expect(at(18).description).not.toMatch(/2d6/);
    expect(at(18).description).not.toMatch(/increases to/);
    expect(at(18).improved).toBe(true);
  });

  it('points at level-up when no options have been chosen', () => {
    const bow = buildActionEconomy(aaArgs(3)).action.find((e) => e.name === 'Longbow');
    expect(bow.arcaneShot.options).toEqual([]);
    expect(bow.arcaneShot.emptyNote).toMatch(/no options chosen yet/i);
  });

  // RAW is shortbow/longbow only — a crossbow never qualifies, so that archer keeps the
  // standalone entry (with a hint) rather than silently losing the feature.
  it('does not attach to a crossbow, and falls back to a standalone entry', () => {
    const ec = buildActionEconomy(aaArgs(3, {
      attacks: [{ uid: 'c1', name: 'Heavy Crossbow', toHit: '+7', damage: '1d10 + 4 piercing', proficient: true }],
    }));
    expect(ec.action.find((e) => e.name === 'Heavy Crossbow').arcaneShot).toBeUndefined();
    const shot = ec.no_action.find((e) => e.name === 'Arcane Shot');
    expect(shot).toBeTruthy();
    expect(shot.detail).toMatch(/equip a shortbow or longbow/i);
  });

  it('falls back to a standalone entry when no weapon is equipped at all', () => {
    const ec = buildActionEconomy(aaArgs(3, { attacks: [] }));
    expect(ec.no_action.find((e) => e.name === 'Arcane Shot')).toBeTruthy();
  });

  it('attaches to every equipped bow (the pool is shared)', () => {
    const ec = buildActionEconomy(aaArgs(3, {
      attacks: [
        { uid: 'b1', name: 'Longbow', toHit: '+7', damage: '1d8 + 4 piercing', proficient: true },
        { uid: 'b2', name: 'Shortbow', toHit: '+7', damage: '1d6 + 4 piercing', proficient: true },
      ],
    }));
    const bows = ec.action.filter((e) => e.arcaneShot);
    expect(bows.map((e) => e.name)).toEqual(['Longbow', 'Shortbow']);
    expect(ec.no_action.find((e) => e.name === 'Arcane Shot')).toBeFalsy();
  });

  it('adds Curving Shot as a bonus action only from L7', () => {
    expect(buildActionEconomy(aaArgs(3)).bonus.find((e) => e.name === 'Curving Shot')).toBeFalsy();
    const curving = buildActionEconomy(aaArgs(7)).bonus.find((e) => e.name === 'Curving Shot');
    expect(curving).toBeTruthy();
    expect(curving.cost).toBe('bonus action');
    expect(curving.detail).toMatch(/reroll/i);
  });

  it('adds nothing below the subclass level or for another subclass', () => {
    expect(buildActionEconomy(aaArgs(2)).no_action.find((e) => e.name === 'Arcane Shot')).toBeFalsy();
    const champ = buildActionEconomy({ ...aaArgs(7), subclass: 'Champion' });
    expect(champ.no_action.find((e) => e.name === 'Arcane Shot')).toBeFalsy();
  });

  // Magic Arrow is passive and the 10/15/18 features are progression, not actions — they must
  // stay out of the tab rather than appearing as things you can "do".
  it('leaves the passive and progression features out of the action economy', () => {
    const ec = buildActionEconomy(aaArgs(20));
    const names = [...ec.action, ...ec.bonus, ...ec.reaction, ...ec.no_action].map((e) => e.name);
    expect(names).not.toContain('Magic Arrow');
    expect(names).not.toContain('Ever-Ready Shot');
    expect(names).not.toContain('Superior Arcane Shot');
  });
});

describe('buildActionEconomy — Eldritch Knight (Fighter subclass)', () => {
  const ekArgs = (level, edition = '5e', extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Eldritch Knight',
    level,
    edition,
    characterData: {},
    inventory: [],
    attacks: [{ uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true }],
    scores: { strength: 16 },
    spellIndex: {},
    ...extra,
  });

  it('subclassFeaturesKnownAtLevel reads the SUBCLASS_DATA feature levels', () => {
    expect(subclassFeaturesKnownAtLevel('Fighter', '5e', 'Eldritch Knight', 3))
      .toEqual(expect.arrayContaining(['Spellcasting', 'Weapon Bond']));
    expect(subclassFeaturesKnownAtLevel('Fighter', '5e', 'Eldritch Knight', 3)).not.toContain('War Magic');
    expect(subclassFeaturesKnownAtLevel('Fighter', '5.5e', 'Eldritch Knight', 7)).toContain('War Magic');
    expect(subclassFeaturesKnownAtLevel('Fighter', '5e', 'Nonexistent', 20)).toEqual([]);
  });

  it('adds Weapon Bond as a bonus action from L3 (source Subclass) with a bond-one hint', () => {
    const ec = buildActionEconomy(ekArgs(3));
    const bond = ec.bonus.find((e) => e.name === 'Weapon Bond');
    expect(bond).toBeTruthy();
    expect(bond.source).toBe('Subclass');
    expect(bond.detail).toMatch(/summon/i);
    expect(bond.detail).toMatch(/up to two weapons/i); // RAW both editions
    // nothing bonded yet → the entry points at the Items-tab picker
    expect(bond.detail).toMatch(/no weapon bonded yet/i);
  });

  it('a bonded weapon replaces the generic entry with "Bonded {Name}" carrying its info', () => {
    const rapier = { uid: 'rp1', category: 'weapons', name: 'Rapier', damage: '1d8', damage_type: 'piercing', properties: 'Finesse' };
    const ec = buildActionEconomy(ekArgs(3, '5e', {
      inventory: [rapier],
      characterData: { bonded_weapon_uids: ['rp1'] },
    }));
    expect(ec.bonus.find((e) => e.name === 'Weapon Bond')).toBeFalsy();
    const bonded = ec.bonus.find((e) => e.name === 'Bonded Rapier');
    expect(bonded).toBeTruthy();
    expect(bonded.source).toBe('Subclass');
    expect(bonded.detail).toMatch(/summon your bonded rapier/i);
    expect(bonded.detail).toMatch(/1d8 piercing/i);
    expect(bonded.subAttacks).toBeNull(); // not equipped → no live attack row
  });

  it('an equipped bonded weapon attaches its real attack row; two bonds → two entries', () => {
    const rapier = { uid: 'rp1', category: 'weapons', name: 'Rapier', damage: '1d8', damage_type: 'piercing', equipped: true, hand: 'main' };
    const dagger = { uid: 'dg1', category: 'weapons', name: 'Dagger', damage: '1d4', damage_type: 'piercing', equipped: false };
    const ec = buildActionEconomy(ekArgs(3, '5e', {
      inventory: [rapier, dagger],
      characterData: { bonded_weapon_uids: ['rp1', 'dg1'] },
      attacks: [{ uid: 'rp1', name: 'Rapier', toHit: '+5', damage: '1d8 + 3 piercing', proficient: true }],
    }));
    const bondedRapier = ec.bonus.find((e) => e.name === 'Bonded Rapier');
    const bondedDagger = ec.bonus.find((e) => e.name === 'Bonded Dagger');
    expect(bondedRapier.subAttacks).toEqual([
      expect.objectContaining({ label: 'Attack', name: 'Rapier', toHit: '+5', damage: '1d8 + 3 piercing' }),
    ]);
    expect(bondedDagger).toBeTruthy();
    expect(bondedDagger.subAttacks).toBeNull();
  });

  it('does not add Weapon Bond for a Champion or below the subclass level', () => {
    const champ = buildActionEconomy({ ...ekArgs(3), subclass: 'Champion' });
    expect(champ.bonus.find((e) => e.name === 'Weapon Bond')).toBeFalsy();
    const low = buildActionEconomy(ekArgs(2));
    expect(low.bonus.find((e) => e.name === 'Weapon Bond')).toBeFalsy();
  });

  it('does not add Arcane Archer entries to an Eldritch Knight', () => {
    const ec = buildActionEconomy(ekArgs(7));
    expect(ec.no_action.find((e) => e.name === 'Arcane Shot')).toBeFalsy();
    expect(ec.bonus.find((e) => e.name === 'Curving Shot')).toBeFalsy();
  });

  it('a weapon attack entry carries the hexNote from its attack row (Hex Warrior)', () => {
    const ec = buildActionEconomy({
      charClass: 'Warlock',
      subclass: 'The Hexblade',
      level: 1,
      edition: '5e',
      characterData: {},
      inventory: [{ uid: 'rp1', category: 'weapons', name: 'Rapier', equipped: true }],
      attacks: [{ uid: 'rp1', name: 'Rapier', toHit: '+6', damage: '1d8 + 4 piercing', proficient: true, hexNote: 'Uses Charisma for attack & damage (Hex Warrior).' }],
      scores: { charisma: 18 },
      spellIndex: {},
    });
    const row = ec.action.find((e) => e.name === 'Rapier');
    expect(row.hexNote).toMatch(/Hex Warrior/);
  });

  it('adds the War Magic Action+Bonus combo at L7 with the equipped weapon as the bonus attack', () => {
    const ec = buildActionEconomy(ekArgs(7));
    const wm = ec['action+bonus'].find((e) => e.key === 'war-magic');
    expect(wm).toBeTruthy();
    expect(wm.source).toBe('Subclass');
    expect(wm.subAttacks.map((s) => s.label)).toEqual(['Action', 'Bonus']);
    expect(wm.subAttacks[0].name).toBe('Cast a cantrip');
    expect(wm.subAttacks[1].name).toBe('Longsword');
    expect(wm.subAttacks[1].toHit).toBe('+5');
    expect(wm.detail).toMatch(/Extra Attack doesn't apply/);
  });

  it('upgrades War Magic to any spell at L18 (Improved War Magic, level-keyed)', () => {
    const ec = buildActionEconomy(ekArgs(18));
    const wm = ec['action+bonus'].find((e) => e.key === 'war-magic');
    expect(wm.subAttacks[0].name).toBe('Cast a spell');
    expect(wm.detail).toMatch(/Improved War Magic/);
    // Still one entry, not two.
    expect(ec['action+bonus'].filter((e) => e.key === 'war-magic')).toHaveLength(1);
  });

  it('hides War Magic below L7, without a weapon equipped, and for non-EK subclasses', () => {
    expect(buildActionEconomy(ekArgs(6))['action+bonus'].find((e) => e.key === 'war-magic')).toBeFalsy();
    expect(buildActionEconomy(ekArgs(7, '5e', { attacks: [] }))['action+bonus'].find((e) => e.key === 'war-magic')).toBeFalsy();
    expect(buildActionEconomy({ ...ekArgs(7), subclass: 'Champion' })['action+bonus'].find((e) => e.key === 'war-magic')).toBeFalsy();
  });

  it('attaches Arcane Charge to Action Surge as its own rider at L15', () => {
    const ec = buildActionEconomy(ekArgs(15));
    const surge = ec.no_action.find((e) => e.key === 'feature:Action Surge');
    expect(surge.riders).toHaveLength(1);
    expect(surge.riders[0].source).toBe('Arcane Charge');
    expect(surge.riders[0].text).toMatch(/teleport up to 30 ft/i);
    // It stays OUT of the base detail — run into that text it reads as part of Action Surge.
    expect(surge.detail).not.toMatch(/Arcane Charge/);
    // The level it was gained is not printed here — the tab shows what you can do now,
    // and the entry only appears once you have the feature anyway.
    expect(surge.riders[0].text).not.toMatch(/L15/);
    // Not before L15, and not for other subclasses.
    const l14 = buildActionEconomy(ekArgs(14)).no_action.find((e) => e.key === 'feature:Action Surge');
    expect(l14.riders ?? []).toHaveLength(0);
    const champ = buildActionEconomy({ ...ekArgs(15), subclass: 'Champion' })
      .no_action.find((e) => e.key === 'feature:Action Surge');
    expect(champ.riders ?? []).toHaveLength(0);
  });

  it('rides the Eldritch Strike note onto real weapon attacks at L10 (not unarmed, not non-EK)', () => {
    const ec = buildActionEconomy(ekArgs(10));
    const ls = ec.action.find((e) => e.name === 'Longsword');
    expect(ls.eldritchStrikeNote).toMatch(/disadvantage on the next saving throw/);
    // Below L10 → null.
    const l9 = buildActionEconomy(ekArgs(9)).action.find((e) => e.name === 'Longsword');
    expect(l9.eldritchStrikeNote).toBeNull();
    // Unarmed fallback (no uid) → null.
    const ua = buildActionEconomy(ekArgs(10, '5e', { attacks: [] })).action.find((e) => e.name === 'Unarmed Strike');
    expect(ua.eldritchStrikeNote).toBeNull();
    // Champion → null.
    const champ = buildActionEconomy({ ...ekArgs(10), subclass: 'Champion' }).action.find((e) => e.name === 'Longsword');
    expect(champ.eldritchStrikeNote).toBeNull();
  });
});
