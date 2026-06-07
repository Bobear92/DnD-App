import { useState, useEffect, useMemo } from 'react';
import { Coins, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import itemService from '../../encyclopedia/itemService';
import WeaponPropertyBadges from './WeaponPropertyBadges';
import { weaponBadges } from './weaponPropertyData';
import {
  classStartingEquipment, backgroundStartingEquipment, classStartingWealth,
} from './startingEquipmentData';
import {
  buildItemIndex, weaponNamesOfCategory, defaultSelectedOptions,
  enumerateChooseSlots, buildStartingInventory,
} from './startingEquipmentResolver';

// A selectable weapon card showing the full stat block, used by the "choose a weapon"
// slots so players can compare weapons in full instead of picking blind from a dropdown.
// A <div> (not <button>) so the property badges inside can themselves be clickable for
// their explanations; clicking the card anywhere else selects the weapon.
function WeaponCard({ weapon, selected, onSelect, testId }) {
  const dmg = [weapon.damage, weapon.damage_type].filter(Boolean).join(' ');
  const physical = [weapon.weight ? `${weapon.weight} lb` : null, weapon.cost].filter(Boolean).join(' · ');
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      data-testid={testId}
      className={cn('rounded-lg border p-3 text-left transition-colors cursor-pointer',
        selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-sm">{weapon.name}</span>
        {dmg && <span className="text-xs font-semibold whitespace-nowrap">{dmg}</span>}
      </div>
      <WeaponPropertyBadges badges={weaponBadges(weapon)} stop className="mt-1.5" />
      {(weapon.range || physical || weapon.description) && (
        <div className="mt-1.5 text-xs text-muted-foreground space-y-0.5">
          {weapon.range && <div>Range: {weapon.range}</div>}
          {physical && <div>{physical}</div>}
          {weapon.description && <div className="italic leading-relaxed">{weapon.description}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * Character-creation Equipment step. Lets the player resolve their class's (a)/(b)
 * starting-equipment choices and any "choose a weapon" slots, shows the granted
 * background items, and — when the campaign allows — offers taking class starting
 * gold instead of class equipment.
 *
 * Reports up via onResult({ inventory, bonusGold }): inventory = resolved entries
 * (snapshots of encyclopedia items, plain entries otherwise); bonusGold = class
 * starting wealth when "take gold" is chosen, else 0. (Background gold is handled
 * separately by CharacterCreate.)
 */
export default function StartingEquipmentStep({ charClass, backgroundName, backgroundToolChoice = '', campaignId, mode = 'equipment', onResult }) {
  const classEquip = classStartingEquipment(charClass);
  const bgEquip = backgroundStartingEquipment(backgroundName);
  const wealth = classStartingWealth(charClass);
  const allowGold = mode === 'equipment_or_gold';

  const [weapons, setWeapons] = useState([]);
  const [index, setIndex] = useState({});
  const [selectedOptions, setSelectedOptions] = useState(() => defaultSelectedOptions(classEquip));
  const [picks, setPicks] = useState({});
  const [takeGold, setTakeGold] = useState(false);

  // Load the encyclopedia items the resolver needs (weapons / armor / gear).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      itemService.getItems('weapons', campaignId),
      itemService.getItems('armor', campaignId),
      itemService.getItems('adventuring-gear', campaignId),
    ]).then(([w, a, g]) => {
      if (cancelled) return;
      setWeapons(w);
      setIndex(buildItemIndex({ weapons: w, armor: a, 'adventuring-gear': g }));
    });
    return () => { cancelled = true; };
  }, [campaignId]);

  const slots = useMemo(() => enumerateChooseSlots(classEquip, selectedOptions), [classEquip, selectedOptions]);

  // name → weapon object, for enriching the choose-a-weapon dropdowns with stats.
  const weaponByName = useMemo(() => {
    const m = {};
    for (const w of weapons) m[(w.name || '').toLowerCase()] = w;
    return m;
  }, [weapons]);

  // Contents of any equipment packs in an option (from the seeded pack description),
  // so players can compare what's inside before choosing.
  const packContents = (opt) =>
    (opt.refs || [])
      .filter((r) => !r.choose && /pack/i.test(r.name))
      .map((r) => index[r.category]?.[(r.name || '').toLowerCase()]?.description)
      .filter(Boolean);

  // Recompute the resolved result whenever a selection changes.
  useEffect(() => {
    const inventory = buildStartingInventory({
      classEquip: takeGold ? null : classEquip,
      bgEquip,
      selectedOptions,
      picks,
      index,
      bgToolChoice: backgroundToolChoice,
    });
    onResult?.({ inventory, bonusGold: takeGold ? (wealth?.avg ?? 0) : 0 });
    // onResult is the parent state setter (stable); deps are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions, picks, takeGold, index, backgroundToolChoice]);

  if (!classEquip) {
    return <div className="text-sm text-muted-foreground" data-testid="equipment-step">No starting equipment defined for {charClass}.</div>;
  }

  return (
    <div className="space-y-6" data-testid="equipment-step">
      {/* Take-gold option */}
      {allowGold && wealth && (
        <button
          type="button"
          onClick={() => setTakeGold((v) => !v)}
          className={cn('w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
            takeGold ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
          data-testid="equip-take-gold"
        >
          <Coins className={cn('h-5 w-5', takeGold ? 'text-primary' : 'text-muted-foreground')} />
          <div className="flex-1">
            <div className="text-sm font-medium">Take starting gold instead of class equipment</div>
            <div className="text-xs text-muted-foreground">{wealth.dice} ≈ {wealth.avg} gp added to your wallet. You keep your background items.</div>
          </div>
          <div className={cn('h-4 w-4 rounded-full border-2', takeGold ? 'border-primary bg-primary' : 'border-muted-foreground')} />
        </button>
      )}

      {/* Class equipment choices */}
      {!takeGold && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Package className="h-4 w-4 text-muted-foreground" /> {charClass} Equipment</h3>
          {classEquip.groups.map((grp, gi) => {
            if (grp.fixed) {
              const items = grp.fixed.filter((r) => !r.choose);
              if (items.length === 0) return null;
              return (
                <div key={`fixed-${gi}`} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Also includes: </span>
                  {items.map((r) => `${r.name}${r.quantity > 1 ? ` ×${r.quantity}` : ''}`).join(', ')}
                </div>
              );
            }
            return (
              <div key={grp.id} className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">{grp.prompt}</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {grp.options.map((opt) => {
                    const active = selectedOptions[grp.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedOptions((s) => ({ ...s, [grp.id]: opt.key }))}
                        className={cn('rounded-lg border p-3 text-left text-sm transition-colors',
                          active ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
                        data-testid={`equip-opt-${grp.id}-${opt.key}`}
                      >
                        <div className="font-medium">{opt.label}</div>
                        {packContents(opt).map((d, di) => (
                          <div key={di} className="mt-1 text-xs text-muted-foreground" data-testid={`equip-opt-contents-${grp.id}-${opt.key}`}>
                            <span className="font-medium">Contains: </span>{d}
                          </div>
                        ))}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Weapon-choice cards for the selected options — full stats per weapon */}
          {slots.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              {slots.map((slot) => {
                const names = weaponNamesOfCategory(weapons, slot.filter);
                const selected = (picks[slot.slotKey] ?? '').toLowerCase();
                return (
                  <div key={slot.slotKey} className="space-y-1.5" data-testid={`equip-pick-${slot.slotKey}`}>
                    <div className="text-xs font-medium text-muted-foreground capitalize">{slot.label}</div>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {names.map((n) => {
                        const w = weaponByName[n.toLowerCase()];
                        return (
                          <WeaponCard
                            key={n}
                            weapon={w ?? { name: n }}
                            selected={selected === n.toLowerCase()}
                            onSelect={() => setPicks((p) => ({ ...p, [slot.slotKey]: n }))}
                            testId={`equip-weapon-${slot.slotKey}-${n}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Background equipment (always granted) */}
      {bgEquip.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-sm font-semibold">{backgroundName} Equipment</h3>
          <div className="text-sm text-muted-foreground" data-testid="equip-background-items">
            {bgEquip.map((r) => `${r.name}${r.quantity > 1 ? ` ×${r.quantity}` : ''}`).join(', ')}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Items appear in your character's Items tab. You can equip, add, or remove anything later.
      </p>
    </div>
  );
}
