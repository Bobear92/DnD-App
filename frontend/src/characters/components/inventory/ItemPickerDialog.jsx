import { useState, useEffect } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import itemService from '@/encyclopedia/itemService';

/**
 * Picks an encyclopedia item (system + campaign) for a single category and hands
 * the chosen item to onAdd. Used by the CharacterDetail Items tab to add inventory.
 */
export default function ItemPickerDialog({ category, campaignId, open, onClose, onAdd, filter }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSearch('');
    itemService.getItems(category.id, campaignId).then((d) => {
      setItems(d);
      setLoading(false);
    });
  }, [open, category.id, campaignId]);

  // Optional `filter` restricts the fetched catalog (e.g. the gear catalog → only
  // ammunition) before the search box narrows it further.
  const base = filter ? items.filter(filter) : items;
  const filtered = search
    ? base.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : base;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add {category.singular}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={`Search ${category.label.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
            data-testid="item-picker-search"
          />
        </div>
        <div className="flex-1 overflow-y-auto -mx-2">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2 text-sm">
              <Package className="h-7 w-7 opacity-30" />
              <span>No {category.label.toLowerCase()} found.</span>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onAdd(item); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  data-testid={`item-picker-option-${item.id}`}
                >
                  <div className={cn('w-1.5 h-8 rounded-full shrink-0', category.accent)} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {item.name}
                      {item.owner_type === 'campaign' && <span className="ml-1 text-xs text-violet-600">(Campaign)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{category.subtitle(item)}</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
