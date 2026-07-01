/**
 * Action Economy — what a SPECIFIC character can do, bucketed by the action it costs.
 *
 * Five buckets (tabs): 'no_action', 'action', 'bonus', 'action+bonus', 'reaction'. An
 * entry's `tab` is explicit (decoupled from its display `cost` badge). The 'no_action'
 * bucket collects features that fall OUTSIDE the normal action economy — they cost no
 * action/bonus/reaction at all (e.g. Action Surge grants an extra action for free;
 * Indomitable rerolls a failed save with no action required).
 *
 * Sources, in render order:
 *   Weapon       — equipped-weapon attacks (Action) + Two-Weapon Fighting (Action+Bonus)
 *   Class Feature/Subclass — curated CLASS_FEATURE_ACTIONS map (per edition)
 *   Spell        — the character's castable spells, classified by `casting_time`
 *   Racial       — RACIAL_ACTIONS keyed by racial trait
 *   Universal    — the standard action menu everyone has (grouped as secondary in the UI)
 *
 * Vertical slice: Fighter (5e + 2024) is fully mapped. Other classes contribute only
 * their auto-derived weapon attacks + spells + universal menu until their feature map
 * is authored — expand CLASS_FEATURE_ACTIONS_* class-by-class.
 */
import { abilityMod, profBonus, formatSigned, freeHandCount } from '@/characters/components/inventory/inventoryData';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import { getFeatActions, getFeatUnarmedDice } from '@/characters/components/feats/featEffects';
import { hasFeat } from '@/characters/components/combat/combatBonuses';

// Display label for a bucket key, used as an entry's `cost` badge.
const ECONOMY_COST_LABEL = {
  no_action: 'no action', action: 'action', bonus: 'bonus action',
  'action+bonus': 'action + bonus action', reaction: 'reaction',
};

export const TABS = ['no_action', 'action', 'bonus', 'action+bonus', 'reaction'];
export const TAB_LABELS = {
  no_action: 'No Action',
  action: 'Actions',
  bonus: 'Bonus Actions',
  'action+bonus': 'Action + Bonus Action',
  reaction: 'Reactions',
};

export const SOURCE_ORDER = ['Weapon', 'Class Feature', 'Subclass', 'Spell', 'Racial', 'Feat', 'Item', 'Universal'];

// ─── Universal action menu (everyone) ────────────────────────────────────────────
// "Cast a Spell" / "Magic" is omitted here — the character's actual spells are listed
// individually under the Spell source instead.

export const UNIVERSAL_ACTIONS_5E = [
  { name: 'Attack', description: 'Make one melee or ranged attack (more with Extra Attack). Your equipped weapons are listed above.' },
  { name: 'Dash', description: 'Gain extra movement equal to your speed for this turn.' },
  { name: 'Disengage', description: "Your movement doesn't provoke opportunity attacks for the rest of the turn." },
  { name: 'Dodge', description: 'Attacks against you have disadvantage; you make DEX saves with advantage.' },
  { name: 'Help', description: "Aid an ally's attack or ability check (they gain advantage)." },
  { name: 'Hide', description: 'Make a Dexterity (Stealth) check to become hidden.' },
  { name: 'Ready', description: 'Prepare an action to trigger on a condition you specify (uses your reaction).' },
  { name: 'Search', description: 'Devote your attention to finding something (Perception or Investigation).' },
  { name: 'Use an Object', description: 'Interact with a second object or feature of the environment.' },
];

export const UNIVERSAL_ACTIONS_2024 = [
  { name: 'Attack', description: 'Make one attack (more with Extra Attack). Your equipped weapons are listed above.' },
  { name: 'Dash', description: 'Gain extra movement equal to your Speed for this turn.' },
  { name: 'Disengage', description: "Your movement doesn't provoke opportunity attacks for the rest of the turn." },
  { name: 'Dodge', description: 'Attacks against you have disadvantage; you make DEX saves with advantage.' },
  { name: 'Help', description: "Aid an ally's attack or ability check, or administer first aid." },
  { name: 'Hide', description: 'Make a Dexterity (Stealth) check to become Invisible.' },
  { name: 'Influence', description: "Make a check to alter a monster's attitude (Deception, Intimidation, Performance, or Persuasion)." },
  { name: 'Ready', description: 'Prepare an action to trigger on a condition (uses your reaction).' },
  { name: 'Search', description: 'Make a Wisdom check to find something (Insight, Medicine, Perception, or Survival).' },
  { name: 'Study', description: 'Make an Intelligence check to recall or learn lore (Arcana, History, Investigation, Nature, or Religion).' },
  { name: 'Utilize', description: 'Use a nonmagical object.' },
];

