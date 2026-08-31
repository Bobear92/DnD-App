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
import { mightDie, sizeAt, isEffectActive } from '@/characters/components/effects/activeEffects';
import { abilityMod, profBonus, formatSigned, freeHandCount, isHeavyWeapon, nonProficientEquippedArmor } from '@/characters/components/inventory/inventoryData';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import { getFeatActions, getFeatUnarmedDice, getFeatProficiencyGrants } from '@/characters/components/feats/featEffects';
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
import { psionicDieAndInt, psiSaveDc, bulwarkTargets } from '@/characters/components/classData/psiWarriorData';
import { RUNE_OPTIONS, channelRuneKey, runeSaveDcParts } from '@/characters/components/classData/runesData';
import { isRuneActive } from '@/characters/components/inventory/runeCarving';
import { getBreathWeapon } from '@/characters/components/race/breathWeaponData';
import { echoArmorClass } from '@/characters/components/companions/companionData';
import { buildBreakdown } from '@/characters/components/skills/skillMath';
import { computeRaceGrantedCantrips } from '@/characters/components/race/raceCantrips';
import { getRacialSpellResources } from '@/characters/components/race/racialRestResources';
import { getSubclassGrantedSpells } from '@/characters/components/classData/subclassSpells';
import { getFeatGrantedSpells } from '@/characters/components/feats/featEffects';

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
//
// A feature name may map to a SINGLE entry or to an ARRAY of them: some features bundle
// several powers at different costs under one name (the Psi Warrior's Psionic Power is a
// reaction, an action and an attack rider all at once), and one card would have to pick a
// single cost badge and misstate the rest. Array members carry their own `name`; a single
// entry takes the feature's name, or its `displayName` when the trigger a player scans for
// differs from the feature name (Cavalier's Unwavering Mark → "Marked Target").

/**
 * Psi Warrior (Fighter, TCoE / PHB-2024) — identical in both editions, so it is authored once
 * and registered in both maps below.
 *
 * Psionic Energy is the app's first ONE POOL, MANY CONSUMERS resource: five of these entries
 * spend the same `psionic_energy_used` dice, so they all carry that one `resourceKey` and the
 * class config holds a single pool row. Three of them (Telekinetic Movement, Psi-Powered Leap,
 * Bulwark of Force) are FREE once per rest and cost a die only after that, which is why each has
 * its own small charge key AS WELL AS `fallbackResourceKey` pointing at the pool — two costs, two
 * counters, one Use button that spends whichever one is actually paying.
 *
 * It is also the app's first resource that REFILLS another: the bonus-action die regain carries
 * `restoresResourceKey`, so using it hands a die back rather than telling the player to ask their
 * GM, and `hidden` keeps it off the tab while the pool is full.
 *
 * Every number is read out of psiWarriorData rather than written into a string: the die size
 * scales d6 → d12 with level, and the stored feature blurbs say a flat "d6".
 */
