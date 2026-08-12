import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EncountersPage from './EncountersPage';

vi.mock('@/shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

let mockCampaign = { id: 1, name: 'Test', userRole: 'gm', edition: '5e' };
vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '1' }),
}));

vi.mock('@/encounters/encounterService', () => ({
  default: {
    getEncounters: vi.fn(),
    getEncounter: vi.fn(),
    createEncounter: vi.fn(),
    deleteEncounter: vi.fn(),
    addCombatant: vi.fn(),
    setInitiative: vi.fn(),
    removeCombatant: vi.fn(),
  },
}));

vi.mock('@/characters/characterService', () => ({
  default: {
    getCharactersByCampaign: vi.fn(),
    applyRest: vi.fn(),
    getInitiativeOptions: vi.fn(),
  },
}));

import encounterService from '@/encounters/encounterService';
import characterService from '@/characters/characterService';

// An L15 Arcane Archer with a spent Arcane Shot pool — the character Ever-Ready Shot exists for.
const ARCHER = {
  id: 10, name: 'Yaara', char_class: 'Fighter', level: 15, dexterity: 18,
  character_data: { subclass: 'Arcane Archer', arcane_shot_used: 2 },
};
const WIZARD = {
  id: 11, name: 'Bram', char_class: 'Wizard', level: 5, dexterity: 12,
  character_data: {},
};

const combatant = (id, char, initiative = null) => ({
  id,
  encounter_id: 7,
  character_id: char.id,
  initiative,
  character_name: char.name,
  char_class: char.char_class,
  level: char.level,
});

const ENCOUNTER = {
  id: 7, campaign_id: 1, name: 'Goblin Ambush',
  combatants: [combatant(70, ARCHER), combatant(71, WIZARD)],
};

function renderPage() {
  return render(<MemoryRouter><EncountersPage /></MemoryRouter>);
}

/** Open the seeded encounter and wait for its combatants to land. */
async function openEncounter() {
  fireEvent.click(await screen.findByTestId('encounter-row-7'));
  await screen.findByTestId('combatant-row-10');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCampaign = { id: 1, name: 'Test', userRole: 'gm', edition: '5e' };
  encounterService.getEncounters.mockResolvedValue({
    success: true,
    data: [{ id: 7, campaign_id: 1, name: 'Goblin Ambush', combatant_count: 2 }],
  });
  encounterService.getEncounter.mockResolvedValue({ success: true, data: ENCOUNTER });
  characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [ARCHER, WIZARD] });
  // Most characters have nothing to opt into; the opt-in tests override this.
  characterService.getInitiativeOptions.mockResolvedValue({ success: true, data: [] });
});

describe('EncountersPage — GM gating', () => {
  it('tells a player this is a GM tool and fetches nothing', async () => {
    mockCampaign = { id: 1, name: 'Test', userRole: 'player', edition: '5e' };
    renderPage();
    expect(await screen.findByTestId('encounters-gm-only')).toBeInTheDocument();
    expect(encounterService.getEncounters).not.toHaveBeenCalled();
  });

  it('loads encounters and characters for the GM', async () => {
    renderPage();
    await screen.findByTestId('encounter-row-7');
    expect(encounterService.getEncounters).toHaveBeenCalledWith('1');
    expect(characterService.getCharactersByCampaign).toHaveBeenCalledWith('1');
  });

  it('shows an empty state when there are no encounters', async () => {
    encounterService.getEncounters.mockResolvedValue({ success: true, data: [] });
    renderPage();
    expect(await screen.findByTestId('encounters-empty')).toBeInTheDocument();
  });

  it('surfaces a load failure', async () => {
    encounterService.getEncounters.mockResolvedValue({ success: false, error: 'Only the GM can manage encounters' });
    renderPage();
    expect(await screen.findByTestId('encounters-error')).toHaveTextContent('Only the GM can manage encounters');
  });
});

