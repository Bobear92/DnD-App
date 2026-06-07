import React, { useState, useMemo } from 'react';
import { Dices, ChevronRight, ChevronLeft, Star, Check, Lock, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { HIT_DICE_5E, CLASS_FEATURES_5E } from './classFeatures5e';
import { HIT_DICE_2024, CLASS_FEATURES_2024 } from './classFeatures2024';
import {
  SUBCLASS_UNLOCK_LEVEL_5E, SUBCLASS_UNLOCK_LEVEL_2024,
  SUBCLASS_OPTIONS_5E, SUBCLASS_OPTIONS_2024,
} from './classChoicesData';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SpellList from './SpellList';
import { CLASS_PROGRESSION } from './classProgressionTables';
import { getClassConfig } from './classSheet/configs';
import { getHpBonusesPerLevel, totalHpBonus } from './combatBonuses';
import {
  getSubclassProficiencyGrants, availableOptions, applyProficiencyChoice,
} from './subclassProficiencyData';
import { getManeuvers, maneuversKnownAtLevel } from './maneuversData';

function conMod(score) { return Math.floor((score - 10) / 2); }

// Known casters choose their spells at level-up (vs. prepared casters who swap each long rest).
const KNOWN_CASTERS = new Set(['Bard', 'Sorcerer', 'Warlock']);

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

  const currentHpMax = character.character_data?.hp_max ?? null;

  // Ability Score Improvement: every class gains the "Ability Score Improvement" feature
  // at its ASI levels (4/8/12/16/19, +6/14 Fighter, +10 Rogue) — detect it from the
  // feature list so the wizard prompts for the increase. (Class-agnostic.)
  const needsAsi = features.some((f) => /ability score improvement/i.test(f.name || ''));

  const [step, setStep] = useState(0);
  const [hpChoice, setHpChoice] = useState(null); // 'roll' | 'average' | 'manual'
  const [rolledValue, setRolledValue] = useState(null);
  const [manualValue, setManualValue] = useState(''); // 'roll at the table' — typed d{hitDie} result
  const [subclassChoice, setSubclassChoice] = useState('');
  const [cantrips, setCantrips] = useState(character.character_data?.cantrips ?? []);
  const [knownSpells, setKnownSpells] = useState(character.character_data?.known_spells ?? []);
  const [profChoices, setProfChoices] = useState({}); // { [grant.key]: [chosen names] }
  const [asiAlloc, setAsiAlloc] = useState({}); // { [abilityKey]: 0|1|2 } — points added this ASI
  const [maneuverPicks, setManeuverPicks] = useState([]); // new maneuvers chosen this level-up
  const [saving, setSaving] = useState(false);

  // Subclass proficiency grants gained at this level (uses the subclass chosen in this
  // wizard, or the existing one for grants at later levels). Drives the Proficiencies step.
  const effectiveSubclass = subclassChoice || character.character_data?.subclass;
  const profGrants = getSubclassProficiencyGrants(character.char_class, edition, effectiveSubclass, newLevel);
  const needsProficiencies = profGrants.length > 0;

  // Battle Master learns new maneuvers at certain levels (3/7/10/15) — choose the delta.
  const knownManeuvers = character.character_data?.maneuvers ?? [];
  const maneuverDelta = effectiveSubclass === 'Battle Master'
    ? Math.max(0, maneuversKnownAtLevel(newLevel) - maneuversKnownAtLevel(character.level ?? 1))
    : 0;
  const needsManeuvers = maneuverDelta > 0;

  const STEPS = [
    'hp',
    ...(needsSubclass ? ['subclass'] : []),
    'features',
    ...(needsAsi ? ['asi'] : []),
    ...(isKnownCaster ? ['spells'] : []),
    ...(needsProficiencies ? ['proficiencies'] : []),
    ...(needsManeuvers ? ['maneuvers'] : []),
    'confirm',
  ];
  const STEP_LABELS = [
    'Hit Points',
    ...(needsSubclass ? ['Subclass'] : []),
    'New Features',
    ...(needsAsi ? ['Ability Scores'] : []),
    ...(isKnownCaster ? ['New Spells'] : []),
    ...(needsProficiencies ? ['Proficiencies'] : []),
    ...(needsManeuvers ? ['Maneuvers'] : []),
    'Confirm',
  ];

  const toggleProf = (grantKey, name, max) => {
    setProfChoices((prev) => {
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
  const asiScoreUpdates = () => {
    const out = {};
    for (const a of ABILITIES) {
      const inc = asiAlloc[a.key] || 0;
      if (inc) out[a.key] = (character[a.key] ?? 10) + inc;
    }
    return out;
  };

  const toggleManeuver = (name) => {
    setManeuverPicks((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= maneuverDelta) return prev; // at this level's pick limit
      return [...prev, name];
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
  // These are display-only: the sheet's MaxHpValue adds them on top of the stored hp_max, so the
  // wizard shows them but writes only die+CON into hp_max (writing them too would double-count).
  const hpBonusArgs = {
    charClass: character.char_class,
    subclass: character.character_data?.subclass,
    raceTraits: character.character_data?.race_traits ?? [],
    feats: character.character_data?.feats ?? [],
  };
  const hpBonusRows = getHpBonusesPerLevel(hpBonusArgs);          // [{ source, detail, perLevel }]
  const perLevelHpBonus = hpBonusRows.reduce((s, b) => s + b.perLevel, 0);

  // Stored gain (written to hp_max): die + CON, min 1. Displayed gain adds the passive bonuses.
  const storedGain = hpDieResult != null ? Math.max(1, hpDieResult + con) : null;
  const hpGain = storedGain != null ? storedGain + perLevelHpBonus : null;

  const newStoredHpMax = currentHpMax != null && storedGain != null
    ? currentHpMax + storedGain
    : null;
  // Effective (displayed) max HP = stored hp_max + passive bonuses at that level — matches the sheet.
  const effectiveCurrentMax = currentHpMax != null
    ? currentHpMax + totalHpBonus({ ...hpBonusArgs, level: character.level ?? 1 })
    : null;
  const effectiveNewMax = effectiveCurrentMax != null && hpGain != null
    ? effectiveCurrentMax + hpGain
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
    if (STEPS[step] === 'proficiencies') {
      return profGrants.every((g) => (profChoices[g.key]?.length || 0) === g.count);
    }
    if (STEPS[step] === 'asi') return asiTotal === ASI_POINTS;
    if (STEPS[step] === 'maneuvers') return maneuverPicks.length === maneuverDelta;
    return true;
  };

  const handleConfirm = async () => {
    setSaving(true);
    // Merge each subclass proficiency choice into the right character_data field.
    let profPatch = {};
    for (const g of profGrants) {
      profPatch = {
        ...profPatch,
        ...applyProficiencyChoice(g.type, profChoices[g.key] || [], { ...(character.character_data ?? {}), ...profPatch }),
      };
    }
    const newCharacterData = {
      ...(character.character_data ?? {}),
      ...(newStoredHpMax != null ? { hp_max: newStoredHpMax } : {}),
      ...(subclassChoice ? { subclass: subclassChoice } : {}),
      ...(isKnownCaster ? { cantrips, known_spells: knownSpells } : {}),
      ...profPatch,
      ...(needsManeuvers ? { maneuvers: [...knownManeuvers, ...maneuverPicks] } : {}),
    };
    // Ability Score Improvements update top-level character fields, passed as a 3rd arg
    // (only when there are increases, so existing 2-arg callers/tests are unaffected).
    const scoreUpdates = needsAsi ? asiScoreUpdates() : {};
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

            {features.length === 0 ? (
              <div className="rounded-md border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                No new class features at this level.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {features.map((feat, i) => (
                  <div key={i} className="rounded-md border bg-card p-3 space-y-1.5">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {feat.name}
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

        {/* ── Step: Proficiencies (subclass grants) ── */}
        {STEPS[step] === 'proficiencies' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your <span className="font-medium text-foreground">{effectiveSubclass}</span> subclass grants a new
              proficiency. Choose below — options you already have are hidden so you can't double up.
            </p>
            {profGrants.map((g) => {
              const opts = availableOptions(g, { charClass: character.char_class, characterData: character.character_data ?? {} });
              const chosen = profChoices[g.key] || [];
              return (
                <div key={g.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{g.label}</span>
                    <span className={cn('text-xs', chosen.length === g.count ? 'text-muted-foreground' : 'text-amber-600')}>
                      {chosen.length}/{g.count}
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5" data-testid={`prof-grant-${g.key}`}>
                    {opts.map((o) => {
                      const isSel = chosen.includes(o);
                      const atLimit = chosen.length >= g.count && !isSel;
                      return (
                        <button
                          key={o}
                          type="button"
                          disabled={atLimit}
                          onClick={() => toggleProf(g.key, o, g.count)}
                          data-testid={`prof-opt-${g.key}-${o}`}
                          className={cn(
                            'rounded-md border px-2 py-1.5 text-xs text-left transition-colors',
                            isSel ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                            atLimit && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          {o}
                        </button>
                      );
                    })}
                    {opts.length === 0 && (
                      <span className="text-xs text-muted-foreground col-span-2">
                        You already have all of these proficiencies.
                      </span>
                    )}
                  </div>
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
                maneuver{maneuverDelta === 1 ? '' : 's'}. Choose below — these are locked in once you level up.
              </p>
              <span
                className={cn('text-xs shrink-0 ml-2', maneuverPicks.length === maneuverDelta ? 'text-muted-foreground' : 'text-amber-600')}
                data-testid="maneuvers-picked"
              >
                {maneuverPicks.length}/{maneuverDelta}
              </span>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {getManeuvers(edition)
                .filter((m) => !knownManeuvers.includes(m.name))
                .map((m) => {
                  const sel = maneuverPicks.includes(m.name);
                  const atLimit = !sel && maneuverPicks.length >= maneuverDelta;
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
                      <span className="text-muted-foreground font-normal ml-1">
                        ({hpMethodLabel}{con !== 0 ? ` + ${con} CON` : ''}
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
                {needsProficiencies && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New proficiencies</span>
                    <span className="font-medium">
                      {profGrants.flatMap(g => profChoices[g.key] || []).join(', ') || '—'}
                    </span>
                  </div>
                )}
                {needsAsi && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ability scores</span>
                    <span className="font-medium">
                      {ABILITIES.filter((a) => asiAlloc[a.key]).map((a) => `${a.label} +${asiAlloc[a.key]}`).join(', ') || '—'}
                    </span>
                  </div>
                )}
                {needsManeuvers && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New maneuvers</span>
                    <span className="font-medium">{maneuverPicks.join(', ') || '—'}</span>
                  </div>
                )}
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
