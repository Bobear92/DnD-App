import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import FeatureNote from '@/characters/components/shared/FeatureNote';
import { getDefenses } from '@/characters/components/defenses/defenses';

/**
 * The character's damage resistances, immunities and flat reductions, under the HP card.
 *
 * Grouped by what the defense DOES, with the damage types in the left column, because the
 * question being asked is "is this fire damage halved?" — not "which features do I own?".
 *
 * ALWAYS ON and SITUATIONAL are separate groups and never merged. The app has no
 * active-effect model (no isRaging, no concentration, no durations), so a Barbarian's
 * bludgeoning resistance is only true while raging and the panel has to say so. Flattening
 * the two groups would make the panel confidently wrong for most conditional sources —
 * see the module comment on defenses.js.
 *
 * Each row's feature name sits on the shared FeatureNote, so the full rules text is one
 * click away and the collapse behaviour matches the riders and Items-tab notes rather than
 * being a third hand-rolled implementation of it.
 *
 * Renders nothing when the character has no defenses, so it costs no space on most sheets.
 */
export default function DefensesPanel({
  charClass, subclass, level, edition, characterData, pb, campaignId,
}) {
  const { alwaysOn, situational } = getDefenses({
    charClass, subclass, level, edition, characterData, pb,
  });

  if (alwaysOn.length === 0 && situational.length === 0) return null;

  return (
    // No heading of its own — the caller supplies the titled card, and a second "Defenses"
    // inside it just read as a duplicate.
    <div data-testid="defenses" className="space-y-3">
      <DefenseGroup label="Always on" testId="defenses-always-on" rows={alwaysOn} />
      <DefenseGroup label="Situational" testId="defenses-situational" rows={situational} />
      {/* The card shows WHAT you resist; the page explains what resisting actually does to a
          damage roll — the halve/subtract order, temp HP, and why two resistances aren't a
          quarter. Rendered only when there are rows, since the panel returns null otherwise. */}
      {campaignId && (
        <div className="flex justify-end">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia/mechanics/damage-mitigation`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            data-testid="defenses-learn-more"
          >
            How damage reduction works <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function DefenseGroup({ label, testId, rows }) {
  if (rows.length === 0) return null;
  return (
    <div data-testid={testId}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      <div className="space-y-1">
        {rows.map((row) => (
          <div
            key={row.key}
            data-testid={`defense-${row.key}`}
            className="flex items-start gap-2 rounded border px-2 py-1.5"
          >
            <span
              className="text-xs font-medium w-40 sm:w-56 shrink-0"
              data-testid={`defense-${row.key}-types`}
            >
              {row.typeLabel}
            </span>
            <span
              className="text-xs w-20 shrink-0 text-emerald-600"
              data-testid={`defense-${row.key}-value`}
            >
              {row.valueLabel}
            </span>
            <div className="flex-1 min-w-0">
              <FeatureNote
                name={row.name}
                text={row.description}
                testId={`defense-${row.key}-note`}
              />
              {row.condition && (
                <div
                  className="text-[10px] text-amber-600 leading-tight mt-0.5"
                  data-testid={`defense-${row.key}-condition`}
                >
                  {row.condition}
                </div>
              )}
              {row.qualifier && (
                <div
                  className="text-[10px] text-muted-foreground leading-tight"
                  data-testid={`defense-${row.key}-qualifier`}
                >
                  {row.qualifier}
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{row.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
