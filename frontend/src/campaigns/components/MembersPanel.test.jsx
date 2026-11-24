import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MembersPanel from './MembersPanel';

vi.mock('../campaignService', () => ({
  default: {
    getCampaignById: vi.fn(),
    getInvites: vi.fn(),
    invitePlayer: vi.fn(),
    cancelInvite: vi.fn(),
    removePlayer: vi.fn(),
    searchUsers: vi.fn(),
  },
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'gm_user' } }),
}));

// Mutable so a test can switch to the player view for real.
let mockRole = 'gm';
vi.mock('../CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 10, name: 'Test Campaign', userRole: mockRole } }),
}));

import campaignService from '../campaignService';

const GM_MEMBER = { id: 1, user_id: 1, user: { id: 1, username: 'gm_user' }, role: 'gm', joined_at: '2024-01-01T00:00:00Z' };
const PLAYER_MEMBER = { id: 2, user_id: 2, user: { id: 2, username: 'alice' }, role: 'player', joined_at: '2024-02-01T00:00:00Z' };
const BOB_INVITE = {
  id: 50, campaign_id: 10, created_at: '2024-03-01T00:00:00Z',
  user: { id: 99, username: 'bob' }, inviter: { id: 1, username: 'gm_user' },
  campaign: { id: 10, name: 'Test Campaign', description: null },
};

const renderPanel = (props = {}) => render(<MembersPanel campaignId="10" {...props} />);

async function pickUser(id, query = 'bo') {
  await screen.findByTestId('invite-search');
  fireEvent.change(screen.getByTestId('invite-search'), { target: { value: query } });
  fireEvent.click(await screen.findByTestId(`search-result-${id}`));
}

describe('MembersPanel — GM view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'gm';
    campaignService.getCampaignById.mockResolvedValue({ success: true, data: { members: [GM_MEMBER, PLAYER_MEMBER] } });
    campaignService.getInvites.mockResolvedValue({ success: true, data: [] });
    campaignService.searchUsers.mockResolvedValue({ success: true, data: [{ id: 99, username: 'bob' }] });
  });

  it('renders members and reports them to the parent', async () => {
    const onMembersLoaded = vi.fn();
    renderPanel({ onMembersLoaded });
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('gm_user')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(campaignService.getCampaignById).toHaveBeenCalledWith('10');
    expect(onMembersLoaded).toHaveBeenCalledWith([GM_MEMBER, PLAYER_MEMBER]);
  });

  it('loads pending invites for the GM and lists them', async () => {
    campaignService.getInvites.mockResolvedValue({ success: true, data: [BOB_INVITE] });
    renderPanel();
    expect(await screen.findByTestId('pending-invites')).toHaveTextContent('bob');
    expect(campaignService.getInvites).toHaveBeenCalledWith('10');
  });

  it('never renders an email, even if a stale API still sends one (security, post-deploy T2)', async () => {
    campaignService.getCampaignById.mockResolvedValue({
      success: true,
      data: { members: [GM_MEMBER, { ...PLAYER_MEMBER, user: { ...PLAYER_MEMBER.user, email: 'alice@test.com' } }] },
    });
    campaignService.searchUsers.mockResolvedValue({ success: true, data: [{ id: 99, username: 'bob', email: 'bob@test.com' }] });
    renderPanel();
    await screen.findByText('alice');
    await pickUser(99);
    await screen.findByText(/ready to invite/i);
    expect(screen.queryByText(/@test\.com/)).not.toBeInTheDocument();
    expect(screen.getByTestId('invite-search')).toHaveAttribute('placeholder', 'Search by username…');
  });

  it('search hides existing members and already-invited users', async () => {
    campaignService.getInvites.mockResolvedValue({ success: true, data: [BOB_INVITE] });
    campaignService.searchUsers.mockResolvedValue({
      success: true,
      data: [{ id: 2, username: 'alice' }, { id: 99, username: 'bob' }, { id: 7, username: 'carol' }],
    });
    renderPanel();
    await screen.findByTestId('pending-invites');
    fireEvent.change(screen.getByTestId('invite-search'), { target: { value: 'a' + 'l' } });
    expect(await screen.findByTestId('search-result-7')).toBeInTheDocument();
    expect(screen.queryByTestId('search-result-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('search-result-99')).not.toBeInTheDocument();
  });

  it('Invite sends an invite (not a membership) and shows it as pending', async () => {
    campaignService.invitePlayer.mockResolvedValue({ success: true, data: BOB_INVITE });
    renderPanel();
    await pickUser(99);
    expect(screen.getByRole('button', { name: /^invite$/i })).not.toBeDisabled();
    campaignService.getInvites.mockResolvedValue({ success: true, data: [BOB_INVITE] });
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
    await waitFor(() => expect(campaignService.invitePlayer).toHaveBeenCalledWith('10', 99));
    expect(await screen.findByTestId('invite-sent')).toHaveTextContent(/bob/);
    expect(await screen.findByTestId('pending-invites')).toHaveTextContent('bob');
    // bob is pending, not a player
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('shows the error when inviting fails', async () => {
    campaignService.invitePlayer.mockResolvedValue({ success: false, error: 'User has already been invited' });
    renderPanel();
    await pickUser(99);
    fireEvent.click(screen.getByRole('button', { name: /^invite$/i }));
    expect(await screen.findByText('User has already been invited')).toBeInTheDocument();
  });

  it('cancelling a pending invite calls cancelInvite and reloads', async () => {
    campaignService.getInvites.mockResolvedValueOnce({ success: true, data: [BOB_INVITE] });
    campaignService.cancelInvite.mockResolvedValue({ success: true });
    renderPanel();
    fireEvent.click(await screen.findByLabelText('Cancel invite for bob'));
    await waitFor(() => expect(campaignService.cancelInvite).toHaveBeenCalledWith('10', 50));
    await waitFor(() => expect(screen.queryByTestId('pending-invites')).not.toBeInTheDocument());
  });

  it('remove player calls removePlayer and reloads', async () => {
    campaignService.removePlayer.mockResolvedValue({ success: true });
    campaignService.getCampaignById
      .mockResolvedValueOnce({ success: true, data: { members: [GM_MEMBER, PLAYER_MEMBER] } })
      .mockResolvedValue({ success: true, data: { members: [GM_MEMBER] } });
    renderPanel();
    fireEvent.click(await screen.findByLabelText('Remove alice'));
    await waitFor(() => expect(campaignService.removePlayer).toHaveBeenCalledWith('10', 2));
    await waitFor(() => expect(screen.queryByText('alice')).not.toBeInTheDocument());
  });

  it('the GM has no remove button on themselves', async () => {
    renderPanel();
    await screen.findByText('alice');
    expect(screen.queryByLabelText('Remove gm_user')).not.toBeInTheDocument();
  });

  it('shows the error on load failure', async () => {
    campaignService.getCampaignById.mockResolvedValue({ success: false, error: 'Not found' });
    renderPanel();
    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });
});

describe('MembersPanel — player view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'player';
    campaignService.getCampaignById.mockResolvedValue({ success: true, data: { members: [GM_MEMBER, PLAYER_MEMBER] } });
  });

  it('shows members but no invite search, no pending invites, no remove buttons', async () => {
    renderPanel();
    await screen.findByText('alice');
    expect(screen.queryByTestId('invite-search')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pending-invites')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Remove alice')).not.toBeInTheDocument();
    // A player never asks for the GM-only invite list.
    expect(campaignService.getInvites).not.toHaveBeenCalled();
  });
});
