import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  matchingAmmo, resolveWeaponAmmo, setWeaponAmmo, decrementAmmo,
} from '@/characters/components/inventory/ammunitionData';

/**
 * WeaponAmmoControl — the inline ammunition control for a weapon with the Ammunition
 * property: which stack it fires from, how many are left, and a Use button that spends one.
 *
 * Shared by the Items tab (under each ranged weapon) and the Action Economy tab (on each
 * ammo weapon's attack card) so the two can't drift — one spend rule, one out-of-ammo
 * message. Extracted from InventoryTab rather than copied into the second consumer.
 *
 * Pure in/out: it never touches character_data itself. `onChange(nextInventory)` hands the
 * caller a new inventory array to persist however that surface already persists inventory.
 *
 * `idPrefix` namespaces the test ids so both surfaces can render at once without colliding
 * (the Items tab keeps the original unprefixed ids).
 * `emptyHint` is the "you have no ammo for this" line, which differs per surface — the Items
 * tab can say "add some below", the Action Economy tab has to point at the Items tab.
 */
export default function WeaponAmmoControl({
  weapon, inventory = [], onChange, readOnly = false, idPrefix = '',
  emptyHint = 'No matching ammunition — add some below.',
  className,
}) {
  const matches = matchingAmmo(inventory, weapon);
  const selected = resolveWeaponAmmo(inventory, weapon);
  const remaining = selected ? (Number(selected.quantity) || 0) : 0;
  const out = !!selected && remaining <= 0;

  const selectAmmo = (ammoUid) => onChange?.(setWeaponAmmo(inventory, weapon.uid, ammoUid));
  const useOne = () => onChange?.(decrementAmmo(inventory, selected.uid, 1));

  return (
    <div
      className={cn('mt-1 flex items-center gap-2 flex-wrap', className)}
      data-testid={`${idPrefix}weapon-ammo-${weapon.uid}`}
    >
      <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {!selected ? (
        <span className="text-[11px] italic text-muted-foreground">{emptyHint}</span>
      ) : (
        <>
          {matches.length > 1 && !readOnly && (
            <select
              value={selected.uid}
              onChange={(ev) => selectAmmo(ev.target.value)}
              className="h-6 rounded border bg-background px-1 text-xs"
              data-testid={`${idPrefix}ammo-select-${weapon.uid}`}
            >
              {matches.map((a) => <option key={a.uid} value={a.uid}>{a.name}</option>)}
            </select>
          )}
          <span className="text-xs text-muted-foreground" data-testid={`${idPrefix}ammo-count-${weapon.uid}`}>
            {selected.name}: <span className={cn('font-medium tabular-nums', out ? 'text-amber-600' : 'text-foreground')}>{remaining}</span> remaining
          </span>
          {out && (
            <span
              className="text-[11px] font-medium text-amber-600"
              data-testid={`${idPrefix}ammo-out-${weapon.uid}`}
            >
              ⚠ Out of ammunition
            </span>
          )}
          {!readOnly && (
            <Button
              size="sm" variant="outline" className="h-6 px-2 text-xs"
              onClick={useOne}
              disabled={remaining <= 0}
              data-testid={`${idPrefix}use-ammo-${weapon.uid}`}
            >
              Use Ammunition
            </Button>
          )}
        </>
      )}
    </div>
  );
}
