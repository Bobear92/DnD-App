import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import RichTextEditor from '../components/RichTextEditor';
import { useCampaign } from '../../campaigns/CampaignContext';
import sessionService, { mapSessionImageUrl } from '../sessionService';
import npcService from '../../npcs/npcService';
import locationService from '../../locations/locationService';
import settingsService from '../../settings/settingsService';
import characterService from '../../characters/characterService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Eye, EyeOff, Save, RotateCcw, Loader2,
  Users, Drama, MapPin, Clock, Music, X, Plus,
  Calendar, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BACKEND = 'http://localhost:8000';

// Returns { prefix: string|null, visibleEras: EraDate[] }
// Uses month_name from era_dates (backend-computed) so player-hidden eras don't leak month names.
function buildSessionDate(session, eraDates, playerView, calendarMonths) {
  const visibleEras = playerView
    ? (eraDates || []).filter(ed => ed.is_visible_to_players)
    : (eraDates || []);

  const { day, month_order, end_day, end_month_order } = session;

  // Prefer backend-computed month_name; fall back to calendarMonths lookup
  const lookupMonth = (order) =>
    calendarMonths.find(m => m.order_index === order)?.name ?? (order ? `Month ${order}` : null);
  const startMonthName = visibleEras[0]?.month_name ?? lookupMonth(month_order);
  const endMonthName = (end_month_order && end_month_order !== month_order)
    ? lookupMonth(end_month_order)
    : null;

  let prefix = null;
  if (day != null || startMonthName) {
    const sameMo = !end_month_order || end_month_order === month_order;
    const hasRange = end_day != null && end_day !== day;
    if (hasRange && sameMo) {
      prefix = [`Days ${day}–${end_day}`, startMonthName].filter(Boolean).join(', ');
    } else if (hasRange && !sameMo) {
      const s = [day != null && `Day ${day}`, startMonthName].filter(Boolean).join(' ');
      const e = [end_day != null && `Day ${end_day}`, endMonthName].filter(Boolean).join(' ');
      prefix = `${s} – ${e}`;
    } else {
      prefix = [day != null && `Day ${day}`, startMonthName].filter(Boolean).join(', ');
    }
  }

  return { prefix, visibleEras };
}

function EraDateList({ eraDates }) {
  if (!eraDates || eraDates.length === 0) {
    return <span className="italic text-muted-foreground text-xs">Unknown date</span>;
  }
  return (
    <span className="text-sm">
      {eraDates.map((ed, i) => (
        <span key={ed.era_id}>
          {i > 0 && <span className="mx-1.5 opacity-40">·</span>}
          {ed.year} {ed.abbreviation}
        </span>
      ))}
    </span>
  );
}

