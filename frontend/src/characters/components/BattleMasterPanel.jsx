import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getManeuvers, maneuversKnownAtLevel, superiorityDie, superiorityDiceCount } from './maneuversData';
import { RestResourceControl } from './classSheet/RestResourceTracker';

/**
 * Battle Master subclass panel (rendered in the Features tab's subclass sub-tab):
 *   • Combat Superiority — superiority dice tracker (expend a die / recover one; the
 *     whole pool recharges on a short OR long rest, handled by the backend).
 *   • Maneuvers — chosen at LEVEL-UP (the LevelUpWizard), not on the fly. Here they're a
 *     locked, read-only list with full descriptions. You can still fill OWED slots (when
 *     you know fewer than maneuversKnownAtLevel(level) — e.g. a character that pre-dates
 *     this feature); only GM Edit can swap/remove a chosen maneuver.
 *
 * Stores `character_data.maneuvers` (string[]) and `character_data.superiority_dice_used`.
 */
export default function BattleMasterPanel({ data = {}, onChange, level = 1, readOnly = false, edition = '5e', gmEdit = false }) {
  const allManeuvers = getManeuvers(edition);
  const known = data.maneuvers || [];
  const limit = maneuversKnownAtLevel(level);
  const die = superiorityDie(level);
  const total = superiorityDiceCount(level);
  const used = data.superiority_dice_used || 0;

  // Can add when there's an owed slot (or GM Edit); can only remove via GM Edit.
  const owedSlots = known.length < limit;
  const editable = !readOnly && (gmEdit || owedSlots);

  const toggle = (name) => {
    if (readOnly) return;
    if (known.includes(name)) {
      if (!gmEdit) return; // chosen maneuvers can't be swapped on the fly
      onChange?.({ maneuvers: known.filter((n) => n !== name) });
      return;
    }
    if (known.length >= limit) return; // at the known-maneuvers limit
    onChange?.({ maneuvers: [...known, name] });
  };

  const diceRow = {
    key: 'superiority_dice_used',
    label: `Superiority Dice (${die})`,
    recharge: 'short', // short OR long rest
    total, used, remaining: Math.max(0, total - used),
  };

  // Show the full pickable list only while editing; otherwise just the known maneuvers.
  const list = editable ? allManeuvers : allManeuvers.filter((m) => known.includes(m.name));
  const lockedNote = !readOnly && !editable && known.length >= limit; // chosen + can't change here

  return (
    <div className="space-y-3" data-testid="battle-master-panel">
      {/* Combat Superiority — dice tracker */}
      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Combat Superiority</span>
          <Badge variant="outline" className="text-[10px]">{die} · short or long rest</Badge>
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2" data-testid="superiority-dice">
          <span className="text-sm font-medium">Superiority Dice</span>
          <RestResourceControl row={diceRow} onChange={onChange} readOnly={readOnly} idPrefix="superiority" />
        </div>
        <p className="text-xs text-muted-foreground">
          Maneuver save DC = 8 + your proficiency bonus + your Strength or Dexterity modifier.
        </p>
      </div>

      {/* Maneuvers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Maneuvers</span>
          {!readOnly && (
            <span
              className={cn('text-xs', owedSlots ? 'text-amber-600' : 'text-muted-foreground')}
              data-testid="maneuvers-count"
            >
              {known.length}/{limit} chosen
            </span>
          )}
        </div>
        {owedSlots && !readOnly && !gmEdit && (
          <p className="text-xs text-amber-600" data-testid="maneuvers-owed-note">
            Choose {limit - known.length} more maneuver{limit - known.length === 1 ? '' : 's'}.
          </p>
        )}
        {lockedNote && (
          <p className="text-xs text-muted-foreground" data-testid="maneuvers-locked-note">
            Maneuvers are chosen at level-up and can't be changed here.
          </p>
        )}
        {list.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">No maneuvers chosen yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {list.map((m) => {
              const sel = known.includes(m.name);
              const disabled = readOnly || (sel ? !gmEdit : known.length >= limit);
              return (
                <button
                  key={m.name}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(m.name)}
                  data-testid={`maneuver-${m.name}`}
                  className={cn(
                    'w-full rounded-md border p-2.5 text-left transition-colors',
                    sel ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                    disabled && !sel && 'opacity-50',
                    disabled && 'cursor-default'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.name}</span>
                    {sel && <Badge className="text-[10px] bg-emerald-600 text-white">Known</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
