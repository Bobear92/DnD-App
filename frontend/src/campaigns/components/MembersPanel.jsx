import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserPlus, Trash2, Search, Crown, User, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import campaignService from '../campaignService';
import { useCampaign } from '../CampaignContext';
import { useAuth } from '../../auth/AuthContext';

/**
 * Members, pending invites and the invite search for one campaign — the ONE copy, rendered by both the Members page
 * and the Settings › Members tab (they used to be two near-identical copies; post-deploy T2).
 *
 * Players join by invite + accept: "Invite" creates a pending invite the GM can withdraw; the player accepts it from
 * the campaign selection page. Emails are never shown (the API doesn't send them).
 */
export default function MembersPanel({ campaignId, onMembersLoaded }) {
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const isGm = campaign?.userRole === 'gm';

  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSent, setInviteSent] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  // A ref, so a parent's inline callback can't re-trigger the load on every render.
  const onLoadedRef = useRef(onMembersLoaded);
  onLoadedRef.current = onMembersLoaded;

  const load = useCallback(async () => {
    const result = await campaignService.getCampaignById(campaignId);
    if (result.success) {
      const list = result.data.members ?? [];
      setMembers(list);
      onLoadedRef.current?.(list);
    } else {
      setError(result.error);
    }
    if (isGm) {
      const inv = await campaignService.getInvites(campaignId);
      if (inv.success) setInvites(inv.data);
    }
    setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    campaignService.searchUsers(query).then((result) => {
      if (cancelled) return;
      setSearching(false);
      if (result.success) {
        // Hide anyone already in the campaign or already invited.
        const taken = new Set([...members.map(m => m.user_id), ...invites.map(i => i.user.id)]);
        setSearchResults(result.data.filter(u => !taken.has(u.id)));
        setShowDropdown(true);
      }
    });
    return () => { cancelled = true; };
  }, [query, members, invites]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setQuery(u.username);
    setShowDropdown(false);
    setSearchResults([]);
    setInviteError('');
    setInviteSent('');
  };

  const handleInvite = async () => {
    if (!selectedUser) return;
    setInviting(true);
    setInviteError('');
    const result = await campaignService.invitePlayer(campaignId, selectedUser.id);
    setInviting(false);
    if (result.success) {
      setInviteSent(selectedUser.username);
      setSelectedUser(null);
      setQuery('');
      await load();
    } else {
      setInviteError(result.error);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    setCancellingId(inviteId);
    const result = await campaignService.cancelInvite(campaignId, inviteId);
    setCancellingId(null);
    if (result.success) await load();
    else setInviteError(result.error);
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    setRemoveError('');
    const result = await campaignService.removePlayer(campaignId, userId);
    setRemovingId(null);
    if (result.success) await load();
    else setRemoveError(result.error);
  };

  const players = members.filter(m => m.role === 'player');
  const gms = members.filter(m => m.role === 'gm');

  if (loading) return <div className="text-sm text-muted-foreground">Loading members…</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-sm">Game Master</span>
        </div>
        <div className="divide-y">
          {gms.map(m => (
            <MemberRow key={m.id} member={m} isCurrentUser={m.user_id === user?.id} isGm={isGm} onRemove={null} removing={false} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Players</span>
          <Badge variant="secondary" className="ml-auto text-xs">{players.length}</Badge>
        </div>
        {players.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            No players yet. {isGm && 'Invite someone below.'}
          </div>
        ) : (
          <div className="divide-y">
            {players.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                isCurrentUser={m.user_id === user?.id}
                isGm={isGm}
                onRemove={() => handleRemove(m.user_id)}
                removing={removingId === m.user_id}
              />
            ))}
          </div>
        )}
      </section>

      {removeError && <p className="text-sm text-destructive">{removeError}</p>}

      {isGm && invites.length > 0 && (
        <section data-testid="pending-invites" className="rounded-lg border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Pending invites</span>
            <Badge variant="secondary" className="ml-auto text-xs">{invites.length}</Badge>
          </div>
          <div className="divide-y">
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-medium flex-1 min-w-0 truncate">{inv.user.username}</span>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Invited {new Date(inv.created_at).toLocaleDateString()} · waiting for them to accept
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleCancelInvite(inv.id)}
                  disabled={cancellingId === inv.id}
                  aria-label={`Cancel invite for ${inv.user.username}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {isGm && (
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Invite Player</h2>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  data-testid="invite-search"
                  placeholder="Search by username…"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedUser(null);
                    setInviteError('');
                    setInviteSent('');
                  }}
                  className="pl-8"
                />
              </div>
              <Button type="button" disabled={!selectedUser || inviting} onClick={handleInvite}>
                {inviting ? 'Inviting…' : 'Invite'}
              </Button>
            </div>

            {showDropdown && (
              <div data-testid="search-dropdown" className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                {searching ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No users found</div>
                ) : (
                  searchResults.map(u => (
                    <button
                      key={u.id}
                      data-testid={`search-result-${u.id}`}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                      onClick={() => handleSelectUser(u)}
                    >
                      <span className="font-medium">{u.username}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <p className="text-xs text-muted-foreground">
              Ready to invite <span className="font-medium text-foreground">{selectedUser.username}</span>
            </p>
          )}
          {inviteSent && (
            <p className="text-xs text-muted-foreground" data-testid="invite-sent">
              Invite sent to <span className="font-medium text-foreground">{inviteSent}</span>. They join once they accept it from their campaign list.
            </p>
          )}
          {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
        </section>
      )}
    </div>
  );
}

function MemberRow({ member, isCurrentUser, isGm, onRemove, removing }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {member.user?.username?.[0] ?? '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{member.user?.username}</span>
          {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
        </div>
      </div>
      <div className="text-xs text-muted-foreground hidden sm:block">
        Joined {new Date(member.joined_at).toLocaleDateString()}
      </div>
      {isGm && onRemove && !isCurrentUser && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${member.user?.username}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
