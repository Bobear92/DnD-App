/**
 * Ranger (5e) — class-specific character_data section.
 * d10, half-caster (slots start at level 1), Fighting Style, Favored Enemy, Ranger Archetype.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const RANGER_SUBCLASSES_5E = [
  'Beast Master', 'Gloom Stalker', 'Horizon Walker', 'Hunter',
  'Monster Slayer', 'Fey Wanderer', 'Swarmkeeper', 'Drakewarden',
];

const FIGHTING_STYLES_5E = [
  'Archery', 'Defense', 'Dueling', 'Two-Weapon Fighting',
];

// Ranger half-caster slot table (starts at level 1)
const RANGER_SLOTS = {
  1:  [2, 0, 0, 0, 0],
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
  return RANGER_SLOTS[Math.min(Math.max(level, 1), 20)];
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

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

export default function RangerSheet({ data = {}, onChange, readOnly = false, level = 1 }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
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

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Hit Die</div>
          <div className="font-bold text-lg">d10</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Extra Attack</div>
          <div className="font-bold text-lg">{level >= 5 ? 2 : 1}</div>
        </div>
      </div>

      {/* HP */}
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

      {/* AC / Speed / Hit Dice */}
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

      {/* Favored Enemy + Natural Explorer */}
      <Field label="Favored Enemy">
        {readOnly ? (
          <div className="text-sm py-2">{data.favored_enemy || '—'}</div>
        ) : (
          <Input
            value={data.favored_enemy ?? ''}
            onChange={e => set('favored_enemy', e.target.value)}
            placeholder="e.g. Undead, Giants…"
            className="text-sm"
          />
        )}
      </Field>

      <Field label="Favored Terrain (Natural Explorer)">
        {readOnly ? (
          <div className="text-sm py-2">{data.favored_terrain || '—'}</div>
        ) : (
          <Input
            value={data.favored_terrain ?? ''}
            onChange={e => set('favored_terrain', e.target.value)}
            placeholder="e.g. Forest, Mountain…"
            className="text-sm"
          />
        )}
      </Field>

      {/* Fighting Style */}
      {level >= 2 && (
        <Field label="Fighting Style">
          {readOnly ? (
            <div className="text-sm py-2">{data.fighting_style || '—'}</div>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.fighting_style ?? ''}
              onChange={e => set('fighting_style', e.target.value)}
            >
              <option value="">Select fighting style…</option>
              {FIGHTING_STYLES_5E.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
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
                      disabled={used <= 0} onClick={() => setSlotUsed(slotLevel, used - 1)}>−</button>
                    <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used >= total} onClick={() => setSlotUsed(slotLevel, used + 1)}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prepared spells */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Prepared Spells</Label>
        <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
          {(data.prepared_spells ?? []).map(spell => (
            <Badge key={spell} variant="secondary" className="gap-1">
              {spell}
              {!readOnly && (
                <button onClick={() => onChange?.({ prepared_spells: (data.prepared_spells ?? []).filter(s => s !== spell) })} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {(data.prepared_spells ?? []).length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Input placeholder="Add spell…" value={newSpell} onChange={e => setNewSpell(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpell())} className="flex-1 h-8 text-sm" />
            <Button type="button" size="sm" variant="outline" onClick={addSpell}><Plus className="h-3 w-3" /></Button>
          </div>
        )}
      </div>

      {/* Subclass (level 3) */}
      {level >= 3 && (
        <Field label="Ranger Archetype (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''}
              onChange={e => set('subclass', e.target.value)}
            >
              <option value="">Select archetype…</option>
              {RANGER_SUBCLASSES_5E.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
      )}

      {/* Class features list */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Favored Enemy + Natural Explorer" earned={level >= 1} />
          <FeatureRow name="Fighting Style + Spellcasting" earned={level >= 2} />
          <FeatureRow name="Ranger Archetype (Subclass) + Primeval Awareness" earned={level >= 3} />
          <FeatureRow name="Extra Attack" earned={level >= 5} />
          <FeatureRow name="Land's Stride" earned={level >= 8} />
          <FeatureRow name="Hide in Plain Sight" earned={level >= 10} />
          <FeatureRow name="Vanish" earned={level >= 14} />
          <FeatureRow name="Feral Senses" earned={level >= 18} />
          <FeatureRow name="Foe Slayer" earned={level >= 20} />
        </div>
      </div>

      {/* ASI reminder */}
      {ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {/* Skill proficiencies */}
      <Field label="Skill Proficiencies (choose 3)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={3}
            allowed={['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']}
          />
        )}
      </Field>
    </div>
  );
}
