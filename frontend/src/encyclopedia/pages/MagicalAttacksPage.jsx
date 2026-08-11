import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { magicalAttackSource } from '@/characters/components/inventory/weaponMagic';

/**
 * Static reference page for magical attacks and resistance to nonmagical damage
 * (Encyclopedia → Mechanics → Magical Attacks). A pure rules concept with one small
 * computed piece — whether a given character's weapon counts as magical — which the
 * app already owns in `weaponMagic.js`, so this is a Flow-B page: no new helper and
 * no new card. It is linked from the "Magic · {source}" tag on the attack surfaces
 * (Items tab + Action Economy), and ONLY from there — the link appears exactly when
 * the tag does, so it never advertises a rule the character can't use.
 *
 * The worked example calls `magicalAttackSource` rather than restating its answer, so
 * the page can never claim something the sheet disagrees with.
 *
 * No edition toggle: the mechanic itself is identical in 2014 and 2024 (a magical
 * attack ignores resistance to nonmagical damage). What changed is which MONSTERS have
 * that resistance, which is one paragraph rather than a second copy of the page —
 * convention is to toggle only when the editions actually differ.
 */

// The in-app features that make a character's own attacks magical. Every entry is a
// real feature in this app's data (classFeatures5e.js / subclassData/*), not invented:
// only Magic Arrow is MECHANIZED so far (weaponMagic.js) — the rest are documented here
// because a player reading this page needs the full picture, and each is marked with
// whether the sheet tags it for you yet.
const MAGIC_SOURCES = [
  {
    name: 'Magic Arrow',
    kind: 'Fighter — Arcane Archer, level 7',
    effect: 'Arrows you fire from a shortbow or longbow become magical. This is why an Arcane Archer\'s bow carries the Magic tag on its attack card.',
    tagged: true,
  },
  {
    name: 'Ki-Empowered Strikes',
    kind: 'Monk, level 6',
    effect: 'Your unarmed strikes count as magical.',
    tagged: false,
  },
  {
    name: 'One with the Blade',
    kind: 'Monk — Way of the Kensei, level 6',
    effect: 'Your kensei weapons count as magical.',
    tagged: false,
  },
  {
    name: 'Primal Strike',
    kind: 'Druid — Circle of the Moon, level 6',
    effect: 'Your attacks in beast form count as magical.',
    tagged: false,
  },
  {
    name: 'Blessing of the Forge',
    kind: 'Cleric — Forge Domain, level 1',
    effect: 'After a long rest, touch a nonmagical weapon or armor: it becomes a magic item with a +1 bonus until your next long rest.',
    tagged: false,
  },
];

