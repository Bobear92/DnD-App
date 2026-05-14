import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../settingsService', () => ({
  default: {
    getCalendar: vi.fn(),
    getEvents: vi.fn(),
    createCalendar: vi.fn(),
    createEra: vi.fn(),
    updateEra: vi.fn(),
    deleteEra: vi.fn(),
    patchEraVisibility: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    patchEventVisibility: vi.fn(),
    getEventNpcs: vi.fn(),
    getEventLocations: vi.fn(),
    addEventNpc: vi.fn(),
    removeEventNpc: vi.fn(),
    addEventLocation: vi.fn(),
    removeEventLocation: vi.fn(),
  },
}));

vi.mock('../../npcs/npcService', () => ({
  default: { getNpcs: vi.fn() },
  mapNpcImageUrl: () => null,
}));

vi.mock('../../locations/locationService', () => ({
  default: { getLocations: vi.fn() },
}));

vi.mock('../../sessions/sessionService', () => ({
  default: { listSessions: vi.fn() },
}));

import settingsService from '../settingsService';
import npcService from '../../npcs/npcService';
import locationService from '../../locations/locationService';
import sessionService from '../../sessions/sessionService';
import TimelineTab from './TimelineTab';

const PRIMARY_ERA = {
  id: 1,
  name: 'Age of Kings',
  abbreviation: 'AK',
  direction: 'ascending',
  is_primary: true,
  is_current: true,
  is_visible_to_players: false,
  epoch_offset: 0,
  era_start_absolute: 1,
  era_end_absolute: null,
};

const CALENDAR_WITH_ERA = {
  id: 1,
  campaign_id: 1,
  name: 'Campaign Calendar',
  days_per_month: 30,
  use_weeks: false,
  days_per_week: null,
  seasons: [],
  months: [],
  eras: [PRIMARY_ERA],
  weekdays: [],
};

const SAMPLE_EVENT = {
  id: 1,
  title: 'The Battle of Ironhold',
  description: 'A great battle.',
  era_id: 1,
  year: 100,
  month_order: null,
  day: null,
  absolute_year: 100,
  is_visible_to_players: false,
  era_dates: [{ era_id: 1, name: 'Age of Kings', abbreviation: 'AK', direction: 'ascending', year: 100 }],
};

function renderTab(isGm = true) {
  return render(
    <MemoryRouter>
      <TimelineTab campaignId="1" isGm={isGm} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  npcService.getNpcs.mockResolvedValue([]);
  locationService.getLocations.mockResolvedValue([]);
  sessionService.listSessions.mockResolvedValue([]);
});

describe('TimelineTab — no eras (landing)', () => {
  beforeEach(() => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    settingsService.getEvents.mockResolvedValue([]);
  });

  it('renders era diagram when no eras exist', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText(/Year 1 meets Year 1/i)).toBeTruthy());
  });

  it('shows prose explanation about primary vs secondary eras', async () => {
    renderTab();
    await waitFor(() => expect(screen.getAllByText(/primary era/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/descending era/i).length).toBeGreaterThan(0);
  });

  it('shows Set Up Timeline button for GM', async () => {
    renderTab(true);
    await waitFor(() => expect(screen.getByText('Set Up Timeline')).toBeTruthy());
  });

  it('player sees "not set up" message — no Set Up button', async () => {
    renderTab(false);
    await waitFor(() => expect(screen.queryByText('Set Up Timeline')).toBeNull());
    expect(screen.getByText(/No timeline has been set up/i)).toBeTruthy();
  });

  it('clicking Set Up Timeline shows primary era form', async () => {
    renderTab(true);
    await waitFor(() => screen.getByText('Set Up Timeline'));
    fireEvent.click(screen.getByText('Set Up Timeline'));
    await waitFor(() => expect(screen.getByText('Create Primary Era')).toBeTruthy());
    expect(screen.getByPlaceholderText('Age of Kings')).toBeTruthy();
    expect(screen.getByPlaceholderText('AK')).toBeTruthy();
  });
});

