/**
 * SpellPickerCreation — shared creation-time curated spell toggle list (Wizard cantrips,
 * starting spellbook, …). Race-granted spells render violet + non-clickable and never
 * count toward the pick limit. Lifted verbatim from the per-class sheets.
 */
import React from 'react';
import { Label } from '@/components/ui/label';

export default function SpellPickerCreation({
  label,
  limit,
  options = [],
  selected = [],
  onChange,
  raceGrantedSpells = [],
}) {
  const toggle = (spell) => {
    if (raceGrantedSpells.includes(spell)) return;
    if (selected.includes(spell)) onChange(selected.filter((s) => s !== spell));
    else if (selected.length < limit) onChange([...selected, spell]);
  };
  const extraRaceSpells = raceGrantedSpells.filter((s) => !options.includes(s));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground">{selected.length}/{limit} chosen</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((spell) => {
          const isRace = raceGrantedSpells.includes(spell);
          const isSel = selected.includes(spell);
          return (
            <button key={spell} type="button" onClick={() => toggle(spell)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                isRace
                  ? 'bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-600 cursor-not-allowed'
                  : isSel
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!isRace && !isSel && selected.length >= limit ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {spell}
            </button>
          );
        })}
        {extraRaceSpells.map((spell) => (
          <button key={spell} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-600 cursor-not-allowed">
            {spell}
          </button>
        ))}
      </div>
      {raceGrantedSpells.length > 0 && (
        <p className="text-xs text-violet-700 dark:text-violet-400">Violet = already granted by your race or subrace</p>
      )}
    </div>
  );
}
