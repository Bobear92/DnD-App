import React from 'react';

/**
 * How far a melee attack reaches — "Reach 10 ft" — on both attack surfaces (Items tab row +
 * Action Economy card), the melee counterpart of WeaponRangeBadge and one component for the
 * same reason: the wording can't drift between tabs.
 *
 * `weaponReach` returns null at the default 5 ft, so this renders only when the distance is
 * information: a Reach-property weapon, or a feature that grows the creature's reach. A feature
 * that MOVED the number names itself, so a 15 ft glaive doesn't read as a data error.
 *
 * Props:
 *   reach   {feet, label, bonusFt?, bonusSource?} | null
 *   testId  string  data-testid for the badge; the bonus note is `{testId}-bonus`
 */
export default function WeaponReachBadge({ reach, testId }) {
  if (!reach) return null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5" data-testid={testId}>
      <span className="text-[11px] font-medium text-foreground tabular-nums">{reach.label}</span>
      {reach.bonusFt && (
        <span className="text-[11px] text-emerald-600 leading-tight" data-testid={`${testId}-bonus`}>
          +{reach.bonusFt} ft ({reach.bonusSource})
        </span>
      )}
    </span>
  );
}
