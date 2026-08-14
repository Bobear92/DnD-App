import { useState } from 'react';
import BreakdownValue, { BreakdownPanel } from '@/characters/components/skills/BreakdownValue';
import FeatureNote from '@/characters/components/shared/FeatureNote';
import { getCompanions } from './companionData';

/**
 * The derived statblock for every companion a character can summon (see companionData.js).
 *
 * Data-driven and class-agnostic: it is not registered per subclass the way an interactive
 * panel is, so any config-driven class whose subclass gains a companion gets this for free.
 * Renders nothing when the character has none, which is nearly everybody.
 *
 * Read-only by design — the numbers derive from the character, so there is nothing to edit
 * and nothing to save.
 */
function CompanionCard({ companion }) {
  const [openStat, setOpenStat] = useState(null);
  const { key, name, plural, source, summary, count, countNote, stats, traits } = companion;

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2" data-testid={`companion-${key}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-sm">
          {count > 1 ? `${count} ${plural}` : name}
        </span>
        <span className="text-[11px] text-muted-foreground">{source}</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
      {countNote && (
        <p className="text-[11px] text-muted-foreground leading-snug" data-testid={`companion-${key}-count-note`}>
          {countNote}
        </p>
      )}

      <div className="grid gap-x-4 gap-y-1 grid-cols-1 sm:grid-cols-2">
        {stats.map((stat) => (
          <div key={stat.key} className="text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{stat.label}</span>
              {stat.breakdown ? (
                <BreakdownValue
                  testId={`companion-${key}-stat-${stat.key}`}
                  label={`the ${name}'s ${stat.label}`}
                  breakdown={stat.breakdown}
                  signed={false}
                  expanded={openStat === stat.key}
                  onToggle={() => setOpenStat((v) => (v === stat.key ? null : stat.key))}
                  className="font-semibold"
                />
              ) : (
                <span className="font-semibold tabular-nums" data-testid={`companion-${key}-stat-${stat.key}`}>
                  {stat.value}
                </span>
              )}
            </div>
            {openStat === stat.key && stat.breakdown && (
              <BreakdownPanel testId={`companion-${key}-stat-${stat.key}-breakdown`} breakdown={stat.breakdown} signed={false} />
            )}
            {stat.note && <div className="text-[10px] text-muted-foreground">{stat.note}</div>}
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-1">
        {traits.map((trait) => (
          <FeatureNote
            key={trait.key}
            name={trait.name}
            text={trait.text}
            testId={`companion-${key}-trait-${trait.key}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function CompanionPanel({ charClass, subclass, edition, level }) {
  const companions = getCompanions({ charClass, subclass, edition, level });
  if (companions.length === 0) return null;
  return (
    <div className="space-y-2" data-testid="companion-panel">
      {companions.map((c) => <CompanionCard key={c.key} companion={c} />)}
    </div>
  );
}
