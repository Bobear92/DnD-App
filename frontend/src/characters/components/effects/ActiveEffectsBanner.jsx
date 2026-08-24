import React from 'react';
import { Button } from '@/components/ui/button';
import {
  getActiveEffectDefs, isEffectActive, toggleEffectPatch,
} from '@/characters/components/effects/activeEffects';

/**
 * The running-effects strip, shown above the tabs on the character sheet.
 *
 * It sits OUTSIDE the tabs on purpose: an active effect changes numbers on several tabs at once
 * (Giant's Might moves your size, two advantage sources and a damage die), so "am I transformed
 * right now?" has to be answerable without hunting for the card that started it. It also gives
 * the effect's derived numbers their only home — creature SIZE is otherwise computed and never
 * displayed anywhere in the app, so growing Large was previously invisible to the reader.
 *
 * Renders nothing at all when no effect is running: a permanent "no effects active" card would
 * be noise on every sheet in the app, and only a handful of characters can ever have one.
 *
 * Ending an effect here does exactly what ending it on its card does — it never refunds the use,
 * because nothing tracks duration and the charge was spent when the feature fired.
 */
export default function ActiveEffectsBanner({
  characterData = {}, charClass, subclass, level = 1, edition = '5e',
  onChange, readOnly = false,
}) {
  const running = getActiveEffectDefs({ charClass, subclass, level, edition })
    .filter((e) => isEffectActive(characterData, e.key));
  if (running.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="active-effects-banner">
      {running.map((e) => (
        <div
          key={e.key}
          className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2"
          data-testid={`active-effect-${e.key}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{e.label}</span>
              <span className="text-[11px] uppercase tracking-wide text-primary">Active</span>
              {e.duration && (
                <span className="text-[11px] text-muted-foreground">Lasts {e.duration}</span>
              )}
            </div>
            {/* The effect's actual numbers, read off the same definition the consumers use — so
                the banner can't claim a size or a die the rest of the sheet disagrees with. */}
            <p className="text-xs text-muted-foreground" data-testid={`active-effect-summary-${e.key}`}>
              {e.summary(level)}
            </p>
          </div>
          {onChange && !readOnly && (
            <Button
              type="button" size="sm" variant="outline"
              onClick={() => onChange(toggleEffectPatch(characterData, e.key, false))}
              data-testid={`active-effect-end-${e.key}`}
            >
              End
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
