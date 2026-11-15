import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
import campaignService from '../campaignService';

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

describe('CampaignSettingsPage — ASI / feat mode', () => {
  it('shows the asi-feat-mode select for a GM', () => {
    setCampaign({ userRole: 'gm' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('asi-feat-mode-select')).toBeInTheDocument();
  });

  it('shows read-only asi-or-feat text for a player (default)', () => {
    setCampaign({ userRole: 'player', asi_feat_mode: 'asi_or_feat' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('asi-feat-mode-readonly')).toHaveTextContent('Ability score increase or a feat');
    expect(screen.queryByTestId('asi-feat-mode-select')).not.toBeInTheDocument();
  });

  it('shows read-only asi-and-feat text for a player', () => {
    setCampaign({ userRole: 'player', asi_feat_mode: 'asi_and_feat' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('asi-feat-mode-readonly')).toHaveTextContent('Ability score increase and a feat');
  });
});

describe('CampaignSettingsPage — campaign mode', () => {
  it('shows the mode select and the rules settings to the GM of a full campaign', () => {
    setCampaign({ userRole: 'gm', campaign_mode: 'full' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('campaign-mode-select')).toHaveTextContent('Full D&D campaign');
    expect(screen.getByText('Ability Score Assignment')).toBeInTheDocument();
    expect(screen.getByTestId('asi-feat-mode-select')).toBeInTheDocument();
    expect(screen.getByText('Edition')).toBeInTheDocument();
  });

  it('hides every rules setting from the GM in world-building mode', () => {
    setCampaign({ userRole: 'gm', campaign_mode: 'worldbuilding' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('campaign-mode-select')).toHaveTextContent('World-building only');
    ['Edition', 'Roleplaying Options', 'Ability Score Assignment', 'Leveling', 'Currency', 'Starting Equipment']
      .forEach(t => expect(screen.queryByText(t)).not.toBeInTheDocument());
    // Campaign identity stays
    expect(screen.getByText('Campaign Identity')).toBeInTheDocument();
  });

  it('saves the mode with the other settings', async () => {
    const enterCampaign = vi.fn();
    useCampaign.mockReturnValue({
      campaign: { id: 1, name: 'Old', userRole: 'gm', campaign_mode: 'worldbuilding', asi_feat_mode: 'asi_only' },
      enterCampaign,
    });
    campaignService.updateCampaign.mockResolvedValue({ success: true, data: { name: 'New', campaign_mode: 'worldbuilding' } });
    render(<CampaignSettingsPage />);
    fireEvent.change(screen.getByDisplayValue('Old'), { target: { value: 'New' } });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(campaignService.updateCampaign).toHaveBeenCalledWith('1', expect.objectContaining({
      name: 'New', campaign_mode: 'worldbuilding', asi_feat_mode: 'asi_only',
    })));
    await waitFor(() => expect(enterCampaign).toHaveBeenCalledWith(expect.objectContaining({ campaign_mode: 'worldbuilding' })));
  });

  it('shows players the mode and hides the rules rows in world-building mode', () => {
    setCampaign({ userRole: 'player', campaign_mode: 'worldbuilding' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('campaign-mode-readonly')).toHaveTextContent('World-building only');
    expect(screen.queryByTestId('asi-feat-mode-readonly')).not.toBeInTheDocument();
    expect(screen.queryByText('Edition')).not.toBeInTheDocument();
  });

  it('shows players the rules rows in a full campaign', () => {
    setCampaign({ userRole: 'player' });
    render(<CampaignSettingsPage />);
    expect(screen.getByTestId('campaign-mode-readonly')).toHaveTextContent('Full D&D campaign');
    expect(screen.getByTestId('asi-feat-mode-readonly')).toBeInTheDocument();
  });
});
