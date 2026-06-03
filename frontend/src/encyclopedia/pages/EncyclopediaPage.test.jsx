import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EncyclopediaPage from './EncyclopediaPage';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: vi.fn(),
}));

vi.mock('../../characters/classService', () => ({
  default: { getClassByName: vi.fn() },
}));

// ClassOverview is complex and has its own tests; mock it to keep these focused
vi.mock('../../characters/components/ClassOverview', () => ({
  default: ({ classData, loading }) => {
    if (loading) return <div>Loading class...</div>;
    if (!classData) return <div>Class details unavailable.</div>;
    return (
      <div data-testid="class-overview">
        <h2>{classData.name}</h2>
        {classData.flavor_text && <p>{classData.flavor_text}</p>}
      </div>
    );
  },
}));

vi.mock('./SpellsTab', () => ({
  default: ({ isGm, campaignId }) => (
    <div data-testid="spells-tab">SpellsTab isGm={String(isGm)} campaign={campaignId}</div>
  ),
}));

vi.mock('./CampaignSpellsTab', () => ({
  default: ({ campaignId }) => (
    <div data-testid="campaign-spells-tab">CampaignSpellsTab campaign={campaignId}</div>
  ),
}));

vi.mock('./SkillsTab', () => ({
  default: () => <div data-testid="skills-tab">SkillsTab</div>,
}));

vi.mock('./FeatsTab', () => ({
  default: ({ campaignId, edition }) => (
    <div data-testid="feats-tab">FeatsTab campaign={campaignId} edition={edition}</div>
  ),
}));

vi.mock('./ItemsTab', () => ({
  default: ({ category, isGm, campaignId }) => (
    <div data-testid="items-tab">ItemsTab cat={category.id} isGm={String(isGm)} campaign={campaignId}</div>
  ),
}));

vi.mock('./CampaignItemsTab', () => ({
  default: ({ category, campaignId }) => (
    <div data-testid="campaign-items-tab">CampaignItemsTab cat={category.id} campaign={campaignId}</div>
  ),
}));

import classService from '../../characters/classService';
import { useCampaign } from '../../campaigns/CampaignContext';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BARBARIAN_DATA = {
  name: 'Barbarian', edition: '5e',
  flavor_text: 'A fierce warrior of primitive background.',
  hit_die: 12, primary_ability: 'Strength', spellcasting_ability: null,
  saving_throws: ['Strength', 'Constitution'],
  armor_proficiencies: ['Light', 'Medium', 'Shields'],
  weapon_proficiencies: ['Simple', 'Martial'],
  tool_proficiencies: [], skill_count: 2,
  skills_available: ['Athletics', 'Perception'], features: [],
};