const PSI_WARRIOR_ACTIONS = {
  // Psionic Power is ONE feature name carrying THREE powers at three different costs, which is
  // why a feature may map to an ARRAY here. Folding them into one card would have to pick a
  // single cost badge and lie about the other two.
  'Psionic Power': [
    // Psionic Strike rides on a weapon attack you were making anyway, so it attaches to the
    // attack cards (`attachedAs`, see ATTACHED_FEATURES). This entry is the FALLBACK shown only
    // when there is no weapon attack to hang it on — the Arcane Shot / Weapon Bond shape.
    {
      name: 'Psionic Strike', attachedAs: 'Psionic Strike',
      tab: 'no_action', cost: 'no action', resourceKey: 'psionic_energy_used',
      description: 'Once per turn when you hit a creature within 30 feet with a weapon attack,'
        + ' spend a Psionic Energy die to deal extra force damage.',
      compute: ({ level, scores }) => ({
        detail: 'Once per turn when you hit a creature within 30 feet with a weapon attack, spend'
          + ` a Psionic Energy die to deal an extra ${psionicDieAndInt(level, scores?.intelligence ?? 10)}`
          + ' force damage. Equip a weapon to apply it to an attack.',
      }),
    },
    {
      name: 'Protective Field',
      tab: 'reaction', cost: 'reaction', resourceKey: 'psionic_energy_used',
      description: 'When you or a creature you can see within 30 feet takes damage, spend a'
        + ' Psionic Energy die to reduce that damage.',
      compute: ({ level, scores }) => ({
        detail: 'When you or a creature you can see within 30 feet takes damage, spend a Psionic'
          + ` Energy die to reduce that damage by ${psionicDieAndInt(level, scores?.intelligence ?? 10)},`
          + ' to a minimum reduction of 1.',
      }),
    },
    // An ACTION, not the bonus action the stored blurb claims (a Magic action in 2024).
    {
      name: 'Telekinetic Movement',
      tab: 'action', cost: 'action', resourceKey: 'telekinetic_movement_used',
      fallbackResourceKey: 'psionic_energy_used',
      description: 'Move one Large or smaller object, or one willing creature, up to 30 feet to a'
        + ' space you can see within 30 feet. Free once per short or long rest; after that, spend'
        + ' a Psionic Energy die instead.',
    },
    // Not a power the dice fuel but the valve that refills them: as a bonus action you regain
    // ONE expended die, and can't again until a rest. It carries `restoresResourceKey` so the
    // Use button actually hands the die back, and `hidden` so it only appears with a die
    // missing — offering "regain a die" on a full pool is a button that does nothing.
    {
      name: 'Regain a Psionic Energy Die',
      tab: 'bonus', cost: 'bonus action', resourceKey: 'psionic_energy_regain_used',
      restoresResourceKey: 'psionic_energy_used',
      hidden: ({ characterData }) => (characterData?.psionic_energy_used ?? 0) <= 0,
      description: "Regain one expended Psionic Energy die. You cannot do this again until"
        + ' you finish a short or long rest.',
    },
  ],
  // Two powers again: one costs a bonus action of its own, the other rides on Psionic Strike.
  'Telekinetic Adept': [
    {
      name: 'Psi-Powered Leap',
      tab: 'bonus', cost: 'bonus action', resourceKey: 'psi_powered_leap_used',
      fallbackResourceKey: 'psionic_energy_used',
      description: 'Gain a flying speed equal to twice your walking speed until the end of the'
        + ' turn. Free once per long rest; after that, spend a Psionic Energy die instead.',
    },
    {
      name: 'Telekinetic Thrust', attachedAs: 'Telekinetic Thrust',
      tab: 'no_action', cost: 'no action',
      description: 'When your Psionic Strike hits, you can force the target to make a Strength'
        + ' saving throw or be knocked prone or pushed up to 10 feet away.',
    },
  ],
  // Guarded Mind's psychic resistance is a passive and belongs to the Defenses card, not here.
  // Only its second half — spending a die to shrug off a condition — costs anything, and it
  // fires at the start of your turn rather than on an action you choose.
  'Guarded Mind': {
    tab: 'no_action', cost: 'no action', resourceKey: 'psionic_energy_used',
    displayName: 'Guarded Mind (end a condition)',
    description: 'If you start your turn charmed or frightened, spend a Psionic Energy die to end'
      + ' that condition on yourself.',
  },
  'Bulwark of Force': {
    tab: 'bonus', cost: 'bonus action', resourceKey: 'bulwark_of_force_used',
    fallbackResourceKey: 'psionic_energy_used',
    description: 'Give yourself and other creatures within 30 feet half cover for 1 minute. Free'
      + ' once per long rest; after that, spend a Psionic Energy die instead.',
    compute: ({ scores }) => ({
      detail: `Choose up to ${bulwarkTargets(scores?.intelligence ?? 10)} creatures within 30 feet`
        + ' (you may include yourself). Each gains half cover for 1 minute. Free once per long'
        + ' rest; after that, spend a Psionic Energy die instead.',
    }),
  },
  // Two costs, so two cards — the same split Psionic Power and Telekinetic Adept take. Casting
  // telekinesis is an ACTION; the weapon attack it enables is a bonus action. A single card had
  // to pick one badge and wore 'bonus action', which mis-stated the half a player actually opens
  // the tab to find. The spell itself now also lives in the Spells tab's Subclass source
  // (subclassSpells.js), so this card carries the cost and the trigger, not the spell's text.
  'Telekinetic Master': [
    {
      name: 'Cast Telekinesis',
      tab: 'action', cost: 'action',
      description: 'Cast telekinesis at will, without a spell slot or components, using'
        + ' Intelligence as your spellcasting ability. It requires concentration, so it ends if'
        + ' you lose concentration or cast another spell that needs it.',
    },
    {
      // An ACTION + BONUS combo, not a lone bonus action — the pairing is the feature. RAW
      // telekinesis is exerted "as your action each round", so the turn this bonus attack lives
      // in is a telekinesis turn: on the first, the action casts it (you are concentrating from
      // that moment, so the attack is already live); on every turn after, the action re-exerts
      // it. Filed under 'bonus' it sat alone in the Bonus Actions tab with nothing naming the
      // action that enables it, which is not something a player can act on — found in QA.
      // The concentration gate stays TEXT rather than a filter: the app models no concentration
      // state (the line Rage and durations sit behind), so it is stated the way the Defenses
      // panel states every situational entry.
      name: 'Telekinetic Master',
      tab: 'action+bonus', cost: 'action + bonus action',
      description: 'While you are concentrating on telekinesis, you can make one weapon attack as'
        + ' a bonus action on each of your turns.',
      telekineticAttack: true,
    },
  ],
};

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
    // Rune Knight is 5e-ONLY — the 2024 PHB ships Battle Master, Champion, Eldritch Knight and
    // Psi Warrior, so there is deliberately no 5.5e entry for it.
    'Rune Knight': {
      // The first ACTIVE EFFECT in the app: Use spends a charge AND switches the effect on, so
      // the card carries the toggle rather than a bare counter. Everything it changes — size,
      // Strength advantage, the extra damage die — is resolved from `active_effects` by the
      // consumers, so nothing here restates a number that lives in activeEffects.js.
      "Giant's Might": {
        tab: 'bonus', cost: 'bonus action', resourceKey: 'giants_might_used',
        activeEffect: 'giants_might',
        compute: ({ level }) => ({
          detail: `For 1 minute you become ${sizeAt(level)} (if you have the room), have advantage`
            + ` on Strength checks and Strength saving throws, and once on each of your turns one`
            + ` attack with a weapon or an unarmed strike deals an extra ${mightDie(level)} damage.`
            + (level >= 18 ? ' You can choose to become Large instead of Huge.' : ''),
        }),
        description: 'Grow, gain Strength advantage and an extra damage die for 1 minute.',
      },
      'Runic Shield': {
        tab: 'reaction', cost: 'reaction', resourceKey: 'runic_shield_used',
        // RAW: reroll the d20 and use the NEW roll. The stored feature blurb says "use the lower
        // of the two rolls", which would make the feature strictly stronger than it is.
        description: 'When another creature you can see within 60 feet is hit by an attack roll,'
          + ' force the attacker to reroll the d20 and use the new roll.',
      },
      // Channel Rune — one card per rune, GENERATED from RUNE_OPTIONS rather than six
      // near-identical hand-written blocks (the duplication tripwire: the cost, tab and rules
      // text all already live on the rune). Each rune recharges independently, so each carries
      // its own resourceKey.
      //
      // Every card `hidden`s itself unless the rune is CARVED onto an equipped object: knowing a
      // rune grants nothing, and a Channel Rune card for a rune you cannot invoke is an action
      // the player cannot take. Unequip the axe and its card leaves the tab.
      'Rune Carving': RUNE_OPTIONS.map((rune) => ({
        name: `Channel Rune: ${rune.name.replace(/ Rune$/, '')}`,
        tab: rune.channel.tab,
        cost: rune.channel.cost,
        resourceKey: channelRuneKey(rune),
        hidden: ({ characterData, level }) => !isRuneActive(rune.name, { characterData, level }),
        // A rune whose Channel Rune RUNS for a while (Frost) names an active effect, so its card
        // gets the start/End toggle instead of a bare counter — Use spends the charge and
        // switches the effect on in one patch. The one-shot runes carry no key and are unchanged.
        ...(rune.channel.activeEffect ? { activeEffect: rune.channel.activeEffect } : {}),
        // The Fire Rune rides on a weapon attack, so it attaches to the attack cards instead of
        // standing alone (see ATTACHED_FEATURES). The others are actions in their own right.
        ...(rune.key === 'fire' ? { attachedAs: 'Fire Rune' } : {}),
        description: rune.channel.description,
      })),
    },
    'Echo Knight': {
      // The echo's AC comes from companionData so this card and the statblock on the Features
      // tab can't drift; everything else about the echo lives there rather than being retyped
      // into a paragraph on a combat card.
      'Manifest Echo': {
        tab: 'bonus', cost: 'bonus action',
        compute: ({ level }) => ({
          detail: `Manifest an echo of yourself in an unoccupied space within 15 feet — 1 HP,`
            + ` AC ${echoArmorClass(level)}, destroyed by any damage. Your attacks can originate`
            + ` from its space, and 15 feet of your movement swaps you with it.`
            + (level >= 18 ? ' Legion of One: the same bonus action creates two.' : ''),
        }),
        description: 'Manifest an echo of yourself in an unoccupied space within 15 feet.',
      },
      // Costs no action of its own — it rides on the Attack action you were taking anyway —
      // but it does spend a use, so the card carries the tracker (the Arcane Shot shape).
      // Rides on the Attack action, so it attaches to the MELEE attack cards rather than
      // standing alone (the Arcane Shot shape). In the No Action tab it was unfindable: you
      // reach for it in the middle of attacking, which is the card you're already reading.
      // Falls back to its own entry only when no melee attack exists to hang it on.
      'Unleash Incarnation': {
        attachedAs: 'Unleash Incarnation',
        tab: 'no_action', cost: 'no action', resourceKey: 'unleash_incarnation_used',
        description: "When you take the Attack action, make one additional melee attack from your echo's"
          + ' position. Recharges on a long rest.',
      },
      'Echo Avatar': {
        tab: 'action', cost: 'action',
        description: "See through your echo's eyes and hear through its ears for up to 10 minutes,"
          + ' while your own body is blinded and deafened. The echo can be up to 1,000 feet away.'
          + ' Ending it early requires no action.',
      },
      'Shadow Martyr': {
        tab: 'reaction', cost: 'reaction', resourceKey: 'shadow_martyr_used',
        description: 'Before an attack roll is made against another creature you can see, teleport'
          + ' your echo to within 5 feet of it and make the attack target the echo instead —'
          + ' which can make it miss. Recharges on a short or long rest.',
      },
      // Triggered, not chosen: it fires when the echo dies. It still spends a use, so it needs
      // the tracker, and no_action is where a triggered freebie belongs.
      'Reclaim Potential': {
        tab: 'no_action', cost: 'no action', resourceKey: 'reclaim_potential_used',
        compute: ({ scores }) => ({
          detail: 'When an echo of yours is destroyed by taking damage, gain'
            + ` 2d6 ${formatSigned(abilityMod(scores?.constitution ?? 10))} temporary hit points —`
            + ' provided you have no temporary hit points already. Recharges on a long rest.',
        }),
        description: 'When an echo of yours is destroyed by taking damage, gain 2d6 + your'
          + ' Constitution modifier temporary hit points, provided you have none already.',
      },
    },
    Cavalier: {
      // Unwavering Mark is TWO things at two different costs, so it is surfaced as two things.
      // Marking is free, unlimited, and happens on a melee weapon hit — so it rides on the
      // melee attack cards as a rider (attached below), the Arcane Shot "read it off the card
      // you're already looking at" shape. Only the FOLLOW-UP attack is limited, and it is a
      // bonus action, so it gets its own card here — named for the trigger a player is
      // actually looking for mid-combat ("my marked target just hit someone else") rather
      // than for the feature. The card's attack rows are computed below.
      'Unwavering Mark': {
        tab: 'bonus', cost: 'bonus action', resourceKey: 'unwavering_mark_used',
        displayName: 'Marked Target',
        description: 'When a creature you marked deals damage to anyone other than you, make a special melee weapon attack against it with advantage. Recharges on a long rest.',
      },
      'Warding Maneuver': { tab: 'reaction', cost: 'reaction', resourceKey: 'warding_maneuver_used', description: "When you or a creature within 5 feet is hit by an attack, add 1d8 to the target's AC against it — potentially a miss. If it still hits, the target has resistance to that attack's damage. You must be wielding a melee weapon or a shield. Recharges on a long rest." },
      // A SECOND reaction economy, not a better opportunity attack: usable once on every other
      // creature's turn, and it doesn't spend your normal reaction. `extraReaction` puts it in
      // its own section of the Reactions tab so it can't be read as the one reaction everyone
      // gets — which is what happened while it was only a rider on the Opportunity Attack.
      'Vigilant Defender': {
        tab: 'reaction', cost: 'special reaction', extraReaction: true,
        description: "Once on every creature's turn except your own, you can make an opportunity"
          + ' attack. This special reaction can be used for nothing else, and it does not consume'
          + ' your normal reaction — so you can still take one of the reactions above on the same turn.',
      },
      // Ferocious Charger costs nothing extra — it rides on an attack you were making anyway,
      // so it lands in no_action with its own computed save DC (the Arcane Shot DC pattern).
      'Ferocious Charger': {
        tab: 'no_action', cost: 'no action',
        description: 'If you move at least 10 feet in a straight line right before you hit a creature, it must make a Strength saving throw or be knocked prone. Once per turn.',
        // The DC is a computed NUMBER with its own breakdown, not arithmetic spelled out inside
        // the sentence — same treatment as the Arcane Shot save DC. Inlining "DC 15 = 8 + PB +5
        // + STR +2" made the rules text unreadable for the sake of math nobody needs until they
        // question the number; now the sentence stays clean and the DC expands on click.
        compute: ({ level, scores }) => ({
          saveDc: {
            label: 'Strength save DC',
            breakdown: buildBreakdown({
              parts: [
                { key: 'base', label: 'Base', value: 8, signed: false },
                { key: 'proficiency', label: 'Proficiency bonus', value: profBonus(level) },
                { key: 'ability', label: 'STR modifier', value: abilityMod(scores?.strength ?? 10) },
              ],
            }),
          },
        }),
      },
    },
    'Psi Warrior': PSI_WARRIOR_ACTIONS,
  },
};