export const UNIVERSAL_REACTIONS_5E = [
  { name: 'Opportunity Attack', description: 'When a creature you can see leaves your reach, make one melee attack against it.' },
];

export const UNIVERSAL_REACTIONS_2024 = [
  { name: 'Opportunity Attack', description: 'When a creature you can see leaves your reach, make one melee attack against it.' },
];

// ─── Class / subclass feature → action economy (curated) ─────────────────────────
// Keyed by feature name exactly as it appears in classFeatures5e/2024.js.
// { tab, cost, description }. Only features that cost an action/bonus/reaction (or are
// activated freely on your turn) appear — passive features are intentionally absent.

// `resourceKey` links a feature to its config `restResources` entry so the UI can show a
// Use button + remaining count tied to the rest that recharges it.

export const CLASS_FEATURE_ACTIONS_5E = {
  Fighter: {
    'Second Wind': { tab: 'bonus', cost: 'bonus action', resourceKey: 'second_wind_used', description: 'Regain 1d10 + your fighter level in hit points. Recharges on a short or long rest.' },
    'Action Surge': { tab: 'no_action', cost: 'no action', resourceKey: 'action_surge_used', description: 'On your turn, take one additional action for free. Once per short or long rest.' },
    'Indomitable': { tab: 'no_action', cost: 'no action', resourceKey: 'indomitable_used', description: 'When you fail a saving throw, reroll it (must use the new roll) — no action required. Once per long rest.' },
  },
};

export const CLASS_FEATURE_ACTIONS_2024 = {
  Fighter: {
    'Second Wind': { tab: 'bonus', cost: 'bonus action', resourceKey: 'second_wind_used', description: 'Regain 1d10 + your fighter level in hit points. Limited uses, recharge on a short or long rest; also fuels other Fighter features.' },
    'Action Surge': { tab: 'no_action', cost: 'no action', resourceKey: 'action_surge_used', description: 'On your turn, take one additional action for free. Once per short or long rest.' },
    'Indomitable': { tab: 'no_action', cost: 'no action', resourceKey: 'indomitable_used', description: 'When you fail a saving throw, reroll it (adding your fighter level) — no action required. Once per long rest.' },
  },
};

// ─── Racial trait → action economy ───────────────────────────────────────────────
// Keyed by racial trait name as stored in character_data.race_traits.

