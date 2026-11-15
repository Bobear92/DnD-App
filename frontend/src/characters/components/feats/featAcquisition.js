/**
 * Acquiring a feat — the one model for everything a feat asks of the player when it is taken.
 *
 * A feat can demand up to four follow-up choices: an ability score to raise (half-feats), a
 * count of proficiencies to pick (Skilled, Linguist, Weapon Master, Skill Expert), a spell grant
 * to fill (Magic Initiate, Fey Touched, Ritual Caster) and maneuvers to learn (Martial Adept).
 * Three surfaces take feats — the Variant Human step at creation, the level-up wizard's feat step
 * and the GM's Add Feat on the sheet — and each used to re-derive "what does this feat need, is it
 * complete, what does it write" by hand. The GM path had simply skipped all of it: a feat added
 * there was stored as `{id, name, effects}` with no choices, so Magic Initiate granted no spells
 * and Skilled no skills.
 *
 * `resolveFeatAcquisition` answers those questions once. `FeatChoiceFields` renders the pickers
 * from its result; each surface keeps only its own state and its own persistence.
 */
import {
  featAbilityChoices, featAbilityChoiceOptions, featFixedAbilityScores,
  getSpellGrantSpecs, getManeuverGrantSpec, maneuverGrantComplete,
} from '@/characters/components/feats/featEffects';
import {
  getFeatProficiencyChoices, availableFeatOptions, applyFeatProficiencyChoice, FEAT_SKILL_OPTIONS,
} from '@/characters/components/feats/featProficiencyData';
import { spellGrantComplete, resolveSpellGrantValue } from '@/characters/components/feats/FeatSpellGrantPicker';

const SKILL_NAMES = new Set(FEAT_SKILL_OPTIONS.map((s) => s.toLowerCase()));
const unique = (list) => [...new Set(list)];

/** The follow-up choices a surface holds while a feat is being taken. */
export const EMPTY_FEAT_CHOICES = Object.freeze({ ability: '', prof: {}, spell: null, maneuvers: [] });

const normalize = (choices) => ({
  ability: choices?.ability || '',
  prof: choices?.prof || {},
  spell: choices?.spell ?? null,
  maneuvers: choices?.maneuvers || [],
});

/**
 * Everything about taking `feat` with the given `choices`.
 *
 * @param {object}   args
 * @param {object}   args.feat              the CATALOGUE feat (it must carry `effects`)
 * @param {object}   [args.choices]         {ability, prof: {[prof_type]: string[]}, spell, maneuvers}
 * @param {string}   [args.charClass]
 * @param {object}   [args.characterData]   what the character already has — a feat cannot re-grant
 *                                          a skill, tool or language held from elsewhere
 * @param {string[]} [args.proficientSkills] skills already proficient (the Expertise pool); the
 *                                          skills this same feat grants are added automatically
 * @param {string[]} [args.saveProficiencies] saves already held (Resilient will not re-offer them)
 */