export const SUBCLASS_FEATURE_ACTIONS_2024 = {
  Fighter: {
    'Eldritch Knight': {
      'Weapon Bond': { tab: 'bonus', cost: 'bonus action', description: "Summon a bonded weapon to your hand (bonus action). You can't be disarmed of a bonded weapon while it's on the same plane. Bonding takes a 1-hour ritual; you can bond up to two weapons." },
    },
    // The 2024 Psi Warrior renames nothing and moves no level — the mechanical clauses are the
    // same in both editions — so the entries are authored once and registered in both maps
    // rather than copied. Copying is how the Champion's edition-specific Remarkable Athlete
    // would go wrong; here there is genuinely nothing to diverge.
    'Psi Warrior': PSI_WARRIOR_ACTIONS,
  },
};

/**
 * Riders that hang off WEAPON ATTACK cards — always-on things that change what happens when
 * you attack, but cost nothing of their own and so are not entries in any bucket.
 *
 * Attaching them to the attack card (rather than listing them separately) is the same "read it
 * off the card you're already looking at" principle as Arcane Shot; the tab renders each one
 * collapsed to its name, since a rider is a paragraph you need only once its trigger fires.
 *
 * Kept as a TABLE because this is the shape that repeats: the third hand-written attach block
 * would have been the point where these started drifting apart. (Riders that hang off ONE
 * NAMED entry are a different shape and live in ENTRY_RIDERS below; they attach by key, not
 * by weapon scope.)
 *
 * `scope` picks which attack cards get it: 'melee' (an unarmed strike counts), 'ranged', 'all'.
 * `applies(ctx)` is the gate — class/subclass/level, a feat, whatever the feature keys on.
 * `text` is authored here rather than read from a table because FEAT rules text lives only in
 * the backend compendium; this module is pure and does no fetching.
 */
// ── Giant's Might: the extra damage die ──────────────────────────────────────
// A once-per-turn conditional extra — the same shape as Sneak Attack and Divine Smite, which is
// why it is a RIDER and not folded into the flat damage string. Unlike those, the app now knows
// whether it applies (the active-effect toggle), so the text states the die plainly while the
// effect runs and names the condition while it doesn't.
const giantsMightRider = {
  source: "Giant's Might",
  // RAW is "a weapon or an unarmed strike", so every attack card qualifies — including the bare
  // hands of a Rune Knight who dropped their sword.
  scope: 'all',
  // Gated on the effect actually RUNNING, not merely being earned. A rider is rules text you
  // read mid-swing; carrying a paragraph on every attack card for a feature that is switched
  // off is clutter on the surface a player scans fastest. Switch it on and the block appears
  // with its die — which is also the moment the damage below becomes real.
  applies: ({ charClass, subclass, level, characterData }) =>
    charClass === 'Fighter' && subclass === 'Rune Knight' && (level ?? 1) >= 3
    && isEffectActive(characterData, 'giants_might'),
  // The one damage rider the app can confirm: `active_effects` is tracked, and the rider only
  // exists while it is on, so the term is always real.
  damage: (row, { level }) => ({ dice: mightDie(level), type: weaponDamageType(row?.damage) }),
  text: ({ level }) => 'Once on each of your turns, one of your attacks with a weapon or an'
    + ` unarmed strike deals an extra ${mightDie(level)} damage on a hit.`,
};

export const ATTACK_RIDERS = [
  {
    source: 'Unwavering Mark',
    scope: 'melee',
    applies: ({ charClass, subclass, level }) =>
      charClass === 'Fighter' && subclass === 'Cavalier' && (level ?? 1) >= 3,
    text: 'On a hit you can mark the creature until the end of your next turn. While it is'
      + " within 5 ft of you, it has disadvantage on any attack roll that doesn't target"
      + ' you. Marking costs nothing and there is no limit on how many creatures you mark.',
  },
  {
    source: 'Mounted Combatant',
    scope: 'melee',
    applies: ({ feats }) => hasFeat(feats, 'Mounted Combatant'),
    // The whole feat, not just the attack clause — a player opening it mid-combat wants the
    // one they're about to use, and the other two clauses have no home in the app yet (there
    // is no mount model, so nothing here can be computed; see the mounts/vehicles worklist).
    text: 'While mounted you have advantage on melee attack rolls against any unmounted creature'
      + ' that is smaller than your mount. You can also force an attack that targets your mount'
      + ' to target you instead, and when your mount makes a Dexterity saving throw for half'
      + ' damage it instead takes no damage on a success and half on a failure.',
  },
  {
    source: 'Sharpshooter',
    // `scope: 'ranged'` is every non-melee weapon card. A THROWN handaxe is a melee weapon
    // making a ranged attack, so it keeps its melee card and does not get this — deliberate,
    // and the same line isPureRangedWeapon already draws for the -5/+10 toggle. RAW clause 2
    // ("your ranged attacks") arguably reaches a thrown attack, but that card is primarily the
    // melee one and a cover clause on it would read as applying to the melee swing.
    scope: 'ranged',
    applies: ({ feats }) => hasFeat(feats, 'Sharpshooter'),
    // COVER ONLY. Each of the feat's other clauses is shown as a number on this same card
    // rather than as prose here, which is the point of modelling range as data:
    //   - long range: the range badge says "no disadvantage past 150 ft (Sharpshooter)"
    //   - the -5/+10: the power attack toggle
    //   - within 5 ft: not Sharpshooter's clause at all (Crossbow Expert's), and the card's own
    //     spacing note already owns it
    // Cover has no number to attach to — the app has no distance-to-target model — so it stays
    // prose, and is the only part that does.
    text: 'Your ranged attacks ignore half cover and three-quarters cover.',
  },
  giantsMightRider,
];

/**
 * LIMITED-USE features that ride on a weapon attack — the `attachedFeatures` slot. Each renders
 * as a block INSIDE that attack's card with its own Use control, so a feature you reach for in
 * the middle of the Attack action is read off the card you are already looking at.
 *
 * Distinct from ATTACK_RIDERS above: a rider is always-on prose with no cost, while these SPEND
 * a resource and therefore need a tracker. (Arcane Shot is a third shape again — an options menu
 * plus a save DC — and keeps its own richer block; fold it in here if a second rich one appears.)
 *
 * Kept as a TABLE from the second entry, the same trigger that produced ATTACK_RIDERS and
 * ENTRY_RIDERS: Unleash Incarnation was a hand-written attach block, and Psionic Strike would
 * have been a near-identical copy of it.
 *
 * `feature` is the SUBCLASS_DATA feature name that carries it, so the entry is level-gated by
 * the same `subclassFeaturesKnownAtLevel` walk as every other subclass feature — a display name
 * that differs from the feature name (Psionic Power → Psionic Strike) lives in `name`.
 * `scope` picks which attack cards get it: 'melee' (an unarmed strike counts), 'ranged', 'all'.
 * `applies(ctx)` is the gate. `note(row, ctx)` builds the block's text from the attack it landed
 * on, so it can name the weapon. `resourceKey` links it to the tracker it spends.
 *
 * When NO attack matches the scope, the feature falls through to its standalone entry rather
 * than vanishing — a bow-only Echo Knight must still see Unleash Incarnation somewhere.
 */
