import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Zap, Moon, Eye, RefreshCw, BookOpen, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import encyclopediaService from '../encyclopediaService';

const SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
];

const SCHOOL_COLORS = {
  Abjuration:   { bg: 'bg-blue-500',   ring: 'ring-blue-500',   pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  Conjuration:  { bg: 'bg-purple-500',  ring: 'ring-purple-500',  pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  Divination:   { bg: 'bg-indigo-500',  ring: 'ring-indigo-500',  pill: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  Enchantment:  { bg: 'bg-pink-500',    ring: 'ring-pink-500',    pill: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  Evocation:    { bg: 'bg-orange-500',  ring: 'ring-orange-500',  pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  Illusion:     { bg: 'bg-violet-500',  ring: 'ring-violet-500',  pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
  Necromancy:   { bg: 'bg-slate-600',   ring: 'ring-slate-600',   pill: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200' },
  Transmutation:{ bg: 'bg-emerald-500', ring: 'ring-emerald-500', pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
};

const SPELL_CLASSES = [
  'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard',
];

const LEVEL_LABELS = {
  0: 'Cantrip', 1: '1st', 2: '2nd', 3: '3rd',
  4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

function schoolColor(school) {
  return SCHOOL_COLORS[school] ?? { bg: 'bg-muted', ring: 'ring-muted', pill: 'bg-muted text-foreground' };
}

function SpellDetailDialog({ spell, isGm, campaignId, edition = '5e', onClose, onOverrideCreated }) {
  const navigate = useNavigate();
  const [overriding, setOverriding] = useState(false);
  const [error, setError] = useState('');

  if (!spell) return null;

  const colors = schoolColor(spell.school);
  const isCampaignOverride = spell.owner_type === 'campaign';

  const handleOverride = async () => {
    setOverriding(true);
    setError('');
    try {
      const created = await encyclopediaService.createSpell({
        name: spell.name,
        // Store under the edition being browsed, not the system row's — that row may be
        // a 5e fallback shown to a 2024 campaign, and the override belongs to 2024.
        edition,
        level: spell.level,
        school: spell.school,
        casting_time: spell.casting_time,
        range: spell.range,
        components: spell.components,
        duration: spell.duration,
        description: spell.description,
        higher_level: spell.higher_level || null,
        ritual: spell.ritual,
        concentration: spell.concentration,
        classes: spell.classes,
        owner_type: 'campaign',
        owner_id: parseInt(campaignId),
      });
      onOverrideCreated?.();
      navigate(`/campaigns/${campaignId}/encyclopedia/spells/${created.id}`);
    } catch (e) {
      const msg = e?.response?.data?.detail;
      if (typeof msg === 'string' && msg.includes('already exists')) {
        setError('A campaign override for this spell already exists. Find it in the Campaign Spells tab.');
      } else {
        setError('Failed to create override. Please try again.');
      }
      setOverriding(false);
    }
  };

  return (
    <Dialog open={!!spell} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <DialogTitle className="text-xl">{spell.name}</DialogTitle>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {isCampaignOverride && (
                <Badge className="bg-violet-600 text-white text-xs">Campaign Override</Badge>
              )}
              {spell.level === 0
                ? <Badge variant="secondary">Cantrip</Badge>
                : <Badge variant="secondary">{LEVEL_LABELS[spell.level]} Level</Badge>
              }
              <Badge className={cn('text-xs', colors.pill)}>{spell.school}</Badge>
              {spell.ritual && <Badge variant="outline" className="text-xs">Ritual</Badge>}
              {spell.concentration && <Badge variant="outline" className="text-xs">Concentration</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 rounded-lg bg-muted/50">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Casting Time</div>
              <div>{spell.casting_time}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Range</div>
              <div>{spell.range}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Components</div>
              <div>{spell.components}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</div>
              <div>{spell.duration}</div>
            </div>
          </div>

          <div className="whitespace-pre-wrap leading-relaxed text-foreground">
            {spell.description}
          </div>

          {spell.higher_level && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">At Higher Levels</div>
              <div className="whitespace-pre-wrap text-foreground">{spell.higher_level}</div>
            </div>
          )}

          {spell.classes && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              <span className="font-medium">Available to:</span> {spell.classes}
            </div>
          )}

          {isGm && !isCampaignOverride && (
            <div className="border-t pt-3">
              {error && <p className="text-xs text-destructive mb-2">{error}</p>}
              <Button
                size="sm"
                variant="outline"
                onClick={handleOverride}
                disabled={overriding}
                data-testid="override-spell-btn"
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
                onClick={() => navigate(`/campaigns/${campaignId}/encyclopedia/spells/${spell.id}`)}
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

export default function SpellsTab({ isGm, campaignId, edition = '5e' }) {
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [selectedSpell, setSelectedSpell] = useState(null);

  const load = () => {
    setLoading(true);
    encyclopediaService.getSpells(campaignId, edition).then((data) => {
      setSpells(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [campaignId, edition]);

  const filtered = spells.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (schoolFilter !== 'All' && s.school !== schoolFilter) return false;
    if (levelFilter !== 'All' && String(s.level) !== levelFilter) return false;
    if (classFilter !== 'All') {
      const spellClasses = (s.classes || '').split(',').map((c) => c.trim());
      if (!spellClasses.includes(classFilter)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter bar */}
      <div className="shrink-0 p-4 border-b border-border space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search spells…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              data-testid="spell-search"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            data-testid="level-filter"
          >
            <option value="All">All Levels</option>
            <option value="0">Cantrip</option>
            {[1,2,3,4,5,6,7,8,9].map(l => (
              <option key={l} value={String(l)}>{LEVEL_LABELS[l]} Level</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            data-testid="class-filter"
          >
            <option value="All">All Classes</option>
            {SPELL_CLASSES.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* School filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSchoolFilter('All')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
              schoolFilter === 'All'
                ? 'bg-foreground text-background border-foreground'
                : 'border-border hover:bg-muted'
            )}
            data-testid="school-filter-All"
          >
            All Schools
          </button>
          {SCHOOLS.map((school) => {
            const colors = schoolColor(school);
            const active = schoolFilter === school;
            return (
              <button
                key={school}
                onClick={() => setSchoolFilter(active ? 'All' : school)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  active ? cn(colors.pill, 'ring-2', colors.ring) : 'bg-muted hover:bg-muted/80 text-foreground'
                )}
                data-testid={`school-filter-${school}`}
              >
                {school}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading spells…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
            <BookOpen className="h-8 w-8 opacity-30" />
            <span>No spells match your filters.</span>
          </div>
        ) : (
          <div data-testid="spell-list">
            <div className="px-4 py-2 text-xs text-muted-foreground border-b">
              {filtered.length} spell{filtered.length !== 1 ? 's' : ''}
            </div>
            <div className="divide-y">
              {filtered.map((spell) => {
                const colors = schoolColor(spell.school);
                const isCampaignOverride = spell.owner_type === 'campaign';
                return (
                  <button
                    key={spell.id}
                    onClick={() => setSelectedSpell(spell)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors group"
                    data-testid={`spell-row-${spell.id}`}
                  >
                    <div className={cn('w-1.5 h-8 rounded-full shrink-0', colors.bg)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{spell.name}</span>
                        {isCampaignOverride && (
                          <span className="text-xs text-violet-600 font-medium">(Campaign)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{spell.classes}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {spell.ritual && (
                        <span title="Ritual" className="text-muted-foreground">
                          <RefreshCw className="h-3 w-3" />
                        </span>
                      )}
                      {spell.concentration && (
                        <span title="Concentration" className="text-muted-foreground">
                          <Eye className="h-3 w-3" />
                        </span>
                      )}
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', colors.pill)}>
                        {spell.school}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {spell.level === 0 ? 'Cantrip' : `Lv ${spell.level}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SpellDetailDialog
        spell={selectedSpell}
        isGm={isGm}
        campaignId={campaignId}
        edition={edition}
        onClose={() => setSelectedSpell(null)}
        onOverrideCreated={load}
      />
    </div>
  );
}
