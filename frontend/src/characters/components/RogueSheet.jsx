/**
 * Rogue (5e) — class-specific character_data section.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const ROGUE_SUBCLASSES_5E = [
  'Thief', 'Arcane Trickster', 'Assassin', 'Inquisitive',
  'Mastermind', 'Phantom', 'Scout', 'Soul Knife', 'Swashbuckler',
];

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

function sneak_attack_dice(level) {
  return Math.ceil(level / 2);
}

const ASI_LEVELS = [4, 8, 10, 12, 16, 19];
function hasAsi(level) { return ASI_LEVELS.some(l => l <= level); }

export default function RogueSheet({ data = {}, onChange, readOnly = false, level = 1 }) {
  const set = (key, value) => onChange?.({ [key]: value });

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
          <div className="font-bold text-lg">d8</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Sneak Attack</div>
          <div className="font-bold text-lg">{sneak_attack_dice(level)}d6</div>
        </div>
      </div>

      {/* HP tracking */}
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

      {/* Class features */}
      <div className="rounded-md border divide-y text-sm">
        <div className="px-3 py-2 flex justify-between items-center">
          <span className="font-medium">Expertise Skills</span>
          <span className="text-xs text-muted-foreground">{level >= 6 ? '4 skills' : '2 skills'}</span>
        </div>
        {readOnly ? (
          <div className="px-3 py-2 flex flex-wrap gap-1">
            {(data.expertise_skills ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.expertise_skills ?? []).length === 0 && <span className="text-muted-foreground text-xs">None set</span>}
          </div>
        ) : (
          <div className="px-3 py-2">
            <ExpertisePicker
              value={data.expertise_skills ?? []}
              onChange={v => set('expertise_skills', v)}
              max={level >= 6 ? 4 : 2}
            />
          </div>
        )}
      </div>

      {/* Subclass (level 3) */}
      {level >= 3 && (
        <Field label="Roguish Archetype (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''}
              onChange={e => set('subclass', e.target.value)}
            >
              <option value="">Select subclass…</option>
              {ROGUE_SUBCLASSES_5E.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
      )}

      {/* Passive features — displayed as earned */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Thieves' Cant" earned={level >= 1} />
          <FeatureRow name="Cunning Action" earned={level >= 2} />
          <FeatureRow name="Uncanny Dodge" earned={level >= 5} />
          <FeatureRow name="Evasion" earned={level >= 7} />
          <FeatureRow name="Reliable Talent" earned={level >= 11} />
          <FeatureRow name="Blindsense" earned={level >= 14} />
          <FeatureRow name="Slippery Mind" earned={level >= 15} />
          <FeatureRow name="Elusive" earned={level >= 18} />
          <FeatureRow name="Stroke of Luck" earned={level >= 20} />
        </div>
      </div>

      {/* Skill proficiencies */}
      <Field label="Skill Proficiencies (choose 4)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        ) : (
          <SkillPicker value={data.skill_proficiencies ?? []} onChange={v => set('skill_proficiencies', v)} max={4} />
        )}
      </Field>

      {/* ASI reminder */}
      {hasAsi(level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 10, 12, 16, 19.
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

function SkillPicker({ value, onChange, max }) {
  const toggle = (skill) => {
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_SKILLS.map(skill => (
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

function ExpertisePicker({ value, onChange, max }) {
  const toggle = (skill) => {
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_SKILLS.map(skill => (
        <button
          key={skill}
          type="button"
          onClick={() => toggle(skill)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            value.includes(skill)
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-background hover:bg-muted border-border text-muted-foreground'
          } ${!value.includes(skill) && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {skill}
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max} expertise</span>
    </div>
  );
}
