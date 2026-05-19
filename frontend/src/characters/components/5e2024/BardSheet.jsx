import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const SUBCLASSES = [
  'College of Dance', 'College of Glamour', 'College of Lore',
  'College of Valor', 'College of Swords', 'College of Whispers',
];

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

// Full caster slot table
const SPELL_SLOTS = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0], 2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0], 4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0], 6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0], 8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0], 10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0], 12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0], 14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0], 16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

function slotsForLevel(lvl) { return SPELL_SLOTS[Math.min(Math.max(lvl, 1), 20)]; }
function bardDie(level) {
  if (level >= 15) return 'd12';
  if (level >= 10) return 'd10';
  if (level >= 5)  return 'd8';
  return 'd6';
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
  const skills = allowed ?? ALL_SKILLS;
  const toggle = (s) => {
    if (value.includes(s)) onChange(value.filter(x => x !== s));
    else if (value.length < max) onChange([...value, s]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map(s => (
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

export default function BardSheet({ data = {}, onChange, readOnly = false, level = 1 }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const die = bardDie(level);

  const expertiseMax = level >= 10 ? 4 : 2;

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: Math.max(0, Math.min(total, used)) } } });
  };

  const SpellList = ({ dataKey, label, newValue, setNew, placeholder }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
        {(data[dataKey] ?? []).map(s => (
          <Badge key={s} variant="secondary" className="gap-1">
            {s}
            {!readOnly && (
              <button onClick={() => onChange?.({ [dataKey]: (data[dataKey] ?? []).filter(x => x !== s) })} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {(data[dataKey] ?? []).length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Input placeholder={placeholder} value={newValue} onChange={e => setNew(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const t = newValue.trim();
                if (!t) return;
                const list = data[dataKey] ?? [];
                if (!list.includes(t)) onChange?.({ [dataKey]: [...list, t] });
                setNew('');
              }
            }} className="flex-1 h-8 text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={() => {
            const t = newValue.trim();
            if (!t) return;
            const list = data[dataKey] ?? [];
            if (!list.includes(t)) onChange?.({ [dataKey]: [...list, t] });
            setNew('');
          }}><Plus className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );

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
          <div className="text-xs text-muted-foreground">Bardic Inspiration</div>
          <div className="font-bold text-lg">{die} (Short Rest)</div>
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

      {/* Bardic Inspiration tracker */}
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <div className="text-sm font-medium">Bardic Inspiration ({die} — Short Rest)</div>
          <div className="text-xs text-muted-foreground">Uses = CHA modifier. Track uses below.</div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
              onClick={() => set('bardic_inspiration_used', Math.max(0, (data.bardic_inspiration_used ?? 0) - 1))}
              disabled={(data.bardic_inspiration_used ?? 0) <= 0}>−</button>
            <span className="text-sm w-6 text-center">{data.bardic_inspiration_used ?? 0}</span>
            <button className="h-6 w-6 rounded border text-xs hover:bg-muted"
              onClick={() => set('bardic_inspiration_used', (data.bardic_inspiration_used ?? 0) + 1)}>+</button>
          </div>
        )}
      </div>

      {/* Subclass */}
      {level >= 3 && (
        <Field label="Bard College (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''} onChange={e => set('subclass', e.target.value)}>
              <option value="">Select college…</option>
              {SUBCLASSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
      )}

      {/* Expertise */}
      <Field label={`Expertise — double proficiency (${expertiseMax} skills)`}>
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.expertise ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.expertise ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker value={data.expertise ?? []} onChange={v => set('expertise', v)} max={expertiseMax} />
        )}
      </Field>

      {/* Spell Slots */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Spell Slots (Long Rest)</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {slots.map((total, i) => {
            if (total === 0) return null;
            const sl = i + 1;
            const used = spellSlots[sl]?.used ?? 0;
            return (
              <div key={sl} className="rounded-md border text-center p-2">
                <div className="text-xs text-muted-foreground">Level {sl}</div>
                <div className="font-bold text-sm">{total - used}/{total}</div>
                {!readOnly && (
                  <div className="flex justify-center gap-0.5 mt-1">
                    <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used <= 0} onClick={() => setSlotUsed(sl, used - 1)}>−</button>
                    <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                      disabled={used >= total} onClick={() => setSlotUsed(sl, used + 1)}>+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SpellList dataKey="cantrips" label="Cantrips Known" newValue={newCantrip} setNew={setNewCantrip} placeholder="Add cantrip…" />
      <SpellList dataKey="known_spells" label="Spells Known" newValue={newSpell} setNew={setNewSpell} placeholder="Add spell…" />

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Bardic Inspiration (Short Rest) + Spellcasting" earned={level >= 1} />
          <FeatureRow name="Jack of All Trades + Song of Rest" earned={level >= 2} />
          <FeatureRow name="Expertise + Bard College (Subclass)" earned={level >= 3} />
          <FeatureRow name="Countercharm" earned={level >= 6} />
          <FeatureRow name="Magical Secrets" earned={level >= 9} />
          <FeatureRow name="Expertise (4 skills)" earned={level >= 10} />
          <FeatureRow name="Superior Inspiration (L20)" earned={level >= 20} />
        </div>
      </div>

      {[4, 8, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      <Field label="Skill Proficiencies (choose 3)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker value={data.skill_proficiencies ?? []} onChange={v => set('skill_proficiencies', v)} max={3} />
        )}
      </Field>
    </div>
  );
}