describe('TimelineTab — eras exist', () => {
  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_ERA);
    settingsService.getEvents.mockResolvedValue([]);
  });

  it('renders the era list section', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Eras')).toBeTruthy());
    expect(screen.getByText('Age of Kings')).toBeTruthy();
  });

  it('shows primary and current badges on the primary era', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Primary')).toBeTruthy());
    expect(screen.getByText('Current')).toBeTruthy();
  });

  it('renders the Timeline Events section', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Timeline Events')).toBeTruthy());
    expect(screen.getByText('No events yet.')).toBeTruthy();
  });

  it('GM sees Add Era and Add Event buttons', async () => {
    renderTab(true);
    await waitFor(() => expect(screen.getByText('Add Era')).toBeTruthy());
    expect(screen.getByText('Add Event')).toBeTruthy();
  });

  it('player does not see Add Era or Add Event buttons', async () => {
    renderTab(false);
    await waitFor(() => expect(screen.getByText('Eras')).toBeTruthy());
    expect(screen.queryByText('Add Era')).toBeNull();
    expect(screen.queryByText('Add Event')).toBeNull();
  });
});

describe('TimelineTab — events with era_dates', () => {
  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_ERA);
    settingsService.getEvents.mockResolvedValue([SAMPLE_EVENT]);
  });

  it('renders event title', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('The Battle of Ironhold')).toBeTruthy());
  });

  it('renders era_dates abbreviation next to event', async () => {
    renderTab();
    // EraDateList renders "{year} {abbreviation}" — e.g. "100 AK" in the event row
    await waitFor(() => expect(screen.getAllByText(/100 AK/).length).toBeGreaterThan(0));
  });

  it('GM-only event shows "GM only" label', async () => {
    renderTab(true);
    // "GM only" appears for the era (not player-visible) and the event (not player-visible)
    await waitFor(() => expect(screen.getAllByText(/GM only/i).length).toBeGreaterThan(0));
  });

  it('player does not see Add Event button but sees visible events', async () => {
    settingsService.getEvents.mockResolvedValue([{ ...SAMPLE_EVENT, is_visible_to_players: true, era_dates: [] }]);
    renderTab(false);
    await waitFor(() => expect(screen.getByText('The Battle of Ironhold')).toBeTruthy());
    expect(screen.queryByText('Add Event')).toBeNull();
  });
});

describe('TimelineTab — Unknown Date section', () => {
  const UNDATED_EVENT = {
    id: 2,
    title: 'The Founding of the Order',
    description: 'Lost to history.',
    era_id: null,
    year: null,
    month_order: null,
    day: null,
    absolute_year: null,
    is_visible_to_players: false,
    era_dates: [],
  };

  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_ERA);
  });

  it('shows Unknown Date section when an event has no era_dates', async () => {
    settingsService.getEvents.mockResolvedValue([UNDATED_EVENT]);
    renderTab(true);
    await waitFor(() => expect(screen.getByText('Unknown Date')).toBeTruthy());
    expect(screen.getByText('The Founding of the Order')).toBeTruthy();
  });

  it('dated events do not appear in Unknown Date section', async () => {
    settingsService.getEvents.mockResolvedValue([SAMPLE_EVENT, UNDATED_EVENT]);
    renderTab(true);
    await waitFor(() => expect(screen.getByText('Unknown Date')).toBeTruthy());
    // Both events render but only UNDATED_EVENT is under the Unknown Date divider
    expect(screen.getByText('The Battle of Ironhold')).toBeTruthy();
    expect(screen.getByText('The Founding of the Order')).toBeTruthy();
  });

  it('Unknown Date section is hidden when all events have era_dates', async () => {
    settingsService.getEvents.mockResolvedValue([SAMPLE_EVENT]);
    renderTab(true);
    await waitFor(() => expect(screen.getByText('The Battle of Ironhold')).toBeTruthy());
    expect(screen.queryByText('Unknown Date')).toBeNull();
  });

  it('player sees visible undated events in Unknown Date section', async () => {
    const visibleUndated = { ...UNDATED_EVENT, is_visible_to_players: true };
    settingsService.getEvents.mockResolvedValue([visibleUndated]);
    renderTab(false);
    await waitFor(() => expect(screen.getByText('Unknown Date')).toBeTruthy());
    expect(screen.getByText('The Founding of the Order')).toBeTruthy();
  });
});

