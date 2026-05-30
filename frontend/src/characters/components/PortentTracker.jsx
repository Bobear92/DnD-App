/**
 * PortentTracker — Divination Wizard subclass feature.
 *
 * On a long rest the player rolls N d20s (2, or 3 once Greater Portent is
 * gained at level 14) and records them. Each foretelling roll can replace one
 * attack roll, saving throw, or ability check, then is expended individually.
 * Long rest clears unused rolls (handled by the backend rest endpoint, which
 * empties `portent_rolls`).
 *
 * Renders nothing unless the character's subclass is a Divination tradition,
 * so it can be dropped into the Wizard spells section unconditionally.
 *
 * Stored shape: character_data.portent_rolls = [{ value: 1-20, used: bool }, …]
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import { cn } from '@/lib/utils';

// 5e "School of Divination" (L2) and 2024 "Diviner" (L3)
const DIVINATION_SUBCLASSES = new Set(['School of Divination', 'Diviner']);

export function isDivination(subclass) {
  return DIVINATION_SUBCLASSES.has(subclass);
}

/** Greater Portent (L14) bumps the dice count from 2 to 3. */
export function portentDiceCount(level) {
  return (level ?? 1) >= 14 ? 3 : 2;
}

export default function PortentTracker({
  subclass,
  level = 1,
  data = {},
  onChange,
  readOnly = false,
}) {
  if (!isDivination(subclass)) return null;

  const rolls = data.portent_rolls ?? [];
  const diceCount = portentDiceCount(level);
  const hasRolls = rolls.length > 0;
  const allUsed = hasRolls && rolls.every((r) => r.used);

  const rollDice = () => {
    const fresh = Array.from({ length: diceCount }, () => ({
      value: Math.floor(Math.random() * 20) + 1,
      used: false,
    }));
    onChange?.({ portent_rolls: fresh });
  };

  const expend = (idx) => {
    const next = rolls.map((r, i) => (i === idx ? { ...r, used: true } : r));
    onChange?.({ portent_rolls: next });
  };

  return (
    <div className="space-y-2 rounded-md border px-3 py-2.5" data-testid="portent-tracker">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Label className="text-sm font-medium">
            Portent{level >= 14 ? ' (Greater)' : ''}
          </Label>
          <div className="text-xs text-muted-foreground">
            Roll {diceCount} d20s on a long rest · replace any d20 roll · each used once
          </div>
        </div>
        {!readOnly && (
          <Button
            size="sm"
            variant={hasRolls ? 'outline' : 'default'}
            onClick={rollDice}
            className="gap-1 shrink-0"
            data-testid="portent-roll-btn"
          >
            <Dices className="h-3.5 w-3.5" />
            {hasRolls ? 'Re-roll' : 'Roll Portent'}
          </Button>
        )}
      </div>

      {hasRolls ? (
        <div className="flex flex-wrap gap-2">
          {rolls.map((r, i) => (
            <button
              key={i}
              type="button"
              disabled={readOnly || r.used}
              onClick={() => expend(i)}
              data-testid={`portent-die-${i}`}
              aria-label={r.used ? `Portent ${r.value} (expended)` : `Expend portent ${r.value}`}
              className={cn(
                'h-11 w-11 rounded-md border-2 flex items-center justify-center text-lg font-bold transition-colors',
                r.used
                  ? 'bg-muted text-muted-foreground/40 border-border line-through cursor-not-allowed'
                  : 'bg-primary/10 text-primary border-primary hover:bg-primary/20'
              )}
            >
              {r.value}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          No foretelling rolls. Roll after a long rest.
        </div>
      )}

      {allUsed && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          All foretelling rolls expended. Roll again on your next long rest.
        </div>
      )}
    </div>
  );
}
