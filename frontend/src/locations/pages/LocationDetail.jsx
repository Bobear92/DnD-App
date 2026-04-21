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
  Link, Users, ExternalLink
} from 'lucide-react';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.25;

export default function LocationDetail() {
  const navigate = useNavigate();
  const { locationId } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
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

  // Inline new-location creation inside the pin dialog
  const [showNewLocInPin, setShowNewLocInPin] = useState(false);
  const [newLocForm, setNewLocForm] = useState({ name: '', location_type: '', status: '' });
  const [creatingLoc, setCreatingLoc] = useState(false);

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
      const [loc, mapList, allLocs] = await Promise.all([
        locationService.getLocation(campaignId, locId),
        locationService.getMaps(campaignId, locId),
        locationService.getLocations(campaignId),
      ]);
      setLocation(loc);
      setEditForm({
        name: loc.name,
        description: loc.description || '',
        gm_notes: loc.gm_notes || '',
        location_type: loc.location_type || '',
        status: loc.status || '',
        is_visible_to_players: loc.is_visible_to_players,
      });
      setMaps(mapList);
      setAllLocations(allLocs.filter(l => l.id !== parseInt(locId)));
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
  const [uploadError, setUploadError] = useState('');

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

  // Zoom controls
  const adjustZoom = (delta) => setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100)));
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    adjustZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  }, []);

  // Click on the image wrapper to place a pin
  const handleMapClick = useCallback((e) => {
    // Clicking the map background closes any open pin tooltip
    setOpenPinId(null);
    if (!addingPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPin({ x_percent: Math.max(0, Math.min(100, x)), y_percent: Math.max(0, Math.min(100, y)) });
    setPinForm({ label: '', description: '', is_visible_to_players: false, linked_location_id: '' });
    setShowPinDialog(true);
  }, [addingPin]);

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

  // Visibility filters for player view
  const visibleMaps = playerView ? maps.filter(m => m.is_visible_to_players) : maps;
  const visiblePins = playerView ? pins.filter(p => p.is_visible_to_players) : pins;

  // When switching to player view, auto-select the first visible map if the
  // current selection isn't visible to players
  useEffect(() => {
    if (!campaign || !visibleMaps.length) return;
    const currentVisible = visibleMaps.some(m => m.id === selectedMap?.id);
    if (!currentVisible) {
      selectMap(campaign.id, locationId, visibleMaps[0]);
    }
  }, [playerView]); // eslint-disable-line react-hooks/exhaustive-deps

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
            Previewing as player — only visible maps and pins are shown. GM notes are hidden.
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
                    {/* Map toolbar */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-sm truncate flex-1">{selectedMap.name}</h3>

                      {/* Zoom controls */}
                      <div className="flex items-center gap-1 border rounded-md">
                        <button
                          className="px-2 py-1 text-sm hover:bg-muted disabled:opacity-40"
                          onClick={() => adjustZoom(-ZOOM_STEP)}
                          disabled={zoom <= ZOOM_MIN}
                          title="Zoom out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="px-2 py-0.5 text-xs font-mono min-w-[3rem] text-center hover:bg-muted"
                          onClick={() => setZoom(1)}
                          title="Reset zoom"
                        >
                          {Math.round(zoom * 100)}%
                        </button>
                        <button
                          className="px-2 py-1 text-sm hover:bg-muted disabled:opacity-40"
                          onClick={() => adjustZoom(ZOOM_STEP)}
                          disabled={zoom >= ZOOM_MAX}
                          title="Zoom in"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isGm && !playerView && (
                        <Button
                          variant={addingPin ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAddingPin(a => !a)}
                        >
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

                    {/* Scrollable map container — dark background */}
                    <div
                      className={`flex-1 overflow-auto rounded-lg border bg-zinc-900 ${addingPin ? 'cursor-crosshair' : ''}`}
                      onWheel={handleWheel}
                    >
                      <div className="min-h-full flex items-center justify-center p-3">
                        {/* Image wrapper — pins anchored here */}
                        <div
                          className="relative"
                          style={{ width: `${zoom * 100}%`, minWidth: '200px' }}
                          onClick={handleMapClick}
                        >
                          <img
                            src={mapImageUrl(selectedMap.image_path)}
                            alt={selectedMap.name}
                            className="w-full h-auto block select-none"
                            draggable={false}
                          />
                          {/* Pins */}
                          {visiblePins.map((pin) => {
                            const linkedLoc = allLocations.find(l => l.id === pin.linked_location_id);
                            const isOpen = openPinId === pin.id;
                            return (
                              <div
                                key={pin.id}
                                className="absolute"
                                style={{
                                  left: `${pin.x_percent}%`,
                                  top: `${pin.y_percent}%`,
                                  transform: 'translate(-50%, -100%)',
                                  zIndex: isOpen ? 20 : 10,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenPinId(isOpen ? null : pin.id);
                                }}
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

                                {/* Click-toggled tooltip */}
                                {isOpen && (
                                  <div
                                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="bg-popover border rounded-md shadow-lg p-2.5 min-w-[190px]">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-medium text-xs">{pin.label}</p>
                                        <button
                                          onClick={() => setOpenPinId(null)}
                                          className="text-muted-foreground hover:text-foreground shrink-0 -mt-0.5"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      {pin.description && <p className="text-xs text-muted-foreground mb-2">{pin.description}</p>}
                                      {linkedLoc && (
                                        <button
                                          onClick={() => navigate(`/locations/${linkedLoc.id}`)}
                                          className="w-full flex items-center gap-1 text-xs py-1 px-2 rounded bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 mb-1"
                                        >
                                          <ExternalLink className="w-3 h-3" /> Go to {linkedLoc.name}
                                        </button>
                                      )}
                                      {isGm && !playerView && (
                                        <div className="flex gap-1 mt-1">
                                          <button
                                            onClick={(e) => openEditPin(pin, e)}
                                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border hover:bg-muted"
                                          >
                                            <Pencil className="w-3 h-3" /> Edit
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }}
                                            className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded border hover:bg-destructive hover:text-destructive-foreground"
                                          >
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

                    {/* Pin badges below map */}
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
                          <Button variant="outline" size="sm" className="mt-3"
                            onClick={() => { setShowUpload(true); setUploadName(''); setUploadFile(null); setUploadPreview(null); }}>
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
              /* Player view — read only */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Type</p>
                        <p>{location.location_type || '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Status</p>
                        <p>{location.status || '—'}</p>
                      </div>
                    </div>
                    {location.description && (
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Description</p>
                        <p className="whitespace-pre-wrap">{location.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* GM view — always editable */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Type</Label>
                        <Input
                          placeholder="e.g. City, Dungeon, Region"
                          value={editForm.location_type || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, location_type: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Input
                          placeholder="e.g. Active, Ruined, Hidden"
                          value={editForm.status || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Description <span className="text-muted-foreground font-normal">(player-visible)</span></Label>
                      <Textarea
                        placeholder="What players see about this location…"
                        rows={4}
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ev-visible"
                        checked={editForm.is_visible_to_players || false}
                        onChange={(e) => setEditForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="ev-visible" className="cursor-pointer">Visible to players</Label>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditForm({
                          name: location.name,
                          description: location.description || '',
                          gm_notes: location.gm_notes || '',
                          location_type: location.location_type || '',
                          status: location.status || '',
                          is_visible_to_players: location.is_visible_to_players,
                        })}
                      >
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">GM Notes</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Private notes only you can see…"
                      rows={8}
                      value={editForm.gm_notes || ''}
                      onChange={(e) => setEditForm(f => ({ ...f, gm_notes: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditForm(f => ({ ...f, gm_notes: location.gm_notes || '' }))}
                      >
                        Reset
                      </Button>
                    </div>
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
              <Input
                placeholder="e.g. City Overview, Dungeon Level 1"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {uploadError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <X className="w-4 h-4 shrink-0" /> {uploadError}
              </p>
            )}
            {uploadFile && !uploadError && (
              <p className="text-xs text-muted-foreground truncate">{uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</p>
            )}
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
              <Input
                placeholder="e.g. Tavern, Boss Room, Hidden Door"
                value={pinForm.label}
                onChange={(e) => setPinForm(f => ({ ...f, label: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Details about this pin…"
                rows={3}
                value={pinForm.description}
                onChange={(e) => setPinForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Link to Location</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={() => { setShowNewLocInPin(v => !v); setNewLocForm({ name: '', location_type: '', status: '' }); }}
                >
                  <Plus className="w-3 h-3" />
                  {showNewLocInPin ? 'Cancel' : 'New location'}
                </button>
              </div>

              {showNewLocInPin ? (
                <div className="border rounded-md p-3 space-y-2 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground">Create &amp; link a new location</p>
                  <Input
                    placeholder="Location name *"
                    value={newLocForm.name}
                    onChange={(e) => setNewLocForm(f => ({ ...f, name: e.target.value }))}
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Type (e.g. City)"
                      value={newLocForm.location_type}
                      onChange={(e) => setNewLocForm(f => ({ ...f, location_type: e.target.value }))}
                    />
                    <Input
                      placeholder="Status (e.g. Active)"
                      value={newLocForm.status}
                      onChange={(e) => setNewLocForm(f => ({ ...f, status: e.target.value }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleCreateLocInPin}
                    disabled={creatingLoc || !newLocForm.name.trim()}
                  >
                    {creatingLoc ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                    {creatingLoc ? 'Creating…' : 'Create & Link'}
                  </Button>
                </div>
              ) : (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={pinForm.linked_location_id}
                  onChange={(e) => setPinForm(f => ({ ...f, linked_location_id: e.target.value }))}
                >
                  <option value="">— None —</option>
                  {allLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground">Players can click this pin to jump to that location.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin-visible"
                checked={pinForm.is_visible_to_players}
                onChange={(e) => setPinForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="pin-visible" className="cursor-pointer">Visible to players</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPinDialog(false); setEditingPin(null); setPendingPin(null); }}>
              Cancel
            </Button>
            <Button
              onClick={editingPin ? handleUpdatePin : handleSavePin}
              disabled={savingPin || !pinForm.label.trim()}
            >
              {savingPin ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingPin ? 'Save Changes' : 'Add Pin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
