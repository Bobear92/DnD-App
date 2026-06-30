import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RACE_TRAIT_DESCRIPTIONS } from '@/characters/components/race/raceTraitsData';

/**
 * Renders a list of racial trait name badges.
 * Traits with a known description are clickable — clicking one toggles
 * a description panel below the badge list. Only one description shows at a time.
 *
 * Props:
 *   traits:       string[]  — trait names to display
 *   variant:      Badge variant (default 'secondary')
 *   badgeClassName: extra classes applied to each Badge
 */
export default function TraitBadgeList({ traits, variant = 'secondary', badgeClassName = '' }) {
  const [selected, setSelected] = useState(null);

  const toggle = (name) => {
    if (!RACE_TRAIT_DESCRIPTIONS[name]) return;
    setSelected(s => s === name ? null : name);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {traits.map(t => {
          const hasDesc = !!RACE_TRAIT_DESCRIPTIONS[t];
          return (
            <Badge
              key={t}
              variant={variant}
              className={cn(
                'text-xs',
                hasDesc && 'cursor-pointer select-none hover:opacity-80',
                selected === t && 'ring-1 ring-primary/60',
                badgeClassName,
              )}
              onClick={() => toggle(t)}
              role={hasDesc ? 'button' : undefined}
              tabIndex={hasDesc ? 0 : undefined}
              onKeyDown={hasDesc ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(t); } } : undefined}
              aria-expanded={hasDesc ? selected === t : undefined}
            >
              {t}
            </Badge>
          );
        })}
      </div>
      {selected && RACE_TRAIT_DESCRIPTIONS[selected] && (
        <div className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-xs" data-testid="trait-description-panel">
          <span className="font-semibold text-foreground">{selected}:</span>{' '}
          <span className="text-muted-foreground leading-relaxed">{RACE_TRAIT_DESCRIPTIONS[selected]}</span>
        </div>
      )}
    </div>
  );
}
