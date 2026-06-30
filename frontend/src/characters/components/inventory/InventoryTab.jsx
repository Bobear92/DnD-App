import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Shield, Swords, Minus, Wrench, Target, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ITEM_CATEGORIES, getItemCategory } from '@/encyclopedia/data/itemCategories';
import { CLASS_PROFICIENCIES_5E } from '@/characters/components/classData/classProficienciesData';
import { getRaceGrantedWeapons, getRaceGrantedArmor } from '@/characters/components/race/raceProficienciesData';
import { gatherProficiencies } from '@/characters/components/inventory/inventoryProficiencies';
import { isToolEntry } from '@/characters/components/inventory/toolsData';
import {
  isAmmunitionEntry, isAmmoItem, weaponNeedsAmmo, matchingAmmo,
  resolveWeaponAmmo, setWeaponAmmo, decrementAmmo, setAmmoQuantity,
} from '@/characters/components/inventory/ammunitionData';
import WeaponPropertyBadges from '@/characters/components/inventory/WeaponPropertyBadges';
import { weaponBadges } from '@/characters/components/inventory/weaponPropertyData';
import ItemPickerDialog from '@/characters/components/inventory/ItemPickerDialog';
import {
  buildEntry, removeEntry, setQuantity, getByCategory, normalizeWeapons,
  toggleEquipped, toggleAttuned, attunedCount, computeArmorClass, getAttacks,
  isWeaponProficient, isArmorProficient, creatureSize, weaponAttackWarning, weaponLoadingNote,
  EQUIPPABLE_CATEGORIES, ATTUNABLE_CATEGORIES, MAX_ATTUNED,
} from '@/characters/components/inventory/inventoryData';
import { gatherFightingStyles } from '@/characters/components/combat/fightingStyles';

// Tools are stored as adventuring-gear entries but get their own sub-tab (inserted
// right after Gear). It isn't a real encyclopedia category — the Add picker reuses
// the adventuring-gear catalog.
const TOOLS_CATEGORY = {
  id: 'tools', label: 'Tools', singular: 'Tool', icon: Wrench, accent: 'bg-teal-600',
  subtitle: (it) => (it.item_category && it.item_category !== 'Tools' ? it.item_category : 'Tool'),
};
const GEAR_IDX = ITEM_CATEGORIES.findIndex((c) => c.id === 'adventuring-gear');
const CATEGORIES = [
  ...ITEM_CATEGORIES.slice(0, GEAR_IDX + 1),
  TOOLS_CATEGORY,
  ...ITEM_CATEGORIES.slice(GEAR_IDX + 1),
];

// Ammunition lives in the adventuring-gear catalog but is added from / shown under the
// Weapons tab. This synthetic category drives the Add Ammunition picker.
const AMMO_PICKER_CATEGORY = {
  id: 'adventuring-gear', label: 'Ammunition', singular: 'Ammunition',
  accent: 'bg-amber-600', subtitle: (it) => it.description || it.category || 'Ammunition',
};

