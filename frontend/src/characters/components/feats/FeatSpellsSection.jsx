import React from 'react';
import SpellLevelTabs from '@/characters/components/spells/SpellLevelTabs';
import SpellList from '@/characters/components/spells/SpellList';
import SpellAddPicker from '@/characters/components/spells/SpellAddPicker';
import { RestResourceControl } from '@/characters/components/sheets/classSheet/RestResourceTracker';
import { getFeatGrantedSpells } from '@/characters/components/feats/featEffects';

/**
 * The Spells-tab "Feats" sub-tab: spells a character gained from feats (Magic Initiate, …),
 * shown in Cantrips + per-level sub-tabs via SpellLevelTabs, plus a 1/long-rest free-cast
 * tracker for granted leveled spells and a growable Ritual Book (Ritual Caster — cast as
 * rituals only). Renders null when no feat granted any spells or ritual book.
 *
 * Props:
 *   feats          character_data.feats (each may carry a `choices.spell_grant` snapshot)
 *   characterData  for the free-cast `<key>_used` counters
 *   onChange       (patch) => void — persists a free-cast use or a ritual-book edit (autoSaveClassPatch)
 *   readOnly       hides the Use + ritual add/remove controls
 *   isGm           shows the GM-only "−" recover control (a player spends only; the free
 *                  cast returns from a long rest)
 */
export default function FeatSpellsSection({ feats = [], characterData = {}, onChange, readOnly = false, isGm = false, campaignId }) {
  const { cantrips, leveled, freeCasts, ritualBooks } = getFeatGrantedSpells(feats);
  const spells = [...cantrips, ...leveled];
  if (spells.length === 0 && ritualBooks.length === 0) return null;

  // Persist a ritual book edit back onto the right feat instance's choices.spell_grant.ritual_book.
  const updateRitualBook = (featIndex, nextBook) => {
    const nextFeats = feats.map((f, i) => (i === featIndex
      ? { ...f, choices: { ...(f.choices || {}), spell_grant: { ...(f.choices?.spell_grant || {}), ritual_book: nextBook } } }
      : f));
    onChange?.({ feats: nextFeats });
  };

  return (
    <div className="space-y-3" data-testid="feat-spells-section">
      {spells.length > 0 && (
        <SpellLevelTabs spells={spells} testIdPrefix="feat-spell-tab" emptyText="No feat spells." />
      )}

      {ritualBooks.map((book) => (
        <div key={book.featIndex} className="rounded-md border bg-muted/30 p-3 space-y-1.5" data-testid={`ritual-book-${book.source}`}>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ritual Book · {book.source}</div>
          <SpellList
            spells={book.spells}
            onRemove={readOnly ? undefined : (name) => updateRitualBook(book.featIndex, book.spells.filter((n) => n !== name))}
            readOnly={readOnly}
            label="Click a spell for details · cast as a ritual only (no spell slot)"
          />
          {/* A ritual you copy into the book must be a real ritual spell from your list. */}
          {!readOnly && (
            <SpellAddPicker
              className={book.spellList}
              campaignId={campaignId}
              spells={book.spells}
              onAdd={(name) => updateRitualBook(book.featIndex, [...book.spells, name])}
              onRemove={(name) => updateRitualBook(book.featIndex, book.spells.filter((n) => n !== name))}
              minSpellLevel={1}
              ritualOnly
              label="Copy a ritual into the book"
              testId={`ritual-add-${book.source}`}
            />
          )}
        </div>
      ))}

      {freeCasts.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Free Casts · 1 / long rest</div>
          {freeCasts.map((fc) => {
            const used = characterData[fc.usedKey] || 0;
            const row = { key: fc.usedKey, label: fc.name, total: 1, used, remaining: 1 - used, recharge: 'long' };
            return (
              <div key={fc.usedKey} className="flex items-center justify-between" data-testid={`feat-freecast-${fc.name}`}>
                <div className="text-sm min-w-0">
                  <span className="font-medium">{fc.name}</span>
                  <span className="text-xs text-muted-foreground"> · {fc.source}</span>
                </div>
                <RestResourceControl row={row} onChange={onChange} readOnly={readOnly} isGm={isGm} idPrefix="feat-freecast" />
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground">Cast once per long rest for free, or expend a spell slot of the appropriate level.</p>
        </div>
      )}
    </div>
  );
}
