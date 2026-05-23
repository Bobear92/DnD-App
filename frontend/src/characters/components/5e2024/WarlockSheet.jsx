import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import OptionCardPicker from '../OptionCardPicker';
import { WARLOCK_SUBCLASSES_2024 as SUBCLASSES, PACT_BOONS_2024 as PACT_BOONS } from '../classChoicesData';

const PACT_SLOTS = {
  1:  [1, 1], 2:  [2, 1], 3:  [2, 2], 4:  [2, 2],
  5:  [2, 3], 6:  [2, 3], 7:  [2, 4], 8:  [2, 4],
  9:  [2, 5], 10: [2, 5], 11: [3, 5], 12: [3, 5],
  13: [3, 5], 14: [3, 5], 15: [3, 5], 16: [3, 5],
  17: [4, 5], 18: [4, 5], 19: [4, 5], 20: [4, 5],
};

function pactSlotsForLevel(lvl) { return PACT_SLOTS[Math.min(Math.max(lvl, 1), 20)]; }

const WARLOCK_CANTRIPS_2024 = [
  'Blade Ward', 'Chill Touch', 'Eldritch Blast', 'Friends',
  'Mage Hand', 'Minor Illusion', 'Poison Spray', 'Prestidigitation',
  'Toll the Dead', 'True Strike',
];

const WARLOCK_SPELLS_L1_2024 = [
  'Armor of Agathys', 'Arms of Hadar', 'Charm Person', 'Comprehend Languages',
  'Expeditious Retreat', 'Hellish Rebuke', 'Hex', 'Illusory Script',
  'Protection from Evil and Good', 'Unseen Servant', 'Witch Bolt',
];

function SpellPickerCreation({ label, limit, options, selected, onChange }) {
  const toggle = (spell) => {
    if (selected.includes(spell)) onChange(selected.filter(s => s !== spell));
    else if (selected.length < limit) onChange([...selected, spell]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground">{selected.length}/{limit} chosen</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(spell => (
          <button key={spell} type="button" onClick={() => toggle(spell)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              selected.includes(spell) ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border text-muted-foreground'
            } ${!selected.includes(spell) && selected.length >= limit ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {spell}
          </button>
        ))}
      </div>
    </div>
  );
}