function renderPage(campaign = { id: 1, name: 'Test Campaign', edition: '5e', userRole: 'gm' }) {
  useCampaign.mockReturnValue({ campaign });
  return render(
    <MemoryRouter initialEntries={['/campaigns/1/encyclopedia']}>
      <Routes>
        <Route path="/campaigns/:campaignId/encyclopedia" element={<EncyclopediaPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  classService.getClassByName.mockResolvedValue(null);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EncyclopediaPage', () => {
  it('renders the page header and Classes tab', () => {
    renderPage();
    expect(screen.getByText('Encyclopedia')).toBeInTheDocument();
    expect(screen.getByText('Classes')).toBeInTheDocument();
  });

  it('shows the empty state prompt when no class is selected', () => {
    renderPage();
    expect(screen.getByText('Select a class')).toBeInTheDocument();
    expect(screen.getByText(/Choose a class from the list/)).toBeInTheDocument();
  });

  it('renders all 13 classes in the list', () => {
    renderPage();
    const classes = ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
      'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
    classes.forEach(cls => expect(screen.getByText(cls)).toBeInTheDocument());
  });

  it('defaults edition toggle to campaign edition (5e)', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    const fiveEBtn = screen.getByRole('button', { name: '5e' });
    expect(fiveEBtn).toHaveClass('bg-card');
  });

  it('defaults edition toggle to 2024 when campaign edition is 5.5e', () => {
    renderPage({ id: 1, name: 'Test', edition: '5.5e', userRole: 'gm' });
    const btn2024 = screen.getByRole('button', { name: '2024' });
    expect(btn2024).toHaveClass('bg-card');
  });

  it('calls classService.getClassByName with class name, edition, and campaignId on click', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() =>
      expect(classService.getClassByName).toHaveBeenCalledWith('Barbarian', '5e', '1')
    );
  });

  it('shows class overview after selecting a class', async () => {
    classService.getClassByName.mockResolvedValue(BARBARIAN_DATA);
    renderPage();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(screen.getByTestId('class-overview')).toBeInTheDocument());
    expect(screen.getByText('A fierce warrior of primitive background.')).toBeInTheDocument();
  });

  it('hides the empty state after selecting a class', async () => {
    classService.getClassByName.mockResolvedValue(BARBARIAN_DATA);
    renderPage();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(screen.getByTestId('class-overview')).toBeInTheDocument());
    expect(screen.queryByText('Select a class')).not.toBeInTheDocument();
  });

  it('re-fetches class data when edition is switched', async () => {
    classService.getClassByName.mockResolvedValue(BARBARIAN_DATA);
    renderPage();
    fireEvent.click(screen.getByText('Barbarian'));
    await waitFor(() => expect(classService.getClassByName).toHaveBeenCalledWith('Barbarian', '5e', '1'));

    fireEvent.click(screen.getByRole('button', { name: '2024' }));
    await waitFor(() => expect(classService.getClassByName).toHaveBeenCalledWith('Barbarian', '5.5e', '1'));
  });

  it('passes 5.5e to classService when 2024 edition is selected', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Wizard'));
    await waitFor(() => expect(classService.getClassByName).toHaveBeenCalledWith('Wizard', '5e', '1'));

    fireEvent.click(screen.getByRole('button', { name: '2024' }));
    await waitFor(() => expect(classService.getClassByName).toHaveBeenCalledWith('Wizard', '5.5e', '1'));
  });

  it('is accessible to players (player role renders the same class list)', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    expect(screen.getByText('Barbarian')).toBeInTheDocument();
    expect(screen.getByText('Wizard')).toBeInTheDocument();
    expect(screen.getByText('Select a class')).toBeInTheDocument();
  });

  it('shows loading state while class data is being fetched', async () => {
    let resolve;
    classService.getClassByName.mockReturnValue(new Promise(r => { resolve = r; }));
    renderPage();
    fireEvent.click(screen.getByText('Fighter'));
    expect(await screen.findByText('Loading class...')).toBeInTheDocument();
    resolve(null);
  });

  it('renders a Spells tab button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Spells' })).toBeInTheDocument();
  });

  it('clicking Spells tab shows SpellsTab component', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    await waitFor(() => expect(screen.getByTestId('spells-tab')).toBeInTheDocument());
  });

  it('hides edition toggle when Spells tab is active', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    expect(screen.queryByRole('button', { name: '5e' })).not.toBeInTheDocument();
  });

  it('does NOT show Campaign Spells as a top-level tab', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    // Campaign Spells is now a sub-tab inside Spells, not a top-level tab
    const topTabs = screen.getAllByRole('button').filter((b) =>
      ['Classes', 'Skills', 'Spells', 'Campaign Spells'].includes(b.textContent)
    );
    expect(topTabs.map((b) => b.textContent)).toEqual(['Classes', 'Skills', 'Spells']);
  });

  it('shows System / Campaign sub-tabs inside Spells for GM', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    await waitFor(() => expect(screen.getByTestId('spells-tab')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'System Spells' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Campaign Spells' })).toBeInTheDocument();
  });

  it('hides Spells sub-tabs for player and only shows SpellsTab', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    await waitFor(() => expect(screen.getByTestId('spells-tab')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'System Spells' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Campaign Spells' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('campaign-spells-tab')).not.toBeInTheDocument();
  });

  it('clicking Campaign Spells sub-tab swaps SpellsTab for CampaignSpellsTab', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    await waitFor(() => expect(screen.getByTestId('spells-tab')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Campaign Spells' }));
    await waitFor(() => expect(screen.getByTestId('campaign-spells-tab')).toBeInTheDocument());
    expect(screen.queryByTestId('spells-tab')).not.toBeInTheDocument();
  });

  it('Spells sub-tab defaults to System Spells', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    fireEvent.click(screen.getByRole('button', { name: 'Spells' }));
    await waitFor(() => expect(screen.getByTestId('spells-tab')).toBeInTheDocument());
    expect(screen.queryByTestId('campaign-spells-tab')).not.toBeInTheDocument();
  });

  it('renders a Skills tab button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Skills' })).toBeInTheDocument();
  });

  it('shows Skills tab to players (not GM-only)', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    expect(screen.getByRole('button', { name: 'Skills' })).toBeInTheDocument();
  });

  it('clicking Skills tab shows SkillsTab component', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }));
    await waitFor(() => expect(screen.getByTestId('skills-tab')).toBeInTheDocument());
  });

  it('hides edition toggle when Skills tab is active', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Skills' }));
    expect(screen.queryByRole('button', { name: '5e' })).not.toBeInTheDocument();
  });

  it('renders a Feats tab button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Feats' })).toBeInTheDocument();
  });

  it('shows Feats tab to players (not GM-only)', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    expect(screen.getByRole('button', { name: 'Feats' })).toBeInTheDocument();
  });

  it('clicking Feats tab shows FeatsTab component with campaignId and edition', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Feats' }));
    await waitFor(() => expect(screen.getByTestId('feats-tab')).toBeInTheDocument());
    expect(screen.getByTestId('feats-tab')).toHaveTextContent('campaign=1');
    expect(screen.getByTestId('feats-tab')).toHaveTextContent('edition=5e');
  });

  it('keeps the edition toggle visible on the Feats tab (edition-aware)', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Feats' }));
    expect(screen.getByRole('button', { name: '5e' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2024' })).toBeInTheDocument();
  });

  it('passes 2024 edition to FeatsTab when toggled', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Feats' }));
    fireEvent.click(screen.getByRole('button', { name: '2024' }));
    await waitFor(() => expect(screen.getByTestId('feats-tab')).toHaveTextContent('edition=5.5e'));
  });

  // ── Items tab ────────────────────────────────────────────────────────────────

  it('renders an Items tab button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Items' })).toBeInTheDocument();
  });

  it('shows Items tab to players (not GM-only)', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    expect(screen.getByRole('button', { name: 'Items' })).toBeInTheDocument();
  });

  it('clicking Items shows ItemsTab defaulting to the weapons category', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    await waitFor(() => expect(screen.getByTestId('items-tab')).toBeInTheDocument());
    expect(screen.getByTestId('items-tab')).toHaveTextContent('cat=weapons');
    expect(screen.getByTestId('items-tab')).toHaveTextContent('campaign=1');
  });

  it('hides the edition toggle on the Items tab', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    expect(screen.queryByRole('button', { name: '5e' })).not.toBeInTheDocument();
  });

  it('renders all six category sub-tabs', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    await waitFor(() => screen.getByTestId('items-tab'));
    ['weapons', 'armor', 'adventuring-gear', 'potions', 'magic-items', 'food-drink'].forEach((id) =>
      expect(screen.getByTestId(`item-category-${id}`)).toBeInTheDocument()
    );
  });

  it('switching category updates the rendered ItemsTab', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    await waitFor(() => screen.getByTestId('items-tab'));
    fireEvent.click(screen.getByTestId('item-category-armor'));
    await waitFor(() => expect(screen.getByTestId('items-tab')).toHaveTextContent('cat=armor'));
  });

  it('shows System / Campaign sub-tabs inside Items for GM', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    await waitFor(() => screen.getByTestId('items-tab'));
    expect(screen.getByRole('button', { name: 'System Weapons' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Campaign Weapons' })).toBeInTheDocument();
  });

  it('hides Items sub-tabs for players and only shows ItemsTab', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    await waitFor(() => screen.getByTestId('items-tab'));
    expect(screen.queryByRole('button', { name: 'System Weapons' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('campaign-items-tab')).not.toBeInTheDocument();
  });

  it('clicking Campaign sub-tab swaps ItemsTab for CampaignItemsTab', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    fireEvent.click(screen.getByRole('button', { name: 'Items' }));
    await waitFor(() => screen.getByTestId('items-tab'));
    fireEvent.click(screen.getByRole('button', { name: 'Campaign Weapons' }));
    await waitFor(() => expect(screen.getByTestId('campaign-items-tab')).toBeInTheDocument());
    expect(screen.queryByTestId('items-tab')).not.toBeInTheDocument();
  });
});
