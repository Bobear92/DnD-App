import React, { useState, useMemo } from 'react';
import SpellList from '@/characters/components/spells/SpellList';
import { cn } from '@/lib/utils';

const tabLabel = (lvl) => (lvl === 0 ? 'Cantrips' : `Lvl ${lvl}`);

/**
 * A spell list broken into Cantrips + per-level (1–9) sub-tabs — only tabs the character
 * actually has a spell in are shown (so it doesn't get crowded). Within the active tab the
 * spells render as a read-only `SpellList` (clickable for the detail dialog). Used by the
 * Spells-tab Racial and Feats sections.
 *
 * Props:
 *   spells       [{ name, level }]  the spells to show (level 0 = cantrip)
 *   testIdPrefix string
 *   emptyText    string  shown when there are no spells
 *   rowExtras    (name) => node|null  forwarded to SpellList: per-spell controls on the row
 *                (a racial spell's once-per-rest use-counter lives here, on its own row)
 */
export default function SpellLevelTabs({
  spells = [],
  testIdPrefix = 'spell-level',
  emptyText = 'No spells.',
  rowExtras,
}) {
  const byLevel = useMemo(() => {
    const m = {};
    for (const s of spells) (m[s.level ?? 0] ||= []).push(s.name);
    return m;
  }, [spells]);
  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  const [active, setActive] = useState(null);
  const activeLevel = (active != null && byLevel[active]) ? active : (levels[0] ?? null);

  if (levels.length === 0) {
    return <div className="rounded-md border p-2 text-xs text-muted-foreground italic">{emptyText}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {levels.map((lvl) => (
          <button
            key={lvl}
            type="button"
            data-testid={`${testIdPrefix}-tab-${lvl}`}
            onClick={() => setActive(lvl)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs transition-colors',
              activeLevel === lvl ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/50',
            )}
          >
            {tabLabel(lvl)} ({byLevel[lvl].length})
          </button>
        ))}
      </div>
      <SpellList
        spells={[...byLevel[activeLevel]].sort()}
        isCantrips={activeLevel === 0}
        readOnly
        hideLevelHeadings
        label=""
        rowExtras={rowExtras}
      />
    </div>
  );
}
