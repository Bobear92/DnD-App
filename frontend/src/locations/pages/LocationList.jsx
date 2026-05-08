import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import { useCampaign } from '../../campaigns/CampaignContext';
import locationService, { mapImageUrl } from '../locationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Plus, Eye, EyeOff, ChevronRight, ChevronDown,
  Map, Users, Search, GitBranch, List, Layers, HelpCircle,
  Loader2, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tree builder ─────────────────────────────────────────────────────────────

function buildHierarchyTree(topLevel, locMap, locs) {
  if (!topLevel) return { tree: null, rendered: new Set() };
  const rendered = new Set();

  function buildNode(loc) {
    rendered.add(loc.id);
    const byParent = locs.filter(l => l.parent_location_id === loc.id);
    const parentSet = new Set(byParent.map(l => l.id));
    const byPin = loc.pin_child_ids
      .map(id => locMap[id])
      .filter(l => l && !parentSet.has(l.id));
    const all = [
      ...byParent.map(l => ({ loc: l, isFromPin: false })),
      ...byPin.map(l => ({ loc: l, isFromPin: true })),
    ].sort((a, b) => a.loc.name.localeCompare(b.loc.name));
    const children = [];
    for (const { loc: child, isFromPin } of all) {
      if (!rendered.has(child.id)) {
        children.push({ ...buildNode(child), isFromPin });
      }
    }
    return { loc, children };
  }

  return { tree: buildNode(topLevel), rendered };
}

// ── LocationTreeNode ─────────────────────────────────────────────────────────

