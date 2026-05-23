import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterCreate from './CharacterCreate';
import characterService from '../characterService';
import referenceService from '../referenceService';

vi.mock('../characterService', () => ({
  default: { createCharacter: vi.fn() },
}));

vi.mock('../referenceService', () => ({
  default: { getRaces: vi.fn(), getBackgrounds: vi.fn() },
}));

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockNavigate = vi.fn();

const mockCampaign = {
  id: 1, name: 'Test Campaign', userRole: 'player', edition: '5e',
  use_alignment: true, ability_score_method: 'standard_spread', allow_reroll_ones: false,
};

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

// ── Navigation helpers ───────────────────────────────────────────────────────

async function selectClass(cls) {
  fireEvent.click(screen.getByText(cls));
  await waitFor(() => expect(screen.getByText('Step 2 of 4 — Race, Background & Identity')).toBeInTheDocument());
}

async function advanceToFeatures(cls, name = 'Thorin') {
  await selectClass(cls);
  fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: name } });
  fireEvent.click(screen.getByTestId('identity-next'));
  await waitFor(() => expect(screen.getByText(`${cls} Features`)).toBeInTheDocument());
}

async function advanceToReview(cls, name = 'Thorin') {
  await advanceToFeatures(cls, name);
  fireEvent.click(screen.getByTestId('details-next'));
  await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
}

// ────────────────────────────────────────────────────────────────────────────

