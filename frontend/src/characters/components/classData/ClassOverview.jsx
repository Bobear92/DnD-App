import React, { useState } from 'react';
import { BookOpen, Zap, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import SubclassOverview from '@/characters/components/subclass/SubclassOverview';
import { CLASS_PROGRESSION, profBonus, ordinal } from '@/characters/components/classData/classProgressionTables';
import {
  BARBARIAN_SUBCLASSES_5E,  BARBARIAN_SUBCLASSES_2024,
  BARD_SUBCLASSES_5E,       BARD_SUBCLASSES_2024,
  CLERIC_SUBCLASSES_5E,     CLERIC_SUBCLASSES_2024,
  DRUID_SUBCLASSES_5E,      DRUID_SUBCLASSES_2024,
  FIGHTER_SUBCLASSES_5E,    FIGHTER_SUBCLASSES_2024,
  MONK_SUBCLASSES_5E,       MONK_SUBCLASSES_2024,
  PALADIN_SUBCLASSES_5E,    PALADIN_SUBCLASSES_2024,
  RANGER_SUBCLASSES_5E,     RANGER_SUBCLASSES_2024,
  ROGUE_SUBCLASSES_5E,      ROGUE_SUBCLASSES_2024,
  SORCERER_SUBCLASSES_5E,   SORCERER_SUBCLASSES_2024,
  WARLOCK_SUBCLASSES_5E,    WARLOCK_SUBCLASSES_2024,
  WIZARD_SUBCLASSES_5E,     WIZARD_SUBCLASSES_2024,
} from '@/characters/components/classData/classChoicesData';

// ─── Maps: subclass level + options per class × edition ──────────────────────

const SUBCLASS_MAP = {
  '5e': {
    Barbarian: { level: 3,  list: BARBARIAN_SUBCLASSES_5E  },
    Bard:      { level: 3,  list: BARD_SUBCLASSES_5E       },
    Cleric:    { level: 1,  list: CLERIC_SUBCLASSES_5E     },
    Druid:     { level: 2,  list: DRUID_SUBCLASSES_5E      },
    Fighter:   { level: 3,  list: FIGHTER_SUBCLASSES_5E    },
    Monk:      { level: 3,  list: MONK_SUBCLASSES_5E       },
    Paladin:   { level: 3,  list: PALADIN_SUBCLASSES_5E    },
    Ranger:    { level: 3,  list: RANGER_SUBCLASSES_5E     },
    Rogue:     { level: 3,  list: ROGUE_SUBCLASSES_5E      },
    Sorcerer:  { level: 1,  list: SORCERER_SUBCLASSES_5E   },
    Warlock:   { level: 1,  list: WARLOCK_SUBCLASSES_5E    },
    Wizard:    { level: 2,  list: WIZARD_SUBCLASSES_5E     },
  },
  '5.5e': {
    Barbarian: { level: 3,  list: BARBARIAN_SUBCLASSES_2024 },
    Bard:      { level: 3,  list: BARD_SUBCLASSES_2024      },
    Cleric:    { level: 3,  list: CLERIC_SUBCLASSES_2024    },
    Druid:     { level: 3,  list: DRUID_SUBCLASSES_2024     },
    Fighter:   { level: 3,  list: FIGHTER_SUBCLASSES_2024   },
    Monk:      { level: 3,  list: MONK_SUBCLASSES_2024      },
    Paladin:   { level: 3,  list: PALADIN_SUBCLASSES_2024   },
    Ranger:    { level: 3,  list: RANGER_SUBCLASSES_2024    },
    Rogue:     { level: 3,  list: ROGUE_SUBCLASSES_2024     },
    Sorcerer:  { level: 3,  list: SORCERER_SUBCLASSES_2024  },
    Warlock:   { level: 3,  list: WARLOCK_SUBCLASSES_2024   },
    Wizard:    { level: 3,  list: WIZARD_SUBCLASSES_2024    },
  },
};

// ─── Accent colour maps ───────────────────────────────────────────────────────

const CLASS_ACCENT_BG = {
  Barbarian: 'bg-orange-500', Bard: 'bg-pink-500', Cleric: 'bg-yellow-500',
  Druid: 'bg-green-500', Fighter: 'bg-red-500', Monk: 'bg-cyan-500',
  Paladin: 'bg-amber-500', Ranger: 'bg-emerald-500', Rogue: 'bg-purple-500',
  Sorcerer: 'bg-rose-500', Warlock: 'bg-violet-500', Wizard: 'bg-blue-500',
};

const CLASS_ACCENT_TEXT = {
  Barbarian: 'text-orange-700 dark:text-orange-400', Bard: 'text-pink-700 dark:text-pink-400',
  Cleric: 'text-yellow-700 dark:text-yellow-400', Druid: 'text-green-700 dark:text-green-400',
  Fighter: 'text-red-700 dark:text-red-400', Monk: 'text-cyan-700 dark:text-cyan-400',
  Paladin: 'text-amber-700 dark:text-amber-400', Ranger: 'text-emerald-700 dark:text-emerald-400',
  Rogue: 'text-purple-700 dark:text-purple-400', Sorcerer: 'text-rose-700 dark:text-rose-400',
  Warlock: 'text-violet-700 dark:text-violet-400', Wizard: 'text-blue-700 dark:text-blue-400',
};

const CLASS_ACCENT_BORDER = {
  Barbarian: 'border-orange-500', Bard: 'border-pink-500', Cleric: 'border-yellow-500',
  Druid: 'border-green-500', Fighter: 'border-red-500', Monk: 'border-cyan-500',
  Paladin: 'border-amber-500', Ranger: 'border-emerald-500', Rogue: 'border-purple-500',
  Sorcerer: 'border-rose-500', Warlock: 'border-violet-500', Wizard: 'border-blue-500',
};

// Subtle left-border accent for subclass cards
const CLASS_ACCENT_LEFT = {
  Barbarian: 'border-l-orange-500', Bard: 'border-l-pink-500', Cleric: 'border-l-yellow-500',
  Druid: 'border-l-green-500', Fighter: 'border-l-red-500', Monk: 'border-l-cyan-500',
  Paladin: 'border-l-amber-500', Ranger: 'border-l-emerald-500', Rogue: 'border-l-purple-500',
  Sorcerer: 'border-l-rose-500', Warlock: 'border-l-violet-500', Wizard: 'border-l-blue-500',
};

// ─── Small components ─────────────────────────────────────────────────────────

function StatChip({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium truncate">{label}</span>
      <span className="text-sm font-semibold text-foreground leading-tight">{value || '—'}</span>
    </div>
  );
}

function SubclassCards({ name, subclasses, onSubclassClick }) {
  const accentText  = CLASS_ACCENT_TEXT[name]  || 'text-primary';
  const accentLeft  = CLASS_ACCENT_LEFT[name]  || 'border-l-primary';

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Available Subclasses — click any card to view details
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {subclasses.map(sc => (
          <button
            key={sc.value}
            type="button"
            onClick={() => onSubclassClick(sc.value)}
            data-testid={`subclass-card-${sc.value}`}
            className={cn(
              'rounded-lg border border-border bg-card pl-4 pr-3 py-3 border-l-4 text-left',
              'hover:bg-muted/40 transition-colors group',
              accentLeft,
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={cn('text-sm font-semibold leading-snug', accentText)}>{sc.value}</p>
              <Info className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5 transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sc.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function displayVal(v) {
  if (v === 0 || v === null || v === undefined) return '—';
  return String(v);
}

function featureId(level, featureName) {
  const slug = featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `feat-${level}-${slug}`;
}

function scrollToFeature(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ProgressionTable({ name, edition, byLevel }) {
  const prog    = CLASS_PROGRESSION[edition === '5.5e' ? '5.5e' : '5e']?.[name];
  const columns = prog?.columns ?? [];
  const dataRows = prog?.data ?? [];

  const hasGroups = columns.some(c => c.group);

  // Build group spans for the first header row
  const groupSpans = [];
  if (hasGroups) {
    let i = 0;
    while (i < columns.length) {
      const col = columns[i];
      if (col.group) {
        let span = 1;
        while (i + span < columns.length && columns[i + span].group === col.group) span++;
        groupSpans.push({ type: 'group', label: col.group, span });
        i += span;
      } else {
        groupSpans.push({ type: 'col', label: col.label, key: col.key });
        i++;
      }
    }
  }

  const thBase = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide whitespace-nowrap';
  const tdBase = 'px-3 py-2 text-sm text-center whitespace-nowrap';

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={cn(CLASS_ACCENT_BG[name] || 'bg-primary', 'text-white')}>
            <th className={cn(thBase, 'text-left')} rowSpan={hasGroups ? 2 : 1}>Level</th>
            <th className={cn(thBase, 'text-left')} rowSpan={hasGroups ? 2 : 1}>Proficiency Bonus</th>
            <th className={cn(thBase, 'text-left')} rowSpan={hasGroups ? 2 : 1}>Features</th>
            {hasGroups
              ? groupSpans.map((gs, i) =>
                  gs.type === 'group'
                    ? <th key={i} className={cn(thBase, 'text-center border-l border-white/20')} colSpan={gs.span}>
                        —{gs.label}—
                      </th>
                    : <th key={i} className={cn(thBase, 'text-center')} rowSpan={2}>{gs.label}</th>
                )
              : columns.map(col =>
                  <th key={col.key} className={cn(thBase, 'text-center')}>{col.label}</th>
                )
            }
          </tr>
          {hasGroups && (
            <tr className={cn(CLASS_ACCENT_BG[name] || 'bg-primary', 'text-white/90 border-t border-white/20')}>
              {columns.map(col =>
                col.group
                  ? <th key={col.key} className={cn(thBase, 'text-center font-normal text-white/80')}>{col.label}</th>
                  : null
              )}
            </tr>
          )}
        </thead>
        <tbody>
          {Array.from({length: 20}, (_, i) => {
            const level   = i + 1;
            const feats   = byLevel[level] || [];
            const rowData = dataRows[i] ?? [];
            const isEven  = i % 2 === 1;
            const linkCls = cn('hover:underline cursor-pointer transition-colors', CLASS_ACCENT_TEXT[name] || 'text-primary');
            return (
              <tr
                key={level}
                className={cn(
                  'border-t border-border transition-colors hover:bg-muted/40',
                  isEven ? 'bg-muted/20' : 'bg-background',
                )}
              >
                <td className={cn(tdBase, 'text-left font-semibold')}>{ordinal(level)}</td>
                <td className={cn(tdBase, 'text-left')}>+{profBonus(level)}</td>
                <td className={cn(tdBase, 'text-left max-w-[220px] whitespace-normal leading-snug')}>
                  {feats.length === 0 ? '—' : feats.map((f, fi) => (
                    <React.Fragment key={fi}>
                      {fi > 0 && <span className="text-muted-foreground">, </span>}
                      <button
                        type="button"
                        onClick={() => scrollToFeature(featureId(level, f.feature_name))}
                        className={linkCls}
                      >
                        {f.feature_name}
                      </button>
                    </React.Fragment>
                  ))}
                </td>
                {columns.map((col, ci) => (
                  <td key={col.key} className={tdBase}>{displayVal(rowData[ci])}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClassOverview({ classData, loading, maneuversTo }) {
  const [selectedSubclass, setSelectedSubclass] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading class details…
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Class details unavailable. You can still proceed.
      </div>
    );
  }

  const {
    name, edition, flavor_text, hit_die, primary_ability,
    spellcasting_ability, saving_throws = [], armor_proficiencies = [],
    weapon_proficiencies = [], tool_proficiencies = [], skill_count,
    skills_available = [], features = [],
  } = classData;

  const accentText   = CLASS_ACCENT_TEXT[name]   || 'text-primary';
  const accentBg     = CLASS_ACCENT_BG[name]     || 'bg-primary';
  const accentBorder = CLASS_ACCENT_BORDER[name] || 'border-primary';

  const edKey = edition === '5.5e' ? '5.5e' : '5e';
  const subclassInfo = SUBCLASS_MAP[edKey]?.[name] ?? null;

  // Group features by level
  const byLevel = {};
  for (const f of features) {
    if (!byLevel[f.level]) byLevel[f.level] = [];
    byLevel[f.level].push(f);
  }
  const featureLevels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

  const paragraphs = (flavor_text || '').split('\n\n').filter(Boolean);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header bar */}
      <div className={cn('rounded-xl border-2 overflow-hidden', accentBorder)}>
        <div className={cn('px-5 py-3 flex items-center gap-3', accentBg)}>
          <h2 className="text-xl font-bold text-white">{name}</h2>
          <Badge variant="outline" className="border-white/60 text-white bg-white/10 text-xs">
            {edition === '5.5e' ? '2024 Rules' : '5e (2014)'}
          </Badge>
          {spellcasting_ability && (
            <Badge variant="outline" className="border-white/60 text-white bg-white/10 text-xs ml-auto">
              <Zap className="w-3 h-3 mr-1" />
              {spellcasting_ability} spellcaster
            </Badge>
          )}
        </div>

        {/* Quick stats */}
        <div className="px-5 py-4 bg-card grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <StatChip label="Hit Die" value={`d${hit_die}`} />
          <StatChip label="Primary Ability" value={primary_ability} />
          <StatChip label="Saving Throws" value={saving_throws.length ? saving_throws.join(', ') : '—'} />
          <StatChip label="Armor" value={armor_proficiencies.length ? armor_proficiencies.join(', ') : 'None'} />
          <StatChip label="Weapons" value={weapon_proficiencies.length ? weapon_proficiencies.join(', ') : '—'} />
          <StatChip label={`Skills (choose ${skill_count})`} value={skills_available.length ? skills_available.join(', ') : '—'} />
          {tool_proficiencies.length > 0 && (
            <StatChip label="Tools" value={tool_proficiencies.join(', ')} />
          )}
        </div>
      </div>

      {/* Flavor / lore */}
      {paragraphs.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className={cn('flex items-center gap-2 text-sm font-semibold uppercase tracking-wide', accentText)}>
            <BookOpen className="w-4 h-4" />
            About the {name}
          </div>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>
      )}

      {/* Progression table */}
      <div className="space-y-2">
        <p className={cn('text-sm font-semibold uppercase tracking-wide', accentText)}>
          The {name} — Level Progression
        </p>
        <ProgressionTable name={name} edition={edition} byLevel={byLevel} />
      </div>

      {/* Feature descriptions */}
      {featureLevels.length > 0 && (
        <div className="space-y-8">
          <p className={cn('text-sm font-semibold uppercase tracking-wide', accentText)}>
            Class Features
          </p>
          {featureLevels.map(lvl => (
            <div key={lvl} className="space-y-4">
              {/* Level divider */}
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', accentBg)}>
                  {lvl}
                </div>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
                  Level {lvl}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Features at this level */}
              {byLevel[lvl].map((f, i) => (
                <div key={i} id={featureId(lvl, f.feature_name)} className="pl-11 space-y-1.5 scroll-mt-4">
                  <h3 className={cn('text-base font-semibold', accentText)}>{f.feature_name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.feature_description}</p>
                </div>
              ))}

              {/* Subclass cards at the subclass-choosing level */}
              {subclassInfo && lvl === subclassInfo.level && (
                <div className="pl-11">
                  <SubclassCards
                    name={name}
                    subclasses={subclassInfo.list}
                    onSubclassClick={setSelectedSubclass}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Subclass detail dialog */}
      <Dialog open={!!selectedSubclass} onOpenChange={open => !open && setSelectedSubclass(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{selectedSubclass} details</DialogTitle>
          </DialogHeader>
          {selectedSubclass && (
            <SubclassOverview
              className={name}
              subclassName={selectedSubclass}
              edition={edition}
              maneuversTo={maneuversTo}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
