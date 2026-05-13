import { useState, useEffect, useCallback } from 'react';
import settingsService from '../settingsService';
import npcService from '../../npcs/npcService';
import locationService from '../../locations/locationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Clock, ChevronDown, ChevronRight, Eye, EyeOff, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Era diagram ───────────────────────────────────────────────────────────────

function EraDiagram() {
  return (
    <div className="my-6 select-none">
      <div className="flex items-center justify-center gap-0 font-mono text-sm">
        <span className="text-muted-foreground">←</span>
        <span className="mx-2 px-3 py-1 rounded bg-muted text-muted-foreground">Before Era Name</span>
        <span className="text-muted-foreground mx-1">3 · 2 · 1</span>
        <span className="mx-1 text-primary font-bold">|</span>
        <span className="text-muted-foreground mx-1">1 · 2 · 3 · 4</span>
        <span className="mx-2 px-3 py-1 rounded bg-primary/10 text-primary font-semibold">Era Name</span>
        <span className="text-muted-foreground">→</span>
      </div>
      <div className="flex justify-center mt-1">
        <div className="relative">
          <div className="h-3 w-px bg-muted-foreground mx-auto" style={{ marginLeft: '50%' }} />
          <p className="text-xs text-muted-foreground text-center mt-1">Year 1 meets Year 1 — no year zero</p>
        </div>
      </div>
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

  if (!isGm) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No timeline has been set up for this campaign yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-4">
        <Clock className="w-12 h-12 mx-auto mb-3 text-primary" />
        <h2 className="text-xl font-bold mb-2">Campaign Timeline</h2>
      </div>

      <EraDiagram />

      <div className="text-sm text-muted-foreground space-y-3 mb-8">
        <p>
          Your <strong>first era</strong> is the <span className="text-foreground font-medium">primary era</span> —
          ascending, this is "current time" in your world. Give it a name and abbreviation
          (e.g. "Age of Kings" / "AK").
        </p>
        <p>
          Additional eras branch off the primary. A <strong>descending era</strong> counts backwards
          (e.g. "Before the Age of Kings" / "BAK") — year 1 of the descending era is the year
          immediately before year 1 of the ascending era.
        </p>
        <p>
          An <strong>ascending secondary era</strong> is a parallel dating system anchored to an
          event in another era (e.g. a religious calendar that started 6,000 years before the
          current era began).
        </p>
        <p>Every timeline event can display its date in multiple eras simultaneously.</p>
      </div>

      {!showForm ? (
        <div className="text-center">
          <Button onClick={() => setShowForm(true)}>Set Up Timeline</Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create Primary Era</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Era name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Age of Kings"
                />
              </div>
              <div className="space-y-1">
                <Label>Abbreviation <span className="text-destructive">*</span></Label>
                <Input
                  value={form.abbreviation}
                  onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))}
                  placeholder="AK"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="era-current"
                checked={form.is_current}
                onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="era-current" className="text-sm">This is the current era</label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !form.name.trim() || !form.abbreviation.trim()}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Era badge ─────────────────────────────────────────────────────────────────

