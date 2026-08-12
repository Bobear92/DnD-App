/**
 * ClassSheet — one configurable class sheet driven by a per-class config object (see
 * ./configs). Reproduces the per-class hand-written sheets (Fighter + Wizard spike) from
 * data + shared hooks (useLockedChoice, useSlotCaster, useRestResource).
 *
 * Props (same contract as the legacy sheets, plus `gmEdit`):
 *   data, onChange, readOnly, level, creation, section, scores, abilityScores,
 *   backgroundSkills, raceSkills, raceGrantedCantrips, raceGrantedLeveled, racialUseControls,
 *   campaignId, isGm, acExtra, maxHpNode, afterHpNode,
 *   gmEdit  — GM Edit toggle: when true, locked permanent choices become editable.
 *
 * `section`: 'all' | 'stats' | 'features' | 'spells' (CLAUDE.md section isolation).
 */
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, Plus, X } from 'lucide-react';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import PortentTracker from '@/characters/components/subclass/PortentTracker';
import CombatBlock from '@/characters/components/sheets/classSheet/CombatBlock';
import CasterSpellBlock from '@/characters/components/sheets/classSheet/CasterSpellBlock';
import RestResourceTracker from '@/characters/components/sheets/classSheet/RestResourceTracker';
import SkillProficiencyPicker from '@/characters/components/sheets/classSheet/SkillProficiencyPicker';
import { useLockedChoice } from '@/characters/components/sheets/classSheet/hooks/useLockedChoice';
import KnownOptionsBlock from '@/characters/components/sheets/classSheet/KnownOptionsBlock';
import { getEarnedSubclassGrants, availableGrantOptions } from '@/characters/components/classData/subclassGrants';
import { getEarnedLevelChoices } from '@/characters/components/classData/levelChoicesData';
import { getSubclassCaster } from '@/characters/components/classData/subclassCasterData';
import Field from '@/characters/components/sheets/Field';

