import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Hand, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '@/campaigns/CampaignContext';
import {
  specialMeleeAttacks, sizeLimitNote, oneSizeLarger,
} from '@/characters/components/combat/specialAttacksData';

/**
 * Static reference page for the special melee attacks — Grapple and Shove (Encyclopedia →
 * Mechanics → Special Melee Attacks).
 *
 * Flow B: the rules text and the size limit already live in `combat/specialAttacksData.js`, which
 * also builds the Grapple/Shove cards in the Action Economy tab — so this page reads from that
 * helper rather than restating it, and the two surfaces cannot drift.
 *
 * Edition toggle: 2014 and 2024 resolve the attempt differently — a contested Strength (Athletics)
 * check versus a saving throw against your own Unarmed Strike DC — which is a real difference, not
 * a rewording. (Convention: a toggle only where the editions actually differ.)
 *
 * Everything below is grounded in what this app models. The feats listed under "What changes these
 * rules" are real rows in seed_feats.py; the class features are real entries in the class and
 * subclass tables.
 */

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

// Page-local presentation data: the in-app feats & features that change grappling or shoving.
// Each maps to a real feat in seed_feats.py or a real feature in the class/subclass tables.
const MODIFIERS_5E = [
  { name: 'Grappler', kind: 'Feat', effect: "You have advantage on attack rolls against a creature you're grappling, and you can use your action to pin one — another grapple check that, on a success, restrains both of you until the grapple ends. Your sheet shows both as cards: Grapple Attack (your attacks against the grappled creature, each with advantage) and Pin: Restrain." },
  { name: 'Shield Master', kind: 'Feat', effect: 'When you take the Attack action you can shove a creature within 5 feet as a bonus action with your shield — a shove that costs you no attack at all. Your sheet lists it as its own bonus-action card.' },
  { name: 'Tavern Brawler', kind: 'Feat', effect: 'When you hit with an unarmed strike or an improvised weapon, you can grapple as a bonus action. Your sheet lists this as two Action + Bonus cards, one per opener.' },
  { name: "Giant's Might (Rune Knight)", kind: 'Subclass feature', effect: 'You become Large, which raises the size limit by one step — from Large to Huge. The Grapple and Shove cards update themselves the moment you switch the effect on.' },
  { name: 'Runic Juggernaut (Rune Knight)', kind: 'Subclass feature', effect: "At 18th level Giant's Might makes you Huge instead, so the limit rises again to Gargantuan." },
  { name: 'Supernatural Defense (Monster Slayer)', kind: 'Subclass feature', effect: "Add 1d6 to checks you make to escape your Slayer's Prey's grapple." },
  { name: 'Unarmed Fighting (Fighting Style)', kind: 'Fighting style', effect: 'A creature grappled by you takes 1d4 bludgeoning damage at the start of each of your turns.' },
];

const MODIFIERS_2024 = [
  { name: 'Grappler', kind: 'Feat', effect: "When an Unarmed Strike hits as part of the Attack action you can use both the Damage and the Grapple option, once per turn. You have advantage on attack rolls against a creature you're grappling (your sheet's Grapple Attack card lists each attack with advantage), and dragging one your size or smaller costs no extra movement." },
  { name: 'Shield Master', kind: 'Feat', effect: 'While wielding a shield and taking the Attack action, you can shove a creature within 5 feet as a bonus action.' },
  { name: 'Tavern Brawler', kind: 'Feat', effect: 'Your Unarmed Strikes hit harder, and the feat gives you extra ways to reach for a grapple in the middle of the Attack action.' },
  { name: 'Crusher', kind: 'Feat', effect: 'Not a shove, but the nearest thing to one: once per turn when you deal bludgeoning damage you can move the target 5 feet — no check, no attack spent.' },
  { name: 'Unarmed Fighting (Fighting Style)', kind: 'Fighting style', effect: 'A creature grappled by you takes 1d4 bludgeoning damage at the start of each of your turns.' },
];

