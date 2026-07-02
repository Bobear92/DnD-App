import { Minus, Plus } from 'lucide-react';

/**
 * Small dedicated "Inspiration" card for the CharacterDetail Stats tab.
 *
 * Inspiration is a simple counter (default 0). The owner/GM can raise or lower it
 * with the − / + steppers (floored at 0); readOnly renders the value only. The
 * `note` slot surfaces an always-on feature reminder that lands on inspiration —
 * e.g. the 2024 Champion Fighter's Heroic Warrior (via subclassCombatNotes) —
 * next to where the effect actually applies.
 *
 * @param {{ value?, onChange?, readOnly?, note? }} props
 */
export default function InspirationCard({ value = 0, onChange, readOnly = false, note = null }) {
  const v = Number.isFinite(value) ? value : 0;
  const set = (next) => onChange?.(Math.max(0, next));

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid="inspiration-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Inspiration</h3>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => set(v - 1)}
              disabled={v <= 0}
              aria-label="Decrease inspiration"
              data-testid="inspiration-dec"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => set(v + 1)}
              aria-label="Increase inspiration"
              data-testid="inspiration-inc"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-center" data-testid="inspiration-value">{v}</div>

      {note && (
        <p className="mt-2 text-[11px] text-emerald-600 leading-tight" data-testid="heroic-warrior-note">
          {note}
        </p>
      )}
    </div>
  );
}
