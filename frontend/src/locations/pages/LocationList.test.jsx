import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '42' }),
  useNavigate: () => mockNavigate,
}));
vi.mock('../locationService', () => ({
  default: {
    getLocations: vi.fn(),
    getMaps: vi.fn(),
    createLocation: vi.fn(),
    toggleLocationVisibility: vi.fn(),
  },
  mapImageUrl: (p) => `http://localhost:8000/${p}`,
}));

// mockNavigate must be defined before the vi.mock factory runs
const mockNavigate = vi.fn();

import { useCampaign } from '../../campaigns/CampaignContext';
import locationService from '../locationService';
import LocationList from './LocationList';

const GM_CAMPAIGN = { id: 42, name: 'Test Campaign', userRole: 'gm', created_by: 1 };
const PLAYER_CAMPAIGN = { id: 42, name: 'Test Campaign', userRole: 'player', created_by: 99 };

const TOP_LOC = {
  id: 1, campaign_id: 42, name: 'The Known World',
  is_top_level: true, is_unknown: false,
  parent_location_id: null, pin_child_ids: [],
  location_type: 'World', status: 'Active',
  is_visible_to_players: true, description: 'The world.',
};

const CHILD_LOC = {
  id: 2, campaign_id: 42, name: 'Neverwinter',
  is_top_level: false, is_unknown: false,
  parent_location_id: 1, pin_child_ids: [],
  location_type: 'City', status: null,
  is_visible_to_players: true, description: 'A city.',
};

const MAP = {
  id: 10, location_id: 1, name: 'World Map',
  image_path: 'uploads/maps/42/1/world.png',
  is_visible_to_players: true,
};

function renderList() {
  return render(<MemoryRouter><LocationList /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  locationService.getLocations.mockResolvedValue([TOP_LOC, CHILD_LOC]);
  locationService.getMaps.mockResolvedValue([MAP]);
});

describe('LocationList — tree node navigation (campaignId regression)', () => {
  it('clicking the top-level node navigates with the correct campaignId — not undefined', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.getByText('The Known World')).toBeTruthy());

    // Find the tree-node row (name appears in both map bar and tree; pick the one with a clickable ancestor)
    const topRow = screen.getAllByText('The Known World')
      .map(el => el.closest('[class*="cursor-pointer"]'))
      .find(Boolean);
    fireEvent.click(topRow);

    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/42/locations/1');
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('undefined'));
  });

  it('clicking a child tree node navigates with the correct campaignId', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.getByText('Neverwinter')).toBeTruthy());

    const childRow = screen.getByText('Neverwinter').closest('[class*="cursor-pointer"]');
    fireEvent.click(childRow);

    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/42/locations/2');
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('undefined'));
  });
});

describe('LocationList — GM toolbar on top-level map', () => {
  it('shows Edit button above the world map in GM view', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.getByText(/Edit The Known World/i)).toBeTruthy());
  });

  it('Edit button navigates to the top-level location detail page', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.getByText(/Edit The Known World/i)).toBeTruthy());

    fireEvent.click(screen.getByText(/Edit The Known World/i));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/42/locations/1');
  });

  it('GM toolbar is hidden in player view', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.getByText('The Known World')).toBeTruthy());

    expect(screen.queryByText(/Edit The Known World/i)).toBeNull();
  });
});
