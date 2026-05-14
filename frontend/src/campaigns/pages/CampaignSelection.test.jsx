import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
vi.mock('../campaignService', () => ({
  default: { getAllCampaigns: vi.fn(), createCampaign: vi.fn() },
}));
vi.mock('../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../CampaignContext', () => ({ useCampaign: vi.fn() }));

const mockNavigate = vi.fn();
const mockEnterCampaign = vi.fn();
const mockLogout = vi.fn();

import { useAuth } from '../../auth/AuthContext';
import { useCampaign } from '../CampaignContext';
import campaignService from '../campaignService';
import CampaignSelection from './CampaignSelection';

const USER = { id: 1, username: 'testgm', is_admin: false };

const CAMPAIGNS = [
  { id: 1, name: 'Lost Mines', description: 'A classic adventure', created_by: 1 },
  { id: 2, name: 'Curse of Strahd', description: 'Gothic horror', created_by: 99 },
];

function renderPage() {
  return render(<MemoryRouter><CampaignSelection /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mockEnterCampaign.mockReset();
  mockLogout.mockReset();
  useAuth.mockReturnValue({ user: USER, logout: mockLogout });
  useCampaign.mockReturnValue({ enterCampaign: mockEnterCampaign });
});

describe('CampaignSelection — loading', () => {
  it('shows loading text while campaigns are fetching', () => {
    campaignService.getAllCampaigns.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/Loading your campaigns/i)).toBeTruthy();
  });
});

describe('CampaignSelection — campaign list', () => {
  it('calls getAllCampaigns on mount', async () => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: true, data: [] });
    renderPage();
    await waitFor(() => expect(campaignService.getAllCampaigns).toHaveBeenCalledTimes(1));
  });

  it('renders campaign names in cards', async () => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: true, data: CAMPAIGNS });
    renderPage();
    await waitFor(() => expect(screen.getByText('Lost Mines')).toBeTruthy());
    expect(screen.getByText('Curse of Strahd')).toBeTruthy();
  });

  it('shows empty state when no campaigns exist', async () => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: true, data: [] });
    renderPage();
    await waitFor(() => expect(screen.getByText('No Campaigns Yet')).toBeTruthy());
  });

  it('shows error message when fetch fails', async () => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: false, error: 'Network error' });
    renderPage();
    await waitFor(() => expect(screen.getByText('Network error')).toBeTruthy());
  });
});

describe('CampaignSelection — entering a campaign', () => {
  beforeEach(() => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: true, data: CAMPAIGNS });
  });

  it('assigns userRole=gm when the campaign was created by the current user', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('Enter Campaign'));
    // First campaign (id:1, created_by:1) matches USER.id → gm
    fireEvent.click(screen.getAllByText('Enter Campaign')[0]);
    expect(mockEnterCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, userRole: 'gm' })
    );
  });

  it('assigns userRole=player when the campaign was created by someone else', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('Enter Campaign'));
    // Second campaign (id:2, created_by:99) doesn't match USER.id → player
    fireEvent.click(screen.getAllByText('Enter Campaign')[1]);
    expect(mockEnterCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, userRole: 'player' })
    );
  });

  it('navigates to the campaign dashboard after entering', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('Enter Campaign'));
    fireEvent.click(screen.getAllByText('Enter Campaign')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/dashboard');
  });
});

describe('CampaignSelection — create campaign', () => {
  beforeEach(() => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: true, data: [] });
  });

  it('shows "Create New Campaign" button when user is logged in', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Create New Campaign')).toBeTruthy());
  });

  it('clicking "Create New Campaign" opens the modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Create New Campaign'));
    fireEvent.click(screen.getByText('Create New Campaign'));
    expect(screen.getByText('Create New Campaign', { selector: 'h2' })).toBeTruthy();
  });

  it('submitting the form calls createCampaign with the entered name', async () => {
    campaignService.createCampaign.mockResolvedValue({ success: true, data: { id: 3 } });
    renderPage();
    await waitFor(() => screen.getByText('Create New Campaign'));
    fireEvent.click(screen.getByText('Create New Campaign'));
    fireEvent.change(screen.getByPlaceholderText(/The Lost Mines/i), {
      target: { value: 'My New Campaign' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Campaign' }));
    await waitFor(() =>
      expect(campaignService.createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My New Campaign' })
      )
    );
  });

  it('closes the modal and reloads campaigns after successful create', async () => {
    campaignService.createCampaign.mockResolvedValue({ success: true, data: { id: 3 } });
    renderPage();
    await waitFor(() => screen.getByText('Create New Campaign'));
    fireEvent.click(screen.getByText('Create New Campaign'));
    fireEvent.change(screen.getByPlaceholderText(/The Lost Mines/i), {
      target: { value: 'My New Campaign' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Campaign' }));
    // Modal closes: heading disappears; getAllCampaigns called a second time
    await waitFor(() =>
      expect(campaignService.getAllCampaigns).toHaveBeenCalledTimes(2)
    );
    expect(screen.queryByRole('heading', { name: 'Create New Campaign' })).toBeNull();
  });
});

describe('CampaignSelection — logout', () => {
  it('calls logout and navigates to /login', async () => {
    campaignService.getAllCampaigns.mockResolvedValue({ success: true, data: [] });
    renderPage();
    await waitFor(() => screen.getByText('Logout'));
    fireEvent.click(screen.getByText('Logout'));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
