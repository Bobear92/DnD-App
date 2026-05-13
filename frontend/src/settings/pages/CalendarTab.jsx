import { useState, useEffect, useCallback } from 'react';
import settingsService from '../settingsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, CalendarDays, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthLabel(month) {
  return month.name && month.name.trim() ? month.name : `Month ${month.order_index}`;
}

// ── Landing page (no calendar yet) ───────────────────────────────────────────

function CalendarLanding({ onSetUp, isGm }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: 'Campaign Calendar', days_per_month: 30 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isGm) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No calendar has been set up for this campaign yet.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    setSaving(true);
    setError('');
    try {
      const cal = await onSetUp(form);
      return cal;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create calendar');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="text-center mb-8">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 text-primary" />
        <h2 className="text-xl font-bold mb-2">Campaign Calendar</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Give your world its own sense of time. Name each month, group them into seasons,
          decide how many days each month has, and optionally name the days of the week.
        </p>
        <ul className="text-sm text-muted-foreground text-left inline-block space-y-1 mb-6">
          <li>• 12 months per year</li>
          <li>• 30 days per month</li>
          <li>• 4 seasons: Spring, Summer, Fall, Winter (3 months each)</li>
          <li>• Named weekdays: off by default (opt-in)</li>
        </ul>
      </div>

      {!showForm ? (
        <div className="text-center">
          <Button onClick={() => setShowForm(true)}>Set Up Calendar</Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-1">
              <Label>Calendar name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Campaign Calendar"
              />
            </div>
            <div className="space-y-1">
              <Label>Days per month</Label>
              <Input
                type="number"
                min={1}
                value={form.days_per_month}
                onChange={e => setForm(f => ({ ...f, days_per_month: Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !form.name.trim()}>
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

// ── Season row ────────────────────────────────────────────────────────────────

function SeasonRow({ season, isGm, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(season.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(season.id, { name });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      {editing ? (
        <>
          <Input
            className="h-8 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setName(season.name); setEditing(false); } }}
            autoFocus
          />
          <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setName(season.name); setEditing(false); }}>Cancel</Button>
        </>
      ) : (
        <>
          <span
            className={cn('flex-1 text-sm', isGm && 'cursor-pointer hover:text-primary')}
            onClick={isGm ? () => setEditing(true) : undefined}
          >
            {season.name}
          </span>
          {isGm && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0"
              onClick={() => onDelete(season.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ── Weekday row ───────────────────────────────────────────────────────────────

function WeekdayRow({ weekday, isGm, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(weekday.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(weekday.id, { name });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-xs text-muted-foreground w-6 shrink-0">{weekday.order_index}</span>
      {editing ? (
        <>
          <Input
            className="h-8 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setName(weekday.name); setEditing(false); } }}
            autoFocus
          />
          <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setName(weekday.name); setEditing(false); }}>Cancel</Button>
        </>
      ) : (
        <>
          <span
            className={cn('flex-1 text-sm', isGm && 'cursor-pointer hover:text-primary')}
            onClick={isGm ? () => setEditing(true) : undefined}
          >
            {weekday.name}
          </span>
          {isGm && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 w-7 p-0"
              onClick={() => onDelete(weekday.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CalendarTab({ campaignId, isGm }) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  // General settings draft
  const [generalDraft, setGeneralDraft] = useState(null);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalDirty, setGeneralDirty] = useState(false);

  // Add season
  const [newSeason, setNewSeason] = useState('');
  const [addingSeason, setAddingSeason] = useState(false);

  // Add weekday
  const [newWeekday, setNewWeekday] = useState('');
  const [addingWeekday, setAddingWeekday] = useState(false);

  // Current date draft
  const [dateDraft, setDateDraft] = useState({ era_id: '__none__', year: '', month_order: '', day: '' });
  const [dateSaving, setDateSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cal = await settingsService.getCalendar(campaignId);
      applyCalendar(cal);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to load calendar');
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  function applyCalendar(cal) {
    setCalendar(cal);
    setNotFound(false);
    setGeneralDraft({
      name: cal.name,
      days_per_month: cal.days_per_month,
      use_weeks: cal.use_weeks,
      days_per_week: cal.days_per_week ?? '',
    });
    setGeneralDirty(false);
    setDateDraft({
      era_id: cal.current_era_id != null ? String(cal.current_era_id) : '__none__',
      year: cal.current_year ?? '',
      month_order: cal.current_month_order ?? '',
      day: cal.current_day ?? '',
    });
  }

  // ── Create calendar (landing → management) ─────────────────────────────────

  const handleSetUp = async (formData) => {
    const cal = await settingsService.createCalendar(campaignId, formData);
    applyCalendar(cal);
    return cal;
  };

  // ── General settings ───────────────────────────────────────────────────────

  const handleGeneralChange = (field, value) => {
    setGeneralDraft(d => ({ ...d, [field]: value }));
    setGeneralDirty(true);
  };

  const handleGeneralSave = async () => {
    setGeneralSaving(true);
    setError('');
    try {
      const payload = {
        name: generalDraft.name,
        days_per_month: Number(generalDraft.days_per_month),
        use_weeks: generalDraft.use_weeks,
        days_per_week: generalDraft.use_weeks && generalDraft.days_per_week
          ? Number(generalDraft.days_per_week)
          : null,
      };
      const cal = await settingsService.updateCalendar(campaignId, payload);
      applyCalendar(cal);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save calendar');
    } finally {
      setGeneralSaving(false);
    }
  };

  // ── Seasons ────────────────────────────────────────────────────────────────

  const handleSeedDefaultSeasons = async () => {
    setError('');
    const DEFAULT_SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
    try {
      const created = [];
      for (let i = 0; i < DEFAULT_SEASONS.length; i++) {
        const s = await settingsService.createSeason(campaignId, {
          name: DEFAULT_SEASONS[i],
          order_index: i + 1,
        });
        created.push(s);
      }
      setCalendar(c => ({ ...c, seasons: [...c.seasons, ...created] }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add default seasons');
    }
  };

  const handleAddSeason = async () => {
    if (!newSeason.trim()) return;
    setAddingSeason(true);
    try {
      const next = (calendar.seasons.length ? Math.max(...calendar.seasons.map(s => s.order_index)) : 0) + 1;
      const season = await settingsService.createSeason(campaignId, { name: newSeason.trim(), order_index: next });
      setCalendar(c => ({ ...c, seasons: [...c.seasons, season] }));
      setNewSeason('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add season');
    } finally {
      setAddingSeason(false);
    }
  };

  const handleUpdateSeason = async (seasonId, data) => {
    const updated = await settingsService.updateSeason(campaignId, seasonId, data);
    setCalendar(c => ({ ...c, seasons: c.seasons.map(s => s.id === seasonId ? updated : s) }));
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!window.confirm('Delete this season? Months assigned to it will become unassigned.')) return;
    try {
      await settingsService.deleteSeason(campaignId, seasonId);
      setCalendar(c => ({
        ...c,
        seasons: c.seasons.filter(s => s.id !== seasonId),
        months: c.months.map(m => m.season_id === seasonId ? { ...m, season_id: null } : m),
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete season');
    }
  };

  // ── Months ─────────────────────────────────────────────────────────────────

  const handleUpdateMonth = async (monthId, data) => {
    try {
      const updated = await settingsService.updateMonth(campaignId, monthId, data);
      setCalendar(c => ({ ...c, months: c.months.map(m => m.id === monthId ? updated : m) }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update month');
    }
  };

  const handleAddMonth = async () => {
    try {
      const next = calendar.months.length
        ? Math.max(...calendar.months.map(m => m.order_index)) + 1
        : 1;
      const month = await settingsService.createMonth(campaignId, { order_index: next });
      setCalendar(c => ({ ...c, months: [...c.months, month] }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add month');
    }
  };

  const handleDeleteMonth = async (monthId) => {
    if (!window.confirm('Delete this month?')) return;
    try {
      await settingsService.deleteMonth(campaignId, monthId);
      setCalendar(c => ({ ...c, months: c.months.filter(m => m.id !== monthId) }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete month');
    }
  };

  // ── Weekdays ───────────────────────────────────────────────────────────────

  const handleAddWeekday = async () => {
    if (!newWeekday.trim()) return;
    setAddingWeekday(true);
    try {
      const next = (calendar.weekdays.length ? Math.max(...calendar.weekdays.map(w => w.order_index)) : 0) + 1;
      const wd = await settingsService.createWeekday(campaignId, { name: newWeekday.trim(), order_index: next });
      setCalendar(c => ({ ...c, weekdays: [...c.weekdays, wd] }));
      setNewWeekday('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add weekday');
    } finally {
      setAddingWeekday(false);
    }
  };

  const handleUpdateWeekday = async (weekdayId, data) => {
    const updated = await settingsService.updateWeekday(campaignId, weekdayId, data);
    setCalendar(c => ({ ...c, weekdays: c.weekdays.map(w => w.id === weekdayId ? updated : w) }));
  };

  const handleDeleteWeekday = async (weekdayId) => {
    if (!window.confirm('Delete this weekday?')) return;
    try {
      await settingsService.deleteWeekday(campaignId, weekdayId);
      setCalendar(c => ({ ...c, weekdays: c.weekdays.filter(w => w.id !== weekdayId) }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete weekday');
    }
  };

  // ── Current date ───────────────────────────────────────────────────────────

  const handleSetDate = async () => {
    setDateSaving(true);
    setError('');
    try {
      const payload = {
        current_era_id: dateDraft.era_id !== '__none__' ? Number(dateDraft.era_id) : null,
        current_year: dateDraft.year !== '' ? Number(dateDraft.year) : null,
        current_month_order: dateDraft.month_order !== '' ? Number(dateDraft.month_order) : null,
        current_day: dateDraft.day !== '' ? Number(dateDraft.day) : null,
      };
      const cal = await settingsService.updateCalendar(campaignId, payload);
      applyCalendar(cal);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set date');
    } finally {
      setDateSaving(false);
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

  if (notFound) {
    return <CalendarLanding onSetUp={handleSetUp} isGm={isGm} />;
  }

  if (error && !calendar) {
    return <p className="text-destructive p-4">{error}</p>;
  }

  const sortedSeasons = [...(calendar.seasons || [])].sort((a, b) => a.order_index - b.order_index);
  const sortedMonths = [...(calendar.months || [])].sort((a, b) => a.order_index - b.order_index);
  const sortedWeekdays = [...(calendar.weekdays || [])].sort((a, b) => a.order_index - b.order_index);
  const eras = calendar.eras || [];

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-3">{error}</p>}

      {/* ── General ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Calendar name</Label>
              <Input
                value={generalDraft?.name ?? ''}
                onChange={e => handleGeneralChange('name', e.target.value)}
                disabled={!isGm}
              />
            </div>
            <div className="space-y-1">
              <Label>Days per month</Label>
              <Input
                type="number"
                min={1}
                value={generalDraft?.days_per_month ?? ''}
                onChange={e => handleGeneralChange('days_per_month', e.target.value)}
                disabled={!isGm}
              />
            </div>
          </div>

          {/* use_weeks toggle */}
          {isGm && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleGeneralChange('use_weeks', !generalDraft?.use_weeks)}
                className="text-primary"
                aria-label="Toggle named weekdays"
              >
                {generalDraft?.use_weeks
                  ? <ToggleRight className="w-8 h-8" />
                  : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              </button>
              <span className="text-sm">My calendar uses named weekdays</span>
              {generalDraft?.use_weeks && (
                <div className="flex items-center gap-2 ml-4">
                  <Label className="text-sm shrink-0">Days per week</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-20 h-8"
                    value={generalDraft?.days_per_week ?? ''}
                    onChange={e => handleGeneralChange('days_per_week', e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          {!isGm && (
            <p className="text-sm text-muted-foreground">
              Named weekdays: {calendar.use_weeks ? `enabled (${calendar.days_per_week} days per week)` : 'disabled'}
            </p>
          )}

          {isGm && generalDirty && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleGeneralSave} disabled={generalSaving}>
                {generalSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Seasons ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seasons</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSeasons.length === 0 && isGm && (
            <div className="flex items-center gap-3 mb-3">
              <p className="text-sm text-muted-foreground">No seasons yet.</p>
              <Button size="sm" variant="outline" onClick={handleSeedDefaultSeasons}>
                Use defaults (Spring, Summer, Fall, Winter)
              </Button>
            </div>
          )}
          {sortedSeasons.length === 0 && !isGm && (
            <p className="text-sm text-muted-foreground mb-3">No seasons yet.</p>
          )}
          <div className="divide-y divide-border">
            {sortedSeasons.map(season => (
              <SeasonRow
                key={season.id}
                season={season}
                isGm={isGm}
                onUpdate={handleUpdateSeason}
                onDelete={handleDeleteSeason}
              />
            ))}
          </div>
          {isGm && (
            <div className="flex gap-2 mt-3">
              <Input
                className="h-8 text-sm"
                placeholder="New season name"
                value={newSeason}
                onChange={e => setNewSeason(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSeason()}
              />
              <Button size="sm" onClick={handleAddSeason} disabled={addingSeason || !newSeason.trim()}>
                {addingSeason ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Months ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedMonths.length > 0 && (
              <div className="flex items-center gap-3 pb-1 mb-1 border-b border-border text-xs font-medium text-muted-foreground">
                <span className="w-8 shrink-0 text-right">#</span>
                <span className="flex-1">Month name (leave blank to display as "Month N")</span>
                <span className="w-36 shrink-0">Season</span>
              </div>
            )}
            {sortedMonths.map(month => (
              <MonthRow
                key={month.id}
                month={month}
                seasons={sortedSeasons}
                isGm={isGm}
                onUpdate={(data) => handleUpdateMonth(month.id, data)}
                onDelete={handleDeleteMonth}
              />
            ))}
            {sortedMonths.length === 0 && (
              <p className="text-sm text-muted-foreground mb-3">No months configured.</p>
            )}
            {isGm && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={handleAddMonth}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Month
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Weekdays (conditional) ─────────────────────────────────────────── */}
      {(calendar.use_weeks || (isGm && generalDraft?.use_weeks)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekdays</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedWeekdays.length === 0 && (
              <p className="text-sm text-muted-foreground mb-3">No weekdays yet.</p>
            )}
            <div className="divide-y divide-border">
              {sortedWeekdays.map(wd => (
                <WeekdayRow
                  key={wd.id}
                  weekday={wd}
                  isGm={isGm}
                  onUpdate={handleUpdateWeekday}
                  onDelete={handleDeleteWeekday}
                />
              ))}
            </div>
            {isGm && (
              <div className="flex gap-2 mt-3">
                <Input
                  className="h-8 text-sm"
                  placeholder="New weekday name"
                  value={newWeekday}
                  onChange={e => setNewWeekday(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddWeekday()}
                />
                <Button size="sm" onClick={handleAddWeekday} disabled={addingWeekday || !newWeekday.trim()}>
                  {addingWeekday ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Current Date ──────────────────────────────────────────────────── */}
      {isGm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <Label>Era</Label>
                <Select
                  value={dateDraft.era_id}
                  onValueChange={v => setDateDraft(d => ({ ...d, era_id: v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select era" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {eras.map(era => (
                      <SelectItem key={era.id} value={String(era.id)}>{era.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input
                  type="number"
                  className="h-9"
                  value={dateDraft.year}
                  onChange={e => setDateDraft(d => ({ ...d, year: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Month</Label>
                <Select
                  value={dateDraft.month_order !== '' ? String(dateDraft.month_order) : '__none__'}
                  onValueChange={v => setDateDraft(d => ({ ...d, month_order: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {sortedMonths.map(m => (
                      <SelectItem key={m.id} value={String(m.order_index)}>{monthLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Day</Label>
                <Input
                  type="number"
                  className="h-9"
                  min={1}
                  max={calendar.days_per_month}
                  value={dateDraft.day}
                  onChange={e => setDateDraft(d => ({ ...d, day: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSetDate} disabled={dateSaving}>
                {dateSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Set Current Date
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Month row (defined after main to keep file readable) ───────────────────────

function MonthRow({ month, seasons, isGm, onUpdate, onDelete }) {
  const [name, setName] = useState(month.name ?? '');
  const [seasonId, setSeasonId] = useState(
    month.season_id != null ? String(month.season_id) : '__none__'
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: name.trim() || null,
        season_id: seasonId !== '__none__' ? Number(seasonId) : null,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-muted-foreground w-8 shrink-0 text-right">
        {month.order_index}
      </span>
      <Input
        className="h-8 text-sm"
        placeholder={`Month ${month.order_index}`}
        value={name}
        onChange={e => { setName(e.target.value); setDirty(true); }}
        disabled={!isGm}
      />
      <Select
        value={seasonId}
        onValueChange={v => { setSeasonId(v); setDirty(true); }}
        disabled={!isGm}
      >
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Season" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— No season —</SelectItem>
          {seasons.map(s => (
            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isGm && dirty && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
        </Button>
      )}
      {isGm && onDelete && (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive h-7 w-7 p-0 shrink-0"
          onClick={() => onDelete(month.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
