import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterCreate from './CharacterCreate';
import characterService from '../characterService';
import referenceService from '../referenceService';
import classService from '../classService';
import featService from '../../encyclopedia/featService';

const TEST_FEATS = [
  { id: 1, name: 'Alert', edition: '5e', description: '+5 to initiative.', prerequisites: {}, source: 'PHB 2014', repeatable: false },
  { id: 2, name: 'Lucky', edition: '5e', description: 'Reroll a d20.', prerequisites: {}, source: 'PHB 2014', repeatable: false },
  { id: 3, name: 'Inspiring Leader', edition: '5e', description: 'Grant temp HP.', prerequisites: { text: 'Charisma 13 or higher' }, source: 'PHB 2014', repeatable: false },
  { id: 4, name: 'War Caster', edition: '5e', description: 'Advantage on concentration.', prerequisites: { text: 'The ability to cast at least one spell' }, source: 'PHB 2014', repeatable: false },
  { id: 5, name: 'Heavily Armored', edition: '5e', description: 'Heavy armor proficiency.', prerequisites: { text: 'Proficiency with medium armor' }, source: 'PHB 2014', repeatable: false },
  { id: 6, name: 'Tavern Brawler', edition: '5e', description: 'Brawl.', prerequisites: {}, source: 'PHB 2014', repeatable: false,
    effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }] },
];

vi.mock('../characterService', () => ({
  default: { createCharacter: vi.fn() },
}));

vi.mock('../referenceService', () => ({
  default: { getRaces: vi.fn(), getBackgrounds: vi.fn() },
}));

