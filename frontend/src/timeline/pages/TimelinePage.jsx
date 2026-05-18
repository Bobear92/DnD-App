import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaign } from '../../campaigns/CampaignContext';
import settingsService from '../../settings/settingsService';
import npcService from '../../npcs/npcService';
import locationService from '../../locations/locationService';
import sessionService from '../../sessions/sessionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Trash2, Clock, Eye, EyeOff, ArrowUp, ArrowDown, ArrowUpDown,
  ChevronDown, ChevronRight, Scroll, MoveRight, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Era date helpers ──────────────────────────────────────────────────────────

function EraDateList({ eraDates }) {
  if (!eraDates || eraDates.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic flex items-center gap-1">
        <Clock className="w-3 h-3" />Unknown date
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {eraDates.map((d, i) => (
        <span key={d.era_id}>
          {i > 0 && ' · '}
          <span className="text-foreground font-medium">{d.year.toLocaleString()} {d.abbreviation}</span>
          {d.month_name && <span> {d.month_name}</span>}
          {d.day && <span> day {d.day}</span>}
        </span>
      ))}
    </span>
  );
}

function EndDateLabel({ event, eras }) {
  if (!event.end_year && !event.end_era_id) return null;
  const endEra = eras.find(e => e.id === event.end_era_id);
  const label = endEra
    ? `${event.end_year?.toLocaleString() ?? '?'} ${endEra.abbreviation}${event.end_month_order ? ` M${event.end_month_order}` : ''}${event.end_day ? ` D${event.end_day}` : ''}`
    : `Year ${event.end_year?.toLocaleString() ?? '?'}`;
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <MoveRight className="w-3 h-3 shrink-0" />
      <span className="text-foreground font-medium">{label}</span>
    </span>
  );
}

// ── Era year span ─────────────────────────────────────────────────────────────

function eraYearSpan(era) {
  const fmt = n => n.toLocaleString();
  if (era.direction === 'ascending') {
    const end = era.era_end_absolute != null
      ? `${fmt(era.era_end_absolute - era.epoch_offset)} ${era.abbreviation}`
      : 'ongoing';
    return `1 ${era.abbreviation} – ${end}`;
  }
  const newest = `1 ${era.abbreviation}`;
  const oldest = era.era_start_absolute != null
    ? `${fmt(era.epoch_offset - era.era_start_absolute)} ${era.abbreviation}`
    : null;
  return oldest ? `${oldest} – ${newest}` : `ancient – ${newest}`;
}

// ── Event card (visual timeline) ──────────────────────────────────────────────

function TimelineEventCard({
  event, side, eras, isGm, campaignId, npcs, locations,
  expanded, onToggle, onEdit, onDelete, onToggleVisibility,
}) {
  const isSpan = event.end_absolute_year !== null || event.end_year != null;

  return (
    <div
      className={cn(
        'w-full max-w-xs bg-card border border-border rounded-lg shadow-sm overflow-hidden',
        'hover:shadow-md hover:border-primary/40 transition-all duration-150 cursor-pointer',
        expanded && 'border-primary/40 shadow-md',
      )}
      onClick={onToggle}
    >
      <div className={cn('p-3', side === 'left' ? 'text-right' : 'text-left')}>
        {/* Date */}
        <div className={cn('flex items-center gap-1 flex-wrap mb-1.5', side === 'left' ? 'justify-end' : 'justify-start')}>
          <EraDateList eraDates={event.era_dates} />
          {isSpan && <EndDateLabel event={event} eras={eras} />}
        </div>

        {/* Title */}
        <p className="font-semibold text-sm leading-snug">{event.title}</p>

        {/* Description snippet */}
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
        )}

        {/* Badges */}
        {(isGm && !event.is_visible_to_players || isSpan) && (
          <div className={cn('flex gap-1 mt-2 flex-wrap', side === 'left' ? 'justify-end' : 'justify-start')}>
            {isGm && !event.is_visible_to_players && (
              <Badge variant="outline" className="text-xs gap-1 py-0">
                <EyeOff className="w-3 h-3" />Hidden
              </Badge>
            )}
            {isSpan && (
              <Badge variant="secondary" className="text-xs py-0">Span</Badge>
            )}
          </div>
        )}

        {/* GM inline controls */}
        {isGm && (
          <div
            className={cn('flex items-center gap-1 mt-2', side === 'left' ? 'justify-end' : 'justify-start')}
            onClick={e => e.stopPropagation()}
          >
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
              onClick={() => onEdit(event)}>Edit</Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
              onClick={() => onToggleVisibility(event.id, !event.is_visible_to_players)}
              title={event.is_visible_to_players ? 'Hide from players' : 'Show to players'}>
              {event.is_visible_to_players ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(event.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border" onClick={e => e.stopPropagation()}>
          <ExpandedEventDetail
            event={event}
            campaignId={campaignId}
            isGm={isGm}
            npcs={npcs}
            locations={locations}
          />
        </div>
      )}
    </div>
  );
}

