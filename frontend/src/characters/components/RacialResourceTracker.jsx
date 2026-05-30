/**
 * RacialResourceTracker — use-counter widget for rest-rechargeable racial
 * traits (Breath Weapon, Relentless Endurance, Drow Magic, Infernal Legacy …).
 *
 * Reads/writes `<key>_used` counters in character_data via onChange patches.
 * Renders nothing when the character has no applicable racial rest resources,
 * so it can be dropped into any sheet/card unconditionally.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { getRacialRestResources } from './racialRestResources';

export default function RacialResourceTracker({
  traits = [],
  level = 1,
  data = {},
  onChange,
  readOnly = false,
}) {
  const resources = getRacialRestResources(traits, level);
  if (resources.length === 0) return null;

  const set = (key, value) => onChange?.({ [key]: value });

  return (
    <div className="space-y-2" data-testid="racial-resource-tracker">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        Racial Features
      </Label>
      <div className="space-y-1.5">
        {resources.map((r) => {
          const used = data[r.key] ?? 0;
          const remaining = Math.max(0, r.max - used);
          const rechargeLabel = r.recharge === 'short' ? 'Short or long rest' : 'Long rest';
          return (
            <div
              key={r.key}
              className="flex items-center justify-between rounded-md border px-3 py-2"
              data-testid={`racial-resource-${r.key}`}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">
                  {r.note} · {rechargeLabel}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className="text-sm font-bold tabular-nums">
                  {remaining}/{r.max}
                </span>
                {!readOnly && (
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used <= 0}
                      onClick={() => set(r.key, used - 1)}
                      aria-label={`Recover ${r.label}`}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used >= r.max}
                      onClick={() => set(r.key, used + 1)}
                      aria-label={`Use ${r.label}`}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