describe('EncountersPage — building an encounter', () => {
  it('opens an encounter and lists its combatants', async () => {
    renderPage();
    await openEncounter();
    expect(screen.getByTestId('active-encounter-name')).toHaveTextContent('Goblin Ambush');
    expect(screen.getByTestId('combatant-row-11')).toHaveTextContent('Bram');
  });

  // The whole point of reading it off the sheet: DEX 18 → +4, no hand-maths for the GM.
  it('shows each combatant initiative modifier from their sheet', async () => {
    renderPage();
    await openEncounter();
    expect(screen.getByTestId('combatant-mod-10')).toHaveTextContent('Initiative +4');
    expect(screen.getByTestId('combatant-mod-11')).toHaveTextContent('Initiative +1');
  });

  it('folds a feat bonus into the shown modifier', async () => {
    const alert = {
      ...WIZARD,
      character_data: { feats: [{ name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] }] },
    };
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [ARCHER, alert] });
    renderPage();
    await openEncounter();
    expect(screen.getByTestId('combatant-mod-11')).toHaveTextContent('Initiative +6'); // +1 DEX, +5 Alert
  });

  it('creates an encounter with the picked characters', async () => {
    encounterService.createEncounter.mockResolvedValue({ success: true, data: { ...ENCOUNTER, name: 'Ambush' } });
    renderPage();
    // The New Encounter button renders before the roster does — anchor on the FETCHED character
    // list inside the dialog, or this passes locally and flakes on a loaded runner.
    fireEvent.click(await screen.findByTestId('new-encounter-btn'));
    fireEvent.change(screen.getByTestId('new-encounter-name'), { target: { value: 'Ambush' } });
    fireEvent.click(await screen.findByTestId('new-encounter-char-10'));
    fireEvent.click(screen.getByTestId('create-encounter-btn'));

    await waitFor(() => expect(encounterService.createEncounter).toHaveBeenCalledWith('1', {
      name: 'Ambush', character_ids: [10],
    }));
  });

  it('adds a character to the open encounter', async () => {
    encounterService.getEncounter.mockResolvedValue({
      success: true, data: { ...ENCOUNTER, combatants: [combatant(70, ARCHER)] },
    });
    encounterService.addCombatant.mockResolvedValue({ success: true, data: combatant(71, WIZARD) });
    renderPage();
    await openEncounter();

    fireEvent.click(screen.getByTestId('add-character-11'));
    await waitFor(() => expect(encounterService.addCombatant).toHaveBeenCalledWith('1', 7, 11));
  });

  it('removes a combatant', async () => {
    encounterService.removeCombatant.mockResolvedValue({ success: true });
    renderPage();
    await openEncounter();

    fireEvent.click(screen.getByTestId('remove-combatant-70'));
    await waitFor(() => expect(encounterService.removeCombatant).toHaveBeenCalledWith('1', 7, 70));
  });
});

describe('EncountersPage — rolling initiative', () => {
  it('rolls for every combatant and persists each result', async () => {
    // d20 is (floor(rng*20)+1); 0.5 → 11. Archer +4 → 15, Wizard +1 → 12.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    encounterService.setInitiative.mockResolvedValue({ success: true, data: ENCOUNTER });
    renderPage();
    await openEncounter();

    fireEvent.click(screen.getByTestId('roll-all-btn'));
    await waitFor(() => expect(encounterService.setInitiative).toHaveBeenCalledTimes(2));
    expect(encounterService.setInitiative).toHaveBeenCalledWith('1', 7, 70, 15);
    expect(encounterService.setInitiative).toHaveBeenCalledWith('1', 7, 71, 12);
    Math.random.mockRestore();
  });

  it('lets the GM type a value instead of rolling', async () => {
    encounterService.setInitiative.mockResolvedValue({ success: true, data: ENCOUNTER });
    renderPage();
    await openEncounter();

    fireEvent.change(screen.getByTestId('init-input-70'), { target: { value: '19' } });
    await waitFor(() => expect(encounterService.setInitiative).toHaveBeenCalledWith('1', 7, 70, 19));
  });

  it('clearing an input clears the initiative rather than writing 0', async () => {
    encounterService.getEncounter.mockResolvedValue({
      success: true, data: { ...ENCOUNTER, combatants: [combatant(70, ARCHER, 14)] },
    });
    encounterService.setInitiative.mockResolvedValue({ success: true, data: ENCOUNTER });
    renderPage();
    await openEncounter();

    fireEvent.change(screen.getByTestId('init-input-70'), { target: { value: '' } });
    await waitFor(() => expect(encounterService.setInitiative).toHaveBeenCalledWith('1', 7, 70, null));
  });

  // The server owns the sort; the page renders positions in the order it is handed.
  it('numbers the order as returned, leaving unrolled rows unnumbered', async () => {
    encounterService.getEncounter.mockResolvedValue({
      success: true,
      data: { ...ENCOUNTER, combatants: [combatant(70, ARCHER, 21), combatant(71, WIZARD)] },
    });
    renderPage();
    await openEncounter();

    expect(within(screen.getByTestId('combatant-row-10')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByTestId('combatant-row-11')).getByText('—')).toBeInTheDocument();
  });

  it('shows the advantage flag for a 2024 Champion', async () => {
    mockCampaign = { id: 1, name: 'Test', userRole: 'gm', edition: '5.5e' };
    const champion = { ...ARCHER, character_data: { subclass: 'Champion' } };
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [champion, WIZARD] });
    renderPage();
    await openEncounter();

    expect(screen.getByTestId('combatant-advantage-10')).toBeInTheDocument();
    expect(screen.queryByTestId('combatant-advantage-11')).not.toBeInTheDocument();
  });
});

