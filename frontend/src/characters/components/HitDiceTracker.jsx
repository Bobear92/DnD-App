import React from 'react';

export default function HitDiceTracker({ hitDie, level, used, onChange, readOnly, creation }) {
  const total = level ?? 1;
  const usedCount = used ?? 0;
  const remaining = total - usedCount;

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground mb-1">Hit Dice</div>
      <div className="flex items-center justify-between">
        <span className="font-semibold">d{hitDie} &times; {total}</span>
        {!creation && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{remaining} / {total} remaining</span>
            {!readOnly && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
