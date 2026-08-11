/**
 * RestUseControl — the compact "N/M · − · Use" cluster for a single rest-rechargeable
 * resource, with the confirmation dialog that tells the player when it recharges.
 *
 * Extracted from RacialResourceTracker so the SAME control can sit either in a tracker
 * row (Stats tab's Racial Features card) or inline on a spell row (the Spells tab, where
 * a leveled racial spell like Infernal Legacy's Hellish Rebuke is its own use-counter).
 * One control, one dialog, one set of semantics — the two surfaces can't drift.
 *
 * Props:
 *   label     string   the resource's name, used in the dialog copy + aria labels
 *   recharge  'short' | 'long'
 *   used      number   uses already spent
 *   max       number   total uses
 *   onUsedChange (next) => void   called with the new `used` count
 *   readOnly  boolean  hides both controls, leaving the read-out
 *   testId    string   data-testid for the confirm button (defaults to the racial one)
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

const rechargeText = (recharge) =>
  recharge === 'short' ? 'a short or long rest' : 'a long rest';

export default function RestUseControl({
  label,
  recharge = 'long',
  used = 0,
  max = 1,
  onUsedChange,
  readOnly = false,
  testId = 'racial-use-confirm-button',
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const remaining = Math.max(0, max - used);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-sm font-bold tabular-nums">
        {remaining}/{max}
      </span>
      {!readOnly && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
            disabled={used <= 0}
            onClick={() => onUsedChange?.(used - 1)}
            aria-label={`Recover ${label}`}
          >
            −
          </button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            disabled={remaining <= 0}
            onClick={() => setConfirmOpen(true)}
            aria-label={`Use ${label}`}
          >
            Use
          </Button>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Use {label}?</DialogTitle>
            <DialogDescription>
              {label} will be available again after {rechargeText(recharge)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              data-testid={testId}
              onClick={() => {
                onUsedChange?.(used + 1);
                setConfirmOpen(false);
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
