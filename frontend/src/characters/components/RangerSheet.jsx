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
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { RANGER_FIGHTING_STYLES_5E, RANGER_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';

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

export default function RangerSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], section = 'all' }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section !== 'stats';
  const [newSpell, setNewSpell] = useState('');
  const enemies = Array.isArray(data.favored_enemy) ? data.favored_enemy : data.favored_enemy ? [data.favored_enemy] : [];
  const terrains = Array.isArray(data.favored_terrain) ? data.favored_terrain : data.favored_terrain ? [data.favored_terrain] : [];
  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const addSpell = () => {
    const trimmed = newSpell.trim();
    if (!trimmed) return;
    const list = data.prepared_spells ?? [];
    if (!list.includes(trimmed)) onChange?.({ prepared_spells: [...list, trimmed] });
    setNewSpell('');
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

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
        <Field label="Current HP">
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
        <Field label="Max HP">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.hp_max ?? '—'}</div>
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

      {/* AC */}
      {showCombat && (
        <Field label="Armor Class">
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
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
      {!creation && section !== 'features' && (
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

      {!creation && section !== 'features' && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Prepared Spells</Label>
          <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
            {(data.prepared_spells ?? []).map(spell => (
              <Badge key={spell} variant="secondary" className="gap-1">
                {spell}
                {!readOnly && (
                  <button onClick={() => onChange?.({ prepared_spells: (data.prepared_spells ?? []).filter(s => s !== spell) })} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(data.prepared_spells ?? []).length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Input placeholder="Add spell…" value={newSpell} onChange={e => setNewSpell(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpell())} className="flex-1 h-8 text-sm" />
              <Button type="button" size="sm" variant="outline" onClick={addSpell}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      )}

      {showFeatures && level >= 3 && (
        <Field label="Ranger Archetype (Subclass)">
          {(readOnly || !!data.subclass) ? (
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

      {showFeatures && (
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
          />
        )}
      </Field>
      )}
    </div>
  );
}
