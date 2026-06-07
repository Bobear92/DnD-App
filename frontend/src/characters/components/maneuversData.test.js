import { describe, it, expect } from 'vitest';
import {
  MANEUVERS_5E, MANEUVERS_2024, getManeuvers,
  maneuversKnownAtLevel, superiorityDie, superiorityDiceCount,
} from './maneuversData';

describe('maneuversData', () => {
  it('has the 16 PHB 2014 maneuvers', () => {
    expect(MANEUVERS_5E).toHaveLength(16);
  });

  it('every 5e maneuver has a name and a description', () => {
    for (const m of MANEUVERS_5E) {
      expect(typeof m.name).toBe('string');
      expect(m.name.length).toBeGreaterThan(0);
      expect(typeof m.description).toBe('string');
      expect(m.description.length).toBeGreaterThan(20);
    }
  });

  it('every 2024 maneuver has a name and a description', () => {
    expect(MANEUVERS_2024.length).toBeGreaterThan(0);
    for (const m of MANEUVERS_2024) {
      expect(typeof m.name).toBe('string');
      expect(m.name.length).toBeGreaterThan(0);
      expect(typeof m.description).toBe('string');
      expect(m.description.length).toBeGreaterThan(20);
    }
  });

  it('includes the iconic Trip Attack in both editions', () => {
    expect(MANEUVERS_5E.some(m => m.name === 'Trip Attack')).toBe(true);
    expect(MANEUVERS_2024.some(m => m.name === 'Trip Attack')).toBe(true);
  });

  it('includes 2024-only maneuvers folded in from Tasha\'s', () => {
    expect(MANEUVERS_2024.some(m => m.name === 'Ambush')).toBe(true);
    expect(MANEUVERS_2024.some(m => m.name === 'Tactical Assessment')).toBe(true);
    expect(MANEUVERS_5E.some(m => m.name === 'Ambush')).toBe(false);
  });

  it('has no duplicate maneuver names within an edition', () => {
    const names5e = MANEUVERS_5E.map(m => m.name);
    expect(new Set(names5e).size).toBe(names5e.length);
    const names2024 = MANEUVERS_2024.map(m => m.name);
    expect(new Set(names2024).size).toBe(names2024.length);
  });

  describe('getManeuvers', () => {
    it('returns the 2014 list for 5e', () => {
      expect(getManeuvers('5e')).toBe(MANEUVERS_5E);
    });

    it('returns the 2024 list for 5.5e', () => {
      expect(getManeuvers('5.5e')).toBe(MANEUVERS_2024);
    });

    it('defaults to the 2014 list for unknown editions', () => {
      expect(getManeuvers(undefined)).toBe(MANEUVERS_5E);
      expect(getManeuvers('garbage')).toBe(MANEUVERS_5E);
    });
  });

  describe('Combat Superiority helpers', () => {
    it('maneuvers known scales 3 / 5 / 7 / 9 at levels 3 / 7 / 10 / 15', () => {
      expect(maneuversKnownAtLevel(2)).toBe(0);
      expect(maneuversKnownAtLevel(3)).toBe(3);
      expect(maneuversKnownAtLevel(7)).toBe(5);
      expect(maneuversKnownAtLevel(10)).toBe(7);
      expect(maneuversKnownAtLevel(15)).toBe(9);
      expect(maneuversKnownAtLevel(20)).toBe(9);
    });

    it('superiority die grows d8 → d10 (L10) → d12 (L18)', () => {
      expect(superiorityDie(3)).toBe('d8');
      expect(superiorityDie(9)).toBe('d8');
      expect(superiorityDie(10)).toBe('d10');
      expect(superiorityDie(18)).toBe('d12');
    });

    it('superiority dice count is a fixed 4 / 5 / 6 at levels 3 / 7 / 15', () => {
      expect(superiorityDiceCount(2)).toBe(0);
      expect(superiorityDiceCount(3)).toBe(4);
      expect(superiorityDiceCount(6)).toBe(4);
      expect(superiorityDiceCount(7)).toBe(5);
      expect(superiorityDiceCount(14)).toBe(5);
      expect(superiorityDiceCount(15)).toBe(6);
      expect(superiorityDiceCount(20)).toBe(6);
    });
  });
});
