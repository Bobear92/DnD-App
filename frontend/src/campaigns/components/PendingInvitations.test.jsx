import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PendingInvitations from './PendingInvitations';

vi.mock('../campaignService', () => ({
  default: { getMyInvites: vi.fn(), acceptInvite: vi.fn(), declineInvite: vi.fn() },
}));

import campaignService from '../campaignService';

const invite = (id, name) => ({
  id, campaign_id: id, created_at: '2026-11-24T00:00:00Z',
  campaign: { id, name, description: null },
  inviter: { id: 9, username: 'dm_dave' }, user: { id: 1, username: 'me' },
});

describe('PendingInvitations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when there are no invites', async () => {
    campaignService.getMyInvites.mockResolvedValue({ success: true, data: [] });
    const { container } = render(<PendingInvitations />);
    await waitFor(() => expect(campaignService.getMyInvites).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('lists each invite with its campaign and inviter (no emails)', async () => {
    campaignService.getMyInvites.mockResolvedValue({ success: true, data: [invite(1, 'Saltmarsh'), invite(2, 'Barovia')] });
    render(<PendingInvitations />);
    expect(await screen.findByText('Saltmarsh')).toBeInTheDocument();
    expect(screen.getByText('Barovia')).toBeInTheDocument();
    expect(screen.getAllByText('Invited by dm_dave')).toHaveLength(2);
    expect(screen.getByTestId('pending-invitations').textContent).not.toContain('@');
  });

  it('accept removes only that invite and reports the joined campaign', async () => {
    campaignService.getMyInvites.mockResolvedValue({ success: true, data: [invite(1, 'Saltmarsh'), invite(2, 'Barovia')] });
    campaignService.acceptInvite.mockResolvedValue({ success: true, data: { id: 1, name: 'Saltmarsh' } });
    const onAccepted = vi.fn();
    render(<PendingInvitations onAccepted={onAccepted} />);
    fireEvent.click(await screen.findByRole('button', { name: /accept invitation to saltmarsh/i }));
    await waitFor(() => expect(onAccepted).toHaveBeenCalledWith({ id: 1, name: 'Saltmarsh' }));
    expect(campaignService.acceptInvite).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByText('Saltmarsh')).not.toBeInTheDocument());
    expect(screen.getByText('Barovia')).toBeInTheDocument();
  });

  it('decline removes the invite without calling onAccepted', async () => {
    campaignService.getMyInvites.mockResolvedValue({ success: true, data: [invite(1, 'Saltmarsh')] });
    campaignService.declineInvite.mockResolvedValue({ success: true });
    const onAccepted = vi.fn();
    render(<PendingInvitations onAccepted={onAccepted} />);
    fireEvent.click(await screen.findByRole('button', { name: /decline invitation to saltmarsh/i }));
    await waitFor(() => expect(campaignService.declineInvite).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByTestId('pending-invitations')).not.toBeInTheDocument());
    expect(onAccepted).not.toHaveBeenCalled();
  });
});
