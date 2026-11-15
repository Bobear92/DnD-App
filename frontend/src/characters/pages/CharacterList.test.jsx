import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '5' }),
  useNavigate: () => mockNavigate,
}));
vi.mock('../characterService', () => ({
  default: {
    getCharactersByCampaign: vi.fn(),
    toggleVisibility: vi.fn(),
    deleteCharacter: vi.fn(),
    applyRest: vi.fn(),
    previewRest: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';
import characterService from '../characterService';
import CharacterList from './CharacterList';

const GM_CAMPAIGN = { id: 5, name: 'Test Campaign', userRole: 'gm', edition: '5e' };
const PLAYER_CAMPAIGN = { id: 5, name: 'Test Campaign', userRole: 'player', edition: '5e' };

const CHARACTERS = [
  {
    id: 1, name: 'Arathorn', race: 'Human', char_class: 'Fighter', level: 5,
    strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 10, charisma: 8,
    is_visible_to_players: true, user_id: 2,
  },
  {
    id: 2, name: 'Mia Silverleaf', race: 'Elf', char_class: 'Wizard', level: 3,
    strength: 8, dexterity: 16, constitution: 12, intelligence: 18, wisdom: 12, charisma: 14,
    is_visible_to_players: false, user_id: 3,
  },
];

function renderList() {
  return render(<MemoryRouter><CharacterList /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  useAuth.mockReturnValue({ user: { id: 99 } });
});

describe('CharacterList — loading', () => {
  it('shows loading text while fetch is in progress', () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockReturnValue(new Promise(() => {}));
    renderList();
    expect(screen.getByText(/Loading characters/i)).toBeTruthy();
  });
});

describe('CharacterList — data fetching', () => {
  it('calls getCharactersByCampaign with the campaignId from params', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [] });
    renderList();
    await waitFor(() => expect(characterService.getCharactersByCampaign).toHaveBeenCalledWith('5'));
  });

  it('shows error message when fetch fails', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({
      success: false, error: 'Something went wrong',
    });
    renderList();
    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeTruthy());
  });
});

describe('CharacterList — empty state', () => {
  it('shows empty state when GM has no characters', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [] });
    renderList();
    await waitFor(() => expect(screen.getByText('No players have created characters yet.')).toBeTruthy());
  });

  it('player sees "Create Your First Character" button in empty state', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [] });
    renderList();
    await waitFor(() => expect(screen.getByText('Create Your First Character')).toBeTruthy());
  });
});

describe('CharacterList — character cards', () => {
  beforeEach(() => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
  });

  it('renders each character name, race, class, and level', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.getByText('Arathorn')).toBeTruthy());
    expect(screen.getByText('Mia Silverleaf')).toBeTruthy();
    expect(screen.getByText('Human')).toBeTruthy();
    expect(screen.getByText('Fighter')).toBeTruthy();
  });

  it('clicking a character card navigates to the character detail page', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByText('Arathorn'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/5/characters/1');
  });
});

describe('CharacterList — GM view', () => {
  it('shows "All Characters" title for GM', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => expect(screen.getByText('All Characters')).toBeTruthy());
  });

  it('renders visibility toggle buttons for each character (GM only)', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    // One toggle per character
    const toggles = screen.getAllByTitle(/Visible to players|Hidden from players/);
    expect(toggles).toHaveLength(2);
  });

  it('toggling visibility calls toggleVisibility then reloads the list', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    characterService.toggleVisibility.mockResolvedValue({ success: true });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getAllByTitle(/Visible to players|Hidden from players/)[0]);
    await waitFor(() => expect(characterService.toggleVisibility).toHaveBeenCalledWith(1, false));
    // reload: getCharactersByCampaign called a second time
    await waitFor(() =>
      expect(characterService.getCharactersByCampaign).toHaveBeenCalledTimes(2)
    );
  });
});

describe('CharacterList — player view', () => {
  it('shows "My Characters" title for player', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => expect(screen.getByText('My Characters')).toBeTruthy());
  });

  it('player sees no visibility toggle buttons', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    expect(screen.queryByTitle(/Visible to players|Hidden from players/)).toBeNull();
  });
});

// ── Rest feature ──────────────────────────────────────────────────────────────

