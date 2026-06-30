/**
 * Inventory model + combat math for the CharacterDetail Items tab.
 *
 * A character's inventory lives in character_data.inventory as a list of entries.
 * Each entry is a SNAPSHOT of an encyclopedia item (so it's independent of later
 * encyclopedia edits/deletes) plus tracking fields:
 *   { uid, category, source_id, quantity, equipped, attuned, ...itemFields }
 *
 * All functions here are pure (return new arrays/objects) so the UI can persist
 * the result via the normal character_data save path.
 */
import { getAcOptions, hasFeat } from '@/characters/components/combat/combatBonuses';
import { getFeatAcMods } from '@/characters/components/feats/featEffects';

/** Two or more equipped melee weapons (Dual Wielder's condition). */
function twoMeleeWeaponsEquipped(inventory = []) {
  return (inventory || []).filter(
    (e) => e.category === 'weapons' && e.equipped && (e.weapon_type || '').toLowerCase() !== 'ranged',
  ).length >= 2;
}

export const EQUIPPABLE_CATEGORIES = new Set(['weapons', 'armor']);
export const ATTUNABLE_CATEGORIES = new Set(['magic-items']);
export const MAX_ATTUNED = 3;

const STRIP_KEYS = new Set(['id', 'owner_type', 'owner_id', 'created_at', 'updated_at']);

export const abilityMod = (score) => Math.floor(((Number(score) || 10) - 10) / 2);
export const profBonus = (level) => Math.ceil((Number(level) || 1) / 4) + 1;
export const formatSigned = (n) => (n >= 0 ? `+${n}` : `${n}`);

function genUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Inventory CRUD (pure) ──────────────────────────────────────────────────────

/**
 * Build a single inventory entry (snapshot of an item) with a quantity.
 * The entry's `category` is the REST routing slug ('weapons', 'adventuring-gear', …)
 * and `quantity` is the owned count — both must win over the snapshot. Some item
 * categories (adventuring-gear, food-drink) carry their OWN `category`/`quantity`
 * fields (e.g. "Equipment Pack", "50 ft."), so we preserve those as
 * `item_category`/`item_quantity` rather than letting them clobber the routing slug/count.
 */
export function buildEntry(categoryId, item, quantity = 1) {
  const snapshot = {};
  for (const [k, v] of Object.entries(item || {})) {
    if (STRIP_KEYS.has(k)) continue;
    if (k === 'category') { snapshot.item_category = v; continue; }
    if (k === 'quantity') { snapshot.item_quantity = v; continue; }
    snapshot[k] = v;
  }
  return {
    ...snapshot,
    uid: genUid(),
    category: categoryId,
    source_id: item?.id ?? null,
    quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
    equipped: false,
    attuned: false,
  };
}

export function addEntry(inventory = [], categoryId, item) {
  return [...(inventory || []), buildEntry(categoryId, item, 1)];
}

export function removeEntry(inventory = [], uid) {
  return (inventory || []).filter((e) => e.uid !== uid);
}

export function setQuantity(inventory = [], uid, qty) {
  const q = Math.max(1, Math.floor(Number(qty) || 1));
  return (inventory || []).map((e) => (e.uid === uid ? { ...e, quantity: q } : e));
}

export function getByCategory(inventory = [], categoryId) {
  return (inventory || []).filter((e) => e.category === categoryId);
}

/**
 * Weapons are tracked as individual items, never stacked — so "equip" is unambiguous
 * (this exact weapon) rather than "some of N". Splits any weapon entry with quantity > 1
 * into that many quantity-1 entries. Deterministic uids (`uid`, `uid-2`, `uid-3`, …) and
 * idempotent, so it's safe to run on every render and on already-split inventories.
 * Only the first split copy inherits the `equipped` flag.
 */
export function normalizeWeapons(inventory = []) {
  const out = [];
  for (const e of inventory || []) {
    const qty = Math.max(1, Math.floor(Number(e.quantity) || 1));
    if (e.category !== 'weapons' || qty <= 1) { out.push(e); continue; }
    for (let i = 0; i < qty; i++) {
      out.push({
        ...e,
        uid: i === 0 ? e.uid : `${e.uid}-${i + 1}`,
        quantity: 1,
        equipped: i === 0 ? !!e.equipped : false,
      });
    }
  }
  return out;
}

const isShield = (e) => (e.armor_type || '').toLowerCase() === 'shield';

/**
 * Toggle the equipped flag. Only one body armor and one shield may be equipped at
 * once — equipping a new one unequips the previous of that kind. Weapons are individual
 * items and can each be equipped independently (e.g. dual-wielding).
 */
export function toggleEquipped(inventory = [], uid) {
  const target = (inventory || []).find((e) => e.uid === uid);
  if (!target) return inventory;
  const turningOn = !target.equipped;
  return (inventory || []).map((e) => {
    if (e.uid === uid) return { ...e, equipped: turningOn };
    // When equipping body armor or a shield, unequip the other of the same kind.
    if (turningOn && target.category === 'armor' && e.category === 'armor' && e.equipped && isShield(e) === isShield(target)) {
      return { ...e, equipped: false };
    }
    return e;
  });
}

