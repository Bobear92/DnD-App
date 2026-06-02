/**
 * RestResourceTracker — use-button widget for class features that recharge on a rest
 * (Second Wind, Action Surge, Indomitable, …). Mirrors RacialResourceTracker's pattern:
 * clicking "Use" opens a confirmation dialog warning when it recharges, the "−" button
 * recovers a use, and only a GM-triggered rest restores them in bulk (backend).
 *
 * Driven by a class config's `restResources` list via useRestResource.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useRestResource } from './hooks/useRestResource';

const rechargeText = (recharge) =>
  recharge === 'short' ? 'a short or long rest' : 'a long rest';

export default function RestResourceTracker({ resources = [], level = 1, data = {}, onChange, readOnly = false }) {
  const [useConfirm, setUseConfirm] = useState(null);
  const rows = useRestResource({ resources, level, data });
  if (rows.length === 0) return null;

  const set = (key, value) => onChange?.({ [key]: value });

  return (
    <div className="space-y-1.5" data-testid="rest-resource-tracker">
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-center justify-between rounded-md border px-3 py-2"
          data-testid={`rest-resource-${r.key}`}
        >
          <span className="text-sm font-medium">{r.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{r.remaining} / {r.total} remaining</span>
            {!readOnly && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  disabled={r.used <= 0}
                  onClick={() => set(r.key, r.used - 1)}
                  aria-label={`Recover ${r.label}`}
                >
                  −
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  disabled={r.remaining <= 0}
                  onClick={() => setUseConfirm(r)}
                  aria-label={`Use ${r.label}`}
                >
                  Use
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}

      <Dialog open={!!useConfirm} onOpenChange={(open) => !open && setUseConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Use {useConfirm?.label}?</DialogTitle>
            <DialogDescription>
              This won't come back until {rechargeText(useConfirm?.recharge)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setUseConfirm(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              data-testid="rest-use-confirm-button"
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
