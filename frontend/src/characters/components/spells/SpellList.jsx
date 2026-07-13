import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { useCampaign } from '@/campaigns/CampaignContext';

const LEVEL_LABELS = {
  0: 'Cantrips',
  1: '1st Level', 2: '2nd Level', 3: '3rd Level',
  4: '4th Level', 5: '5th Level', 6: '6th Level',
  7: '7th Level', 8: '8th Level', 9: '9th Level',
};

async function fetchSpellCatalog(campaignId, edition) {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (campaignId) params.set('campaign_id', campaignId);
    if (edition) params.set('edition', edition);
    const qs = params.toString() ? `?${params}` : '';
    const res = await fetch(`http://localhost:8000/api/encyclopedia/spells${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

/**
 * Shared spell list for all class sheets (non-creation mode only).
 * Groups spells by level (cantrips first, then 1st–9th), sorts alphabetically within each section.
 * Clicking a spell name opens a Dialog with full spell details fetched from the encyclopedia API.
 * Falls back gracefully when the API catalog is empty or unavailable.
 *
 * This list is DISPLAY + REMOVE only. There is deliberately no free-text "add a spell" input:
 * a character may only ever know spells that exist in the compendium, so every add flows through
 * a catalog picker (ClassSpellBrowser / SpellPickerCreation). Homebrew spells reach a character
 * by the GM authoring them into the campaign compendium, where the pickers then offer them.
 *
 * Props:
 *   spells           string[]    current spell names
 *   onRemove         (name)=>void  called when user removes a spell (omit to hide remove buttons)
 *   lockedSpells     string[]    spells that CANNOT be removed right now (no X shown) — e.g. a 5e
 *                                Eldritch Knight's permanent cantrips, or spells you can no longer
 *                                swap because this level's one swap is spent. A refusal you can see
 *                                beats a button that silently does nothing.
 *   readOnly         boolean
 *   label            string      section heading
 *   isCantrips       boolean     if true, skip API level lookup (always shown as Cantrips section)
 *   onCastSpell      (name, level)=>void  if provided, shows a Cast button per non-cantrip spell;
 *                                          clicking Cast opens a confirm dialog before firing this callback
 *   availableSlots   { [level]: number }  slots remaining per level; disables Cast when 0
 */
export default function SpellList({
  spells = [],
  onRemove,
  lockedSpells = [],
  readOnly = false,
  label,
  isCantrips = false,
  onCastSpell,
  availableSlots,
  hideLevelHeadings = false,
}) {
  const ctx = useCampaign();
  const campaignId = ctx?.campaign?.id;
  const edition = ctx?.campaign?.edition;
  const [catalog, setCatalog] = useState([]);
  const [detailName, setDetailName] = useState(null);
  // Pending cast awaiting confirmation: { name, level } or null
  const [castConfirm, setCastConfirm] = useState(null);

  // Fetch the catalog regardless of isCantrips: cantrip grouping doesn't need it
  // (cantrips are forced to level 0), but the detail dialog does — without it,
  // clicking any cantrip shows the "not in compendium" fallback.
  useEffect(() => {
    if (campaignId) {
      fetchSpellCatalog(campaignId, edition).then(setCatalog).catch(() => {});
    }
  }, [campaignId, edition]);

  const spellMap = {};
  catalog.forEach(s => { spellMap[s.name] = s; });

  // Group spells by level; sort alphabetically within each group.
  const grouped = {};
  if (isCantrips) {
    grouped[0] = [...spells].sort();
  } else {
    spells.forEach(name => {
      const catalogEntry = spellMap[name];
      const lvl = catalogEntry != null ? catalogEntry.level : -1;
      if (!grouped[lvl]) grouped[lvl] = [];
      grouped[lvl].push(name);
    });
    Object.values(grouped).forEach(arr => arr.sort());
  }

  const sortedLevels = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => (a === -1 ? 1 : b === -1 ? -1 : a - b));

  const openDetail = (name) => {
    setDetailName(name);
  };

  // Derive the open dialog's detail from the LIVE catalog (not captured at click-time), so a
  // spell clicked before the async catalog finishes loading fills in once it arrives instead
  // of being stuck on the "not in compendium" fallback.
  const detail = detailName ? (spellMap[detailName] ?? { name: detailName }) : null;
  const detailHasInfo = detail && (detail.school != null || detail.level != null);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>

      {spells.length === 0 && (
        <div className="rounded-md border p-2 text-xs text-muted-foreground italic">None added</div>
      )}

      {sortedLevels.map(lvl => {
        const names = grouped[lvl];
        if (!names?.length) return null;
        const heading = isCantrips
          ? 'Cantrips'
          : (lvl === -1 ? 'Other Spells' : (LEVEL_LABELS[lvl] ?? `Level ${lvl}`));
        return (
          <div key={lvl}>
            {!hideLevelHeadings && (
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 pt-1">
                {heading}
              </div>
            )}
            <div className="rounded-md border divide-y">
              {names.map(name => {
                const castable = onCastSpell && lvl > 0;
                const slotsLeft = castable ? (availableSlots?.[lvl] ?? 0) : 0;
                const castDisabled = castable && slotsLeft <= 0;
                return (
                  <div key={name} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/30 group">
                    <button
                      type="button"
                      onClick={() => openDetail(name)}
                      className="text-sm text-left hover:text-primary hover:underline flex-1 min-w-0 truncate"
                    >
                      {name}
                    </button>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {castable && (
                        <button
                          type="button"
                          data-testid={`cast-spell-${name}`}
                          disabled={castDisabled}
                          onClick={() => !castDisabled && setCastConfirm({ name, level: lvl })}
                          title={castDisabled ? 'No spell slots remaining at this level' : `Cast using a level ${lvl} slot`}
                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                            castDisabled
                              ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-border'
                              : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                          }`}
                        >
                          Cast
                        </button>
                      )}
                      {!readOnly && onRemove && !lockedSpells.includes(name) && (
                        <button
                          type="button"
                          data-testid={`remove-spell-${name}`}
                          onClick={() => onRemove?.(name)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={!!castConfirm} onOpenChange={open => !open && setCastConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cast {castConfirm?.name}?</DialogTitle>
            <DialogDescription>
              This will use a level {castConfirm?.level} spell slot.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              data-testid="cast-cancel-button"
              onClick={() => setCastConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-testid="cast-confirm-button"
              onClick={() => {
                if (castConfirm) onCastSpell?.(castConfirm.name, castConfirm.level);
                setCastConfirm(null);
              }}
            >
              Cast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailName} onOpenChange={open => !open && setDetailName(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
          </DialogHeader>
          {detailHasInfo ? (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                {detail.level === 0 && <Badge variant="secondary">Cantrip</Badge>}
                {detail.level > 0 && (
                  <Badge variant="secondary">
                    {LEVEL_LABELS[detail.level] ?? `Level ${detail.level}`}
                  </Badge>
                )}
                {detail.school && (
                  <Badge variant="outline" className="capitalize">{detail.school}</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {detail.casting_time && (
                  <div>
                    <div className="font-medium text-foreground text-xs uppercase tracking-wide">Casting Time</div>
                    <div className="text-muted-foreground">{detail.casting_time}</div>
                  </div>
                )}
                {detail.range && (
                  <div>
                    <div className="font-medium text-foreground text-xs uppercase tracking-wide">Range</div>
                    <div className="text-muted-foreground">{detail.range}</div>
                  </div>
                )}
                {detail.components && (
                  <div>
                    <div className="font-medium text-foreground text-xs uppercase tracking-wide">Components</div>
                    <div className="text-muted-foreground">{detail.components}</div>
                  </div>
                )}
                {detail.duration && (
                  <div>
                    <div className="font-medium text-foreground text-xs uppercase tracking-wide">Duration</div>
                    <div className="text-muted-foreground">{detail.duration}</div>
                  </div>
                )}
              </div>
              {detail.description && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {detail.description}
                </p>
              )}
              {detail.classes && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Available to:</span> {detail.classes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              This spell hasn't been added to the compendium yet. Ask your GM to add it, or check the Player's Handbook for details.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