export function attunedCount(inventory = []) {
  return (inventory || []).filter((e) => e.attuned).length;
}

/** Toggle attunement; turning a new one on is blocked once MAX_ATTUNED are attuned. */
export function toggleAttuned(inventory = [], uid) {
  const target = (inventory || []).find((e) => e.uid === uid);
  if (!target) return inventory;
  if (!target.attuned && attunedCount(inventory) >= MAX_ATTUNED) return inventory;
  return (inventory || []).map((e) => (e.uid === uid ? { ...e, attuned: !e.attuned } : e));
}

// ─── Armor Class ────────────────────────────────────────────────────────────────

export function equippedBodyArmor(inventory = []) {
  return (inventory || []).find((e) => e.category === 'armor' && e.equipped && !isShield(e)) || null;
}

export function equippedShield(inventory = []) {
  return (inventory || []).find((e) => e.category === 'armor' && e.equipped && isShield(e)) || null;
}

/**
 * Effective AC from equipped armor + shield, or the best unarmored formula when no
 * body armor is worn. Returns { value, source, parts:[string] }.
 */
export function computeArmorClass({ inventory = [], scores = {}, charClass, subclass, feats = [] } = {}) {
  const dex = abilityMod(scores.dexterity);
  const armor = equippedBodyArmor(inventory);
  const shield = equippedShield(inventory);
  const shieldBonus = shield ? 2 : 0;
  const acMods = getFeatAcMods(feats);
  // Medium Armor Master raises the medium-armor DEX cap (2 → 3).
  const mediumDexCap = acMods.filter((m) => m.condition === 'medium_armor_dex_cap')
    .reduce((cap, m) => Math.max(cap, m.dexCap || 0), 2);
  const parts = [];
  let base;
  let source;

  if (armor) {
    const baseAc = Number(armor.armor_class) || 10;
    const type = (armor.armor_type || '').toLowerCase();
    if (type === 'heavy') {
      base = baseAc;
      parts.push(`${baseAc} ${armor.name}`);
    } else if (type === 'medium') {
      const dexApplied = Math.min(dex, mediumDexCap);
      base = baseAc + dexApplied;
      parts.push(`${baseAc} ${armor.name}`, `${formatSigned(dexApplied)} DEX (max +${mediumDexCap})`);
    } else {
      // light or unknown → full DEX
      base = baseAc + dex;
      parts.push(`${baseAc} ${armor.name}`, `${formatSigned(dex)} DEX`);
    }
    source = armor.name;
  } else {
    // Unarmored: pick the best class formula, else 10 + DEX.
    const options = getAcOptions({ charClass, subclass, scores });
    const best = options.reduce((a, b) => (b.value > (a?.value ?? -Infinity) ? b : a), null);
    if (best) {
      base = best.value;
      source = best.source;
      parts.push(`${best.value} ${best.formula}`);
    } else {
      base = 10 + dex;
      source = 'Unarmored';
      parts.push(`10 base`, `${formatSigned(dex)} DEX`);
    }
  }

  if (shieldBonus) parts.push(`+2 ${shield.name}`);

  // Conditional flat feat bonuses: Defense (+1 while wearing armor), Dual Wielder (+1 with
  // two melee weapons). The medium-armor DEX cap mod is applied above, not here.
  let featBonus = 0;
  for (const m of acMods) {
    const applies = (m.condition === 'armor' && armor) || (m.condition === 'two_melee_weapons' && twoMeleeWeaponsEquipped(inventory));
    if (applies && m.amount) { featBonus += m.amount; parts.push(`${formatSigned(m.amount)} ${m.source}`); }
  }

  return { value: base + shieldBonus + featBonus, source, parts };
}

// ─── Proficiency ─────────────────────────────────────────────────────────────────

export function isWeaponProficient(weapon, { weaponProfText = '', raceWeapons = [] } = {}) {
  const text = (weaponProfText || '').toLowerCase();
  const cat = (weapon.weapon_category || '').toLowerCase();
  const name = (weapon.name || '').toLowerCase();
  if (cat === 'simple' && text.includes('simple weapons')) return true;
  if (cat === 'martial' && text.includes('martial weapons')) return true;
  if (name && text.includes(name)) return true; // e.g. "longswords" contains "longsword"
  if ((raceWeapons || []).some((w) => (w || '').toLowerCase() === name)) return true;
  return false;
}

export function isArmorProficient(armor, { armorProfText = '', raceArmor = [] } = {}) {
  const text = (armorProfText || '').toLowerCase();
  const type = (armor.armor_type || '').toLowerCase();
  if (type === 'shield') return text.includes('shield');
  if (text.includes('all armor')) return true;
  if (type && text.includes(`${type} armor`)) return true;
  if ((raceArmor || []).some((a) => (a || '').toLowerCase() === type)) return true;
  return false;
}

// ─── Attacks ─────────────────────────────────────────────────────────────────────

