import { describe, it, expect } from 'vitest';
import {
  isRuneCarvable,
  hasRuneCarving,
  runeOnItem,
  itemUidForRune,
  knownRunes,
  availableRunesForItem,
  assignRunePatch,
  clearRunePatch,
  clearRunesOnItemPatch,
  activeRunes,
  isRuneActive,
  inactiveRunes,
} from '@/characters/components/inventory/runeCarving';

const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
const bow = { uid: 'w2', category: 'weapons', name: 'Longbow', equipped: false };
const mail = { uid: 'a1', category: 'armor', name: 'Chain Mail', equipped: true };
const shield = { uid: 'a2', category: 'armor', armor_type: 'Shield', name: 'Shield', equipped: true };
const rope = { uid: 'g1', category: 'adventuring-gear', name: 'Rope', quantity: 1 };

/** A level-7 Rune Knight knowing three runes, with the given carving map. */
const cd = (runeItems = {}, inventory = [axe, bow, mail, shield, rope]) => ({
  subclass: 'Rune Knight',
  runes: ['Cloud Rune', 'Fire Rune', 'Hill Rune'],
  rune_items: runeItems,
  inventory,
});

describe('isRuneCarvable', () => {
  it('accepts weapons, body armor and shields', () => {
    expect(isRuneCarvable(axe)).toBe(true);
    expect(isRuneCarvable(mail)).toBe(true);
    expect(isRuneCarvable(shield)).toBe(true);
  });

  it('rejects gear — the deliberate scope limit (nothing models a worn trinket)', () => {
    expect(isRuneCarvable(rope)).toBe(false);
    expect(isRuneCarvable(null)).toBe(false);
  });
});

describe('hasRuneCarving', () => {
  it('is true for a Rune Knight from level 3', () => {
    expect(hasRuneCarving({ charClass: 'Fighter', subclass: 'Rune Knight', level: 3 })).toBe(true);
  });

  it('is false below level 3 and for other subclasses/classes', () => {
    expect(hasRuneCarving({ charClass: 'Fighter', subclass: 'Rune Knight', level: 2 })).toBe(false);
    expect(hasRuneCarving({ charClass: 'Fighter', subclass: 'Champion', level: 10 })).toBe(false);
    expect(hasRuneCarving({ charClass: 'Barbarian', subclass: 'Rune Knight', level: 10 })).toBe(false);
  });

  it('does not gate on edition — a 5e-built character in a 2024 campaign keeps the feature', () => {
    expect(hasRuneCarving({ charClass: 'Fighter', subclass: 'Rune Knight', level: 3, edition: '5.5e' })).toBe(true);
  });
});

describe('the carving map', () => {
  it('reads a rune off an item and an item off a rune', () => {
    const data = cd({ 'Cloud Rune': 'w1' });
    expect(runeOnItem('w1', data)).toBe('Cloud Rune');
    expect(runeOnItem('w2', data)).toBeNull();
    expect(itemUidForRune('Cloud Rune', data)).toBe('w1');
    expect(itemUidForRune('Fire Rune', data)).toBeNull();
  });

  it('tolerates a missing or malformed map', () => {
    expect(runeOnItem('w1', {})).toBeNull();
    expect(runeOnItem('w1', { rune_items: 'nope' })).toBeNull();
    expect(runeOnItem(undefined, cd({ 'Cloud Rune': 'w1' }))).toBeNull();
  });
});

describe('knownRunes', () => {
  it('returns the stored runes as full options', () => {
    expect(knownRunes(cd(), 7).map((r) => r.name)).toEqual(['Cloud Rune', 'Fire Rune', 'Hill Rune']);
  });

  it('caps at the number earned, so a demoted character cannot use extra picks', () => {
    // Level 3 earns two runes; the third stored pick is ignored.
    expect(knownRunes(cd(), 3).map((r) => r.name)).toEqual(['Cloud Rune', 'Fire Rune']);
  });
});

describe('availableRunesForItem', () => {
  it('offers every known rune when nothing is carved', () => {
    expect(availableRunesForItem(axe, cd(), 7)).toHaveLength(3);
  });

  it('excludes a rune already carved on a DIFFERENT item — moving it would silently strip that item', () => {
    const data = cd({ 'Cloud Rune': 'a1' });
    expect(availableRunesForItem(axe, data, 7).map((r) => r.name)).toEqual(['Fire Rune', 'Hill Rune']);
  });

  it('still offers the rune carved on THIS item, so it can be removed', () => {
    const data = cd({ 'Cloud Rune': 'w1' });
    expect(availableRunesForItem(axe, data, 7).map((r) => r.name)).toContain('Cloud Rune');
  });
});

