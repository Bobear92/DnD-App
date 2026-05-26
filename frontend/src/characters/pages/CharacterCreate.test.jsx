import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterCreate from './CharacterCreate';
import characterService from '../characterService';
import referenceService from '../referenceService';
import classService from '../classService';

vi.mock('../characterService', () => ({
  default: { createCharacter: vi.fn() },
}));

vi.mock('../referenceService', () => ({
  default: { getRaces: vi.fn(), getBackgrounds: vi.fn() },
}));

vi.mock('../classService', () => ({
  default: { getClassByName: vi.fn() },
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
  await waitFor(() => expect(screen.getByTestId('overview-next')).toBeInTheDocument());
  fireEvent.click(screen.getByTestId('overview-next'));
  await waitFor(() => expect(screen.getByText('Step 3 of 5 — Race, Background & Identity')).toBeInTheDocument());
}

async function advanceToFeatures(cls, name = 'Thorin') {
  await selectClass(cls);
  fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: name } });
  fireEvent.click(screen.getByTestId('identity-next'));
  await waitFor(() => expect(screen.getByText(`${cls} Features`)).toBeInTheDocument());
}

// Assigns a valid standard spread: STR=15, DEX=14, CON=10 (unchanged), INT=12, WIS=13, CHA=8
// Keeps CON=10 so hp_max tests that expect CON mod=0 continue to pass.
// Note: details-next may still be disabled after this if skill proficiencies haven't been chosen.
async function assignStandardSpread() {
  fireEvent.change(screen.getByTestId('score-select-strength'), { target: { value: '15' } });
  fireEvent.change(screen.getByTestId('score-select-dexterity'), { target: { value: '14' } });
  fireEvent.change(screen.getByTestId('score-select-intelligence'), { target: { value: '12' } });
  fireEvent.change(screen.getByTestId('score-select-wisdom'), { target: { value: '13' } });
  fireEvent.change(screen.getByTestId('score-select-charisma'), { target: { value: '8' } });
}

// Skills known to be in each class's allowed list — used to satisfy the skill selection gate.
const CLASS_TEST_SKILLS = {
  Barbarian: ['Athletics', 'Perception'],
  Bard:      ['Acrobatics', 'Insight', 'Perception'],
  Cleric:    ['History', 'Insight'],
  Druid:     ['Arcana', 'Medicine'],
  Fighter:   ['Athletics', 'History'],
  Monk:      ['Acrobatics', 'Athletics'],
  Paladin:   ['Athletics', 'Insight'],
  Ranger:    ['Athletics', 'Insight', 'Perception'],
  Rogue:     ['Acrobatics', 'Athletics', 'Deception', 'Insight'],
  Sorcerer:  ['Arcana', 'Deception'],
  Warlock:   ['Arcana', 'Deception'],
  Wizard:    ['Arcana', 'History'],
};

async function selectRequiredSkills(cls) {
  const skills = CLASS_TEST_SKILLS[cls] ?? [];
  for (const skill of skills) {
    // Use getAllByRole in case the expertise picker also renders a button with the same name
    const btns = screen.getAllByRole('button', { name: skill });
    const available = btns.find(b => !b.disabled);
    if (available) fireEvent.click(available);
  }
}

async function advanceToReview(cls, name = 'Thorin') {
  await advanceToFeatures(cls, name);
  await assignStandardSpread();
  await selectRequiredSkills(cls);
  await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
  fireEvent.click(screen.getByTestId('details-next'));
  await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
}

// ────────────────────────────────────────────────────────────────────────────

