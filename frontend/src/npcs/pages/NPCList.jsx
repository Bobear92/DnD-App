import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import { useCampaign } from '../../campaigns/CampaignContext';
import npcService, { mapNpcImageUrl } from '../npcService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drama, Plus, Eye, EyeOff, Search, Trash2, Users, UserCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  alive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  dead: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  missing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  unknown: 'bg-secondary text-secondary-foreground',
};

function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_STYLES[status] || STATUS_STYLES.unknown)}>
      {status}
    </span>
  );
}

const EMPTY_FORM = {
  name: '',
  race: '',
  occupation: '',
  alignment: '',
  status: 'alive',
  summary: '',
  is_visible_to_players: false,
};

export default function NPCList() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [npcs, setNpcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerView, setPlayerView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!campaignId) { navigate('/campaigns'); return; }
    loadNpcs();
  }, [campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadNpcs = async () => {
    setLoading(true);
    setError('');
    try {
      setNpcs(await npcService.getNpcs(campaignId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load NPCs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const created = await npcService.createNpc({ ...form, campaign_id: Number(campaignId) });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      navigate(`/campaigns/${campaignId}/npcs/${created.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create NPC');
      setCreating(false);
    }
  };

  const handleDelete = async (npcId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this NPC? This cannot be undone.')) return;
    setDeletingId(npcId);
    try {
      await npcService.deleteNpc(npcId);
      setNpcs(prev => prev.filter(n => n.id !== npcId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete NPC');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (npcId, e) => {
    e.stopPropagation();
    try {
      const updated = await npcService.toggleVisibility(npcId);
      setNpcs(prev => prev.map(n => n.id === npcId ? { ...n, is_visible_to_players: updated.is_visible_to_players } : n));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update visibility');
    }
  };

  const displayed = useMemo(() => {
    let base = playerView ? npcs.filter(n => n.is_visible_to_players) : npcs;
    if (statusFilter !== 'all') base = base.filter(n => n.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(n =>
        n.name.toLowerCase().includes(q) ||
        (n.race || '').toLowerCase().includes(q) ||
        (n.occupation || '').toLowerCase().includes(q)
      );
    }
    return base;
  }, [npcs, playerView, statusFilter, searchQuery]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading NPCs…</div>
        </div>
      </MainLayout>
    );
  }

  const isFiltered = searchQuery.trim().length > 0 || statusFilter !== 'all';

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Drama className="w-6 h-6" />
              NPCs
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {campaign?.name} — {playerView ? 'showing player view' : 'manage campaign characters'}
            </p>
          </div>
          <div className="flex gap-2">
            {isGm && (
              <Button
                variant={playerView ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlayerView(v => !v)}
              >
                <Users className="w-4 h-4 mr-2" />
                Player View
              </Button>
            )}
            {isGm && !playerView && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New NPC
              </Button>
            )}
          </div>
        </div>

        {playerView && (
          <div className="mb-4 p-3 bg-muted rounded-md text-sm flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            Previewing as player — only visible NPCs are shown.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search by name, race, or occupation…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="alive">Alive</SelectItem>
              <SelectItem value="dead">Dead</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Empty state */}
        {displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Drama className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-1">
              {isFiltered ? 'No matching NPCs' : playerView ? 'No Visible NPCs' : 'No NPCs Yet'}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {isFiltered
                ? 'Try adjusting your search or status filter.'
                : playerView
                ? 'No NPCs have been made visible to players yet.'
                : 'Create your first NPC to populate the campaign world.'}
            </p>
            {isGm && !playerView && !isFiltered && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First NPC
              </Button>
            )}
          </div>
        )}

        {/* NPC Grid */}
        {displayed.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map(npc => {
              const imgUrl = mapNpcImageUrl(npc.image_path);
              return (
                <Card
                  key={npc.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => navigate(`/campaigns/${campaignId}/npcs/${npc.id}`)}
                >
                  {/* Portrait */}
                  <div className="relative h-44 bg-muted flex items-center justify-center">
                    {imgUrl ? (
                      <img src={imgUrl} alt={npc.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-16 h-16 text-muted-foreground/30" />
                    )}
                    {isGm && !playerView && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => handleToggleVisibility(npc.id, e)}
                          className="p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
                          title={npc.is_visible_to_players ? 'Visible to players' : 'Hidden from players'}
                        >
                          {npc.is_visible_to_players
                            ? <Eye className="w-3.5 h-3.5 text-green-400" />
                            : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => handleDelete(npc.id, e)}
                          disabled={deletingId === npc.id}
                          className="p-1 rounded bg-black/50 text-white hover:bg-red-600/80 transition-colors disabled:opacity-50"
                          title="Delete NPC"
                        >
                          {deletingId === npc.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <StatusBadge status={npc.status} />
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <p className="font-semibold text-sm leading-tight truncate">{npc.name}</p>
                    {(npc.race || npc.occupation) && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[npc.race, npc.occupation].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {npc.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{npc.summary}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New NPC</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="npc-name">Name *</Label>
                <Input
                  id="npc-name"
                  placeholder="e.g. Elara Moonwhisper"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="npc-race">Race</Label>
                  <Input
                    id="npc-race"
                    placeholder="e.g. Elf, Human"
                    value={form.race}
                    onChange={(e) => setForm(f => ({ ...f, race: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="npc-occupation">Occupation</Label>
                  <Input
                    id="npc-occupation"
                    placeholder="e.g. Innkeeper, Guard"
                    value={form.occupation}
                    onChange={(e) => setForm(f => ({ ...f, occupation: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="npc-alignment">Alignment</Label>
                  <Input
                    id="npc-alignment"
                    placeholder="e.g. Neutral Good"
                    value={form.alignment}
                    onChange={(e) => setForm(f => ({ ...f, alignment: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alive">Alive</SelectItem>
                      <SelectItem value="dead">Dead</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="npc-summary">Summary</Label>
                <Textarea
                  id="npc-summary"
                  placeholder="Brief description players will see on the NPC card…"
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="npc-visible"
                  checked={form.is_visible_to_players}
                  onChange={(e) => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="npc-visible" className="cursor-pointer">Visible to players</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? 'Creating…' : 'Create NPC'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
}
