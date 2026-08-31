import { describe, it, expect } from 'vitest';
import {
  classifyCastingTime, characterSpellNames, attacksPerAction, canTwoWeaponFight,
  normalizeFeatureName, featuresKnownAtLevel, buildActionEconomy, powerAttackVariant,
  subclassFeaturesKnownAtLevel, combineAttackDamage,
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
  it('names the feat in the DAMAGE breakdown too, so the +10 is auditable', () => {
    const v = powerAttackVariant({
      toHit: '+6',
      damage: '2d6 + 3 slashing',
      damageBreakdown: [{ label: 'weapon die', value: '2d6' }, { label: 'STR', value: 3 }],
    });
    expect(v.damageBreakdown).toContainEqual({ label: 'Great Weapon Master', value: 10 });
    // Numeric terms still reconcile with the damage string: 3 + 10 = 13.
    const flat = v.damageBreakdown.filter((p) => typeof p.value === 'number')
      .reduce((s, p) => s + p.value, 0);
    expect(v.damage).toContain(`+ ${flat}`);
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

  it('lists each spell in the bucket its casting time costs', () => {
    const args = fighterArgs(3, '5e');
    args.characterData = { prepared_spells: ['Healing Word', 'Shield', 'Fireball', 'Mage Hand'] };
    args.spellIndex = {
      'healing word': { casting_time: '1 bonus action', level: 1, school: 'Evocation' },
      shield: { casting_time: '1 reaction', level: 1, school: 'Abjuration' },
      fireball: { casting_time: '1 action', level: 3, school: 'Evocation' },
      'mage hand': { casting_time: '1 action', level: 0, school: 'Conjuration' },
    };
    const ec = buildActionEconomy(args);
    // Cantrips first, then by level — the order a caster scans in.
    expect(ec.action.filter((e) => e.source === 'Spell').map((e) => e.name))
      .toEqual(['Mage Hand', 'Fireball']);
    expect(ec.bonus.filter((e) => e.source === 'Spell').map((e) => e.name)).toEqual(['Healing Word']);
    expect(ec.reaction.filter((e) => e.source === 'Spell').map((e) => e.name)).toEqual(['Shield']);
    // The old collapsed pointer is gone.
    expect(ec.action.map((e) => e.name)).not.toContain('Cast a Spell');
  });

  it('says the level and school on a spell card, and flags concentration', () => {
    const args = fighterArgs(3, '5e');
    args.characterData = { prepared_spells: ['Fireball', 'Hex'] };
    args.spellIndex = {
      fireball: { casting_time: '1 action', level: 3, school: 'Evocation' },
      hex: { casting_time: '1 bonus action', level: 1, school: 'Enchantment', concentration: true },
    };
    const ec = buildActionEconomy(args);
    expect(ec.action.find((e) => e.name === 'Fireball').detail).toBe('Level 3 · Evocation');
    // Concentration changes what you can do on LATER turns, so it belongs on the card.
    expect(ec.bonus.find((e) => e.name === 'Hex').detail).toMatch(/Concentration/);
  });

  it('leaves out a spell whose casting time is longer than a turn', () => {
    const args = fighterArgs(3, '5e');
    args.characterData = { prepared_spells: ['Fireball', 'Find Familiar'] };
    args.spellIndex = {
      fireball: { casting_time: '1 action', level: 3, school: 'Evocation' },
      'find familiar': { casting_time: '1 hour', level: 1, school: 'Conjuration', ritual: true },
    };
    const ec = buildActionEconomy(args);
    const names = [...ec.action, ...ec.bonus, ...ec.reaction].map((e) => e.name);
    expect(names).toContain('Fireball');
    // Not a combat action — left off rather than filed under a wrong bucket.
    expect(names).not.toContain('Find Familiar');
  });

  it('leaves out a spell the compendium does not know, rather than guessing a bucket', () => {
    const args = fighterArgs(3, '5e');
    args.characterData = { prepared_spells: ['Homebrew Bolt'] };
    args.spellIndex = {};
    const ec = buildActionEconomy(args);
    expect([...ec.action, ...ec.bonus, ...ec.reaction].map((e) => e.name)).not.toContain('Homebrew Bolt');
  });

  describe('spells reach the tab from every source the Spells tab shows', () => {
    const idx = {
      'hellish rebuke': { casting_time: '1 reaction', level: 1, school: 'Evocation' },
      thaumaturgy: { casting_time: '1 action', level: 0, school: 'Transmutation' },
      telekinesis: { casting_time: '1 action', level: 5, school: 'Transmutation', concentration: true },
      'misty step': { casting_time: '1 bonus action', level: 2, school: 'Conjuration' },
      fireball: { casting_time: '1 action', level: 3, school: 'Evocation' },
    };

    it('lists a RACIAL reaction spell — the gap that hid a Tiefling reaction entirely', () => {
      const args = fighterArgs(5, '5e');
      args.race = 'Tiefling';
      args.characterData = { race_traits: ['Infernal Legacy'] };
      args.spellIndex = idx;
      const ec = buildActionEconomy(args);
      const rebuke = ec.reaction.find((e) => e.name === 'Hellish Rebuke');
      expect(rebuke).toBeTruthy();
      expect(rebuke.source).toBe('Spell');
      expect(rebuke.detail).toMatch(/From racial/);
      // The trait meters it, so the card gets the same Use control the Spells-tab row has,
      // writing the SAME key — one counter, two surfaces, no drift.
      expect(rebuke.resourceKey).toBe('infernal_hellish_rebuke_used');
    });

    it('lists a race-granted CANTRIP', () => {
      const args = fighterArgs(5, '5e');
      args.race = 'Tiefling';
      args.characterData = { race_traits: ['Infernal Legacy'] };
      args.spellIndex = idx;
      expect(buildActionEconomy(args).action.map((e) => e.name)).toContain('Thaumaturgy');
    });

    it('lists a SUBCLASS-granted spell (Psi Warrior telekinesis)', () => {
      const args = fighterArgs(18, '5e');
      args.subclass = 'Psi Warrior';
      args.spellIndex = idx;
      const tk = buildActionEconomy(args).action.find((e) => e.name === 'Telekinesis');
      expect(tk).toBeTruthy();
      expect(tk.detail).toMatch(/From subclass/);
      expect(tk.detail).toMatch(/Concentration/);
      // No slot and no counter — at will.
      expect(tk.resourceKey).toBeUndefined();
    });

    it('does not list it before the subclass feature is earned', () => {
      const args = fighterArgs(17, '5e');
      args.subclass = 'Psi Warrior';
      args.spellIndex = idx;
      expect(buildActionEconomy(args).action.map((e) => e.name)).not.toContain('Telekinesis');
    });

    it('lists a FEAT-granted spell and carries its free-cast key', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = {
        feats: [{
          name: 'Fey Touched',
          choices: {
            spell_grant: {
              fixed: [{ name: 'Misty Step', level: 2 }],
              free_casts: ['Misty Step'],
              ability: 'intelligence',
            },
          },
        }],
      };
      args.spellIndex = idx;
      const ms = buildActionEconomy(args).bonus.find((e) => e.name === 'Misty Step');
      expect(ms).toBeTruthy();
      expect(ms.detail).toMatch(/From feat/);
      expect(ms.resourceKey).toBe('feat_freecast_misty_step_used');
    });

    // A spell card links to that spell's own row in the Spells tab, so it carries where the
    // spell lives. Resolved here, where the source is already known, rather than re-derived by
    // the tab from the card's prose.
    describe('spellRef — the link into the Spells tab', () => {
      it('carries the name, level and source of a class spell', () => {
        const args = fighterArgs(5, '5e');
        args.characterData = { prepared_spells: ['Fireball'] };
        args.spellIndex = idx;
        expect(buildActionEconomy(args).action.find((e) => e.name === 'Fireball').spellRef)
          .toEqual({ name: 'Fireball', level: 3, source: 'class' });
      });

      it('files a race-granted spell under the Racial source', () => {
        const args = fighterArgs(5, '5e');
        args.race = 'Tiefling';
        args.characterData = { race_traits: ['Infernal Legacy'] };
        args.spellIndex = idx;
        expect(buildActionEconomy(args).reaction.find((e) => e.name === 'Hellish Rebuke').spellRef)
          .toEqual({ name: 'Hellish Rebuke', level: 1, source: 'racial' });
      });

      it('files a subclass-granted spell under the Subclass source', () => {
        const args = fighterArgs(18, '5e');
        args.subclass = 'Psi Warrior';
        args.spellIndex = idx;
        expect(buildActionEconomy(args).action.find((e) => e.name === 'Telekinesis').spellRef.source)
          .toBe('subclass');
      });

      it("maps a feat-granted spell to the tab's PLURAL 'feats' key", () => {
        // The one place the two vocabularies differ, which is why the mapping is written down.
        const args = fighterArgs(5, '5e');
        args.characterData = {
          feats: [{
            name: 'Fey Touched',
            choices: { spell_grant: { fixed: [{ name: 'Misty Step', level: 2 }], ability: 'intelligence' } },
          }],
        };
        args.spellIndex = idx;
        expect(buildActionEconomy(args).bonus.find((e) => e.name === 'Misty Step').spellRef.source)
          .toBe('feats');
      });

      it('gives a cantrip level 0, so the jump opens the Cantrips tab', () => {
        const args = fighterArgs(5, '5e');
        args.race = 'Tiefling';
        args.characterData = { race_traits: ['Infernal Legacy'] };
        args.spellIndex = idx;
        expect(buildActionEconomy(args).action.find((e) => e.name === 'Thaumaturgy').spellRef.level)
          .toBe(0);
      });

      it('is absent from a non-spell entry', () => {
        expect(buildActionEconomy(fighterArgs(5, '5e')).bonus.find((e) => e.name === 'Second Wind').spellRef)
          .toBeUndefined();
      });
    });

    it('names the source only when it is NOT the class list', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { prepared_spells: ['Fireball'] };
      args.spellIndex = idx;
      // "From class" on every spell of a Wizard's list would be pure noise.
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Fireball').detail)
        .not.toMatch(/From/);
    });

    it('lists a spell known from two sources exactly once, keeping the class attribution', () => {
      const args = fighterArgs(5, '5e');
      args.race = 'Tiefling';
      args.characterData = { race_traits: ['Infernal Legacy'], cantrips: ['Thaumaturgy'] };
      args.spellIndex = idx;
      const hits = buildActionEconomy(args).action.filter((e) => e.name === 'Thaumaturgy');
      expect(hits).toHaveLength(1);
      expect(hits[0].detail).not.toMatch(/From racial/);
    });
  });

  it('shows no Spell entries at all when the character can cast nothing', () => {
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
        // Mirrors the seeded 2014 feat: proficiency with improvised weapons is what lets the
        // Actions tab offer an improvised attack to a character who owns no such item.
        { kind: 'proficiency', prof_type: 'weapon', items: ['Improvised weapons'] },
        { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
        { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', trigger: 'After an unarmed hit', description: 'Grapple the target.' },
      ],
    };

    const tb = (ec, opener) => ec['action+bonus'].find((e) => e.name === `Tavern Brawler: ${opener}`);

    // RAW the grapple follows a hit with EITHER an unarmed strike OR an improvised weapon, and
    // those are two different attacks with different to-hit and damage. One card had to pick a
    // winner and silently dropped the other opener.
    it('presents the grapple as TWO Action+Bonus combos, one per opener', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const ec = buildActionEconomy(args);
      // No standalone bonus grapple entry — it is folded into the combos.
      expect(ec.bonus.find((e) => /grapple/i.test(e.name))).toBeFalsy();
      expect(tb(ec, 'Unarmed Strike')).toBeTruthy();
      expect(tb(ec, 'Improvised Weapon')).toBeTruthy();
    });

    it('gives each combo its own Action opener and the shared Grapple bonus', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const ec = buildActionEconomy(args);
      for (const opener of ['Unarmed Strike', 'Improvised Weapon']) {
        const combo = tb(ec, opener);
        expect(combo.source).toBe('Feat');
        expect(combo.cost).toBe('action + bonus action');
        expect(combo.subAttacks.map((x) => x.label)).toEqual(['Action', 'Bonus']);
        expect(combo.subAttacks[0].name).toBe(opener);
        expect(combo.subAttacks[0].damage).toMatch(/1d4/);
        expect(combo.subAttacks[1].name).toBe('Grapple');
        expect(combo.subAttacks[1].detail).toMatch(/grapple/i);
      }
    });

    // The feat means you can pick up a chair, so the attack comes from the FEAT — requiring an
    // "Improvised Weapon" inventory row first would ask the player to inventory the furniture.
    it('offers an Improvised Weapon attack in the Actions tab, owning no such item', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const imp = buildActionEconomy(args).action.find((e) => e.name === 'Improvised Weapon');
      expect(imp).toBeTruthy();
      expect(imp.source).toBe('Weapon');
      // STR 16 (+3) + PB 3 = +6 to hit, 1d4 + 3 damage; proficient via the feat.
      expect(imp.detail).toMatch(/\+6/);
      expect(imp.detail).toMatch(/1d4/);
      expect(imp.detail).not.toMatch(/not proficient/);
    });

    it('offers no improvised attack to a character without the proficiency', () => {
      const ec = buildActionEconomy(fighterArgs(5, '5e'));
      expect(ec.action.find((e) => e.name === 'Improvised Weapon')).toBeFalsy();
    });

    it('uses an EQUIPPED Improvised Weapon instead of the generic one, and does not double it', () => {
      const args = fighterArgs(5, '5e');
      const improvised = {
        uid: 'iw', name: 'Improvised Weapon', category: 'weapons', equipped: true, hand: 'main',
        weapon_category: 'Improvised', weapon_type: 'Melee', damage: '1d4', damage_type: 'bludgeoning',
      };
      args.inventory = [improvised];
      args.attacks = [{ uid: 'iw', name: 'Improvised Weapon', toHit: '+6', damage: '1d4 + 3 bludgeoning', proficient: true }];
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const ec = buildActionEconomy(args);
      // Exactly one Improvised Weapon card — the item's own, not the item's plus the feat's.
      expect(ec.action.filter((e) => e.name === 'Improvised Weapon')).toHaveLength(1);
      const combo = tb(ec, 'Improvised Weapon');
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

    // Both hands full is a state the player changes on this turn (dropping a shield is free), so
    // it is ANNOTATED, not used to hide the cards. Hiding them made the feat look unimplemented
    // to a Fighter holding a weapon and a shield — which is most of them. Found in QA.
    const bothHandsFull = () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [
        { uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' },
        { uid: 'hc', name: 'Crossbow, Hand', category: 'weapons', equipped: true, hand: 'off', weapon_type: 'Ranged', properties: '["Light", "Ammunition"]' },
      ];
      args.characterData = { feats: [TAVERN_BRAWLER] };
      return buildActionEconomy(args);
    };

    it('still shows both combos with both hands full, warning that the grapple needs one', () => {
      const ec = bothHandsFull();
      for (const opener of ['Unarmed Strike', 'Improvised Weapon']) {
        expect(tb(ec, opener)).toBeTruthy();
        expect(tb(ec, opener).warning).toMatch(/free hand/i);
      }
      // Still never a standalone bonus grapple — the combos own it.
      expect(ec.bonus.find((e) => /grapple/i.test(e.name))).toBeFalsy();
    });

    it('still offers the improvised attack with both hands full, warning about the hand', () => {
      const imp = bothHandsFull().action.find((e) => e.name === 'Improvised Weapon');
      expect(imp).toBeTruthy();
      expect(imp.warning).toMatch(/free hand/i);
    });

    it('carries no hand warning at all once a hand is free', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [
        { uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' },
      ]; // off hand free
      const ec = buildActionEconomy({ ...args, characterData: { feats: [TAVERN_BRAWLER] } });
      expect(tb(ec, 'Unarmed Strike').warning).toBeNull();
      expect(ec.action.find((e) => e.name === 'Improvised Weapon').warning).toBeNull();
    });

    // An unarmed strike is a punch, kick or head-butt — the Actions tab already shows one for a
    // character holding a weapon and a shield, so the combo must not disagree with that card.
    it('leads the unarmed combo whatever is in the hands', () => {
      expect(tb(bothHandsFull(), 'Unarmed Strike').subAttacks[0].name).toBe('Unarmed Strike');
    });

    it('shows both combos when a hand is free', () => {
      const args = fighterArgs(14, '5e');
      args.inventory = [
        { uid: 'sc', name: 'Scimitar', category: 'weapons', equipped: true, hand: 'main', weapon_type: 'Melee', properties: '["Finesse", "Light"]' },
      ]; // off hand free
      const ec = buildActionEconomy({ ...args, characterData: { feats: [TAVERN_BRAWLER] } });
      expect(tb(ec, 'Unarmed Strike').subAttacks[0].name).toBe('Unarmed Strike');
      expect(tb(ec, 'Improvised Weapon').subAttacks[0].name).toBe('Improvised Weapon');
    });

    // The 2024 feat drops the grapple clause entirely, so there is no combo to build — but the
    // improvised-weapon proficiency, and so its attack card, survives the revision.
    it('gives the 2024 feat the improvised attack but no combo', () => {
      const args = fighterArgs(5, '5.5e');
      args.characterData = {
        feats: [{
          id: 14, name: 'Tavern Brawler', level: 4,
          effects: [
            { kind: 'proficiency', prof_type: 'weapon', items: ['Improvised weapons'] },
            { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
          ],
        }],
      };
      const ec = buildActionEconomy(args);
      expect(ec.action.find((e) => e.name === 'Improvised Weapon')).toBeTruthy();
      expect(ec['action+bonus'].filter((e) => /^Tavern Brawler/.test(e.name))).toEqual([]);
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

    // 2024 replaces the -5/+10 gamble with Heavy Weapon Master: +PB damage, no attack penalty,
    // once per turn. It stays a TOGGLE rather than folding into the printed damage, because a
    // once-per-turn bonus baked into a flat string claims damage you don't always deal.
    describe('2024 Heavy Weapon Master (+PB damage)', () => {
      const gwm2024 = (level = 4) => {
        const args = fighterArgs(level, '5.5e');
        args.inventory = [greatsword];
        args.attacks = [{ uid: 'gs', name: 'Greatsword', toHit: '+6', damage: '2d6 + 3 slashing', proficient: true }];
        args.characterData = { feats: [GWM] };
        return buildActionEconomy(args).action.find((e) => e.name === 'Greatsword').powerAttack;
      };

      it('adds the proficiency bonus to damage', () => {
        expect(gwm2024(4).damage).toMatch(/2d6 \+ 5 slashing/);
      });

      it('scales with the proficiency bonus', () => {
        expect(gwm2024(17).damage).toMatch(/2d6 \+ 9 slashing/);  // PB 6 at 17th
      });

      // The 2024 feat trades the gamble away — taking a to-hit penalty here would be the 2014
      // mechanic leaking through.
      it('leaves the attack roll alone', () => {
        expect(gwm2024(4).toHit).toBe('+6');
      });

      it('labels the offer as once per turn, not as -5/+10', () => {
        expect(gwm2024(4).offer).toBe('+2 dmg, once per turn');
      });

      it('names the source in the damage breakdown', () => {
        expect(gwm2024(4).damageBreakdown).toContainEqual({ label: 'Great Weapon Master', value: 2 });
      });
    });

    // Sharpshooter is the counter-example: its damage option is 2014-only. The 2024 feat has no
    // damage bonus at all, so offering one would invent a rule.
    it('gives a 2024 Sharpshooter no damage toggle', () => {
      const args = fighterArgs(4, '5.5e');
      args.inventory = [{ uid: 'lb', name: 'Longbow', category: 'weapons', equipped: true, weapon_type: 'Ranged' }];
      args.attacks = [{ uid: 'lb', name: 'Longbow', toHit: '+6', damage: '1d8 + 3 piercing', proficient: true }];
      args.characterData = { feats: [{ id: 40, name: 'Sharpshooter', level: 4 }] };
      expect(buildActionEconomy(args).action.find((e) => e.name === 'Longbow').powerAttack).toBeNull();
    });
  });

  // 2024 Sharpshooter's "Firing in Melee" grants the same lift Crossbow Expert does — a clause
  // the 2014 feat does not have.
  describe('Firing in Melee (within-5-ft disadvantage)', () => {
    const bow = { uid: 'lb', name: 'Longbow', category: 'weapons', equipped: true, weapon_type: 'Ranged' };
    const SS = { id: 40, name: 'Sharpshooter', level: 4 };
    const noteFor = (edition, feats) => {
      const args = fighterArgs(4, edition);
      args.inventory = [bow];
      args.attacks = [{ uid: 'lb', name: 'Longbow', toHit: '+6', damage: '1d8 + 3 piercing', proficient: true }];
      args.characterData = { feats };
      return buildActionEconomy(args).action.find((e) => e.name === 'Longbow').spacingNote;
    };

    it('states the disadvantage for a character with neither feat', () => {
      expect(noteFor('5.5e', [])).toMatch(/have disadvantage while an enemy is within 5 ft/);
    });

    it('a 2024 Sharpshooter lifts it, and is named as the source', () => {
      expect(noteFor('5.5e', [SS])).toMatch(/No disadvantage firing .* \(Sharpshooter\)/);
    });

    // The regression: 2014 Sharpshooter has no such clause, so the note must stand.
    it('a 2014 Sharpshooter does NOT lift it', () => {
      expect(noteFor('5e', [SS])).toMatch(/have disadvantage while an enemy is within 5 ft/);
    });

    it('Crossbow Expert still wins the attribution when both are held', () => {
      expect(noteFor('5.5e', [SS, { id: 12, name: 'Crossbow Expert', level: 4 }]))
        .toMatch(/\(Crossbow Expert\)/);
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

// Riders attach to weapon attack cards from a table now, so a feature and a feat reach the
// same surface by the same route rather than through two hand-written blocks.
describe('buildActionEconomy — ATTACK_RIDERS', () => {
  const args = (extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Champion',
    level: 5,
    edition: '5e',
    characterData: {},
    inventory: [
      { uid: 'w1', category: 'weapons', name: 'Longsword', weapon_type: 'Melee', equipped: true },
      {
        uid: 'w2', category: 'weapons', name: 'Longbow', weapon_type: 'Ranged', equipped: true,
        range_normal: 150, range_long: 600,
      },
    ],
    // `range` is resolved by getAttacks upstream, so an attack row carries it already — the
    // Sharpshooter flag on the band is what these tests assert against.
    attacks: [
      { uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true },
      {
        uid: 'w2', name: 'Longbow', toHit: '+5', damage: '1d8 + 1 piercing', proficient: true,
        range: { normal: 150, long: 600, thrown: false, label: '150/600 ft' },
      },
    ],
    scores: { strength: 16, dexterity: 12 },
    spellIndex: {},
    ...extra,
  });
  const ridersOn = (name, extra) => {
    const e = buildActionEconomy(args(extra)).action.find((x) => x.source === 'Weapon' && x.name === name);
    return (e?.riders ?? []).map((r) => r.source);
  };
  const mounted = { characterData: { feats: [{ id: 26, name: 'Mounted Combatant', level: 4 }] } };

  it('puts Mounted Combatant on melee attacks only', () => {
    expect(ridersOn('Longsword', mounted)).toContain('Mounted Combatant');
    expect(ridersOn('Longbow', mounted)).not.toContain('Mounted Combatant');
  });

  it('omits it entirely without the feat', () => {
    expect(ridersOn('Longsword')).toHaveLength(0);
  });

  it('carries the full feat text, all three clauses', () => {
    const rider = buildActionEconomy(args(mounted)).action
      .find((e) => e.name === 'Longsword').riders.find((r) => r.source === 'Mounted Combatant');
    expect(rider.text).toMatch(/advantage on melee attack rolls/i);   // the attack clause
    expect(rider.text).toMatch(/target you instead/i);                // redirect
    expect(rider.text).toMatch(/Dexterity saving throw/i);            // the mount's evasion
    // The rider stays out of the attack's own rule text.
    expect(buildActionEconomy(args(mounted)).action.find((e) => e.name === 'Longsword').detail)
      .not.toMatch(/Mounted Combatant/);
  });

  it('stacks with a subclass rider on the same card', () => {
    const both = { subclass: 'Cavalier', ...mounted };
    expect(ridersOn('Longsword', both)).toEqual(['Unwavering Mark', 'Mounted Combatant']);
  });

  it('reaches an unarmed strike, which is a melee attack', () => {
    const bare = { ...mounted, inventory: [], attacks: [] };
    expect(ridersOn('Unarmed Strike', bare)).toContain('Mounted Combatant');
  });

  // Sharpshooter's long-range and cover clauses had no home: the -5/+10 got a toggle on the card
  // while the other two stayed prose on the feat card, which is not where you read them.
  describe('Sharpshooter', () => {
    const ss = { characterData: { feats: [{ id: 40, name: 'Sharpshooter', level: 4 }] } };
    const riderOn = (name, extra) => buildActionEconomy(args(extra)).action
      .find((e) => e.source === 'Weapon' && e.name === name)?.riders
      ?.find((r) => r.source === 'Sharpshooter');

    it('lands on ranged attacks only', () => {
      expect(ridersOn('Longbow', ss)).toContain('Sharpshooter');
      expect(ridersOn('Longsword', ss)).not.toContain('Sharpshooter');
    });

    it('omits it entirely without the feat', () => {
      expect(ridersOn('Longbow')).not.toContain('Sharpshooter');
    });

    // Cover is the ONLY clause left in prose — every other one is now a number on this card.
    // The app has no distance-to-target model, so cover has nothing to attach to.
    it('carries the cover clause and nothing else', () => {
      const rider = riderOn('Longbow', ss);
      expect(rider.text).toMatch(/half cover and three-quarters cover/i);
      expect(rider.text).not.toMatch(/long range/i);
    });

    // The long-range clause moved OUT of the rider and onto the range band. The DECISION is
    // getAttacks' (so the Items tab gets the same answer) — see inventoryData's weaponRange
    // tests; this tab's job is to carry the band through to the card untouched.
    it('carries the band through to the card, Sharpshooter flag and all', () => {
      const flagged = args(ss);
      flagged.attacks = flagged.attacks.map((a) => (a.name === 'Longbow'
        ? { ...a, range: { ...a.range, longRangeOk: true, longRangeSource: 'Sharpshooter' } }
        : a));
      const bow = buildActionEconomy(flagged).action.find((e) => e.name === 'Longbow');
      expect(bow.range).toMatchObject({ longRangeOk: true, longRangeSource: 'Sharpshooter' });
    });

    it('carries an unflagged band through unchanged', () => {
      const bow = buildActionEconomy(args()).action.find((e) => e.name === 'Longbow');
      expect(bow.range).toMatchObject({ normal: 150, long: 600 });
      expect(bow.range.longRangeOk).toBeFalsy();
    });

    // A melee weapon has no band at all — its 5 ft is reach, a different concept.
    it('gives a melee weapon no band to annotate', () => {
      expect(buildActionEconomy(args(ss)).action.find((e) => e.name === 'Longsword').range)
        .toBeNull();
    });

    // The -5/+10 is already a toggle on this card; repeating it in the rider would read as a
    // second, separate bonus on top of the one the toggle applies.
    it('does not restate the power attack the card already offers', () => {
      const bow = buildActionEconomy(args(ss)).action.find((e) => e.name === 'Longbow');
      expect(bow.powerAttack).toBeTruthy();
      expect(riderOn('Longbow', ss).text).not.toMatch(/-5|\+10|penalty/i);
    });

    // Sharpshooter does NOT lift the within-5-ft disadvantage (Crossbow Expert does), so the
    // rider must not imply it while the card's own spacing note still stands.
    it('says nothing about attacking within 5 feet', () => {
      expect(riderOn('Longbow', ss).text).not.toMatch(/5 f(ee)?t|within 5/i);
    });

    // The two clauses are worded identically in the 2024 feat, so one edition-neutral row serves
    // both — the same call Polearm Master's rider makes.
    it('applies in 2024 as well, where the card has no power-attack toggle', () => {
      const in2024 = { ...ss, edition: '5.5e' };
      expect(ridersOn('Longbow', in2024)).toContain('Sharpshooter');
      expect(buildActionEconomy(args(in2024)).action.find((e) => e.name === 'Longbow').powerAttack)
        .toBeFalsy();
    });

    it('stacks with another ranged rider rather than replacing it', () => {
      const bow = buildActionEconomy(args(ss)).action.find((e) => e.name === 'Longbow');
      expect(bow.riders.map((r) => r.source)).toEqual(['Sharpshooter']);
      expect(bow.detail ?? '').not.toMatch(/Sharpshooter/);
    });
  });
});

// Riders that hang off ONE NAMED entry come from a table too, so a subclass feature and a feat
// modify the same universal action by the same route. Arcane Charge and Hold the Line keep
// their own tests above — those pass unchanged through the migration, which is the point.
describe('buildActionEconomy — ENTRY_RIDERS (Sentinel)', () => {
  // Sentinel as the app stores it: the reaction attack is an `action` effect, the two
  // opportunity-attack clauses are a display-only note (which is why they never reached this
  // tab before) — the rider text for those lives in ENTRY_RIDERS.
  const SENTINEL = {
    id: 30,
    name: 'Sentinel',
    level: 4,
    effects: [
      {
        kind: 'action',
        name: 'Sentinel Strike',
        economy: 'reaction',
        trigger: 'When a creature within 5 ft attacks a target other than you',
        description: 'Make a melee weapon attack against the attacking creature.',
      },
      { kind: 'note', text: "Your opportunity-attack hits reduce the target's speed to 0; creatures provoke even when they Disengage." },
    ],
  };

  const args = (extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Champion',
    level: 5,
    edition: '5e',
    characterData: {},
    inventory: [],
    attacks: [{ uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true }],
    scores: { strength: 16, dexterity: 12 },
    spellIndex: {},
    ...extra,
  });
  const withSentinel = (extra = {}) => args({ characterData: { feats: [SENTINEL] }, ...extra });
  const oaFrom = (a) => buildActionEconomy(a).reaction.find((e) => e.key === 'universal:Opportunity Attack');

  it('rides on the universal Opportunity Attack when the character has the feat', () => {
    const riders = oaFrom(withSentinel()).riders;
    expect(riders.map((r) => r.source)).toEqual(['Sentinel']);
  });

  it('carries both opportunity-attack clauses — the ones that had no home before', () => {
    const rider = oaFrom(withSentinel()).riders[0];
    expect(rider.text).toMatch(/speed reduced to 0/i);   // the speed clause
    expect(rider.text).toMatch(/Disengage/i);            // the provoke-anyway clause
  });

  it('stays out of the base rule text — it is not what every opportunity attack does', () => {
    const oa = oaFrom(withSentinel());
    expect(oa.detail).not.toMatch(/Sentinel|Disengage/);
    expect(oa.detail).toMatch(/leaves your reach/i);
  });

  it('omits the rider entirely without the feat', () => {
    expect(oaFrom(args()).riders ?? []).toHaveLength(0);
  });

  it('keeps Sentinel Strike a separate reaction entry — a different trigger, not an OA', () => {
    const reactions = buildActionEconomy(withSentinel()).reaction;
    const strike = reactions.find((e) => e.name === 'Sentinel Strike');
    expect(strike.source).toBe('Feat');
    expect(strike.cost).toBe('reaction');
    expect(strike.detail).toMatch(/attacks a target other than you/i);
    // It spends your normal reaction, so it is NOT an extra reaction (contrast Vigilant Defender).
    expect(strike.extraReaction).toBeFalsy();
    // …and it is not duplicated into the rider.
    expect(oaFrom(withSentinel()).riders[0].text).not.toMatch(/Sentinel Strike/);
  });

  it('applies in 2024 too — the rewrite keeps all three clauses', () => {
    const riders = oaFrom(withSentinel({ edition: '5.5e' })).riders;
    expect(riders.map((r) => r.source)).toEqual(['Sentinel']);
  });

  it('stacks with a subclass rider on the same entry', () => {
    const both = withSentinel({ subclass: 'Cavalier', level: 10 });
    expect(oaFrom(both).riders.map((r) => r.source)).toEqual(['Hold the Line', 'Sentinel']);
  });

  it('does not print the level it was gained', () => {
    expect(oaFrom(withSentinel()).riders[0].text).not.toMatch(/\bL\d+\b/);
  });
});

// The second entry rider, and the first that is EQUIPMENT-gated: the reach clause is only true
// while you're actually holding a qualifying polearm.
describe('buildActionEconomy — ENTRY_RIDERS (Polearm Master)', () => {
  const PAM = {
    id: 24,
    name: 'Polearm Master',
    level: 4,
    effects: [
      {
        kind: 'action',
        name: 'Polearm butt-end attack',
        economy: 'bonus',
        description: "Make a melee attack with the weapon's opposite end (1d4 bludgeoning).",
      },
      { kind: 'note', text: 'Creatures provoke an opportunity attack when they enter your reach.' },
    ],
  };
  const weapon = (name, properties) => ({
    uid: name, category: 'weapons', name, weapon_type: 'Melee', equipped: true, properties,
  });
  const HALBERD = weapon('Halberd', '["Heavy", "Reach", "Two-Handed"]');
  const PIKE = weapon('Pike', '["Heavy", "Reach", "Two-Handed"]');
  const SPEAR = weapon('Spear', '["Thrown", "Versatile", "Monk"]');
  const LONGSWORD = weapon('Longsword', '["Versatile"]');

  const args = ({ feats = [PAM], inventory = [HALBERD], edition = '5e' } = {}) => ({
    charClass: 'Fighter',
    subclass: 'Champion',
    level: 5,
    edition,
    characterData: { feats },
    inventory,
    attacks: [{ uid: 'Halberd', name: 'Halberd', toHit: '+7', damage: '1d10 + 4 slashing', proficient: true }],
    scores: { strength: 18, dexterity: 12 },
    spellIndex: {},
  });
  const riderSources = (a) => (buildActionEconomy(a).reaction
    .find((e) => e.key === 'universal:Opportunity Attack').riders ?? []).map((r) => r.source);

  it('rides on the Opportunity Attack while a qualifying polearm is equipped', () => {
    expect(riderSources(args())).toEqual(['Polearm Master']);
  });

  it('says creatures provoke on ENTERING your reach — the clause the feat note never surfaced', () => {
    const rider = buildActionEconomy(args()).reaction
      .find((e) => e.key === 'universal:Opportunity Attack').riders[0];
    expect(rider.text).toMatch(/enter your reach/i);
    expect(rider.text).toMatch(/not only when they leave/i);
  });

  it('is hidden when no polearm is equipped — the same gate the bonus attack uses', () => {
    expect(riderSources(args({ inventory: [LONGSWORD] }))).toEqual([]);
    expect(riderSources(args({ inventory: [] }))).toEqual([]);
  });

  it('is hidden without the feat, polearm or not', () => {
    expect(riderSources(args({ feats: [] }))).toEqual([]);
  });

  // RAW the feat's two halves take DIFFERENT weapon lists, which is why the reach clause has
  // its own predicate: 5e drops the spear and adds the pike.
  it('5e: a pike qualifies but a spear does not', () => {
    expect(riderSources(args({ inventory: [PIKE] }))).toEqual(['Polearm Master']);
    expect(riderSources(args({ inventory: [SPEAR] }))).toEqual([]);
  });

  it('2024: a spear qualifies, and so does any Heavy + Reach weapon', () => {
    const ed = { edition: '5.5e' };
    expect(riderSources(args({ ...ed, inventory: [SPEAR] }))).toEqual(['Polearm Master']);
    expect(riderSources(args({ ...ed, inventory: [HALBERD] }))).toEqual(['Polearm Master']);
    expect(riderSources(args({ ...ed, inventory: [LONGSWORD] }))).toEqual([]);
  });

  it('an unequipped polearm does not count — you have to be holding it', () => {
    expect(riderSources(args({ inventory: [{ ...HALBERD, equipped: false }] }))).toEqual([]);
  });

  it('stacks with Sentinel on the same card, in table order', () => {
    const sentinel = { id: 30, name: 'Sentinel', level: 4, effects: [] };
    expect(riderSources(args({ feats: [PAM, sentinel] }))).toEqual(['Polearm Master', 'Sentinel']);
  });

  it('leaves the feat bonus-action attack entry alone', () => {
    const bonus = buildActionEconomy(args()).bonus.find((e) => e.source === 'Feat');
    expect(bonus.name).toMatch(/butt-end/i);
    // The bonus half is gated on its OWN (different) weapon list — a spear still enables it.
    const withSpear = buildActionEconomy(args({ inventory: [SPEAR] })).bonus
      .find((e) => e.source === 'Feat');
    expect(withSpear).toBeTruthy();
  });
});

describe('buildActionEconomy — Cavalier (Fighter subclass)', () => {
  const cavArgs = (level, extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Cavalier',
    level,
    edition: '5e',
    characterData: {},
    inventory: [],
    attacks: [{
      uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true,
      damageBreakdown: [{ label: 'weapon die', value: '1d8' }, { label: 'STR', value: 3 }],
    }],
    scores: { strength: 16 },
    spellIndex: {},
    ...extra,
  });

  // Unwavering Mark is two mechanics at two costs. Marking is free and rides on the melee
  // attack that triggers it; only the follow-up attack is a bonus action with a pool.
  const markedTarget = (lvl, extra) =>
    buildActionEconomy(cavArgs(lvl, extra)).bonus.find((e) => e.name === 'Marked Target');
  const meleeRider = (lvl, extra) =>
    (buildActionEconomy(cavArgs(lvl, extra)).action.find((e) => e.source === 'Weapon')?.riders ?? [])
      .find((r) => r.source === 'Unwavering Mark');

  it('the follow-up attack is a bonus action wired to its long-rest pool from L3', () => {
    const entry = markedTarget(3);
    expect(entry.resourceKey).toBe('unwavering_mark_used');
    expect(entry.cost).toBe('bonus action');
    // Named for the trigger the player scans for mid-combat, not for the feature.
    expect(buildActionEconomy(cavArgs(3)).bonus.find((e) => e.name === 'Unwavering Mark')).toBeFalsy();
    expect(entry.detail).toMatch(/deals damage to anyone other than you/i);
    expect(entry.detail).toMatch(/advantage/i);
  });

  it('the folded half-level shows as its own term in the damage breakdown', () => {
    // Folding keeps the number rollable; the breakdown keeps it auditable.
    const parts = markedTarget(7).subAttacks[0].damageBreakdown;
    expect(parts).toContainEqual({ label: 'half Fighter level (Unwavering Mark)', value: 3 });
    // Terms still reconcile with the displayed damage: 1d8 + STR 3 + mark 3 = 1d8 + 6.
    const flat = parts.filter((p) => typeof p.value === 'number').reduce((s, p) => s + p.value, 0);
    expect(flat).toBe(6);
    expect(markedTarget(7).subAttacks[0].damage).toContain(`+ ${flat}`);
  });

  it('the follow-up card shows the real attack with half Fighter level folded into the damage', () => {
    // L7 → half level 3. Longsword 1d8 + 3 → 1d8 + 6, rolled once, so it is ONE number.
    const entry = markedTarget(7);
    expect(entry.subAttacks).toHaveLength(1);
    expect(entry.subAttacks[0]).toMatchObject({
      name: 'Longsword', toHit: '+5', damage: '1d8 + 6 slashing', note: 'with advantage',
    });
    expect(entry.detail).toMatch(/already/i); // says the bonus is included, not to be added again
    // L3 → half level 1.
    expect(markedTarget(3).subAttacks[0].damage).toBe('1d8 + 4 slashing');
  });

  it('an unarmed strike is a melee weapon attack for the mark, and gets the bonus too', () => {
    const entry = markedTarget(7, { attacks: [] }); // nothing equipped → unarmed strike row
    expect(entry.subAttacks.map((s) => s.name)).toEqual(['Unarmed Strike']);
    // STR 16 → 1 + 3 = 4 bludgeoning, +3 half level = 7.
    expect(entry.subAttacks[0].damage).toBe('7 bludgeoning');
    expect(meleeRider(7, { attacks: [] })).toBeTruthy();
  });

  it('marking rides on the melee attack card, free and unlimited, not on the pool', () => {
    const rider = meleeRider(3);
    expect(rider.text).toMatch(/disadvantage on any attack roll that doesn't target you/i);
    expect(rider.text).toMatch(/costs nothing/i);
    expect(rider.text).toMatch(/no limit/i);
    // It stays out of the attack's own rule text — it isn't what every attack does.
    const atk = buildActionEconomy(cavArgs(3)).action.find((e) => e.source === 'Weapon');
    expect(atk.detail).not.toMatch(/Unwavering Mark/);
  });

  it('drops both surfaces entirely when only a ranged weapon is equipped', () => {
    // A bow can't trigger the mark, so there is no follow-up to offer — the card is omitted
    // rather than shown empty. (Bare-handed is different: an unarmed strike IS a melee attack,
    // covered by the unarmed test above, so that Cavalier keeps the card.)
    const bow = { attacks: [{ uid: 'w2', name: 'Longbow', toHit: '+7', damage: '1d8 + 3 piercing', proficient: true }],
      inventory: [{ uid: 'w2', category: 'weapons', name: 'Longbow', weapon_type: 'Ranged', equipped: true }] };
    expect(meleeRider(7, bow)).toBeFalsy();
    expect(markedTarget(7, bow)).toBeFalsy();
  });

  it('neither surface exists below L3, nor for another subclass', () => {
    expect(markedTarget(2)).toBeFalsy();
    expect(meleeRider(2)).toBeFalsy();
    const champ = { charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5e',
      characterData: {}, inventory: [], scores: { strength: 16 }, spellIndex: {},
      attacks: [{ uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true }] };
    expect(buildActionEconomy(champ).bonus.find((e) => e.name === 'Marked Target')).toBeFalsy();
    expect(buildActionEconomy(champ).action.find((e) => e.source === 'Weapon').riders ?? []).toHaveLength(0);
  });

  it('Warding Maneuver is a reaction from L7, not before', () => {
    expect(buildActionEconomy(cavArgs(6)).reaction.find((e) => e.name === 'Warding Maneuver')).toBeFalsy();
    const entry = buildActionEconomy(cavArgs(7)).reaction.find((e) => e.name === 'Warding Maneuver');
    expect(entry.resourceKey).toBe('warding_maneuver_used');
    expect(entry.detail).toMatch(/resistance/i);          // RAW consequence, not "1d8 force damage"
    expect(entry.detail).not.toMatch(/force damage/i);
    expect(entry.detail).toMatch(/melee weapon or a shield/i); // the wielding prerequisite
  });

  it('Ferocious Charger computes its save DC from level and Strength', () => {
    // L15 → PB +5; STR 16 → +3; DC 8 + 5 + 3 = 16.
    const l15 = buildActionEconomy(cavArgs(15)).no_action.find((e) => e.name === 'Ferocious Charger');
    expect(l15.saveDc.label).toBe('Strength save DC');
    expect(l15.saveDc.breakdown.total).toBe(16);
    // A different Strength gives a different DC — the point of computing it at all.
    const strong = buildActionEconomy(cavArgs(15, { scores: { strength: 20 } }))
      .no_action.find((e) => e.name === 'Ferocious Charger');
    expect(strong.saveDc.breakdown.total).toBe(18);
    expect(buildActionEconomy(cavArgs(14)).no_action.find((e) => e.name === 'Ferocious Charger')).toBeFalsy();
  });

  it('names each term of the Ferocious Charger DC, and keeps them out of the rules text', () => {
    const entry = buildActionEconomy(cavArgs(15)).no_action.find((e) => e.name === 'Ferocious Charger');
    expect(entry.saveDc.breakdown.parts.map((p) => p.label))
      .toEqual(['Base', 'Proficiency bonus', 'STR modifier']);
    // The terms sum to the number they explain.
    expect(entry.saveDc.breakdown.parts.reduce((s, p) => s + p.value, 0))
      .toBe(entry.saveDc.breakdown.total);
    // The sentence stays readable — no arithmetic inlined into it.
    expect(entry.detail).toMatch(/Strength saving throw or be knocked prone/i);
    expect(entry.detail).not.toMatch(/DC|8 \+ PB/);
  });

  it('Hold the Line rides on the universal Opportunity Attack from L10', () => {
    const oaAt = (lvl) => buildActionEconomy(cavArgs(lvl)).reaction
      .find((e) => e.key === 'universal:Opportunity Attack');
    expect(oaAt(9).riders ?? []).toHaveLength(0);
    const riders = oaAt(10).riders;
    expect(riders).toHaveLength(1);
    expect(riders[0].source).toBe('Hold the Line');
    expect(riders[0].text).toMatch(/speed reduced to 0/i);
    // Stays out of the base rule text — it isn't something every opportunity attack does.
    expect(oaAt(10).detail).not.toMatch(/Hold the Line/);
  });

  // Vigilant Defender grants a WHOLE SEPARATE reaction, so it is an entry of its own rather
  // than a rider — as a rider the Reactions tab showed a lone Opportunity Attack and nothing
  // told the player they had a second reaction economy.
  it('Vigilant Defender is its own reaction entry at L18, flagged as an extra reaction', () => {
    const reactions = buildActionEconomy(cavArgs(18)).reaction;
    const vd = reactions.find((e) => e.name === 'Vigilant Defender');
    expect(vd.extraReaction).toBe(true);
    expect(vd.cost).toBe('special reaction');
    expect(vd.detail).toMatch(/does not consume your normal reaction/i);
    expect(vd.detail).toMatch(/every creature's turn except your own/i);
    // …and it is no longer duplicated as a rider on the Opportunity Attack.
    const oaRiders = reactions.find((e) => e.key === 'universal:Opportunity Attack').riders;
    expect(oaRiders.map((r) => r.source)).toEqual(['Hold the Line']);
  });

  it('Vigilant Defender does not exist below L18, and Hold the Line still rides on the OA', () => {
    const at17 = buildActionEconomy(cavArgs(17)).reaction;
    expect(at17.find((e) => e.name === 'Vigilant Defender')).toBeFalsy();
    expect(at17.find((e) => e.key === 'universal:Opportunity Attack').riders
      .map((r) => r.source)).toEqual(['Hold the Line']);
  });

  it('no other reaction is flagged as an extra reaction', () => {
    const flagged = buildActionEconomy(cavArgs(18)).reaction.filter((e) => e.extraReaction);
    expect(flagged.map((e) => e.name)).toEqual(['Vigilant Defender']);
  });

  it('keeps Hold the Line as a rider — it modifies the opportunity attack rather than adding one', () => {
    const riders = buildActionEconomy(cavArgs(18)).reaction
      .find((e) => e.key === 'universal:Opportunity Attack').riders;
    expect(riders.map((r) => r.source)).toEqual(['Hold the Line']);
  });

  it('gives none of it to another Fighter subclass', () => {
    const champ = buildActionEconomy({ ...cavArgs(18), subclass: 'Champion' });
    expect(champ.bonus.find((e) => e.name === 'Unwavering Mark')).toBeFalsy();
    expect(champ.reaction.find((e) => e.name === 'Warding Maneuver')).toBeFalsy();
    expect(champ.reaction.find((e) => e.key === 'universal:Opportunity Attack').riders ?? []).toHaveLength(0);
  });
});

describe('buildActionEconomy — Echo Knight (Fighter subclass)', () => {
  const ekArgs = (level, extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Echo Knight',
    level,
    edition: '5e',
    characterData: {},
    inventory: [],
    attacks: [{
      uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true,
      damageBreakdown: [{ label: 'weapon die', value: '1d8' }, { label: 'STR', value: 3 }],
    }],
    scores: { strength: 16, constitution: 16 },
    spellIndex: {},
    ...extra,
  });
  const entry = (level, bucket, name, extra) =>
    buildActionEconomy(ekArgs(level, extra))[bucket].find((e) => e.name === name);

  it('Manifest Echo is a bonus action from L3', () => {
    const e = entry(3, 'bonus', 'Manifest Echo');
    expect(e.cost).toBe('bonus action');
    expect(e.source).toBe('Subclass');
  });

  it("shows the echo's real AC, computed from level — not a formula the player has to resolve", () => {
    // Same number the Features-tab statblock shows; both come from echoArmorClass.
    expect(entry(3, 'bonus', 'Manifest Echo').detail).toMatch(/AC 16/);
    expect(entry(17, 'bonus', 'Manifest Echo').detail).toMatch(/AC 20/);
  });

  it('mentions the second echo only once Legion of One is online', () => {
    expect(entry(17, 'bonus', 'Manifest Echo').detail).not.toMatch(/Legion of One/);
    expect(entry(18, 'bonus', 'Manifest Echo').detail).toMatch(/creates two/i);
  });

  // QA: as a standalone No Action entry it was unfindable — you reach for it in the middle of
  // taking the Attack action, so it belongs on the attack card you are already reading.
  describe('Unleash Incarnation attaches to the melee attack cards', () => {
    it('rides on the melee weapon card with its own pool, not as its own entry', () => {
      const eco = buildActionEconomy(ekArgs(3));
      expect(eco.no_action.find((e) => e.name === 'Unleash Incarnation')).toBeFalsy();
      const sword = eco.action.find((e) => e.name === 'Longsword');
      expect(sword.attachedFeatures.map((f) => f.name)).toEqual(['Unleash Incarnation']);
      expect(sword.attachedFeatures[0].resourceKey).toBe('unleash_incarnation_used');
    });

    it('names the weapon in the note, so the card reads on its own', () => {
      const sword = buildActionEconomy(ekArgs(3)).action.find((e) => e.name === 'Longsword');
      expect(sword.attachedFeatures[0].note).toMatch(/additional melee attack with Longsword/);
      expect(sword.attachedFeatures[0].note).toMatch(/echo's position/);
    });

    it('does not attach the attack card its own top-level resource', () => {
      // The pool belongs to the feature, not the longsword — a "5 / 5 remaining" on the
      // weapon itself would claim the weapon had five uses.
      const sword = buildActionEconomy(ekArgs(3)).action.find((e) => e.name === 'Longsword');
      expect(sword.resourceKey).toBeUndefined();
    });

    it('attaches to every melee attack, not just the first', () => {
      const twoWeapons = ekArgs(3, {
        attacks: [
          { uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true },
          { uid: 'w2', name: 'Handaxe', toHit: '+5', damage: '1d6 + 3 slashing', proficient: true },
        ],
      });
      const eco = buildActionEconomy(twoWeapons);
      for (const name of ['Longsword', 'Handaxe']) {
        expect(eco.action.find((e) => e.name === name).attachedFeatures).toHaveLength(1);
      }
    });

    it('is absent before L3', () => {
      const eco = buildActionEconomy(ekArgs(2));
      expect(eco.action.find((e) => e.name === 'Longsword').attachedFeatures).toBeUndefined();
      expect(eco.no_action.find((e) => e.name === 'Unleash Incarnation')).toBeFalsy();
    });

    it('another Fighter subclass gets neither the attachment nor the entry', () => {
      const eco = buildActionEconomy({ ...ekArgs(3), subclass: 'Champion' });
      expect(eco.action.find((e) => e.name === 'Longsword').attachedFeatures).toBeUndefined();
      expect(eco.no_action.find((e) => e.name === 'Unleash Incarnation')).toBeFalsy();
    });

    // The feature must never simply vanish — a bow-only Echo Knight still has it, they just
    // have nothing to hang it on, so it falls back to a standalone entry (Arcane Shot's shape).
    it('falls back to a standalone entry when there is no melee attack to attach to', () => {
      const bowOnly = ekArgs(3, {
        // The melee flag is derived from the INVENTORY entry's weapon_type, so the fixture
        // needs a real ranged weapon behind the attack row — not just a flag on the row.
        inventory: [{
          uid: 'w1', name: 'Longbow', category: 'weapons', weapon_type: 'Ranged',
          equipped: true, hand: 'both',
        }],
        attacks: [{ uid: 'w1', name: 'Longbow', toHit: '+5', damage: '1d8 + 3 piercing', proficient: true }],
      });
      const eco = buildActionEconomy(bowOnly);
      const melee = eco.action.filter((e) => e.source === 'Weapon' && e.melee);
      expect(melee).toHaveLength(0);
      const standalone = eco.no_action.find((e) => e.name === 'Unleash Incarnation');
      expect(standalone).toBeTruthy();
      expect(standalone.resourceKey).toBe('unleash_incarnation_used');
    });
  });

  it('Echo Avatar is an action from L7, and is not concentration', () => {
    expect(entry(3, 'action', 'Echo Avatar')).toBeFalsy();
    const e = entry(7, 'action', 'Echo Avatar');
    expect(e.cost).toBe('action');
    expect(e.detail).not.toMatch(/concentration/i);
    expect(e.detail).toMatch(/1,000 feet/);
  });

  it('Shadow Martyr is a reaction from L10, wired to its short-rest pool', () => {
    expect(entry(9, 'reaction', 'Shadow Martyr')).toBeFalsy();
    const e = entry(10, 'reaction', 'Shadow Martyr');
    expect(e.resourceKey).toBe('shadow_martyr_used');
    // The recharge the app's old feature text omitted entirely.
    expect(e.detail).toMatch(/short or long rest/i);
  });

  it('Reclaim Potential computes its temp HP from Constitution', () => {
    expect(entry(14, 'no_action', 'Reclaim Potential')).toBeFalsy();
    const e = entry(15, 'no_action', 'Reclaim Potential');
    expect(e.detail).toMatch(/2d6 \+3/);          // CON 16
    expect(e.resourceKey).toBe('reclaim_potential_used');
    expect(entry(15, 'no_action', 'Reclaim Potential', { scores: { constitution: 8 } }).detail)
      .toMatch(/2d6 -1/);
  });

  it('gives another Fighter subclass none of it', () => {
    const champ = buildActionEconomy(ekArgs(18, { subclass: 'Champion' }));
    expect(champ.bonus.find((e) => e.name === 'Manifest Echo')).toBeFalsy();
    expect(champ.no_action.find((e) => e.name === 'Unleash Incarnation')).toBeFalsy();
    expect(champ.reaction.find((e) => e.name === 'Shadow Martyr')).toBeFalsy();
  });
});

describe('buildActionEconomy — Psi Warrior (Fighter subclass)', () => {
  const pwArgs = (level, extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Psi Warrior',
    level,
    edition: '5e',
    characterData: {},
    inventory: [],
    attacks: [{
      uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true,
    }],
    scores: { strength: 16, intelligence: 16 },
    spellIndex: {},
    ...extra,
  });
  const entry = (level, bucket, name, extra) =>
    buildActionEconomy(pwArgs(level, extra))[bucket].find((e) => e.name === name);

  // The whole point of routing every number through psiWarriorData: the stored feature blurb
  // says a flat "d6s" in both editions, and a card built from that text lies from 5th level on.
  describe('Psionic Strike attaches to the weapon attack cards', () => {
    it('rides on the weapon card with the shared Psionic Energy pool', () => {
      const eco = buildActionEconomy(pwArgs(3));
      expect(eco.no_action.find((e) => e.name === 'Psionic Strike')).toBeFalsy();
      const sword = eco.action.find((e) => e.name === 'Longsword');
      expect(sword.attachedFeatures.map((f) => f.name)).toEqual(['Psionic Strike']);
      expect(sword.attachedFeatures[0].resourceKey).toBe('psionic_energy_used');
    });

    it('names the weapon and scales the die with level', () => {
      const at3 = buildActionEconomy(pwArgs(3)).action.find((e) => e.name === 'Longsword');
      expect(at3.attachedFeatures[0].note).toMatch(/with Longsword/);
      expect(at3.attachedFeatures[0].note).toMatch(/1d6 \+ 3 force damage/);
      const at11 = buildActionEconomy(pwArgs(11)).action.find((e) => e.name === 'Longsword');
      expect(at11.attachedFeatures[0].note).toMatch(/1d10 \+ 3 force damage/);
    });

    // RAW is "a weapon attack", not a melee one — a Psi Warrior with a bow gets it too. This is
    // the case that makes the attach scope 'all' rather than the Echo Knight's 'melee'.
    it('attaches to a RANGED weapon attack as well', () => {
      const bowOnly = pwArgs(3, {
        inventory: [{
          uid: 'w1', name: 'Longbow', category: 'weapons', weapon_type: 'Ranged',
          equipped: true, hand: 'both',
        }],
        attacks: [{ uid: 'w1', name: 'Longbow', toHit: '+5', damage: '1d8 + 3 piercing', proficient: true }],
      });
      const eco = buildActionEconomy(bowOnly);
      const bow = eco.action.find((e) => e.name === 'Longbow');
      expect(bow.attachedFeatures.map((f) => f.name)).toEqual(['Psionic Strike']);
      expect(eco.no_action.find((e) => e.name === 'Psionic Strike')).toBeFalsy();
    });

    // A bare-handed character still gets an Unarmed Strike row, and RAW an unarmed strike IS a
    // melee weapon attack — the same call Unleash Incarnation and Unwavering Mark already make.
    // So a Psi Warrior with nothing equipped keeps the feature on that card rather than falling
    // back; the standalone fallback branch is the shared one the Echo Knight bow-only case
    // exercises, and stays in place for a character with no attack row at all.
    it('attaches to the unarmed strike when nothing is equipped', () => {
      const eco = buildActionEconomy(pwArgs(3, { attacks: [] }));
      const unarmed = eco.action.find((e) => e.name === 'Unarmed Strike');
      expect(unarmed.attachedFeatures.map((f) => f.name)).toEqual(['Psionic Strike']);
      expect(eco.no_action.find((e) => e.name === 'Psionic Strike')).toBeFalsy();
    });

    it('is absent before L3 and for another subclass', () => {
      expect(buildActionEconomy(pwArgs(2)).action.find((e) => e.name === 'Longsword').attachedFeatures)
        .toBeUndefined();
      expect(buildActionEconomy(pwArgs(3, { subclass: 'Champion' })).action
        .find((e) => e.name === 'Longsword').attachedFeatures).toBeUndefined();
    });
  });

  // Telekinetic Thrust fires on a Psionic Strike hit, so it rides on the same cards rather than
  // becoming a bonus-action card for something that costs nothing.
  describe('Telekinetic Thrust rides alongside Psionic Strike from L7', () => {
    it('adds a second attached block with a computed save DC', () => {
      const sword = buildActionEconomy(pwArgs(7)).action.find((e) => e.name === 'Longsword');
      expect(sword.attachedFeatures.map((f) => f.name))
        .toEqual(['Psionic Strike', 'Telekinetic Thrust']);
      // 8 + PB 3 + INT 3
      expect(sword.attachedFeatures[1].note).toMatch(/DC 14/);
      expect(sword.attachedFeatures[1].note).toMatch(/knocked prone or pushed/);
    });

    it('costs nothing of its own, so it carries no resource', () => {
      const sword = buildActionEconomy(pwArgs(7)).action.find((e) => e.name === 'Longsword');
      expect(sword.attachedFeatures[1].resourceKey).toBeNull();
    });

    it('is absent at L6', () => {
      const sword = buildActionEconomy(pwArgs(6)).action.find((e) => e.name === 'Longsword');
      expect(sword.attachedFeatures.map((f) => f.name)).toEqual(['Psionic Strike']);
    });
  });

  it('Protective Field is a reaction from L3 that spends the shared pool', () => {
    const e = entry(3, 'reaction', 'Protective Field');
    expect(e.resourceKey).toBe('psionic_energy_used');
    expect(e.detail).toMatch(/1d6 \+ 3/);
    // The floor RAW gives it, which the stored blurb omits.
    expect(e.detail).toMatch(/minimum reduction of 1/);
  });

  // The stored blurb calls this a bonus action in BOTH editions; RAW is an action.
  it('Telekinetic Movement is an ACTION with its own free short-rest use', () => {
    const e = entry(3, 'action', 'Telekinetic Movement');
    expect(e.cost).toBe('action');
    expect(e.resourceKey).toBe('telekinetic_movement_used');
    expect(e.detail).toMatch(/spend a Psionic Energy die instead/);
  });

  // The stored blurb says "fly speed equal to walking speed" — RAW is twice.
  it('Psi-Powered Leap is a bonus action from L7 granting twice your walking speed', () => {
    expect(entry(6, 'bonus', 'Psi-Powered Leap')).toBeFalsy();
    const e = entry(7, 'bonus', 'Psi-Powered Leap');
    expect(e.cost).toBe('bonus action');
    expect(e.detail).toMatch(/twice your walking speed/);
    expect(e.resourceKey).toBe('psi_powered_leap_used');
  });

  it("Guarded Mind's condition break is a no-action die spend from L10", () => {
    expect(entry(9, 'no_action', 'Guarded Mind (end a condition)')).toBeFalsy();
    const e = entry(10, 'no_action', 'Guarded Mind (end a condition)');
    expect(e.resourceKey).toBe('psionic_energy_used');
    expect(e.detail).toMatch(/charmed or frightened/);
    // The passive psychic resistance belongs to the Defenses card, not to an action bucket.
    expect(e.detail).not.toMatch(/resistance/i);
  });

  it('Bulwark of Force counts its targets from Intelligence, floored at one', () => {
    expect(entry(14, 'bonus', 'Bulwark of Force')).toBeFalsy();
    expect(entry(15, 'bonus', 'Bulwark of Force').detail).toMatch(/up to 3 creatures/);
    expect(entry(15, 'bonus', 'Bulwark of Force', { scores: { intelligence: 20 } }).detail)
      .toMatch(/up to 5 creatures/);
    expect(entry(15, 'bonus', 'Bulwark of Force', { scores: { intelligence: 8 } }).detail)
      .toMatch(/up to 1 creature/);
  });

  // Two costs, so two cards. The single card this replaced was badged 'bonus action' while its
  // headline half — casting telekinesis — is an action, so the badge mis-stated the feature.
  describe('Telekinetic Master pairs the spell with the attack it enables', () => {
    it('puts casting telekinesis on an ACTION card', () => {
      expect(entry(17, 'action', 'Cast Telekinesis')).toBeFalsy();
      const e = entry(18, 'action', 'Cast Telekinesis');
      expect(e.cost).toBe('action');
      expect(e.detail).toMatch(/at will/i);
      expect(e.detail).toMatch(/Intelligence/);
      // At will means no counter to spend — nothing for a Use control to touch.
      expect(e.resourceKey).toBeUndefined();
    });

    it('pairs the weapon attack with telekinesis as an ACTION + BONUS combo', () => {
      // Not a lone bonus action: RAW telekinesis is exerted as your action each round, so the
      // bonus attack only ever happens on a turn whose action IS telekinesis. Filed under
      // 'bonus' the card sat alone with nothing naming the action that enables it.
      expect(entry(17, 'action+bonus', 'Telekinetic Master')).toBeFalsy();
      const e = entry(18, 'action+bonus', 'Telekinetic Master');
      expect(e.cost).toBe('action + bonus action');
      // The app models no concentration state, so the gate is TEXT on the card, not a filter.
      expect(e.detail).toMatch(/concentrating on telekinesis/i);
      expect(e.resourceKey).toBeUndefined();
    });

    it('leads the combo with a Telekinesis ACTION half that is not an attack', () => {
      const e = entry(18, 'action+bonus', 'Telekinetic Master');
      // The Action half is the ONLY summary row; the bonus half is a full card (below).
      expect(e.subAttacks).toHaveLength(1);
      const [first] = e.subAttacks;
      expect(first.label).toBe('Action');
      expect(first.name).toBe('Telekinesis');
      expect(first.detail).toMatch(/your action each round/i);
      expect(first.toHit).toBeUndefined();
    });

    it('ships the FULL weapon entry as the bonus half, not a summary row', () => {
      // The bonus attack is an ordinary weapon attack, so taking it needs everything the
      // Actions-tab card carries. A {name, toHit, damage} row could show none of it.
      const eco = buildActionEconomy(pwArgs(18));
      const e = eco['action+bonus'].find((x) => x.name === 'Telekinetic Master');
      expect(e.bonusEntries).toHaveLength(1);
      const [bonus] = e.bonusEntries;
      expect(bonus.name).toBe('Longsword');
      expect(bonus.toHit).toBe('+5');
      expect(bonus.damage).toBe('1d8 + 3 slashing');
      // The SAME object as the Actions-tab card — a reference, deliberately not a copy, so
      // anything attached to the weapon later in the pipeline shows up here too.
      expect(bonus).toBe(eco.action.find((x) => x.name === 'Longsword'));
    });

    it('carries Psionic Strike on the bonus attack, since it is the same weapon attack', () => {
      const eco = buildActionEconomy(pwArgs(18));
      const [bonus] = eco['action+bonus'].find((x) => x.name === 'Telekinetic Master').bonusEntries;
      // The reference is what makes this work: Psionic Strike is attached while processing an
      // EARLIER subclass feature, and Telekinetic Thrust at 7th, both before this entry is built.
      expect(bonus.attachedFeatures.map((f) => f.name))
        .toEqual(['Psionic Strike', 'Telekinetic Thrust']);
    });

    it('includes a RANGED attack too — RAW says a weapon attack, not a melee one', () => {
      const e = entry(18, 'action+bonus', 'Telekinetic Master', {
        attacks: [
          { uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true },
          { uid: 'w2', name: 'Longbow', toHit: '+7', damage: '1d8 + 4 piercing', proficient: true, ranged: true },
        ],
      });
      expect(e.bonusEntries.map((b) => b.name)).toEqual(['Longsword', 'Longbow']);
    });

    it('falls back to the unarmed strike when no weapon is held', () => {
      // A bare-handed Psi Warrior still has a weapon attack to make, so the feature never has an
      // empty state — the card offers the unarmed strike rather than an instruction.
      const e = entry(18, 'action+bonus', 'Telekinetic Master', { attacks: [] });
      expect(e.bonusEntries.map((b) => b.name)).toEqual(['Unarmed Strike']);
    });

    it('leaves nothing stranded in the Bonus Actions tab', () => {
      expect(entry(18, 'bonus', 'Telekinetic Master')).toBeFalsy();
      expect(entry(18, 'bonus', 'Telekinetic Weapon Attack')).toBeFalsy();
    });
  });

  // The 2024 revision renames nothing and moves no level, so both maps point at one authored
  // table — this is the test that keeps them from being copied apart later.
  it('gives a 2024 Psi Warrior the identical set of entries', () => {
    const names = (edition) => {
      const eco = buildActionEconomy(pwArgs(18, { edition }));
      return Object.values(eco).flat().filter((e) => e.source === 'Subclass').map((e) => e.name).sort();
    };
    expect(names('5.5e')).toEqual(names('5e'));
    expect(names('5.5e')).toContain('Bulwark of Force');
  });

  // The three free-once-per-rest powers each carry a SECOND cost. Before this, spending the free
  // use left the card reading "0 / 1 remaining" with a dead Use button while the character could
  // still legally use the feature for a die — the card said unavailable when it wasn't.
  describe('free-use powers fall back to the Psionic Energy pool', () => {
    it('Telekinetic Movement points its fallback at the shared pool', () => {
      const e = entry(3, 'action', 'Telekinetic Movement');
      expect(e.resourceKey).toBe('telekinetic_movement_used');
      expect(e.fallbackResourceKey).toBe('psionic_energy_used');
    });

    it('Psi-Powered Leap and Bulwark of Force do the same', () => {
      expect(entry(7, 'bonus', 'Psi-Powered Leap').fallbackResourceKey).toBe('psionic_energy_used');
      expect(entry(15, 'bonus', 'Bulwark of Force').fallbackResourceKey).toBe('psionic_energy_used');
    });

    // A power that costs a die EVERY time must not claim a free use it never had.
    it('leaves the always-costs-a-die powers without a fallback', () => {
      expect(entry(3, 'reaction', 'Protective Field').fallbackResourceKey).toBeFalsy();
      expect(entry(10, 'no_action', 'Guarded Mind (end a condition)').fallbackResourceKey).toBeFalsy();
    });
  });

  // The bonus-action regain was reset by the backend on every rest but had no UI at all — there
  // was no way to spend the charge it was clearing.
  describe('the bonus-action die regain', () => {
    const spent = (n) => ({ characterData: { psionic_energy_used: n } });

    it('is hidden while the pool is full', () => {
      expect(entry(3, 'bonus', 'Regain a Psionic Energy Die')).toBeFalsy();
    });

    it('appears once a die has been spent, and hands one back', () => {
      const e = entry(3, 'bonus', 'Regain a Psionic Energy Die', spent(1));
      expect(e.cost).toBe('bonus action');
      expect(e.resourceKey).toBe('psionic_energy_regain_used');
      expect(e.restoresResourceKey).toBe('psionic_energy_used');
    });

    // It is the valve that refills the pool, so it must never SPEND from it.
    it('does not spend a die to regain a die', () => {
      const e = entry(3, 'bonus', 'Regain a Psionic Energy Die', spent(2));
      expect(e.resourceKey).not.toBe('psionic_energy_used');
      expect(e.fallbackResourceKey).toBeFalsy();
    });

    it('is available from 3rd level in both editions', () => {
      expect(entry(3, 'bonus', 'Regain a Psionic Energy Die', {
        ...spent(1), edition: '5.5e',
      })).toBeTruthy();
    });
  });

  it('gives another Fighter subclass none of it', () => {
    const champ = buildActionEconomy(pwArgs(18, { subclass: 'Champion' }));
    expect(champ.reaction.find((e) => e.name === 'Protective Field')).toBeFalsy();
    expect(champ.bonus.find((e) => e.name === 'Bulwark of Force')).toBeFalsy();
    expect(champ.action.find((e) => e.name === 'Telekinetic Movement')).toBeFalsy();
  });
});

// ── Rune Knight (Fighter subclass, 5e only) ──────────────────────────────────
describe('buildActionEconomy — Rune Knight (Fighter subclass)', () => {
  // The melee flag on an attack row is derived from the INVENTORY entry's weapon_type, so a
  // rider scoped to melee needs a real weapon behind the row — not just the row.
  const SWORD_INV = [{
    uid: 'w1', name: 'Longsword', category: 'weapons', weapon_type: 'Melee',
    equipped: true, hand: 'main',
  }];

  const rkArgs = (level, characterData = {}, edition = '5e', extra = {}) => ({
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    level,
    edition,
    characterData: { subclass: 'Rune Knight', ...characterData },
    inventory: SWORD_INV,
    attacks: [{ uid: 'w1', name: 'Longsword', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true }],
    scores: { strength: 16 },
    spellIndex: {},
    ...extra,
  });

  const rk = (level, characterData = {}, edition = '5e') =>
    buildActionEconomy(rkArgs(level, characterData, edition));

  describe("Giant's Might", () => {
    it('is a bonus action carrying its own pool', () => {
      const gm = rk(3).bonus.find((e) => e.name === "Giant's Might");
      expect(gm).toBeTruthy();
      expect(gm.cost).toBe('bonus action');
      expect(gm.resourceKey).toBe('giants_might_used');
    });

    it("is the app's first ACTIVE EFFECT, so the card names the effect it switches on", () => {
      expect(rk(3).bonus.find((e) => e.name === "Giant's Might").activeEffect).toBe('giants_might');
    });

    it('states the size and die it grants, scaling with the later features', () => {
      // Great Stature (L10) and Runic Juggernaut (L18) do nothing but change these numbers.
      expect(rk(3).bonus.find((e) => e.name === "Giant's Might").detail)
        .toMatch(/become Large.*extra 1d6/s);
      expect(rk(10).bonus.find((e) => e.name === "Giant's Might").detail).toMatch(/extra 1d8/);
      const l18 = rk(18).bonus.find((e) => e.name === "Giant's Might").detail;
      expect(l18).toMatch(/become Huge/);
      expect(l18).toMatch(/extra 1d10/);
      // RAW the size increase at 18 is the player's option, not automatic.
      expect(l18).toMatch(/can choose to become Large/);
    });

    it('says Strength CHECKS and Strength SAVING THROWS — not saves generally', () => {
      // The stored feature blurb reads "advantage on Strength checks and saving throws".
      expect(rk(3).bonus.find((e) => e.name === "Giant's Might").detail)
        .toMatch(/Strength checks and Strength saving throws/);
    });

    it('is absent below level 3 and for another Fighter subclass', () => {
      expect(rk(2).bonus.map((e) => e.name)).not.toContain("Giant's Might");
      const champ = buildActionEconomy(rkArgs(10, {}, '5e', { subclass: 'Champion' }));
      expect(champ.bonus.map((e) => e.name)).not.toContain("Giant's Might");
    });
  });

  describe('the extra damage rides on every attack card', () => {
    const riderOn = (ec, key) => (ec.action.find((e) => e.key === key)?.riders || [])
      .find((r) => r.source === "Giant's Might");

    const ON = { active_effects: ['giants_might'] };

    it('attaches to a weapon attack while the effect is switched on', () => {
      expect(riderOn(rk(3, ON), 'weapon:w1:0')).toBeTruthy();
    });

    // A rider is rules text you read mid-swing. Carrying Giant's Might's paragraph on every
    // attack card while it is switched OFF put a feature you are not using on the surface a
    // player scans fastest, so the block now appears only once the effect is running.
    it('is absent entirely while the effect is switched off', () => {
      expect(riderOn(rk(3), 'weapon:w1:0')).toBeUndefined();
      expect(rk(3).action.find((e) => e.key === 'weapon:w1:0').damageAdditions).toBeUndefined();
    });

    it('states the die plainly once the effect is switched ON', () => {
      const r = riderOn(rk(10, ON), 'weapon:w1:0');
      expect(r.text).not.toMatch(/While Giant's Might is active/);
      expect(r.text).toMatch(/extra 1d8 damage/);
    });

    it('reaches an UNARMED strike too — RAW is "a weapon or an unarmed strike"', () => {
      const bare = buildActionEconomy(rkArgs(3, ON, '5e', { inventory: [], attacks: [] }));
      const unarmed = bare.action.find((e) => e.source === 'Weapon');
      expect(unarmed.name).toBe('Unarmed Strike');
      expect((unarmed.riders || []).some((r) => r.source === "Giant's Might")).toBe(true);
    });

    it('does not attach for another subclass', () => {
      const champ = buildActionEconomy(rkArgs(10, {}, '5e', { subclass: 'Champion' }));
      expect(riderOn(champ, 'weapon:w1:0')).toBeUndefined();
    });
  });

  describe('Runic Shield', () => {
    it('is a reaction with its own pool from level 7', () => {
      const rs = rk(7).reaction.find((e) => e.name === 'Runic Shield');
      expect(rs).toBeTruthy();
      expect(rs.cost).toBe('reaction');
      expect(rs.resourceKey).toBe('runic_shield_used');
    });

    it('says the attacker uses the NEW roll, not the lower of the two', () => {
      // The stored feature blurb says "use the lower of the two rolls", which would make the
      // feature strictly stronger than RAW.
      const rs = rk(7).reaction.find((e) => e.name === 'Runic Shield');
      expect(rs.detail).toMatch(/reroll the d20 and use the new roll/);
      expect(rs.detail).not.toMatch(/lower/);
    });

    it('is absent below level 7', () => {
      expect(rk(6).reaction.map((e) => e.name)).not.toContain('Runic Shield');
    });
  });

  it('has no 2024 entry — the 2024 PHB ships no Rune Knight', () => {
    const ec = rk(10, {}, '5.5e');
    expect(ec.bonus.map((e) => e.name)).not.toContain("Giant's Might");
    expect(ec.reaction.map((e) => e.name)).not.toContain('Runic Shield');
  });
});

describe('buildActionEconomy — Channel Rune (Rune Knight)', () => {
  const AXE = {
    uid: 'w1', name: 'Battleaxe', category: 'weapons', weapon_type: 'Melee',
    equipped: true, hand: 'main',
  };
  const SHEATHED = { uid: 'w2', name: 'Longbow', category: 'weapons', equipped: false };

  const ae = (level, { runes = ['Cloud Rune', 'Frost Rune'], rune_items = {} } = {}) =>
    buildActionEconomy({
      charClass: 'Fighter',
      subclass: 'Rune Knight',
      level,
      edition: '5e',
      // character_data carries the inventory in the real app, and the rune gate reads it there.
      characterData: {
        subclass: 'Rune Knight', runes, rune_items, inventory: [AXE, SHEATHED],
      },
      inventory: [AXE, SHEATHED],
      attacks: [{ uid: 'w1', name: 'Battleaxe', toHit: '+5', damage: '1d8 + 3 slashing', proficient: true }],
      scores: { strength: 16, constitution: 16 },
      spellIndex: {},
    });

  const allEntries = (buckets) => Object.values(buckets).flatMap((b) => (Array.isArray(b) ? b : []));
  const channelCards = (buckets) => allEntries(buckets).filter((e) => /^Channel Rune:/.test(e.name || ''));

  it('shows no Channel Rune card while the runes are only KNOWN', () => {
    expect(channelCards(ae(7))).toEqual([]);
  });

  it('shows a card once a rune is carved onto an equipped item', () => {
    const cards = channelCards(ae(7, { rune_items: { 'Cloud Rune': 'w1' } }));
    expect(cards.map((c) => c.name)).toEqual(['Channel Rune: Cloud']);
  });

  it('shows NO card while the bearing item is unequipped', () => {
    expect(channelCards(ae(7, { rune_items: { 'Cloud Rune': 'w2' } }))).toEqual([]);
  });

  it('files each rune under its own action cost', () => {
    const cloud = ae(7, { rune_items: { 'Cloud Rune': 'w1' } }).reaction
      .find((e) => e.name === 'Channel Rune: Cloud');
    expect(cloud.cost).toBe('reaction');

    const frost = ae(7, { rune_items: { 'Frost Rune': 'w1' } }).bonus
      .find((e) => e.name === 'Channel Rune: Frost');
    expect(frost.cost).toBe('bonus action');
  });

  it('gives every rune its OWN resource key — they recharge independently', () => {
    const cloud = channelCards(ae(7, { rune_items: { 'Cloud Rune': 'w1' } }))[0];
    expect(cloud.resourceKey).toBe('channel_rune_cloud_used');

    const frost = channelCards(ae(7, { rune_items: { 'Frost Rune': 'w1' } }))[0];
    expect(frost.resourceKey).toBe('channel_rune_frost_used');
  });

  it('carries the rune Channel Rune text, not the passive half', () => {
    const cloud = channelCards(ae(7, { rune_items: { 'Cloud Rune': 'w1' } }))[0];
    expect(cloud.detail ?? cloud.description).toMatch(/becomes the target of the attack/i);
    expect(cloud.detail ?? cloud.description).not.toMatch(/Sleight of Hand/i);
  });

  it("attaches the Fire Rune to the weapon attack it rides on, rather than giving it a card", () => {
    const buckets = ae(7, { runes: ['Fire Rune'], rune_items: { 'Fire Rune': 'w1' } });
    expect(channelCards(buckets)).toEqual([]);
    const attack = buckets.action.find((e) => e.name === 'Battleaxe');
    const fire = (attack.attachedFeatures ?? []).find((f) => f.name === 'Fire Rune');
    expect(fire).toBeTruthy();
    expect(fire.resourceKey).toBe('channel_rune_fire_used');
    expect(fire.note).toMatch(/Battleaxe/);
  });

  it('states the Fire Rune save DC from CONSTITUTION — the Rune Knight DC, not Intelligence', () => {
    // Level 7 → PB +3; CON 16 → +3. 8 + 3 + 3 = 14.
    const buckets = ae(7, { runes: ['Fire Rune'], rune_items: { 'Fire Rune': 'w1' } });
    const attack = buckets.action.find((e) => e.name === 'Battleaxe');
    const fire = attack.attachedFeatures.find((f) => f.name === 'Fire Rune');
    expect(fire.note).toMatch(/DC 14/);
  });

  it('does NOT attach the Fire Rune while it is uncarved — the hidden gate runs first', () => {
    const buckets = ae(7, { runes: ['Fire Rune'], rune_items: {} });
    const attack = buckets.action.find((e) => e.name === 'Battleaxe');
    expect((attack.attachedFeatures ?? []).some((f) => f.name === 'Fire Rune')).toBe(false);
  });

  // Frost's Channel Rune RUNS for 10 minutes and changes numbers the sheet already shows, so
  // its card has to switch something on — a bare Use counter left the +2 living nowhere.
  it('makes the Frost card an ACTIVE EFFECT, so it gets the toggle instead of a bare counter', () => {
    const frost = channelCards(ae(7, { rune_items: { 'Frost Rune': 'w1' } }))[0];
    expect(frost.name).toBe('Channel Rune: Frost');
    expect(frost.activeEffect).toBe('channel_rune_frost');
    expect(frost.resourceKey).toBe('channel_rune_frost_used');
  });

  it('leaves the one-shot runes without an effect key', () => {
    const cloud = channelCards(ae(7, { rune_items: { 'Cloud Rune': 'w1' } }))[0];
    expect(cloud.activeEffect).toBeNull();
  });

  it('shows a card per carved rune when several are live', () => {
    const buckets = ae(7, { rune_items: { 'Cloud Rune': 'w1', 'Frost Rune': 'w1' } });
    expect(channelCards(buckets).map((c) => c.name).sort())
      .toEqual(['Channel Rune: Cloud', 'Channel Rune: Frost']);
  });

  it('gives another Fighter subclass no Channel Rune cards', () => {
    const buckets = buildActionEconomy({
      charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5e',
      characterData: { subclass: 'Champion', runes: ['Cloud Rune'], rune_items: { 'Cloud Rune': 'w1' }, inventory: [AXE] },
      inventory: [AXE], attacks: [], scores: {}, spellIndex: {},
    });
    expect(channelCards(buckets)).toEqual([]);
  });
});

describe('combineAttackDamage', () => {
  it('returns null when nothing adds damage — no total line for a rider that only adds text', () => {
    expect(combineAttackDamage('1d8 + 3 Piercing', [])).toBeNull();
    expect(combineAttackDamage('1d8 + 3 Piercing', [{ source: 'X' }])).toBeNull();
  });

  it('appends a typed term rather than folding it into the weapon die', () => {
    const t = combineAttackDamage('1d8 + 3 Piercing', [{ dice: '1d8', type: 'force', source: 'Psionic Strike' }]);
    expect(t.text).toBe('1d8 + 3 Piercing + 1d8 force');
  });

  it('keeps damage types separate — they are rolled and resisted separately', () => {
    const t = combineAttackDamage('1d8 + 3 Piercing', [
      { dice: '1d6', type: 'Piercing', source: "Giant's Might" },
      { dice: '1d8', type: 'force', source: 'Psionic Strike' },
    ]);
    // 1d8 and 1d6 are both piercing but cannot be summed into one die either.
    expect(t.text).toBe('1d8 + 3 Piercing + 1d6 Piercing + 1d8 force');
  });

  it('labels every term with its source, and the weapon term with none', () => {
    const t = combineAttackDamage('1d8 + 3 Piercing', [{ dice: '1d8', type: 'force', source: 'Psionic Strike' }]);
    expect(t.parts).toEqual([
      { text: '1d8 + 3 Piercing', source: null },
      { text: '1d8 force', source: 'Psionic Strike' },
    ]);
  });
});

describe('“on a hit” damage totals on the attack card', () => {
  const PICK = {
    uid: 'w1', name: 'War pick', category: 'weapons', weapon_type: 'Melee',
    equipped: true, hand: 'main',
  };

  const ae = ({ level = 7, active = [], runes = ['Fire Rune'], carved = true } = {}) =>
    buildActionEconomy({
      charClass: 'Fighter',
      subclass: 'Rune Knight',
      level,
      edition: '5e',
      characterData: {
        subclass: 'Rune Knight',
        runes,
        rune_items: carved ? { 'Fire Rune': 'w1' } : {},
        inventory: [PICK],
        active_effects: active,
      },
      inventory: [PICK],
      attacks: [{ uid: 'w1', name: 'War pick', toHit: '+5', damage: '1d8 + 3 Piercing', proficient: true }],
      scores: { strength: 16, constitution: 14 },
      spellIndex: {},
    });

  const row = (buckets) => buckets.action.find((e) => e.name === 'War pick');
  // The data layer hands over the ADDITIONS; the card combines them against the damage it is
  // currently showing, so the power-attack toggle can't leave a stale total behind.
  const totalText = (buckets) => {
    const r = row(buckets);
    return combineAttackDamage(r.damage, r.damageAdditions || [])?.text;
  };
  const fireBlock = (buckets) =>
    (row(buckets).attachedFeatures ?? []).find((f) => f.name === 'Fire Rune');

  // The Fire Rune's 2d6 is NOT a property of the weapon: it lands only on the swing where you
  // spend a Channel Rune use to summon the shackles, which is decided after the hit and never
  // recorded. Totalling it claimed damage the character does not always deal.
  it("does not add the Fire Rune's 2d6 to the total, even with the rune carved and equipped", () => {
    expect(fireBlock(ae())).toBeTruthy();
    expect(row(ae()).damageAdditions).toBeUndefined();
    expect(totalText(ae())).toBeUndefined();
  });

  it('still states the fire damage in the rune note, beside the Use control that invokes it', () => {
    expect(fireBlock(ae()).note).toMatch(/invoke this rune/i);
    expect(fireBlock(ae()).note).toMatch(/extra 2d6 fire damage/i);
  });

  it('leaves the printed damage untouched — it must stay true for an ordinary swing', () => {
    expect(row(ae()).damage).toBe('1d8 + 3 Piercing');
  });

  it("folds in Giant's Might only while the effect is switched ON", () => {
    expect(totalText(ae({ active: ['giants_might'] })))
      .toBe('1d8 + 3 Piercing + 1d6 Piercing');
  });

  it("omits Giant's Might while it is off, even though the character has the feature", () => {
    expect(totalText(ae({ active: [] }))).toBeUndefined();
  });

  it("scales Giant's Might with level (Great Stature at 10)", () => {
    expect(totalText(ae({ level: 10, active: ['giants_might'] })))
      .toBe('1d8 + 3 Piercing + 1d8 Piercing');
  });

  it('names each source so a grown total does not look like a bug', () => {
    const r = row(ae({ active: ['giants_might'] }));
    const parts = combineAttackDamage(r.damage, r.damageAdditions).parts;
    expect(parts.map((p) => p.source)).toEqual([null, "Giant's Might"]);
  });

  it('gives no attached block at all when the rune is not carved', () => {
    expect(fireBlock(ae({ carved: false }))).toBeUndefined();
    expect(totalText(ae({ carved: false }))).toBeUndefined();
  });

  it('gives no total to an attached feature that adds no damage (Unleash Incarnation)', () => {
    const buckets = buildActionEconomy({
      charClass: 'Fighter', subclass: 'Echo Knight', level: 7, edition: '5e',
      characterData: { subclass: 'Echo Knight', inventory: [PICK] },
      inventory: [PICK],
      attacks: [{ uid: 'w1', name: 'War pick', toHit: '+5', damage: '1d8 + 3 Piercing', proficient: true }],
      scores: { constitution: 14 }, spellIndex: {},
    });
    const attack = buckets.action.find((e) => e.name === 'War pick');
    const f = attack.attachedFeatures.find((x) => x.name === 'Unleash Incarnation');
    expect(f).toBeTruthy();
    expect(attack.damageAdditions).toBeUndefined();
  });

  it('totals Psionic Strike too, folding INT into its die', () => {
    const buckets = buildActionEconomy({
      charClass: 'Fighter', subclass: 'Psi Warrior', level: 7, edition: '5e',
      characterData: { subclass: 'Psi Warrior', inventory: [PICK] },
      inventory: [PICK],
      attacks: [{ uid: 'w1', name: 'War pick', toHit: '+5', damage: '1d8 + 3 Piercing', proficient: true }],
      scores: { intelligence: 16 }, spellIndex: {},
    });
    const attack = buckets.action.find((e) => e.name === 'War pick');
    expect(combineAttackDamage(attack.damage, attack.damageAdditions).text)
      .toMatch(/^1d8 \+ 3 Piercing \+ .*force$/);
  });
});