// Features in this app that give a CHARACTER the resistance from the other side of
// the table — so you can see what it feels like to be on the receiving end.
const RESISTANCE_SOURCES = [
  { name: 'Avatar of Battle', kind: 'Cleric — War Domain, level 17' },
  { name: 'Supernatural Resistance', kind: 'Paladin — Oath of the Ancients, level 15' },
];

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function MagicalAttacksPage() {
  const { campaignId } = useParams();
  const mech = (slug) => `/campaigns/${campaignId}/encyclopedia/mechanics/${slug}`;

  // Worked example straight from the resolver the character sheet uses.
  const archer = { charClass: 'Fighter', subclass: 'Arcane Archer', level: 7, edition: '5e' };
  const bowMagic = magicalAttackSource({ name: 'Longbow' }, archer);
  const daggerMagic = magicalAttackSource({ name: 'Dagger' }, archer);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="magical-attacks-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            Magical Attacks &amp; Resistance
          </h1>
          <p className="text-sm text-muted-foreground">
            What "resistance to nonmagical attacks and damage" means, and what it takes to punch through it.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section title="The problem: resistance to nonmagical damage">
            <p>
              Many creatures — werewolves, most incorporeal undead, some elementals and demons — have{' '}
              <span className="font-medium text-foreground">resistance to bludgeoning, piercing, and slashing
              damage from nonmagical attacks</span>. A few have outright{' '}
              <span className="font-medium text-foreground">immunity</span>.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Resistance halves the damage</span> you deal (round down). Hit a werewolf for 11 with a mundane sword and it takes 5.</li>
              <li><span className="font-medium text-foreground">Immunity zeroes it.</span> A mundane weapon simply cannot hurt the thing.</li>
              <li>It applies to the <span className="font-medium text-foreground">damage, not the attack roll</span> — you still hit normally, you just accomplish less.</li>
            </ul>
            <p>
              Only the three physical weapon damage types are covered. Fire, radiant, force, psychic and the rest
              are never "nonmagical damage" in this sense — a Fire Bolt was always going to work.
            </p>
          </Section>

          <Section title="The fix: make the attack magical">
            <p>
              If your attack counts as <span className="font-medium text-foreground">magical</span>, that resistance
              and immunity simply don't apply — you deal full damage. There is no roll, no save, and no resource to
              spend. Either the attack is magical or it isn't.
            </p>
            <p>There are three ways to get there:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <span className="font-medium text-foreground">The weapon itself is magical</span> — any magic weapon,
                with or without a plus. A +1 longsword and a nonplussed magic dagger both qualify.
              </li>
              <li>
                <span className="font-medium text-foreground">A class or subclass feature says so</span> — the table
                below. These usually cover only some of what you wield: an Arcane Archer's arrows, a Monk's fists.
              </li>
              <li>
                <span className="font-medium text-foreground">A spell makes it magical for a while</span> —{' '}
                <span className="italic">Magic Weapon</span> (2nd level) makes a nonmagical weapon a +1 magic weapon
                for the duration, and <span className="italic">Shillelagh</span> (cantrip) does the same for a club
                or quarterstaff. Both are in this campaign's spell compendium.
              </li>
            </ol>
            <p className="rounded-md border border-border bg-muted/40 p-3">
              <span className="font-medium text-foreground">A common misreading:</span> a magic weapon's{' '}
              <span className="font-medium text-foreground">+1</span> and its{' '}
              <span className="font-medium text-foreground">magical-ness</span> are separate things. The plus is a
              bonus to attack and damage rolls; being magical is what beats the resistance. A magic weapon with no
              plus at all still beats it.
            </p>
          </Section>

          <Section title="Features in this app that make your attacks magical">
            <p>
              Each of these is a real feature on a class or subclass in this campaign. The sheet currently adds the{' '}
              <span className="font-medium text-foreground">Magic</span> tag automatically for the ones marked{' '}
              <span className="font-medium text-foreground">tagged</span>; for the others, the feature is listed in
              your Features tab and you apply it at the table.
            </p>
            <div className="rounded-lg border border-border divide-y" data-testid="magical-attacks-sources">
              {MAGIC_SOURCES.map((s) => (
                <div key={s.name} className="p-3 space-y-1" data-testid={`magic-source-${s.name}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.kind}</span>
                    {s.tagged && (
                      <span className="text-[10px] uppercase tracking-wide rounded border border-primary/50 text-primary px-1.5 py-0.5">
                        Tagged on your sheet
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{s.effect}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Worked example — an Arcane Archer at level 7">
            <p>
              A level-7 Fighter (Arcane Archer) holding a longbow and a dagger. Asking the same resolver the
              character sheet uses, per weapon:
            </p>
            <ul className="list-disc pl-5 space-y-1" data-testid="magical-attacks-example">
              <li>
                <span className="font-medium text-foreground">Longbow</span> — magical
                {bowMagic ? ` (${bowMagic.source})` : ''}. Arrows fired from it deal full damage to a werewolf.
              </li>
              <li>
                <span className="font-medium text-foreground">Dagger</span> —{' '}
                {daggerMagic ? `magical (${daggerMagic.source})` : 'not magical'}. The same character stabbing with
                the dagger is back to half damage.
              </li>
            </ul>
            <p>
              That per-weapon split is the whole reason the tag sits on each attack rather than at the top of the
              sheet: <span className="italic">you</span> are not magical, one of your weapons is.
            </p>
          </Section>

          <Section title="Being on the other side of it">
            <p>
              A couple of features in this app hand the resistance to a <span className="italic">character</span>:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {RESISTANCE_SOURCES.map((r) => (
                <li key={r.name}>
                  <span className="font-medium text-foreground">{r.name}</span> — {r.kind}. Bludgeoning, piercing and
                  slashing damage from nonmagical weapons is halved against you.
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What changed in the 2024 rules">
            <p>
              The mechanic is unchanged: a magical attack still ignores resistance to nonmagical damage. What
              changed is <span className="font-medium text-foreground">how often it comes up</span> — the 2024
              Monster Manual dropped "resistance to nonmagical bludgeoning, piercing, and slashing" from a great
              many statblocks, replacing it with plain higher hit points or targeted resistances. Expect the tag to
              matter less in a 2024 campaign, and ask your GM which monster statblocks they're using.
            </p>
          </Section>

          <Section title="What this app does and doesn't track">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-foreground">Magic weapons you own aren't equippable yet</span> —
                magic items live in their own encyclopedia category, so the sheet can't currently mark a +1 longsword
                as magical. Every weapon it lets you equip is a mundane one.
              </li>
              <li>
                <span className="font-medium text-foreground">Spell-granted magic isn't tagged</span> — the app
                tracks no spell duration, so it won't claim your weapon is magical because you cast Magic Weapon an
                hour ago. Track that one at the table.
              </li>
              <li>
                <span className="font-medium text-foreground">The bestiary doesn't record resistances</span> — creature
                entries have no damage-resistance field, so whether a given monster resists you is the GM's call from
                their own statblock.
              </li>
            </ul>
          </Section>

          <Section title="Related">
            <ul className="list-disc pl-5 space-y-1">
              <li><Link className="text-primary hover:underline" to={mech('action-economy')}>Action Economy</Link> — where your attacks come from in a turn.</li>
              <li><Link className="text-primary hover:underline" to={mech('spacing')}>Spacing &amp; the 5-Foot Rule</Link> — firing that magical bow while something is in your face.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
