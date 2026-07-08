/**
 * ClassSheet — one configurable class sheet driven by a per-class config object (see
 * ./configs). Reproduces the per-class hand-written sheets (Fighter + Wizard spike) from
 * data + shared hooks (useLockedChoice, useSlotCaster, useRestResource).
 *
 * Props (same contract as the legacy sheets, plus `gmEdit`):
 *   data, onChange, readOnly, level, creation, section, scores, abilityScores,
 *   backgroundSkills, raceSkills, raceGrantedCantrips, campaignId, isGm, acExtra, maxHpNode, afterHpNode,
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
import { ChevronDown, Plus, X } from 'lucide-react';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import PortentTracker from '@/characters/components/subclass/PortentTracker';
import CombatBlock from '@/characters/components/sheets/classSheet/CombatBlock';
import CasterSpellBlock from '@/characters/components/sheets/classSheet/CasterSpellBlock';
import RestResourceTracker from '@/characters/components/sheets/classSheet/RestResourceTracker';
import SkillProficiencyPicker from '@/characters/components/sheets/classSheet/SkillProficiencyPicker';
import { useLockedChoice } from '@/characters/components/sheets/classSheet/hooks/useLockedChoice';
import { getEarnedSubclassGrants, availableGrantOptions } from '@/characters/components/classData/subclassGrants';
import { getSubclassCaster } from '@/characters/components/classData/subclassCasterData';

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

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

// One earned class feature: collapsed to its name (+ Lvl badge); click to expand the
// description (same pattern as SubclassDetails feature toggles).
function CollapsibleFeature({ feat, lvl }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid={`class-feature-toggle-${feat.name}`}
        className="w-full flex items-center gap-2 p-3 text-left"
      >
        <span className="text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground">Lvl {lvl}</span>
        <span className="font-semibold text-sm flex-1">{feat.name}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
      )}
    </div>
  );
}

function FeaturesList({ features, level, creation }) {
  // The whole earned-features list collapses behind its header (collapsed by default —
  // it's the longest block on the tab); individual features expand independently inside.
  const [open, setOpen] = useState(false);
  if (creation) {
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
  const earned = Array.from({ length: level }, (_, i) => i + 1).flatMap((lvl) =>
    (features[lvl] ?? []).map((feat) => ({ ...feat, lvl }))
  );
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-testid="class-features-toggle"
        className="w-full flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-left"
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Class Features</span>
        <span className="text-xs text-muted-foreground">({earned.length})</span>
        <span className="flex-1" />
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="text-xs text-muted-foreground">Tap a feature to read what it does.</div>
          {earned.map((feat) => (
            <CollapsibleFeature key={`${feat.lvl}-${feat.name}`} feat={feat} lvl={feat.lvl} />
          ))}
        </>
      )}
    </div>
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
    <RestResourceTracker resources={config.restResources} level={level} data={data} onChange={onChange} readOnly={readOnly} />
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
    <SubclassPanel data={data} onChange={onChange} level={level} readOnly={readOnly} edition={config.edition} gmEdit={gmEdit} scores={scores} />
  ) : null;

  // Subclass grants surfaced on the sheet (class-pool picks like Champion's Additional Fighting
  // Style — `surface !== 'banner'`; proficiency grants show in the Items-tab banners instead).
  // Chosen at level-up via the LevelUpWizard and stored in character_data[storeField]; shown
  // read-only here, with an owed slot (a character at/past the grant level with fewer picks than
  // its count — e.g. one who leveled before this feature existed) fillable inline.
  const subclassLevelChoiceBlock = !creation && data.subclass
    ? getEarnedSubclassGrants(config.className, config.edition, data.subclass, level)
        .filter((g) => g.surface !== 'banner')
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

  const featuresListBlock = <FeaturesList features={config.features} level={level} creation={creation} />;

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
          raceGrantedCantrips={raceGrantedCantrips}
        />
      )}

      {showFeatures && featuresListBlock}
      {showFeatures && asiBlock}

      {/* Skill proficiencies — creation only */}
      {creation && showFeatures && skillBlock}
    </div>
  );
}
