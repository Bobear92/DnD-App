import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import { availablePoolOptions, poolOptionDescription } from '@/characters/components/classData/levelChoicesData';
import Field from '@/characters/components/sheets/Field';

/**
 * KnownOptionsBlock — the read-only display for any levelChoicesData pool: the options the
 * character has learned, with descriptions, plus an owed-slot picker.
 *
 * Deliberately NOT a per-subclass panel. Arcane Shot needed exactly the display half of
 * BattleMasterPanel (known options + a derived save DC), and forking a second bespoke panel is
 * the breadth-before-vertical trap. So this is pool-agnostic and driven off the choice entry:
 * it already serves Arcane Shot and will serve Metamagic / Eldritch Invocations the moment the
 * Sorcerer and Warlock migrate to configs.
 *
 * Same acquisition rule as maneuvers: options are chosen at LEVEL-UP (the LevelUpWizard) and
 * shown locked here. A character who knows FEWER than they should (leveled before the feature
 * existed, GM import) can fill the owed slots inline; only GM Edit can remove one.
 *
 * Per-choice optional fields it honors (see levelChoicesData):
 *   improvementAt  — level from which each option's `improvedDescription` replaces its
 *                    description (the upgraded dice are written INTO the option text, so the
 *                    player reads one paragraph rather than a base effect plus a rider)
 *   derived(level, scores) → { label, value, note }  — one computed line (Arcane Shot save DC)
 */
export default function KnownOptionsBlock({
  choices = [], data = {}, onChange, level = 1, readOnly = false, gmEdit = false, scores = {},
}) {
  if (choices.length === 0) return null;
  return (
    <>
      {choices.map((choice) => {
        const known = data[choice.storeField] || [];
        const owed = !readOnly && known.length < choice.count;
        const editable = !readOnly && (gmEdit || owed);
        const byName = new Map(choice.pool.map((o) => [o.name, o]));
        const improved = choice.improvementAt != null && level >= choice.improvementAt;
        const derived = choice.derived?.(level, scores);
        const remaining = choice.count - known.length;

        return (
          <Field key={choice.key} label={choice.label}>
            <div className="space-y-2" data-testid={`known-options-${choice.key}`}>
              {derived && (
                <div className="rounded-md border p-3 space-y-0.5">
                  <p className="text-sm" data-testid={`known-options-${choice.key}-derived`}>
                    {derived.label} <span className="font-semibold">{derived.value}</span>
                  </p>
                  {derived.note && (
                    <p className="text-xs text-muted-foreground" data-testid={`known-options-${choice.key}-derived-note`}>
                      {derived.note}
                    </p>
                  )}
                </div>
              )}

              {!readOnly && (
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs', owed ? 'text-amber-600' : 'text-muted-foreground')}
                    data-testid={`known-options-${choice.key}-count`}>
                    {known.length}/{choice.count} chosen
                  </span>
                </div>
              )}

              {owed && !gmEdit && (
                <p className="text-xs text-amber-600" data-testid={`known-options-${choice.key}-owed`}>
                  Choose {remaining} more.
                </p>
              )}
              {!readOnly && !editable && (
                <p className="text-xs text-muted-foreground" data-testid={`known-options-${choice.key}-locked`}>
                  Chosen at level-up and can't be changed here.
                </p>
              )}

              {known.length === 0 && !owed && <div className="text-sm py-2">—</div>}

              {known.map((name) => {
                const opt = byName.get(name);
                const showImproved = improved && !!opt?.improvedDescription;
                return (
                  <div key={name} className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{name}</span>
                      {/* The badge is the only marker that this text is the upgraded version —
                          the upgrade itself is written into the description below. */}
                      {showImproved && (
                        <Badge variant="outline" className="text-[10px]">Improved</Badge>
                      )}
                      {gmEdit && !readOnly && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-destructive"
                          data-testid={`known-options-${choice.key}-remove-${name}`}
                          onClick={() => onChange?.({
                            [choice.storeField]: known.filter((n) => n !== name),
                          })}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {opt && (
                      <p
                        className="text-xs text-muted-foreground leading-relaxed"
                        data-testid={showImproved ? `known-options-${choice.key}-improved-${name}` : undefined}
                      >
                        {poolOptionDescription(choice, opt, level)}
                      </p>
                    )}
                  </div>
                );
              })}

              {editable && known.length < choice.count && (
                <OptionCardPicker
                  options={availablePoolOptions(choice, data, level)
                    .map((o) => ({ value: o.name, description: poolOptionDescription(choice, o, level) }))}
                  value=""
                  onChange={(v) => v && onChange?.({ [choice.storeField]: [...known, v] })}
                />
              )}
            </div>
          </Field>
        );
      })}
    </>
  );
}
