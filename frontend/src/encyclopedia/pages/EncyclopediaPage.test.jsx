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

  it('renders all 12 classes in the list', () => {
    renderPage();
    const classes = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
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

  it('shows Campaign Spells tab for GM', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    expect(screen.getByRole('button', { name: 'Campaign Spells' })).toBeInTheDocument();
  });

  it('hides Campaign Spells tab for player', () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'player' });
    expect(screen.queryByRole('button', { name: 'Campaign Spells' })).not.toBeInTheDocument();
  });

  it('clicking Campaign Spells tab shows CampaignSpellsTab', async () => {
    renderPage({ id: 1, name: 'Test', edition: '5e', userRole: 'gm' });
    fireEvent.click(screen.getByRole('button', { name: 'Campaign Spells' }));
    await waitFor(() => expect(screen.getByTestId('campaign-spells-tab')).toBeInTheDocument());
  });
});
