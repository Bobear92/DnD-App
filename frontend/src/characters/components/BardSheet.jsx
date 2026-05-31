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
import SpellList from './SpellList';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { BARD_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';

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

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [], raceSkills = [] }) {
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const hasBgOverlap = allowed.some(s => backgroundSkills.includes(s));
  const hasRaceOverlap = allowed.some(s => raceSkills.includes(s));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {allowed.map(skill => {
          const fromBg = isFromBg(skill);
          const fromRace = isFromRace(skill);
          const isSelected = value.includes(skill);
          return (
            <button key={skill} type="button" onClick={() => toggle(skill)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                fromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : fromRace
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!fromBg && !fromRace && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {skill}
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
      </div>
      {hasBgOverlap && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
      {hasRaceOverlap && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">Emerald = already granted by your race</p>
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

function SpellPickerCreation({ label, limit, options, selected, onChange, raceGrantedSpells = [] }) {
  const toggle = (spell) => {
    if (raceGrantedSpells.includes(spell)) return;
    if (selected.includes(spell)) onChange(selected.filter(s => s !== spell));
    else if (selected.length < limit) onChange([...selected, spell]);
  };
  const extraRaceSpells = raceGrantedSpells.filter(s => !options.includes(s));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs text-muted-foreground">{selected.length}/{limit} chosen</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(spell => {
          const isRace = raceGrantedSpells.includes(spell);
          const isSel  = selected.includes(spell);
          return (
            <button key={spell} type="button" onClick={() => toggle(spell)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                isRace
                  ? 'bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-600 cursor-not-allowed'
                  : isSel
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!isRace && !isSel && selected.length >= limit ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {spell}
            </button>
          );
        })}
        {extraRaceSpells.map(spell => (
          <button key={spell} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-600 cursor-not-allowed">
            {spell}
          </button>
        ))}
      </div>
      {raceGrantedSpells.length > 0 && (
        <p className="text-xs text-violet-700 dark:text-violet-400">Violet = already granted by your race or subrace</p>
      )}
    </div>
  );
}

export default function BardSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], raceGrantedCantrips = [], section = 'all', acExtra = null, maxHpNode = null }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const biDie = bardicInspirationDie(level);
  const biUsed = data.bardic_inspiration_used ?? 0;

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };


  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info — features only */}
      {showFeatures && (
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Bardic Inspiration</div>
          <div className="font-bold text-lg">{biDie}</div>
        </div>
      </div>
      )}

      {/* HP — features only */}
      {showCombat && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Max HP">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{maxHpNode ?? (data.hp_max ?? '—')}</div>
          </Field>
          <Field label="Current HP">
            <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
          </Field>
          <Field label="Temp HP">
            <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
          </Field>
        </div>
      )}

      {/* Hit Dice — features only */}
      {showCombat && (
        <HitDiceTracker hitDie={8} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}

      {/* AC — features only */}
      {showCombat && (
        <Field label="Armor Class">
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      )}

      {showCombat && acExtra}

      {/* Speed — features only */}
      {showCombat && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Speed (ft)">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.speed ?? 30}</div>
          </Field>
          <Field label="Speed Bonus (ft)">
            <Input type="number" value={data.speed_bonus ?? 0} onChange={e => set('speed_bonus', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
          </Field>
          <Field label="Total Speed (ft)">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{(data.speed ?? 30) + (data.speed_bonus ?? 0)}</div>
          </Field>
        </div>
      )}

      {/* Bardic Inspiration tracker — features only */}
      {showFeatures && !creation && (
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

      {/* Instrument proficiencies — features only */}
      {showFeatures && (
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
      )}

      {/* Subclass (level 3) — features only */}
      {showFeatures && level >= 3 && (
        <Field label="Bard College (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Bard" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={BARD_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Bard"
              edition="5e"
            />
          )}
        </Field>
      )}

      {/* Spell Slots — spells section only */}
      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
        </div>
      )}
      {!creation && (section === 'all' || section === 'spells') && (
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

      {/* Cantrips — spells section only */}
      {creation && (
        <SpellPickerCreation
          label="Cantrips Known (choose 2)"
          limit={2}
          options={BARD_CANTRIPS_5E}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
          raceGrantedSpells={raceGrantedCantrips}
        />
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <SpellList spells={data.cantrips ?? []} onAdd={n => addSpell('cantrips', n)} onRemove={n => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" placeholder="Add cantrip…" isCantrips={true} />
      )}

      {/* Spells Known — spells section only */}
      {creation && (
        <SpellPickerCreation
          label="Spells Known at Level 1 (choose 4)"
          limit={4}
          options={BARD_SPELLS_L1_5E}
          selected={data.known_spells ?? []}
          onChange={v => set('known_spells', v)}
        />
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <SpellList spells={data.known_spells ?? []} onAdd={n => addSpell('known_spells', n)} onRemove={n => removeSpell('known_spells', n)} readOnly={readOnly} label="Spells Known" placeholder="Add spell…" />
      )}

      {/* Class features — features only */}
      {showFeatures && (
        creation ? (
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
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
            {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
              (CLASS_FEATURES_5E.Bard[lvl] ?? []).map(feat => ({ ...feat, lvl }))
            ).map(feat => (
              <div key={`${feat.lvl}-${feat.name}`} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground">Lvl {feat.lvl}</span>
                  <div className="font-semibold text-sm">{feat.name}</div>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ASI reminder — features only */}
      {showFeatures && ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {/* Skill proficiencies — during creation only */}
      {creation && showFeatures && (
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
                const pool = [...new Set([...v, ...backgroundSkills, ...raceSkills])];
                const cleanedExpertise = (data.expertise ?? []).filter(s => pool.includes(s));
                onChange?.({ skill_proficiencies: v, expertise: cleanedExpertise });
              }}
              max={3}
              allowed={ALL_SKILLS}
              backgroundSkills={backgroundSkills}
              raceSkills={raceSkills}
            />
          )}
        </Field>
      )}

      {/* Expertise — features only */}
      {showFeatures && level >= 3 && (
        <Field label="Expertise (double proficiency — choose 2)">
          {readOnly ? (
            <div className="flex flex-wrap gap-1">
              {(data.expertise ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
              {(data.expertise ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
            </div>
          ) : (() => {
            const pool = [...new Set([...(data.skill_proficiencies ?? []), ...backgroundSkills])];
            return pool.length === 0
              ? <p className="text-xs text-muted-foreground">No proficient skills to apply expertise to.</p>
              : <SkillPicker value={data.expertise ?? []} onChange={v => set('expertise', v)} max={level >= 6 ? 4 : 2} allowed={pool} />;
          })()}
        </Field>
      )}
    </div>
  );
}
