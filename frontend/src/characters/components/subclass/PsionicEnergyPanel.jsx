import {
  psionicDie, psionicDiceTotal, psionicDieAndInt, psiSaveDc, nextPsionicDieStep,
} from '@/characters/components/classData/psiWarriorData';
import { profBonus } from '@/characters/components/classData/classProgressionTables';
import { abilityMod } from '@/characters/components/inventory/inventoryData';

/**
 * Psi Warrior "Psionic Energy" summary for the Features tab — the pool DEFINITION, at a glance:
 * how many dice the character has and how big they are. Rendered by the Fighter config's
 * subclassPanels for the Psi Warrior subclass (L3+).
 *
 * Deliberately read-only. Spending happens on the rest-resource tracker and on the individual
 * Action Economy cards, which already carry Use controls; a second set of buttons here would be
 * a third place the same counter could be changed. What was missing was the answer to "how many
 * dice do I have, and what do I roll?" — the tracker states a remaining count, and every power's
 * card states a damage or reduction formula, but nothing stated the pool itself.
 *
 * Every number comes from psiWarriorData rather than the stored feature blurb, which says a flat
 * "d6s" in both editions and so is wrong from 5th level on.
 */
export default function PsionicEnergyPanel({ data = {}, level = 1, scores = {} }) {
  if (level < 3) return null;

  const total = psionicDiceTotal(level);
  const die = psionicDie(level);
  const intelligence = scores.intelligence ?? 10;
  const next = nextPsionicDieStep(level);
  const used = data.psionic_energy_used ?? 0;
  const remaining = Math.max(0, total - used);

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2" data-testid="psionic-energy-panel">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Psionic Energy</span>
        {/* The remaining count is echoed (not controlled) here so the pool card isn't a number
            that contradicts the tracker sitting a tab away. */}
        <span className="text-xs text-muted-foreground" data-testid="psionic-energy-remaining">
          {remaining} of {total} unspent
        </span>
      </div>

      <div className="text-2xl font-semibold tabular-nums" data-testid="psionic-energy-pool">
        {total} × {die}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed" data-testid="psionic-energy-formula">
        Twice your proficiency bonus ({profBonus(level)}), so {total} dice. The whole pool returns
        on a long rest.
        {next && ` Your die grows to ${next.die} at level ${next.level}.`}
      </p>

      {/* The two numbers a Psi Warrior actually rolls, spelled out once here rather than only on
          the individual power cards — both fold in the Intelligence modifier, which is easy to
          forget on a class with no spellcasting ability of its own. */}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" data-testid="psionic-energy-rolls">
        <dt className="text-muted-foreground">Strike / shield</dt>
        <dd className="font-medium tabular-nums">{psionicDieAndInt(level, intelligence)}</dd>
        <dt className="text-muted-foreground">Save DC</dt>
        <dd className="font-medium tabular-nums">
          {psiSaveDc(level, intelligence)}
          {/* The sign is part of the operator, not the number — "+ −1" for a dumped
              Intelligence reads as a typo. */}
          <span className="ml-1 font-normal text-muted-foreground">
            (8 + {profBonus(level)} {abilityMod(intelligence) >= 0 ? '+' : '−'} {Math.abs(abilityMod(intelligence))} INT)
          </span>
        </dd>
      </dl>
    </div>
  );
}