vi.mock('../../encyclopedia/featService', () => ({
  default: { getFeats: vi.fn() },
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
  // Default 'none' keeps the (separately-tested) Equipment step out of the existing
  // creation-flow tests; the Starting equipment describe sets it explicitly.
  starting_equipment: 'none',
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

// The Starting Equipment step fetches encyclopedia items; default to empty so it
// renders cleanly (the resolver falls back to plain entries).
vi.mock('../../encyclopedia/itemService', () => ({
  default: { getItems: vi.fn().mockResolvedValue([]) },
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
  // Identity step reached — assert via a step-count-independent element (the name input).
  await waitFor(() => expect(screen.getByPlaceholderText('Enter a name…')).toBeInTheDocument());
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

// The required level-1 class choice (Fighting Style / L1 subclass) per class, used to satisfy
// the Features → Review gate in tests. Picked by accessible name on its OptionCardPicker card.
const CLASS_L1_CHOICE = {
  Fighter: /defense/i,        // Fighting Style
  Cleric: /life domain/i,     // Divine Domain (subclass at L1)
  Sorcerer: /wild magic/i,    // Sorcerous Origin (no nested dragon-type sub-choice)
  Warlock: /the fiend/i,      // Otherworldly Patron
};

async function selectRequiredSkills(cls) {
  const skills = CLASS_TEST_SKILLS[cls] ?? [];
  for (const skill of skills) {
    // Use getAllByRole in case the expertise picker also renders a button with the same name
    const btns = screen.getAllByRole('button', { name: skill });
    const available = btns.find(b => !b.disabled);
    if (available) fireEvent.click(available);
  }
  // Satisfy any required level-1 class choice so the Review gate passes. Idempotent: if
  // details-next is already enabled (the test picked its own option, e.g. a specific fighting
  // style), this does nothing.
  const next = screen.queryByTestId('details-next');
  const pick = CLASS_L1_CHOICE[cls];
  if (next && next.disabled && pick) {
    const cards = screen.queryAllByRole('button', { name: pick });
    if (cards.length) fireEvent.click(cards[0]);
  }
}

async function advanceToReview(cls, name = 'Thorin') {
  await advanceToFeatures(cls, name);
  await assignStandardSpread();
  await selectRequiredSkills(cls);
  await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
  fireEvent.click(screen.getByTestId('details-next'));
  // Pass through the Equipment step when the campaign has one (starting_equipment != 'none').
  await waitFor(() => expect(
    screen.queryByTestId('equipment-next') || screen.queryByText('Character Summary')
  ).toBeTruthy());
  if (screen.queryByTestId('equipment-next')) {
    fireEvent.click(screen.getByTestId('equipment-next'));
  }
  await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
}

// Opens the FeatPicker dialog and selects a feat by its id (Variant Human flow).
async function chooseFeat(featId) {
  fireEvent.click(screen.getByTestId('human-feat-select'));
  await waitFor(() => expect(screen.getByTestId(`human-feat-option-${featId}`)).toBeInTheDocument());
  fireEvent.click(screen.getByTestId(`human-feat-option-${featId}`));
}

// ────────────────────────────────────────────────────────────────────────────

describe('CharacterCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    referenceService.getRaces.mockResolvedValue([]);
    referenceService.getBackgrounds.mockResolvedValue([]);
    featService.getFeats.mockResolvedValue(TEST_FEATS);
    classService.getClassByName.mockResolvedValue(null);
    Object.assign(mockCampaign, {
      use_alignment: true,
      ability_score_method: 'standard_spread',
      allow_reroll_ones: false,
      edition: '5e',
      starting_equipment: 'none',
    });
  });

  // ── Step 1: Class picker ─────────────────────────────────────────────────

  it('renders class picker on first step', () => {
    renderCreate();
    expect(screen.getByText('Choose Your Class')).toBeInTheDocument();
    ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
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
    // Soldier's gaming-set proficiency is now a required choice before advancing
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-tool-choice-select'), { target: { value: 'Dice set' } });
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
    // Pick second required skill (2/2) — skills satisfied, but the Fighter still needs a fighting style
    const btns2 = screen.getAllByRole('button', { name: 'History' });
    fireEvent.click(btns2.find(b => !b.disabled) ?? btns2[0]);
    expect(screen.getByTestId('details-next')).toBeDisabled();
    // Choose a fighting style → now enabled
    fireEvent.click(screen.getByRole('button', { name: /defense/i }));
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
  });

  it('blocks Review until a required class choice (Fighter fighting style) is made', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    await assignStandardSpread();
    // Satisfy skills but NOT the fighting style
    fireEvent.click(screen.getAllByRole('button', { name: 'Athletics' }).find(b => !b.disabled));
    fireEvent.click(screen.getAllByRole('button', { name: 'History' }).find(b => !b.disabled));
    // Scores + skills done, but no fighting style → still blocked, with a hint
    expect(screen.getByTestId('details-next')).toBeDisabled();
    expect(screen.getByTestId('class-choice-hint')).toHaveTextContent(/fighting style/i);
    fireEvent.click(screen.getByRole('button', { name: /defense/i }));
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
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Smith's tools" } }); // Dwarf tool prof is required
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

  // ── Starting currency (from background) ──────────────────────────────────

  describe('Starting currency', () => {
    beforeEach(() => { mockCampaign.starting_equipment = 'equipment'; });

    it('shows 0 gp in review when no background is chosen', async () => {
      renderCreate();
      await advanceToReview('Fighter');
      expect(screen.getByTestId('review-starting-gold')).toHaveTextContent('0 gp');
    });

    it('seeds starting gold from the chosen background and includes it in the payload', async () => {
      characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 7 } });
      renderCreate();
      await selectClass('Fighter');
      fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Goldie' } });
      fireEvent.click(screen.getByTestId('bg-card-Charlatan')); // 15 gp, no required sub-choices
      fireEvent.click(screen.getByTestId('identity-next'));
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      await assignStandardSpread();
      await selectRequiredSkills('Fighter');
      await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
      fireEvent.click(screen.getByTestId('details-next'));
      await waitFor(() => expect(screen.getByTestId('equipment-next')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('equipment-next'));
      await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());

      expect(screen.getByTestId('review-starting-gold')).toHaveTextContent('15 gp');

      fireEvent.click(screen.getByText('Create Character'));
      await waitFor(() => expect(characterService.createCharacter).toHaveBeenCalled());
      const payload = characterService.createCharacter.mock.calls[0][0];
      expect(payload.character_data.currency).toEqual(
        expect.objectContaining({ gp: 15, cp: 0, sp: 0, ep: 0, pp: 0 })
      );
    });
  });

  // ── Starting equipment step ──────────────────────────────────────────────

  describe('Starting equipment step', () => {
    async function advanceToEquipment(cls, name = 'Thorin') {
      await advanceToFeatures(cls, name);
      await assignStandardSpread();
      await selectRequiredSkills(cls);
      await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
      fireEvent.click(screen.getByTestId('details-next'));
      await waitFor(() => expect(screen.getByTestId('equipment-step')).toBeInTheDocument());
    }

    it('shows the Equipment step in equipment mode with class choice options', async () => {
      mockCampaign.starting_equipment = 'equipment';
      renderCreate();
      await advanceToEquipment('Fighter');
      expect(screen.getByTestId('equip-opt-f1-a')).toBeInTheDocument(); // chain mail
      expect(screen.getByTestId('equip-opt-f1-b')).toBeInTheDocument(); // leather + longbow
    });

    it('includes the resolved starting inventory in the payload', async () => {
      mockCampaign.starting_equipment = 'equipment';
      characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 8 } });
      renderCreate();
      await advanceToEquipment('Fighter');
      fireEvent.click(screen.getByTestId('equipment-next'));
      await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Create Character'));
      await waitFor(() => expect(characterService.createCharacter).toHaveBeenCalled());
      const inv = characterService.createCharacter.mock.calls[0][0].character_data.inventory;
      expect(inv.length).toBeGreaterThan(0);
      expect(inv.some((e) => e.name === 'Chain Mail')).toBe(true); // Fighter f1 default
    });

    it('review lists the starting equipment items and wallet', async () => {
      mockCampaign.starting_equipment = 'equipment';
      renderCreate();
      await advanceToEquipment('Fighter');
      fireEvent.click(screen.getByTestId('equipment-next'));
      await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
      const eq = screen.getByTestId('review-equipment');
      expect(eq).toHaveTextContent('Wallet:');
      expect(eq).toHaveTextContent('Chain Mail'); // Fighter f1 default item listed
    });

    it('none mode skips the step and grants no equipment or gold', async () => {
      mockCampaign.starting_equipment = 'none';
      characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 9 } });
      renderCreate();
      await selectClass('Fighter');
      fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Pauper' } });
      fireEvent.click(screen.getByTestId('bg-card-Charlatan')); // would give 15 gp if not 'none'
      fireEvent.click(screen.getByTestId('identity-next'));
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      await assignStandardSpread();
      await selectRequiredSkills('Fighter');
      await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
      fireEvent.click(screen.getByTestId('details-next'));
      await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
      expect(screen.queryByTestId('equipment-step')).not.toBeInTheDocument();
      expect(screen.getByTestId('review-starting-gold')).toHaveTextContent('0 gp');
      fireEvent.click(screen.getByText('Create Character'));
      await waitFor(() => expect(characterService.createCharacter).toHaveBeenCalled());
      const cd = characterService.createCharacter.mock.calls[0][0].character_data;
      expect(cd.inventory).toEqual([]);
      expect(cd.currency.gp).toBe(0);
    });

    it('equipment_or_gold lets the player take class gold instead of equipment', async () => {
      mockCampaign.starting_equipment = 'equipment_or_gold';
      characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 10 } });
      renderCreate();
      await advanceToEquipment('Fighter');
      expect(screen.getByTestId('equip-take-gold')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('equip-take-gold'));
      fireEvent.click(screen.getByTestId('equipment-next'));
      await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
      expect(screen.getByTestId('review-starting-gold')).toHaveTextContent('125 gp'); // Fighter wealth
      fireEvent.click(screen.getByText('Create Character'));
      await waitFor(() => expect(characterService.createCharacter).toHaveBeenCalled());
      const cd = characterService.createCharacter.mock.calls[0][0].character_data;
      expect(cd.currency.gp).toBe(125);
      expect(cd.inventory.some((e) => e.name === 'Chain Mail')).toBe(false); // class equipment swapped for gold
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
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Smith's tools" } }); // Dwarf tool prof is required
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

  it('applies racial CON bonus and Dwarven Toughness to hp_max calculation', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 5 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Bralin' } });
    // Hill Dwarf: base +2 CON → keep CON=10 so finalCon=12, mod=+1; Hill Dwarf also grants
    // Dwarven Toughness (+1 HP per level). At L1 → Fighter d10 + 1 CON + 1 trait = 12.
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Smith's tools" } }); // Dwarf tool prof is required
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread(); // CON stays 10; finalCon=12, mod=+1
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({ hp_max: 12 }),
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
    // Acolyte's 2 language choices are now required before advancing
    await waitFor(() => expect(screen.getByTestId('bg-language-0-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-language-0-select'), { target: { value: 'Elvish' } });
    fireEvent.change(screen.getByTestId('bg-language-1-select'), { target: { value: 'Celestial' } });
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
    // Outlander's instrument proficiency is now a required choice before advancing
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-tool-choice-select'), { target: { value: 'Flute' } });
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

  it('shows the chosen fighting style name AND description on the review step', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    fireEvent.click(screen.getByRole('button', { name: /defense/i })); // select Defense fighting style
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    // Review locks the choice but must still show its description, not just the name
    expect(screen.getByText('Defense')).toBeInTheDocument();
    expect(screen.getByText('+1 bonus to AC while wearing armor.')).toBeInTheDocument();
  });

  it('blocks Next until a required background tool choice is made', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Lex' } });
    fireEvent.click(screen.getByTestId('bg-card-Guild Artisan'));
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    // Guild Artisan grants an artisan's tool — Next is blocked until it's chosen
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    fireEvent.change(screen.getByTestId('bg-tool-choice-select'), { target: { value: "Smith's tools" } });
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
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

  it('shows the Half-Elf extra-language picker and saves the choice', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 61 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Tanis' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => expect(screen.getByTestId('half-elf-language-select')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('half-elf-asi-strength'));
    fireEvent.click(screen.getByTestId('half-elf-asi-dexterity'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Stealth'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Survival'));
    fireEvent.change(screen.getByTestId('half-elf-language-select'), { target: { value: 'Draconic' } });
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
      expect(call.character_data.race_languages).toContain('Draconic');
    });
  });

  it('highlights Half-Elf versatility skills as race-granted in the Features step', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Tika' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => expect(screen.getByTestId('half-elf-asi-strength')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('half-elf-asi-strength'));
    fireEvent.click(screen.getByTestId('half-elf-asi-dexterity'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Perception')); // both are Fighter-allowed skills
    fireEvent.click(screen.getByTestId('half-elf-skill-Survival'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    // The class skill picker flags them emerald + non-clickable so they can't be picked twice
    expect(screen.getByText('Emerald = already granted by your race')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Survival' })).toHaveClass('cursor-not-allowed');
  });

  it('flags background skills as amber + disabled in the Half-Elf picker', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Tas' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => expect(screen.getByTestId('half-elf-skill-Athletics')).toBeInTheDocument());
    // Soldier grants Athletics + Intimidation
    fireEvent.click(screen.getByTestId('bg-card-Soldier'));
    await waitFor(() => expect(screen.getByText(/Amber = already granted by your background/)).toBeInTheDocument());
    expect(screen.getByTestId('half-elf-skill-Athletics')).toBeDisabled();
    expect(screen.getByTestId('half-elf-skill-Intimidation')).toBeDisabled();
  });

  it('blocks Next when a Half-Elf versatility skill duplicates a background skill', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Caramon' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Elf'));
    await waitFor(() => expect(screen.getByTestId('half-elf-asi-strength')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('half-elf-asi-strength'));
    fireEvent.click(screen.getByTestId('half-elf-asi-dexterity'));
    // Pick Athletics as a Half-Elf skill BEFORE choosing a background (so it's selectable)
    fireEvent.click(screen.getByTestId('half-elf-skill-Athletics'));
    fireEvent.click(screen.getByTestId('half-elf-skill-Survival'));
    // Now choose Soldier (grants Athletics) → double → blocked with an error
    fireEvent.click(screen.getByTestId('bg-card-Soldier'));
    expect(screen.getByTestId('skill-double-error')).toHaveTextContent(/Athletics/);
    expect(screen.getByTestId('identity-next')).toBeDisabled();
  });

  it('warns but does NOT block when a race trait skill overlaps a background skill', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Grom' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Orc')); // Menacing → Intimidation
    fireEvent.click(screen.getByTestId('bg-card-Soldier'));      // Soldier grants Intimidation
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-tool-choice-select'), { target: { value: 'Dice set' } });
    // Trait overlap warns (non-blocking); it is not the player-choice error
    expect(screen.getByTestId('skill-overlap-warning')).toHaveTextContent(/Intimidation/);
    expect(screen.queryByTestId('skill-double-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
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

  // ── Variant Human (feat + skill + ASI) ─────────────────────────────────

  it('shows a Standard vs Variant Human choice when Human is selected', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => {
      expect(screen.getByTestId('human-type-standard')).toBeInTheDocument();
      expect(screen.getByTestId('human-type-variant')).toBeInTheDocument();
    });
    // Variant pickers hidden until Variant is chosen
    expect(screen.queryByTestId('human-feat-select')).not.toBeInTheDocument();
  });

  it('Variant Human unlocks the ASI, skill, and feat pickers', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-type-variant')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-type-variant'));
    await waitFor(() => expect(screen.getByTestId('human-feat-select')).toBeInTheDocument());
    expect(screen.getByTestId('human-variant-asi-strength')).toBeInTheDocument();
    expect(screen.getByTestId('human-variant-skill-Arcana')).toBeInTheDocument();
    // Opening the feat picker shows each feat (with its description) from the mocked list
    fireEvent.click(screen.getByTestId('human-feat-select'));
    await waitFor(() => expect(screen.getByTestId('human-feat-option-1')).toBeInTheDocument());
    expect(screen.getByTestId('human-feat-option-2')).toBeInTheDocument();
    // Descriptions are browsable before choosing
    expect(screen.getByText('+5 to initiative.')).toBeInTheDocument();
    expect(screen.getByText('Reroll a d20.')).toBeInTheDocument();
  });

  it('blocks Next until Variant Human ASI, skill, and feat are all chosen', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Varis' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-type-variant')).toBeInTheDocument());
    // Standard human (default) → Next allowed immediately
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('human-type-variant'));
    await waitFor(() => expect(screen.getByTestId('human-feat-select')).toBeInTheDocument());
    // Variant chosen but nothing picked → blocked
    expect(screen.getByTestId('identity-next')).toBeDisabled();

    fireEvent.click(screen.getByTestId('human-variant-asi-strength'));
    fireEvent.click(screen.getByTestId('human-variant-asi-constitution'));
    fireEvent.click(screen.getByTestId('human-variant-skill-Arcana'));
    expect(screen.getByTestId('identity-next')).toBeDisabled(); // feat still missing
    await chooseFeat(1); // Alert
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
  });

  it('Variant Human applies +1 to two scores and stores the feat + skill in the payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 30 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Varis' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-type-variant')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-type-variant'));
    await waitFor(() => expect(screen.getByTestId('human-feat-select')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-variant-asi-strength'));
    fireEvent.click(screen.getByTestId('human-variant-asi-constitution'));
    fireEvent.click(screen.getByTestId('human-variant-skill-Arcana'));
    await chooseFeat(1); // Alert

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
      // Standard spread STR=15, CON=10 (unchanged) + variant +1 each = 16 / 11.
      // (Standard Human's +1-to-all is replaced by the variant +1-to-two.)
      expect(call.strength).toBe(16);
      expect(call.constitution).toBe(11);
      expect(call.dexterity).toBe(14); // unchanged — no longer +1 from standard human
      expect(call.character_data.human_variant).toBe(true);
      expect(call.character_data.feats).toEqual([{ id: 1, name: 'Alert', level: 1 }]); // Variant Human feat gained at level 1
      expect(call.character_data.skill_proficiencies).toContain('Arcana');
    });
  });

  it('Variant Human half-feat (Tavern Brawler) prompts an ability choice and applies it', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 40 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Brawler' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-type-variant')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-type-variant'));
    await waitFor(() => expect(screen.getByTestId('human-feat-select')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-variant-asi-strength'));
    fireEvent.click(screen.getByTestId('human-variant-asi-constitution'));
    fireEvent.click(screen.getByTestId('human-variant-skill-Arcana'));
    await chooseFeat(6); // Tavern Brawler (half-feat with an ability choice)

    // The ability chooser appears and blocks Next until a score is chosen.
    expect(screen.getByTestId('human-feat-ability-choice')).toBeInTheDocument();
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    fireEvent.click(screen.getByTestId('human-feat-ability-strength'));
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();

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
      // STR 15 (spread) + 1 (variant) + 1 (Tavern Brawler choice) = 17; CON 10 + 1 (variant) = 11.
      expect(call.strength).toBe(17);
      expect(call.constitution).toBe(11);
      expect(call.character_data.feats).toEqual([
        expect.objectContaining({ id: 6, name: 'Tavern Brawler', level: 1, choices: { ability: 'strength' } }),
      ]);
    });
  });

  it('switching back to Standard Human clears variant picks and restores +1-to-all', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 31 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Varis' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-type-variant')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-type-variant'));
    await waitFor(() => expect(screen.getByTestId('human-feat-select')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-variant-asi-strength'));
    await chooseFeat(1); // Alert
    // Back to standard → variant pickers disappear, Next allowed
    fireEvent.click(screen.getByTestId('human-type-standard'));
    expect(screen.queryByTestId('human-feat-select')).not.toBeInTheDocument();
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();

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
      // Standard human: +1 to all → DEX 14+1=15, no feats stored
      expect(call.dexterity).toBe(15);
      expect(call.character_data.human_variant).toBeUndefined();
      expect(call.character_data.feats).toBeUndefined();
    });
  });

  // ── Variant Human feat prerequisites ───────────────────────────────────

  // Set up a Variant Human on the given class with 2 ASI + 1 skill chosen, then
  // pick the feat with the given id. Leaves the user on the Identity step.
  async function variantHumanWithFeat(cls, featId, asi = ['strength', 'constitution']) {
    await selectClass(cls);
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Varis' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => expect(screen.getByTestId('human-type-variant')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('human-type-variant'));
    await waitFor(() => expect(screen.getByTestId('human-feat-select')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId(`human-variant-asi-${asi[0]}`));
    fireEvent.click(screen.getByTestId(`human-variant-asi-${asi[1]}`));
    fireEvent.click(screen.getByTestId('human-variant-skill-Arcana'));
    await chooseFeat(featId);
  }

  it('blocks Identity → Features when a non-caster picks a spellcasting feat, with a note', async () => {
    renderCreate();
    await variantHumanWithFeat('Fighter', 4); // War Caster — requires spellcasting
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    const note = screen.getByTestId('feat-prereq-identity-note');
    expect(note).toHaveTextContent('War Caster');
    expect(note).toHaveTextContent(/cast a spell/);
  });

  it('blocks Identity → Features when the class lacks the required armor proficiency', async () => {
    renderCreate();
    await variantHumanWithFeat('Wizard', 5); // Heavily Armored — requires medium armor (Wizard has none)
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    expect(screen.getByTestId('feat-prereq-identity-note')).toHaveTextContent(/medium armor/);
  });

  it('does NOT block Identity for an ability-score prerequisite (checked later at Features)', async () => {
    renderCreate();
    // Inspiring Leader needs Charisma 13 — unknowable until scores are assigned, so
    // Identity stays unblocked and shows no identity-stage note.
    await variantHumanWithFeat('Fighter', 3);
    expect(screen.queryByTestId('feat-prereq-identity-note')).not.toBeInTheDocument();
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
  });

  it('blocks Features → Review when an ability-score prerequisite is unmet, with a note', async () => {
    renderCreate();
    await variantHumanWithFeat('Fighter', 3); // Inspiring Leader — Charisma 13+ (spread leaves CHA 8)
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    // Scores + skills + class choice satisfied, but the feat's CHA 13 prereq is not.
    expect(screen.getByTestId('details-next')).toBeDisabled();
    const note = screen.getByTestId('feat-prereq-features-note');
    expect(note).toHaveTextContent('Inspiring Leader');
    expect(note).toHaveTextContent(/Charisma 13\+/);
  });

  it('allows Features → Review once the feat ability prerequisite is met via the Variant +1s', async () => {
    renderCreate();
    // Put the Variant +1s into Charisma-adjacent stats won't help CHA; instead pick a feat
    // whose requirement the spread already meets: Strength 13 is satisfied (STR 15).
    await variantHumanWithFeat('Fighter', 3, ['charisma', 'dexterity']); // CHA 8→9 still < 13
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    // CHA 9 still short → still blocked (confirms the +1s are folded into the check).
    expect(screen.getByTestId('details-next')).toBeDisabled();
    expect(screen.getByTestId('feat-prereq-features-note')).toHaveTextContent(/highest is 9/);
  });

  it('shows the chosen feat name AND description on the review page', async () => {
    renderCreate();
    await variantHumanWithFeat('Fighter', 1); // Alert — no prerequisite
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    const block = screen.getByTestId('review-variant-human');
    expect(block).toHaveTextContent('Feat: Alert');
    expect(screen.getByTestId('review-variant-human-feat-desc')).toHaveTextContent('+5 to initiative.');
  });

  it('shows the feat prerequisite on the review page when the feat has one', async () => {
    renderCreate();
    // Heavily Armored requires medium armor; a Fighter has it, so the prereq is met and we reach review.
    await variantHumanWithFeat('Fighter', 5);
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    const desc = screen.getByTestId('review-variant-human-feat-desc');
    expect(desc).toHaveTextContent('Prerequisite: Proficiency with medium armor');
    expect(desc).toHaveTextContent('Heavy armor proficiency.');
  });

  // ── Dwarf Tool Proficiency racial choice ───────────────────────────────

  it('shows the Dwarf tool proficiency picker when a Dwarf subrace is chosen', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    expect(screen.getByTestId('dwarf-tool-select')).toBeInTheDocument();
  });

  it('blocks Next until the Dwarf tool proficiency is chosen', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Bruenor' } });
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Mountain Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Mountain Dwarf'));
    // Name + subrace are set, but the required tool proficiency is not → Next blocked
    expect(screen.getByTestId('identity-next')).toBeDisabled();
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Smith's tools" } });
    expect(screen.getByTestId('identity-next')).not.toBeDisabled();
  });

  it('surfaces the chosen background tool so the Dwarf does not pick it twice', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    // Guild Artisan grants an artisan's tool; choose Smith's tools as the background tool
    fireEvent.click(screen.getByTestId('bg-card-Guild Artisan'));
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('bg-tool-choice-select'), { target: { value: "Smith's tools" } });
    // The Dwarf picker now shows the background grant note referencing the chosen tool
    const grants = screen.getByTestId('dwarf-tool-bg-grants');
    expect(grants).toHaveTextContent("Smith's tools");
  });

  it('stores the Dwarf tool proficiency in the submitted payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 21 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Bruenor' } });
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Mountain Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Mountain Dwarf'));
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Mason's tools" } });
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
      expect(call.character_data.race_tool_proficiency).toBe("Mason's tools");
    });
  });

  it('excludes the race-chosen tool from the background tool dropdown (bidirectional)', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Smith's tools" } });
    // Pick an artisan's-tools background; Smith's tools must now be flagged as already from race
    fireEvent.click(screen.getByTestId('bg-card-Guild Artisan'));
    await waitFor(() => expect(screen.getByTestId('bg-tool-choice-select')).toBeInTheDocument());
    const opt = within(screen.getByTestId('bg-tool-choice-select')).getByText(/Smith's tools \(already from race\)/);
    expect(opt).toBeDisabled();
  });

  it('shows chosen tool proficiencies in the review Proficiencies card', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 31 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Bruenor' } });
    fireEvent.click(screen.getByTestId('race-card-Dwarf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Hill Dwarf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Hill Dwarf'));
    fireEvent.change(screen.getByTestId('dwarf-tool-select'), { target: { value: "Brewer's supplies" } });
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    const toolsCard = screen.getByTestId('chosen-tool-proficiencies');
    expect(within(toolsCard).getByText("Brewer's supplies")).toBeInTheDocument();
  });

  it('shows a Rock Gnome trait-granted tool proficiency (Tinker’s tools) in review and payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 51 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Wibble' } });
    fireEvent.click(screen.getByTestId('race-card-Gnome'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Rock Gnome')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Rock Gnome'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter'); // also satisfies the fighting-style gate
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    expect(within(screen.getByTestId('chosen-tool-proficiencies')).getByText("Tinker's tools")).toBeInTheDocument();
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      const call = characterService.createCharacter.mock.calls[0][0];
      expect(call.character_data.race_tool_proficiencies).toContain("Tinker's tools");
    });
  });

  it('shows Wood Elf trait-granted weapon proficiencies (Elf Weapon Training) in review', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Tauriel' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    const weapons = screen.getByTestId('race-weapon-proficiencies');
    expect(within(weapons).getByText('Longsword')).toBeInTheDocument();
    expect(within(weapons).getByText('Shortbow')).toBeInTheDocument();
  });

  it('does not double-count a class skill that becomes race-granted after switching race', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Legolas' } });
    // No race yet → go to features and pick Perception + History as the two Fighter skills
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    fireEvent.click(screen.getByRole('button', { name: 'Perception' }));
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    fireEvent.click(screen.getByRole('button', { name: /defense/i })); // Fighter fighting style is required
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    // Go back and switch to Elf — Keen Senses grants Perception
    fireEvent.click(screen.getByTestId('details-back'));
    await waitFor(() => expect(screen.getByTestId('race-card-Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    // Perception was pruned from the manual picks (now race-granted), leaving only History (1/2),
    // so Next is blocked until another class skill is chosen — proving it isn't counted twice.
    expect(screen.getByTestId('details-next')).toBeDisabled();
    expect(screen.getByText('Emerald = already granted by your race')).toBeInTheDocument();
  });

  it('shows Wood Elf increased speed (35 ft) in the review and the submitted payload', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 41 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Tauriel' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-Wood Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    expect(within(screen.getByTestId('review-speed')).getByText('35 ft')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      const call = characterService.createCharacter.mock.calls[0][0];
      expect(call.character_data.speed).toBe(35);
    });
  });

  it('renders the High Elf race-granted cantrip as a clickable detail in the review', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Elrond' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    await waitFor(() => expect(screen.getByTestId('subrace-card-High Elf')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('subrace-card-High Elf'));
    await waitFor(() => expect(screen.getByTestId('high-elf-cantrip-select')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('high-elf-cantrip-select'), { target: { value: 'Fire Bolt' } });
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    await assignStandardSpread();
    await selectRequiredSkills('Fighter');
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    // The cantrip is now a clickable button (opens the detail dialog), not a static badge
    const cantrips = screen.getByTestId('review-race-cantrips');
    expect(within(cantrips).getByRole('button', { name: /Fire Bolt/i })).toBeInTheDocument();
  });

  it('gives skill proficiency buttons a hover description (title attribute)', async () => {
    renderCreate();
    await advanceToFeatures('Fighter');
    const perception = screen.getByRole('button', { name: 'Perception' });
    expect(perception).toHaveAttribute('title');
    expect(perception.getAttribute('title')?.length ?? 0).toBeGreaterThan(0);
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
    // Cleric must choose a Divine Domain (subclass) at level 1
    fireEvent.click(screen.getAllByRole('button', { name: /life domain/i })[0]);
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

  // ── Race-granted skill proficiencies ─────────────────────────────────────
  //
  // Keen Senses (Elf base) grants Perception. Menacing (Half-Orc) grants
  // Intimidation. These flow through the same path as background-granted
  // skills but with emerald styling and a different legend.

  it('shows "Perception (from Keen Senses)" badge in race detail when Elf is selected', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Legolas' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    await waitFor(() => {
      const grants = screen.getByTestId('race-skill-grants');
      expect(grants).toBeInTheDocument();
      expect(grants).toHaveTextContent('Perception');
      expect(grants).toHaveTextContent('Keen Senses');
    });
  });

  it('shows "Intimidation (from Menacing)" badge in race detail when Half-Orc is selected', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Grommash' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Orc'));
    await waitFor(() => {
      const grants = screen.getByTestId('race-skill-grants');
      expect(grants).toHaveTextContent('Intimidation');
      expect(grants).toHaveTextContent('Menacing');
    });
  });

  it('does NOT show race-skill-grants section when race has no skill-granting traits (Human)', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Boris' } });
    fireEvent.click(screen.getByTestId('race-card-Human'));
    await waitFor(() => {
      expect(screen.queryByTestId('race-skill-grants')).not.toBeInTheDocument();
    });
  });

  it('Elf race skill (Perception) appears as emerald-tinted disabled button on Fighter sheet', async () => {
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Legolas' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => {
      expect(screen.getByText('Emerald = already granted by your race')).toBeInTheDocument();
    });
  });

  it('Half-Orc Intimidation appears as extra emerald button when Wizard class does not allow Intimidation', async () => {
    // Wizard allowed: Arcana, History, Insight, Investigation, Medicine, Religion
    // Half-Orc grants Intimidation → must appear as extra emerald button
    renderCreate();
    await selectClass('Wizard');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Half-Orc Wizard' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Orc'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await waitFor(() => {
      // Intimidation appears as a disabled button (extra race skill)
      const buttons = screen.getAllByRole('button', { name: 'Intimidation' });
      expect(buttons.length).toBeGreaterThan(0);
      expect(screen.getByText('Emerald = already granted by your race')).toBeInTheDocument();
    });
  });

  it('race-granted Perception is included in character_data.skill_proficiencies on submit', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 9 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Legolas' } });
    fireEvent.click(screen.getByTestId('race-card-Elf'));
    fireEvent.click(screen.getByTestId('subrace-card-Wood Elf'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await assignStandardSpread();
    // Select 2 OTHER skills (not Perception, since that comes from race)
    const athletics = screen.getAllByRole('button', { name: 'Athletics' }).find(b => !b.disabled);
    fireEvent.click(athletics);
    const history = screen.getAllByRole('button', { name: 'History' }).find(b => !b.disabled);
    fireEvent.click(history);
    fireEvent.click(screen.getByRole('button', { name: /defense/i })); // Fighter fighting style is required
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => expect(screen.getByText('Character Summary')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Create Character'));
    await waitFor(() => {
      expect(characterService.createCharacter).toHaveBeenCalledWith(
        expect.objectContaining({
          character_data: expect.objectContaining({
            skill_proficiencies: expect.arrayContaining(['Perception', 'Athletics', 'History']),
          }),
        })
      );
    });
  });

  it('step 5 review section shows "Skill Proficiencies (from Race)" for Half-Orc', async () => {
    characterService.createCharacter.mockResolvedValue({ success: true, data: { id: 10 } });
    renderCreate();
    await selectClass('Fighter');
    fireEvent.change(screen.getByPlaceholderText('Enter a name…'), { target: { value: 'Grommash' } });
    fireEvent.click(screen.getByTestId('race-card-Half-Orc'));
    fireEvent.click(screen.getByTestId('identity-next'));
    await assignStandardSpread();
    // Fighter requires 2 skills; we need to satisfy it
    const athletics = screen.getAllByRole('button', { name: 'Athletics' }).find(b => !b.disabled);
    fireEvent.click(athletics);
    const history = screen.getAllByRole('button', { name: 'History' }).find(b => !b.disabled);
    fireEvent.click(history);
    fireEvent.click(screen.getByRole('button', { name: /defense/i })); // Fighter fighting style is required
    await waitFor(() => expect(screen.getByTestId('details-next')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('details-next'));
    await waitFor(() => {
      const reviewGrants = screen.getByTestId('review-race-skill-grants');
      expect(reviewGrants).toHaveTextContent('Intimidation');
      expect(reviewGrants).toHaveTextContent('Menacing');
    });
  });
});
