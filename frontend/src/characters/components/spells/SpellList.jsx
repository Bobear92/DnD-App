import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '@/campaigns/CampaignContext';
import { summarizeUpcast, summarizeCantrip } from '@/characters/components/spells/spellUpcast';

const LEVEL_LABELS = {
  0: 'Cantrips',
  1: '1st Level', 2: '2nd Level', 3: '3rd Level',
  4: '4th Level', 5: '5th Level', 6: '6th Level',
  7: '7th Level', 8: '8th Level', 9: '9th Level',
};

// Compact per-tab label ("Cantrips", "1st", "2nd" …, "Other" for spells not in the catalog).
const LEVEL_TAB_LABELS = { 0: 'Cantrips', 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th' };
const levelTabLabel = (lvl) => (lvl === -1 ? 'Other' : (LEVEL_TAB_LABELS[lvl] ?? `L${lvl}`));

const ORDINALS = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th',
  6: '6th', 7: '7th', 8: '8th', 9: '9th',
};

// The slot levels a spell can be cast with: its own level and every higher level
// the character still has an unspent slot in (upcasting). A spell can always be
// cast with a slot ABOVE its base level even when its own level is exhausted.
function castableSlotLevels(baseLevel, availableSlots) {
  return Object.keys(availableSlots || {})
    .map(Number)
    .filter(l => l >= baseLevel && (availableSlots[l] ?? 0) > 0)
    .sort((a, b) => a - b);
}

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
 *                                          clicking Cast opens a confirm dialog before firing this callback.
 *                                          The dialog lets the player choose which slot level to spend
 *                                          (upcasting) — every available slot at or above the spell's level.
 *   availableSlots   { [level]: number }  slots remaining per level; disables Cast when none ≥ base level
 *   spellSaveDc      number               the character's spell save DC (8 + PB + ability mod); when set,
 *                                          the cast dialog shows "Save DC N (ABIL)" for save spells
 *   spellAttackBonus number               the character's spell attack bonus (PB + ability mod); shown for
 *                                          spell-attack spells in the cast dialog + on cantrip rows
 *   characterLevel   number               the character's level; when set (cantrip lists only), each
 *                                          cantrip row shows its computed damage-at-this-level + save DC /
 *                                          attack bonus, so the player needn't open the description
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
  spellSaveDc,
  spellAttackBonus,
  characterLevel,
  hideLevelHeadings = false,
  levelTabs = true,
}) {
  const ctx = useCampaign();
  const campaignId = ctx?.campaign?.id;
  const edition = ctx?.campaign?.edition;
  const [catalog, setCatalog] = useState([]);
  const [detailName, setDetailName] = useState(null);
  // Pending cast awaiting confirmation: { name, baseLevel, slotLevels } or null
  const [castConfirm, setCastConfirm] = useState(null);
  // The slot level the player has chosen to spend for the pending cast (upcasting)
  const [castSlotLevel, setCastSlotLevel] = useState(null);
  // Active level sub-tab (when a list spans >1 level it breaks into Cantrips/1st/2nd… tabs)
  const [activeTab, setActiveTab] = useState(null);

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

  // When the list spans more than one level, break it into per-level sub-tabs so it doesn't get
  // crowded (Cantrips / 1st / 2nd …). Only the active level's spells render. A single-level list
  // (including any cantrips-only list) shows no tab bar and renders as before.
  const tabsActive = levelTabs && sortedLevels.length > 1;
  const activeLevel = tabsActive
    ? (sortedLevels.includes(activeTab) ? activeTab : sortedLevels[0])
    : null;
  const visibleLevels = tabsActive ? [activeLevel] : sortedLevels;

  const openDetail = (name) => {
    setDetailName(name);
  };

  // Cantrip rows show their scaling at a glance: damage dice at THIS character level (cantrips
  // scale with character level, not slots) + the save DC / attack bonus, so the player doesn't
  // have to open the description each time. Only when characterLevel is supplied (cantrip lists).
  const cantripMeta = (name) => {
    if (!isCantrips || characterLevel == null) return null;
    const spell = spellMap[name];
    if (!spell) return null;
    const s = summarizeCantrip(spell, characterLevel, { saveDc: spellSaveDc, attackBonus: spellAttackBonus });
    const parts = [];
    if (s.damage) parts.push(`${s.damage.atLevel} damage`);
    if (s.save) parts.push(`Save DC ${s.save.dc} (${s.save.ability})`);
    if (s.attackBonus != null) parts.push(`Spell atk ${s.attackBonus >= 0 ? '+' : ''}${s.attackBonus}`);
    return parts.length ? parts.join(' · ') : null;
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

      {tabsActive && (
        <div className="flex flex-wrap gap-1.5" data-testid="spell-level-tabs">
          {sortedLevels.map(lvl => (
            <button
              key={lvl}
              type="button"
              data-testid={`spell-level-tab-${lvl}`}
              onClick={() => setActiveTab(lvl)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                activeLevel === lvl ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/50',
              )}
            >
              {levelTabLabel(lvl)} ({grouped[lvl].length})
            </button>
          ))}
        </div>
      )}

      {visibleLevels.map(lvl => {
        const names = grouped[lvl];
        if (!names?.length) return null;
        const heading = isCantrips
          ? 'Cantrips'
          : (lvl === -1 ? 'Other Spells' : (LEVEL_LABELS[lvl] ?? `Level ${lvl}`));
        return (
          <div key={lvl}>
            {!hideLevelHeadings && !tabsActive && (
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 pt-1">
                {heading}
              </div>
            )}
            <div className="rounded-md border divide-y">
              {names.map(name => {
                const castable = onCastSpell && lvl > 0;
                const slotLevels = castable ? castableSlotLevels(lvl, availableSlots) : [];
                const castDisabled = castable && slotLevels.length === 0;
                const meta = cantripMeta(name);
                return (
                  <div key={name} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/30 group">
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => openDetail(name)}
                        className="text-sm text-left hover:text-primary hover:underline w-full truncate block"
                      >
                        {name}
                      </button>
                      {meta && (
                        <div data-testid={`cantrip-meta-${name}`} className="text-xs text-muted-foreground truncate">
                          {meta}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {castable && (
                        <button
                          type="button"
                          data-testid={`cast-spell-${name}`}
                          disabled={castDisabled}
                          onClick={() => {
                            if (castDisabled) return;
                            setCastConfirm({ name, baseLevel: lvl, slotLevels });
                            setCastSlotLevel(slotLevels[0]);
                          }}
                          title={castDisabled ? 'No spell slots available at or above this level' : `Cast ${name}`}
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
          {castConfirm && (() => {
            const slotLevels = castConfirm.slotLevels ?? [];
            const canUpcast = slotLevels.length > 1;
            const spell = spellMap[castConfirm.name] ?? { level: castConfirm.baseLevel };
            const summary = summarizeUpcast(spell, castSlotLevel, {
              saveDc: spellSaveDc,
              attackBonus: spellAttackBonus,
            });
            const isUpcast = summary.isUpcast;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Cast {castConfirm.name}?</DialogTitle>
                  <DialogDescription>
                    {canUpcast
                      ? `Choose which spell slot to spend (level ${castConfirm.baseLevel} spell).`
                      : `This will use a level ${castSlotLevel} spell slot.`}
                  </DialogDescription>
                </DialogHeader>

                {canUpcast && (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {slotLevels.map(sl => (
                      <button
                        key={sl}
                        type="button"
                        data-testid={`cast-slot-${sl}`}
                        onClick={() => setCastSlotLevel(sl)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          castSlotLevel === sl
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        {ORDINALS[sl] ?? `L${sl}`}
                        <span className="opacity-70"> ({availableSlots?.[sl] ?? 0} left)</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Computed figures the player asked for: what the save DC / attack / damage
                    actually are at the chosen slot. Only shown when we can state them honestly. */}
                {(summary.save || summary.attackBonus != null || summary.damage) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" data-testid="cast-figures">
                    {summary.damage && (
                      <div data-testid="cast-damage">
                        <span className="font-medium">
                          {summary.damage.kind === 'healing' ? 'Healing: ' : 'Damage: '}
                        </span>
                        <span className={isUpcast ? 'text-primary font-semibold' : ''}>
                          {summary.damage.atLevel}
                        </span>
                        {isUpcast && summary.damage.atLevel !== summary.damage.base && (
                          <span className="text-muted-foreground"> (base {summary.damage.base})</span>
                        )}
                      </div>
                    )}
                    {summary.save && (
                      <div data-testid="cast-save-dc">
                        <span className="font-medium">Save DC: </span>
                        {summary.save.dc} <span className="text-muted-foreground">({summary.save.ability})</span>
                      </div>
                    )}
                    {summary.attackBonus != null && (
                      <div data-testid="cast-attack">
                        <span className="font-medium">Spell attack: </span>
                        {summary.attackBonus >= 0 ? `+${summary.attackBonus}` : summary.attackBonus}
                      </div>
                    )}
                  </div>
                )}

                {summary.noExtraEffect ? (
                  <div data-testid="cast-no-extra" className="rounded-md border p-2 text-xs text-muted-foreground">
                    This spell does nothing extra when cast at a higher level.
                  </div>
                ) : (
                  <div
                    data-testid="cast-higher-level"
                    className={`rounded-md border p-2 text-xs ${
                      isUpcast ? 'border-primary/50 bg-primary/5' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="font-medium">At Higher Levels: </span>
                    {summary.higherLevelText}
                  </div>
                )}

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
                      onCastSpell?.(castConfirm.name, castSlotLevel);
                      setCastConfirm(null);
                    }}
                  >
                    Cast{isUpcast ? ` (level ${castSlotLevel})` : ''}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
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
