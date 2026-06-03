import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import itemService from '../itemService';

export default function CampaignItemsTab({ category, campaignId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    itemService.getItems(category.id, campaignId).then((all) => {
      setItems(all.filter((it) => it.owner_type === 'campaign'));
      setLoading(false);
    });
  };

  useEffect(() => {
    setSearch('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, campaignId]);

  const filtered = search
    ? items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase()))
    : items;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await itemService.deleteItem(category.id, deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 p-4 border-b border-border flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder={`Search campaign ${category.label.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
            data-testid="campaign-item-search"
          />
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia/items/${category.id}/new`)}
          data-testid="new-homebrew-btn"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Homebrew
        </Button>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-1">
        <p className="text-xs text-muted-foreground">
          Campaign {category.label.toLowerCase()} — overrides of system entries and homebrew you've created.
          Players in this campaign see these instead of the system versions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">No campaign {category.label.toLowerCase()} yet.</p>
            <p className="text-xs text-center max-w-xs">
              Override a system entry from the System tab, or create a homebrew {category.singular.toLowerCase()} from scratch.
            </p>
          </div>
        ) : (
          <div className="divide-y" data-testid="campaign-item-list">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 group">
                <div className={cn('w-1.5 h-8 rounded-full shrink-0', category.accent)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{item.name}</span>
                    <Badge className="text-xs bg-violet-600 text-white">Campaign</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{category.subtitle(item)}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia/items/${category.id}/${item.id}`)}
                    data-testid={`edit-item-${item.id}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                    data-testid={`delete-item-${item.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign {category.singular}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
            {' '}Players will fall back to the system version (if one exists).
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
