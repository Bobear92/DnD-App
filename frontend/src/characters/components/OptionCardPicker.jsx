import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Card-based picker for class choices like fighting styles and subclasses.
 * Each option shows its name and a one-sentence description so players
 * understand what they're selecting before committing.
 *
 * Props:
 *   options: Array of { value: string, description: string }
 *   value:   currently selected value (string)
 *   onChange: (value: string) => void
 */
export default function OptionCardPicker({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'w-full text-left rounded-md border px-3 py-2.5 transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
              : 'border-border hover:bg-muted/50 hover:border-muted-foreground/40',
          )}
        >
          <div className={cn('font-medium text-sm', value === opt.value && 'text-primary')}>
            {opt.value}
          </div>
          {opt.description && (
            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {opt.description}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
