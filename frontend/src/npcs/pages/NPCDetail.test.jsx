import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '1', npcId: '1' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('../npcService', () => ({
  default: {
    getNpc: vi.fn(),
    getNpcs: vi.fn(),
    getRelationships: vi.fn(),
    getPlayerRelationships: vi.fn(),
    getCampaignDetails: vi.fn(),
    createRelationship: vi.fn(),
  },
  mapNpcImageUrl: () => null,
}));
vi.mock('../../locations/locationService', () => ({
  default: { getLocations: vi.fn() },
}));
vi.mock('../../settings/settingsService', () => ({
  default: { getEventsForNpc: vi.fn() },
}));

import { useCampaign } from '../../campaigns/CampaignContext';
import npcService from '../npcService';
import locationService from '../../locations/locationService';
import settingsService from '../../settings/settingsService';
import NPCDetail from './NPCDetail';

const GM_CAMPAIGN = { id: 1, name: 'Test Campaign', userRole: 'gm', created_by: 1 };
const PLAYER_CAMPAIGN = { id: 1, name: 'Test Campaign', userRole: 'player', created_by: 99 };

const NPC = {
  id: 1, campaign_id: 1, name: 'Prince Thep', race: 'Gnome', occupation: 'Prince',
  alignment: 'Neutral Good', status: 'alive', is_visible_to_players: true,
  age: null, gender: null, height: null, weight: null, appearance: null,
  voice: null, personality_traits: null, ideals: null, bonds: null, flaws: null,
  languages: [], summary: 'A noble gnome prince.', description: null, backstory: null,
  gm_notes: 'Secret: he is a spy.', last_known_location_id: null, last_seen_notes: null,
  theme_music_url: null, stats: null, image_path: null,
};

function renderDetail() {
  return render(<MemoryRouter><NPCDetail /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  npcService.getNpc.mockResolvedValue(NPC);
  npcService.getNpcs.mockResolvedValue([NPC]);
  npcService.getRelationships.mockResolvedValue([]);
  npcService.getPlayerRelationships.mockResolvedValue([]);
  npcService.getCampaignDetails.mockResolvedValue({ id: 1, members: [] });
  locationService.getLocations.mockResolvedValue([]);
  settingsService.getEventsForNpc.mockResolvedValue([]);
});

describe('NPCDetail — render', () => {
  it('renders NPC name after loading (GM view)', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Prince Thep')).toBeTruthy();
    });
  });

  it('does not crash with null last_known_location_id — regression: SelectItem empty string', async () => {
    // last_known_location_id=null caused Select value="" which Radix UI forbids,
    // crashing the entire React tree with a blank page. Fixed by using "__none__" sentinel.
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Prince Thep')).toBeTruthy();
    });
  });

  it('shows error message when NPC fails to load', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    npcService.getNpc.mockRejectedValue({ response: { data: { detail: 'NPC not found' } } });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('NPC not found')).toBeTruthy();
    });
  });

  it('hides GM Notes in player view', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Prince Thep')).toBeTruthy();
    });
    expect(screen.queryByText('GM Notes')).toBeNull();
  });

  it('shows GM Notes card to GM', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('GM Notes')).toBeTruthy();
    });
  });
});

describe('NPCDetail — Timeline Events card', () => {
  it('GM view always shows Timeline Events card — empty state when no events', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getEventsForNpc.mockResolvedValue([]);
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Timeline Events')).toBeTruthy();
    });
    expect(screen.getByText('No timeline events linked to this NPC.')).toBeTruthy();
  });

  it('GM view shows event titles and era dates', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getEventsForNpc.mockResolvedValue([
      { id: 1, title: 'The Heist', is_visible_to_players: true, era_dates: [{ era_id: 1, year: 412, abbreviation: 'AE' }] },
    ]);
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('The Heist')).toBeTruthy();
    });
    expect(screen.getByText(/412.*AE/)).toBeTruthy();
  });

  it('GM view shows Hidden badge for non-visible events', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getEventsForNpc.mockResolvedValue([
      { id: 2, title: 'Secret Meeting', is_visible_to_players: false, era_dates: [] },
    ]);
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Secret Meeting')).toBeTruthy();
    });
    expect(screen.getByText('Hidden')).toBeTruthy();
  });

  it('player view hides Timeline Events card when no events', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    settingsService.getEventsForNpc.mockResolvedValue([]);
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Prince Thep')).toBeTruthy();
    });
    expect(screen.queryByText('Timeline Events')).toBeNull();
  });

  it('player view shows Timeline Events card when events exist', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    settingsService.getEventsForNpc.mockResolvedValue([
      { id: 1, title: 'The Coronation', is_visible_to_players: true, era_dates: [{ era_id: 1, year: 100, abbreviation: 'CR' }] },
    ]);
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('The Coronation')).toBeTruthy();
    });
  });
});
