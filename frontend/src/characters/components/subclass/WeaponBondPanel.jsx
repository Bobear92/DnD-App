import WeaponDesignationPanel from '@/characters/components/inventory/WeaponDesignationPanel';
import {
  weaponBondCapacity, bondedWeaponUids, WEAPON_BOND_NOTE,
} from '@/characters/components/inventory/weaponBondData';

/**
 * Eldritch Knight "Weapon Bond" panel for the Features tab. A read-only view of the
 * character's bonded weapons — the actual bonding is done in the Items tab (Weapons →
 * Bonded Weapons), which auto-saves the inventory. Rendered by the Fighter config's
 * subclassPanels for the Eldritch Knight subclass (L3+).
 */
export default function WeaponBondPanel({ data = {}, level = 1 }) {
  const capacity = weaponBondCapacity({ charClass: 'Fighter', subclass: 'Eldritch Knight', level });
  if (capacity <= 0) return null;
  const inventory = data.inventory || [];
  const bonded = bondedWeaponUids(data);

  return (
    <div className="space-y-1.5" data-testid="weapon-bond-panel">
      <WeaponDesignationPanel
        title="Bonded Weapons"
        description={WEAPON_BOND_NOTE}
        inventory={inventory}
        designatedUids={bonded}
        capacity={capacity}
        readOnly
        badgeLabel="Bonded"
        emptyText="No weapon bonded yet."
        testIdPrefix="bond-features"
      />
      <p className="text-xs text-muted-foreground" data-testid="weapon-bond-items-hint">
        Bond or change weapons in the Items tab (Weapons → Bonded Weapons).
      </p>
    </div>
  );
}
