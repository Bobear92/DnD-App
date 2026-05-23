import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import OptionCardPicker from '../OptionCardPicker';
import { ROGUE_SUBCLASSES_2024 as SUBCLASSES } from '../classChoicesData';

const ROGUE_ALLOWED = [
  'Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation',
  'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth',
];

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

function sneakAttackDice(level) { return Math.ceil(level / 2); }

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
    </div>
  );
}

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [] }) {
  const skills = allowed ?? ALL_SKILLS;
  const toggle = (s) => {
    if (backgroundSkills.includes(s)) return;
    if (value.includes(s)) onChange(value.filter(x => x !== s));
    else if (value.length < max) onChange([...value, s]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {skills.map(s => {
          const isFromBg = backgroundSkills.includes(s);
          const isSelected = value.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggle(s)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                isFromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : isSelected ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!isFromBg && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {s}
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
      </div>
      {backgroundSkills.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
    </div>
  );
}

function WeaponMasteryList({ value, onChange, readOnly, max }) {
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
        {value.map(w => (
          <Badge key={w} variant="secondary" className="gap-1">
            {w}
            {!readOnly && (
              <button onClick={() => onChange(value.filter(x => x !== w))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground">None set</span>}
      </div>
      {!readOnly && value.length < max && (
        <div className="flex gap-2">
          <Input placeholder="Weapon name…" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
            className="flex-1 h-8 text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
}

export default function RogueSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });

  const expertiseMax = level >= 6 ? 4 : 2;

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Hit Die</div>
          <div className="font-bold text-lg">d8</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Sneak Attack</div>
          <div className="font-bold text-lg">{sneakAttackDice(level)}d6</div>
        </div>
      </div>

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

      {/* Weapon Mastery */}
      <Field label="Weapon Mastery (choose 2, change on long rest)">
        <WeaponMasteryList
          value={data.weapon_masteries ?? []}
          onChange={v => set('weapon_masteries', v)}
          readOnly={readOnly}
          max={level >= 14 ? 3 : 2}
        />
      </Field>

      {/* Cunning Action */}
      <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Cunning Action (L2)</span>
        {' '}— Bonus Action: Dash, Disengage, or Hide.
        {level >= 5 && ' Uncanny Dodge active.'}
      </div>

      {/* Steady Aim (L3) */}
      {level >= 3 && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Steady Aim (L3)</div>
            <div className="text-xs text-muted-foreground">Bonus Action: gain advantage on next attack; speed becomes 0 until next turn</div>
          </div>
        </div>
      )}

      {/* Subclass */}
      {level >= 3 && (
        <Field label="Roguish Archetype (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <OptionCardPicker
              options={SUBCLASSES}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
            />
          )}
        </Field>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Expertise + Sneak Attack + Thieves' Cant + Weapon Mastery" earned={level >= 1} />
          <FeatureRow name="Cunning Action" earned={level >= 2} />
          <FeatureRow name="Steady Aim + Roguish Archetype" earned={level >= 3} />
          <FeatureRow name="Uncanny Dodge" earned={level >= 5} />
          <FeatureRow name="Expertise (4 skills)" earned={level >= 6} />
          <FeatureRow name="Evasion" earned={level >= 7} />
          <FeatureRow name="Reliable Talent" earned={level >= 11} />
          <FeatureRow name="Slippery Mind" earned={level >= 15} />
          <FeatureRow name="Elusive" earned={level >= 18} />
          <FeatureRow name="Stroke of Luck" earned={level >= 20} />
        </div>
      </div>

      {[4, 8, 10, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 10, 12, 16, 19.
        </div>
      )}

      <Field label="Skill Proficiencies (choose 4)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => {
              const pool = [...new Set([...v, ...backgroundSkills])];
              const cleanedExpertise = (data.expertise ?? []).filter(s => pool.includes(s));
              onChange?.({ skill_proficiencies: v, expertise: cleanedExpertise });
            }}
            max={4}
            allowed={ROGUE_ALLOWED}
            backgroundSkills={backgroundSkills}
          />
        )}
      </Field>

      {/* Expertise */}
      <Field label={`Expertise — double proficiency (${expertiseMax} skills)`}>
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.expertise ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.expertise ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (() => {
          const pool = [...new Set([...(data.skill_proficiencies ?? []), ...backgroundSkills])];
          return pool.length === 0
            ? <p className="text-xs text-muted-foreground">Select skill proficiencies above first.</p>
            : <SkillPicker value={data.expertise ?? []} onChange={v => set('expertise', v)} max={expertiseMax} allowed={pool} />;
        })()}
      </Field>
    </div>
  );
}
