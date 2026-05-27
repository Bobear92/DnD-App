import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import encyclopediaService from '../encyclopediaService';

const SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];

const LEVEL_LABELS = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd',
  4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

const EMPTY = {
  name: '',
  level: 0,
  school: 'Evocation',
  casting_time: '1 action',
  range: '',
  components: '',
  duration: '',
  description: '',
  higher_level: '',
  ritual: false,
  concentration: false,
  classes: '',
};

export default function SpellEditPage() {
  const { campaignId, spellId } = useParams();
  const navigate = useNavigate();
  const isNew = spellId === 'new';

  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return;
    encyclopediaService.getSpell(spellId).then((data) => {
      const filled = {
        name: data.name ?? '',
        level: data.level ?? 0,
        school: data.school ?? 'Evocation',
        casting_time: data.casting_time ?? '',
        range: data.range ?? '',
        components: data.components ?? '',
        duration: data.duration ?? '',
        description: data.description ?? '',
        higher_level: data.higher_level ?? '',
        ritual: data.ritual ?? false,
        concentration: data.concentration ?? false,
        classes: data.classes ?? '',
      };
      setForm(filled);
      setOriginal(filled);
      setLoading(false);
    }).catch(() => {
      setError('Spell not found.');
      setLoading(false);
    });
  }, [spellId, isNew]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const isDirty = JSON.stringify(form) !== JSON.stringify(original ?? EMPTY);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Spell name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const created = await encyclopediaService.createSpell({
          ...form,
          higher_level: form.higher_level || null,
          owner_type: 'campaign',
          owner_id: parseInt(campaignId),
        });
        navigate(`/campaigns/${campaignId}/encyclopedia/spells/${created.id}`, { replace: true });
      } else {
        await encyclopediaService.updateSpell(spellId, {
          ...form,
          higher_level: form.higher_level || null,
        });
        setOriginal(form);
      }
    } catch (e) {
      setError(e?.response?.data?.detail ?? 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      await encyclopediaService.deleteSpell(spellId);
      navigate(`/campaigns/${campaignId}/encyclopedia`, { replace: true });
    } catch {
      setError('Delete failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading spell…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Encyclopedia
        </Button>
        <div className="flex-1" />
        {!isNew && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            data-testid="delete-spell-page-btn"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || (!isDirty && !isNew)}
          data-testid="save-spell-btn"
        >
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving…' : isNew ? 'Create Spell' : 'Save Changes'}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {isNew ? 'New Homebrew Spell' : `Edit: ${original?.name ?? ''}`}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-violet-600 text-white text-xs">Campaign Spell</Badge>
          {!isNew && <span className="text-xs text-muted-foreground">Changes only affect this campaign.</span>}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Form sections */}
      <div className="space-y-6">
        {/* Identity */}
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold text-sm">Identity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Spell name"
                data-testid="spell-name-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">Level</Label>
              <select
                id="level"
                value={form.level}
                onChange={(e) => set('level', parseInt(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="spell-level-select"
              >
                {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="school">School</Label>
              <select
                id="school"
                value={form.school}
                onChange={(e) => set('school', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="spell-school-select"
              >
                {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.ritual}
                onChange={(e) => set('ritual', e.target.checked)}
                className="rounded"
                data-testid="ritual-checkbox"
              />
              Ritual
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.concentration}
                onChange={(e) => set('concentration', e.target.checked)}
                className="rounded"
                data-testid="concentration-checkbox"
              />
              Concentration
            </label>
          </div>
        </section>

        {/* Casting */}
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold text-sm">Casting</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="casting_time">Casting Time</Label>
              <Input
                id="casting_time"
                value={form.casting_time}
                onChange={(e) => set('casting_time', e.target.value)}
                placeholder="1 action"
                data-testid="spell-casting-time-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                value={form.range}
                onChange={(e) => set('range', e.target.value)}
                placeholder="60 feet"
                data-testid="spell-range-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="components">Components</Label>
              <Input
                id="components"
                value={form.components}
                onChange={(e) => set('components', e.target.value)}
                placeholder="V, S, M (a pinch of dust)"
                data-testid="spell-components-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                placeholder="Instantaneous"
                data-testid="spell-duration-input"
              />
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold text-sm">Description</h2>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Spell description…"
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              data-testid="spell-description-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="higher_level">At Higher Levels <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <textarea
              id="higher_level"
              value={form.higher_level}
              onChange={(e) => set('higher_level', e.target.value)}
              placeholder="When you cast this spell using a spell slot of 2nd level or higher…"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              data-testid="spell-higher-level-input"
            />
          </div>
        </section>

        {/* Availability */}
        <section className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold text-sm">Availability</h2>
          <div className="space-y-1.5">
            <Label htmlFor="classes">Available to Classes</Label>
            <Input
              id="classes"
              value={form.classes}
              onChange={(e) => set('classes', e.target.value)}
              placeholder="Wizard, Sorcerer, Bard"
              data-testid="spell-classes-input"
            />
            <p className="text-xs text-muted-foreground">Comma-separated class names.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
