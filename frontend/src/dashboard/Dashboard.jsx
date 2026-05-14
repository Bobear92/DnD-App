import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../shared/components/layout/MainLayout';
import { useCampaign } from '../campaigns/CampaignContext';
import settingsService from '../settings/settingsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Loader2, Users } from 'lucide-react';

function monthLabel(month) {
  return month.name && month.name.trim() ? month.name : `Month ${month.order_index}`;
}

function formatCurrentDate(calendar) {
  if (!calendar) return null;
  const { current_day, current_month_order, current_year, current_era_id, months, eras } = calendar;

  if (current_day == null && current_month_order == null && current_year == null) return null;

  const parts = [];

  if (current_day != null) parts.push(`Day ${current_day}`);

  if (current_month_order != null && months?.length) {
    const month = months.find(m => m.order_index === current_month_order);
    if (month) parts.push(monthLabel(month));
  }

  if (current_year != null) {
    let yearStr = `Year ${current_year}`;
    if (current_era_id != null && eras?.length) {
      const era = eras.find(e => e.id === current_era_id);
      if (era) yearStr += ` ${era.abbreviation}`;
    }
    parts.push(yearStr);
  }

  return parts.join(', ');
}

function initDateDraft(cal) {
  return {
    era_id: cal?.current_era_id != null ? String(cal.current_era_id) : '__none__',
    year: cal?.current_year ?? '',
    month_order: cal?.current_month_order != null ? String(cal.current_month_order) : '__none__',
    day: cal?.current_day ?? '',
  };
}

export default function Dashboard() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [calendar, setCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [noCalendar, setNoCalendar] = useState(false);

  const [playerView, setPlayerView] = useState(false);

  const [dateDraft, setDateDraft] = useState(initDateDraft(null));
  const [dateSaving, setDateSaving] = useState(false);
  const [dateError, setDateError] = useState('');

  const loadCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const cal = await settingsService.getCalendar(campaignId);
      setCalendar(cal);
      setNoCalendar(false);
      setDateDraft(initDateDraft(cal));
    } catch (err) {
      if (err.response?.status === 404) {
        setNoCalendar(true);
      }
    } finally {
      setCalendarLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const handleSaveDate = async () => {
    setDateSaving(true);
    setDateError('');
    try {
      const payload = {
        current_era_id: dateDraft.era_id !== '__none__' ? Number(dateDraft.era_id) : null,
        current_year: dateDraft.year !== '' ? Number(dateDraft.year) : null,
        current_month_order: dateDraft.month_order !== '__none__' ? Number(dateDraft.month_order) : null,
        current_day: dateDraft.day !== '' ? Number(dateDraft.day) : null,
      };
      const cal = await settingsService.updateCalendar(campaignId, payload);
      setCalendar(cal);
      setDateDraft(initDateDraft(cal));
    } catch (err) {
      setDateError(err.response?.data?.detail || 'Failed to save date');
    } finally {
      setDateSaving(false);
    }
  };

  const sortedMonths = [...(calendar?.months || [])].sort((a, b) => a.order_index - b.order_index);
  const eras = calendar?.eras || [];
  const dateDisplay = formatCurrentDate(calendar);

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {isGm && playerView && (
              <p className="text-sm text-muted-foreground mt-0.5">Previewing as player</p>
            )}
          </div>
          {isGm && (
            <Button
              variant={playerView ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPlayerView(v => !v)}
            >
              <Users className="w-4 h-4 mr-2" />
              Player View
            </Button>
          )}
        </div>

        {/* ── Current Date ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-4 h-4" />
              Current Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : noCalendar ? (
              <p className="text-sm text-muted-foreground">
                No calendar has been set up for this campaign.
                {isGm && ' Go to Campaign Time → Calendar to get started.'}
              </p>
            ) : (
              <div className="space-y-4">
                {dateDisplay ? (
                  <p className="text-2xl font-semibold tracking-tight">{dateDisplay}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No current date has been set.
                    {isGm && !playerView && ' Use the form below to set it.'}
                  </p>
                )}

                {/* GM: advance date form */}
                {isGm && !playerView && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {dateDisplay ? 'Advance Date' : 'Set Date'}
                    </p>
                    {dateError && <p className="text-sm text-destructive">{dateError}</p>}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Era</Label>
                        <Select
                          value={dateDraft.era_id}
                          onValueChange={v => setDateDraft(d => ({ ...d, era_id: v }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="None" />
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
                        <Label className="text-xs">Year</Label>
                        <Input
                          type="number"
                          className="h-8 text-sm"
                          value={dateDraft.year}
                          onChange={e => setDateDraft(d => ({ ...d, year: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Month</Label>
                        <Select
                          value={dateDraft.month_order}
                          onValueChange={v => setDateDraft(d => ({ ...d, month_order: v }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="None" />
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
                        <Label className="text-xs">Day</Label>
                        <Input
                          type="number"
                          className="h-8 text-sm"
                          min={1}
                          max={calendar?.days_per_month}
                          value={dateDraft.day}
                          onChange={e => setDateDraft(d => ({ ...d, day: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleSaveDate} disabled={dateSaving}>
                        {dateSaving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                        Save Date
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