function LocationTreeNode({ node, depth, navigate, campaignId, isGm, playerView, onToggleVisibility }) {
  const [expanded, setExpanded] = useState(true);
  const { loc, children } = node;

  return (
    <div className={cn(depth > 0 && 'border-l border-border ml-4 pl-3')}>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer group"
        onClick={() => navigate(`/campaigns/${campaignId}/locations/${loc.id}`)}
      >
        {children.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            {expanded
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="font-medium text-sm flex-1 min-w-0 truncate">{loc.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {loc.location_type && (
            <Badge variant="secondary" className="text-xs">{loc.location_type}</Badge>
          )}
          {loc.status && (
            <Badge variant="outline" className="text-xs">{loc.status}</Badge>
          )}
          {isGm && !playerView && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(loc.id, e); }}
              className="text-muted-foreground hover:text-foreground ml-1"
              title={loc.is_visible_to_players ? 'Visible to players' : 'Hidden from players'}
            >
              {loc.is_visible_to_players
                ? <Eye className="w-3.5 h-3.5 text-primary" />
                : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <LocationTreeNode
              key={child.loc.id}
              node={child}
              depth={depth + 1}
              navigate={navigate}
              campaignId={campaignId}
              isGm={isGm}
              playerView={playerView}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── LocationCard (flat/grid view) ────────────────────────────────────────────

function LocationCard({ loc, navigate, campaignId, isGm, playerView, onToggleVisibility }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/campaigns/${campaignId}/locations/${loc.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{loc.name}</CardTitle>
          {isGm && !playerView && (
            <button
              onClick={(e) => onToggleVisibility(loc.id, e)}
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
          {loc.location_type && <Badge variant="secondary" className="text-xs">{loc.location_type}</Badge>}
          {loc.status && <Badge variant="outline" className="text-xs">{loc.status}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loc.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{loc.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Map className="w-3 h-3" /> Maps</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Collapsible Section Header ───────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, open, onToggle }) {
  return (
    <button
      className="flex items-center gap-2 w-full text-left mb-3"
      onClick={onToggle}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="font-semibold text-sm">{title}</span>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs ml-1">{count}</Badge>
      )}
      {open
        ? <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
        : <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LocationList() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerView, setPlayerView] = useState(false);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' | 'alphabetical'
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [unsortedOpen, setUnsortedOpen] = useState(true);
  const [unknownOpen, setUnknownOpen] = useState(true);
  const [topLevelMaps, setTopLevelMaps] = useState([]);
  const [selectedTopMapId, setSelectedTopMapId] = useState(null);
  const [loadingTopMap, setLoadingTopMap] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    gm_notes: '',
    location_type: '',
    status: '',
    is_visible_to_players: false,
  });

  useEffect(() => {
    if (!campaignId) { navigate('/campaigns'); return; }
    loadLocations(campaignId);
  }, [campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLocations = async (campaignId) => {
    setLoading(true);
    setError('');
    try {
      setLocations(await locationService.getLocations(campaignId));
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
      await locationService.createLocation(campaignId, form);
      setShowCreate(false);
      setForm({ name: '', description: '', gm_notes: '', location_type: '', status: '', is_visible_to_players: false });
      await loadLocations(campaignId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create location');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (locationId, e) => {
    e.stopPropagation();
    try {
      const updated = await locationService.toggleLocationVisibility(campaignId, locationId);
      setLocations(prev => prev.map(l =>
        l.id === locationId ? { ...l, is_visible_to_players: updated.is_visible_to_players } : l
      ));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update visibility');
    }
  };

  const isGm = campaign?.userRole === 'gm';

  // ── Derived data ────────────────────────────────────────────────────────────

  const displayLocs = useMemo(() => {
    const base = playerView ? locations.filter(l => l.is_visible_to_players) : locations;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q) ||
      (l.location_type || '').toLowerCase().includes(q)
    );
  }, [locations, playerView, searchQuery]);

  const locMap = useMemo(
    () => Object.fromEntries(displayLocs.map(l => [l.id, l])),
    [displayLocs]
  );

  const topLevel = useMemo(() => displayLocs.find(l => l.is_top_level) || null, [displayLocs]);

  const { tree, rendered } = useMemo(
    () => buildHierarchyTree(topLevel, locMap, displayLocs),
    [topLevel, locMap, displayLocs]
  );

  const allPinChildIds = useMemo(
    () => new Set(displayLocs.flatMap(l => l.pin_child_ids)),
    [displayLocs]
  );

  const unsortedLocs = useMemo(
    () => displayLocs.filter(l =>
      !l.is_top_level &&
      !l.is_unknown &&
      l.parent_location_id === null &&
      !allPinChildIds.has(l.id)
    ),
    [displayLocs, allPinChildIds]
  );

  const unknownLocs = useMemo(
    () => displayLocs.filter(l => l.is_unknown),
    [displayLocs]
  );

  // ── Top-level map loading (must come after topLevel is declared) ─────────────

  const handleSelectTopMap = (mapId) => {
    setSelectedTopMapId(mapId);
  };

  useEffect(() => {
    if (!topLevel || !campaignId) {
      setTopLevelMaps([]);
      setSelectedTopMapId(null);
      return;
    }
    setLoadingTopMap(true);
    locationService.getMaps(campaignId, topLevel.id)
      .then((maps) => {
        setTopLevelMaps(maps);
        if (maps.length > 0) setSelectedTopMapId(maps[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingTopMap(false));
  }, [topLevel?.id, campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Top-level map derived data ───────────────────────────────────────────────

  const visibleTopMaps = playerView ? topLevelMaps.filter(m => m.is_visible_to_players) : topLevelMaps;
  const selectedTopMap = visibleTopMaps.find(m => m.id === selectedTopMapId) || visibleTopMaps[0] || null;

  // ── Handlers for toggle visibility in tree ──────────────────────────────────

  const toggleProps = { campaignId, isGm, playerView, onToggleVisibility: handleToggleVisibility };

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading locations...</div>
        </div>
      </MainLayout>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isSearching = searchQuery.trim().length > 0;
  const showHierarchy = !isSearching && (playerView ? viewMode === 'hierarchy' : true);

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
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

        {/* Player view banner */}
        {playerView && (
          <div className="mb-4 p-3 bg-muted rounded-md text-sm flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            Previewing as player — only visible locations are shown.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
        )}

        {/* Search + view-mode toggle */}
        <div className="flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search locations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Only show view-mode toggle in player view (or playerView preview) */}
          {playerView && (
            <div className="flex rounded-md border overflow-hidden shrink-0">
              <button
                className={cn('px-3 py-1.5 text-sm flex items-center gap-1.5', viewMode === 'hierarchy' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                onClick={() => setViewMode('hierarchy')}
              >
                <GitBranch className="w-3.5 h-3.5" /> Hierarchy
              </button>
              <button
                className={cn('px-3 py-1.5 text-sm flex items-center gap-1.5 border-l', viewMode === 'alphabetical' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
                onClick={() => setViewMode('alphabetical')}
              >
                <List className="w-3.5 h-3.5" /> A–Z
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {displayLocs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-1">
              {isSearching ? 'No matching locations' : playerView ? 'No Visible Locations' : 'No Locations Yet'}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {isSearching
                ? 'Try a different search term.'
                : playerView
                ? 'No locations have been made visible to players yet.'
                : 'Add your first location to start building your world.'}
            </p>
            {isGm && !playerView && !isSearching && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Location
              </Button>
            )}
          </div>
        )}

        {/* ── Search results ── flat grid */}
        {isSearching && displayLocs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayLocs.map(loc => (
              <LocationCard key={loc.id} loc={loc} navigate={navigate} {...toggleProps} />
            ))}
          </div>
        )}

        {/* ── Alphabetical view (player only, no search) */}
        {!isSearching && playerView && viewMode === 'alphabetical' && displayLocs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...displayLocs].sort((a, b) => a.name.localeCompare(b.name)).map(loc => (
              <LocationCard key={loc.id} loc={loc} navigate={navigate} {...toggleProps} />
            ))}
          </div>
        )}

        {/* ── Hierarchy view ── */}
        {showHierarchy && displayLocs.length > 0 && (
          <div className="space-y-6">

            {/* Hierarchy tree */}
            <div>
              <SectionHeader
                icon={GitBranch}
                title="World Hierarchy"
                open={true}
                onToggle={() => {}}
              />

              {/* Top-level map viewer */}
              {tree && (
                loadingTopMap ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground gap-2 mb-3 border rounded-lg bg-zinc-900/30">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading map…
                  </div>
                ) : visibleTopMaps.length > 0 && selectedTopMap ? (
                  <div className="mb-4">
                    {/* GM toolbar above the map */}
                    {isGm && !playerView && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Map preview — click pins to navigate. Edit info, maps, and pins in the location detail.
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => navigate(`/campaigns/${campaignId}/locations/${topLevel.id}`)}
                        >
                          <Pencil className="w-3 h-3 mr-1.5" />
                          Edit {topLevel.name}
                        </Button>
                      </div>
                    )}
                    {/* Map tab strip (shown only if multiple maps) */}
                    {visibleTopMaps.length > 1 && (
                      <div className="flex gap-1 mb-2 flex-wrap">
                        {visibleTopMaps.map(m => (
                          <button
                            key={m.id}
                            onClick={() => handleSelectTopMap(m.id)}
                            className={cn(
                              'text-xs px-3 py-1 rounded-md border transition-colors',
                              selectedTopMap.id === m.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Map image — read-only preview, no pins */}
                    <div className="relative rounded-lg overflow-hidden border bg-zinc-900">
                      <div className="overflow-y-auto max-h-[500px]">
                        <img
                          src={mapImageUrl(selectedTopMap.image_path)}
                          alt={selectedTopMap.name}
                          className="w-full h-auto block select-none"
                          draggable={false}
                        />
                      </div>
                      {/* Bottom bar */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 flex items-end justify-between pointer-events-none">
                        <div>
                          <p className="text-white font-semibold text-sm">{topLevel.name}</p>
                          {topLevel.location_type && <p className="text-white/70 text-xs">{topLevel.location_type}</p>}
                        </div>
                        <button
                          className="pointer-events-auto text-xs text-white/80 hover:text-white flex items-center gap-1"
                          onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${campaignId}/locations/${topLevel.id}`); }}
                        >
                          Open Location <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null
              )}

              {/* Tree */}
              {tree ? (
                <div className="border rounded-md p-3 bg-card">
                  <LocationTreeNode
                    node={tree}
                    depth={0}
                    navigate={navigate}
                    {...toggleProps}
                  />
                </div>
              ) : (
                <div className="border rounded-md p-6 text-center text-muted-foreground text-sm">
                  <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  {isGm && !playerView
                    ? 'No top-level location set. Open a location\'s Info tab and mark it as "Top Level" to start building the hierarchy.'
                    : 'No hierarchy configured yet.'}
                </div>
              )}
            </div>

            {/* Unsorted — GM only, not player view */}
            {!playerView && unsortedLocs.length > 0 && (
              <div>
                <SectionHeader
                  icon={Layers}
                  title="Unsorted"
                  count={unsortedLocs.length}
                  open={unsortedOpen}
                  onToggle={() => setUnsortedOpen(v => !v)}
                />
                {unsortedOpen && (
                  <div className="space-y-1 border rounded-md p-3 bg-card">
                    <p className="text-xs text-muted-foreground mb-3 px-2">
                      These locations haven't been placed in the hierarchy yet. Open each one's Info tab to set a parent or mark it as Unknown.
                    </p>
                    {unsortedLocs.sort((a, b) => a.name.localeCompare(b.name)).map(loc => (
                      <div
                        key={loc.id}
                        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => navigate(`/campaigns/${campaignId}/locations/${loc.id}`)}
                      >
                        <span className="w-4 shrink-0" />
                        <span className="text-sm flex-1 min-w-0 truncate">{loc.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {loc.location_type && <Badge variant="secondary" className="text-xs">{loc.location_type}</Badge>}
                          {isGm && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleVisibility(loc.id, e); }}
                              className="text-muted-foreground hover:text-foreground ml-1"
                            >
                              {loc.is_visible_to_players
                                ? <Eye className="w-3.5 h-3.5 text-primary" />
                                : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unknown Locations */}
            {unknownLocs.length > 0 && (
              <div>
                <SectionHeader
                  icon={HelpCircle}
                  title="Unknown Locations"
                  count={unknownLocs.length}
                  open={unknownOpen}
                  onToggle={() => setUnknownOpen(v => !v)}
                />
                {unknownOpen && (
                  <div className="space-y-1 border rounded-md p-3 bg-card">
                    {!playerView && (
                      <p className="text-xs text-muted-foreground mb-3 px-2">
                        Players can see these locations but don't know where they fit geographically.
                      </p>
                    )}
                    {unknownLocs.sort((a, b) => a.name.localeCompare(b.name)).map(loc => (
                      <div
                        key={loc.id}
                        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => navigate(`/campaigns/${campaignId}/locations/${loc.id}`)}
                      >
                        <span className="w-4 shrink-0" />
                        <span className="text-sm flex-1 min-w-0 truncate">{loc.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {loc.location_type && <Badge variant="secondary" className="text-xs">{loc.location_type}</Badge>}
                          {isGm && !playerView && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleVisibility(loc.id, e); }}
                              className="text-muted-foreground hover:text-foreground ml-1"
                            >
                              {loc.is_visible_to_players
                                ? <Eye className="w-3.5 h-3.5 text-primary" />
                                : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
