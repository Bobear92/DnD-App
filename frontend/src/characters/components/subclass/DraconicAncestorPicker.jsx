/**
 * Dragon Ancestor picker for the Sorcerer Draconic Bloodline (5e) / Draconic
 * Sorcery (2024) subclass. Stores the chosen dragon as { name, damage } in
 * character_data.draconic_bloodline. Used in both Sorcerer sheets' features
 * section. Read-only mode renders a badge (or "—" when unchosen).
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DRACONIC_ANCESTRIES, draconicLabel } from '@/characters/components/subclass/draconicData';

export default function DraconicAncestorPicker({ value = null, onChange, readOnly = false }) {
  const toggle = (anc) => {
    if (value?.name === anc.name) onChange?.(null);
    else onChange?.({ name: anc.name, damage: anc.damage });
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Draconic Ancestry (Dragon Ancestor)</Label>
      {readOnly ? (
        value?.name ? (
          <div><Badge variant="secondary" data-testid="draconic-bloodline-badge">{draconicLabel(value)}</Badge></div>
        ) : (
          <div className="text-sm text-muted-foreground">No dragon type chosen</div>
        )
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {DRACONIC_ANCESTRIES.map(anc => {
            const selected = value?.name === anc.name;
            return (
              <button
                key={anc.name}
                type="button"
                data-testid={`draconic-bloodline-${anc.name}`}
                onClick={() => toggle(anc)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
                }`}
              >
                {anc.name}
                <span className={`ml-1 ${selected ? 'opacity-80' : 'opacity-60'}`}>· {anc.damage}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