/** Which ability a weapon uses: ranged → DEX, finesse → better of STR/DEX, else STR. */
export function weaponAbility(weapon, scores = {}) {
  const props = (weapon.properties || '').toLowerCase();
  const ranged = (weapon.weapon_type || '').toLowerCase() === 'ranged';
  const str = abilityMod(scores.strength);
  const dex = abilityMod(scores.dexterity);
  if (ranged) return { ability: 'dexterity', mod: dex };
  if (props.includes('finesse')) {
    return dex > str ? { ability: 'dexterity', mod: dex } : { ability: 'strength', mod: str };
  }
  return { ability: 'strength', mod: str };
}

/** Does this weapon have the Heavy property? */
export function isHeavyWeapon(weapon = {}) {
  return /heavy/i.test(weapon.properties || '');
}

// Races whose default size is Small (used as a fallback when character_data.size is absent).
const SMALL_RACES = ['halfling', 'gnome'];

/**
 * A character's creature size — prefers the stored `character_data.size`, else derives
 * it from the race name (Halfling / Gnome → Small, everything else → Medium).
 */
export function creatureSize(characterData = {}, race = '') {
  if (characterData?.size) return characterData.size;
  const r = (race || '').toLowerCase();
  return SMALL_RACES.some((s) => r.includes(s)) ? 'Small' : 'Medium';
}

/**
 * Reason a weapon imposes disadvantage on this character's attack rolls, or null.
 *   5e (2014):  a Small creature has disadvantage with Heavy weapons.
 *   2024 (5.5e): the size rule was removed — a Heavy weapon instead needs Strength 13
 *               (melee) or Dexterity 13 (ranged), else attacks are at disadvantage.
 */
export function weaponAttackWarning(weapon, { size = 'Medium', scores = {}, edition = '5e' } = {}) {
  if (!isHeavyWeapon(weapon)) return null;
  if (edition === '5.5e' || edition === '2024') {
    const ranged = (weapon.weapon_type || '').toLowerCase() === 'ranged';
    if (ranged) {
      const dex = Number(scores.dexterity) || 10;
      if (dex < 13) return `Heavy weapon — needs Dexterity 13 (you have ${dex}); attacks at disadvantage.`;
    } else {
      const str = Number(scores.strength) || 10;
      if (str < 13) return `Heavy weapon — needs Strength 13 (you have ${str}); attacks at disadvantage.`;
    }
    return null;
  }
  // 5e (2014)
  if (size === 'Small') return 'Heavy weapon — Small creatures attack with it at disadvantage.';
  return null;
}

/** True if the weapon has the Loading property (2014 only — 2024 removed it). */
export function isLoadingWeapon(weapon = {}) {
  return /loading/i.test(weapon.properties || '');
}

// A crossbow (light/hand/heavy) — the weapons Crossbow Expert removes Loading from.
// A blowgun is also a Loading weapon but is NOT a crossbow, so the feat doesn't help it.
const isCrossbow = (weapon = {}) => /crossbow/i.test(weapon.name || '');

/**
 * The Loading-property note for this character + weapon, or null.
 *   2024 (5.5e): the Loading property was removed → always null.
 *   Weapon has no Loading property → null.
 *   Crossbow Expert + a proficient crossbow → the feat lifts the cap ("Loading ignored").
 *   Otherwise → the one-attack-per-action cap (Extra Attack grants no extra shot here).
 */
export function weaponLoadingNote(weapon, { feats = [], proficient = false, edition = '5e' } = {}) {
  if (edition === '5.5e' || edition === '2024') return null;
  if (!isLoadingWeapon(weapon)) return null;
  if (proficient && isCrossbow(weapon) && hasFeat(feats, 'Crossbow Expert')) {
    return 'Loading ignored (Crossbow Expert).';
  }
  return 'Loading: only one attack per action, even with Extra Attack.';
}

/** Attack row for one weapon: { name, toHit, damage, ability, proficient, disadvantage, warning, loadingNote }. */
export function computeAttack(weapon, { scores = {}, level = 1, proficient = false, size = 'Medium', edition = '5e', feats = [] } = {}) {
  const { ability, mod } = weaponAbility(weapon, scores);
  const toHit = formatSigned(mod + (proficient ? profBonus(level) : 0));
  const dmgBonus = mod === 0 ? '' : ` ${mod > 0 ? '+' : '-'} ${Math.abs(mod)}`;
  const dmgType = weapon.damage_type ? ` ${weapon.damage_type}` : '';
  const damage = `${weapon.damage || '—'}${dmgBonus}${dmgType}`;
  const warning = weaponAttackWarning(weapon, { size, scores, edition });
  const loadingNote = weaponLoadingNote(weapon, { feats, proficient, edition });
  return { name: weapon.name, toHit, damage, ability, proficient, disadvantage: !!warning, warning, loadingNote };
}

/** Attack rows for every equipped weapon in the inventory. */
export function getAttacks({ inventory = [], scores = {}, level = 1, weaponProfText = '', raceWeapons = [], size = 'Medium', edition = '5e', feats = [] } = {}) {
  return (inventory || [])
    .filter((e) => e.category === 'weapons' && e.equipped)
    .map((w) => ({
      uid: w.uid,
      ...computeAttack(w, { scores, level, proficient: isWeaponProficient(w, { weaponProfText, raceWeapons }), size, edition, feats }),
    }));
}
