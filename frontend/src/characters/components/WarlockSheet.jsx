/**
 * Warlock (5e) — class-specific character_data section.
 * d8, Pact Magic (unique short-rest slots), Eldritch Invocations, Otherworldly Patron (level 1).
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { CLASS_FEATURES_5E } from './classFeatures5e';

const WARLOCK_SUBCLASSES_5E = [
  'The Archfey', 'The Fiend', 'The Great Old One',
  'The Celestial', 'The Hexblade', 'The Fathomless',
  'The Genie', 'The Undead', 'The Undying',
];

const PACT_BOONS = [
  'Pact of the Chain', 'Pact of the Blade', 'Pact of the Tome',
];

// Pact Magic slot table: [slot_count, slot_level]
const PACT_SLOTS = {
  1:  [1, 1], 2:  [2, 1], 3:  [2, 2], 4:  [2, 2],
  5:  [2, 3], 6:  [2, 3], 7:  [2, 4], 8:  [2, 4],
  9:  [2, 5], 10: [2, 5], 11: [3, 5], 12: [3, 5],
  13: [3, 5], 14: [3, 5], 15: [3, 5], 16: [3, 5],
  17: [4, 5], 18: [4, 5], 19: [4, 5], 20: [4, 5],
};

function pactSlotsForLevel(level) {
  return PACT_SLOTS[Math.min(Math.max(level, 1), 20)];
}

function invocationCount(level) {
  if (level >= 15) return 8;
  if (level >= 12) return 7;
  if (level >= 9)  return 6;
  if (level >= 7)  return 5;
  if (level >= 5)  return 4;
  if (level >= 3)  return 3;
  return 2;
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

const WARLOCK_CANTRIPS_5E = [
  'Blade Ward', 'Chill Touch', 'Eldritch Blast', 'Friends',
  'Mage Hand', 'Minor Illusion', 'Poison Spray', 'Prestidigitation',
  'Toll the Dead', 'True Strike',
];

const WARLOCK_SPELLS_L1_5E = [
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

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
    </div>
  );
}

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [] }) {
  const toggle = (skill) => {
    if (backgroundSkills.includes(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const extraBgSkills = backgroundSkills.filter(s => !allowed.includes(s));
  const hasBgOverlap = backgroundSkills.length > 0;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {allowed.map(skill => {
          const isFromBg = backgroundSkills.includes(skill);
          const isSelected = value.includes(skill);
          return (
            <button key={skill} type="button" onClick={() => toggle(skill)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                isFromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!isFromBg && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
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

export default function WarlockSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');
  const [newInvocation, setNewInvocation] = useState('');

  const [slotCount, slotLevel] = pactSlotsForLevel(level);
  const slotsUsed = data.pact_slots_used ?? 0;

  const SpellList = ({ dataKey, label, newValue, setNew, placeholder }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
        {(data[dataKey] ?? []).map(spell => (
          <Badge key={spell} variant="secondary" className="gap-1">
            {spell}
            {!readOnly && (
              <button onClick={() => onChange?.({ [dataKey]: (data[dataKey] ?? []).filter(s => s !== spell) })} className="hover:text-destructive">
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
                const trimmed = newValue.trim();
                if (!trimmed) return;
                const list = data[dataKey] ?? [];
                if (!list.includes(trimmed)) onChange?.({ [dataKey]: [...list, trimmed] });
                setNew('');
              }
            }} className="flex-1 h-8 text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={() => {
            const trimmed = newValue.trim();
            if (!trimmed) return;
            const list = data[dataKey] ?? [];
            if (!list.includes(trimmed)) onChange?.({ [dataKey]: [...list, trimmed] });
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
      {/* Combat info */}
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

      {/* Otherworldly Patron subclass (level 1) */}
      <Field label="Otherworldly Patron (Subclass)">
        {readOnly ? (
          <div className="text-sm py-2">{data.subclass || '—'}</div>
        ) : (
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={data.subclass ?? ''} onChange={e => set('subclass', e.target.value)}>
            <option value="">Select patron…</option>
            {WARLOCK_SUBCLASSES_5E.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </Field>

      {/* Pact Boon (level 3) */}
      {level >= 3 && (
        <Field label="Pact Boon">
          {readOnly ? (
            <div className="text-sm py-2">{data.pact_boon || '—'}</div>
          ) : (
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.pact_boon ?? ''} onChange={e => set('pact_boon', e.target.value)}>
              <option value="">Select pact boon…</option>
              {PACT_BOONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </Field>
      )}

      {/* Eldritch Invocations (level 2+) */}
      {level >= 2 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Eldritch Invocations ({invocationCount(level)} max)</Label>
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
          {!readOnly && (data.eldritch_invocations ?? []).length < invocationCount(level) && (
            <div className="flex gap-2">
              <Input placeholder="Add invocation…" value={newInvocation} onChange={e => setNewInvocation(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = newInvocation.trim();
                    if (!trimmed) return;
                    const list = data.eldritch_invocations ?? [];
                    if (!list.includes(trimmed) && list.length < invocationCount(level)) onChange?.({ eldritch_invocations: [...list, trimmed] });
                    setNewInvocation('');
                  }
                }} className="flex-1 h-8 text-sm" />
              <Button type="button" size="sm" variant="outline" onClick={() => {
                const trimmed = newInvocation.trim();
                if (!trimmed) return;
                const list = data.eldritch_invocations ?? [];
                if (!list.includes(trimmed) && list.length < invocationCount(level)) onChange?.({ eldritch_invocations: [...list, trimmed] });
                setNewInvocation('');
              }}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      )}

      {creation ? (
        <SpellPickerCreation label="Cantrips Known (choose 2)" limit={2} options={WARLOCK_CANTRIPS_5E}
          selected={data.cantrips ?? []} onChange={v => set('cantrips', v)} />
      ) : (
        <SpellList dataKey="cantrips" label="Cantrips Known" newValue={newCantrip} setNew={setNewCantrip} placeholder="Add cantrip…" />
      )}
      {creation ? (
        <SpellPickerCreation label="Spells Known at Level 1 (choose 2)" limit={2} options={WARLOCK_SPELLS_L1_5E}
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

      {/* Mystic Arcanum */}
      {level >= 11 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Mystic Arcanum</span>
          {' '}— 6th level (L11), 7th (L13), 8th (L15), 9th (L17). One casting each per long rest. Track with your spell list.
        </div>
      )}

      {/* Class features */}
      {creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Warlock[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Pact Magic' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Starting slots: <span className="font-bold">{slotCount} × level {slotLevel}</span>
                  <span className="font-normal text-muted-foreground ml-1">— regain on short rest</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Class Features</Label>
          <div className="rounded-md border divide-y text-sm">
            <FeatureRow name="Otherworldly Patron (Subclass) + Pact Magic" earned={level >= 1} />
            <FeatureRow name="Eldritch Invocations" earned={level >= 2} />
            <FeatureRow name="Pact Boon" earned={level >= 3} />
            <FeatureRow name="Mystic Arcanum (6th level)" earned={level >= 11} />
            <FeatureRow name="Mystic Arcanum (7th level)" earned={level >= 13} />
            <FeatureRow name="Mystic Arcanum (8th level)" earned={level >= 15} />
            <FeatureRow name="Mystic Arcanum (9th level)" earned={level >= 17} />
            <FeatureRow name="Eldritch Master" earned={level >= 20} />
          </div>
        </div>
      )}

      {/* ASI reminder */}
      {ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {/* Skill proficiencies */}
      <Field label="Skill Proficiencies (choose 2)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={2}
            allowed={['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion']}
            backgroundSkills={backgroundSkills}
          />
        )}
      </Field>
    </div>
  );
}
