import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CharacterDetail from './CharacterDetail';
import characterService from '../characterService';
import settingsService from '../../settings/settingsService';
import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';

vi.mock('../characterService', () => ({
  default: {
    getCharacterById: vi.fn(),
    updateCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
    toggleVisibility: vi.fn(),
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
    getTimelineEvents: vi.fn(),
    createTimelineEvent: vi.fn(),
    removeTimelineEvent: vi.fn(),
    getCharacterNpcs: vi.fn(),
    createCharacterNpc: vi.fn(),
    removeCharacterNpc: vi.fn(),
  },
  mapCharacterImageUrl: (path) => path ? `http://localhost:8000/${path}` : null,
}));

vi.mock('../../settings/settingsService', () => ({
  default: { getCalendar: vi.fn() },
}));

vi.mock('react-markdown', () => ({
  default: ({ children }) => <span data-testid="markdown">{children}</span>,
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

// Render all tab panels unconditionally so tests can find content without clicking tabs
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ value, children }) => <button role="tab" data-value={value}>{children}</button>,
  TabsContent: ({ children }) => <div>{children}</div>,
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
    current_hp: 45, hp_max: 52,
    fighting_style: 'Defense',
    skill_proficiencies: ['Athletics'],
  },
  user_id: 2,
  campaign_id: 1,
  is_visible_to_players: false,
  notes: 'My fighter notes',
  gm_notes: null,
  backstory: null,
  personal_notes: null,
  image_path: null,
  theme_music_url: null,
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
    characterService.getTimelineEvents.mockResolvedValue({ success: true, data: [] });
    characterService.getCharacterNpcs.mockResolvedValue({ success: true, data: [] });
    settingsService.getCalendar.mockResolvedValue(null);
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
    // Ability scores are read-only divs (not inputs); STR=16 in BASE_CHARACTER
    await waitFor(() => expect(screen.getAllByText('16').length).toBeGreaterThan(0));
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
    // Tabs mock renders all panels unconditionally — no tab click needed
    await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
    expect(screen.getByText('Second Wind (Short Rest)')).toBeInTheDocument();
  });

  it('shows class features earned at or below current level and hides future features', async () => {
    // BASE_CHARACTER is a level 5 Fighter
    renderDetail();
    await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
    // "Extra Attack (2 attacks)" is the level 5 Fighter feature name — must be shown
    expect(screen.getAllByText('Extra Attack (2 attacks)').length).toBeGreaterThan(0);
    // Indomitable variants are level 9+ — none should appear at level 5
    expect(screen.queryByText(/Indomitable/)).not.toBeInTheDocument();
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

  describe('Leveling card — milestone mode', () => {
    it('GM sees Level Up button when level_up_pending is false', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'milestone' } });
      useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level_up_pending: false, experience_points: 0 },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Level Up')).toBeInTheDocument());
    });

    it('GM Level Up button calls updateCharacter with level_up_pending:true', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'milestone' } });
      useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level_up_pending: false, experience_points: 0 },
      });
      characterService.updateCharacter.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level_up_pending: true, experience_points: 0 },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Level Up')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Level Up'));
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1', { level_up_pending: true });
      });
    });

    it('owner player sees Level Up Available banner when level_up_pending is true', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player', leveling_type: 'milestone' } });
      useAuth.mockReturnValue({ user: { id: 2, username: 'player' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level_up_pending: true, experience_points: 0 },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText(/Level Up Available/)).toBeInTheDocument());
    });
  });

  describe('Leveling card — experience mode', () => {
    it('shows Experience Points label when leveling_type is experience', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 2 } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, experience_points: 500, level_up_pending: false },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Experience Points')).toBeInTheDocument());
    });

    it('GM sees Add XP input in experience mode', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 1 } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, experience_points: 0, level_up_pending: false },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByPlaceholderText('Add XP…')).toBeInTheDocument());
    });

    it('adds XP and calls updateCharacter with summed total', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 1 } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, experience_points: 100, level_up_pending: false },
      });
      characterService.updateCharacter.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, experience_points: 350, level_up_pending: false },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByPlaceholderText('Add XP…')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Add XP…'), { target: { value: '250' } });
      fireEvent.click(screen.getByText('Add XP'));
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ experience_points: 350 })
        );
      });
    });

    it('sets level_up_pending:true when XP addition crosses next-level threshold', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 1 } });
      // Level 5 — threshold for level 6 is 14000 XP; start at 13900
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level: 5, experience_points: 13900, level_up_pending: false },
      });
      characterService.updateCharacter.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level: 5, experience_points: 14100, level_up_pending: true },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByPlaceholderText('Add XP…')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Add XP…'), { target: { value: '200' } });
      fireEvent.click(screen.getByText('Add XP'));
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ experience_points: 14100, level_up_pending: true })
        );
      });
    });
  });

  describe('subrace and racial data display', () => {
    it('shows subrace badge alongside race in read-only view', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player' } });
      useAuth.mockReturnValue({ user: { id: 3, username: 'other' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Elf',
          user_id: 3,
          character_data: { ...BASE_CHARACTER.character_data, subrace: 'Wood Elf' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Wood Elf')).toBeInTheDocument());
    });

    it('shows subrace label in editable view when character has a subrace', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Dwarf',
          user_id: 2,
          character_data: { ...BASE_CHARACTER.character_data, subrace: 'Hill Dwarf' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText(/Subrace:/)).toBeInTheDocument());
      expect(screen.getByText('Hill Dwarf')).toBeInTheDocument();
    });

    it('shows racial traits when present in character_data', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Elf',
          user_id: 2,
          character_data: {
            ...BASE_CHARACTER.character_data,
            subrace: 'Wood Elf',
            race_traits: ['Darkvision', 'Fey Ancestry', 'Fleet of Foot'],
            race_languages: ['Common', 'Elvish'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Racial Traits')).toBeInTheDocument());
      expect(screen.getByText('Darkvision')).toBeInTheDocument();
      expect(screen.getByText('Fleet of Foot')).toBeInTheDocument();
      expect(screen.getByText('Languages')).toBeInTheDocument();
      expect(screen.getByText('Elvish')).toBeInTheDocument();
    });

    it('does not show racial traits section when character_data has no race_traits', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText('Racial Traits')).not.toBeInTheDocument();
    });

    it('shows background_languages merged with race_languages in Languages section', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          user_id: 2,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_languages: ['Common', 'Elvish'],
            background_languages: ['Draconic', 'Elvish'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Languages')).toBeInTheDocument());
      expect(screen.getByText('Common')).toBeInTheDocument();
      expect(screen.getByText('Elvish')).toBeInTheDocument();
      expect(screen.getByText('Draconic')).toBeInTheDocument();
      // Elvish appears only once (deduped)
      expect(screen.getAllByText('Elvish')).toHaveLength(1);
    });

    it('shows Languages section from background_languages when race_languages is absent', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          user_id: 2,
          character_data: {
            ...BASE_CHARACTER.character_data,
            background_languages: ['Abyssal', 'Celestial'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Languages')).toBeInTheDocument());
      expect(screen.getByText('Abyssal')).toBeInTheDocument();
      expect(screen.getByText('Celestial')).toBeInTheDocument();
    });
  });

  describe('max HP is read-only', () => {
    it('max HP value is displayed from hp_max key in character_data', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // hp_max: 52 — shown as static text in the Fighter sheet HP section
      expect(screen.getByText('52')).toBeInTheDocument();
    });

    it('max HP is not an editable input (no display value for hp_max)', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByDisplayValue('Aldric')).toBeInTheDocument());
      // 52 should not be an input value — it's rendered as a static div
      expect(screen.queryByDisplayValue('52')).not.toBeInTheDocument();
    });
  });

  describe('speed fields', () => {
    it('shows Speed (ft), Speed Bonus (ft), and Total Speed (ft) labels', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Speed (ft)')).toBeInTheDocument();
      expect(screen.getByText('Speed Bonus (ft)')).toBeInTheDocument();
      expect(screen.getByText('Total Speed (ft)')).toBeInTheDocument();
    });

    it('base speed is a static display, not an editable input', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // character_data.speed is undefined → defaults to 30 in the static div
      // should NOT appear as an input value
      expect(screen.queryByDisplayValue('30')).not.toBeInTheDocument();
    });

    it('total speed shows sum of base speed and bonus (both default 30+0=30)', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // Both Speed (ft) and Total Speed (ft) show 30 as static text
      const thirties = screen.getAllByText('30');
      expect(thirties.length).toBeGreaterThanOrEqual(2);
    });

    it('shows correct total speed when character has speed set', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, speed: 35, speed_bonus: 10 },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
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

  describe('tab structure', () => {
    it('always shows Narrative, Stats, Features, and Weapons & Armor tab triggers', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Narrative/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Stats/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Features/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Weapons & Armor/i })).toBeInTheDocument();
    });

    it('does NOT show Spells tab for non-spellcasting Fighter with no race cantrips', async () => {
      renderDetail(); // BASE_CHARACTER is Fighter
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByRole('tab', { name: /Spells/i })).not.toBeInTheDocument();
    });

    it('shows Spells tab trigger for Wizard (spellcasting class)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Wizard', character_data: { skill_proficiencies: [] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
    });

    it('shows Spells tab for Tiefling Fighter (race-granted Thaumaturgy)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, race: 'Tiefling', character_data: { skill_proficiencies: [] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
    });

    it('shows Spells tab for High Elf Fighter with chosen cantrip', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Elf',
          character_data: { skill_proficiencies: [], subrace: 'High Elf', high_elf_cantrip: 'Prestidigitation' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
    });

    it('shows Spells tab for Forest Gnome Fighter (race-granted Minor Illusion)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Gnome',
          character_data: { skill_proficiencies: [], subrace: 'Forest Gnome' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
    });

    it('non-spellcasting Fighter has exactly 4 tabs; spellcasting Wizard has 5', async () => {
      // Fighter: Narrative + Stats + Features + Weapons & Armor = 4
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getAllByRole('tab')).toHaveLength(4);
    });
  });

  describe('level is read-only', () => {
    it('level is not rendered as an editable input in owner view', async () => {
      // level=5; no ability score equals 5 (STR=16, DEX=12, CON=14, INT=10, WIS=12, CHA=8)
      // so queryByDisplayValue('5') returns null only if level is a read-only div, not an input
      renderDetail();
      await waitFor(() => expect(screen.getByDisplayValue('Aldric')).toBeInTheDocument());
      expect(screen.queryByDisplayValue('5')).not.toBeInTheDocument();
    });

    it('level value appears as static text in the character header', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText(/Level 5 Fighter/)).toBeInTheDocument());
    });
  });

  describe('subclass locking', () => {
    beforeEach(() => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
      useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
    });

    it('shows subclass as locked text when character_data.subclass is set (GM view)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // level 5 Fighter — hasSubclass(5) is true
          gm_notes: null,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
      // Tabs mock renders all panels unconditionally — Fighter Features is always in the DOM
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      // Locked: subclass name rendered as plain text
      expect(screen.getByText('Champion')).toBeInTheDocument();
      // Picker hidden: no SubclassPickerWithDetail info buttons
      expect(screen.queryAllByTestId(/^subclass-info-/).length).toBe(0);
    });

    it('shows subclass picker when character has no subclass at unlock level (GM view)', async () => {
      // BASE_CHARACTER is level 5 Fighter with no subclass set — picker must appear
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, gm_notes: null },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      // Picker shown: info buttons visible for Fighter subclass options
      expect(screen.getByTestId('subclass-info-Champion')).toBeInTheDocument();
    });

    it('shows subclass flavor text when subclass is locked', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          gm_notes: null,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      expect(screen.getByText(/archetypal Champion focuses on the development/)).toBeInTheDocument();
    });

    it('shows subclass features earned at current level when subclass is locked', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // level 5 Fighter
          gm_notes: null,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      // Improved Critical unlocks at level 3, character is level 5 — must appear
      expect(screen.getByText('Improved Critical')).toBeInTheDocument();
      // Remarkable Athlete unlocks at level 7, character is level 5 — must NOT appear
      expect(screen.queryByText('Remarkable Athlete')).not.toBeInTheDocument();
    });
  });

  describe('Hit Dice Tracker', () => {
    it('shows Hit Dice label in Stats tab', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Hit Dice')).toBeInTheDocument();
    });

    it('shows die type for Fighter (d10)', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // Match only the HitDiceTracker <span> (text starts with d10, not embedded in "1d10")
      const hdContainer = screen.getByText('Hit Dice').parentElement;
      expect(within(hdContainer).getByText(/^d10/)).toBeInTheDocument();
    });

    it('shows remaining / total count when no dice have been used', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // BASE_CHARACTER has no hit_dice_used → 0 used, level 5 → 5 / 5 remaining
      const hdContainer = screen.getByText('Hit Dice').parentElement;
      expect(within(hdContainer).getByText('5 / 5 remaining')).toBeInTheDocument();
    });

    it('shows correct remaining count when hit_dice_used is pre-populated', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, hit_dice_used: 3 },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      const hdContainer = screen.getByText('Hit Dice').parentElement;
      expect(within(hdContainer).getByText('2 / 5 remaining')).toBeInTheDocument();
    });

    // Button interaction tests require GM view — class sheet is readOnly for non-GMs
    // (readOnly = displayAsPlayer || !canEdit; displayAsPlayer is always true for non-GMs)
    describe('GM interactive buttons', () => {
      beforeEach(() => {
        useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
        useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
      });

      it('minus button is disabled when no dice have been used', async () => {
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        const hdContainer = screen.getByText('Hit Dice').parentElement;
        const minusBtn = within(hdContainer).getByRole('button', { name: '−' });
        expect(minusBtn).toBeDisabled();
      });

      it('clicking + updates remaining count and enables Save', async () => {
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        const hdContainer = screen.getByText('Hit Dice').parentElement;
        const plusBtn = within(hdContainer).getByRole('button', { name: '+' });
        expect(plusBtn).not.toBeDisabled();
        fireEvent.click(plusBtn);
        await waitFor(() => expect(within(screen.getByText('Hit Dice').parentElement).getByText('4 / 5 remaining')).toBeInTheDocument());
        expect(screen.getAllByText('Save').length).toBeGreaterThan(0);
      });

      it('clicking + then Save calls updateCharacter with hit_dice_used: 1', async () => {
        characterService.updateCharacter.mockResolvedValue({
          success: true,
          data: { ...BASE_CHARACTER, character_data: { ...BASE_CHARACTER.character_data, hit_dice_used: 1 } },
        });
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());

        const hdContainer = screen.getByText('Hit Dice').parentElement;
        fireEvent.click(within(hdContainer).getByRole('button', { name: '+' }));
        await waitFor(() => expect(screen.getAllByText('Save').length).toBeGreaterThan(0));

        const saveBtns = screen.getAllByText('Save');
        fireEvent.click(saveBtns[0]);

        await waitFor(() => {
          expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
            expect.objectContaining({
              character_data: expect.objectContaining({ hit_dice_used: 1 }),
            })
          );
        });
      });
    });
  });

  describe('Narrative tab — Personal Notes visibility', () => {
    it('character owner sees Personal Notes section', async () => {
      renderDetail(); // user id=2 matches BASE_CHARACTER.user_id=2
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Personal Notes')).toBeInTheDocument();
    });

    it('GM sees Personal Notes section for another player\'s character', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
      useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } }); // GM is not the owner (user_id=2)
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, gm_notes: null },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Personal Notes')).toBeInTheDocument();
    });

    it('non-owner player does NOT see Personal Notes section', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player' } });
      useAuth.mockReturnValue({ user: { id: 3, username: 'other' } }); // not the owner
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, user_id: 2, is_visible_to_players: true },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText('Personal Notes')).not.toBeInTheDocument();
    });

    it('shows Backstory and Public Notes section headings', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Backstory')).toBeInTheDocument();
      expect(screen.getByText('Public Notes')).toBeInTheDocument();
    });
  });

  describe('Related NPCs card', () => {
    it('shows empty state when no NPCs are linked', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('No NPCs linked to this character yet.')).toBeInTheDocument());
    });

    it('shows add NPC toggle button for character owner', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('npcs-toggle')).toBeInTheDocument();
    });

    it('hides add NPC toggle for non-owner player', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player' } });
      useAuth.mockReturnValue({ user: { id: 3, username: 'other' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, user_id: 2, is_visible_to_players: true },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('npcs-toggle')).not.toBeInTheDocument();
    });

    it('shows linked NPC name and relationship when NPCs exist', async () => {
      characterService.getCharacterNpcs.mockResolvedValue({
        success: true,
        data: [{ id: 10, npc_id: 5, npc_name: 'Elara', npc_race: 'Elf', npc_occupation: 'Wizard', npc_image_path: null, relationship_description: 'Childhood mentor' }],
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Elara')).toBeInTheDocument());
      expect(screen.getByText('Childhood mentor')).toBeInTheDocument();
    });

    it('calls createCharacterNpc with correct args on form submit', async () => {
      characterService.createCharacterNpc.mockResolvedValue({
        success: true,
        data: { id: 11, npc_id: 6, npc_name: 'Gordan', npc_race: 'Human', npc_occupation: 'Blacksmith', npc_image_path: null, relationship_description: '' },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('npcs-toggle')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('npcs-toggle'));
      fireEvent.change(screen.getByPlaceholderText('NPC name'), { target: { value: 'Gordan' } });
      fireEvent.click(screen.getByText('Create & Link NPC'));

      await waitFor(() =>
        expect(characterService.createCharacterNpc).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ name: 'Gordan' })
        )
      );
    });

    it('calls removeCharacterNpc and removes NPC from list', async () => {
      characterService.getCharacterNpcs.mockResolvedValue({
        success: true,
        data: [{ id: 10, npc_id: 5, npc_name: 'Elara', npc_race: null, npc_occupation: null, npc_image_path: null, relationship_description: null }],
      });
      characterService.removeCharacterNpc.mockResolvedValue({ success: true });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Elara')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('unlink-npc-10'));
      await waitFor(() =>
        expect(characterService.removeCharacterNpc).toHaveBeenCalledWith('1', 10)
      );
      await waitFor(() => expect(screen.queryByText('Elara')).not.toBeInTheDocument());
    });
  });

  describe('Timeline Events card', () => {
    it('shows empty state when no events are linked', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('No timeline events linked to this character.')).toBeInTheDocument());
    });

    it('shows add event toggle button for character owner', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('timeline-events-toggle')).toBeInTheDocument();
    });

    it('hides add event toggle for non-owner player', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player' } });
      useAuth.mockReturnValue({ user: { id: 3, username: 'other' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, user_id: 2, is_visible_to_players: true },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('timeline-events-toggle')).not.toBeInTheDocument();
    });

    it('shows linked event title when events exist', async () => {
      characterService.getTimelineEvents.mockResolvedValue({
        success: true,
        data: [{ id: 20, event_id: 3, event_title: 'Born in Millhaven', era_dates: [], link_description: null }],
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Born in Millhaven')).toBeInTheDocument());
    });

    it('shows "Unknown date" italic for events with no era_dates', async () => {
      characterService.getTimelineEvents.mockResolvedValue({
        success: true,
        data: [{ id: 20, event_id: 3, event_title: 'Ancient event', era_dates: [], link_description: null }],
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Ancient event')).toBeInTheDocument());
      expect(screen.getByText('Unknown date')).toBeInTheDocument();
    });

    it('calls createTimelineEvent with correct args on form submit', async () => {
      characterService.createTimelineEvent.mockResolvedValue({
        success: true,
        data: { id: 21, event_id: 4, event_title: 'Joined the guild', era_dates: [], link_description: null },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('timeline-events-toggle')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('timeline-events-toggle'));
      fireEvent.change(screen.getByPlaceholderText(/Born in the village/), { target: { value: 'Joined the guild' } });
      fireEvent.click(screen.getByText('Create Event'));

      await waitFor(() =>
        expect(characterService.createTimelineEvent).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ title: 'Joined the guild' })
        )
      );
    });

    it('calls removeTimelineEvent and removes event from list', async () => {
      characterService.getTimelineEvents.mockResolvedValue({
        success: true,
        data: [{ id: 20, event_id: 3, event_title: 'Born in Millhaven', era_dates: [], link_description: null }],
      });
      characterService.removeTimelineEvent.mockResolvedValue({ success: true });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Born in Millhaven')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('unlink-event-20'));
      await waitFor(() =>
        expect(characterService.removeTimelineEvent).toHaveBeenCalledWith('1', 20)
      );
      await waitFor(() => expect(screen.queryByText('Born in Millhaven')).not.toBeInTheDocument());
    });
  });
});
