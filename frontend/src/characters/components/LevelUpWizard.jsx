import React, { useState, useMemo } from 'react';
import { Dices, ChevronRight, ChevronLeft, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { HIT_DICE_5E, CLASS_FEATURES_5E } from './classFeatures5e';
import { HIT_DICE_2024, CLASS_FEATURES_2024 } from './classFeatures2024';

function conMod(score) { return Math.floor((score - 10) / 2); }

const STEPS = ['hp', 'features', 'confirm'];
const STEP_LABELS = ['Hit Points', 'New Features', 'Confirm'];

export default function LevelUpWizard({ character, campaign, onComplete, onClose }) {
  const edition = campaign?.edition || '5e';
  const is2024 = edition === '5.5e';

  const HIT_DICE = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
  const CLASS_FEATURES = is2024 ? CLASS_FEATURES_2024 : CLASS_FEATURES_5E;

  const newLevel = (character.level ?? 1) + 1;
  const hitDie = HIT_DICE[character.char_class] ?? 8;
  const con = conMod(character.constitution ?? 10);
  const average = Math.floor(hitDie / 2) + 1;

  const features = useMemo(() => {
    const classFeats = CLASS_FEATURES[character.char_class];
    if (!classFeats) return [];
    return classFeats[newLevel] ?? [];
  }, [character.char_class, newLevel, CLASS_FEATURES]);

  const currentHpMax = character.character_data?.hp_max ?? null;

  const [step, setStep] = useState(0); // index into STEPS
  const [hpChoice, setHpChoice] = useState(null); // 'roll' | 'average'
  const [rolledValue, setRolledValue] = useState(null);
  const [saving, setSaving] = useState(false);

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
    return true;
  };

  const handleConfirm = async () => {
    setSaving(true);
    const newCharacterData = {
      ...(character.character_data ?? {}),
      ...(newHpMax != null ? { hp_max: newHpMax } : {}),
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New features</span>
                  <span className="font-medium">{features.length === 0 ? 'None' : features.map(f => f.name).join(', ')}</span>
                </div>
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