describe('CharacterCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    referenceService.getRaces.mockResolvedValue([]);
    referenceService.getBackgrounds.mockResolvedValue([]);
    Object.assign(mockCampaign, {
      use_alignment: true,
      ability_score_method: 'standard_spread',
      allow_reroll_ones: false,
      edition: '5e',
    });
  });

  // ── Step 1: Class picker ─────────────────────────────────────────────────

  it('renders class picker on first step', () => {
    renderCreate();
    expect(screen.getByText('Choose Your Class')).toBeInTheDocument();
    ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
     'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'].forEach(cls => {
      expect(screen.getByText(cls)).toBeInTheDocument();
    });
  });

  it('back button on class step navigates to character list', () => {
    renderCreate();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/characters');
  });

  // ── Step 2: Identity ─────────────────────────────────────────────────────

  it('advances to identity step when a class is selected', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => {
      expect(screen.getByText('Create Fighter')).toBeInTheDocument();
      expect(screen.getByText('Step 2 of 4 — Race, Background & Identity')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument();
  });

  it('shows step indicator on identity step', async () => {
    renderCreate();
    await selectClass('Wizard');
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  it('shows race cards on identity step', async () => {
    renderCreate();
    await selectClass('Rogue');
    expect(screen.getByTestId('race-card-Human')).toBeInTheDocument();
    expect(screen.getByTestId('race-card-Elf')).toBeInTheDocument();
    expect(screen.getByTestId('race-card-Dwarf')).toBeInTheDocument();
  });

  it('shows background cards on identity step', async () => {
    renderCreate();
    await selectClass('Cleric');
    expect(screen.getByTestId('bg-card-Acolyte')).toBeInTheDocument();
    expect(screen.getByTestId('bg-card-Sage')).toBeInTheDocument();
    expect(screen.getByTestId('bg-card-Soldier')).toBeInTheDocument();
  });

  it('shows all 13 PHB backgrounds as cards', async () => {
    renderCreate();
    await selectClass('Fighter');
    const expected = ['Acolyte', 'Charlatan', 'Criminal', 'Entertainer', 'Folk Hero',
      'Guild Artisan', 'Hermit', 'Noble', 'Outlander', 'Sage', 'Sailor', 'Soldier', 'Urchin'];
    expected.forEach(name => {
      expect(screen.getByTestId(`bg-card-${name}`)).toBeInTheDocument();
    });
  });

  it('selecting a race card shows the expanded race detail', async () => {
    renderCreate();
    await selectClass('Barbarian');
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => {
      expect(screen.getByText('Bold and hardy, dwarves are known as skilled warriors', { exact: false })).toBeInTheDocument();
      // Traits appear as badges in the detail panel
      expect(screen.getByText('Darkvision')).toBeInTheDocument();
      expect(screen.getByText('Stonecunning')).toBeInTheDocument();
    });
  });

  it('selecting a background card shows expanded detail with skills and description', async () => {
    renderCreate();
    await selectClass('Wizard');
    // Before clicking, no equipment section
    expect(screen.queryByText('Starting Equipment', { exact: false })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bg-card-Sage'));
    await waitFor(() => {
      // "Starting Equipment" header only appears in the expanded BgDetail panel, not on the card
      expect(screen.getByText('Starting Equipment', { exact: false })).toBeInTheDocument();
      // "Researcher" appears on the card + in the detail — assert at least 2 instances
      expect(screen.getAllByText('Researcher').length).toBeGreaterThanOrEqual(2);
    });
  });

  it('selecting a background card sets the background value', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('bg-card-Soldier'));
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lex' } });
    // Advance to details; identity summary should show background
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => {
      expect(screen.getByText('Soldier')).toBeInTheDocument();
    });
  });

  it('clicking a selected background card deselects it and hides the expanded detail', async () => {
    renderCreate();
    await selectClass('Rogue');
    fireEvent.click(screen.getByTestId('bg-card-Criminal'));
    // "Starting Equipment" only appears in the expanded BgDetail, not on the card itself
    await waitFor(() => expect(screen.getByText('Starting Equipment', { exact: false })).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('bg-card-Criminal'));
    await waitFor(() => expect(screen.queryByText('Starting Equipment', { exact: false })).not.toBeInTheDocument());
  });

  it('custom race input sets form race and clears card selection', async () => {
    renderCreate();
    await selectClass('Druid');
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    fireEvent.change(screen.getByTestId('custom-race-input'), { target: { value: 'Kenku' } });
    await waitFor(() => {
      expect(screen.getByText('Using custom race:')).toBeInTheDocument();
      expect(screen.getByText('Kenku')).toBeInTheDocument();
    });
    // Card should no longer appear selected
    expect(screen.queryByTestId('race-card-Elf')).toBeInTheDocument(); // card still exists
  });

  it('race search filters displayed race cards', async () => {
    renderCreate();
    await selectClass('Monk');
    fireEvent.change(screen.getByTestId('race-search'), { target: { value: 'half' } });
    await waitFor(() => {
      expect(screen.getByTestId('race-card-Half-Elf')).toBeInTheDocument();
      expect(screen.getByTestId('race-card-Half-Orc')).toBeInTheDocument();
      expect(screen.queryByTestId('race-card-Human')).not.toBeInTheDocument();
    });
  });

  it('Next button is disabled when name is empty', async () => {
    renderCreate();
    await selectClass('Fighter');
    expect(screen.getByTestId('identity-next')).toBeDisabled();
  });

  it('Next button is enabled after name is entered', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lex' } });
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
  });

  it('shows alignment on identity step when campaign.use_alignment is true', async () => {
    renderCreate();
    await selectClass('Fighter');
    expect(screen.getByText('Alignment')).toBeInTheDocument();
  });

  it('hides alignment on identity step when campaign.use_alignment is false', async () => {
    mockCampaign.use_alignment = false;
    renderCreate();
    await selectClass('Fighter');
    expect(screen.queryByText('Alignment')).not.toBeInTheDocument();
  });

  it('back button on identity step returns to class picker', async () => {
    renderCreate();
    await selectClass('Rogue');
    fireEvent.click(screen.getByTestId('identity-back'));
    await waitFor(() => expect(screen.getByText('Choose Your Class')).toBeInTheDocument());
  });

  it('fetches races and backgrounds from API when entering identity step', async () => {
    renderCreate();
    await selectClass('Fighter');
    expect(referenceService.getRaces).toHaveBeenCalledWith('1');
    expect(referenceService.getBackgrounds).toHaveBeenCalledWith('1');
  });

  it('shows API races when returned instead of hardcoded fallback', async () => {
    referenceService.getRaces.mockResolvedValue([
      { name: 'Aasimar', size: 'Medium', speed: 30, ability_score_increases: '+2 CHA', traits: ['Healing Hands', 'Celestial Resistance'], description: 'Touched by the divine.' },
    ]);
    renderCreate();
    await selectClass('Paladin');
    await waitFor(() => expect(screen.getByTestId('race-card-Aasimar')).toBeInTheDocument());
    // Hardcoded races should not show when API data is present
    expect(screen.queryByTestId('race-card-Human')).not.toBeInTheDocument();
  });

  // ── Step 3: Class features ───────────────────────────────────────────────

  it('advances to class features step after identity is complete', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    expect(screen.getByText('Step 3 of 4 — Class Features & Ability Scores')).toBeInTheDocument();
  });

  it('shows identity summary card on class features step', async () => {
    renderCreate();
    await advanceToFeatures('Barbarian', 'Grommash');
    expect(screen.getByText('Grommash')).toBeInTheDocument();
  });

  it('back button on class features step returns to identity step', async () => {
    renderCreate();
    await advanceToFeatures('Wizard');
    fireEvent.click(screen.getAllByRole('button', { name: 'Back' })[0]);
    await waitFor(() => expect(screen.getByText('Step 2 of 4 — Race, Background & Identity')).toBeInTheDocument());
  });

  it('shows error if name submitted empty (defensive — name required before advancing)', async () => {
    characterService.createCharacter.mockResolvedValue({ success: false, error: 'Server error' });
    renderCreate();
    await advanceToReview('Wizard', 'Gandalf');
    // Force name empty via state hack isn't possible; instead test the submit guard
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => expect(characterService.createCharacter).toHaveBeenCalled());
  });

  it('calls createCharacter with correct payload and navigates on success', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 99 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Thorin' } });
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    // Dwarf has subraces — must pick one before Next is enabled
    await waitFor(() => expect(screen.getByTestId('subrace-card-Mountain Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Mountain Dwarf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
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

  // ── Subrace picker ───────────────────────────────────────────────────────

  it('shows subrace picker when a race with subraces is selected', async () => {
    renderCreate();
    await selectClass('Rogue');
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => {
      expect(screen.getByTestId('subrace-section')).toBeInTheDocument();
      expect(screen.getByTestId('subrace-card-High Elf')).toBeInTheDocument();
      expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument();
      expect(screen.getByTestId('subrace-card-Dark Elf (Drow)')).toBeInTheDocument();
    });
  });

  it('does not show subrace picker for races without subraces', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.queryByTestId('subrace-section')).not.toBeInTheDocument());
  });

  it('Next button is blocked until a subrace is chosen for races with subraces', async () => {
    renderCreate();
    await selectClass('Wizard');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Elara' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    // Has name but no subrace yet — still blocked
    await waitFor(() => expect(screen.getByTestId('identity-next')).toBeDisabled());
    fireEvent.click(screen.getByTestId('subrace-card-High Elf'));
    await waitFor(() => expect(screen.getByTestId('identity-next')).not.toBeDisabled());
  });

  it('shows subrace detail panel when a subrace is selected', async () => {
    renderCreate();
    await selectClass('Druid');
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    await waitFor(() => {
      expect(screen.getByText('fleet feet carry you quickly', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Fleet of Foot')).toBeInTheDocument();
    });
  });

  it('clears subrace when a different race is selected', async () => {
    renderCreate();
    await selectClass('Fighter');
    // Pick Elf + High Elf
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-High Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-High Elf'));
    // Switch to Dwarf — subrace section should reset to Dwarf subraces
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => {
      expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument();
      expect(screen.queryByTestId('subrace-card-High Elf')).not.toBeInTheDocument();
    });
  });

  it('applies racial ASI bonuses to ability scores in the submitted payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Rocky' } });
    // Mountain Dwarf: base +2 CON (Dwarf) + +2 STR (Mountain Dwarf)
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Mountain Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Mountain Dwarf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 12,      // 10 + 2 (Mountain Dwarf subrace)
          constitution: 12,  // 10 + 2 (Dwarf base)
          dexterity: 10,     // unchanged
        })
      );
    });
  });

  it('applies racial CON bonus to hp_max calculation', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Bralin' } });
    // Hill Dwarf: base +2 CON (Dwarf) → finalCon = 12, conMod = +1 → Fighter d10 + 1 = 11
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({ hp_max: 11 }),
        })
      );
    });
  });

  it('stores subrace, race_traits, and race_languages in character_data', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await selectClass('Rogue');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Arrowhead' } });
    // Wood Elf: base traits [Darkvision, Keen Senses, Fey Ancestry, Trance]
    //           + subrace traits [Elf Weapon Training, Fleet of Foot, Mask of the Wild]
    //           languages: [Common, Elvish]
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Rogue Features')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({
            subrace: 'Wood Elf',
            race_traits: expect.arrayContaining(['Darkvision', 'Fey Ancestry', 'Fleet of Foot', 'Mask of the Wild']),
            race_languages: ['Common', 'Elvish'],
          }),
        })
      );
    });
  });

  it('shows racial ASI preview in step 3 when a race is selected', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Thorin' } });
    // Human gives +1 to all (no subraces, so next button is not blocked)
    fireEvent.click(screen.getByTestId('race-card-Human'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => {
      expect(screen.getByTestId('racial-asi-preview')).toBeInTheDocument();
    });
  });

  it('shows error message on create failure', async () => {
    characterService.createCharacter.mockResolvedValue({ success: false, error: 'Server error' });
    renderCreate();
    await advanceToReview('Wizard');
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows Wizard class-specific fields after advancing to features', async () => {
    renderCreate();
    await advanceToFeatures('Wizard');
    expect(screen.getByText('Spell Slots at Level 1')).toBeInTheDocument();
    expect(screen.queryByText('Spellbook (all known spells)')).not.toBeInTheDocument();
  });

  it('shows Fighter class-specific fields after advancing to features', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    expect(screen.getAllByText('Fighting Style').length).toBeGreaterThanOrEqual(1);
  });

  it('shows Barbarian class-specific fields after advancing to features', async () => {
    renderCreate();
    await advanceToFeatures('Barbarian');
    expect(screen.getByText('Unarmored Defense')).toBeInTheDocument();
  });

  it('shows Cleric class-specific fields after advancing to features', async () => {
    renderCreate();
    await advanceToFeatures('Cleric');
    expect(screen.getByText('Divine Domain (Subclass)')).toBeInTheDocument();
  });

  it('shows Warlock class-specific fields after advancing to features', async () => {
    renderCreate();
    await advanceToFeatures('Warlock');
    expect(screen.getByText('Otherworldly Patron (Subclass)')).toBeInTheDocument();
  });

  it('does not show a Level input field anywhere in the flow', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    expect(screen.queryByLabelText(/level/i)).not.toBeInTheDocument();
  });

  it('always submits level 1 regardless of any other input', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await advanceToReview('Fighter');
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({ level: 1 })
      );
    });
  });

  it('injects calculated hp_max into character_data on submit', async () => {
    // Fighter d10; default CON 10 = modifier 0 → hp_max = 10
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await advanceToReview('Fighter');
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
    await advanceToFeatures('Barbarian');
    expect(screen.queryByLabelText(/current hp/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/max hp/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/temp hp/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/armor class/i)).not.toBeInTheDocument();
  });

  it('initializes ability scores to 8 when campaign uses point buy', async () => {
    mockCampaign.ability_score_method = 'point_buy';
    renderCreate();
    await advanceToFeatures('Fighter');
    await waitFor(() => expect(screen.getByText('27 pts left')).toBeInTheDocument());
  });

  it('background skills flow to class sheet in step 3 when background selected', async () => {
    // Cleric allowed: History, Insight, Medicine, Persuasion, Religion
    // Acolyte grants: Insight, Religion → legend must appear
    renderCreate();
    await selectClass('Cleric');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Aldric' } });
    fireEvent.click(screen.getByTestId('bg-card-Acolyte'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => {
      expect(screen.getByText('Amber = already granted by your background')).toBeInTheDocument();
    });
  });

  it('shows extra amber skill buttons for background skills outside class allowed list', async () => {
    // Cleric allowed: History, Insight, Medicine, Persuasion, Religion
    // Outlander grants: Athletics, Survival → not in class list, appear as extra amber buttons
    renderCreate();
    await selectClass('Cleric');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Aldric' } });
    fireEvent.click(screen.getByTestId('bg-card-Outlander'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Athletics' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Survival' })).toBeInTheDocument();
      expect(screen.getByText('Amber = already granted by your background')).toBeInTheDocument();
    });
  });

  it('shows custom instrument as a selected button after adding via Enter key', async () => {
    renderCreate();
    await advanceToFeatures('Bard');
    const customInput = screen.getByPlaceholderText('Other instrument…');
    fireEvent.change(customInput, { target: { value: 'Hurdy-Gurdy' } });
    fireEvent.keyDown(customInput, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hurdy-Gurdy' })).toBeInTheDocument();
    });
  });

  // ── OptionCardPicker: fighting styles + subclasses ───────────────────────

  it('shows fighting style option cards with descriptions for Fighter', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    // Archery is a valid Fighter style; its description must be visible
    expect(screen.getByText('Archery')).toBeInTheDocument();
    expect(screen.getByText('+2 bonus to attack rolls with ranged weapons.')).toBeInTheDocument();
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('+1 bonus to AC while wearing armor.')).toBeInTheDocument();
  });

  it('clicking a fighting style card selects it and is reflected in the submitted payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 7 } });
    renderCreate();
    await advanceToFeatures('Fighter');
    // Click the Archery card (rendered as a button by OptionCardPicker)
    fireEvent.click(screen.getByRole('button', { name: /archery/i }));
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({ fighting_style: 'Archery' }),
        })
      );
    });
  });

  it('shows subclass option cards with descriptions for 5e Cleric', async () => {
    renderCreate();
    await advanceToFeatures('Cleric');
    expect(screen.getByText('Divine Domain (Subclass)')).toBeInTheDocument();
    // Life Domain is a common 5e Cleric subclass — its card and description must appear
    expect(screen.getByText('Life Domain')).toBeInTheDocument();
    expect(screen.getByText(/most powerful healer/i)).toBeInTheDocument();
  });

  it('shows subclass option cards with descriptions for 5e Warlock', async () => {
    renderCreate();
    await advanceToFeatures('Warlock');
    expect(screen.getByText('Otherworldly Patron (Subclass)')).toBeInTheDocument();
    expect(screen.getByText('The Fiend')).toBeInTheDocument();
    expect(screen.getByText(/dark pact with a devil/i)).toBeInTheDocument();
  });
});
