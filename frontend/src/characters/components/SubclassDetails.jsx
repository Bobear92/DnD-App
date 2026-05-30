import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBCLASS_DATA } from './subclassData';
import { Label } from '@/components/ui/label';

export default function SubclassDetails({ className, edition, subclassName, level }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (name) => setExpanded(prev => ({ ...prev, [name]: !prev[name] }));

  const editionKey = edition === '5.5e' ? '5.5e' : '5e';
  const subData = SUBCLASS_DATA[className]?.[editionKey]?.[subclassName];

  if (!subData) {
    return <div className="text-sm py-2">{subclassName}</div>;
  }

  const earnedFeatures = subData.features.filter(f => f.level <= level);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{subclassName}</div>
      <div className="text-xs text-muted-foreground italic leading-relaxed">{subData.flavorText}</div>
      {earnedFeatures.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Subclass Features</Label>
          {earnedFeatures.map(feat => {
            const isOpen = !!expanded[feat.name];
            return (
              <div key={feat.name} className="rounded-md border bg-muted/20">
                <button
                  type="button"
                  onClick={() => toggle(feat.name)}
                  aria-expanded={isOpen}
                  data-testid={`feature-toggle-${feat.name}`}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 group"
                >
                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
                    isOpen && 'rotate-90',
                  )} />
                  <span className="text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground shrink-0">Lvl {feat.level}</span>
                  <div className="font-semibold text-sm group-hover:underline">{feat.name}</div>
                </button>
                {isOpen && (
                  <div className="text-xs text-muted-foreground leading-relaxed px-3 pb-3 pl-10">{feat.description}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
