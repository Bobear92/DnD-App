import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getManeuvers } from './maneuversData';

/**
 * Acquisition picker for a `maneuver_grant` feat (Martial Adept): the player chooses exactly
 * `spec.count` Battle Master maneuvers, with a `spec.die` superiority die to fuel them.
 *
 * Maneuvers the character ALREADY knows (`knownManeuvers` — a Battle Master's list) are excluded
 * so the feat can't grant a duplicate. Reports the chosen names up via `onChange(string[])`; the
 * LevelUpWizard / Variant Human creation snapshot them onto the feat instance as `choices.maneuvers`.
 */
export default function FeatManeuverPicker({
  spec,
  value = [],
  onChange,
  edition = '5e',
  knownManeuvers = [],
  testIdPrefix = 'feat-maneuver',
}) {
  if (!spec) return null;
  const known = new Set((knownManeuvers || []).map((n) => String(n)));
  const options = getManeuvers(edition).filter((m) => !known.has(m.name));
  const picks = value || [];

  const toggle = (name) => {
    if (picks.includes(name)) return onChange?.(picks.filter((n) => n !== name));
    if (picks.length >= spec.count) return; // at the feat's pick limit
    onChange?.([...picks, name]);
  };

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3" data-testid={`${testIdPrefix}-picker`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Maneuvers</span>
        <span
          className={cn('text-xs', picks.length === spec.count ? 'text-muted-foreground' : 'text-amber-600')}
          data-testid={`${testIdPrefix}-count`}
        >
          {picks.length}/{spec.count}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose {spec.count} Battle Master maneuver{spec.count === 1 ? '' : 's'}, fueled by one {spec.die} superiority die
        (regained on a short or long rest).
        {known.size > 0 && ' Maneuvers you already know are hidden.'}
      </p>
      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
        {options.map((m) => {
          const sel = picks.includes(m.name);
          const atLimit = !sel && picks.length >= spec.count;
          return (
            <button
              key={m.name}
              type="button"
              disabled={atLimit}
              onClick={() => toggle(m.name)}
              data-testid={`${testIdPrefix}-${m.name}`}
              className={cn(
                'w-full rounded-md border p-2.5 text-left transition-colors',
                sel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                atLimit && 'opacity-40 cursor-not-allowed',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{m.name}</span>
                {sel && <Badge className="text-[10px] bg-emerald-600 text-white">Chosen</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
