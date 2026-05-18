import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TimelinePage from './TimelinePage';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../settings/settingsService', () => ({
  default: {
    getCalendar: vi.fn(),
    createCalendar: vi.fn(),
    getEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    patchEventVisibility: vi.fn(),
    createEra: vi.fn(),
    updateEra: vi.fn(),
    deleteEra: vi.fn(),
    patchEraVisibility: vi.fn(),
    getEventNpcs: vi.fn(),
    getEventLocations: vi.fn(),
    addEventNpc: vi.fn(),
    addEventLocation: vi.fn(),
    removeEventNpc: vi.fn(),
    removeEventLocation: vi.fn(),
  },
}));

vi.mock('../../npcs/npcService', () => ({
  default: { getNpcs: vi.fn() },
}));

vi.mock('../../locations/locationService', () => ({
  default: { getLocations: vi.fn() },
}));

vi.mock('../../sessions/sessionService', () => ({
  default: { listSessions: vi.fn() },
}));

vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: vi.fn(),
}));

import settingsService from '../../settings/settingsService';
import npcService from '../../npcs/npcService';
import locationService from '../../locations/locationService';
import sessionService from '../../sessions/sessionService';
import { useCampaign } from '../../campaigns/CampaignContext';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ERA = { id: 1, name: 'Age of Kings', abbreviation: 'AK', direction: 'ascending', is_primary: true, is_current: true, is_visible_to_players: true, epoch_offset: 0, era_start_absolute: null, era_end_absolute: null };
const CALENDAR = { id: 1, campaign_id: 1, eras: [ERA], seasons: [], months: [], weekdays: [] };
const CALENDAR_WITH_MONTHS = {
  ...CALENDAR,
  months: [
    { id: 1, order_index: 1, name: 'Frostfall' },
    { id: 2, order_index: 2, name: null },
  ],
};

const POINT_EVENT = {
  id: 10, campaign_id: 1, title: 'The Founding', description: 'Year one.',
  era_id: 1, year: 1, month_order: null, day: null, absolute_year: 1,
  end_era_id: null, end_year: null, end_month_order: null, end_day: null, end_absolute_year: null,
  era_dates: [{ era_id: 1, era_name: 'Age of Kings', abbreviation: 'AK', year: 1, month_name: null, day: null, is_visible_to_players: true }],
  gm_notes: null, is_visible_to_players: true, created_at: '2026-01-01T00:00:00',
};

const SPAN_EVENT = {
  id: 11, campaign_id: 1, title: 'The Long War', description: 'Years of conflict.',
  era_id: 1, year: 100, month_order: null, day: null, absolute_year: 100,
  end_era_id: 1, end_year: 150, end_month_order: null, end_day: null, end_absolute_year: 150,
  era_dates: [{ era_id: 1, era_name: 'Age of Kings', abbreviation: 'AK', year: 100, month_name: null, day: null, is_visible_to_players: true }],
  gm_notes: 'Secret war notes.', is_visible_to_players: true, created_at: '2026-01-01T00:00:00',
};

const HIDDEN_EVENT = {
  id: 12, campaign_id: 1, title: 'Hidden Plot', description: null,
  era_id: null, year: null, month_order: null, day: null, absolute_year: null,
  end_era_id: null, end_year: null, end_month_order: null, end_day: null, end_absolute_year: null,
  era_dates: [],
  gm_notes: null, is_visible_to_players: false, created_at: '2026-01-01T00:00:00',
};

function renderPage(campaign = { id: 1, name: 'Test', userRole: 'gm' }) {
  useCampaign.mockReturnValue({ campaign });
  return render(
    <MemoryRouter initialEntries={['/campaigns/1/timeline']}>
      <Routes>
        <Route path="/campaigns/:campaignId/timeline" element={<TimelinePage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  npcService.getNpcs.mockResolvedValue([]);
  locationService.getLocations.mockResolvedValue([]);
  sessionService.listSessions.mockResolvedValue([]);
  settingsService.getEventNpcs.mockResolvedValue([]);
  settingsService.getEventLocations.mockResolvedValue([]);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TimelinePage — loading', () => {
  it('shows loading spinner initially', () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });
});

describe('TimelinePage — no calendar / no eras (landing)', () => {
  it('shows landing page when no calendar exists', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('No Timeline Yet')).toBeInTheDocument());
  });

  it('shows GM set-up button in landing', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Set Up Timeline')).toBeInTheDocument());
  });

  it('shows player message when no timeline set up', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    settingsService.getEvents.mockResolvedValue([]);
    renderPage({ id: 1, name: 'Test', userRole: 'player' });
    await waitFor(() => expect(screen.getByText(/GM hasn't set up/)).toBeInTheDocument());
  });
});

describe('TimelinePage — eras section', () => {
  it('shows era names and abbreviations', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Age of Kings')).toBeInTheDocument());
    expect(screen.getByText('(AK)')).toBeInTheDocument();
  });

  it('shows Add Era button for GM', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Add Era')).toBeInTheDocument());
  });

  it('hides Add Era button for player', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage({ id: 1, name: 'Test', userRole: 'player' });
    await waitFor(() => expect(screen.queryByText('Add Era')).not.toBeInTheDocument());
  });
});

