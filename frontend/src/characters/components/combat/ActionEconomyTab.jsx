import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Zap, Repeat, ShieldAlert, Sparkles, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import { CLASS_PROFICIENCIES_5E } from '@/characters/components/classData/classProficienciesData';
import { getRaceGrantedWeapons, getRaceGrantedArmor } from '@/characters/components/race/raceProficienciesData';
import { getAttacks, creatureSize, formatSigned, nonProficientEquippedArmor } from '@/characters/components/inventory/inventoryData';
import { gatherProficiencies } from '@/characters/components/inventory/inventoryProficiencies';
import { isHexWarrior, hexWeaponUid as storedHexWeaponUid } from '@/characters/components/inventory/weaponBondData';
import { gatherFightingStyles } from '@/characters/components/combat/fightingStyles';
import {
  buildActionEconomy, characterSpellNames, TABS, TAB_LABELS, SOURCE_ORDER,
} from '@/characters/components/combat/actionEconomyData';
import { getClassConfig } from '@/characters/components/sheets/classSheet/configs';
import { useRestResource } from '@/characters/components/sheets/classSheet/hooks/useRestResource';
import { RestResourceControl } from '@/characters/components/sheets/classSheet/RestResourceTracker';

const TAB_ICONS = { no_action: Sparkles, action: Swords, bonus: Zap, 'action+bonus': Repeat, reaction: ShieldAlert };

const EMPTY_NOTES = {
  no_action: 'This character has no features that work outside the normal action economy (e.g. Action Surge).',
  action: 'This character has no actions available.',
  bonus: 'This character has nothing it can do as a bonus action.',
  'action+bonus': 'This character has nothing that combines an action and a bonus action (e.g. Two-Weapon Fighting).',
  reaction: 'This character has no reactions available.',
};

/**
 * The weapon to-hit total as a clickable chip — tapping it toggles a breakdown of how
 * the +N is calculated (ability mod, proficiency, fighting styles). Falls back to plain
 * text when there's no breakdown to show.
 */
function ToHitBreakdown({ toHit, breakdown, entryKey }) {
  const [open, setOpen] = useState(false);
  if (!breakdown || breakdown.length === 0) return <span>{toHit}</span>;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
        aria-expanded={open}
        data-testid={`ae-tohit-${entryKey}`}
      >
        {toHit}
      </button>
      {open && (
        <span className="ml-1 text-muted-foreground" data-testid={`ae-tohit-breakdown-${entryKey}`}>
          ({breakdown.map((p) => `${formatSigned(p.value)} ${p.label}`).join(', ')})
        </span>
      )}
    </>
  );
}

