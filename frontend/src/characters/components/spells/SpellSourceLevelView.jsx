import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCampaign } from '@/campaigns/CampaignContext';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import SpellList from '@/characters/components/spells/SpellList';

const ORD = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th', 9: '9th' };
const levelLabel = (l) => (l === 0 ? 'Cantrips' : (ORD[l] ?? `Level ${l}`));

/**
 * The shared caster Spells-tab layout: ONE level strip (Cantrips · 1st · 2nd …) spanning every
 * source, and, within each level tab, a Class / Racial / Feats source toggle shown only when >1
 * source has a spell at that level. Racial (race-granted cantrips) and Feats (feat-granted spells +
 * their trackers) are rendered here directly; the CLASS content is delegated via `renderClass` so a
 * caster keeps its own list shape (the 5e Eldritch Knight's Abj/Evo + Any-School split, a prepared
 * caster's slot-cast list, etc.).
 *
 * Falls back to a flat stacked layout (class → racial → feats) until the spell catalog loads or when
 * the character has spells at only one level.
 *
 * Props:
 *   campaignId
 *   classCantrips       string[]  class cantrip names (for level 0 + level detection)
 *   classLeveledNames   string[]  class leveled spell names (their level is read from the catalog)
 *   racialCantrips      string[]  race-granted cantrip names
 *   racialLeveled       [{name, level}]  race-granted leveled spells (Infernal Legacy's Hellish
 *                       Rebuke …); level is the level the trait casts it AT, known from the trait
 *   racialUseControls   {[spellName]: node}  each leveled racial spell's once-per-rest use control,
 *                       rendered ON that spell's row. Deliberately not a separate tracker card: the
 *                       spell would then be listed twice under one source (and on every level tab).
 *   featCantrips        string[]  feat-granted cantrip names
 *   featLeveled         [{name, level}]  feat-granted leveled spells (level known from the feat)
 *   featTrackers        node      the feat free-cast / ritual trackers (shown under the Feats source)
 *   characterLevel      number    for cantrip damage-at-level meta on racial/feat cantrips
 *   spellSaveDc, spellAttackBonus  passed to the racial/feat SpellLists
 *   renderClass         (level|null, { atLevel, levelMap }) => node
 *                       class content for a level (null = the flat fallback = all levels at once)
 */