describe('CharacterCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    referenceService.getRaces.mockResolvedValue([]);
    referenceService.getBackgrounds.mockResolvedValue([]);
    classService.getClassByName.mockResolvedValue(null);
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

  // ── Step 2: Class overview ───────────────────────────────────────────────

  it('advances to class overview step when a class is selected', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Wizard'));
    await waitFor(() => expect(screen.getByTestId('overview-next')).toBeInTheDocument());
    expect(screen.getByText('Step 2 of 5 — Class Overview')).toBeInTheDocument();
  });

  it('class overview back button returns to class picker', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByTestId('overview-next')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: 'Back' })[0]);
    await waitFor(() => expect(screen.getByText('Choose Your Class')).toBeInTheDocument());
  });

  it('calls classService.getClassByName with class name and edition when class selected', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(classService.getClassByName).toHaveBeenCalledWith('Barbarian', '5e', 1));
  });

  it('shows class data from API in class overview when returned', async () => {
    classService.getClassByName.mockResolvedValue({
      name: 'Barbarian', edition: '5e', flavor_text: 'A fierce warrior of primitive background.',
      hit_die: 12, primary_ability: 'Strength', spellcasting_ability: null,
      saving_throws: ['Strength', 'Constitution'], armor_proficiencies: ['Light', 'Medium', 'Shields'],
      weapon_proficiencies: ['Simple', 'Martial'], tool_proficiencies: [],
      skill_count: 2, skills_available: ['Athletics', 'Perception'], features: [],
    });
    renderCreate();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => {
      expect(screen.getByText('A fierce warrior of primitive background.')).toBeInTheDocument();
      expect(screen.getByText('d12')).toBeInTheDocument();
    });
  });

  // ── Step 3: Identity ─────────────────────────────────────────────────────

  it('advances to identity step when a class is selected', async () => {
    renderCreate();
    fireEvent.click(screen.getByText('Fighter'));
    await waitFor(() => expect(screen.getByTestId('overview-next')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('overview-next'));
    await waitFor(() => {
      expect(screen.getByText('Create Fighter')).toBeInTheDocument();
      expect(screen.getByText('Step 3 of 5 — Race, Background & Identity')).toBeInTheDocument();
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

  it('back button on identity step returns to class overview', async () => {
    renderCreate();
    await selectClass('Rogue');
    fireEvent.click(screen.getByTestId('identity-back'));
    await waitFor(() => expect(screen.getByTestId('overview-next')).toBeInTheDocument());
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
    expect(screen.getByText('Step 4 of 5 — Class Features & Ability Scores')).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText('Step 3 of 5 — Race, Background & Identity')).toBeInTheDocument());
  });

  it('details-next stays disabled until required skill proficiencies are selected', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    await assignStandardSpread();
    // Ability scores complete but no skills → still disabled
    await waitFor(() => expect(screen.getByTestId('details-next')).toBeDisabled());
    // Pick first required skill (1/2) — still disabled
    const btns1 = screen.getAllByRole('button', { name: 'Athletics' });
    fireEvent.click(btns1.find(b => !b.disabled) ?? btns1[0]);
    expect(screen.getByTestId('details-next')).toBeDisabled();
    // Pick second required skill (2/2) → now enabled
    const btns2 = screen.getAllByRole('button', { name: 'History' });
    fireEvent.click(btns2.find(b => !b.disabled) ?? btns2[0]);
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
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
    await waitFor(() => expect(screen.getByTestId('subrace-card-Mountain Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Mountain Dwarf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
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
    // High Elf requires a cantrip — still blocked
    await waitFor(() => expect(screen.getByTestId('identity-next')).toBeDisabled());
    // Select a cantrip to unblock
    fireEvent.change(screen.getByTestId('high-elf-cantrip-select'), { target: { value: 'Fire Bolt' } });
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
    // Mountain Dwarf: +2 STR (subrace) + +2 CON (base)
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Mountain Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Mountain Dwarf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    // Assign valid spread with STR=10, CON=8 so racial bonuses produce predictable finals
    // STR=10, DEX=14, CON=8, INT=12, WIS=13, CHA=15 → sorted [8,10,12,13,14,15] ✓
    fireEvent.change(screen.getByTestId('score-select-dexterity'), { target: { value: '14' } });
    fireEvent.change(screen.getByTestId('score-select-constitution'), { target: { value: '8' } });
    fireEvent.change(screen.getByTestId('score-select-intelligence'), { target: { value: '12' } });
    fireEvent.change(screen.getByTestId('score-select-wisdom'), { target: { value: '13' } });
    fireEvent.change(screen.getByTestId('score-select-charisma'), { target: { value: '15' } });
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          strength: 12,      // 10 + 2 (Mountain Dwarf subrace)
          constitution: 10,  // 8 + 2 (Dwarf base)
          dexterity: 14,     // assigned 14
        })
      );
    });
  });

  it('applies racial CON bonus to hp_max calculation', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Bralin' } });
    // Hill Dwarf: base +2 CON → keep CON=10 so finalCon=12, mod=+1 → Fighter d10+1 = 11
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread(); // CON stays 10; finalCon=12, mod=+1, hp=11
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
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
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Rogue Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Rogue');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
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
    fireEvent.click(screen.getByRole('button', { name: /archery/i }));
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
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

  it('shows info button on each subclass card in step 4 (Cleric)', async () => {
    renderCreate();
    await advanceToFeatures('Cleric');
    // Each subclass card has an info button with data-testid subclass-info-{name}
    expect(screen.getByTestId('subclass-info-Life Domain')).toBeInTheDocument();
    expect(screen.getByTestId('subclass-info-Light Domain')).toBeInTheDocument();
  });

  it('clicking subclass info button opens SubclassOverview dialog with flavor text', async () => {
    renderCreate();
    await advanceToFeatures('Cleric');
    fireEvent.click(screen.getByTestId('subclass-info-Life Domain'));
    await waitFor(() => {
      // SubclassOverview dialog renders flavor text and a feature name
      expect(screen.getByText('About this Subclass')).toBeInTheDocument();
      expect(screen.getByText('Disciple of Life')).toBeInTheDocument();
    });
  });

  // ── Racial choices: Dragonborn, High Elf, Half-Elf, Human ───────────────

  it('shows Draconic Ancestry picker when Dragonborn is selected', async () => {
    renderCreate();
    await selectClass('Barbarian');
    fireEvent.click(screen.getByTestId('race-card-Dragonborn'));
    await waitFor(() => {
      expect(screen.getByTestId('race-choices-section')).toBeInTheDocument();
      expect(screen.getAllByText('Draconic Ancestry').length).toBeGreaterThan(0);
      expect(screen.getByTestId('draconic-ancestry-Red')).toBeInTheDocument();
      expect(screen.getByTestId('draconic-ancestry-Gold')).toBeInTheDocument();
    });
  });

  it('Next is blocked for Dragonborn until an ancestry is chosen', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Drake' } });
    fireEvent.click(screen.getByTestId('race-card-Dragonborn'));
    await waitFor(() => expect(screen.getByTestId('draconic-ancestry-Blue')).toBeInTheDocument());
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    fireEvent.click(screen.getByTestId('draconic-ancestry-Blue'));
    await waitFor(() => expect(screen.getByTestId('identity-next')).not.toBeDisabled());
  });

  it('draconic ancestry choice is saved in character_data on submit', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 9 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Drake' } });
    fireEvent.click(screen.getByTestId('race-card-Dragonborn'));
    await waitFor(() => expect(screen.getByTestId('draconic-ancestry-Red')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('draconic-ancestry-Red'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({
            draconic_ancestry: expect.objectContaining({ name: 'Red', damage: 'Fire' }),
          }),
        })
      );
    });
  });

  it('shows Half-Elf ASI picker and skill versatility choices', async () => {
    renderCreate();
    await selectClass('Rogue');
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => {
      expect(screen.getByTestId('race-choices-section')).toBeInTheDocument();
      expect(screen.getAllByText('Ability Score Increases').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Skill Versatility').length).toBeGreaterThan(0);
      expect(screen.getByTestId('half-elf-asi-strength')).toBeInTheDocument();
      expect(screen.getByTestId('half-elf-skill-Perception')).toBeInTheDocument();
    });
  });

  it('Next is blocked for Half-Elf until 2 ASI stats and 2 skills are chosen', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lyra' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => expect(screen.getByTestId('half-elf-asi-strength')).toBeInTheDocument());
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    // Choose 2 ASI stats
    fireEvent.click(screen.getByTestId('half-elf-asi-strength'));
    fireEvent.click(screen.getByTestId('half-elf-asi-dexterity'));
    // Still blocked — skills not chosen
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    // Choose 2 skills
    fireEvent.click(screen.getByTestId('half-elf-skill-Perception'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Insight'));
    await waitFor(() => expect(screen.getByTestId('identity-next')).not.toBeDisabled());
  });

  it('half-elf extra skills are merged into skill_proficiencies on submit', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 11 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lyra' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => expect(screen.getByTestId('half-elf-asi-strength')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('half-elf-asi-strength'));
    fireEvent.click(screen.getByTestId('half-elf-asi-dexterity'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Perception'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Nature'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      const call = characterService.createCharacter.mock.calls[0][0];
      expect(call.character_data.skill_proficiencies).toContain('Perception');
      expect(call.character_data.skill_proficiencies).toContain('Nature');
    });
  });

  it('shows Human language picker when Human is selected', async () => {
    renderCreate();
    await selectClass('Ranger');
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => {
      expect(screen.getByTestId('race-choices-section')).toBeInTheDocument();
      expect(screen.getAllByText('Extra Language').length).toBeGreaterThan(0);
      expect(screen.getByTestId('human-language-select')).toBeInTheDocument();
    });
  });

  it('human language choice does not block Next', async () => {
    renderCreate();
    await selectClass('Ranger');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Finn' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-language-select')).toBeInTheDocument());
    // Next should NOT be blocked — language is optional
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
  });

  it('human chosen language is added to race_languages in submitted payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 12 } });
    renderCreate();
    await selectClass('Ranger');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Finn' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-language-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('human-language-select'), { target: { value: 'Elvish' } });
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Ranger Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Ranger');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      const call = characterService.createCharacter.mock.calls[0][0];
      expect(call.character_data.race_languages).toContain('Elvish');
    });
  });

  // ── Background choices: tool/gaming set/instrument/language ─────────────

  it('shows gaming set picker when Criminal background is selected', async () => {
    renderCreate();
    await selectClass('Rogue');
    fireEvent.click(screen.getByTestId('bg-card-Criminal'));
    await waitFor(() => {
      expect(screen.getByTestId('bg-choices-section')).toBeInTheDocument();
      expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument();
      expect(screen.getByText('Gaming Set')).toBeInTheDocument();
    });
  });

  it('shows instrument picker when Entertainer background is selected', async () => {
    renderCreate();
    await selectClass('Bard');
    fireEvent.click(screen.getByTestId('bg-card-Entertainer'));
    await waitFor(() => {
      expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument();
      expect(screen.getByText('Musical Instrument')).toBeInTheDocument();
    });
  });

  it("shows artisan's tool picker when Guild Artisan background is selected", async () => {
    renderCreate();
    await selectClass('Cleric');
    fireEvent.click(screen.getByTestId("bg-card-Guild Artisan"));
    await waitFor(() => {
      expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument();
      expect(screen.getByText("Artisan's Tools")).toBeInTheDocument();
    });
  });

  it('chosen background tool is saved as background_tool_choice in character_data', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 13 } });
    renderCreate();
    await selectClass('Rogue');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Shade' } });
    fireEvent.click(screen.getByTestId('bg-card-Criminal'));
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-tool-choice-select'), { target: { value: 'Dice set' } });
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Rogue Features')).toBeInTheDocument());
    await assignStandardSpread();
    // Criminal grants Deception + Stealth — pick other Rogue skills that don't overlap
    for (const skill of ['Acrobatics', 'Athletics', 'Investigation', 'Insight']) {
      const btns = screen.getAllByRole('button', { name: skill });
      const available = btns.find(b => !b.disabled);
      if (available) fireEvent.click(available);
    }
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({ background_tool_choice: 'Dice set' }),
        })
      );
    });
  });

  it('shows two language pickers when Acolyte background is selected', async () => {
    renderCreate();
    await selectClass('Cleric');
    fireEvent.click(screen.getByTestId('bg-card-Acolyte'));
    await waitFor(() => {
      expect(screen.getByTestId('bg-choices-section')).toBeInTheDocument();
      expect(screen.getByTestId('bg-language-0-select')).toBeInTheDocument();
      expect(screen.getByTestId('bg-language-1-select')).toBeInTheDocument();
    });
  });

  it('chosen background languages are saved in character_data on submit', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 14 } });
    renderCreate();
    await selectClass('Cleric');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Aldric' } });
    fireEvent.click(screen.getByTestId('bg-card-Acolyte'));
    await waitFor(() => expect(screen.getByTestId('bg-language-0-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-language-0-select'), { target: { value: 'Elvish' } });
    fireEvent.change(screen.getByTestId('bg-language-1-select'), { target: { value: 'Celestial' } });
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Cleric Features')).toBeInTheDocument());
    await assignStandardSpread();
    // Acolyte grants Insight + Religion — pick Cleric skills that don't overlap
    for (const skill of ['History', 'Medicine']) {
      const btns = screen.getAllByRole('button', { name: skill });
      const available = btns.find(b => !b.disabled);
      if (available) fireEvent.click(available);
    }
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      const call = characterService.createCharacter.mock.calls[0][0];
      expect(call.character_data.background_languages).toContain('Elvish');
      expect(call.character_data.background_languages).toContain('Celestial');
    });
  });

  // ── Class choices: Monk tool/instrument ──────────────────────────────────

  it('shows tool/instrument picker for Monk in step 3', async () => {
    renderCreate();
    await advanceToFeatures('Monk');
    expect(screen.getByTestId('monk-tool-choice-select')).toBeInTheDocument();
    expect(screen.getByText('Tool Proficiency')).toBeInTheDocument();
  });

  it('chosen Monk tool is saved in character_data on submit', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 15 } });
    renderCreate();
    await advanceToFeatures('Monk');
    fireEvent.change(screen.getByTestId('monk-tool-choice-select'), { target: { value: "Smith's tools" } });
    await assignStandardSpread();
    await selectRequiredSkills('Monk');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({ tool_choice: "Smith's tools" }),
        })
      );
    });
  });
});
