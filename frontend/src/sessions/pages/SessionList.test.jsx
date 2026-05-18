import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '5' }),
  useNavigate: () => mockNavigate,
}));
vi.mock('../sessionService', () => ({
  default: {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    updateVisibility: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

import { useCampaign } from '../../campaigns/CampaignContext';
import sessionService from '../sessionService';
import SessionList from './SessionList';

const GM_CAMPAIGN = { id: 5, name: 'My Campaign', userRole: 'gm', created_by: 1 };
const PLAYER_CAMPAIGN = { id: 5, name: 'My Campaign', userRole: 'player', created_by: 99 };

const makeSession = (overrides = {}) => ({
  id: 1,
  session_number: 1,
  title: 'The Meeting',
  real_world_date: '2024-01-21',
  summary: 'Adventurers gather.',
  is_visible_to_players: true,
  era_dates: [],
  day: null, month_order: null, year: null,
  end_day: null, end_month_order: null, end_year: null,
  ...overrides,
});

function renderList() {
  return render(<MemoryRouter><SessionList /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
  sessionService.listSessions.mockResolvedValue([]);
  mockNavigate.mockClear();
});

describe('SessionList — render', () => {
  it('shows loading spinner initially', () => {
    sessionService.listSessions.mockReturnValue(new Promise(() => {}));
    renderList();
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state when no sessions', async () => {
    renderList();
    await waitFor(() => expect(screen.getByText('No sessions yet')).toBeTruthy());
  });

  it('renders session cards after loading', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ title: 'Orc Princeling' })]);
    renderList();
    await waitFor(() => expect(screen.getByText('Orc Princeling')).toBeTruthy());
  });

  it('shows session number prefix', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ session_number: 18, title: 'Orc Princeling' })]);
    renderList();
    await waitFor(() => expect(screen.getByText('#18')).toBeTruthy());
  });

  it('shows real_world_date on card', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ real_world_date: '2024-01-21' })]);
    renderList();
    await waitFor(() => expect(screen.getByText('2024-01-21')).toBeTruthy());
  });

  it('shows era dates on card', async () => {
    sessionService.listSessions.mockResolvedValue([
      makeSession({ era_dates: [{ era_id: 1, year: 3739, abbreviation: 'OFC' }] }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText(/3739.*OFC/)).toBeTruthy());
  });

  it('shows day range when end_day differs from day', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ day: 1, month_order: 3, year: 100, end_day: 2, end_month_order: 3, end_year: 100 })]);
    renderList();
    await waitFor(() => expect(screen.getByText(/Days 1–2/)).toBeTruthy());
  });

  it('shows Hidden badge for invisible session (GM view)', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ is_visible_to_players: false })]);
    renderList();
    await waitFor(() => expect(screen.getByText('Hidden')).toBeTruthy());
  });
});

describe('SessionList — GM controls', () => {
  it('shows New Session button for GM', async () => {
    renderList();
    await waitFor(() => expect(screen.getByText('New Session')).toBeTruthy());
  });

  it('hides New Session button for player', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.queryByText('New Session')).toBeNull());
  });

  it('navigates to session detail on card click', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ id: 42, title: 'The Bridge' })]);
    renderList();
    await waitFor(() => screen.getByText('The Bridge'));
    fireEvent.click(screen.getByText('The Bridge'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/5/sessions/42');
  });

  it('creates session and navigates to detail', async () => {
    sessionService.createSession.mockResolvedValue({ id: 99 });
    renderList();
    await waitFor(() => screen.getByText('New Session'));
    fireEvent.click(screen.getByText('New Session'));

    const titleInput = screen.getAllByRole('textbox').find(el => el.id === 'title');
    fireEvent.change(titleInput, { target: { value: 'New Adventure' } });
    fireEvent.click(screen.getByText('Create & Edit'));

    await waitFor(() => {
      expect(sessionService.createSession).toHaveBeenCalledWith('5', expect.objectContaining({ title: 'New Adventure' }));
      expect(mockNavigate).toHaveBeenCalledWith('/campaigns/5/sessions/99');
    });
  });

  it('calls updateVisibility on eye toggle', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ id: 7, is_visible_to_players: true })]);
    sessionService.updateVisibility.mockResolvedValue({ id: 7, is_visible_to_players: false });
    renderList();
    await waitFor(() => screen.getByTitle('Hide from players'));
    fireEvent.click(screen.getByTitle('Hide from players'));
    await waitFor(() => expect(sessionService.updateVisibility).toHaveBeenCalledWith('5', 7, false));
  });

  it('shows delete confirmation dialog', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ id: 7, title: 'The Bridge' })]);
    renderList();
    await waitFor(() => screen.getByTitle('Delete session'));
    fireEvent.click(screen.getByTitle('Delete session'));
    expect(screen.getByText('Delete Session?')).toBeTruthy();
  });
});

describe('SessionList — player view', () => {
  beforeEach(() => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
  });

  it('hides Hidden badge for player (hidden sessions not returned by backend)', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession({ is_visible_to_players: true })]);
    renderList();
    await waitFor(() => screen.getByText('The Meeting'));
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('does not show eye/delete controls for player', async () => {
    sessionService.listSessions.mockResolvedValue([makeSession()]);
    renderList();
    await waitFor(() => screen.getByText('The Meeting'));
    expect(screen.queryByTitle('Hide from players')).toBeNull();
    expect(screen.queryByTitle('Delete session')).toBeNull();
  });
});