export const ATTACHED_FEATURES = [
  {
    name: 'Unleash Incarnation',
    scope: 'melee',
    resourceKey: 'unleash_incarnation_used',
    // Attached rather than duplicated as sub-attack rows: the extra attack uses the same weapon
    // at the same numbers already printed on the card; only its ORIGIN (the echo's position)
    // differs.
    note: (row) => `Make one additional melee attack with ${row.name} from your echo's position`
      + ' as part of this Attack action. Recharges on a long rest.',
  },
  {
    // RAW keys on "a weapon attack", not a melee one, so a Psi Warrior's bow gets it too — hence
    // scope 'all'. The 30-foot limit is stated in the note instead, since range is the player's
    // call and not something the card can check.
    name: 'Psionic Strike',
    scope: 'all',
    resourceKey: 'psionic_energy_used',
    damage: (_row, { level, scores }) => ({
      dice: psionicDieAndInt(level, scores?.intelligence ?? 10), type: 'force',
    }),
    note: (row, { level, scores }) => 'Once per turn when you hit a creature within 30 feet with'
      + ` ${row.name}, spend a Psionic Energy die to deal an extra`
      + ` ${psionicDieAndInt(level, scores?.intelligence ?? 10)} force damage.`,
  },
  {
    // The Fire Rune's Channel Rune fires "when you hit a creature with a weapon attack" — RAW
    // keys on a weapon attack, not a melee one, so a bow and an unarmed strike both qualify
    // (scope 'all'). Attached rather than standing alone for the Arcane Shot reason: you reach
    // for it mid-Attack-action, and the card you are already reading is the one to put it on.
    // The save DC is Constitution-based, like every other Rune Knight DC.
    name: 'Fire Rune',
    scope: 'all',
    resourceKey: 'channel_rune_fire_used',
    // Deliberately NO `damage` spec, so the 2d6 fire never joins the card's "on a hit" total.
    // The fire damage is not a property of the weapon: it only happens on the swing where you
    // spend a Channel Rune use to summon the shackles, which is a decision made AFTER the hit
    // and one the app does not track. Adding it to the total claimed damage the character does
    // not always deal — the standing rule that keeps Sneak Attack and Divine Smite prose. The
    // whole effect is stated in the note instead, beside the Use control that invokes it.
    note: (row, { level, scores }) => `When you hit with ${row.name}, you can invoke this rune:`
      + ' the target takes an extra 2d6 fire damage and must succeed on a Strength saving throw'
      + ` (DC ${runeSaveDcParts(level, scores?.constitution ?? 10).dc}) or be restrained by fiery`
      + ' shackles for 1 minute, taking 2d6 fire damage at the start of each of its turns. It'
      + ' repeats the save at the end of each of its turns, ending the effect on a success.',
  },
  {
    // Fires on a Psionic Strike hit, so it belongs on the same cards rather than on a card of
    // its own — and it costs nothing extra, which is why it carries no resourceKey.
    name: 'Telekinetic Thrust',
    scope: 'all',
    note: (_row, { level, scores }) => 'When your Psionic Strike hits, you can force the target to'
      + ` make a Strength saving throw (DC ${psiSaveDc(level, scores?.intelligence ?? 10)}).`
      + ' On a failure it is knocked prone or pushed up to 10 feet away, your choice.',
  },
];

/** Does this weapon attack entry fall inside a rider's scope? */
function matchesRiderScope(entry, scope) {
  if (scope === 'melee') return !!entry.melee;
  if (scope === 'ranged') return !entry.melee;
  return true;
}

/**
 * Riders that hang off ONE NAMED entry, matched by key rather than by weapon scope — the
 * companion table to ATTACK_RIDERS, and consolidated at the same trigger: Arcane Charge and
 * Hold the Line were hand-written attach blocks, and Sentinel would have been a third copy of
 * the same find-the-entry-and-push shape.
 *
 * The line between a rider and an entry: a rider MODIFIES an action you already had; a feature
 * that ADDS one gets its own entry (Vigilant Defender, Sentinel Strike).
 *
 * `entryKey` is the target's key (`universal:Opportunity Attack`, `feature:Action Surge`). The
 * attach loop searches every bucket, so a rider needn't know which one its target lives in.
 * `applies(ctx)` is the gate — class/subclass/level, a feat, the equipped `inventory`, whatever
 * the feature keys on.
 * `text` is authored here for the same reason ATTACK_RIDERS' is: FEAT rules text lives only in
 * the backend compendium, and this module is pure and does no fetching.
 */
export const ENTRY_RIDERS = [
  {
    source: 'Arcane Charge',
    entryKey: 'feature:Action Surge',
    applies: ({ charClass, subclass, level }) =>
      charClass === 'Fighter' && subclass === 'Eldritch Knight' && (level ?? 1) >= 15,
    text: 'When you use Action Surge, you can teleport up to 30 ft to an unoccupied space you can see, before or after the extra action.',
  },
  {
    source: 'Hold the Line',
    entryKey: 'universal:Opportunity Attack',
    applies: ({ charClass, subclass, level }) =>
      charClass === 'Fighter' && subclass === 'Cavalier' && (level ?? 1) >= 10,
    text: 'Creatures also provoke your opportunity attacks when they move 5 ft or more while'
      + ' within your reach, and a creature you hit with one has its speed reduced to 0 for the'
      + ' rest of the turn.',
  },
  // Sentinel is three clauses with two homes. Two of them CHANGE what an opportunity attack
  // does, so they ride here — before this they reached the sheet only as a display-only feat
  // note, and the Reactions tab showed the unmodified stock rule text. The third clause (a
  // reaction attack when a creature within 5 ft attacks someone else) is a different trigger
  // that is not an opportunity attack at all, so it stays its own entry: the feat's
  // "Sentinel Strike" action effect. Authored once for both editions — the 2024 rewrite
  // keeps all three clauses.
  // Polearm Master's reach clause is EQUIPMENT-GATED, so it is the reason `applies` gets the
  // inventory: the rider is true only while you actually hold a qualifying polearm, and shown
  // to a character swinging a longsword it would be a lie. Hiding it when none is equipped
  // matches how the feat's other half (the bonus attack) is already gated. The text stays
  // edition-neutral and names no weapons — the gate is what knows the list, and the card only
  // exists when you're holding one, so reprinting it here would be noise.
  {
    source: 'Polearm Master',
    entryKey: 'universal:Opportunity Attack',
    applies: ({ feats, inventory, edition }) =>
      hasFeat(feats, 'Polearm Master') && hasEquipped(inventory, isPolearmReachWeapon(edition)),
    text: "While you're wielding your polearm, creatures also provoke your opportunity attacks"
      + ' when they enter your reach, not only when they leave it.',
  },
  {
    source: 'Sentinel',
    entryKey: 'universal:Opportunity Attack',
    applies: ({ feats }) => hasFeat(feats, 'Sentinel'),
    text: 'A creature you hit with an opportunity attack has its speed reduced to 0 for the rest'
      + ' of the turn, and creatures provoke your opportunity attacks even when they take the'
      + ' Disengage action before leaving your reach.',
  },
];

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

/**
 * Every spell the character could cast in a turn, from ALL FOUR sources the Spells tab shows —
 * class, racial, subclass and feats — as `[{name, source, resourceKey}]`.
 *
 * `characterSpellNames` below reads only the class lists, which is why a Tiefling's Hellish
 * Rebuke (a reaction!) and a Psi Warrior's telekinesis never reached this tab: the Reactions tab
 * showed nothing while the character plainly had a reaction spell. Anything the Spells tab lists
 * as castable belongs in the action economy under the action it costs.
 *
 * `resourceKey` is carried where a source meters the spell (a racial spell is once per rest), so
 * the entry gets the same Use control every other limited-use card has, writing the SAME
 * character_data key the Spells-tab row writes — the WeaponAmmoControl arrangement, where one
 * control appearing on two surfaces is safe precisely because both spend through one key.
 *
 * Ritual-book spells (Ritual Caster) are deliberately EXCLUDED: they can be cast only as
 * rituals, which takes 10 minutes and is never a combat action.
 */
