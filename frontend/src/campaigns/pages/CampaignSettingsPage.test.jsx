import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CampaignSettingsPage from './CampaignSettingsPage';

vi.mock('../campaignService', () => ({
  default: {
    updateCampaign: vi.fn(),
    getCampaignById: vi.fn().mockResolvedValue({ success: true, data: { members: [] } }),
    searchUsers: vi.fn(),
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
  },
}));

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 1 } }) }));

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '1' }),
}));

import { useCampaign } from '../CampaignContext';

function setCampaign(overrides = {}) {
  useCampaign.mockReturnValue({
    campaign: {
      id: 1, name: 'Test', description: '', edition: '5e',
      use_alignment: true, ability_score_method: 'standard_spread',
      allow_reroll_ones: false, leveling_type: 'milestone',
      currency_type: 'standard', userRole: 'gm', ...overrides,
    },
    enterCampaign: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CampaignSettingsPage — currency', () => {
  it('shows the currency select for a GM', () => {
    setCampaign({ userRole: 'gm' });
    render(<CampaignSettingsPage />);
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByTestId('currency-type-select')).toBeInTheDocument();
  });

  it('shows read-only standard currency text for a player', () => {
    setCampaign({ userRole: 'player', currency_type: 'standard' });
    render(<CampaignSettingsPage />);
    expect(screen.getByText('CP, SP, GP, PP')).toBeInTheDocument();
    expect(screen.queryByTestId('currency-type-select')).not.toBeInTheDocument();
  });

  it('shows read-only full currency text (with electrum) for a player', () => {
    setCampaign({ userRole: 'player', currency_type: 'full' });
    render(<CampaignSettingsPage />);
    expect(screen.getByText('CP, SP, EP, GP, PP')).toBeInTheDocument();
  });
});

describe('CampaignSettingsPage — starting equipment', () => {
  it('shows the starting-equipment select for a GM', () => {
    setCampaign({ userRole: 'gm' });
    render(<CampaignSettingsPage />);
    expect(screen.getByText('Starting Equipment')).toBeInTheDocument();
    expect(screen.getByTestId('starting-equipment-select')).toBeInTheDocument();
  });

  it('shows read-only starting-equipment text for a player', () => {
    setCampaign({ userRole: 'player', starting_equipment: 'none' });
    render(<CampaignSettingsPage />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByTestId('starting-equipment-select')).not.toBeInTheDocument();
  });
});
