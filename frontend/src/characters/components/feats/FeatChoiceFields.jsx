import React from 'react';
import { cn } from '@/lib/utils';
import FeatSpellGrantPicker from '@/characters/components/feats/FeatSpellGrantPicker';
import FeatManeuverPicker from '@/characters/components/feats/FeatManeuverPicker';
import { groupFeatProfOptions } from '@/characters/components/feats/featProficiencyData';
import { toggleFeatProficiency } from '@/characters/components/feats/featAcquisition';

const capitalize = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

/**
 * The follow-up pickers a feat asks for once it is chosen: an ability score (half-feats),
 * count-choice proficiencies, a spell grant, maneuvers. Shared by all three places a feat is
 * taken — Variant Human at creation, the level-up wizard's feat step, the GM's Add Feat — so they
 * cannot drift (the GM path used to offer none of them).
 *
 * It renders from `model` (the result of `resolveFeatAcquisition`) and holds no state: the surface
 * owns `choices` and gets the next value from `onChange`. Renders nothing for a feat with no
 * follow-up choices.
 *
 * @param {object}   props.model         resolveFeatAcquisition(...)
 * @param {function} props.onChange      (nextChoices) => void
 * @param {string}   [props.testIdPrefix]      prefix for the ability/proficiency test ids
 * @param {string}   [props.spellTestIdPrefix] passed to the spell picker
 * @param {string}   [props.maneuverTestIdPrefix] passed to the maneuver picker
 */
export default function FeatChoiceFields({
  model, onChange, campaignId, edition = '5e', knownManeuvers,
  testIdPrefix = 'feat', spellTestIdPrefix = 'feat-spell', maneuverTestIdPrefix = 'feat-maneuver',
}) {
  if (!model?.feat) return null;
  const { choices, abilityChoice, abilityOptions, profGrants, spellSpec, maneuverSpec } = model;
  const set = (patch) => onChange({ ...choices, ...patch });

  return (
    <>
      {abilityChoice && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3" data-testid={`${testIdPrefix}-ability-choice`}>
          <p className="text-sm font-medium">
            This feat increases an ability score by {abilityChoice.amount}. Choose one:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {abilityOptions.map((ability) => (
              <button
                key={ability}
                type="button"
                onClick={() => set({ ability })}
                data-testid={`${testIdPrefix}-ability-${ability}`}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors',
                  choices.ability === ability ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                )}
              >
                +{abilityChoice.amount} {capitalize(ability)}
              </button>
            ))}
          </div>
        </div>
      )}

      {profGrants.map((grant) => {
        // Nothing pickable (e.g. Expertise before the character has a proficient skill).
        if (grant.options.length === 0) return null;
        const { chosen } = grant;
        return (
          <div
            key={grant.key}
            className="space-y-2 rounded-md border bg-muted/30 p-3"
            data-testid={`${testIdPrefix}-prof-grant-${grant.prof_type}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{grant.label}</span>
              <span className={cn('text-xs', chosen.length === grant.count ? 'text-muted-foreground' : 'text-amber-600')}>
                {chosen.length}/{grant.count}
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
              {groupFeatProfOptions(grant.prof_type, grant.options).map(({ category, options }) => (
                <div key={category || '_'} className="space-y-1.5">
                  {category && (
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{category}</div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5">
                    {options.map((option) => {
                      const selected = chosen.includes(option);
                      const atLimit = chosen.length >= grant.count && !selected;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={atLimit}
                          onClick={() => onChange(toggleFeatProficiency(choices, grant.prof_type, option, grant.count))}
                          data-testid={`${testIdPrefix}-prof-opt-${grant.prof_type}-${option}`}
                          className={cn(
                            'rounded-md border px-2 py-1.5 text-xs text-left transition-colors',
                            selected ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
                            atLimit && 'opacity-40 cursor-not-allowed',
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {spellSpec && (
        <FeatSpellGrantPicker
          spec={spellSpec}
          value={choices.spell}
          onChange={(spell) => set({ spell })}
          campaignId={campaignId}
          testIdPrefix={spellTestIdPrefix}
        />
      )}

      {maneuverSpec && (
        <FeatManeuverPicker
          spec={maneuverSpec}
          value={choices.maneuvers}
          onChange={(maneuvers) => set({ maneuvers })}
          edition={edition}
          knownManeuvers={knownManeuvers}
          testIdPrefix={maneuverTestIdPrefix}
        />
      )}
    </>
  );
}
