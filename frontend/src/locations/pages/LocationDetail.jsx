import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import locationService, { mapImageUrl } from '../locationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Eye, EyeOff, Pencil, Trash2, Upload, Plus,
  MapPin, X, Check, Map, Loader2, ZoomIn, ZoomOut,
  Link, Users, ExternalLink, Move, UserCircle, Shield,
  Leaf, Wind, Sword, BookOpen, LandPlot, GitBranch,
} from 'lucide-react';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

const EMPTY_EDIT_FORM = (loc) => ({
  name: loc.name,
  description: loc.description || '',
  gm_notes: loc.gm_notes || '',
  location_type: loc.location_type || '',
  status: loc.status || '',
  is_visible_to_players: loc.is_visible_to_players,
  // Hierarchy
  parent_location_id: loc.parent_location_id ?? null,
  is_top_level: loc.is_top_level ?? false,
  is_unknown: loc.is_unknown ?? false,
  // Environment
  weather: loc.weather || '',
  plant_life: loc.plant_life || '',
  animal_life: loc.animal_life || '',
  terrain: loc.terrain || '',
  climate: loc.climate || '',
  // Lore & Culture
  history: loc.history || '',
  rumors: loc.rumors || '',
  government: loc.government || '',
  religion: loc.religion || '',
  economy: loc.economy || '',
  // Adventure
  threats: loc.threats || '',
  available_services: loc.available_services || '',
  points_of_interest: loc.points_of_interest || '',
});