function ItemRow({ entry, resource, onChange, readOnly, isGm, campaignId }) {
  // Great Weapon Master power attack: when a weapon entry carries a `powerAttack` variant,
  // a toggle swaps the displayed to-hit/damage between the normal and −5/+10 numbers.
  const [powerOn, setPowerOn] = useState(false);
  const view = powerOn && entry.powerAttack ? entry.powerAttack : entry;
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
        {/* Per-weapon attack rows (e.g. Two-Weapon Fighting main hand / off hand). */}
        {entry.subAttacks && entry.subAttacks.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {entry.subAttacks.map((sa) => (
              <div
                key={sa.label}
                className="flex flex-wrap items-baseline gap-x-2 text-xs"
                data-testid={`ae-twf-${sa.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="w-16 shrink-0 text-muted-foreground">{sa.label}</span>
                <span className="font-medium">{sa.name}</span>
                <span className="text-muted-foreground">
                  {sa.toHit || sa.damage
                    ? `${sa.toHit ? `${sa.toHit} to hit · ` : ''}${sa.damage || ''}${sa.warning ? ' · disadvantage' : ''}`
                    : (sa.detail || '')}
                </span>
              </div>
            ))}
          </div>
        )}
        {entry.toHitBreakdown ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            <ToHitBreakdown toHit={view.toHit} breakdown={view.toHitBreakdown} entryKey={entry.key} />
            {view.detailRest ? ` ${view.detailRest}` : ''}
          </p>
        ) : (
          entry.detail && <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
        )}
        {/* Riders: separate features that hang off this entry (e.g. Arcane Charge on Action
            Surge). Given their own indented line so they don't read as part of the base rule. */}
        {entry.riders?.map((rider) => (
          <p
            key={rider.source}
            className="text-xs text-muted-foreground mt-1.5 border-l-2 border-border pl-2"
            data-testid={`ae-rider-${rider.source.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <span className="font-medium text-foreground">{rider.source}</span>
            {rider.text ? ` — ${rider.text}` : ''}
          </p>
        ))}
        {entry.powerAttack && (
          <button
            type="button"
            onClick={() => setPowerOn((v) => !v)}
            className={cn(
              'mt-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
              powerOn
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={powerOn}
            data-testid={`ae-gwm-toggle-${entry.key}`}
          >
            {powerOn ? 'Great Weapon Master: on (−5 hit / +10 dmg)' : 'Use Great Weapon Master (−5 hit / +10 dmg)'}
          </button>
        )}
        {entry.warning && (
          <p className="text-[11px] text-amber-600 leading-tight mt-0.5" data-testid={`ae-warning-${entry.key}`}>⚠ {entry.warning}</p>
        )}
        {entry.loadingNote && (
          <p
            className={cn('text-[11px] leading-tight mt-0.5', /ignored/i.test(entry.loadingNote) ? 'text-emerald-600' : 'text-amber-600')}
            data-testid={`ae-loading-${entry.key}`}
          >
            {entry.loadingNote}{' '}
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/loading`}
              className="text-primary hover:underline"
              data-testid={`loading-learn-more-${entry.key}`}
            >How the Loading property works</Link>
          </p>
        )}
        {entry.spacingNote && (
          <p
            className={cn('text-[11px] leading-tight mt-0.5', /Crossbow Expert/i.test(entry.spacingNote) ? 'text-emerald-600' : 'text-muted-foreground')}
            data-testid={`ae-spacing-${entry.key}`}
          >
            {entry.spacingNote}{' '}
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/spacing`}
              className="text-primary hover:underline"
              data-testid={`spacing-learn-more-${entry.key}`}
            >How spacing works</Link>
          </p>
        )}
        {entry.savageAttacksNote && (
          <p className="text-[11px] text-emerald-600 leading-tight mt-0.5" data-testid={`ae-savage-${entry.key}`}>
            {entry.savageAttacksNote}
          </p>
        )}
        {entry.eldritchStrikeNote && (
          <p className="text-[11px] text-violet-500 leading-tight mt-0.5" data-testid={`ae-eldritch-${entry.key}`}>
            {entry.eldritchStrikeNote}
          </p>
        )}
        {entry.hexNote && (
          <p className="text-[11px] text-violet-500 leading-tight mt-0.5" data-testid={`ae-hex-${entry.key}`}>
            {entry.hexNote}
          </p>
        )}
        {entry.critRange && (
          <p className="text-[11px] text-primary leading-tight font-medium mt-0.5" data-testid={`ae-crit-${entry.key}`}>
            Crit {entry.critRange}{entry.critSource ? ` (${entry.critSource})` : ''}
          </p>
        )}
        {entry.remarkableMoveNote && (
          <p className="text-[11px] text-emerald-600 leading-tight mt-0.5" data-testid={`ae-remarkable-move-${entry.key}`}>
            {entry.remarkableMoveNote}
          </p>
        )}
        {entry.greatWeaponMasterNote && (
          <p className="text-[11px] text-emerald-600 leading-tight mt-0.5" data-testid={`ae-gwm-${entry.key}`}>
            {entry.greatWeaponMasterNote}
          </p>
        )}
      </div>
      {/* Rest-rechargeable features get the same Use button as the Features tab. */}
      {resource && (
        <RestResourceControl row={resource} onChange={onChange} readOnly={readOnly} isGm={isGm} idPrefix="ae-rest" />
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
  onChange, readOnly = false, isGm = false,
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
    encyclopediaService.getSpells(campaignId, edition).then((all) => {
      if (cancelled) return;
      const idx = {};
      for (const s of all || []) {
        idx[(s.name || '').toLowerCase()] = { casting_time: s.casting_time, level: s.level, school: s.school };
      }
      setSpellIndex(idx);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId, edition, spellNames.length]);

  const proficiencies = gatherProficiencies({ charClass, subclass, edition, characterData });
  // Class text + race trait grants + gathered grants (feat/subclass weapon riders like
  // Hex Warrior's martial weapons) — same assembly as the Items tab.
  const weaponProfText = [(CLASS_PROFICIENCIES_5E[charClass] || {}).weapons || '', ...proficiencies.weapons.grants].filter(Boolean).join(', ');
  const raceWeapons = [...(getRaceGrantedWeapons(race, subrace) || []), ...proficiencies.weapons.grants];
  const size = creatureSize(characterData, race);
  const styles = gatherFightingStyles(characterData);
  // Armor proficiency context (class text + race trait grants + stored race/feat grants) —
  // worn non-proficient armor puts every STR/DEX attack roll at disadvantage and blocks casting.
  const armorProfText = (CLASS_PROFICIENCIES_5E[charClass] || {}).armor || '';
  const raceArmor = [
    ...(getRaceGrantedArmor(race, subrace) || []),
    ...proficiencies.armor.grants,
  ];
  const badArmor = nonProficientEquippedArmor(inventory, { armorProfText, raceArmor });
  // Hexblade's designated Hex Warrior weapon attacks with CHA when it's better.
  const hexUid = isHexWarrior({ charClass, subclass, edition }) ? storedHexWeaponUid(characterData) : null;
  const attacks = getAttacks({ inventory, scores, level, weaponProfText, raceWeapons, size, edition, feats: characterData?.feats, styles, armorProfText, raceArmor, hexWeaponUid: hexUid });

  // A loading weapon caps the Attack action to one shot even with Extra Attack (unless a
  // feat lifts it — Crossbow Expert sets loadingNote to "…ignored…"). Surface a caveat on
  // the Extra Attack note when such a weapon is equipped.
  const cappedLoadingWeapon = attacks.find((a) => a.loadingNote && !/ignored/i.test(a.loadingNote));

  const economy = useMemo(
    () => buildActionEconomy({ charClass, subclass, level, edition, characterData, inventory, attacks, scores, spellIndex, armorProfText, raceArmor }),
    [charClass, subclass, level, edition, characterData, inventory, attacks, spellIndex, armorProfText, raceArmor]
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
      <div className="flex justify-end -mb-2">
        <Link
          to={`/campaigns/${campaignId}/encyclopedia/mechanics/action-economy`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          data-testid="action-economy-learn-more"
        >
          Learn more <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

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
          {cappedLoadingWeapon && (
            <span className="text-amber-600" data-testid="ae-loading-caveat">
              {' '}A loading weapon ({cappedLoadingWeapon.name}) can still be fired only once per action.
            </span>
          )}
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
              {src === 'Spell' && badArmor && (
                <p className="text-[11px] text-amber-600 leading-tight" data-testid="ae-armor-spells">
                  You can't cast spells while wearing {badArmor.name} — you're not proficient with it.
                </p>
              )}
              {src === 'Spell' && (
                <p className="text-[11px] text-muted-foreground leading-tight" data-testid="ae-spacing-spells">
                  A spell that requires a ranged attack roll (Fire Bolt, Eldritch Blast…) has disadvantage while an enemy is within 5 ft.{' '}
                  <Link
                    to={`/campaigns/${campaignId}/encyclopedia/mechanics/spacing`}
                    className="text-primary hover:underline"
                    data-testid="spacing-learn-more-spells"
                  >How spacing works</Link>
                </p>
              )}
              <div className="space-y-2">
                {list.map((e) => (
                  <ItemRow key={e.key} entry={e} resource={resourceFor(e)} onChange={onChange} readOnly={readOnly} isGm={isGm} campaignId={campaignId} />
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
