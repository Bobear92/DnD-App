/**
 * RestResourceTracker — use-button widget for class features that recharge on a rest
 * (Second Wind, Action Surge, Indomitable, …). Mirrors RacialResourceTracker's pattern:
 * clicking "Use" opens a confirmation dialog warning when it recharges, the "−" button
 * recovers a use, and only a GM-triggered rest restores them in bulk (backend).
 *
 * Driven by a class config's `restResources` list via useRestResource.
 *
 * `RestResourceControl` is the reusable per-resource control (− / Use + confirm dialog).
 * It's exported so other views (e.g. the Action Economy tab) can attach the same Use
 * mechanic to a single resource without re-rendering the whole tracker list.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useRestResource } from '@/characters/components/sheets/classSheet/hooks/useRestResource';

const rechargeText = (recharge) =>
  recharge === 'short' ? 'a short or long rest' : 'a long rest';

/**
 * One resource's − / Use controls + the confirm dialog. Renders the count when
 * `showRemaining` (default true). `idPrefix` namespaces the confirm-button test id so
 * multiple instances on the page don't collide.
 */
export function RestResourceControl({ row, onChange, readOnly = false, showRemaining = true, idPrefix = 'rest' }) {
  const [confirm, setConfirm] = useState(false);
  const set = (value) => onChange?.({ [row.key]: value });

  return (
    <div className="flex items-center gap-2">
      {showRemaining && (
        <span className="text-xs text-muted-foreground">{row.remaining} / {row.total} remaining</span>
      )}
      {!readOnly && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
            disabled={row.used <= 0}
            onClick={() => set(row.used - 1)}
            aria-label={`Recover ${row.label}`}
          >
            −
          </button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            disabled={row.remaining <= 0}
            onClick={() => setConfirm(true)}
            aria-label={`Use ${row.label}`}
          >
            Use
          </Button>
        </div>
      )}

      <Dialog open={confirm} onOpenChange={(open) => !open && setConfirm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Use {row.label}?</DialogTitle>
            <DialogDescription>
              This won't come back until {rechargeText(row.recharge)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              data-testid={`${idPrefix}-use-confirm-button`}
              onClick={() => { set(row.used + 1); setConfirm(false); }}
            >
              Use
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RestResourceTracker({ resources = [], level = 1, data = {}, onChange, readOnly = false }) {
  const rows = useRestResource({ resources, level, data });
  if (rows.length === 0) return null;

  return (
    <div className="space-y-1.5" data-testid="rest-resource-tracker">
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          data-testid={`rest-resource-${r.key}`}
        >
          <div className="min-w-0">
            <div className="text-sm font-medium">{r.label}</div>
            {r.description && (
              <div className="text-xs text-muted-foreground leading-snug" data-testid={`rest-resource-desc-${r.key}`}>
                {r.description}
              </div>
            )}
          </div>
          <RestResourceControl row={r} onChange={onChange} readOnly={readOnly} idPrefix="rest" />
        </div>
      ))}
    </div>
  );
}