export default function LocationDetail() {
  const navigate = useNavigate();
  const { locationId } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [locationListItem, setLocationListItem] = useState(null);
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerView, setPlayerView] = useState(false);

  // Edit location state
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Map upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Which pin's tooltip is open (toggled by click)
  const [openPinId, setOpenPinId] = useState(null);

  // Pin state
  const [addingPin, setAddingPin] = useState(false);
  const [pendingPin, setPendingPin] = useState(null);
  const [pinForm, setPinForm] = useState({ label: '', description: '', is_visible_to_players: false, linked_location_id: '' });
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [movingPin, setMovingPin] = useState(null);

  // Inline new-location creation inside the pin dialog
  const [showNewLocInPin, setShowNewLocInPin] = useState(false);
  const [newLocForm, setNewLocForm] = useState({ name: '', location_type: '', status: '' });
  const [creatingLoc, setCreatingLoc] = useState(false);

  // Location NPCs state
  const [locationNpcs, setLocationNpcs] = useState([]);
  const [showAddNpc, setShowAddNpc] = useState(false);
  const [campaignNpcs, setCampaignNpcs] = useState([]);
  const [npcForm, setNpcForm] = useState({ npc_id: '', description: '' });
  const [addingNpc, setAddingNpc] = useState(false);
  const [loadingNpcs, setLoadingNpcs] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCampaign = localStorage.getItem('selectedCampaign');
    if (!storedUser || !storedCampaign) { navigate('/campaigns'); return; }
    const u = JSON.parse(storedUser);
    const c = JSON.parse(storedCampaign);
    setUser(u);
    setCampaign(c);
    loadAll(c.id, locationId);
  }, [locationId, navigate]);

  const loadAll = async (campaignId, locId) => {
    setLoading(true);
    setError('');
    try {
      const [loc, mapList, allLocs, npcs] = await Promise.all([
        locationService.getLocation(campaignId, locId),
        locationService.getMaps(campaignId, locId),
        locationService.getLocations(campaignId),
        locationService.getLocationNpcs(campaignId, locId),
      ]);
      setLocation(loc);
      setEditForm(EMPTY_EDIT_FORM(loc));
      setMaps(mapList);
      const lid = parseInt(locId);
      setLocationListItem(allLocs.find(l => l.id === lid) || null);
      setAllLocations(allLocs.filter(l => l.id !== lid));
      setLocationNpcs(npcs);
      if (mapList.length > 0) await selectMap(campaignId, locId, mapList[0]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load location');
    } finally {
      setLoading(false);
    }
  };

  const selectMap = async (campaignId, locId, map) => {
    setSelectedMap(map);
    setZoom(1);
    setOpenPinId(null);
    setMovingPin(null);
    setAddingPin(false);
    try {
      const pinList = await locationService.getPins(campaignId, locId, map.id);
      setPins(pinList);
    } catch {
      setPins([]);
    }
  };

  const refreshPins = async () => {
    if (!selectedMap || !campaign) return;
    const pinList = await locationService.getPins(campaign.id, locationId, selectedMap.id);
    setPins(pinList);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updated = await locationService.updateLocation(campaign.id, locationId, editForm);
      setLocation(updated);
      // Refresh hierarchy fields — backend may have auto-cleared conflicting flags
      setEditForm(f => ({
        ...f,
        parent_location_id: updated.parent_location_id ?? null,
        is_top_level: updated.is_top_level ?? false,
        is_unknown: updated.is_unknown ?? false,
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLocationVisibility = async () => {
    try {
      const updated = await locationService.toggleLocationVisibility(campaign.id, locationId);
      setLocation(prev => ({ ...prev, is_visible_to_players: updated.is_visible_to_players }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update visibility');
    }
  };

  const MAX_UPLOAD_MB = 100;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setUploadError('');
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(`File is ${(f.size / 1024 / 1024).toFixed(1)} MB — maximum is ${MAX_UPLOAD_MB} MB.`);
      e.target.value = '';
      return;
    }
    setUploadFile(f);
    if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, ''));
    setUploadPreview(URL.createObjectURL(f));
  };

  const handleUploadMap = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setUploading(true);
    try {
      const newMap = await locationService.uploadMap(campaign.id, locationId, uploadName, uploadFile);
      const updatedMaps = [...maps, newMap];
      setMaps(updatedMaps);
      setShowUpload(false);
      setUploadName('');
      setUploadFile(null);
      setUploadPreview(null);
      await selectMap(campaign.id, locationId, newMap);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMap = async (mapId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this map? This will also remove all its pins.')) return;
    try {
      await locationService.deleteMap(campaign.id, locationId, mapId);
      const remaining = maps.filter(m => m.id !== mapId);
      setMaps(remaining);
      if (selectedMap?.id === mapId) {
        if (remaining.length > 0) await selectMap(campaign.id, locationId, remaining[0]);
        else { setSelectedMap(null); setPins([]); }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete map');
    }
  };

  const handleToggleMapVisibility = async (mapId, e) => {
    e.stopPropagation();
    try {
      const updated = await locationService.toggleMapVisibility(campaign.id, locationId, mapId);
      setMaps(prev => prev.map(m => m.id === mapId ? { ...m, is_visible_to_players: updated.is_visible_to_players } : m));
      if (selectedMap?.id === mapId) setSelectedMap(prev => ({ ...prev, is_visible_to_players: updated.is_visible_to_players }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update visibility');
    }
  };

  const handleCreateLocInPin = async () => {
    if (!newLocForm.name.trim()) return;
    setCreatingLoc(true);
    try {
      const created = await locationService.createLocation(campaign.id, {
        name: newLocForm.name,
        location_type: newLocForm.location_type,
        status: newLocForm.status,
        description: '',
        gm_notes: '',
        is_visible_to_players: false,
      });
      setAllLocations(prev => [...prev, created]);
      setPinForm(f => ({ ...f, linked_location_id: String(created.id) }));
      setShowNewLocInPin(false);
      setNewLocForm({ name: '', location_type: '', status: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create location');
    } finally {
      setCreatingLoc(false);
    }
  };

  // NPC handlers
  const handleOpenAddNpc = async () => {
    setShowAddNpc(true);
    setNpcForm({ npc_id: '', description: '' });
    setLoadingNpcs(true);
    try {
      const npcs = await locationService.getCampaignNpcs(campaign.id);
      const linked = new Set(locationNpcs.map(n => n.npc_id));
      setCampaignNpcs(npcs.filter(n => !linked.has(n.id)));
    } catch {
      setCampaignNpcs([]);
    } finally {
      setLoadingNpcs(false);
    }
  };

  const handleAddNpc = async () => {
    if (!npcForm.npc_id) return;
    setAddingNpc(true);
    try {
      const added = await locationService.addLocationNpc(campaign.id, locationId, {
        npc_id: parseInt(npcForm.npc_id),
        description: npcForm.description || null,
      });
      setLocationNpcs(prev => [...prev, added]);
      setShowAddNpc(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add NPC');
    } finally {
      setAddingNpc(false);
    }
  };

  const handleRemoveNpc = async (lnId) => {
    if (!window.confirm('Remove this NPC from this location?')) return;
    try {
      await locationService.removeLocationNpc(campaign.id, locationId, lnId);
      setLocationNpcs(prev => prev.filter(n => n.id !== lnId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove NPC');
    }
  };

  // Zoom controls
  const adjustZoom = (delta) => setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    adjustZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  }, []);

  const handleMovePin = async (pin, x, y) => {
    setMovingPin(null);
    try {
      await locationService.updatePin(campaign.id, locationId, selectedMap.id, pin.id, { x_percent: x, y_percent: y });
      await refreshPins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to move pin');
    }
  };

  const handleMapClick = useCallback((e) => {
    setOpenPinId(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    if (movingPin) {
      handleMovePin(movingPin, x, y);
      return;
    }
    if (!addingPin) return;
    setPendingPin({ x_percent: x, y_percent: y });
    setPinForm({ label: '', description: '', is_visible_to_players: false, linked_location_id: '' });
    setShowPinDialog(true);
  }, [addingPin, movingPin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePin = async () => {
    if (!pendingPin || !pinForm.label.trim()) return;
    setSavingPin(true);
    try {
      const payload = {
        ...pendingPin,
        label: pinForm.label,
        description: pinForm.description,
        is_visible_to_players: pinForm.is_visible_to_players,
        linked_location_id: pinForm.linked_location_id ? parseInt(pinForm.linked_location_id) : null,
      };
      await locationService.createPin(campaign.id, locationId, selectedMap.id, payload);
      await refreshPins();
      setShowPinDialog(false);
      setAddingPin(false);
      setPendingPin(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save pin');
    } finally {
      setSavingPin(false);
    }
  };

  const handleUpdatePin = async () => {
    if (!editingPin || !pinForm.label.trim()) return;
    setSavingPin(true);
    try {
      const payload = {
        label: pinForm.label,
        description: pinForm.description,
        is_visible_to_players: pinForm.is_visible_to_players,
        linked_location_id: pinForm.linked_location_id ? parseInt(pinForm.linked_location_id) : null,
      };
      await locationService.updatePin(campaign.id, locationId, selectedMap.id, editingPin.id, payload);
      await refreshPins();
      setShowPinDialog(false);
      setEditingPin(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update pin');
    } finally {
      setSavingPin(false);
    }
  };

  const handleDeletePin = async (pinId) => {
    if (!window.confirm('Delete this pin?')) return;
    try {
      await locationService.deletePin(campaign.id, locationId, selectedMap.id, pinId);
      await refreshPins();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete pin');
    }
  };

  const openEditPin = (pin, e) => {
    e.stopPropagation();
    setEditingPin(pin);
    setPinForm({
      label: pin.label,
      description: pin.description || '',
      is_visible_to_players: pin.is_visible_to_players,
      linked_location_id: pin.linked_location_id ? String(pin.linked_location_id) : '',
    });
    setShowPinDialog(true);
  };

  const isGm = !!user;

  const visibleMaps = playerView ? maps.filter(m => m.is_visible_to_players) : maps;
  const visiblePins = playerView ? pins.filter(p => p.is_visible_to_players) : pins;
  const visibleNpcs = playerView ? locationNpcs.filter(n => n.is_visible_to_players) : locationNpcs;

  useEffect(() => {
    if (!campaign || !visibleMaps.length) return;
    const currentVisible = visibleMaps.some(m => m.id === selectedMap?.id);
    if (!currentVisible) {
      selectMap(campaign.id, locationId, visibleMaps[0]);
    }
  }, [playerView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Info tab helpers ──────────────────────────────────────────────────────

  const SaveResetButtons = ({ onReset }) => (
    <div className="flex gap-2 pt-2 border-t">
      <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
      <Button size="sm" variant="outline" onClick={onReset}>Reset</Button>
    </div>
  );

  const field = (key) => editForm[key] ?? '';
  const setField = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));

  // Render a read-only text block — only shown in player view if non-empty
  const PlayerField = ({ label, value }) => {
    if (!value) return null;
    return (
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{label}</p>
        <p className="whitespace-pre-wrap text-sm">{value}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading location…
        </div>
      </MainLayout>
    );
  }

  if (!location) {
    return (
      <MainLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/locations')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Locations
          </Button>
          <p className="text-destructive mt-4">{error || 'Location not found.'}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Back + header */}
        <div className="flex items-start gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/locations')} className="mt-1 shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Locations
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{location.name}</h1>
            <div className="flex gap-2 mt-1 flex-wrap">
              {location.location_type && <Badge variant="secondary">{location.location_type}</Badge>}
              {location.status && <Badge variant="outline">{location.status}</Badge>}
              {location.is_visible_to_players
                ? <Badge variant="secondary" className="text-xs gap-1"><Eye className="w-3 h-3" /> Visible</Badge>
                : <Badge variant="outline" className="text-xs gap-1"><EyeOff className="w-3 h-3" /> Hidden</Badge>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant={playerView ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerView(v => !v)}
              title="Preview what players see"
            >
              <Users className="w-4 h-4" />
            </Button>
            {isGm && !playerView && (
              <Button variant="outline" size="sm" onClick={handleToggleLocationVisibility} title={location.is_visible_to_players ? 'Hide from players' : 'Show to players'}>
                {location.is_visible_to_players ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        {playerView && (
          <div className="mb-4 p-3 bg-muted rounded-md text-sm flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            Previewing as player — only visible content is shown. GM notes are hidden.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center gap-2">
            <X className="w-4 h-4 shrink-0" /> {error}
            <button className="ml-auto" onClick={() => setError('')}><X className="w-3 h-3" /></button>
          </div>
        )}

        <Tabs defaultValue="maps">
          <TabsList className="mb-4">
            <TabsTrigger value="maps">Maps & Pins</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          {/* ───── MAPS TAB ───── */}
          <TabsContent value="maps">
            <div className="flex gap-4 h-[calc(100vh-300px)] min-h-[400px]">
              {/* Left: map thumbnail strip */}
              <div className="w-48 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
                {isGm && !playerView && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => { setShowUpload(true); setUploadName(''); setUploadFile(null); setUploadPreview(null); }}
                  >
                    <Upload className="w-3 h-3 mr-1" /> Upload Map
                  </Button>
                )}
                {visibleMaps.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-4 px-2">
                    {playerView ? 'No visible maps.' : 'No maps yet. Upload one to get started.'}
                  </p>
                )}
                {visibleMaps.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => selectMap(campaign.id, locationId, m)}
                    className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                      selectedMap?.id === m.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img
                      src={mapImageUrl(m.image_path)}
                      alt={m.name}
                      className="w-full aspect-square object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="text-white text-xs font-medium truncate">{m.name}</p>
                    </div>
                    {isGm && !playerView && (
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleMapVisibility(m.id, e)}
                          className="w-6 h-6 bg-black/50 rounded flex items-center justify-center hover:bg-black/70 text-white"
                          title={m.is_visible_to_players ? 'Visible to players' : 'Hidden'}
                        >
                          {m.is_visible_to_players ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={(e) => handleDeleteMap(m.id, e)}
                          className="w-6 h-6 bg-black/50 rounded flex items-center justify-center hover:bg-red-600 text-white"
                          title="Delete map"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right: map viewer */}
              <div className="flex-1 min-w-0 flex flex-col">
                {selectedMap && visibleMaps.some(m => m.id === selectedMap.id) ? (
                  <>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-sm truncate flex-1">{selectedMap.name}</h3>
                      <div className="flex items-center gap-1 border rounded-md">
                        <button className="px-2 py-1 text-sm hover:bg-muted disabled:opacity-40" onClick={() => adjustZoom(-ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} title="Zoom out">
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button className="px-2 py-0.5 text-xs font-mono min-w-[3rem] text-center hover:bg-muted" onClick={() => setZoom(1)} title="Reset zoom">
                          {Math.round(zoom * 100)}%
                        </button>
                        <button className="px-2 py-1 text-sm hover:bg-muted disabled:opacity-40" onClick={() => adjustZoom(ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} title="Zoom in">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isGm && !playerView && (
                        <Button variant={addingPin ? 'default' : 'outline'} size="sm" onClick={() => { setAddingPin(a => !a); setMovingPin(null); }}>
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {addingPin ? 'Cancel' : 'Add Pin'}
                        </Button>
                      )}
                    </div>
                    {addingPin && (
                      <p className="text-xs text-primary mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Click anywhere on the map to place a pin
                      </p>
                    )}
                    {movingPin && (
                      <p className="text-xs text-amber-500 mb-2 flex items-center gap-1">
                        <Move className="w-3 h-3" /> Click where you want to move &ldquo;{movingPin.label}&rdquo;
                        <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setMovingPin(null)}>
                          <X className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                    <div className={`flex-1 overflow-auto rounded-lg border bg-zinc-900 ${addingPin || movingPin ? 'cursor-crosshair' : ''}`} onWheel={handleWheel}>
                      <div className="min-h-full flex items-center justify-center p-3">
                        <div className="relative" style={{ width: `${zoom * 100}%`, minWidth: '200px' }} onClick={handleMapClick}>
                          <img src={mapImageUrl(selectedMap.image_path)} alt={selectedMap.name} className="w-full h-auto block select-none" draggable={false} />
                          {visiblePins.map((pin) => {
                            const linkedLoc = allLocations.find(l => l.id === pin.linked_location_id);
                            const isOpen = openPinId === pin.id;
                            return (
                              <div
                                key={pin.id}
                                className="absolute"
                                style={{ left: `${pin.x_percent}%`, top: `${pin.y_percent}%`, transform: 'translate(-50%, -100%)', zIndex: isOpen ? 20 : 10 }}
                                onClick={(e) => { e.stopPropagation(); setOpenPinId(isOpen ? null : pin.id); }}
                              >
                                <div className="relative flex flex-col items-center cursor-pointer">
                                  <div className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap max-w-[140px] truncate mb-0.5 shadow-md flex items-center gap-1 transition-opacity ${
                                    linkedLoc ? 'bg-blue-600 text-white' : 'bg-primary text-primary-foreground'
                                  } ${isOpen ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                                    {linkedLoc && <Link className="w-2.5 h-2.5 shrink-0" />}
                                    {pin.label}
                                  </div>
                                  <MapPin className={`w-5 h-5 drop-shadow-md ${linkedLoc ? 'text-blue-500' : 'text-primary'}`} />
                                </div>
                                {isOpen && (
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20" onClick={(e) => e.stopPropagation()}>
                                    <div className="bg-popover border rounded-md shadow-lg p-2.5 min-w-[190px]">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-medium text-xs">{pin.label}</p>
                                        <button onClick={() => setOpenPinId(null)} className="text-muted-foreground hover:text-foreground shrink-0 -mt-0.5">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      {pin.description && <p className="text-xs text-muted-foreground mb-2">{pin.description}</p>}
                                      {linkedLoc && (
                                        <button onClick={() => navigate(`/locations/${linkedLoc.id}`)} className="w-full flex items-center gap-1 text-xs py-1 px-2 rounded bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 mb-1">
                                          <ExternalLink className="w-3 h-3" /> Go to {linkedLoc.name}
                                        </button>
                                      )}
                                      {isGm && !playerView && (
                                        <div className="flex gap-1 mt-1">
                                          <button onClick={(e) => openEditPin(pin, e)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border hover:bg-muted">
                                            <Pencil className="w-3 h-3" /> Edit
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); setMovingPin(pin); setAddingPin(false); setOpenPinId(null); }} className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border hover:bg-muted">
                                            <Move className="w-3 h-3" /> Move
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }} className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border hover:bg-destructive hover:text-destructive-foreground">
                                            <Trash2 className="w-3 h-3" /> Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {visiblePins.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {visiblePins.map(pin => (
                          <Badge key={pin.id} variant="secondary" className="text-xs gap-1">
                            <MapPin className="w-3 h-3" /> {pin.label}
                            {pin.linked_location_id && <Link className="w-3 h-3 text-blue-500" />}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center rounded-lg border border-dashed bg-zinc-900/30">
                    <Map className="w-12 h-12 text-muted-foreground mb-3" />
                    {playerView ? (
                      <>
                        <p className="text-muted-foreground text-sm">No maps are visible to players yet.</p>
                        <p className="text-muted-foreground text-xs mt-1">Toggle off player view and use the <EyeOff className="w-3 h-3 inline" /> icon on a map thumbnail to make it visible.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-sm">No map selected</p>
                        {isGm && (
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setShowUpload(true); setUploadName(''); setUploadFile(null); setUploadPreview(null); }}>
                            <Upload className="w-3.5 h-3.5 mr-1" /> Upload First Map
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ───── INFO TAB ───── */}
          <TabsContent value="info">
            {playerView ? (
              /* ── Player view: read-only, fields hidden if empty ── */
              <div className="space-y-6">
                {/* Details */}
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><LandPlot className="w-4 h-4" /> Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <PlayerField label="Type" value={location.location_type} />
                      <PlayerField label="Status" value={location.status} />
                    </div>
                    <PlayerField label="Description" value={location.description} />
                  </CardContent>
                </Card>

                {/* Lore & Culture — only shown if any field has data */}
                {(location.history || location.rumors || location.government || location.religion || location.economy) && (
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lore & Culture</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <PlayerField label="History" value={location.history} />
                      <PlayerField label="Rumors & Legends" value={location.rumors} />
                      <PlayerField label="Government" value={location.government} />
                      <PlayerField label="Religion" value={location.religion} />
                      <PlayerField label="Economy" value={location.economy} />
                    </CardContent>
                  </Card>
                )}

                {/* Environment */}
                {(location.weather || location.climate || location.terrain || location.plant_life || location.animal_life) && (
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wind className="w-4 h-4" /> Environment</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <PlayerField label="Weather" value={location.weather} />
                        <PlayerField label="Climate" value={location.climate} />
                        <PlayerField label="Terrain" value={location.terrain} />
                      </div>
                      <PlayerField label="Plant Life" value={location.plant_life} />
                      <PlayerField label="Animal Life" value={location.animal_life} />
                    </CardContent>
                  </Card>
                )}

                {/* Adventure */}
                {(location.threats || location.available_services || location.points_of_interest) && (
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sword className="w-4 h-4" /> Adventure</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <PlayerField label="Threats & Hazards" value={location.threats} />
                      <PlayerField label="Available Services" value={location.available_services} />
                      <PlayerField label="Points of Interest" value={location.points_of_interest} />
                    </CardContent>
                  </Card>
                )}

                {/* Important NPCs */}
                {visibleNpcs.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCircle className="w-4 h-4" /> Important NPCs</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {visibleNpcs.map(npc => (
                          <div key={npc.id} className="border rounded-md p-3 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{npc.name}</p>
                                <p className="text-xs text-muted-foreground">{npc.race}{npc.occupation ? ` · ${npc.occupation}` : ''}</p>
                              </div>
                            </div>
                            {npc.description && <p className="text-xs text-primary/80 italic">{npc.description}</p>}
                            {npc.summary && <p className="text-xs text-muted-foreground">{npc.summary}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* ── GM view: always editable ── */
              <div className="space-y-6">
                {/* Row 1: Details + GM Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><LandPlot className="w-4 h-4" /> Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input value={field('name')} onChange={setField('name')} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Type</Label>
                          <Input placeholder="e.g. City, Dungeon, Region" value={field('location_type')} onChange={setField('location_type')} />
                        </div>
                        <div className="space-y-1">
                          <Label>Status</Label>
                          <Input placeholder="e.g. Active, Ruined, Hidden" value={field('status')} onChange={setField('status')} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Description <span className="text-muted-foreground font-normal">(player-visible)</span></Label>
                        <Textarea placeholder="What players see about this location…" rows={4} value={field('description')} onChange={setField('description')} />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="ev-visible" checked={editForm.is_visible_to_players || false} onChange={(e) => setEditForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} className="w-4 h-4" />
                        <Label htmlFor="ev-visible" className="cursor-pointer">Visible to players</Label>
                      </div>
                      <SaveResetButtons onReset={() => setEditForm(EMPTY_EDIT_FORM(location))} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" /> GM Notes
                        <Badge variant="outline" className="text-xs ml-auto">Private</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea placeholder="Private notes only you can see…" rows={8} value={field('gm_notes')} onChange={setField('gm_notes')} />
                      <SaveResetButtons onReset={() => setEditForm(f => ({ ...f, gm_notes: location.gm_notes || '' }))} />
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2: Lore & Culture + Environment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> Lore & Culture</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label>History</Label>
                        <Textarea placeholder="The location's backstory and lore…" rows={3} value={field('history')} onChange={setField('history')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Rumors & Legends</Label>
                        <Textarea placeholder="Things players might hear about this place…" rows={3} value={field('rumors')} onChange={setField('rumors')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Government</Label>
                        <Textarea placeholder="Who rules, political structure…" rows={2} value={field('government')} onChange={setField('government')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Religion</Label>
                        <Textarea placeholder="Dominant deities, temples, cults…" rows={2} value={field('religion')} onChange={setField('religion')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Economy</Label>
                        <Textarea placeholder="Trade goods, wealth level, what's bought/sold…" rows={2} value={field('economy')} onChange={setField('economy')} />
                      </div>
                      <SaveResetButtons onReset={() => setEditForm(f => ({ ...f, history: location.history || '', rumors: location.rumors || '', government: location.government || '', religion: location.religion || '', economy: location.economy || '' }))} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wind className="w-4 h-4" /> Environment</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Weather</Label>
                          <Textarea placeholder="Current weather conditions…" rows={2} value={field('weather')} onChange={setField('weather')} />
                        </div>
                        <div className="space-y-1">
                          <Label>Climate</Label>
                          <Textarea placeholder="Permanent climate type…" rows={2} value={field('climate')} onChange={setField('climate')} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Terrain</Label>
                        <Textarea placeholder="Forest, mountain, swamp, urban…" rows={2} value={field('terrain')} onChange={setField('terrain')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Plant Life</Label>
                        <Textarea placeholder="Notable flora…" rows={2} value={field('plant_life')} onChange={setField('plant_life')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Animal Life</Label>
                        <Textarea placeholder="Notable fauna…" rows={2} value={field('animal_life')} onChange={setField('animal_life')} />
                      </div>
                      <SaveResetButtons onReset={() => setEditForm(f => ({ ...f, weather: location.weather || '', climate: location.climate || '', terrain: location.terrain || '', plant_life: location.plant_life || '', animal_life: location.animal_life || '' }))} />
                    </CardContent>
                  </Card>
                </div>

                {/* Row 3: Adventure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sword className="w-4 h-4" /> Adventure</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label>Threats & Hazards</Label>
                        <Textarea placeholder="Hostile factions, dangerous creatures, traps…" rows={3} value={field('threats')} onChange={setField('threats')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Available Services</Label>
                        <Textarea placeholder="Inns, blacksmiths, healers, temples…" rows={3} value={field('available_services')} onChange={setField('available_services')} />
                      </div>
                      <div className="space-y-1">
                        <Label>Points of Interest</Label>
                        <Textarea placeholder="Named sub-locations worth noting…" rows={3} value={field('points_of_interest')} onChange={setField('points_of_interest')} />
                      </div>
                      <SaveResetButtons onReset={() => setEditForm(f => ({ ...f, threats: location.threats || '', available_services: location.available_services || '', points_of_interest: location.points_of_interest || '' }))} />
                    </CardContent>
                  </Card>
                </div>

                {/* Row 4: Hierarchy */}
                {(() => {
                  const locMap = Object.fromEntries(allLocations.map(l => [l.id, l]));
                  const childrenByParent = allLocations.filter(l => l.parent_location_id === parseInt(locationId));
                  const pinChildIds = locationListItem?.pin_child_ids ?? [];
                  const childrenByPin = pinChildIds
                    .map(id => locMap[id])
                    .filter(l => l && !childrenByParent.find(c => c.id === l.id));

                  const setHierarchyField = (key, value, clearKeys = []) => {
                    setEditForm(f => {
                      const next = { ...f, [key]: value };
                      for (const k of clearKeys) next[k] = k === 'parent_location_id' ? null : false;
                      return next;
                    });
                  };

                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <GitBranch className="w-4 h-4" /> Hierarchy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* Top Level */}
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="hier-toplevel"
                            className="w-4 h-4 mt-0.5"
                            checked={editForm.is_top_level || false}
                            onChange={(e) => setHierarchyField('is_top_level', e.target.checked, e.target.checked ? ['parent_location_id', 'is_unknown'] : [])}
                          />
                          <div>
                            <Label htmlFor="hier-toplevel" className="cursor-pointer font-medium">Set as Top-Level Location</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Makes this the root of the world hierarchy. Only one location can be top-level per campaign.</p>
                          </div>
                        </div>

                        {/* Parent Location */}
                        <div className={`space-y-1.5 ${editForm.is_top_level ? 'opacity-40 pointer-events-none' : ''}`}>
                          <Label>Parent Location</Label>
                          <select
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            value={editForm.parent_location_id ?? ''}
                            disabled={editForm.is_top_level || false}
                            onChange={(e) => setHierarchyField('parent_location_id', e.target.value ? parseInt(e.target.value) : null, e.target.value ? ['is_top_level'] : [])}
                          >
                            <option value="">— No parent —</option>
                            {allLocations
                              .filter(l => !l.is_unknown)
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                          </select>
                        </div>

                        {/* Unknown */}
                        <div className={`flex items-start gap-3 ${editForm.is_top_level ? 'opacity-40 pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            id="hier-unknown"
                            className="w-4 h-4 mt-0.5"
                            checked={editForm.is_unknown || false}
                            disabled={editForm.is_top_level || false}
                            onChange={(e) => setHierarchyField('is_unknown', e.target.checked, e.target.checked ? ['parent_location_id', 'is_top_level'] : [])}
                          />
                          <div>
                            <Label htmlFor="hier-unknown" className="cursor-pointer font-medium">Mark as Unknown Location</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">Players see this location but don't know where it fits geographically.</p>
                          </div>
                        </div>

                        <SaveResetButtons onReset={() => setEditForm(f => ({
                          ...f,
                          parent_location_id: location.parent_location_id ?? null,
                          is_top_level: location.is_top_level ?? false,
                          is_unknown: location.is_unknown ?? false,
                        }))} />

                        {/* Child locations (read-only) */}
                        {(childrenByParent.length > 0 || childrenByPin.length > 0) && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Child Locations</p>
                            <div className="space-y-1">
                              {childrenByParent.map(child => (
                                <div key={child.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => navigate(`/locations/${child.id}`)}>
                                  <Link className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="flex-1 truncate">{child.name}</span>
                                  <span className="text-xs text-muted-foreground">manually set</span>
                                </div>
                              ))}
                              {childrenByPin.map(child => (
                                <div key={child.id} className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer" onClick={() => navigate(`/locations/${child.id}`)}>
                                  <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="flex-1 truncate">{child.name}</span>
                                  <span className="text-xs text-muted-foreground">via map pin</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Row 5: Important NPCs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2"><UserCircle className="w-4 h-4" /> Important NPCs</CardTitle>
                      <Button size="sm" variant="outline" onClick={handleOpenAddNpc}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add NPC
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {locationNpcs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No NPCs linked to this location yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {locationNpcs.map(npc => (
                          <div key={npc.id} className="border rounded-md p-3 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{npc.name}</p>
                                <p className="text-xs text-muted-foreground">{npc.race}{npc.occupation ? ` · ${npc.occupation}` : ''}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!npc.is_visible_to_players && (
                                  <Badge variant="outline" className="text-xs gap-1"><EyeOff className="w-3 h-3" /> Hidden</Badge>
                                )}
                                <button onClick={() => handleRemoveNpc(npc.id)} className="text-muted-foreground hover:text-destructive" title="Remove NPC">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {npc.description && <p className="text-xs text-primary/80 italic">{npc.description}</p>}
                            {npc.summary && <p className="text-xs text-muted-foreground">{npc.summary}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ───── UPLOAD MAP DIALOG ───── */}
      <Dialog open={showUpload} onOpenChange={(open) => { setShowUpload(open); if (!open) setUploadError(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Map Name</Label>
              <Input placeholder="e.g. City Overview, Dungeon Level 1" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${uploadError ? 'border-destructive bg-destructive/5' : 'hover:border-primary'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadPreview ? (
                <img src={uploadPreview} alt="Preview" className="max-h-48 mx-auto rounded object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm">Click to select an image</p>
                  <p className="text-xs">JPEG, PNG, WebP — max {MAX_UPLOAD_MB} MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </div>
            {uploadError && <p className="text-sm text-destructive flex items-center gap-1.5"><X className="w-4 h-4 shrink-0" /> {uploadError}</p>}
            {uploadFile && !uploadError && <p className="text-xs text-muted-foreground truncate">{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button onClick={handleUploadMap} disabled={uploading || !uploadFile || !uploadName.trim() || !!uploadError}>
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── PIN DIALOG ───── */}
      <Dialog open={showPinDialog} onOpenChange={(open) => {
        setShowPinDialog(open);
        if (!open) { setEditingPin(null); setPendingPin(null); setShowNewLocInPin(false); setNewLocForm({ name: '', location_type: '', status: '' }); }
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingPin ? 'Edit Pin' : 'New Pin'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Label *</Label>
              <Input placeholder="e.g. Tavern, Boss Room, Hidden Door" value={pinForm.label} onChange={(e) => setPinForm(f => ({ ...f, label: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Details about this pin…" rows={3} value={pinForm.description} onChange={(e) => setPinForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Link to Location</Label>
                <button type="button" className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => { setShowNewLocInPin(v => !v); setNewLocForm({ name: '', location_type: '', status: '' }); }}>
                  <Plus className="w-3 h-3" />
                  {showNewLocInPin ? 'Cancel' : 'New location'}
                </button>
              </div>
              {showNewLocInPin ? (
                <div className="border rounded-md p-3 space-y-2 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground">Create &amp; link a new location</p>
                  <Input placeholder="Location name *" value={newLocForm.name} onChange={(e) => setNewLocForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Type (e.g. City)" value={newLocForm.location_type} onChange={(e) => setNewLocForm(f => ({ ...f, location_type: e.target.value }))} />
                    <Input placeholder="Status (e.g. Active)" value={newLocForm.status} onChange={(e) => setNewLocForm(f => ({ ...f, status: e.target.value }))} />
                  </div>
                  <Button size="sm" className="w-full" onClick={handleCreateLocInPin} disabled={creatingLoc || !newLocForm.name.trim()}>
                    {creatingLoc ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    {creatingLoc ? 'Creating…' : 'Create & Link'}
                  </Button>
                </div>
              ) : (
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={pinForm.linked_location_id} onChange={(e) => setPinForm(f => ({ ...f, linked_location_id: e.target.value }))}>
                  <option value="">— None —</option>
                  {allLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              )}
              <p className="text-xs text-muted-foreground">Players can click this pin to jump to that location.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pin-visible" checked={pinForm.is_visible_to_players} onChange={(e) => setPinForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} className="w-4 h-4" />
              <Label htmlFor="pin-visible" className="cursor-pointer">Visible to players</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPinDialog(false); setEditingPin(null); setPendingPin(null); }}>Cancel</Button>
            <Button onClick={editingPin ? handleUpdatePin : handleSavePin} disabled={savingPin || !pinForm.label.trim()}>
              {savingPin ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingPin ? 'Save Changes' : 'Add Pin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───── ADD NPC DIALOG ───── */}
      <Dialog open={showAddNpc} onOpenChange={(open) => { setShowAddNpc(open); if (!open) setNpcForm({ npc_id: '', description: '' }); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add NPC to Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>NPC *</Label>
              {loadingNpcs ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading NPCs…
                </div>
              ) : campaignNpcs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No unlinked NPCs available. Create NPCs in the campaign first.</p>
              ) : (
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={npcForm.npc_id} onChange={(e) => setNpcForm(f => ({ ...f, npc_id: e.target.value }))}>
                  <option value="">— Select an NPC —</option>
                  {campaignNpcs.map(npc => (
                    <option key={npc.id} value={npc.id}>{npc.name} ({npc.race}{npc.occupation ? `, ${npc.occupation}` : ''})</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role at this location <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea placeholder="e.g. Guards the east gate, Runs the local tavern…" rows={2} value={npcForm.description} onChange={(e) => setNpcForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNpc(false)}>Cancel</Button>
            <Button onClick={handleAddNpc} disabled={addingNpc || !npcForm.npc_id}>
              {addingNpc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {addingNpc ? 'Adding…' : 'Add NPC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
