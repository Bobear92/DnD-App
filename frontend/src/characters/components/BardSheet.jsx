/**
 * Bard (5e) — class-specific character_data section.
 * d8, full caster, Bardic Inspiration, Expertise (lvl 3), Jack of All Trades, Bard College subclass.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { CLASS_FEATURES_5E } from './classFeatures5e';

const BARD_SUBCLASSES_5E = [
  'College of Lore', 'College of Valor', 'College of Glamour',
  'College of Swords', 'College of Whispers', 'College of Creation',
  'College of Eloquence', 'College of Spirits',
];

const BARD_SLOT_TABLE = {
  1:  [2,0,0,0,0,0,0,0,0], 2:  [3,0,0,0,0,0,0,0,0],
  3:  [4,2,0,0,0,0,0,0,0], 4:  [4,3,0,0,0,0,0,0,0],
  5:  [4,3,2,0,0,0,0,0,0], 6:  [4,3,3,0,0,0,0,0,0],
  7:  [4,3,3,1,0,0,0,0,0], 8:  [4,3,3,2,0,0,0,0,0],
  9:  [4,3,3,3,1,0,0,0,0], 10: [4,3,3,3,2,0,0,0,0],
  11: [4,3,3,3,2,1,0,0,0], 12: [4,3,3,3,2,1,0,0,0],
  13: [4,3,3,3,2,1,1,0,0], 14: [4,3,3,3,2,1,1,0,0],
  15: [4,3,3,3,2,1,1,1,0], 16: [4,3,3,3,2,1,1,1,0],
  17: [4,3,3,3,2,1,1,1,1], 18: [4,3,3,3,3,1,1,1,1],
  19: [4,3,3,3,3,2,1,1,1], 20: [4,3,3,3,3,2,2,1,1],
};

const MUSICAL_INSTRUMENTS = [
  'Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute',
  'Lyre', 'Pan Flute', 'Shawm', 'Viol',
];

const BARD_CANTRIPS_5E = [
  'Blade Ward', 'Dancing Lights', 'Friends', 'Light', 'Mage Hand',
  'Mending', 'Message', 'Minor Illusion', 'Prestidigitation',
  'Thunderclap', 'True Strike', 'Vicious Mockery',
];

const BARD_SPELLS_L1_5E = [
  'Animal Friendship', 'Bane', 'Charm Person', 'Comprehend Languages',
  'Cure Wounds', 'Detect Magic', 'Disguise Self', 'Dissonant Whispers',
  'Earth Tremor', 'Faerie Fire', 'Feather Fall', 'Healing Word',
  'Heroism', 'Identify', 'Illusory Script', 'Longstrider',
  'Silent Image', 'Sleep', 'Speak with Animals', 'Thunderwave',
  'Unseen Servant',
];

function slotsForLevel(level) {
  return BARD_SLOT_TABLE[Math.min(Math.max(level, 1), 20)];
}

function bardicInspirationDie(level) {
  if (level >= 15) return 'd12';
  if (level >= 10) return 'd10';
  if (level >= 5)  return 'd8';
  return 'd6';
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

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
  const hasBgOverlap = allowed.some(s => backgroundSkills.includes(s));
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
        <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
      </div>
      {hasBgOverlap && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
    </div>
  );
}

function InstrumentPicker({ value, onChange, max = 3 }) {
  const [customInput, setCustomInput] = useState('');

  const toggle = (inst) => {
    if (value.includes(inst)) onChange(value.filter(i => i !== inst));
    else if (value.length < max) onChange([...value, inst]);
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= max) return;
    onChange([...value, trimmed]);
    setCustomInput('');
  };

  const customInstruments = value.filter(i => !MUSICAL_INSTRUMENTS.includes(i));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {MUSICAL_INSTRUMENTS.map(inst => (
          <button key={inst} type="button" onClick={() => toggle(inst)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              value.includes(inst) ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border text-muted-foreground'
            } ${!value.includes(inst) && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {inst}
          </button>
        ))}
        {customInstruments.map(inst => (
          <button key={inst} type="button" onClick={() => toggle(inst)}
            className="text-xs px-2 py-1 rounded-full border transition-colors bg-primary text-primary-foreground border-primary">
            {inst}
          </button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">{value.length}/{max} chosen</div>
      <div className="flex gap-2">
        <Input
          placeholder="Other instrument…"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          className="flex-1 h-8 text-sm"
          disabled={value.length >= max}
        />
        <Button type="button" size="sm" variant="outline" onClick={addCustom} disabled={value.length >= max}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
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

export default function BardSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const biDie = bardicInspirationDie(level);
  const biUsed = data.bardic_inspiration_used ?? 0;

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

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
          <div className="text-xs text-muted-foreground">Bardic Inspiration</div>
          <div className="font-bold text-lg">{biDie}</div>
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

      {/* Bardic Inspiration tracker */}
      {!creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Bardic Inspiration ({level >= 5 ? 'Short' : 'Long'} Rest)</div>
            <div className="text-xs text-muted-foreground">
              {level >= 5 ? `CHA mod uses — track manually` : `${1 - biUsed} / 1 remaining`}
            </div>
          </div>
          {!readOnly && level < 5 && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('bardic_inspiration_used', Math.max(0, biUsed - 1))} disabled={biUsed <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('bardic_inspiration_used', Math.min(1, biUsed + 1))} disabled={biUsed >= 1}>+</button>
            </div>
          )}
          {!readOnly && level >= 5 && (
            <Input type="number" value={data.bardic_inspiration_used ?? 0}
              onChange={e => set('bardic_inspiration_used', parseInt(e.target.value) || 0)}
              className="w-16 text-center h-8" />
          )}
        </div>
      )}

      {/* Instrument proficiencies */}
      <Field label="Instrument Proficiencies">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.instrument_proficiencies ?? []).map(i => <Badge key={i} variant="secondary">{i}</Badge>)}
            {(data.instrument_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <InstrumentPicker value={data.instrument_proficiencies ?? []} onChange={v => set('instrument_proficiencies', v)} />
        )}
      </Field>

      {/* Subclass (level 3) */}
      {level >= 3 && (
        <Field label="Bard College (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''} onChange={e => set('subclass', e.target.value)}>
              <option value="">Select college…</option>
              {BARD_SUBCLASSES_5E.map(s => <option key={s} value={s}>{s}</option>)}
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
      )}

      {/* Cantrips — picker during creation, free-text list during play */}
      {creation ? (
        <SpellPickerCreation
          label="Cantrips Known (choose 2)"
          limit={2}
          options={BARD_CANTRIPS_5E}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
        />
      ) : (
        <SpellList dataKey="cantrips" label="Cantrips Known" newValue={newCantrip} setNew={setNewCantrip} placeholder="Add cantrip…" />
      )}

      {/* Spells Known — picker during creation, free-text list during play */}
      {creation ? (
        <SpellPickerCreation
          label="Spells Known at Level 1 (choose 4)"
          limit={4}
          options={BARD_SPELLS_L1_5E}
          selected={data.known_spells ?? []}
          onChange={v => set('known_spells', v)}
        />
      ) : (
        <SpellList dataKey="known_spells" label="Spells Known" newValue={newSpell} setNew={setNewSpell} placeholder="Add spell…" />
      )}

      {/* Class features */}
      {creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Bard[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Bardic Inspiration' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Inspiration die: <span className="font-bold">{biDie}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Class Features</Label>
          <div className="rounded-md border divide-y text-sm">
            <FeatureRow name="Spellcasting + Bardic Inspiration" earned={level >= 1} />
            <FeatureRow name="Jack of All Trades + Song of Rest" earned={level >= 2} />
            <FeatureRow name="Bard College (Subclass) + Expertise (2)" earned={level >= 3} />
            <FeatureRow name="Font of Inspiration" earned={level >= 5} />
            <FeatureRow name="Countercharm + Expertise (4 total)" earned={level >= 6} />
            <FeatureRow name="Magical Secrets" earned={level >= 10} />
            <FeatureRow name="Superior Inspiration" earned={level >= 20} />
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
      <Field label="Skill Proficiencies (choose any 3)">
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
            max={3}
            allowed={ALL_SKILLS}
            backgroundSkills={backgroundSkills}
          />
        )}
      </Field>

      {/* Expertise — level 3+ only; shown after skill proficiencies */}
      {level >= 3 && (
        <Field label="Expertise (double proficiency — choose 2)">
          {readOnly ? (
            <div className="flex flex-wrap gap-1">
              {(data.expertise ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              {(data.expertise ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
            </div>
          ) : (() => {
            const pool = [...new Set([...(data.skill_proficiencies ?? []), ...backgroundSkills])];
            return pool.length === 0
              ? <p className="text-xs text-muted-foreground">Select skill proficiencies above first.</p>
              : <SkillPicker value={data.expertise ?? []} onChange={v => set('expertise', v)} max={level >= 6 ? 4 : 2} allowed={pool} />;
          })()}
        </Field>
      )}
    </div>
  );
}
