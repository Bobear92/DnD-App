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
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import { PALADIN_FIGHTING_STYLES_5E, PALADIN_SUBCLASSES_5E } from './classChoicesData';

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

export default function PaladinSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const addSpell = () => {
    const trimmed = newSpell.trim();
    if (!trimmed) return;
    const list = data.prepared_spells ?? [];
    if (!list.includes(trimmed)) onChange?.({ prepared_spells: [...list, trimmed] });
    setNewSpell('');
  };

  const removeSpell = (spell) => {
    onChange?.({ prepared_spells: (data.prepared_spells ?? []).filter(s => s !== spell) });
  };

  const addCantrip = () => {
    const trimmed = newCantrip.trim();
    if (!trimmed) return;
    const list = data.cantrips ?? [];
    if (!list.includes(trimmed)) onChange?.({ cantrips: [...list, trimmed] });
    setNewCantrip('');
  };

  const removeCantrip = (c) => {
    onChange?.({ cantrips: (data.cantrips ?? []).filter(s => s !== c) });
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
      {/* Combat info */}
      <div className={`grid gap-3 ${level >= 5 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Hit Die</div>
          <div className="font-bold text-lg">d10</div>
        </div>
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

      {/* HP */}
      {!creation && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Current HP">
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Max HP">
          <Input type="number" value={data.max_hp ?? ''} onChange={e => set('max_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Temp HP">
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      </div>
      )}

      {/* AC / Speed / Hit Dice */}
      {!creation && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Armor Class">
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Speed (ft)">
          <Input type="number" value={data.speed ?? 30} onChange={e => set('speed', parseInt(e.target.value) || 30)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Hit Dice Used">
          <Input type="number" value={data.hit_dice_used ?? 0} onChange={e => set('hit_dice_used', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      </div>
      )}

      {/* Lay on Hands */}
      {!creation && (
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

      {/* Divine Sense */}
      {!creation && level >= 1 && (
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

      {/* Fighting Style */}
      {hasFightingStyle && (
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

      {/* Subclass */}
      {hasSubclass && (
        <Field label="Sacred Oath (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <OptionCardPicker
              options={PALADIN_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
            />
          )}
        </Field>
      )}

      {/* Spell Slots */}
      {hasCasting && (
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

      {/* Prepared Spells */}
      {hasCasting && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Prepared Spells</Label>
          <div className="flex flex-wrap gap-1 min-h-8">
            {(data.prepared_spells ?? []).map(spell => (
              <Badge key={spell} variant="secondary" className="gap-1">
                {spell}
                {!readOnly && <button onClick={() => removeSpell(spell)} className="hover:text-destructive"><X className="h-3 w-3" /></button>}
              </Badge>
            ))}
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Input
                placeholder="Add spell…"
                value={newSpell}
                onChange={e => setNewSpell(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpell())}
                className="flex-1 h-8 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={addSpell}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Cantrips (none by default but Blessed Warrior fighting style gives 2) */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Cantrips</Label>
        <div className="flex flex-wrap gap-1 min-h-6">
          {(data.cantrips ?? []).map(c => (
            <Badge key={c} variant="outline" className="gap-1">
              {c}
              {!readOnly && <button onClick={() => removeCantrip(c)} className="hover:text-destructive"><X className="h-3 w-3" /></button>}
            </Badge>
          ))}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Input
              placeholder="Add cantrip…"
              value={newCantrip}
              onChange={e => setNewCantrip(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCantrip())}
              className="flex-1 h-8 text-sm"
            />
            <Button type="button" size="sm" variant="outline" onClick={addCantrip}><Plus className="h-3 w-3" /></Button>
          </div>
        )}
      </div>

      {/* Skill proficiencies */}
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

      {/* Class features */}
      {creation ? (
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
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Class Features</Label>
          <div className="rounded-md border divide-y text-sm">
            <FeatureRow name="Divine Smite" earned={level >= 2} />
            <FeatureRow name="Divine Health" earned={level >= 3} />
            <FeatureRow name="Extra Attack" earned={level >= 5} />
            <FeatureRow name="Aura of Protection (10 ft)" earned={level >= 6} />
            <FeatureRow name="Aura of Courage (10 ft)" earned={level >= 10} />
            <FeatureRow name="Improved Divine Smite" earned={level >= 11} />
            <FeatureRow name="Cleansing Touch" earned={level >= 14} />
            <FeatureRow name="Aura improvements (30 ft)" earned={level >= 18} />
          </div>
        </div>
      )}

      {/* ASI reminder */}
      {[4, 8, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}
    </div>
  );
}

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
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
