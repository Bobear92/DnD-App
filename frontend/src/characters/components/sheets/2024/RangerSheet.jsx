import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from '@/characters/components/spells/SpellList';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { RANGER_SUBCLASSES_2024 as SUBCLASSES, RANGER_FIGHTING_STYLES_2024 as FIGHTING_STYLES } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import ClassSpellBrowser, { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import { cn } from '@/lib/utils';

const FAVORED_ENEMY_OPTIONS = [
  'Aberrations', 'Beasts', 'Celestials', 'Constructs', 'Dragons',
  'Elementals', 'Fey', 'Fiends', 'Giants', 'Humanoids',
  'Monstrosities', 'Oozes', 'Plants', 'Undead',
];

// Ranger half-caster slots (start at L1 in 2024)
const RANGER_SLOTS = {
  1:  [2, 0, 0, 0, 0], 2:  [2, 0, 0, 0, 0], 3:  [3, 0, 0, 0, 0],
  4:  [3, 0, 0, 0, 0], 5:  [4, 2, 0, 0, 0], 6:  [4, 2, 0, 0, 0],
  7:  [4, 3, 0, 0, 0], 8:  [4, 3, 0, 0, 0], 9:  [4, 3, 2, 0, 0],
  10: [4, 3, 2, 0, 0], 11: [4, 3, 3, 0, 0], 12: [4, 3, 3, 0, 0],
  13: [4, 3, 3, 1, 0], 14: [4, 3, 3, 1, 0], 15: [4, 3, 3, 2, 0],
  16: [4, 3, 3, 2, 0], 17: [4, 3, 3, 3, 1], 18: [4, 3, 3, 3, 1],
  19: [4, 3, 3, 3, 2], 20: [4, 3, 3, 3, 2],
};

function slotsForLevel(lvl) { return RANGER_SLOTS[Math.min(Math.max(lvl, 1), 20)]; }

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

function SkillPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const ALLOWED = ['Animal Handling', 'Athletics', 'Insight', 'Investigation', 'Nature', 'Perception', 'Stealth', 'Survival'];
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const extraBgSkills = backgroundSkills.filter(s => !ALLOWED.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !ALLOWED.includes(s) && !backgroundSkills.includes(s));
  const toggle = (s) => {
    if (isGranted(s)) return;
    if (value.includes(s)) onChange(value.filter(x => x !== s));
    else if (value.length < max) onChange([...value, s]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ALLOWED.map(s => {
          const fromBg = isFromBg(s);
          const fromRace = isFromRace(s);
          const isSelected = value.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggle(s)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                fromBg
                  ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed'
                  : fromRace
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed'
                    : isSelected ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-border text-muted-foreground'
              } ${!fromBg && !fromRace && !isSelected && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}>
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
        {extraRaceSkills.map(s => (
          <button key={s} type="button" disabled
            className="text-xs px-2 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600 cursor-not-allowed">
            {s}
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

const abMod = score => Math.floor(((score ?? 10) - 10) / 2);

export default function RangerSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], section = 'all', abilityScores = {}, campaignId, isGm = false, acExtra = null, maxHpNode = null }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const enemies = Array.isArray(data.favored_enemy) ? data.favored_enemy : data.favored_enemy ? [data.favored_enemy] : [];
  const [spellSubTab, setSpellSubTab] = useState('prepared');

  const wisMod = abMod(abilityScores.wisdom);
  const prepareLimit = Math.max(1, level + wisMod);

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const maxSpellLevel = maxCastableLevel(slots);

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: Math.max(0, Math.min(total, used)) } } });
  };

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {showFeatures && (
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Extra Attack</div>
          <div className="font-bold text-lg">{level >= 5 ? 2 : 1}</div>
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

      {/* Favored Enemy */}
      {showFeatures && (
      <Field label="Favored Enemy">
        <TagPicker
          value={enemies}
          onChange={v => set('favored_enemy', v)}
          options={FAVORED_ENEMY_OPTIONS}
          dropdownPlaceholder="Select enemy type…"
          customPlaceholder="Custom enemy type…"
          readOnly={readOnly}
          max={1}
        />
      </Field>
      )}

      {/* Fighting Style (L2) */}
      {level >= 2 && showFeatures && (
        <Field label="Fighting Style">
          {readOnly ? (
            <div className="text-sm py-2">{data.fighting_style || '—'}</div>
          ) : (
            <OptionCardPicker
              options={FIGHTING_STYLES}
              value={data.fighting_style ?? ''}
              onChange={v => set('fighting_style', v)}
            />
          )}
        </Field>
      )}

      {/* Weapon Mastery */}
      {showFeatures && (
      <Field label="Weapon Mastery (choose 2, change on long rest)">
        <WeaponMasteryList
          value={data.weapon_masteries ?? []}
          onChange={v => set('weapon_masteries', v)}
          readOnly={readOnly}
          max={2}
        />
      </Field>
      )}

      {/* Subclass (L3) */}
      {level >= 3 && showFeatures && (
        <Field label="Ranger Archetype (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Ranger" edition="5.5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={SUBCLASSES}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Ranger"
              edition="5.5e"
            />
          )}
        </Field>
      )}

      {/* Spell Slots — static info during creation, tracker during play */}
      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spellcasting at Level 1</Label>
          <div className="text-sm font-medium">2 leveled spells known</div>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest · Spells chosen in CharacterDetail</div>
        </div>
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <div className="space-y-3">
          {/* Sub-tab nav */}
          <div className="flex gap-1 border-b">
            {['prepared', 'prepare'].map(t => (
              <button key={t} onClick={() => setSpellSubTab(t)}
                className={cn('px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  spellSubTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                {t === 'prepared' ? 'Prepared' : 'Prepare Spells'}
              </button>
            ))}
          </div>

          {spellSubTab === 'prepared' && (
            <div className="space-y-3">
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
              <SpellList spells={data.prepared_spells ?? []} readOnly={true} label={`Prepared Spells — ${(data.prepared_spells ?? []).length}/${prepareLimit} · Long Rest`} campaignId={campaignId} />
            </div>
          )}

          {spellSubTab === 'prepare' && (
            <ClassSpellBrowser
              className="Ranger"
              campaignId={campaignId}
              preparedSpells={data.prepared_spells ?? []}
              prepareLimit={prepareLimit}
              onAdd={n => addSpell('prepared_spells', n)}
              onRemove={n => removeSpell('prepared_spells', n)}
              locked={data.prepared_locked ?? false}
              isGm={isGm}
              maxSpellLevel={maxSpellLevel}
              onLock={() => set('prepared_locked', true)}
              onUnlock={() => set('prepared_locked', false)}
            />
          )}
        </div>
      )}

      {showFeatures && (creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_2024.Ranger[1] ?? []).map(feat => (
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
            (CLASS_FEATURES_2024.Ranger[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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
      ))}

      {[4, 8, 12, 16, 19].some(l => l <= level) && showFeatures && (
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
          <SkillPicker value={data.skill_proficiencies ?? []} onChange={v => set('skill_proficiencies', v)} max={3} backgroundSkills={backgroundSkills} raceSkills={raceSkills} />
        )}
      </Field>
      )}
    </div>
  );
}