export const RACIAL_ACTIONS = {
  'Breath Weapon': { tab: 'action', cost: 'action', description: 'Exhale destructive energy in a line or cone (creatures make a DEX or CON save). Recharges on a short or long rest.' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────

/** Map a spell `casting_time` string to a tab + cost badge, or null if not a combat action. */
export function classifyCastingTime(castingTime) {
  const ct = (castingTime || '').toLowerCase();
  if (ct.includes('bonus')) return { tab: 'bonus', cost: 'bonus action' };
  if (ct.includes('reaction')) return { tab: 'reaction', cost: 'reaction' };
  if (ct.includes('action')) return { tab: 'action', cost: 'action' };
  return null; // 1 minute / 10 minutes / ritual etc. — not an in-combat action
}

/** Unique castable spell names: cantrips + prepared + known (NOT the unprepared spellbook). */
export function characterSpellNames(characterData = {}) {
  const seen = new Set();
  const out = [];
  for (const list of [characterData.cantrips, characterData.prepared_spells, characterData.known_spells]) {
    for (const name of list || []) {
      const key = (name || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

// Extra Attack tiers per class (level → attacks per Attack action). Vertical slice: Fighter.
const EXTRA_ATTACK_TIERS = {
  Fighter: [[5, 2], [11, 3], [20, 4]],
};

/** Attacks made per Attack action at this level (1 unless the class has Extra Attack tiers). */
export function attacksPerAction(charClass, level = 1) {
  const tiers = EXTRA_ATTACK_TIERS[charClass];
  if (!tiers) return 1;
  let n = 1;
  for (const [lvl, count] of tiers) if (Number(level) >= lvl) n = count;
  return n;
}

const isMelee = (e) =>
  e.category === 'weapons' && (e.weapon_type || '').toLowerCase() === 'melee';

const isLightMelee = (e) =>
  isMelee(e) && (e.properties || '').toLowerCase().includes('light');

/** A one-handed (i.e. not two-handed) melee weapon — the Dual Wielder TWF condition. */
const isOneHandedMelee = (e) =>
  isMelee(e) && !(e.properties || '').toLowerCase().includes('two-handed');

/** A hand crossbow (the Crossbow Expert bonus-attack weapon). Matches the natural and the
 *  5e API's comma-inverted name forms ("Hand Crossbow" / "Crossbow, Hand"). */
const isHandCrossbow = (e) =>
  e.category === 'weapons' && /hand\s*crossbow|crossbow,\s*hand/.test((e.name || '').toLowerCase());

/** An improvised weapon — the seeded "Improvised Weapon" item or anything in the Improvised
 *  weapon category. The Action half of the Tavern Brawler grapple combo when equipped. */
const isImprovisedWeapon = (e) =>
  e.category === 'weapons'
  && ((e.weapon_category || '').toLowerCase() === 'improvised'
      || /improvised weapon/.test((e.name || '').toLowerCase()));

/** A polearm that enables the Polearm Master bonus attack: glaive, halberd, quarterstaff, or spear. */
const isPolearm = (e) =>
  e.category === 'weapons' && /\b(glaive|halberd|quarterstaff|spear)\b/.test((e.name || '').toLowerCase());

/** A finesse weapon — the Defensive Duelist reaction only works while wielding one. */
const isFinesseWeapon = (e) =>
  e.category === 'weapons' && (e.properties || '').toLowerCase().includes('finesse');

/** Is any equipped weapon a match for the predicate? */
const hasEquipped = (inventory, predicate) =>
  (inventory || []).some((e) => e.equipped && predicate(e));

/**
 * The equipped weapons that qualify for Two-Weapon Fighting — light melee weapons, or
 * (with the Dual Wielder feat) any one-handed/non-two-handed melee weapons.
 */
export function twoWeaponFightingWeapons(inventory = [], feats = []) {
  const predicate = hasFeat(feats, 'Dual Wielder') ? isOneHandedMelee : isLightMelee;
  const qualifying = (inventory || []).filter((e) => e.equipped && predicate(e));
  // Order main-hand first, off-hand second when hands are assigned (the off-hand weapon
  // drives the bonus-action attack). Falls back to inventory order when hands are unset.
  const main = qualifying.find((e) => e.hand === 'main');
  const off = qualifying.find((e) => e.hand === 'off');
  if (main && off) return [main, off];
  return qualifying;
}

/**
 * Two or more equipped light melee weapons enable Two-Weapon Fighting. The Dual Wielder
 * feat lifts the "light" requirement, allowing any one-handed (non-two-handed) melee weapons.
 */
export function canTwoWeaponFight(inventory = [], feats = []) {
  return twoWeaponFightingWeapons(inventory, feats).length >= 2;
}

function unarmedAttack(scores = {}, level = 1, dice = null) {
  const str = abilityMod(scores.strength);
  // Base unarmed strike deals 1 + STR bludgeoning; a feat (e.g. Tavern Brawler) can replace
  // the flat 1 with a die like 1d4.
  const damage = dice
    ? `${dice} ${formatSigned(str)} bludgeoning`
    : `${Math.max(1, 1 + str)} bludgeoning`;
  return {
    name: 'Unarmed Strike',
    toHit: formatSigned(str + profBonus(level)),
    toHitBreakdown: [
      { label: 'STR', value: str },
      { label: 'Proficiency', value: profBonus(level) },
    ],
    damage,
    proficient: true,
  };
}

/**
 * Build the four action-economy buckets for a specific character.
 *   attacks    — precomputed weapon attack rows [{name,toHit,damage,proficient}] (from getAttacks)
 *   spellIndex — { nameLower: { casting_time, level, school } } from the encyclopedia
 * Returns { action, bonus, 'action+bonus', reaction, attacksPerAction }.
 * Each bucket entry: { key, name, source, cost, detail }.
 */
export function buildActionEconomy({
  charClass,
  subclass,
  level = 1,
  edition = '5e',
  characterData = {},
  inventory = [],
  attacks = [],
  scores = {},
  spellIndex = {},
} = {}) {
  const is2024 = edition === '5.5e' || edition === '2024';
  const buckets = { no_action: [], action: [], bonus: [], 'action+bonus': [], reaction: [] };
  const push = (tab, entry) => { if (buckets[tab]) buckets[tab].push(entry); };

  // Weapon attacks (Action). Show an unarmed strike when nothing is equipped, or whenever a
  // feat upgrades the unarmed die (e.g. Tavern Brawler's 1d4) so the upgrade is visible.
  const feats = characterData.feats || [];
  const unarmedDice = getFeatUnarmedDice(feats);
  const weaponRows = [...attacks];
  if (unarmedDice || weaponRows.length === 0) weaponRows.push(unarmedAttack(scores, level, unarmedDice));
  weaponRows.forEach((atk, i) => {
    const flag = atk.proficient === false ? ' · not proficient' : '';
    const disadv = atk.disadvantage ? ' · disadvantage' : '';
    push('action', {
      key: `weapon:${atk.uid || atk.name}:${i}`,
      name: atk.name,
      source: 'Weapon',
      cost: 'action',
      detail: `${atk.toHit} to hit · ${atk.damage}${flag}${disadv}`,
      // Structured pieces so the UI can render the to-hit as a clickable breakdown.
      toHit: atk.toHit,
      toHitBreakdown: atk.toHitBreakdown || null,
      detailRest: `to hit · ${atk.damage}${flag}${disadv}`,
      warning: atk.warning || null,
      loadingNote: atk.loadingNote || null,
    });
  });

  // Two-Weapon Fighting (Action + Bonus Action). Surface the two weapons being wielded as
  // explicit main-hand / off-hand attack rows. The off-hand bonus attack adds no ability
  // modifier to its damage unless the Two-Weapon Fighting fighting style grants it.
  const twfWeapons = twoWeaponFightingWeapons(inventory, feats);
  if (twfWeapons.length >= 2) {
    const dualWielder = hasFeat(feats, 'Dual Wielder');
    const twfStyle = (characterData.fighting_style || '') === 'Two-Weapon Fighting';
    const attackByUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
    const baseDamage = (w) => `${w.damage || '—'}${w.damage_type ? ` ${w.damage_type}` : ''}`;
    const [main, off] = twfWeapons;
    const mainRow = attackByUid.get(main.uid);
    const offRow = attackByUid.get(off.uid);
    const subAttacks = [
      {
        label: 'Main hand',
        name: main.name,
        toHit: mainRow?.toHit ?? null,
        damage: mainRow?.damage ?? baseDamage(main),
        warning: mainRow?.warning ?? null,
      },
      {
        label: 'Off hand',
        name: off.name,
        toHit: offRow?.toHit ?? null,
        // Strip the ability modifier from the off-hand damage unless the TWF style restores it.
        damage: twfStyle ? (offRow?.damage ?? baseDamage(off)) : baseDamage(off),
        warning: offRow?.warning ?? null,
      },
    ];
    const dualNote = dualWielder ? ' Dual Wielder lets these be any one-handed melee weapons, not just light ones.' : '';
    const offNote = twfStyle
      ? 'your Two-Weapon Fighting style adds your ability modifier to its damage'
      : 'it adds no ability modifier to its damage unless a feature grants it';
    push('action+bonus', {
      key: 'twf',
      name: 'Two-Weapon Fighting',
      source: 'Weapon',
      cost: 'action + bonus action',
      subAttacks,
      detail: `Attack with your main-hand weapon (Action), then attack with your off-hand weapon (Bonus Action) — ${offNote}.${dualNote}`,
    });
  }

  // Crossbow Expert (feat) — present the bonus-action hand-crossbow attack as an
  // Action + Bonus combo (like Two-Weapon Fighting): a one-handed Attack-action attack
  // enables a bonus-action hand crossbow attack. Only shown when a hand crossbow is equipped
  // (without one there's no bonus attack to make). Unlike TWF, this bonus attack keeps its
  // ability modifier on damage, so its full attack row is used as-is.
  const hasCrossbowExpert = hasFeat(feats, 'Crossbow Expert');
  const equippedHandCrossbow = (inventory || []).find((e) => e.equipped && isHandCrossbow(e));
  if (hasCrossbowExpert && equippedHandCrossbow) {
    const attackByUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
    const baseDamage = (w) => `${w.damage || '—'}${w.damage_type ? ` ${w.damage_type}` : ''}`;
    // The triggering Action attack is a one-handed weapon — prefer an equipped one-handed
    // melee weapon (e.g. the scimitar); otherwise the hand crossbow itself (fire, then re-fire).
    const actionWeapon =
      (inventory || []).find((e) => e.equipped && isOneHandedMelee(e)) || equippedHandCrossbow;
    const actionRow = attackByUid.get(actionWeapon.uid);
    const bonusRow = attackByUid.get(equippedHandCrossbow.uid);
    const ceSubAttacks = [
      {
        label: 'Action',
        name: actionWeapon.name,
        toHit: actionRow?.toHit ?? null,
        damage: actionRow?.damage ?? baseDamage(actionWeapon),
        warning: actionRow?.warning ?? null,
      },
      {
        label: 'Bonus',
        name: equippedHandCrossbow.name,
        toHit: bonusRow?.toHit ?? null,
        damage: bonusRow?.damage ?? baseDamage(equippedHandCrossbow),
        warning: bonusRow?.warning ?? null,
      },
    ];
    push('action+bonus', {
      key: 'crossbow-expert',
      name: 'Crossbow Expert',
      source: 'Feat',
      cost: 'action + bonus action',
      subAttacks: ceSubAttacks,
      detail: `Make a one-handed attack with ${actionWeapon.name} (Action), then attack with ${equippedHandCrossbow.name} as a bonus action (Crossbow Expert).`,
    });
  }

  // Tavern Brawler (feat) — present the bonus-action grapple as an Action + Bonus combo
  // (like Crossbow Expert): the feat lets you grapple as a bonus action after you hit with an
  // Unarmed Strike or an improvised weapon, so the Action half is an equipped Improvised Weapon
  // if you're wielding one, otherwise your (feat-upgraded) Unarmed Strike. The standalone bonus
  // grapple feat action is suppressed below in favour of this combo.
  const grappleAction = getFeatActions(feats).find(
    (a) => a.source === 'Tavern Brawler' && /grapple/i.test(a.name),
  );
  const equippedImprovised = (inventory || []).find((e) => e.equipped && isImprovisedWeapon(e));
  // Only surface the combo when the character can actually make its Action half: an equipped
  // improvised weapon, or a free hand for an Unarmed Strike. With both hands full and no
  // improvised weapon, there's nothing to lead the grapple with, so hide it.
  const canTavernBrawl = grappleAction && (equippedImprovised || freeHandCount(inventory) > 0);
  if (canTavernBrawl) {
    const attackByUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
    const baseDamage = (w) => `${w.damage || '—'}${w.damage_type ? ` ${w.damage_type}` : ''}`;
    let actionRow;
    if (equippedImprovised) {
      const row = attackByUid.get(equippedImprovised.uid);
      actionRow = {
        label: 'Action',
        name: equippedImprovised.name,
        toHit: row?.toHit ?? null,
        damage: row?.damage ?? baseDamage(equippedImprovised),
        warning: row?.warning ?? null,
      };
    } else {
      const ua = unarmedAttack(scores, level, unarmedDice);
      actionRow = { label: 'Action', name: ua.name, toHit: ua.toHit, damage: ua.damage };
    }
    push('action+bonus', {
      key: 'tavern-brawler',
      name: 'Tavern Brawler',
      source: 'Feat',
      cost: 'action + bonus action',
      subAttacks: [
        actionRow,
        { label: 'Bonus', name: 'Grapple', detail: grappleAction.description },
      ],
      detail: `Hit with ${equippedImprovised ? equippedImprovised.name : 'an Unarmed Strike'} (Action), then use a bonus action to grapple the target (Tavern Brawler).`,
    });
  }

  // Class / subclass features (curated, level-gated by the character's known features).
  const featureMap = is2024 ? CLASS_FEATURE_ACTIONS_2024 : CLASS_FEATURE_ACTIONS_5E;
  const classFeatures = featureMap[charClass] || {};
  const knownFeatures = featuresKnownAtLevel(charClass, level, edition);
  for (const fname of knownFeatures) {
    const def = classFeatures[fname];
    if (!def) continue;
    push(def.tab, {
      key: `feature:${fname}`,
      name: fname,
      source: 'Class Feature',
      cost: def.cost,
      detail: def.description,
      resourceKey: def.resourceKey,
    });
  }

  // Racial trait actions.
  for (const trait of characterData.race_traits || []) {
    const def = RACIAL_ACTIONS[trait];
    if (!def) continue;
    push(def.tab, {
      key: `racial:${trait}`,
      name: trait,
      source: 'Racial',
      cost: def.cost,
      detail: def.description,
    });
  }

  // Feat actions (e.g. Tavern Brawler's bonus-action grapple), from snapshotted feat effects.
  const pb = profBonus(level);
  for (const a of getFeatActions(feats)) {
    // Crossbow Expert's hand-crossbow attack only makes sense paired with an equipped hand
    // crossbow: it's shown as the Action+Bonus combo above when one is equipped, and not at
    // all otherwise (no hand crossbow → no bonus attack to make). Never a standalone bonus.
    if (hasCrossbowExpert && a.source === 'Crossbow Expert') continue;
    // Tavern Brawler's grapple is shown as the Action+Bonus combo above, never as a standalone bonus.
    if (a.source === 'Tavern Brawler' && /grapple/i.test(a.name)) continue;
    // Polearm Master's bonus attack requires a qualifying polearm (glaive/halberd/quarterstaff/spear)
    // in hand — hide it when none is equipped.
    if (a.source === 'Polearm Master' && !hasEquipped(inventory, isPolearm)) continue;
    // Defensive Duelist's reaction only works while wielding a finesse weapon — hide it otherwise,
    // and when shown, spell out the +PB it adds to AC.
    let detail = [a.trigger, a.description].filter(Boolean).join(' — ');
    if (a.source === 'Defensive Duelist') {
      if (!hasEquipped(inventory, isFinesseWeapon)) continue;
      detail = `${detail} (currently +${pb} AC)`;
    }
    push(a.economy, {
      key: a.key,
      name: a.name,
      source: 'Feat',
      cost: ECONOMY_COST_LABEL[a.economy] || a.economy,
      detail,
    });
  }

  // Spells, classified by casting_time.
  for (const name of characterSpellNames(characterData)) {
    const spell = spellIndex[(name || '').toLowerCase()];
    if (!spell) continue; // unknown to the compendium — can't classify
    const cls = classifyCastingTime(spell.casting_time);
    if (!cls) continue; // longer-than-a-turn casting time — not a combat action
    const lvl = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
    push(cls.tab, {
      key: `spell:${name}`,
      name,
      source: 'Spell',
      cost: cls.cost,
      detail: spell.school ? `${lvl} · ${spell.school}` : lvl,
    });
  }

  // Universal menu (everyone) — rendered as a secondary group in the UI.
  (is2024 ? UNIVERSAL_ACTIONS_2024 : UNIVERSAL_ACTIONS_5E).forEach((a) => {
    push('action', { key: `universal:${a.name}`, name: a.name, source: 'Universal', cost: 'action', detail: a.description });
  });
  (is2024 ? UNIVERSAL_REACTIONS_2024 : UNIVERSAL_REACTIONS_5E).forEach((r) => {
    push('reaction', { key: `universal:${r.name}`, name: r.name, source: 'Universal', cost: 'reaction', detail: r.description });
  });

  return { ...buckets, attacksPerAction: attacksPerAction(charClass, level) };
}

/**
 * Strip a trailing use-count parenthetical so feature-table names match the curated map:
 * "Action Surge (1/rest)" / "Indomitable (2/LR)" → "Action Surge" / "Indomitable".
 * ("Indomitable Might" has no parenthetical, so it stays distinct.)
 */
export function normalizeFeatureName(name) {
  return (name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Distinct (normalized) feature names a character knows at its level, in order gained. */
export function featuresKnownAtLevel(charClass, level = 1, edition = '5e') {
  const table = (edition === '5.5e' || edition === '2024' ? CLASS_FEATURES_2024 : CLASS_FEATURES_5E)[charClass];
  if (!table) return [];
  const seen = new Set();
  const names = [];
  for (let lvl = 1; lvl <= Number(level); lvl++) {
    for (const feat of table[lvl] || []) {
      const n = normalizeFeatureName(feat.feature_name || feat.name);
      if (n && !seen.has(n)) { seen.add(n); names.push(n); }
    }
  }
  return names;
}
