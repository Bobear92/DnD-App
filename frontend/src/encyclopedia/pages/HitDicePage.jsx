import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Dice5 } from 'lucide-react';
import { durableHitDieMin } from '@/characters/components/combat/combatBonuses';

/**
 * Static reference page for Hit Dice (Encyclopedia → Mechanics → Hit Dice).
 * Flow B: the spend-to-heal math already lives in HitDiceTracker (and the
 * long-rest recovery in the backend rest flow); this page documents it and is
 * linked from the CharacterDetail Stats-tab Hit Points & Movement card. The
 * Durable floor uses the same durableHitDieMin helper the tracker uses.
 */

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function HitDicePage() {
  const { campaignId } = useParams();

  // Worked example: level-5 fighter, d10 Hit Die, CON 14 (+2).
  const level = 5;
  const hitDie = 10;
  const conMod = 2;
  const recoverOnLongRest = Math.max(1, Math.floor(level / 2)); // RAW: half your total, min 1
  const durableFloor = durableHitDieMin(conMod, true); // Durable: per-die minimum = 2× CON (min 2)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <Link
          to={`/campaigns/${campaignId}/encyclopedia`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
          data-testid="hit-dice-back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Encyclopedia
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Dice5 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Hit Dice
        </h1>
        <p className="text-sm text-muted-foreground">
          Your pool of self-healing between fights — how you spend it and how it comes back.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section title="What Hit Dice are">
            <p>
              You have a pool of <span className="font-medium text-foreground">Hit Dice</span> — one for each
              character level — that you spend to heal during a short rest. The die type comes from your{' '}
              <span className="font-medium text-foreground">class</span>: d6 (Sorcerer, Wizard), d8 (most
              classes), d10 (Fighter, Paladin, Ranger), or d12 (Barbarian). A 5th-level fighter, for example,
              has five d10 Hit Dice.
            </p>
            <p>
              They're separate from your hit point maximum (though the same die set your HP as you leveled). Think
              of them as a rechargeable healing reserve you control, rather than something the DM hands out.
            </p>
          </Section>

          <Section title="Spending them on a short rest">
            <p>
              During a <span className="font-medium text-foreground">short rest</span> you may spend any number of
              your remaining Hit Dice. For each die you spend, roll it and add your{' '}
              <span className="font-medium text-foreground">Constitution modifier</span> (a die can never restore
              fewer than 0 HP), and regain that many hit points. You decide how many to spend and can stop once
              you're happy with your total — there's no need to burn them all.
            </p>
            <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
              HP regained per die = d{'{'}Hit Die{'}'} + Constitution modifier (minimum 0)
            </p>
          </Section>

          <Section title="Getting them back">
            <p>
              You recover spent Hit Dice on a <span className="font-medium text-foreground">long rest</span> — but
              not all of them. You regain up to <span className="font-medium text-foreground">half your total,
              rounded down (minimum 1)</span>. So a long rest refills your reserve gradually; you can't lean on
              short-rest healing indefinitely without it running dry over a long adventuring day. (A short rest
              doesn't return any spent Hit Dice — only hit points.)
            </p>
          </Section>

          <Section title="What changes it">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-foreground">Constitution</span> — a higher CON modifier adds to
                every die you spend, so it's the single biggest lever on how much a Hit Die heals.
              </li>
              <li>
                <span className="font-medium text-foreground">Durable feat</span> — when you spend a Hit Die, the
                minimum you regain becomes twice your Constitution modifier (at least 2). Low rolls stop being
                wasted dice.
              </li>
              <li>
                <span className="font-medium text-foreground">Bard — Song of Rest</span> — allies who spend Hit
                Dice to heal during a short rest with the bard nearby regain extra hit points on top.
              </li>
            </ul>
          </Section>

          <Section title="On your sheet">
            <p>
              The <span className="font-medium text-foreground">Hit Points & Movement</span> card on the Stats tab
              shows your Hit Dice as <span className="font-medium text-foreground">d{'{'}die{'}'} × level</span> with
              a remaining count. The <span className="font-medium text-foreground">Use</span> button rolls one or
              more dice, adds your Constitution modifier, and tops up your current HP (capped at your maximum) — and
              with the Durable feat it notes the guaranteed minimum before you roll. Expended dice come back through
              the rest controls on the character list when you take a long rest.
            </p>
            <p>
              If your table rolls physical dice, choose{' '}
              <span className="font-medium text-foreground">Roll at the Table</span> in that dialog and type what you
              rolled — one box per die. The Constitution modifier, the Durable minimum and the maximum-HP cap are
              applied exactly the same way; only the dice come from you instead of the app.
            </p>
          </Section>

          <Section title="Worked example">
            <p>
              A <span className="font-medium text-foreground">level-{level} fighter</span> has{' '}
              <span className="font-medium text-foreground">{level} d{hitDie} Hit Dice</span> and a Constitution of
              14 (+{conMod}). On a short rest she spends two of them: she rolls 2d{hitDie} — say a 6 and a 7 — and
              adds +{conMod} to each, regaining 6 + 7 + {conMod} + {conMod} ={' '}
              <span className="font-medium text-foreground">{6 + 7 + conMod + conMod} HP</span>, leaving her with
              three Hit Dice.
            </p>
            <p>
              When she later finishes a long rest, she recovers up to{' '}
              <span className="font-medium text-foreground">{recoverOnLongRest} Hit Dice</span> (half of {level},
              rounded down), bringing her back up to four. If she had the{' '}
              <span className="font-medium text-foreground">Durable</span> feat, each die she spent would have
              healed at least <span className="font-medium text-foreground">{durableFloor} HP</span> (twice her CON
              modifier), so a low roll like a 1 would still have given {durableFloor}.
            </p>
          </Section>

          <Section title="At the table">
            <p>
              After a tough fight the party takes a short rest. The fighter is at 18 of 44 HP. She spends three of
              her five Hit Dice, rolls 4, 8, and 6, adds +{conMod} each, and regains{' '}
              {4 + 8 + 6 + conMod * 3} HP — back to 40 — keeping two dice in reserve in case the next fight comes
              before the party can afford a long rest. Manage that reserve well and you rarely need the cleric's
              spell slots just to patch up between encounters.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
