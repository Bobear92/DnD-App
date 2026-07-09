import React from 'react';
import { Label } from '@/components/ui/label';

/**
 * Shared spell-slot grid used by every caster sheet (data-driven CasterSpellBlock +
 * the hand-written class sheets).
 *
 * Players never get manual slot steppers: a slot is spent by the Cast button (SpellList
 * onCastSpell) and restored only when the GM applies a rest. The −/+ correction steppers
 * render for the GM only.
 */
export default function SpellSlotTracker({
  slots = [],        // per-spell-level totals for the current level (index = level − 1)
  spellSlots = {},   // character_data.spell_slots: { [level]: { total, used } }
  onSetSlotUsed,     // (slotLevel, used) => void
  readOnly = false,
  isGm = false,
  label = 'Spell Slots (Long Rest)',
}) {
  if (!slots.some(t => t > 0)) return null;
  const gmControls = isGm && !readOnly;

  return (
    <div className="space-y-2" data-testid="slot-tracker">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {slots.map((total, i) => {
          if (total === 0) return null;
          const slotLevel = i + 1;
          const used = spellSlots[slotLevel]?.used ?? 0;
          return (
            <div key={slotLevel} className="rounded-md border text-center p-2">
              <div className="text-xs text-muted-foreground">Level {slotLevel}</div>
              <div className="font-bold text-sm" data-testid={`slot-remaining-${slotLevel}`}>
                {total - used}/{total}
              </div>
              {gmControls && (
                <div className="flex justify-center gap-0.5 mt-1">
                  <button
                    className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                    data-testid={`slot-dec-${slotLevel}`}
                    disabled={used >= total}
                    onClick={() => onSetSlotUsed?.(slotLevel, used + 1)}
                  >−</button>
                  <button
                    className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                    data-testid={`slot-inc-${slotLevel}`}
                    disabled={used <= 0}
                    onClick={() => onSetSlotUsed?.(slotLevel, used - 1)}
                  >+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!gmControls && !readOnly && (
        <p className="text-xs text-muted-foreground italic" data-testid="slot-tracker-note">
          Slots are spent by casting spells and come back when your GM applies a rest.
        </p>
      )}
    </div>
  );
}
