import React, { useState, useMemo, useEffect } from 'react';
import { Dices, ChevronRight, ChevronLeft, Star, Check, Lock, PencilLine, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { HIT_DICE_5E, CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import { HIT_DICE_2024, CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import {
  SUBCLASS_UNLOCK_LEVEL_5E, SUBCLASS_UNLOCK_LEVEL_2024,
  SUBCLASS_OPTIONS_5E, SUBCLASS_OPTIONS_2024,
} from '@/characters/components/classData/classChoicesData';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import { SUBCLASS_DATA } from '@/characters/components/classData/subclassData';
import SpellList from '@/characters/components/spells/SpellList';
import { CLASS_PROGRESSION } from '@/characters/components/classData/classProgressionTables';
import { getClassConfig } from '@/characters/components/sheets/classSheet/configs';
import { getHpBonusesPerLevel, hpRollBase, effectiveMaxHp } from '@/characters/components/combat/combatBonuses';
import { getManeuvers, maneuversKnownAtLevel } from '@/characters/components/classData/maneuversData';
import { getLevelChoices, availablePoolOptions, applyLevelChoice } from '@/characters/components/classData/levelChoicesData';
import { getSubclassGrants, availableGrantOptions, applyGrant } from '@/characters/components/classData/subclassGrants';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import FeatPicker from '@/characters/components/feats/FeatPicker';
import FeatSpellGrantPicker, { spellGrantComplete, resolveSpellGrantValue } from '@/characters/components/feats/FeatSpellGrantPicker';
import FeatManeuverPicker from '@/characters/components/feats/FeatManeuverPicker';
import { checkFeatPrerequisite } from '@/characters/components/feats/featPrerequisites';
import { featAbilityChoices, featFixedAbilityScores, getFeatProficiencyGrants, getSpellGrantSpecs, featGrantRedundant, featAbilityChoiceOptions, getFeatSaveProficiencies, getManeuverGrantSpec, maneuverGrantComplete } from '@/characters/components/feats/featEffects';
import { getFeatProficiencyChoices, availableFeatOptions, applyFeatProficiencyChoice, groupFeatProfOptions, FEAT_SKILL_OPTIONS } from '@/characters/components/feats/featProficiencyData';
import { CLASS_PROFICIENCIES_5E } from '@/characters/components/classData/classProficienciesData';
import featService from '@/encyclopedia/featService';

const ABILITY_LABEL = {
  strength: 'Strength', dexterity: 'Dexterity', constitution: 'Constitution',
  intelligence: 'Intelligence', wisdom: 'Wisdom', charisma: 'Charisma',
};

function conMod(score) { return Math.floor((score - 10) / 2); }

// Known casters choose their spells at level-up (vs. prepared casters who swap each long rest).
const KNOWN_CASTERS = new Set(['Bard', 'Sorcerer', 'Warlock']);

// Spellcasting detection for feat prerequisites ("the ability to cast at least one spell").
const SPELLCASTING_CLASSES = new Set(['Artificer', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']);
const CASTER_SUBCLASSES = new Set(['Eldritch Knight', 'Arcane Trickster']);

const ABILITIES = [
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'wisdom', label: 'Wisdom' },
  { key: 'charisma', label: 'Charisma' },
];
const ASI_POINTS = 2; // +2 to one score, or +1 to two

// Read a named progression column value (e.g. 'cantrips', 'known') at a given level.
function progressionValue(progression, key, lvl) {
  if (!progression) return null;
  const colIdx = progression.columns.findIndex(c => c.key === key);
  if (colIdx < 0) return null;
  const row = progression.data[Math.min(Math.max(lvl, 1), 20) - 1];
  return row ? row[colIdx] : null;
}

/**
 * Optional "replace one of your known X" control shown in level-up steps for features that allow
 * a swap-on-level-up (Battle Master maneuvers, Eldritch Invocations, Metamagic). Picking one to
 * swap out frees a slot so the player chooses one extra new option to fill it.
 */
function ReplaceOneSelect({ label, options = [], value = '', onChange, testId }) {
  if (options.length === 0) return null; // nothing known yet to replace
  return (
    <div className="rounded-md border bg-muted/30 p-2.5 space-y-1">
      <label className="text-xs font-medium">Replace one {label}? <span className="font-normal text-muted-foreground">(optional)</span></label>
      <select
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        value={value || '__none__'}
        onChange={(e) => onChange(e.target.value === '__none__' ? '' : e.target.value)}
        data-testid={testId}
      >
        <option value="__none__">Keep all — just add new</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {value && (
        <p className="text-xs text-muted-foreground">
          Choose one extra below to replace <span className="font-medium">{value}</span>.
        </p>
      )}
    </div>
  );
}

export default function LevelUpWizard({ character, campaign, onComplete, onClose }) {
  const edition = campaign?.edition || '5e';
  const is2024 = edition === '5.5e';

  const HIT_DICE = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
  const CLASS_FEATURES = is2024 ? CLASS_FEATURES_2024 : CLASS_FEATURES_5E;
  const SUBCLASS_UNLOCK = is2024 ? SUBCLASS_UNLOCK_LEVEL_2024 : SUBCLASS_UNLOCK_LEVEL_5E;
  const SUBCLASS_OPTS = is2024 ? SUBCLASS_OPTIONS_2024 : SUBCLASS_OPTIONS_5E;

  // Data-driven classes (Fighter, Wizard) own these values in their config — prefer it so the
  // wizard and the sheet share one source of truth. The remaining classes fall back to the maps.
  const config = getClassConfig(character.char_class, edition);

  const newLevel = (character.level ?? 1) + 1;
  const hitDie = config?.hitDie ?? HIT_DICE[character.char_class] ?? 8;
  const con = conMod(character.constitution ?? 10);
  const average = Math.floor(hitDie / 2) + 1;

  const subclassUnlockLevel = config?.subclass?.unlockLevel ?? SUBCLASS_UNLOCK[character.char_class];
  const needsSubclass = newLevel === subclassUnlockLevel
    && !character.character_data?.subclass;
  const subclassOptions = config?.subclass?.options ?? SUBCLASS_OPTS[character.char_class] ?? [];
  const subclassEdition = config?.subclass?.subclassEdition ?? (is2024 ? '5.5e' : '5e');

  // Known casters pick spells/cantrips on level-up.
  const progression = CLASS_PROGRESSION[is2024 ? '5.5e' : '5e']?.[character.char_class];
  const isKnownCaster = KNOWN_CASTERS.has(character.char_class);
  const cantripsTarget = isKnownCaster ? progressionValue(progression, 'cantrips', newLevel) : null;
  const knownTarget = isKnownCaster ? progressionValue(progression, 'known', newLevel) : null;

  const features = useMemo(() => {
    const classFeats = config?.features ?? CLASS_FEATURES[character.char_class];
    if (!classFeats) return [];
    return classFeats[newLevel] ?? [];
  }, [character.char_class, newLevel, CLASS_FEATURES, config]);


  // Ability Score Improvement: every class gains the "Ability Score Improvement" feature
  // at its ASI levels (4/8/12/16/19, +6/14 Fighter, +10 Rogue) — detect it from the
  // feature list so the wizard prompts for the increase. (Class-agnostic.)
  const needsAsi = features.some((f) => /ability score improvement/i.test(f.name || ''));

  // GM-controlled: what an ASI level grants — ability increase only, a choice of ASI or a
  // feat (RAW 5e default), or both. Drives whether the wizard shows the choice/feat steps.
  const asiFeatMode = campaign?.asi_feat_mode || 'asi_or_feat';
  const featsAllowed = asiFeatMode === 'asi_or_feat' || asiFeatMode === 'asi_and_feat';

  const [step, setStep] = useState(0);
  const [hpChoice, setHpChoice] = useState(null); // 'roll' | 'average' | 'manual'
  const [rolledValue, setRolledValue] = useState(null);
  const [manualValue, setManualValue] = useState(''); // 'roll at the table' — typed d{hitDie} result
  const [subclassChoice, setSubclassChoice] = useState('');
  const [cantrips, setCantrips] = useState(character.character_data?.cantrips ?? []);
  const [knownSpells, setKnownSpells] = useState(character.character_data?.known_spells ?? []);
  const [grantPicks, setGrantPicks] = useState({}); // { [grant.key]: [chosen value names] } — subclass grants
  const [asiAlloc, setAsiAlloc] = useState({}); // { [abilityKey]: 0|1|2 } — points added this ASI
  const [maneuverPicks, setManeuverPicks] = useState([]); // new maneuvers chosen this level-up
  const [maneuverReplace, setManeuverReplace] = useState(''); // a known maneuver to swap out (optional)
  const [levelChoicePicks, setLevelChoicePicks] = useState({}); // { [choice.key]: [chosen names] }
  const [levelChoiceReplace, setLevelChoiceReplace] = useState({}); // { [choice.key]: a known option to swap out }
  const [asiChoice, setAsiChoice] = useState(''); // 'asi' | 'feat' — only in asi_or_feat mode
  const [featPick, setFeatPick] = useState(null); // { id, name } chosen this level-up
  const [featAbilityPick, setFeatAbilityPick] = useState(''); // half-feat ability choice (e.g. Tavern Brawler)
  const [featProfChoices, setFeatProfChoices] = useState({}); // { [prof_type]: [chosen] } — Skilled/Linguist/Weapon Master
  const [featSpellGrant, setFeatSpellGrant] = useState(null); // spell_grant picks (Magic Initiate): { source, ability, cantrips, leveled }
  const [featManeuverPicks, setFeatManeuverPicks] = useState([]); // maneuver_grant picks (Martial Adept): [name]
  const [allFeats, setAllFeats] = useState([]); // edition-filtered feat catalogue
  const [saving, setSaving] = useState(false);

  // Fetch the feat catalogue once when feats can be granted at this ASI level.
  useEffect(() => {
    if (!needsAsi || !featsAllowed) return;
    let cancelled = false;
    featService.getFeats(campaign?.id, edition).then((list) => {
      if (!cancelled) setAllFeats(Array.isArray(list) ? list : []);
    });
    return () => { cancelled = true; };
  }, [needsAsi, featsAllowed, campaign?.id, edition]);

  // Subclass proficiency grants gained at this level (uses the subclass chosen in this
  // wizard, or the existing one for grants at later levels). Drives the Proficiencies step.
  const effectiveSubclass = subclassChoice || character.character_data?.subclass;

  // The class feature tables carry generic placeholders at subclass-feature levels (e.g.
  // "Martial Archetype Feature" → "You gain a feature from your Martial Archetype."). By the
  // time this level-up runs the character's subclass is known (chosen here or earlier), so we
  // resolve the ACTUAL subclass feature(s) gained at this level and substitute them for the
  // placeholder — the player sees exactly what they're getting (e.g. Champion L15 Superior Critical).
  const subclassFeaturesAtLevel = useMemo(() => {
    if (!effectiveSubclass) return [];
    const data = SUBCLASS_DATA[character.char_class]?.[subclassEdition]?.[effectiveSubclass];
    if (!data?.features) return [];
    return data.features.filter((f) => f.level === newLevel);
  }, [character.char_class, subclassEdition, effectiveSubclass, newLevel]);

  // A generic "gain a feature from your <subclass>" placeholder in the class table.
  const isSubclassPlaceholder = (f) =>
    /feature from your|capstone feature/i.test(f?.description || '');

  // Class features shown on the Features step: when we can resolve the chosen subclass's
  // features for this level, swap the generic placeholder(s) for the real feature(s); otherwise
  // leave the placeholder text in place (better than dropping it).
  const displayFeatures = useMemo(() => {
    if (subclassFeaturesAtLevel.length === 0) return features;
    return [
      ...features.filter((f) => !isSubclassPlaceholder(f)),
      ...subclassFeaturesAtLevel.map((f) => ({ ...f, _subclass: true })),
    ];
  }, [features, subclassFeaturesAtLevel]);
  // Subclass grants gained at this level — proficiency picks (Battle Master Student of War) or
  // class-pool picks (Champion Additional Fighting Style), unified in subclassGrants.js. Drives
  // the Subclass Grants step.
  const subclassGrantList = getSubclassGrants(character.char_class, edition, effectiveSubclass, newLevel);
  const needsSubclassGrants = subclassGrantList.length > 0;
  const subclassGrantsLabel = subclassGrantList.length === 1 ? subclassGrantList[0].label : 'Subclass Choices';

  // Battle Master learns new maneuvers at certain levels (3/7/10/15) — choose the delta.
  const knownManeuvers = character.character_data?.maneuvers ?? [];
  const maneuverDelta = effectiveSubclass === 'Battle Master'
    ? Math.max(0, maneuversKnownAtLevel(newLevel) - maneuversKnownAtLevel(character.level ?? 1))
    : 0;
  const needsManeuvers = maneuverDelta > 0;
  // Battle Masters may also REPLACE one known maneuver when they learn new ones (RAW). Swapping
  // one out frees a slot, so the player picks one extra new maneuver to fill it.
  const maneuverTarget = maneuverDelta + (maneuverReplace ? 1 : 0);

  // Class-wide pool selections gained this level (Metamagic, etc.) — data-driven via
  // levelChoicesData. Each carries a resolved `count` = the per-level delta to pick.
  const levelChoices = getLevelChoices(character.char_class, edition, character.level ?? 1, newLevel);
  const needsLevelChoices = levelChoices.length > 0;
  const levelChoicesLabel = levelChoices.length === 1 ? levelChoices[0].label : 'Class Choices';

  // ── ASI / feat step gating (driven by the campaign's asi_feat_mode) ──
  // asi_only        → just the ASI step.
  // asi_or_feat     → a choice step, then either the ASI step or the feat step.
  // asi_and_feat    → both the ASI step and the feat step.
  const needsAsiChoice = needsAsi && asiFeatMode === 'asi_or_feat';
  const wantsAsiStep = needsAsi && (
    asiFeatMode === 'asi_only' ||
    asiFeatMode === 'asi_and_feat' ||
    (asiFeatMode === 'asi_or_feat' && asiChoice === 'asi')
  );
  const wantsFeatStep = needsAsi && (
    asiFeatMode === 'asi_and_feat' ||
    (asiFeatMode === 'asi_or_feat' && asiChoice === 'feat')
  );

  const STEPS = [
    'hp',
    ...(needsSubclass ? ['subclass'] : []),
    'features',
    ...(needsAsiChoice ? ['asi_choice'] : []),
    ...(wantsAsiStep ? ['asi'] : []),
    ...(wantsFeatStep ? ['feat'] : []),
    ...(isKnownCaster ? ['spells'] : []),
    ...(needsSubclassGrants ? ['subclass-grants'] : []),
    ...(needsLevelChoices ? ['level-choices'] : []),
    ...(needsManeuvers ? ['maneuvers'] : []),
    'confirm',
  ];
  const STEP_LABELS = [
    'Hit Points',
    ...(needsSubclass ? ['Subclass'] : []),
    'New Features',
    ...(needsAsiChoice ? ['ASI or Feat'] : []),
    ...(wantsAsiStep ? ['Ability Scores'] : []),
    ...(wantsFeatStep ? ['Feat'] : []),
    ...(isKnownCaster ? ['New Spells'] : []),
    ...(needsSubclassGrants ? [subclassGrantsLabel] : []),
    ...(needsLevelChoices ? [levelChoicesLabel] : []),
    ...(needsManeuvers ? ['Maneuvers'] : []),
    'Confirm',
  ];

  const toggleGrant = (grantKey, name, max) => {
    setGrantPicks((prev) => {
      const cur = prev[grantKey] || [];
      if (cur.includes(name)) return { ...prev, [grantKey]: cur.filter((n) => n !== name) };
      if (cur.length >= max) return prev; // at the choose limit
      return { ...prev, [grantKey]: [...cur, name] };
    });
  };

  // ── Ability Score Improvement allocation ──
  const asiTotal = ABILITIES.reduce((sum, a) => sum + (asiAlloc[a.key] || 0), 0);
  const asiRemaining = ASI_POINTS - asiTotal;
  const adjustAsi = (key, delta) => {
    setAsiAlloc((prev) => {
      const cur = prev[key] || 0;
      const next = cur + delta;
      if (next < 0) return prev;
      if (delta > 0) {
        if (asiTotal >= ASI_POINTS) return prev;             // out of points
        if ((character[key] ?? 10) + cur >= 20) return prev; // 20 cap
      }
      return { ...prev, [key]: next };
    });
  };
  // ── Feats offered at this ASI level ──
  // Every feat is shown; ones whose prerequisites aren't met are disabled (and sorted to
  // the bottom of the picker) with the reason, rather than hidden. Already-taken,
  // non-repeatable feats are excluded entirely. Ability-score prerequisites are checked
  // against the scores AFTER any increase chosen this level (so a +1 can unlock a feat in
  // asi_and_feat mode); level prerequisites use the new level. Spell/armor prerequisites
  // are left fail-open (skipped — not reliably knowable here).
  const takenFeatNames = new Set((character.character_data?.feats ?? []).map((f) => (f?.name || f)));
  const prereqScores = ABILITIES.reduce((acc, a) => {
    acc[a.key] = (character[a.key] ?? 10) + (wantsAsiStep ? (asiAlloc[a.key] || 0) : 0);
    return acc;
  }, {});
  const visibleFeats = useMemo(
    () => allFeats.filter((f) => f.repeatable || !takenFeatNames.has(f.name)),
    [allFeats], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Can this character cast at least one spell? Drives "ability to cast a spell" feat prereqs.
  // True for spellcasting classes, caster subclasses (Eldritch Knight / Arcane Trickster), or
  // a character who already knows/prepared any spell or cantrip (incl. race-granted).
  const cd = character.character_data ?? {};
  const isSpellcaster = SPELLCASTING_CLASSES.has(character.char_class)
    || CASTER_SUBCLASSES.has(cd.subclass)
    || [cd.cantrips, cd.known_spells, cd.prepared_spells, cd.spellbook]
      .some((arr) => Array.isArray(arr) && arr.length > 0)
    || !!cd.high_elf_cantrip;

  // Armor proficiency categories (light/medium/heavy) the character has — drives armor-prereq
  // feats (Heavily/Moderately Armored, Heavy Armor Master). Sources: the class table, race
  // grants, and feat-granted armor (so the ladder works: Lightly → Moderately → Heavily Armored).
  const ARMOR_CATS = ['light', 'medium', 'heavy'];
  const armorProficiencies = (() => {
    const cats = new Set();
    const classArmor = (CLASS_PROFICIENCIES_5E[character.char_class]?.armor || '').toLowerCase();
    if (classArmor.includes('all armor')) ARMOR_CATS.forEach((c) => cats.add(c));
    ARMOR_CATS.forEach((c) => { if (classArmor.includes(c)) cats.add(c); });
    [...(cd.race_armor_proficiencies || []), ...getFeatProficiencyGrants(cd.feats).armor].forEach((a) => {
      ARMOR_CATS.forEach((c) => { if (String(a).toLowerCase().includes(c)) cats.add(c); });
    });
    return [...cats];
  })();

  // The simple/martial weapon proficiencies the class confers — drives the redundancy lock for
  // Weapon Master (needs all) and Martial Weapon Training (needs martial).
  const classWeapons = (CLASS_PROFICIENCIES_5E[character.char_class]?.weapons || '').toLowerCase();
  const weaponProfs = { simple: classWeapons.includes('simple'), martial: classWeapons.includes('martial') };

  const featDisabledReason = (f) => {
    const { met, unmet } = checkFeatPrerequisite(f, {
      level: newLevel,
      className: character.char_class,
      scores: prereqScores,
      abilityScoresKnown: true,
      spellcaster: isSpellcaster,
      armorProficiencies,
    });
    if (!met) return unmet.map((u) => u.reason).join('; ');
    // Prereq met — but a half-feat whose proficiency the character already has is a trap pick.
    return featGrantRedundant(f, { armorProficiencies, weapons: weaponProfs });
  };

  // The full picked feat (with effects) + any ability-score choice it demands (half-feats).
  const pickedFeat = featPick ? visibleFeats.find((f) => f.id === featPick.id) : null;
  const featAbilityChoice = pickedFeat ? (featAbilityChoices(pickedFeat)[0] || null) : null; // slice: one choice
  // Saving-throw proficiencies the character already has (class defaults overridden by any stored
  // toggle, plus feat-granted saves) — used to filter Resilient's ability chooser.
  const _ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  const classSaves = (CLASS_PROFICIENCIES_5E[character.char_class]?.saving_throws ?? []).map((s) => s.toLowerCase());
  const saveProficiencies = [
    // CharacterDetail stores save toggles under abbreviated keys (str/dex/con/int/wis/cha + _save_prof);
    // fall back to the class default when no toggle is stored.
    ..._ABILITIES.filter((a) => (cd[`${a.slice(0, 3)}_save_prof`] ?? classSaves.includes(a))),
    ...getFeatSaveProficiencies(cd.feats || []),
  ];
  // The abilities offerable for a half-feat's ability choice (Resilient hides saves already held).
  const featAbilityOptions = featAbilityChoiceOptions(pickedFeat, featAbilityChoice, { saveProficiencies });
  // Count-choice proficiency grants the picked feat demands (Skilled / Linguist / Weapon Master),
  // plus Expertise grants (Skill Expert) whose pool is the character's proficient skills — including
  // a skill picked from this same feat (so you can expertise what you just gained).
  const _skillSet = new Set(FEAT_SKILL_OPTIONS.map((s) => s.toLowerCase()));
  // The skills granted by THIS feat being picked (a Skilled skill_or_tool pick or a Skill
  // Expert skill pick) — recorded on the feat instance so the Stats skills panel can flag them.
  const featSkillPicks = [...new Set([
    ...(featProfChoices.skill || []),
    ...((featProfChoices.skill_or_tool || []).filter((s) => _skillSet.has(s.toLowerCase()))),
  ])];
  const proficientSkills = [...new Set([
    ...(character.character_data?.skill_proficiencies ?? []),
    ...featSkillPicks,
  ])];
  const featProfCtx = { charClass: character.char_class, characterData: character.character_data ?? {} };
  const featProfGrants = pickedFeat ? getFeatProficiencyChoices(pickedFeat, { proficientSkills }) : [];
  const featProfRequired = (g) => Math.min(g.count, availableFeatOptions(g, featProfCtx).length);
  const featProfComplete = featProfGrants.every((g) => (featProfChoices[g.prof_type]?.length || 0) >= featProfRequired(g));
  // Spell-grant spec (Magic Initiate) the picked feat asks the player to fulfil.
  const featSpellSpec = pickedFeat ? (getSpellGrantSpecs(pickedFeat)[0] || null) : null;
  const featSpellComplete = !featSpellSpec || spellGrantComplete(featSpellSpec, featSpellGrant);
  // Maneuver-grant spec (Martial Adept): pick N Battle Master maneuvers, excluding any already known.
  const featManeuverSpec = pickedFeat ? getManeuverGrantSpec(pickedFeat) : null;
  const featManeuverComplete = maneuverGrantComplete(featManeuverSpec, featManeuverPicks);
  const selectFeat = (f) => { setFeatPick(f); setFeatAbilityPick(''); setFeatProfChoices({}); setFeatSpellGrant(null); setFeatManeuverPicks([]); };
  const toggleFeatProf = (profType, name, max) => {
    setFeatProfChoices((prev) => {
      const cur = prev[profType] || [];
      if (cur.includes(name)) return { ...prev, [profType]: cur.filter((n) => n !== name) };
      if (cur.length >= max) return prev;
      return { ...prev, [profType]: [...cur, name] };
    });
  };

  // Combined ability-score increases written this level: the ASI step's allocation plus any
  // fixed/chosen increase from a half-feat, capped at 20. (Half-feats permanently raise a score.)
  const combinedScoreUpdates = () => {
    const inc = {};
    if (wantsAsiStep) ABILITIES.forEach((a) => { if (asiAlloc[a.key]) inc[a.key] = (inc[a.key] || 0) + asiAlloc[a.key]; });
    if (wantsFeatStep && pickedFeat) {
      featFixedAbilityScores(pickedFeat).forEach(({ ability, amount }) => { inc[ability] = (inc[ability] || 0) + amount; });
      if (featAbilityChoice && featAbilityPick) inc[featAbilityPick] = (inc[featAbilityPick] || 0) + featAbilityChoice.amount;
    }
    const out = {};
    ABILITIES.forEach((a) => {
      const t = inc[a.key] || 0;
      if (t) out[a.key] = Math.min(20, (character[a.key] ?? 10) + t);
    });
    return out;
  };

  const toggleManeuver = (name) => {
    setManeuverPicks((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= maneuverTarget) return prev; // at this level's pick limit (+1 if replacing)
      return [...prev, name];
    });
  };

  // Pool-choice picks (Metamagic, etc.). Required count is capped by what's still available
  // (so a near-exhausted pool doesn't block Next), mirroring the feat count-choice grants.
  const levelChoiceRequired = (c) => {
    const avail = availablePoolOptions(c, character.character_data ?? {}, newLevel).length;
    const base = Math.min(c.count, avail);
    // Replacing one frees a slot → pick one extra new option (capped by what the pool still offers).
    return levelChoiceReplace[c.key] ? Math.min(base + 1, avail) : base;
  };
  const toggleLevelChoice = (choiceKey, name, max) => {
    setLevelChoicePicks((prev) => {
      const cur = prev[choiceKey] || [];
      if (cur.includes(name)) return { ...prev, [choiceKey]: cur.filter((n) => n !== name) };
      if (cur.length >= max) return prev; // at this level's pick limit
      return { ...prev, [choiceKey]: [...cur, name] };
    });
  };

  const addUnique = (list, name) => (list.includes(name) ? list : [...list, name]);
  const removeName = (list, name) => list.filter(s => s !== name);

  // Once an HP method is chosen it is locked in for this level-up — you can't roll,
  // dislike the result, and switch to average. (Cancelling the wizard resets the choice.)
  const methodLocked = hpChoice !== null;

  const manualNum = manualValue === '' ? null : Number(manualValue);
  const manualValid = manualNum != null
    && Number.isInteger(manualNum) && manualNum >= 1 && manualNum <= hitDie;

  // The raw die result for the chosen method (before CON), or null if not yet resolved.
  const hpDieResult =
    hpChoice === 'roll' ? rolledValue :
    hpChoice === 'average' ? average :
    hpChoice === 'manual' ? (manualValid ? manualNum : null) :
    null;

  // Per-level HP bonuses (Hill Dwarf Dwarven Toughness +1, Tough feat +2, Draconic Resilience +1).
  // Display-only: the sheet's MaxHpValue re-adds them on top of the stored roll base per level.
  const hpBonusArgs = {
    charClass: character.char_class,
    subclass: character.character_data?.subclass,
    raceTraits: character.character_data?.race_traits ?? [],
    feats: character.character_data?.feats ?? [],
  };
  const hpBonusRows = getHpBonusesPerLevel(hpBonusArgs);          // [{ source, detail, perLevel }]
  const perLevelHpBonus = hpBonusRows.reduce((s, b) => s + b.perLevel, 0);

  // HP is stored as the CON-INDEPENDENT roll base (character_data.hp_rolls = the hit-die results,
  // no Constitution). This level-up adds one die result; Constitution is layered on dynamically at
  // display time, so raising CON here (via an ASI or half-feat) increases max HP retroactively
  // across every level automatically — no retroactive bookkeeping, no CON baked into storage.
  const conAfter = conMod(combinedScoreUpdates().constitution ?? (character.constitution ?? 10));
  const oldLevel = character.level ?? 1;
  const oldRollBase = hpRollBase(character.character_data ?? {}, { level: oldLevel, conMod: con });
  const newRolls = oldRollBase != null && hpDieResult != null ? oldRollBase + hpDieResult : null;

  // The extra HP a CON-modifier increase grants retroactively (prior levels catch up); shown in the
  // confirm breakdown so the "HP gained" number is explained. 0 when CON is unchanged.
  const retroHp = (conAfter - con) * oldLevel;

  // Effective (displayed) max HP before/after = roll base + CON × level + passive bonuses.
  const effectiveCurrentMax = effectiveMaxHp(character.character_data ?? {}, { level: oldLevel, conMod: con, ...hpBonusArgs });
  const effectiveNewMax = newRolls != null
    ? effectiveMaxHp({ hp_rolls: newRolls }, { level: newLevel, conMod: conAfter, ...hpBonusArgs })
    : null;
  const hpGain = effectiveNewMax != null && effectiveCurrentMax != null
    ? effectiveNewMax - effectiveCurrentMax
    : null;

  const hpMethodLabel =
    hpChoice === 'roll' ? `rolled ${rolledValue}` :
    hpChoice === 'average' ? `avg ${average}` :
    hpChoice === 'manual' ? `rolled ${manualNum} at the table` :
    '';

  const roll = () => {
    if (methodLocked) return; // locked — no re-rolling
    const result = Math.floor(Math.random() * hitDie) + 1;
    setRolledValue(result);
    setHpChoice('roll');
  };

  const canAdvance = () => {
    if (STEPS[step] === 'hp') return hpDieResult != null;
    if (STEPS[step] === 'subclass') return !!subclassChoice;
    if (STEPS[step] === 'subclass-grants') {
      return subclassGrantList.every((g) => (grantPicks[g.key]?.length || 0) === g.count);
    }
    if (STEPS[step] === 'asi') return asiTotal === ASI_POINTS;
    if (STEPS[step] === 'asi_choice') return asiChoice === 'asi' || asiChoice === 'feat';
    if (STEPS[step] === 'feat') return !!featPick && (!featAbilityChoice || !!featAbilityPick) && featProfComplete && featSpellComplete && featManeuverComplete;
    if (STEPS[step] === 'maneuvers') return maneuverPicks.length === maneuverTarget;
    if (STEPS[step] === 'level-choices') {
      return levelChoices.every((c) => (levelChoicePicks[c.key]?.length || 0) >= levelChoiceRequired(c));
    }
    return true;
  };

  const handleConfirm = async () => {
    setSaving(true);
    // Merge each subclass grant pick (proficiency or class-pool) into its character_data field.
    let grantPatch = {};
    for (const g of subclassGrantList) {
      grantPatch = {
        ...grantPatch,
        ...applyGrant(g, grantPicks[g.key] || [], { ...(character.character_data ?? {}), ...grantPatch }),
      };
    }
    // Feat count-choice proficiency picks (Skilled / Linguist / Weapon Master) merge into
    // their character_data fields (skills→skill_proficiencies, tools→feat_tool_proficiencies, …).
    let featProfPatch = {};
    if (wantsFeatStep && pickedFeat) {
      for (const g of featProfGrants) {
        featProfPatch = {
          ...featProfPatch,
          ...applyFeatProficiencyChoice(g.prof_type, featProfChoices[g.prof_type] || [], { ...(character.character_data ?? {}), ...featProfPatch }),
        };
      }
    }
    // A feat chosen this level-up is appended to character_data.feats. We snapshot the feat's
    // structured `effects` onto the instance (inventory pattern) so the sheet's resolvers
    // (initiative, action economy, unarmed die) work without re-fetching the catalogue, and
    // record any half-feat ability choice.
    const existingFeats = character.character_data?.feats ?? [];
    const featChoices = {
      ...(featAbilityChoice && featAbilityPick ? { ability: featAbilityPick } : {}),
      ...(featSkillPicks.length ? { skills: featSkillPicks } : {}),
      ...(featSpellSpec ? { spell_grant: resolveSpellGrantValue(featSpellSpec, featSpellGrant) } : {}),
      ...(featManeuverSpec ? { maneuvers: featManeuverPicks } : {}),
    };
    const featAddition = (wantsFeatStep && featPick)
      ? [...existingFeats, {
          id: featPick.id,
          name: featPick.name,
          level: newLevel,
          ...(pickedFeat?.effects ? { effects: pickedFeat.effects } : {}),
          ...(Object.keys(featChoices).length ? { choices: featChoices } : {}),
        }]
      : null;

    // Class-wide pool selections (Metamagic, Eldritch Invocations, …) merge into their
    // character_data field; an optional swapped-out option is removed first (replace-on-level-up).
    let levelChoicePatch = {};
    for (const c of levelChoices) {
      levelChoicePatch = {
        ...levelChoicePatch,
        ...applyLevelChoice(c, levelChoicePicks[c.key] || [], { ...(character.character_data ?? {}), ...levelChoicePatch }, levelChoiceReplace[c.key] || null),
      };
    }

    // Maneuvers known after this level-up: the maneuver STEP's result (Battle Master learn
    // levels) plus any maneuvers a maneuver-grant feat (Martial Adept) added — but those merge
    // into the shared list ONLY for a Battle Master (a non-Battle-Master's feat maneuvers live on
    // the feat instance, shown in the Feats tab + fueled by the feat's own d6).
    const featGrantedManeuvers = (wantsFeatStep && featManeuverSpec) ? featManeuverPicks : [];
    const isBattleMaster = (subclassChoice || character.character_data?.subclass) === 'Battle Master';
    const stepManeuvers = needsManeuvers
      ? [...knownManeuvers.filter((m) => m !== maneuverReplace), ...maneuverPicks]
      : knownManeuvers;
    const mergedManeuvers = (isBattleMaster && featGrantedManeuvers.length)
      ? [...new Set([...stepManeuvers, ...featGrantedManeuvers])]
      : stepManeuvers;
    const maneuversChanged = needsManeuvers || (isBattleMaster && featGrantedManeuvers.length > 0);

    const newCharacterData = {
      ...(character.character_data ?? {}),
      ...(newRolls != null ? { hp_rolls: newRolls } : {}),
      ...(subclassChoice ? { subclass: subclassChoice } : {}),
      ...(isKnownCaster ? { cantrips, known_spells: knownSpells } : {}),
      ...grantPatch,
      ...featProfPatch,
      ...(maneuversChanged ? { maneuvers: mergedManeuvers } : {}),
      ...levelChoicePatch,
      ...(featAddition ? { feats: featAddition } : {}),
    };
    // Ability-score changes (ASI step + any half-feat increase) update top-level character
    // fields, passed as a 3rd arg (only when non-empty, so existing 2-arg callers are unaffected).
    const scoreUpdates = combinedScoreUpdates();
    const extra = Object.keys(scoreUpdates).length ? [scoreUpdates] : [];
    await onComplete(newLevel, newCharacterData, ...extra);
    setSaving(false);
  };

  const stepIndex = step;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Level Up — Reaching Level {newLevel}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator — wraps to multiple lines so 6 steps don't overflow the dialog */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap',
                i < stepIndex ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                i === stepIndex ? 'bg-primary/10 text-primary' :
                'text-muted-foreground'
              )}
            >
              {i < stepIndex
                ? <Check className="h-3 w-3" />
                : <span className="w-3 text-center">{i + 1}</span>}
              {STEP_LABELS[i]}
            </div>
          ))}
        </div>

        {/* ── Step: HP ── */}
        {STEPS[step] === 'hp' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              As a <span className="font-medium text-foreground">{character.char_class}</span>, you
              roll a <span className="font-medium text-foreground">d{hitDie}</span> for hit points.
              Your Constitution modifier is <span className="font-medium text-foreground">
                {con >= 0 ? `+${con}` : con}
              </span>.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {/* Roll option */}
              <button
                type="button"
                onClick={roll}
                disabled={methodLocked && hpChoice !== 'roll'}
                data-testid="hp-method-roll"
                className={cn(
                  'rounded-lg border-2 p-3 text-center transition-all hover:shadow-sm',
                  hpChoice === 'roll'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  methodLocked && hpChoice !== 'roll' && 'opacity-40 cursor-not-allowed hover:shadow-none hover:border-border'
                )}
              >
                <Dices className="h-7 w-7 mx-auto mb-2 text-primary" />
                <div className="font-semibold text-sm">Roll the Dice</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {rolledValue != null
                    ? <span className="text-lg font-bold text-foreground">{rolledValue}</span>
                    : 'Click to roll d' + hitDie}
                </div>
                {hpChoice === 'roll' && rolledValue != null && (
                  <div className="text-xs text-primary mt-1 font-medium">Selected</div>
                )}
              </button>

              {/* Average option */}
              <button
                type="button"
                onClick={() => { if (!methodLocked) setHpChoice('average'); }}
                disabled={methodLocked && hpChoice !== 'average'}
                data-testid="hp-method-average"
                className={cn(
                  'rounded-lg border-2 p-3 text-center transition-all hover:shadow-sm',
                  hpChoice === 'average'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  methodLocked && hpChoice !== 'average' && 'opacity-40 cursor-not-allowed hover:shadow-none hover:border-border'
                )}
              >
                <div className="text-3xl font-bold text-primary mb-1">{average}</div>
                <div className="font-semibold text-sm">Take Average</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Average d{hitDie} roll, rounded up
                </div>
                {hpChoice === 'average' && (
                  <div className="text-xs text-primary mt-1 font-medium">Selected</div>
                )}
              </button>

              {/* Roll at the table (manual entry) option */}
              <button
                type="button"
                onClick={() => { if (!methodLocked) setHpChoice('manual'); }}
                disabled={methodLocked && hpChoice !== 'manual'}
                data-testid="hp-method-manual"
                className={cn(
                  'rounded-lg border-2 p-3 text-center transition-all hover:shadow-sm',
                  hpChoice === 'manual'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50',
                  methodLocked && hpChoice !== 'manual' && 'opacity-40 cursor-not-allowed hover:shadow-none hover:border-border'
                )}
              >
                <PencilLine className="h-7 w-7 mx-auto mb-2 text-primary" />
                <div className="font-semibold text-sm">Roll at the Table</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Enter your physical d{hitDie} result
                </div>
                {hpChoice === 'manual' && (
                  <div className="text-xs text-primary mt-1 font-medium">Selected</div>
                )}
              </button>
            </div>

            {/* Manual entry input — shown once 'Roll at the Table' is chosen */}
            {hpChoice === 'manual' && (
              <div className="space-y-1.5">
                <label htmlFor="hp-manual-input" className="text-xs font-medium text-muted-foreground">
                  Your rolled d{hitDie} result (1–{hitDie})
                </label>
                <Input
                  id="hp-manual-input"
                  data-testid="hp-manual-input"
                  type="number"
                  min={1}
                  max={hitDie}
                  value={manualValue}
                  onChange={e => setManualValue(e.target.value)}
                  placeholder={`1–${hitDie}`}
                  className="max-w-32"
                  autoFocus
                />
                {manualValue !== '' && !manualValid && (
                  <p className="text-xs text-destructive">
                    Enter a whole number between 1 and {hitDie}.
                  </p>
                )}
              </div>
            )}

            {methodLocked && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Your hit point method is locked in. To choose differently, cancel and restart the level-up.
              </div>
            )}

            {hpGain != null && (
              <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HP die result</span>
                  <span className="font-medium">{hpDieResult}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CON modifier</span>
                  <span className="font-medium">{con >= 0 ? `+${con}` : con}</span>
                </div>
                {hpBonusRows.map(b => (
                  <div key={b.source} className="flex justify-between" data-testid={`hp-bonus-${b.source}`}>
                    <span className="text-muted-foreground">{b.source}</span>
                    <span className="font-medium text-emerald-600">+{b.perLevel}</span>
                  </div>
                ))}
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-semibold">
                  <span>HP gained</span>
                  <span className="text-green-600">+{hpGain}</span>
                </div>
                {effectiveCurrentMax != null && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>New HP max</span>
                    <span>{effectiveCurrentMax} → <span className="font-semibold text-foreground">{effectiveNewMax}</span></span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step: Subclass ── */}
        {STEPS[step] === 'subclass' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
              <Lock className="h-4 w-4 shrink-0" />
              This choice is permanent and cannot be changed after level-up.
            </div>
            <p className="text-sm text-muted-foreground">
              At level {newLevel}, your <span className="font-medium text-foreground">{character.char_class}</span> permanently
              chooses a subclass. Pick the one that best fits your character.
            </p>
            <div className="max-h-80 overflow-y-auto pr-1" data-testid="subclass-scroll">
              <SubclassPickerWithDetail
                options={subclassOptions}
                value={subclassChoice}
                onChange={setSubclassChoice}
                className={character.char_class}
                edition={subclassEdition}
              />
            </div>
          </div>
        )}

        {/* ── Step: Features ── */}
        {STEPS[step] === 'features' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              At level {newLevel}, your <span className="font-medium text-foreground">{character.char_class}</span> gains:
            </p>

            {displayFeatures.length === 0 ? (
              <div className="rounded-md border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No new class features at this level.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {displayFeatures.map((feat, i) => (
                  <div key={i} className="rounded-md border bg-card p-3 space-y-1.5">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {feat.name}
                      {feat._subclass && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium px-2 py-0.5">
                          {effectiveSubclass}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step: Ability Score Improvement ── */}
        {STEPS[step] === 'asi' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ability Score Improvement — increase <span className="font-medium text-foreground">one</span> score
              by 2, or <span className="font-medium text-foreground">two</span> scores by 1 each. No score can go above 20.
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Points remaining</span>
              <span className={cn('font-semibold', asiRemaining === 0 ? 'text-green-600' : 'text-amber-600')} data-testid="asi-remaining">
                {asiRemaining}
              </span>
            </div>
            <div className="space-y-1.5">
              {ABILITIES.map(({ key, label }) => {
                const base = character[key] ?? 10;
                const inc = asiAlloc[key] || 0;
                return (
                  <div key={key} className="flex items-center justify-between rounded-md border px-3 py-2" data-testid={`asi-row-${key}`}>
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {base}{inc > 0 && <> → <span className="font-semibold text-foreground">{base + inc}</span></>}
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                          disabled={inc <= 0} onClick={() => adjustAsi(key, -1)}
                          aria-label={`Decrease ${label}`} data-testid={`asi-dec-${key}`}>−</button>
                        <span className="w-7 text-center text-sm tabular-nums">{inc > 0 ? `+${inc}` : '—'}</span>
                        <button type="button" className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                          disabled={asiRemaining <= 0 || base + inc >= 20} onClick={() => adjustAsi(key, 1)}
                          aria-label={`Increase ${label}`} data-testid={`asi-inc-${key}`}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step: ASI or Feat choice ── */}
        {STEPS[step] === 'asi_choice' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              At level {newLevel} you may either increase your ability scores
              <span className="font-medium text-foreground"> or </span>
              take a <span className="font-medium text-foreground">feat</span>. Choose one.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAsiChoice('asi')}
                data-testid="asi-choice-asi"
                className={cn(
                  'rounded-lg border-2 p-4 text-center transition-all hover:shadow-sm',
                  asiChoice === 'asi' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
              >
                <Sparkles className="h-7 w-7 mx-auto mb-2 text-primary" />
                <div className="font-semibold text-sm">Ability Score Increase</div>
                <div className="text-xs text-muted-foreground mt-1">+2 to one score, or +1 to two</div>
                {asiChoice === 'asi' && <div className="text-xs text-primary mt-1 font-medium">Selected</div>}
              </button>
              <button
                type="button"
                onClick={() => setAsiChoice('feat')}
                data-testid="asi-choice-feat"
                className={cn(
                  'rounded-lg border-2 p-4 text-center transition-all hover:shadow-sm',
                  asiChoice === 'feat' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
              >
                <Award className="h-7 w-7 mx-auto mb-2 text-primary" />
                <div className="font-semibold text-sm">Take a Feat</div>
                <div className="text-xs text-muted-foreground mt-1">Gain a special talent instead</div>
                {asiChoice === 'feat' && <div className="text-xs text-primary mt-1 font-medium">Selected</div>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Feat ── */}
        {STEPS[step] === 'feat' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a <span className="font-medium text-foreground">feat</span>. Feats you don't meet the
              prerequisites for are shown at the bottom and can't be selected{takenFeatNames.size > 0 ? '; feats you already have are hidden' : ''}.
            </p>
            {visibleFeats.length === 0 ? (
              <div className="rounded-md border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground" data-testid="feat-empty">
                No feats are available for this character.
              </div>
            ) : (
              <FeatPicker
                feats={visibleFeats}
                value={featPick}
                onChange={selectFeat}
                testIdPrefix="lvl-feat"
                getDisabledReason={featDisabledReason}
              />
            )}

            {/* Half-feat ability-score choice (e.g. Tavern Brawler: +1 Strength or Constitution) */}
            {featAbilityChoice && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3" data-testid="feat-ability-choice">
                <p className="text-sm font-medium">
                  This feat increases an ability score by {featAbilityChoice.amount}. Choose one:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {featAbilityOptions.map((ab) => (
                    <button
                      key={ab}
                      type="button"
                      onClick={() => setFeatAbilityPick(ab)}
                      data-testid={`feat-ability-${ab}`}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-sm transition-colors',
                        featAbilityPick === ab ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                      )}
                    >
                      +{featAbilityChoice.amount} {ABILITY_LABEL[ab] || ab}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Count-choice proficiency grants (Skilled / Linguist / Weapon Master) */}
            {featProfGrants.map((g) => {
              const opts = availableFeatOptions(g, featProfCtx);
              if (opts.length === 0) return null; // nothing left to pick (e.g. no proficient skills to expertise)
              const chosen = featProfChoices[g.prof_type] || [];
              return (
                <div key={g.key} className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className={cn('text-xs', chosen.length === g.count ? 'text-muted-foreground' : 'text-amber-600')}>
                      {chosen.length}/{g.count}
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto pr-1 space-y-2" data-testid={`feat-prof-grant-${g.prof_type}`}>
                    {groupFeatProfOptions(g.prof_type, opts).map(({ category, options }) => (
                      <div key={category || '_'} className="space-y-1.5">
                        {category && (
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{category}</div>
                        )}
                        <div className="grid grid-cols-2 gap-1.5">
                          {options.map((o) => {
                            const isSel = chosen.includes(o);
                            const atLimit = chosen.length >= g.count && !isSel;
                            return (
                              <button
                                key={o}
                                type="button"
                                disabled={atLimit}
                                onClick={() => toggleFeatProf(g.prof_type, o, g.count)}
                                data-testid={`feat-prof-opt-${g.prof_type}-${o}`}
                                className={cn(
                                  'rounded-md border px-2 py-1.5 text-xs text-left transition-colors',
                                  isSel ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                                  atLimit && 'opacity-40 cursor-not-allowed',
                                )}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Spell-grant picker (Magic Initiate): choose a list + cantrips + a 1st-level spell */}
            {featSpellSpec && (
              <FeatSpellGrantPicker
                spec={featSpellSpec}
                value={featSpellGrant}
                onChange={setFeatSpellGrant}
                campaignId={campaign?.id}
                testIdPrefix="lvl-feat-spell"
              />
            )}

            {/* Maneuver-grant picker (Martial Adept): pick N maneuvers, excluding any already known */}
            {featManeuverSpec && (
              <FeatManeuverPicker
                spec={featManeuverSpec}
                value={featManeuverPicks}
                onChange={setFeatManeuverPicks}
                edition={edition}
                knownManeuvers={knownManeuvers}
                testIdPrefix="lvl-feat-maneuver"
              />
            )}
          </div>
        )}

        {/* ── Step: Spells (known casters) ── */}
        {STEPS[step] === 'spells' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              As a <span className="font-medium text-foreground">{character.char_class}</span>, you choose your
              spells when you level up. At level {newLevel} you should know{' '}
              {cantripsTarget != null && (
                <><span className="font-medium text-foreground">{cantripsTarget}</span> cantrips and </>
              )}
              <span className="font-medium text-foreground">{knownTarget ?? '—'}</span> spells.
              {' '}You may also <span className="font-medium text-foreground">replace</span> one spell you already know — remove it and add another.
            </p>

            {cantripsTarget != null && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Cantrips</span>
                  <span className={cn('text-xs', cantrips.length > cantripsTarget ? 'text-amber-600' : 'text-muted-foreground')}>
                    {cantrips.length}/{cantripsTarget}
                  </span>
                </div>
                <SpellList
                  spells={cantrips}
                  onAdd={n => setCantrips(c => addUnique(c, n))}
                  onRemove={n => setCantrips(c => removeName(c, n))}
                  label="Cantrips Known"
                  placeholder="Add cantrip…"
                  isCantrips
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Spells</span>
                <span className={cn('text-xs', knownTarget != null && knownSpells.length > knownTarget ? 'text-amber-600' : 'text-muted-foreground')}>
                  {knownSpells.length}{knownTarget != null ? `/${knownTarget}` : ''}
                </span>
              </div>
              <SpellList
                spells={knownSpells}
                onAdd={n => setKnownSpells(s => addUnique(s, n))}
                onRemove={n => setKnownSpells(s => removeName(s, n))}
                label="Spells Known"
                placeholder="Add spell…"
              />
            </div>
          </div>
        )}

        {/* ── Step: Subclass Grants (proficiency picks + class-pool picks) ── */}
        {STEPS[step] === 'subclass-grants' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your <span className="font-medium text-foreground">{effectiveSubclass}</span> subclass lets you make a new
              choice. Options you already have are hidden so you can't double up.
            </p>
            {subclassGrantList.map((g) => {
              const opts = availableGrantOptions(g, character.character_data ?? {}, { charClass: character.char_class });
              const chosen = grantPicks[g.key] || [];
              // Described options (fighting styles) → OptionCardPicker; plain options (artisan
              // tools) → a compact toggle grid that supports count > 1.
              const described = g.options.some((o) => o.description);
              return (
                <div key={g.key} className="space-y-2" data-testid={`subclass-grant-${g.key}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className={cn('text-xs', chosen.length === g.count ? 'text-muted-foreground' : 'text-amber-600')}>
                      {chosen.length}/{g.count}
                    </span>
                  </div>
                  {described ? (
                    <OptionCardPicker
                      options={opts}
                      value={chosen[0] ?? ''}
                      onChange={(v) => setGrantPicks((prev) => ({ ...prev, [g.key]: v ? [v] : [] }))}
                    />
                  ) : (
                    <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5">
                      {opts.map((o) => {
                        const isSel = chosen.includes(o.value);
                        const atLimit = chosen.length >= g.count && !isSel;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            disabled={atLimit}
                            onClick={() => toggleGrant(g.key, o.value, g.count)}
                            data-testid={`subclass-grant-opt-${g.key}-${o.value}`}
                            className={cn(
                              'rounded-md border px-2 py-1.5 text-xs text-left transition-colors',
                              isSel ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                              atLimit && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {o.value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {opts.length === 0 && (
                    <span className="text-xs text-muted-foreground">You already have every option in this pool.</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step: Maneuvers (Battle Master) ── */}
        {STEPS[step] === 'maneuvers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Your Battle Master learns <span className="font-medium text-foreground">{maneuverDelta}</span> new
                maneuver{maneuverDelta === 1 ? '' : 's'}{maneuverReplace ? ' (+1 to replace one)' : ''}. Choose below — locked in once you level up.
              </p>
              <span
                className={cn('text-xs shrink-0 ml-2', maneuverPicks.length === maneuverTarget ? 'text-muted-foreground' : 'text-amber-600')}
                data-testid="maneuvers-picked"
              >
                {maneuverPicks.length}/{maneuverTarget}
              </span>
            </div>
            <ReplaceOneSelect
              label="maneuver"
              options={knownManeuvers}
              value={maneuverReplace}
              onChange={(v) => { setManeuverReplace(v); setManeuverPicks([]); }}
              testId="maneuver-replace"
            />
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {getManeuvers(edition)
                .filter((m) => !knownManeuvers.includes(m.name))
                .map((m) => {
                  const sel = maneuverPicks.includes(m.name);
                  const atLimit = !sel && maneuverPicks.length >= maneuverTarget;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      disabled={atLimit}
                      onClick={() => toggleManeuver(m.name)}
                      data-testid={`lvl-maneuver-${m.name}`}
                      className={cn(
                        'w-full rounded-md border p-2.5 text-left transition-colors',
                        sel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                        atLimit && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="font-medium text-sm">{m.name}</span>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── Step: Level choices (Metamagic, etc.) ── */}
        {STEPS[step] === 'level-choices' && (
          <div className="space-y-4">
            {levelChoices.map((c) => {
              const opts = availablePoolOptions(c, character.character_data ?? {}, newLevel);
              const chosen = levelChoicePicks[c.key] || [];
              const required = levelChoiceRequired(c);
              return (
                <div key={c.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Your <span className="font-medium text-foreground">{character.char_class}</span> learns{' '}
                      <span className="font-medium text-foreground">{required}</span> {c.label} option{required === 1 ? '' : 's'}.
                      Choose below — options you already have are hidden.
                    </p>
                    <span
                      className={cn('text-xs shrink-0 ml-2', chosen.length >= required ? 'text-muted-foreground' : 'text-amber-600')}
                      data-testid={`level-choice-count-${c.key}`}
                    >
                      {chosen.length}/{required}
                    </span>
                  </div>
                  <ReplaceOneSelect
                    label={c.label}
                    options={character.character_data?.[c.storeField] ?? []}
                    value={levelChoiceReplace[c.key] || ''}
                    onChange={(v) => {
                      setLevelChoiceReplace((prev) => ({ ...prev, [c.key]: v }));
                      setLevelChoicePicks((prev) => ({ ...prev, [c.key]: [] }));
                    }}
                    testId={`level-choice-replace-${c.key}`}
                  />
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1" data-testid={`level-choice-${c.key}`}>
                    {opts.map((o) => {
                      const sel = chosen.includes(o.name);
                      const atLimit = !sel && chosen.length >= required;
                      return (
                        <button
                          key={o.name}
                          type="button"
                          disabled={atLimit}
                          onClick={() => toggleLevelChoice(c.key, o.name, required)}
                          data-testid={`level-choice-${c.key}-${o.name}`}
                          className={cn(
                            'w-full rounded-md border p-2.5 text-left transition-colors',
                            sel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                            atLimit && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className="font-medium text-sm">{o.name}</span>
                          {o.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{o.description}</p>
                          )}
                        </button>
                      );
                    })}
                    {opts.length === 0 && (
                      <span className="text-xs text-muted-foreground">You already know all available options.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {STEPS[step] === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                <Star className="h-4 w-4" />
                Level {character.level} → Level {newLevel}
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class</span>
                  <span className="font-medium">{character.char_class}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HP gained</span>
                  <span className="font-medium text-green-600">
                    +{hpGain ?? '—'}
                    {hpGain != null && (
                      <span className="text-muted-foreground font-normal ml-1" data-testid="confirm-hp-breakdown">
                        ({hpMethodLabel}{conAfter !== 0 ? ` + ${conAfter} CON` : ''}
                        {retroHp !== 0 ? ` ${retroHp > 0 ? '+' : '−'} ${Math.abs(retroHp)} retroactive CON` : ''}
                        {hpBonusRows.map(b => ` + ${b.perLevel} ${b.source}`).join('')})
                      </span>
                    )}
                  </span>
                </div>
                {effectiveNewMax != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New HP max</span>
                    <span className="font-medium">{effectiveNewMax}</span>
                  </div>
                )}
                {subclassChoice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subclass chosen</span>
                    <span className="font-medium text-primary">{subclassChoice}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New features</span>
                  <span className="font-medium">{features.length === 0 ? 'None' : features.map(f => f.name).join(', ')}</span>
                </div>
                {needsSubclassGrants && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{subclassGrantsLabel}</span>
                    <span className="font-medium">
                      {subclassGrantList.flatMap(g => grantPicks[g.key] || []).join(', ') || '—'}
                    </span>
                  </div>
                )}
                {wantsAsiStep && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ability scores</span>
                    <span className="font-medium">
                      {ABILITIES.filter((a) => asiAlloc[a.key]).map((a) => `${a.label} +${asiAlloc[a.key]}`).join(', ') || '—'}
                    </span>
                  </div>
                )}
                {wantsFeatStep && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Feat</span>
                    <span className="font-medium text-primary" data-testid="confirm-feat">
                      {featPick?.name || '—'}
                      {featAbilityChoice && featAbilityPick && (
                        <span className="text-muted-foreground font-normal ml-1">(+{featAbilityChoice.amount} {ABILITY_LABEL[featAbilityPick]})</span>
                      )}
                    </span>
                  </div>
                )}
                {needsManeuvers && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New maneuvers</span>
                    <span className="font-medium">{maneuverPicks.join(', ') || '—'}</span>
                  </div>
                )}
                {needsLevelChoices && levelChoices.map((c) => (
                  <div key={c.key} className="flex justify-between">
                    <span className="text-muted-foreground">New {c.label}</span>
                    <span className="font-medium" data-testid={`confirm-level-choice-${c.key}`}>
                      {(levelChoicePicks[c.key] || []).join(', ') || '—'}
                    </span>
                  </div>
                ))}
                {isKnownCaster && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spells known</span>
                    <span className="font-medium">
                      {cantripsTarget != null ? `${cantrips.length} cantrips · ` : ''}{knownSpells.length} spells
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Clicking <span className="font-medium text-foreground">Confirm Level Up</span> will save these changes to your character.
              You can still edit your class sheet after leveling up.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              data-testid="wizard-next"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving ? 'Saving…' : 'Confirm Level Up'}
              {!saving && <Star className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
