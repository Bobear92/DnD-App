import { Sword, Shield, Backpack, FlaskConical, Sparkles, UtensilsCrossed } from 'lucide-react';

/**
 * Per-category configuration for the Encyclopedia → Items tab.
 *
 * One config object per backend item category drives the generic ItemsTab /
 * CampaignItemsTab / ItemEditPage components — so adding/adjusting a category is
 * a data change here, not a new component.
 *
 * Shape:
 *   id          slug used in the URL + as the REST endpoint (matches backend route)
 *   label       tab label (plural)
 *   singular    singular noun for buttons/dialogs ("Weapon")
 *   icon        lucide icon component
 *   accent      tailwind bg class for the list accent bar / tab dot
 *   subtitle    (item) => string|falsy   secondary text under the name in the list row
 *   badges      (item) => string[]       small right-aligned pills in the list row
 *   filters     [{ key, allLabel }]      builds a <select> per field from distinct values
 *   stats       [{ label, get:(item)=>string|falsy }]  detail-dialog stat grid
 *   bodyKey     field name holding the long prose block in the detail dialog
 *   fields      [{ key, label, type, options?, placeholder?, required?, half? }]  edit form
 *   empty       blank form template for "new"
 *
 * field.type ∈ 'text' | 'textarea' | 'select' | 'number' | 'checkbox'
 */

