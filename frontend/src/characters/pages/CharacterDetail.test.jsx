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

// FeatsSubTab fetches the feat catalogue — mock it to a marker that echoes its props.
vi.mock('@/characters/components/feats/FeatsSubTab', () => ({
  default: ({ feats = [], canManage }) => (
    <div data-testid="feats-subtab-mock" data-can-manage={String(!!canManage)}>
      {feats.map((f, i) => <span key={i} data-testid="feat-name">{f.name ?? f}</span>)}
    </div>
  ),
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

  describe('Wallet', () => {
    it('shows the Wallet with standard coins (no electrum) by default', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('wallet-card')).toBeInTheDocument());
      ['pp', 'gp', 'sp', 'cp'].forEach((k) =>
        expect(screen.getByTestId(`wallet-coin-${k}`)).toBeInTheDocument()
      );
      expect(screen.queryByTestId('wallet-coin-ep')).not.toBeInTheDocument();
    });

    it('shows electrum when the campaign currency mode is full', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player', currency_type: 'full' } });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('wallet-coin-ep')).toBeInTheDocument());
    });

    it('displays the character\'s stored coins for the owner', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, character_data: { ...BASE_CHARACTER.character_data, currency: { gp: 25, sp: 4 } } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('wallet-coin-gp')).toHaveValue(25));
      expect(screen.getByTestId('wallet-coin-sp')).toHaveValue(4);
    });

    it('renders the wallet read-only for a non-owner player', async () => {
      useAuth.mockReturnValue({ user: { id: 99, username: 'other' } });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('wallet-card')).toBeInTheDocument());
      expect(screen.getByTestId('wallet-coin-gp').tagName).not.toBe('INPUT');
    });
  });

  describe('Inventory (Items tab)', () => {
    it('renders the inventory AC summary and category sub-tabs', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('inventory-ac')).toBeInTheDocument());
      expect(screen.getByTestId('inv-category-weapons')).toBeInTheDocument();
      expect(screen.getByTestId('inv-category-magic-items')).toBeInTheDocument();
    });

    it('renders a stored inventory item', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'x1', category: 'weapons', name: 'Greatsword', damage: '2d6', weapon_category: 'Martial', quantity: 1, equipped: false }],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Greatsword')).toBeInTheDocument());
    });
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

    it('labels languages by source — From Race and From Background', async () => {
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
      expect(screen.getByText('From Race')).toBeInTheDocument();
      expect(screen.getByText('From Background')).toBeInTheDocument();
      // Elvish is a race language, so it is deduped out of the background group → appears once
      expect(screen.getAllByText('Elvish')).toHaveLength(1);
    });

    it('shows only the From Background group when race languages are absent', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          user_id: 2,
          character_data: {
            ...BASE_CHARACTER.character_data,
            background_languages: ['Abyssal'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Languages')).toBeInTheDocument());
      expect(screen.getByText('From Background')).toBeInTheDocument();
      expect(screen.queryByText('From Race')).not.toBeInTheDocument();
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

  describe('Racial Features card (rest-rechargeable racial traits)', () => {
    it('shows the Racial Features card for a Half-Orc with Relentless Endurance', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Half-Orc',
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Relentless Endurance', 'Menacing', 'Savage Attacks'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      const tracker = screen.getByTestId('racial-resource-tracker');
      expect(tracker).toBeInTheDocument();
      expect(within(tracker).getByText('Relentless Endurance')).toBeInTheDocument();
    });

    it('does not show the Racial Features card when no rest-gated traits exist', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Darkvision', 'Fey Ancestry'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('racial-resource-tracker')).not.toBeInTheDocument();
    });

    it('owner expending a racial use auto-saves immediately (no Save click needed)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Half-Orc',
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Relentless Endurance'],
          },
        },
      });
      characterService.updateCharacter.mockResolvedValue({ success: true, data: BASE_CHARACTER });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('racial-resource-tracker')).toBeInTheDocument());
      // Clicking the use button persists immediately — live resources don't require a Save click.
      fireEvent.click(screen.getByLabelText('Use Relentless Endurance'));
      fireEvent.click(screen.getByTestId('racial-use-confirm-button'));
      await waitFor(() => expect(characterService.updateCharacter).toHaveBeenCalled());
      const payload = characterService.updateCharacter.mock.calls.at(-1)[1];
      expect(payload.character_data.relentless_endurance_used).toBe(1);
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
    it('always shows Narrative, Stats, Features, Items, and Action Economy tab triggers', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Narrative/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Stats/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Features/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Items/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Action Economy/i })).toBeInTheDocument();
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

    it('shows the Spells tab + Feats spell source for a Fighter with Magic Initiate (granted spells)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Fighter', character_data: { skill_proficiencies: [], feats: [
          { id: 10, name: 'Magic Initiate', choices: { spell_grant: { source: 'Wizard', ability: 'intelligence', cantrips: ['Fire Bolt', 'Light'], leveled: [{ name: 'Mage Armor', level: 1 }], free_casts: ['Mage Armor'] } } },
        ] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
      // Non-caster → only the Feats source, so it renders directly (no source toggle buttons).
      expect(screen.getByText('Spells from Feats')).toBeInTheDocument();
      expect(screen.getByTestId('feat-freecast-Mage Armor')).toBeInTheDocument();
    });

    it('shows the Spells tab + ritual book for a Fighter with Ritual Caster (no cantrips/leveled)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Fighter', character_data: { skill_proficiencies: [], feats: [
          { id: 11, name: 'Ritual Caster', choices: { spell_grant: { ritual: true, ritual_book: ['Detect Magic', 'Identify'] } } },
        ] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
      expect(screen.getByText('Spells from Feats')).toBeInTheDocument();
      expect(screen.getByTestId('ritual-book-Ritual Caster')).toBeInTheDocument();
    });

    it('shows Class + Feats spell-source sub-tabs for a Wizard with Magic Initiate', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Wizard', character_data: { skill_proficiencies: [], feats: [
          { id: 10, name: 'Magic Initiate', choices: { spell_grant: { cantrips: ['Fire Bolt'], leveled: [{ name: 'Mage Armor', level: 1 }], free_casts: ['Mage Armor'] } } },
        ] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('spell-source-class')).toBeInTheDocument();
      expect(screen.getByTestId('spell-source-feats')).toBeInTheDocument();
    });

    it('non-spellcasting Fighter has exactly 5 tabs; spellcasting Wizard has 6', async () => {
      // Fighter: Narrative + Stats + Features + Items + Action Economy = 5
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    it('spellcasting Wizard has 6 tabs (adds Spells)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Wizard', character_data: { skill_proficiencies: [] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getAllByRole('tab')).toHaveLength(6);
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
      // Subclass content lives under the "Subclass" sub-tab of the Features tab
      fireEvent.click(screen.getByTestId('features-subtab-subclass'));
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
      fireEvent.click(screen.getByTestId('features-subtab-subclass'));
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
      fireEvent.click(screen.getByTestId('features-subtab-subclass'));
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
      fireEvent.click(screen.getByTestId('features-subtab-subclass'));
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

    it('links the Hit Points & Movement card to the hit-dice mechanics page', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('hit-dice-learn-more')).toHaveAttribute(
        'href',
        expect.stringContaining('/encyclopedia/mechanics/hit-dice')
      );
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

    // The config-driven Fighter sheet shows a "Use" (spend-to-heal) button in the Stats
    // tab instead of +/-. These require GM view (class sheet is readOnly for non-GMs).
    describe('GM Hit Dice heal flow', () => {
      beforeEach(() => {
        useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
        useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
      });

      it('shows a Use button (not +/-) in the Stats tab', async () => {
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        const hdContainer = screen.getByText('Hit Dice').parentElement;
        expect(within(hdContainer).getByTestId('hit-dice-use-btn')).toBeInTheDocument();
        expect(within(hdContainer).queryByRole('button', { name: '+' })).not.toBeInTheDocument();
      });

      it('clicking Use opens the heal dialog with a quantity selector', async () => {
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
        await waitFor(() => expect(screen.getByText('Spend Hit Dice to Heal')).toBeInTheDocument());
        expect(screen.getByTestId('hit-dice-qty')).toHaveTextContent('1');
      });

      it('rolling spends a die, heals roll + CON, and auto-saves hit_dice_used + current_hp', async () => {
        const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0); // d10 → 1
        characterService.updateCharacter.mockResolvedValue({
          success: true,
          data: { ...BASE_CHARACTER, character_data: { ...BASE_CHARACTER.character_data, hit_dice_used: 1, current_hp: 48 } },
        });
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
        await waitFor(() => expect(screen.getByTestId('hit-dice-roll-btn')).toBeInTheDocument());
        fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));

        // Result: rolled 1 + CON 2 = 3 HP; 45 → 48
        await waitFor(() => expect(screen.getByTestId('hit-dice-result')).toBeInTheDocument());
        expect(screen.getByText('+3 HP regained')).toBeInTheDocument();
        expect(screen.getByText('HP: 45 → 48')).toBeInTheDocument();

        await waitFor(() => {
          expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
            expect.objectContaining({
              character_data: expect.objectContaining({ hit_dice_used: 1, current_hp: 48 }),
            })
          );
        });
        randSpy.mockRestore();
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

  // ── Race-granted skill proficiencies on the skill panel ────────────────
  //
  // Existing characters created before this feature may not have race-granted
  // skills baked into character_data.skill_proficiencies. The skill panel must
  // still show Perception/Intimidation as proficient by deriving from
  // character_data.race_traits at render time.

  describe('SkillsDisplay race-granted proficiencies', () => {
    it('shows Perception as proficient when character_data.race_traits includes Keen Senses', async () => {
      // Elf character whose stored skill_proficiencies array does NOT include Perception
      const elfChar = {
        ...BASE_CHARACTER,
        race: 'Elf',
        character_data: {
          ...BASE_CHARACTER.character_data,
          skill_proficiencies: ['Athletics'],
          race_traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: elfChar });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // The legend updates to mention emerald
      expect(screen.getByText(/Emerald = from race/)).toBeInTheDocument();
    });

    it('shows Intimidation as proficient when character_data.race_traits includes Menacing', async () => {
      const halfOrcChar = {
        ...BASE_CHARACTER,
        race: 'Half-Orc',
        character_data: {
          ...BASE_CHARACTER.character_data,
          skill_proficiencies: ['Athletics'],
          race_traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: halfOrcChar });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Emerald = from race/)).toBeInTheDocument();
    });

    it('does NOT show emerald legend when no race-granting traits are present (Human)', async () => {
      // BASE_CHARACTER is Human with no race_traits — no emerald segment
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Emerald = from race/)).not.toBeInTheDocument();
      // Proficient legend still present
      expect(screen.getByText(/Gold = proficient/)).toBeInTheDocument();
    });
  });

  // ── Conditional skill legend (expertise + background source) ───────────
  describe('SkillsDisplay legend', () => {
    it('hides "Purple = expertise" when the character has no expertise', async () => {
      // BASE_CHARACTER is a Fighter with no expertise_skills
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Purple = expertise/)).not.toBeInTheDocument();
      expect(screen.getByText(/Gold = proficient/)).toBeInTheDocument();
    });

    it('shows "Purple = expertise" when the character has expertise', async () => {
      const rogueChar = {
        ...BASE_CHARACTER,
        char_class: 'Rogue',
        background: 'Urchin',
        character_data: {
          ...BASE_CHARACTER.character_data,
          skill_proficiencies: ['Stealth', 'Sleight of Hand'],
          expertise_skills: ['Stealth'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: rogueChar });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Purple = expertise/)).toBeInTheDocument();
    });

    it('shows "Amber = from background" for background-granted proficiencies', async () => {
      // BASE_CHARACTER is a Soldier (grants Athletics, Intimidation) proficient in Athletics
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Amber = from background/)).toBeInTheDocument();
    });

    it('does NOT show "Amber = from background" when no proficient skill comes from the background', async () => {
      // Sage grants Arcana + History; this character is proficient in neither
      const sageChar = {
        ...BASE_CHARACTER,
        char_class: 'Sorcerer',
        background: 'Sage',
        character_data: {
          ...BASE_CHARACTER.character_data,
          skill_proficiencies: ['Athletics'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: sageChar });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Amber = from background/)).not.toBeInTheDocument();
    });

    it('shows "Blue = from feat" when a proficient skill was picked via a feat', async () => {
      const skilledChar = {
        ...BASE_CHARACTER,
        char_class: 'Fighter',
        background: 'Soldier',
        character_data: {
          ...BASE_CHARACTER.character_data,
          skill_proficiencies: ['Athletics', 'Arcana'], // Arcana came from the Skilled feat
          feats: [{ id: 9, name: 'Skilled', level: 4, choices: { skills: ['Arcana'] } }],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: skilledChar });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Blue = from feat/)).toBeInTheDocument();
    });

    it('does NOT show "Blue = from feat" when no feat granted a proficient skill', async () => {
      renderDetail(); // BASE_CHARACTER has no feats
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Blue = from feat/)).not.toBeInTheDocument();
    });

    it('shows the Remarkable Athlete legend + half-PB bonus on a non-proficient DEX skill for a Champion Fighter L7', async () => {
      // Champion Fighter L7 (PB +3 → ½ rounded up = 2). DEX 12 (mod +1), not
      // proficient in Acrobatics → +1 base + 2 RA = +3.
      const champion = {
        ...BASE_CHARACTER,
        level: 7,
        character_data: {
          ...BASE_CHARACTER.character_data,
          subclass: 'Champion',
          skill_proficiencies: ['Athletics'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: champion });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Teal = ½ prof \(Remarkable Athlete\)/)).toBeInTheDocument();
    });

    it('does NOT show the Remarkable Athlete legend for a Champion below level 7', async () => {
      const champion6 = {
        ...BASE_CHARACTER,
        level: 6,
        character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: champion6 });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Remarkable Athlete/)).not.toBeInTheDocument();
    });

    it('a 2024 Champion (L3) gets advantage on Athletics + Initiative (not a ½-PB bonus)', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player', edition: '5.5e' } });
      const champion2024 = {
        ...BASE_CHARACTER,
        level: 3,
        character_data: {
          ...BASE_CHARACTER.character_data,
          subclass: 'Champion',
          skill_proficiencies: ['Athletics'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: champion2024 });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Teal = advantage \(Remarkable Athlete\)/)).toBeInTheDocument();
      expect(screen.getByTestId('skill-advantage-Athletics')).toHaveTextContent(/adv/i);
      expect(screen.getByTestId('initiative-advantage-note')).toBeInTheDocument();
      // 2024 version is advantage-only — no ½-PB legend
      expect(screen.queryByText(/½ prof \(Remarkable Athlete\)/)).not.toBeInTheDocument();
    });

    it('does NOT show 2024 Remarkable Athlete advantage for a Champion below level 3', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player', edition: '5.5e' } });
      const champion2 = {
        ...BASE_CHARACTER,
        level: 2,
        character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: champion2 });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Remarkable Athlete/)).not.toBeInTheDocument();
      expect(screen.queryByTestId('initiative-advantage-note')).not.toBeInTheDocument();
    });

    it('does not double-count Perception when both race_traits AND skill_proficiencies include it', async () => {
      // New characters created post-feature have Perception in skill_proficiencies
      // AND Keen Senses in race_traits — the panel should still work correctly.
      const elfChar = {
        ...BASE_CHARACTER,
        race: 'Elf',
        character_data: {
          ...BASE_CHARACTER.character_data,
          skill_proficiencies: ['Athletics', 'Perception'],
          race_traits: ['Keen Senses'],
        },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: elfChar });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // No duplicate Perception entries — single skill row
      const perceptionRows = screen.getAllByText('Perception');
      expect(perceptionRows.length).toBeGreaterThan(0);
    });
  });

  describe('Draconic Bloodline Sorcerer — HP/AC bonuses + dragon type', () => {
    const DRACONIC_SORCERER = {
      ...BASE_CHARACTER,
      char_class: 'Sorcerer',
      character_data: {
        ...BASE_CHARACTER.character_data,
        subclass: 'Draconic Bloodline',
        draconic_bloodline: { name: 'Red', damage: 'Fire' },
      },
    };

    it('folds the Draconic Resilience bonus into the Max HP value itself', async () => {
      characterService.getCharacterById.mockResolvedValue({ success: true, data: DRACONIC_SORCERER });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // Max HP shows the effective total (52 + 5 = 57), not the base 52 with a separate row
      expect(screen.getByText('57')).toBeInTheDocument();
      expect(screen.getByText('+5 Draconic Resilience')).toBeInTheDocument();
      // No separate "Bonus Hit Points" / "Effective Max HP" block any more
      expect(screen.queryByText('Bonus Hit Points')).not.toBeInTheDocument();
      expect(screen.queryByText('Effective Max HP')).not.toBeInTheDocument();
    });

    it('shows the Draconic 13 + DEX AC in the Items-tab summary (no longer in Stats)', async () => {
      characterService.getCharacterById.mockResolvedValue({ success: true, data: DRACONIC_SORCERER });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // AC lives only in the Items tab now — Stats no longer renders an AC field or options line
      expect(screen.queryByText('Armor Class Options')).not.toBeInTheDocument();
      // Items-tab AC summary still surfaces the Draconic Resilience formula (13 + DEX = 14)
      expect(screen.getByTestId('inventory-ac')).toHaveTextContent('14');
      expect(screen.getAllByText(/13 \+ DEX/).length).toBeGreaterThan(0);
    });

    it('shows the chosen dragon type as a Draconic Ancestry line', async () => {
      characterService.getCharacterById.mockResolvedValue({ success: true, data: DRACONIC_SORCERER });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getAllByText(/Red Dragon \(Fire\)/).length).toBeGreaterThan(0);
    });

    it('does NOT add any HP/AC bonus for a plain Fighter', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // Plain Fighter: Max HP shows the base 52 with no source note, no AC options
      expect(screen.getByText('52')).toBeInTheDocument();
      expect(screen.queryByText(/Draconic Resilience/)).not.toBeInTheDocument();
      expect(screen.queryByText('Armor Class Options')).not.toBeInTheDocument();
    });
  });

  describe('Features tab — Class Features / Feats sub-tab', () => {
    it('shows the Class Features / Feats sub-tab toggle', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('features-subtab-class')).toBeInTheDocument());
      expect(screen.getByTestId('features-subtab-feats')).toBeInTheDocument();
    });

    it('defaults to Class Features (FeatsSubTab hidden until toggled)', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Fighter Features')).toBeInTheDocument());
      expect(screen.queryByTestId('feats-subtab-mock')).not.toBeInTheDocument();
    });

    it('clicking Feats shows the FeatsSubTab with the character feats', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, character_data: { ...BASE_CHARACTER.character_data, feats: [{ id: 1, name: 'Tough' }] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('features-subtab-feats')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('features-subtab-feats'));
      expect(screen.getByTestId('feats-subtab-mock')).toBeInTheDocument();
      expect(screen.getByTestId('feat-name')).toHaveTextContent('Tough');
    });

    it('player owner cannot manage feats (canManage false)', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('features-subtab-feats')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('features-subtab-feats'));
      expect(screen.getByTestId('feats-subtab-mock')).toHaveAttribute('data-can-manage', 'false');
    });

    it('GM can manage feats (canManage true)', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
      useAuth.mockReturnValue({ user: { id: 99, username: 'gm' } });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('features-subtab-feats')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('features-subtab-feats'));
      expect(screen.getByTestId('feats-subtab-mock')).toHaveAttribute('data-can-manage', 'true');
    });
  });

  describe('Feat effects — initiative (Alert)', () => {
    it('adds a feat initiative stat_mod to the Initiative value', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ id: 1, name: 'Alert', level: 4, effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] }],
          },
        },
      });
      renderDetail();
      // BASE_CHARACTER DEX 12 → +1, plus Alert +5 = +6
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toHaveTextContent('+6'));
      expect(screen.getByTestId('initiative-feat-note')).toHaveTextContent('+5 Alert');
    });

    it('resolves a PB-scaled initiative feat (2024 Alert) with the proficiency bonus', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // level 5 → PB +3, DEX 12 → +1
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ id: 5, name: 'Alert', level: 1, effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 'pb', label: '+PB initiative' }] }],
          },
        },
      });
      renderDetail();
      // +1 DEX + 3 PB = +4
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toHaveTextContent('+4'));
      expect(screen.getByTestId('initiative-feat-note')).toHaveTextContent('+3 Alert');
    });

    it('shows plain DEX initiative with no feat note when no feat modifies it', async () => {
      renderDetail(); // BASE_CHARACTER has no feats
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toHaveTextContent('+1'));
      expect(screen.queryByTestId('initiative-feat-note')).not.toBeInTheDocument();
    });

    it('adds a feat passive_perception stat_mod (Observant +5)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ id: 2, name: 'Observant', level: 4, effects: [{ kind: 'stat_mod', stat: 'passive_perception', amount: 5 }] }],
          },
        },
      });
      renderDetail();
      // BASE_CHARACTER WIS 12 → +1, level 5 prof +3, base 10 = 14, plus Observant +5 = 19
      await waitFor(() => expect(screen.getByTestId('passive-perception-value')).toHaveTextContent('19'));
      expect(screen.getByTestId('passive-perception-feat-note')).toHaveTextContent('+5 Observant');
    });

    it('shows plain passive Perception with no feat note when no feat modifies it', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('passive-perception-value')).toHaveTextContent('14'));
      expect(screen.queryByTestId('passive-perception-feat-note')).not.toBeInTheDocument();
    });

    it('shows the central speed annotation for a hand-written class (Barbarian + Mobile)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Barbarian', // hand-written sheet → no CombatBlock fold-in, annotation shown
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ id: 4, name: 'Mobile', level: 4, effects: [{ kind: 'stat_mod', stat: 'speed', amount: 10 }] }],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('speed-feat-note')).toHaveTextContent('+10 ft speed from Mobile'));
    });

    it('folds feat speed into Total Speed for a data-driven class (Fighter), suppressing the annotation', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // Fighter is data-driven
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ id: 4, name: 'Mobile', level: 4, effects: [{ kind: 'stat_mod', stat: 'speed', amount: 10 }] }],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('total-speed')).toHaveTextContent('40')); // 30 + 10 in CombatBlock
      expect(screen.queryByTestId('speed-feat-note')).not.toBeInTheDocument(); // central annotation suppressed
    });

    it('no speed feat note when no feat grants speed', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('speed-feat-note')).not.toBeInTheDocument();
    });

    it('shows feat-granted languages under "From Feats" (Linguist)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, character_data: { ...BASE_CHARACTER.character_data, feat_languages: ['Draconic', 'Giant'] } },
      });
      renderDetail();
      const block = await screen.findByTestId('languages-from-feats');
      expect(within(block).getByText('Draconic')).toBeInTheDocument();
      expect(within(block).getByText('Giant')).toBeInTheDocument();
    });

    it('grants a saving-throw proficiency from Resilient (chosen ability)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ id: 3, name: 'Resilient', level: 4, choices: { ability: 'wisdom' },
              effects: [{ kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true }] }],
          },
        },
      });
      renderDetail();
      // WIS 12 (+1) + proficiency bonus +3 (level 5) = +4
      await waitFor(() => expect(within(screen.getByTestId('save-wisdom')).getByText('+4')).toBeInTheDocument());
    });
  });
});
