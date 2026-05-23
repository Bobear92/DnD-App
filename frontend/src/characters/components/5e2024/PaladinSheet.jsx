import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

import OptionCardPicker from '../OptionCardPicker';
import { PALADIN_SUBCLASSES_2024 as SUBCLASSES } from '../classChoicesData';

// Paladin is half-caster; in 2024 slots start at L1
const PALADIN_SLOTS = {
  1:  [2, 0, 0, 0, 0], 2:  [2, 0, 0, 0, 0], 3:  [3, 0, 0, 0, 0],
  4:  [3, 0, 0, 0, 0], 5:  [4, 2, 0, 0, 0], 6:  [4, 2, 0, 0, 0],
  7:  [4, 3, 0, 0, 0], 8:  [4, 3, 0, 0, 0], 9:  [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0], 11: [4, 3, 3, 0, 0], 12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0], 14: [4, 3, 3, 1, 0], 15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0], 17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2],
};

function slotsForLevel(lvl) { return PALADIN_SLOTS[Math.min(Math.max(lvl, 1), 20)]; }
function channelDivinityUses(level) { return level >= 5 ? 2 : 1; }
function layOnHandsPool(level) { return level * 5; }

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
    </div>
  );
}

function SkillPicker({ value, onChange, max, backgroundSkills = [] }) {
  const ALLOWED = ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'];
  const extraBgSkills = backgroundSkills.filter(s => !ALLOWED.includes(s));
  const toggle = (s) => {
    if (backgroundSkills.includes(s)) return;
    if (value.includes(s)) onChange(value.filter(x => x !== s));
    else if (value.length < max) onChange([...value, s]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ALLOWED.map(s => {
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
        {extraBgSkills.map(s => (
          <button key={s} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed">
            {s}
          </button>
        ))}
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

export default function PaladinSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const lohPool = layOnHandsPool(level);
  const lohUsed = data.lay_on_hands_used ?? 0;
  const cdUses = channelDivinityUses(level);

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
          <div className="font-bold text-lg">d10</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Lay on Hands Pool</div>
          <div className="font-bold text-lg">{lohPool} HP</div>
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

      {/* Lay on Hands */}
      {!creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Lay on Hands (Long Rest)</div>
            <div className="text-xs text-muted-foreground">{lohPool - lohUsed} / {lohPool} HP remaining</div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Input type="number" value={data.lay_on_hands_heal_amount ?? 1} min={1}
                onChange={e => set('lay_on_hands_heal_amount', parseInt(e.target.value) || 1)}
                className="w-16 h-7 text-xs text-center" />
              <div className="flex gap-1">
                <button className="h-6 px-2 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => set('lay_on_hands_used', Math.max(0, lohUsed - (data.lay_on_hands_heal_amount ?? 1)))}
                  disabled={lohUsed <= 0}>−</button>
                <button className="h-6 px-2 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => set('lay_on_hands_used', Math.min(lohPool, lohUsed + (data.lay_on_hands_heal_amount ?? 1)))}
                  disabled={lohUsed >= lohPool}>+</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weapon Mastery */}
      <Field label="Weapon Mastery (choose 2, change on long rest)">
        <WeaponMasteryList
          value={data.weapon_masteries ?? []}
          onChange={v => set('weapon_masteries', v)}
          readOnly={readOnly}
          max={2}
        />
      </Field>

      {/* Subclass (L3) */}
      {level >= 3 && (
        <>
          <Field label="Sacred Oath (Subclass)">
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

          {/* Channel Divinity */}
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Channel Divinity (Short Rest)</div>
              <div className="text-xs text-muted-foreground">{cdUses - (data.channel_divinity_used ?? 0)} / {cdUses} remaining</div>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-1">
                <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => set('channel_divinity_used', Math.max(0, (data.channel_divinity_used ?? 0) - 1))}
                  disabled={(data.channel_divinity_used ?? 0) <= 0}>−</button>
                <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                  onClick={() => set('channel_divinity_used', Math.min(cdUses, (data.channel_divinity_used ?? 0) + 1))}
                  disabled={(data.channel_divinity_used ?? 0) >= cdUses}>+</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Spell Slots — static info during creation, tracker during play */}
      {creation ? (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
        </div>
      ) : (
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
      )}

      {!creation && (
        <>
          <SpellList dataKey="cantrips" label="Cantrips Known" newValue={newCantrip} setNew={setNewCantrip} placeholder="Add cantrip…" />
          <SpellList dataKey="prepared_spells" label="Prepared Spells (today)" newValue={newSpell} setNew={setNewSpell} placeholder="Add prepared spell…" />
        </>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Lay on Hands + Spellcasting + Weapon Mastery" earned={level >= 1} />
          <FeatureRow name="Fighting Style + Divine Smite" earned={level >= 2} />
          <FeatureRow name="Sacred Oath (Subclass) + Channel Divinity" earned={level >= 3} />
          <FeatureRow name="Extra Attack" earned={level >= 5} />
          <FeatureRow name="Aura of Protection" earned={level >= 6} />
          <FeatureRow name="Aura of Courage" earned={level >= 10} />
          <FeatureRow name="Restoring Touch" earned={level >= 14} />
          <FeatureRow name="Aura Expansion" earned={level >= 18} />
          <FeatureRow name="Holy Nimbus" earned={level >= 20} />
        </div>
      </div>

      {[4, 8, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      <Field label="Skill Proficiencies (choose 2)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker value={data.skill_proficiencies ?? []} onChange={v => set('skill_proficiencies', v)} max={2} backgroundSkills={backgroundSkills} />
        )}
      </Field>
    </div>
  );
}