export default function SpellSourceLevelView({
  campaignId,
  classCantrips = [],
  classLeveledNames = [],
  racialCantrips = [],
  racialLeveled = [],
  racialUseControls = null,
  featCantrips = [],
  featLeveled = [],
  featTrackers = null,
  characterLevel = 1,
  spellSaveDc,
  spellAttackBonus,
  renderClass,
}) {
  const ctx = useCampaign();
  const [catalog, setCatalog] = useState([]);
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeSource, setActiveSource] = useState('class');
  useEffect(() => {
    if (!campaignId) return;
    encyclopediaService.getSpells(campaignId, ctx?.campaign?.edition)
      .then((rows) => setCatalog(Array.isArray(rows) ? rows : []))
      .catch(() => {});
  }, [campaignId, ctx?.campaign?.edition]);

  const levelMap = {};
  catalog.forEach((s) => { levelMap[s.name] = s.level; });
  const classLeveledLevels = classLeveledNames.map((n) => levelMap[n]).filter((l) => l > 0);
  const featLeveledLevels = featLeveled.map((f) => f.level).filter((l) => l > 0);
  const racialLeveledLevels = racialLeveled.map((r) => r.level).filter((l) => l > 0);
  const anyCantrips = classCantrips.length + racialCantrips.length + featCantrips.length > 0;
  const presentLevels = [...new Set([
    ...(anyCantrips ? [0] : []),
    ...classLeveledLevels,
    ...featLeveledLevels,
    ...racialLeveledLevels,
  ])].sort((a, b) => a - b);
  const useTabs = catalog.length > 0 && presentLevels.length > 1;
  const activeLvl = useTabs
    ? (presentLevels.includes(activeLevel) ? activeLevel : presentLevels[0])
    : null;
  const atLevel = (names) => (useTabs ? names.filter((n) => levelMap[n] === activeLvl) : names);
  const levelCount = (l) => (l === 0
    ? classCantrips.length + racialCantrips.length + featCantrips.length
    : classLeveledNames.filter((n) => levelMap[n] === l).length
      + featLeveled.filter((f) => f.level === l).length
      + racialLeveled.filter((r) => r.level === l).length);

  const classAt = (l) => (l === 0 ? classCantrips.length > 0 : classLeveledNames.some((n) => levelMap[n] === l));
  const racialAt = (l) => (l === 0 ? racialCantrips.length > 0 : racialLeveled.some((r) => r.level === l));
  const featAt = (l) => (l === 0 ? featCantrips.length > 0 : featLeveled.some((f) => f.level === l));
  const sourcesAt = (l) => [
    classAt(l) && { key: 'class', label: 'Class' },
    racialAt(l) && { key: 'racial', label: 'Racial' },
    featAt(l) && { key: 'feats', label: 'Feats' },
  ].filter(Boolean);

  // l == null → flat view (every racial spell at once); else the racial spells at that level.
  const racialNode = (l) => {
    const names = l == null
      ? [...racialCantrips, ...racialLeveled.map((r) => r.name)]
      : (l === 0 ? racialCantrips : racialLeveled.filter((r) => r.level === l).map((r) => r.name));
    if (names.length === 0) return null;
    return (
      <div className="rounded-lg border bg-card p-3 space-y-2" data-testid="spell-source-racial-content">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Race-Granted Spells</div>
        <SpellList spells={names} readOnly label="" isCantrips={l === 0} hideLevelHeadings levelTabs={false}
          characterLevel={l === 0 ? characterLevel : undefined}
          spellSaveDc={spellSaveDc} spellAttackBonus={spellAttackBonus}
          rowExtras={racialUseControls ? ((n) => racialUseControls[n] ?? null) : undefined} />
        {l === 0 && racialCantrips.length > 0 && (
          <p className="text-xs text-muted-foreground">Always known. No spell slot required.</p>
        )}
      </div>
    );
  };
  // l == null → flat view (all feat spells at once); else the feat spells at that level.
  const featsNode = (l) => {
    const names = l == null
      ? [...featCantrips, ...featLeveled.map((f) => f.name)]
      : (l === 0 ? featCantrips : featLeveled.filter((f) => f.level === l).map((f) => f.name));
    return (
      <div className="rounded-lg border bg-card p-3 space-y-2" data-testid="spell-source-feats-content">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spells from Feats</div>
        {names.length > 0 && (
          <SpellList spells={names} readOnly label="" isCantrips={l === 0} hideLevelHeadings levelTabs={false}
            characterLevel={l === 0 ? characterLevel : undefined} spellSaveDc={spellSaveDc} spellAttackBonus={spellAttackBonus} />
        )}
        {featTrackers}
      </div>
    );
  };

  if (!useTabs) {
    // Flat fallback (catalog not loaded / ≤1 level): stack every source's content.
    return (
      <>
        {renderClass?.(null, { atLevel: (n) => n, levelMap })}
        {racialNode(null)}
        {(featCantrips.length + featLeveled.length > 0 || featTrackers) && featsNode(null)}
      </>
    );
  }

  const srcs = sourcesAt(activeLvl);
  const activeKey = srcs.some((s) => s.key === activeSource) ? activeSource : srcs[0]?.key;
  return (
    <>
      <div className="flex flex-wrap gap-1.5" data-testid="spell-level-tabs">
        {presentLevels.map((l) => (
          <button
            key={l}
            type="button"
            data-testid={`spell-level-tab-${l}`}
            onClick={() => setActiveLevel(l)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs transition-colors',
              activeLvl === l ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/50',
            )}
          >
            {levelLabel(l)} ({levelCount(l)})
          </button>
        ))}
      </div>
      {srcs.length > 1 && (
        <div className="flex gap-1.5" data-testid="spell-source-tabs">
          {srcs.map((s) => (
            <Button
              key={s.key}
              type="button"
              size="sm"
              variant={activeKey === s.key ? 'default' : 'outline'}
              data-testid={`spell-source-${s.key}`}
              onClick={() => setActiveSource(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      )}
      {activeKey === 'class' && renderClass?.(activeLvl, { atLevel, levelMap })}
      {activeKey === 'racial' && racialNode(activeLvl)}
      {activeKey === 'feats' && featsNode(activeLvl)}
    </>
  );
}