describe('TimelinePage — point-in-time events', () => {
  it('renders event title and era dates', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([POINT_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    // Multiple elements may show "1 AK" (era row + event card); just check at least one exists
    expect(screen.getAllByText(/1\s*AK/).length).toBeGreaterThan(0);
  });

  it('shows New Event button for GM', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('New Event')).toBeInTheDocument());
  });

  it('hides New Event button for player', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage({ id: 1, name: 'Test', userRole: 'player' });
    await waitFor(() => expect(screen.queryByText('New Event')).not.toBeInTheDocument());
  });

  it('shows Hidden badge for non-visible events (GM view)', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([HIDDEN_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Hidden Plot')).toBeInTheDocument());
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});

describe('TimelinePage — span events', () => {
  it('renders span event title', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([SPAN_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Long War')).toBeInTheDocument());
  });

  it('shows Span badge for multi-day events', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([SPAN_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Span')).toBeInTheDocument());
  });

  it('shows end year in card', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([SPAN_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/150\s*AK/)).toBeInTheDocument());
  });
});

describe('TimelinePage — unknown date section', () => {
  it('shows events without absolute_year in unknown date section', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([HIDDEN_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Unknown Date')).toBeInTheDocument());
    expect(screen.getByText('Hidden Plot')).toBeInTheDocument();
  });

  it('does not show unknown date section when all events are dated', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([POINT_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    expect(screen.queryByText('Unknown Date')).not.toBeInTheDocument();
  });
});

describe('TimelinePage — GM actions', () => {
  it('opens create event dialog on New Event click', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('New Event'));
    fireEvent.click(screen.getByText('New Event'));
    expect(screen.getByText('New Timeline Event')).toBeInTheDocument();
  });

  it('event dialog has start and end date fields', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('New Event'));
    fireEvent.click(screen.getByText('New Event'));
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('opens edit dialog with existing event data', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([POINT_EVENT]);
    renderPage();
    await waitFor(() => screen.getByText('The Founding'));
    // Multiple Edit buttons may exist (era row + event card); click the event one
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[editButtons.length - 1]);
    await waitFor(() => expect(screen.getByText('Edit Timeline Event')).toBeInTheDocument());
  });

  it('calls createEvent service with end date fields', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([]);
    settingsService.createEvent.mockResolvedValue({ ...SPAN_EVENT, id: 99 });
    renderPage();
    await waitFor(() => screen.getByText('New Event'));
    fireEvent.click(screen.getByText('New Event'));

    const titleInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(titleInput, { target: { value: 'New Span' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => expect(settingsService.createEvent).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ title: 'New Span' }),
    ));
  });
});