function ProficiencyBanner({ label, text, grants }) {
  const none = (!text || text === 'None') && grants.length === 0;
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-1" data-testid="proficiency-banner">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label} Proficiencies</div>
      {none ? (
        <div className="text-sm italic text-muted-foreground">None</div>
      ) : (
        <>
          {text && text !== 'None' && <div className="text-sm">{text}</div>}
          {grants.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {grants.map((g) => <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Items tab body: combat summary (computed AC + attacks from equipped weapons),
 * category sub-tabs (incl. a Tools tab), per-category owned-item lists with quantity /
 * equip / attune / remove, and weapon/armor/tool proficiency banners. Ammunition is
 * surfaced under the Weapons tab — a ranged weapon with the Ammunition property gets an
 * inline ammo chooser + count + Use button. Inventory changes are pushed up via
 * onChange(patch); equipping armor patches armor_class too.
 */
export default function InventoryTab({
  inventory: inventoryProp = [], scores = {}, level = 1, charClass, subclass,
  race, subrace, campaignId, characterData = {}, edition = '5e', readOnly = false, onChange,
}) {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  // picker = { category (config obj), filter, defaultQty } | null
  const [picker, setPicker] = useState(null);

  // Weapons are individual items (no stacking) — normalize so a "Handaxe ×2" stack shows
  // as two separate, independently-equippable rows. Idempotent + deterministic uids.
  const inventory = useMemo(() => normalizeWeapons(inventoryProp), [inventoryProp]);

  const profs = CLASS_PROFICIENCIES_5E[charClass] || {};
  const weaponProfText = profs.weapons || '';
  const armorProfText = profs.armor || '';
  const raceWeapons = getRaceGrantedWeapons(race, subrace) || [];
  const raceArmor = getRaceGrantedArmor(race, subrace) || [];
  const proficiencies = gatherProficiencies({ charClass, characterData });

  const size = creatureSize(characterData, race);
  const styles = gatherFightingStyles(characterData);
  const ac = computeArmorClass({ inventory, scores, charClass, subclass, feats: characterData?.feats, styles });
  const attacks = getAttacks({ inventory, scores, level, weaponProfText, raceWeapons, size, edition, feats: characterData?.feats, styles });
  const attuned = attunedCount(inventory);

  // Tools tab gathers tool entries from anywhere; the Gear tab excludes tools + ammo;
  // ammo is shown in its own subsection of the Weapons tab.
  const entriesFor = (id) => {
    if (id === 'tools') return inventory.filter(isToolEntry);
    if (id === 'adventuring-gear') return inventory.filter((e) => e.category === 'adventuring-gear' && !isToolEntry(e) && !isAmmunitionEntry(e));
    if (id === 'weapons') return inventory.filter((e) => e.category === 'weapons');
    return getByCategory(inventory, id);
  };

  const ammoEntries = inventory.filter(isAmmunitionEntry);

  const activeCategory = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];
  const entries = entriesFor(activeId);

  const push = (next, syncAc = false) => {
    const patch = { inventory: next };
    if (syncAc) patch.armor_class = computeArmorClass({ inventory: next, scores, charClass, subclass, feats: characterData?.feats, styles }).value;
    onChange?.(patch);
  };

  // Opening the Add picker for the current tab (Tools/Gear reuse the gear catalog;
  // the Gear picker hides ammunition since it has its own Add Ammunition button).
  const openTabPicker = () => {
    const categoryId = activeId === 'tools' ? 'adventuring-gear' : activeId;
    const cfg = getItemCategory(categoryId) ?? activeCategory;
    const filter = activeId === 'adventuring-gear' ? (it) => !isAmmoItem(it) : null;
    setPicker({ category: cfg, filter, defaultQty: null });
  };
  const openAmmoPicker = () => setPicker({
    category: AMMO_PICKER_CATEGORY,
    filter: isAmmoItem,
    defaultQty: (it) => parseInt(it.quantity, 10) || 1,
  });

  const handleAdd = (item) => {
    const qty = picker?.defaultQty ? picker.defaultQty(item) : 1;
    push([...inventory, buildEntry(picker?.category?.id ?? activeId, item, qty)]);
    setPicker(null);
  };
  const handleRemove = (entry) => push(removeEntry(inventory, entry.uid), entry.category === 'armor' && entry.equipped);
  const handleQty = (uid, q) => push(setQuantity(inventory, uid, q));
  const handleAmmoQty = (uid, q) => push(setAmmoQuantity(inventory, uid, q));
  const handleEquip = (uid) => push(toggleEquipped(inventory, uid), true);
  const handleAttune = (uid) => push(toggleAttuned(inventory, uid));
  const handleSelectAmmo = (weaponUid, ammoUid) => push(setWeaponAmmo(inventory, weaponUid, ammoUid));
  const handleUseAmmo = (ammoUid) => push(decrementAmmo(inventory, ammoUid, 1));

  const entryProficient = (e) =>
    e.category === 'weapons' ? isWeaponProficient(e, { weaponProfText, raceWeapons })
    : e.category === 'armor' ? isArmorProficient(e, { armorProfText, raceArmor })
    : true;

  // Inline ammo control rendered under a ranged weapon with the Ammunition property.
  const renderWeaponAmmo = (weapon) => {
    const matches = matchingAmmo(inventory, weapon);
    const sel = resolveWeaponAmmo(inventory, weapon);
    return (
      <div className="mt-1 flex items-center gap-2 flex-wrap" data-testid={`weapon-ammo-${weapon.uid}`}>
        <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {!sel ? (
          <span className="text-[11px] italic text-muted-foreground">No matching ammunition — add some below.</span>
        ) : (
          <>
            {matches.length > 1 && !readOnly && (
              <select
                value={sel.uid}
                onChange={(ev) => handleSelectAmmo(weapon.uid, ev.target.value)}
                className="h-6 rounded border bg-background px-1 text-xs"
                data-testid={`ammo-select-${weapon.uid}`}
              >
                {matches.map((a) => <option key={a.uid} value={a.uid}>{a.name}</option>)}
              </select>
            )}
            <span className="text-xs text-muted-foreground" data-testid={`ammo-count-${weapon.uid}`}>
              {sel.name}: <span className="font-medium text-foreground tabular-nums">{sel.quantity ?? 0}</span> remaining
            </span>
            {!readOnly && (
              <Button
                size="sm" variant="outline" className="h-6 px-2 text-xs"
                onClick={() => handleUseAmmo(sel.uid)}
                disabled={(sel.quantity ?? 0) <= 0}
                data-testid={`use-ammo-${weapon.uid}`}
              >
                Use Ammunition
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Combat summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Armor Class
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/armor-class`}
              className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-primary hover:underline"
              data-testid="armor-class-learn-more"
            >
              Learn more <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" data-testid="inventory-ac">{ac.value}</span>
            <span className="text-xs text-muted-foreground">{ac.parts.join('  ')}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{ac.source}</p>
        </div>

        <div className="rounded-lg border bg-card p-4" data-testid="inventory-attacks">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Swords className="h-4 w-4 text-muted-foreground" /> Attacks
          </div>
          {attacks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No weapons equipped.</p>
          ) : (
            <div className="space-y-1">
              {attacks.map((a) => (
                <div key={a.uid} className="flex flex-col" data-testid={`attack-${a.uid}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-1.5">
                      {a.name}
                      {!a.proficient && <span className="text-xs text-amber-600">(not proficient)</span>}
                      {a.disadvantage && <span className="text-xs text-amber-600">(disadvantage)</span>}
                    </span>
                    <span className="text-muted-foreground tabular-nums">{a.toHit} · {a.damage}</span>
                  </div>
                  {a.warning && (
                    <span className="text-[11px] text-amber-600 leading-tight" data-testid={`attack-warning-${a.uid}`}>{a.warning}</span>
                  )}
                  {a.styleNotes?.length > 0 && (
                    <span className="text-[11px] text-emerald-600 leading-tight" data-testid={`attack-style-${a.uid}`}>
                      Includes {a.styleNotes.join(', ')} fighting style.
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const count = entriesFor(c.id).length;
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid={`inv-category-${c.id}`}
            >
              <Icon className="h-4 w-4" />
              {c.label}
              {count > 0 && <Badge variant="secondary" className="text-xs px-1.5">{count}</Badge>}
            </button>
          );
        })}
      </div>

      {/* Proficiency banner (weapons / armor / tools tabs) */}
      {activeId === 'weapons' && (
        <>
          <ProficiencyBanner label="Weapon" text={proficiencies.weapons.text} grants={proficiencies.weapons.grants} />
          <p className="text-xs text-muted-foreground -mt-2">
            You can draw or stow one weapon free each turn (two with Dual Wielder).{' '}
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/object-interaction`}
              className="text-primary hover:underline inline-flex items-center gap-0.5"
              data-testid="object-interaction-learn-more"
            >
              How drawing &amp; stowing works <ArrowUpRight className="w-3 h-3" />
            </Link>
          </p>
        </>
      )}
      {activeId === 'armor' && <ProficiencyBanner label="Armor" text={proficiencies.armor.text} grants={proficiencies.armor.grants} />}
      {activeId === 'tools' && <ProficiencyBanner label="Tool" text={proficiencies.tools.text} grants={proficiencies.tools.grants} />}

      {/* Active category */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{activeId === 'tools' ? 'Tools Carried' : activeCategory.label}</h3>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={openTabPicker} data-testid="inv-add-btn">
              <Plus className="h-4 w-4 mr-1" /> Add {activeCategory.singular}
            </Button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No {activeCategory.label.toLowerCase()} yet.
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {entries.map((e) => {
              const canEquip = EQUIPPABLE_CATEGORIES.has(e.category);
              const canAttune = ATTUNABLE_CATEGORIES.has(e.category);
              const proficient = entryProficient(e);
              const attackWarning = e.category === 'weapons'
                ? weaponAttackWarning(e, { size, scores, edition })
                : null;
              const loadingNote = e.category === 'weapons'
                ? weaponLoadingNote(e, { feats: characterData?.feats, proficient, edition })
                : null;
              const loadingIgnored = loadingNote && /ignored/i.test(loadingNote);
              const showAmmo = e.category === 'weapons' && weaponNeedsAmmo(e);
              return (
                <div key={e.uid} className="flex items-center gap-3 px-3 py-2" data-testid={`inv-row-${e.uid}`}>
                  <div className={cn('w-1.5 h-9 rounded-full shrink-0', activeCategory.accent)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{e.name}</span>
                      {e.equipped && <Badge className="text-xs bg-emerald-600 text-white">Equipped</Badge>}
                      {e.attuned && <Badge className="text-xs bg-violet-600 text-white">Attuned</Badge>}
                      {canEquip && e.equipped && !proficient && (
                        <span className="text-xs text-amber-600">Not proficient</span>
                      )}
                    </div>
                    {attackWarning && (
                      <div className="text-[11px] text-amber-600 leading-tight" data-testid={`inv-warning-${e.uid}`}>{attackWarning}</div>
                    )}
                    {loadingNote && (
                      <div
                        className={cn('text-[11px] leading-tight', loadingIgnored ? 'text-emerald-600' : 'text-amber-600')}
                        data-testid={`inv-loading-${e.uid}`}
                      >
                        {loadingNote}{' '}
                        <Link
                          to={`/campaigns/${campaignId}/encyclopedia/mechanics/loading`}
                          className="text-primary hover:underline"
                          data-testid={`loading-learn-more-${e.uid}`}
                        >How the Loading property works</Link>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">{activeCategory.subtitle(e)}</div>
                    {e.category === 'weapons' && (
                      <WeaponPropertyBadges badges={weaponBadges(e)} className="mt-1" />
                    )}
                    {showAmmo && renderWeaponAmmo(e)}
                  </div>

                  {/* Quantity — hidden for weapons (each weapon is an individual item) */}
                  {e.category !== 'weapons' && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!readOnly && (
                        <button className="h-6 w-6 rounded border hover:bg-muted disabled:opacity-40"
                          onClick={() => handleQty(e.uid, (e.quantity ?? 1) - 1)} disabled={(e.quantity ?? 1) <= 1}
                          aria-label="Decrease quantity">
                          <Minus className="h-3 w-3 mx-auto" />
                        </button>
                      )}
                      <span className="text-xs text-muted-foreground w-8 text-center tabular-nums" data-testid={`qty-${e.uid}`}>×{e.quantity ?? 1}</span>
                      {!readOnly && (
                        <button className="h-6 w-6 rounded border hover:bg-muted"
                          onClick={() => handleQty(e.uid, (e.quantity ?? 1) + 1)} aria-label="Increase quantity">
                          <Plus className="h-3 w-3 mx-auto" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Equip / Attune */}
                  {!readOnly && canEquip && (
                    <Button size="sm" variant={e.equipped ? 'default' : 'outline'} className="h-7"
                      onClick={() => handleEquip(e.uid)} data-testid={`equip-btn-${e.uid}`}>
                      {e.equipped ? 'Unequip' : 'Equip'}
                    </Button>
                  )}
                  {!readOnly && canAttune && (
                    <Button size="sm" variant={e.attuned ? 'default' : 'outline'} className="h-7"
                      onClick={() => handleAttune(e.uid)}
                      disabled={!e.attuned && attuned >= MAX_ATTUNED}
                      data-testid={`attune-btn-${e.uid}`}>
                      {e.attuned ? 'Unattune' : 'Attune'}
                    </Button>
                  )}
                  {!readOnly && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(e)} data-testid={`remove-item-${e.uid}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {ATTUNABLE_CATEGORIES.has(activeId) && (
          <p className="text-xs text-muted-foreground">Attunement: {attuned} / {MAX_ATTUNED} slots used.</p>
        )}
      </div>

      {/* Ammunition subsection (Weapons tab only) */}
      {activeId === 'weapons' && (
        <div className="space-y-2 pt-2" data-testid="ammunition-section">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Target className="h-4 w-4 text-muted-foreground" /> Ammunition
            </h3>
            {!readOnly && (
              <Button size="sm" variant="outline" onClick={openAmmoPicker} data-testid="add-ammo-btn">
                <Plus className="h-4 w-4 mr-1" /> Add Ammunition
              </Button>
            )}
          </div>

          {ammoEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              No ammunition yet.
            </div>
          ) : (
            <div className="rounded-lg border divide-y">
              {ammoEntries.map((a) => (
                <div key={a.uid} className="flex items-center gap-3 px-3 py-2" data-testid={`ammo-row-${a.uid}`}>
                  <div className="w-1.5 h-9 rounded-full shrink-0 bg-amber-600" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{a.name}</span>
                    <div className="text-xs text-muted-foreground truncate">{a.description || 'Ammunition'}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!readOnly && (
                      <button className="h-6 w-6 rounded border hover:bg-muted disabled:opacity-40"
                        onClick={() => handleAmmoQty(a.uid, (a.quantity ?? 0) - 1)} disabled={(a.quantity ?? 0) <= 0}
                        aria-label="Decrease ammunition">
                        <Minus className="h-3 w-3 mx-auto" />
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground w-10 text-center tabular-nums" data-testid={`ammo-qty-${a.uid}`}>×{a.quantity ?? 0}</span>
                    {!readOnly && (
                      <button className="h-6 w-6 rounded border hover:bg-muted"
                        onClick={() => handleAmmoQty(a.uid, (a.quantity ?? 0) + 1)} aria-label="Increase ammunition">
                        <Plus className="h-3 w-3 mx-auto" />
                      </button>
                    )}
                  </div>
                  {!readOnly && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(a)} data-testid={`remove-item-${a.uid}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ItemPickerDialog
        category={picker?.category ?? activeCategory}
        campaignId={campaignId}
        open={!!picker}
        filter={picker?.filter}
        onClose={() => setPicker(null)}
        onAdd={handleAdd}
      />
    </div>
  );
}