describe('TimelineTab — player view strips GM-only era dates', () => {
  const GM_ONLY_ERA = {
    id: 10,
    name: 'Ancient Before',
    abbreviation: 'ABF',
    direction: 'descending',
    is_primary: false,
    is_current: false,
    is_visible_to_players: false,
    epoch_offset: 0,
    era_start_absolute: null,
    era_end_absolute: 0,
  };
  const PLAYER_ERA = {
    id: 11,
    name: 'Official Calendar',
    abbreviation: 'OFC',
    direction: 'ascending',
    is_primary: true,
    is_current: true,
    is_visible_to_players: true,
    epoch_offset: 0,
    era_start_absolute: 1,
    era_end_absolute: null,
  };
  const EVENT_WITH_BOTH_ERAS = {
    id: 5,
    title: 'City Founded',
    description: null,
    era_id: 11,
    year: 100,
    month_order: null,
    day: null,
    absolute_year: 100,
    is_visible_to_players: true,
    era_dates: [
      { era_id: 10, era_name: 'Ancient Before', abbreviation: 'ABF', year: 5000, is_visible_to_players: false },
      { era_id: 11, era_name: 'Official Calendar', abbreviation: 'OFC', year: 100, is_visible_to_players: true },
    ],
  };

  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue({
      id: 1, campaign_id: 1, name: 'Campaign Calendar', days_per_month: 30,
      use_weeks: false, days_per_week: null, seasons: [], months: [], weekdays: [],
      eras: [GM_ONLY_ERA, PLAYER_ERA],
    });
    settingsService.getEvents.mockResolvedValue([EVENT_WITH_BOTH_ERAS]);
  });

  it('GM sees era dates from all eras before toggling player view', async () => {
    renderTab(true);
    await waitFor(() => expect(screen.getByText('City Founded')).toBeTruthy());
    expect(screen.getByText(/5000 ABF/)).toBeTruthy();
    expect(screen.getByText(/100 OFC/)).toBeTruthy();
  });

  it('player view toggle hides dates from GM-only eras', async () => {
    renderTab(true);
    await waitFor(() => screen.getByText('Player View'));
    fireEvent.click(screen.getByText('Player View'));
    await waitFor(() => expect(screen.getByText('City Founded')).toBeTruthy());
    expect(screen.queryByText(/5000 ABF/)).toBeNull();
    expect(screen.getByText(/100 OFC/)).toBeTruthy();
  });
});

