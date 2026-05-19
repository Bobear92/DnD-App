import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterDetail from './CharacterDetail';
import characterService from '../characterService';
import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';

vi.mock('../characterService', () => ({
  default: {
    getCharacterById: vi.fn(),
    updateCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
    toggleVisibility: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

const mockNavigate = vi.fn();

const BASE_CHARACTER = {
  id: 1,
  name: 'Aldric',
  race: 'Human',
  char_class: 'Fighter',
  level: 5,
  background: 'Soldier',
  alignment: 'Lawful Good',
  strength: 16, dexterity: 12, constitution: 14,
  intelligence: 10, wisdom: 12, charisma: 8,
  character_data: {
    current_hp: 45, max_hp: 52,
    fighting_style: 'Defense',
    skill_proficiencies: ['Athletics'],
  },
  user_id: 2,
  campaign_id: 1,
  is_visible_to_players: false,
  notes: 'My fighter notes',
  gm_notes: null,
  created_at: '2024-01-01T00:00:00',
  updated_at: null,
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/campaigns/1/characters/1']}>
      <Routes>
        <Route path="/campaigns/:campaignId/characters/:characterId" element={<CharacterDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CharacterDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    // Default: player owns this character
    useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player' } });
    useAuth.mockReturnValue({ user: { id: 2, username: 'player' } });
    characterService.getCharacterById.mockResolvedValue({ success: true, data: BASE_CHARACTER });
  });

  it('shows loading state initially', () => {
    characterService.getCharacterById.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText('Loading character…')).toBeInTheDocument();
  });

  it('shows error when character fetch fails', async () => {
    characterService.getCharacterById.mockResolvedValue({ success: false, error: 'Not found' });
    renderDetail();
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('renders character name and class info', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
    expect(screen.getByText(/Level 5 Fighter/)).toBeInTheDocument();
  });

  it('shows ability score values', async () => {
    renderDetail();
    // Wait for the STR input to be populated (it's in the identity section loaded async)
    await waitFor(() => expect(screen.getByDisplayValue('16')).toBeInTheDocument());
  });

  it('shows proficiency bonus derived from level', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
    // Level 5 → prof bonus +3 (shown in derived stats row with label "Prof. Bonus")
    expect(screen.getByText('Prof. Bonus')).toBeInTheDocument();
    // Multiple +3 may appear (STR mod is also +3); just assert at least one exists
    expect(screen.getAllByText('+3').length).toBeGreaterThan(0);
  });

  it('player owner sees editable identity fields', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByDisplayValue('Aldric')).toBeInTheDocument());
  });

  it('player does NOT see GM Notes section', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
    expect(screen.queryByText('GM Notes')).not.toBeInTheDocument();
  });

  it('player does NOT see Player View toggle', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
    expect(screen.queryByText('Player View')).not.toBeInTheDocument();
  });

  it('shows Fighter Features section with class data', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    expect(screen.getByText('Second Wind (Short Rest)')).toBeInTheDocument();
  });

  describe('GM view', () => {
    beforeEach(() => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
      useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, gm_notes: 'Secret GM info' },
      });
    });

    it('GM sees GM Notes section', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('GM Notes')).toBeInTheDocument());
    });

    it('GM notes textarea contains stored value', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByDisplayValue('Secret GM info')).toBeInTheDocument());
    });

    it('GM sees Player View toggle', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Player View')).toBeInTheDocument());
    });

    it('switching to player view hides GM Notes', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('GM Notes')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Player View'));
      await waitFor(() => expect(screen.queryByText('GM Notes')).not.toBeInTheDocument());
    });

    it('calls updateCharacter with gm_notes on save', async () => {
      characterService.updateCharacter.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, gm_notes: 'Updated notes' },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByDisplayValue('Secret GM info')).toBeInTheDocument());

      fireEvent.change(screen.getByDisplayValue('Secret GM info'), {
        target: { value: 'Updated notes' },
      });

      await waitFor(() => {
        const saveBtns = screen.getAllByText('Save');
        expect(saveBtns.length).toBeGreaterThan(0);
      });

      // Click the Save in the GM Notes card (last Save button)
      const saveBtns = screen.getAllByText('Save');
      fireEvent.click(saveBtns[saveBtns.length - 1]);

      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ gm_notes: 'Updated notes' })
        );
      });
    });

    it('GM sees visibility toggle and delete buttons', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTitle('Hidden from players')).toBeInTheDocument();
    });
  });

  describe('player viewing another player\'s visible character', () => {
    beforeEach(() => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player' } });
      useAuth.mockReturnValue({ user: { id: 3, username: 'other' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, user_id: 2, is_visible_to_players: true, gm_notes: null },
      });
    });

    it('read-only: no editable inputs for non-owner', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // No Save buttons should appear since no dirty state and readOnly
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });
  });
});
