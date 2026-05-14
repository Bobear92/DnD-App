import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import settingsService from '../settingsService';
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
import { Loader2, Plus, Trash2, Clock, ChevronDown, ChevronRight, Eye, EyeOff, Users, ArrowUp, ArrowDown, ArrowUpDown, Scroll } from 'lucide-react';
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

// ── Timeline guide (era type examples) ───────────────────────────────────────

function EraTypeExample({ number, title, subtitle, visual, eventsLabel, events, setupLabel, inputs }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono shrink-0">
            {number}
          </span>
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-muted/50 rounded-md p-3">{visual}</div>
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground font-medium">{eventsLabel}</p>
          {events.map((e, i) => <p key={i} className="font-mono pl-2">{e}</p>)}
        </div>
        <div className="bg-muted/30 rounded-md p-3 text-xs space-y-1.5">
          <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">{setupLabel}</p>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
            {inputs.map(([label, value], i) => (
              <>
                <span key={`l${i}`} className="text-muted-foreground whitespace-nowrap">{label}</span>
                <span key={`v${i}`} className="font-medium">{value}</span>
              </>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineGuide() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          A timeline is built from one or more <strong>eras</strong> — named dating systems.
          Every event can display its date in multiple eras at once.
        </p>
        <p>
          Your first era is the <strong>primary era</strong> — ascending, the baseline of your
          world's time. You can then add:
        </p>
        <ul className="space-y-0.5 pl-4">
          <li>• A <strong>descending era</strong> that counts backwards toward a pivot event (BC/AD style)</li>
          <li>• A <strong>parallel era</strong> — a second dating system anchored to an event in an existing era</li>
        </ul>
      </div>

      <EraTypeExample
        number="1"
        title="Single Ascending Era"
        subtitle="Simplest setup — one continuous forward count from year 1."
        visual={
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
              <span className="text-muted-foreground">1 AR</span>
              <span className="border-t border-muted-foreground/40 flex-1 min-w-4" />
              <span className="text-muted-foreground">300 AR</span>
              <span className="border-t border-muted-foreground/40 flex-1 min-w-4" />
              <span className="text-muted-foreground">612 AR</span>
              <span className="border-t border-muted-foreground/40 flex-1 min-w-4" />
              <span className="text-primary font-bold">1,250 AR ●</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>The Founding</span>
              <span>Dragon War</span>
              <span>Empire Falls</span>
              <span>Campaign now</span>
            </div>
          </div>
        }
        eventsLabel="Events appear as:"
        events={[
          '"The Dragon War — 300 AR"',
          '"Battle of Thornwall — 842 AR"',
        ]}
        setupLabel="To create this (your very first era)"
        inputs={[
          ['Era Name:', 'Age of Renewal'],
          ['Abbreviation:', 'AR'],
          ['Direction:', 'Ascending (automatic — first era is always primary)'],
        ]}
      />

      <EraTypeExample
        number="2"
        title="Before / After Split"
        subtitle='BC/AD-style pivot — years count backward before the event, forward after.'
        visual={
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-0 font-mono text-xs flex-wrap">
              <span className="text-muted-foreground">←</span>
              <span className="mx-1.5 px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px]">Before the Sundering</span>
              <span className="text-muted-foreground">500 · 2 · 1</span>
              <span className="mx-1 text-primary font-bold text-base">|</span>
              <span className="text-muted-foreground">1 · 2 · 850</span>
              <span className="mx-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[11px]">After the Sundering</span>
              <span className="text-muted-foreground">→</span>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              BSun · ASun — year 1 meets year 1, no year zero
            </p>
          </div>
        }
        eventsLabel="Events appear as:"
        events={[
          '"The Great Betrayal — 500 BSun"',
          '"The Sundering — 1 BSun / 1 ASun" (pivot event shows both)',
          '"New Kingdoms Rise — 300 ASun"',
        ]}
        setupLabel='To create this (click "Add Era" → "Before / After Split")'
        inputs={[
          ['Before era name:', 'Before the Sundering'],
          ['Before abbreviation:', 'BSun'],
          ['After era name:', 'After the Sundering'],
          ['After abbreviation:', 'ASun'],
        ]}
      />

      <EraTypeExample
        number="3"
        title="Parallel Era"
        subtitle="A second dating system layered over the same timeline — religious calendars, imperial reckonings, etc."
        visual={
          <div className="font-mono text-xs space-y-1.5">
            <div className="flex gap-2 items-baseline">
              <span className="text-muted-foreground w-36 shrink-0 text-[10px]">Age of Kings (AK)</span>
              <span className="whitespace-nowrap">1 AK ── 312 AK ── 412 AK ── 842 AK</span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="text-muted-foreground w-36 shrink-0 text-[10px]">Imperial Cal. (IC)</span>
              <span className="text-muted-foreground whitespace-nowrap pl-14">= 1 IC ── 100 IC ── 530 IC</span>
            </div>
            <p className="text-[10px] text-muted-foreground">IC started when the Empire was founded (312 AK = 1 IC)</p>
          </div>
        }
        eventsLabel="Events appear as:"
        events={[
          '"The Founding — 1 AK" (before IC started, only AK shown)',
          '"Battle of Thornwall — 842 AK · 530 IC"',
        ]}
        setupLabel='To add the secondary era (click "Add Era" → "Parallel Era")'
        inputs={[
          ['Era Name:', 'Imperial Calendar'],
          ['Abbreviation:', 'IC'],
          ['Anchor Era:', 'Age of Kings'],
          ['In AK, this year is:', '312'],
          ['That year in IC:', '1'],
        ]}
      />
    </div>
  );
}

function TimelineInfoPanel() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader
        className="py-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            How do eras and timelines work?
          </CardTitle>
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 pb-4">
          <TimelineGuide />
        </CardContent>
      )}
    </Card>
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
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-primary" />
        <h2 className="text-xl font-bold mb-2">Campaign Timeline</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Record your world's history using <strong>eras</strong> — named dating systems that let you
          place events across time. Every event can display its date in multiple eras simultaneously.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Era types &amp; examples
        </p>
        <TimelineGuide />
      </div>

      {isGm ? (
        !showForm ? (
          <div className="text-center pt-2">
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
        )
      ) : (
        <div className="text-center text-sm text-muted-foreground pt-2">
          No timeline has been set up for this campaign yet.
        </div>
      )}
    </div>
  );
}

