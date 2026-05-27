import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { useCampaign } from '@/campaigns/CampaignContext';

const LEVEL_LABELS = {
  0: 'Cantrips',
  1: '1st Level', 2: '2nd Level', 3: '3rd Level',
  4: '4th Level', 5: '5th Level', 6: '6th Level',
  7: '7th Level', 8: '8th Level', 9: '9th Level',
};

async function fetchSpellCatalog(campaignId) {
  try {
    const token = localStorage.getItem('token');
    const qs = campaignId ? `?campaign_id=${campaignId}` : '';
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
 * Props:
 *   spells       string[]    current spell names
 *   onAdd        (name)=>void  called when user adds a spell (omit to hide add input)
 *   onRemove     (name)=>void  called when user removes a spell (omit to hide remove buttons)
 *   readOnly     boolean
 *   label        string      section heading
 *   placeholder  string      add-input placeholder text
 *   isCantrips   boolean     if true, skip API level lookup (always shown as Cantrips section)
 */
export default function SpellList({
  spells = [],
  onAdd,
  onRemove,
  readOnly = false,
  label,
  placeholder = 'Add spell…',
  isCantrips = false,
}) {
  const ctx = useCampaign();
  const campaignId = ctx?.campaign?.id;
  const [catalog, setCatalog] = useState([]);
  const [detail, setDetail] = useState(null);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (!isCantrips && campaignId) {
      fetchSpellCatalog(campaignId).then(setCatalog).catch(() => {});
    }
  }, [campaignId, isCantrips]);

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

  const handleAdd = () => {
    const trimmed = newValue.trim();
    if (!trimmed || spells.includes(trimmed)) return;
    onAdd?.(trimmed);
    setNewValue('');
  };

  const openDetail = (name) => {
    setDetail(spellMap[name] ?? { name });
  };

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
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-1 pt-1">
              {heading}
            </div>
            <div className="rounded-md border divide-y">
              {names.map(name => (
                <div key={name} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/30 group">
                  <button
                    type="button"
                    onClick={() => openDetail(name)}
                    className="text-sm text-left hover:text-primary hover:underline flex-1 min-w-0 truncate"
                  >
                    {name}
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      data-testid={`remove-spell-${name}`}
                      onClick={() => onRemove?.(name)}
                      className="text-muted-foreground hover:text-destructive ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!readOnly && onAdd && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            className="flex-1 h-8 text-sm"
          />
          <Button type="button" size="sm" variant="outline" data-testid="spell-add-button" onClick={handleAdd}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={open => !open && setDetail(null)}>
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
