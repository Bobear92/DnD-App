import { describe, it, expect } from 'vitest';
import {
  weaponPropertyDescription, weaponPropertyBaseName, parseWeaponProperties,
  weaponHandedness, weaponBadges, weaponFacets, sortWeaponFacets, weaponMatchesFilters,
} from './weaponPropertyData';

describe('weaponPropertyBaseName', () => {
  it('strips a detail parenthetical', () => {
    expect(weaponPropertyBaseName('Versatile (1d10)')).toBe('Versatile');
    expect(weaponPropertyBaseName('Thrown (range 20/60)')).toBe('Thrown');
    expect(weaponPropertyBaseName('Heavy')).toBe('Heavy');
  });
});

describe('weaponPropertyDescription', () => {
  it('describes standard properties (case + parenthetical insensitive)', () => {
    expect(weaponPropertyDescription('Versatile (1d10)')).toMatch(/one or two hands/i);
    expect(weaponPropertyDescription('heavy')).toMatch(/disadvantage/i);
    expect(weaponPropertyDescription('Finesse')).toMatch(/Dexterity/i);
  });
  it('describes category + handedness labels', () => {
    expect(weaponPropertyDescription('Martial')).toMatch(/specialized training/i);
    expect(weaponPropertyDescription('Two-handed')).toMatch(/both hands/i);
  });
  it('returns null for an unknown attribute', () => {
    expect(weaponPropertyDescription('Whatchamacallit')).toBeNull();
  });
});

describe('parseWeaponProperties', () => {
  it('handles JSON-string arrays, comma lists, and arrays', () => {
    expect(parseWeaponProperties('["Two-Handed", "Heavy"]')).toEqual(['Two-Handed', 'Heavy']);
    expect(parseWeaponProperties('Finesse, Light, Thrown')).toEqual(['Finesse', 'Light', 'Thrown']);
    expect(parseWeaponProperties(['Versatile'])).toEqual(['Versatile']);
    expect(parseWeaponProperties('')).toEqual([]);
  });
});

describe('weaponHandedness', () => {
  it('detects two-handed / versatile / one-handed', () => {
    expect(weaponHandedness(['Two-Handed', 'Heavy'])).toBe('Two-handed');
    expect(weaponHandedness(['Versatile (1d10)'])).toBe('Versatile');
    expect(weaponHandedness(['Finesse', 'Light'])).toBe('One-handed');
  });
});

describe('weaponBadges', () => {
  it('builds category + handedness + remaining properties (no two-handed/versatile dupes)', () => {
    const b = weaponBadges({ weapon_category: 'Martial', properties: '["Two-Handed", "Heavy"]' });
    expect(b.map((x) => x.label)).toEqual(['Martial', 'Two-handed', 'Heavy']);
  });
  it('keeps non-handedness properties for a one-handed finesse weapon', () => {
    const b = weaponBadges({ weapon_category: 'Simple', properties: 'Finesse, Light, Thrown' });
    expect(b.map((x) => x.label)).toEqual(['Simple', 'One-handed', 'Finesse', 'Light', 'Thrown']);
  });
});

describe('weaponFacets', () => {
  it('returns base-name facets (category + handedness + properties)', () => {
    const f = weaponFacets({ weapon_category: 'Martial', properties: '["Versatile (1d10)", "Finesse"]' });
    expect(f).toEqual(['Martial', 'Versatile', 'Finesse']);
  });
});

describe('sortWeaponFacets', () => {
  it('de-dupes and orders by category → handedness → properties, unknown last', () => {
    expect(sortWeaponFacets(['Finesse', 'Martial', 'Two-handed', 'Simple', 'Finesse']))
      .toEqual(['Simple', 'Martial', 'Two-handed', 'Finesse']);
    expect(sortWeaponFacets(['Zonk', 'Light'])).toEqual(['Light', 'Zonk']);
  });
});

describe('weaponMatchesFilters', () => {
  const longsword = { weapon_category: 'Martial', properties: '["Versatile (1d10)"]' };
  const dagger = { weapon_category: 'Simple', properties: 'Finesse, Light, Thrown' };
  it('matches all when no filters are active', () => {
    expect(weaponMatchesFilters(longsword, [])).toBe(true);
  });
  it('ANDs the active facet filters', () => {
    expect(weaponMatchesFilters(dagger, ['Finesse'])).toBe(true);
    expect(weaponMatchesFilters(dagger, ['Finesse', 'Light'])).toBe(true);
    expect(weaponMatchesFilters(dagger, ['Finesse', 'Heavy'])).toBe(false);
    expect(weaponMatchesFilters(longsword, ['Finesse'])).toBe(false);
  });
});
