import { useState, useEffect, useMemo } from 'react';
import { Swords, Zap, Repeat, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import { CLASS_PROFICIENCIES_5E } from './classProficienciesData';
import { getRaceGrantedWeapons } from './raceProficienciesData';
import { getAttacks, creatureSize } from './inventoryData';
import {
  buildActionEconomy, characterSpellNames, TABS, TAB_LABELS, SOURCE_ORDER,
} from './actionEconomyData';
import { getClassConfig } from './classSheet/configs';
import { useRestResource } from './classSheet/hooks/useRestResource';
import { RestResourceControl } from './classSheet/RestResourceTracker';

const TAB_ICONS = { no_action: Sparkles, action: Swords, bonus: Zap, 'action+bonus': Repeat, reaction: ShieldAlert };

const EMPTY_NOTES = {
  no_action: 'This character has no features that work outside the normal action economy (e.g. Action Surge).',
  action: 'This character has no actions available.',
  bonus: 'This character has nothing it can do as a bonus action.',
  'action+bonus': 'This character has nothing that combines an action and a bonus action (e.g. Two-Weapon Fighting).',
  reaction: 'This character has no reactions available.',
};

function ItemRow({ entry, resource, onChange, readOnly }) {
  return (
    <div
      className="flex items-start justify-between gap-3 rounded-md border bg-card px-3 py-2"
      data-testid={resource ? `ae-resource-${resource.key}` : undefined}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{entry.name}</span>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide shrink-0">{entry.cost}</Badge>
        </div>
        {entry.detail && <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>}
        {entry.warning && (
          <p className="text-[11px] text-amber-600 leading-tight mt-0.5" data-testid={`ae-warning-${entry.key}`}>⚠ {entry.warning}</p>
        )}
      </div>
      {/* Rest-rechargeable features get the same Use button as the Features tab. */}
      {resource && (
        <RestResourceControl row={resource} onChange={onChange} readOnly={readOnly} idPrefix="ae-rest" />
      )}
    </div>
  );
}

/**
 * Action Economy tab body: shows what THIS character can do, bucketed into Actions /
 * Bonus Actions / Action+Bonus / Reactions sub-tabs. Sources are auto-derived
 * (equipped-weapon attacks, spells classified by casting_time, the universal action
 * menu) plus a curated per-class feature map (see actionEconomyData.js). Button-based
 * sub-tabs (not Radix Tabs) to avoid nested tab contexts.
 */
export default function ActionEconomyTab({
  charClass, subclass, level = 1, edition = '5e',
  characterData = {}, inventory = [], scores = {}, race, subrace, campaignId,
  onChange, readOnly = false,
}) {
  const [active, setActive] = useState('action');
  const [spellIndex, setSpellIndex] = useState({});
  const [loading, setLoading] = useState(false);

  const spellNames = useMemo(() => characterSpellNames(characterData), [characterData]);

  // Fetch the spell catalog only when the character actually knows spells, then index
  // by lowercased name → { casting_time, level, school } for classification.
  useEffect(() => {
    if (spellNames.length === 0) { setSpellIndex({}); return; }
    let cancelled = false;
    setLoading(true);
    encyclopediaService.getSpells(campaignId).then((all) => {
      if (cancelled) return;
      const idx = {};
      for (const s of all || []) {
        idx[(s.name || '').toLowerCase()] = { casting_time: s.casting_time, level: s.level, school: s.school };
      }
      setSpellIndex(idx);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId, spellNames.length]);

  const weaponProfText = (CLASS_PROFICIENCIES_5E[charClass] || {}).weapons || '';
  const raceWeapons = getRaceGrantedWeapons(race, subrace) || [];
  const size = creatureSize(characterData, race);
  const attacks = getAttacks({ inventory, scores, level, weaponProfText, raceWeapons, size, edition });

  const economy = useMemo(
    () => buildActionEconomy({ charClass, subclass, level, edition, characterData, inventory, attacks, scores, spellIndex }),
    [charClass, subclass, level, edition, characterData, inventory, attacks, spellIndex]
  );

  // Rest-rechargeable resources from the class config (Fighter: Second Wind, Action Surge,
  // Indomitable). Indexed by key so an entry's `resourceKey` resolves to a live row with
  // remaining/used counts — the Use button writes `<key>_used` back via onChange.
  const config = getClassConfig(charClass, edition);
  const restRows = useRestResource({ resources: config?.restResources ?? [], level, data: characterData });
  const restByKey = {};
  for (const r of restRows) restByKey[r.key] = r;
  const resourceFor = (entry) => (entry.resourceKey ? restByKey[entry.resourceKey] : null) || null;

  const entries = economy[active] || [];
  const special = entries.filter((e) => e.source !== 'Universal');
  const universal = entries.filter((e) => e.source === 'Universal');

  // Group the character-specific entries by source for headed sections.
  const grouped = SOURCE_ORDER
    .filter((src) => src !== 'Universal')
    .map((src) => [src, special.filter((e) => e.source === src)])
    .filter(([, list]) => list.length > 0);

  return (
    <div className="space-y-4" data-testid="action-economy-tab">
      {/* Sub-tab selector */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {TABS.map((tab) => {
          const Icon = TAB_ICONS[tab];
          const count = (economy[tab] || []).length;
          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                active === tab ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid={`ae-subtab-${tab}`}
            >
              <Icon className="h-4 w-4" />
              {TAB_LABELS[tab]}
              {count > 0 && <Badge variant="secondary" className="text-xs px-1.5">{count}</Badge>}
            </button>
          );
        })}
      </div>

      {active === 'action' && economy.attacksPerAction > 1 && (
        <p className="text-xs text-muted-foreground" data-testid="ae-attacks-per-action">
          Extra Attack: you make {economy.attacksPerAction} attacks when you take the Attack action.
        </p>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading spells…</p>}

      {entries.length === 0 ? (
        <p className="text-sm italic text-muted-foreground" data-testid="ae-empty">{EMPTY_NOTES[active]}</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([src, list]) => (
            <div key={src} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{src === 'Weapon' ? 'Weapon Attacks' : src}</h3>
              <div className="space-y-2">
                {list.map((e) => (
                  <ItemRow key={e.key} entry={e} resource={resourceFor(e)} onChange={onChange} readOnly={readOnly} />
                ))}
              </div>
            </div>
          ))}

          {universal.length > 0 && (
            <div className="space-y-2" data-testid="ae-universal">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">General — available to everyone</h3>
              <div className="space-y-2 opacity-80">
                {universal.map((e) => <ItemRow key={e.key} entry={e} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
