/**
 * Ranger (5e) — class-specific character_data section.
 * d10, half-caster (slots start at level 1), Fighting Style, Favored Enemy, Ranger Archetype.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from '@/characters/components/spells/SpellList';
import SpellSlotTracker from '@/characters/components/spells/SpellSlotTracker';
import { useSlotCaster } from '@/characters/components/sheets/classSheet/hooks/useSlotCaster';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { RANGER_FIGHTING_STYLES_5E, RANGER_SUBCLASSES_5E } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import Field from '@/characters/components/sheets/Field';

const FAVORED_ENEMY_OPTIONS = [
  'Aberrations', 'Beasts', 'Celestials', 'Constructs', 'Dragons',
  'Elementals', 'Fey', 'Fiends', 'Giants', 'Monstrosities',
  'Oozes', 'Plants', 'Undead',
];

const FAVORED_TERRAIN_OPTIONS = [
  'Arctic', 'Coast', 'Desert', 'Forest', 'Grassland',
  'Mountain', 'Swamp', 'Underdark',
];

// Ranger half-caster slot table (spellcasting starts at level 2)
const RANGER_SLOTS = {
  1:  [0, 0, 0, 0, 0],
  2:  [2, 0, 0, 0, 0],
  3:  [3, 0, 0, 0, 0],
  4:  [3, 0, 0, 0, 0],
  5:  [4, 2, 0, 0, 0],
  6:  [4, 2, 0, 0, 0],
  7:  [4, 3, 0, 0, 0],
  8:  [4, 3, 0, 0, 0],
  9:  [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0],
  11: [4, 3, 3, 0, 0],
  12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0],
  14: [4, 3, 3, 1, 0],
  15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0],
  17: [4, 3, 3, 3, 1],
  18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2],
  20: [4, 3, 3, 3, 2],
};

function slotsForLevel(level) {
  return RANGER_SLOTS[Math.min(Math.max(level, 1), 20)];
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

function TagPicker({ value, onChange, options, dropdownPlaceholder, customPlaceholder, readOnly, max }) {
  const [custom, setCustom] = useState('');
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1 py-1">
        {value.length > 0
          ? value.map(item => <Badge key={item} variant="secondary">{item}</Badge>)
          : <span className="text-sm text-muted-foreground">—</span>}
      </div>
    );
  }
  const atMax = max != null && value.length >= max;
  const remaining = options.filter(o => !value.includes(o));
  const add = (item) => { if (item && !value.includes(item) && !atMax) onChange([...value, item]); };
  const addCustom = () => {
    const t = custom.trim();
    if (!t || value.includes(t) || atMax) return;
    onChange([...value, t]);
    setCustom('');
  };
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map(item => (
            <Badge key={item} variant="secondary" className="gap-1">
              {item}
              <button type="button" onClick={() => onChange(value.filter(v => v !== item))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {!atMax && remaining.length > 0 && (
        <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value="" onChange={e => { if (e.target.value) add(e.target.value); }}>
          <option value="">{dropdownPlaceholder}</option>
          {remaining.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {!atMax && (
        <div className="flex gap-2">
          <Input placeholder={customPlaceholder} value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
            className="flex-1 h-8 text-sm" />
          <Button type="button" size="sm" variant="outline" onClick={addCustom}><Plus className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
}

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [], raceSkills = [] }) {
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const extraBgSkills = backgroundSkills.filter(s => !allowed.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !allowed.includes(s) && !backgroundSkills.includes(s));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {allowed.map(skill => {
          const fromBg = isFromBg(skill);
          const fromRace = isFromRace(skill);
          const isSelected = value.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggle(skill)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                fromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : fromRace
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed'
                    : isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!fromBg && !fromRace && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
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
        {extraRaceSkills.map(skill => (
          <button key={skill} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed">
            {skill}
          </button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max}</span>
      </div>
      {backgroundSkills.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
      {raceSkills.length > 0 && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">Emerald = already granted by your race</p>
      )}
    </div>
  );
}

export default function RangerSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], section = 'all', acExtra = null, maxHpNode = null, isGm = false }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });
  const enemies = Array.isArray(data.favored_enemy) ? data.favored_enemy : data.favored_enemy ? [data.favored_enemy] : [];
  const terrains = Array.isArray(data.favored_terrain) ? data.favored_terrain : data.favored_terrain ? [data.favored_terrain] : [];
  const slots = slotsForLevel(level);
  const { spellSlots, availableSlots, setSlotUsed, handleCastSpell } = useSlotCaster({ slots, data, onChange });

  return (
    <div className="space-y-4">
      {showFeatures && level >= 5 && (
      <div className="grid gap-3 grid-cols-1">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Extra Attack</div>
          <div className="font-bold text-lg">2</div>
        </div>
      </div>
      )}

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

      {/* Hit Dice */}
      {showCombat && (
        <HitDiceTracker hitDie={10} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}



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

      {showFeatures && (
      <Field label="Favored Enemy">
        <TagPicker
          value={enemies}
          onChange={v => set('favored_enemy', v)}
          options={FAVORED_ENEMY_OPTIONS}
          dropdownPlaceholder="Select enemy type…"
          customPlaceholder="Custom enemy type…"
          readOnly={readOnly}
          max={level >= 14 ? 3 : level >= 6 ? 2 : 1}
        />
      </Field>
      )}

      {showFeatures && (
      <Field label="Favored Terrain (Natural Explorer)">
        <TagPicker
          value={terrains}
          onChange={v => set('favored_terrain', v)}
          options={FAVORED_TERRAIN_OPTIONS}
          dropdownPlaceholder="Select terrain type…"
          customPlaceholder="Custom terrain type…"
          readOnly={readOnly}
          max={level >= 10 ? 2 : 1}
        />
      </Field>
      )}

      {showFeatures && level >= 2 && (
        <Field label="Fighting Style">
          {readOnly ? (
            <div className="text-sm py-2">{data.fighting_style || '—'}</div>
          ) : (
            <OptionCardPicker
              options={RANGER_FIGHTING_STYLES_5E}
              value={data.fighting_style ?? ''}
              onChange={v => set('fighting_style', v)}
            />
          )}
        </Field>
      )}

      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium text-muted-foreground">No spell slots — spellcasting begins at level 2</div>
        </div>
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <SpellSlotTracker slots={slots} spellSlots={spellSlots} onSetSlotUsed={setSlotUsed} readOnly={readOnly} isGm={isGm} />
      )}

      {!creation && (section === 'all' || section === 'spells') && (
        <SpellList spells={data.prepared_spells ?? []} onRemove={n => removeSpell('prepared_spells', n)} readOnly={readOnly} label="Prepared Spells" onCastSpell={!readOnly ? handleCastSpell : undefined} availableSlots={!readOnly ? availableSlots : undefined} />
      )}

      {showFeatures && level >= 3 && (
        <Field label="Ranger Archetype (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Ranger" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={RANGER_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Ranger"
              edition="5e"
            />
          )}
        </Field>
      )}

      {showFeatures && (
      creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Ranger[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Ranger[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {showFeatures && ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {creation && showFeatures && (
      <Field label="Skill Proficiencies (choose 3)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={3}
            allowed={['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival']}
            backgroundSkills={backgroundSkills}
            raceSkills={raceSkills}
          />
        )}
      </Field>
      )}
    </div>
  );
}
