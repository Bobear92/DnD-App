import { useState, useEffect } from 'react';
import { Search, BookOpen, Award, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import featService from '../featService';

function prereqText(feat) {
  const p = feat?.prerequisites;
  if (p && typeof p === 'object' && typeof p.text === 'string' && p.text.trim()) {
    return p.text;
  }
  return null;
}

function FeatDetailDialog({ feat, onClose }) {
  if (!feat) return null;
  const prereq = prereqText(feat);

  return (
    <Dialog open={!!feat} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="text-xl">{feat.name}</DialogTitle>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {feat.repeatable && <Badge variant="outline" className="text-xs">Repeatable</Badge>}
              {feat.source && <Badge variant="secondary" className="text-xs">{feat.source}</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {prereq && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Prerequisite</div>
              <div className="text-foreground">{prereq}</div>
            </div>
          )}

          <div className="whitespace-pre-wrap leading-relaxed text-foreground">
            {feat.description}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeatsTab({ campaignId, edition }) {
  const [feats, setFeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFeat, setSelectedFeat] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    featService.getFeats(campaignId, edition).then((data) => {
      if (!cancelled) {
        setFeats(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [campaignId, edition]);

  const filtered = feats.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter bar */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search feats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
            data-testid="feat-search"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading feats…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <BookOpen className="h-8 w-8 opacity-30" />
            <span>No feats match your search.</span>
          </div>
        ) : (
          <div data-testid="feat-list">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b">
              {filtered.length} feat{filtered.length !== 1 ? 's' : ''}
            </div>
            <div className="divide-y">
              {filtered.map((feat) => {
                const prereq = prereqText(feat);
                return (
                  <button
                    key={feat.id}
                    onClick={() => setSelectedFeat(feat)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                    data-testid={`feat-row-${feat.id}`}
                  >
                    <Award className="w-4 h-4 shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{feat.name}</span>
                        {feat.repeatable && (
                          <span title="Repeatable" className="text-muted-foreground">
                            <RefreshCw className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {prereq ? `Prerequisite: ${prereq}` : feat.description}
                      </div>
                    </div>
                    {feat.source && (
                      <span className="text-xs text-muted-foreground shrink-0">{feat.source}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <FeatDetailDialog feat={selectedFeat} onClose={() => setSelectedFeat(null)} />
    </div>
  );
}