/**
 * castableSpells' source → the Spells tab's source-toggle key. The two vocabularies differ by one
 * word ('Feat' vs. the tab's plural 'feats'), so the mapping is written down once here instead of
 * being lowercased at each call site and quietly missing that case.
 */
export const SPELL_TAB_SOURCE = {
  Class: 'class',
  Racial: 'racial',
  Subclass: 'subclass',
  Feat: 'feats',
};

export function castableSpells({
  characterData = {}, charClass, subclass, level = 1, edition = '5e', race, subrace,
} = {}) {
  const seen = new Set();
  const out = [];
  const add = (name, source, resourceKey = null) => {
    const key = (name || '').toLowerCase();
    // First source wins: a spell known from the class list AND granted by a feat is one card,
    // and it keeps the class attribution rather than looking like a feat freebie.
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ name, source, resourceKey });
  };

  for (const name of characterSpellNames(characterData)) add(name, 'Class');

  for (const name of computeRaceGrantedCantrips({ race, character_data: characterData })) {
    add(name, 'Racial');
  }
  for (const r of getRacialSpellResources(characterData.race_traits ?? [], level)) {
    add(r.name, 'Racial', r.resourceKey ?? null);
  }

  for (const name of characterData.subclass_cantrips ?? []) add(name, 'Subclass');
  const granted = getSubclassGrantedSpells({ charClass, subclass, level, edition });
  for (const g of [...granted.cantrips, ...granted.leveled]) add(g.spell, 'Subclass');

  const feat = getFeatGrantedSpells(characterData.feats);
  // A feat-granted leveled spell is often a 1/long-rest FREE cast, metered by its own key — so
  // the card gets a Use control writing exactly what the Spells-tab tracker writes.
  const freeCastKey = new Map(feat.freeCasts.map((f) => [(f.name || '').toLowerCase(), f.usedKey]));
  for (const c of feat.cantrips) add(c.name, 'Feat');
  for (const l of feat.leveled) add(l.name, 'Feat', freeCastKey.get((l.name || '').toLowerCase()) ?? null);

  return out;
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

/**
 * A weapon whose reach triggers Polearm Master's OPPORTUNITY-ATTACK clause — deliberately not
 * the same predicate as `isPolearm` above, because RAW the feat's two halves take different
 * weapon lists. 5e: the bonus attack takes glaive, halberd, quarterstaff or SPEAR, while the
 * reach clause takes glaive, halberd, PIKE or quarterstaff — spear out, pike in. (The
 * compendium's own feat text flattens both to one list; the gate follows the rulebook.) 2024
 * restates the clause as quarterstaff, spear, or any weapon with Heavy AND Reach, so it reads off
 * properties rather than names and picks up a homebrew polearm for free.
 */
const isPolearmReachWeapon = (edition) => (e) => {
  if (e.category !== 'weapons') return false;
  const name = (e.name || '').toLowerCase();
  if (edition === '5.5e' || edition === '2024') {
    const props = (e.properties || '').toLowerCase();
    return /\b(quarterstaff|spear)\b/.test(name)
      || (props.includes('heavy') && props.includes('reach'));
  }
  return /\b(glaive|halberd|pike|quarterstaff)\b/.test(name);
};

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
 * Does a feat grant proficiency with improvised weapons (Tavern Brawler)?
 *
 * Improvised weapons are the one weapon "proficiency" you can act on while owning nothing: the
 * feat means you can pick up a chair and swing it, so the attack has to be offered from the FEAT
 * rather than from an inventory row. Everything else in the Actions tab comes from what you hold.
 */
function hasImprovisedProficiency(feats = []) {
  return getFeatProficiencyGrants(feats).weapons.some((w) => /improvised/i.test(w));
}

/**
 * The attack you make with whatever you picked up. RAW an improvised weapon deals 1d4 (unless it
 * resembles a real weapon, which is the DM's call and not something the sheet can know), so the
 * damage type is left off the card deliberately — it depends on the object in your hands.
 */
function improvisedAttack(scores = {}, level = 1, { freeHand = true } = {}) {
  const str = abilityMod(scores.strength);
  return {
    name: 'Improvised Weapon',
    // A hand requirement is ANNOTATED, never used to hide the card. Unlike "you own no hand
    // crossbow", a full hand is a state the player changes on this turn — dropping a shield is
    // free — so hiding the card answers "can I improvise?" with silence.
    warning: freeHand ? null
      : 'No free hand — drop or stow something first to swing an improvised weapon.',
    toHit: formatSigned(str + profBonus(level)),
    toHitBreakdown: [
      { label: 'STR', value: str },
      { label: 'Proficiency (Tavern Brawler)', value: profBonus(level) },
    ],
    damage: `1d4 ${formatSigned(str)}`,
    damageBreakdown: [
      { label: 'improvised weapon', value: '1d4' },
      { label: 'STR', value: str },
    ],
    proficient: true,
    // Flagged so it lands in the melee scope of every rider (Giant's Might, Unwavering Mark)
    // the way an unarmed strike does — it is a melee weapon attack.
    improvised: true,
  };
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
    // A base unarmed strike's "1" is a flat term, not a die — say so, since the whole point
    // of the breakdown is that a reader can check the arithmetic against the rules. The RAW
    // floor of 1 is shown as its own term when it actually bites (a negative STR modifier),
    // so the listed terms always add up to the number displayed.
    damageBreakdown: dice
      ? [{ label: 'feat damage die', value: dice }, { label: 'STR', value: str }]
      : [
        { label: 'unarmed base', value: 1 },
        { label: 'STR', value: str },
        ...(1 + str < 1 ? [{ label: 'minimum 1', value: 1 - (1 + str) }] : []),
      ],
    proficient: true,
  };
}

/**
 * Add a flat amount to a damage string's modifier: "1d12 + 4 slashing" +10 → "1d12 + 14 slashing".
 *
 * A base unarmed strike has no die at all — it is a flat "4 bludgeoning" — so the leading token
 * can't be assumed to be dice. When it's a bare number the amount is added INTO it ("7
 * bludgeoning"), which is the whole point of folding: one number you roll and read once.
 */
function addFlatDamage(damage, amount) {
  const trimmed = (damage || '').trim();
  const flatOnly = /^(\d+)(\s.*)?$/.exec(trimmed);
  if (flatOnly) {
    const [, num, rest] = flatOnly;
    return `${Number(num) + amount}${rest || ''}`;
  }
  const m = /^(\S+)(?:\s*([+-])\s*(\d+))?(.*)$/.exec(trimmed);
  if (!m) return damage;
  const [, die, sign, num, rest] = m;
  const flat = (sign === '-' ? -Number(num) : Number(num) || 0) + amount;
  const flatStr = flat === 0 ? '' : ` ${flat > 0 ? '+' : '-'} ${Math.abs(flat)}`;
  return `${die}${flatStr}${rest}`;
}

/**
 * The damage TYPE a weapon attack deals, read off the end of its damage string
 * ("1d8 + 3 Piercing" → "Piercing"). Used to name the type of a rider that adds damage of the
 * weapon's own type rather than its own (Giant's Might adds an untyped extra die, which RAW
 * means weapon damage).
 */
function weaponDamageType(damage) {
  const m = /([A-Za-z]+)\s*$/.exec((damage || '').trim());
  return m ? m[1] : null;
}

/**
 * Combine a weapon's printed damage with the extra damage from riders that are actually in
 * play, for the "on a hit" total shown INSIDE a rider's own block.
 *
 * Why it lives in the rider's block and not in the printed damage: the printed string must stay
 * true for an ordinary swing. Every addition here is still conditional — Psionic Strike spends
 * a die, Giant's Might is once per turn — and CLAUDE.md's standing rule is that a conditional
 * bonus baked into the flat string claims damage the character does not always deal (the reason
 * Sneak Attack and Divine Smite are still prose, and Great Weapon Master is a toggle).
 *
 * The line for what may be listed at all: only damage the app can CONFIRM applies on this swing.
 * The Fire Rune's 2d6 fire deliberately does not appear here — it lands only on the hit where
 * you choose to spend a Channel Rune use to summon the shackles, a decision made after the roll
 * and never recorded, so it stays in the feature's note rather than any total.
 *
 * Types are never merged: piercing and fire are rolled separately and resisted separately, so
 * each term keeps its own type. Terms of the same type are still listed separately, because
 * 1d8 and 1d6 cannot be summed into one die either.
 *
 * @param {string} baseDamage  the weapon's printed damage
 * @param {{dice: string, type?: string, source: string}[]} additions
 * @returns {{ text: string, parts: {text: string, source: string|null}[] } | null}
 */
