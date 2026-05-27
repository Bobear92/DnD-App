/**
 * Wizard (5e) — class-specific character_data section.
 * Full caster: spell slots levels 1–9, spellbook, prepared list.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { WIZARD_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';

const WIZARD_CANTRIPS_5E = [
  'Acid Splash', 'Blade Ward', 'Booming Blade', 'Chill Touch', 'Control Flames',
  'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Frostbite',
  'Green-Flame Blade', 'Gust', 'Infestation', 'Light', 'Lightning Lure',
  'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Mold Earth',
  'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shape Water',
  'Shocking Grasp', 'Sapping Sting', 'Thunderclap', 'Toll the Dead', 'True Strike',
];

const WIZARD_L1_SPELLS_5E = [
  'Absorb Elements', 'Alarm', 'Burning Hands', 'Catapult', 'Cause Fear',
  'Charm Person', 'Chromatic Orb', 'Color Spray', 'Comprehend Languages',
  'Detect Magic', 'Disguise Self', 'Earth Tremor', 'Expeditious Retreat',
  'False Life', 'Feather Fall', 'Find Familiar', 'Fog Cloud', 'Grease',
  'Ice Knife', 'Identify', 'Illusory Script', 'Jump', 'Longstrider',
  'Mage Armor', 'Magic Missile', 'Protection from Evil and Good',
  'Ray of Sickness', 'Shield', 'Silent Image', 'Sleep', 'Snare',
  "Tasha's Caustic Brew", 'Thunderwave', 'Unseen Servant', 'Witch Bolt',
];

// Wizard full caster slot table
const WIZARD_SLOTS = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

function slotsForLevel(level) {
  return WIZARD_SLOTS[Math.min(Math.max(level, 1), 20)];
}

function arcaneRecoveryLevels(level) {
  return Math.ceil(level / 2);
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

export default function WizardSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceGrantedCantrips = [], section = 'all' }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const [newSpellbook, setNewSpellbook] = useState('');
  const [newPrepared, setNewPrepared] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const addToList = (key, value, setter) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const list = data[key] ?? [];
    if (!list.includes(trimmed)) onChange?.({ [key]: [...list, trimmed] });
    setter('');
  };

  const removeFromList = (key, item) => {
    onChange?.({ [key]: (data[key] ?? []).filter(s => s !== item) });
  };

  const SpellList = ({ dataKey, label, newValue, setNew, placeholder }) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
        {(data[dataKey] ?? []).map(spell => (
          <Badge key={spell} variant="secondary" className="gap-1">
            {spell}
            {!readOnly && (
              <button onClick={() => removeFromList(dataKey, spell)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {(data[dataKey] ?? []).length === 0 && (
          <span className="text-xs text-muted-foreground">None added</span>
        )}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newValue}
            onChange={e => setNew(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(dataKey, newValue, setNew))}
            className="flex-1 h-8 text-sm"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => addToList(dataKey, newValue, setNew)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Current HP</Label>
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Max HP</Label>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.hp_max ?? '—'}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Temp HP</Label>
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
      </div>
      )}

      {/* Hit Dice */}
      {showCombat && (
        <HitDiceTracker hitDie={6} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}

      {/* AC */}
      {showCombat && (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Armor Class</Label>
        <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
      </div>
      )}

      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Speed (ft)</Label>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.speed ?? 30}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Speed Bonus (ft)</Label>
          <Input type="number" value={data.speed_bonus ?? 0} onChange={e => set('speed_bonus', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Total Speed (ft)</Label>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{(data.speed ?? 30) + (data.speed_bonus ?? 0)}</div>
        </div>
      </div>
      )}

      {showFeatures && level >= 2 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Arcane Tradition (Subclass)</Label>
          {(readOnly || !!data.subclass) ? (
            data.subclass ? (
              <SubclassDetails className="Wizard" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={WIZARD_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Wizard"
              edition="5e"
            />
          )}
        </div>
      )}

      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
        </div>
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Arcane Recovery (Short Rest)</div>
            <div className="text-xs text-muted-foreground">Recover up to {arcaneRecoveryLevels(level)} total spell slot levels</div>
          </div>
          {!readOnly && (
            <button
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                data.arcane_recovery_used
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
              onClick={() => set('arcane_recovery_used', !data.arcane_recovery_used)}
            >
              {data.arcane_recovery_used ? 'Used' : 'Available'}
            </button>
          )}
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
                        disabled={used <= 0}
                        onClick={() => setSlotUsed(slotLevel, used - 1)}>−</button>
                      <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                        disabled={used >= total}
                        onClick={() => setSlotUsed(slotLevel, used + 1)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {creation && (
        <SpellPickerCreation
          label="Cantrips Known (choose 3)"
          limit={3}
          options={WIZARD_CANTRIPS_5E}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
          raceGrantedSpells={raceGrantedCantrips}
        />
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <SpellList
          dataKey="cantrips"
          label="Cantrips Known"
          newValue={newCantrip}
          setNew={setNewCantrip}
          placeholder="Add cantrip…"
        />
      )}

      {creation && (
        <SpellPickerCreation
          label="Starting Spellbook (choose 6 × 1st-level spells)"
          limit={6}
          options={WIZARD_L1_SPELLS_5E}
          selected={data.spellbook ?? []}
          onChange={v => set('spellbook', v)}
        />
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <>
          <SpellList
            dataKey="spellbook"
            label="Spellbook (all known spells)"
            newValue={newSpellbook}
            setNew={setNewSpellbook}
            placeholder="Add spell to spellbook…"
          />
          <SpellList
            dataKey="prepared_spells"
            label="Prepared Spells (today)"
            newValue={newPrepared}
            setNew={setNewPrepared}
            placeholder="Add prepared spell…"
          />
        </>
      )}

      {showFeatures && (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Skill Proficiencies{creation ? ' (choose 2)' : ''}</Label>
        {(creation && !readOnly) ? (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={2}
            allowed={['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']}
            backgroundSkills={backgroundSkills}
          />
        ) : (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        )}
      </div>
      )}

      {showFeatures && (
      creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Wizard[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Arcane Recovery' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Recover up to <span className="font-bold">{arcaneRecoveryLevels(level)} spell slot level{arcaneRecoveryLevels(level) > 1 ? 's' : ''}</span> on a short rest
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Wizard[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {showFeatures && [4, 8, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}
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
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                isFromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!isFromBg && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
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
