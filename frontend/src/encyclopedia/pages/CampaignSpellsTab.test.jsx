import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignSpellsTab from './CampaignSpellsTab';

vi.mock('../encyclopediaService', () => ({
  default: {
    getSpells: vi.fn(),
    deleteSpell: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import encyclopediaService from '../encyclopediaService';

const SYSTEM_SPELLS = [
  {
    id: 1, name: 'Fireball', level: 3, school: 'Evocation',
    ritual: false, concentration: false, classes: 'Wizard, Sorcerer',
    owner_type: 'system', owner_id: null,
  },
];

const CAMPAIGN_SPELLS = [
  {
    id: 10, name: 'Shadow Bolt', level: 2, school: 'Necromancy',
    ritual: false, concentration: false, classes: 'Wizard',
    owner_type: 'campaign', owner_id: 1,
  },
  {
    id: 11, name: 'Custom Fire', level: 1, school: 'Evocation',
    ritual: true, concentration: false, classes: 'Sorcerer',
    owner_type: 'campaign', owner_id: 1,
  },
];

function renderTab(campaignId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}/encyclopedia`]}>
      <Routes>
        <Route path="/campaigns/:campaignId/encyclopedia" element={
          <CampaignSpellsTab campaignId={campaignId} />
        } />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  encyclopediaService.getSpells.mockResolvedValue([...SYSTEM_SPELLS, ...CAMPAIGN_SPELLS]);
  encyclopediaService.deleteSpell.mockResolvedValue({ message: 'Deleted' });
});

describe('CampaignSpellsTab', () => {
  it('shows loading state initially', () => {
    encyclopediaService.getSpells.mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('calls getSpells with the correct campaignId and edition', async () => {
    renderTab('42');
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith('42', '5e'));
  });

  it('renders campaign-scoped spells after load', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Shadow Bolt')).toBeInTheDocument());
    expect(screen.getByText('Custom Fire')).toBeInTheDocument();
  });

  it('does not render system-owned spells', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Shadow Bolt'));
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
  });

  it('shows Campaign badge on each spell', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Shadow Bolt'));
    const badges = screen.getAllByText('Campaign');
    expect(badges).toHaveLength(2);
  });

  it('shows empty state when no campaign spells exist', async () => {
    encyclopediaService.getSpells.mockResolvedValue(SYSTEM_SPELLS);
    renderTab();
    await waitFor(() => expect(screen.getByText('No campaign spells yet.')).toBeInTheDocument());
  });

  it('shows "New Homebrew Spell" button', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByTestId('new-homebrew-btn')).toBeInTheDocument());
  });

  it('clicking New Homebrew Spell navigates to /encyclopedia/spells/new', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('new-homebrew-btn'));
    fireEvent.click(screen.getByTestId('new-homebrew-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/spells/new');
  });

  it('clicking edit navigates to the spell edit page', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('edit-spell-10'));
    fireEvent.click(screen.getByTestId('edit-spell-10'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/spells/10');
  });

  it('clicking delete shows confirmation dialog', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('delete-spell-10'));
    fireEvent.click(screen.getByTestId('delete-spell-10'));
    await waitFor(() => expect(screen.getByText('Delete Campaign Spell')).toBeInTheDocument());
    expect(screen.getAllByText(/Shadow Bolt/).length).toBeGreaterThanOrEqual(1);
  });

  it('cancels delete dialog without calling deleteSpell', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('delete-spell-10'));
    fireEvent.click(screen.getByTestId('delete-spell-10'));
    await waitFor(() => screen.getByText('Delete Campaign Spell'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(encyclopediaService.deleteSpell).not.toHaveBeenCalled();
  });

  it('confirming delete calls deleteSpell and reloads', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('delete-spell-10'));
    fireEvent.click(screen.getByTestId('delete-spell-10'));
    await waitFor(() => screen.getByText('Delete Campaign Spell'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(encyclopediaService.deleteSpell).toHaveBeenCalledWith(10));
    // Should reload — getSpells called twice (initial + after delete)
    expect(encyclopediaService.getSpells).toHaveBeenCalledTimes(2);
  });

  it('filters by search term', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('campaign-spell-search'));
    fireEvent.change(screen.getByTestId('campaign-spell-search'), { target: { value: 'shadow' } });
    expect(screen.getByText('Shadow Bolt')).toBeInTheDocument();
    expect(screen.queryByText('Custom Fire')).not.toBeInTheDocument();
  });

  it('shows concentration and ritual labels', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Custom Fire'));
    // Custom Fire has ritual=true
    expect(screen.getByText(/Ritual/)).toBeInTheDocument();
  });
});
