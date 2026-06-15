import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

/**
 * HitDiceTracker — die type × total + remaining/total count.
 *
 * Two modes:
 *  - Heal mode (when `onHeal` is provided): a "Use" button opens a dialog to spend one
 *    or more Hit Dice. Each spent die rolls d{hitDie} + CON modifier (floored at 0), the
 *    total is added to current HP (capped at maxHp), the dice are expended, and the roll
 *    breakdown is shown. Expended dice only come back on a long rest (handled by the rest
 *    flow). `onHeal({ hit_dice_used, current_hp })` persists the result.
 *    The `durable` prop (Durable feat) raises the per-die minimum regained to twice the CON
 *    modifier (min 2) — the floor is applied to each die and the dialog notates the guaranteed
 *    minimum for the chosen number of dice.
 *  - Legacy mode (no `onHeal`): the original +/- stepper for `hit_dice_used`, used by the
 *    hand-written sheets that haven't been migrated to the data-driven ClassSheet yet.
 */
export default function HitDiceTracker({
  hitDie,
  level,
  used,
  onChange,
  readOnly,
  creation,
  conMod = 0,
  currentHp,
  maxHp,
  onHeal,
  durable = false,
}) {
  const total = level ?? 1;
  const usedCount = used ?? 0;
  const remaining = total - usedCount;
  const healMode = typeof onHeal === 'function';
  // Durable: each spent Hit Die regains at least twice the CON modifier (minimum 2).
  const perDieMin = durable ? Math.max(2, 2 * conMod) : 0;

  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [result, setResult] = useState(null);

  const openDialog = () => {
    setQty(1);
    setResult(null);
    setOpen(true);
  };

  const roll = () => {
    const n = Math.max(1, Math.min(remaining, qty));
    const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * hitDie) + 1);
    const perDie = rolls.map((r) => Math.max(perDieMin, r + conMod, 0));
    const regained = perDie.reduce((sum, hp) => sum + hp, 0);
    const before = currentHp ?? 0;
    const after = maxHp != null ? Math.min(maxHp, before + regained) : before + regained;
    onHeal({ hit_dice_used: usedCount + n, current_hp: after });
    // Track whether any die was raised to the Durable floor, so the result can flag it.
    const durableApplied = durable && rolls.some((r) => r + conMod < perDieMin);
    setResult({ n, rolls, conMod, regained, before, after, durableApplied });
  };

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground mb-1">Hit Dice</div>
      <div className="flex items-center justify-between">
        <span className="font-semibold">d{hitDie} &times; {total}</span>
        {!creation && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{remaining} / {total} remaining</span>
            {!readOnly && (healMode ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                disabled={remaining <= 0}
                onClick={openDialog}
                data-testid="hit-dice-use-btn"
              >
                Use
              </Button>
            ) : (
              <div className="flex gap-1">
                <button
                  type="button"
                  className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => onChange?.(Math.max(0, usedCount - 1))}
                  disabled={usedCount <= 0}
                >−</button>
                <button
                  type="button"
                  className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => onChange?.(Math.min(total, usedCount + 1))}
                  disabled={usedCount >= total}
                >+</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {healMode && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Spend Hit Dice to Heal</DialogTitle>
              <DialogDescription>
                Each Hit Die you spend heals d{hitDie} + your Constitution modifier. Expended
                Hit Dice aren&apos;t regained until you finish a long rest.
              </DialogDescription>
            </DialogHeader>

            {!result ? (
              <div className="space-y-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hit Dice to roll</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-7 w-7 rounded border text-sm hover:bg-muted disabled:opacity-40"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Fewer Hit Dice"
                    >−</button>
                    <span className="w-6 text-center font-semibold" data-testid="hit-dice-qty">{qty}</span>
                    <button
                      type="button"
                      className="h-7 w-7 rounded border text-sm hover:bg-muted disabled:opacity-40"
                      onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                      disabled={qty >= remaining}
                      aria-label="More Hit Dice"
                    >+</button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {remaining} Hit {remaining === 1 ? 'Die' : 'Dice'} remaining · CON modifier{' '}
                  {conMod >= 0 ? `+${conMod}` : conMod}
                </p>
                {durable && (
                  <p className="text-xs font-medium text-emerald-600" data-testid="hit-dice-durable-min">
                    Durable: at least {Math.max(1, Math.min(remaining, qty)) * perDieMin} HP
                    {' '}({perDieMin} per die) from {Math.max(1, Math.min(remaining, qty))}{' '}
                    {Math.max(1, Math.min(remaining, qty)) === 1 ? 'die' : 'dice'}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 py-1" data-testid="hit-dice-result">
                <div className="text-sm">
                  Rolled{' '}
                  {result.rolls.map((r, i) => (
                    <span key={i} className="inline-block rounded border bg-muted/40 px-1.5 py-0.5 mx-0.5 font-mono text-xs">{r}</span>
                  ))}
                  {' '}+ {result.conMod >= 0 ? `${result.conMod}` : result.conMod} CON ×{result.n}
                </div>
                {result.durableApplied && (
                  <div className="text-xs text-emerald-600" data-testid="hit-dice-durable-applied">
                    Durable minimum applied (at least {perDieMin} HP per die)
                  </div>
                )}
                <div className="text-lg font-semibold text-emerald-600">+{result.regained} HP regained</div>
                <div className="text-sm text-muted-foreground">
                  HP: {result.before} → {result.after}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {!result ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={roll} data-testid="hit-dice-roll-btn">
                    Roll {qty} Hit {qty === 1 ? 'Die' : 'Dice'}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setOpen(false)} data-testid="hit-dice-done-btn">Done</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