describe('CharacterList — rest buttons (GM view)', () => {
  beforeEach(() => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    characterService.previewRest.mockResolvedValue({ success: true, data: { rest_type: 'long', applied_to: [
      { character_id: 1, name: 'Arathorn', changes: ['Second Wind recovered'] },
      { character_id: 2, name: 'Mia Silverleaf', changes: ['Spell slots recovered'] },
    ] } });
  });

  it('shows Short Rest and Long Rest buttons for GM', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    expect(screen.getByTestId('short-rest-btn')).toBeTruthy();
    expect(screen.getByTestId('long-rest-btn')).toBeTruthy();
  });

  it('rest buttons are disabled when no characters are selected', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    expect(screen.getByTestId('short-rest-btn')).toBeDisabled();
    expect(screen.getByTestId('long-rest-btn')).toBeDisabled();
  });

  it('rest buttons are enabled after selecting a character', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    expect(screen.getByTestId('short-rest-btn')).not.toBeDisabled();
    expect(screen.getByTestId('long-rest-btn')).not.toBeDisabled();
  });

  it('shows checkboxes on each character card in GM view', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    expect(screen.getByTestId('char-checkbox-1')).toBeTruthy();
    expect(screen.getByTestId('char-checkbox-2')).toBeTruthy();
  });

  it('Select All selects all characters', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('select-all-btn'));
    expect(screen.getByTestId('char-checkbox-1')).toBeChecked();
    expect(screen.getByTestId('char-checkbox-2')).toBeChecked();
  });

  it('Select All then Deselect All clears selection', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('select-all-btn'));
    fireEvent.click(screen.getByTestId('select-all-btn'));
    expect(screen.getByTestId('char-checkbox-1')).not.toBeChecked();
  });

  it('clicking Short Rest opens the confirmation dialog', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => expect(screen.getByText(/Apply a short rest/i)).toBeTruthy());
    expect(screen.getByTestId('confirm-rest-btn')).toBeTruthy();
  });

  it('clicking Long Rest opens the confirmation dialog', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => expect(screen.getByText(/Apply a long rest/i)).toBeTruthy());
    expect(screen.getByTestId('confirm-rest-btn')).toBeTruthy();
  });

  // ── Rest preview ──────────────────────────────────────────────────────────
  // The dialog shows a DRY RUN from the backend (characterService.previewRest) rather than
  // predicting the rest from a frontend copy of the rules. WHICH pools come back for which
  // class/subclass/level is therefore the backend's to test (test_characters.py::TestApplyRest,
  // test_rest_resources.py); these cover that the dialog asks, shows the answer, and copes.

  it('opening the short rest dialog asks the backend for a dry run of the selected characters', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => expect(characterService.previewRest).toHaveBeenCalledWith('5', 'short', [1]));
    expect(characterService.applyRest).not.toHaveBeenCalled();
  });

  it('opening the long rest dialog previews a long rest for every selected character', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('select-all-btn'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => expect(characterService.previewRest).toHaveBeenCalledWith('5', 'long', [1, 2]));
  });

  it('lists the changes the backend returned, under the character they belong to', async () => {
    characterService.previewRest.mockResolvedValue({ success: true, data: { rest_type: 'long', applied_to: [
      { character_id: 1, name: 'Arathorn', changes: ['HP restored to 44', 'Second Wind recovered'] },
      { character_id: 2, name: 'Mia Silverleaf', changes: ['Spell slots recovered'] },
    ] } });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('select-all-btn'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));

    const fighter = await screen.findByTestId('rest-preview-1');
    expect(within(fighter).getByText('HP restored to 44')).toBeInTheDocument();
    expect(within(fighter).getByText('Second Wind recovered')).toBeInTheDocument();
    expect(within(fighter).queryByText('Spell slots recovered')).toBeNull();

    const wizard = screen.getByTestId('rest-preview-2');
    expect(within(wizard).getByText('Spell slots recovered')).toBeInTheDocument();
    expect(within(wizard).queryByText('Second Wind recovered')).toBeNull();
  });

  it('shows nothing it was not told: the dialog invents no changes of its own', async () => {
    // The regression this guards: the old dialog computed its own list, so a Fighter saw
    // "Action Surge & Second Wind" whatever the backend actually did.
    characterService.previewRest.mockResolvedValue({ success: true, data: { rest_type: 'short', applied_to: [
      { character_id: 1, name: 'Arathorn', changes: ['No short rest resources to recover'] },
    ] } });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));

    const preview = await screen.findByTestId('rest-preview-1');
    expect(within(preview).getAllByRole('listitem')).toHaveLength(1);
    expect(within(preview).getByText('No short rest resources to recover')).toBeInTheDocument();
    expect(screen.queryByText(/Action Surge/)).toBeNull();
  });

  it('shows a working state until the preview arrives', async () => {
    let resolvePreview;
    characterService.previewRest.mockReturnValue(new Promise((resolve) => { resolvePreview = resolve; }));
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));

    expect(await screen.findByTestId('rest-preview-loading-1')).toBeInTheDocument();
    expect(screen.queryByTestId('rest-preview-1')).toBeNull();

    resolvePreview({ success: true, data: { rest_type: 'long', applied_to: [
      { character_id: 1, name: 'Arathorn', changes: ['Indomitable recovered'] },
    ] } });
    expect(await screen.findByText('Indomitable recovered')).toBeInTheDocument();
    expect(screen.queryByTestId('rest-preview-loading-1')).toBeNull();
  });

  it('a failed preview is reported but does not block applying the rest', async () => {
    characterService.previewRest.mockResolvedValue({ success: false, error: 'Server unavailable' });
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'long', applied_to: [] } });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));

    const note = await screen.findByTestId('rest-preview-error');
    expect(note).toHaveTextContent('Server unavailable');
    expect(screen.queryByTestId('rest-preview-1')).toBeNull();

    fireEvent.click(screen.getByTestId('confirm-rest-btn'));
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith('5', 'long', [1]));
  });

  it('a character the backend returned nothing for gets an empty list, not a crash', async () => {
    characterService.previewRest.mockResolvedValue({ success: true, data: { rest_type: 'long', applied_to: [] } });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));

    const preview = await screen.findByTestId('rest-preview-1');
    expect(within(preview).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('reopening the dialog for the other rest type replaces the earlier preview', async () => {
    characterService.previewRest.mockImplementation(async (_cid, restType) => ({
      success: true,
      data: { rest_type: restType, applied_to: [
        { character_id: 1, name: 'Arathorn', changes: [restType === 'short' ? 'Second Wind recovered' : 'Indomitable recovered'] },
      ] },
    }));
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));

    fireEvent.click(screen.getByTestId('short-rest-btn'));
    expect(await screen.findByText('Second Wind recovered')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));

    fireEvent.click(screen.getByTestId('long-rest-btn'));
    expect(await screen.findByText('Indomitable recovered')).toBeInTheDocument();
    expect(screen.queryByText('Second Wind recovered')).toBeNull();
  });

  it('a slow preview for a dialog that was closed and reopened never overwrites the newer one', async () => {
    let resolveShort;
    characterService.previewRest.mockImplementation((_cid, restType) => (
      restType === 'short'
        ? new Promise((resolve) => { resolveShort = resolve; })
        : Promise.resolve({ success: true, data: { rest_type: 'long', applied_to: [
          { character_id: 1, name: 'Arathorn', changes: ['Indomitable recovered'] },
        ] } })
    ));
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));

    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await screen.findByTestId('rest-preview-loading-1');
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    expect(await screen.findByText('Indomitable recovered')).toBeInTheDocument();

    // The stale short-rest answer lands late — the long-rest dialog must keep its own list.
    await act(async () => {
      resolveShort({ success: true, data: { rest_type: 'short', applied_to: [
        { character_id: 1, name: 'Arathorn', changes: ['Second Wind recovered'] },
      ] } });
    });
    expect(screen.getByText('Indomitable recovered')).toBeInTheDocument();
    expect(screen.queryByText('Second Wind recovered')).toBeNull();
  });

  it('previewing changes nothing: no reload, and the selection is kept', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await screen.findByTestId('rest-preview-1');
    fireEvent.click(screen.getByText('Cancel'));

    expect(characterService.getCharactersByCampaign).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('long-rest-btn')).not.toBeDisabled();
  });

  it('confirmation dialog shows selected character names', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a short rest/i));
    expect(screen.getAllByText('Arathorn').length).toBeGreaterThan(0);
  });

  it('confirms short rest: calls applyRest and reloads', async () => {
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'short', applied_to: [] } });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByTestId('confirm-rest-btn'));
    fireEvent.click(screen.getByTestId('confirm-rest-btn'));
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith('5', 'short', [1]));
    await waitFor(() => expect(characterService.getCharactersByCampaign).toHaveBeenCalledTimes(2));
  });

  it('confirms long rest: calls applyRest with correct rest_type', async () => {
    characterService.applyRest.mockResolvedValue({ success: true, data: { rest_type: 'long', applied_to: [] } });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('select-all-btn'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByTestId('confirm-rest-btn'));
    fireEvent.click(screen.getByTestId('confirm-rest-btn'));
    await waitFor(() => expect(characterService.applyRest).toHaveBeenCalledWith('5', 'long', [1, 2]));
  });

  it('cancelling the dialog does not call applyRest', async () => {
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(characterService.applyRest).not.toHaveBeenCalled();
  });
});

describe('CharacterList — rest buttons hidden in player/non-GM view', () => {
  it('does not show rest buttons for players', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    expect(screen.queryByTestId('short-rest-btn')).toBeNull();
    expect(screen.queryByTestId('long-rest-btn')).toBeNull();
  });

  it('does not show rest buttons when GM switches to Player View', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    // Switch to Player View
    fireEvent.click(screen.getByText('Player View'));
    expect(screen.queryByTestId('short-rest-btn')).toBeNull();
  });

  it('does not show checkboxes for players', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: CHARACTERS });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    expect(screen.queryByTestId('char-checkbox-1')).toBeNull();
  });
});
