import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

const WIZARD_CANTRIPS_2024 = [
  'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Elementalism',
  'Fire Bolt', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message',
  'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost',
  'Shocking Grasp', 'Thunderclap', 'Toll the Dead', 'True Strike',
];

const WIZARD_L1_SPELLS_2024 = [
  'Absorb Elements', 'Alarm', 'Burning Hands', 'Charm Person', 'Chromatic Orb',
  'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self',
  'Earth Tremor', 'Expeditious Retreat', 'False Life', 'Feather Fall',
  'Find Familiar', 'Fog Cloud', 'Grease', 'Ice Knife', 'Identify',
  'Illusory Script', 'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile',
  'Protection from Evil and Good', 'Ray of Sickness', 'Shield', 'Silent Image',
  'Sleep', 'Thunderwave', 'Unseen Servant', 'Witch Bolt',
];

const SUBCLASSES = [
  'Abjurer', 'Bladesinging', 'Chronurgy Magic', 'Conjurer', 'Diviner',
  'Enchanter', 'Evoker', 'Graviturgy Magic', 'Illusionist',
  'Necromancer', 'Order of Scribes', 'Transmuter', 'War Magic',
];

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
function arcaneRecoveryLevels(level) { return Math.ceil(level / 2); }

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
    </div>
  );
}

function SkillPicker({ value, onChange, max, backgroundSkills = [] }) {
  const ALLOWED = ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'];
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

export default function WizardSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpellbook, setNewSpellbook] = useState('');
  const [newPrepared, setNewPrepared] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: Math.max(0, Math.min(total, used)) } } });
  };

  const addToList = (key, value, setter) => {
    const t = value.trim();
    if (!t) return;
    const list = data[key] ?? [];
    if (!list.includes(t)) onChange?.({ [key]: [...list, t] });
    setter('');
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
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(dataKey, newValue, setNew))}
            className="flex-1 h-8 text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={() => addToList(dataKey, newValue, setNew)}>
            <Plus className="h-3 w-3" />
          </Button>
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
          <div className="font-bold text-lg">d6</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Arcane Recovery</div>
          <div className="font-bold text-lg">{arcaneRecoveryLevels(level)} levels</div>
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

      {/* Memorize Spell (L1) */}
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <div className="text-sm font-medium">Memorize Spell (Long Rest)</div>
          <div className="text-xs text-muted-foreground">Replace one prepared spell with another from your spellbook</div>
        </div>
        {!readOnly && (
          <button
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              data.memorize_spell_used ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
            onClick={() => set('memorize_spell_used', !data.memorize_spell_used)}>
            {data.memorize_spell_used ? 'Used' : 'Available'}
          </button>
        )}
      </div>

      {/* Arcane Recovery */}
      {!creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Arcane Recovery (Short Rest)</div>
            <div className="text-xs text-muted-foreground">Recover up to {arcaneRecoveryLevels(level)} total spell slot levels</div>
          </div>
          {!readOnly && (
            <button
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                data.arcane_recovery_used ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
              onClick={() => set('arcane_recovery_used', !data.arcane_recovery_used)}>
              {data.arcane_recovery_used ? 'Used' : 'Available'}
            </button>
          )}
        </div>
      )}

      {/* Scholar (L2) */}
      {level >= 2 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Scholar (L2)</span>
          {' '}— 1×/short rest: add d6 + INT modifier to Arcana, History, Nature, or Religion check.
        </div>
      )}

      {/* Subclass (L3 in 2024) */}
      {level >= 3 && (
        <Field label="Arcane Tradition (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''} onChange={e => set('subclass', e.target.value)}>
              <option value="">Select tradition…</option>
              {SUBCLASSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
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

      {/* Cantrips — picker during creation, free-text list during play */}
      {creation ? (
        <SpellPickerCreation
          label="Cantrips Known (choose 3)"
          limit={3}
          options={WIZARD_CANTRIPS_2024}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
        />
      ) : (
        <SpellList dataKey="cantrips" label="Cantrips Known" newValue={newCantrip} setNew={setNewCantrip} placeholder="Add cantrip…" />
      )}

      {/* Spellbook — picker during creation, free-text list during play */}
      {creation ? (
        <SpellPickerCreation
          label="Starting Spellbook (choose 6 × 1st-level spells)"
          limit={6}
          options={WIZARD_L1_SPELLS_2024}
          selected={data.spellbook ?? []}
          onChange={v => set('spellbook', v)}
        />
      ) : (
        <>
          <SpellList dataKey="spellbook" label="Spellbook (all known spells)" newValue={newSpellbook} setNew={setNewSpellbook} placeholder="Add spell to spellbook…" />
          <SpellList dataKey="prepared_spells" label="Prepared Spells (today)" newValue={newPrepared} setNew={setNewPrepared} placeholder="Add prepared spell…" />
        </>
      )}

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Class Features</Label>
        <div className="rounded-md border divide-y text-sm">
          <FeatureRow name="Spellcasting + Arcane Recovery + Memorize Spell" earned={level >= 1} />
          <FeatureRow name="Scholar" earned={level >= 2} />
          <FeatureRow name="Arcane Tradition (Subclass)" earned={level >= 3} />
          <FeatureRow name="Spell Mastery" earned={level >= 18} />
          <FeatureRow name="Signature Spells" earned={level >= 20} />
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