// ── Expanded event detail (NPC/location/session links + GM notes) ─────────────

function ExpandedEventDetail({ event, campaignId, isGm, npcs, locations }) {
  const navigate = useNavigate();
  const [linkedNpcs, setLinkedNpcs] = useState([]);
  const [linkedLocations, setLinkedLocations] = useState([]);
  const [linkedSessions, setLinkedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addNpcId, setAddNpcId] = useState('__none__');
  const [addNpcDesc, setAddNpcDesc] = useState('');
  const [addLocId, setAddLocId] = useState('__none__');
  const [addLocDesc, setAddLocDesc] = useState('');
  const [savingNpc, setSavingNpc] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [savedNotes, setSavedNotes] = useState(event.gm_notes || '');
  const [gmNotes, setGmNotes] = useState(event.gm_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState('');
  const gmNotesDirty = gmNotes !== savedNotes;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [n, l, s] = await Promise.all([
          settingsService.getEventNpcs(campaignId, event.id),
          settingsService.getEventLocations(campaignId, event.id),
          sessionService.listSessions(campaignId, { event_id: event.id }).catch(() => []),
        ]);
        setLinkedNpcs(n);
        setLinkedLocations(l);
        setLinkedSessions(s);
      } catch {
        setError('Failed to load linked content');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaignId, event.id]);

  const handleAddNpc = async () => {
    if (addNpcId === '__none__') return;
    setSavingNpc(true);
    try {
      const link = await settingsService.addEventNpc(campaignId, event.id, {
        npc_id: Number(addNpcId),
        description: addNpcDesc.trim() || undefined,
      });
      setLinkedNpcs(prev => [...prev, link]);
      setAddNpcId('__none__');
      setAddNpcDesc('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to link NPC');
    } finally {
      setSavingNpc(false);
    }
  };

  const handleRemoveNpc = async (linkId) => {
    try {
      await settingsService.removeEventNpc(campaignId, event.id, linkId);
      setLinkedNpcs(prev => prev.filter(n => n.id !== linkId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove NPC');
    }
  };

  const handleAddLocation = async () => {
    if (addLocId === '__none__') return;
    setSavingLoc(true);
    try {
      const link = await settingsService.addEventLocation(campaignId, event.id, {
        location_id: Number(addLocId),
        description: addLocDesc.trim() || undefined,
      });
      setLinkedLocations(prev => [...prev, link]);
      setAddLocId('__none__');
      setAddLocDesc('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to link location');
    } finally {
      setSavingLoc(false);
    }
  };

  const handleRemoveLocation = async (linkId) => {
    try {
      await settingsService.removeEventLocation(campaignId, event.id, linkId);
      setLinkedLocations(prev => prev.filter(l => l.id !== linkId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove location');
    }
  };

  const handleSaveGmNotes = async () => {
    setSavingNotes(true);
    try {
      const toSave = gmNotes.trim() || null;
      await settingsService.updateEvent(campaignId, event.id, { gm_notes: toSave });
      setSavedNotes(toSave || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  const linkedNpcIds = new Set(linkedNpcs.map(n => n.npc_id));
  const linkedLocIds = new Set(linkedLocations.map(l => l.location_id));
  const availableNpcs = npcs.filter(n => !linkedNpcIds.has(n.id));
  const availableLocs = locations.filter(l => !linkedLocIds.has(l.id));

  return (
    <div className="pt-3 space-y-4">
      {error && <p className="text-xs text-destructive">{error}</p>}

      {event.description && (
        <p className="text-sm text-muted-foreground">{event.description}</p>
      )}

      {/* NPCs */}
      {(isGm || linkedNpcs.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">NPCs</p>
          {linkedNpcs.length === 0 && <p className="text-xs text-muted-foreground">None linked.</p>}
          <div className="space-y-1">
            {linkedNpcs.map(link => (
              <div key={link.id} className="flex items-center gap-2 text-sm">
                <button className="flex-1 text-left hover:underline text-primary/90"
                  onClick={() => navigate(`/campaigns/${campaignId}/npcs/${link.npc_id}`)}>
                  {link.npc_name}
                </button>
                {link.description && <span className="text-xs text-muted-foreground">{link.description}</span>}
                {isGm && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveNpc(link.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {isGm && availableNpcs.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Select value={addNpcId} onValueChange={setAddNpcId}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Add NPC…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select NPC…</SelectItem>
                  {availableNpcs.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="h-7 text-xs w-28" placeholder="Role / note"
                value={addNpcDesc} onChange={e => setAddNpcDesc(e.target.value)} />
              <Button size="sm" className="h-7" onClick={handleAddNpc} disabled={savingNpc || addNpcId === '__none__'}>
                {savingNpc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Locations */}
      {(isGm || linkedLocations.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Locations</p>
          {linkedLocations.length === 0 && <p className="text-xs text-muted-foreground">None linked.</p>}
          <div className="space-y-1">
            {linkedLocations.map(link => (
              <div key={link.id} className="flex items-center gap-2 text-sm">
                <button className="flex-1 text-left hover:underline text-primary/90"
                  onClick={() => navigate(`/campaigns/${campaignId}/locations/${link.location_id}`)}>
                  {link.location_name}
                </button>
                {link.description && <span className="text-xs text-muted-foreground">{link.description}</span>}
                {isGm && (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveLocation(link.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {isGm && availableLocs.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Select value={addLocId} onValueChange={setAddLocId}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Add location…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select location…</SelectItem>
                  {availableLocs.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="h-7 text-xs w-28" placeholder="Note"
                value={addLocDesc} onChange={e => setAddLocDesc(e.target.value)} />
              <Button size="sm" className="h-7" onClick={handleAddLocation} disabled={savingLoc || addLocId === '__none__'}>
                {savingLoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sessions */}
      {(isGm || linkedSessions.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Scroll className="w-3 h-3" />Sessions
          </p>
          {linkedSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sessions linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <button className="flex-1 text-left hover:underline text-primary/90"
                    onClick={() => navigate(`/campaigns/${campaignId}/sessions/${s.id}`)}>
                    {s.session_number != null ? `#${s.session_number} — ` : ''}{s.title}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.real_world_date && <span className="text-xs text-muted-foreground">{s.real_world_date}</span>}
                    {isGm && !s.is_visible_to_players && (
                      <Badge variant="outline" className="text-xs gap-1 py-0">
                        <EyeOff className="w-3 h-3" />Hidden
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GM Notes */}
      {isGm && (
        <div className="rounded-md border border-amber-500/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            GM Notes — Private
          </p>
          <Textarea rows={3} className="text-sm focus-visible:ring-amber-400"
            placeholder="Private notes…"
            value={gmNotes} onChange={e => setGmNotes(e.target.value)} />
          {gmNotesDirty && (
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => setGmNotes(savedNotes)} disabled={savingNotes}>Reset</Button>
              <Button size="sm" className="h-7 text-xs"
                onClick={handleSaveGmNotes} disabled={savingNotes}>
                {savingNotes && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}Save
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Event form dialog (create + edit) ─────────────────────────────────────────

function EventFormDialog({ open, onClose, eras, event, onSave }) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    era_id: event?.era_id ? String(event.era_id) : '__none__',
    year: event?.year ?? '',
    month_order: event?.month_order ?? '',
    day: event?.day ?? '',
    end_era_id: event?.end_era_id ? String(event.end_era_id) : '__none__',
    end_year: event?.end_year ?? '',
    end_month_order: event?.end_month_order ?? '',
    end_day: event?.end_day ?? '',
    is_visible_to_players: event?.is_visible_to_players ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const num = (v) => v !== '' ? Number(String(v).replace(/,/g, '')) : null;

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        era_id: form.era_id !== '__none__' ? Number(form.era_id) : null,
        year: num(form.year),
        month_order: num(form.month_order),
        day: num(form.day),
        end_era_id: form.end_era_id !== '__none__' ? Number(form.end_era_id) : null,
        end_year: num(form.end_year),
        end_month_order: num(form.end_month_order),
        end_day: num(form.end_day),
        is_visible_to_players: form.is_visible_to_players,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'New'} Timeline Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={e => f('title', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description}
              onChange={e => f('description', e.target.value)}
              placeholder="What happened?" />
          </div>

          {/* Start date */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Start Date</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Era</Label>
                <Select value={form.era_id} onValueChange={v => f('era_id', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Era" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {eras.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.abbreviation})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input className="h-8 text-xs" type="text" inputMode="numeric"
                  value={form.year} onChange={e => f('year', e.target.value.replace(/,/g, ''))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Input className="h-8 text-xs" type="text" inputMode="numeric"
                  value={form.day} onChange={e => f('day', e.target.value.replace(/,/g, ''))} />
              </div>
            </div>
          </div>

          {/* End date */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              End Date <span className="text-muted-foreground font-normal normal-case">(optional — leave blank for a point-in-time event)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Era</Label>
                <Select value={form.end_era_id} onValueChange={v => f('end_era_id', v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Era" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {eras.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.abbreviation})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input className="h-8 text-xs" type="text" inputMode="numeric"
                  value={form.end_year} onChange={e => f('end_year', e.target.value.replace(/,/g, ''))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Day</Label>
                <Input className="h-8 text-xs" type="text" inputMode="numeric"
                  value={form.end_day} onChange={e => f('end_day', e.target.value.replace(/,/g, ''))} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="event-visible"
              checked={form.is_visible_to_players}
              onChange={e => f('is_visible_to_players', e.target.checked)} />
            <label htmlFor="event-visible" className="text-sm">Visible to players</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Era management ────────────────────────────────────────────────────────────

function deriveOldestYear(era) {
  if (era.direction === 'ascending') {
    return era.era_end_absolute != null ? String(era.era_end_absolute - era.epoch_offset) : '';
  }
  return era.era_start_absolute != null ? String(era.epoch_offset - era.era_start_absolute) : '';
}

function EraManagementRow({ era, isGm, eraSort, isFirst, isLast, onMoveUp, onMoveDown, onUpdate, onDelete, onToggleVisibility }) {
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: era.name, abbreviation: era.abbreviation,
    is_current: era.is_current, is_visible_to_players: era.is_visible_to_players,
    era_oldest_year: deriveOldestYear(era),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showEdit) {
      setForm({
        name: era.name, abbreviation: era.abbreviation,
        is_current: era.is_current, is_visible_to_players: era.is_visible_to_players,
        era_oldest_year: deriveOldestYear(era),
      });
      setError('');
    }
  }, [showEdit, era]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onUpdate(era.id, {
        ...form,
        era_oldest_year: form.era_oldest_year !== '' ? Number(form.era_oldest_year) : null,
      });
      setShowEdit(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update era');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card flex-wrap">
      <span className="font-medium text-sm">{era.name}</span>
      <span className="text-xs text-muted-foreground">({era.abbreviation})</span>
      {era.is_primary && <Badge variant="default" className="text-xs">Primary</Badge>}
      {era.is_current && <Badge variant="secondary" className="text-xs">Current</Badge>}
      <Badge variant="outline" className="text-xs">{era.direction}</Badge>
      {era.is_visible_to_players
        ? <Badge variant="outline" className="text-xs">Player visible</Badge>
        : <span className="text-xs text-muted-foreground italic">GM only</span>}
      <span className="text-xs text-muted-foreground hidden sm:inline">{eraYearSpan(era)}</span>

      {isGm && (
        <div className="ml-auto flex items-center gap-1">
          {eraSort === 'manual' && (
            <>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onMoveUp} disabled={isFirst}
                title="Move up">
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onMoveDown} disabled={isLast}
                title="Move down">
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
            onClick={() => onToggleVisibility(era.id, !era.is_visible_to_players)}>
            {era.is_visible_to_players ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setShowEdit(true)}>Edit</Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(era.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Era</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Abbreviation</Label>
                <Input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`era-cur-${era.id}`}
                  checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
                <label htmlFor={`era-cur-${era.id}`} className="text-sm">Current era</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id={`era-vis-${era.id}`}
                  checked={form.is_visible_to_players}
                  onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} />
                <label htmlFor={`era-vis-${era.id}`} className="text-sm">Visible to players</label>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Timeline stops at year</Label>
              <Input type="text" inputMode="numeric" placeholder="open-ended"
                value={form.era_oldest_year}
                onChange={e => setForm(f => ({ ...f, era_oldest_year: e.target.value.replace(/,/g, '') }))} />
              <p className="text-xs text-muted-foreground">
                {era.direction === 'ascending'
                  ? 'Highest year this era tracks. Leave blank for ongoing.'
                  : 'Oldest year in this era\'s numbering. Leave blank for no defined start.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add era dialog (simplified — primary only) ────────────────────────────────

function AddEraDialog({ open, onClose, eras, onSave }) {
  const hasPrimary = eras.some(e => e.is_primary);
  const [form, setForm] = useState({
    name: '', abbreviation: '', direction: 'ascending',
    anchor_era_id: '__none__', anchor_era_year: '', anchor_this_year: '',
    is_current: false, is_visible_to_players: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name.trim() || !form.abbreviation.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim(),
        direction: form.direction,
        is_current: form.is_current,
        is_visible_to_players: form.is_visible_to_players,
      };
      if (hasPrimary) {
        if (form.anchor_era_id === '__none__' || !form.anchor_era_year) {
          setError('Anchor era and year are required for non-primary eras.');
          setSaving(false);
          return;
        }
        payload.anchor_era_id = Number(form.anchor_era_id);
        payload.anchor_era_year = Number(form.anchor_era_year);
        if (form.anchor_this_year !== '') {
          payload.anchor_this_year = Number(form.anchor_this_year);
        }
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create era');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasPrimary ? 'Add Era' : 'Create Primary Era'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Abbreviation <span className="text-destructive">*</span></Label>
              <Input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))} />
            </div>
          </div>
          {hasPrimary && (
            <div className="space-y-1">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ascending">Ascending (forward-counting)</SelectItem>
                  <SelectItem value="descending">Descending (backward-counting)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {hasPrimary && (
            <>
              <div className="space-y-1">
                <Label>Anchor era <span className="text-destructive">*</span></Label>
                <Select value={form.anchor_era_id} onValueChange={v => setForm(f => ({ ...f, anchor_era_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select era" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {eras.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.abbreviation})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Anchor year (in that era) <span className="text-destructive">*</span></Label>
                  <Input type="text" inputMode="numeric" value={form.anchor_era_year}
                    onChange={e => setForm(f => ({ ...f, anchor_era_year: e.target.value.replace(/,/g, '') }))} />
                </div>
                <div className="space-y-1">
                  <Label>Corresponding year (in this era)</Label>
                  <Input type="text" inputMode="numeric"
                    placeholder={form.direction === 'descending' ? 'blank = transition' : ''}
                    value={form.anchor_this_year}
                    onChange={e => setForm(f => ({ ...f, anchor_this_year: e.target.value.replace(/,/g, '') }))} />
                </div>
              </div>
            </>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="add-era-cur"
                checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
              <label htmlFor="add-era-cur" className="text-sm">Current era</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="add-era-vis"
                checked={form.is_visible_to_players}
                onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} />
              <label htmlFor="add-era-vis" className="text-sm">Visible to players</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.abbreviation.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Visual timeline ───────────────────────────────────────────────────────────

function VisualTimeline({ events, eras, campaignId, isGm, npcs, locations, onEdit, onDelete, onToggleVisibility }) {
  const [expandedId, setExpandedId] = useState(null);

  const datedEvents = events.filter(e => e.absolute_year !== null);
  const undatedEvents = events.filter(e => e.absolute_year === null);

  // For each index i, should the line segment ABOVE event i be colored (inside a span)?
  const lineColoredAbove = new Array(datedEvents.length).fill(false);
  for (let i = 0; i < datedEvents.length; i++) {
    if (datedEvents[i].end_absolute_year !== null) {
      for (let j = i + 1; j < datedEvents.length; j++) {
        if (datedEvents[j].absolute_year <= datedEvents[i].end_absolute_year) {
          lineColoredAbove[j] = true;
        } else break;
      }
    }
  }

  const toggleExpand = (id) => setExpandedId(prev => (prev === id ? null : id));

  if (datedEvents.length === 0 && undatedEvents.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No events yet.{isGm ? ' Add your first event above.' : ''}</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Dated events — visual center line */}
      {datedEvents.length > 0 && (
        <div className="relative">
          {datedEvents.map((event, i) => {
            const isLeft = i % 2 === 0;
            const isSpan = event.end_absolute_year !== null;
            const aboveColored = lineColoredAbove[i];
            const belowColored = lineColoredAbove[i + 1] ?? false;
            const isExpanded = expandedId === event.id;

            return (
              <div key={event.id} className="flex items-start">
                {/* Left area */}
                <div className="flex-1 flex justify-end pr-3 py-3 min-h-[80px]">
                  {isLeft && (
                    <TimelineEventCard
                      event={event} side="left" eras={eras}
                      isGm={isGm} campaignId={campaignId} npcs={npcs} locations={locations}
                      expanded={isExpanded} onToggle={() => toggleExpand(event.id)}
                      onEdit={onEdit} onDelete={onDelete} onToggleVisibility={onToggleVisibility}
                    />
                  )}
                </div>

                {/* Center: line + dot */}
                <div className="flex flex-col items-center w-8 shrink-0 self-stretch">
                  {/* Line above dot */}
                  <div className={cn(
                    'w-0.5 flex-1',
                    i === 0 ? 'invisible' : aboveColored ? 'bg-primary/50' : 'bg-border',
                  )} />
                  {/* Dot */}
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 z-10 shrink-0 my-1',
                    isSpan
                      ? 'bg-primary border-primary'
                      : 'bg-background border-primary',
                  )} />
                  {/* Line below dot */}
                  <div className={cn(
                    'w-0.5 flex-1',
                    i === datedEvents.length - 1 ? 'invisible' : belowColored ? 'bg-primary/50' : 'bg-border',
                  )} />
                </div>

                {/* Right area */}
                <div className="flex-1 flex justify-start pl-3 py-3 min-h-[80px]">
                  {!isLeft && (
                    <TimelineEventCard
                      event={event} side="right" eras={eras}
                      isGm={isGm} campaignId={campaignId} npcs={npcs} locations={locations}
                      expanded={isExpanded} onToggle={() => toggleExpand(event.id)}
                      onEdit={onEdit} onDelete={onDelete} onToggleVisibility={onToggleVisibility}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unknown date section */}
      {undatedEvents.length > 0 && (
        <div className={cn('mt-8 pt-6', datedEvents.length > 0 && 'border-t border-dashed border-border')}>
          <div className="flex items-center gap-2 mb-4 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Unknown Date</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {undatedEvents.map(event => (
              <div
                key={event.id}
                className={cn(
                  'bg-card border border-border rounded-lg p-3 cursor-pointer',
                  'hover:shadow-md hover:border-primary/40 transition-all duration-150',
                  expandedId === event.id && 'border-primary/40',
                )}
                onClick={() => toggleExpand(event.id)}
              >
                <p className="font-semibold text-sm">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                )}
                {isGm && !event.is_visible_to_players && (
                  <Badge variant="outline" className="text-xs gap-1 mt-2 py-0">
                    <EyeOff className="w-3 h-3" />Hidden
                  </Badge>
                )}
                {isGm && (
                  <div className="flex items-center gap-1 mt-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                      onClick={() => onEdit(event)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                      onClick={() => onToggleVisibility(event.id, !event.is_visible_to_players)}>
                      {event.is_visible_to_players ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => onDelete(event.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {expandedId === event.id && (
                  <div className="mt-3 border-t border-border" onClick={e => e.stopPropagation()}>
                    <ExpandedEventDetail
                      event={event} campaignId={campaignId}
                      isGm={isGm} npcs={npcs} locations={locations}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline landing (no eras yet) ────────────────────────────────────────────

function TimelineLanding({ onSetUp, isGm }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', abbreviation: '', is_current: true, is_visible_to_players: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.name.trim() || !form.abbreviation.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSetUp({ ...form, direction: 'ascending' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create era');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-6">
      <Clock className="w-14 h-14 mx-auto text-primary opacity-60" />
      <div>
        <h2 className="text-xl font-bold mb-2">No Timeline Yet</h2>
        <p className="text-sm text-muted-foreground">
          {isGm
            ? 'Set up a primary era to start placing events on your campaign\'s timeline.'
            : 'The GM hasn\'t set up a timeline for this campaign yet.'}
        </p>
      </div>
      {isGm && !showForm && (
        <Button onClick={() => setShowForm(true)}>Set Up Timeline</Button>
      )}
      {isGm && showForm && (
        <Card className="text-left">
          <CardHeader><CardTitle className="text-base">Create Primary Era</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Era name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Age of Kings" />
              </div>
              <div className="space-y-1">
                <Label>Abbreviation <span className="text-destructive">*</span></Label>
                <Input value={form.abbreviation} onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))}
                  placeholder="AK" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="landing-current"
                checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
              <label htmlFor="landing-current" className="text-sm">This is the current era</label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleCreate}
                disabled={saving || !form.name.trim() || !form.abbreviation.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [calendar, setCalendar] = useState(null);
  const [events, setEvents] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [playerView, setPlayerView] = useState(false);

  const [showEras, setShowEras] = useState(true);
  const [showAddEra, setShowAddEra] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const eras = calendar?.eras ?? [];

  // Era sort: 'chronological' or 'manual', persisted per campaign
  const sortKey = `timeline-era-sort-${campaignId}`;
  const orderKey = `timeline-era-order-${campaignId}`;
  const [eraSort, setEraSort] = useState(() => localStorage.getItem(sortKey) || 'chronological');
  const [manualEraOrder, setManualEraOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(orderKey)) || []; } catch { return []; }
  });

  // Sync manual order when eras change (add new, remove deleted)
  useEffect(() => {
    if (eras.length === 0) return;
    setManualEraOrder(prev => {
      const valid = prev.filter(id => eras.some(e => e.id === id));
      const added = eras.filter(e => !valid.includes(e.id)).map(e => e.id);
      const updated = [...valid, ...added];
      localStorage.setItem(orderKey, JSON.stringify(updated));
      return updated;
    });
  }, [eras.map(e => e.id).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetEraSort = (mode) => {
    setEraSort(mode);
    localStorage.setItem(sortKey, mode);
  };

  const handleMoveEra = (eraId, direction) => {
    setManualEraOrder(prev => {
      const idx = prev.indexOf(eraId);
      if (idx === -1) return prev;
      const next = [...prev];
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      localStorage.setItem(orderKey, JSON.stringify(next));
      return next;
    });
  };

  const sortedEras = [...eras].sort((a, b) => {
    if (eraSort === 'chronological') {
      const aAbs = a.era_start_absolute ?? -Infinity;
      const bAbs = b.era_start_absolute ?? -Infinity;
      return aAbs - bAbs;
    }
    const ai = manualEraOrder.indexOf(a.id);
    const bi = manualEraOrder.indexOf(b.id);
    return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
  });

  // In player view, GM sees only what players see
  const effectiveIsGm = isGm && !playerView;
  const displayEvents = effectiveIsGm ? events : events.filter(e => e.is_visible_to_players);
  const visibleEras = effectiveIsGm ? sortedEras : sortedEras.filter(e => e.is_visible_to_players);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cal, evts, npcList, locList] = await Promise.all([
        settingsService.getCalendar(campaignId).catch(err => {
          if (err.response?.status === 404) return null;
          throw err;
        }),
        settingsService.getEvents(campaignId).catch(() => []),
        npcService.getNpcs(campaignId).catch(() => []),
        locationService.getLocations(campaignId).catch(() => []),
      ]);
      setCalendar(cal);
      setEvents(evts);
      setNpcs(npcList);
      setLocations(locList);
    } catch {
      setError('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateEra = async (data) => {
    await settingsService.createEra(campaignId, data);
    await load();
  };

  const handleUpdateEra = async (eraId, data) => {
    await settingsService.updateEra(campaignId, eraId, data);
    await load();
  };

  const handleDeleteEra = async (eraId) => {
    await settingsService.deleteEra(campaignId, eraId);
    await load();
  };

  const handleToggleEraVisibility = async (eraId, isVisible) => {
    await settingsService.patchEraVisibility(campaignId, eraId, isVisible);
    await load();
  };

  const handleCreateEvent = async (data) => {
    await settingsService.createEvent(campaignId, data);
    await load();
  };

  const handleUpdateEvent = async (eventId, data) => {
    await settingsService.updateEvent(campaignId, eventId, data);
    await load();
  };

  const handleDeleteEvent = async (eventId) => {
    await settingsService.deleteEvent(campaignId, eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleToggleEventVisibility = async (eventId, isVisible) => {
    await settingsService.patchEventVisibility(campaignId, eventId, isVisible);
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_visible_to_players: isVisible } : e));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>;
  }

  // No calendar or no eras → landing
  if (!calendar || eras.length === 0) {
    return (
      <div className="p-6">
        <TimelineLanding
          isGm={isGm}
          onSetUp={async (data) => {
            if (!calendar) await settingsService.createCalendar(campaignId, { name: 'Campaign Calendar' });
            await handleCreateEra(data);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Timeline</h1>
            <span className="text-sm text-muted-foreground">{campaign?.name}</span>
          </div>
          {playerView && (
            <p className="text-xs text-muted-foreground mt-1 ml-8">Showing player view</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isGm && (
            <Button
              variant={playerView ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerView(v => !v)}
            >
              <Users className="w-4 h-4 mr-1" />Player View
            </Button>
          )}
          {effectiveIsGm && (
            <Button size="sm" onClick={() => setShowAddEvent(true)}>
              <Plus className="w-4 h-4 mr-1" />New Event
            </Button>
          )}
        </div>
      </div>

      {/* Eras section */}
      <Card className="mb-6">
        <CardHeader
          className="py-3 cursor-pointer select-none"
          onClick={() => setShowEras(o => !o)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Eras ({visibleEras.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {effectiveIsGm && (
                <>
                  <Button
                    size="sm" variant="ghost" className="h-7 px-2 text-xs"
                    onClick={e => {
                      e.stopPropagation();
                      handleSetEraSort(eraSort === 'chronological' ? 'manual' : 'chronological');
                    }}
                    title={eraSort === 'chronological' ? 'Switch to manual order' : 'Switch to chronological order'}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                    {eraSort === 'chronological' ? 'Chronological' : 'Manual'}
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="h-7 px-2 text-xs"
                    onClick={e => { e.stopPropagation(); setShowAddEra(true); }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />Add Era
                  </Button>
                </>
              )}
              {showEras
                ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        {showEras && (
          <CardContent className="pt-0 pb-3 space-y-2">
            {visibleEras.map((era, i) => (
              <EraManagementRow
                key={era.id}
                era={era}
                isGm={effectiveIsGm}
                eraSort={eraSort}
                isFirst={i === 0}
                isLast={i === visibleEras.length - 1}
                onMoveUp={() => handleMoveEra(era.id, 'up')}
                onMoveDown={() => handleMoveEra(era.id, 'down')}
                onUpdate={handleUpdateEra}
                onDelete={handleDeleteEra}
                onToggleVisibility={handleToggleEraVisibility}
              />
            ))}
          </CardContent>
        )}
      </Card>

      {/* Visual timeline */}
      <VisualTimeline
        events={displayEvents}
        eras={sortedEras}
        campaignId={campaignId}
        isGm={effectiveIsGm}
        npcs={npcs}
        locations={locations}
        onEdit={setEditingEvent}
        onDelete={handleDeleteEvent}
        onToggleVisibility={handleToggleEventVisibility}
      />

      {/* Dialogs */}
      {showAddEra && (
        <AddEraDialog
          open={showAddEra}
          onClose={() => setShowAddEra(false)}
          eras={sortedEras}
          onSave={handleCreateEra}
        />
      )}

      {showAddEvent && (
        <EventFormDialog
          open={showAddEvent}
          onClose={() => setShowAddEvent(false)}
          eras={sortedEras}
          onSave={handleCreateEvent}
        />
      )}

      {editingEvent && (
        <EventFormDialog
          open={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          eras={sortedEras}
          event={editingEvent}
          onSave={(data) => handleUpdateEvent(editingEvent.id, data)}
        />
      )}
    </div>
  );
}
