import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import campaignService from '../campaignService';

/**
 * The current user's pending campaign invites, on the campaign selection page. A GM's invite does nothing until the
 * player accepts it here (consent step, post-deploy T2). Renders nothing when there are none.
 */
export default function PendingInvitations({ onAccepted }) {
  const [invites, setInvites] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const result = await campaignService.getMyInvites();
    if (result.success) setInvites(result.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (invite, accept) => {
    setBusyId(invite.id);
    setError('');
    const result = accept
      ? await campaignService.acceptInvite(invite.id)
      : await campaignService.declineInvite(invite.id);
    setBusyId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setInvites((list) => list.filter((i) => i.id !== invite.id));
    if (accept) onAccepted?.(result.data);
  };

  if (invites.length === 0) return null;

  return (
    <section
      data-testid="pending-invitations"
      className="mx-auto mb-6 w-full max-w-3xl rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm text-foreground">Invitations</h2>
      </div>
      <div className="divide-y divide-border">
        {invites.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{inv.campaign.name}</p>
              <p className="text-xs text-muted-foreground">Invited by {inv.inviter.username}</p>
            </div>
            <Button
              size="sm"
              onClick={() => respond(inv, true)}
              disabled={busyId === inv.id}
              aria-label={`Accept invitation to ${inv.campaign.name}`}
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => respond(inv, false)}
              disabled={busyId === inv.id}
              aria-label={`Decline invitation to ${inv.campaign.name}`}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Decline
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
