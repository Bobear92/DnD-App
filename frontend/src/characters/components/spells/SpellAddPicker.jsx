import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import ClassSpellBrowser from '@/characters/components/spells/ClassSpellBrowser';

/**
 * The ONLY way to add a spell to a character.
 *
 * SpellList is display+remove only — there is no free-text "type a spell name" input anywhere
 * in the app, because a character may only know spells that exist in the compendium. This is
 * the collapsed catalog picker that replaces it: a button that opens a learn-mode
 * ClassSpellBrowser scoped to the right class list and spell levels.
 *
 * Homebrew reaches a character the same way: the GM authors the spell into the campaign
 * compendium, and it then shows up in this picker like any other.
 *
 * Props:
 *   className     the spell list to draw from ("Cleric", "Wizard", …)
 *   campaignId
 *   spells        the names already on the list (so the browser marks them chosen)
 *   limit         max the character may know (null = uncapped)
 *   onAdd/onRemove
 *   minSpellLevel / maxSpellLevel   0/0 = cantrips only
 *   schools       optional school restriction (5e Eldritch Knight)
 *   label         button text, e.g. "Add a cantrip"
 *   testId        data-testid for the toggle button + panel
 */
export default function SpellAddPicker({
  className,
  campaignId,
  spells = [],
  limit = null,
  onAdd,
  onRemove,
  minSpellLevel = 1,
  maxSpellLevel = 9,
  schools = null,
  ritualOnly = false,
  grantedSpells = [],
  grantedLabel = 'Already granted',
  label = 'Add a spell',
  testId = 'spell-add-picker',
}) {
  const [open, setOpen] = useState(false);
  if (!className || !campaignId) return null;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        data-testid={`${testId}-toggle`}
        onClick={() => setOpen(o => !o)}
        className="gap-1 h-8 text-xs"
      >
        {open ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {open ? 'Close' : label}
      </Button>

      {open && (
        <div className="rounded-md border p-3" data-testid={testId}>
          <ClassSpellBrowser
            mode="learn"
            className={className}
            campaignId={campaignId}
            preparedSpells={spells}
            prepareLimit={limit}
            onAdd={onAdd}
            onRemove={onRemove}
            minSpellLevel={minSpellLevel}
            maxSpellLevel={maxSpellLevel}
            schools={schools}
            ritualOnly={ritualOnly}
            grantedSpells={grantedSpells}
            grantedLabel={grantedLabel}
          />
        </div>
      )}
    </div>
  );
}