function EraBadge({ label, variant = 'secondary' }) {
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

// ── Era row ───────────────────────────────────────────────────────────────────

function EraRow({ era, eras, isGm, onUpdate, onDelete, onToggleVisibility }) {
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: era.name,
    abbreviation: era.abbreviation,
    is_current: era.is_current,
    is_visible_to_players: era.is_visible_to_players,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onUpdate(era.id, form);
      setShowEdit(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update era');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-sm">{era.name}</span>
        <span className="text-xs text-muted-foreground">({era.abbreviation})</span>
        {era.is_primary && <EraBadge label="Primary" variant="default" />}
        {era.is_current && <EraBadge label="Current" />}
        <EraBadge label={era.direction} variant="outline" />
        {era.is_visible_to_players
          ? <EraBadge label="Player visible" variant="outline" />
          : <span className="text-xs text-muted-foreground italic">GM only</span>}

        {isGm && (
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => onToggleVisibility(era.id, !era.is_visible_to_players)}
              title={era.is_visible_to_players ? 'Hide from players' : 'Show to players'}
            >
              {era.is_visible_to_players ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(era.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Era</DialogTitle>
          </DialogHeader>
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
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`era-current-${era.id}`}
                checked={form.is_current}
                onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))}
              />
              <label htmlFor={`era-current-${era.id}`} className="text-sm">Current era</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`era-visible-${era.id}`}
                checked={form.is_visible_to_players}
                onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
              />
              <label htmlFor={`era-visible-${era.id}`} className="text-sm">Visible to players</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Format era date list ───────────────────────────────────────────────────────

function EraDateList({ eraDates }) {
  if (!eraDates || eraDates.length === 0) return <span className="text-muted-foreground text-xs">No date</span>;
  return (
    <span className="text-xs text-muted-foreground">
      {eraDates.map((d, i) => (
        <span key={d.era_id}>
          {i > 0 && ' · '}
          <span className="text-foreground font-medium">{d.year} {d.abbreviation}</span>
        </span>
      ))}
    </span>
  );
}

// ── Event detail (expanded) ───────────────────────────────────────────────────

function EventDetail({ event, campaignId, isGm, npcs, locations, onUpdate }) {
  const [linkedNpcs, setLinkedNpcs] = useState([]);
  const [linkedLocations, setLinkedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addNpcId, setAddNpcId] = useState('__none__');
  const [addNpcDesc, setAddNpcDesc] = useState('');
  const [addLocId, setAddLocId] = useState('__none__');
  const [addLocDesc, setAddLocDesc] = useState('');
  const [savingNpc, setSavingNpc] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [error, setError] = useState('');
  const [savedNotes, setSavedNotes] = useState(event.gm_notes || '');
  const [gmNotes, setGmNotes] = useState(event.gm_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const gmNotesDirty = gmNotes !== savedNotes;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [n, l] = await Promise.all([
          settingsService.getEventNpcs(campaignId, event.id),
          settingsService.getEventLocations(campaignId, event.id),
        ]);
        setLinkedNpcs(n);
        setLinkedLocations(l);
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
      await onUpdate(event.id, { gm_notes: toSave });
      setSavedNotes(toSave || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save GM notes');
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
    <div className="pt-3 border-t border-border space-y-4">
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
                <span className="flex-1">{link.npc?.name ?? `NPC #${link.npc_id}`}</span>
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
                  {availableNpcs.map(n => (
                    <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-7 text-xs w-32"
                placeholder="Role / note"
                value={addNpcDesc}
                onChange={e => setAddNpcDesc(e.target.value)}
              />
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
                <span className="flex-1">{link.location?.name ?? `Location #${link.location_id}`}</span>
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
                  {availableLocs.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-7 text-xs w-32"
                placeholder="Note"
                value={addLocDesc}
                onChange={e => setAddLocDesc(e.target.value)}
              />
              <Button size="sm" className="h-7" onClick={handleAddLocation} disabled={savingLoc || addLocId === '__none__'}>
                {savingLoc ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </Button>
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
          <Textarea
            rows={3}
            className="text-sm focus-visible:ring-amber-400"
            placeholder="Private notes visible only to you…"
            value={gmNotes}
            onChange={e => setGmNotes(e.target.value)}
          />
          {gmNotesDirty && (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setGmNotes(savedNotes)}
                disabled={savingNotes}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSaveGmNotes}
                disabled={savingNotes}
              >
                {savingNotes && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Edit event dialog ─────────────────────────────────────────────────────────

function EditEventDialog({ open, onClose, event, eras, onSave }) {
  const [form, setForm] = useState({
    title: event.title,
    description: event.description || '',
    era_id: event.era_id ? String(event.era_id) : '__none__',
    year: event.year ?? '',
    month_order: event.month_order ?? '',
    day: event.day ?? '',
    is_visible_to_players: event.is_visible_to_players,
    gm_notes: event.gm_notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        gm_notes: form.gm_notes.trim() || null,
        era_id: form.era_id !== '__none__' ? Number(form.era_id) : null,
        year: form.year !== '' ? Number(form.year) : null,
        month_order: form.month_order !== '' ? Number(form.month_order) : null,
        day: form.day !== '' ? Number(form.day) : null,
        is_visible_to_players: form.is_visible_to_players,
      };
      await onSave(event.id, payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Timeline Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What happened?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Era</Label>
              <Select value={form.era_id} onValueChange={v => setForm(f => ({ ...f, era_id: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select era" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {eras.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                className="h-9"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Day</Label>
              <Input
                type="number"
                className="h-9"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-event-visible"
              checked={form.is_visible_to_players}
              onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
            />
            <label htmlFor="edit-event-visible" className="text-sm">Visible to players</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ event, eras, campaignId, isGm, npcs, locations, onUpdate, onDelete, onToggleVisibility }) {
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
        <span className="font-medium text-sm flex-1">{event.title}</span>
        <EraDateList eraDates={event.era_dates} />
        {event.is_visible_to_players
          ? <Badge variant="outline" className="text-xs">Visible</Badge>
          : <span className="text-xs text-muted-foreground italic">GM only</span>}
        {isGm && (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setShowEdit(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onToggleVisibility(event.id, !event.is_visible_to_players)}
              title={event.is_visible_to_players ? 'Hide from players' : 'Show to players'}
            >
              {event.is_visible_to_players ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3">
          <EventDetail
            event={event}
            campaignId={campaignId}
            isGm={isGm}
            npcs={npcs}
            locations={locations}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {showEdit && (
        <EditEventDialog
          open={showEdit}
          onClose={() => setShowEdit(false)}
          event={event}
          eras={eras}
          onSave={onUpdate}
        />
      )}
    </div>
  );
}

// ── Add era dialog ────────────────────────────────────────────────────────────

function AddEraDialog({ open, onClose, eras, onSave }) {
  const hasPrimary = eras.some(e => e.is_primary);
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    direction: hasPrimary ? 'descending' : 'ascending',
    anchor_era_id: '__none__',
    anchor_era_year: '',
    anchor_this_year: '',
    is_current: false,
    is_visible_to_players: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAscending = form.direction === 'ascending';
  // ascending secondary eras require anchor_this_year; descending can leave it null
  const anchorThisYearRequired = hasPrimary && isAscending;

  const handleSave = async () => {
    if (!form.name.trim() || !form.abbreviation.trim()) return;
    if (hasPrimary && form.anchor_era_id === '__none__') {
      setError('Please select an anchor era.');
      return;
    }
    if (anchorThisYearRequired && form.anchor_this_year === '') {
      setError('Year in this era is required for ascending eras.');
      return;
    }
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
      if (hasPrimary && form.anchor_era_id !== '__none__') {
        payload.anchor_era_id = Number(form.anchor_era_id);
        if (form.anchor_era_year !== '') payload.anchor_era_year = Number(form.anchor_era_year);
        if (form.anchor_this_year !== '') payload.anchor_this_year = Number(form.anchor_this_year);
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create era');
    } finally {
      setSaving(false);
    }
  };

  const anchorEraName = form.anchor_era_id !== '__none__'
    ? (eras.find(e => String(e.id) === form.anchor_era_id)?.name ?? '')
    : '';

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
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Age of Kings"
              />
            </div>
            <div className="space-y-1">
              <Label>Abbreviation <span className="text-destructive">*</span></Label>
              <Input
                value={form.abbreviation}
                onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))}
                placeholder="AK"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Direction</Label>
            <Select
              value={form.direction}
              onValueChange={v => setForm(f => ({ ...f, direction: v }))}
              disabled={!hasPrimary}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ascending">Ascending (counts up from year 1)</SelectItem>
                <SelectItem value="descending">Descending (counts down to year 1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasPrimary && (
            <>
              <div className="space-y-1">
                <Label>Anchor era <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Which existing era does this one align with?</p>
                <Select value={form.anchor_era_id} onValueChange={v => setForm(f => ({ ...f, anchor_era_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select anchor era…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select anchor era…</SelectItem>
                    {eras.map(e => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>
                    Year in {anchorEraName || 'anchor era'}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">at the crossing point</p>
                  <Input
                    type="number"
                    value={form.anchor_era_year}
                    onChange={e => setForm(f => ({ ...f, anchor_era_year: e.target.value }))}
                    placeholder="e.g. 6261"
                  />
                </div>
                <div className="space-y-1">
                  <Label>
                    Year in this era
                    {anchorThisYearRequired && <span className="text-destructive"> *</span>}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isAscending
                      ? 'at the same crossing point'
                      : 'optional — leave blank for transition anchor (year 1 → year before anchor)'}
                  </p>
                  <Input
                    type="number"
                    value={form.anchor_this_year}
                    onChange={e => setForm(f => ({ ...f, anchor_this_year: e.target.value }))}
                    placeholder={isAscending ? 'e.g. 1' : 'optional'}
                  />
                </div>
              </div>
              {anchorEraName && form.anchor_era_year && (isAscending ? form.anchor_this_year : true) && (
                <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                  {isAscending
                    ? `${form.name || 'This era'} year ${form.anchor_this_year} = ${anchorEraName} year ${form.anchor_era_year}`
                    : form.anchor_this_year
                      ? `${form.name || 'This era'} year ${form.anchor_this_year} = ${anchorEraName} year ${form.anchor_era_year}`
                      : `${form.name || 'This era'} year 1 is immediately before ${anchorEraName} year ${form.anchor_era_year}`}
                </p>
              )}
            </>
          )}

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-era-current"
                checked={form.is_current}
                onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))}
              />
              <label htmlFor="add-era-current" className="text-sm">Current era</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-era-visible"
                checked={form.is_visible_to_players}
                onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
              />
              <label htmlFor="add-era-visible" className="text-sm">Visible to players</label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.abbreviation.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add event dialog ──────────────────────────────────────────────────────────

function AddEventDialog({ open, onClose, eras, onSave }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    era_id: '__none__',
    year: '',
    month_order: '',
    day: '',
    is_visible_to_players: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        era_id: form.era_id !== '__none__' ? Number(form.era_id) : undefined,
        year: form.year !== '' ? Number(form.year) : undefined,
        month_order: form.month_order !== '' ? Number(form.month_order) : undefined,
        day: form.day !== '' ? Number(form.day) : undefined,
        is_visible_to_players: form.is_visible_to_players,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Timeline Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="The Battle of Ironhold"
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What happened?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Era</Label>
              <Select value={form.era_id} onValueChange={v => setForm(f => ({ ...f, era_id: v }))}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select era" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {eras.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.abbreviation})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                className="h-9"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Day</Label>
              <Input
                type="number"
                className="h-9"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="event-visible"
              checked={form.is_visible_to_players}
              onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
            />
            <label htmlFor="event-visible" className="text-sm">Visible to players</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

// ── Current date banner ───────────────────────────────────────────────────────

function CurrentDateBanner({ calData, eras }) {
  if (!calData?.current_year) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-muted/40 text-sm text-muted-foreground">
        <Clock className="w-4 h-4 shrink-0" />
        <span>No current date set — configure it on the Calendar tab.</span>
      </div>
    );
  }

  const era = eras.find(e => e.id === calData.current_era_id);
  const months = calData.months || [];
  const monthObj = months.find(m => m.order_index === calData.current_month_order);
  const monthLabel = monthObj
    ? (monthObj.name && monthObj.name.trim() ? monthObj.name : `Month ${monthObj.order_index}`)
    : calData.current_month_order
      ? `Month ${calData.current_month_order}`
      : null;

  const parts = [];
  if (calData.current_day && monthLabel) parts.push(`Day ${calData.current_day} of ${monthLabel},`);
  else if (calData.current_day) parts.push(`Day ${calData.current_day},`);
  else if (monthLabel) parts.push(`${monthLabel},`);
  parts.push(`Year ${calData.current_year}`);
  if (era) parts.push(era.abbreviation);

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 text-sm font-medium">
      <Clock className="w-4 h-4 shrink-0 text-primary" />
      <span className="text-muted-foreground mr-1">Current date:</span>
      <span>{parts.join(' ')}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TimelineTab({ campaignId, isGm }) {
  const [eras, setEras] = useState([]);
  const [events, setEvents] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [calData, setCalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddEra, setShowAddEra] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [playerView, setPlayerView] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Always try events; eras come from calendar GET
      // Use calendar to get eras, events to get events, plus NPC/location data for linking
      const [calRes, eventsRes, npcsRes, locsRes] = await Promise.allSettled([
        settingsService.getCalendar(campaignId),
        settingsService.getEvents(campaignId),
        npcService.getNpcs(campaignId),
        locationService.getLocations(campaignId),
      ]);

      if (calRes.status === 'fulfilled') {
        setEras(calRes.value.eras || []);
        setCalData(calRes.value);
      }
      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value);
      }
      if (npcsRes.status === 'fulfilled') {
        setNpcs(npcsRes.value);
      }
      if (locsRes.status === 'fulfilled') {
        setLocations(locsRes.value);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Era handlers ───────────────────────────────────────────────────────────

  const handleSetUpTimeline = async (formData) => {
    // Need to create calendar first if it doesn't exist, then create era
    // Try to create calendar (may 409 if already exists — that's fine)
    try {
      await settingsService.createCalendar(campaignId, { name: 'Campaign Calendar', days_per_month: 30 });
    } catch {
      // Calendar may already exist — continue
    }
    const era = await settingsService.createEra(campaignId, formData);
    setEras([era]);
  };

  const handleAddEra = async (data) => {
    const era = await settingsService.createEra(campaignId, data);
    setEras(prev => [...prev, era]);
  };

  const handleUpdateEra = async (eraId, data) => {
    const updated = await settingsService.updateEra(campaignId, eraId, data);
    setEras(prev => prev.map(e => e.id === eraId ? updated : e));
  };

  const handleDeleteEra = async (eraId) => {
    const era = eras.find(e => e.id === eraId);
    if (era?.is_primary && eras.length > 1) {
      setError('Cannot delete the primary era while other eras exist. Delete them first.');
      return;
    }
    if (!window.confirm('Delete this era? This cannot be undone.')) return;
    try {
      await settingsService.deleteEra(campaignId, eraId);
      setEras(prev => prev.filter(e => e.id !== eraId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete era');
    }
  };

  const handleToggleEraVisibility = async (eraId, isVisible) => {
    try {
      const updated = await settingsService.patchEraVisibility(campaignId, eraId, isVisible);
      setEras(prev => prev.map(e => e.id === eraId ? { ...e, is_visible_to_players: updated.is_visible_to_players } : e));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update era visibility');
    }
  };

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleAddEvent = async (data) => {
    const event = await settingsService.createEvent(campaignId, data);
    setEvents(prev => [...prev, event].sort((a, b) => {
      if (a.absolute_year == null && b.absolute_year == null) return 0;
      if (a.absolute_year == null) return -1;
      if (b.absolute_year == null) return 1;
      return a.absolute_year - b.absolute_year;
    }));
  };

  const handleUpdateEvent = async (eventId, data) => {
    const updated = await settingsService.updateEvent(campaignId, eventId, data);
    // Merge `data` first (optimistic) then `updated` (authoritative) so fields the
    // server omits from its response (e.g. gm_notes on a stale server) still survive
    // collapse/expand within the session.
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...data, ...updated } : e));
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await settingsService.deleteEvent(campaignId, eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete event');
    }
  };

  const handleToggleEventVisibility = async (eventId, isVisible) => {
    try {
      const updated = await settingsService.patchEventVisibility(campaignId, eventId, isVisible);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_visible_to_players: updated.is_visible_to_players } : e));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update event visibility');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (eras.length === 0) {
    return <TimelineLanding onSetUp={handleSetUpTimeline} isGm={isGm} />;
  }

  const effectiveIsGm = isGm && !playerView;
  const displayedEras = playerView ? eras.filter(e => e.is_visible_to_players) : eras;
  const displayedEvents = playerView ? events.filter(e => e.is_visible_to_players) : events;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-3">{error}</p>}

      {isGm && (
        <div className="flex justify-end">
          <Button
            variant={playerView ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPlayerView(v => !v)}
          >
            <Users className="w-4 h-4 mr-2" />
            Player View
          </Button>
        </div>
      )}

      {playerView && (
        <div className="p-3 bg-muted rounded-md text-sm flex items-center gap-2">
          <Users className="w-4 h-4 shrink-0" />
          Previewing as player — only visible eras and events are shown.
        </div>
      )}

      <CurrentDateBanner calData={calData} eras={eras} />

      {/* ── Eras ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Eras</CardTitle>
          {effectiveIsGm && (
            <Button size="sm" onClick={() => setShowAddEra(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Era
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {displayedEras.length === 0 && (
            <p className="text-sm text-muted-foreground">No visible eras.</p>
          )}
          {displayedEras.map(era => (
            <EraRow
              key={era.id}
              era={era}
              eras={eras}
              isGm={effectiveIsGm}
              onUpdate={handleUpdateEra}
              onDelete={handleDeleteEra}
              onToggleVisibility={handleToggleEraVisibility}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Timeline Events ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Timeline Events</CardTitle>
          {effectiveIsGm && (
            <Button size="sm" onClick={() => setShowAddEvent(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Event
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {displayedEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {playerView ? 'No visible events.' : 'No events yet.'}
            </p>
          )}
          {displayedEvents.map(event => (
            <EventRow
              key={event.id}
              event={event}
              eras={eras}
              campaignId={campaignId}
              isGm={effectiveIsGm}
              npcs={npcs}
              locations={locations}
              onUpdate={handleUpdateEvent}
              onDelete={handleDeleteEvent}
              onToggleVisibility={handleToggleEventVisibility}
            />
          ))}
        </CardContent>
      </Card>

      <CurrentDateBanner calData={calData} eras={eras} />

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <AddEraDialog
        open={showAddEra}
        onClose={() => setShowAddEra(false)}
        eras={eras}
        onSave={handleAddEra}
      />
      <AddEventDialog
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        eras={eras}
        onSave={handleAddEvent}
      />
    </div>
  );
}