export function combineAttackDamage(baseDamage, additions = []) {
  const live = (additions || []).filter((a) => a && a.dice);
  if (live.length === 0) return null;
  const parts = [
    { text: (baseDamage || '').trim(), source: null },
    ...live.map((a) => ({
      text: `${a.dice}${a.type ? ` ${a.type}` : ''}`,
      source: a.source,
    })),
  ];
  return { text: parts.map((p) => p.text).join(' + '), parts };
}

/**
 * An OPT-IN damage variant on a weapon attack, shown behind a toggle rather than folded into the
 * printed damage — the rule CLAUDE.md states for once-per-turn and situational extras (Sneak
 * Attack, Divine Smite, Rage): a conditional bonus baked into a flat string claims damage the
 * character does not always deal.
 *
 * Two editions, two different mechanics under one toggle:
 *
 *   2014 — −5 to hit for +10 damage. TWO feats grant it on disjoint weapon sets (Great Weapon
 *          Master on a Heavy melee weapon, Sharpshooter on a ranged one), so one builder serves
 *          both, parameterised by `source`.
 *   2024 — Great Weapon Master's **Heavy Weapon Master**: +your proficiency bonus to damage, no
 *          attack penalty, once per turn. Sharpshooter has NO damage bonus in 2024 (the version
 *          of this app's compendium that said otherwise was wrong — that clause is GWM's), so
 *          only GWM reaches this path in 2024.
 *
 * `pb` is required for the 2024 shape and ignored by the 2014 one.
 */
