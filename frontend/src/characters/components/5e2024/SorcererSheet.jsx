import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import OptionCardPicker from '../OptionCardPicker';
import { SORCERER_SUBCLASSES_2024 as SUBCLASSES } from '../classChoicesData';
import { CLASS_FEATURES_2024 } from '../classFeatures2024';

const METAMAGIC_OPTIONS = [
  'Careful Spell', 'Distant Spell', 'Empowered Spell',
  'Extended Spell', 'Heightened Spell', 'Quickened Spell',
  'Seeking Spell', 'Subtle Spell', 'Transmuted Spell', 'Twinned Spell',
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
function metamagicCount(level) {
  if (level >= 17) return 4;
  if (level >= 10) return 3;
  if (level >= 3)  return 2;
  return 0;
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
  const ALLOWED = ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'];
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

export default function SorcererSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const [newSpell, setNewSpell] = useState('');
  const [newCantrip, setNewCantrip] = useState('');

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const sorceryPointsTotal = level >= 2 ? level : 0;
  const sorceryUsed = data.sorcery_points_used ?? 0;
  const mmMax = metamagicCount(level);

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
          <div className="font-bold text-lg">d6</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Sorcery Points</div>
          <div className="font-bold text-lg">{sorceryPointsTotal > 0 ? sorceryPointsTotal : 'L2+'}</div>
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

      {/* Innate Sorcery (L1) */}
      {!creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Innate Sorcery (Long Rest)</div>
            <div className="text-xs text-muted-foreground">1 minute: advantage on spell attack rolls + DC +1</div>
          </div>
          {!readOnly && (
            <button
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                data.innate_sorcery_used ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
              onClick={() => set('innate_sorcery_used', !data.innate_sorcery_used)}>
              {data.innate_sorcery_used ? 'Used' : 'Available'}
            </button>
          )}
        </div>
      )}

      {/* Sorcery Points tracker */}
      {sorceryPointsTotal > 0 && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Sorcery Points (Long Rest)</div>
            <div className="text-xs text-muted-foreground">{sorceryPointsTotal - sorceryUsed} / {sorceryPointsTotal} remaining
              {level >= 5 && ' · Sorcerous Restoration: regain 4 on Short Rest'}
            </div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('sorcery_points_used', Math.max(0, sorceryUsed - 1))} disabled={sorceryUsed <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('sorcery_points_used', Math.min(sorceryPointsTotal, sorceryUsed + 1))} disabled={sorceryUsed >= sorceryPointsTotal}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Subclass (L3 in 2024) */}
      {level >= 3 && (
        <Field label="Sorcerous Origin (Subclass)">
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

      {/* Metamagic picker (L3+) */}
      {mmMax > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Metamagic ({mmMax} options)</Label>
          <div className="flex flex-wrap gap-1.5">
            {METAMAGIC_OPTIONS.map(opt => {
              const selected = (data.metamagic ?? []).includes(opt);
              return (
                <button key={opt} type="button"
                  onClick={() => {
                    if (readOnly) return;
                    const current = data.metamagic ?? [];
                    if (selected) onChange?.({ metamagic: current.filter(x => x !== opt) });
                    else if (current.length < mmMax) onChange?.({ metamagic: [...current, opt] });
                  }}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    selected ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border text-muted-foreground'
                  } ${!selected && (data.metamagic ?? []).length >= mmMax ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  {opt}
                </button>
              );
            })}
            <span className="text-xs text-muted-foreground self-center ml-1">{(data.metamagic ?? []).length}/{mmMax}</span>
          </div>
        </div>
      )}

      {/* Spell Slots — static info during creation, tracker during play */}
      {creation ? (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spellcasting at Level 1</Label>
          <div className="text-sm font-medium">2 leveled spells known</div>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-sm font-medium">4 cantrips known</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest · Spells and cantrips chosen in CharacterDetail</div>
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
          <SpellList dataKey="known_spells" label="Spells Known" newValue={newSpell} setNew={setNewSpell} placeholder="Add spell…" />
        </>
      )}

      {creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_2024.Sorcerer[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Class Features</Label>
          <div className="rounded-md border divide-y text-sm">
            <FeatureRow name="Spellcasting + Innate Sorcery" earned={level >= 1} />
            <FeatureRow name="Sorcery Points (Font of Magic)" earned={level >= 2} />
            <FeatureRow name="Metamagic + Sorcerous Origin (Subclass)" earned={level >= 3} />
            <FeatureRow name="Sorcerous Restoration" earned={level >= 5} />
            <FeatureRow name="Arcane Apotheosis" earned={level >= 20} />
          </div>
        </div>
      )}

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
