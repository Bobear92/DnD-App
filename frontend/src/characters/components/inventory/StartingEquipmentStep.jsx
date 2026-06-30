import { useState, useEffect, useMemo } from 'react';
import { Coins, Package, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import itemService from '@/encyclopedia/itemService';
import WeaponPropertyBadges from '@/characters/components/inventory/WeaponPropertyBadges';
import {
  weaponBadges, weaponFacets, sortWeaponFacets, weaponMatchesFilters, weaponPropertyDescription,
} from '@/characters/components/inventory/weaponPropertyData';
import {
  classStartingEquipment, backgroundStartingEquipment, classStartingWealth,
} from '@/characters/components/inventory/startingEquipmentData';
import {
  buildItemIndex, weaponNamesOfCategory, defaultSelectedOptions,
  enumerateChooseSlots, buildStartingInventory,
} from '@/characters/components/inventory/startingEquipmentResolver';
import { weaponAttackWarning } from '@/characters/components/inventory/inventoryData';

// A selectable weapon card showing the full stat block, used by the "choose a weapon"
// slots so players can compare weapons in full instead of picking blind from a dropdown.
// A <div> (not <button>) so the property badges inside can themselves be clickable for
// their explanations; clicking the card anywhere else selects the weapon.
function WeaponCard({ weapon, selected, onSelect, testId, warning, warningTestId }) {
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
      {warning && (
        <div className="mt-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300" data-testid={warningTestId}>
          ⚠ {warning}
        </div>
      )}
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

// Filter chips for the weapon-choice cards (Two-handed, Versatile, Finesse, etc.).
// Each chip toggles a facet filter; its ⓘ button explains what that property means,
// so a new player can both narrow the list and learn the rules in one place.
function WeaponFilterBar({ options, active, onToggle, onClear }) {
  const [explain, setExplain] = useState(null);
  if (!options.length) return null;
  const desc = explain ? weaponPropertyDescription(explain) : null;
  return (
    <div className="space-y-1.5" data-testid="weapon-filter-bar">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        {options.map((label) => {
          const isActive = active.includes(label);
          const hasDesc = !!weaponPropertyDescription(label);
          return (
            <span
              key={label}
              className={cn('inline-flex items-center rounded-full border text-[11px] transition-colors',
                isActive ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50')}
            >
              <button
                type="button"
                onClick={() => onToggle(label)}
                className="pl-2 pr-1 py-0.5"
                aria-pressed={isActive}
                data-testid={`weapon-filter-${label}`}
              >
                {label}
              </button>
              {hasDesc && (
                <button
                  type="button"
                  onClick={() => setExplain((s) => (s === label ? null : label))}
                  className="pr-1.5 pl-0.5 py-0.5 opacity-60 hover:opacity-100"
                  aria-label={`What does ${label} mean?`}
                  data-testid={`weapon-filter-info-${label}`}
                >
                  <Info className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
        {active.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/50"
            data-testid="weapon-filter-clear"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      {desc && (
        <div className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs" data-testid="weapon-filter-description">
          <span className="font-semibold text-foreground">{explain}:</span>{' '}
          <span className="text-muted-foreground leading-relaxed">{desc}</span>
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
export default function StartingEquipmentStep({ charClass, backgroundName, backgroundToolChoice = '', campaignId, mode = 'equipment', size = 'Medium', edition = '5e', scores = {}, onResult }) {
  const classEquip = classStartingEquipment(charClass);
  const bgEquip = backgroundStartingEquipment(backgroundName);
  const wealth = classStartingWealth(charClass);
  const allowGold = mode === 'equipment_or_gold';

  const [weapons, setWeapons] = useState([]);
  const [index, setIndex] = useState({});
  const [selectedOptions, setSelectedOptions] = useState(() => defaultSelectedOptions(classEquip));
  const [picks, setPicks] = useState({});
  const [takeGold, setTakeGold] = useState(false);
  const [weaponFilters, setWeaponFilters] = useState([]); // active facet filters (AND)

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

  // The facet filter chips offered — the union of facets across every weapon that
  // appears in any choose-a-weapon slot, so we only show filters that match something.
  const filterOptions = useMemo(() => {
    const facets = [];
    const seen = new Set();
    for (const slot of slots) {
      for (const n of weaponNamesOfCategory(weapons, slot.filter)) {
        const key = n.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const w = weaponByName[key];
        if (w) facets.push(...weaponFacets(w));
      }
    }
    return sortWeaponFacets(facets);
  }, [slots, weapons, weaponByName]);

  // Drop any active filter no longer offered (e.g. after switching option a/b).
  useEffect(() => {
    setWeaponFilters((f) => f.filter((x) => filterOptions.includes(x)));
  }, [filterOptions]);

  const toggleWeaponFilter = (label) =>
    setWeaponFilters((f) => (f.includes(label) ? f.filter((x) => x !== label) : [...f, label]));

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
              <WeaponFilterBar
                options={filterOptions}
                active={weaponFilters}
                onToggle={toggleWeaponFilter}
                onClear={() => setWeaponFilters([])}
              />
              {slots.map((slot) => {
                const names = weaponNamesOfCategory(weapons, slot.filter);
                const selected = (picks[slot.slotKey] ?? '').toLowerCase();
                const shown = names.filter((n) => {
                  const w = weaponByName[n.toLowerCase()];
                  return weaponMatchesFilters(w ?? { name: n }, weaponFilters);
                });
                return (
                  <div key={slot.slotKey} className="space-y-1.5" data-testid={`equip-pick-${slot.slotKey}`}>
                    <div className="text-xs font-medium text-muted-foreground capitalize">{slot.label}</div>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {shown.map((n) => {
                        const w = weaponByName[n.toLowerCase()];
                        return (
                          <WeaponCard
                            key={n}
                            weapon={w ?? { name: n }}
                            selected={selected === n.toLowerCase()}
                            onSelect={() => setPicks((p) => ({ ...p, [slot.slotKey]: n }))}
                            testId={`equip-weapon-${slot.slotKey}-${n}`}
                            warning={weaponAttackWarning(w ?? { name: n }, { size, scores, edition })}
                            warningTestId={`equip-weapon-warning-${slot.slotKey}-${n}`}
                          />
                        );
                      })}
                      {shown.length === 0 && (
                        <p className="col-span-full text-xs text-muted-foreground italic py-2" data-testid={`equip-pick-empty-${slot.slotKey}`}>
                          No weapons match the selected filters.
                        </p>
                      )}
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
