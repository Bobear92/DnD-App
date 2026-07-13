/**
 * Cleric (5e) — class-specific character_data section.
 * d8, full caster, Channel Divinity, Divine Domain subclass (level 1).
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from '@/characters/components/spells/SpellList';
import SpellAddPicker from '@/characters/components/spells/SpellAddPicker';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { CLERIC_SUBCLASSES_5E } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import ClassSpellBrowser, { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import SpellSlotTracker from '@/characters/components/spells/SpellSlotTracker';
import { useSlotCaster } from '@/characters/components/sheets/classSheet/hooks/useSlotCaster';
import { cn } from '@/lib/utils';

const WIZARD_SLOTS = {
  1:  [2,0,0,0,0,0,0,0,0], 2:  [3,0,0,0,0,0,0,0,0],
  3:  [4,2,0,0,0,0,0,0,0], 4:  [4,3,0,0,0,0,0,0,0],
  5:  [4,3,2,0,0,0,0,0,0], 6:  [4,3,3,0,0,0,0,0,0],
  7:  [4,3,3,1,0,0,0,0,0], 8:  [4,3,3,2,0,0,0,0,0],
  9:  [4,3,3,3,1,0,0,0,0], 10: [4,3,3,3,2,0,0,0,0],
  11: [4,3,3,3,2,1,0,0,0], 12: [4,3,3,3,2,1,0,0,0],
  13: [4,3,3,3,2,1,1,0,0], 14: [4,3,3,3,2,1,1,0,0],
  15: [4,3,3,3,2,1,1,1,0], 16: [4,3,3,3,2,1,1,1,0],
  17: [4,3,3,3,2,1,1,1,1], 18: [4,3,3,3,3,1,1,1,1],
  19: [4,3,3,3,3,2,1,1,1], 20: [4,3,3,3,3,2,2,1,1],
};

function slotsForLevel(level) {
  return WIZARD_SLOTS[Math.min(Math.max(level, 1), 20)];
}

function channelDivinityUses(level) {
  if (level >= 18) return 3;
  if (level >= 6)  return 2;
  return 1;
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [], raceSkills = [] }) {
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const extraBgSkills = backgroundSkills.filter(s => !allowed.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !allowed.includes(s) && !backgroundSkills.includes(s));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {allowed.map(skill => {
          const fromBg = isFromBg(skill);
          const fromRace = isFromRace(skill);
          const isSelected = value.includes(skill);
          return (
            <button key={skill} type="button" onClick={() => toggle(skill)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                fromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : fromRace
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!fromBg && !fromRace && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {skill}
            </button>
          );
        })}
        {extraBgSkills.map(skill => (
          <button key={skill} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed">
            {skill}
          </button>
        ))}
        {extraRaceSkills.map(skill => (
          <button key={skill} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed">
            {skill}
          </button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
      </div>
      {backgroundSkills.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
      {raceSkills.length > 0 && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">Emerald = already granted by your race</p>
      )}
    </div>
  );
}

const abMod = score => Math.floor(((score ?? 10) - 10) / 2);

export default function ClericSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], section = 'all', abilityScores = {}, campaignId, isGm = false, acExtra = null, maxHpNode = null }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });

  const [spellSubTab, setSpellSubTab] = useState('prepared');

  const wisMod = abMod(abilityScores.wisdom);
  const prepareLimit = Math.max(1, level + wisMod);

  const slots = slotsForLevel(level);
  const maxSpellLevel = maxCastableLevel(slots);
  const { spellSlots, availableSlots, setSlotUsed, handleCastSpell } = useSlotCaster({ slots, data, onChange });
  const cdTotal = channelDivinityUses(level);
  const cdUsed = data.channel_divinity_used ?? 0;


  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info */}
      {showFeatures && level >= 2 && (
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Channel Divinity</div>
          <div className="font-bold text-lg">{cdTotal}×/rest</div>
        </div>
      </div>
      )}

      {/* HP */}
      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Max HP">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{maxHpNode ?? (data.hp_max ?? '—')}</div>
        </Field>
        <Field label="Current HP">
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Temp HP">
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      </div>
      )}

      {/* Hit Dice */}
      {showCombat && (
        <HitDiceTracker hitDie={8} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}



      {/* Speed */}
      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Speed (ft)">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.speed ?? 30}</div>
        </Field>
        <Field label="Speed Bonus (ft)">
          <Input type="number" value={data.speed_bonus ?? 0} onChange={e => set('speed_bonus', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Total Speed (ft)">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{(data.speed ?? 30) + (data.speed_bonus ?? 0)}</div>
        </Field>
      </div>
      )}

      {/* Channel Divinity tracker */}
      {showFeatures && !creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Channel Divinity (Short Rest)</div>
            <div className="text-xs text-muted-foreground">{cdTotal - cdUsed} / {cdTotal} remaining</div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('channel_divinity_used', Math.max(0, cdUsed - 1))} disabled={cdUsed <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('channel_divinity_used', Math.min(cdTotal, cdUsed + 1))} disabled={cdUsed >= cdTotal}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Divine Domain subclass (level 1) */}
      {showFeatures && (
      <Field label="Divine Domain (Subclass)">
        {(readOnly || (!creation && !!data.subclass)) ? (
          data.subclass ? (
            <SubclassDetails className="Cleric" edition="5e" subclassName={data.subclass} level={level} />
          ) : (
            <div className="text-sm py-2">—</div>
          )
        ) : (
          <SubclassPickerWithDetail
            options={CLERIC_SUBCLASSES_5E}
            value={data.subclass ?? ''}
            onChange={v => set('subclass', v)}
            className="Cleric"
            edition="5e"
          />
        )}
      </Field>
      )}

      {/* Spell Slots — static info during creation, tracker during play */}
      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
        </div>
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <div className="space-y-4">
          {/* Sub-tab nav */}
          <div className="flex gap-1 border-b">
            {[['prepared', 'Prepared'], ['prepare', 'Prepare Spells']].map(([tab, label]) => (
              <button key={tab} type="button" onClick={() => setSpellSubTab(tab)}
                className={cn('px-3 py-1.5 text-sm font-medium -mb-px border-b-2 transition-colors',
                  spellSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}>
                {label}
              </button>
            ))}
          </div>

          {spellSubTab === 'prepared' && (
            <div className="space-y-4">
              {/* Channel Divinity tracker (spell-related feature) */}
              {!creation && (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">Channel Divinity (Short Rest)</div>
                    <div className="text-xs text-muted-foreground">{cdTotal - cdUsed} / {cdTotal} remaining</div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                        onClick={() => set('channel_divinity_used', Math.max(0, cdUsed - 1))} disabled={cdUsed <= 0}>−</button>
                      <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                        onClick={() => set('channel_divinity_used', Math.min(cdTotal, cdUsed + 1))} disabled={cdUsed >= cdTotal}>+</button>
                    </div>
                  )}
                </div>
              )}
              {/* Spell slots */}
              <SpellSlotTracker slots={slots} spellSlots={spellSlots} onSetSlotUsed={setSlotUsed} readOnly={readOnly} isGm={isGm} />
              {/* Cantrips */}
              <>
                <SpellList spells={data.cantrips ?? []} onRemove={n => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" isCantrips={true} />
                {!readOnly && (
                <SpellAddPicker
                  className="Cleric"
                  campaignId={campaignId}
                  spells={data.cantrips ?? []}
                  onAdd={n => addSpell('cantrips', n)}
                  onRemove={n => removeSpell('cantrips', n)}
                  minSpellLevel={0}
                  maxSpellLevel={0}
                  label="Add a cantrip"
                  testId="cantrip-add"
                />
                )}
              </>
              {/* Prepared spells (read-only reference — manage in Prepare Spells tab) */}
              <SpellList spells={data.prepared_spells ?? []} readOnly={true} label={`Prepared Spells — ${(data.prepared_spells ?? []).length}/${prepareLimit} · Long Rest`} onCastSpell={!readOnly ? handleCastSpell : undefined} availableSlots={!readOnly ? availableSlots : undefined} />
            </div>
          )}

          {spellSubTab === 'prepare' && (
            <ClassSpellBrowser
              className="Cleric"
              campaignId={campaignId}
              preparedSpells={data.prepared_spells ?? []}
              prepareLimit={prepareLimit}
              onAdd={n => addSpell('prepared_spells', n)}
              onRemove={n => removeSpell('prepared_spells', n)}
              locked={data.prepared_locked ?? false}
              isGm={isGm}
              maxSpellLevel={maxSpellLevel}
              onLock={() => set('prepared_locked', true)}
              onUnlock={() => set('prepared_locked', false)}
            />
          )}
        </div>
      )}

      {/* Class features */}
      {showFeatures && (
      creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Cleric[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Cleric[lvl] ?? []).map(feat => ({ ...feat, lvl }))
          ).map(feat => (
            <div key={`${feat.lvl}-${feat.name}`} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground">Lvl {feat.lvl}</span>
                <div className="font-semibold text-sm">{feat.name}</div>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
            </div>
          ))}
        </div>
      )
      )}

      {/* ASI reminder */}
      {showFeatures && ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {/* Skill proficiencies — during creation only */}
      {creation && showFeatures && (
      <Field label="Skill Proficiencies (choose 2)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={2}
            allowed={['History', 'Insight', 'Medicine', 'Persuasion', 'Religion']}
            backgroundSkills={backgroundSkills}
            raceSkills={raceSkills}
          />
        )}
      </Field>
      )}
    </div>
  );
}