export const ITEM_CATEGORIES = [
  {
    id: 'weapons',
    label: 'Weapons',
    singular: 'Weapon',
    icon: Sword,
    accent: 'bg-red-500',
    subtitle: (it) => [it.weapon_category, it.weapon_type].filter(Boolean).join(' '),
    badges: (it) => [it.damage && `${it.damage}${it.damage_type ? ` ${it.damage_type}` : ''}`].filter(Boolean),
    filters: [
      { key: 'weapon_category', allLabel: 'All Categories' },
      { key: 'weapon_type', allLabel: 'All Types' },
    ],
    stats: [
      { label: 'Category', get: (it) => it.weapon_category },
      { label: 'Type', get: (it) => it.weapon_type },
      { label: 'Damage', get: (it) => it.damage && `${it.damage}${it.damage_type ? ` ${it.damage_type}` : ''}` },
      { label: 'Properties', get: (it) => it.properties },
      { label: 'Cost', get: (it) => it.cost },
      { label: 'Weight', get: (it) => it.weight },
    ],
    bodyKey: 'description',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'weapon_category', label: 'Category', type: 'select', options: ['Simple', 'Martial'], required: true, half: true },
      { key: 'weapon_type', label: 'Type', type: 'select', options: ['Melee', 'Ranged'], required: true, half: true },
      { key: 'damage', label: 'Damage', type: 'text', placeholder: '1d8', required: true, half: true },
      { key: 'damage_type', label: 'Damage Type', type: 'text', placeholder: 'Slashing', required: true, half: true },
      { key: 'properties', label: 'Properties', type: 'text', placeholder: 'Versatile (1d10), Thrown' },
      { key: 'cost', label: 'Cost', type: 'text', placeholder: '15 gp', required: true, half: true },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: '3 lb.', required: true, half: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    empty: {
      name: '', weapon_category: 'Simple', weapon_type: 'Melee',
      damage: '', damage_type: '', properties: '', cost: '', weight: '', description: '',
    },
  },

  {
    id: 'armor',
    label: 'Armor',
    singular: 'Armor',
    icon: Shield,
    accent: 'bg-slate-500',
    subtitle: (it) => it.armor_type,
    badges: (it) => [it.armor_class != null && `AC ${it.armor_class}`].filter(Boolean),
    filters: [{ key: 'armor_type', allLabel: 'All Types' }],
    stats: [
      { label: 'Type', get: (it) => it.armor_type },
      { label: 'Base AC', get: (it) => (it.armor_class != null ? String(it.armor_class) : '') },
      { label: 'Strength Req.', get: (it) => (it.strength_requirement ? `Str ${it.strength_requirement}` : 'None') },
      { label: 'Stealth', get: (it) => (it.stealth_disadvantage ? 'Disadvantage' : 'Normal') },
      { label: 'Cost', get: (it) => it.cost },
      { label: 'Weight', get: (it) => it.weight },
    ],
    bodyKey: 'description',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'armor_type', label: 'Type', type: 'select', options: ['Light', 'Medium', 'Heavy', 'Shield'], required: true, half: true },
      { key: 'armor_class', label: 'Base AC', type: 'number', required: true, half: true },
      { key: 'strength_requirement', label: 'Strength Requirement', type: 'number', placeholder: 'e.g. 13', half: true },
      { key: 'stealth_disadvantage', label: 'Stealth Disadvantage', type: 'checkbox', half: true },
      { key: 'cost', label: 'Cost', type: 'text', placeholder: '50 gp', required: true, half: true },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: '20 lb.', required: true, half: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    empty: {
      name: '', armor_type: 'Light', armor_class: 11,
      strength_requirement: '', stealth_disadvantage: false, cost: '', weight: '', description: '',
    },
  },

  {
    id: 'adventuring-gear',
    label: 'Gear',
    singular: 'Gear',
    icon: Backpack,
    accent: 'bg-amber-600',
    subtitle: (it) => it.category,
    badges: (it) => [it.cost, it.quantity].filter(Boolean),
    filters: [{ key: 'category', allLabel: 'All Categories' }],
    stats: [
      { label: 'Category', get: (it) => it.category },
      { label: 'Quantity', get: (it) => it.quantity },
      { label: 'Cost', get: (it) => it.cost },
      { label: 'Weight', get: (it) => it.weight },
    ],
    bodyKey: 'description',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'Standard Gear', required: true, half: true },
      { key: 'quantity', label: 'Quantity', type: 'text', placeholder: 'e.g. 50 ft.', half: true },
      { key: 'cost', label: 'Cost', type: 'text', placeholder: '2 gp', required: true, half: true },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: '1 lb.', required: true, half: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    empty: { name: '', category: '', quantity: '', cost: '', weight: '', description: '' },
  },

  {
    id: 'potions',
    label: 'Potions',
    singular: 'Potion',
    icon: FlaskConical,
    accent: 'bg-emerald-500',
    subtitle: (it) => it.rarity,
    badges: (it) => [it.duration].filter(Boolean),
    filters: [{ key: 'rarity', allLabel: 'All Rarities' }],
    stats: [
      { label: 'Rarity', get: (it) => it.rarity },
      { label: 'Duration', get: (it) => it.duration },
      { label: 'Cost', get: (it) => it.cost },
      { label: 'Weight', get: (it) => it.weight },
    ],
    bodyKey: 'effect',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'rarity', label: 'Rarity', type: 'select', options: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'], required: true, half: true },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'Instantaneous', half: true },
      { key: 'cost', label: 'Cost', type: 'text', placeholder: '50 gp', required: true, half: true },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: '0.5 lb.', required: true, half: true },
      { key: 'effect', label: 'Effect', type: 'textarea', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    empty: { name: '', rarity: 'Common', duration: '', cost: '', weight: '', effect: '', description: '' },
  },

  {
    id: 'magic-items',
    label: 'Magic Items',
    singular: 'Magic Item',
    icon: Sparkles,
    accent: 'bg-violet-500',
    subtitle: (it) => [it.item_type, it.rarity].filter(Boolean).join(' · '),
    badges: (it) => [it.attunement_required && 'Attunement'].filter(Boolean),
    filters: [
      { key: 'item_type', allLabel: 'All Types' },
      { key: 'rarity', allLabel: 'All Rarities' },
    ],
    stats: [
      { label: 'Type', get: (it) => it.item_type },
      { label: 'Rarity', get: (it) => it.rarity },
      { label: 'Attunement', get: (it) => (it.attunement_required ? 'Required' : 'Not required') },
      { label: 'Cost', get: (it) => it.cost },
      { label: 'Weight', get: (it) => it.weight },
    ],
    bodyKey: 'effect',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'item_type', label: 'Type', type: 'text', placeholder: 'Wondrous Item', required: true, half: true },
      { key: 'rarity', label: 'Rarity', type: 'select', options: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'], required: true, half: true },
      { key: 'attunement_required', label: 'Requires Attunement', type: 'checkbox' },
      { key: 'cost', label: 'Cost', type: 'text', placeholder: 'optional', half: true },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: 'optional', half: true },
      { key: 'effect', label: 'Effect', type: 'textarea', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    empty: { name: '', item_type: '', rarity: 'Uncommon', attunement_required: false, cost: '', weight: '', effect: '', description: '' },
  },

  {
    id: 'food-drink',
    label: 'Food & Drink',
    singular: 'Food / Drink',
    icon: UtensilsCrossed,
    accent: 'bg-orange-500',
    subtitle: (it) => [it.item_type, it.category].filter(Boolean).join(' · '),
    badges: (it) => [it.cost].filter(Boolean),
    filters: [
      { key: 'item_type', allLabel: 'All Types' },
      { key: 'category', allLabel: 'All Categories' },
    ],
    stats: [
      { label: 'Type', get: (it) => it.item_type },
      { label: 'Category', get: (it) => it.category },
      { label: 'Quantity', get: (it) => it.quantity },
      { label: 'Effect', get: (it) => it.effect },
      { label: 'Cost', get: (it) => it.cost },
      { label: 'Weight', get: (it) => it.weight },
    ],
    bodyKey: 'description',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'item_type', label: 'Type', type: 'select', options: ['Food', 'Drink'], required: true, half: true },
      { key: 'category', label: 'Category', type: 'text', placeholder: 'Provisions', required: true, half: true },
      { key: 'quantity', label: 'Quantity', type: 'text', placeholder: 'e.g. 1 day', half: true },
      { key: 'effect', label: 'Effect', type: 'text', placeholder: 'optional', half: true },
      { key: 'cost', label: 'Cost', type: 'text', placeholder: '5 sp', required: true, half: true },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: '2 lb.', required: true, half: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    empty: { name: '', item_type: 'Food', category: '', quantity: '', effect: '', cost: '', weight: '', description: '' },
  },
];

export const ITEM_CATEGORY_MAP = Object.fromEntries(ITEM_CATEGORIES.map((c) => [c.id, c]));

export function getItemCategory(id) {
  return ITEM_CATEGORY_MAP[id] ?? null;
}
