import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterCreate from './CharacterCreate';
import characterService from '../characterService';

vi.mock('../characterService', () => ({
  default: { createCharacter: vi.fn() },
}));

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockNavigate = vi.fn();

vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 1, name: 'Test Campaign', userRole: 'player', edition: '5e' } }),
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 2, username: 'player' } }),
}));

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/campaigns/1/characters/create']}>
      <Routes>
        <Route path="/campaigns/:campaignId/characters/create" element={<CharacterCreate />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CharacterCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders class picker on first step', () => {
    renderCreate();
    expect(screen.getByText('Choose Your Class')).toBeInTheDocument();
    // All 12 classes shown
    ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
     'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'].forEach(cls => {
      expect(screen.getByText(cls)).toBeInTheDocument();
    });
  });

  it('advances to details step when a class is selected', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => {
      expect(screen.getByText('Create Fighter')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument();
  });

  it('back button on class step navigates to character list', () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: '' })); // ChevronLeft button
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/characters');
  });

  it('back button on details step returns to class picker', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Rogue'));
    await waitFor(() => expect(screen.getByText('Create Rogue')).toBeInTheDocument());
    // Click the back chevron
    fireEvent.click(screen.getAllByRole('button')[0]);
    await waitFor(() => expect(screen.getByText('Choose Your Class')).toBeInTheDocument());
  });

  it('shows error if name is empty on submit', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Wizard'));
    await waitFor(() => expect(screen.getByText('Create Wizard')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
    });
    expect(characterService.createCharacter).not.toHaveBeenCalled();
  });

  it('calls createCharacter with correct payload and navigates on success', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 99 } });
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Thorin' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Human, Elf…'), { target: { value: 'Dwarf' } });

    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Thorin',
          race: 'Dwarf',
          char_class: 'Fighter',
          campaign_id: 1,
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/characters/99');
    });
  });

  it('shows error message on create failure', async () => {
    characterService.createCharacter.mockResolvedValue({ success: false, error: 'Server error' });
    renderCreate();
    fireEvent.click(screen.getByText('Wizard'));
    await waitFor(() => expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Gandalf' } });
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows Wizard class-specific fields after selecting Wizard', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Wizard'));
    await waitFor(() => expect(screen.getByText('Wizard Features')).toBeInTheDocument());
    expect(screen.getByText('Spellbook (all known spells)')).toBeInTheDocument();
  });

  it('shows Fighter class-specific fields after selecting Fighter', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    expect(screen.getByText('Second Wind (Short Rest)')).toBeInTheDocument();
  });

  it('shows Barbarian class-specific fields after selecting Barbarian', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(screen.getByText('Barbarian Features')).toBeInTheDocument());
    expect(screen.getByText('Rage (Long Rest)')).toBeInTheDocument();
  });

  it('shows Cleric class-specific fields after selecting Cleric', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Cleric'));
    await waitFor(() => expect(screen.getByText('Cleric Features')).toBeInTheDocument());
    expect(screen.getByText('Channel Divinity (Short Rest)')).toBeInTheDocument();
  });

  it('shows Warlock class-specific fields after selecting Warlock', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Warlock'));
    await waitFor(() => expect(screen.getByText('Warlock Features')).toBeInTheDocument());
    expect(screen.getByText('Pact Magic Slots (Short Rest)')).toBeInTheDocument();
  });
});
