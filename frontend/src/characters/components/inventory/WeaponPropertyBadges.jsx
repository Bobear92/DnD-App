import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { weaponPropertyDescription, weaponPropertyBaseName } from '@/characters/components/inventory/weaponPropertyData';

/**
 * Renders weapon attribute badges (category, handedness, properties). Any badge with a
 * known explanation is clickable — clicking it toggles a description panel below the
 * row (one at a time), so players can learn what "Versatile", "Heavy", etc. mean.
 *
 * Props:
 *   badges: [{ label, variant? }]  — from weaponBadges()
 *   stop:   when true, badge clicks stopPropagation (so they don't trigger an
 *           enclosing selectable card)
 */
export default function WeaponPropertyBadges({ badges = [], stop = false, className = '' }) {
  const [selected, setSelected] = useState(null);
  if (!badges.length) return null;

  const toggle = (i, label, e) => {
    if (stop) e?.stopPropagation();
    if (!weaponPropertyDescription(label)) return;
    setSelected((s) => (s === i ? null : i));
  };

  const activeLabel = selected != null ? badges[selected]?.label : null;
  const activeDesc = activeLabel ? weaponPropertyDescription(activeLabel) : null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1">
        {badges.map((b, i) => {
          const desc = weaponPropertyDescription(b.label);
          return (
            <Badge
              key={`${b.label}-${i}`}
              variant={b.variant ?? 'secondary'}
              className={cn(
                'text-[10px]',
                desc && 'cursor-pointer select-none hover:opacity-80',
                selected === i && 'ring-1 ring-primary/60'
              )}
              onClick={desc ? (e) => toggle(i, b.label, e) : (stop ? (e) => e.stopPropagation() : undefined)}
              role={desc ? 'button' : undefined}
              tabIndex={desc ? 0 : undefined}
              onKeyDown={desc ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i, b.label, e); } } : undefined}
              aria-expanded={desc ? selected === i : undefined}
              data-testid={`weapon-prop-${weaponPropertyBaseName(b.label)}`}
            >
              {b.label}
            </Badge>
          );
        })}
      </div>
      {activeDesc && (
        <div className="mt-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs" data-testid="weapon-prop-description">
          <span className="font-semibold text-foreground">{weaponPropertyBaseName(activeLabel)}:</span>{' '}
          <span className="text-muted-foreground leading-relaxed">{activeDesc}</span>
        </div>
      )}
    </div>
  );
}
