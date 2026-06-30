import React from 'react';
import { Dices, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// D&D 5e standard point buy costs (index = score - 8)
const POINT_COSTS = [0, 1, 2, 3, 4, 5, 7, 9]; // scores 8–15
const STAT_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const STAT_LABELS = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
const STAT_ABBREVS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const STANDARD_SPREAD = [15, 14, 13, 12, 10, 8];
const TOTAL_POINTS = 27;

function modifier(score) {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

// ─── Standard Spread ─────────────────────────────────────────────────────────

export function StandardSpreadAssignment({ scores, onChange }) {
  // scores: { strength, dexterity, ... }
  // Track which spread value is assigned to which stat
  const assignedValues = Object.values(scores);
  const getAvailableFor = (statKey) => {
    const mine = scores[statKey];
    const usedByOthers = STAT_KEYS.filter(k => k !== statKey).map(k => scores[k]);
    return STANDARD_SPREAD.filter(v => !usedByOthers.includes(v) || v === mine);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Assign each value to one ability score. Each value can only be used once.
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {STANDARD_SPREAD.map(v => {
          const isUsed = assignedValues.includes(v);
          return (
            <span
              key={v}
              className={cn(
                'inline-flex items-center justify-center w-10 h-10 rounded-md border text-sm font-bold',
                isUsed
                  ? 'bg-muted text-muted-foreground border-muted line-through'
                  : 'bg-primary/10 border-primary text-primary'
              )}
            >
              {v}
            </span>
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STAT_KEYS.map((key, i) => {
          const available = getAvailableFor(key);
          return (
            <div key={key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase">{STAT_ABBREVS[i]}</label>
              <div className="flex items-center gap-2">
                <select
                  data-testid={`score-select-${key}`}
                  className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                  value={scores[key]}
                  onChange={e => onChange({ ...scores, [key]: parseInt(e.target.value) })}
                >
                  {available.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground w-8 text-right">{modifier(scores[key])}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Point Buy ───────────────────────────────────────────────────────────────

export function PointBuyAssignment({ scores, onChange }) {
  const pointsSpent = STAT_KEYS.reduce((sum, key) => {
    const score = scores[key];
    if (score < 8 || score > 15) return sum;
    return sum + POINT_COSTS[score - 8];
  }, 0);
  const pointsLeft = TOTAL_POINTS - pointsSpent;

  const adjust = (key, delta) => {
    const cur = scores[key];
    const next = cur + delta;
    if (next < 8 || next > 15) return;
    const newCost = POINT_COSTS[next - 8] - POINT_COSTS[cur - 8];
    if (newCost > pointsLeft) return;
    onChange({ ...scores, [key]: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Distribute 27 points. Scores range 8–15. Higher scores cost more.
        </p>
        <span className={cn(
          'text-sm font-bold px-3 py-1 rounded-full',
          pointsLeft === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          pointsLeft < 0  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-primary/10 text-primary'
        )}>
          {pointsLeft} pts left
        </span>
      </div>

      {/* Cost reference */}
      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
        {[8,9,10,11,12,13,14,15].map(v => (
          <span key={v} className="px-2 py-0.5 rounded border bg-muted/40">
            {v} <span className="text-foreground font-medium">({POINT_COSTS[v-8]}pt)</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STAT_KEYS.map((key, i) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase">{STAT_ABBREVS[i]}</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="w-7 h-8 rounded border bg-muted hover:bg-muted/80 text-sm font-bold disabled:opacity-30"
                onClick={() => adjust(key, -1)}
                disabled={scores[key] <= 8}
              >−</button>
              <span className="w-8 text-center font-bold text-sm">{scores[key]}</span>
              <button
                type="button"
                className="w-7 h-8 rounded border bg-muted hover:bg-muted/80 text-sm font-bold disabled:opacity-30"
                onClick={() => adjust(key, +1)}
                disabled={scores[key] >= 15 || POINT_COSTS[scores[key] - 8 + 1] - POINT_COSTS[scores[key] - 8] > pointsLeft}
              >+</button>
              <span className="text-xs text-muted-foreground ml-1 w-8">{modifier(scores[key])}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dice Roll ───────────────────────────────────────────────────────────────

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function roll4d6DropLowest(allowRerollOnes) {
  let dice = [rollDie(), rollDie(), rollDie(), rollDie()];
  if (allowRerollOnes) {
    dice = dice.map(d => d === 1 ? rollDie() : d);
  }
  const sorted = [...dice].sort((a, b) => a - b);
  const dropped = sorted[0];
  const kept = sorted.slice(1);
  const total = kept.reduce((s, d) => s + d, 0);
  return { dice, dropped, kept, total };
}

export function DiceRollAssignment({ scores, onChange, allowRerollOnes, rolls, onRollsChange, assignment, onAssignmentChange }) {
  const allRolled = rolls.every(r => r !== null);

  const rollOne = (i) => {
    const newRolls = [...rolls];
    newRolls[i] = roll4d6DropLowest(allowRerollOnes);
    onRollsChange(newRolls);
    const newAssignment = { ...assignment };
    Object.keys(newAssignment).forEach(k => {
      if (newAssignment[k] === i) newAssignment[k] = null;
    });
    onAssignmentChange(newAssignment);
  };

  const rollAll = () => {
    const newRolls = Array.from({ length: 6 }, () => roll4d6DropLowest(allowRerollOnes));
    onRollsChange(newRolls);
    onAssignmentChange(Object.fromEntries(STAT_KEYS.map(k => [k, null])));
  };

  const rerollOnesInSlot = (i) => {
    if (!rolls[i]) return;
    const { dice } = rolls[i];
    const newDice = dice.map(d => d === 1 ? rollDie() : d);
    const sorted = [...newDice].sort((a, b) => a - b);
    const dropped = sorted[0];
    const kept = sorted.slice(1);
    const total = kept.reduce((s, d) => s + d, 0);
    const newRolls = [...rolls];
    newRolls[i] = { dice: newDice, dropped, kept, total };
    onRollsChange(newRolls);
    const stat = Object.keys(assignment).find(k => assignment[k] === i);
    if (stat) {
      onChange({ ...scores, [stat]: total });
    }
  };

  const assign = (statKey, rollIdx) => {
    const newAssignment = { ...assignment };
    Object.keys(newAssignment).forEach(k => {
      if (newAssignment[k] === rollIdx) newAssignment[k] = null;
    });
    newAssignment[statKey] = rollIdx;
    onAssignmentChange(newAssignment);
    const newScores = { ...scores };
    if (rollIdx !== null) {
      newScores[statKey] = rolls[rollIdx].total;
    }
    onChange(newScores);
  };

  const handleManualOverride = (i, val) => {
    const parsed = parseInt(val);
    if (isNaN(parsed) || parsed < 3 || parsed > 18) return;
    const newRolls = [...rolls];
    newRolls[i] = { dice: [], dropped: null, kept: [], total: parsed };
    onRollsChange(newRolls);
    const stat = Object.keys(assignment).find(k => assignment[k] === i);
    if (stat) onChange({ ...scores, [stat]: parsed });
  };

  const usedIndices = new Set(Object.values(assignment).filter(v => v !== null));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Roll 4d6, drop the lowest die. Assign each result to an ability score.
          {allowRerollOnes && ' 1s are automatically rerolled.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={rollAll} className="gap-2 shrink-0">
          <Dices className="h-4 w-4" />
          Roll All
        </Button>
      </div>

      {/* Roll slots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {rolls.map((roll, i) => (
          <div key={i} className={cn(
            'rounded-lg border p-2 space-y-1.5',
            usedIndices.has(i) ? 'border-primary bg-primary/5' : 'bg-card'
          )}>
            <div className="flex items-center gap-1">
              {roll ? (
                <div className="flex gap-1 flex-wrap">
                  {roll.dice.length > 0 ? roll.dice.map((d, di) => (
                    <span
                      key={di}
                      className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border',
                        d === roll.dropped
                          ? 'line-through text-muted-foreground border-muted bg-muted/50'
                          : 'border-primary bg-primary/10 text-primary'
                      )}
                    >{d}</span>
                  )) : (
                    <span className="text-xs text-muted-foreground">manual</span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Not rolled</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={3}
                max={18}
                value={roll?.total ?? ''}
                placeholder="—"
                onChange={e => handleManualOverride(i, e.target.value)}
                className="h-8 w-14 text-center font-bold text-sm"
              />
              <button
                type="button"
                title="Roll this slot"
                onClick={() => rollOne(i)}
                className="p-1.5 rounded border hover:bg-muted transition-colors"
              >
                <Dices className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {allowRerollOnes && roll && roll.dice.some(d => d === 1) && (
                <button
                  type="button"
                  title="Reroll 1s"
                  onClick={() => rerollOnesInSlot(i)}
                  className="p-1.5 rounded border hover:bg-muted transition-colors text-amber-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stat assignment */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Assign rolls to stats:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STAT_KEYS.map((key, i) => {
            const assignedIdx = assignment[key];
            return (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">{STAT_ABBREVS[i]}</label>
                <div className="flex items-center gap-2">
                  <select
                    className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                    value={assignedIdx ?? ''}
                    onChange={e => assign(key, e.target.value === '' ? null : parseInt(e.target.value))}
                  >
                    <option value="">— pick —</option>
                    {rolls.map((r, ri) => r && (
                      <option
                        key={ri}
                        value={ri}
                        disabled={usedIndices.has(ri) && assignedIdx !== ri}
                      >
                        {r.total} {usedIndices.has(ri) && assignedIdx !== ri ? '(used)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {assignedIdx !== null && rolls[assignedIdx] ? modifier(rolls[assignedIdx].total) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