describe('EncountersPage — starting combat', () => {
  it('applies the initiative rest for everyone in the encounter', async () => {
    characterService.applyRest.mockResolvedValue({
      success: true,
      data: { rest_type: 'initiative', applied_to: [] },
    });
    renderPage();
    await openEncounter();

    fireEvent.click(screen.getByTestId('start-combat-btn'));
    // Null opt-ins when nobody has a choice to make.
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith('1', 'initiative', [10, 11], null));
  });

  it('reports what each character regained', async () => {
    characterService.applyRest.mockResolvedValue({
      success: true,
      data: {
        rest_type: 'initiative',
        applied_to: [
          { character_id: 10, name: 'Yaara', changes: ['Arcane Shot: 1 use regained (Ever-Ready Shot)'] },
          { character_id: 11, name: 'Bram', changes: ['Nothing regained on initiative'] },
        ],
      },
    });
    renderPage();
    await openEncounter();

    fireEvent.click(screen.getByTestId('start-combat-btn'));
    expect(await screen.findByTestId('regained-10')).toHaveTextContent('Arcane Shot: 1 use regained (Ever-Ready Shot)');
    expect(screen.getByTestId('regained-11')).toHaveTextContent('Nothing regained on initiative');
  });

  it('surfaces a failure instead of claiming combat started', async () => {
    characterService.applyRest.mockResolvedValue({ success: false, error: 'Only the GM can apply rests' });
    renderPage();
    await openEncounter();

    fireEvent.click(screen.getByTestId('start-combat-btn'));
    expect(await screen.findByTestId('encounters-error')).toHaveTextContent('Only the GM can apply rests');
    expect(screen.queryByTestId('start-summary')).not.toBeInTheDocument();
  });
});

// A Monk 2024's Uncanny Metabolism is the only shape the GM must actively choose: it spends a
// once-per-long-rest charge, so it must never fire on its own.
describe('EncountersPage — opt-in features', () => {
  const OPTION = {
    feature: 'Uncanny Metabolism',
    label: 'Focus Points',
    description: 'Regain Focus Points equal to your proficiency bonus. Once per long rest.',
    available: true,
  };

  const withOption = (available = true) => {
    characterService.getInitiativeOptions.mockResolvedValue({
      success: true,
      data: [{ character_id: 10, name: 'Yaara', options: [{ ...OPTION, available }] }],
    });
  };

  it('asks the backend which combatants have a choice to make', async () => {
    renderPage();
    await openEncounter();
    await waitFor(() => expect(characterService.getInitiativeOptions).toHaveBeenCalledWith('1', [10, 11]));
  });

  it('shows no opt-in section when nobody has one', async () => {
    renderPage();
    await openEncounter();
    await waitFor(() => expect(characterService.getInitiativeOptions).toHaveBeenCalled());
    expect(screen.queryByTestId('opt-in-section')).not.toBeInTheDocument();
  });

  it('offers the choice with its description', async () => {
    withOption();
    renderPage();
    await openEncounter();

    const row = await screen.findByTestId('opt-ins-10');
    expect(row).toHaveTextContent('Uncanny Metabolism');
    expect(row).toHaveTextContent('Regain Focus Points equal to your proficiency bonus');
  });

  it('sends nothing when the choice is left unchecked', async () => {
    withOption();
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'initiative', applied_to: [] } });
    renderPage();
    await openEncounter();
    await screen.findByTestId('opt-ins-10');

    fireEvent.click(screen.getByTestId('start-combat-btn'));
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith('1', 'initiative', [10, 11], null));
  });

  it('sends the opt-in for the character who chose it', async () => {
    withOption();
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'initiative', applied_to: [] } });
    renderPage();
    await openEncounter();

    fireEvent.click(await screen.findByTestId('opt-in-10-Uncanny Metabolism'));
    fireEvent.click(screen.getByTestId('start-combat-btn'));
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith(
      '1', 'initiative', [10, 11], { 10: ['Uncanny Metabolism'] },
    ));
  });

  it('unchecking removes it again', async () => {
    withOption();
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'initiative', applied_to: [] } });
    renderPage();
    await openEncounter();

    const box = await screen.findByTestId('opt-in-10-Uncanny Metabolism');
    fireEvent.click(box);
    fireEvent.click(box);
    fireEvent.click(screen.getByTestId('start-combat-btn'));
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith('1', 'initiative', [10, 11], null));
  });

  it('disables a choice whose charge is already spent, and says why', async () => {
    withOption(false);
    renderPage();
    await openEncounter();

    expect(await screen.findByTestId('opt-in-10-Uncanny Metabolism')).toBeDisabled();
    expect(screen.getByTestId('opt-in-spent-10')).toHaveTextContent('returns on a long rest');
  });

  it('re-reads the options after starting combat, since a charge may have been spent', async () => {
    withOption();
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'initiative', applied_to: [] } });
    renderPage();
    await openEncounter();
    await screen.findByTestId('opt-ins-10');
    characterService.getInitiativeOptions.mockClear();

    fireEvent.click(screen.getByTestId('start-combat-btn'));
    await waitFor(() => expect(characterService.getInitiativeOptions).toHaveBeenCalled());
  });

  it('still shows the initiative order when the options call fails', async () => {
    characterService.getInitiativeOptions.mockResolvedValue({ success: false, error: 'boom' });
    renderPage();
    await openEncounter();

    expect(screen.getByTestId('combatant-row-10')).toBeInTheDocument();
    expect(screen.queryByTestId('opt-in-section')).not.toBeInTheDocument();
  });
});
