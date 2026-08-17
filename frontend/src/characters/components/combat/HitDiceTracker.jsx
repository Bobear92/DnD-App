import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
 *    The dialog offers the same two methods the level-up wizard does: roll in the app, or
 *    **Roll at the Table** — type the physical dice you actually rolled, one box per die.
 *    Everything downstream (CON, the Durable floor, the max-HP cap, the result breakdown) is
 *    identical either way; only where the numbers come from differs.
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
  // 'auto' = the app rolls; 'manual' = the player types the dice they rolled at the table.
  const [mode, setMode] = useState('auto');
  // One raw input string per die, kept the same length as `qty`.
  const [manualRolls, setManualRolls] = useState(['']);

  const openDialog = () => {
    setQty(1);
    setResult(null);
    setMode('auto');
    setManualRolls(['']);
    setOpen(true);
  };

  // Changing the die count has to resize the manual inputs with it, or the boxes and the
  // number of dice being spent silently disagree.
  const changeQty = (next) => {
    const n = Math.max(1, Math.min(remaining, next));
    setQty(n);
    setManualRolls((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ''));
  };

  const manualNums = manualRolls.slice(0, qty).map((v) => (v === '' ? null : Number(v)));
  const manualValid = manualNums.length === qty && manualNums.every(
    (n) => n != null && Number.isInteger(n) && n >= 1 && n <= hitDie,
  );
  const canSubmit = mode === 'auto' || manualValid;

  // Shared by both methods — a typed die and a generated one are worth exactly the same.
  const applyRolls = (rolls) => {
    const n = rolls.length;
    const perDie = rolls.map((r) => Math.max(perDieMin, r + conMod, 0));
    const regained = perDie.reduce((sum, hp) => sum + hp, 0);
    const before = currentHp ?? 0;
    const after = maxHp != null ? Math.min(maxHp, before + regained) : before + regained;
    onHeal({ hit_dice_used: usedCount + n, current_hp: after });
    // Track whether any die was raised to the Durable floor, so the result can flag it.
    const durableApplied = durable && rolls.some((r) => r + conMod < perDieMin);
    setResult({ n, rolls, conMod, regained, before, after, durableApplied, manual: mode === 'manual' });
  };

  const roll = () => {
    const n = Math.max(1, Math.min(remaining, qty));
    if (mode === 'manual') {
      if (!manualValid) return;
      applyRolls(manualNums.slice(0, n));
      return;
    }
    applyRolls(Array.from({ length: n }, () => Math.floor(Math.random() * hitDie) + 1));
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
                      onClick={() => changeQty(qty - 1)}
                      disabled={qty <= 1}
                      aria-label="Fewer Hit Dice"
                    >−</button>
                    <span className="w-6 text-center font-semibold" data-testid="hit-dice-qty">{qty}</span>
                    <button
                      type="button"
                      className="h-7 w-7 rounded border text-sm hover:bg-muted disabled:opacity-40"
                      onClick={() => changeQty(qty + 1)}
                      disabled={qty >= remaining}
                      aria-label="More Hit Dice"
                    >+</button>
                  </div>
                </div>

                {/* Where the numbers come from. Same two methods as the level-up wizard's HP
                    step, so a table that rolls physical dice never has to accept the app's. */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'auto', title: 'Roll for Me', sub: `The app rolls d${hitDie}` },
                    { key: 'manual', title: 'Roll at the Table', sub: 'Enter your dice' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMode(m.key)}
                      data-testid={`hit-dice-mode-${m.key}`}
                      aria-pressed={mode === m.key}
                      className={cn(
                        'rounded-lg border-2 p-2 text-center transition-all hover:shadow-sm',
                        mode === m.key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                      )}
                    >
                      <div className="font-semibold text-xs">{m.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</div>
                    </button>
                  ))}
                </div>

                {mode === 'manual' && (
                  <div className="space-y-1.5" data-testid="hit-dice-manual-entry">
                    <div className="text-xs font-medium text-muted-foreground">
                      Your rolled d{hitDie} {qty === 1 ? 'result' : 'results'} (1–{hitDie})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: qty }, (_, i) => (
                        <Input
                          key={i}
                          type="number"
                          min={1}
                          max={hitDie}
                          value={manualRolls[i] ?? ''}
                          onChange={(e) => setManualRolls((prev) => {
                            const next = Array.from({ length: qty }, (_, j) => prev[j] ?? '');
                            next[i] = e.target.value;
                            return next;
                          })}
                          placeholder={`1–${hitDie}`}
                          aria-label={`Die ${i + 1} result`}
                          data-testid={`hit-dice-manual-input-${i}`}
                          className="w-20 text-center"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    {manualRolls.slice(0, qty).some((v) => v !== '') && !manualValid && (
                      <p className="text-xs text-destructive" data-testid="hit-dice-manual-error">
                        Enter a whole number between 1 and {hitDie} for each die.
                      </p>
                    )}
                  </div>
                )}
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
                  {result.manual ? 'Entered' : 'Rolled'}{' '}
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
                  {/* "Roll" would be a lie in manual mode — the player already rolled. */}
                  <Button size="sm" onClick={roll} disabled={!canSubmit} data-testid="hit-dice-roll-btn">
                    {mode === 'manual' ? 'Apply' : 'Roll'} {qty} Hit {qty === 1 ? 'Die' : 'Dice'}
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
