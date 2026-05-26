import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Card-based picker for class choices like fighting styles and subclasses.
 * Each option shows its name and a one-sentence description so players
 * understand what they're selecting before committing.
 *
 * Props:
 *   options:       Array of { value: string, description: string }
 *   value:         currently selected value (string)
 *   onChange:      (value: string) => void
 *   onDetailClick: optional (value: string) => void — shows an info button per card
 */
export default function OptionCardPicker({ options, value, onChange, onDetailClick }) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <div
          key={opt.value}
          className={cn(
            'w-full rounded-md border transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
              : 'border-border hover:border-muted-foreground/40',
          )}
        >
          <button
            type="button"
            onClick={() => onChange(opt.value)}
            className="w-full text-left px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className={cn('font-medium text-sm', value === opt.value && 'text-primary')}>
                {opt.value}
              </div>
              {onDetailClick && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onDetailClick(opt.value); }}
                  data-testid={`subclass-info-${opt.value}`}
                  className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`View details for ${opt.value}`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {opt.description && (
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {opt.description}
              </div>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
