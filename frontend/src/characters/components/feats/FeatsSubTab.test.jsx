import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FeatsSubTab from '@/characters/components/feats/FeatsSubTab';

// FeatPicker uses a Radix dialog — mock to a flat button list so we can pick directly.
//
// The mock emits `{id, name}` ONLY, because that is FeatPicker's real documented payload. An
// earlier version of this mock passed the whole catalogue object, which is more generous than
// the real component — and that hid a live bug for as long as it existed: FeatsSubTab read
// `feat.effects` off the picker payload, so every feat added here was stored with no mechanics
// at all. Keep this faithful to the real contract.
vi.mock('@/characters/components/feats/FeatPicker', () => ({
  default: ({ feats = [], onChange }) => (
    <div data-testid="feat-picker">
      {feats.map((f) => (
        <button
          key={f.id}
          type="button"
          data-testid={`add-pick-${f.id}`}
          onClick={() => onChange({ id: f.id, name: f.name })}
        >
          {f.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/encyclopedia/featService', () => ({
  default: { getFeats: vi.fn() },
}));
import featService from '@/encyclopedia/featService';

const CATALOGUE = [
  { id: 10, name: 'Alert', prerequisites: {}, repeatable: false, source: 'PHB', description: 'Always on guard.',
    effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5, label: '+5 initiative' }, { kind: 'note', text: 'No surprise.' }] },
  { id: 11, name: 'Grappler', prerequisites: { text: 'Strength 13 or higher' }, repeatable: false, description: 'Grab on.' },
  { id: 12, name: 'Tough', prerequisites: {}, repeatable: false, description: 'Hardy.' },
];

beforeEach(() => {
  vi.clearAllMocks();
  featService.getFeats.mockResolvedValue(CATALOGUE);
});
// Pending-async flush is handled globally in src/test/setup.js.

describe('FeatsSubTab', () => {
  it('shows an empty state when the character has no feats', async () => {
    render(<FeatsSubTab feats={[]} campaignId={1} edition="5e" />);
    expect(await screen.findByTestId('feats-empty')).toBeInTheDocument();
  });

  it('fetches the catalogue with campaignId + edition', async () => {
    render(<FeatsSubTab feats={[]} campaignId={7} edition="5.5e" />);
    await waitFor(() => expect(featService.getFeats).toHaveBeenCalledWith(7, '5.5e'));
  });

  it('links a "draw or stow" feat (Dual Wielder) to the object-interaction page', async () => {
    featService.getFeats.mockResolvedValue([
      { id: 20, name: 'Dual Wielder', prerequisites: {}, repeatable: false,
        description: 'You can draw or stow two one-handed weapons when you would normally draw or stow one.' },
    ]);
    // The feat row renders a <Link> for this feat, so a Router is required.
    render(
      <MemoryRouter>
        <FeatsSubTab feats={[{ id: 20, name: 'Dual Wielder' }]} campaignId={4} edition="5e" />
      </MemoryRouter>
    );
    const link = await screen.findByTestId('feat-object-interaction-link-Dual Wielder');
    expect(link).toHaveAttribute('href', '/campaigns/4/encyclopedia/mechanics/object-interaction');
  });

  it('renders an owned feat with its resolved description and prerequisite', async () => {
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }]} campaignId={1} edition="5e" />);
    expect(await screen.findByTestId('feat-row-Grappler')).toBeInTheDocument();
    // The row renders from the `feats` prop immediately, but the description + prerequisite
    // only arrive once the catalogue fetch resolves — so wait on the resolved text itself.
    // Anchoring on the row instead is a race that passes locally and fails on CI.
    expect(await screen.findByText('Grab on.')).toBeInTheDocument();
    expect(screen.getByText(/Strength 13 or higher/)).toBeInTheDocument();
  });

  it('renders structured effect chips (more than a description card)', async () => {
    render(<FeatsSubTab feats={[{ id: 10, name: 'Alert' }]} campaignId={1} edition="5e" />);
    const chips = await screen.findByTestId('feat-effects-Alert');
    expect(chips).toHaveTextContent('+5 initiative');
  });

  it('shows the resolved ability for an ability_choice effect', async () => {
    const cat = [{ id: 20, name: 'Tavern Brawler', prerequisites: {}, repeatable: false, description: 'Brawl.',
      effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }] }];
    featService.getFeats.mockResolvedValue(cat);
    render(<FeatsSubTab feats={[{ id: 20, name: 'Tavern Brawler', choices: { ability: 'strength' } }]} campaignId={1} edition="5e" />);
    const chips = await screen.findByTestId('feat-effects-Tavern Brawler');
    expect(chips).toHaveTextContent('+1 Strength');
  });

  it('shows the level a feat was acquired', async () => {
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler', level: 4 }]} campaignId={1} edition="5e" />);
    await screen.findByTestId('feat-row-Grappler');
    expect(screen.getByText('Lvl 4')).toBeInTheDocument();
  });

  it('hides Add and remove controls when not managing', async () => {
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }]} campaignId={1} edition="5e" canManage={false} />);
    await screen.findByTestId('feat-row-Grappler');
    expect(screen.queryByTestId('feats-add-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feat-remove-Grappler')).not.toBeInTheDocument();
  });

  it('lets a manager add a feat (excluding already-owned, non-repeatable)', async () => {
    const onChange = vi.fn();
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }]} campaignId={1} edition="5e" canManage onChange={onChange} />);
    fireEvent.click(await screen.findByTestId('feats-add-btn'));
    // Wait for the fetched catalogue to populate the picker — otherwise the negative
    // assertion below passes trivially against an empty list.
    await screen.findByTestId('add-pick-10');
    // Grappler already owned → not offered; Alert + Tough are.
    expect(screen.queryByTestId('add-pick-11')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('add-pick-10'));
    // The added feat snapshots the catalogue feat's structured effects onto the instance.
    expect(onChange).toHaveBeenCalledWith({
      feats: [
        { id: 11, name: 'Grappler' },
        { id: 10, name: 'Alert', effects: CATALOGUE[0].effects },
      ],
    });
  });

  it('snapshots effects from the CATALOGUE even though the picker only passes {id,name}', async () => {
    // Regression: FeatsSubTab used to read `feat.effects` straight off the picker payload,
    // which never carries it — so a feat added from the sheet was stored as a bare {id,name}
    // and every consumer reading character_data.feats directly (the Defenses panel, the
    // unarmed die, proficiency banners) saw a feat with no mechanics. The Feats list itself
    // looked fine because it re-resolves owned feats against the catalogue for display, which
    // is precisely what made the bug invisible.
    const onChange = vi.fn();
    render(<FeatsSubTab feats={[]} campaignId={1} edition="5e" canManage onChange={onChange} />);
    fireEvent.click(await screen.findByTestId('feats-add-btn'));
    fireEvent.click(await screen.findByTestId('add-pick-10')); // Alert — has effects
    const [[patch]] = onChange.mock.calls;
    expect(patch.feats[0].effects).toEqual(CATALOGUE[0].effects);
  });

  it('snapshots a feat without effects as just {id,name}', async () => {
    const onChange = vi.fn();
    render(<FeatsSubTab feats={[]} campaignId={1} edition="5e" canManage onChange={onChange} />);
    fireEvent.click(await screen.findByTestId('feats-add-btn'));
    fireEvent.click(await screen.findByTestId('add-pick-12')); // Tough — no effects in the catalogue
    expect(onChange).toHaveBeenCalledWith({ feats: [{ id: 12, name: 'Tough' }] });
  });

  it('renders a feat resource tracker and persists Use via onChange', async () => {
    const onChange = vi.fn();
    featService.getFeats.mockResolvedValue([]); // effects come from the snapshotted instance
    render(<FeatsSubTab
      feats={[{ id: 30, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 3, recharge: 'long' }] }]}
      campaignId={1} edition="5e" characterData={{ luck_points_used: 1 }} onChange={onChange} />);
    const res = await screen.findByTestId('feat-resource-luck_points');
    expect(res).toHaveTextContent('2 / 3 remaining'); // 3 total − 1 used
    fireEvent.click(within(res).getByRole('button', { name: /Use Luck Points/i }));
    fireEvent.click(screen.getByTestId('feat-luck_points-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ luck_points_used: 2 });
  });

  it('scales a PB-total resource (2024 Lucky) by the pb prop', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab
      feats={[{ id: 31, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 'pb', recharge: 'long' }] }]}
      campaignId={1} edition="5.5e" characterData={{}} pb={3} />);
    const res = await screen.findByTestId('feat-resource-luck_points');
    expect(res).toHaveTextContent('3 / 3 remaining'); // total = pb (3)
  });

  it('hides feat resource Use controls when readOnly', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab
      feats={[{ id: 30, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 3, recharge: 'long' }] }]}
      campaignId={1} edition="5e" characterData={{ luck_points_used: 1 }} readOnly />);
    const res = await screen.findByTestId('feat-resource-luck_points');
    expect(res).toHaveTextContent('2 / 3 remaining');
    expect(within(res).queryByRole('button', { name: /Use Luck Points/i })).not.toBeInTheDocument();
  });

  it('lets a manager remove a feat', async () => {
    const onChange = vi.fn();
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }, { id: 12, name: 'Tough' }]} campaignId={1} edition="5e" canManage onChange={onChange} />);
    fireEvent.click(await screen.findByTestId('feat-remove-Grappler'));
    expect(onChange).toHaveBeenCalledWith({ feats: [{ id: 12, name: 'Tough' }] });
  });

  // ── Martial Adept (maneuver_grant) ──
  const MARTIAL_ADEPT_INSTANCE = {
    id: 40, name: 'Martial Adept',
    effects: [
      { kind: 'maneuver_grant', count: 2, die: 'd6', label: '2 maneuvers' },
      { kind: 'resource', key: 'martial_adept_superiority', label: 'Superiority Die (d6)', total: 1, recharge: 'short' },
    ],
    choices: { maneuvers: ['Trip Attack', 'Riposte'] },
  };

  it('shows a non-Battle-Master the chosen maneuvers + the d6 superiority die tracker', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab feats={[MARTIAL_ADEPT_INSTANCE]} campaignId={1} edition="5e" characterData={{}} />);
    const panel = await screen.findByTestId('feat-maneuvers');
    expect(within(panel).getByTestId('feat-maneuver-Trip Attack')).toHaveTextContent(/knock the target down/i);
    expect(within(panel).getByTestId('feat-maneuver-Riposte')).toBeInTheDocument();
    // d6 die tracker is still shown for a non-Battle-Master
    expect(screen.getByTestId('feat-resource-martial_adept_superiority')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-maneuvers-bm-note')).not.toBeInTheDocument();
  });

  it('a Battle Master sees the folded note and no standalone d6 tracker', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab feats={[MARTIAL_ADEPT_INSTANCE]} campaignId={1} edition="5e" characterData={{ subclass: 'Battle Master' }} />);
    await screen.findByTestId('feat-maneuvers');
    expect(screen.getByTestId('feat-maneuvers-bm-note')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-resource-martial_adept_superiority')).not.toBeInTheDocument();
  });

  // A save_mod used to fall through to no chip at all, so the one mechanized clause on the
  // card was the only one with nothing to show for it.
  it('chips a save_mod so the mechanized clause is visible on the feat row', async () => {
    featService.getFeats.mockResolvedValue([]);
    const shieldMaster = {
      id: 30, name: 'Shield Master',
      effects: [{
        kind: 'save_mod', abilities: ['dexterity'], amount: 'shield_ac', condition: 'shield',
        situation: 'against effects that target only you', label: 'shield AC to DEX saves',
      }],
    };
    render(<FeatsSubTab feats={[shieldMaster]} campaignId={1} edition="5e" characterData={{}} />);
    const chips = await screen.findByTestId('feat-effects-Shield Master');
    expect(chips).toHaveTextContent('shield AC to DEX saves');
  });

  it('chips a save_advantage', async () => {
    featService.getFeats.mockResolvedValue([]);
    const warCaster = {
      id: 31, name: 'War Caster',
      effects: [{
        kind: 'save_advantage', abilities: ['constitution'],
        situation: 'to maintain concentration', label: 'adv. on CON saves',
      }],
    };
    render(<FeatsSubTab feats={[warCaster]} campaignId={1} edition="5e" characterData={{}} />);
    const chips = await screen.findByTestId('feat-effects-War Caster');
    expect(chips).toHaveTextContent('adv. on CON saves');
  });

  it('shows the chosen maneuvers as the feat-row effect chip', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab feats={[MARTIAL_ADEPT_INSTANCE]} campaignId={1} edition="5e" characterData={{}} />);
    const chips = await screen.findByTestId('feat-effects-Martial Adept');
    expect(chips).toHaveTextContent('Trip Attack, Riposte');
  });
});

