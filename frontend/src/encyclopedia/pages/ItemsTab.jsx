import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import itemService from '../itemService';
import WeaponPropertyBadges from '../../characters/components/WeaponPropertyBadges';
import { weaponBadges } from '../../characters/components/weaponPropertyData';

function distinct(items, key) {
  return [...new Set(items.map((it) => it[key]).filter((v) => v != null && v !== ''))].sort();
}

function ItemDetailDialog({ category, item, isGm, campaignId, onClose, onOverrideCreated }) {
  const navigate = useNavigate();
  const [overriding, setOverriding] = useState(false);
  const [error, setError] = useState('');

  if (!item) return null;

  const isCampaignOverride = item.owner_type === 'campaign';
  const body = item[category.bodyKey];

  const handleOverride = async () => {
    setOverriding(true);
    setError('');
    try {
      const payload = { owner_type: 'campaign', owner_id: parseInt(campaignId) };
      for (const f of category.fields) payload[f.key] = item[f.key] ?? category.empty[f.key];
      const created = await itemService.createItem(category.id, payload);
      onOverrideCreated?.();
      navigate(`/campaigns/${campaignId}/encyclopedia/items/${category.id}/${created.id}`);
    } catch (e) {
      const msg = e?.response?.data?.detail;
      if (typeof msg === 'string' && msg.includes('already exists')) {
        setError(`A campaign override for this ${category.singular.toLowerCase()} already exists. Find it in the Campaign tab.`);
      } else {
        setError('Failed to create override. Please try again.');
      }
      setOverriding(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="text-xl">{item.name}</DialogTitle>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {isCampaignOverride && (
                <Badge className="bg-violet-600 text-white text-xs">Campaign Override</Badge>
              )}
              {category.badges(item).map((b) => (
                <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 rounded-lg bg-muted/50">
            {category.stats.map(({ label, get }) => {
              const value = get(item);
              if (!value) return null;
              return (
                <div key={label}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                  <div>{value}</div>
                </div>
              );
            })}
          </div>

          {category.explainWeaponProperties && weaponBadges(item).length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Attributes — tap to learn what they mean
              </div>
              <WeaponPropertyBadges badges={weaponBadges(item)} />
            </div>
          )}

          {body && (
            <div className="whitespace-pre-wrap leading-relaxed text-foreground">{body}</div>
          )}

          {isGm && !isCampaignOverride && (
            <div className="border-t pt-3">
              {error && <p className="text-xs text-destructive mb-2">{error}</p>}
              <Button
                size="sm"
                variant="outline"
                onClick={handleOverride}
                disabled={overriding}
                data-testid="override-item-btn"
              >
                {overriding ? 'Creating override…' : 'Override for this Campaign'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Creates a campaign copy you can edit freely. Players will see your version.
              </p>
            </div>
          )}

          {isGm && isCampaignOverride && (
            <div className="border-t pt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia/items/${category.id}/${item.id}`)}
                data-testid="edit-override-btn"
              >
                Edit this Override
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ItemsTab({ category, isGm, campaignId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    itemService.getItems(category.id, campaignId).then((data) => {
      setItems(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    setSearch('');
    setFilterValues({});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, campaignId]);

  const filterOptions = useMemo(
    () => category.filters.map((f) => ({ ...f, values: distinct(items, f.key) })),
    [items, category.filters]
  );

  const filtered = items.filter((it) => {
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    for (const f of category.filters) {
      const want = filterValues[f.key];
      if (want && want !== 'All' && it[f.key] !== want) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter bar */}
      <div className="shrink-0 p-4 border-b border-border flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={`Search ${category.label.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
            data-testid="item-search"
          />
        </div>
        {filterOptions.map((f) => (
          <select
            key={f.key}
            value={filterValues[f.key] ?? 'All'}
            onChange={(e) => setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            data-testid={`item-filter-${f.key}`}
          >
            <option value="All">{f.allLabel}</option>
            {f.values.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading {category.label.toLowerCase()}…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <Package className="h-8 w-8 opacity-30" />
            <span>No {category.label.toLowerCase()} match your filters.</span>
          </div>
        ) : (
          <div data-testid="item-list">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b">
              {filtered.length} {filtered.length === 1 ? category.singular.toLowerCase() : category.label.toLowerCase()}
            </div>
            <div className="divide-y">
              {filtered.map((item) => {
                const isCampaignOverride = item.owner_type === 'campaign';
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    data-testid={`item-row-${item.id}`}
                  >
                    <div className={cn('w-1.5 h-8 rounded-full shrink-0', category.accent)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.name}</span>
                        {isCampaignOverride && (
                          <span className="text-xs text-violet-600 font-medium">(Campaign)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{category.subtitle(item)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {category.badges(item).map((b) => (
                        <span key={b} className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-foreground">
                          {b}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ItemDetailDialog
        category={category}
        item={selected}
        isGm={isGm}
        campaignId={campaignId}
        onClose={() => setSelected(null)}
        onOverrideCreated={load}
      />
    </div>
  );
}
