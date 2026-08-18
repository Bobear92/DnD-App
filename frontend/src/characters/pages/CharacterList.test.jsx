import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  it('long rest summary lists a feat spell free cast (Magic Initiate)', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { feats: [
        { id: 10, name: 'Magic Initiate', choices: { spell_grant: { leveled: [{ name: 'Mage Armor', level: 1 }], free_casts: ['Mage Armor'] } } },
      ] } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText(/Mage Armor \(feat free cast\)/i)).toBeInTheDocument();
  });

  it('long rest summary lists spell slots for an Eldritch Knight Fighter', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { subclass: 'Eldritch Knight' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('All spell slots')).toBeInTheDocument();
  });

  it('rest summary lists Arcane Shot for an Arcane Archer on both rest types', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { subclass: 'Arcane Archer' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a short rest/i));
    expect(screen.getByText('Arcane Shot')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Arcane Shot')).toBeInTheDocument();
  });

  // Both Cavalier pools recharge on a long rest, but Warding Maneuver isn't gained until L7 —
  // the summary must not promise back a feature the character doesn't have yet.
  it('long rest summary lists Unwavering Mark for a L5 Cavalier but not Warding Maneuver', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { subclass: 'Cavalier' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Unwavering Mark')).toBeInTheDocument();
    expect(screen.queryByText('Warding Maneuver')).not.toBeInTheDocument();
  });

  it('long rest summary adds Warding Maneuver for a L7 Cavalier', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], level: 7, character_data: { subclass: 'Cavalier' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Warding Maneuver')).toBeInTheDocument();
  });

  // The backend has reset fighting_spirit_used since the Samurai pool was created, but this
  // summary never mentioned it — so a GM saw the rest restore something it hadn't promised.
  it('long rest summary lists Fighting Spirit for a Samurai', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { subclass: 'Samurai' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Fighting Spirit')).toBeInTheDocument();
  });

  // The Echo Knight's three pools unlock at three different levels and two different rest
  // types, so the summary has to be level-aware in both directions.
  it('long rest summary lists only Unleash Incarnation for a L5 Echo Knight', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { subclass: 'Echo Knight' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Unleash Incarnation')).toBeInTheDocument();
    expect(screen.queryByText('Shadow Martyr')).not.toBeInTheDocument();
    expect(screen.queryByText('Reclaim Potential')).not.toBeInTheDocument();
  });

  it('long rest summary lists all three Echo Knight pools at L15', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], level: 15, character_data: { subclass: 'Echo Knight' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Unleash Incarnation')).toBeInTheDocument();
    expect(screen.getByText('Shadow Martyr')).toBeInTheDocument();
    expect(screen.getByText('Reclaim Potential')).toBeInTheDocument();
  });

  it('short rest summary lists Shadow Martyr alone, and only from L10', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], level: 10, character_data: { subclass: 'Echo Knight' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a short rest/i));
    expect(screen.getByText('Shadow Martyr')).toBeInTheDocument();
    // The other two are long-rest only — a short rest must not promise them back.
    expect(screen.queryByText('Unleash Incarnation')).not.toBeInTheDocument();
  });

  it('short rest summary omits Shadow Martyr below L10', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], level: 9, character_data: { subclass: 'Echo Knight' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a short rest/i));
    expect(screen.queryByText('Shadow Martyr')).not.toBeInTheDocument();
  });

  // The Psi Warrior splits across both rest types differently from every other subclass: the
  // Psionic Energy POOL is long-rest only, while two of the charges spent alongside it return on
  // a short rest. A summary that flattened the two would promise the dice back after a nap.
  it('long rest summary lists the Psionic Energy dice, gated by level', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], character_data: { subclass: 'Psi Warrior' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Psionic Energy dice')).toBeInTheDocument();
    expect(screen.queryByText('Psi-Powered Leap')).not.toBeInTheDocument();
    expect(screen.queryByText('Bulwark of Force')).not.toBeInTheDocument();
  });

  it('long rest summary adds Psi-Powered Leap and Bulwark of Force at L15', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], level: 15, character_data: { subclass: 'Psi Warrior' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('long-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a long rest/i));
    expect(screen.getByText('Psionic Energy dice')).toBeInTheDocument();
    expect(screen.getByText('Psi-Powered Leap')).toBeInTheDocument();
    expect(screen.getByText('Bulwark of Force')).toBeInTheDocument();
  });

  it('short rest summary returns the charges but never the Psionic Energy dice', async () => {
    characterService.getCharactersByCampaign.mockResolvedValue({ success: true, data: [
      { ...CHARACTERS[0], level: 15, character_data: { subclass: 'Psi Warrior' } },
    ] });
    renderList();
    await waitFor(() => screen.getByText('Arathorn'));
    fireEvent.click(screen.getByTestId('char-checkbox-1'));
    fireEvent.click(screen.getByTestId('short-rest-btn'));
    await waitFor(() => screen.getByText(/Apply a short rest/i));
    expect(screen.getByText('Psionic Energy die regain & Telekinetic Movement')).toBeInTheDocument();
    expect(screen.queryByText('Psionic Energy dice')).not.toBeInTheDocument();
    expect(screen.queryByText('Bulwark of Force')).not.toBeInTheDocument();
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
