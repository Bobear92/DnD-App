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

import { useCampaign } from '../../campaigns/CampaignContext';
import npcService from '../npcService';
import locationService from '../../locations/locationService';
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
