/**
 * Wizard (5e) — class-specific character_data section.
 * Full caster: spell slots levels 1–9, spellbook, prepared list.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const WIZARD_SUBCLASSES_5E = [
  'School of Abjuration', 'School of Conjuration', 'School of Divination',
  'School of Enchantment', 'School of Evocation', 'School of Illusion',
  'School of Necromancy', 'School of Transmutation', 'Bladesinging',
  'Order of Scribes', 'War Magic',
];

// Wizard full caster slot table
const WIZARD_SLOTS = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

function slotsForLevel(level) {
  return WIZARD_SLOTS[Math.min(Math.max(level, 1), 20)];
}

function arcaneRecoveryLevels(level) {
  return Math.ceil(level / 2);
}

export default function WizardSheet({ data = {}, onChange, readOnly = false, level = 1 }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpellbook, setNewSpellbook] = useState('');
  const [newPrepared, setNewPrepared] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const addToList = (key, value, setter) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const list = data[key] ?? [];
    if (!list.includes(trimmed)) onChange?.({ [key]: [...list, trimmed] });
    setter('');
  };

  const removeFromList = (key, item) => {
    onChange?.({ [key]: (data[key] ?? []).filter(s => s !== item) });
  };

  const SpellList = ({ dataKey, label, newValue, setNew, placeholder }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
        {(data[dataKey] ?? []).map(spell => (
          <Badge key={spell} variant="secondary" className="gap-1">
            {spell}
            {!readOnly && (
              <button onClick={() => removeFromList(dataKey, spell)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {(data[dataKey] ?? []).length === 0 && (
          <span className="text-xs text-muted-foreground">None added</span>
        )}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newValue}
            onChange={e => setNew(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(dataKey, newValue, setNew))}
            className="flex-1 h-8 text-sm"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => addToList(dataKey, newValue, setNew)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Hit Die</div>
          <div className="font-bold text-lg">d6</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Arcane Recovery</div>
          <div className="font-bold text-lg">{arcaneRecoveryLevels(level)} levels</div>
        </div>
      </div>

      {/* HP */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Current HP</Label>
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Max HP</Label>
          <Input type="number" value={data.max_hp ?? ''} onChange={e => set('max_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Temp HP</Label>
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
      </div>

      {/* AC / Speed / Hit Dice */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Armor Class</Label>
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Speed (ft)</Label>
          <Input type="number" value={data.speed ?? 30} onChange={e => set('speed', parseInt(e.target.value) || 30)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hit Dice Used</Label>
          <Input type="number" value={data.hit_dice_used ?? 0} onChange={e => set('hit_dice_used', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
      </div>

      {/* Arcane Recovery */}
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <div className="text-sm font-medium">Arcane Recovery (Short Rest)</div>
          <div className="text-xs text-muted-foreground">Recover up to {arcaneRecoveryLevels(level)} total spell slot levels</div>
        </div>
        {!readOnly && (
          <button
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              data.arcane_recovery_used
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
            onClick={() => set('arcane_recovery_used', !data.arcane_recovery_used)}
          >
            {data.arcane_recovery_used ? 'Used' : 'Available'}
          </button>
        )}
      </div>

      {/* Subclass (level 2) */}
      {level >= 2 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Arcane Tradition (Subclass)</Label>
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''}
              onChange={e => set('subclass', e.target.value)}
            >
              <option value="">Select tradition…</option>
              {WIZARD_SUBCLASSES_5E.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Spell Slots */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Spell Slots (Long Rest)</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {slots.map((total, i) => {
            if (total === 0) return null;
            const slotLevel = i + 1;
            const used = spellSlots[slotLevel]?.used ?? 0;
            return (
              <div key={slotLevel} className="rounded-md border text-center p-2">
                <div className="text-xs text-muted-foreground">Level {slotLevel}</div>
                <div className="font-bold text-sm">{total - used}/{total}</div>
                {!readOnly && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used <= 0}
                      onClick={() => setSlotUsed(slotLevel, used - 1)}>−</button>
                    <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used >= total}
                      onClick={() => setSlotUsed(slotLevel, used + 1)}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cantrips */}
      <SpellList
        dataKey="cantrips"
        label="Cantrips Known"
        newValue={newCantrip}
        setNew={setNewCantrip}
        placeholder="Add cantrip…"
      />

      {/* Spellbook */}
      <SpellList
        dataKey="spellbook"
        label="Spellbook (all known spells)"
        newValue={newSpellbook}
        setNew={setNewSpellbook}
        placeholder="Add spell to spellbook…"
      />

      {/* Prepared spells */}
      <SpellList
        dataKey="prepared_spells"
        label="Prepared Spells (today)"
        newValue={newPrepared}
        setNew={setNewPrepared}
        placeholder="Add prepared spell…"
      />

      {/* Skill proficiencies */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Skill Proficiencies (choose 2)</Label>
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={2}
            allowed={['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']}
          />
        )}
      </div>

      {/* Class features */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Spellcasting + Arcane Recovery" earned={level >= 1} />
          <FeatureRow name="Arcane Tradition (Subclass)" earned={level >= 2} />
          <FeatureRow name="Spell Mastery" earned={level >= 18} />
          <FeatureRow name="Signature Spells" earned={level >= 20} />
        </div>
      </div>

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

function SkillPicker({ value, onChange, max, allowed }) {
  const toggle = (skill) => {
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {allowed.map(skill => (
        <button
          key={skill}
          type="button"
          onClick={() => toggle(skill)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            value.includes(skill)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted border-border text-muted-foreground'
          } ${!value.includes(skill) && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {skill}
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
    </div>
  );
}
