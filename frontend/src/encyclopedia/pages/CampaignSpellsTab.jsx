import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import encyclopediaService from '../encyclopediaService';

const SCHOOL_COLORS = {
  Abjuration:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Conjuration:  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Divination:   'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  Enchantment:  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  Evocation:    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Illusion:     'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  Necromancy:   'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  Transmutation:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

const LEVEL_LABELS = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd',
  4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

function schoolPill(school) {
  return SCHOOL_COLORS[school] ?? 'bg-muted text-foreground';
}

export default function CampaignSpellsTab({ campaignId }) {
  const navigate = useNavigate();
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    encyclopediaService.getSpells(campaignId).then((all) => {
      setSpells(all.filter((s) => s.owner_type === 'campaign'));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [campaignId]);

  const filtered = search
    ? spells.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : spells;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await encyclopediaService.deleteSpell(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header / actions */}
      <div className="shrink-0 p-4 border-b border-border flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Search campaign spells…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
            data-testid="campaign-spell-search"
          />
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia/spells/new`)}
          data-testid="new-homebrew-btn"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Homebrew Spell
        </Button>
      </div>

      <div className="shrink-0 px-4 pt-3 pb-1">
        <p className="text-xs text-muted-foreground">
          Campaign spells — overrides of system spells and homebrew spells you've created.
          Players in this campaign see these instead of the system versions.
        </p>
      </div>

      {/* Spell list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-30" />
            <p className="text-sm">No campaign spells yet.</p>
            <p className="text-xs text-center max-w-xs">
              Override a system spell from the Spells tab, or create a homebrew spell from scratch.
            </p>
          </div>
        ) : (
          <div className="divide-y" data-testid="campaign-spell-list">
            {filtered.map((spell) => {
              const systemName = spell.name;
              return (
                <div
                  key={spell.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{spell.name}</span>
                      <Badge className="text-xs bg-violet-600 text-white">Campaign</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', schoolPill(spell.school))}>
                        {spell.school}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {spell.level === 0 ? 'Cantrip' : `${LEVEL_LABELS[spell.level]} Level`}
                      </span>
                      {spell.ritual && <span className="text-xs text-muted-foreground">• Ritual</span>}
                      {spell.concentration && <span className="text-xs text-muted-foreground">• Concentration</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia/spells/${spell.id}`)}
                      data-testid={`edit-spell-${spell.id}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(spell)}
                      data-testid={`delete-spell-${spell.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign Spell</DialogTitle>
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