function WeaponMasteryList({ value = [], onChange, readOnly, max }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim();
    if (!t || value.includes(t) || value.length >= max) return;
    onChange([...value, t]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
        {value.map((w) => (
          <Badge key={w} variant="secondary" className="gap-1">
            {w}
            {!readOnly && (
              <button onClick={() => onChange(value.filter((x) => x !== w))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground">None set</span>}
      </div>
      {!readOnly && value.length < max && (
        <div className="flex gap-2">
          <Input placeholder="Weapon name…" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            className="flex-1 h-8 text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
}

// During CREATION the level-1 features are the only place to read what the class does, so they
// are listed here. On a live sheet there is no features list: the mechanised features already
// have their own blocks above, and the full rules text lives in the encyclopedia (below).
function CreationFeaturesList({ features }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
      {(features[1] ?? []).map((feat) => (
        <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
          <div className="font-semibold text-sm">{feat.name}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
        </div>
      ))}
    </div>
  );
}

// Replaces the old earned-features dropdown: the class's whole rules text at every level lives on
// the encyclopedia class page, so the sheet links there instead of duplicating it. Rendered from a
// campaign route, so campaignId comes from the URL — outside a router (a sheet rendered bare in a
// test) it's undefined and the link is simply omitted, same as SubclassDetails.
function ClassEncyclopediaLink({ className }) {
  const { campaignId } = useParams();
  if (!campaignId) return null;
  return (
    <Link
      to={`/campaigns/${campaignId}/encyclopedia/classes/${encodeURIComponent(className)}`}
      data-testid="class-encyclopedia-link"
      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
    >
      <BookOpen className="w-3.5 h-3.5" />
      {className} in the Encyclopedia
      <ChevronRight className="w-3.5 h-3.5" />
    </Link>
  );
}

export default function ClassSheet({
  config,
  data = {},
  onChange,
  readOnly = false,
  level = 1,
  creation = false,
  backgroundSkills = [],
  raceSkills = [],
  raceGrantedCantrips = [],
  raceGrantedLeveled = [],
  racialUseControls = null,
  featSpells = null,
  featTrackers = null,
  section = 'all',
  scores = {},
  abilityScores = {},
  campaignId,
  isGm = false,
  gmEdit = false,
  acExtra = null,
  maxHpNode = null,
  afterHpNode = null,
  effectiveMaxHp,
  onHeal,
}) {
  const set = (key, value) => onChange?.({ [key]: value });
  const conMod = Math.floor(((scores.constitution ?? 10) - 10) / 2);
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const subclassUnlocked = level >= config.subclass.unlockLevel;

  const subclassLocked = useLockedChoice({ value: data.subclass, creation, gmEdit, readOnly }).locked;

  // Inside the Features tab the content splits into two sub-tabs: General class features
  // vs the subclass's features. Other sections (stats/spells/all/creation) render flat.
  const [featuresTab, setFeaturesTab] = useState('general');

  // Class-level caster (Wizard) or a subclass-granted one (Eldritch Knight — level-gated
  // to the subclass unlock). Drives the shared CasterSpellBlock.
  const activeCaster = config.caster
    ?? getSubclassCaster(config.className, config.edition, data.subclass, level);

  // Martial (non-caster) characters render nothing in the spells section. This return
  // sits BELOW the hooks: it depends on data.subclass, so it can flip within a mounted
  // component (GM sets the subclass) — returning before the hooks would change the hook
  // order between renders.
  if (section === 'spells' && !activeCaster) return null;

  // ── Feature blocks (defined once, composed into either the flat layout or the sub-tabs) ──

  const extraAttacksBlock = config.extraAttacks && level >= 5 ? (
    <div className="grid gap-3 grid-cols-1">
      <div className="rounded-md border px-3 py-2 text-center">
        <div className="text-xs text-muted-foreground">Extra Attacks</div>
        <div className="font-bold text-lg">{config.extraAttacks(level)}</div>
      </div>
    </div>
  ) : null;

  const lockedChoicesBlock = config.lockedChoices?.map((lc) => {
    if (level < (lc.minLevel ?? 1)) return null;
    const locked = readOnly || (!creation && !gmEdit && !!data[lc.key]);
    const chosen = lc.options.find((o) => o.value === data[lc.key]);
    return (
      <Field key={lc.key} label={lc.label}>
        {locked ? (
          data[lc.key] ? (
            <div className="rounded-md border bg-muted/20 p-3 space-y-1">
              <div className="font-semibold text-sm">{data[lc.key]}</div>
              {chosen?.description && (
                <div className="text-xs text-muted-foreground leading-relaxed">{chosen.description}</div>
              )}
            </div>
          ) : (
            <div className="text-sm py-2">—</div>
          )
        ) : (
          <OptionCardPicker options={lc.options} value={data[lc.key] ?? ''} onChange={(v) => set(lc.key, v)} />
        )}
      </Field>
    );
  });

  const weaponMasteryBlock = config.weaponMastery ? (
    <Field label={`${config.weaponMastery.label} (${config.weaponMastery.max(level)} ${config.weaponMastery.note})`}>
      <WeaponMasteryList
        value={data.weapon_masteries ?? []}
        onChange={(v) => set('weapon_masteries', v)}
        readOnly={readOnly}
        max={config.weaponMastery.max(level)}
      />
    </Field>
  ) : null;

  const restResourcesBlock = (!creation && config.restResources?.length > 0) ? (
    <RestResourceTracker resources={config.restResources} level={level} data={data} scores={scores} onChange={onChange} readOnly={readOnly} isGm={isGm} />
  ) : null;

  const notesBlock = config.notes?.map((n) => (
    level >= (n.minLevel ?? 1) && (
      <div key={n.label} className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{n.label}</span>{' '}— {n.text}
      </div>
    )
  ));

  const subclassFieldBlock = subclassUnlocked ? (
    <Field label={config.subclass.label}>
      {subclassLocked ? (
        data.subclass ? (
          <SubclassDetails className={config.className} edition={config.subclass.subclassEdition} subclassName={data.subclass} level={level} />
        ) : (
          <div className="text-sm py-2">—</div>
        )
      ) : (
        <SubclassPickerWithDetail
          options={config.subclass.options}
          value={data.subclass ?? ''}
          onChange={(v) => set('subclass', v)}
          className={config.className}
          edition={config.subclass.subclassEdition}
        />
      )}
    </Field>
  ) : null;

  const portentBlock = config.caster?.portent ? (
    <PortentTracker subclass={data.subclass} level={level} data={data} onChange={onChange} readOnly={readOnly} />
  ) : null;

  // Per-subclass interactive panel (e.g. Battle Master maneuvers + superiority dice),
  // shown in the subclass features area once the subclass is chosen.
  const SubclassPanel = !creation && data.subclass ? config.subclassPanels?.[data.subclass] : null;
  const subclassPanelBlock = SubclassPanel ? (
    <SubclassPanel data={data} onChange={onChange} level={level} readOnly={readOnly} edition={config.edition} gmEdit={gmEdit} isGm={isGm} scores={scores} />
  ) : null;

  // Subclass grants surfaced on the sheet (class-pool picks like Champion's Additional Fighting
  // Style — `surface: 'sheet'`, the default). Every other surface is displayed by whichever
  // panel owns that kind of thing: 'banner' → the Items-tab proficiency banners, 'skills' →
  // the Abilities & Skills panel, 'spells' → the Spells tab.
  // Chosen at level-up via the LevelUpWizard and stored in character_data[storeField]; shown
  // read-only here, with an owed slot (a character at/past the grant level with fewer picks than
  // its count — e.g. one who leveled before this feature existed) fillable inline.
  const subclassLevelChoiceBlock = !creation && data.subclass
    ? getEarnedSubclassGrants(config.className, config.edition, data.subclass, level)
        .filter((g) => (g.surface ?? 'sheet') === 'sheet')
        .map((g) => {
        const held = data[g.storeField] ?? [];
        const owed = !readOnly && held.length < g.count;
        const opts = availableGrantOptions(g, data, { charClass: config.className });
        return (
          <Field key={g.key} label={g.label}>
            <div className="space-y-2" data-testid={`subclass-grant-${g.key}`}>
              {held.map((name) => {
                const opt = g.options.find((o) => o.value === name);
                return (
                  <div key={name} className="rounded-md border bg-muted/20 p-3 space-y-1">
                    <div className="font-semibold text-sm">{name}</div>
                    {opt?.description && (
                      <div className="text-xs text-muted-foreground leading-relaxed">{opt.description}</div>
                    )}
                  </div>
                );
              })}
              {held.length === 0 && !owed && <div className="text-sm py-2">—</div>}
              {owed && (
                <OptionCardPicker
                  options={opts}
                  value=""
                  onChange={(v) => v && set(g.storeField, [...held, v])}
                />
              )}
            </div>
          </Field>
        );
      })
    : null;

  // Pool options the character should already know (Arcane Shot; Metamagic/Invocations once
  // those classes are config-driven), shown read-only via the shared KnownOptionsBlock.
  // Subclass-scoped pools go in the subclass area, class-wide pools with the class features.
  const earnedPools = !creation
    ? getEarnedLevelChoices(config.className, config.edition, level, data.subclass)
    : [];
  const poolBlock = (subclassScoped) => (
    <KnownOptionsBlock
      choices={earnedPools.filter((c) => !!c.subclass === subclassScoped)}
      data={data} onChange={onChange} level={level}
      readOnly={readOnly} gmEdit={gmEdit} scores={scores}
    />
  );

  // Creation needs the level-1 feature text inline; a live sheet sends you to the encyclopedia
  // class page for the full rules instead of repeating them under the mechanised blocks.
  const featuresListBlock = creation
    ? <CreationFeaturesList features={config.features} />
    : <ClassEncyclopediaLink className={config.className} />;

  const asiBlock = config.asiLevels?.some((l) => l <= level) ? (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>{' '}—
      at levels {config.asiLevels.join(', ')}.
    </div>
  ) : null;

  const skillBlock = config.skill ? (
    <Field label={`Skill Proficiencies (choose ${config.skill.count})`}>
      {readOnly ? (
        <div className="flex flex-wrap gap-1">
          {(data.skill_proficiencies ?? []).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
          {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
        </div>
      ) : (
        <SkillProficiencyPicker
          value={data.skill_proficiencies ?? []}
          onChange={(v) => set('skill_proficiencies', v)}
          max={config.skill.count}
          allowed={config.skill.allowed}
          backgroundSkills={backgroundSkills}
          raceSkills={raceSkills}
        />
      )}
    </Field>
  ) : null;

  // General (non-subclass) features and the subclass's own features.
  const generalFeatures = (
    <>
      {extraAttacksBlock}
      {lockedChoicesBlock}
      {weaponMasteryBlock}
      {restResourcesBlock}
      {poolBlock(false)}
      {notesBlock}
      {featuresListBlock}
      {asiBlock}
    </>
  );
  const subclassFeatures = (
    <>
      {subclassFieldBlock ?? (
        <p className="text-sm text-muted-foreground">
          Your {config.subclass.label} unlocks at level {config.subclass.unlockLevel}.
        </p>
      )}
      {subclassPanelBlock}
      {subclassLevelChoiceBlock}
      {poolBlock(true)}
      {portentBlock}
    </>
  );

  // ── Features tab: two sub-tabs (General class features / Subclass features) ──
  if (section === 'features' && !creation) {
    const subclassTabLabel = data.subclass ? `${data.subclass} Features` : 'Subclass Features';
    const tabBtn = (key, label) => (
      <button
        type="button"
        data-testid={`features-subtab-${key}`}
        onClick={() => setFeaturesTab(key)}
        className={cn(
          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          featuresTab === key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {label}
      </button>
    );
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1 border-b border-border pb-2">
          {tabBtn('general', `General ${config.className} Features`)}
          {tabBtn('subclass', subclassTabLabel)}
        </div>
        <div className="space-y-4">
          {featuresTab === 'general' ? generalFeatures : subclassFeatures}
        </div>
      </div>
    );
  }

  // ── Flat layout (all / stats / spells / creation) ──
  return (
    <div className="space-y-4">
      {showFeatures && extraAttacksBlock}

      {/* HP / Hit Dice / AC / Speed */}
      {showCombat && (
        <CombatBlock
          hitDie={config.hitDie}
          data={data}
          set={set}
          readOnly={readOnly}
          level={level}
          creation={creation}
          maxHpNode={maxHpNode}
          afterHpNode={afterHpNode}
          acExtra={acExtra}
          conMod={conMod}
          effectiveMaxHp={effectiveMaxHp}
          onHeal={onHeal}
          scores={scores}
        />
      )}

      {showFeatures && lockedChoicesBlock}
      {showFeatures && weaponMasteryBlock}
      {showFeatures && restResourcesBlock}
      {showFeatures && notesBlock}
      {showFeatures && subclassFieldBlock}
      {showFeatures && subclassPanelBlock}
      {showFeatures && subclassLevelChoiceBlock}
      {showFeatures && poolBlock(false)}
      {showFeatures && poolBlock(true)}
      {showFeatures && portentBlock}

      {/* Caster spell UI (creation pickers + play sub-tabs) */}
      {activeCaster && (
        <CasterSpellBlock
          caster={activeCaster}
          data={data}
          onChange={onChange}
          readOnly={readOnly}
          level={level}
          creation={creation}
          section={section}
          abilityScores={abilityScores}
          campaignId={campaignId}
          isGm={isGm}
          gmEdit={gmEdit}
          raceGrantedCantrips={raceGrantedCantrips}
          raceGrantedLeveled={raceGrantedLeveled}
          racialUseControls={racialUseControls}
          featSpells={featSpells}
          featTrackers={featTrackers}
        />
      )}

      {showFeatures && featuresListBlock}
      {showFeatures && asiBlock}

      {/* Skill proficiencies — creation only */}
      {creation && showFeatures && skillBlock}
    </div>
  );
}
