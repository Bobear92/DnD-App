import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const FIGHTING_STYLES = [
  'Archery', 'Blind Fighting', 'Defense', 'Dueling',
  'Great Weapon Fighting', 'Interception', 'Protection',
  'Thrown Weapon Fighting', 'Two-Weapon Fighting', 'Unarmed Fighting',
];

const SUBCLASSES = [
  'Battle Master', 'Champion', 'Eldritch Knight', 'Psi Warrior',
];

function actionSurgeTotal(level) { return level >= 17 ? 2 : level >= 2 ? 1 : 0; }
function indomitableTotal(level) {
  if (level >= 17) return 3;
  if (level >= 13) return 2;
  if (level >= 9)  return 1;
  return 0;
}
function extraAttacks(level) {
  if (level >= 20) return 4;
  if (level >= 11) return 3;
  if (level >= 5)  return 2;
  return 1;
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
  const ALL = [
    'Acrobatics', 'Animal Handling', 'Athletics', 'History', 'Insight',
    'Intimidation', 'Perception', 'Persuasion', 'Stealth', 'Survival',
  ];
  const toggle = (s) => {
    if (value.includes(s)) onChange(value.filter(x => x !== s));
    else if (value.length < max) onChange([...value, s]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL.map(s => (
        <button key={s} type="button" onClick={() => toggle(s)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            value.includes(s) ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted border-border text-muted-foreground'
          } ${!value.includes(s) && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
          {s}
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
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

function ResourceTracker({ label, total, used, usedKey, set, readOnly }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{total - (used ?? 0)} / {total} remaining</span>
        {!readOnly && (
          <div className="flex gap-1">
            <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
              onClick={() => set(usedKey, Math.max(0, (used ?? 0) - 1))} disabled={(used ?? 0) <= 0}>−</button>
            <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
              onClick={() => set(usedKey, Math.min(total, (used ?? 0) + 1))} disabled={(used ?? 0) >= total}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FighterSheet({ data = {}, onChange, readOnly = false, level = 1 }) {
  const set = (key, value) => onChange?.({ [key]: value });

  const weaponMasteryMax = level >= 16 ? 6 : level >= 10 ? 5 : level >= 4 ? 4 : 3;

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
          <div className="font-bold text-lg">d10</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Extra Attacks</div>
          <div className="font-bold text-lg">{extraAttacks(level)}</div>
        </div>
      </div>

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

      {/* Fighting Style */}
      <Field label="Fighting Style">
        {readOnly ? (
          <div className="text-sm py-2">{data.fighting_style || '—'}</div>
        ) : (
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={data.fighting_style ?? ''} onChange={e => set('fighting_style', e.target.value)}>
            <option value="">Select fighting style…</option>
            {FIGHTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </Field>

      {/* Weapon Mastery */}
      <Field label={`Weapon Mastery (${weaponMasteryMax} weapons, change on long rest)`}>
        <WeaponMasteryList
          value={data.weapon_masteries ?? []}
          onChange={v => set('weapon_masteries', v)}
          readOnly={readOnly}
          max={weaponMasteryMax}
        />
      </Field>

      <ResourceTracker label="Second Wind (Short Rest)" total={1}
        used={data.second_wind_used ? 1 : 0} usedKey="second_wind_used" set={set} readOnly={readOnly} />

      {level >= 2 && (
        <ResourceTracker label="Action Surge (Short Rest)" total={actionSurgeTotal(level)}
          used={data.action_surge_used ?? 0} usedKey="action_surge_used" set={set} readOnly={readOnly} />
      )}

      {level >= 2 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tactical Mind (L2)</span>
          {' '}— When you fail an ability check, expend one Action Surge use to add 1d10 to the check.
        </div>
      )}

      {level >= 9 && (
        <ResourceTracker label="Indomitable (Long Rest)" total={indomitableTotal(level)}
          used={data.indomitable_used ?? 0} usedKey="indomitable_used" set={set} readOnly={readOnly} />
      )}

      {/* Subclass */}
      {level >= 3 && (
        <Field label="Warrior Subclass">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''} onChange={e => set('subclass', e.target.value)}>
              <option value="">Select subclass…</option>
              {SUBCLASSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Fighting Style + Second Wind + Weapon Mastery" earned={level >= 1} />
          <FeatureRow name="Action Surge + Tactical Mind" earned={level >= 2} />
          <FeatureRow name="Warrior Subclass" earned={level >= 3} />
          <FeatureRow name="Extra Attack" earned={level >= 5} />
          <FeatureRow name="Tactical Shift (L5)" earned={level >= 5} />
          <FeatureRow name="Indomitable" earned={level >= 9} />
          <FeatureRow name="Two Extra Attacks" earned={level >= 11} />
          <FeatureRow name="Studied Attacks (L13)" earned={level >= 13} />
          <FeatureRow name="Three Extra Attacks" earned={level >= 20} />
        </div>
      </div>

      {[4, 6, 8, 12, 14, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 6, 8, 12, 14, 16, 19.
        </div>
      )}

      <Field label="Skill Proficiencies (choose 2)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker value={data.skill_proficiencies ?? []} onChange={v => set('skill_proficiencies', v)} max={2} />
        )}
      </Field>
    </div>
  );
}
