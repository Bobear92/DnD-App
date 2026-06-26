import { describe, it, expect } from 'vitest';
import { runningStartFeet, longJump, highJump, computeJump, JUMP_MULTIPLIER_SOURCES } from './jumpData';

describe('runningStartFeet', () => {
  it('is 10 ft without Athlete', () => {
    expect(runningStartFeet(false)).toBe(10);
    expect(runningStartFeet()).toBe(10);
  });
  it('is 5 ft with Athlete', () => {
    expect(runningStartFeet(true)).toBe(5);
  });
});

describe('longJump', () => {
  it('running = STR score, standing = half (rounded down)', () => {
    expect(longJump(15)).toEqual({ running: 15, standing: 7 });
    expect(longJump(16)).toEqual({ running: 16, standing: 8 });
  });
  it('clamps a missing/zero score to 0', () => {
    expect(longJump(0)).toEqual({ running: 0, standing: 0 });
    expect(longJump(undefined)).toEqual({ running: 0, standing: 0 });
  });
});

describe('highJump', () => {
  it('running = 3 + STR mod, standing = half', () => {
    expect(highJump(16)).toEqual({ running: 6, standing: 3 }); // mod +3 → 6
    expect(highJump(10)).toEqual({ running: 3, standing: 1 }); // mod 0 → 3
  });
  it('never goes below 0 for a low Strength', () => {
    expect(highJump(3)).toEqual({ running: 0, standing: 0 }); // mod -4 → -1 → 0
  });
});

describe('computeJump', () => {
  it('returns a flat readout with Athlete reducing the run-start', () => {
    expect(computeJump(16, { athlete: true })).toEqual({
      strength: 16,
      strMod: 3,
      athlete: true,
      multiplier: 1,
      runStartFt: 5,
      longRunning: 16,
      longStanding: 8,
      highRunning: 6,
      highStanding: 3,
    });
  });
  it('defaults to no Athlete and 10 ft run-start', () => {
    const j = computeJump(14);
    expect(j.athlete).toBe(false);
    expect(j.runStartFt).toBe(10);
    expect(j.longRunning).toBe(14);
    expect(j.highRunning).toBe(5); // mod +2 → 5
    expect(j.multiplier).toBe(1);
  });

  it('applies a multiplier (Jump spell ×3) to all four distances', () => {
    const j = computeJump(15, { multiplier: 3 }); // base: long 15/7, high 5/2
    expect(j.longRunning).toBe(45);
    expect(j.longStanding).toBe(21); // 7 × 3
    expect(j.highRunning).toBe(15); // 5 × 3
    expect(j.highStanding).toBe(6); // 2 × 3
  });

  it('combines Athlete (run-start) with a multiplier (Step of the Wind ×2)', () => {
    const j = computeJump(16, { athlete: true, multiplier: 2 });
    expect(j.runStartFt).toBe(5);
    expect(j.longRunning).toBe(32); // 16 × 2
    expect(j.highRunning).toBe(12); // 6 × 2
  });
});

describe('JUMP_MULTIPLIER_SOURCES', () => {
  it('lists known jump multipliers with a name, multiplier, and note', () => {
    expect(JUMP_MULTIPLIER_SOURCES.length).toBeGreaterThan(0);
    for (const s of JUMP_MULTIPLIER_SOURCES) {
      expect(typeof s.name).toBe('string');
      expect(s.multiplier).toBeGreaterThan(1);
      expect(typeof s.note).toBe('string');
    }
  });
  it('includes the Jump spell at ×3 and Step of the Wind at ×2', () => {
    const jump = JUMP_MULTIPLIER_SOURCES.find((s) => s.name === 'Jump spell');
    expect(jump.multiplier).toBe(3);
    const sotw = JUMP_MULTIPLIER_SOURCES.find((s) => s.name.startsWith('Step of the Wind'));
    expect(sotw.multiplier).toBe(2);
  });
});
