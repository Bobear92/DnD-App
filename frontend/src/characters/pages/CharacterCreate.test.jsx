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

const mockCampaign = { id: 1, name: 'Test Campaign', userRole: 'player', edition: '5e', use_alignment: true, ability_score_method: 'standard_spread', allow_reroll_ones: false };

vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
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
    // Reset to default campaign settings
    Object.assign(mockCampaign, {
      use_alignment: true,
      ability_score_method: 'standard_spread',
      allow_reroll_ones: false,
    });
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
    // Spellbook input is hidden during creation; static slot info and features shown instead
    expect(screen.getByText('Spell Slots at Level 1')).toBeInTheDocument();
    expect(screen.queryByText('Spellbook (all known spells)')).not.toBeInTheDocument();
  });

  it('shows Fighter class-specific fields after selecting Fighter', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    // Resource trackers (Second Wind etc.) are hidden during creation; Fighting Style appears as both
    // a level-1 feature card title and a select field label
    expect(screen.getAllByText('Fighting Style').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Barbarian class-specific fields after selecting Barbarian', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(screen.getByText('Barbarian Features')).toBeInTheDocument());
    // Rage tracker hidden during creation; Unarmored Defense info is still shown
    expect(screen.getByText('Unarmored Defense')).toBeInTheDocument();
  });

  it('shows Cleric class-specific fields after selecting Cleric', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Cleric'));
    await waitFor(() => expect(screen.getByText('Cleric Features')).toBeInTheDocument());
    // Channel Divinity tracker hidden during creation; subclass selector is shown
    expect(screen.getByText('Divine Domain (Subclass)')).toBeInTheDocument();
  });

  it('shows Warlock class-specific fields after selecting Warlock', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Warlock'));
    await waitFor(() => expect(screen.getByText('Warlock Features')).toBeInTheDocument());
    // Pact Magic tracker hidden during creation; patron subclass selector is shown
    expect(screen.getByText('Otherworldly Patron (Subclass)')).toBeInTheDocument();
  });

  it('does not show a Level input field on the details form', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByText('Create Fighter')).toBeInTheDocument());
    expect(screen.queryByLabelText(/level/i)).not.toBeInTheDocument();
  });

  it('always submits level 1 regardless of any other input', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lex' } });
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({ level: 1 })
      );
    });
  });

  it('injects calculated hp_max into character_data on submit', async () => {
    // Fighter has d10; default CON 10 = modifier 0 → hp_max = 10
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lex' } });
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({ hp_max: 10 }),
        })
      );
    });
  });

  it('hides HP, AC, and Temp HP fields during character creation', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(screen.getByText('Barbarian Features')).toBeInTheDocument());
    expect(screen.queryByLabelText(/current hp/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/max hp/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/temp hp/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/armor class/i)).not.toBeInTheDocument();
  });

  it('hides alignment field when campaign use_alignment is false', async () => {
    mockCampaign.use_alignment = false;
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByText('Create Fighter')).toBeInTheDocument());
    expect(screen.queryByText('Alignment')).not.toBeInTheDocument();
  });

  it('shows alignment field when campaign use_alignment is true', async () => {
    mockCampaign.use_alignment = true;
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByText('Create Fighter')).toBeInTheDocument());
    expect(screen.getByText('Alignment')).toBeInTheDocument();
  });

  it('initializes ability scores to 8 when campaign uses point buy', async () => {
    mockCampaign.ability_score_method = 'point_buy';
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByText('Create Fighter')).toBeInTheDocument());
    // PointBuyAssignment shows scores as <span> text; all 8s means 0 points spent → "27 pts left"
    await waitFor(() => {
      expect(screen.getByText('27 pts left')).toBeInTheDocument();
    });
  });

  it('shows background skill legend when background overlaps class allowed skills', async () => {
    // Cleric allowed: History, Insight, Medicine, Persuasion, Religion
    // Acolyte grants: Insight, Religion → overlap exists → legend must appear
    renderCreate();
    fireEvent.click(screen.getByText('Cleric'));
    await waitFor(() => expect(screen.getByText('Cleric Features')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('background-select'), { target: { value: 'Acolyte' } });
    await waitFor(() => {
      expect(screen.getByText('Amber = already granted by your background')).toBeInTheDocument();
    });
  });

  it('shows extra amber skill buttons for background skills outside class allowed list', async () => {
    // Cleric allowed: History, Insight, Medicine, Persuasion, Religion
    // Outlander grants: Athletics, Survival → no overlap, but both appear as extra amber buttons
    renderCreate();
    fireEvent.click(screen.getByText('Cleric'));
    await waitFor(() => expect(screen.getByText('Cleric Features')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('background-select'), { target: { value: 'Outlander' } });
    await waitFor(() => {
      // Extra bg skills appear as amber disabled buttons even though not in class list
      expect(screen.getByRole('button', { name: 'Athletics' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Survival' })).toBeInTheDocument();
      // Legend still appears because backgroundSkills.length > 0
      expect(screen.getByText('Amber = already granted by your background')).toBeInTheDocument();
    });
  });

  it('shows custom instrument as a selected button after adding via Enter key', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Bard'));
    await waitFor(() => expect(screen.getByText('Bard Features')).toBeInTheDocument());
    const customInput = screen.getByPlaceholderText('Other instrument…');
    fireEvent.change(customInput, { target: { value: 'Hurdy-Gurdy' } });
    fireEvent.keyDown(customInput, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hurdy-Gurdy' })).toBeInTheDocument();
    });
  });
});
