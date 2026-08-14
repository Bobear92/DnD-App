import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldHalf } from 'lucide-react';
import { applyDamage } from '@/characters/components/defenses/defenses';

/**
 * Static reference page for how incoming damage is actually reduced
 * (Encyclopedia → Mechanics → Taking Damage). Flow B: the app already owns this in
 * `defenses/defenses.js`, so there is no new helper and no new card — the Defenses panel in
 * Stats → HP & Movement is the computed surface, and it links here.
 *
 * The worked examples call `applyDamage` rather than stating their answers, so the page can
 * never disagree with the rule the helper encodes. That ordering IS the page's core teaching:
 * halve-then-subtract and subtract-then-halve give different numbers, and a raging Barbarian
 * in heavy armor hits both rules on the same hit.
 *
 * No edition toggle — resistance, vulnerability, immunity and temporary hit points work
 * identically in 2014 and 2024. Convention is to toggle only when the editions really differ.
 *
 * "Nonmagical" is deliberately NOT re-explained here; it has its own page already, and this
 * one links to it rather than keeping a second copy of that rule in sync.
 */

// Real in-app sources of temporary hit points, grepped out of this app's feature data
// (classData/subclassData/*, maneuversData.js, actionEconomyData.js) — not invented. Temp HP
// is not currently computed anywhere, so these are documented as prose, not wired.
const TEMP_HP_SOURCES = [
  { name: "Dark One's Blessing", kind: 'Warlock — The Fiend', amount: 'CHA modifier + Warlock level', target: 'yourself' },
  { name: 'Fiendish Vigor', kind: 'Warlock — Eldritch Invocation', amount: 'false life, at will', target: 'yourself' },
  { name: 'Form of Dread', kind: 'Warlock — The Undead', amount: '1d10 + Warlock level', target: 'yourself' },
  { name: 'Reclaim Potential', kind: 'Fighter — Echo Knight', amount: '2d6 + CON modifier', target: 'yourself' },
  { name: 'Rally', kind: 'Battle Master maneuver', amount: 'superiority die + CHA modifier', target: 'an ally' },
  { name: 'Experimental Elixir', kind: 'Artificer — Alchemist', amount: '2d6 + INT modifier', target: 'whoever drinks it' },
  { name: 'Inspiring Leader', kind: 'Feat', amount: 'your level + CHA modifier', target: 'up to six, including you' },
];

// Reaction-based damage reduction — a different shape from the standing reductions on the
// Defenses card (which is why that card deliberately leaves them out: they cost a reaction and
// fire on one specific hit). All real features in this app's data.
const REACTION_REDUCTIONS = [
  { name: 'Parry', kind: 'Battle Master maneuver', amount: 'superiority die + DEX modifier' },
  { name: 'Protective Field', kind: 'Fighter — Psi Warrior', amount: 'Psionic Energy die + INT modifier' },
  { name: 'Deflect Missiles', kind: 'Monk', amount: '1d10 + DEX modifier + Monk level' },
  { name: 'Song of Defense', kind: 'Wizard — Bladesinging', amount: '5 × the spell slot level spent' },
  { name: 'Warding Maneuver', kind: 'Fighter — Cavalier', amount: 'd8 to AC; resistance if it still hits' },
];

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

