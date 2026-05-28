/**
 * Paladin (5e) — class-specific character_data section.
 * Half-caster: spell slots levels 1–5, prepared spells list.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from './SpellList';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { PALADIN_FIGHTING_STYLES_5E, PALADIN_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';

// Paladin spell slot table (half-caster)
const PALADIN_SLOTS = {
  2:  [2, 0, 0, 0, 0],
  3:  [3, 0, 0, 0, 0],
  4:  [3, 0, 0, 0, 0],
  5:  [4, 2, 0, 0, 0],
  6:  [4, 2, 0, 0, 0],
  7:  [4, 3, 0, 0, 0],
  8:  [4, 3, 0, 0, 0],
  9:  [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0],
  11: [4, 3, 3, 0, 0],
  12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0],
  14: [4, 3, 3, 1, 0],
  15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
};

function slotsForLevel(level) {
  const entry = PALADIN_SLOTS[Math.min(Math.max(level, 2), 20)];
  return entry ?? [0, 0, 0, 0, 0];
}

const abMod = score => Math.floor(((score ?? 10) - 10) / 2);

export default function PaladinSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], section = 'all', abilityScores = {} }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });

  const chaMod = abMod(abilityScores.charisma);
  const prepareLimit = Math.max(1, Math.floor(level / 2) + chaMod);

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const hasCasting = level >= 2;
  const hasSubclass = level >= 3;
  const hasFightingStyle = level >= 2;
  const layOnHandsPool = level * 5;
  const divineSmiteUnlocked = level >= 2;
  const extraAttack = level >= 5;

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {showFeatures && (
      <div className={`grid gap-3 ${level >= 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {level >= 5 && (
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-xs text-muted-foreground">Extra Attack</div>
            <div className="font-bold text-lg">2</div>
          </div>
        )}
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">LoH Pool</div>
          <div className="font-bold text-lg">{layOnHandsPool}</div>
        </div>
      </div>
      )}

      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Current HP">
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Max HP">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.hp_max ?? '—'}</div>
        </Field>
        <Field label="Temp HP">
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      </div>
      )}

      {/* Hit Dice */}
      {showCombat && (
        <HitDiceTracker hitDie={10} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}

      {/* AC */}
      {showCombat && (
        <Field label="Armor Class">
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      )}

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

      {showFeatures && !creation && (
        <div className="rounded-md border px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Lay on Hands Pool</span>
            <span className="text-xs text-muted-foreground">{layOnHandsPool - (data.lay_on_hands_used ?? 0)} / {layOnHandsPool} HP remaining</span>
          </div>
          {!readOnly && (
            <Field label="HP Used">
              <Input
                type="number"
                min={0}
                max={layOnHandsPool}
                value={data.lay_on_hands_used ?? 0}
                onChange={e => set('lay_on_hands_used', Math.max(0, Math.min(layOnHandsPool, parseInt(e.target.value) || 0)))}
                className="text-center w-24"
              />
            </Field>
          )}
        </div>
      )}

      {showFeatures && !creation && level >= 1 && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <span className="text-sm font-medium">Divine Sense (Long Rest)</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {(data.divine_sense_total ?? (1 + Math.floor((data.charisma_modifier ?? 0)))) - (data.divine_sense_used ?? 0)} remaining
            </span>
            {!readOnly && (
              <div className="flex gap-1">
                <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => set('divine_sense_used', Math.max(0, (data.divine_sense_used ?? 0) - 1))}
                  disabled={(data.divine_sense_used ?? 0) <= 0}>−</button>
                <button className="h-6 w-6 rounded border text-xs hover:bg-muted"
                  onClick={() => set('divine_sense_used', (data.divine_sense_used ?? 0) + 1)}>+</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showFeatures && hasFightingStyle && (
        <Field label="Fighting Style">
          {readOnly ? (
            <div className="text-sm py-2">{data.fighting_style || '—'}</div>
          ) : (
            <OptionCardPicker
              options={PALADIN_FIGHTING_STYLES_5E}
              value={data.fighting_style ?? ''}
              onChange={v => set('fighting_style', v)}
            />
          )}
        </Field>
      )}

      {showFeatures && hasSubclass && (
        <Field label="Sacred Oath (Subclass)">
          {(readOnly || !!data.subclass) ? (
            data.subclass ? (
              <SubclassDetails className="Paladin" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={PALADIN_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Paladin"
              edition="5e"
            />
          )}
        </Field>
      )}

      {hasCasting && (section === 'all' || section === 'spells') && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Spell Slots (Long Rest)</Label>
          <div className="grid grid-cols-5 gap-2">
            {slots.map((total, i) => {
              if (total === 0) return null;
              const slotLevel = i + 1;
              const used = spellSlots[slotLevel]?.used ?? 0;
              return (
                <div key={slotLevel} className="rounded-md border text-center p-2">
                  <div className="text-xs text-muted-foreground">Lv {slotLevel}</div>
                  <div className="font-bold">{total - used}/{total}</div>
                  {!readOnly && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      <button className="h-5 w-5 text-xs rounded border hover:bg-muted" onClick={() => setSlotUsed(slotLevel, used - 1)}>−</button>
                      <button className="h-5 w-5 text-xs rounded border hover:bg-muted" onClick={() => setSlotUsed(slotLevel, used + 1)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasCasting && (section === 'all' || section === 'spells') && (
        <SpellList spells={data.prepared_spells ?? []} onAdd={n => addSpell('prepared_spells', n)} onRemove={n => removeSpell('prepared_spells', n)} readOnly={readOnly} label={`Prepared Spells — ${(data.prepared_spells ?? []).length}/${prepareLimit} · Long Rest`} placeholder="Add spell…" />
      )}

      {!creation && (section === 'all' || section === 'spells') && (
        <SpellList spells={data.cantrips ?? []} onAdd={n => addSpell('cantrips', n)} onRemove={n => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips" placeholder="Add cantrip…" isCantrips={true} />
      )}

      {creation && showFeatures && (
      <Field label="Skill Proficiencies (choose 2)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={2}
            allowed={['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion']}
            backgroundSkills={backgroundSkills}
          />
        )}
      </Field>
      )}

      {showFeatures && (
      creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Paladin[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Lay on Hands' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Starting pool: <span className="font-bold">{layOnHandsPool} HP</span>
                  <span className="font-normal text-muted-foreground ml-1">(5 × level)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Paladin[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {showFeatures && [4, 8, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}
    </div>
  );
}

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [] }) {
  const skills = allowed ?? [
    'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
    'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
    'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
    'Sleight of Hand', 'Stealth', 'Survival',
  ];
  const toggle = (skill) => {
    if (backgroundSkills.includes(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const extraBgSkills = backgroundSkills.filter(s => !skills.includes(s));
  const hasBgOverlap = backgroundSkills.length > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {skills.map(skill => {
          const isFromBg = backgroundSkills.includes(skill);
          const isSelected = value.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                isFromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!isFromBg && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
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
        <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
      </div>
      {hasBgOverlap && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
    </div>
  );
}
