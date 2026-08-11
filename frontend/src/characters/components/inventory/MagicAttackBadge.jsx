import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * The "Magic · {source}" tag for a weapon whose attacks overcome resistance and immunity to
 * nonmagical attacks and damage, with the rule text revealed on CLICK (not hover) — the same
 * click-to-see-why treatment the to-hit breakdown and the skill/passive numbers use, and the only
 * one that works on touch.
 *
 * One component for both attack surfaces (Items tab row + Action Economy card) so the wording,
 * the styling and the open/close behaviour can't drift, the same way `getAttacks` is the single
 * place that decides whether a weapon is magical at all.
 *
 * Renders a FRAGMENT: the tag, then the note as a full-width block. Both parents lay their row
 * out with `flex-wrap`, so the note drops onto its own line under the tag rather than stretching
 * the row.
 *
 * The "Learn more" link to the Magical Attacks mechanics page lives INSIDE this component on
 * purpose: it can then only ever appear where the tag does, so the app never points a character
 * at a rule that doesn't apply to them. `campaignId` is passed in rather than read from the URL
 * (both parents already have it) so the component works wherever it's rendered; omit it and the
 * note renders without the link.
 *
 * Props:
 *   magical    {source, note}  from the attack row's `magical` field; renders nothing when null
 *   testId     string          the tag's data-testid; note = `{testId}-note`, link = `{testId}-learn-more`
 *   campaignId string|number   for the mechanics-page link
 */
export default function MagicAttackBadge({ magical, testId, campaignId }) {
  const [open, setOpen] = useState(false);
  if (!magical) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={testId}
        className={cn(
          'text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 shrink-0 transition-colors',
          'border-primary/50 text-primary hover:bg-primary/10',
          open && 'bg-primary/10',
        )}
      >
        Magic · {magical.source}
      </button>
      {open && (
        <p
          data-testid={`${testId}-note`}
          className="basis-full w-full text-[11px] text-muted-foreground leading-relaxed mt-1"
        >
          {magical.note}{' '}
          {campaignId && (
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/magical-attacks`}
              data-testid={`${testId}-learn-more`}
              className="text-primary hover:underline"
            >
              How magical attacks work
            </Link>
          )}
        </p>
      )}
    </>
  );
}
