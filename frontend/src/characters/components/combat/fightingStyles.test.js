import { describe, it, expect } from 'vitest';
import {
  gatherFightingStyles, hasFightingStyle,
  styleToHitBonus, styleDamageBonus, styleAcBonus,
} from './fightingStyles';

const ranged = { name: 'Longbow', weapon_type: 'ranged', properties: 'Ammunition, Heavy, Two-handed' };
const oneHandedMelee = { name: 'Longsword', weapon_type: 'melee', properties: 'Versatile (1d10)' };
const twoHandedMelee = { name: 'Greatsword', weapon_type: 'melee', properties: 'Heavy, Two-handed' };
const thrown = { name: 'Handaxe', weapon_type: 'melee', properties: 'Light, Thrown' };

describe('gatherFightingStyles', () => {
  it('returns the class pick plus additional styles, dropping blanks', () => {
    expect(gatherFightingStyles({ fighting_style: 'Archery', additional_fighting_styles: ['Defense'] }))
      .toEqual(['Archery', 'Defense']);
  });
  // 2024 Fighting Style FEATS reached no math before — a 2024 Archery feat gave no +2.
  it('includes a style granted by a Fighting Style feat', () => {
    const feats = [{ name: 'Archery', effects: [{ kind: 'fighting_style', style: 'Archery' }] }];
    expect(gatherFightingStyles({ feats })).toEqual(['Archery']);
    expect(hasFightingStyle({ feats }, 'Archery')).toBe(true);
    expect(styleToHitBonus(ranged, gatherFightingStyles({ feats })).bonus).toBe(2);
  });
  it('merges class, additional and feat styles, counting a repeated style once', () => {
    const feats = [
      { name: 'Dueling', effects: [{ kind: 'fighting_style', style: 'Dueling' }] },
      { name: 'Archery', effects: [{ kind: 'fighting_style', style: 'Archery' }] },
    ];
    expect(gatherFightingStyles({ fighting_style: 'Archery', additional_fighting_styles: ['Defense'], feats }))
      .toEqual(['Archery', 'Defense', 'Dueling']);
  });
  it('ignores feats with no fighting_style effect', () => {
    const feats = [{ name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] }];
    expect(gatherFightingStyles({ feats })).toEqual([]);
  });
  it('is empty for no styles', () => {
    expect(gatherFightingStyles({})).toEqual([]);
    expect(gatherFightingStyles()).toEqual([]);
  });
  it('hasFightingStyle checks membership', () => {
    expect(hasFightingStyle({ fighting_style: 'Archery' }, 'Archery')).toBe(true);
    expect(hasFightingStyle({ fighting_style: 'Archery' }, 'Defense')).toBe(false);
  });
});

describe('styleToHitBonus (Archery)', () => {
  it('+2 to ranged weapons, with a per-source part', () => {
    expect(styleToHitBonus(ranged, ['Archery'])).toEqual({
      bonus: 2, sources: ['Archery'], parts: [{ source: 'Archery', amount: 2 }],
    });
  });
  it('no bonus to melee weapons', () => {
    expect(styleToHitBonus(oneHandedMelee, ['Archery'])).toEqual({ bonus: 0, sources: [], parts: [] });
  });
  it('no bonus without the style', () => {
    expect(styleToHitBonus(ranged, ['Defense'])).toEqual({ bonus: 0, sources: [], parts: [] });
  });
});

describe('styleDamageBonus', () => {
  it('Dueling: +2 to a one-handed melee weapon when solo', () => {
    expect(styleDamageBonus(oneHandedMelee, ['Dueling'], { soloWeapon: true }))
      .toEqual({ bonus: 2, sources: ['Dueling'], parts: [{ source: 'Dueling', amount: 2 }] });
  });
  it('Dueling: no bonus when another weapon is wielded', () => {
    expect(styleDamageBonus(oneHandedMelee, ['Dueling'], { soloWeapon: false }))
      .toEqual({ bonus: 0, sources: [], parts: [] });
  });
  it('Dueling: no bonus with a two-handed weapon', () => {
    expect(styleDamageBonus(twoHandedMelee, ['Dueling'], { soloWeapon: true }))
      .toEqual({ bonus: 0, sources: [], parts: [] });
  });
  it('Dueling: no bonus with a ranged weapon', () => {
    expect(styleDamageBonus(ranged, ['Dueling'], { soloWeapon: true }))
      .toEqual({ bonus: 0, sources: [], parts: [] });
  });
  it('Thrown Weapon Fighting: +2 to a thrown weapon', () => {
    expect(styleDamageBonus(thrown, ['Thrown Weapon Fighting'], { soloWeapon: false }))
      .toEqual({ bonus: 2, sources: ['Thrown Weapon Fighting'], parts: [{ source: 'Thrown Weapon Fighting', amount: 2 }] });
  });
  it('Thrown Weapon Fighting: no bonus to a non-thrown weapon', () => {
    expect(styleDamageBonus(oneHandedMelee, ['Thrown Weapon Fighting'], { soloWeapon: true }))
      .toEqual({ bonus: 0, sources: [], parts: [] });
  });
  it('stacks Dueling + Thrown on a solo thrown one-handed weapon', () => {
    const res = styleDamageBonus(thrown, ['Dueling', 'Thrown Weapon Fighting'], { soloWeapon: true });
    expect(res.bonus).toBe(4);
    expect(res.sources).toEqual(['Dueling', 'Thrown Weapon Fighting']);
  });
});

describe('styleAcBonus (Defense)', () => {
  it('+1 while armored', () => {
    expect(styleAcBonus(['Defense'], { armored: true })).toEqual({ bonus: 1, sources: ['Defense'] });
  });
  it('no bonus when unarmored', () => {
    expect(styleAcBonus(['Defense'], { armored: false })).toEqual({ bonus: 0, sources: [] });
  });
  it('no bonus without the style', () => {
    expect(styleAcBonus(['Archery'], { armored: true })).toEqual({ bonus: 0, sources: [] });
  });
});
