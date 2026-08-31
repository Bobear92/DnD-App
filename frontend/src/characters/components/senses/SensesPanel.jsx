import FeatureNote from '@/characters/components/shared/FeatureNote';
import { RACE_TRAIT_DESCRIPTIONS } from '@/characters/components/race/raceTraitsData';
import { getSenses, getSightNotes } from '@/characters/components/senses/senses';

/**
 * What the character can see, and how far — the answer the sheet could not give at all before.
 *
 * The RANGE leads each row, because "how far?" is the question; the source is the supporting
 * detail. A sense granted by more than one feature shows the winning radius with the others
 * named underneath as superseded, since ranges don't stack and a player who unequips a
 * rune-bearing weapon needs to know they drop back to 60 ft rather than to nothing.
 *
 * Sight-affecting traits that grant no radius (Sunlight Sensitivity) sit below, name-only on the
 * shared FeatureNote with their rules text read out of RACE_TRAIT_DESCRIPTIONS — so this panel
 * can never disagree with the trait list on the Identity tab.
 *
 * Renders nothing for a character with ordinary vision (the Defenses-card rule): a permanent
 * "no darkvision" card on most sheets in the app is noise.
 */
export default function SensesPanel({ characterData, race, subrace, level }) {
  const senses = getSenses({ characterData, race, subrace, level });
  const sightNotes = getSightNotes({ characterData });

  if (senses.length === 0 && sightNotes.length === 0) return null;

  return (
    <div data-testid="senses" className="space-y-2">
      {senses.map((s) => (
        <div key={s.sense} data-testid={`sense-${s.sense.toLowerCase()}`} className="text-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{s.sense}</span>
            <span className="font-semibold tabular-nums" data-testid={`sense-range-${s.sense.toLowerCase()}`}>
              {s.rangeFt} ft
            </span>
            <span className="text-xs text-muted-foreground">
              {s.source}
              {s.note ? ` · ${s.note}` : ''}
            </span>
          </div>
          {s.superseded.length > 0 && (
            <div
              className="text-[11px] text-muted-foreground/80 mt-0.5"
              data-testid={`sense-superseded-${s.sense.toLowerCase()}`}
            >
              Replaces {s.superseded.map((o) => `${o.rangeFt} ft from ${o.source}`).join(', ')} —
              ranges don't stack.
            </div>
          )}
        </div>
      ))}
      {sightNotes.map((name) => (
        <FeatureNote
          key={name}
          name={name}
          text={RACE_TRAIT_DESCRIPTIONS[name]}
          testId={`sense-note-${name.toLowerCase().replace(/\s+/g, '-')}`}
        />
      ))}
    </div>
  );
}
