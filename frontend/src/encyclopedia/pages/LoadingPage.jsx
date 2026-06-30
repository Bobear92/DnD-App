import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '../../campaigns/CampaignContext';
import { weaponLoadingNote } from '@/characters/components/inventory/inventoryData';

/**
 * Static reference page for the weapon Loading property (Encyclopedia → Mechanics →
 * Loading). Flow B: the rule already lives in inventoryData.js (isLoadingWeapon /
 * weaponLoadingNote) and is rendered per-weapon on the Items tab + the Action Economy
 * tab; this page documents it and is linked from those surfaces' "Learn more".
 *
 * The page's note text is sourced from weaponLoadingNote so it can't drift from the
 * sheet. The Loading property only exists in the 2014 (5e) rules — 2024 removed it —
 * so this page has an edition toggle (the per-character notes are edition-aware too).
 */

// A sample crossbow used only to source the page's note text from the live helper.
const SAMPLE_CROSSBOW = { name: 'Light Crossbow', weapon_type: 'Ranged', properties: '["Ammunition", "Loading", "Two-Handed"]' };
const CROSSBOW_EXPERT = [{ name: 'Crossbow Expert' }];

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function LoadingPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';
  const [edition, setEdition] = useState(campaignEdition);
  const is2024 = edition === '5.5e';

  // Sourced from the helper so the page matches the sheet exactly.
  const capNote = weaponLoadingNote(SAMPLE_CROSSBOW, { proficient: true, edition: '5e' });
  const ignoredNote = weaponLoadingNote(SAMPLE_CROSSBOW, { feats: CROSSBOW_EXPERT, proficient: true, edition: '5e' });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="loading-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Hourglass className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Loading
          </h1>
          <p className="text-sm text-muted-foreground">
            Why a crossbow fires only once per turn — and how to fire more.
          </p>
        </div>

        {/* Edition toggle — the Loading property exists in 2014 (5e) but was removed in 2024. */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {['5e', '5.5e'].map((ed) => (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              data-testid={`loading-edition-${ed}`}
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
          {is2024 ? (
            <>
              <Section title="The 2024 rules removed the Loading property">
                <p>
                  In the 2024 Player's Handbook there is <span className="font-medium text-foreground">no Loading
                  property</span>. Crossbows and the blowgun work like any other weapon: if a feature lets you
                  make more than one attack (Extra Attack, an extra action, a bonus-action attack), you can make
                  every one of those attacks with a crossbow.
                </p>
                <p>
                  So for a 2024 character the sheet shows no Loading note on any weapon, and Extra Attack lets a
                  Fighter fire a light crossbow twice with a single Attack action — no feat required.
                </p>
              </Section>
              <Section title="What about Crossbow Expert in 2024?">
                <p>
                  The 2024 <span className="font-medium text-foreground">Crossbow Expert</span> feat no longer has
                  to lift a Loading cap (there isn't one). It still grants its other benefits — most notably the
                  ability to make a hand-crossbow attack as a bonus action when you attack with a one-handed
                  weapon. Switch this page to <span className="font-medium text-foreground">5e</span> to see how
                  the property worked under the 2014 rules.
                </p>
              </Section>
            </>
          ) : (
            <>
              <Section title="What the Loading property does">
                <p>
                  A weapon with the <span className="font-medium text-foreground">Loading</span> property can fire
                  only <span className="font-medium text-foreground">one piece of ammunition</span> each time you
                  take an action, a bonus action, or a reaction to fire it — <span className="italic">regardless of
                  how many attacks you could normally make</span>. Loading the weapon is built into the attack
                  itself, so you can't "preload" before a fight to get around it.
                </p>
              </Section>

              <Section title="Which weapons have it">
                <p>Four weapons carry the Loading property:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-medium text-foreground">Light Crossbow</span> (two-handed)</li>
                  <li><span className="font-medium text-foreground">Hand Crossbow</span> (one-handed — needs a free hand to load each shot)</li>
                  <li><span className="font-medium text-foreground">Heavy Crossbow</span> (two-handed)</li>
                  <li><span className="font-medium text-foreground">Blowgun</span></li>
                </ul>
                <p>
                  The <span className="font-medium text-foreground">Net</span> is sometimes assumed to load, but it
                  doesn't — it has the Special and Thrown properties instead, and its own one-attack restriction is
                  written into the Net's own rules, not the Loading property.
                </p>
              </Section>

              <Section title="Why Extra Attack doesn't help">
                <p>
                  The Loading property caps you at one shot per action even when a feature would otherwise give you
                  more attacks. A 5th-level Fighter has <span className="font-medium text-foreground">Extra Attack</span> (two
                  attacks on the Attack action), but with a light crossbow the sheet still notes:
                </p>
                <p className="text-amber-600 font-medium">{capNote}</p>
                <p>
                  Two-handed crossbows (light and heavy) only need two hands at the moment you attack, so you can
                  hold one in a single hand between turns — but that doesn't change the one-shot limit. A hand
                  crossbow additionally needs a free hand to reload every shot.
                </p>
              </Section>

              <Section title="How feats and features change it">
                <p>The app surfaces three in-game ways to fire more than once:</p>
                <ul className="space-y-2">
                  <li>
                    <span className="font-medium text-foreground">Crossbow Expert</span> (feat) — you ignore the
                    Loading property on crossbows you're <span className="italic">proficient</span> with. Now Extra
                    Attack works normally, and the sheet's note changes to{' '}
                    <span className="text-emerald-600 font-medium">"{ignoredNote}"</span>. The feat also lets you
                    make a hand-crossbow attack as a bonus action after you attack with a one-handed weapon. It does
                    <span className="font-medium text-foreground"> not</span> help a Blowgun — that's a loading
                    weapon but not a crossbow.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Action Surge</span> (Fighter) — Loading limits you
                    to one shot <span className="italic">per action</span>, so taking a second Attack action lets
                    you fire a second time. The cap is per-action, and Action Surge hands you another action.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">War Priest</span> (War Domain Cleric) — gives a
                    weapon attack as a <span className="italic">bonus action</span>. That's a separate slice of the
                    action economy, so it's a separate single shot — fire once with your action and once with the
                    bonus-action attack.
                  </li>
                </ul>
                <p className="text-xs">
                  The common thread for the last two: Loading limits each <span className="italic">action,
                  bonus action, or reaction</span> separately, so anything that hands you an <span className="italic">extra</span> one
                  of those gives you another single shot. Only Crossbow Expert removes the cap within a single
                  Attack action.
                </p>
              </Section>

              <Section title="At the table">
                <p>
                  A 5th-level Fighter takes the <span className="font-medium text-foreground">Attack action</span> with
                  a light crossbow. Without Crossbow Expert, Loading caps her at one bolt even though Extra Attack
                  says two — she uses her second attack on something else, or fires again only by spending{' '}
                  <span className="font-medium text-foreground">Action Surge</span> for a whole extra action. Take
                  the <span className="font-medium text-foreground">Crossbow Expert</span> feat and the cap is gone:
                  the Attack action now fires twice, and if she's holding a hand crossbow she can add a third shot
                  as a bonus action.
                </p>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