function invocationCount(level) {
  if (level >= 15) return 8;
  if (level >= 12) return 7;
  if (level >= 9)  return 6;
  if (level >= 7)  return 5;
  if (level >= 5)  return 4;
  if (level >= 3)  return 3;
  if (level >= 2)  return 2;
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

function SkillPicker({ value, onChange, max, backgroundSkills = [] }) {
  const ALLOWED = ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'];
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

export default function WarlockSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');
  const [newInvocation, setNewInvocation] = useState('');

  const [slotCount, slotLevel] = pactSlotsForLevel(level);
  const slotsUsed = data.pact_slots_used ?? 0;
  const maxInvocations = invocationCount(level);

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
          <div className="text-xs text-muted-foreground">Pact Slots</div>
          <div className="font-bold text-lg">{slotCount} × level {slotLevel}</div>
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

      {/* Pact Magic slot tracker */}
      {!creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Pact Magic Slots (Short Rest)</div>
            <div className="text-xs text-muted-foreground">{slotCount - slotsUsed} / {slotCount} level-{slotLevel} slots remaining</div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('pact_slots_used', Math.max(0, slotsUsed - 1))} disabled={slotsUsed <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('pact_slots_used', Math.min(slotCount, slotsUsed + 1))} disabled={slotsUsed >= slotCount}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Magical Cunning (L2) */}
      {level >= 2 && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Magical Cunning (Long Rest)</div>
            <div className="text-xs text-muted-foreground">Recover half your expended Pact Magic slots (rounded up, min 1)</div>
          </div>
          {!readOnly && (
            <button
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                data.magical_cunning_used ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
              onClick={() => set('magical_cunning_used', !data.magical_cunning_used)}>
              {data.magical_cunning_used ? 'Used' : 'Available'}
            </button>
          )}
        </div>
      )}

      {/* Eldritch Invocations (L1 in 2024) */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Eldritch Invocations ({maxInvocations} max)</Label>
        <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
          {(data.eldritch_invocations ?? []).map(inv => (
            <Badge key={inv} variant="secondary" className="gap-1">
              {inv}
              {!readOnly && (
                <button onClick={() => onChange?.({ eldritch_invocations: (data.eldritch_invocations ?? []).filter(i => i !== inv) })} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {(data.eldritch_invocations ?? []).length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
        </div>
        {!readOnly && (data.eldritch_invocations ?? []).length < maxInvocations && (
          <div className="flex gap-2">
            <Input placeholder="Add invocation…" value={newInvocation} onChange={e => setNewInvocation(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const t = newInvocation.trim();
                  if (!t) return;
                  const list = data.eldritch_invocations ?? [];
                  if (!list.includes(t) && list.length < maxInvocations) onChange?.({ eldritch_invocations: [...list, t] });
                  setNewInvocation('');
                }
              }} className="flex-1 h-8 text-sm" />
            <Button type="button" size="sm" variant="outline" onClick={() => {
              const t = newInvocation.trim();
              if (!t) return;
              const list = data.eldritch_invocations ?? [];
              if (!list.includes(t) && list.length < maxInvocations) onChange?.({ eldritch_invocations: [...list, t] });
              setNewInvocation('');
            }}><Plus className="h-3 w-3" /></Button>
          </div>
        )}
      </div>

      {/* Subclass (L3 in 2024) */}
      {level >= 3 && (
        <Field label="Otherworldly Patron (Subclass)">
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

      {/* Pact Boon (L5 in 2024) */}
      {level >= 5 && (
        <Field label="Pact Boon">
          {readOnly ? (
            <div className="text-sm py-2">{data.pact_boon || '—'}</div>
          ) : (
            <OptionCardPicker
              options={PACT_BOONS}
              value={data.pact_boon ?? ''}
              onChange={v => set('pact_boon', v)}
            />
          )}
        </Field>
      )}

      {creation ? (
        <SpellPickerCreation label="Cantrips Known (choose 2)" limit={2} options={WARLOCK_CANTRIPS_2024}
          selected={data.cantrips ?? []} onChange={v => set('cantrips', v)} />
      ) : (
        <SpellList dataKey="cantrips" label="Cantrips Known" newValue={newCantrip} setNew={setNewCantrip} placeholder="Add cantrip…" />
      )}
      {creation ? (
        <SpellPickerCreation label="Spells Known at Level 1 (choose 2)" limit={2} options={WARLOCK_SPELLS_L1_2024}
          selected={data.known_spells ?? []} onChange={v => set('known_spells', v)} />
      ) : (
        <SpellList dataKey="known_spells" label="Spells Known" newValue={newSpell} setNew={setNewSpell} placeholder="Add spell…" />
      )}

      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Pact Magic — Level 1</Label>
          <div className="text-sm font-medium">1 × Level 1 pact magic slot</div>
          <div className="text-xs text-muted-foreground">Slot recovers on a Short Rest · Warlocks cannot swap spells freely — choose carefully</div>
        </div>
      )}

      {level >= 11 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Mystic Arcanum</span>
          {' '}— 6th (L11), 7th (L13), 8th (L15), 9th (L17). One casting each per long rest.
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Spellcasting + Pact Magic + Eldritch Invocations" earned={level >= 1} />
          <FeatureRow name="Magical Cunning" earned={level >= 2} />
          <FeatureRow name="Otherworldly Patron (Subclass)" earned={level >= 3} />
          <FeatureRow name="Pact Boon" earned={level >= 5} />
          <FeatureRow name="Mystic Arcanum (6th)" earned={level >= 11} />
          <FeatureRow name="Mystic Arcanum (7th)" earned={level >= 13} />
          <FeatureRow name="Mystic Arcanum (8th)" earned={level >= 15} />
          <FeatureRow name="Mystic Arcanum (9th)" earned={level >= 17} />
          <FeatureRow name="Eldritch Master" earned={level >= 20} />
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