describe('TimelinePage — EndDateLabel fallback and detail', () => {
  it('shows "Span" badge when only end_day is set (no end_year)', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([
      { ...POINT_EVENT, end_day: 15 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    expect(screen.getByText('Span')).toBeInTheDocument();
  });

  it('shows "Span" badge when only end_month_order is set', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([
      { ...POINT_EVENT, end_month_order: 3 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    expect(screen.getByText('Span')).toBeInTheDocument();
  });

  it('does not show Span badge for pure point-in-time event (all end fields null)', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([POINT_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    expect(screen.queryByText('Span')).not.toBeInTheDocument();
  });

  it('EndDateLabel falls back to start era abbreviation when end_era_id is null', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([
      { ...POINT_EVENT, end_era_id: null, end_year: 200, end_absolute_year: 200 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    // effectiveEndEraId = null ?? era_id(1) = 1 → abbreviation "AK"; effectiveEndYear = 200 ?? 1 = 200
    expect(screen.getAllByText(/200\s*AK/).length).toBeGreaterThan(0);
  });

  it('EndDateLabel shows named month from calendarMonths', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_MONTHS);
    settingsService.getEvents.mockResolvedValue([
      { ...SPAN_EVENT, end_month_order: 1 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Long War')).toBeInTheDocument());
    expect(screen.getAllByText(/Frostfall/).length).toBeGreaterThan(0);
  });

  it('EndDateLabel shows "Month N" when calendar month has no name', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_MONTHS);
    settingsService.getEvents.mockResolvedValue([
      { ...SPAN_EVENT, end_month_order: 2 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Long War')).toBeInTheDocument());
    expect(screen.getAllByText(/Month 2/).length).toBeGreaterThan(0);
  });

  it('EndDateLabel shows end_day in prose format', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([
      { ...SPAN_EVENT, end_day: 7 },
    ]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Long War')).toBeInTheDocument());
    expect(screen.getAllByText(/7th day/).length).toBeGreaterThan(0);
  });
});

describe('TimelinePage — day ordinal format and year banner', () => {
  const EVENT_WITH_DAY = {
    ...POINT_EVENT, id: 20, title: 'Birth of the King',
    month_order: 1, day: 1,
    era_dates: [{ era_id: 1, abbreviation: 'AK', year: 500, month_name: 'Frostfall', day: 1, is_visible_to_players: true }],
    absolute_year: 500,
  };

  const EVENT_WITH_DAY_18 = {
    ...POINT_EVENT, id: 21, title: 'Battle of Feansfall',
    month_order: 2, day: 18,
    era_dates: [{ era_id: 1, abbreviation: 'AK', year: 501, month_name: 'Feansfall', day: 18, is_visible_to_players: true }],
    absolute_year: 501,
  };

  it('renders "The first day of Frostfall" for day=1 with month', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([EVENT_WITH_DAY]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Birth of the King')).toBeInTheDocument());
    expect(screen.getByText('The first day of Frostfall')).toBeInTheDocument();
  });

  it('renders "The 18th day of Feansfall" for day=18 with month', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([EVENT_WITH_DAY_18]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Battle of Feansfall')).toBeInTheDocument());
    expect(screen.getByText('The 18th day of Feansfall')).toBeInTheDocument();
  });

  it('shows year banner on center line for events with month/day', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([EVENT_WITH_DAY]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Birth of the King')).toBeInTheDocument());
    expect(screen.getByText('500 AK')).toBeInTheDocument();
  });

  it('does not show year inline on card for detailed-date events', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([EVENT_WITH_DAY]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Birth of the King')).toBeInTheDocument());
    // Year appears once in banner, NOT inside the card's EraDateList
    expect(screen.getAllByText('500 AK').length).toBe(1);
  });

  it('shows year inline on card for year-only events (no banner)', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([POINT_EVENT]);
    renderPage();
    await waitFor(() => expect(screen.getByText('The Founding')).toBeInTheDocument());
    // Year-only event: no banner, year shows directly in card
    expect(screen.getAllByText(/1\s*AK/).length).toBeGreaterThan(0);
  });
});

describe('TimelinePage — current date card', () => {
  const CALENDAR_WITH_DATE = {
    ...CALENDAR,
    current_era_id: 1,
    current_year: 3739,
    current_month_order: 1,
    current_day: 1,
    months: [{ id: 1, order_index: 1, name: 'Prógontḗ' }],
    days_per_month: 30,
  };

  it('shows Current Date card when calendar exists', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_DATE);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Current Date')).toBeInTheDocument());
  });

  it('formats date with prose ordinal day and era abbreviation', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_DATE);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/The first day of Prógontḗ/)).toBeInTheDocument());
    expect(screen.getByText(/3,739 AK/)).toBeInTheDocument();
  });

  it('shows "No current date set" when no date fields are set', async () => {
    settingsService.getCalendar.mockResolvedValue({ ...CALENDAR, days_per_month: 30 });
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Current Date')).toBeInTheDocument());
    expect(screen.getByText(/No current date set/)).toBeInTheDocument();
  });

  it('shows Save Date form for GM', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_DATE);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Advance Date')).toBeInTheDocument());
    expect(screen.getByText('Save Date')).toBeInTheDocument();
  });

  it('hides Save Date form for player', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_DATE);
    settingsService.getEvents.mockResolvedValue([]);
    renderPage({ id: 1, name: 'Test', userRole: 'player' });
    await waitFor(() => expect(screen.getByText('Current Date')).toBeInTheDocument());
    expect(screen.queryByText('Save Date')).not.toBeInTheDocument();
  });

  it('calls updateCalendar on Save Date', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR_WITH_DATE);
    settingsService.getEvents.mockResolvedValue([]);
    settingsService.updateCalendar = vi.fn().mockResolvedValue(CALENDAR_WITH_DATE);
    renderPage();
    await waitFor(() => screen.getByText('Save Date'));
    fireEvent.click(screen.getByText('Save Date'));
    await waitFor(() => expect(settingsService.updateCalendar).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ current_year: 3739 }),
    ));
  });
});

describe('TimelinePage — Edit dialog pre-fills end date fields (regression: stale server bug)', () => {
  it('Edit dialog pre-fills end_year from span event', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([SPAN_EVENT]);
    renderPage();
    await waitFor(() => screen.getByText('The Long War'));
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[editButtons.length - 1]);
    await waitFor(() => screen.getByText('Edit Timeline Event'));
    // SPAN_EVENT.end_year = 150 — the end year input must show 150
    expect(screen.getByDisplayValue('150')).toBeInTheDocument();
  });

  it('Edit dialog leaves end_year blank for point-in-time event', async () => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
    settingsService.getEvents.mockResolvedValue([POINT_EVENT]);
    renderPage();
    await waitFor(() => screen.getByText('The Founding'));
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[editButtons.length - 1]);
    await waitFor(() => screen.getByText('Edit Timeline Event'));
    // POINT_EVENT.end_year = null → form.end_year = '' — no input should display "150"
    expect(screen.queryByDisplayValue('150')).not.toBeInTheDocument();
    // Only the start year input should show "1"
    expect(screen.getAllByDisplayValue('1').length).toBe(1);
  });
});
