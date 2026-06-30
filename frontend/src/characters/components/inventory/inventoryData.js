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
import { styleToHitBonus, styleDamageBonus, styleAcBonus } from '@/characters/components/combat/fightingStyles';

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
export const isShieldEntry = isShield;

/**
 * Toggle the equipped flag for BODY ARMOR (the Armor tab Equip button). Only one body
 * armor may be worn at once — equipping a new one unequips the previous. Weapons and
 * shields are held in hands instead (see assignHand), not toggled here.
 */
export function toggleEquipped(inventory = [], uid) {
  const target = (inventory || []).find((e) => e.uid === uid);
  if (!target) return inventory;
  const turningOn = !target.equipped;
  return (inventory || []).map((e) => {
    if (e.uid === uid) return { ...e, equipped: turningOn };
    // When equipping body armor, unequip the other body armor.
    if (turningOn && target.category === 'armor' && e.category === 'armor' && e.equipped && isShield(e) === isShield(target)) {
      return { ...e, equipped: false };
    }
    return e;
  });
}

// ─── Hands (main / off) ──────────────────────────────────────────────────────────
//
// Weapons and shields are held in hands rather than independently "equipped". Each entry
// may carry a `hand` of 'main', 'off', or 'both' (a two-handed weapon occupies both). The
// legacy `equipped` boolean is kept in sync (equipped === hand is set) so all downstream
// AC / attack / action-economy code that reads `equipped` keeps working.

const TWO_HANDED_RE = /two-handed/i;

/** Only weapons and shields can be held in a hand. */
export const isHandCapable = (e) => e?.category === 'weapons' || isShield(e);

/** A two-handed weapon (occupies both hands when wielded). */
export function isTwoHandedWeapon(e = {}) {
  return e?.category === 'weapons' && TWO_HANDED_RE.test(e.properties || '');
}

/** Does the weapon have the Versatile property? */
export const isVersatileWeapon = (w) => /versatile/i.test(String(w?.properties ?? ''));

// RAW versatile die = the base die one size up (d4→d6→d8→d10→d12, capped).
const DIE_STEP_UP = { 4: 6, 6: 8, 8: 10, 10: 12, 12: 12 };

/**
 * The two-handed damage die for a Versatile weapon, or null. Prefers an explicit die in the
 * property text ("Versatile (1d10)" for homebrew/overrides); otherwise derives it from the
 * base `damage` by stepping the die up one size (the seeded SRD data stores just "Versatile").
 */
export function weaponVersatileDie(weapon = {}) {
  if (!isVersatileWeapon(weapon)) return null;
  const explicit = /versatile\s*\(([^)]+)\)/i.exec(String(weapon.properties ?? ''));
  if (explicit) return explicit[1].trim();
  const m = /^\s*(\d*)d(\d+)/i.exec(String(weapon.damage ?? ''));
  if (!m) return null;
  const stepped = DIE_STEP_UP[Number(m[2])];
  return stepped ? `${m[1] || '1'}d${stepped}` : null;
}

/** What's currently in each hand: { main, off, twoHanded }. A two-handed weapon fills both. */
export function handContents(inventory = []) {
  const list = inventory || [];
  const both = list.find((e) => isHandCapable(e) && e.hand === 'both') || null;
  if (both) return { main: both, off: both, twoHanded: both };
  return {
    main: list.find((e) => isHandCapable(e) && e.hand === 'main') || null,
    off: list.find((e) => isHandCapable(e) && e.hand === 'off') || null,
    twoHanded: null,
  };
}

/** Number of empty hands (0–2) — drives the "free hand" / unarmed-strike display. */
export function freeHandCount(inventory = []) {
  const { main, off, twoHanded } = handContents(inventory);
  if (twoHanded) return 0;
  return (main ? 0 : 1) + (off ? 0 : 1);
}

const clearHand = (e) => (isHandCapable(e) && e.hand ? { ...e, hand: undefined, equipped: false } : e);

/**
 * Place an item into a hand slot, or free the slot. Pure.
 *   slot:      'main' | 'off'
 *   uid:       the entry to hold, or null/'' to free that hand
 *   twoHanded: grip a Versatile weapon in both hands (its larger die); ignored for items
 *              that aren't hand-capable. A weapon with the Two-Handed property always
 *              takes both hands regardless.
 * A two-handed grip clears everything else. A one-handed weapon or shield clears only
 * whatever occupied the target slot (or a two-hander spanning it), leaving the other hand
 * untouched (so you can dual-wield or hold a weapon + shield).
 */
export function assignHand(inventory = [], slot, uid, twoHanded = false) {
  const list = inventory || [];
  // Free the requested slot (and any two-hander spanning it).
  let next = list.map((e) =>
    isHandCapable(e) && (e.hand === slot || e.hand === 'both') ? clearHand(e) : e,
  );
  if (!uid) return next;
  const target = next.find((e) => e.uid === uid);
  if (!target || !isHandCapable(target)) return next;
  if (isTwoHandedWeapon(target) || twoHanded) {
    // Both hands: clear every hand, then take both.
    next = next.map(clearHand);
    return next.map((e) => (e.uid === uid ? { ...e, hand: 'both', equipped: true } : e));
  }
  return next.map((e) => (e.uid === uid ? { ...e, hand: slot, equipped: true } : e));
}

