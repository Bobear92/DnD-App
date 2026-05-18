import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  default: {
    getEventsForNpc: vi.fn(),
    getEvents: vi.fn(),
    getCalendar: vi.fn(),
    getEventNpcs: vi.fn(),
    addEventNpc: vi.fn(),
    removeEventNpc: vi.fn(),
    createEvent: vi.fn(),
  },
}));
vi.mock('../../sessions/sessionService', () => ({
  default: { listSessions: vi.fn() },
}));

import { useCampaign } from '../../campaigns/CampaignContext';
import npcService from '../npcService';
import locationService from '../../locations/locationService';
import settingsService from '../../settings/settingsService';
import sessionService from '../../sessions/sessionService';
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
  settingsService.getEvents.mockResolvedValue([]);
  settingsService.getCalendar.mockResolvedValue({ eras: [], months: [] });
  settingsService.getEventNpcs.mockResolvedValue([]);
  settingsService.addEventNpc.mockResolvedValue({});
  settingsService.removeEventNpc.mockResolvedValue(undefined);
  settingsService.createEvent.mockResolvedValue({ id: 99, title: 'New Event' });
  sessionService.listSessions.mockResolvedValue([]);
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

describe('NPCDetail — Sessions card', () => {
  it('GM view always shows Sessions card — empty state when no sessions', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    sessionService.listSessions.mockResolvedValue([]);
    renderDetail();
    await waitFor(() => expect(screen.getByText('Sessions')).toBeTruthy());
    expect(screen.getByText('No session notes linked to this NPC.')).toBeTruthy();
  });

  it('GM view shows session titles with number prefix', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    sessionService.listSessions.mockResolvedValue([
      { id: 10, session_number: 18, title: 'Orc Princeling', is_visible_to_players: true, real_world_date: '2024-01-21' },
    ]);
    renderDetail();
    await waitFor(() => expect(screen.getByText(/Orc Princeling/)).toBeTruthy());
    expect(screen.getByText(/#18/)).toBeTruthy();
  });

  it('GM view shows Hidden badge for non-visible sessions', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    sessionService.listSessions.mockResolvedValue([
      { id: 11, session_number: null, title: 'Hidden Session', is_visible_to_players: false, real_world_date: null },
    ]);
    renderDetail();
    await waitFor(() => expect(screen.getByText('Hidden Session')).toBeTruthy());
    expect(screen.getAllByText('Hidden').length).toBeGreaterThanOrEqual(1);
  });

  it('player view hides Sessions card when no sessions', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    sessionService.listSessions.mockResolvedValue([]);
    renderDetail();
    await waitFor(() => expect(screen.getByText('Prince Thep')).toBeTruthy());
    expect(screen.queryByText('Sessions')).toBeNull();
  });

  it('player view shows Sessions card when sessions exist', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    sessionService.listSessions.mockResolvedValue([
      { id: 10, session_number: 18, title: 'Orc Princeling', is_visible_to_players: true, real_world_date: null },
    ]);
    renderDetail();
    await waitFor(() => expect(screen.getByText(/Orc Princeling/)).toBeTruthy());
  });
});

describe('NPCDetail — Timeline Events link/create/remove', () => {
  it('GM view shows + toggle button in timeline events card header', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => screen.getByTestId('timeline-events-toggle'));
    expect(screen.getByTestId('timeline-events-toggle')).toBeTruthy();
  });

  it('player view does not show + toggle button', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    renderDetail();
    await waitFor(() => expect(screen.getByText('Prince Thep')).toBeTruthy());
    expect(screen.queryByTestId('timeline-events-toggle')).toBeNull();
  });

  it('clicking + button shows Link existing / Create new mode toggle', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => screen.getByTestId('timeline-events-toggle'));
    fireEvent.click(screen.getByTestId('timeline-events-toggle'));
    await waitFor(() => {
      expect(screen.getByText('Link existing')).toBeTruthy();
      expect(screen.getByText('Create new')).toBeTruthy();
    });
  });

  it('create new mode shows title input and Create & Link button', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => screen.getByTestId('timeline-events-toggle'));
    fireEvent.click(screen.getByTestId('timeline-events-toggle'));
    await waitFor(() => screen.getByText('Create new'));
    fireEvent.click(screen.getByText('Create new'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('What happened?')).toBeTruthy();
      expect(screen.getByText('Create & Link')).toBeTruthy();
    });
  });

  it('Create & Link button is disabled when title is empty', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    renderDetail();
    await waitFor(() => screen.getByTestId('timeline-events-toggle'));
    fireEvent.click(screen.getByTestId('timeline-events-toggle'));
    await waitFor(() => screen.getByText('Create new'));
    fireEvent.click(screen.getByText('Create new'));
    await waitFor(() => screen.getByText('Create & Link'));
    const btn = screen.getByText('Create & Link').closest('button');
    expect(btn.disabled).toBe(true);
  });

  it('calls createEvent then addEventNpc and reloads on Create & Link', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.createEvent.mockResolvedValue({ id: 77, title: 'The Ambush' });
    settingsService.getEventsForNpc
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 77, title: 'The Ambush', is_visible_to_players: false, era_dates: [] }]);
    renderDetail();
    await waitFor(() => screen.getByTestId('timeline-events-toggle'));
    fireEvent.click(screen.getByTestId('timeline-events-toggle'));
    await waitFor(() => screen.getByText('Create new'));
    fireEvent.click(screen.getByText('Create new'));
    await waitFor(() => screen.getByPlaceholderText('What happened?'));
    fireEvent.change(screen.getByPlaceholderText('What happened?'), { target: { value: 'The Ambush' } });
    fireEvent.click(screen.getByText('Create & Link'));
    await waitFor(() => {
      expect(settingsService.createEvent).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ title: 'The Ambush', is_visible_to_players: false })
      );
      expect(settingsService.addEventNpc).toHaveBeenCalledWith('1', 77, { npc_id: 1 });
    });
    await waitFor(() => expect(screen.getByText('The Ambush')).toBeTruthy());
  });

  it('clicking unlink button calls getEventNpcs then removeEventNpc', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getEventsForNpc
      .mockResolvedValueOnce([{ id: 5, title: 'The Battle', is_visible_to_players: true, era_dates: [] }])
      .mockResolvedValue([]);
    settingsService.getEventNpcs.mockResolvedValue([{ id: 11, event_id: 5, npc_id: 1 }]);
    renderDetail();
    await waitFor(() => screen.getByText('The Battle'));
    fireEvent.click(screen.getByTestId('unlink-event-5'));
    await waitFor(() => {
      expect(settingsService.getEventNpcs).toHaveBeenCalledWith('1', 5);
      expect(settingsService.removeEventNpc).toHaveBeenCalledWith('1', 5, 11);
    });
    await waitFor(() => expect(screen.queryByText('The Battle')).toBeNull());
  });

  it('player view does not show unlink button on events', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    settingsService.getEventsForNpc.mockResolvedValue([
      { id: 5, title: 'The Battle', is_visible_to_players: true, era_dates: [] },
    ]);
    renderDetail();
    await waitFor(() => screen.getByText('The Battle'));
    expect(screen.queryByTestId('unlink-event-5')).toBeNull();
  });
});
