import { useState } from 'react';
import { Plus, Trash2, Shield, Swords, Minus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ITEM_CATEGORIES, getItemCategory } from '../../encyclopedia/data/itemCategories';
import { CLASS_PROFICIENCIES_5E } from './classProficienciesData';
import { getRaceGrantedWeapons, getRaceGrantedArmor } from './raceProficienciesData';
import { gatherProficiencies } from './inventoryProficiencies';
import { isToolEntry } from './toolsData';
import ItemPickerDialog from './ItemPickerDialog';
import {
  addEntry, removeEntry, setQuantity, getByCategory,
  toggleEquipped, toggleAttuned, attunedCount, computeArmorClass, getAttacks,
  isWeaponProficient, isArmorProficient,
  EQUIPPABLE_CATEGORIES, ATTUNABLE_CATEGORIES, MAX_ATTUNED,
} from './inventoryData';

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
 * equip / attune / remove, and weapon/armor/tool proficiency banners. Inventory
 * changes are pushed up via onChange(patch); equipping armor patches armor_class too.
 */
export default function InventoryTab({
  inventory = [], scores = {}, level = 1, charClass, subclass,
  race, subrace, campaignId, characterData = {}, readOnly = false, onChange,
}) {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);

  const profs = CLASS_PROFICIENCIES_5E[charClass] || {};
  const weaponProfText = profs.weapons || '';
  const armorProfText = profs.armor || '';
  const raceWeapons = getRaceGrantedWeapons(race, subrace) || [];
  const raceArmor = getRaceGrantedArmor(race, subrace) || [];
  const proficiencies = gatherProficiencies({ charClass, characterData });

  const ac = computeArmorClass({ inventory, scores, charClass, subclass });
  const attacks = getAttacks({ inventory, scores, level, weaponProfText, raceWeapons });
  const attuned = attunedCount(inventory);

  // Tools tab gathers tool entries from anywhere; the Gear tab excludes them.
  const entriesFor = (id) => {
    if (id === 'tools') return inventory.filter(isToolEntry);
    if (id === 'adventuring-gear') return inventory.filter((e) => e.category === 'adventuring-gear' && !isToolEntry(e));
    return getByCategory(inventory, id);
  };

  const activeCategory = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];
  const entries = entriesFor(activeId);
  // Tools live in the adventuring-gear catalog, so the picker/add use that slug.
  const addCategoryId = activeId === 'tools' ? 'adventuring-gear' : activeId;
  const pickerCategory = getItemCategory(addCategoryId) ?? activeCategory;

  const push = (next, syncAc = false) => {
    const patch = { inventory: next };
    if (syncAc) patch.armor_class = computeArmorClass({ inventory: next, scores, charClass, subclass }).value;
    onChange?.(patch);
  };

  const handleAdd = (item) => push(addEntry(inventory, addCategoryId, item));
  const handleRemove = (entry) => push(removeEntry(inventory, entry.uid), entry.category === 'armor' && entry.equipped);
  const handleQty = (uid, q) => push(setQuantity(inventory, uid, q));
  const handleEquip = (uid) => push(toggleEquipped(inventory, uid), true);
  const handleAttune = (uid) => push(toggleAttuned(inventory, uid));

  const entryProficient = (e) =>
    e.category === 'weapons' ? isWeaponProficient(e, { weaponProfText, raceWeapons })
    : e.category === 'armor' ? isArmorProficient(e, { armorProfText, raceArmor })
    : true;

  return (
    <div className="space-y-4">
      {/* Combat summary */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Armor Class
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
                <div key={a.uid} className="flex items-center justify-between text-sm" data-testid={`attack-${a.uid}`}>
                  <span className="font-medium flex items-center gap-1.5">
                    {a.name}
                    {!a.proficient && <span className="text-xs text-amber-600">(not proficient)</span>}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{a.toHit} · {a.damage}</span>
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
      {activeId === 'weapons' && <ProficiencyBanner label="Weapon" text={proficiencies.weapons.text} grants={proficiencies.weapons.grants} />}
      {activeId === 'armor' && <ProficiencyBanner label="Armor" text={proficiencies.armor.text} grants={proficiencies.armor.grants} />}
      {activeId === 'tools' && <ProficiencyBanner label="Tool" text={proficiencies.tools.text} grants={proficiencies.tools.grants} />}

      {/* Active category */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{activeId === 'tools' ? 'Tools Carried' : activeCategory.label}</h3>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)} data-testid="inv-add-btn">
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
                    <div className="text-xs text-muted-foreground truncate">{activeCategory.subtitle(e)}</div>
                  </div>

                  {/* Quantity */}
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

      <ItemPickerDialog
        category={pickerCategory}
        campaignId={campaignId}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
