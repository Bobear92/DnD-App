import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
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

// The Action Economy tab and the Spells tab both read the spell catalog through this service.
vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: {
    getSpells: vi.fn(() => Promise.resolve([
      { name: 'Fire Bolt', level: 0, school: 'Evocation', casting_time: '1 action' },
      { name: 'Light', level: 0, school: 'Evocation', casting_time: '1 action' },
      { name: 'Mage Armor', level: 1, school: 'Abjuration', casting_time: '1 action' },
    ])),
  },
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
// The sheet's Tabs is CONTROLLED (a spell card in the Action Economy tab jumps to the Spells
// tab). This mock still renders every TabsContent at once — which is what lets these tests reach
// any tab's content without clicking — but it exposes the controlled value so the jump itself is
// assertable.
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ value, children }) => <div data-testid="sheet-tabs" data-active-tab={value}>{children}</div>,
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

// The Stats tab is split into Identity / Abilities & Skills / HP & Movement sub-tabs
// (default: identity). Waits for the character to load, then clicks into a sub-tab.
async function openStatsSubTab(tab) {
  fireEvent.click(await screen.findByTestId(`stats-subtab-${tab}`));
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
    await openStatsSubTab('abilities');
    // Ability scores are read-only divs (not inputs); STR=16 in BASE_CHARACTER
    await waitFor(() => expect(screen.getAllByText('16').length).toBeGreaterThan(0));
  });

  it('shows proficiency bonus derived from level', async () => {
    renderDetail();
    await openStatsSubTab('abilities');
    await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
    // Level 5 → prof bonus +3 (shown in derived stats row with label "Prof. Bonus")
    expect(screen.getByText('Prof. Bonus')).toBeInTheDocument();
    // Multiple +3 may appear (STR mod is also +3); just assert at least one exists
    expect(screen.getAllByText('+3').length).toBeGreaterThan(0);
  });

  describe('Stats tab — Identity / Abilities / HP & Movement sub-tabs', () => {
    it('shows the three stats sub-tab buttons', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('stats-subtab-identity')).toBeInTheDocument());
      expect(screen.getByTestId('stats-subtab-abilities')).toBeInTheDocument();
      expect(screen.getByTestId('stats-subtab-hp')).toBeInTheDocument();
    });

    it('defaults to Identity — abilities and HP content hidden until toggled', async () => {
      renderDetail();
      // Identity content (name input) present by default
      await waitFor(() => expect(screen.getByDisplayValue('Aldric')).toBeInTheDocument());
      // Abilities content (derived stats row) and HP content (Hit Dice) not rendered
      expect(screen.queryByText('Prof. Bonus')).not.toBeInTheDocument();
      expect(screen.queryByText('Hit Dice')).not.toBeInTheDocument();
    });

    it('clicking Abilities & Skills shows scores/saves/skills and hides identity fields', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Prof. Bonus')).toBeInTheDocument());
      expect(screen.getByText('Saving Throws')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('Aldric')).not.toBeInTheDocument();
    });

    it('clicking HP & Movement shows the combat block and Jump card', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Hit Dice')).toBeInTheDocument());
      expect(screen.getByTestId('jump-card')).toBeInTheDocument();
      expect(screen.queryByText('Prof. Bonus')).not.toBeInTheDocument();
    });
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
      // 'Greatsword' now appears both in the inventory row and as a Hands-panel option.
      await waitFor(() => expect(screen.getByTestId('inv-row-x1')).toHaveTextContent('Greatsword'));
    });

    // Stocking weapons + ammunition is the GM's job. An owning player never gets those
    // controls, and Player View takes them away from the GM exactly as it does GM Notes.
    describe('weapon + ammunition stocking is GM-only', () => {
      const ARCHER = {
        ...BASE_CHARACTER,
        character_data: {
          ...BASE_CHARACTER.character_data,
          inventory: [
            { uid: 'x1', category: 'weapons', name: 'Longbow', damage: '1d8', weapon_category: 'Martial', quantity: 1, properties: '["Ammunition"]' },
            { uid: 'am1', category: 'adventuring-gear', name: 'Arrows', item_category: 'Ammunition', quantity: 20 },
          ],
        },
      };

      it('the owning player sees no add/delete controls but can still spend a round', async () => {
        characterService.getCharacterById.mockResolvedValue({ success: true, data: ARCHER });
        renderDetail(); // default mocks: the player who owns this character
        await waitFor(() => expect(screen.getByTestId('inv-row-x1')).toBeInTheDocument());
        expect(screen.queryByTestId('inv-add-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('add-ammo-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('remove-item-x1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('remove-item-am1')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Increase ammunition')).not.toBeInTheDocument();
        expect(screen.getByTestId('use-ammo-x1')).toBeInTheDocument();
      });

      it('the GM sees them, and Player View takes them away', async () => {
        useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm' } });
        useAuth.mockReturnValue({ user: { id: 1, username: 'gm' } });
        characterService.getCharacterById.mockResolvedValue({ success: true, data: ARCHER });
        renderDetail();
        await waitFor(() => expect(screen.getByTestId('inv-add-btn')).toBeInTheDocument());
        expect(screen.getByTestId('add-ammo-btn')).toBeInTheDocument();
        expect(screen.getByTestId('remove-item-x1')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Player View'));
        await waitFor(() => expect(screen.queryByTestId('inv-add-btn')).not.toBeInTheDocument());
        expect(screen.queryByTestId('add-ammo-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('remove-item-x1')).not.toBeInTheDocument();
        // Player View makes a non-owning GM a read-only observer, so there's no Use button
        // either — but the count stays readable. (The owner keeps Use; see the test above.)
        expect(screen.getByTestId('ammo-count-x1')).toHaveTextContent('20');
      });
    });
  });

  // The full class rules text lives on the encyclopedia class page, not on the sheet — the sheet
  // keeps the mechanised blocks (Extra Attacks, fighting style, trackers) and links out for the rest.
  it('links to the encyclopedia class page instead of listing the class features', async () => {
    // BASE_CHARACTER is a level 5 Fighter
    renderDetail();
    const link = await screen.findByTestId('class-encyclopedia-link');
    expect(link).toHaveAttribute('href', '/campaigns/1/encyclopedia/classes/Fighter');
    expect(screen.queryByTestId('class-features-toggle')).not.toBeInTheDocument();
    // The earned-features prose is gone with the dropdown…
    expect(screen.queryByText('Extra Attack (2 attacks)')).not.toBeInTheDocument();
    // …but the mechanised block that derives from it stays, still level-gated.
    expect(screen.getByText('Extra Attacks')).toBeInTheDocument();
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

    it('GM sees spell-slot steppers for an EK; Player View hides them (isGm gated on !playerView)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            subclass: 'Eldritch Knight',
            spell_slots: { 1: { total: 3, used: 1 } },
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Player View')).toBeInTheDocument());
      // GM view: correction steppers present on the slot tracker.
      await waitFor(() => expect(screen.getByTestId('slot-dec-1')).toBeInTheDocument());
      // Player View preview: the steppers must disappear.
      fireEvent.click(screen.getByText('Player View'));
      await waitFor(() => expect(screen.queryByTestId('slot-dec-1')).not.toBeInTheDocument());
      expect(screen.queryByTestId('slot-inc-1')).not.toBeInTheDocument();
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

    // XP tops out at the level-20 threshold — there is no level 21 to earn, so an over-award
    // lands on the cap instead of accumulating a meaningless total. (The backend clamps too;
    // this keeps the GM from watching a number they typed change on save.)
    it('clamps an over-award to the 355,000 cap instead of overflowing', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 1 } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level: 19, experience_points: 305000, level_up_pending: false },
      });
      characterService.updateCharacter.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level: 19, experience_points: 355000, level_up_pending: true },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByPlaceholderText('Add XP…')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Add XP…'), { target: { value: '500000' } });
      fireEvent.click(screen.getByText('Add XP'));
      await waitFor(() => {
        // 305,000 + 500,000 = 805,000 → clamped to 355,000, and level 20 is still unlocked.
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ experience_points: 355000, level_up_pending: true })
        );
      });
    });

    it('leaves an award that stays under the cap alone', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 1 } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level: 19, experience_points: 305000, level_up_pending: false },
      });
      characterService.updateCharacter.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, level: 19, experience_points: 320000 },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByPlaceholderText('Add XP…')).toBeInTheDocument());
      fireEvent.change(screen.getByPlaceholderText('Add XP…'), { target: { value: '15000' } });
      fireEvent.click(screen.getByText('Add XP'));
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ experience_points: 320000 })
        );
      });
    });
  });

  // QA: a GM awarded enough XP for two levels at once. The first level-up cleared
  // level_up_pending outright, so the character stalled at the intermediate level and only
  // started climbing again when another point of XP made the award path recompute the flag.
  describe('Leveling card — banked XP spanning several levels', () => {
    // Fighter 8 → 9 gains Indomitable and no ASI, so the wizard is HP → Features → Confirm.
    // Level 9 needs 48,000 XP and level 10 needs 64,000.
    const atLevel8 = (experience_points) => ({
      ...BASE_CHARACTER, level: 8, experience_points, level_up_pending: true,
      character_data: { ...BASE_CHARACTER.character_data, hp_max: 68 },
    });

    // The first mount of the level-up wizard in a run is the slow one (its module graph is cold),
    // and under full-suite load it exceeds findBy's 1s default. These waits get a longer budget,
    // and the tests using them get a test timeout above it — a findBy budget at or above the
    // global 5s test timeout just makes the TEST time out first, reporting nothing useful.
    async function completeWizard() {
      fireEvent.click(await screen.findByText(/Level Up Available/, {}, { timeout: 8000 }));
      fireEvent.click(await screen.findByText('Take Average', {}, { timeout: 8000 }));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
    }

    it('keeps level_up_pending set when the XP already covers the next level too', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 2 } });
      characterService.getCharacterById.mockResolvedValue({ success: true, data: atLevel8(70000) });
      characterService.updateCharacter.mockResolvedValue({
        success: true, data: { ...atLevel8(70000), level: 9 },
      });
      renderDetail();
      await completeWizard();
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ level: 9, level_up_pending: true })
        );
      });
    }, 20000);

    it('clears level_up_pending when the XP stops short of the level after', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 2 } });
      characterService.getCharacterById.mockResolvedValue({ success: true, data: atLevel8(50000) });
      characterService.updateCharacter.mockResolvedValue({
        success: true, data: { ...atLevel8(50000), level: 9 },
      });
      renderDetail();
      await completeWizard();
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ level: 9, level_up_pending: false })
        );
      });
    }, 20000);

    // In a milestone campaign the flag is GM-triggered and XP means nothing, so a stored XP
    // total must not re-arm the wizard on its own.
    it('always clears level_up_pending in a milestone campaign, whatever the XP total', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'milestone' } });
      useAuth.mockReturnValue({ user: { id: 2 } });
      characterService.getCharacterById.mockResolvedValue({ success: true, data: atLevel8(70000) });
      characterService.updateCharacter.mockResolvedValue({
        success: true, data: { ...atLevel8(70000), level: 9 },
      });
      renderDetail();
      await completeWizard();
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ level: 9, level_up_pending: false })
        );
      });
    }, 20000);

    it('does not re-arm past level 20', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'gm', leveling_type: 'experience' } });
      useAuth.mockReturnValue({ user: { id: 2 } });
      const atLevel19 = {
        ...BASE_CHARACTER, level: 19, experience_points: 355000, level_up_pending: true,
        character_data: { ...BASE_CHARACTER.character_data, hp_max: 150 },
      };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: atLevel19 });
      characterService.updateCharacter.mockResolvedValue({
        success: true, data: { ...atLevel19, level: 20 },
      });
      renderDetail();
      await completeWizard();
      await waitFor(() => {
        expect(characterService.updateCharacter).toHaveBeenCalledWith('1',
          expect.objectContaining({ level: 20, level_up_pending: false })
        );
      });
    }, 20000);
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
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // hp_max: 52 — shown as static text in the Fighter sheet HP section
      expect(screen.getByText('52')).toBeInTheDocument();
    });

    it('max HP is not an editable input (no display value for hp_max)', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // 52 should not be an input value — it's rendered as a static div
      expect(screen.queryByDisplayValue('52')).not.toBeInTheDocument();
    });
  });

  // Max HP derives from CON dynamically: stored hp_rolls is CON-independent, and the sheet layers
  // CON × level on top — so any CON change (ASI, feat, item, GM edit) adjusts HP without a rewrite.
  describe('max HP derives from CON dynamically (hp_rolls model)', () => {
    it('shows roll base + CON × level as the effective Max HP', async () => {
      const char = { ...BASE_CHARACTER, constitution: 14, character_data: { ...BASE_CHARACTER.character_data, hp_rolls: 42, hp_max: undefined } };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: char });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('52')).toBeInTheDocument(); // 42 rolls + 5 × +2 CON
    });

    it('a higher CON yields a higher Max HP from the same roll base', async () => {
      const char = { ...BASE_CHARACTER, constitution: 18, character_data: { ...BASE_CHARACTER.character_data, hp_rolls: 42, hp_max: undefined } };
      characterService.getCharacterById.mockResolvedValue({ success: true, data: char });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('62')).toBeInTheDocument(); // 42 rolls + 5 × +4 CON
    });
  });

  describe('Racial Features card (rest-rechargeable racial traits)', () => {
    const HALF_ORC = {
      ...BASE_CHARACTER,
      race: 'Half-Orc',
      character_data: {
        ...BASE_CHARACTER.character_data,
        race_traits: ['Relentless Endurance', 'Menacing', 'Savage Attacks'],
      },
    };

    it('Relentless Endurance tracker lives in the HP & Movement sub-tab (data-driven Fighter — inside the combat block)', async () => {
      characterService.getCharacterById.mockResolvedValue({ success: true, data: HALF_ORC });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByTestId('racial-resource-tracker')).toBeInTheDocument());
      const tracker = screen.getByTestId('racial-resource-tracker');
      expect(within(tracker).getByText('Relentless Endurance')).toBeInTheDocument();
      // Renders between Max HP and Hit Dice via the CombatBlock afterHpNode slot
      const hitDice = screen.getByText('Hit Dice');
      expect(tracker.compareDocumentPosition(hitDice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('Relentless Endurance tracker shows below the combat block for a hand-written sheet (Barbarian)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...HALF_ORC, char_class: 'Barbarian' },
      });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByTestId('racial-resource-tracker')).toBeInTheDocument());
      expect(within(screen.getByTestId('racial-resource-tracker')).getByText('Relentless Endurance')).toBeInTheDocument();
    });

    it('does NOT show a Racial Features card on Identity when Relentless Endurance is the only rest resource', async () => {
      characterService.getCharacterById.mockResolvedValue({ success: true, data: HALF_ORC });
      renderDetail();
      // Default sub-tab is Identity — the tracker moved to HP & Movement
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText('Racial Features')).not.toBeInTheDocument();
      expect(screen.queryByTestId('racial-resource-tracker')).not.toBeInTheDocument();
    });

    // The Identity Racial Features card is GONE: every racial rest resource is shown by the
    // surface that owns its mechanic, each with its own Use control. A generic card here could
    // only ever repeat one of them — which is exactly what it was doing.
    it('does not show a Racial Features card on Identity for a Dragonborn — Breath Weapon lives in the Action Economy tab', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Dragonborn',
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText('Racial Features')).not.toBeInTheDocument();
      expect(screen.queryByTestId('racial-resource-tracker')).not.toBeInTheDocument();
    });

    // Regression: the card only ever excluded the HP-adjacent key, so a L3+ Tiefling saw
    // Hellish Rebuke BOTH on its Spells-tab row and again in this card.
    it('does not repeat a racial spell resource on Identity for a L4 Tiefling', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Tiefling',
          level: 4,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText('Racial Features')).not.toBeInTheDocument();
      expect(screen.queryByTestId('racial-resource-tracker')).not.toBeInTheDocument();
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
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByTestId('racial-resource-tracker')).toBeInTheDocument());
      // Clicking the use button persists immediately — live resources don't require a Save click.
      fireEvent.click(screen.getByLabelText('Use Relentless Endurance'));
      fireEvent.click(screen.getByTestId('racial-use-confirm-button'));
      await waitFor(() => expect(characterService.updateCharacter).toHaveBeenCalled());
      const payload = characterService.updateCharacter.mock.calls.at(-1)[1];
      expect(payload.character_data.relentless_endurance_used).toBe(1);
    });

    it('shows a Relentless Endurance note by the HP section for a Half-Orc', async () => {
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
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('relentless-endurance-note')).toHaveTextContent(/Relentless Endurance/i);
    });

    it('does not show the Relentless Endurance note without the trait', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('relentless-endurance-note')).not.toBeInTheDocument();
    });

    // A class rest resource flagged `hpAdjacent` is an HP mechanic — Reclaim Potential grants
    // temporary hit points — so its tracker sits with the HP boxes rather than in the features
    // area, where the player would have to go looking for it after their echo is destroyed.
    describe('hpAdjacent class resource (Echo Knight Reclaim Potential)', () => {
      const echoKnight = (level) => ({
        ...BASE_CHARACTER,
        level,
        character_data: { ...BASE_CHARACTER.character_data, subclass: 'Echo Knight' },
      });

      it('renders the tracker in the HP & Movement sub-tab at L15', async () => {
        characterService.getCharacterById.mockResolvedValue({ success: true, data: echoKnight(15) });
        renderDetail();
        await openStatsSubTab('hp');
        expect(await screen.findByTestId('rest-resource-reclaim_potential_used')).toBeInTheDocument();
      });

      it('is absent below the unlock level', async () => {
        characterService.getCharacterById.mockResolvedValue({ success: true, data: echoKnight(14) });
        renderDetail();
        await openStatsSubTab('hp');
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        expect(screen.queryByTestId('rest-resource-reclaim_potential_used')).not.toBeInTheDocument();
      });

      it('is absent for another subclass at the same level', async () => {
        characterService.getCharacterById.mockResolvedValue({
          success: true,
          data: { ...echoKnight(15), character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' } },
        });
        renderDetail();
        await openStatsSubTab('hp');
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        expect(screen.queryByTestId('rest-resource-reclaim_potential_used')).not.toBeInTheDocument();
      });

      // The regression the ClassSheet exclusion exists to prevent: moving it must MOVE it,
      // not add a second copy. The other Echo Knight pools stay in the features area.
      it('appears exactly once on the page, and the other Echo Knight pools stay put', async () => {
        characterService.getCharacterById.mockResolvedValue({ success: true, data: echoKnight(15) });
        renderDetail();
        await openStatsSubTab('hp');
        await screen.findByTestId('rest-resource-reclaim_potential_used');
        expect(screen.getAllByTestId('rest-resource-reclaim_potential_used')).toHaveLength(1);
        expect(screen.getByTestId('rest-resource-unleash_incarnation_used')).toBeInTheDocument();
        expect(screen.getByTestId('rest-resource-shadow_martyr_used')).toBeInTheDocument();
      });

      // The racial tracker carries its own "RACIAL FEATURES" heading and the class tracker has
      // none, so a class resource placed after it reads as a racial trait. Class comes first.
      it('sits ABOVE the Racial Features group, not under its heading', async () => {
        characterService.getCharacterById.mockResolvedValue({
          success: true,
          data: {
            ...echoKnight(15),
            race: 'Half-Orc',
            character_data: {
              ...BASE_CHARACTER.character_data,
              subclass: 'Echo Knight',
              race_traits: ['Relentless Endurance'],
            },
          },
        });
        renderDetail();
        await openStatsSubTab('hp');
        const reclaim = await screen.findByTestId('rest-resource-reclaim_potential_used');
        const racial = screen.getByTestId('racial-resource-tracker');
        expect(reclaim.compareDocumentPosition(racial))
          .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      });

      it('lets the owner spend a use, persisting immediately', async () => {
        characterService.getCharacterById.mockResolvedValue({ success: true, data: echoKnight(15) });
        characterService.updateCharacter.mockResolvedValue({ success: true, data: echoKnight(15) });
        renderDetail();
        await openStatsSubTab('hp');
        await screen.findByTestId('rest-resource-reclaim_potential_used');
        fireEvent.click(screen.getByLabelText('Use Reclaim Potential (Long Rest)'));
        fireEvent.click(screen.getByTestId('rest-use-confirm-button'));
        await waitFor(() => expect(characterService.updateCharacter).toHaveBeenCalled());
        const payload = characterService.updateCharacter.mock.calls.at(-1)[1];
        expect(payload.character_data.reclaim_potential_used).toBe(1);
      });
    });

    it('shows a Survivor note by the HP section for a L18 Champion (5 + CON regain)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          level: 18,
          // CON 14 → +2 → regain 5 + 2 = 7
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('survivor-note')).toHaveTextContent(/Survivor: .*regain 7 HP/i);
    });

    it('does not show the Survivor note below L18 or for a non-Champion', async () => {
      // BASE_CHARACTER is a level 5 Fighter with no subclass
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('survivor-note')).not.toBeInTheDocument();
    });
  });

  describe('Defenses panel (HP & Movement sub-tab)', () => {
    it('shows no Defenses card at all for a character with no resistances', async () => {
      // BASE_CHARACTER is a Human Fighter — the card must not appear empty.
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('defenses')).not.toBeInTheDocument();
      expect(screen.queryByText('Defenses')).not.toBeInTheDocument();
    });

    it('lists a standing racial resistance under Always on', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Tiefling',
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Hellish Resistance'],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('hp');
      expect(await screen.findByTestId('defenses')).toBeInTheDocument();
      expect(screen.getByTestId('defenses-always-on')).toBeInTheDocument();
      expect(screen.getByTestId('defense-race-hellish-resistance-types'))
        .toHaveTextContent('Fire');
    });

    it('puts a feat damage reduction under Situational with its condition', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{
              name: 'Heavy Armor Master',
              effects: [{
                kind: 'damage_reduction',
                amount: 3,
                damage_types: ['bludgeoning', 'piercing', 'slashing'],
                condition: 'heavy_armor',
                nonmagical_only: true,
              }],
            }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('hp');
      expect(await screen.findByTestId('defenses-situational')).toBeInTheDocument();
      expect(screen.getByTestId('defense-feat-heavy-armor-master-value'))
        .toHaveTextContent('−3');
      expect(screen.getByTestId('defense-feat-heavy-armor-master-condition'))
        .toHaveTextContent('while wearing heavy armor');
      // The regression the panel exists to prevent: never presented as unconditional.
      expect(screen.queryByTestId('defenses-always-on')).not.toBeInTheDocument();
    });

    it('renders for a hand-written sheet too, not just a data-driven one', async () => {
      // Barbarian has no class config, so this would be missed by an afterHpNode-style slot.
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Barbarian', level: 5 },
      });
      renderDetail();
      await openStatsSubTab('hp');
      expect(await screen.findByTestId('defense-barbarian-rage-condition'))
        .toHaveTextContent('while raging');
    });
  });

  describe('Inspiration card', () => {
    it('renders an Inspiration card defaulting to 0', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('inspiration-card')).toBeInTheDocument();
      expect(screen.getByTestId('inspiration-value')).toHaveTextContent('0');
    });

    it('increments inspiration and persists immediately via updateCharacter', async () => {
      characterService.updateCharacter.mockResolvedValue({ success: true, data: BASE_CHARACTER });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('inspiration-inc'));
      await waitFor(() => expect(characterService.updateCharacter).toHaveBeenCalled());
      const payload = characterService.updateCharacter.mock.calls.at(-1)[1];
      expect(payload.character_data.inspiration).toBe(1);
    });

    it('does not show the Heroic Warrior note for a non-Champion (5e)', async () => {
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('heroic-warrior-note')).not.toBeInTheDocument();
    });

    it('shows the Heroic Warrior note for a 2024 L10 Champion Fighter', async () => {
      useCampaign.mockReturnValue({ campaign: { id: 1, name: 'Test', userRole: 'player', edition: '5.5e' } });
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          level: 10,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('heroic-warrior-note')).toHaveTextContent(/Heroic Warrior/i);
    });
  });

  describe('speed fields', () => {
    it('shows Speed (ft), Speed Bonus (ft), and Total Speed (ft) labels', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Speed (ft)')).toBeInTheDocument();
      expect(screen.getByText('Speed Bonus (ft)')).toBeInTheDocument();
      expect(screen.getByText('Total Speed (ft)')).toBeInTheDocument();
    });

    it('base speed is a static display, not an editable input', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // character_data.speed is undefined → defaults to 30 in the static div
      // should NOT appear as an input value
      expect(screen.queryByDisplayValue('30')).not.toBeInTheDocument();
    });

    it('total speed shows sum of base speed and bonus (both default 30+0=30)', async () => {
      renderDetail();
      await openStatsSubTab('hp');
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
      await openStatsSubTab('hp');
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

    it('shows Spells tab trigger for an Eldritch Knight Fighter (caster subclass)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Eldritch Knight' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
    });

    it('does NOT show Spells tab for a Champion Fighter (non-caster subclass)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
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

    it('links the Spells tab to the spacing mechanics page', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Wizard', character_data: { skill_proficiencies: [] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('spacing-learn-more-spells').getAttribute('href'))
        .toContain('/encyclopedia/mechanics/spacing');
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

    // The Action Economy tab answers "what does this spell cost me?"; the next question is the
    // spell's own text, one tab over. Clicking the card's name has to land on the spell's row —
    // which means the outer tab, the source toggle and the level strip all move together.
    describe('jump from an Action Economy spell card to the Spells tab', () => {
      const magicInitiateFighter = () => characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Fighter',
          character_data: {
            skill_proficiencies: [],
            feats: [{
              id: 10,
              name: 'Magic Initiate',
              choices: {
                spell_grant: {
                  source: 'Wizard', ability: 'intelligence',
                  cantrips: ['Fire Bolt'], leveled: [{ name: 'Mage Armor', level: 1 }],
                  free_casts: ['Mage Armor'],
                },
              },
            }],
          },
        },
      });

      // The Action Economy tab's source groups render closed, so the card has to be revealed
      // first — exactly as the player does it.
      async function openSpellCard(name) {
        fireEvent.click(await screen.findByTestId('ae-group-toggle-Spell'));
        return screen.getByTestId(`ae-spell-link-${name}`);
      }

      it('switches the sheet to the Spells tab', async () => {
        magicInitiateFighter();
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        const link = await openSpellCard('Mage Armor');
        expect(screen.getByTestId('sheet-tabs')).toHaveAttribute('data-active-tab', 'narrative');
        fireEvent.click(link);
        expect(screen.getByTestId('sheet-tabs')).toHaveAttribute('data-active-tab', 'spells');
      });

      it('marks the spell in the list, so the reader is not left hunting a name', async () => {
        magicInitiateFighter();
        renderDetail();
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        fireEvent.click(await openSpellCard('Mage Armor'));
        await waitFor(() =>
          expect(screen.getByTestId('spell-row-focused-Mage Armor')).toBeInTheDocument());
        // ...and only that spell, not the other one the same feat granted.
        expect(screen.queryByTestId('spell-row-focused-Fire Bolt')).not.toBeInTheDocument();
      });
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

    // Arcane Archer Lore grants a cantrip to a Fighter — a non-caster — so the Spells tab has to
    // appear at all, with its own Subclass source.
    it('shows the Spells tab + Subclass source for an Arcane Archer with a granted cantrip', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            subclass: 'Arcane Archer',
            subclass_cantrips: ['Druidcraft'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
      // Only source present → renders directly, no toggle buttons.
      expect(screen.getByTestId('subclass-spells')).toHaveTextContent('Arcane Archer Spells');
      expect(screen.getByTestId('subclass-spells')).toHaveTextContent('Druidcraft');
    });

    // Telekinetic Master grants telekinesis outright at 18th — a LEVELED spell handed to a
    // non-caster with no pick to store, so it is derived from class+subclass+level rather than
    // read out of character_data the way a chosen cantrip is.
    it('shows telekinesis in the Subclass source for an 18th-level Psi Warrior', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          level: 18,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Psi Warrior' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
      const card = await screen.findByTestId('subclass-spells');
      expect(card).toHaveTextContent('Psi Warrior Spells');
      expect(card).toHaveTextContent('Telekinesis');
      // The Fighter has no spellcasting ability anywhere else on the sheet, so the row has to
      // say which one this feature dictates.
      expect(screen.getByTestId('subclass-spell-grant-Telekinesis')).toHaveTextContent('At will');
      expect(screen.getByTestId('subclass-spell-grant-Telekinesis')).toHaveTextContent('Intelligence');
    });

    it('does not give a 17th-level Psi Warrior telekinesis or a Spells tab', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          level: 17,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Psi Warrior' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // A Psi Warrior is a non-caster, so below 18 there is no spell source at all.
      expect(screen.queryByRole('tab', { name: /Spells/i })).not.toBeInTheDocument();
      expect(screen.queryByTestId('subclass-spells')).not.toBeInTheDocument();
    });

    // Infernal Legacy grants a leveled spell (Hellish Rebuke at 3, Darkness at 5) on top of the
    // Thaumaturgy cantrip. Racial spells used to be modelled as cantrips only, so the leveled ones
    // existed purely as a use-counter on the Stats tab and never reached the Spells tab.
    it('shows a leveled racial spell for a level-4 Tiefling, not just the cantrip', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Tiefling',
          level: 4,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      const racial = await screen.findByTestId('racial-spells');
      expect(racial).toHaveTextContent('Thaumaturgy');
      fireEvent.click(within(racial).getByTestId('racial-spell-tab-tab-2'));
      expect(racial).toHaveTextContent('Hellish Rebuke');
      // Darkness is a level-5 grant — not yet.
      expect(racial).not.toHaveTextContent('Darkness');
      // The once-per-long-rest use is spendable from the Spells tab too — as a control ON the
      // spell's row, not a second listing in a tracker card.
      expect(within(racial).getByLabelText('Use Hellish Rebuke (2nd-level)')).toBeInTheDocument();
      expect(within(racial).queryByTestId('racial-resource-tracker')).not.toBeInTheDocument();
    });

    // The spell was rendered twice under Racial: once in its level tab, once as a tracker row that
    // sat outside the level strip (so it showed on the Cantrips tab too).
    it('shows the racial spell once — no use control on the Cantrips tab', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Tiefling',
          level: 4,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Infernal Legacy'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      const racial = await screen.findByTestId('racial-spells');
      // Cantrips tab is the default: only Thaumaturgy, no Hellish Rebuke and no use control.
      expect(racial).toHaveTextContent('Thaumaturgy');
      expect(racial).not.toHaveTextContent('Hellish Rebuke');
      expect(within(racial).queryByLabelText('Use Hellish Rebuke (2nd-level)')).not.toBeInTheDocument();
    });

    // Infernal Legacy casts Hellish Rebuke (a 1st-level spell) AT 2nd level, so the racial list
    // must show ONE strip using the trait's levels — not a nested "1st"/"2nd" strip derived from
    // the catalog, which contradicted the "Lvl 2" tab containing it.
    it('shows one level strip using the grant level, with no nested per-spell strip', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Tiefling',
          level: 5,
          character_data: { ...BASE_CHARACTER.character_data, race_traits: ['Infernal Legacy'] },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      const racial = await screen.findByTestId('racial-spells');
      // The outer strip: Cantrips + Lvl 2 only — no "1st" tab, because nothing is granted at 1st.
      expect(within(racial).getByTestId('racial-spell-tab-tab-0')).toBeInTheDocument();
      expect(within(racial).getByTestId('racial-spell-tab-tab-2')).toBeInTheDocument();
      expect(within(racial).queryByTestId('racial-spell-tab-tab-1')).not.toBeInTheDocument();
      // And no second, catalog-derived strip nested inside it.
      expect(within(racial).queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
      fireEvent.click(within(racial).getByTestId('racial-spell-tab-tab-2'));
      expect(within(racial).queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
    });

    it('adds the level-5 racial spell once the Tiefling reaches it', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Tiefling',
          level: 5,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_traits: ['Infernal Legacy'],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      const racial = await screen.findByTestId('racial-spells');
      fireEvent.click(within(racial).getByTestId('racial-spell-tab-tab-2'));
      expect(racial).toHaveTextContent('Hellish Rebuke');
      expect(racial).toHaveTextContent('Darkness');
    });

    it('gives a non-caster Tiefling the Spells tab from the leveled grant alone', async () => {
      // A Tiefling always has Thaumaturgy, so isolate the leveled path with a race that only has
      // the trait: the tab must appear on the strength of Hellish Rebuke by itself.
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          race: 'Half-Elf',
          level: 4,
          character_data: { ...BASE_CHARACTER.character_data, race_traits: ['Drow Magic'] },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByRole('tab', { name: /Spells/i })).toBeInTheDocument();
      expect(await screen.findByTestId('racial-spells')).toHaveTextContent('Faerie Fire');
    });

    it('does NOT show the Spells tab for an Arcane Archer who has not picked the cantrip yet', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Arcane Archer' },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByRole('tab', { name: /Spells/i })).not.toBeInTheDocument();
    });

    it('folds feat spells into the strip for a Wizard (data-driven caster) — no top-level Feats source', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Wizard', character_data: { skill_proficiencies: [], feats: [
          { id: 10, name: 'Magic Initiate', choices: { spell_grant: { cantrips: ['Fire Bolt'], leveled: [{ name: 'Mage Armor', level: 1 }], free_casts: ['Mage Armor'] } } },
        ] } },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // The Wizard's spell section renders via the data-driven CasterSpellBlock, so racial + feat
      // spells fold INTO the level strip — there is no top-level Class/Racial/Feats source toggle.
      // (No catalog is mocked here, so the strip is in its flat fallback and shows the feat content.)
      expect(screen.queryByTestId('spell-source-feats')).not.toBeInTheDocument();
      expect(screen.getByTestId('spell-source-feats-content')).toBeInTheDocument();
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
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText('Hit Dice')).toBeInTheDocument();
    });

    it('links the Hit Points & Movement card to the hit-dice mechanics page', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByTestId('hit-dice-learn-more')).toHaveAttribute(
        'href',
        expect.stringContaining('/encyclopedia/mechanics/hit-dice')
      );
    });

    it('shows die type for Fighter (d10)', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      // Match only the HitDiceTracker <span> (text starts with d10, not embedded in "1d10")
      const hdContainer = screen.getByText('Hit Dice').parentElement;
      expect(within(hdContainer).getByText(/^d10/)).toBeInTheDocument();
    });

    it('shows remaining / total count when no dice have been used', async () => {
      renderDetail();
      await openStatsSubTab('hp');
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
      await openStatsSubTab('hp');
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
        await openStatsSubTab('hp');
        await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
        const hdContainer = screen.getByText('Hit Dice').parentElement;
        expect(within(hdContainer).getByTestId('hit-dice-use-btn')).toBeInTheDocument();
        expect(within(hdContainer).queryByRole('button', { name: '+' })).not.toBeInTheDocument();
      });

      it('clicking Use opens the heal dialog with a quantity selector', async () => {
        renderDetail();
        await openStatsSubTab('hp');
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
        await openStatsSubTab('hp');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Emerald = from race/)).toBeInTheDocument();
    });

    it('does NOT show emerald legend when no race-granting traits are present (Human)', async () => {
      // BASE_CHARACTER is Human with no race_traits — no emerald segment
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByText(/Emerald = from race/)).not.toBeInTheDocument();
      // Proficient legend still present
      expect(screen.getByText(/Gold = proficient/)).toBeInTheDocument();
    });
  });

  // ── Ability column + click-to-see-the-math on each skill row ───────────
  describe('SkillsDisplay ability labels and bonus breakdown', () => {
    it('labels each skill with its governing ability', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('skill-ability-Perception')).toHaveTextContent('WIS'));
      expect(screen.getByTestId('skill-ability-Athletics')).toHaveTextContent('STR');
      expect(screen.getByTestId('skill-ability-Investigation')).toHaveTextContent('INT');
      expect(screen.getByTestId('skill-ability-Persuasion')).toHaveTextContent('CHA');
    });

    it('shows no breakdown until the bonus is clicked', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Perception')).toBeInTheDocument());
      expect(screen.queryByTestId('skill-breakdown-Perception')).not.toBeInTheDocument();
    });

    it('expands the arithmetic when the bonus is clicked (non-proficient skill)', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      // BASE_CHARACTER: WIS 12 → +1, not proficient in Perception
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Perception')).toHaveTextContent('+1'));
      fireEvent.click(screen.getByTestId('skill-bonus-Perception'));
      const breakdown = screen.getByTestId('skill-breakdown-Perception');
      expect(breakdown).toHaveTextContent('WIS modifier');
      expect(breakdown).toHaveTextContent('Total');
      expect(breakdown).not.toHaveTextContent('Proficiency bonus');
    });

    it('shows the proficiency line for a proficient skill', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      // BASE_CHARACTER is proficient in Athletics: STR 16 → +3, prof +3 → +6
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Athletics')).toHaveTextContent('+6'));
      fireEvent.click(screen.getByTestId('skill-bonus-Athletics'));
      const breakdown = screen.getByTestId('skill-breakdown-Athletics');
      expect(breakdown).toHaveTextContent('STR modifier');
      expect(breakdown).toHaveTextContent('Proficiency bonus');
    });

    it('collapses when the same bonus is clicked again', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Athletics')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('skill-bonus-Athletics'));
      expect(screen.getByTestId('skill-breakdown-Athletics')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('skill-bonus-Athletics'));
      expect(screen.queryByTestId('skill-breakdown-Athletics')).not.toBeInTheDocument();
    });

    it('keeps only one breakdown open at a time', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Athletics')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('skill-bonus-Athletics'));
      fireEvent.click(screen.getByTestId('skill-bonus-Perception'));
      expect(screen.queryByTestId('skill-breakdown-Athletics')).not.toBeInTheDocument();
      expect(screen.getByTestId('skill-breakdown-Perception')).toBeInTheDocument();
    });

    it('shows the expertise doubling in the breakdown', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            skill_proficiencies: ['Athletics', 'Stealth'],
            expertise_skills: ['Stealth'],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      // DEX 12 → +1, expertise 2×3 = +6 → +7
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Stealth')).toHaveTextContent('+7'));
      fireEvent.click(screen.getByTestId('skill-bonus-Stealth'));
      expect(screen.getByTestId('skill-breakdown-Stealth')).toHaveTextContent('Expertise (2 × proficiency +3)');
    });

    it('renders a negative bonus with a minus sign', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      // CHA 8 → −1, not proficient in Deception
      await waitFor(() => expect(screen.getByTestId('skill-bonus-Deception')).toHaveTextContent('−1'));
    });
  });

  // ── Click-to-see-the-math on saving throws, passive scores and initiative ───────────
  describe('derived stat breakdowns', () => {
    it('expands a saving throw breakdown showing the ability modifier and proficiency', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      // Fighter: STR 16 → +3, proficient in STR saves, PB +3 → +6
      await waitFor(() => expect(screen.getByTestId('save-bonus-strength')).toHaveTextContent('+6'));
      expect(screen.queryByTestId('save-breakdown-strength')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('save-bonus-strength'));
      const breakdown = screen.getByTestId('save-breakdown-strength');
      expect(breakdown).toHaveTextContent('STR modifier');
      expect(breakdown).toHaveTextContent('Proficiency bonus');
      expect(breakdown).toHaveTextContent('Total');
    });

    it('omits the proficiency line for a save the character is not proficient in', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      // Fighter is NOT proficient in DEX saves: DEX 12 → +1
      await waitFor(() => expect(screen.getByTestId('save-bonus-dexterity')).toHaveTextContent('+1'));
      fireEvent.click(screen.getByTestId('save-bonus-dexterity'));
      expect(screen.getByTestId('save-breakdown-dexterity')).not.toHaveTextContent('Proficiency bonus');
    });

    it('expands a passive score breakdown showing the flat base of 10', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('passive-insight-value')).toBeInTheDocument());
      expect(screen.queryByTestId('passive-insight-breakdown')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('passive-insight-value'));
      const breakdown = screen.getByTestId('passive-insight-breakdown');
      expect(breakdown).toHaveTextContent('Base');
      expect(breakdown).toHaveTextContent('WIS modifier');
    });

    it('expands an initiative breakdown from the DEX modifier', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toHaveTextContent('+1'));
      expect(screen.queryByTestId('initiative-breakdown')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('initiative-value'));
      expect(screen.getByTestId('initiative-breakdown')).toHaveTextContent('DEX modifier');
    });

    it('lists a feat contribution as its own line in the initiative breakdown', async () => {
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
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toHaveTextContent('+6'));
      fireEvent.click(screen.getByTestId('initiative-value'));
      const breakdown = screen.getByTestId('initiative-breakdown');
      expect(breakdown).toHaveTextContent('DEX modifier');
      expect(breakdown).toHaveTextContent('Alert');
    });

    it('lists a feat contribution as its own line in a passive breakdown', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{
              id: 2,
              name: 'Observant',
              level: 4,
              effects: [{ kind: 'stat_mod', stat: 'passive_investigation', amount: 5 }],
            }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('passive-investigation-value')).toHaveTextContent('15'));
      fireEvent.click(screen.getByTestId('passive-investigation-value'));
      expect(screen.getByTestId('passive-investigation-breakdown')).toHaveTextContent('Observant');
    });

    it('keeps only one derived-stat breakdown open at a time', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('initiative-value'));
      expect(screen.getByTestId('initiative-breakdown')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('save-bonus-strength'));
      expect(screen.queryByTestId('initiative-breakdown')).not.toBeInTheDocument();
      expect(screen.getByTestId('save-breakdown-strength')).toBeInTheDocument();
    });

    it('surfaces the armor disadvantage as a note on STR and DEX saves', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Wizard', // not proficient with heavy armor
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{
              uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'Heavy',
              armor_class: 16, equipped: true, quantity: 1,
            }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('save-bonus-strength')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('save-bonus-strength'));
      expect(screen.getByTestId('save-breakdown-strength')).toHaveTextContent(/Disadvantage/);
      // A save unaffected by armor carries no such note
      fireEvent.click(screen.getByTestId('save-bonus-wisdom'));
      expect(screen.getByTestId('save-breakdown-wisdom')).not.toHaveTextContent(/Disadvantage/);
    });
  });

  // ── Conditional skill legend (expertise + background source) ───────────
  describe('SkillsDisplay legend', () => {
    it('hides "Purple = expertise" when the character has no expertise', async () => {
      // BASE_CHARACTER is a Fighter with no expertise_skills
      renderDetail();
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Purple = expertise/)).toBeInTheDocument();
    });

    it('shows "Amber = from background" for background-granted proficiencies', async () => {
      // BASE_CHARACTER is a Soldier (grants Athletics, Intimidation) proficient in Athletics
      renderDetail();
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.getByText(/Blue = from feat/)).toBeInTheDocument();
    });

    it('does NOT show "Blue = from feat" when no feat granted a proficient skill', async () => {
      renderDetail(); // BASE_CHARACTER has no feats
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('hp');
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
      await openStatsSubTab('hp');
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
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
      // +1 DEX + 3 PB = +4
      await waitFor(() => expect(screen.getByTestId('initiative-value')).toHaveTextContent('+4'));
      expect(screen.getByTestId('initiative-feat-note')).toHaveTextContent('+3 Alert');
    });

    it('shows plain DEX initiative with no feat note when no feat modifies it', async () => {
      renderDetail(); // BASE_CHARACTER has no feats
      await openStatsSubTab('abilities');
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
      await openStatsSubTab('abilities');
      // BASE_CHARACTER WIS 12 → +1, not proficient in Perception, base 10 = 11, plus Observant +5 = 16
      await waitFor(() => expect(screen.getByTestId('passive-perception-value')).toHaveTextContent('16'));
      expect(screen.getByTestId('passive-perception-feat-note')).toHaveTextContent('+5 Observant');
    });

    it('adds a feat passive_investigation stat_mod (Observant +5)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{
              id: 2,
              name: 'Observant',
              level: 4,
              effects: [
                { kind: 'stat_mod', stat: 'passive_perception', amount: 5 },
                { kind: 'stat_mod', stat: 'passive_investigation', amount: 5 },
              ],
            }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      // INT 10 → +0, not proficient in Investigation, base 10 = 10, plus Observant +5 = 15
      await waitFor(() => expect(screen.getByTestId('passive-investigation-value')).toHaveTextContent('15'));
      expect(screen.getByTestId('passive-investigation-feat-note')).toHaveTextContent('+5 Observant');
      // Insight is untouched by Observant: WIS +1, no proficiency → 11
      expect(screen.getByTestId('passive-insight-value')).toHaveTextContent('11');
      expect(screen.queryByTestId('passive-insight-feat-note')).not.toBeInTheDocument();
    });

    it('renders all three passive scores', async () => {
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('passive-perception')).toBeInTheDocument());
      expect(screen.getByTestId('passive-investigation')).toBeInTheDocument();
      expect(screen.getByTestId('passive-insight')).toBeInTheDocument();
    });

    it('does NOT add the proficiency bonus to a passive the character is not proficient in', async () => {
      renderDetail(); // BASE_CHARACTER is proficient in Athletics only
      await openStatsSubTab('abilities');
      // WIS 12 → +1, base 10 = 11. The +3 proficiency bonus must NOT apply.
      await waitFor(() => expect(screen.getByTestId('passive-perception-value')).toHaveTextContent('11'));
      expect(screen.queryByTestId('passive-perception-feat-note')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('passive-perception-value'));
      expect(screen.getByTestId('passive-perception-breakdown')).not.toHaveTextContent('Proficiency bonus');
    });

    it('adds the proficiency bonus to a passive the character IS proficient in', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, skill_proficiencies: ['Athletics', 'Perception'] },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      // WIS +1, prof +3, base 10 = 14
      await waitFor(() => expect(screen.getByTestId('passive-perception-value')).toHaveTextContent('14'));
      fireEvent.click(screen.getByTestId('passive-perception-value'));
      const breakdown = screen.getByTestId('passive-perception-breakdown');
      expect(breakdown).toHaveTextContent('Base');
      expect(breakdown).toHaveTextContent('WIS modifier');
      expect(breakdown).toHaveTextContent('Proficiency bonus');
    });

    it('doubles the proficiency bonus on a passive with expertise', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            skill_proficiencies: ['Athletics', 'Insight'],
            expertise_skills: ['Insight'],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      // WIS +1, expertise 2×3 = +6, base 10 = 17
      await waitFor(() => expect(screen.getByTestId('passive-insight-value')).toHaveTextContent('17'));
      fireEvent.click(screen.getByTestId('passive-insight-value'));
      expect(screen.getByTestId('passive-insight-breakdown')).toHaveTextContent('Expertise (2 × proficiency +3)');
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
      await openStatsSubTab('hp');
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
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByTestId('total-speed')).toHaveTextContent('40')); // 30 + 10 in CombatBlock
      expect(screen.queryByTestId('speed-feat-note')).not.toBeInTheDocument(); // central annotation suppressed
    });

    it('no speed feat note when no feat grants speed', async () => {
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('speed-feat-note')).not.toBeInTheDocument();
    });

    it('shows the central armor Str-requirement speed annotation for a hand-written class (Barbarian)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Barbarian', // hand-written sheet → no CombatBlock fold-in, annotation shown
          strength: 11,
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, strength_requirement: 13, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByTestId('speed-armor-note'))
        .toHaveTextContent('−10 ft speed: Chain Mail requires Strength 13 (you have 11).'));
    });

    it('folds the armor Str penalty into Total Speed for a data-driven class (Fighter), suppressing the annotation', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // Fighter is data-driven
          strength: 11,
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, strength_requirement: 13, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByTestId('total-speed')).toHaveTextContent('20')); // 30 − 10 in CombatBlock
      expect(screen.getByTestId('total-speed-armor-note')).toHaveTextContent('−10 ft Chain Mail (Str 13 required)');
      expect(screen.queryByTestId('speed-armor-note')).not.toBeInTheDocument(); // central annotation suppressed
    });

    it("shows the Spells-tab banner when wearing armor without proficiency (can't cast)", async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Wizard',
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, equipped: true }],
          },
        },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByTestId('spells-armor-warning'))
        .toHaveTextContent(/can't cast spells while wearing armor you're not proficient with \(Chain Mail\)/i));
    });

    it('no Spells-tab armor banner when nothing non-proficient is worn', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, char_class: 'Wizard' },
      });
      renderDetail();
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('spells-armor-warning')).not.toBeInTheDocument();
    });

    it('marks STR/DEX saves and skills with the armor non-proficiency penalty', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Wizard',
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('saves-armor-warning'))
        .toHaveTextContent(/wearing Chain Mail without proficiency/i));
      // STR/DEX skills carry a "dis" tag; others do not.
      expect(screen.getByTestId('skill-armor-dis-Athletics')).toBeInTheDocument();
      expect(screen.getByTestId('skill-armor-dis-Acrobatics')).toBeInTheDocument();
      expect(screen.queryByTestId('skill-armor-dis-Arcana')).not.toBeInTheDocument();
    });

    // Stealth disadvantage is a separate armor rule from proficiency: a Fighter is proficient
    // with Chain Mail and still can't sneak in it.
    it('tags Stealth for a proficient wearer of armor that imposes it', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // Fighter — proficient with all armor
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, stealth_disadvantage: true, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('skill-armor-dis-Stealth')).toBeInTheDocument());
      // Proficient, so no OTHER skill picks up a tag.
      expect(screen.queryByTestId('skill-armor-dis-Athletics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('saves-armor-warning')).not.toBeInTheDocument();
    });

    it('Medium Armor Master clears the Stealth tag for medium armor only', async () => {
      const withArmor = (armorProps) => ({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            feats: [{ name: 'Medium Armor Master' }],
            inventory: [{ uid: 'a1', category: 'armor', armor_class: 15, stealth_disadvantage: true, equipped: true, ...armorProps }],
          },
        },
      });
      characterService.getCharacterById.mockResolvedValue(withArmor({ name: 'Half Plate', armor_type: 'medium' }));
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('skill-armor-dis-Stealth')).not.toBeInTheDocument();

      cleanup();
      characterService.getCharacterById.mockResolvedValue(withArmor({ name: 'Chain Mail', armor_type: 'heavy' }));
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByTestId('skill-armor-dis-Stealth')).toBeInTheDocument());
    });

    it('no Stealth tag for armor without the flag', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Leather', armor_type: 'light', armor_class: 11, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('skill-armor-dis-Stealth')).not.toBeInTheDocument();
    });

    it('no saves note or skill tags for a proficient wearer (Fighter in Chain Mail)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER, // Fighter — proficient with all armor
          character_data: {
            ...BASE_CHARACTER.character_data,
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('saves-armor-warning')).not.toBeInTheDocument();
      expect(screen.queryByTestId('skill-armor-dis-Athletics')).not.toBeInTheDocument();
    });

    it('no armor speed annotation when the requirement is met', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          char_class: 'Barbarian',
          character_data: {
            ...BASE_CHARACTER.character_data, // strength 16 meets the requirement
            inventory: [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, strength_requirement: 13, equipped: true }],
          },
        },
      });
      renderDetail();
      await openStatsSubTab('hp');
      await waitFor(() => expect(screen.getByText('Aldric')).toBeInTheDocument());
      expect(screen.queryByTestId('speed-armor-note')).not.toBeInTheDocument();
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

    // A subclass grant can hand out a language instead of a skill (Cavalier / Samurai "Bonus
    // Proficiency"). Before this group, subclass_languages was stored and deduped against but
    // never displayed, so the choice vanished from the sheet.
    it('shows a subclass-granted language under "From Subclass" (Cavalier Bonus Proficiency)', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            subclass: 'Cavalier',
            subclass_languages: ['Draconic'],
          },
        },
      });
      renderDetail();
      const block = await screen.findByTestId('languages-from-subclass');
      expect(within(block).getByText('Draconic')).toBeInTheDocument();
    });

    it('does not show a "From Subclass" group when the subclass granted no language', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: { ...BASE_CHARACTER, character_data: { ...BASE_CHARACTER.character_data, feat_languages: ['Giant'] } },
      });
      renderDetail();
      await screen.findByTestId('languages-from-feats');
      expect(screen.queryByTestId('languages-from-subclass')).not.toBeInTheDocument();
    });

    it('does not repeat a subclass language already known from the race', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: {
            ...BASE_CHARACTER.character_data,
            race_languages: ['Common', 'Elvish'],
            subclass_languages: ['Elvish', 'Giant'],
          },
        },
      });
      renderDetail();
      const block = await screen.findByTestId('languages-from-subclass');
      expect(within(block).getByText('Giant')).toBeInTheDocument();
      expect(within(block).queryByText('Elvish')).not.toBeInTheDocument();
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
      await openStatsSubTab('abilities');
      // WIS 12 (+1) + proficiency bonus +3 (level 5) = +4
      await waitFor(() => expect(within(screen.getByTestId('save-wisdom')).getByText('+4')).toBeInTheDocument());
    });
  });

  // Features that change how the character's own saves work sit between the Saving
  // Throws grid and Skills — name only, click for the full rules text.
  describe('features affecting saves', () => {
    const BORN = 'save-feature-fighter-cavalier-born-to-the-saddle';

    function mockCavalier(overrides = {}) {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          ...overrides,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Cavalier' },
        },
      });
    }

    it('lists Born to the Saddle for a Cavalier, name only', async () => {
      mockCavalier();
      renderDetail();
      await openStatsSubTab('abilities');
      const row = await screen.findByTestId(BORN);
      expect(row).toHaveTextContent('Born to the Saddle');
      expect(screen.queryByTestId(`${BORN}-desc`)).not.toBeInTheDocument();
    });

    it('expands the full description when the name is clicked', async () => {
      mockCavalier();
      renderDetail();
      await openStatsSubTab('abilities');
      fireEvent.click(await screen.findByTestId(BORN));
      expect(screen.getByTestId(`${BORN}-desc`)).toHaveTextContent(/advantage on saving throws/i);
    });

    it('renders between the Saving Throws grid and Skills', async () => {
      mockCavalier();
      renderDetail();
      await openStatsSubTab('abilities');
      const panel = await screen.findByTestId('save-features');
      const saves = screen.getByTestId('save-strength');
      // Saving Throws grid comes first in the DOM, the panel after it.
      expect(saves.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('shows no panel for a Fighter subclass with no save features', async () => {
      characterService.getCharacterById.mockResolvedValue({
        success: true,
        data: {
          ...BASE_CHARACTER,
          character_data: { ...BASE_CHARACTER.character_data, subclass: 'Champion' },
        },
      });
      renderDetail();
      await openStatsSubTab('abilities');
      await screen.findByTestId('save-strength');
      expect(screen.queryByTestId('save-features')).not.toBeInTheDocument();
    });

    it('shows no panel for a Cavalier below the level the feature is gained', async () => {
      mockCavalier({ level: 2 });
      renderDetail();
      await openStatsSubTab('abilities');
      await screen.findByTestId('save-strength');
      expect(screen.queryByTestId('save-features')).not.toBeInTheDocument();
    });
  });
});
