/**
 * Artificer (5e / Tasha's CoE) — class-specific character_data section.
 * d8, half-caster (spell slots start at level 1), subclass at level 3.
 * Unique mechanics: Infuse Item tracker, Flash of Genius (INT mod uses/LR).
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import SpellList from './SpellList';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { ARTIFICER_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';
import ClassSpellBrowser, { maxCastableLevel } from './ClassSpellBrowser';
import { cn } from '@/lib/utils';

// Half-caster spell slots starting at level 1 (same as 2024 Paladin)
const ARTIFICER_SLOTS = {
  1:  [2,0,0,0,0],  2:  [2,0,0,0,0],  3:  [3,0,0,0,0],  4:  [3,0,0,0,0],
  5:  [4,2,0,0,0],  6:  [4,2,0,0,0],  7:  [4,3,0,0,0],  8:  [4,3,0,0,0],
  9:  [4,3,2,0,0],  10: [4,3,2,0,0],  11: [4,3,3,0,0],  12: [4,3,3,0,0],
  13: [4,3,3,1,0],  14: [4,3,3,1,0],  15: [4,3,3,2,0],  16: [4,3,3,2,0],
  17: [4,3,3,3,1],  18: [4,3,3,3,1],  19: [4,3,3,3,2],  20: [4,3,3,3,2],
};

// Infusion counts by level: [infusions known, max infused items]
function infusionsForLevel(level) {
  if (level < 2)  return { known: 0, max: 0 };
  if (level < 6)  return { known: 4, max: 2 };
  if (level < 10) return { known: 6, max: 3 };
  if (level < 14) return { known: 8, max: 4 };
  if (level < 18) return { known: 10, max: 5 };
  return { known: 12, max: 6 };
}

// Max magic item attunement slots by level
function attunementForLevel(level) {
  if (level >= 18) return 6;
  if (level >= 14) return 5;
  if (level >= 10) return 4;
  return 3;
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

function mod(score) { return Math.floor((score - 10) / 2); }

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function CounterRow({ label, used, total, onDecrement, onIncrement, readOnly }) {
  return (
    <div className="rounded-md border text-center p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-bold text-sm">{total - used}/{total}</div>
      {!readOnly && (
        <div className="flex justify-center gap-0.5 mt-1">
          <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
            disabled={used <= 0} onClick={onDecrement}>−</button>
          <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
            disabled={used >= total} onClick={onIncrement}>+</button>
        </div>
      )}
    </div>
  );
}

const ARTIFICER_CANTRIPS = [
  'Acid Splash', 'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Frostbite',
  'Guidance', 'Light', 'Mage Hand', 'Magic Stone', 'Mending', 'Message',
  'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Resistance',
  'Shocking Grasp', 'Spare the Dying', 'Thorn Whip', 'Thunderclap',
];

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

const ALLOWED_SKILLS = [
  'Arcana', 'History', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Sleight of Hand',
];

function SkillPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const extraBgSkills = backgroundSkills.filter(s => !ALLOWED_SKILLS.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !ALLOWED_SKILLS.includes(s) && !backgroundSkills.includes(s));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ALLOWED_SKILLS.map(skill => {
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

export default function ArtificerSheet({
  data = {}, onChange, readOnly = false, level = 1,
  creation = false, backgroundSkills = [], raceSkills = [], raceGrantedCantrips = [],
  section = 'all', abilityScores = {}, campaignId, isGm = false,
  acExtra = null, maxHpNode = null,
}) {
  if (section === 'spells' && creation) return null;

  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat  = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';

  const addSpell    = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });

  const slots    = ARTIFICER_SLOTS[Math.min(Math.max(level, 1), 20)];
  const spellSlots = data.spell_slots ?? {};
  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const infusions = infusionsForLevel(level);
  const infusedCount = data.infusions_infused ?? 0;
  const intMod    = mod(abilityScores.intelligence ?? 10);
  const flashMax  = Math.max(1, intMod);
  const flashUsed = data.flash_of_genius_used ?? 0;

  // Spells prepared = ceil(level/2) + INT mod, minimum 1
  const prepLimit = Math.max(1, Math.ceil(level / 2) + intMod);

  const locked = data.prepared_locked ?? false;
  const playerLocked = locked && !isGm;
  const [spellSubTab, setSpellSubTab] = useState('prepared');
  const maxSpellLevel = maxCastableLevel(slots);

  return (
    <div className="space-y-4">
      {/* ── Combat stats ── */}
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

      {showCombat && (
        <HitDiceTracker hitDie={8} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}

      {showCombat && (
        <Field label="Armor Class">
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
      )}

      {showCombat && acExtra}

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

      {/* ── Infuse Item tracker ── */}
      {!creation && (section === 'all' || section === 'spells' || section === 'features') && level >= 2 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Infuse Item</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border text-center p-2">
              <div className="text-xs text-muted-foreground">Infusions Known</div>
              <div className="font-bold text-sm">{infusions.known}</div>
            </div>
            <div className="rounded-md border text-center p-2">
              <div className="text-xs text-muted-foreground">Active Infusions</div>
              <div className="font-bold text-sm">{infusedCount}/{infusions.max}</div>
              {!readOnly && (
                <div className="flex justify-center gap-0.5 mt-1">
                  <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                    disabled={infusedCount <= 0} onClick={() => set('infusions_infused', infusedCount - 1)}>−</button>
                  <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                    disabled={infusedCount >= infusions.max} onClick={() => set('infusions_infused', infusedCount + 1)}>+</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Flash of Genius uses ── */}
      {!creation && (section === 'all' || section === 'features') && level >= 7 && (
        <div className="grid grid-cols-1 gap-3">
          <CounterRow
            label={`Flash of Genius (Long Rest)`}
            used={flashUsed} total={flashMax}
            onDecrement={() => set('flash_of_genius_used', flashUsed - 1)}
            onIncrement={() => set('flash_of_genius_used', flashUsed + 1)}
            readOnly={readOnly}
          />
        </div>
      )}

      {/* Creation: show slot count info */}
      {creation && (section === 'all' || section === 'features') && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots / All slots recover on a Long Rest</div>
        </div>
      )}
      {creation && (
        <SpellPickerCreation
          label="Cantrips Known (choose 2)"
          limit={2}
          options={ARTIFICER_CANTRIPS}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
          raceGrantedSpells={raceGrantedCantrips}
        />
      )}

      {/* ── Spell sub-tabs ── */}
      {!creation && (section === 'all' || section === 'spells') && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b">
            {[['prepared', 'Prepared'], ['prepare', 'Prepare Spells']].map(([tab, label]) => (
              <button key={tab} type="button" onClick={() => setSpellSubTab(tab)}
                className={cn('px-3 py-1.5 text-sm font-medium -mb-px border-b-2 transition-colors',
                  spellSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}>
                {label}
              </button>
            ))}
          </div>

          {spellSubTab === 'prepared' && (
            <div className="space-y-4">
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
              <SpellList
                spells={data.cantrips ?? []}
                readOnly={true}
                label="Cantrips"
                isCantrips
              />
              <SpellList
                spells={data.prepared_spells ?? []}
                readOnly={true}
                label={`Prepared Spells — ${(data.prepared_spells ?? []).length}/${prepLimit} · Long Rest`}
                placeholder=""
              />
              {level >= 11 && (
                <div className="rounded-md border px-3 py-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Spell-Storing Item</Label>
                  <div className="text-xs text-muted-foreground">
                    You can store a 1st- or 2nd-level artificer spell in one weapon or spellcasting focus. A holder can use an action to cast it — up to {Math.max(2, intMod * 2)} times.
                  </div>
                  <SpellList
                    spells={data.spell_storing ?? []}
                    onAdd={n => addSpell('spell_storing', n)}
                    onRemove={n => removeSpell('spell_storing', n)}
                    readOnly={readOnly}
                    label="Stored Spell"
                    placeholder="Stored spell…"
                  />
                </div>
              )}
            </div>
          )}

          {spellSubTab === 'prepare' && (
            <ClassSpellBrowser
              className="Artificer"
              campaignId={campaignId}
              preparedSpells={data.prepared_spells ?? []}
              prepareLimit={prepLimit}
              onAdd={n => addSpell('prepared_spells', n)}
              onRemove={n => removeSpell('prepared_spells', n)}
              locked={locked}
              isGm={isGm}
              maxSpellLevel={maxSpellLevel}
              onLock={() => set('prepared_locked', true)}
              onUnlock={() => set('prepared_locked', false)}
            />
          )}
        </div>
      )}

      {/* ── Subclass ── */}
      {showFeatures && level >= 3 && (
        <Field label="Artificer Specialist (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Artificer" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={ARTIFICER_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Artificer"
              edition="5e"
            />
          )}
        </Field>
      )}

      {/* ── Class features ── */}
      {showFeatures && (
        creation ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
            {(CLASS_FEATURES_5E.Artificer[1] ?? []).map(feat => (
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
              (CLASS_FEATURES_5E.Artificer[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {/* Attunement info */}
      {!creation && (section === 'all' || section === 'features') && level >= 10 && (
        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Magic Item Attunement</span>
          {' '}— you can attune to up to <span className="font-semibold">{attunementForLevel(level)}</span> magic items simultaneously.
        </div>
      )}

      {/* ── Skill picker (creation only) ── */}
      {creation && showFeatures && (
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
              backgroundSkills={backgroundSkills}
              raceSkills={raceSkills}
            />
          )}
        </Field>
      )}
    </div>
  );
}
