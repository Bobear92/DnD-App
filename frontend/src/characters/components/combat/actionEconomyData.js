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
import { abilityMod, profBonus, formatSigned, freeHandCount, isHeavyWeapon, nonProficientEquippedArmor } from '@/characters/components/inventory/inventoryData';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import { getFeatActions, getFeatUnarmedDice } from '@/characters/components/feats/featEffects';
import { hasFeat, critRange, critRangeLabel, greatWeaponMasterNote } from '@/characters/components/combat/combatBonuses';
import { hasSavageAttacks, SAVAGE_ATTACKS_NOTE } from '@/characters/components/race/raceCombatNotes';
import { bondedWeapons } from '@/characters/components/inventory/weaponBondData';
import { weaponNeedsAmmo } from '@/characters/components/inventory/ammunitionData';
import { remarkableAthleteMoveNote, eldritchStrikeNote } from '@/characters/components/subclass/subclassCombatNotes';
import { SUBCLASS_DATA } from '@/characters/components/classData/subclassData';
import {
  isArcaneShotBow, getArcaneShotOptions, arcaneShotSaveDc, arcaneShotSaveDcBreakdown,
  arcaneShotImproved,
} from '@/characters/components/classData/arcaneShotData';
import { getBreathWeapon } from '@/characters/components/race/breathWeaponData';

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

// ─── Subclass feature → action economy (curated) ──────────────────────────────────
// SUBCLASS_FEATURE_ACTIONS_*[class][subclass][featureName] — same entry shape as the
// class maps. Level-gated from SUBCLASS_DATA (the subclass feature tables), NOT the
// class feature tables, whose subclass levels are generic placeholders ("Martial
// Archetype Feature") that can never match a real feature name. Adding a subclass
// feature here is pure data entry.

export const SUBCLASS_FEATURE_ACTIONS_5E = {
  Fighter: {
    'Eldritch Knight': {
      'Weapon Bond': { tab: 'bonus', cost: 'bonus action', description: "Summon a bonded weapon to your hand (bonus action). You can't be disarmed of a bonded weapon while it's on the same plane. Bonding takes a 1-hour ritual; you can bond up to two weapons, but can summon only one at a time." },
    },
    'Arcane Archer': {
      // Applying an option costs nothing — it rides on an arrow you were firing anyway.
      'Arcane Shot': { tab: 'no_action', cost: 'no action', resourceKey: 'arcane_shot_used', description: 'When you fire an arrow from a shortbow or longbow as part of the Attack action, apply one of your known Arcane Shot options to it — one option per attack. Recharges on a short or long rest.' },
      'Curving Shot': { tab: 'bonus', cost: 'bonus action', description: 'When you miss with a magic arrow, use a bonus action to reroll the attack against a different target within 60 feet of the original one.' },
    },
  },
};

export const SUBCLASS_FEATURE_ACTIONS_2024 = {
  Fighter: {
    'Eldritch Knight': {
      'Weapon Bond': { tab: 'bonus', cost: 'bonus action', description: "Summon a bonded weapon to your hand (bonus action). You can't be disarmed of a bonded weapon while it's on the same plane. Bonding takes a 1-hour ritual; you can bond up to two weapons." },
    },
  },
};

/** Subclass feature names earned at or below `level`, from the SUBCLASS_DATA tables. */
export function subclassFeaturesKnownAtLevel(charClass, edition, subclass, level = 1) {
  const ed = edition === '5.5e' || edition === '2024' ? '5.5e' : '5e';
  const features = SUBCLASS_DATA[charClass]?.[ed]?.[subclass]?.features || [];
  const seen = new Set();
  const names = [];
  for (const f of features) {
    if (f.level > Number(level)) continue;
    if (f.name && !seen.has(f.name)) { seen.add(f.name); names.push(f.name); }
  }
  return names;
}

// ─── Racial trait → action economy ───────────────────────────────────────────────
// Keyed by racial trait name as stored in character_data.race_traits.

