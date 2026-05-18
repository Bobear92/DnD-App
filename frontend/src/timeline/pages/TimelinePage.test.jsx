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
