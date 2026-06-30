import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '../../campaigns/CampaignContext';
import {
  TABS, TAB_LABELS,
  UNIVERSAL_ACTIONS_5E, UNIVERSAL_ACTIONS_2024,
  UNIVERSAL_REACTIONS_5E, UNIVERSAL_REACTIONS_2024,
} from '@/characters/components/combat/actionEconomyData';

/**
 * Static reference page for the action economy (Encyclopedia → Mechanics →
 * Action Economy). Flow B: the model already lives in actionEconomyData.js and
 * is rendered per-character by ActionEconomyTab; this page documents it and is
 * linked from that tab's "Learn more". The standard-actions list is bound to the
 * real UNIVERSAL_ACTIONS_* arrays so it stays in sync with the sheet. The action
 * menu differs by edition, so this page has an edition toggle (jump/AC don't).
 */

// Plain-language description of each bucket, keyed to the sheet's TABS.
const BUCKET_BLURB = {
  no_action: 'Things that cost no action, bonus action, or reaction at all — free object interactions, dropping an item, speaking, and a few features that explicitly happen "for free" (Action Surge, Indomitable). The sheet groups these first so they\'re easy to remember.',
  action: 'Your main move of the turn — you get exactly one. Attack, cast most spells, Dash, Dodge, Disengage, and the rest of the standard menu below all cost your action.',
  bonus: "An extra, smaller action you get only when a feature, spell, or weapon grants one — you can't take a bonus action just because you want to. You get at most one per turn.",
  'action+bonus': 'A few things use both your action and your bonus action together — most commonly Two-Weapon Fighting (attack with your main hand as the Attack action, then the off-hand weapon as a bonus action).',
  reaction: 'One instant response per round, used on a trigger you can take even on someone else\'s turn — an Opportunity Attack when a foe leaves your reach, the Shield spell when you\'re hit, or a Readied action.',
};

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function ActionEconomyPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';
  const [edition, setEdition] = useState(campaignEdition);

  const universalActions = edition === '5.5e' ? UNIVERSAL_ACTIONS_2024 : UNIVERSAL_ACTIONS_5E;
  const universalReactions = edition === '5.5e' ? UNIVERSAL_REACTIONS_2024 : UNIVERSAL_REACTIONS_5E;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="action-economy-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Repeat className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Action Economy
          </h1>
          <p className="text-sm text-muted-foreground">
            What you can do on your turn — and how the sheet sorts it for your character.
          </p>
        </div>

        {/* Edition toggle — the standard action menu differs between editions */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {['5e', '5.5e'].map((ed) => (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              data-testid={`action-economy-edition-${ed}`}
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
          <Section title="What the action economy is">
            <p>
              On your turn in combat you have a budget of things you can do: you can{' '}
              <span className="font-medium text-foreground">move</span> up to your speed, take{' '}
              <span className="font-medium text-foreground">one action</span>, possibly{' '}
              <span className="font-medium text-foreground">one bonus action</span>, and you have{' '}
              <span className="font-medium text-foreground">one reaction</span> you can spend even on other
              creatures' turns. "Action economy" is just the shorthand for spending that budget well — knowing
              what costs an action versus a bonus action versus nothing at all.
            </p>
          </Section>

          <Section title="The five buckets">
            <p>The sheet's Action Economy tab sorts everything your character can do into five groups:</p>
            <ul className="space-y-2">
              {TABS.map((tab) => (
                <li key={tab}>
                  <span className="font-medium text-foreground">{TAB_LABELS[tab]}</span> — {BUCKET_BLURB[tab]}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="The standard actions anyone can take">
            <p>
              Every character can take these actions ({edition === '5.5e' ? '2024' : '5e'} rules), on top of
              anything their class, race, or items add:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {universalActions.map((a) => (
                <li key={a.name}>
                  <span className="font-medium text-foreground">{a.name}</span> — {a.description}
                </li>
              ))}
              <li>
                <span className="font-medium text-foreground">Cast a Spell</span> — if you're a spellcaster.
                Most spells cost an action, but some take a bonus action or a reaction (the sheet lists your
                actual spells under their own group and buckets each by its casting time).
              </li>
            </ul>
            <p>
              The standard reaction available to everyone is{' '}
              {universalReactions.map((r, i) => (
                <span key={r.name}>
                  {i > 0 && ', '}
                  <span className="font-medium text-foreground">{r.name}</span> ({r.description.replace(/\.$/, '')})
                </span>
              ))}.
            </p>
          </Section>

          <Section title="What the sheet figures out for your character">
            <p>
              The <span className="font-medium text-foreground">Action Economy</span> tab on your sheet builds
              this list automatically:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Weapon attacks</span> from your equipped weapons appear under Actions (and it knows your Extra Attack count).</li>
              <li><span className="font-medium text-foreground">Spells</span> you know are bucketed by their casting time — action, bonus action, or reaction.</li>
              <li><span className="font-medium text-foreground">Two-Weapon Fighting</span> shows under Action + Bonus when you have two suitable melee weapons equipped, with explicit main-hand / off-hand rows.</li>
              <li><span className="font-medium text-foreground">Class, subclass, and racial features</span> that cost an action drop into the right bucket — rest-rechargeable ones (Second Wind, Action Surge) even get a Use button.</li>
              <li>Everything else is the <span className="font-medium text-foreground">standard menu</span> above, shown as a "General — available to everyone" group.</li>
            </ul>
          </Section>

          <Section title="At the table">
            <p>
              A 5th-level fighter's turn: she <span className="font-medium text-foreground">moves</span> 30 ft to a
              goblin, takes the <span className="font-medium text-foreground">Attack action</span> (two attacks
              thanks to Extra Attack), then spends her <span className="font-medium text-foreground">bonus
              action</span> on Second Wind to heal. She still has her <span className="font-medium text-foreground">reaction</span> in
              reserve — when a second goblin tries to run past her later, she uses it for an Opportunity Attack.
              If she needs even more, <span className="font-medium text-foreground">Action Surge</span> costs no
              action at all and hands her a whole extra Attack action — which is why the sheet files it under "No
              Action," not "Actions."
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
