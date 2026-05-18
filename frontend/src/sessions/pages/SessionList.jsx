import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import { useCampaign } from '../../campaigns/CampaignContext';
import sessionService from '../sessionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Eye, EyeOff, Trash2, Clock, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDateRange(session) {
  const { day, month_order, end_day, end_month_order, era_dates = [] } = session;
  if (day == null && !month_order) return null;

  // Use backend-computed month name from era_dates; fall back to raw ordinal
  const startMonthName = era_dates[0]?.month_name ?? (month_order ? `Month ${month_order}` : null);
  const endMonthName = (end_month_order && end_month_order !== month_order)
    ? `Month ${end_month_order}` : null;

  const sameMo = !end_month_order || end_month_order === month_order;
  const hasRange = end_day != null && end_day !== day;

  if (hasRange && sameMo) {
    return [`Days ${day}–${end_day}`, startMonthName].filter(Boolean).join(', ');
  }
  if (hasRange && !sameMo) {
    const s = [day != null && `Day ${day}`, startMonthName].filter(Boolean).join(' ');
    const e = [end_day != null && `Day ${end_day}`, endMonthName].filter(Boolean).join(' ');
    return `${s} – ${e}`;
  }
  return [day != null && `Day ${day}`, startMonthName].filter(Boolean).join(', ');
}

function EraDateList({ eraDates, prominent }) {
  if (!eraDates || eraDates.length === 0) return null;
  return (
    <span className={cn(prominent ? "text-sm font-semibold text-foreground" : "text-xs text-muted-foreground")}>
      {eraDates.map((ed, i) => (
        <span key={ed.era_id}>
          {i > 0 && <span className="mx-1 opacity-40">·</span>}
          {ed.year} {ed.abbreviation}
        </span>
      ))}
    </span>
  );
}

function SessionCard({ session, isGm, onVisibilityToggle, onDelete, onClick }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow relative group"
      onClick={() => onClick(session.id)}
    >
      <CardContent className="p-4">
        {/* GM controls */}
        {isGm && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              className="p-1 rounded hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); onVisibilityToggle(session); }}
              title={session.is_visible_to_players ? 'Hide from players' : 'Show to players'}
            >
              {session.is_visible_to_players
                ? <Eye className="w-4 h-4 text-green-600" />
                : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button
              className="p-1 rounded hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onDelete(session); }}
              title="Delete session"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        )}

        {/* Session number + title */}
        <div className="flex items-start gap-2 mb-1 pr-14">
          {session.session_number != null && (
            <span className="text-xs font-medium text-muted-foreground shrink-0 mt-0.5">
              #{session.session_number}
            </span>
          )}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{session.title}</h3>
        </div>

        {/* Dates row */}
        {!isGm ? (
          <div className="mb-2 space-y-0.5">
            {(session.era_dates?.length > 0 || session.day || session.end_day) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                {formatDateRange(session) && (
                  <span className="text-sm font-semibold">{formatDateRange(session)}</span>
                )}
                {formatDateRange(session) && session.era_dates?.length > 0 && (
                  <span className="opacity-40">·</span>
                )}
                <EraDateList eraDates={session.era_dates} prominent />
              </div>
            )}
            {session.real_world_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {session.real_world_date}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
            {session.real_world_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {session.real_world_date}
              </span>
            )}
            {(session.era_dates?.length > 0 || session.day || session.end_day) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDateRange(session) && <span>{formatDateRange(session)} · </span>}
                <EraDateList eraDates={session.era_dates} />
              </span>
            )}
            {!session.is_visible_to_players && (
              <Badge variant="secondary" className="text-xs h-4 px-1.5">Hidden</Badge>
            )}
          </div>
        )}

        {/* Summary */}
        {session.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2">{session.summary}</p>
        )}
      </CardContent>
    </Card>
  );
}

const EMPTY_FORM = {
  session_number: '',
  title: '',
  real_world_date: '',
  summary: '',
  is_visible_to_players: false,
};

export default function SessionList() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    sessionService.listSessions(campaignId)
      .then(setSessions)
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, [campaignId]);

  function handleVisibilityToggle(session) {
    sessionService.updateVisibility(campaignId, session.id, !session.is_visible_to_players)
      .then(updated => setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, is_visible_to_players: updated.is_visible_to_players } : s)))
      .catch(() => {});
  }

  function handleDelete(session) {
    setDeleteTarget(session);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    sessionService.deleteSession(campaignId, deleteTarget.id)
      .then(() => {
        setSessions(prev => prev.filter(s => s.id !== deleteTarget.id));
        setDeleteTarget(null);
      })
      .catch(() => setDeleteTarget(null));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        is_visible_to_players: form.is_visible_to_players,
      };
      if (form.session_number !== '') payload.session_number = Number(form.session_number);
      if (form.real_world_date) payload.real_world_date = form.real_world_date;
      if (form.summary) payload.summary = form.summary;
      const created = await sessionService.createSession(campaignId, payload);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      navigate(`/campaigns/${campaignId}/sessions/${created.id}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Session Notes</h1>
              <p className="text-sm text-muted-foreground">{campaign?.name}</p>
            </div>
          </div>
          {isGm && (
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Session
            </Button>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No sessions yet</p>
            {isGm && <p className="text-sm mt-1">Create your first session note to get started.</p>}
          </div>
        )}
        {!loading && sessions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                isGm={isGm}
                onVisibilityToggle={handleVisibilityToggle}
                onDelete={handleDelete}
                onClick={(id) => navigate(`/campaigns/${campaignId}/sessions/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setForm(EMPTY_FORM); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Session Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="session_number">Session # (optional)</Label>
                <Input
                  id="session_number"
                  type="number"
                  placeholder="18"
                  value={form.session_number}
                  onChange={e => setForm(f => ({ ...f, session_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="real_world_date">Date Played</Label>
                <Input
                  id="real_world_date"
                  type="date"
                  value={form.real_world_date}
                  onChange={e => setForm(f => ({ ...f, real_world_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                placeholder="Orc Princeling"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                placeholder="Short blurb for the session card…"
                rows={2}
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_visible_to_players}
                onChange={e => setForm(f => ({ ...f, is_visible_to_players: e.target.checked }))}
              />
              Visible to players
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Create & Edit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{deleteTarget?.title}" will be permanently deleted along with all uploaded images.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
