import { useState, useMemo } from 'react';
import { Search, BookOpen, Dice5 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SKILLS, ABILITY_FULL, abilityColor } from '../data/skillsData';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export default function SkillsTab() {
  const [search, setSearch] = useState('');
  const [abilityFilter, setAbilityFilter] = useState('All');
  const [selectedName, setSelectedName] = useState(SKILLS[0]?.name ?? null);

  const filtered = useMemo(() => {
    return SKILLS.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (abilityFilter !== 'All' && s.ability !== abilityFilter) return false;
      return true;
    });
  }, [search, abilityFilter]);

  const selected = SKILLS.find((s) => s.name === selectedName) ?? null;

  return (
    <div className="flex h-full min-h-0">
      {/* Skill list sidebar */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col min-h-0">
        <div className="shrink-0 p-3 space-y-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              data-testid="skill-search"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setAbilityFilter('All')}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium transition-colors border',
                abilityFilter === 'All'
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border hover:bg-muted'
              )}
              data-testid="ability-filter-All"
            >
              All
            </button>
            {ABILITIES.map((ab) => {
              const colors = abilityColor(ab);
              const active = abilityFilter === ab;
              return (
                <button
                  key={ab}
                  onClick={() => setAbilityFilter(active ? 'All' : ab)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                    active ? cn(colors.pill, 'ring-2', colors.ring) : 'bg-muted hover:bg-muted/80 text-foreground'
                  )}
                  data-testid={`ability-filter-${ab}`}
                >
                  {ab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5" data-testid="skill-list">
          {filtered.length === 0 ? (
            <div className="text-xs text-muted-foreground p-4 text-center">No skills match your filters.</div>
          ) : (
            filtered.map((skill) => {
              const colors = abilityColor(skill.ability);
              const isSelected = selectedName === skill.name;
              return (
                <button
                  key={skill.name}
                  onClick={() => setSelectedName(skill.name)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                    isSelected
                      ? cn('bg-muted ring-2', colors.ring)
                      : 'hover:bg-muted/60'
                  )}
                  data-testid={`skill-row-${skill.name}`}
                >
                  <div className={cn('w-2 h-2 rounded-full shrink-0', colors.bg)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{skill.name}</p>
                    <p className="text-xs text-muted-foreground">{ABILITY_FULL[skill.ability]}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">Select a skill</p>
            <p className="text-sm mt-1">Choose a skill from the list to see its full description and example checks.</p>
          </div>
        ) : (
          <SkillDetail skill={selected} />
        )}
      </div>
    </div>
  );
}

function SkillDetail({ skill }) {
  const colors = abilityColor(skill.ability);
  return (
    <div data-testid="skill-detail">
      {/* Header bar */}
      <div className={cn('px-6 py-4 border-b border-border flex items-center gap-4', colors.bg, 'text-white')}>
        <div className="flex-1">
          <h2 className="text-2xl font-bold leading-tight">{skill.name}</h2>
          <p className="text-sm opacity-90 italic">{skill.flavor}</p>
        </div>
        <Badge className={cn('text-xs shrink-0', colors.pill)}>
          {ABILITY_FULL[skill.ability]} ({skill.ability})
        </Badge>
      </div>

      <div className="p-6 space-y-6">
        {/* Description */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            What it does
          </h3>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
            {skill.description}
          </p>
        </section>

        {/* Examples */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
            <Dice5 className="h-3.5 w-3.5" />
            Example checks
          </h3>
          <ul className="space-y-1.5">
            {skill.examples.map((ex, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground">
                <span className="text-muted-foreground shrink-0">·</span>
                <span>{ex}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="text-xs text-muted-foreground border-t border-border pt-3">
          A skill check is rolled as <span className="font-medium">d20 + {skill.ability} modifier</span>
          {' '}(plus your proficiency bonus if you are proficient, doubled with expertise).
        </section>
      </div>
    </div>
  );
}
