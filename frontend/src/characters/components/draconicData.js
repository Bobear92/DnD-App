/**
 * Shared draconic ancestry data — used by the Sorcerer Draconic Bloodline (5e) /
 * Draconic Sorcery (2024) "Dragon Ancestor" picker, and anywhere a chosen dragon
 * type needs to be displayed (CharacterDetail stats + features).
 *
 * The Dragonborn race uses its own `draconic_ancestry` choice (with breath shape);
 * this list is the subclass version (name + damage only) and is stored separately
 * in `character_data.draconic_bloodline` so a Dragonborn Draconic-Bloodline Sorcerer
 * can carry both without collision.
 */
export const DRACONIC_ANCESTRIES = [
  { name: 'Black',  damage: 'Acid' },
  { name: 'Blue',   damage: 'Lightning' },
  { name: 'Brass',  damage: 'Fire' },
  { name: 'Bronze', damage: 'Lightning' },
  { name: 'Copper', damage: 'Acid' },
  { name: 'Gold',   damage: 'Fire' },
  { name: 'Green',  damage: 'Poison' },
  { name: 'Red',    damage: 'Fire' },
  { name: 'Silver', damage: 'Cold' },
  { name: 'White',  damage: 'Cold' },
];

/** "Red Dragon (Fire)" — accepts the stored {name, damage} object (or null). */
export function draconicLabel(dragon) {
  if (!dragon || !dragon.name) return '';
  const damage = dragon.damage ? ` (${dragon.damage})` : '';
  return `${dragon.name} Dragon${damage}`;
}
