import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../settingsService', () => ({
  default: {
    getCalendar: vi.fn(),
    createCalendar: vi.fn(),
    updateCalendar: vi.fn(),
    createSeason: vi.fn(),
    updateSeason: vi.fn(),
    deleteSeason: vi.fn(),
    createMonth: vi.fn(),
    updateMonth: vi.fn(),
    deleteMonth: vi.fn(),
    createWeekday: vi.fn(),
    updateWeekday: vi.fn(),
    deleteWeekday: vi.fn(),
    createEra: vi.fn(),
  },
}));

import settingsService from '../settingsService';
import CalendarTab from './CalendarTab';

const CALENDAR = {
  id: 1,
  campaign_id: 1,
  name: 'Campaign Calendar',
  days_per_month: 30,
  use_weeks: false,
  days_per_week: null,
  current_era_id: null,
  current_year: null,
  current_month_order: null,
  current_day: null,
  seasons: [
    { id: 1, name: 'Spring', order_index: 1 },
    { id: 2, name: 'Summer', order_index: 2 },
  ],
  months: [
    { id: 1, name: 'Firstmonth', order_index: 1, season_id: 1 },
    { id: 2, name: null, order_index: 2, season_id: null },
  ],
  eras: [],
  weekdays: [],
};

function renderTab(isGm = true) {
  return render(
    <MemoryRouter>
      <CalendarTab campaignId="1" isGm={isGm} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CalendarTab — no calendar (404)', () => {
  it('shows the landing explainer when calendar does not exist', async () => {
    const err = { response: { status: 404 } };
    settingsService.getCalendar.mockRejectedValue(err);
    renderTab();
    await waitFor(() => expect(screen.getByText('Campaign Calendar')).toBeTruthy());
    expect(screen.getByText(/Name each month/i) || screen.getByText(/Set Up Calendar/)).toBeTruthy();
  });

  it('shows Set Up Calendar button for GM on 404', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    renderTab(true);
    await waitFor(() => expect(screen.getByText('Set Up Calendar')).toBeTruthy());
  });

  it('player sees "not set up" message — no Set Up button', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    renderTab(false);
    await waitFor(() => expect(screen.queryByText('Set Up Calendar')).toBeNull());
    expect(screen.getByText(/No calendar has been set up/i)).toBeTruthy();
  });

  it('clicking Set Up Calendar shows config form', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    renderTab(true);
    await waitFor(() => screen.getByText('Set Up Calendar'));
    fireEvent.click(screen.getByText('Set Up Calendar'));
    expect(screen.getByText('Create Calendar')).toBeTruthy();
    expect(screen.getByPlaceholderText('Campaign Calendar')).toBeTruthy();
  });

  it('submitting the setup form calls createCalendar and shows management UI', async () => {
    settingsService.getCalendar.mockRejectedValue({ response: { status: 404 } });
    settingsService.createCalendar.mockResolvedValue({ ...CALENDAR, seasons: [], months: [], weekdays: [], eras: [] });
    renderTab(true);
    await waitFor(() => screen.getByText('Set Up Calendar'));
    fireEvent.click(screen.getByText('Set Up Calendar'));
    await waitFor(() => screen.getByText('Create Calendar'));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(settingsService.createCalendar).toHaveBeenCalledWith('1', expect.any(Object)));
    await waitFor(() => expect(screen.getByText('General')).toBeTruthy());
  });
});

describe('CalendarTab — calendar exists', () => {
  beforeEach(() => {
    settingsService.getCalendar.mockResolvedValue(CALENDAR);
  });

  it('renders General, Seasons, and Months sections', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('General')).toBeTruthy());
    expect(screen.getByText('Seasons')).toBeTruthy();
    expect(screen.getByText('Months')).toBeTruthy();
  });

  it('renders named months with their names', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByDisplayValue('Firstmonth')).toBeTruthy());
  });

  it('renders unnamed month as placeholder "Month N" — not empty field', async () => {
    renderTab();
    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText(/Month \d/);
      expect(inputs.some(el => el.placeholder === 'Month 2')).toBe(true);
    });
  });

  it('hides weekday section when use_weeks is false', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('General')).toBeTruthy());
    expect(screen.queryByText('Weekdays')).toBeNull();
  });

  it('shows weekday section when use_weeks toggle is turned on', async () => {
    renderTab(true);
    await waitFor(() => expect(screen.getByText('General')).toBeTruthy());

    const toggle = screen.getByRole('button', { name: /toggle named weekdays/i });
    fireEvent.click(toggle);

    expect(screen.getByText('Weekdays')).toBeTruthy();
  });

  it('renders seasons list', async () => {
    renderTab();
    // Season names appear in SeasonRow spans and also in month season Select triggers
    await waitFor(() => expect(screen.getAllByText('Spring').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Summer').length).toBeGreaterThan(0);
  });

  it('shows Current Date section for GM', async () => {
    renderTab(true);
    await waitFor(() => expect(screen.getByText('Current Date')).toBeTruthy());
  });

  it('hides Current Date section for player', async () => {
    renderTab(false);
    await waitFor(() => expect(screen.getByText('General')).toBeTruthy());
    expect(screen.queryByText('Current Date')).toBeNull();
  });

  it('CalendarInfoPanel is collapsed by default — guide content not visible', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('How does the calendar work?')).toBeTruthy());
    expect(screen.queryByText(/gives your world its own sense of time/i)).toBeNull();
  });

  it('clicking CalendarInfoPanel header expands guide content', async () => {
    renderTab();
    await waitFor(() => screen.getByText('How does the calendar work?'));
    fireEvent.click(screen.getByText('How does the calendar work?'));
    await waitFor(() =>
      expect(screen.getByText(/gives your world its own sense of time/i)).toBeTruthy()
    );
  });
});