export function powerAttackVariant(attackRow = {}, source = 'Great Weapon Master', { edition = '5e', pb = 2 } = {}) {
  const is2024 = edition === '5.5e' || edition === '2024';
  if (is2024) {
    // No to-hit change: the 2024 feat trades the gamble for a smaller, reliable bonus.
    return {
      toHit: attackRow.toHit,
      toHitBreakdown: attackRow.toHitBreakdown || [],
      damage: addFlatDamage(attackRow.damage, pb),
      damageBreakdown: [...(attackRow.damageBreakdown || []), { label: source, value: pb }],
      oncePerTurn: true,
    };
  }
  const base = parseInt(attackRow.toHit, 10) || 0;
  return {
    toHit: formatSigned(base - 5),
    toHitBreakdown: [...(attackRow.toHitBreakdown || []), { label: source, value: -5 }],
    damage: addFlatDamage(attackRow.damage, 10),
    damageBreakdown: [...(attackRow.damageBreakdown || []), { label: source, value: 10 }],
    oncePerTurn: false,
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
  race,
  subrace,
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
  // Great Weapon Master offers a damage toggle in BOTH editions, but a different one: -5/+10 in
  // 2014, +proficiency-bonus-once-per-turn (Heavy Weapon Master) in 2024. powerAttackVariant
  // owns that split; this flag just says the character has the feat.
  const gwm = hasFeat(feats, 'Great Weapon Master');
  // Sharpshooter's -5/+10 is 2014 ONLY. The 2024 feat has no damage bonus at all — its three
  // benefits are cover, firing in melee, and +30 ft of normal range, none of which is a toggle.
  const sharpshooter = !is2024 && hasFeat(feats, 'Sharpshooter');
  // Who lifts the within-5-ft disadvantage on ranged attacks. Crossbow Expert in both editions;
  // 2024 Sharpshooter as well (Firing in Melee), which the 2014 Sharpshooter does NOT do.
  const meleeFiringSource = hasFeat(feats, 'Crossbow Expert') ? 'Crossbow Expert'
    : (is2024 && hasFeat(feats, 'Sharpshooter')) ? 'Sharpshooter'
    : null;
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
  // An improvised-weapon attack, offered by the FEAT rather than by an inventory row: Tavern
  // Brawler means you can pick up a chair, so requiring the character to own a seeded
  // "Improvised Weapon" item before the card appears asks them to inventory the furniture.
  // Suppressed when one IS equipped — that item's own row already says it, with its real stats.
  const equippedImprovisedWeapon = (inventory || []).find((e) => e.equipped && isImprovisedWeapon(e));
  const handFree = freeHandCount(inventory) > 0;
  if (hasImprovisedProficiency(feats) && !equippedImprovisedWeapon) {
    weaponRows.push(improvisedAttack(scores, level, { freeHand: handFree }));
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
        const v = powerAttackVariant(atk, powerSource, { edition, pb: profBonus(level) });
        powerAttack = {
          source: powerSource,
          toHit: v.toHit,
          toHitBreakdown: v.toHitBreakdown,
          damage: v.damage,
          damageBreakdown: v.damageBreakdown,
          damageFlags: `${flag}${disadv}`,
          detailRest: `to hit · ${v.damage}${flag}${disadv}`,
          // What the toggle COSTS, for its button label. The 2014 gamble and the 2024
          // once-per-turn bonus are different enough that one label would misstate one of them.
          offer: v.oncePerTurn
            ? `+${profBonus(level)} dmg, once per turn`
            : '−5 hit / +10 dmg',
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
      // The trailing "· not proficient / · disadvantage" flags, kept apart from the damage
      // string so the UI can make the damage itself a clickable chip.
      damageFlags: `${flag}${disadv}`,
      warning: atk.warning || null,
      loadingNote: atk.loadingNote || null,
      // `{source, note}` when a feature makes this weapon's attacks magical (overcoming
      // resistance/immunity to nonmagical damage) — resolved once in getAttacks, so this tab
      // and the Items tab always agree. Null for a mundane weapon.
      magical: atk.magical || null,
      // The weapon's distance band, resolved by getAttacks so this tab and the Items tab read
      // one answer. Null for a melee weapon with no throw range.
      range: atk.range || null,
      // Situational note: a ranged/thrown attack has disadvantage while an enemy is within
      // 5 ft. Crossbow Expert removes it. Rendered with a link to the Spacing page.
      // 2024 Sharpshooter's "Firing in Melee" grants the same lift Crossbow Expert does — a
      // clause the 2014 feat did not have, which is why the source is edition-dependent. Either
      // feat alone is enough, so the note names whichever the character actually has.
      spacingNote: (weapon && isRangedWeapon(weapon))
        ? (meleeFiringSource
            ? `No disadvantage firing while an enemy is within 5 ft (${meleeFiringSource}).`
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
      // Is this row a MELEE weapon attack? An unarmed strike counts (it has no inventory
      // entry, hence the null-weapon branch) — features keyed on "when you hit with a melee
      // weapon attack" apply to it. Consumed by the Cavalier's Unwavering Mark rider.
      melee: weapon ? isMelee(weapon) : true,
      // The raw damage string, kept structured so a feature can fold its own bonus into it
      // without re-parsing `detail`, plus the term-by-term breakdown behind it.
      damage: atk.damage || null,
      damageBreakdown: atk.damageBreakdown || null,
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
        damageBreakdown: mainRow?.damageBreakdown ?? null,
        warning: mainRow?.warning ?? null,
      },
      {
        label: 'Off hand',
        name: off.name,
        toHit: offRow?.toHit ?? null,
        // Strip the ability modifier from the off-hand damage unless the TWF style restores it.
        damage: twfStyle ? (offRow?.damage ?? baseDamage(off)) : baseDamage(off),
        // The off-hand's MISSING ability modifier is the thing players query most, so the
        // breakdown names it rather than silently omitting the term: without the fighting
        // style the ability part is dropped and replaced by a zero-valued explanation.
        damageBreakdown: twfStyle
          ? (offRow?.damageBreakdown ?? null)
          : (offRow?.damageBreakdown
            ? [
              ...offRow.damageBreakdown.filter((p) => typeof p.value !== 'number'),
              { label: 'no ability modifier off-hand (no Two-Weapon Fighting style)', value: 0 },
            ]
            : null),
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

  // Tavern Brawler (feat) — the bonus-action grapple as an Action + Bonus combo (the Crossbow
  // Expert shape). RAW the grapple follows a hit with EITHER an unarmed strike OR an improvised
  // weapon, so it is TWO cards, one per opener, rather than one card that picks a winner: the
  // two attacks have different to-hit and damage, and a single card could only show one of them
  // while the tab claims to list what you can do. Each is pushed only when its Action half is
  // actually makeable. The standalone bonus grapple is suppressed below in favour of these.
  const grappleAction = getFeatActions(feats).find(
    (a) => a.source === 'Tavern Brawler' && /grapple/i.test(a.name),
  );
  if (grappleAction) {
    const attackByUid = new Map(weaponRows.filter((a) => a.uid).map((a) => [a.uid, a]));
    const baseDamage = (w) => `${w.damage || '—'}${w.damage_type ? ` ${w.damage_type}` : ''}`;
    const grappleRow = { label: 'Bonus', name: 'Grapple', detail: grappleAction.description };
    // RAW a grapple is made "using at least one free hand", so with both hands full the BONUS
    // half is the part that cannot happen — which is why this is a warning on the card rather
    // than a reason to hide it. The card is how a player finds out what they'd have to drop;
    // hiding it (the behaviour this replaces) made the feat look unimplemented to a Fighter
    // holding a weapon and a shield, which is most of them.
    const grappleWarning = handFree ? null
      : 'A grapple needs at least one free hand — drop or stow something first.';
    const combo = (key, opener, actionRow) => push('action+bonus', {
      key,
      name: `Tavern Brawler: ${opener}`,
      source: 'Feat',
      cost: 'action + bonus action',
      subAttacks: [actionRow, grappleRow],
      warning: grappleWarning,
      detail: `Hit with ${actionRow.name} (Action), then use a bonus action to grapple the`
        + ' target (Tavern Brawler).',
    });

    // Improvised half: the equipped improvised weapon if you are holding one (its real numbers),
    // otherwise the generic feat attack.
    if (equippedImprovisedWeapon) {
      const row = attackByUid.get(equippedImprovisedWeapon.uid);
      combo('tavern-brawler-improvised', 'Improvised Weapon', {
        label: 'Action',
        name: equippedImprovisedWeapon.name,
        toHit: row?.toHit ?? null,
        damage: row?.damage ?? baseDamage(equippedImprovisedWeapon),
        warning: row?.warning ?? null,
      });
    } else if (hasImprovisedProficiency(feats)) {
      const imp = improvisedAttack(scores, level, { freeHand: handFree });
      combo('tavern-brawler-improvised', 'Improvised Weapon', {
        label: 'Action', name: imp.name, toHit: imp.toHit, damage: imp.damage,
      });
    }

    // Unarmed half: an unarmed strike is a punch, kick or head-butt, so it needs no free hand —
    // and the Actions tab already shows an Unarmed Strike card for a character holding a weapon
    // and a shield. Gating the combo on a free hand contradicted the card sitting beside it.
    const ua = unarmedAttack(scores, level, unarmedDice);
    combo('tavern-brawler-unarmed', 'Unarmed Strike', {
      label: 'Action', name: ua.name, toHit: ua.toHit, damage: ua.damage,
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
    const raw = subclassFeatures[fname];
    if (!raw) continue;
    // A feature name may map to one entry or to several (see the map header). The hand-shaped
    // cases below — Weapon Bond, Arcane Shot, Unwavering Mark — are all single entries, so they
    // read `def`; the general path at the bottom walks `defs`.
    const defs = Array.isArray(raw) ? raw : [raw];
    const def = defs[0];
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
    // Unwavering Mark (Cavalier L3+) splits across two surfaces. MARKING is free, unlimited
    // and happens on a melee weapon hit, so it rides on the melee attack cards (below). The
    // FOLLOW-UP attack is the limited half, so it keeps this bonus-action card — renamed to
    // the trigger the player is scanning for ("Marked Target") and given real attack rows,
    // because "extra damage equal to half your Fighter level" is arithmetic the sheet already
    // has everything to do.
    if (fname === 'Unwavering Mark') {
      const meleeRows = buckets.action.filter((e) => e.source === 'Weapon' && e.melee);
      // No melee attack to make means no follow-up to offer — a Cavalier holding only a bow
      // can't trigger this at all, so the card is omitted rather than shown empty with an
      // instruction. (An unarmed strike counts as a melee attack, so a bare-handed Cavalier
      // still gets the card.)
      if (meleeRows.length === 0) continue;
      const bonusDamage = Math.floor(level / 2);
      push(def.tab, {
        key: `subclass:${fname}`,
        name: def.displayName || fname,
        source: 'Subclass',
        cost: def.cost,
        detail: `${def.description} Half your Fighter level (${formatSigned(bonusDamage)}) is already`
          + ' included in the damage below.',
        // One row per melee attack you could answer with. The half-level bonus is FOLDED into
        // the damage string rather than shown as a separate term: this is a single attack you
        // roll once, and a trailing "+3" reads as a second damage source to add.
        subAttacks: meleeRows.map((row) => ({
          label: 'Attack',
          name: row.name,
          toHit: row.toHit,
          damage: addFlatDamage(row.damage, bonusDamage),
          // The folded half-level shows as its own term, so "why is this bigger than my
          // normal attack?" is answerable by clicking the number rather than by arithmetic.
          damageBreakdown: [
            ...(row.damageBreakdown || []),
            { label: 'half Fighter level (Unwavering Mark)', value: bonusDamage },
          ],
          note: 'with advantage',
        })),
        resourceKey: def.resourceKey,
      });
      continue;
    }
    // A feature may bundle several powers at different costs (Psi Warrior's Psionic Power), so
    // the general path walks a list. Single-entry features are the one-element case.
    for (const d of defs) {
      const dname = d.name || d.displayName || fname;
      // An entry may hide itself when it would be a no-op for THIS character (the Psi Warrior's
      // die regain with a full pool, a Channel Rune whose rune isn't carved on anything you are
      // wearing). Level gating is already handled upstream; this is for state the level can't
      // express. Checked BEFORE the attachedAs branch below, or an attack-riding feature could
      // never hide itself — it would attach to every weapon card regardless.
      if (d.hidden && d.hidden({ characterData, level, scores })) continue;
      // A power that RIDES on a weapon attack belongs on the attack cards themselves — you reach
      // for it mid-attack, and a separate tab entry makes you go looking. See ATTACHED_FEATURES.
      // When no attack matches its scope (a bow-only Echo Knight), it falls through to the
      // standalone entry below so the feature never vanishes — the fallback Arcane Shot and
      // Weapon Bond use.
      if (d.attachedAs) {
        const a = ATTACHED_FEATURES.find((x) => x.name === d.attachedAs);
        const rows = a
          ? buckets.action.filter((e) => e.source === 'Weapon' && matchesRiderScope(e, a.scope))
          : [];
        if (rows.length > 0) {
          for (const row of rows) {
            row.attachedFeatures = [...(row.attachedFeatures || []), {
              key: a.name,
              name: a.name,
              note: a.note(row, { level, scores, characterData }),
              resourceKey: a.resourceKey ?? null,
              // Resolved here, totalled after the riders land (see the pass below).
              damageSpec: a.damage ? a.damage(row, { level, scores, characterData }) : null,
            }];
          }
          continue;
        }
      }
      // A `compute` entry derives its own detail/meta from the character, the same way a
      // RACIAL_ACTIONS entry does — Ferocious Charger's save DC scales with level and Strength,
      // so a fixed string would show the wrong number to everyone but one character.
      const computed = d.compute ? d.compute({ characterData, level, scores }) : null;
      // "One weapon attack" — RAW keys on a weapon attack, not a melee one, so EVERY weapon row
      // qualifies (a bow, an unarmed strike), which is the one way this differs from Unwavering
      // Mark's melee-only follow-up. There is no damage bonus, so the rows mirror your normal
      // attacks exactly rather than folding anything in. The card is kept even with no rows: any
      // weapon can trigger it, so an empty-handed character is between weapons, not excluded.
      const telekineticRows = d.telekineticAttack
        ? buckets.action.filter((e) => e.source === 'Weapon')
        : null;
      // The Action half names the spell that enables the bonus attack, so the combo reads as one
      // turn. It is not an attack, so it carries `detail` instead of to-hit/damage — the shape
      // Tavern Brawler's Grapple half uses.
      const telekineticCombo = telekineticRows
        ? [{
          label: 'Action',
          name: 'Telekinesis',
          detail: 'Cast telekinesis, or exert your will on one creature or object you can see'
            + ' within range — telekinesis takes your action each round it is used.',
        }]
        : null;
      push(d.tab, {
        key: `subclass:${dname}`,
        name: dname,
        source: 'Subclass',
        cost: d.cost,
        detail: telekineticCombo
          ? `${d.description} Telekinesis takes your action each round, so the two happen on the`
            + ' same turn.'
          : (computed?.detail ?? d.description),
        // A computed save DC the feature imposes — `{label, breakdown}`, rendered as a clickable
        // number rather than arithmetic inside `detail`.
        saveDc: computed?.saveDc ?? null,
        subAttacks: telekineticCombo ?? computed?.subAttacks ?? null,
        // The bonus half is an ORDINARY weapon attack, so it ships the whole weapon entry rather
        // than a summary row: the player still needs the range band, Psionic Strike, the
        // Sharpshooter toggle, spacing and ammunition to actually take it, and a thin
        // {name, toHit, damage} row can show none of that. These are REFERENCES to the entries
        // already in the Actions bucket — deliberately not copies, so anything attached to a
        // weapon later in the pipeline (Psionic Strike/Telekinetic Thrust from an earlier
        // subclass feature, the ATTACK_RIDERS applied at the very end) is picked up here for
        // free instead of being frozen at whatever the entry looked like mid-build.
        bonusEntries: telekineticRows && telekineticRows.length > 0 ? telekineticRows : null,
        // True for a reaction that does NOT spend your one normal reaction (Vigilant Defender).
        // The tab gives these their own section so they read as an additional economy.
        extraReaction: !!d.extraReaction,
        resourceKey: d.resourceKey,
        // The ACTIVE EFFECT this entry switches on (Giant's Might). The card renders a toggle
        // instead of the plain Use control, because spending the charge and switching the effect
        // on are one event — a counter that went down without the effect coming on is a trap.
        activeEffect: d.activeEffect ?? null,
        // A second resource this entry's Use control touches: one it falls back to SPENDING once
        // its own charge is gone, or one it hands a use back TO. See RestResourceControl.
        fallbackResourceKey: d.fallbackResourceKey ?? null,
        restoresResourceKey: d.restoresResourceKey ?? null,
      });
    }
  }

  // Riders that hang off WEAPON ATTACK cards (see ATTACK_RIDERS). Runs after the weapon push,
  // which is what creates the entries they attach to.
  for (const rider of ATTACK_RIDERS) {
    const riderCtx = { charClass, subclass, level, edition, feats, characterData };
    if (!rider.applies(riderCtx)) continue;
    // `text` may be a FUNCTION of the same context, not just a string: Giant's Might's die
    // scales with level (1d6 → 1d8 → 1d10), which a static string could not state.
    const text = typeof rider.text === 'function' ? rider.text(riderCtx) : rider.text;
    for (const row of buckets.action.filter((e) => e.source === 'Weapon' && matchesRiderScope(e, rider.scope))) {
      row.riders = [...(row.riders || []), { source: rider.source, text }];
      // A rider that ADDS damage and is confirmed live contributes a term to the "on a hit"
      // total shown inside each attached feature's block. Stored on the row rather than applied
      // here, because the totals are assembled below once every rider has been collected.
      const dmg = rider.damage ? rider.damage(row, riderCtx) : null;
      if (dmg?.dice) {
        row.riderDamages = [...(row.riderDamages || []), { ...dmg, source: rider.source }];
      }
    }
  }

  // Every confirmable source of EXTRA damage on this attack, collected onto the row so the card
  // can show one "on a hit" total under the printed damage. Runs LAST, after ATTACK_RIDERS, so
  // it can include a rider (Giant's Might) applied after the features are attached.
  //
  // The additions are handed over as a LIST rather than a finished string because the displayed
  // damage is not fixed: the Great Weapon Master / Sharpshooter toggle rewrites it, and a total
  // baked in here would go stale the moment that is switched on. The card combines them with
  // whatever damage it is currently showing (see combineAttackDamage).
  for (const row of buckets.action.filter((e) => e.source === 'Weapon')) {
    const additions = [
      ...(row.riderDamages || []),
      ...(row.attachedFeatures || [])
        .filter((f) => f.damageSpec)
        .map((f) => ({ ...f.damageSpec, source: f.name })),
    ];
    if (additions.length > 0) row.damageAdditions = additions;
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

  // Spells — ONE CARD PER SPELL, filed under the action it actually costs. This used to collapse
  // to a single "Cast a Spell" pointer per bucket because listing them all cluttered the tab;
  // collapsible source groups removed that constraint, and the pointer was answering "can I cast
  // something?" when the question mid-combat is "which of my spells is a bonus action?".
  // Drawn from every source the Spells tab shows, so a reaction spell known only from a race or
  // a subclass stops being invisible here.
  const spellRows = castableSpells({ characterData, charClass, subclass, level, edition, race, subrace })
    .map((sp) => ({ ...sp, spell: spellIndex[(sp.name || '').toLowerCase()] }))
    // Unknown to the compendium → can't classify. A longer-than-a-turn casting time (1 minute,
    // ritual) is not a combat action and is left off rather than filed under a wrong bucket.
    .filter((sp) => sp.spell && classifyCastingTime(sp.spell.casting_time))
    // Cantrips first, then by level, then alphabetically — the order a caster scans in.
    .sort((a, b) => (a.spell.level ?? 0) - (b.spell.level ?? 0) || a.name.localeCompare(b.name));

  for (const sp of spellRows) {
    const cls = classifyCastingTime(sp.spell.casting_time);
    const lvl = sp.spell.level ?? 0;
    const bits = [
      lvl === 0 ? 'Cantrip' : `Level ${lvl}`,
      sp.spell.school,
      // Concentration is the one flag that changes what you can do on LATER turns, so it belongs
      // on the card rather than only in the spell's detail dialog.
      sp.spell.concentration ? 'Concentration' : null,
      sp.spell.ritual ? 'Ritual' : null,
      // Where the spell comes from, but only when it is NOT the class list — a Wizard's spells
      // being "from the class" is noise; a spell you have because of your race is not.
      sp.source === 'Class' ? null : `From ${sp.source.toLowerCase()}`,
    ].filter(Boolean);
    push(cls.tab, {
      key: `spell:${sp.name}`,
      name: sp.name,
      source: 'Spell',
      cost: cls.cost,
      detail: bits.join(' · '),
      // Set only where the SOURCE meters the spell (racial once-per-rest, a feat's free cast).
      // A class spell is paid for with slots, which this tab deliberately does not track.
      resourceKey: sp.resourceKey ?? undefined,
      // Where this spell lives in the Spells tab, so a card can link to it. Resolved HERE, where
      // the source is already known, rather than re-derived by the tab from the card's prose.
      // `source` is the Spells-tab source key, not the label on the card.
      spellRef: { name: sp.name, level: lvl, source: SPELL_TAB_SOURCE[sp.source] ?? 'class' },
    });
  }

  // Universal menu (everyone) — rendered as a secondary group in the UI.
  (is2024 ? UNIVERSAL_ACTIONS_2024 : UNIVERSAL_ACTIONS_5E).forEach((a) => {
    push('action', { key: `universal:${a.name}`, name: a.name, source: 'Universal', cost: 'action', detail: a.description });
  });
  (is2024 ? UNIVERSAL_REACTIONS_2024 : UNIVERSAL_REACTIONS_5E).forEach((r) => {
    push('reaction', { key: `universal:${r.name}`, name: r.name, source: 'Universal', cost: 'reaction', detail: r.description });
  });

  // Riders that hang off ONE NAMED entry (see ENTRY_RIDERS). Runs LAST, after every push
  // above — several attach to the universal menu, which is the last thing pushed, and running
  // here means a rider can target a universal entry as easily as a class feature.
  //
  // Contrast Vigilant Defender (Cavalier L18), deliberately NOT a rider: it grants a whole
  // SEPARATE reaction, once on every other creature's turn, that doesn't spend your normal one.
  // As a rider it was invisible — the Reactions tab showed a lone "Opportunity Attack" and
  // nothing said you had a second reaction economy. It gets its own entry, flagged
  // `extraReaction`. Same reason Sentinel Strike is an entry while Sentinel's other two
  // clauses are a rider.
  const allEntries = Object.values(buckets).flat();
  for (const rider of ENTRY_RIDERS) {
    if (!rider.applies({ charClass, subclass, level, edition, feats, characterData, inventory })) continue;
    const target = allEntries.find((e) => e.key === rider.entryKey);
    if (!target) continue;
    target.riders = [...(target.riders || []), { source: rider.source, text: rider.text }];
  }

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
