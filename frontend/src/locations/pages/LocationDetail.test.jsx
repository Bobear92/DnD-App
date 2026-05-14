import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

// Render all tab panels unconditionally so tests can find content without clicking tabs
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ value, children }) => <button data-value={value}>{children}</button>,
  TabsContent: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '42', locationId: '7' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('../locationService', () => ({
  default: {
    getLocation: vi.fn(),
    getMaps: vi.fn(),
    getLocations: vi.fn(),
    getLocationNpcs: vi.fn(),
  },
  mapImageUrl: (p) => `http://localhost:8000/${p}`,
}));
vi.mock('../../npcs/npcService', () => ({
  default: {},
  mapNpcImageUrl: () => null,
}));
vi.mock('../../settings/settingsService', () => ({
  default: { getEventsForLocation: vi.fn() },
}));

import { useCampaign } from '../../campaigns/CampaignContext';
import locationService from '../locationService';
import settingsService from '../../settings/settingsService';
import LocationDetail from './LocationDetail';

const GM_CAMPAIGN = { id: 42, name: 'Test Campaign', userRole: 'gm', created_by: 1 };
const PLAYER_CAMPAIGN = { id: 42, name: 'Test Campaign', userRole: 'player', created_by: 99 };

const BASE_LOCATION = {
  id: 7, campaign_id: 42, name: 'Olissipo',
  description: 'A great port city.', gm_notes: '',
  location_type: 'City', status: 'Active',
  is_visible_to_players: true,
  parent_location_id: null, is_top_level: false, is_unknown: false,
  weather: '', plant_life: '', animal_life: '', terrain: '', climate: '',
  history: '', rumors: '', government: '', religion: '', economy: '',
  threats: '', available_services: '', points_of_interest: '',
};

const SAMPLE_EVENT = {
  id: 1,
  title: 'Battle of Olissipo',
  description: 'A fierce battle.',
  is_visible_to_players: true,
  era_dates: [{ era_id: 1, era_name: 'Age of Kings', abbreviation: 'AK', year: 300, is_visible_to_players: true }],
};

const HIDDEN_EVENT = {
  id: 2,
  title: 'Secret Council',
  description: null,
  is_visible_to_players: false,
  era_dates: [{ era_id: 1, era_name: 'Age of Kings', abbreviation: 'AK', year: 301, is_visible_to_players: true }],
};

const UNDATED_EVENT = {
  id: 3,
  title: 'Lost in Time',
  description: null,
  is_visible_to_players: true,
  era_dates: [],
};

function renderDetail() {
  return render(<MemoryRouter><LocationDetail /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  locationService.getLocation.mockResolvedValue(BASE_LOCATION);
  locationService.getMaps.mockResolvedValue([]);
  locationService.getLocations.mockResolvedValue([BASE_LOCATION]);
  locationService.getLocationNpcs.mockResolvedValue([]);
  settingsService.getEventsForLocation.mockResolvedValue([]);
});

describe('LocationDetail — Timeline Events (GM view)', () => {
  beforeEach(() => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
  });

  it('shows "No timeline events linked" when none exist', async () => {
    renderDetail();
    await waitFor(() => expect(screen.getByText('No timeline events linked to this location.')).toBeTruthy());
  });

  it('shows event title when an event is linked', async () => {
    settingsService.getEventsForLocation.mockResolvedValue([SAMPLE_EVENT]);
    renderDetail();
    await waitFor(() => expect(screen.getByText('Battle of Olissipo')).toBeTruthy());
  });

  it('shows era date abbreviation and year for a dated event', async () => {
    settingsService.getEventsForLocation.mockResolvedValue([SAMPLE_EVENT]);
    renderDetail();
    await waitFor(() => expect(screen.getByText(/300 AK/)).toBeTruthy());
  });

  it('shows "Unknown date" italic for an undated event', async () => {
    settingsService.getEventsForLocation.mockResolvedValue([UNDATED_EVENT]);
    renderDetail();
    await waitFor(() => expect(screen.getByText('Unknown date')).toBeTruthy());
  });

  it('shows Hidden badge for events not visible to players', async () => {
    settingsService.getEventsForLocation.mockResolvedValue([HIDDEN_EVENT]);
    renderDetail();
    await waitFor(() => expect(screen.getByText('Secret Council')).toBeTruthy());
    expect(screen.getByText('Hidden')).toBeTruthy();
  });

  it('fetches events using the correct campaignId and locationId', async () => {
    renderDetail();
    await waitFor(() => expect(settingsService.getEventsForLocation).toHaveBeenCalledWith('42', '7'));
  });
});

describe('LocationDetail — Timeline Events (player preview mode)', () => {
  // playerView is a toggle in the header. When active, only visible content is shown
  // and the read-only player layout is used. Click the toggle to enter player preview.
  beforeEach(() => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
  });

  async function enterPlayerView() {
    await waitFor(() => expect(screen.getByTitle('Preview what players see')).toBeTruthy());
    fireEvent.click(screen.getByTitle('Preview what players see'));
  }

  it('hides the Timeline Events card when no events exist in player preview', async () => {
    renderDetail();
    await enterPlayerView();
    await waitFor(() => expect(screen.getByText(/Previewing as player/i)).toBeTruthy());
    expect(screen.queryByText('Timeline Events')).toBeNull();
  });

  it('shows event title in player preview when visible events exist', async () => {
    settingsService.getEventsForLocation.mockResolvedValue([SAMPLE_EVENT]);
    renderDetail();
    await enterPlayerView();
    await waitFor(() => expect(screen.getByText('Battle of Olissipo')).toBeTruthy());
  });

  it('shows "Unknown date" in player preview for undated visible events', async () => {
    settingsService.getEventsForLocation.mockResolvedValue([UNDATED_EVENT]);
    renderDetail();
    await enterPlayerView();
    await waitFor(() => expect(screen.getByText('Lost in Time')).toBeTruthy());
    expect(screen.getAllByText('Unknown date').length).toBeGreaterThan(0);
  });
});
