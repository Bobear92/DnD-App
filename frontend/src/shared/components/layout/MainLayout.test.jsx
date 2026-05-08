import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('./Header', () => ({ default: () => <div data-testid="header" /> }));

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../auth/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('../../../campaigns/campaignService', () => ({
  default: { getCampaignById: vi.fn() },
}));

import { useAuth } from '../../../auth/AuthContext';
import { useCampaign } from '../../../campaigns/CampaignContext';
import campaignService from '../../../campaigns/campaignService';
import MainLayout from './MainLayout';

const USER = { id: 42, email: 'gm@dnd.com', username: 'gm' };

function renderLayout() {
  return render(
    <MemoryRouter>
      <MainLayout><div>content</div></MainLayout>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: USER, logout: vi.fn() });
});

describe('MainLayout — userRole healing (created_by present in stored campaign)', () => {
  it('heals player→gm when created_by matches user.id', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Test', created_by: USER.id, userRole: 'player' },
      enterCampaign,
    });

    renderLayout();

    await waitFor(() => {
      expect(enterCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ userRole: 'gm' })
      );
    });
  });

  it('does not call enterCampaign when role is already correct', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Test', created_by: USER.id, userRole: 'gm' },
      enterCampaign,
    });

    renderLayout();
    await waitFor(() => {});
    expect(enterCampaign).not.toHaveBeenCalled();
  });

  it('assigns player role when created_by does not match user.id', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Test', created_by: 99, userRole: 'gm' },
      enterCampaign,
    });

    renderLayout();

    await waitFor(() => {
      expect(enterCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ userRole: 'player' })
      );
    });
  });
});

describe('MainLayout — userRole healing (created_by missing — stale localStorage)', () => {
  it('fetches campaign from API and heals gm role when created_by is undefined', async () => {
    // This is the exact scenario: campaign stored before the CampaignListItem schema
    // fix had no created_by field, so userRole was always saved as 'player'.
    // MainLayout must fetch the authoritative created_by and fix the role.
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Test', created_by: undefined, userRole: 'player' },
      enterCampaign,
    });
    campaignService.getCampaignById.mockResolvedValue({
      success: true,
      data: { id: 1, created_by: USER.id },
    });

    renderLayout();

    await waitFor(() => {
      expect(campaignService.getCampaignById).toHaveBeenCalledWith(1);
      expect(enterCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: USER.id, userRole: 'gm' })
      );
    });
  });

  it('fetches campaign and assigns player role when user is not the creator', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Test', created_by: undefined, userRole: 'player' },
      enterCampaign,
    });
    campaignService.getCampaignById.mockResolvedValue({
      success: true,
      data: { id: 1, created_by: 99 },
    });

    renderLayout();

    await waitFor(() => {
      expect(enterCampaign).not.toHaveBeenCalled();
    });
  });

  it('does nothing if the API call fails', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Test', created_by: undefined, userRole: 'player' },
      enterCampaign,
    });
    campaignService.getCampaignById.mockResolvedValue({ success: false });

    renderLayout();
    await waitFor(() => {});
    expect(enterCampaign).not.toHaveBeenCalled();
  });
});

describe('MainLayout — healing skipped when context is incomplete', () => {
  it('does nothing when user is null', async () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, created_by: undefined, userRole: 'player' },
      enterCampaign,
    });

    renderLayout();
    await waitFor(() => {});
    expect(enterCampaign).not.toHaveBeenCalled();
    expect(campaignService.getCampaignById).not.toHaveBeenCalled();
  });

  it('does nothing when no campaign is selected', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({ campaign: null, enterCampaign });

    renderLayout();
    await waitFor(() => {});
    expect(enterCampaign).not.toHaveBeenCalled();
  });
});