describe('assignRunePatch', () => {
  it('carves a rune onto an item', () => {
    expect(assignRunePatch('Cloud Rune', 'w1', cd())).toEqual({ rune_items: { 'Cloud Rune': 'w1' } });
  });

  it('moves a rune off whatever it was on — a rune is on exactly one object', () => {
    const patch = assignRunePatch('Cloud Rune', 'a1', cd({ 'Cloud Rune': 'w1' }));
    expect(patch.rune_items).toEqual({ 'Cloud Rune': 'a1' });
  });

  it('displaces any OTHER rune on the target — one rune per object', () => {
    const patch = assignRunePatch('Fire Rune', 'w1', cd({ 'Cloud Rune': 'w1' }));
    expect(patch.rune_items).toEqual({ 'Fire Rune': 'w1' });
    expect(patch.rune_items['Cloud Rune']).toBeUndefined();
  });

  it('leaves runes on other items alone', () => {
    const patch = assignRunePatch('Fire Rune', 'a1', cd({ 'Cloud Rune': 'w1' }));
    expect(patch.rune_items).toEqual({ 'Cloud Rune': 'w1', 'Fire Rune': 'a1' });
  });
});

describe('clearRunePatch / clearRunesOnItemPatch', () => {
  it('removes one rune', () => {
    const patch = clearRunePatch('Cloud Rune', cd({ 'Cloud Rune': 'w1', 'Fire Rune': 'a1' }));
    expect(patch.rune_items).toEqual({ 'Fire Rune': 'a1' });
  });

  it('clears whatever is carved on a deleted item, so no rune is stranded on a dead uid', () => {
    const patch = clearRunesOnItemPatch('w1', cd({ 'Cloud Rune': 'w1', 'Fire Rune': 'a1' }));
    expect(patch.rune_items).toEqual({ 'Fire Rune': 'a1' });
  });

  it('returns null when the item bore no rune, so no needless patch is sent', () => {
    expect(clearRunesOnItemPatch('w2', cd({ 'Cloud Rune': 'w1' }))).toBeNull();
  });
});

describe('activeRunes — the gate every consumer uses', () => {
  it('is empty when a known rune is carved on nothing', () => {
    expect(activeRunes({ characterData: cd(), level: 7 })).toEqual([]);
  });

  it('returns a rune carved on an EQUIPPED item, with the bearing entry', () => {
    const active = activeRunes({ characterData: cd({ 'Cloud Rune': 'w1' }), level: 7 });
    expect(active).toHaveLength(1);
    expect(active[0].rune.name).toBe('Cloud Rune');
    expect(active[0].entry.name).toBe('Battleaxe');
  });

  it('EXCLUDES a rune carved on an unequipped item — the whole point of the carving model', () => {
    expect(activeRunes({ characterData: cd({ 'Cloud Rune': 'w2' }), level: 7 })).toEqual([]);
  });

  it('excludes a rune carved on an item no longer in the inventory', () => {
    expect(activeRunes({ characterData: cd({ 'Cloud Rune': 'gone' }), level: 7 })).toEqual([]);
  });

  it('excludes a carved rune the character does not know', () => {
    const data = { ...cd({ 'Storm Rune': 'w1' }), runes: ['Cloud Rune'] };
    expect(activeRunes({ characterData: data, level: 7 })).toEqual([]);
  });

  it('returns runes in canonical pool order, not carving order', () => {
    const data = cd({ 'Hill Rune': 'a1', 'Cloud Rune': 'w1' });
    expect(activeRunes({ characterData: data, level: 7 }).map((a) => a.rune.name))
      .toEqual(['Cloud Rune', 'Hill Rune']);
  });

  it('counts armor and shields, not just weapons', () => {
    const data = cd({ 'Cloud Rune': 'a1', 'Fire Rune': 'a2' });
    expect(activeRunes({ characterData: data, level: 7 }).map((a) => a.entry.name))
      .toEqual(['Chain Mail', 'Shield']);
  });
});

describe('isRuneActive', () => {
  it('answers per rune', () => {
    const data = cd({ 'Cloud Rune': 'w1', 'Fire Rune': 'w2' });
    expect(isRuneActive('Cloud Rune', { characterData: data, level: 7 })).toBe(true);
    expect(isRuneActive('Fire Rune', { characterData: data, level: 7 })).toBe(false); // bow unequipped
    expect(isRuneActive('Hill Rune', { characterData: data, level: 7 })).toBe(false); // uncarved
  });
});

describe('inactiveRunes — why a rune is not working', () => {
  it('names an uncarved rune', () => {
    const out = inactiveRunes({ characterData: cd(), level: 7 });
    expect(out.map((o) => o.rune.name)).toEqual(['Cloud Rune', 'Fire Rune', 'Hill Rune']);
    expect(out[0].reason).toMatch(/not carved/i);
  });

  it('names the unequipped item a rune is stuck on', () => {
    const out = inactiveRunes({ characterData: cd({ 'Cloud Rune': 'w2' }), level: 7 });
    expect(out.find((o) => o.rune.name === 'Cloud Rune').reason).toMatch(/Longbow.*not equipped/i);
  });

  it('flags a rune carved on an item you no longer own', () => {
    const out = inactiveRunes({ characterData: cd({ 'Cloud Rune': 'gone' }), level: 7 });
    expect(out.find((o) => o.rune.name === 'Cloud Rune').reason).toMatch(/no longer have/i);
  });

  it('omits a rune that is working', () => {
    const out = inactiveRunes({ characterData: cd({ 'Cloud Rune': 'w1' }), level: 7 });
    expect(out.map((o) => o.rune.name)).not.toContain('Cloud Rune');
  });
});
