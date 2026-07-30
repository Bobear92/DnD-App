/**
 * Class-feature coverage RATCHET.
 *
 * This test is the automatic gate for factory item #3: it fails when class-feature mechanization
 * regresses below the committed baseline (scripts/coverage-baseline.json). Because it's an
 * ordinary Vitest test, the existing Stop hook (`npm test`) — and CI — enforce it every turn with
 * zero extra wiring, exactly like the config-contract fixture.
 *
 * When you legitimately mechanize more features the numbers go UP and this still passes (>=); run
 * `npm run coverage:baseline` to ratchet the floor up so the gain can't later be silently undone.
 * The comparison is deterministic (pure data — no backend, no DB).
 */
import { describe, it, expect } from 'vitest';
import { coverageTotals } from './report-class-coverage.mjs';
import baseline from './coverage-baseline.json';

const current = coverageTotals();

describe('class-feature coverage ratchet', () => {
  it('overall mechanized count has not regressed below baseline', () => {
    expect(current.overall.mechanized).toBeGreaterThanOrEqual(baseline.overall.mechanized);
  });

  for (const id of Object.keys(baseline.editions)) {
    it(`${id}: mechanized count has not regressed below baseline`, () => {
      expect(current.editions[id]?.mechanized ?? 0).toBeGreaterThanOrEqual(baseline.editions[id].mechanized);
    });
  }

  it('feature totals have not dropped (a drop means features were removed — review the baseline)', () => {
    expect(current.overall.total).toBeGreaterThanOrEqual(baseline.overall.total);
  });

  it('nudges you to bump the baseline when coverage improves', () => {
    if (current.overall.mechanized > baseline.overall.mechanized) {
      // eslint-disable-next-line no-console
      console.warn(
        `Class coverage improved (${baseline.overall.mechanized} → ${current.overall.mechanized}). `
        + 'Run `npm run coverage:baseline` to ratchet the floor up.',
      );
    }
    expect(current.overall.mechanized).toBeGreaterThanOrEqual(baseline.overall.mechanized);
  });
});
