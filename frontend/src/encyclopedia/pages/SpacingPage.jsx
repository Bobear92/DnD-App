import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ruler, ArrowUpRight } from 'lucide-react';

/**
 * Static reference page for spacing — the 5-foot rule (Encyclopedia → Mechanics →
 * Spacing). Being "within 5 feet" of a creature is what makes you adjacent for
 * melee, provokes opportunity attacks when you leave, and imposes disadvantage on
 * ranged weapon and ranged spell attacks. This is a pure rules concept with no
 * number to compute, so (like Drawing & Stowing Weapons) there is no helper or
 * computed card — just a prose page. It's linked from ranged weapon rows (Items
 * tab) and the Spells tab.
 *
 * No edition toggle: the core spacing rules (melee reach, opportunity attacks, the
 * within-5-ft disadvantage on ranged attacks) are identical in 2014 and 2024. The
 * feats that bend them differ only in wording, so a toggle would show near-identical
 * copy (convention: toggle only when the editions actually differ).
 */

// Page-local presentation data: the in-app feats & class features that change the
// base spacing rules. Every entry corresponds to a feat in seed_feats.py or a class
// feature in classFeatures5e/2024 — nothing here is invented.
const SPACING_MODIFIERS = [
  {
    name: 'Crossbow Expert',
    kind: 'Feat',
    effect: 'Being within 5 feet of a hostile creature no longer imposes disadvantage on your ranged attacks — so you can fire into melee without penalty.',
  },
  {
    name: 'Mobile (2014) / Speedy (2024)',
    kind: 'Feat',
    effect: 'When you make a melee attack against a creature, it can\'t make opportunity attacks against you for the rest of the turn — you can strike and then walk away freely. (Speedy instead frees you from opportunity attacks by any creature you\'ve damaged that turn.)',
  },
  {
    name: 'Sentinel',
    kind: 'Feat',
    effect: 'Your opportunity-attack hits drop the target\'s speed to 0, creatures provoke from you even when they Disengage, and you can react to strike a creature that attacks an ally within 5 feet of you.',
  },
  {
    name: 'Polearm Master',
    kind: 'Feat',
    effect: 'With a glaive, halberd, quarterstaff, or spear, creatures provoke an opportunity attack the moment they enter your reach — you punish approach, not just retreat.',
  },
  {
    name: 'War Caster',
    kind: 'Feat',
    effect: 'When a creature provokes an opportunity attack from you, you can cast a single-target spell at it instead of making a weapon attack.',
  },
  {
    name: 'Mage Slayer',
    kind: 'Feat',
    effect: 'When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee attack against it — punishing casters who stay adjacent.',
  },
  {
    name: 'Protection (Fighting Style)',
    kind: 'Feat / Fighting Style',
    effect: 'When a creature you can see attacks a target other than you within 5 feet, you can use your reaction and a shield to impose disadvantage on that attack roll.',
  },
  {
    name: 'Cunning Action (Rogue)',
    kind: 'Class feature',
    effect: 'Take the Disengage action as a bonus action — slip out of melee without provoking, and still Dash or attack with your action.',
  },
  {
    name: 'Step of the Wind (Monk)',
    kind: 'Class feature',
    effect: 'Spend a ki / focus point to take Disengage (or Dash) as a bonus action, leaving melee without provoking.',
  },
];

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function SpacingPage() {
  const { campaignId } = useParams();
  const mech = (slug) => `/campaigns/${campaignId}/encyclopedia/mechanics/${slug}`;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="spacing-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Ruler className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Spacing &amp; the 5-Foot Rule
          </h1>
          <p className="text-sm text-muted-foreground">
            What being within 5 feet of a creature means for melee, opportunity attacks, and ranged &amp; spell attacks.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section title="What “within 5 feet” means">
            <p>
              On the battle grid, one square is <span className="font-medium text-foreground">5 feet</span>.
              A creature is <span className="font-medium text-foreground">adjacent</span> to you when it is within
              5 feet — the square next to you, including diagonally. Almost every melee weapon has a reach of 5
              feet, so "within 5 feet" is the same as "close enough to hit with a sword."
            </p>
            <p>
              A few weapons (and the Reach property) extend that to 10 feet, and some creatures are larger and
              reach farther. But the default that drives the rules below is the single 5-foot step.
            </p>
          </Section>

          <Section title="Opportunity attacks — leaving someone's reach">
            <p>
              When a hostile creature you can see <span className="font-medium text-foreground">moves out of your
              reach</span> (steps from within 5 feet to farther than 5 feet), it provokes an{' '}
              <span className="font-medium text-foreground">opportunity attack</span>: you can use your{' '}
              <span className="font-medium text-foreground">reaction</span> to make one melee attack against it as it
              leaves. The same is true in reverse — walk away from an adjacent enemy and you hand it a free swing.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">You only get one reaction per round</span>, so you can make at most one opportunity attack between your turns.</li>
              <li><span className="font-medium text-foreground">The Disengage action</span> means your movement doesn't provoke opportunity attacks for the rest of the turn — the safe way to retreat.</li>
              <li><span className="font-medium text-foreground">Just standing up, teleporting, or being moved against your will</span> (shoved, etc.) does not provoke — only your own movement out of reach does.</li>
            </ul>
          </Section>

          <Section title="Ranged attacks in melee — disadvantage">
            <p>
              When you make a <span className="font-medium text-foreground">ranged attack</span> (a bow, a crossbow,
              a thrown weapon, or a sling) while a hostile creature is{' '}
              <span className="font-medium text-foreground">within 5 feet of you</span> — and that creature can see you
              and isn't incapacitated — the attack roll has{' '}
              <span className="font-medium text-foreground">disadvantage</span>. It's hard to line up a shot with
              someone swinging at your face.
            </p>
            <p>
              The fix is usually to <span className="italic">move away first</span> (which may provoke an opportunity
              attack) or to draw a melee weapon instead. The character sheet flags this on each ranged weapon's row
              in the Items tab.
            </p>
          </Section>

          <Section title="Spell attacks in melee — the same rule">
            <p>
              A spell that requires a <span className="font-medium text-foreground">ranged attack roll</span> (Fire
              Bolt, Eldritch Blast, Ray of Frost, and the like) follows the exact same rule: cast it while a hostile
              creature is within 5 feet of you and the attack roll has{' '}
              <span className="font-medium text-foreground">disadvantage</span>.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Melee spell attacks</span> (e.g. Shocking Grasp) are not ranged, so being adjacent doesn't penalize them.</li>
              <li><span className="font-medium text-foreground">Spells that force a saving throw</span> (Fireball, Sacred Flame) don't make an attack roll at all, so the within-5-ft disadvantage never applies — though casting while adjacent still risks an opportunity attack if you then move, and leaves you exposed.</li>
            </ul>
          </Section>

          <Section title="What changes these rules">
            <p>
              Several feats and class features bend the base spacing rules. Your sheet lists the ones your character
              actually has; the full set the app models:
            </p>
            <ul className="space-y-2">
              {SPACING_MODIFIERS.map((m) => (
                <li key={m.name} data-testid={`spacing-modifier-${m.name}`}>
                  <span className="font-medium text-foreground">{m.name}</span>{' '}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">· {m.kind}</span>
                  <div>{m.effect}</div>
                </li>
              ))}
            </ul>
            <p className="text-xs">
              Note: <span className="font-medium text-foreground">Sharpshooter</span> removes long-range disadvantage
              and ignores cover — it does <span className="italic">not</span> help with being within 5 feet of an
              enemy. That's Crossbow Expert's job.
            </p>
          </Section>

          <Section title="At the table">
            <p>
              A Rogue with a shortbow is cornered by a goblin standing right next to her. Firing now would be at{' '}
              <span className="font-medium text-foreground">disadvantage</span> (ranged attack, enemy within 5 ft).
              She uses <span className="font-medium text-foreground">Cunning Action to Disengage</span> as a bonus
              action, walks 30 feet away without provoking, and fires cleanly with her action. A Fighter with{' '}
              <span className="font-medium text-foreground">Crossbow Expert</span> in the same spot just fires — no
              disadvantage, no need to move.
            </p>
          </Section>

          <Section title="Related">
            <ul className="space-y-1">
              <li>
                <Link to={mech('action-economy')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="spacing-economy-link">
                  Action economy <ArrowUpRight className="w-3 h-3" />
                </Link>{' '}
                — the reaction that powers opportunity attacks, and where Disengage lives.
              </li>
              <li>
                <Link to={mech('loading')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="spacing-loading-link">
                  The Loading property <ArrowUpRight className="w-3 h-3" />
                </Link>{' '}
                — the other rule that limits crossbows (and how Crossbow Expert also helps there).
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
