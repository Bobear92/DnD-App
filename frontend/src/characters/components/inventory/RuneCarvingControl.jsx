import { Gem } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  runeOnItem,
  availableRunesForItem,
} from '@/characters/components/inventory/runeCarving';
import { getRune } from '@/characters/components/classData/runesData';

/**
 * The rune carved on ONE inventory item, and the control to change it — rendered inside the
 * weapon/armor/shield row in the Items tab.
 *
 * Why it lives on the item card rather than in a subclass panel: a rune is a property OF an
 * object, and the question the player asks is "what's on my axe?". The two existing
 * designate-an-item features (Weapon Bond, Hex Warrior) point the other way — one feature
 * claiming N items — so they get a panel and this gets a row control. See runeCarving.js.
 *
 * Deliberately shows the passive's EFFECT, not just the rune name, and says plainly when the
 * item is unequipped: a carved rune on a sheathed sword does nothing, and a badge that looked
 * identical either way would be the one thing most likely to mislead mid-session.
 */
export default function RuneCarvingControl({
  entry,
  characterData,
  level = 1,
  onAssign,
  onClear,
  readOnly = false,
}) {
  const carved = runeOnItem(entry?.uid, characterData);
  const rune = carved ? getRune(carved) : null;
  const options = availableRunesForItem(entry, characterData, level);
  const active = !!rune && !!entry?.equipped;

  // Nothing carved and nothing carvable — stay out of the way entirely. This is also what a
  // row shows when every rune is already carved elsewhere: repeating "all your runes are
  // spoken for" on every other weapon and armor row would be noise on a long inventory, and
  // the rune's real location is already stated on the item that bears it.
  if (!rune && (readOnly || options.length === 0)) return null;

  return (
    <div className="mt-1 space-y-1" data-testid={`rune-control-${entry.uid}`}>
      {rune && (
        <div className="flex items-start gap-1.5 text-[11px] leading-tight">
          <Badge
            className={cn(
              'text-xs shrink-0',
              active ? 'bg-sky-600 text-white' : 'bg-muted text-muted-foreground',
            )}
            data-testid={`rune-badge-${entry.uid}`}
          >
            <Gem className="h-3 w-3 mr-1" />
            {rune.name}
          </Badge>
          <span
            className={cn(active ? 'text-sky-700 dark:text-sky-400' : 'text-muted-foreground')}
            data-testid={`rune-passive-${entry.uid}`}
          >
            {active
              ? rune.passive.text
              : `Inactive — equip ${entry.name} for the rune to take effect.`}
          </span>
        </div>
      )}

      {!readOnly && (
        <div className="flex items-center gap-1 flex-wrap">
          {!rune && (
            <span className="text-[11px] text-muted-foreground mr-0.5">Carve a rune:</span>
          )}
          {options.map((o) => {
            const isCarved = o.name === carved;
            return (
              <Button
                key={o.name}
                size="sm"
                variant={isCarved ? 'secondary' : 'outline'}
                className="h-6 text-[11px] px-2"
                onClick={() => (isCarved ? onClear?.(o.name) : onAssign?.(o.name))}
                data-testid={`rune-assign-${entry.uid}-${o.key}`}
              >
                {isCarved ? 'Remove' : o.name.replace(/ Rune$/, '')}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
