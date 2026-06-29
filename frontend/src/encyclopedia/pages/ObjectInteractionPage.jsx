import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Swords, ArrowUpRight } from 'lucide-react';

/**
 * Static reference page for drawing & stowing weapons — the "free object interaction"
 * rule (Encyclopedia → Mechanics → Drawing & Stowing Weapons). This is a pure rules
 * concept with no number to compute, so (unlike Jump/AC) there is no helper or computed
 * card — just a prose page. It's linked from the Dual Wielder feat (which lifts the
 * one-interaction limit) and from the Weapons item tab.
 *
 * No edition toggle: the 2014 and 2024 rules for the free object interaction and for
 * Dual Wielder's draw/stow-two benefit are the same, so a toggle would show identical
 * copy (convention: toggle only when the editions actually differ).
 */

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function ObjectInteractionPage() {
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
            data-testid="object-interaction-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Swords className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Drawing &amp; Stowing Weapons
          </h1>
          <p className="text-sm text-muted-foreground">
            Your one free object interaction each turn — and why swapping weapons takes a moment.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section title="One free object interaction per turn">
            <p>
              On your turn you can interact with <span className="font-medium text-foreground">one object
              for free</span> — either as part of your move or as part of an action. Drawing a weapon,
              sheathing (stowing) a weapon, picking up a dropped item, opening an unlocked door, or pulling
              a potion from your pack all count as that one free interaction.
            </p>
            <p>
              A <span className="font-medium text-foreground">second</span> interaction in the same turn
              isn't free — it costs your whole action (the Utilize / "Use an Object" action). So the budget
              is: one free object interaction, and one more only if you spend your action on it.
            </p>
          </Section>

          <Section title="Drawing a weapon to attack">
            <p>
              Drawing the weapon you're about to attack with <span className="italic">is</span> your free
              interaction — you don't pay anything extra to ready it. Sheathing a weapon you're done with is
              also free, as long as it's the only interaction you take that turn.
            </p>
          </Section>

          <Section title="Why swapping weapons takes a moment">
            <p>
              The catch is that <span className="font-medium text-foreground">stowing one weapon and drawing
              another are two separate interactions</span>. You only get one for free, so in a single turn
              you can stow your bow <span className="italic">or</span> draw your sword — not both. Common ways
              to handle a swap:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Drop, don't stow.</span> Dropping a weapon is free and doesn't use your interaction, so you can drop the bow and draw the sword in the same turn.</li>
              <li><span className="font-medium text-foreground">Split it across turns.</span> Stow this turn, draw next turn.</li>
              <li><span className="font-medium text-foreground">Spend the action.</span> Use your action for the second interaction if you really need both this turn.</li>
            </ul>
          </Section>

          <Section title="Two-weapon fighting needs both weapons in hand">
            <p>
              To fight with a weapon in each hand you need <span className="font-medium text-foreground">both
              already drawn</span>. Since you can only draw one weapon free per turn, a fresh dual-wielder
              normally draws one this turn and the second next turn before both are online — unless a feature
              lets them draw faster.
            </p>
          </Section>

          <Section title="Dual Wielder lifts the limit">
            <p>
              The <span className="font-medium text-foreground">Dual Wielder</span> feat lets you{' '}
              <span className="italic">draw or stow two one-handed weapons</span> when you would normally draw
              or stow only one. With it you can:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Draw <span className="font-medium text-foreground">both</span> weapons at once and start dual-wielding the same turn.</li>
              <li>Stow both in a single interaction.</li>
              <li>Swap a matched pair in one move.</li>
            </ul>
            <p>
              (Dual Wielder also gives a +1 AC while holding two melee weapons and lets you two-weapon fight
              with non-Light weapons — those are tracked on your sheet automatically.)
            </p>
          </Section>

          <Section title="Things the free interaction does not cover">
            <p>
              A few weapon-adjacent actions cost more than the free interaction:
            </p>
            <ul className="space-y-2">
              <li>
                <span className="font-medium text-foreground">Loading ammunition</span> is built into the
                attack itself, not a separate interaction — but some ranged weapons can only fire once per
                action. See{' '}
                <Link to={mech('loading')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="object-interaction-loading-link">
                  the Loading property <ArrowUpRight className="w-3 h-3" />
                </Link>.
              </li>
              <li>
                <span className="font-medium text-foreground">Donning a shield</span> takes an action (it's
                strapped on, not just held). How that affects defense lives on{' '}
                <Link to={mech('armor-class')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="object-interaction-ac-link">
                  the Armor Class page <ArrowUpRight className="w-3 h-3" />
                </Link>.
              </li>
              <li>
                Drawing, stowing, and the free interaction all sit inside the broader{' '}
                <Link to={mech('action-economy')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="object-interaction-economy-link">
                  action economy <ArrowUpRight className="w-3 h-3" />
                </Link>{' '}
                — what you can do with your action, bonus action, and reaction.
              </li>
            </ul>
          </Section>

          <Section title="At the table">
            <p>
              A Ranger with a shortsword and a longbow opens combat by{' '}
              <span className="font-medium text-foreground">drawing her bow</span> (free interaction) and
              firing. Next round she wants to close in and dual-wield: she can{' '}
              <span className="font-medium text-foreground">drop the bow</span> (free) and{' '}
              <span className="font-medium text-foreground">draw a shortsword</span> (her free interaction),
              but she still only has one blade drawn — the second shortsword comes out the turn after. Take{' '}
              <span className="font-medium text-foreground">Dual Wielder</span> and she draws{' '}
              <span className="font-medium text-foreground">both shortswords at once</span>, ready to make a
              full two-weapon attack the moment she's in reach.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