/** One worked calculation, rendered from the helper's own steps. */
function Working({ testId, steps, final }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden" data-testid={testId}>
      {steps.map((s, i) => (
        <div
          key={s.label}
          className={`flex items-center justify-between gap-4 px-3 py-2 text-sm ${i > 0 ? 'border-t border-border' : ''}`}
        >
          <span className="text-muted-foreground">{s.label}</span>
          <span className="font-mono font-medium text-foreground">{s.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 px-3 py-2 text-sm border-t-2 border-border bg-muted/40">
        <span className="font-medium text-foreground">Damage taken</span>
        <span className="font-mono font-bold text-foreground" data-testid={`${testId}-final`}>{final}</span>
      </div>
    </div>
  );
}

export default function DamageMitigationPage() {
  const { campaignId } = useParams();
  const mech = (slug) => `/campaigns/${campaignId}/encyclopedia/mechanics/${slug}`;

  // Worked examples computed by the same helper the rule lives in.
  const plain = applyDamage({ amount: 16 });
  const resisted = applyDamage({ amount: 16, resistant: true });
  const barbarian = applyDamage({ amount: 16, resistant: true, reduction: 3 });
  const wrongOrder = Math.floor((16 - 3) / 2); // the common mistake, for contrast
  const cancelled = applyDamage({ amount: 16, resistant: true, vulnerable: true });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="damage-mitigation-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <ShieldHalf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Taking Damage
          </h1>
          <p className="text-sm text-muted-foreground">
            Resistance, vulnerability, immunity, flat damage reduction, and how temporary hit
            points soak a hit.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">

          <Section title="The four ways damage gets smaller">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Resistance</strong> — you take{' '}
                <strong className="text-foreground">half</strong> the damage of that type,
                rounded down.
              </li>
              <li>
                <strong className="text-foreground">Immunity</strong> — you take{' '}
                <strong className="text-foreground">none</strong> of it.
              </li>
              <li>
                <strong className="text-foreground">Vulnerability</strong> — the opposite: you
                take <strong className="text-foreground">double</strong>.
              </li>
              <li>
                <strong className="text-foreground">Flat reduction</strong> — a fixed number is
                subtracted, like Heavy Armor Master's 3. This is not resistance and does not
                interact with it the way people expect (see below).
              </li>
            </ul>
            <p>
              Your character's Defenses card lives in{' '}
              <strong className="text-foreground">Stats → HP &amp; Movement</strong>, and lists
              every one of these you have, split by whether it is always on or only applies in
              a particular situation.
            </p>
          </Section>

          <Section title="The order matters — and it is the thing most often got wrong">
            <p>
              Damage is resolved in a fixed order: every other modifier first, then{' '}
              <strong className="text-foreground">vulnerability doubles</strong>, then{' '}
              <strong className="text-foreground">resistance halves</strong>, and only then does
              a <strong className="text-foreground">flat reduction subtract</strong>.
            </p>
            <p>
              Take a greatsword hit for <strong className="text-foreground">16</strong> slashing
              damage against a raging Barbarian wearing heavy armor with Heavy Armor Master —
              Rage gives resistance to slashing, and the feat subtracts 3:
            </p>
            <Working testId="damage-example-barbarian" steps={barbarian.steps} final={barbarian.final} />
            <p>
              Subtract first and you would get{' '}
              <span className="font-mono">(16 − 3) ÷ 2 = {wrongOrder}</span> — one more point
              than the rules actually give you. Halving before subtracting is always at least as
              good for you, which is why the order is worth remembering.
            </p>
          </Section>

          <Section title="Resistance does not stack, and cancels against vulnerability">
            <p>
              Two sources of fire resistance still leave you at{' '}
              <strong className="text-foreground">half</strong>, not a quarter — resistance is a
              yes-or-no state, not a counter. The same is true of vulnerability.
            </p>
            <p>
              If you somehow have <em>both</em> resistance and vulnerability to the same damage
              type, they cancel out completely and you take the damage as normal — they are not
              applied one after the other:
            </p>
            <Working testId="damage-example-cancel" steps={cancelled.steps} final={cancelled.final} />
            <p>
              For contrast, the same 16 damage with no defenses at all is{' '}
              <span className="font-mono">{plain.final}</span>, and with resistance alone is{' '}
              <span className="font-mono">{resisted.final}</span>.
            </p>
          </Section>

          <Section title="Rounding">
            <p>
              Halving always <strong className="text-foreground">rounds down</strong>. 13 damage
              with resistance is 6, not 6.5 or 7. A hit for 1 damage against resistance becomes
              0 — resistance can take a hit down to nothing, though immunity is the only thing
              that guarantees it.
            </p>
          </Section>

          <Section title="Temporary hit points">
            <p>
              Temporary hit points are a buffer sitting in front of your real hit points. Damage
              comes off them first, and only what's left over touches your actual HP. The Temp
              HP box sits next to Current HP in{' '}
              <strong className="text-foreground">Stats → HP &amp; Movement</strong>.
            </p>
            <p>They behave differently from healing in four ways that catch people out:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">They never stack.</strong> Gaining temp HP
                while you already have some means choosing one or the other — you take the
                higher number, you do not add them together.
              </li>
              <li>
                <strong className="text-foreground">They are not healing.</strong> They don't
                count as regaining hit points, so they won't stabilise a dying character or
                trigger anything that keys off being healed.
              </li>
              <li>
                <strong className="text-foreground">They don't raise your maximum.</strong> Your
                Max HP is untouched, and healing can never restore lost temp HP.
              </li>
              <li>
                <strong className="text-foreground">They vanish on a long rest</strong> (and
                whenever their own duration runs out), whether you spent them or not.
              </li>
            </ul>
            <p>
              Resistance is applied <em>before</em> temporary hit points absorb anything — you
              halve the incoming damage first, then take it off the buffer.
            </p>
            <p className="pt-1">Sources of temporary hit points in this app:</p>
            <div className="rounded-lg border border-border divide-y" data-testid="temp-hp-sources">
              {TEMP_HP_SOURCES.map((s) => (
                <div key={s.name} className="p-3 space-y-0.5" data-testid={`temp-hp-source-${s.name}`}>
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.kind} — {s.amount}</div>
                  <div className="text-xs text-muted-foreground">Grants to: {s.target}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Reductions that cost a reaction">
            <p>
              Heavy Armor Master's 3 applies to every qualifying hit for free. A second family of
              reductions works differently: you spend your{' '}
              <Link className="text-primary hover:underline" to={mech('action-economy')}>reaction</Link>{' '}
              and usually a resource to blunt <em>one specific hit</em>, after seeing it land.
            </p>
            <div className="rounded-lg border border-border divide-y" data-testid="reaction-reductions">
              {REACTION_REDUCTIONS.map((s) => (
                <div key={s.name} className="p-3 space-y-0.5" data-testid={`reaction-reduction-${s.name}`}>
                  <div className="text-sm font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.kind} — {s.amount}</div>
                </div>
              ))}
            </div>
            <p>
              These are deliberately <em>not</em> on the Defenses card. That card answers "what am
              I resistant to?", and a once-per-hit reaction isn't a standing defense — you'll find
              each on the surface that spends it, in the Action Economy tab.
            </p>
          </Section>

          <Section title="Damage immunity is not condition immunity">
            <p>
              Being immune to <em>poison damage</em> and being immune to the{' '}
              <em>poisoned condition</em> are two different things, and a feature may give you
              one, the other, or both. A Circle of Spores druid's Fungal Body, for instance,
              grants immunity to several conditions but no damage immunity at all.
            </p>
            <p>
              The Defenses card deliberately covers <strong className="text-foreground">damage
              only</strong>. Condition immunities are a separate axis and aren't listed there —
              read them off the feature itself in the Features tab.
            </p>
          </Section>

          <Section title="What this app does and doesn't track">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">Nothing gives your character
                vulnerability.</strong> It's in the game and it's on this page for completeness,
                but no race, class, subclass or feat in this app inflicts it on you. Where
                vulnerability does appear here it points outward — a Cleric feature can impose
                it on a creature you hit, and a Ranger's Hunter's Sense reveals what a creature
                is vulnerable to.
              </li>
              <li>
                <strong className="text-foreground">Damage isn't rolled or applied.</strong> The
                app shows you what your defenses are; it doesn't resolve hits, so nothing halves
                a number for you automatically. The arithmetic above is yours to do.
              </li>
              <li>
                <strong className="text-foreground">Temporary hit points are a plain
                number.</strong> The Temp HP field is yours to set and clear — nothing tracks
                which feature granted them, how long they last, or removes them on a long rest.
              </li>
              <li>
                <strong className="text-foreground">Conditional defenses aren't switched
                on.</strong> The Defenses card marks a resistance as situational and names the
                condition ("while raging"), but the app has no notion of whether you are
                currently raging — that's yours to know.
              </li>
            </ul>
          </Section>

          <Section title="Related">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <Link className="text-primary hover:underline" to={mech('magical-attacks')}>
                  Magical Attacks &amp; Resistance
                </Link>{' '}
                — what "nonmagical" means, and why some resistances don't apply to your attacks.
              </li>
              <li>
                <Link className="text-primary hover:underline" to={mech('armor-class')}>
                  Armor Class
                </Link>{' '}
                — avoiding the hit in the first place.
              </li>
              <li>
                <Link className="text-primary hover:underline" to={mech('hit-dice')}>
                  Hit Dice
                </Link>{' '}
                — getting the damage back afterwards.
              </li>
            </ul>
          </Section>

        </div>
      </div>
    </div>
  );
}