export function resolveFeatAcquisition({
  feat, choices, charClass = null, characterData = {}, proficientSkills = [], saveProficiencies = [],
} = {}) {
  const c = normalize(choices);
  const needsNothing = {
    feat: null, choices: c,
    abilityChoice: null, abilityOptions: [], profGrants: [], skillPicks: [], spellSpec: null, maneuverSpec: null,
    needsChoices: false,
    complete: { ability: true, prof: true, spell: true, maneuvers: true, all: true },
    asi: {},
    profPatch: () => ({}),
    entry: () => null,
  };
  if (!feat) return needsNothing;

  // ── Half-feat ability score ──
  const abilityChoice = featAbilityChoices(feat)[0] || null; // the model supports one choice per feat
  const abilityOptions = abilityChoice
    ? featAbilityChoiceOptions(feat, abilityChoice, { saveProficiencies })
    : [];
  const asi = {};
  for (const { ability, amount } of featFixedAbilityScores(feat)) asi[ability] = (asi[ability] || 0) + amount;
  if (abilityChoice && c.ability) asi[c.ability] = (asi[c.ability] || 0) + abilityChoice.amount;

  // ── Count-choice proficiencies ──
  // A skill picked from this very feat counts as proficient for its own Expertise grant
  // (Skill Expert: gain a skill, then expertise one you are proficient in — including that one).
  const skillPicks = unique([
    ...(c.prof.skill || []),
    ...(c.prof.skill_or_tool || []).filter((s) => SKILL_NAMES.has(String(s).toLowerCase())),
  ]);
  const profGrants = getFeatProficiencyChoices(feat, { proficientSkills: unique([...proficientSkills, ...skillPicks]) })
    .map((grant) => {
      const options = availableFeatOptions(grant, { charClass, characterData });
      return {
        ...grant,
        options,
        chosen: c.prof[grant.prof_type] || [],
        // A grant with nothing pickable (Expertise before any skill exists) auto-completes
        // instead of blocking the flow.
        required: Math.min(grant.count, options.length),
      };
    });

  // ── Spells and maneuvers ──
  const spellSpec = getSpellGrantSpecs(feat)[0] || null;
  const maneuverSpec = getManeuverGrantSpec(feat);

  const complete = {
    ability: !abilityChoice || !!c.ability,
    prof: profGrants.every((g) => g.chosen.length >= g.required),
    spell: !spellSpec || spellGrantComplete(spellSpec, c.spell),
    maneuvers: maneuverGrantComplete(maneuverSpec, c.maneuvers),
  };
  complete.all = complete.ability && complete.prof && complete.spell && complete.maneuvers;

  /**
   * The character_data patch for the proficiency picks, merged over `base`. Pass the character's
   * current data to get the final field values, or nothing to get just what the feat adds.
   */
  const profPatch = (base = {}) => {
    let patch = {};
    for (const g of profGrants) {
      patch = { ...patch, ...applyFeatProficiencyChoice(g.prof_type, g.chosen, { ...(base || {}), ...patch }) };
    }
    return patch;
  };

  /** The `character_data.feats[]` entry: id, name, the effects snapshot and the recorded choices. */
  const entry = ({ level } = {}) => {
    const recorded = {
      ...(abilityChoice && c.ability ? { ability: c.ability } : {}),
      ...(skillPicks.length ? { skills: skillPicks } : {}),
      ...(spellSpec ? { spell_grant: resolveSpellGrantValue(spellSpec, c.spell) } : {}),
      ...(maneuverSpec ? { maneuvers: c.maneuvers } : {}),
    };
    return {
      id: feat.id,
      name: feat.name,
      ...(level != null ? { level } : {}),
      ...(feat.effects ? { effects: feat.effects } : {}),
      ...(Object.keys(recorded).length ? { choices: recorded } : {}),
    };
  };

  return {
    feat,
    choices: c,
    abilityChoice,
    abilityOptions,
    profGrants,
    skillPicks,
    spellSpec,
    maneuverSpec,
    // True when the feat puts at least one picker in front of the player.
    needsChoices: !!abilityChoice || profGrants.some((g) => g.options.length > 0) || !!spellSpec || !!maneuverSpec,
    complete,
    asi,
    profPatch,
    entry,
  };
}

/** `choices` with one proficiency option toggled, respecting the grant's count. */
export function toggleFeatProficiency(choices, profType, name, max) {
  const c = normalize(choices);
  const current = c.prof[profType] || [];
  let next = current;
  if (current.includes(name)) next = current.filter((n) => n !== name);
  else if (current.length < max) next = [...current, name];
  return { ...c, prof: { ...c.prof, [profType]: next } };
}

/**
 * The full character_data patch for adding a feat OUTSIDE the level-up wizard (the GM's Add Feat):
 * the new feats list, the proficiency picks, and — for a Battle Master — the feat's maneuvers
 * folded into the shared known list, the same way the wizard does it.
 *
 * It does NOT touch ability scores: those are columns on the character, not character_data, so a
 * half-feat's +1 is reported in `asi` for the surface to show.
 */
export function featAdditionPatch(model, characterData = {}, { level } = {}) {
  const entry = model.entry({ level });
  if (!entry) return {};
  const cd = characterData || {};
  const patch = { feats: [...(cd.feats || []), entry], ...model.profPatch(cd) };
  if (model.maneuverSpec && cd.subclass === 'Battle Master' && model.choices.maneuvers.length) {
    patch.maneuvers = unique([...(cd.maneuvers || []), ...model.choices.maneuvers]);
  }
  return patch;
}
