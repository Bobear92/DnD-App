import React from 'react';
import { cn } from '@/lib/utils';

/**
 * A weapon's distance band — "Range 150/600 ft" — shown on both attack surfaces (Items tab row +
 * Action Economy card). One component so the wording and styling can't drift, the same reason
 * MagicAttackBadge exists and the same reason `getAttacks` resolves the band itself.
 *
 * The two numbers mean: attacks up to NORMAL are unmodified; beyond normal but within LONG are
 * at disadvantage; beyond long are impossible. That rule is stated inline rather than hidden
 * behind a click, because unlike the Magic tag it is not a rules paragraph — it is the reason
 * the second number exists, and a bare "150/600" is meaningless without it.
 *
 * When a feature lifts the long-range disadvantage (Sharpshooter), the band SAYS so and names
 * the source. That is the whole reason range is modelled as data: before this, the fact lived in
 * a prose rider that had to be expanded and read, next to a number the card didn't show.
 *
 * Renders nothing for a weapon with no band — a pure melee weapon's 5 ft is reach, not a range.
 *
 * Props:
 *   range   {normal, long, thrown, label, longRangeOk?, longRangeSource?} | null
 *   testId  string  data-testid for the badge; the rule text is `{testId}-note`
 */
export default function WeaponRangeBadge({ range, testId }) {
  if (!range) return null;
  const { long, label, longRangeOk, longRangeSource } = range;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5" data-testid={testId}>
      <span className="text-[11px] font-medium text-foreground tabular-nums">
        Range {label}
      </span>
      {/* Only a weapon with a LONG band has a disadvantage threshold to explain. */}
      {long && (
        <span
          data-testid={`${testId}-note`}
          className={cn(
            'text-[11px] leading-tight',
            longRangeOk ? 'text-emerald-600' : 'text-muted-foreground',
          )}
        >
          {longRangeOk
            ? `no disadvantage past ${range.normal} ft (${longRangeSource})`
            : `disadvantage past ${range.normal} ft`}
        </span>
      )}
    </span>
  );
}
