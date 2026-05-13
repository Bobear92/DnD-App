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

import settingsService from '../settingsService';
import npcService from '../../npcs/npcService';
import locationService from '../../locations/locationService';
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
