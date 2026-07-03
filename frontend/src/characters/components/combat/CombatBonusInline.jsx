/**
 * Inline combat-bonus pieces rendered *inside* a class sheet's stats section.
 *
 * - MaxHpValue replaces the Max HP cell's value: it shows the EFFECTIVE max HP
 *   (CON-independent roll base + CON × level + passive bonuses) with a small note
 *   of where each passive bonus comes from — so the Max HP field reads the real
 *   number, not "base" with a separate "effective" row. `baseMaxHp` is the roll
 *   base (character_data.hp_rolls); Constitution is layered on here via `conMod`
 *   so a CON change adjusts HP dynamically. Display-only: never mutates stored HP.
 * - AcOptionsLine renders right under the Armor Class field, listing the
 *   non-armor AC formulas the character can use (the AC field stays a manual
 *   input since it depends on worn armor).
 *
 * All 25 sheets accept optional `maxHpNode`/`acExtra` render slots (default null);
 * CharacterDetail builds these and passes them only to the stats-section sheet.
 * Logic lives in combatBonuses.js. (Filename differs from combatBonuses.js by
 * more than case to avoid the Windows case-insensitive self-import trap.)
 */
import React from 'react';
import { Shield } from 'lucide-react';
import { getHpBonuses, getAcOptions } from '@/characters/components/combat/combatBonuses';

export function MaxHpValue({ charClass, subclass, raceTraits = [], feats = [], level = 1, baseMaxHp, conMod = 0 }) {
  const hasBase = typeof baseMaxHp === 'number' && !Number.isNaN(baseMaxHp);
  if (!hasBase) return <>—</>;
  const bonuses = getHpBonuses({ charClass, subclass, raceTraits, feats, level });
  // CON is part of the base number (not annotated); passive bonuses get a source note.
  const conHp = conMod * level;
  const passiveTotal = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const total = baseMaxHp + conHp + passiveTotal;
  if (bonuses.length === 0) return <>{total}</>;
  return (
    <span className="inline-flex flex-col items-center leading-tight">
      <span>{total}</span>
      <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
        {bonuses.map(b => `+${b.amount} ${b.source}`).join(' · ')}
      </span>
    </span>
  );
}

export function AcOptionsLine({ charClass, subclass, scores = {} }) {
  const options = getAcOptions({ charClass, subclass, scores });
  if (options.length === 0) return null;
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs space-y-1">
      <div className="flex items-center gap-1.5 font-medium text-muted-foreground uppercase tracking-wide">
        <Shield className="h-3 w-3" /> Armor Class Options
      </div>
      <p className="opacity-70">Without worn armor:</p>
      {options.map(o => (
        <div key={`${o.source}-${o.formula}`} className="flex items-center justify-between">
          <span><span className="font-medium text-foreground">{o.source}</span> <span className="opacity-70">{o.detail} · {o.formula}</span></span>
          <span className="font-bold text-foreground">{o.value}</span>
        </div>
      ))}
    </div>
  );
}
