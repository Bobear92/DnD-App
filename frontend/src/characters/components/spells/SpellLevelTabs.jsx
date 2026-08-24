import React, { useState, useMemo } from 'react';
import SpellList from '@/characters/components/spells/SpellList';
import { useFocusedSpell } from '@/characters/components/spells/SpellFocusContext';
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
  // A "jump to this spell" request from the Action Economy tab: open the level tab holding it.
  // Scoped by `has`, so a strip that doesn't hold the spell leaves the request for one that does.
  // `?? 0` matches how byLevel buckets, so a spell stored without a level still resolves to
  // Cantrips rather than reading as "not here".
  const levelOf = (name) => {
    const sp = spells.find((x) => x.name === name);
    return sp ? (sp.level ?? 0) : null;
  };
  useFocusedSpell(
    (name) => levelOf(name) != null,
    (name) => setActive(levelOf(name)),
  );
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
      {/* This strip owns the level axis: the spells were bucketed by the level the GRANT casts
          them at, so SpellList must render them as one list rather than re-deriving levels from
          the catalog (which nested a contradictory "1st"/"2nd" strip inside this tab). */}
      <SpellList
        spells={[...byLevel[activeLevel]].sort()}
        isCantrips={activeLevel === 0}
        readOnly
        hideLevelHeadings
        singleGroup
        label=""
        rowExtras={rowExtras}
      />
    </div>
  );
}