// ── Adding a feat runs the same follow-up choices as level-up and creation ───────────────
// The GM's Add Feat used to store a bare {id, name, effects}: a feat that asks for an ability
// score, proficiencies, spells or maneuvers was added with none of them, so Skilled granted no
// skills and Martial Adept no maneuvers. It now goes through featAcquisition + FeatChoiceFields.
describe('FeatsSubTab — Add Feat asks for the feat\'s choices', () => {
  const TAVERN_BRAWLER = {
    id: 20, name: 'Tavern Brawler', prerequisites: {}, repeatable: false, description: 'Brawl.',
    effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }],
  };
  const LINGUIST = {
    id: 21, name: 'Linguist', prerequisites: {}, repeatable: false, description: 'Tongues.',
    effects: [{ kind: 'proficiency', prof_type: 'language', count: 2 }],
  };
  const MARTIAL_ADEPT = {
    id: 22, name: 'Martial Adept', prerequisites: {}, repeatable: false, description: 'Maneuvers.',
    effects: [{ kind: 'maneuver_grant', count: 2, die: 'd6' }],
  };
  const ACTOR = {
    id: 23, name: 'Actor', prerequisites: {}, repeatable: false, description: 'Mimic.',
    effects: [{ kind: 'ability_score', ability: 'charisma', amount: 1 }],
  };
  const RESILIENT = {
    id: 24, name: 'Resilient', prerequisites: {}, repeatable: false, description: 'Tough mind.',
    effects: [
      { kind: 'ability_choice', abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], amount: 1 },
      { kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true },
    ],
  };

  beforeEach(() => {
    featService.getFeats.mockResolvedValue([...CATALOGUE, TAVERN_BRAWLER, LINGUIST, MARTIAL_ADEPT, ACTOR, RESILIENT]);
  });

  const openAndPick = async (id, props = {}) => {
    const onChange = vi.fn();
    const onAddFeat = vi.fn();
    render(
      <MemoryRouter>
        <FeatsSubTab feats={[]} campaignId={1} edition="5e" canManage onChange={onChange} onAddFeat={onAddFeat} {...props} />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByTestId('feats-add-btn'));
    fireEvent.click(await screen.findByTestId(`add-pick-${id}`));
    return { onChange, onAddFeat };
  };

  it('a feat with nothing to ask is still added at once', async () => {
    const { onAddFeat } = await openAndPick(10); // Alert
    expect(screen.queryByTestId('add-feat-choices')).toBeNull();
    expect(onAddFeat).toHaveBeenCalledWith({
      patch: { feats: [{ id: 10, name: 'Alert', effects: CATALOGUE[0].effects }] },
      asi: {},
    });
  });

  it('a half-feat holds until its ability is chosen, then records the choice and reports the +1', async () => {
    const { onAddFeat } = await openAndPick(20);
    expect(screen.getByTestId('add-feat-choices')).toHaveTextContent('Adding Tavern Brawler');
    expect(onAddFeat).not.toHaveBeenCalled();
    expect(screen.getByTestId('add-feat-confirm')).toBeDisabled();

    fireEvent.click(screen.getByTestId('add-feat-ability-constitution'));
    expect(screen.getByTestId('add-feat-confirm')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('add-feat-confirm'));

    expect(onAddFeat).toHaveBeenCalledWith({
      patch: { feats: [{ id: 20, name: 'Tavern Brawler', effects: TAVERN_BRAWLER.effects, choices: { ability: 'constitution' } }] },
      asi: { constitution: 1 },
    });
    expect(screen.queryByTestId('add-feat-choices')).toBeNull();
  });

  it('a FIXED ability increase needs no picker but is still handed to the page', async () => {
    const { onAddFeat } = await openAndPick(23); // Actor: +1 Charisma
    expect(screen.queryByTestId('add-feat-choices')).toBeNull();
    expect(onAddFeat.mock.calls[0][0].asi).toEqual({ charisma: 1 });
  });

  it('proficiency picks are written into the character, merged with what is already there', async () => {
    const { onAddFeat } = await openAndPick(21, { characterData: { feat_languages: ['Orc'] } });
    expect(screen.getByTestId('add-feat-confirm')).toBeDisabled();
    fireEvent.click(screen.getByTestId('add-feat-prof-opt-language-Elvish'));
    expect(screen.getByTestId('add-feat-confirm')).toBeDisabled(); // 1 of 2
    fireEvent.click(screen.getByTestId('add-feat-prof-opt-language-Giant'));
    fireEvent.click(screen.getByTestId('add-feat-confirm'));

    const { patch } = onAddFeat.mock.calls[0][0];
    expect(patch.feat_languages).toEqual(['Orc', 'Elvish', 'Giant']);
    expect(patch.feats).toEqual([{ id: 21, name: 'Linguist', effects: LINGUIST.effects }]);
  });

  it('does not offer a language the character already speaks', async () => {
    await openAndPick(21, { characterData: { race_languages: ['Elvish'] } });
    expect(screen.queryByTestId('add-feat-prof-opt-language-Elvish')).toBeNull();
    expect(screen.getByTestId('add-feat-prof-opt-language-Giant')).toBeInTheDocument();
  });

  it('Martial Adept asks for its maneuvers and stores them on the feat', async () => {
    const { onAddFeat } = await openAndPick(22, { characterData: { subclass: 'Champion' } });
    expect(screen.getByTestId('add-feat-confirm')).toBeDisabled();
    fireEvent.click(screen.getByTestId('add-feat-maneuver-Riposte'));
    fireEvent.click(screen.getByTestId('add-feat-maneuver-Parry'));
    fireEvent.click(screen.getByTestId('add-feat-confirm'));

    const { patch } = onAddFeat.mock.calls[0][0];
    expect(patch.feats[0].choices).toEqual({ maneuvers: ['Riposte', 'Parry'] });
    expect(patch).not.toHaveProperty('maneuvers'); // not a Battle Master
  });

  it('a Battle Master gets the feat maneuvers folded into the shared known list', async () => {
    const { onAddFeat } = await openAndPick(22, { characterData: { subclass: 'Battle Master', maneuvers: ['Rally'] } });
    // A maneuver already known is not offered again.
    expect(screen.queryByTestId('add-feat-maneuver-Rally')).toBeNull();
    fireEvent.click(screen.getByTestId('add-feat-maneuver-Riposte'));
    fireEvent.click(screen.getByTestId('add-feat-maneuver-Parry'));
    fireEvent.click(screen.getByTestId('add-feat-confirm'));
    expect(onAddFeat.mock.calls[0][0].patch.maneuvers).toEqual(['Rally', 'Riposte', 'Parry']);
  });

  it('Resilient does not offer a save the character already has', async () => {
    await openAndPick(24, { saveProficiencies: ['strength', 'constitution'] });
    expect(screen.queryByTestId('add-feat-ability-strength')).toBeNull();
    expect(screen.queryByTestId('add-feat-ability-constitution')).toBeNull();
    expect(screen.getByTestId('add-feat-ability-wisdom')).toBeInTheDocument();
  });

  it('cancelling the choices adds nothing and returns to the picker', async () => {
    const { onAddFeat, onChange } = await openAndPick(20);
    fireEvent.click(screen.getByTestId('add-feat-ability-strength'));
    fireEvent.click(screen.getByTestId('add-feat-cancel'));
    expect(onAddFeat).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('add-feat-choices')).toBeNull();
    expect(screen.getByTestId('feat-picker')).toBeInTheDocument();
  });

  it('choices made for one feat do not leak into the next feat picked', async () => {
    await openAndPick(20);
    fireEvent.click(screen.getByTestId('add-feat-ability-strength'));
    fireEvent.click(screen.getByTestId('add-feat-cancel'));
    fireEvent.click(screen.getByTestId('add-pick-20'));
    expect(screen.getByTestId('add-feat-confirm')).toBeDisabled();
  });

  it('appends to the feats the character already has', async () => {
    const { onAddFeat } = await openAndPick(20, { feats: [{ id: 12, name: 'Tough' }] });
    fireEvent.click(screen.getByTestId('add-feat-ability-strength'));
    fireEvent.click(screen.getByTestId('add-feat-confirm'));
    expect(onAddFeat.mock.calls[0][0].patch.feats.map((f) => f.name)).toEqual(['Tough', 'Tavern Brawler']);
  });

  it('without onAddFeat the patch still goes through onChange', async () => {
    const onChange = vi.fn();
    render(<MemoryRouter><FeatsSubTab feats={[]} campaignId={1} edition="5e" canManage onChange={onChange} /></MemoryRouter>);
    fireEvent.click(await screen.findByTestId('feats-add-btn'));
    fireEvent.click(await screen.findByTestId('add-pick-21'));
    fireEvent.click(screen.getByTestId('add-feat-prof-opt-language-Elvish'));
    fireEvent.click(screen.getByTestId('add-feat-prof-opt-language-Giant'));
    fireEvent.click(screen.getByTestId('add-feat-confirm'));
    expect(onChange).toHaveBeenCalledWith({
      feats: [{ id: 21, name: 'Linguist', effects: LINGUIST.effects }],
      feat_languages: ['Elvish', 'Giant'],
    });
  });

  it('a player (not managing) is offered none of it', async () => {
    render(<MemoryRouter><FeatsSubTab feats={[]} campaignId={1} edition="5e" canManage={false} /></MemoryRouter>);
    await screen.findByTestId('feats-empty');
    expect(screen.queryByTestId('feats-add-btn')).toBeNull();
    expect(screen.queryByTestId('add-feat-choices')).toBeNull();
  });
});
