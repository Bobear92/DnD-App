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
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { getRacialRestResources } from '@/characters/components/race/racialRestResources';

const rechargeText = (recharge) =>
  recharge === 'short' ? 'a short or long rest' : 'a long rest';

export default function RacialResourceTracker({
  traits = [],
  level = 1,
  data = {},
  onChange,
  readOnly = false,
  includeKeys,
  excludeKeys,
}) {
  // Pending use awaiting confirmation: a resource object or null
  const [useConfirm, setUseConfirm] = useState(null);

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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used <= 0}
                      onClick={() => set(r.key, used - 1)}
                      aria-label={`Recover ${r.label}`}
                    >
                      −
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                      disabled={remaining <= 0}
                      onClick={() => setUseConfirm(r)}
                      aria-label={`Use ${r.label}`}
                    >
                      Use
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!useConfirm} onOpenChange={(open) => !open && setUseConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Use {useConfirm?.label}?</DialogTitle>
            <DialogDescription>
              {useConfirm?.label} will be available again after {rechargeText(useConfirm?.recharge)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setUseConfirm(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              data-testid="racial-use-confirm-button"
              onClick={() => {
                if (useConfirm) set(useConfirm.key, (data[useConfirm.key] ?? 0) + 1);
                setUseConfirm(null);
              }}
            >
              Use
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
