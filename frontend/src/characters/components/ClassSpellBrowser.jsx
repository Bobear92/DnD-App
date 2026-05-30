import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, ExternalLink, Search } from 'lucide-react';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import { cn } from '@/lib/utils';

export function maxCastableLevel(slots) {
  let max = 0;
  slots.forEach((n, i) => { if (n > 0) max = i + 1; });
  return max;
}

export default function ClassSpellBrowser({
  className,        // "Cleric", "Druid", "Paladin", "Ranger"
  campaignId,
  preparedSpells = [],
  prepareLimit = 1,
  onAdd,
  onRemove,
  locked = false,
  isGm = false,
  maxSpellLevel = 9,
  onLock,
  onUnlock,
}) {
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState(null);

  useEffect(() => {
    encyclopediaService.getSpells(campaignId).then(allSpells => {
      const classSpells = allSpells.filter(s => {
        if (!s.classes) return false;
        const names = s.classes.split(',').map(n => n.trim().toLowerCase());
        return names.includes(className.toLowerCase()) && s.level > 0 && s.level <= maxSpellLevel;
      });
      setSpells(classSpells);
      setLoading(false);
    });
  }, [campaignId, className, maxSpellLevel]);

  const filtered = spells.filter(s => {
    if (levelFilter !== null && s.level !== levelFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byLevel = {};
  filtered.forEach(s => {
    if (!byLevel[s.level]) byLevel[s.level] = [];
    byLevel[s.level].push(s);
  });
  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

  const atLimit = preparedSpells.length >= prepareLimit;
  const playerLocked = locked && !isGm;

  return (
    <div className="space-y-4">
      {/* Lock status */}
      {playerLocked ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-300">
            Spells prepared for today. Ask your GM for a long rest to re-prepare.
          </span>
        </div>
      ) : !isGm ? (
        <div className="flex items-center justify-between rounded-md border px-3 py-2.5 bg-muted/30">
          <div>
            <div className="text-sm font-medium">Commit today's preparation?</div>
            <div className="text-xs text-muted-foreground">
              {preparedSpells.length}/{prepareLimit} spells selected · Locks until long rest
            </div>
          </div>
          <Button size="sm" onClick={onLock} className="gap-1 shrink-0 ml-3">
            <Lock className="h-3 w-3" />
            Prepare for Today
          </Button>
        </div>
      ) : null}

      {/* GM controls */}
      {isGm && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/20">
          <div className="text-sm flex items-center gap-1.5">
            {locked
              ? <><Lock className="h-3.5 w-3.5 text-amber-500" /><span>Player's preparation is locked</span></>
              : <span className="text-muted-foreground">Player can freely change prepared spells</span>
            }
          </div>
          {locked && (
            <Button size="sm" variant="outline" onClick={onUnlock} className="gap-1">
              <Unlock className="h-3 w-3" />
              Unlock (Long Rest)
            </Button>
          )}
        </div>
      )}

      {/* Prepared count + search + level filter */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-medium">
          {preparedSpells.length}/{prepareLimit} spells prepared · {atLimit ? 'Limit reached' : `${prepareLimit - preparedSpells.length} more available`}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search spells…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm min-w-[110px]"
            value={levelFilter ?? ''}
            onChange={e => setLevelFilter(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Levels</option>
            {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map(l => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spell list */}
      {loading ? (
        <div className="text-sm text-muted-foreground italic py-6 text-center">Loading spells…</div>
      ) : levels.length === 0 ? (
        <div className="text-sm text-muted-foreground italic py-6 text-center">
          {search ? 'No spells match your search.' : 'No spells available at your current level.'}
        </div>
      ) : (
        <div className="space-y-4">
          {levels.map(lvl => (
            <div key={lvl}>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 border-b pb-1">
                Level {lvl}
              </div>
              <div className="space-y-1">
                {byLevel[lvl].sort((a, b) => a.name.localeCompare(b.name)).map(spell => {
                  const isPrepared = preparedSpells.includes(spell.name);
                  return (
                    <div key={spell.id} className={cn(
                      'flex items-center justify-between rounded-md border px-3 py-1.5 text-sm',
                      isPrepared && 'bg-primary/5 border-primary/30'
                    )}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('truncate', isPrepared && 'font-medium')}>{spell.name}</span>
                        {spell.ritual && <Badge variant="outline" className="text-xs py-0 px-1 shrink-0">Ritual</Badge>}
                        {spell.concentration && <Badge variant="outline" className="text-xs py-0 px-1 shrink-0">Conc</Badge>}
                      </div>
                      {isPrepared ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={playerLocked}
                          onClick={() => onRemove(spell.name)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={playerLocked || atLimit}
                          onClick={() => onAdd(spell.name)}
                          className="h-6 px-2 text-xs shrink-0"
                        >
                          + Prepare
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Encyclopedia link */}
      <div className="pt-2 border-t">
        <Link
          to={`/campaigns/${campaignId}/encyclopedia`}
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Browse all spells in the Encyclopedia
        </Link>
      </div>
    </div>
  );
}
