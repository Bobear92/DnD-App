import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSaveFeatures } from '@/characters/components/skills/saveFeatures';

/**
 * The save-affecting features a character has, listed under the Saving Throws grid.
 *
 * Deliberately name-only: a player scanning their saves mid-roll wants to know *that* a
 * feature applies, not to read a paragraph. Clicking a name expands its full rules text,
 * one at a time — the same click-to-see-more contract the derived numbers above it use
 * (BreakdownValue) and the MagicAttackBadge note.
 *
 * Renders nothing when the character has no such features, so the panel costs no space
 * on the great majority of sheets.
 */
export default function SaveFeaturesPanel({ charClass, subclass, level, edition }) {
  const [openKey, setOpenKey] = useState(null);
  const features = getSaveFeatures({ charClass, subclass, level, edition });

  if (features.length === 0) return null;

  return (
    <div data-testid="save-features">
      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
        Features Affecting Saves
      </div>
      <div className="space-y-1">
        {features.map((f) => {
          const expanded = openKey === f.key;
          return (
            <div key={f.key} className="rounded border">
              <button
                type="button"
                onClick={() => setOpenKey(expanded ? null : f.key)}
                aria-expanded={expanded}
                title={`What ${f.name} does`}
                data-testid={`save-feature-${f.key}`}
                className={cn(
                  'w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-xs rounded hover:bg-muted',
                  expanded && 'bg-muted',
                )}
              >
                {expanded
                  ? <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  : <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                <span className="font-medium flex-1">{f.name}</span>
                <span className="text-[10px] text-muted-foreground">{f.source}</span>
              </button>
              {expanded && (
                <p
                  data-testid={`save-feature-${f.key}-desc`}
                  className="px-2 pb-2 pt-0.5 text-[11px] leading-snug text-muted-foreground"
                >
                  {f.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
