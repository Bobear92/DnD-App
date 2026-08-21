/**
 * RestResourceTracker — use-button widget for class features that recharge on a rest
 * (Second Wind, Action Surge, Indomitable, …). Mirrors the spell-slot rule: a player may
 * only SPEND a use (the "Use" button); the count comes back only from a rest (the GM's
 * rest flow, backend). The "−" recover button is a GM-only correction control, gated on
 * `isGm` — a player can never add a use back manually.
 *
 * Driven by a class config's `restResources` list via useRestResource.
 *
 * `RestResourceControl` is the reusable per-resource control (Use + GM-only − + confirm
 * dialog). It's exported so other views (e.g. the Action Economy tab) can attach the same
 * Use mechanic to a single resource without re-rendering the whole tracker list.
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
 * A resource's label without its bookkeeping suffixes — "Psionic Energy Dice — d8 (Long Rest)"
 * becomes "Psionic Energy Dice". Used when one control has to NAME a second resource it touches
 * ("then Psionic Energy Dice 4 / 4"): the full label carries a recharge parenthetical and often
 * an em-dash qualifier, both of which are already stated elsewhere on the card and only make the
 * inline reference unreadable.
 */
export const shortResourceLabel = (label = '') =>
  String(label).split('—')[0].replace(/\s*\([^)]*\)\s*$/, '').trim();

/**
 * RestUseSteppers — the compact − / + stepper the hand-written class sheets use inline for a
 * rest-rechargeable count (rage, ki/focus, channel divinity, wild shape, bardic inspiration,
 * pact slots, divine sense…). Same spend/recover rule as RestResourceControl but without the
 * confirm dialog, so spending a point pool stays one click (a confirm per ki point would be
 * painful). "+" SPENDS a use (increments `<usedKey>`) and is available to the player; "−"
 * RECOVERS a use and is **GM-only** (gated on `isGm`) — a player can never add a use back;
 * the count returns only from a rest (the GM's rest flow, backend). `readOnly` hides both.
 */
export function RestUseSteppers({ usedKey, used = 0, total = 0, onChange, readOnly = false, isGm = false, label = 'resource' }) {
  if (readOnly) return null;
  const set = (value) => onChange?.({ [usedKey]: value });
  return (
    <div className="flex items-center gap-1">
      {isGm && (
        <button
          type="button"
          className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
          onClick={() => set(Math.max(0, used - 1))}
          disabled={used <= 0}
          aria-label={`Recover ${label}`}
        >
          −
        </button>
      )}
      <button
        type="button"
        className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
        onClick={() => set(Math.min(total, used + 1))}
        disabled={used >= total}
        aria-label={`Use ${label}`}
      >
        +
      </button>
    </div>
  );
}

/**
 * One resource's Use control (+ GM-only − recover) + the confirm dialog. Renders the
 * count when `showRemaining` (default true). `idPrefix` namespaces the confirm-button test
 * id so multiple instances on the page don't collide. The "−" recover button appears only
 * for the GM (`isGm`) — a player spends a use and it returns only from a rest.
 *
 * Two optional props let ONE control touch a SECOND resource row. They are deliberately
 * separate props rather than one clever "linked row", because they are opposite operations:
 *
 *   • `fallbackRow` — FREE-USE-THEN-PAY. Some features are free once per rest and cost from a
 *     shared pool every time after that (the Psi Warrior's Telekinetic Movement, Psi-Powered
 *     Leap and Bulwark of Force all spend a Psionic Energy die once their free use is gone).
 *     Use spends `row` while it has a use left, then spends `fallbackRow`, and only goes
 *     disabled when BOTH are empty. Without this the card read "0 / 1 remaining" with a dead
 *     button while the character could still legally use the feature four more times — it
 *     told the player an ability was unavailable when it wasn't.
 *
 *   • `restoresRow` — SPEND-TO-RESTORE. The feature's whole mechanic is handing a use back to
 *     another pool (the Psi Warrior's bonus-action "regain one expended Psionic Energy die").
 *     One atomic patch spends this row's charge and returns one use to `restoresRow`.
 *     This is the ONE sanctioned exception to the app's rule that a player never restores a
 *     resource: the restore is not the player editing a counter, it is the feature firing, and
 *     it is gated behind this row's own once-per-rest charge.
 */
export function RestResourceControl({
  row, onChange, readOnly = false, isGm = false, showRemaining = true, idPrefix = 'rest',
  fallbackRow = null, restoresRow = null,
}) {
  const [confirm, setConfirm] = useState(false);

  // Which row a Use spends from: this one while it has a use left, otherwise the fallback.
  const usingFallback = row.remaining <= 0 && !!fallbackRow && fallbackRow.remaining > 0;
  const spendRow = usingFallback ? fallbackRow : row;
  // Exhausted only when there is nothing left to spend on EITHER row.
  const exhausted = row.remaining <= 0 && !(fallbackRow && fallbackRow.remaining > 0);

  const commit = () => {
    const patch = { [spendRow.key]: spendRow.used + 1 };
    // Spend-to-restore: the same save hands a use back to the pool this feature refills.
    if (restoresRow) patch[restoresRow.key] = Math.max(0, restoresRow.used - 1);
    onChange?.(patch);
    setConfirm(false);
  };

  const fallbackName = fallbackRow ? shortResourceLabel(fallbackRow.label) : '';

  return (
    <div className="flex items-center gap-2">
      {showRemaining && (
        <span className="text-xs text-muted-foreground">
          {fallbackRow ? (
            /* Two costs, so the count has to say WHICH one it is counting. A bare "1 / 1"
               beside a feature that also spends a shared pool reads as "you can do this once",
               which is exactly the misreading this spells out. */
            <>
              {row.remaining > 0
                ? `Free use ${row.remaining} / ${row.total}`
                : 'Free use spent'}
              {' · '}
              {fallbackName} {fallbackRow.remaining} / {fallbackRow.total}
            </>
          ) : (
            <>{row.remaining} / {row.total} remaining</>
          )}
        </span>
      )}
      {!readOnly && (
        <div className="flex items-center gap-1">
          {isGm && (
            <button
              type="button"
              className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
              disabled={row.used <= 0}
              onClick={() => onChange?.({ [row.key]: row.used - 1 })}
              aria-label={`Recover ${row.label}`}
            >
              −
            </button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            disabled={exhausted}
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
              {restoresRow
                ? `This spends the use and returns one ${shortResourceLabel(restoresRow.label)}.`
                : usingFallback
                  ? `Your free use is spent, so this costs one ${fallbackName}. It won't come back until ${rechargeText(fallbackRow.recharge)}.`
                  : `This won't come back until ${rechargeText(row.recharge)}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              data-testid={`${idPrefix}-use-confirm-button`}
              onClick={commit}
            >
              Use
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RestResourceTracker({ resources = [], level = 1, data = {}, scores = {}, onChange, readOnly = false, isGm = false }) {
  const rows = useRestResource({ resources, level, data, scores });
  if (rows.length === 0) return null;

  // A row may spend from, or hand a use back to, ANOTHER row in this same list (the Psi
  // Warrior's free-use powers and its die regain both point at the Psionic Energy pool).
  // Index by key so the reference resolves whatever order the config lists them in.
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));

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
          <RestResourceControl
            row={r}
            fallbackRow={r.fallbackKey ? byKey[r.fallbackKey] ?? null : null}
            restoresRow={r.restoresKey ? byKey[r.restoresKey] ?? null : null}
            onChange={onChange}
            readOnly={readOnly}
            isGm={isGm}
            idPrefix="rest"
          />
        </div>
      ))}
    </div>
  );
}
