import { useState } from 'react';
import { Search, Award, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function prereqText(feat) {
  const p = feat?.prerequisites;
  if (p && typeof p === 'object' && typeof p.text === 'string' && p.text.trim()) {
    return p.text;
  }
  return null;
}

/**
 * Feat selection control with browsable descriptions.
 *
 * Replaces a bare <select> so the user can read each feat's full description and
 * prerequisite before committing. A trigger button opens a searchable dialog list
 * (every feat shows name + prerequisite + description); clicking a feat selects it.
 * The chosen feat's description stays visible on the form below the trigger.
 *
 * Props:
 *   feats        — [{ id, name, description, prerequisites, repeatable, source }]
 *   value        — { id, name } | null  (the selected feat)
 *   onChange     — (feat|null) => void  (passes { id, name } or null)
 *   testIdPrefix — string; builds `${prefix}-select` (trigger), `${prefix}-detail`
 *                  (description box), `${prefix}-search`, `${prefix}-option-{id}`
 */
export default function FeatPicker({ feats = [], value = null, onChange, testIdPrefix = 'feat' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = value ? (feats.find(f => f.id === value.id) || value) : null;
  const filtered = feats.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  const choose = (feat) => {
    onChange?.(feat ? { id: feat.id, name: feat.name } : null);
    setOpen(false);
  };

  const selectedPrereq = prereqText(selected);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        onClick={() => setOpen(true)}
        data-testid={`${testIdPrefix}-select`}
      >
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected ? selected.name : 'Select a feat…'}
        </span>
        <Search className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

      {selected?.description && (
        <div
          className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed"
          data-testid={`${testIdPrefix}-detail`}
        >
          {selectedPrereq && (
            <div className="mb-1 font-medium text-amber-700 dark:text-amber-400">
              Prerequisite: {selectedPrereq}
            </div>
          )}
          {selected.description}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Choose a Feat</DialogTitle>
          </DialogHeader>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search feats…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9"
                data-testid={`${testIdPrefix}-search`}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No feats match your search.
              </div>
            ) : filtered.map(feat => {
              const prereq = prereqText(feat);
              const isSel = selected?.id === feat.id;
              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => choose(feat)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                    isSel && 'bg-primary/10',
                  )}
                  data-testid={`${testIdPrefix}-option-${feat.id}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Award className="w-4 h-4 shrink-0 text-primary" />
                    <span className="font-medium text-sm">{feat.name}</span>
                    {feat.repeatable && (
                      <RefreshCw className="h-3 w-3 text-muted-foreground" aria-label="Repeatable" />
                    )}
                    {feat.source && <Badge variant="secondary" className="text-xs">{feat.source}</Badge>}
                    {isSel && <Check className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                  {prereq && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Prerequisite: {prereq}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                    {feat.description}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