// ── Era badge ─────────────────────────────────────────────────────────────────

function EraBadge({ label, variant = 'secondary' }) {
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

// ── Era row ───────────────────────────────────────────────────────────────────

function deriveOldestYear(era) {
  if (era.direction === 'ascending') {
    return era.era_end_absolute != null ? String(era.era_end_absolute - era.epoch_offset) : '';
  }
  return era.era_start_absolute != null ? String(era.epoch_offset - era.era_start_absolute) : '';
}

function eraYearSpan(era) {
  const fmt = n => n.toLocaleString();
  if (era.direction === 'ascending') {
    const start = `1 ${era.abbreviation}`;
    const end = era.era_end_absolute != null
      ? `${fmt(era.era_end_absolute - era.epoch_offset)} ${era.abbreviation}`
      : 'ongoing';
    return `${start} – ${end}`;
  }
  // descending: highest year number is oldest, year 1 is most recent
  const newest = `1 ${era.abbreviation}`;
  const oldest = era.era_start_absolute != null
    ? `${fmt(era.epoch_offset - era.era_start_absolute)} ${era.abbreviation}`
    : null;
  return oldest ? `${oldest} – ${newest}` : `ancient – ${newest}`;
}

function EraRow({ era, eras, isGm, onUpdate, onDelete, onToggleVisibility, isCustomSort, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: era.name,
    abbreviation: era.abbreviation,
    is_current: era.is_current,
    is_visible_to_players: era.is_visible_to_players,
    era_oldest_year: deriveOldestYear(era),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showEdit) {
      setForm({
        name: era.name,
        abbreviation: era.abbreviation,
        is_current: era.is_current,
        is_visible_to_players: era.is_visible_to_players,
        era_oldest_year: deriveOldestYear(era),
      });
      setError('');
    }
  }, [showEdit]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        era_oldest_year: form.era_oldest_year !== '' ? Number(form.era_oldest_year) : null,
      };
      await onUpdate(era.id, payload);
      setShowEdit(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update era');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-md p-3 space-y-1.5">
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
            {isCustomSort && (
              <>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onMoveUp} disabled={isFirst} title="Move up">
                  <ArrowUp className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onMoveDown} disabled={isLast} title="Move down">
                  <ArrowDown className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
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
      <p className="text-xs text-muted-foreground pl-0.5">{eraYearSpan(era)}</p>

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
            <div className="space-y-1">
              <Label>Timeline stops at year</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="open-ended"
                value={form.era_oldest_year}
                onChange={e => setForm(f => ({ ...f, era_oldest_year: e.target.value.replace(/,/g, '') }))}
              />
              <p className="text-xs text-muted-foreground">
                {era.direction === 'ascending'
                  ? 'Highest year this era tracks. Leave blank for an ongoing era.'
                  : 'Oldest year in this era\'s numbering. Leave blank for no defined start.'}
              </p>
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
  if (!eraDates || eraDates.length === 0) return (
    <span className="text-xs text-muted-foreground italic flex items-center gap-1">
      <Clock className="w-3 h-3" />Unknown date
    </span>
  );
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
  const [error, setError] = useState('');
  const [savedNotes, setSavedNotes] = useState(event.gm_notes || '');
  const [gmNotes, setGmNotes] = useState(event.gm_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
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
                <button
                  className="flex-1 text-left hover:underline text-primary/90"
                  onClick={() => navigate(`/campaigns/${campaignId}/npcs/${link.npc_id}`)}
                >{link.npc_name}</button>
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
                <button
                  className="flex-1 text-left hover:underline text-primary/90"
                  onClick={() => navigate(`/campaigns/${campaignId}/locations/${link.location_id}`)}
                >{link.location_name}</button>
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

      {/* Sessions */}
      {(isGm || linkedSessions.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Scroll className="w-3 h-3" /> Sessions
          </p>
          {linkedSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sessions linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <button
                    className="flex-1 text-left hover:underline text-primary/90"
                    onClick={() => navigate(`/campaigns/${campaignId}/sessions/${s.id}`)}
                  >
                    {s.session_number != null ? `#${s.session_number} — ` : ''}{s.title}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.real_world_date && (
                      <span className="text-xs text-muted-foreground">{s.real_world_date}</span>
                    )}
                    {isGm && !s.is_visible_to_players && (
                      <Badge variant="outline" className="text-xs gap-1"><EyeOff className="w-3 h-3" /> Hidden</Badge>
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
                type="text"
                inputMode="numeric"
                className="h-9"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value.replace(/,/g, '') }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Day</Label>
              <Input
                type="text"
                inputMode="numeric"
                className="h-9"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value.replace(/,/g, '') }))}
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

function ModeCard({ selected, onClick, title, subtitle, description }) {
  return (
    <div
      className={`flex-1 rounded-md border-2 p-3 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? 'border-primary' : 'border-muted-foreground'}`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </div>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <span className="text-xs text-muted-foreground font-normal">{subtitle}</span>}
      </div>
      <p className="text-xs text-muted-foreground pl-5">{description}</p>
    </div>
  );
}

function AddEraDialog({ open, onClose, eras, onSave }) {
  const hasPrimary = eras.some(e => e.is_primary);
  // 'split' = Before/After (descending, transition anchor)
  // 'parallel' = standard aligned era (ascending or descending)
  const [mode, setMode] = useState('parallel');
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    // parallel fields
    direction: 'ascending',
    anchor_era_id: '__none__',
    anchor_era_year: '',
    anchor_this_year: '',
    // split fields
    split_anchor_id: eras.length > 0 ? String(eras[0].id) : '__none__',
    split_anchor_year: '1',
    // shared
    is_current: false,
    is_visible_to_players: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (m) => { setMode(m); setError(''); };

  // ── derived ──
  const isAscending = form.direction === 'ascending';
  const parallelAnchorName = form.anchor_era_id !== '__none__'
    ? (eras.find(e => String(e.id) === form.anchor_era_id)?.name ?? '')
    : '';
  const splitAnchorEra = form.split_anchor_id !== '__none__'
    ? eras.find(e => String(e.id) === form.split_anchor_id)
    : null;
  const splitAnchorYear = form.split_anchor_year || '1';
  const thisAbbr = form.abbreviation || 'NEW';
  const splitAfterAbbr = splitAnchorEra?.abbreviation || '???';

  // parallel preview
  const showParallelPreview = hasPrimary && parallelAnchorName && form.anchor_era_year &&
    (isAscending ? form.anchor_this_year : true);
  const parallelPreviewText = isAscending
    ? `${form.name || 'This era'} year ${form.anchor_this_year} = ${parallelAnchorName} year ${form.anchor_era_year}`
    : form.anchor_this_year
      ? `${form.name || 'This era'} year ${form.anchor_this_year} = ${parallelAnchorName} year ${form.anchor_era_year}`
      : `${form.name || 'This era'} year 1 is immediately before ${parallelAnchorName} year ${form.anchor_era_year}`;

  const handleSave = async () => {
    if (!form.name.trim() || !form.abbreviation.trim()) return;

    if (mode === 'split') {
      if (form.split_anchor_id === '__none__') {
        setError('Please select the era this one sits before.');
        return;
      }
      setSaving(true);
      setError('');
      try {
        await onSave({
          name: form.name.trim(),
          abbreviation: form.abbreviation.trim(),
          direction: 'descending',
          is_current: form.is_current,
          is_visible_to_players: form.is_visible_to_players,
          anchor_era_id: Number(form.split_anchor_id),
          anchor_era_year: Number(splitAnchorYear),
        });
        onClose();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to create era');
      } finally {
        setSaving(false);
      }
      return;
    }

    // parallel mode
    if (hasPrimary && form.anchor_era_id === '__none__') {
      setError('Please select an era to align with.');
      return;
    }
    if (hasPrimary && isAscending && form.anchor_this_year === '') {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{hasPrimary ? 'Add Era' : 'Create Primary Era'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {hasPrimary && (
            <div className="flex gap-2">
              <ModeCard
                selected={mode === 'parallel'}
                onClick={() => switchMode('parallel')}
                title="Parallel Era"
                description="An ascending or descending era that aligns with an existing one at a specific crossing point."
              />
              <ModeCard
                selected={mode === 'split'}
                onClick={() => switchMode('split')}
                title="Before/After Split"
                subtitle="(like BC / AD)"
                description="Counts backwards from a fixed moment. Year 1 sits immediately before year 1 of the other era — no year zero."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={mode === 'split' ? 'Before the Sundering' : 'The Age of Embers'}
              />
            </div>
            <div className="space-y-1">
              <Label>Abbreviation <span className="text-destructive">*</span></Label>
              <Input
                value={form.abbreviation}
                onChange={e => setForm(f => ({ ...f, abbreviation: e.target.value }))}
                placeholder={mode === 'split' ? 'BtS' : 'AE'}
              />
            </div>
          </div>

          {mode === 'split' ? (
            <>
              <div className="space-y-1">
                <Label>Sits immediately before <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Which existing era does this one count backwards from?</p>
                <Select value={form.split_anchor_id} onValueChange={v => setForm(f => ({ ...f, split_anchor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select era…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select era…</SelectItem>
                    {eras.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Split at year <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">
                  Which year in <strong>{splitAnchorEra?.name || 'the other era'}</strong> is the crossing point? Usually year 1.
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="w-32"
                  value={form.split_anchor_year}
                  onChange={e => setForm(f => ({ ...f, split_anchor_year: e.target.value.replace(/,/g, '') }))}
                  placeholder="1"
                />
              </div>

              <div className="rounded-md bg-muted px-4 py-3 font-mono text-sm text-center tracking-wide">
                <span className="text-muted-foreground">… 3 · 2 · 1 </span>
                <span className="font-bold">[{thisAbbr}]</span>
                <span className="text-muted-foreground"> | </span>
                <span className="font-bold">[{splitAfterAbbr}]</span>
                <span className="text-muted-foreground"> {splitAnchorYear} · {Number(splitAnchorYear) + 1} · {Number(splitAnchorYear) + 2} …</span>
                <p className="text-xs text-muted-foreground font-sans mt-1 normal-case tracking-normal">
                  {thisAbbr} year 1 is the year immediately before {splitAfterAbbr} year {splitAnchorYear} — no year zero.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label>Direction <span className="text-destructive">*</span></Label>
                <Select
                  value={form.direction}
                  onValueChange={v => setForm(f => ({ ...f, direction: v }))}
                  disabled={!hasPrimary}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ascending">Ascending — counts up from year 1</SelectItem>
                    <SelectItem value="descending">Descending — counts down to year 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasPrimary && (
                <>
                  <div className="space-y-1">
                    <Label>Aligns with <span className="text-destructive">*</span></Label>
                    <p className="text-xs text-muted-foreground">Which existing era does this one share a crossing point with?</p>
                    <Select value={form.anchor_era_id} onValueChange={v => setForm(f => ({ ...f, anchor_era_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select era…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select era…</SelectItem>
                        {eras.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Year in {parallelAnchorName || 'that era'} <span className="text-destructive">*</span></Label>
                      <p className="text-xs text-muted-foreground">at the crossing point</p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={form.anchor_era_year}
                        onChange={e => setForm(f => ({ ...f, anchor_era_year: e.target.value.replace(/,/g, '') }))}
                        placeholder="e.g. 100"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>
                        Year in this era
                        {hasPrimary && isAscending && <span className="text-destructive"> *</span>}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isAscending ? 'at the same crossing point' : 'leave blank if year 1 sits just before the crossing'}
                      </p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={form.anchor_this_year}
                        onChange={e => setForm(f => ({ ...f, anchor_this_year: e.target.value.replace(/,/g, '') }))}
                        placeholder={isAscending ? 'e.g. 1' : 'optional'}
                      />
                    </div>
                  </div>

                  {showParallelPreview && (
                    <p className="text-xs text-muted-foreground bg-muted rounded p-2">{parallelPreviewText}</p>
                  )}
                </>
              )}
            </>
          )}

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="add-era-current" checked={form.is_current}
                onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
              <label htmlFor="add-era-current" className="text-sm">Current era</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="add-era-visible" checked={form.is_visible_to_players}
                onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} />
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
                type="text"
                inputMode="numeric"
                className="h-9"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value.replace(/,/g, '') }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Day</Label>
              <Input
                type="text"
                inputMode="numeric"
                className="h-9"
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value.replace(/,/g, '') }))}
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
    if (customEraOrder) {
      const next = [...customEraOrder, era.id];
      setCustomEraOrder(next);
      localStorage.setItem(eraSortKey + '_order', JSON.stringify(next));
    }
  };

  const handleUpdateEra = async (eraId, data) => {
    const updated = await settingsService.updateEra(campaignId, eraId, data);
    setEras(prev => prev.map(e => e.id === eraId ? updated : e));
  };

  const eraSortKey = `era_sort_${campaignId}`;
  const [eraSort, setEraSort] = useState(() => localStorage.getItem(eraSortKey + '_mode') || 'chronological');
  const [customEraOrder, setCustomEraOrder] = useState(() => {
    const saved = localStorage.getItem(eraSortKey + '_order');
    return saved ? JSON.parse(saved) : null;
  });

  const switchEraSort = (mode) => {
    setEraSort(mode);
    localStorage.setItem(eraSortKey + '_mode', mode);
    if (mode === 'custom' && !customEraOrder) {
      const initOrder = chronologicalEras.map(e => e.id);
      setCustomEraOrder(initOrder);
      localStorage.setItem(eraSortKey + '_order', JSON.stringify(initOrder));
    }
  };

  const moveEra = (eraId, dir) => {
    const order = customEraOrder || chronologicalEras.map(e => e.id);
    const idx = order.indexOf(eraId);
    if (idx === -1) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === order.length - 1) return;
    const next = [...order];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setCustomEraOrder(next);
    localStorage.setItem(eraSortKey + '_order', JSON.stringify(next));
  };

  const handleDeleteEra = async (eraId) => {
    const era = eras.find(e => e.id === eraId);
    if (era?.is_primary && eras.length > 1) {
      setError('Cannot delete the primary era while other eras exist. Delete them first.');
      return;
    }
    const orphanCount = events.filter(e => e.era_id === eraId).length;
    const orphanWarning = orphanCount > 0
      ? `\n\n${orphanCount} event${orphanCount === 1 ? '' : 's'} dated in this era will move to "Unknown Date" and can be reassigned later.`
      : '';
    if (!window.confirm(`Delete this era? This cannot be undone.${orphanWarning}`)) return;
    try {
      await settingsService.deleteEra(campaignId, eraId);
      setEras(prev => prev.filter(e => e.id !== eraId));
      if (customEraOrder) {
        const next = customEraOrder.filter(id => id !== eraId);
        setCustomEraOrder(next);
        localStorage.setItem(eraSortKey + '_order', JSON.stringify(next));
      }
      if (orphanCount > 0) {
        setEvents(prev => prev.map(e => e.era_id === eraId
          ? { ...e, era_id: null, absolute_year: null, era_dates: [] }
          : e
        ));
      }
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
  const filteredEras = playerView ? eras.filter(e => e.is_visible_to_players) : eras;
  const chronologicalEras = filteredEras.slice().sort((a, b) => {
    const aStart = a.era_start_absolute ?? -Infinity;
    const bStart = b.era_start_absolute ?? -Infinity;
    return aStart - bStart;
  });
  const displayedEras = (eraSort === 'custom' && customEraOrder)
    ? filteredEras.slice().sort((a, b) => {
        const ai = customEraOrder.indexOf(a.id);
        const bi = customEraOrder.indexOf(b.id);
        return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
      })
    : chronologicalEras;
  const visibleEraIds = new Set(filteredEras.map(e => e.id));
  const allDisplayedEvents = playerView
    ? events
        .filter(e => e.is_visible_to_players)
        .map(e => ({ ...e, era_dates: (e.era_dates || []).filter(d => visibleEraIds.has(d.era_id)) }))
    : events;
  const datedEvents = allDisplayedEvents.filter(e => e.era_dates && e.era_dates.length > 0);
  const undatedEvents = allDisplayedEvents.filter(e => !e.era_dates || e.era_dates.length === 0);

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

      <TimelineInfoPanel />

      <CurrentDateBanner calData={calData} eras={eras} />

      {/* ── Eras ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Eras</CardTitle>
          <div className="flex items-center gap-2">
            {effectiveIsGm && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => switchEraSort(eraSort === 'custom' ? 'chronological' : 'custom')}
                title={eraSort === 'custom' ? 'Switch to chronological order' : 'Switch to manual order'}
              >
                <ArrowUpDown className="w-3 h-3" />
                {eraSort === 'custom' ? 'Manual' : 'Chronological'}
              </Button>
            )}
            {effectiveIsGm && (
              <Button size="sm" onClick={() => setShowAddEra(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Era
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayedEras.length === 0 && (
            <p className="text-sm text-muted-foreground">No visible eras.</p>
          )}
          {displayedEras.map((era, idx) => (
            <EraRow
              key={era.id}
              era={era}
              eras={eras}
              isGm={effectiveIsGm}
              onUpdate={handleUpdateEra}
              onDelete={handleDeleteEra}
              onToggleVisibility={handleToggleEraVisibility}
              isCustomSort={eraSort === 'custom'}
              onMoveUp={() => moveEra(era.id, 'up')}
              onMoveDown={() => moveEra(era.id, 'down')}
              isFirst={idx === 0}
              isLast={idx === displayedEras.length - 1}
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
          {allDisplayedEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {playerView ? 'No visible events.' : 'No events yet.'}
            </p>
          )}
          {datedEvents.map(event => (
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

          {undatedEvents.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-border" />
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-1">
                  <Clock className="w-3.5 h-3.5" />
                  Unknown Date
                  <span className="text-muted-foreground/60">({undatedEvents.length})</span>
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {!playerView && (
                <p className="text-xs text-muted-foreground pb-1">
                  These events have no era or date assigned. Click <strong>Edit</strong> on any event to select an era and year, which will move it onto the timeline.
                </p>
              )}
              {undatedEvents.map(event => (
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
            </>
          )}
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