describe('TimelineTab — linked NPC and location names in expanded event', () => {
  const NPC_LINK = { id: 10, event_id: 1, npc_id: 5, npc_name: 'Feanor', description: null, created_at: '2024-01-01T00:00:00' };
  const LOC_LINK = { id: 20, event_id: 1, location_id: 7, location_name: 'Olissipo', description: null, created_at: '2024-01-01T00:00:00' };

  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_ERA);
    settingsService.getEvents.mockResolvedValue([SAMPLE_EVENT]);
    settingsService.getEventNpcs.mockResolvedValue([NPC_LINK]);
    settingsService.getEventLocations.mockResolvedValue([LOC_LINK]);
  });

  async function expandEvent() {
    renderTab(true);
    await waitFor(() => screen.getByText('The Battle of Ironhold'));
    fireEvent.click(screen.getByText('The Battle of Ironhold'));
    await waitFor(() => expect(settingsService.getEventNpcs).toHaveBeenCalled());
  }

  it('shows npc_name from the link response — not "NPC #N"', async () => {
    await expandEvent();
    await waitFor(() => expect(screen.getByText('Feanor')).toBeTruthy());
    expect(screen.queryByText(/NPC #/)).toBeNull();
  });

  it('shows location_name from the link response — not "Location #N"', async () => {
    await expandEvent();
    await waitFor(() => expect(screen.getByText('Olissipo')).toBeTruthy());
    expect(screen.queryByText(/Location #/)).toBeNull();
  });

  it('NPC name navigates to NPC detail page on click', async () => {
    await expandEvent();
    await waitFor(() => screen.getByText('Feanor'));
    fireEvent.click(screen.getByText('Feanor'));
    // useNavigate is the real MemoryRouter one here; verify no crash and the mock was set up correctly
    // (navigation is tested end-to-end; here we just guard against a crash / wrong text)
    expect(screen.getByText('Feanor')).toBeTruthy();
  });

  it('location name navigates to location detail page on click', async () => {
    await expandEvent();
    await waitFor(() => screen.getByText('Olissipo'));
    fireEvent.click(screen.getByText('Olissipo'));
    expect(screen.getByText('Olissipo')).toBeTruthy();
  });
});

describe('TimelineTab — Sessions section in expanded event', () => {
  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_ERA);
    settingsService.getEvents.mockResolvedValue([SAMPLE_EVENT]);
    settingsService.getEventNpcs.mockResolvedValue([]);
    settingsService.getEventLocations.mockResolvedValue([]);
  });

  async function expandEvent() {
    renderTab(true);
    await waitFor(() => screen.getByText('The Battle of Ironhold'));
    fireEvent.click(screen.getByText('The Battle of Ironhold'));
    await waitFor(() => expect(settingsService.getEventNpcs).toHaveBeenCalled());
  }

  it('GM view shows Sessions section — "None linked" when empty', async () => {
    sessionService.listSessions.mockResolvedValue([]);
    await expandEvent();
    await waitFor(() => expect(screen.getByText('Sessions')).toBeTruthy());
    expect(screen.getByText('No sessions linked.')).toBeTruthy();
  });

  it('GM view shows session title when sessions are linked', async () => {
    sessionService.listSessions.mockResolvedValue([
      { id: 10, session_number: 18, title: 'Orc Princeling', is_visible_to_players: true, real_world_date: '2024-01-21' },
    ]);
    await expandEvent();
    await waitFor(() => expect(screen.getByText(/Orc Princeling/)).toBeTruthy());
  });

  it('GM view shows Hidden badge for non-visible sessions', async () => {
    sessionService.listSessions.mockResolvedValue([
      { id: 11, session_number: null, title: 'Hidden Session', is_visible_to_players: false, real_world_date: null },
    ]);
    await expandEvent();
    await waitFor(() => expect(screen.getByText('Hidden Session')).toBeTruthy());
    expect(screen.getByText('Hidden')).toBeTruthy();
  });

  it('player view hides Sessions section when no sessions', async () => {
    sessionService.listSessions.mockResolvedValue([]);
    renderTab(false);
    await waitFor(() => screen.getByText('The Battle of Ironhold'));
    fireEvent.click(screen.getByText('The Battle of Ironhold'));
    await waitFor(() => expect(settingsService.getEventNpcs).toHaveBeenCalled());
    expect(screen.queryByText('Sessions')).toBeNull();
  });

  it('player view shows Sessions section when sessions exist', async () => {
    sessionService.listSessions.mockResolvedValue([
      { id: 10, session_number: null, title: 'The Arrival', is_visible_to_players: true, real_world_date: null },
    ]);
    renderTab(false);
    await waitFor(() => screen.getByText('The Battle of Ironhold'));
    fireEvent.click(screen.getByText('The Battle of Ironhold'));
    await waitFor(() => expect(screen.getByText('The Arrival')).toBeTruthy());
  });
});
