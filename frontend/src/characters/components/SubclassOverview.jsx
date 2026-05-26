import React from 'react';
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SUBCLASS_DATA } from './subclassData/index';

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

export default function SubclassOverview({ className, subclassName, edition }) {
  const edKey = edition === '5.5e' ? '5.5e' : '5e';
  const data = SUBCLASS_DATA[className]?.[edKey]?.[subclassName];

  const accentBg     = CLASS_ACCENT_BG[className]     || 'bg-primary';
  const accentText   = CLASS_ACCENT_TEXT[className]   || 'text-primary';
  const accentBorder = CLASS_ACCENT_BORDER[className] || 'border-primary';

  if (!data) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Subclass details not available.
      </div>
    );
  }

  const { flavorText, features = [] } = data;
  const featureLevels = [...new Set(features.map(f => f.level))].sort((a, b) => a - b);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={cn('rounded-xl border-2 overflow-hidden', accentBorder)}>
        <div className={cn('px-5 py-3 flex items-center gap-3 flex-wrap', accentBg)}>
          <h2 className="text-xl font-bold text-white">{subclassName}</h2>
          <Badge variant="outline" className="border-white/60 text-white bg-white/10 text-xs">
            Subclass of {className}
          </Badge>
          <Badge variant="outline" className="border-white/60 text-white bg-white/10 text-xs">
            {edition === '5.5e' ? '2024 Rules' : '5e (2014)'}
          </Badge>
        </div>
      </div>

      {/* Flavor text */}
      {flavorText && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className={cn('flex items-center gap-2 text-sm font-semibold uppercase tracking-wide', accentText)}>
            <BookOpen className="w-4 h-4" />
            About this Subclass
          </div>
          {flavorText.split('\n\n').filter(Boolean).map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>
      )}

      {/* Features by level */}
      {featureLevels.length > 0 && (
        <div className="space-y-6">
          <p className={cn('text-sm font-semibold uppercase tracking-wide', accentText)}>
            Subclass Features
          </p>
          {featureLevels.map(lvl => {
            const featsAtLevel = features.filter(f => f.level === lvl);
            return (
              <div key={lvl} className="space-y-3">
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

                {featsAtLevel.map((f, i) => (
                  <div key={i} className="pl-11 space-y-1.5">
                    <h3 className={cn('text-base font-semibold', accentText)}>{f.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