// `resourceKey` links the trait to its RACIAL_REST_RESOURCES counter (the same `<key>_used`
// the Stats-tab Racial Features tracker writes) so the card carries a Use button.
// A `compute` entry builds its own `detail` from the character — Breath Weapon's damage,
// save DC, shape and damage type all vary by level and chosen ancestry, so a static string
// would show a level-1 card to a level-16 Dragonborn.
export const RACIAL_ACTIONS = {
  'Breath Weapon': {
    tab: 'action',
    cost: 'action',
    resourceKey: 'breath_weapon_used',
    description: 'Exhale destructive energy in a line or cone (creatures make a DEX or CON save). Recharges on a short or long rest.',
    compute: ({ characterData, level, scores }) => {
      const bw = getBreathWeapon({
        raceTraits: characterData.race_traits,
        draconicAncestry: characterData.draconic_ancestry,
        level,
        constitutionScore: scores.constitution,
      });
      if (!bw) return null;
      return { detail: `${bw.summary} Recharges on a short or long rest.` };
    },
  },
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

/** A weapon that can make a ranged attack — a ranged weapon (bow/crossbow/sling/blowgun,
 *  via the Ammunition property or weapon_type) or a thrown weapon. Such attacks have
 *  disadvantage while an enemy is within 5 ft (see the Spacing mechanics page), unless
 *  Crossbow Expert removes it. Mirrors InventoryTab's ranged-weapon detection. */
const isRangedWeapon = (e) =>
  e.category === 'weapons'
  && ((e.weapon_type || '').toLowerCase() === 'ranged'
      || (e.properties || '').toLowerCase().includes('ammunition')
      || (e.properties || '').toLowerCase().includes('thrown'));

/** A weapon that IS a ranged weapon — the Sharpshooter condition. Deliberately stricter than
 *  `isRangedWeapon`: RAW Sharpshooter reads "a ranged weapon", and a thrown handaxe is a MELEE
 *  weapon making a ranged attack, so it does not qualify (a dart does — it's a simple ranged
 *  weapon that happens to be thrown). Hence the explicit melee exclusion. */
const isPureRangedWeapon = (e) =>
  e.category === 'weapons' && !isMelee(e)
  && ((e.weapon_type || '').toLowerCase() === 'ranged'
      || (e.properties || '').toLowerCase().includes('ammunition'));

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

/** Add a flat amount to a damage string's modifier: "1d12 + 4 slashing" +10 → "1d12 + 14 slashing". */
function addFlatDamage(damage, amount) {
  const m = /^(\S+)(?:\s*([+-])\s*(\d+))?(.*)$/.exec((damage || '').trim());
  if (!m) return damage;
  const [, die, sign, num, rest] = m;
  const flat = (sign === '-' ? -Number(num) : Number(num) || 0) + amount;
  const flatStr = flat === 0 ? '' : ` ${flat > 0 ? '+' : '-'} ${Math.abs(flat)}`;
  return `${die}${flatStr}${rest}`;
}

/**
 * The −5 attack / +10 damage power attack (5e/2014). TWO feats grant the identical mechanic on
 * disjoint weapon sets — Great Weapon Master on a Heavy melee weapon, Sharpshooter on a ranged
 * weapon — so they share one variant builder and one UI toggle, parameterised by `source` (the
 * feat name, which labels the to-hit breakdown and the button). Given a computed weapon attack
 * row, returns the modified { toHit, toHitBreakdown, damage }; the flat damage modifier is
 * parsed out of the row's damage string and raised by 10.
 */
export function powerAttackVariant(attackRow = {}, source = 'Great Weapon Master') {
  const base = parseInt(attackRow.toHit, 10) || 0;
  return {
    toHit: formatSigned(base - 5),
    toHitBreakdown: [...(attackRow.toHitBreakdown || []), { label: source, value: -5 }],
    damage: addFlatDamage(attackRow.damage, 10),
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
  armorProfText = '',
  raceArmor = [],
} = {}) {
  const is2024 = edition === '5.5e' || edition === '2024';
  const buckets = { no_action: [], action: [], bonus: [], 'action+bonus': [], reaction: [] };
  const push = (tab, entry) => { if (buckets[tab]) buckets[tab].push(entry); };

  // Champion Fighter expanded crit range (Improved/Superior Critical) — applies to weapon
  // attacks, so it rides on each real weapon Action entry. Null for everyone else.
  const crit = critRange({ charClass, subclass, level });
  const critLabel = critRangeLabel(crit);
  // 2024 Champion Remarkable Athlete's post-crit free move — crit-triggered, so it rides on
  // each real weapon Action entry next to the crit range. Null for 5e / non-Champions.
  const remarkableMove = remarkableAthleteMoveNote({ charClass, subclass, level, edition });
  // Eldritch Knight's Eldritch Strike (L10) — an on-hit weapon-attack rider, so it rides on
  // each real weapon Action entry. Null for everyone else.
  const eldritchStrike = eldritchStrikeNote({ charClass, subclass, level });

  // Weapon attacks (Action). Show an unarmed strike when nothing is equipped, or whenever a
  // feat upgrades the unarmed die (e.g. Tavern Brawler's 1d4) so the upgrade is visible.
  const feats = characterData.feats || [];
  const unarmedDice = getFeatUnarmedDice(feats);
  // Great Weapon Master's −5/+10 power attack is the 2014 mechanic; the 2024 feat replaces it
  // with a flat +PB, so the toggle is 5e-only.
  const gwm = !is2024 && hasFeat(feats, 'Great Weapon Master');
  // Sharpshooter's −5/+10 is likewise the 2014 mechanic — the 2024 feat replaces it with a flat
  // +PB on ranged damage, so this toggle is 5e-only too.
  const sharpshooter = !is2024 && hasFeat(feats, 'Sharpshooter');
  // GWM's crit/kill bonus-attack reminder (both editions) — co-located on melee weapon rows,
  // so it sits next to the power attack rather than off in the Bonus Actions list.
  const gwmBonusNote = greatWeaponMasterNote(feats);
  const weaponRows = [...attacks];
  if (unarmedDice || weaponRows.length === 0) {
    const ua = unarmedAttack(scores, level, unarmedDice);
    // An unarmed strike is a STR-based attack roll, so worn non-proficient armor puts it
    // at disadvantage too (equipped-weapon rows already carry this via getAttacks).
    const badArmor = nonProficientEquippedArmor(inventory, { armorProfText, raceArmor });
    if (badArmor) {
      ua.disadvantage = true;
      ua.warning = `Wearing ${badArmor.name} without proficiency — attack rolls at disadvantage.`;
    }
    weaponRows.push(ua);
  }
  weaponRows.forEach((atk, i) => {
    const flag = atk.proficient === false ? ' · not proficient' : '';
    const disadv = atk.disadvantage ? ' · disadvantage' : '';
    // Power-attack variant (−5/+10). Both feats require PROFICIENCY with the weapon, and their
    // weapon sets are disjoint — Heavy melee for GWM, ranged for Sharpshooter — so a given card
    // can only ever offer one, and a single `powerAttack` slot suffices for a character with both.
    const weapon = atk.uid ? (inventory || []).find((e) => e.uid === atk.uid) : null;
    let powerAttack = null;
    if (weapon && atk.proficient !== false) {
      const powerSource = (gwm && isMelee(weapon) && isHeavyWeapon(weapon)) ? 'Great Weapon Master'
        : (sharpshooter && isPureRangedWeapon(weapon)) ? 'Sharpshooter'
        : null;
      if (powerSource) {
        const v = powerAttackVariant(atk, powerSource);
        powerAttack = {
          source: powerSource,
          toHit: v.toHit,
          toHitBreakdown: v.toHitBreakdown,
          detailRest: `to hit · ${v.damage}${flag}${disadv}`,
        };
      }
    }
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
      // `{source, note}` when a feature makes this weapon's attacks magical (overcoming
      // resistance/immunity to nonmagical damage) — resolved once in getAttacks, so this tab
      // and the Items tab always agree. Null for a mundane weapon.
      magical: atk.magical || null,
      // Situational note: a ranged/thrown attack has disadvantage while an enemy is within
      // 5 ft. Crossbow Expert removes it. Rendered with a link to the Spacing page.
      spacingNote: (weapon && isRangedWeapon(weapon))
        ? (hasFeat(feats, 'Crossbow Expert')
            ? 'No disadvantage firing while an enemy is within 5 ft (Crossbow Expert).'
            : 'Ranged attacks have disadvantage while an enemy is within 5 ft.')
        : null,
      // Half-Orc Savage Attacks: extra damage die on a melee weapon crit. Shown on melee
      // weapon attacks (not unarmed strikes, which aren't weapons, nor ranged weapons).
      savageAttacksNote: (weapon && isMelee(weapon) && hasSavageAttacks(characterData.race_traits))
        ? SAVAGE_ATTACKS_NOTE : null,
      // Great Weapon Master / Sharpshooter −5/+10 variant (5e), toggled in the UI. Null when N/A.
      powerAttack,
      // Great Weapon Master's other benefit (both editions): a crit or kill with a melee
      // weapon grants a bonus melee attack. Shown on melee weapon entries only.
      greatWeaponMasterNote: (weapon && isMelee(weapon)) ? gwmBonusNote : null,
      // Champion expanded crit range on real weapon attacks (not the unarmed fallback, which
      // has no uid and isn't a weapon attack for Improved Critical).
      critRange: atk.uid && crit ? critLabel : null,
      critSource: atk.uid && crit ? crit.source : null,
      // 2024 Champion Remarkable Athlete post-crit free move — on real weapon attacks only.
      remarkableMoveNote: atk.uid ? remarkableMove : null,
      // Eldritch Knight Eldritch Strike on-hit rider — on real weapon attacks only (an
      // unarmed strike isn't a weapon attack for this feature).
      eldritchStrikeNote: atk.uid ? eldritchStrike : null,
      // Hexblade Hex Warrior — this attack's numbers actually used Charisma.
      hexNote: atk.hexNote || null,
      // A weapon with the Ammunition property fires from a stack in the inventory. The uid +
      // flag are all the tab needs to render the shared ammo control (which reads the live
      // inventory itself) on this attack's card.
      weaponUid: atk.uid || null,
      needsAmmo: !!(weapon && weaponNeedsAmmo(weapon)),
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

  // Charger (feat, 5e) — after you take the Dash action you can use a bonus action to make
  // one melee weapon attack or to shove a creature (moving 10 ft straight toward the target
  // first adds +5 damage on the attack or a 10-ft push on the shove). Present it as an Action
  // (Dash) + Bonus combo. With a melee weapon equipped the bonus can be an attack OR a shove;
  // with no melee weapon there's no weapon attack to make, so only the Dash + shove shows.
  // (The 2024 Charger is a different mechanic — a damage rider on the Attack action — so no combo.)
  if (!is2024 && hasFeat(feats, 'Charger')) {
    const attackByUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
    const baseDamage = (w) => `${w.damage || '—'}${w.damage_type ? ` ${w.damage_type}` : ''}`;
    const meleeWeapon = (inventory || []).find((e) => e.equipped && isMelee(e));
    const dashRow = {
      label: 'Action',
      name: 'Dash',
      detail: 'Move up to your speed — at least 10 ft straight toward the target to power the bonus.',
    };
    const shoveRow = {
      label: meleeWeapon ? 'or Shove' : 'Bonus',
      name: 'Shove',
      detail: 'Push the target 5 ft or knock it prone; push up to 10 ft if you moved 10 ft straight first.',
    };
    let chargerSubAttacks;
    let chargerDetail;
    if (meleeWeapon) {
      const row = attackByUid.get(meleeWeapon.uid);
      chargerSubAttacks = [
        dashRow,
        {
          label: 'Bonus',
          name: meleeWeapon.name,
          toHit: row?.toHit ?? null,
          damage: row?.damage ?? baseDamage(meleeWeapon),
          warning: row?.warning ?? null,
        },
        shoveRow,
      ];
      chargerDetail = `After you Dash, use a bonus action to make one melee attack with ${meleeWeapon.name} or to shove the target. Move at least 10 ft straight toward it first for +5 damage on the attack (on a hit) or a 10-ft push on the shove (Charger).`;
    } else {
      chargerSubAttacks = [dashRow, shoveRow];
      chargerDetail = 'After you Dash, use a bonus action to shove a creature. Move at least 10 ft straight toward it first to push it up to 10 ft (Charger). Equip a melee weapon to also make a bonus-action melee attack.';
    }
    push('action+bonus', {
      key: 'charger',
      name: 'Charger',
      source: 'Feat',
      cost: 'action + bonus action',
      subAttacks: chargerSubAttacks,
      detail: chargerDetail,
    });
  }

  // Charger (feat, 2024) — a different mechanic from 5e: no bonus-action attack. A melee attack
  // made during the Attack action after moving ≥10 ft straight toward the target gains, once per
  // turn, either +1d8 damage OR a 10-ft push; and the Dash action gains +10 ft of Speed. Surface
  // it as a distinct "Charge" Action entry, only when a melee weapon is equipped to make the attack.
  if (is2024 && hasFeat(feats, 'Charger')) {
    const meleeWeapon = (inventory || []).find((e) => e.equipped && isMelee(e));
    if (meleeWeapon) {
      const attackByUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
      const baseDamage = (w) => `${w.damage || '—'}${w.damage_type ? ` ${w.damage_type}` : ''}`;
      const row = attackByUid.get(meleeWeapon.uid);
      push('action', {
        key: 'charger-2024',
        name: 'Charge',
        source: 'Feat',
        cost: 'action',
        subAttacks: [
          {
            label: 'Attack',
            name: meleeWeapon.name,
            toHit: row?.toHit ?? null,
            damage: row?.damage ?? baseDamage(meleeWeapon),
            warning: row?.warning ?? null,
          },
          { label: '+1d8', name: 'Extra damage', detail: 'On the hit, deal an extra 1d8 damage (once per turn).' },
          { label: 'or Push', name: 'Push 10 ft', detail: 'Instead of the extra damage, push the target up to 10 ft away (once per turn).' },
        ],
        detail: `Move at least 10 ft in a straight line toward a target, then hit it with ${meleeWeapon.name} (Attack action) to add +1d8 damage or a 10-ft push (once per turn). Your Dash action also gains +10 ft of Speed (Charger).`,
      });
    }
  }

  // War Magic (Eldritch Knight L7, both editions) — cast a cantrip with your action, then make
  // one weapon attack as a bonus action. At L18 Improved War Magic upgrades the trigger to any
  // spell. Presented as an Action + Bonus combo (Crossbow Expert pattern) with the equipped
  // weapon's real numbers; only shown when a weapon is equipped (no weapon → no bonus attack).
  // NOTE: casting the cantrip IS your action — you don't also take the Attack action, so no
  // Extra Attack that turn (the detail says so; the app displays attacks, it doesn't roll them).
  if (charClass === 'Fighter' && subclass === 'Eldritch Knight' && level >= 7) {
    const weaponRow = weaponRows.find((a) => a.uid);
    if (weaponRow) {
      const improved = level >= 18;
      push('action+bonus', {
        key: 'war-magic',
        name: 'War Magic',
        source: 'Subclass',
        cost: 'action + bonus action',
        subAttacks: [
          {
            label: 'Action',
            name: improved ? 'Cast a spell' : 'Cast a cantrip',
            detail: improved
              ? 'Use your action to cast any spell (Improved War Magic).'
              : 'Use your action to cast a cantrip.',
          },
          {
            label: 'Bonus',
            name: weaponRow.name,
            toHit: weaponRow.toHit,
            damage: weaponRow.damage,
            warning: weaponRow.warning ?? null,
          },
        ],
        detail: `Cast a ${improved ? 'spell (Improved War Magic)' : 'cantrip'} with your action, then make one weapon attack with ${weaponRow.name} as a bonus action. Casting replaces the Attack action, so Extra Attack doesn't apply that turn.`,
      });
    }
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

  // Arcane Shot (Arcane Archer L3+) attaches to the bow attacks it can actually ride on, so
  // the option you'd apply is read off the same card as the attack you're making — rather
  // than a free-floating entry you have to cross-reference mid-combat. RAW limits it to a
  // shortbow or longbow, so a crossbow-wielding archer gets nothing here (and falls back to
  // the standalone entry below). The uses are the shared `arcane_shot_used` pool: attaching
  // `resourceKey` gives every bow card the same Use button, spending from the one pool.
  const arcaneShotBows = (charClass === 'Fighter' && subclass === 'Arcane Archer' && level >= 3)
    ? buckets.action.filter((e) => e.source === 'Weapon' && isArcaneShotBow(e.name))
    : [];
  const arcaneShotBowKeys = arcaneShotBows.map((e) => e.key);
  if (arcaneShotBows.length > 0) {
    const known = characterData.arcane_shot_options || [];
    // Superior Arcane Shot (L18) is resolved INTO each option's description — one paragraph
    // with the bigger dice — rather than shipped as a separate clause the card appends. A
    // trailing "the damage increases to 4d6" next to a description that still says 2d6 reads
    // as an extra effect on top, which is exactly how it was being misread mid-combat.
    const improved = arcaneShotImproved(level);
    const options = getArcaneShotOptions(known).map((o) => ({
      name: o.name,
      description: (improved && o.improvedDescription) || o.description,
      improved,
    }));
    for (const entry of arcaneShotBows) {
      entry.resourceKey = 'arcane_shot_used';
      // No `cost` here: attached to the bow's Attack-action card, Arcane Shot costs nothing on
      // top of the attack it rides on, so the tab renders it without an action-cost badge. The
      // standalone fallback entry below (no bow equipped) still carries `def.cost`.
      entry.arcaneShot = {
        saveDc: arcaneShotSaveDc(level, scores.intelligence),
        // The same DC as arithmetic, so the card's number can expand into how it was reached.
        saveDcBreakdown: arcaneShotSaveDcBreakdown(level, scores.intelligence),
        note: `Apply one option to an arrow fired from your ${entry.name} as part of the Attack action — one option per attack. Recharges on a short or long rest.`,
        options,
        emptyNote: options.length === 0 ? 'No options chosen yet — pick them at level-up.' : null,
      };
    }
  }

  // Subclass features (curated, level-gated by the SUBCLASS_DATA feature tables — the class
  // tables only carry placeholders at subclass levels, so they can't resolve these names).
  const subclassFeatureMap = is2024 ? SUBCLASS_FEATURE_ACTIONS_2024 : SUBCLASS_FEATURE_ACTIONS_5E;
  const subclassFeatures = subclassFeatureMap[charClass]?.[subclass] || {};
  const attackByWeaponUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
  for (const fname of subclassFeaturesKnownAtLevel(charClass, edition, subclass, level)) {
    const def = subclassFeatures[fname];
    if (!def) continue;
    // Weapon Bond with weapons actually bonded (Items tab → Bonded Weapons): replace the
    // generic entry with one per bonded weapon — "Bonded Rapier" — carrying the weapon's
    // damage info, plus its real attack row when it's equipped.
    if (fname === 'Weapon Bond') {
      const bonded = bondedWeapons(inventory, characterData);
      if (bonded.length > 0) {
        for (const w of bonded) {
          const row = attackByWeaponUid.get(w.uid);
          const weaponInfo = [w.damage, w.damage_type].filter(Boolean).join(' ');
          push(def.tab, {
            key: `subclass:weapon-bond:${w.uid}`,
            name: `Bonded ${w.name}`,
            source: 'Subclass',
            cost: def.cost,
            detail: `Summon your bonded ${w.name} to your hand as a bonus action — you can't be`
              + ` disarmed of it while it's on the same plane.${weaponInfo ? ` ${weaponInfo}.` : ''}`,
            subAttacks: row
              ? [{ label: 'Attack', name: w.name, toHit: row.toHit, damage: row.damage, warning: row.warning }]
              : null,
          });
        }
        continue;
      }
      // No weapon bonded yet — keep the generic entry with a pointer to the picker.
      push(def.tab, {
        key: `subclass:${fname}`,
        name: fname,
        source: 'Subclass',
        cost: def.cost,
        detail: `${def.description} No weapon bonded yet — bond one from the Items tab (Weapons → Bonded Weapons).`,
      });
      continue;
    }
    // Arcane Shot rides on an arrow you were firing anyway, so it belongs ON the bow attack
    // card (attached below), not as a free-floating entry. It only falls back to its own
    // entry when no shortbow/longbow is equipped — otherwise the feature would vanish from
    // the tab entirely (same fallback shape as Weapon Bond with nothing bonded).
    if (fname === 'Arcane Shot') {
      if (arcaneShotBowKeys.length > 0) continue;
      const known = characterData.arcane_shot_options || [];
      push(def.tab, {
        key: `subclass:${fname}`,
        name: fname,
        source: 'Subclass',
        cost: def.cost,
        detail: `${def.description}${known.length > 0 ? ` Options known: ${known.join(', ')}.` : ' No options chosen yet — pick them at level-up.'}`
          + ' Equip a shortbow or longbow to apply it to an attack.',
        resourceKey: def.resourceKey,
      });
      continue;
    }
    push(def.tab, {
      key: `subclass:${fname}`,
      name: fname,
      source: 'Subclass',
      cost: def.cost,
      detail: def.description,
      resourceKey: def.resourceKey,
    });
  }

  // Arcane Charge (Eldritch Knight L15) — it costs nothing extra, so it hangs off the Action
  // Surge entry rather than being its own action. It goes in `riders` (its own labelled line)
  // instead of being appended to `detail`: run into the base text it reads as something Action
  // Surge always does, which it is not.
  if (charClass === 'Fighter' && subclass === 'Eldritch Knight' && level >= 15) {
    const surge = buckets.no_action.find((e) => e.key === 'feature:Action Surge');
    if (surge) {
      surge.riders = [
        ...(surge.riders || []),
        {
          source: 'Arcane Charge',
          text: 'When you use Action Surge, you can teleport up to 30 ft to an unoccupied space you can see, before or after the extra action.',
        },
      ];
    }
  }

  // Racial trait actions. A `compute` entry derives its own detail/meta from the character
  // (level, ability scores, stored racial choices) instead of showing a fixed string.
  for (const trait of characterData.race_traits || []) {
    const def = RACIAL_ACTIONS[trait];
    if (!def) continue;
    const computed = def.compute ? def.compute({ characterData, level, scores }) : null;
    push(def.tab, {
      key: `racial:${trait}`,
      name: trait,
      source: 'Racial',
      cost: def.cost,
      detail: computed?.detail ?? def.description,
      ...(def.resourceKey ? { resourceKey: def.resourceKey } : {}),
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
    // Great Weapon Master's crit/kill bonus attack needs a melee weapon in hand (its trigger).
    // Shown BOTH as this standalone Bonus entry and as a reminder note on the melee weapon.
    if (a.source === 'Great Weapon Master' && !hasEquipped(inventory, isMelee)) continue;
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

  // Spells — collapse to a single "Cast a Spell" entry per casting-time bucket the
  // character actually has a castable spell in, rather than listing every spell (which
  // cluttered the tab). The full spell list, slots, and casting live on the Spells tab.
  // Only appears when the character can cast a spell with that casting time.
  const spellCastTabs = new Set();
  for (const name of characterSpellNames(characterData)) {
    const spell = spellIndex[(name || '').toLowerCase()];
    if (!spell) continue; // unknown to the compendium — can't classify
    const cls = classifyCastingTime(spell.casting_time);
    if (!cls) continue; // longer-than-a-turn casting time — not a combat action
    spellCastTabs.add(cls.tab);
  }
  for (const tab of ['action', 'bonus', 'reaction']) {
    if (!spellCastTabs.has(tab)) continue;
    push(tab, {
      key: `spell:${tab}`,
      name: 'Cast a Spell',
      source: 'Spell',
      cost: ECONOMY_COST_LABEL[tab],
      detail: 'See the Spells tab for your spells, slots, and casting details.',
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
