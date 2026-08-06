import { cn } from '@/lib/utils';
import { formatBonus } from './skillMath';

// A derived number you can click to see how it was calculated.
//
// These two components sit behind every such number on the character sheet — skills,
// saving throws, passive scores, initiative — so the arithmetic always reads the same
// way. The displayed value IS `breakdown.total`, so the panel can never disagree with
// the number that opened it.
//
// Button and panel are separate components because the number usually lives inside a
// flex row (swatch · name · bonus) while the panel has to drop BELOW that row. Callers
// render `<BreakdownValue>` in the row and `<BreakdownPanel>` after it.

/** One "Label ........ +N" line. */
function BreakdownRow({ label, value, signed = true, strong = false }) {
  return (
    <div className={cn('flex justify-between gap-3 text-[10px]', strong ? 'font-semibold' : 'text-muted-foreground')}>
      <span>{label}</span>
      <span className="tabular-nums">{signed ? formatBonus(value) : value}</span>
    </div>
  );
}

/** The clickable number. */
export default function BreakdownValue({
  testId,
  label,
  breakdown,
  signed = true,
  expanded = false,
  onToggle,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      title={label ? `How ${label} is calculated` : 'How this is calculated'}
      data-testid={testId}
      className={cn(
        'tabular-nums rounded px-0.5 hover:bg-muted hover:text-foreground',
        expanded && 'bg-muted text-foreground',
        className,
      )}
    >
      {signed ? formatBonus(breakdown.total) : breakdown.total}
    </button>
  );
}

/** The expanded arithmetic. Render it only when the value is expanded. */
export function BreakdownPanel({ testId, breakdown, signed = true, className }) {
  return (
    <div
      data-testid={testId}
      className={cn('mt-1 rounded border bg-muted/40 px-2 py-1.5 space-y-0.5 text-left font-normal', className)}
    >
      {breakdown.parts.map((part) => (
        <BreakdownRow key={part.key} label={part.label} value={part.value} signed={part.signed !== false} />
      ))}
      <div className="border-t pt-0.5">
        <BreakdownRow label="Total" value={breakdown.total} signed={signed} strong />
      </div>
      {breakdown.notes.map((note) => (
        <div key={note} className="text-[10px] text-amber-600 pt-0.5">{note}</div>
      ))}
    </div>
  );
}
