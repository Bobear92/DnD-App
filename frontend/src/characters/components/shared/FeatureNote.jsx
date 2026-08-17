import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A feature's name, expanding to its full rules text on click.
 *
 * The shared implementation behind every "feature hanging off something else" note: the riders
 * on Action Economy attack cards (Unwavering Mark, Mounted Combatant, Arcane Charge) and the
 * feature notes on Items-tab rows (Warding Maneuver, Savage Attacks, Eldritch Strike…).
 *
 * COLLAPSED BY DEFAULT, always. These notes sit on cards whose job is to show equipment and
 * combat numbers; a paragraph of rules text per feature buries what the card is for, and three
 * on one row is unreadable. The name is enough to tell you the feature applies — which is the
 * question you're asking while scanning — and the text is one click away for when it fires.
 *
 * `tone` colours the NAME (not just the body) so a benefit still reads as a benefit while
 * collapsed. Test ids: the button is `testId`, the expanded text is `{testId}-text`.
 *
 * With NO text there is nothing to expand, so the name renders as a plain label — no chevron,
 * no button. A disclosure arrow that opens nothing is worse than no arrow: it tells the reader
 * there is more to read and then refuses to show it. (Found in QA on the Defenses card, where
 * feat rows carry their whole mechanic in the row itself and have no rules prose behind it.)
 */
export default function FeatureNote({ name, text, testId, tone = 'muted', className }) {
  const [open, setOpen] = useState(false);
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.muted;

  if (!text) {
    return (
      <div className={className}>
        <span
          data-testid={testId}
          className={cn('block text-[11px] font-medium leading-tight', toneClass)}
        >
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={`What ${name} does`}
        data-testid={testId}
        className={cn(
          'flex items-center gap-1 rounded text-[11px] font-medium leading-tight hover:underline',
          toneClass,
        )}
      >
        {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        {name}
      </button>
      {open && (
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 pl-4" data-testid={`${testId}-text`}>
          {text}
        </p>
      )}
    </div>
  );
}

const TONE_CLASSES = {
  emerald: 'text-emerald-600',
  violet: 'text-violet-500',
  amber: 'text-amber-600',
  muted: 'text-foreground',
};
