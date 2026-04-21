import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import locationService from '../locationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Eye, EyeOff, ChevronRight, Map, Users } from 'lucide-react';

export default function LocationList() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState(null);
  const [user, setUser] = useState(null);
  const [playerView, setPlayerView] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    gm_notes: '',
    location_type: '',
    status: '',
    is_visible_to_players: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCampaign = localStorage.getItem('selectedCampaign');
    if (!storedUser || !storedCampaign) { navigate('/campaigns'); return; }
    setUser(JSON.parse(storedUser));
    const camp = JSON.parse(storedCampaign);
    setCampaign(camp);
    loadLocations(camp.id);
  }, [navigate]);

  const loadLocations = async (campaignId) => {
    setLoading(true);
    setError('');
    try {
      const data = await locationService.getLocations(campaignId);
      setLocations(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await locationService.createLocation(campaign.id, form);
      setShowCreate(false);
      setForm({ name: '', description: '', gm_notes: '', location_type: '', status: '', is_visible_to_players: false });
      await loadLocations(campaign.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create location');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (locationId, e) => {
    e.stopPropagation();
    try {
      const updated = await locationService.toggleLocationVisibility(campaign.id, locationId);
      setLocations(prev => prev.map(l => l.id === locationId ? { ...l, is_visible_to_players: updated.is_visible_to_players } : l));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update visibility');
    }
  };

  const isGm = !!user;
  const visibleLocations = playerView ? locations.filter(l => l.is_visible_to_players) : locations;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading locations...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Map className="w-6 h-6" />
              Locations
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {campaign?.name} — {playerView ? 'showing player view' : 'manage campaign locations and maps'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={playerView ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerView(v => !v)}
              title="Preview what players see"
            >
              <Users className="w-4 h-4 mr-2" />
              Player View
            </Button>
            {isGm && !playerView && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Location
              </Button>
            )}
          </div>
        </div>

        {playerView && (
          <div className="mb-4 p-3 bg-muted rounded-md text-sm flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            Previewing as player — only visible locations are shown.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
        )}

        {/* Location grid */}
        {visibleLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-1">
              {playerView ? 'No Visible Locations' : 'No Locations Yet'}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {playerView
                ? 'No locations have been made visible to players yet.'
                : 'Add your first location to start building your world.'}
            </p>
            {isGm && !playerView && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Location
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleLocations.map((loc) => (
              <Card
                key={loc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/locations/${loc.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{loc.name}</CardTitle>
                    {isGm && !playerView && (
                      <button
                        onClick={(e) => handleToggleVisibility(loc.id, e)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        title={loc.is_visible_to_players ? 'Visible to players — click to hide' : 'Hidden from players — click to show'}
                      >
                        {loc.is_visible_to_players
                          ? <Eye className="w-4 h-4 text-primary" />
                          : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {loc.location_type && (
                      <Badge variant="secondary" className="text-xs">{loc.location_type}</Badge>
                    )}
                    {loc.status && (
                      <Badge variant="outline" className="text-xs">{loc.status}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {loc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{loc.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Map className="w-3 h-3" /> Maps
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Location Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="loc-name">Name *</Label>
                <Input
                  id="loc-name"
                  placeholder="e.g. Neverwinter, The Underdark"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-type">Type</Label>
                  <Input
                    id="loc-type"
                    placeholder="e.g. City, Dungeon, Region"
                    value={form.location_type}
                    onChange={(e) => setForm(f => ({ ...f, location_type: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-status">Status</Label>
                  <Input
                    id="loc-status"
                    placeholder="e.g. Active, Ruined, Hidden"
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-desc">Description</Label>
                <Textarea
                  id="loc-desc"
                  placeholder="What players see about this location…"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc-notes">GM Notes</Label>
                <Textarea
                  id="loc-notes"
                  placeholder="Private notes only you can see…"
                  rows={2}
                  value={form.gm_notes}
                  onChange={(e) => setForm(f => ({ ...f, gm_notes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="loc-visible"
                  checked={form.is_visible_to_players}
                  onChange={(e) => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="loc-visible" className="cursor-pointer">Visible to players</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
                {creating ? 'Creating…' : 'Create Location'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