function LinkCard({ title, icon: Icon, items, isGm, allOptions, optionLabel, onAdd, onRemove, renderItem }) {
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const usedIds = new Set(items.map(item => item[Object.keys(item).find(k => k.endsWith('_id') && k !== 'session_id')]));
  const available = allOptions.filter(o => !usedIds.has(o.id));

  async function handleAdd() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await onAdd(Number(selectedId), description || undefined);
      setSelectedId('');
      setDescription('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
          <span className="text-muted-foreground font-normal">({items.length})</span>
        </CardTitle>
        {isGm && (
          <button onClick={() => setAdding(a => !a)} className="p-1 rounded hover:bg-muted">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.length === 0 && !adding && (
          <p className="text-xs text-muted-foreground italic">None linked</p>
        )}
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
            {renderItem(item)}
            {isGm && (
              <button onClick={() => onRemove(item.id)} className="shrink-0 p-0.5 rounded hover:bg-destructive/10">
                <X className="w-3.5 h-3.5 text-destructive" />
              </button>
            )}
          </div>
        ))}
        {isGm && adding && (
          <div className="pt-2 space-y-2 border-t border-border">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={`Select ${optionLabel}…`} />
              </SelectTrigger>
              <SelectContent>
                {available.map(o => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Description (optional)"
              className="h-8 text-sm"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleAdd} disabled={!selectedId || saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAdding(false); setSelectedId(''); setDescription(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SessionDetail() {
  const navigate = useNavigate();
  const { campaignId, sessionId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [playerView, setPlayerView] = useState(false);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit state for metadata fields
  const [editMeta, setEditMeta] = useState(null);
  const [metaDirty, setMetaDirty] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  // Content editor
  const [content, setContent] = useState('');
  const [contentDirty, setContentDirty] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  // GM notes
  const [gmNotes, setGmNotes] = useState('');
  const [gmNotesDirty, setGmNotesDirty] = useState(false);
  const [savingGmNotes, setSavingGmNotes] = useState(false);

  // Link lists
  const [npcLinks, setNpcLinks] = useState([]);
  const [locationLinks, setLocationLinks] = useState([]);
  const [eventLinks, setEventLinks] = useState([]);
  const [characterLinks, setCharacterLinks] = useState([]);

  // All campaign data for add selects
  const [allNpcs, setAllNpcs] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allCharacters, setAllCharacters] = useState([]);
  const [calendarEras, setCalendarEras] = useState([]);
  const [calendarMonths, setCalendarMonths] = useState([]);
  const [calendarCurrentYear, setCalendarCurrentYear] = useState(null);

  const loadSession = useCallback(async () => {
    try {
      const s = await sessionService.getSession(campaignId, sessionId);
      setSession(s);
      setEditMeta(toMetaForm(s));
      setContent(s.content || '');
      setGmNotes(s.gm_notes || '');
      setNpcLinks(s.npc_links || []);
      setLocationLinks(s.location_links || []);
      setEventLinks(s.event_links || []);
      setCharacterLinks(s.character_links || []);
    } catch {
      setError('Session not found');
    }
  }, [campaignId, sessionId]);

  useEffect(() => {
    setLoading(true);
    loadSession().finally(() => setLoading(false));
  }, [loadSession]);

  // Load all campaign data for add selects (GM only)
  useEffect(() => {
    if (!isGm || !campaignId) return;
    npcService.getNpcs(campaignId).then(data => setAllNpcs(Array.isArray(data) ? data : [])).catch(() => {});
    locationService.getLocations(campaignId).then(data => setAllLocations(Array.isArray(data) ? data : [])).catch(() => {});
    settingsService.getEvents(campaignId).then(data => setAllEvents(Array.isArray(data) ? data.map(e => ({ id: e.id, name: e.title })) : [])).catch(() => {});
    characterService.getCharactersByCampaign(campaignId).then(res => setAllCharacters(res?.data || [])).catch(() => {});
  }, [isGm, campaignId]);

  // Load calendar for all users — needed for month names in the date header
  useEffect(() => {
    if (!campaignId) return;
    settingsService.getCalendar(campaignId).then(cal => {
      setCalendarEras(cal?.eras || []);
      setCalendarMonths(cal?.months || []);
      setCalendarCurrentYear(cal?.current_year ?? null);
    }).catch(() => {});
  }, [campaignId]);

  function toMetaForm(s) {
    return {
      session_number: s.session_number ?? '',
      title: s.title || '',
      real_world_date: s.real_world_date || '',
      era_id: s.era_id ?? null,
      year: s.year ?? '',
      month_order: s.month_order ?? '',
      day: s.day ?? '',
      end_year: s.end_year ?? '',
      end_month_order: s.end_month_order ?? '',
      end_day: s.end_day ?? '',
      summary: s.summary || '',
      music_url: s.music_url || '',
      music_description: s.music_description || '',
      is_visible_to_players: s.is_visible_to_players,
    };
  }

  function handleMetaChange(field, value) {
    setEditMeta(prev => ({ ...prev, [field]: value }));
    setMetaDirty(true);
  }

  async function saveMeta() {
    setSavingMeta(true);
    try {
      const payload = {
        title: editMeta.title,
        is_visible_to_players: editMeta.is_visible_to_players,
        session_number: editMeta.session_number !== '' ? Number(editMeta.session_number) : null,
        real_world_date: editMeta.real_world_date || null,
        summary: editMeta.summary || null,
        music_url: editMeta.music_url || null,
        music_description: editMeta.music_description || null,
        era_id: editMeta.era_id || null,
        year: editMeta.year !== '' ? Number(editMeta.year) : null,
        month_order: editMeta.month_order !== '' ? Number(editMeta.month_order) : null,
        day: editMeta.day !== '' ? Number(editMeta.day) : null,
        end_year: editMeta.end_year !== '' ? Number(editMeta.end_year) : null,
        end_month_order: editMeta.end_month_order !== '' ? Number(editMeta.end_month_order) : null,
        end_day: editMeta.end_day !== '' ? Number(editMeta.end_day) : null,
      };
      const updated = await sessionService.updateSession(campaignId, sessionId, payload);
      setSession(updated);
      setEditMeta(toMetaForm(updated));
      setMetaDirty(false);
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveContent() {
    setSavingContent(true);
    try {
      const updated = await sessionService.updateSession(campaignId, sessionId, { content });
      setSession(updated);
      setContentDirty(false);
    } finally {
      setSavingContent(false);
    }
  }

  async function saveGmNotes() {
    setSavingGmNotes(true);
    try {
      await sessionService.updateSession(campaignId, sessionId, { gm_notes: gmNotes });
      setGmNotesDirty(false);
    } finally {
      setSavingGmNotes(false);
    }
  }

  async function uploadImage(file) {
    const { image_url } = await sessionService.uploadImage(campaignId, sessionId, file);
    return `${BACKEND}/${image_url}`;
  }

  async function handleVisibilityToggle() {
    const updated = await sessionService.updateVisibility(campaignId, sessionId, !session.is_visible_to_players);
    setSession(updated);
    setEditMeta(m => ({ ...m, is_visible_to_players: updated.is_visible_to_players }));
  }

  // Link management
  async function addNpc(npcId, description) {
    const link = await sessionService.addNpcLink(campaignId, sessionId, { npc_id: npcId, description });
    setNpcLinks(prev => [...prev, link]);
  }
  async function removeNpc(linkId) {
    await sessionService.removeNpcLink(campaignId, sessionId, linkId);
    setNpcLinks(prev => prev.filter(l => l.id !== linkId));
  }
  async function addLocation(locationId, description) {
    const link = await sessionService.addLocationLink(campaignId, sessionId, { location_id: locationId, description });
    setLocationLinks(prev => [...prev, link]);
  }
  async function removeLocation(linkId) {
    await sessionService.removeLocationLink(campaignId, sessionId, linkId);
    setLocationLinks(prev => prev.filter(l => l.id !== linkId));
  }
  async function addEvent(eventId, description) {
    const link = await sessionService.addEventLink(campaignId, sessionId, { event_id: eventId, description });
    setEventLinks(prev => [...prev, link]);
  }
  async function removeEvent(linkId) {
    await sessionService.removeEventLink(campaignId, sessionId, linkId);
    setEventLinks(prev => prev.filter(l => l.id !== linkId));
  }
  async function addCharacter(characterId, description) {
    const link = await sessionService.addCharacterLink(campaignId, sessionId, { character_id: characterId, description });
    setCharacterLinks(prev => [...prev, link]);
  }
  async function removeCharacter(linkId) {
    await sessionService.removeCharacterLink(campaignId, sessionId, linkId);
    setCharacterLinks(prev => prev.filter(l => l.id !== linkId));
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (error || !session) {
    return (
      <MainLayout>
        <div className="p-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/${campaignId}/sessions`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <p className="mt-4 text-destructive">{error || 'Session not found'}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Back + header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="sm" className="-ml-2 mt-0.5" onClick={() => navigate(`/campaigns/${campaignId}/sessions`)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {session.session_number != null && (
                  <span className="text-sm text-muted-foreground">Session #{session.session_number}</span>
                )}
                <h1 className="text-xl font-bold">{session.title}</h1>
                {isGm && !playerView && (
                  <button onClick={handleVisibilityToggle} className="p-1 rounded hover:bg-muted" title="Toggle player visibility">
                    {session.is_visible_to_players
                      ? <Eye className="w-4 h-4 text-green-600" />
                      : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                )}
                {isGm && !playerView && !session.is_visible_to_players && (
                  <Badge variant="secondary">Hidden</Badge>
                )}
              </div>
              {/* Date info */}
              {(() => {
                const isPlayerMode = !isGm || playerView;
                const { prefix, visibleEras } = buildSessionDate(session, session.era_dates, isPlayerMode, calendarMonths);
                const hasInWorldDate = prefix || visibleEras.length > 0;
                return isPlayerMode ? (
                  <div className="mt-2 space-y-1">
                    {hasInWorldDate && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-base font-semibold">
                          {prefix && <span>{prefix}</span>}
                          {prefix && visibleEras.length > 0 && <span className="mx-2 opacity-40">·</span>}
                          {visibleEras.map((ed, i) => (
                            <span key={ed.era_id}>
                              {i > 0 && <span className="mx-2 opacity-40">·</span>}
                              {ed.year} {ed.abbreviation}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {session.real_world_date && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" /> {session.real_world_date}
                        </span>
                      )}
                      {session.music_url && (
                        <a href={session.music_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Music className="w-3.5 h-3.5" />
                          {session.music_description || 'Theme Music'}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {session.real_world_date && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> {session.real_world_date}
                      </span>
                    )}
                    {hasInWorldDate && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {prefix && <span>{prefix}</span>}
                        {prefix && visibleEras.length > 0 && <span className="mx-1.5 opacity-40">·</span>}
                        {visibleEras.map((ed, i) => (
                          <span key={ed.era_id}>
                            {i > 0 && <span className="mx-1.5 opacity-40">·</span>}
                            {ed.year} {ed.abbreviation}
                          </span>
                        ))}
                      </span>
                    )}
                    {session.music_url && (
                      <a href={session.music_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Music className="w-3.5 h-3.5" />
                        {session.music_description || 'Theme Music'}
                      </a>
                    )}
                  </div>
                );
              })()}
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

        {/* Metadata card (GM editable) */}
        {isGm && !playerView && editMeta && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Session #</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    value={editMeta.session_number}
                    onChange={e => handleMetaChange('session_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Date Played</Label>
                  <Input
                    type="date"
                    className="h-8 text-sm"
                    value={editMeta.real_world_date}
                    onChange={e => handleMetaChange('real_world_date', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Music URL</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="https://…"
                    value={editMeta.music_url}
                    onChange={e => handleMetaChange('music_url', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Music Label</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g. Battle theme"
                    value={editMeta.music_description}
                    onChange={e => handleMetaChange('music_description', e.target.value)}
                  />
                </div>
              </div>
              {/* In-world start date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">In-World Start Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Era</Label>
                    <Select
                      value={editMeta.era_id ? String(editMeta.era_id) : '__none__'}
                      onValueChange={v => handleMetaChange('era_id', v === '__none__' ? null : Number(v))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {calendarEras.map(e => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.abbreviation})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <Label className="text-xs">Year</Label>
                      {calendarCurrentYear != null && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => { handleMetaChange('year', String(calendarCurrentYear)); }}
                        >
                          Use current ({calendarCurrentYear})
                        </button>
                      )}
                    </div>
                    <Input
                      className="h-8 text-sm"
                      placeholder="e.g. 3739"
                      value={editMeta.year}
                      onChange={e => handleMetaChange('year', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Month</Label>
                    <Select
                      value={editMeta.month_order ? String(editMeta.month_order) : '__none__'}
                      onValueChange={v => handleMetaChange('month_order', v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {calendarMonths.map(m => (
                          <SelectItem key={m.order_index} value={String(m.order_index)}>
                            {m.name || `Month ${m.order_index}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Day</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      placeholder="1"
                      value={editMeta.day}
                      onChange={e => handleMetaChange('day', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* In-world end date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  In-World End Date <span className="normal-case font-normal">(optional — for multi-day sessions)</span>
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Month</Label>
                    <Select
                      value={editMeta.end_month_order ? String(editMeta.end_month_order) : '__none__'}
                      onValueChange={v => handleMetaChange('end_month_order', v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">—</SelectItem>
                        {calendarMonths.map(m => (
                          <SelectItem key={m.order_index} value={String(m.order_index)}>
                            {m.name || `Month ${m.order_index}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Day</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      placeholder="2"
                      value={editMeta.end_day}
                      onChange={e => handleMetaChange('end_day', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Year (if different)</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder="same"
                      value={editMeta.end_year}
                      onChange={e => handleMetaChange('end_year', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Summary</Label>
                <Textarea
                  rows={2}
                  className="text-sm"
                  placeholder="Short blurb for the session list card…"
                  value={editMeta.summary}
                  onChange={e => handleMetaChange('summary', e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editMeta.is_visible_to_players}
                  onChange={e => handleMetaChange('is_visible_to_players', e.target.checked)}
                />
                Visible to players
              </label>
              {metaDirty && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveMeta} disabled={savingMeta}>
                    {savingMeta ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditMeta(toMetaForm(session)); setMetaDirty(false); }}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content editor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Session Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={content}
              onChange={isGm && !playerView ? (html) => { setContent(html); setContentDirty(true); } : undefined}
              onImageUpload={isGm && !playerView ? uploadImage : undefined}
              readOnly={!isGm || playerView}
            />
            {isGm && !playerView && contentDirty && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={saveContent} disabled={savingContent}>
                  {savingContent ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setContent(session.content || ''); setContentDirty(false); }}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GM Notes */}
        {isGm && !playerView && (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-700 dark:text-amber-400">
                GM Notes <span className="font-normal opacity-70 ml-1">— Private</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[120px] text-sm bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                placeholder="Private notes, reminders, foreshadowing…"
                value={gmNotes}
                onChange={e => { setGmNotes(e.target.value); setGmNotesDirty(true); }}
              />
              {gmNotesDirty && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={saveGmNotes} disabled={savingGmNotes}>
                    {savingGmNotes ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setGmNotes(session.gm_notes || ''); setGmNotesDirty(false); }}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Reset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Linked content grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <LinkCard
            title="Characters Present"
            icon={Users}
            items={characterLinks}
            isGm={isGm && !playerView}
            allOptions={allCharacters}
            optionLabel="character"
            onAdd={addCharacter}
            onRemove={removeCharacter}
            renderItem={item => (
              <span className="text-sm">{item.character_name}
                {item.description && <span className="text-xs text-muted-foreground ml-1">— {item.description}</span>}
              </span>
            )}
          />
          <LinkCard
            title="NPCs Featured"
            icon={Drama}
            items={npcLinks}
            isGm={isGm && !playerView}
            allOptions={allNpcs}
            optionLabel="NPC"
            onAdd={addNpc}
            onRemove={removeNpc}
            renderItem={item => (
              <Link
                to={`/campaigns/${campaignId}/npcs/${item.npc_id}`}
                className="text-sm hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {item.npc_name}
                {item.description && <span className="text-xs text-muted-foreground ml-1">— {item.description}</span>}
              </Link>
            )}
          />
          <LinkCard
            title="Locations Visited"
            icon={MapPin}
            items={locationLinks}
            isGm={isGm && !playerView}
            allOptions={allLocations}
            optionLabel="location"
            onAdd={addLocation}
            onRemove={removeLocation}
            renderItem={item => (
              <Link
                to={`/campaigns/${campaignId}/locations/${item.location_id}`}
                className="text-sm hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {item.location_name}
                {item.description && <span className="text-xs text-muted-foreground ml-1">— {item.description}</span>}
              </Link>
            )}
          />
          <LinkCard
            title="Timeline Events"
            icon={Clock}
            items={eventLinks}
            isGm={isGm && !playerView}
            allOptions={allEvents}
            optionLabel="event"
            onAdd={addEvent}
            onRemove={removeEvent}
            renderItem={item => (
              <span className="text-sm">{item.event_title}
                {item.description && <span className="text-xs text-muted-foreground ml-1">— {item.description}</span>}
              </span>
            )}
          />
        </div>
      </div>
    </MainLayout>
  );
}
