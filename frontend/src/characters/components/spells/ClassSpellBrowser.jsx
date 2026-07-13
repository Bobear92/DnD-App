import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, ExternalLink, Search } from 'lucide-react';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import { useCampaign } from '@/campaigns/CampaignContext';
import { cn } from '@/lib/utils';

export function maxCastableLevel(slots) {
  let max = 0;
  slots.forEach((n, i) => { if (n > 0) max = i + 1; });
  return max;
}

export default function ClassSpellBrowser({
  className,        // "Cleric", "Druid", "Paladin", "Ranger" — or the granted list ("Wizard" for an Eldritch Knight)
  campaignId,
  preparedSpells = [],
  prepareLimit = 1,
  onAdd,
  onRemove,
  locked = false,
  isGm = false,
  maxSpellLevel = 9,
  minSpellLevel = 1, // 0 = cantrips; min===max===0 renders a cantrip-only picker
  mode = 'prepare',  // 'prepare' (daily prep + lock flow) | 'learn' (known-caster picks — no lock UI)
  grantedSpells = [], // spells already granted from elsewhere (race cantrips) — shown non-selectable
  grantedLabel = 'Already granted',
  schools = null,    // e.g. ['Abjuration','Evocation'] — narrows the list to those schools (5e Eldritch Knight); null = every school
  ritualOnly = false, // only ritual-tagged spells are legal picks (Ritual Caster's book)
  lockedSpells = [],  // chosen spells that can't be given up right now — shown "Locked", not "Remove"
  onLock,
  onUnlock,
}) {
  const edition = useCampaign()?.campaign?.edition;
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState(null);
  const [schoolFilter, setSchoolFilter] = useState(null); // view-only narrowing within the legal set
  const [expandedId, setExpandedId] = useState(null); // spell whose full description is shown
  const isLearn = mode === 'learn';

  useEffect(() => {
    encyclopediaService.getSpells(campaignId, edition).then(allSpells => {
      const classSpells = allSpells.filter(s => {
        if (!s.classes) return false;
        const names = s.classes.split(',').map(n => n.trim().toLowerCase());
        return names.includes(className.toLowerCase()) && s.level >= minSpellLevel && s.level <= maxSpellLevel;
      });
      setSpells(classSpells);
      setLoading(false);
    });
  }, [campaignId, edition, className, maxSpellLevel, minSpellLevel]);

  // A `schools` restriction narrows the catalog itself (not just the view) — a spell of
  // another school is not a legal pick, so it must not be offered at all.
  const schoolSet = schools ? schools.map(s => s.toLowerCase()) : null;

  // Spells the character is actually ALLOWED to pick here. The school dropdown then narrows
  // the VIEW within that legal set — so it offers the restricted pair (Abjuration/Evocation)
  // on a restricted picker, and every school actually present in the list otherwise.
  const legal = spells.filter(s => {
    if (schoolSet && !schoolSet.includes((s.school || '').toLowerCase())) return false;
    if (ritualOnly && !s.ritual) return false;
    return true;
  });

  const schoolOptions = (
    schools ?? [...new Set(legal.map(s => s.school).filter(Boolean))]
  ).slice().sort((a, b) => a.localeCompare(b));

  const filtered = legal.filter(s => {
    if (schoolFilter && (s.school || '').toLowerCase() !== schoolFilter.toLowerCase()) return false;
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

  const atLimit = prepareLimit != null && preparedSpells.length >= prepareLimit;
  const playerLocked = !isLearn && locked && !isGm;
  const noun = isLearn ? 'chosen' : 'prepared';
  const addLabel = isLearn ? '+ Learn' : '+ Prepare';
  const filterLevels = Array.from(
    { length: Math.max(maxSpellLevel - Math.max(minSpellLevel, 1) + 1, 0) },
    (_, i) => i + Math.max(minSpellLevel, 1),
  );

  return (
    <div className="space-y-4">
      {/* Lock status */}
      {isLearn ? null : playerLocked ? (
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
      {!isLearn && isGm && (
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
          {prepareLimit != null
            ? <>{preparedSpells.length}/{prepareLimit} spells {noun} · {atLimit ? 'Limit reached' : `${prepareLimit - preparedSpells.length} more available`}</>
            : <>{preparedSpells.length} spells {noun}</>}
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
          {filterLevels.length > 1 && (
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm min-w-[110px]"
              value={levelFilter ?? ''}
              onChange={e => setLevelFilter(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Levels</option>
              {filterLevels.map(l => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          )}
          {/* School filter — narrows the view within the legal set. Leveled spells only: a
              cantrip list is short enough that filtering it is clutter. Also pointless with
              only one school to choose between. */}
          {maxSpellLevel > 0 && schoolOptions.length > 1 && (
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm min-w-[130px]"
              data-testid="spell-school-filter"
              value={schoolFilter ?? ''}
              onChange={e => setSchoolFilter(e.target.value || null)}
            >
              <option value="">All Schools</option>
              {schoolOptions.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Spell list */}
      {loading ? (
        <div className="text-sm text-muted-foreground italic py-6 text-center">Loading spells…</div>
      ) : levels.length === 0 ? (
        <div className="text-sm text-muted-foreground italic py-6 text-center">
          {search
            ? 'No spells match your search.'
            : schoolFilter
              ? `No ${schoolFilter} spells available at your current level.`
              : 'No spells available at your current level.'}
        </div>
      ) : (
        <div className="space-y-4">
          {levels.map(lvl => (
            <div key={lvl}>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 border-b pb-1">
                {lvl === 0 ? 'Cantrips' : `Level ${lvl}`}
              </div>
              <div className="space-y-1">
                {byLevel[lvl].sort((a, b) => a.name.localeCompare(b.name)).map(spell => {
                  const isPrepared = preparedSpells.includes(spell.name);
                  const isGranted = grantedSpells.includes(spell.name);
                  const isExpanded = expandedId === spell.id;
                  const meta = [spell.school, spell.casting_time, spell.range].filter(Boolean).join(' · ');
                  const toggle = () => setExpandedId(isExpanded ? null : spell.id);
                  // The whole row toggles the full description (a div role=button so the inner
                  // Learn/Remove button stays a real, non-nested button — it stops propagation).
                  return (
                    <div
                      key={spell.id}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={toggle}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm cursor-pointer hover:border-primary/40',
                        isPrepared && 'bg-primary/5 border-primary/30',
                        isGranted && 'opacity-80'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn('truncate', isPrepared && 'font-medium')}>{spell.name}</span>
                          {spell.ritual && <Badge variant="outline" className="text-xs py-0 px-1 shrink-0">Ritual</Badge>}
                          {spell.concentration && <Badge variant="outline" className="text-xs py-0 px-1 shrink-0">Conc</Badge>}
                        </div>
                        {isGranted ? (
                          <Badge
                            variant="outline"
                            data-testid={`spell-granted-${spell.id}`}
                            className="text-xs py-0 px-1.5 shrink-0 border-violet-400/60 text-violet-500 dark:text-violet-400"
                          >
                            {grantedLabel}
                          </Badge>
                        ) : isPrepared && lockedSpells.includes(spell.name) ? (
                          // Chosen, but not givable-up right now (permanent, or the swap is spent).
                          <Badge
                            variant="outline"
                            data-testid={`spell-locked-${spell.id}`}
                            className="text-xs py-0 px-1.5 shrink-0 text-muted-foreground"
                          >
                            Locked
                          </Badge>
                        ) : isPrepared ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={playerLocked}
                            onClick={e => { e.stopPropagation(); onRemove(spell.name); }}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0"
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={playerLocked || atLimit}
                            onClick={e => { e.stopPropagation(); onAdd(spell.name); }}
                            className="h-6 px-2 text-xs shrink-0"
                          >
                            {addLabel}
                          </Button>
                        )}
                      </div>
                      {meta && (
                        <div className="text-xs text-muted-foreground/80 mt-0.5">{meta}</div>
                      )}
                      {spell.description && (
                        <p
                          data-testid={`spell-desc-${spell.id}`}
                          className={cn('text-xs text-muted-foreground mt-1 whitespace-pre-line', !isExpanded && 'line-clamp-2')}
                        >
                          {spell.description}
                        </p>
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