/**
 * One-time migration of legacy `equipped` weapons/shields (no `hand`) to hand slots, so
 * the hands UI reflects existing characters. Idempotent: returns the list unchanged once
 * any held item already has a `hand`. A two-handed weapon claims both hands; otherwise the
 * first two equipped items become main/off and any 3rd+ is unequipped (only two hands).
 */
export function migrateHands(inventory = []) {
  const list = inventory || [];
  const held = list.filter((e) => isHandCapable(e) && e.equipped);
  if (held.length === 0 || held.some((e) => e.hand)) return list;
  // Legacy held items have no `hand`, so unequip the non-assigned ones directly.
  const unhold = (e) => (isHandCapable(e) && e.equipped ? { ...e, hand: undefined, equipped: false } : e);
  const two = held.find(isTwoHandedWeapon);
  if (two) {
    return list.map((e) => (e.uid === two.uid ? { ...e, hand: 'both', equipped: true } : unhold(e)));
  }
  const [main, off] = held;
  return list.map((e) => {
    if (e.uid === main?.uid) return { ...e, hand: 'main', equipped: true };
    if (e.uid === off?.uid) return { ...e, hand: 'off', equipped: true };
    return unhold(e); // 3rd+ held item — only two hands
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
export function computeArmorClass({ inventory = [], scores = {}, charClass, subclass, feats = [], styles = [] } = {}) {
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

  // Defense fighting style: +1 AC while wearing armor.
  const { bonus: styleBonus, sources: styleSources } = styleAcBonus(styles, { armored: !!armor });
  if (styleBonus) styleSources.forEach((s) => parts.push(`+1 ${s}`));

  return { value: base + shieldBonus + featBonus + styleBonus, source, parts };
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

// 3-letter labels for the ability that drives a weapon attack (shown in the to-hit breakdown).
const ABILITY_ABBR = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

/**
 * Attack row for one weapon:
 *   { name, toHit, toHitBreakdown, damage, ability, proficient, disadvantage, warning, loadingNote, styleNotes }
 * Fighting styles fold into the numbers: Archery (+2 ranged to-hit), Dueling (+2 one-handed
 * melee damage when it's the only weapon — `soloWeapon`), Thrown Weapon Fighting (+2 thrown
 * damage). `styleNotes` lists the styles that applied; `toHitBreakdown` is the per-source
 * [{label, value}] making up the to-hit total (ability mod, proficiency, fighting styles)
 * so the UI can show "how the +N is calculated".
 */
export function computeAttack(weapon, { scores = {}, level = 1, proficient = false, size = 'Medium', edition = '5e', feats = [], styles = [], soloWeapon = false, versatileTwoHanded = false } = {}) {
  const { ability, mod } = weaponAbility(weapon, scores);
  const { bonus: toHitStyle, sources: toHitSources, parts: toHitParts } = styleToHitBonus(weapon, styles);
  const { bonus: dmgStyle, sources: dmgSources } = styleDamageBonus(weapon, styles, { soloWeapon });
  const toHit = formatSigned(mod + (proficient ? profBonus(level) : 0) + toHitStyle);
  const toHitBreakdown = [{ label: ABILITY_ABBR[ability] || ability, value: mod }];
  if (proficient) toHitBreakdown.push({ label: 'Proficiency', value: profBonus(level) });
  for (const p of toHitParts) toHitBreakdown.push({ label: `${p.source} fighting style`, value: p.amount });
  const flat = mod + dmgStyle;
  const dmgBonus = flat === 0 ? '' : ` ${flat > 0 ? '+' : '-'} ${Math.abs(flat)}`;
  const dmgType = weapon.damage_type ? ` ${weapon.damage_type}` : '';
  // A Versatile weapon uses its larger die when held two-handed (the other hand is free).
  const versDie = versatileTwoHanded ? weaponVersatileDie(weapon) : null;
  const damage = `${versDie || weapon.damage || '—'}${dmgBonus}${dmgType}`;
  const warning = weaponAttackWarning(weapon, { size, scores, edition });
  const loadingNote = weaponLoadingNote(weapon, { feats, proficient, edition });
  const styleNotes = [...new Set([...toHitSources, ...dmgSources])];
  return { name: weapon.name, toHit, toHitBreakdown, damage, ability, proficient, disadvantage: !!warning, warning, loadingNote, styleNotes };
}

/** Attack rows for every equipped weapon in the inventory. */
export function getAttacks({ inventory = [], scores = {}, level = 1, weaponProfText = '', raceWeapons = [], size = 'Medium', edition = '5e', feats = [], styles = [] } = {}) {
  const equipped = (inventory || []).filter((e) => e.category === 'weapons' && e.equipped);
  // Dueling requires wielding a single weapon (a shield is fine, a second weapon is not).
  const soloWeapon = equipped.length === 1;
  return equipped.map((w) => {
    // A Versatile weapon gripped in both hands (hand === 'both') uses its larger die.
    const versatileTwoHanded = isVersatileWeapon(w) && w.hand === 'both';
    return {
      uid: w.uid,
      ...computeAttack(w, { scores, level, proficient: isWeaponProficient(w, { weaponProfText, raceWeapons }), size, edition, feats, styles, soloWeapon, versatileTwoHanded }),
    };
  });
}
