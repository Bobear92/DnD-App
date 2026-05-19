import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { UserPlus, Trash2, Search, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MainLayout from '../../shared/components/layout/MainLayout';
import campaignService from '../campaignService';
import { useCampaign } from '../CampaignContext';
import { useAuth } from '../../auth/AuthContext';

export default function CampaignMembers() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const isGm = campaign?.userRole === 'gm';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Remove state
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');

  const loadMembers = async () => {
    const result = await campaignService.getCampaignById(campaignId);
    if (result.success) {
      setMembers(result.data.members ?? []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, [campaignId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search users as query changes
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
        // Filter out existing members
        const memberUserIds = new Set(members.map(m => m.user_id));
        setSearchResults(result.data.filter(u => !memberUserIds.has(u.id)));
        setShowDropdown(true);
      }
    });
    return () => { cancelled = true; };
  }, [query, members]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setQuery(u.username);
    setShowDropdown(false);
    setSearchResults([]);
    setAddError('');
  };

  const handleAddPlayer = async () => {
    if (!selectedUser) return;
    setAdding(true);
    setAddError('');
    const result = await campaignService.addPlayer(campaignId, selectedUser.id);
    setAdding(false);
    if (result.success) {
      setSelectedUser(null);
      setQuery('');
      await loadMembers();
    } else {
      setAddError(result.error);
    }
  };

  const handleRemove = async (memberId, userId) => {
    setRemovingId(userId);
    setRemoveError('');
    const result = await campaignService.removePlayer(campaignId, userId);
    setRemovingId(null);
    if (result.success) {
      await loadMembers();
    } else {
      setRemoveError(result.error);
    }
  };

  const players = members.filter(m => m.role === 'player');
  const gms = members.filter(m => m.role === 'gm');

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Campaign Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {campaign?.name} · {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading members…</div>
        ) : (
          <>
            {/* GM section */}
            <section className="rounded-lg border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-sm">Game Master</span>
              </div>
              <div className="divide-y">
                {gms.map(m => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isCurrentUser={m.user_id === user?.id}
                    isGm={isGm}
                    onRemove={null}
                    removing={false}
                  />
                ))}
              </div>
            </section>

            {/* Players section */}
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
                      onRemove={() => handleRemove(m.id, m.user_id)}
                      removing={removingId === m.user_id}
                    />
                  ))}
                </div>
              )}
            </section>

            {removeError && (
              <p className="text-sm text-destructive">{removeError}</p>
            )}

            {/* Invite panel — GM only */}
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
                        placeholder="Search by username or email…"
                        value={query}
                        onChange={e => {
                          setQuery(e.target.value);
                          setSelectedUser(null);
                          setAddError('');
                        }}
                        className="pl-8"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!selectedUser || adding}
                      onClick={handleAddPlayer}
                    >
                      {adding ? 'Adding…' : 'Add'}
                    </Button>
                  </div>

                  {showDropdown && (
                    <div
                      data-testid="search-dropdown"
                      className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
                    >
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
                            <span className="text-muted-foreground text-xs">{u.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedUser && (
                  <p className="text-xs text-muted-foreground">
                    Ready to invite <span className="font-medium text-foreground">{selectedUser.username}</span> ({selectedUser.email})
                  </p>
                )}

                {addError && (
                  <p className="text-sm text-destructive">{addError}</p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </MainLayout>
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
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">You</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
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
