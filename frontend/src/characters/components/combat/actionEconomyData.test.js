import { describe, it, expect } from 'vitest';
import {
  classifyCastingTime, characterSpellNames, attacksPerAction, canTwoWeaponFight,
  normalizeFeatureName, featuresKnownAtLevel, buildActionEconomy,
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

  it('buckets a known spell by its casting time', () => {
    const args = fighterArgs(3, '5e');
    args.characterData = { prepared_spells: ['Healing Word', 'Shield', 'Fireball'] };
    args.spellIndex = {
      'healing word': { casting_time: '1 bonus action', level: 1, school: 'Evocation' },
      shield: { casting_time: '1 reaction', level: 1, school: 'Abjuration' },
      fireball: { casting_time: '1 action', level: 3, school: 'Evocation' },
    };
    const ec = buildActionEconomy(args);
    expect(ec.bonus.map((e) => e.name)).toContain('Healing Word');
    expect(ec.reaction.map((e) => e.name)).toContain('Shield');
    expect(ec.action.map((e) => e.name)).toContain('Fireball');
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

  describe('feat effects', () => {
    const TAVERN_BRAWLER = {
      id: 14, name: 'Tavern Brawler', level: 4,
      effects: [
        { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
        { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', trigger: 'After an unarmed hit', description: 'Grapple the target.' },
      ],
    };

    it('adds a feat action (Tavern Brawler grapple) under Bonus with source Feat', () => {
      const args = fighterArgs(5, '5e');
      args.characterData = { feats: [TAVERN_BRAWLER] };
      const grapple = buildActionEconomy(args).bonus.find((e) => e.name === 'Grapple (Tavern Brawler)');
      expect(grapple).toBeTruthy();
      expect(grapple.source).toBe('Feat');
      expect(grapple.cost).toBe('bonus action');
      expect(grapple.detail).toMatch(/After an unarmed hit/);
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
});
