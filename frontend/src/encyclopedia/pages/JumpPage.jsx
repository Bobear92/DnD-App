import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PersonStanding } from 'lucide-react';
import { computeJump, JUMP_MULTIPLIER_SOURCES } from '../../characters/components/jumpData';

/**
 * Static reference page for jump mechanics (Encyclopedia → Mechanics → Jumping).
 * Linked from the CharacterDetail Stats-tab JumpCard "Learn more" link.
 * The worked example uses computeJump so its numbers stay in sync with the
 * live character-sheet values.
 */

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function JumpPage() {
  const { campaignId } = useParams();

  // Worked example: a STR 16 (+3) character with the Athlete feat.
  const ex = computeJump(16, { athlete: true });
  // Same character with the Jump spell active (×3).
  const exSpell = computeJump(16, { athlete: true, multiplier: 3 });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <Link
          to={`/campaigns/${campaignId}/encyclopedia`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
          data-testid="jump-back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Encyclopedia
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <PersonStanding className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Jumping
        </h1>
        <p className="text-sm text-muted-foreground">
          How far and how high your character can jump — and what changes the numbers.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section title="The two kinds of jump">
            <p>
              D&amp;D measures jumping two ways: a <span className="font-medium text-foreground">long jump</span>{' '}
              (horizontal distance, e.g. clearing a pit) and a{' '}
              <span className="font-medium text-foreground">high jump</span> (vertical distance, e.g. reaching
              a ledge). Both depend on Strength, and both are farther with a running start.
            </p>
          </Section>

          <Section title="Long jump">
            <p>
              With a running start, you cover a number of feet up to your{' '}
              <span className="font-medium text-foreground">Strength score</span>. A{' '}
              <span className="font-medium text-foreground">standing</span> long jump (no running start) covers
              only half that.
            </p>
            <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
              Running long jump = Strength score (ft)<br />
              Standing long jump = ½ × Strength score (ft)
            </p>
          </Section>

          <Section title="High jump">
            <p>
              With a running start, you leap <span className="font-medium text-foreground">3 + your Strength
              modifier</span> feet upward. A standing high jump is half that. (You can also extend the reach of
              your arms above yourself by 1½ × your height when grabbing for something.)
            </p>
            <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
              Running high jump = 3 + Strength modifier (ft)<br />
              Standing high jump = ½ × (3 + Strength modifier) (ft)
            </p>
          </Section>

          <Section title="The 10-foot running start">
            <p>
              A "running start" means you moved at least{' '}
              <span className="font-medium text-foreground">10 feet on foot</span> immediately before the jump.
              Without it, you only get the (halved) standing distances.
            </p>
          </Section>

          <Section title="How feats change it — Athlete">
            <p>
              The <span className="font-medium text-foreground">Athlete</span> feat lowers the running-start
              requirement to just <span className="font-medium text-foreground">5 feet</span> of movement and
              raises a Strength or Dexterity score by 1. It does <span className="italic">not</span> change the
              jump-distance formulas — only how little movement you need to qualify for the running version.
            </p>
          </Section>

          <Section title="What changes your jump">
            <p>
              Several effects <span className="font-medium text-foreground">multiply</span> your jump distance —
              they apply to both long and high jumps, and to both the running and standing versions:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {JUMP_MULTIPLIER_SOURCES.map((s) => (
                <li key={s.name}>
                  <span className="font-medium text-foreground">{s.name} (×{s.multiplier})</span> — {s.note}
                </li>
              ))}
            </ul>
            <p>
              Multipliers don't change the running-start requirement, and stacking two of them (e.g. the Jump
              spell <span className="italic">and</span> a Monk's Step of the Wind) is a DM call — most tables apply
              the larger one rather than compounding.
            </p>
            <p>
              Anything that raises your <span className="font-medium text-foreground">Strength score</span> also
              lengthens your long jump automatically, since a running long jump equals your Strength. A{' '}
              <span className="font-medium text-foreground">Belt of Giant Strength</span> or{' '}
              <span className="font-medium text-foreground">Gauntlets of Ogre Power</span> that sets your
              Strength will extend your jumps the moment that new score is on your sheet.
            </p>
          </Section>

          <Section title="Worked example">
            <p>
              <span className="font-medium text-foreground">Borin</span>, a fighter with{' '}
              <span className="font-medium text-foreground">Strength {ex.strength}</span> (modifier{' '}
              {ex.strMod >= 0 ? `+${ex.strMod}` : ex.strMod}) who has taken the{' '}
              <span className="font-medium text-foreground">Athlete</span> feat:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Running long jump: <span className="font-medium text-foreground">{ex.longRunning} ft</span> (= Strength score)</li>
              <li>Standing long jump: <span className="font-medium text-foreground">{ex.longStanding} ft</span> (½ of {ex.longRunning})</li>
              <li>Running high jump: <span className="font-medium text-foreground">{ex.highRunning} ft</span> (= 3 + {ex.strMod})</li>
              <li>Standing high jump: <span className="font-medium text-foreground">{ex.highStanding} ft</span> (½ of {ex.highRunning})</li>
              <li>Running start needed: <span className="font-medium text-foreground">{ex.runStartFt} ft</span> (Athlete reduces it from 10 ft)</li>
            </ul>
            <p>
              Cast the <span className="font-medium text-foreground">Jump</span> spell on Borin (×3) and those
              numbers triple: his running long jump jumps from {ex.longRunning} ft to{' '}
              <span className="font-medium text-foreground">{exSpell.longRunning} ft</span> and his running high
              jump from {ex.highRunning} ft to{' '}
              <span className="font-medium text-foreground">{exSpell.highRunning} ft</span> — though he'll need
              the movement (or a Dash) to actually cover that much ground.
            </p>
          </Section>

          <Section title="Movement and jumping">
            <p>
              Jumping isn't free movement — the distance you jump is{' '}
              <span className="font-medium text-foreground">subtracted from your speed for the round</span>,
              just like walking. Every foot you cover horizontally on a long jump, and every foot you climb on a
              high jump, counts against the same movement pool you'd use to move normally.
            </p>
            <p>
              That means you can never jump farther than your{' '}
              <span className="font-medium text-foreground">remaining movement</span>. With 30 ft of speed, after
              a 10-ft running start you have 20 ft of movement left, so you can long jump at most 20 ft this turn
              even if your Strength would allow more. Spend movement on something else first and your jump shrinks
              accordingly.
            </p>
            <p>
              Just like normal movement, you can take the{' '}
              <span className="font-medium text-foreground">Dash action</span> to gain extra movement for the
              turn — handy when a jump plus its running start would otherwise eat your whole speed, or when you
              want to keep moving after you land. Note that Dashing gives you{' '}
              <span className="italic">more movement to spend</span>; it doesn't raise the maximum distance of a
              single jump, which is still capped by your Strength.
            </p>
          </Section>

          <Section title="At the table">
            <p>
              Borin needs to clear a {ex.longRunning - 2}-foot chasm. He has 30 ft of speed. He spends{' '}
              {ex.runStartFt} ft getting a running start, then jumps — covering up to {ex.longRunning} ft, which
              costs {ex.longRunning - 2} ft of movement to actually cross the chasm. That's{' '}
              {ex.runStartFt + (ex.longRunning - 2)} ft of his 30 ft used, so he lands with movement to spare. If
              he'd been pinned against a wall with no room to run, he'd only get the {ex.longStanding}-foot
              standing jump and would fall short.
            </p>
            <p>
              Now suppose Borin had already sprinted {30 - ex.runStartFt + 2} ft this turn chasing a fleeing
              goblin, leaving just {ex.runStartFt - 2} ft of movement — not enough for the {ex.runStartFt}-ft
              running start plus the {ex.longRunning - 2}-ft jump across the chasm. He uses his action to{' '}
              <span className="font-medium text-foreground">Dash</span>, adding another 30 ft of movement. With a
              fresh pool to draw from he easily affords the running start and the jump, clears the chasm, and
              still has movement left to close on the goblin on the far side. The Dash didn't let him jump any
              <span className="italic"> farther</span> than {ex.longRunning} ft — it just gave him the movement to
              afford the jump at all.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
