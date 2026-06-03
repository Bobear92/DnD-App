import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getItemCategory } from '../data/itemCategories';
import itemService from '../itemService';

function buildPayload(category, form) {
  const out = {};
  for (const f of category.fields) {
    let v = form[f.key];
    if (f.type === 'number') {
      if (v === '' || v === null || v === undefined) v = null;
      else {
        const n = parseInt(v, 10);
        v = Number.isNaN(n) ? null : n;
      }
    } else if (f.type === 'checkbox') {
      v = !!v;
    } else {
      v = v ?? '';
    }
    out[f.key] = v;
  }
  return out;
}

export default function ItemEditPage() {
  const { campaignId, category: categoryId, itemId } = useParams();
  const navigate = useNavigate();
  const category = getItemCategory(categoryId);
  const isNew = itemId === 'new';

  const [form, setForm] = useState(category ? { ...category.empty } : {});
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!category || isNew) return;
    itemService.getItem(category.id, itemId).then((data) => {
      const filled = {};
      for (const f of category.fields) filled[f.key] = data[f.key] ?? category.empty[f.key];
      setForm(filled);
      setOriginal(filled);
      setLoading(false);
    }).catch(() => {
      setError('Item not found.');
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, itemId, isNew]);

  if (!category) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Unknown item category.
      </div>
    );
  }

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const isDirty = JSON.stringify(form) !== JSON.stringify(original ?? category.empty);

  const validate = () => {
    for (const f of category.fields) {
      if (!f.required) continue;
      const v = form[f.key];
      if (f.type === 'number') {
        if (v === '' || v === null || v === undefined || Number.isNaN(parseInt(v, 10))) {
          return `${f.label} is required.`;
        }
      } else if (typeof v !== 'string' || !v.trim()) {
        return `${f.label} is required.`;
      }
    }
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError('');
    try {
      const payload = buildPayload(category, form);
      if (isNew) {
        const created = await itemService.createItem(category.id, {
          ...payload,
          owner_type: 'campaign',
          owner_id: parseInt(campaignId),
        });
        navigate(`/campaigns/${campaignId}/encyclopedia/items/${category.id}/${created.id}`, { replace: true });
      } else {
        await itemService.updateItem(category.id, itemId, payload);
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
      await itemService.deleteItem(category.id, itemId);
      navigate(`/campaigns/${campaignId}/encyclopedia`, { replace: true });
    } catch {
      setError('Delete failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading {category.singular.toLowerCase()}…
      </div>
    );
  }

  const renderField = (f) => {
    const common = {
      id: f.key,
      'data-testid': `item-${f.key}-input`,
    };
    if (f.type === 'textarea') {
      return (
        <textarea
          {...common}
          value={form[f.key] ?? ''}
          onChange={(e) => set(f.key, e.target.value)}
          placeholder={f.placeholder}
          rows={f.key === category.bodyKey ? 6 : 3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
        />
      );
    }
    if (f.type === 'select') {
      return (
        <select
          {...common}
          value={form[f.key] ?? ''}
          onChange={(e) => set(f.key, e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (f.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 cursor-pointer text-sm h-9">
          <input
            {...common}
            type="checkbox"
            checked={!!form[f.key]}
            onChange={(e) => set(f.key, e.target.checked)}
            className="rounded"
          />
          {f.label}
        </label>
      );
    }
    return (
      <Input
        {...common}
        type={f.type === 'number' ? 'number' : 'text'}
        value={form[f.key] ?? ''}
        onChange={(e) => set(f.key, e.target.value)}
        placeholder={f.placeholder}
      />
    );
  };

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
            data-testid="delete-item-page-btn"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || (!isDirty && !isNew)}
          data-testid="save-item-btn"
        >
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving…' : isNew ? `Create ${category.singular}` : 'Save Changes'}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {isNew ? `New Homebrew ${category.singular}` : `Edit: ${original?.name ?? ''}`}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge className="bg-violet-600 text-white text-xs">Campaign {category.singular}</Badge>
          {!isNew && <span className="text-xs text-muted-foreground">Changes only affect this campaign.</span>}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Fields */}
      <section className="rounded-lg border p-4 grid grid-cols-2 gap-4">
        {category.fields.map((f) => {
          const checkbox = f.type === 'checkbox';
          const fullWidth = f.type === 'textarea' || (!f.half && !checkbox);
          return (
            <div key={f.key} className={fullWidth ? 'col-span-2 space-y-1.5' : 'space-y-1.5'}>
              {!checkbox && (
                <Label htmlFor={f.key}>
                  {f.label}{f.required && <span className="text-destructive"> *</span>}
                </Label>
              )}
              {renderField(f)}
            </div>
          );
        })}
      </section>
    </div>
  );
}
