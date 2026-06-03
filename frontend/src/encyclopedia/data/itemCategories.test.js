import { describe, it, expect } from 'vitest';
import { ITEM_CATEGORIES, ITEM_CATEGORY_MAP, getItemCategory } from './itemCategories';

const EXPECTED_IDS = ['weapons', 'armor', 'adventuring-gear', 'potions', 'magic-items', 'food-drink'];

describe('itemCategories config', () => {
  it('defines all six item categories', () => {
    expect(ITEM_CATEGORIES).toHaveLength(6);
    expect(ITEM_CATEGORIES.map((c) => c.id)).toEqual(EXPECTED_IDS);
  });

  it('every category has the required config keys', () => {
    for (const c of ITEM_CATEGORIES) {
      expect(typeof c.label).toBe('string');
      expect(typeof c.singular).toBe('string');
      expect(c.icon).toBeTruthy();
      expect(typeof c.accent).toBe('string');
      expect(typeof c.subtitle).toBe('function');
      expect(typeof c.badges).toBe('function');
      expect(Array.isArray(c.filters)).toBe(true);
      expect(Array.isArray(c.stats)).toBe(true);
      expect(Array.isArray(c.fields)).toBe(true);
      expect(c.empty).toBeTypeOf('object');
      expect(typeof c.bodyKey).toBe('string');
    }
  });

  it('every field has key/label/type and a matching empty-template entry', () => {
    for (const c of ITEM_CATEGORIES) {
      for (const f of c.fields) {
        expect(f.key).toBeTruthy();
        expect(f.label).toBeTruthy();
        expect(['text', 'textarea', 'select', 'number', 'checkbox']).toContain(f.type);
        expect(c.empty).toHaveProperty(f.key);
        if (f.type === 'select') expect(Array.isArray(f.options)).toBe(true);
      }
      // every category has a required name field
      expect(c.fields.find((f) => f.key === 'name')?.required).toBe(true);
    }
  });

  it('stat getters and subtitle do not throw on a sparse item', () => {
    for (const c of ITEM_CATEGORIES) {
      const item = { name: 'X' };
      expect(() => c.subtitle(item)).not.toThrow();
      expect(() => c.badges(item)).not.toThrow();
      for (const s of c.stats) expect(() => s.get(item)).not.toThrow();
    }
  });

  it('ITEM_CATEGORY_MAP and getItemCategory resolve by id', () => {
    expect(ITEM_CATEGORY_MAP.weapons.label).toBe('Weapons');
    expect(getItemCategory('magic-items').singular).toBe('Magic Item');
    expect(getItemCategory('nope')).toBeNull();
  });

  it('weapons category exposes its expected required fields', () => {
    const required = ITEM_CATEGORY_MAP.weapons.fields.filter((f) => f.required).map((f) => f.key);
    expect(required).toEqual(
      expect.arrayContaining(['name', 'weapon_category', 'weapon_type', 'damage', 'damage_type', 'cost', 'weight'])
    );
  });
});
