import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '1' }),
}));
vi.mock('../settings/settingsService', () => ({
  default: { getCalendar: vi.fn(), updateCalendar: vi.fn() },
}));

import { useCampaign } from '../campaigns/CampaignContext';
import settingsService from '../settings/settingsService';
import Dashboard from './Dashboard';

const GM_CAMPAIGN = { id: 1, name: 'Test Campaign', userRole: 'gm', created_by: 1 };
const PLAYER_CAMPAIGN = { id: 1, name: 'Test Campaign', userRole: 'player', created_by: 99 };

const EMPTY_CALENDAR = {
  id: 1, campaign_id: 1, name: 'Campaign Calendar', days_per_month: 30,
  use_weeks: false, days_per_week: null,
  current_era_id: null, current_year: null, current_month_order: null, current_day: null,
  seasons: [], months: [], eras: [], weekdays: [],
};

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>);
}

beforeEach(() => { vi.clearAllMocks(); });

describe('Dashboard — loading', () => {
  it('shows loading spinner while calendar is fetching', () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/Loading/i)).toBeTruthy();
  });
});

describe('Dashboard — no calendar (404)', () => {
  it('shows no-calendar message when 404', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/No calendar has been set up/i)).toBeTruthy());
  });

  it('GM sees Campaign Time hint when no calendar', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Go to Campaign Time/i)).toBeTruthy());
  });
});

describe('Dashboard — calendar with no date set', () => {
  it('shows "No current date has been set" when all date fields are null', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockResolvedValue(EMPTY_CALENDAR);
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/No current date has been set/i)).toBeTruthy());
  });
});

describe('Dashboard — calendar with date set', () => {
  it('formats and displays day, named month, year, and era abbreviation', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    const cal = {
      ...EMPTY_CALENDAR,
      current_era_id: 1, current_year: 452, current_month_order: 2, current_day: 15,
      months: [{ id: 1, name: 'Frostfall', order_index: 2, season_id: null }],
      eras: [{ id: 1, name: 'OFC Era', abbreviation: 'OFC' }],
    };
    settingsService.getCalendar.mockResolvedValue(cal);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Day 15, Frostfall, Year 452 OFC')).toBeTruthy());
  });

  it('falls back to "Month N" when month has no name', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    const cal = {
      ...EMPTY_CALENDAR,
      current_year: 10, current_month_order: 3, current_day: 1,
      months: [{ id: 3, name: null, order_index: 3, season_id: null }],
    };
    settingsService.getCalendar.mockResolvedValue(cal);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Day 1, Month 3, Year 10')).toBeTruthy());
  });
});

describe('Dashboard — GM vs player gating', () => {
  it('GM sees the Save Date button (date editing form visible)', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockResolvedValue(EMPTY_CALENDAR);
    renderDashboard();
    await waitFor(() => expect(screen.getByRole('button', { name: /Save Date/i })).toBeTruthy());
  });

  it('player does not see Save Date button', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    settingsService.getCalendar.mockResolvedValue(EMPTY_CALENDAR);
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Current Date/)).toBeTruthy());
    expect(screen.queryByRole('button', { name: /Save Date/i })).toBeNull();
  });

  it('GM sees Player View toggle', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockResolvedValue(EMPTY_CALENDAR);
    renderDashboard();
    await waitFor(() => expect(screen.getByRole('button', { name: /Player View/i })).toBeTruthy());
  });

  it('GM date form is hidden when Player View is active', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockResolvedValue(EMPTY_CALENDAR);
    renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /Player View/i }));
    fireEvent.click(screen.getByRole('button', { name: /Player View/i }));
    expect(screen.queryByRole('button', { name: /Save Date/i })).toBeNull();
  });

  it('Save Date calls updateCalendar with the current draft payload', async () => {
    useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
    settingsService.getCalendar.mockResolvedValue(EMPTY_CALENDAR);
    settingsService.updateCalendar.mockResolvedValue(EMPTY_CALENDAR);
    renderDashboard();
    await waitFor(() => screen.getByRole('button', { name: /Save Date/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Date/i }));
    await waitFor(() => expect(settingsService.updateCalendar).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        current_era_id: null,
        current_year: null,
        current_month_order: null,
        current_day: null,
      }),
    ));
  });
});
