import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Shared "designate a weapon from your inventory" panel — used by the Eldritch
 * Knight's Weapon Bond (Items tab + Features tab) and the Hexblade's Hex Warrior
 * (Items tab + Warlock sheet). Pure UI: the caller supplies the designated uids,
 * capacity, eligibility rule, and an onToggle(uid) that persists the patch.
 */
export default function WeaponDesignationPanel({
  title,
  description,
  inventory = [],
  designatedUids = [],
  capacity = 1,
  eligible = () => true,
  ineligibleReason = null,
  onToggle,
  readOnly = false,
  swapAtCapacity = false, // single-slot features (Hex Warrior) swap instead of blocking
  badgeLabel = 'Bonded',
  actionLabel = 'Bond',
  clearLabel = 'Unbond',
  emptyText = 'No weapon designated yet.',
  testIdPrefix = 'bond',
}) {
  const p = testIdPrefix;
  const weapons = (inventory || []).filter((e) => e.category === 'weapons');
  const designated = weapons.filter((e) => designatedUids.includes(e.uid));
  const atCapacity = designated.length >= capacity;

  const weaponMeta = (e) =>
    [e.damage, e.damage_type].filter(Boolean).join(' ') || null;

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2" data-testid={`${p}-panel`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-500" /> {title}
        </h3>
        <Badge variant="secondary" className="text-xs" data-testid={`${p}-count`}>
          {designated.length}/{capacity}
        </Badge>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}

      {designated.length === 0 ? (
        <div className="text-sm italic text-muted-foreground" data-testid={`${p}-empty`}>{emptyText}</div>
      ) : (
        <div className="space-y-1">
          {designated.map((e) => (
            <div key={e.uid} className="flex items-center gap-2 text-sm" data-testid={`${p}-designated-${e.uid}`}>
              <Badge className="text-xs bg-violet-600 text-white">{badgeLabel}</Badge>
              <span className="font-medium">{e.name}</span>
              {weaponMeta(e) && <span className="text-xs text-muted-foreground">{weaponMeta(e)}</span>}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        weapons.length === 0 ? (
          <div className="text-xs text-muted-foreground" data-testid={`${p}-no-weapons`}>
            No weapons in your inventory yet — add one in the Items tab first.
          </div>
        ) : (
          <div className="rounded-md border divide-y bg-background/50">
            {weapons.map((e) => {
              const isDesignated = designatedUids.includes(e.uid);
              const isEligible = eligible(e);
              const blocked = !isDesignated && atCapacity && !swapAtCapacity;
              return (
                <div key={e.uid} className="flex items-center gap-2 px-2.5 py-1.5">
                  <div className="flex-1 min-w-0">
                    <span className={cn('text-sm', isDesignated && 'font-medium')}>{e.name}</span>
                    {weaponMeta(e) && <span className="text-xs text-muted-foreground ml-2">{weaponMeta(e)}</span>}
                    {!isEligible && ineligibleReason && (
                      <div className="text-[11px] text-muted-foreground italic" data-testid={`${p}-ineligible-${e.uid}`}>
                        {ineligibleReason}
                      </div>
                    )}
                  </div>
                  {isEligible && (
                    <Button
                      size="sm"
                      variant={isDesignated ? 'secondary' : 'outline'}
                      className="h-7 text-xs"
                      disabled={blocked}
                      onClick={() => onToggle?.(e.uid)}
                      data-testid={`${p}-toggle-${e.uid}`}
                    >
                      {isDesignated ? clearLabel : actionLabel}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
