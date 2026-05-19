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
  default: { getCharactersByCampaign: vi.fn(), toggleVisibility: vi.fn(), deleteCharacter: vi.fn() },
}));

const mockNavigate = vi.fn();

import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';
import characterService from '../characterService';
import CharacterList from './CharacterList';

const GM_CAMPAIGN = { id: 5, name: 'Test Campaign', userRole: 'gm' };
const PLAYER_CAMPAIGN = { id: 5, name: 'Test Campaign', userRole: 'player' };

const CHARACTERS = [
  {
    id: 1, name: 'Arathorn', race: 'Human', char_class: 'Fighter', level: 5,
    strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 10, charisma: 8,
    is_visible_to_players: true,
  },
  {
    id: 2, name: 'Mia Silverleaf', race: 'Elf', char_class: 'Wizard', level: 3,
    strength: 8, dexterity: 16, constitution: 12, intelligence: 18, wisdom: 12, charisma: 14,
    is_visible_to_players: false,
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
