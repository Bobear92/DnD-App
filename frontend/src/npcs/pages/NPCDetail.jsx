import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import { useCampaign } from '../../campaigns/CampaignContext';
import npcService, { mapNpcImageUrl } from '../npcService';
import locationService from '../../locations/locationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Eye, EyeOff, Upload, Plus, X, Loader2,
  UserCircle, Trash2, MapPin, Music, Heart, BookOpen,
  Users, ExternalLink, Shield, Scroll,
} from 'lucide-react';
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

function ReadOnlyField({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

const toEditForm = (npc) => ({
  name: npc.name || '',
  race: npc.race || '',
  occupation: npc.occupation || '',
  alignment: npc.alignment || '',
  status: npc.status || 'alive',
  is_visible_to_players: npc.is_visible_to_players ?? false,
  age: npc.age || '',
  gender: npc.gender || '',
  height: npc.height || '',
  weight: npc.weight || '',
  appearance: npc.appearance || '',
  voice: npc.voice || '',
  personality_traits: npc.personality_traits || '',
  ideals: npc.ideals || '',
  bonds: npc.bonds || '',
  flaws: npc.flaws || '',
  languages: Array.isArray(npc.languages) ? npc.languages : [],
  summary: npc.summary || '',
  description: npc.description || '',
  backstory: npc.backstory || '',
  gm_notes: npc.gm_notes || '',
  last_known_location_id: npc.last_known_location_id ?? '',
  last_seen_notes: npc.last_seen_notes || '',
  theme_music_url: npc.theme_music_url || '',
  stats: npc.stats ? JSON.stringify(npc.stats, null, 2) : '',
  campaign_id: npc.campaign_id,
});

function sectionFields(form, keys) {
  return Object.fromEntries(keys.map(k => [k, form[k]]));
}

const CORE_KEYS = ['name', 'race', 'occupation', 'alignment', 'status', 'is_visible_to_players'];
const PHYSICAL_KEYS = ['age', 'gender', 'height', 'weight', 'appearance'];
const PERSONALITY_KEYS = ['voice', 'personality_traits', 'ideals', 'bonds', 'flaws', 'languages'];
const NARRATIVE_KEYS = ['summary', 'description', 'backstory'];
const NOTES_KEYS = ['gm_notes'];
const LOCATION_KEYS = ['last_known_location_id', 'last_seen_notes', 'theme_music_url'];

function isDirty(editForm, npc, keys) {
  return keys.some(k => {
    const a = editForm[k];
    const b = npc[k] ?? (Array.isArray(editForm[k]) ? [] : '');
    if (Array.isArray(a)) return JSON.stringify(a) !== JSON.stringify(b);
    return String(a ?? '') !== String(b ?? '');
  });
}

export default function NPCDetail() {
  const navigate = useNavigate();
  const { campaignId, npcId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [npc, setNpc] = useState(null);
  const [allNpcs, setAllNpcs] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [campaignMembers, setCampaignMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [playerRelationships, setPlayerRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerView, setPlayerView] = useState(false);

  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Portrait
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // NPC relationship dialog
  const [showAddRel, setShowAddRel] = useState(false);
  const [relForm, setRelForm] = useState({ related_npc_id: '', relationship_type: '', description: '' });
  const [addingRel, setAddingRel] = useState(false);
  const [deletingRelId, setDeletingRelId] = useState(null);

  // Player relationship dialog
  const [showAddPlayerRel, setShowAddPlayerRel] = useState(false);
  const [playerRelForm, setPlayerRelForm] = useState({ user_id: '', relationship_type: '', description: '' });
  const [addingPlayerRel, setAddingPlayerRel] = useState(false);
  const [deletingPlayerRelId, setDeletingPlayerRelId] = useState(null);

  // Language tag input
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    if (!campaignId || !npcId) { navigate('/campaigns'); return; }
    loadAll();
  }, [npcId, campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [npcData, npcsData, locsData, relsData, playerRelsData] = await Promise.all([
        npcService.getNpc(npcId),
        npcService.getNpcs(campaignId),
        locationService.getLocations(campaignId),
        npcService.getRelationships(npcId),
        isGm ? npcService.getPlayerRelationships(npcId) : Promise.resolve([]),
      ]);
      setNpc(npcData);
      setEditForm(toEditForm(npcData));
      setAllNpcs(npcsData.filter(n => n.id !== Number(npcId)));
      setAllLocations(locsData);
      setRelationships(relsData);
      setPlayerRelationships(playerRelsData);

      if (isGm) {
        try {
          const campaignData = await npcService.getCampaignDetails(campaignId);
          setCampaignMembers(campaignData.members || []);
        } catch {}
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load NPC');
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => setEditForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      let statsValue = null;
      if (editForm.stats && editForm.stats.trim()) {
        try { statsValue = JSON.parse(editForm.stats); } catch { statsValue = null; }
      }
      const payload = {
        ...editForm,
        last_known_location_id: editForm.last_known_location_id || null,
        stats: statsValue,
      };
      const updated = await npcService.updateNpc(npcId, payload);
      setNpc(updated);
      setEditForm(toEditForm(updated));
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setEditForm(toEditForm(npc));

  // Portrait handlers
  const handlePortraitFile = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const updated = await npcService.uploadImage(npcId, file);
      setNpc(updated);
      setEditForm(f => ({ ...f }));
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePortrait = async () => {
    setUploading(true);
    setUploadError('');
    try {
      const updated = await npcService.deleteImage(npcId);
      setNpc(updated);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to remove image.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePortraitFile(file);
  }, [npcId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Language tags
  const addLanguage = () => {
    const lang = langInput.trim();
    if (lang && !editForm.languages.includes(lang)) {
      setField('languages', [...editForm.languages, lang]);
    }
    setLangInput('');
  };
  const removeLanguage = (lang) => setField('languages', editForm.languages.filter(l => l !== lang));

  // NPC relationships
  const handleAddRelationship = async () => {
    if (!relForm.related_npc_id || !relForm.relationship_type.trim()) return;
    setAddingRel(true);
    try {
      const created = await npcService.createRelationship(npcId, {
        npc_b_id: Number(relForm.related_npc_id),
        relationship_type: relForm.relationship_type,
        description: relForm.description,
      });
      setRelationships(prev => [...prev, created]);
      setShowAddRel(false);
      setRelForm({ related_npc_id: '', relationship_type: '', description: '' });
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to add relationship.');
    } finally {
      setAddingRel(false);
    }
  };

  const handleDeleteRelationship = async (relId) => {
    setDeletingRelId(relId);
    try {
      await npcService.deleteRelationship(npcId, relId);
      setRelationships(prev => prev.filter(r => r.id !== relId));
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to delete relationship.');
    } finally {
      setDeletingRelId(null);
    }
  };

  // Player relationships
  const handleAddPlayerRelationship = async () => {
    if (!playerRelForm.user_id || !playerRelForm.relationship_type.trim()) return;
    setAddingPlayerRel(true);
    try {
      const created = await npcService.createPlayerRelationship(npcId, {
        user_id: Number(playerRelForm.user_id),
        campaign_id: Number(campaignId),
        relationship_type: playerRelForm.relationship_type,
        description: playerRelForm.description,
      });
      setPlayerRelationships(prev => [...prev, created]);
      setShowAddPlayerRel(false);
      setPlayerRelForm({ user_id: '', relationship_type: '', description: '' });
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to add player relationship.');
    } finally {
      setAddingPlayerRel(false);
    }
  };

  const handleDeletePlayerRelationship = async (relId) => {
    setDeletingPlayerRelId(relId);
    try {
      await npcService.deletePlayerRelationship(npcId, relId);
      setPlayerRelationships(prev => prev.filter(r => r.id !== relId));
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to delete player relationship.');
    } finally {
      setDeletingPlayerRelId(null);
    }
  };

  const npcMap = Object.fromEntries(allNpcs.map(n => [n.id, n]));
  // also include current npc in lookup
  const fullNpcMap = npc ? { ...npcMap, [npc.id]: npc } : npcMap;

  const getOtherNpcId = (rel) =>
    rel.npc_a_id === Number(npcId) ? rel.npc_b_id : rel.npc_a_id;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground">Loading NPC…</span>
        </div>
      </MainLayout>
    );
  }

  if (error && !npc) {
    return (
      <MainLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate(`/campaigns/${campaignId}/npcs`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to NPCs
          </Button>
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
        </div>
      </MainLayout>
    );
  }

  const imgUrl = mapNpcImageUrl(npc?.image_path);
  const viewOnly = playerView || !isGm;

  // Per-section save/reset controls — rendered as a function call, not a component,
  // so React doesn't treat it as a new component type on every render.
  const renderSectionActions = (keys) => {
    if (viewOnly || !isDirty(editForm, npc, keys)) return null;
    return (
      <div className="flex gap-2 mt-4">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Saving…</> : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset} disabled={saving}>Reset</Button>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${campaignId}/npcs`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> NPCs
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{npc?.name}</h1>
                <StatusBadge status={npc?.status} />
              </div>
              {(npc?.race || npc?.occupation) && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[npc.race, npc.occupation].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
          {isGm && (
            <Button
              variant={playerView ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerView(v => !v)}
            >
              <Users className="w-4 h-4 mr-2" />
              {playerView ? 'Exit Player View' : 'Player View'}
            </Button>
          )}
        </div>

        {saveError && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{saveError}</div>
        )}

        {/* Portrait row */}
        <div className="flex gap-6 mb-6">
          {/* Portrait */}
          <div className="shrink-0">
            <div
              className={cn(
                'w-36 h-44 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center bg-muted relative transition-colors',
                isGm && !playerView && 'cursor-pointer hover:border-primary',
                isDragging && 'border-primary bg-primary/5',
              )}
              onClick={() => isGm && !playerView && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); if (isGm && !playerView) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={isGm && !playerView ? onDrop : undefined}
            >
              {imgUrl ? (
                <img src={imgUrl} alt={npc.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground p-2 text-center">
                  <UserCircle className="w-10 h-10 opacity-40" />
                  {isGm && !playerView && <span className="text-xs">Click or drop</span>}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            {isGm && !playerView && (
              <div className="mt-2 flex flex-col gap-1">
                <button
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3" />
                  {imgUrl ? 'Change portrait' : 'Upload portrait'}
                </button>
                {imgUrl && (
                  <button
                    className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                    onClick={handleRemovePortrait}
                    disabled={uploading}
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
                {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePortraitFile(e.target.files?.[0])}
            />
          </div>

          {/* Quick core info (read-only in player view) */}
          <div className="flex-1 min-w-0">
            {viewOnly ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {npc.race && <ReadOnlyField label="Race" value={npc.race} />}
                {npc.occupation && <ReadOnlyField label="Occupation" value={npc.occupation} />}
                {npc.alignment && <ReadOnlyField label="Alignment" value={npc.alignment} />}
                {npc.gender && <ReadOnlyField label="Gender" value={npc.gender} />}
                {npc.age && <ReadOnlyField label="Age" value={npc.age} />}
                {npc.theme_music_url && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Theme Music</p>
                    <a href={npc.theme_music_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1">
                      <Music className="w-3.5 h-3.5" /> Listen
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={editForm.name || ''} onChange={e => setField('name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={editForm.status || 'alive'} onValueChange={v => setField('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alive">Alive</SelectItem>
                        <SelectItem value="dead">Dead</SelectItem>
                        <SelectItem value="missing">Missing</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Race</Label>
                    <Input value={editForm.race || ''} onChange={e => setField('race', e.target.value)} placeholder="e.g. Elf" />
                  </div>
                  <div className="space-y-1">
                    <Label>Occupation</Label>
                    <Input value={editForm.occupation || ''} onChange={e => setField('occupation', e.target.value)} placeholder="e.g. Innkeeper" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Alignment</Label>
                    <Input value={editForm.alignment || ''} onChange={e => setField('alignment', e.target.value)} placeholder="e.g. Neutral Good" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="npc-vis"
                      checked={editForm.is_visible_to_players ?? false}
                      onChange={e => setField('is_visible_to_players', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="npc-vis" className="cursor-pointer">Visible to players</Label>
                  </div>
                </div>
                {renderSectionActions(CORE_KEYS)}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            {isGm && <TabsTrigger value="player-rels">Player Relationships</TabsTrigger>}
          </TabsList>

          {/* ── Info Tab ── */}
          <TabsContent value="info" className="space-y-4">

            {/* Physical */}
            {(viewOnly
              ? (npc.age || npc.gender || npc.height || npc.weight || npc.appearance)
              : true) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCircle className="w-4 h-4" /> Physical
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewOnly ? (
                    <div className="grid grid-cols-2 gap-3">
                      {npc.gender && <ReadOnlyField label="Gender" value={npc.gender} />}
                      {npc.age && <ReadOnlyField label="Age" value={npc.age} />}
                      {npc.height && <ReadOnlyField label="Height" value={npc.height} />}
                      {npc.weight && <ReadOnlyField label="Weight" value={npc.weight} />}
                      {npc.appearance && <div className="col-span-2"><ReadOnlyField label="Appearance" value={npc.appearance} /></div>}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Gender</Label>
                          <Input value={editForm.gender || ''} onChange={e => setField('gender', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Age</Label>
                          <Input value={editForm.age || ''} onChange={e => setField('age', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Height</Label>
                          <Input value={editForm.height || ''} onChange={e => setField('height', e.target.value)} placeholder="e.g. 5'10&quot;" />
                        </div>
                        <div className="space-y-1">
                          <Label>Weight</Label>
                          <Input value={editForm.weight || ''} onChange={e => setField('weight', e.target.value)} placeholder="e.g. 160 lbs" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Appearance</Label>
                        <Textarea
                          rows={3}
                          value={editForm.appearance || ''}
                          onChange={e => setField('appearance', e.target.value)}
                          placeholder="Physical description…"
                        />
                      </div>
                      {renderSectionActions(PHYSICAL_KEYS)}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Personality */}
            {(viewOnly
              ? (npc.voice || npc.personality_traits || npc.ideals || npc.bonds || npc.flaws || (npc.languages && npc.languages.length > 0))
              : true) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Personality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewOnly ? (
                    <div className="space-y-3">
                      {npc.voice && <ReadOnlyField label="Voice & Mannerisms" value={npc.voice} />}
                      {npc.personality_traits && <ReadOnlyField label="Personality Traits" value={npc.personality_traits} />}
                      {npc.ideals && <ReadOnlyField label="Ideals" value={npc.ideals} />}
                      {npc.bonds && <ReadOnlyField label="Bonds" value={npc.bonds} />}
                      {npc.flaws && <ReadOnlyField label="Flaws" value={npc.flaws} />}
                      {npc.languages && npc.languages.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Languages</p>
                          <div className="flex flex-wrap gap-1.5">
                            {npc.languages.map(l => (
                              <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label>Voice & Mannerisms</Label>
                        <Input value={editForm.voice || ''} onChange={e => setField('voice', e.target.value)} placeholder="e.g. Deep, gravelly voice; speaks in riddles" />
                      </div>
                      <div className="space-y-1">
                        <Label>Personality Traits</Label>
                        <Textarea rows={2} value={editForm.personality_traits || ''} onChange={e => setField('personality_traits', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Ideals</Label>
                          <Textarea rows={2} value={editForm.ideals || ''} onChange={e => setField('ideals', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Bonds</Label>
                          <Textarea rows={2} value={editForm.bonds || ''} onChange={e => setField('bonds', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Flaws</Label>
                        <Textarea rows={2} value={editForm.flaws || ''} onChange={e => setField('flaws', e.target.value)} />
                      </div>
                      {/* Language tags */}
                      <div className="space-y-1.5">
                        <Label>Languages</Label>
                        {editForm.languages && editForm.languages.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {editForm.languages.map(l => (
                              <span key={l} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-secondary rounded-full">
                                {l}
                                <button onClick={() => removeLanguage(l)} className="text-muted-foreground hover:text-foreground">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add language…"
                            value={langInput}
                            onChange={e => setLangInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLanguage(); } }}
                            className="flex-1"
                          />
                          <Button size="sm" variant="outline" onClick={addLanguage} disabled={!langInput.trim()}>Add</Button>
                        </div>
                      </div>
                      {renderSectionActions(PERSONALITY_KEYS)}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Narrative — player-visible */}
            {(viewOnly
              ? (npc.summary || npc.description || npc.backstory)
              : true) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Narrative
                    {!viewOnly && <Badge variant="outline" className="text-xs ml-auto font-normal">Player visible</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewOnly ? (
                    <div className="space-y-3">
                      {npc.summary && <ReadOnlyField label="Summary" value={npc.summary} />}
                      {npc.description && <ReadOnlyField label="Description" value={npc.description} />}
                      {npc.backstory && <ReadOnlyField label="Backstory" value={npc.backstory} />}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label>Summary</Label>
                        <Textarea rows={2} value={editForm.summary || ''} onChange={e => setField('summary', e.target.value)} placeholder="Short blurb shown on NPC cards…" />
                      </div>
                      <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea rows={3} value={editForm.description || ''} onChange={e => setField('description', e.target.value)} placeholder="Detailed description…" />
                      </div>
                      <div className="space-y-1">
                        <Label>Backstory</Label>
                        <Textarea rows={4} value={editForm.backstory || ''} onChange={e => setField('backstory', e.target.value)} placeholder="History and background…" />
                      </div>
                      {renderSectionActions(NARRATIVE_KEYS)}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* GM Notes — GM only, never in player view */}
            {isGm && !playerView && (
              <Card className="border-amber-500/30 bg-amber-50/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scroll className="w-4 h-4" /> GM Notes
                    <Badge variant="outline" className="text-xs ml-auto font-normal text-amber-600 border-amber-500/50">Private</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={4}
                    value={editForm.gm_notes || ''}
                    onChange={e => setField('gm_notes', e.target.value)}
                    placeholder="Private notes only you can see…"
                  />
                  {renderSectionActions(NOTES_KEYS)}
                </CardContent>
              </Card>
            )}

            {/* Location & Media */}
            {(viewOnly
              ? (npc.last_known_location_id || npc.theme_music_url)
              : true) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Location & Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewOnly ? (
                    <div className="space-y-3">
                      {npc.last_known_location_id && (() => {
                        const loc = allLocations.find(l => l.id === npc.last_known_location_id);
                        return loc ? (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Last Known Location</p>
                            <button
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                              onClick={() => navigate(`/campaigns/${campaignId}/locations/${loc.id}`)}
                            >
                              <MapPin className="w-3.5 h-3.5" /> {loc.name}
                            </button>
                            {npc.last_seen_notes && <p className="text-xs text-muted-foreground mt-1">{npc.last_seen_notes}</p>}
                          </div>
                        ) : null;
                      })()}
                      {npc.theme_music_url && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Theme Music</p>
                          <a href={npc.theme_music_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1">
                            <Music className="w-3.5 h-3.5" /> Listen <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label>Last Known Location</Label>
                        <Select
                          value={String(editForm.last_known_location_id || '__none__')}
                          onValueChange={v => setField('last_known_location_id', v === '__none__' ? '' : v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="None set" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {allLocations.map(loc => (
                              <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Last Seen Notes</Label>
                        <Input
                          value={editForm.last_seen_notes || ''}
                          onChange={e => setField('last_seen_notes', e.target.value)}
                          placeholder="e.g. Spotted near the docks, heading east…"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Theme Music URL</Label>
                        <Input
                          value={editForm.theme_music_url || ''}
                          onChange={e => setField('theme_music_url', e.target.value)}
                          placeholder="https://…"
                        />
                      </div>
                      {renderSectionActions(LOCATION_KEYS)}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Combat Stats — GM only */}
            {isGm && !playerView && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Combat Stats
                    <Badge variant="outline" className="text-xs ml-auto font-normal text-amber-600 border-amber-500/50">Private</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={6}
                    value={editForm.stats || ''}
                    onChange={e => setField('stats', e.target.value)}
                    placeholder={'{\n  "AC": 15,\n  "HP": 45,\n  "CR": "2"\n}'}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Freeform JSON — any structure you like.</p>
                  {renderSectionActions(['stats'])}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Relationships Tab ── */}
          <TabsContent value="relationships">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">NPC Relationships</h3>
                {isGm && !playerView && (
                  <Button size="sm" onClick={() => setShowAddRel(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Relationship
                  </Button>
                )}
              </div>

              {relationships.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <Users className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No NPC relationships recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {relationships.map(rel => {
                    const otherId = getOtherNpcId(rel);
                    const other = fullNpcMap[otherId];
                    return (
                      <Card key={rel.id}>
                        <CardContent className="p-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <button
                                className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                                onClick={() => navigate(`/campaigns/${campaignId}/npcs/${otherId}`)}
                              >
                                {other?.name || `NPC #${otherId}`}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                              <Badge variant="secondary" className="text-xs">{rel.relationship_type}</Badge>
                            </div>
                            {rel.description && <p className="text-xs text-muted-foreground">{rel.description}</p>}
                          </div>
                          {isGm && !playerView && (
                            <button
                              onClick={() => handleDeleteRelationship(rel.id)}
                              disabled={deletingRelId === rel.id}
                              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              {deletingRelId === rel.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Player Relationships Tab (GM only) ── */}
          {isGm && (
            <TabsContent value="player-rels">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Player Relationships</h3>
                  {!playerView && (
                    <Button size="sm" onClick={() => setShowAddPlayerRel(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Relationship
                    </Button>
                  )}
                </div>

                {playerRelationships.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No player relationships recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playerRelationships.map(rel => {
                      const member = campaignMembers.find(m => m.user_id === rel.user_id || m.user?.id === rel.user_id);
                      const username = member?.user?.username || rel.user?.username || `User #${rel.user_id}`;
                      return (
                        <Card key={rel.id}>
                          <CardContent className="p-3 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm">{username}</span>
                                <Badge variant="secondary" className="text-xs">{rel.relationship_type}</Badge>
                              </div>
                              {rel.description && <p className="text-xs text-muted-foreground">{rel.description}</p>}
                            </div>
                            {!playerView && (
                              <button
                                onClick={() => handleDeletePlayerRelationship(rel.id)}
                                disabled={deletingPlayerRelId === rel.id}
                                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                {deletingPlayerRelId === rel.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Add NPC Relationship Dialog */}
        <Dialog open={showAddRel} onOpenChange={setShowAddRel}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add NPC Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Related NPC *</Label>
                <Select value={relForm.related_npc_id} onValueChange={v => setRelForm(f => ({ ...f, related_npc_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an NPC…" />
                  </SelectTrigger>
                  <SelectContent>
                    {allNpcs.map(n => (
                      <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Relationship Type *</Label>
                <Input
                  placeholder="e.g. Ally, Rival, Family, Employer"
                  value={relForm.relationship_type}
                  onChange={e => setRelForm(f => ({ ...f, relationship_type: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Additional context…"
                  value={relForm.description}
                  onChange={e => setRelForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddRel(false)}>Cancel</Button>
              <Button
                onClick={handleAddRelationship}
                disabled={addingRel || !relForm.related_npc_id || !relForm.relationship_type.trim()}
              >
                {addingRel ? 'Adding…' : 'Add Relationship'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Player Relationship Dialog */}
        <Dialog open={showAddPlayerRel} onOpenChange={setShowAddPlayerRel}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Player Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Player *</Label>
                <Select value={playerRelForm.user_id} onValueChange={v => setPlayerRelForm(f => ({ ...f, user_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player…" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignMembers
                      .filter(m => m.role === 'player')
                      .map(m => (
                        <SelectItem key={m.user_id || m.user?.id} value={String(m.user_id || m.user?.id)}>
                          {m.user?.username || `Player #${m.user_id}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Relationship Type *</Label>
                <Input
                  placeholder="e.g. Ally, Hostile, Neutral, Mentor"
                  value={playerRelForm.relationship_type}
                  onChange={e => setPlayerRelForm(f => ({ ...f, relationship_type: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Additional context…"
                  value={playerRelForm.description}
                  onChange={e => setPlayerRelForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPlayerRel(false)}>Cancel</Button>
              <Button
                onClick={handleAddPlayerRelationship}
                disabled={addingPlayerRel || !playerRelForm.user_id || !playerRelForm.relationship_type.trim()}
              >
                {addingPlayerRel ? 'Adding…' : 'Add Relationship'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
}
