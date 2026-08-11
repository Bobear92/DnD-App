/**
 * RacialResourceTracker — use-counter widget for rest-rechargeable racial
 * traits (Breath Weapon, Relentless Endurance, Drow Magic, Infernal Legacy …).
 *
 * Reads/writes `<key>_used` counters in character_data via onChange patches.
 * Renders nothing when the character has no applicable racial rest resources,
 * so it can be dropped into any sheet/card unconditionally.
 *
 * Clicking "Use" opens a confirmation dialog before expending a use, telling
 * the player when the resource recharges (short/long rest). The "−" button
 * recovers a use without confirmation. Both controls are hidden when readOnly.
 *
 * `includeKeys` / `excludeKeys` (optional) filter which resource keys render,
 * so the same widget can split one resource (e.g. Breath Weapon) into a
 * different tab from the rest.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { getRacialRestResources } from '@/characters/components/race/racialRestResources';
import RestUseControl from '@/characters/components/race/RestUseControl';

export default function RacialResourceTracker({
  traits = [],
  level = 1,
  data = {},
  onChange,
  readOnly = false,
  includeKeys,
  excludeKeys,
}) {
  let resources = getRacialRestResources(traits, level);
  if (includeKeys) resources = resources.filter((r) => includeKeys.includes(r.key));
  if (excludeKeys) resources = resources.filter((r) => !excludeKeys.includes(r.key));
  if (resources.length === 0) return null;

  const set = (key, value) => onChange?.({ [key]: value });

  return (
    <div className="space-y-2" data-testid="racial-resource-tracker">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
        Racial Features
      </Label>
      <div className="space-y-1.5">
        {resources.map((r) => {
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
              <div className="ml-3">
                <RestUseControl
                  label={r.label}
                  recharge={r.recharge}
                  used={data[r.key] ?? 0}
                  max={r.max}
                  onUsedChange={(next) => set(r.key, next)}
                  readOnly={readOnly}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
