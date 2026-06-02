import React, { useState, useMemo } from 'react';
import { Dices, ChevronRight, ChevronLeft, Star, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function conMod(score) { return Math.floor((score - 10) / 2); }

// Known casters choose their spells at level-up (vs. prepared casters who swap each long rest).
const KNOWN_CASTERS = new Set(['Bard', 'Sorcerer', 'Warlock']);

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

  const STEPS = [
    'hp',
    ...(needsSubclass ? ['subclass'] : []),
    'features',
    ...(isKnownCaster ? ['spells'] : []),
    'confirm',
  ];
  const STEP_LABELS = [
    'Hit Points',
    ...(needsSubclass ? ['Subclass'] : []),
    'New Features',
    ...(isKnownCaster ? ['New Spells'] : []),
    'Confirm',
  ];

  const features = useMemo(() => {
    const classFeats = config?.features ?? CLASS_FEATURES[character.char_class];
    if (!classFeats) return [];
    return classFeats[newLevel] ?? [];
  }, [character.char_class, newLevel, CLASS_FEATURES, config]);

  const currentHpMax = character.character_data?.hp_max ?? null;

  const [step, setStep] = useState(0);
  const [hpChoice, setHpChoice] = useState(null); // 'roll' | 'average'
  const [rolledValue, setRolledValue] = useState(null);
  const [subclassChoice, setSubclassChoice] = useState('');
  const [cantrips, setCantrips] = useState(character.character_data?.cantrips ?? []);
  const [knownSpells, setKnownSpells] = useState(character.character_data?.known_spells ?? []);
  const [saving, setSaving] = useState(false);

  const addUnique = (list, name) => (list.includes(name) ? list : [...list, name]);
  const removeName = (list, name) => list.filter(s => s !== name);

  const hpGain = hpChoice !== null
    ? (hpChoice === 'roll' ? rolledValue : average) + con
    : null;
  const newHpMax = currentHpMax != null && hpGain != null
    ? currentHpMax + Math.max(1, hpGain)
    : null;

  const roll = () => {
    const result = Math.floor(Math.random() * hitDie) + 1;
    setRolledValue(result);
    setHpChoice('roll');
  };

  const canAdvance = () => {
    if (STEPS[step] === 'hp') return hpChoice !== null;
    if (STEPS[step] === 'subclass') return !!subclassChoice;
    return true;
  };

  const handleConfirm = async () => {
    setSaving(true);
    const newCharacterData = {
      ...(character.character_data ?? {}),
      ...(newHpMax != null ? { hp_max: newHpMax } : {}),
      ...(subclassChoice ? { subclass: subclassChoice } : {}),
      ...(isKnownCaster ? { cantrips, known_spells: knownSpells } : {}),
    };
    await onComplete(newLevel, newCharacterData);
    setSaving(false);
  };

  const stepIndex = step;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Level Up — Reaching Level {newLevel}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full',
                i < stepIndex ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                i === stepIndex ? 'bg-primary/10 text-primary' :
                'text-muted-foreground'
              )}>
                {i < stepIndex
                  ? <Check className="h-3 w-3" />
                  : <span className="w-3 text-center">{i + 1}</span>}
                {STEP_LABELS[i]}
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 bg-border" />
              )}
            </React.Fragment>
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

            <div className="grid grid-cols-2 gap-3">
              {/* Roll option */}
              <button
                type="button"
                onClick={roll}
                className={cn(
                  'rounded-lg border-2 p-4 text-center transition-all hover:shadow-sm',
                  hpChoice === 'roll'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
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
                onClick={() => setHpChoice('average')}
                className={cn(
                  'rounded-lg border-2 p-4 text-center transition-all hover:shadow-sm',
                  hpChoice === 'average'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="text-3xl font-bold text-primary mb-1">{average}</div>
                <div className="font-semibold text-sm">Take Average</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ⌊d{hitDie}/2⌋ + 1 = {average}
                </div>
                {hpChoice === 'average' && (
                  <div className="text-xs text-primary mt-1 font-medium">Selected</div>
                )}
              </button>
            </div>

            {hpGain != null && (
              <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HP die result</span>
                  <span className="font-medium">{hpChoice === 'roll' ? rolledValue : average}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CON modifier</span>
                  <span className="font-medium">{con >= 0 ? `+${con}` : con}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-semibold">
                  <span>HP gained</span>
                  <span className="text-green-600">+{Math.max(1, hpGain)}</span>
                </div>
                {currentHpMax != null && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>New HP max</span>
                    <span>{currentHpMax} → <span className="font-semibold text-foreground">{currentHpMax + Math.max(1, hpGain)}</span></span>
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
            <SubclassPickerWithDetail
              options={subclassOptions}
              value={subclassChoice}
              onChange={setSubclassChoice}
              className={character.char_class}
              edition={subclassEdition}
            />
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
                    +{hpGain != null ? Math.max(1, hpGain) : '—'}
                    {hpChoice && (
                      <span className="text-muted-foreground font-normal ml-1">
                        ({hpChoice === 'roll' ? `rolled ${rolledValue}` : `avg ${average}`}{con !== 0 ? ` + ${con} CON` : ''})
                      </span>
                    )}
                  </span>
                </div>
                {currentHpMax != null && hpGain != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New HP max</span>
                    <span className="font-medium">{currentHpMax + Math.max(1, hpGain)}</span>
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
