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
import { abilityMod, profBonus, formatSigned } from './inventoryData';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import { CLASS_FEATURES_2024 } from './classFeatures2024';

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

const isLightMelee = (e) =>
  e.category === 'weapons' &&
  (e.weapon_type || '').toLowerCase() === 'melee' &&
  (e.properties || '').toLowerCase().includes('light');

/** Two or more equipped light melee weapons enable Two-Weapon Fighting. */
export function canTwoWeaponFight(inventory = []) {
  return (inventory || []).filter((e) => e.equipped && isLightMelee(e)).length >= 2;
}

function unarmedAttack(scores = {}, level = 1) {
  const str = abilityMod(scores.strength);
  const dmg = 1 + str;
  return {
    name: 'Unarmed Strike',
    toHit: formatSigned(str + profBonus(level)),
    damage: `${dmg < 1 ? 1 : dmg} bludgeoning`,
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

  // Weapon attacks (Action). Fall back to an unarmed strike when nothing is equipped.
  const weaponRows = attacks.length ? attacks : [unarmedAttack(scores, level)];
  weaponRows.forEach((atk, i) => {
    const flag = atk.proficient === false ? ' · not proficient' : '';
    push('action', {
      key: `weapon:${atk.uid || atk.name}:${i}`,
      name: atk.name,
      source: 'Weapon',
      cost: 'action',
      detail: `${atk.toHit} to hit · ${atk.damage}${flag}`,
    });
  });

  // Two-Weapon Fighting (Action + Bonus Action).
  if (canTwoWeaponFight(inventory)) {
    push('action+bonus', {
      key: 'twf',
      name: 'Two-Weapon Fighting',
      source: 'Weapon',
      cost: 'action + bonus action',
      detail: 'Take the Attack action with a light melee weapon, then use your bonus action to attack with a different light melee weapon in your other hand (no ability bonus to that damage unless a feature grants it).',
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