export default function SpecialAttacksPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';
  const [edition, setEdition] = useState(campaignEdition);
  const is2024 = edition === '5.5e';
  const mech = (slug) => `/campaigns/${campaignId}/encyclopedia/mechanics/${slug}`;

  // Sourced from the helper, so the page states exactly what the sheet's cards state.
  const attacks = specialMeleeAttacks(edition);
  const modifiers = is2024 ? MODIFIERS_2024 : MODIFIERS_5E;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="special-attacks-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Hand className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Special Melee Attacks
          </h1>
          <p className="text-sm text-muted-foreground">
            Grappling and shoving — grabbing hold of a creature or knocking it down, in place of a swing.
          </p>
        </div>

        {/* Edition toggle — 2014 resolves these with a contested check, 2024 with a saving throw. */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {['5e', '5.5e'].map((ed) => (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              data-testid={`special-attacks-edition-${ed}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                edition === ed ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {ed === '5.5e' ? '2024' : '5e'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          <Section title="They are not actions — they replace an attack">
            <p>
              This is the single most misread thing about grappling. Neither grappling nor shoving costs
              you your <span className="font-medium text-foreground">action</span>. You take the{' '}
              <span className="font-medium text-foreground">Attack action</span> as normal, and then swap
              one of the attacks it gives you for a grapple or a shove.
            </p>
            {is2024 ? (
              <p>
                In the 2024 rules they are two of the three options on an{' '}
                <span className="font-medium text-foreground">Unarmed Strike</span> (the third is dealing
                damage), and an Unarmed Strike is simply one of the attacks you can make with the Attack
                action.
              </p>
            ) : (
              <p>
                In the 2014 rules they are described as{' '}
                <span className="font-medium text-foreground">special melee attacks</span>, made "instead
                of using a weapon to make a melee attack."
              </p>
            )}
            <p>
              The practical consequence is <span className="font-medium text-foreground">Extra Attack</span>.
              A 5th-level Fighter gets two attacks, so they can grab a creature{' '}
              <span className="italic">and</span> hit it in the same turn. A 1st-level character has only one
              attack, so the grapple is their whole turn's offence. That is why your sheet badges these cards{' '}
              <span className="font-medium text-foreground">"replaces one attack"</span> rather than "action".
            </p>
          </Section>

          <Section title={is2024 ? 'How you make the attempt (2024)' : 'How you make the attempt (2014)'}>
            <div className="space-y-3">
              {attacks.map((a) => (
                <div key={a.name} className="rounded-lg border border-border p-3" data-testid={`special-attack-${a.name}`}>
                  <div className="font-medium text-foreground">{a.name}</div>
                  <p className="mt-1">{a.detail}</p>
                  <p className="mt-1 text-xs">
                    <span className="uppercase tracking-wide">Resolved by</span> — {a.contest}.
                  </p>
                  {a.needsFreeHand && (
                    <p className="mt-1 text-xs text-amber-600">Requires at least one free hand.</p>
                  )}
                </div>
              ))}
            </div>
            <p>
              {is2024
                ? 'Because the target rolls, a grapple in 2024 never "misses" on your dice — you set a DC and the creature either saves or is caught.'
                : 'Because both sides roll, a 2014 grapple is a contest: a slippery, high-Acrobatics target is as hard to hold as a strong one is.'}
            </p>
          </Section>

          <Section title="The size limit — and how it moves">
            <p>
              You can only grapple or shove a creature{' '}
              <span className="font-medium text-foreground">no more than one size larger than you</span>.
              A Medium character reaches up to {oneSizeLarger('Medium')}; an ogre is fair game, a giant is not.
            </p>
            <p>
              This is the one rule on these cards that changes from character to character, so your sheet
              computes it:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li data-testid="special-attacks-size-small">Small character — <span className="text-foreground">{sizeLimitNote('Small', 'grapple')}</span></li>
              <li data-testid="special-attacks-size-medium">Medium character — <span className="text-foreground">{sizeLimitNote('Medium', 'grapple')}</span></li>
              <li data-testid="special-attacks-size-large">Large character — <span className="text-foreground">{sizeLimitNote('Large', 'grapple')}</span></li>
            </ul>
            <p>
              Anything that changes your <span className="font-medium text-foreground">size</span> therefore
              changes what you can grab — you do not need a feature that mentions grappling at all. A Rune
              Knight who switches on <span className="font-medium text-foreground">Giant's Might</span> becomes
              Large, and the line on their Grapple card moves from "up to Large" to "up to Huge" by itself.
            </p>
          </Section>

          <Section title="What being Grappled does">
            <ul className="list-disc pl-5 space-y-1">
              <li>The grappled creature's <span className="font-medium text-foreground">speed becomes 0</span>, and it can't benefit from any bonus to its speed.</li>
              <li>It is <span className="font-medium text-foreground">not restrained</span> — it can still attack, cast, and act normally. Grappling holds someone in place; it does not tie them up.</li>
              <li>You can <span className="font-medium text-foreground">drag it with you</span> as you move. Your speed is halved unless the creature is two or more sizes smaller than you.</li>
              <li>The grapple ends if you are <span className="font-medium text-foreground">incapacitated</span>, or if something moves the target out of your reach.</li>
              <li>You can <span className="font-medium text-foreground">release it at any time</span>, no action required.</li>
            </ul>
            <p>
              A <span className="font-medium text-foreground">shoved</span> creature is either pushed 5 feet
              or knocked <span className="font-medium text-foreground">Prone</span>. Prone costs it half its
              movement to stand up, gives melee attackers advantage against it, and gives it disadvantage on
              its own attacks — which is often worth more than the damage you gave up.
            </p>
          </Section>

          <Section title="Escaping a grapple">
            <p>
              {is2024
                ? 'The grappled creature can use its action to make a Strength (Athletics) or Dexterity (Acrobatics) check against your Unarmed Strike DC. On a success, the grapple ends.'
                : "The grappled creature can use its action to escape: a Strength (Athletics) or Dexterity (Acrobatics) check contested by your Strength (Athletics) check. On a success, the grapple ends."}
            </p>
            <p>
              Note that escaping costs the creature its <span className="font-medium text-foreground">whole
              action</span> — which is exactly why a grapple is worth an attack. Holding a caster in place for
              a round often buys more than a hit's worth of damage.
            </p>
          </Section>

          <Section title="When to reach for one">
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">You have Extra Attack.</span> The grapple is nearly free — one of your two swings, and the second still lands.</li>
              <li><span className="font-medium text-foreground">Someone is running.</span> Speed 0 ends a chase without needing an opportunity attack.</li>
              <li><span className="font-medium text-foreground">Your ally is a melee striker.</span> A shove to Prone gives every adjacent ally advantage until the target stands.</li>
              <li><span className="font-medium text-foreground">The enemy is near a ledge or a hazard.</span> A shove moves it 5 feet; the floor does the rest.</li>
              <li><span className="font-medium text-foreground">Your damage is poor against this target.</span> A heavily armoured foe that resists your damage still has to beat the same check.</li>
            </ul>
          </Section>

          <Section title="At the table">
            <p>
              A 5th-level Fighter with <span className="font-medium text-foreground">Extra Attack</span> faces
              an ogre (Large). She is Medium, so the ogre is exactly at her limit —{' '}
              <span className="text-foreground">{sizeLimitNote('Medium', 'grapple')}</span> She takes the Attack
              action: her first attack becomes a grapple{' '}
              {is2024
                ? '— the ogre fails its Strength save against her Unarmed Strike DC —'
                : '— she wins the contested Athletics check —'}
              {' '}and the ogre's speed drops to 0. Her second attack is a normal swing with her longsword. The
              ogre spends its entire action next turn trying to break free, and does not get to attack at all.
            </p>
            <p>
              A round later a <span className="font-medium text-foreground">hill giant</span> (Huge) wades in.
              She cannot grapple it — two sizes up. Her Rune Knight companion can: he switches on{' '}
              <span className="font-medium text-foreground">Giant's Might</span> to become Large, and his sheet's
              Grapple card now reads <span className="text-foreground">{sizeLimitNote('Large', 'grapple')}</span>
            </p>
          </Section>

          <Section title="What changes these rules">
            <p>
              Your sheet lists the ones your character actually has. The full set the app models in{' '}
              {is2024 ? '2024' : '5e'}:
            </p>
            <ul className="space-y-2">
              {modifiers.map((m) => (
                <li key={m.name} data-testid={`special-attacks-modifier-${m.name}`}>
                  <span className="font-medium text-foreground">{m.name}</span>{' '}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">· {m.kind}</span>
                  <div>{m.effect}</div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What the app doesn't track">
            <p>
              The sheet shows you what you <span className="italic">can</span> do; it does not run the fight.
              It has no notion of who is currently grappled or prone, no target to compare your size against,
              and it does not roll the contest for you — so the size line on your card is the limit, not a
              check against a specific enemy. A <span className="font-medium text-foreground">Conditions</span>{' '}
              page covering Grappled and Prone in full is still to come.
            </p>
          </Section>

          <Section title="Related">
            <ul className="space-y-1">
              <li>
                <Link to={mech('action-economy')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="special-attacks-economy-link">
                  Action economy <ArrowUpRight className="w-3 h-3" />
                </Link>{' '}
                — what the Attack action gives you, and why replacing one attack is cheap.
              </li>
              <li>
                <Link to={mech('spacing')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="special-attacks-spacing-link">
                  Spacing &amp; the 5-foot rule <ArrowUpRight className="w-3 h-3" />
                </Link>{' '}
                — you must be within reach to grab someone, and dragging them may provoke.
              </li>
              <li>
                <Link to={mech('object-interaction')} className="text-primary hover:underline inline-flex items-center gap-0.5" data-testid="special-attacks-object-link">
                  Drawing &amp; stowing weapons <ArrowUpRight className="w-3 h-3" />
                </Link>{' '}
                — how to free up the hand a grapple needs.
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
