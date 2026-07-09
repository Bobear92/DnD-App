import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from '@/characters/components/spells/SpellList';
import SpellSlotTracker from '@/characters/components/spells/SpellSlotTracker';
import { useSlotCaster } from '@/characters/components/sheets/classSheet/hooks/useSlotCaster';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { DRUID_SUBCLASSES_2024 as SUBCLASSES } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import ClassSpellBrowser, { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import { cn } from '@/lib/utils';

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

function wildShapeMaxCR(level) {
  if (level >= 8) return 'CR 1';
  if (level >= 4) return 'CR 1/2';
  return 'CR 1/4';
}

function SkillPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const ALLOWED = ['Animal Handling', 'Arcana', 'Insight', 'Medicine', 'Nature', 'Perception', 'Religion', 'Survival'];
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

const abMod = score => Math.floor(((score ?? 10) - 10) / 2);

export default function DruidSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], section = 'all', abilityScores = {}, campaignId, isGm = false, acExtra = null, maxHpNode = null }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });
  const [spellSubTab, setSpellSubTab] = useState('prepared');

  const wisMod = abMod(abilityScores.wisdom);
  const prepareLimit = Math.max(1, level + wisMod);

  const slots = slotsForLevel(level);
  const { spellSlots, availableSlots, setSlotUsed, handleCastSpell } = useSlotCaster({ slots, data, onChange });
  const wildShapeUsed = data.wild_shape_used ?? 0;
  const maxSpellLevel = maxCastableLevel(slots);


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
          <div className="text-xs text-muted-foreground">Wild Shape Max</div>
          <div className="font-bold text-lg">{level >= 2 ? wildShapeMaxCR(level) : 'L2+'}</div>
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
        <HitDiceTracker hitDie={8} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
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

      {/* Primal Order (L1) */}
      {showFeatures && (
      <Field label="Primal Order (L1)">
        {readOnly ? (
          <div className="text-sm py-2">{data.primal_order || '—'}</div>
        ) : (
          <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={data.primal_order ?? ''} onChange={e => set('primal_order', e.target.value)}>
            <option value="">Select primal order…</option>
            <option value="Magician">Magician — one extra Druid cantrip + Arcana proficiency</option>
            <option value="Warden">Warden — proficiency with Martial weapons + Medium armor</option>
          </select>
        )}
      </Field>
      )}

      {/* Wild Shape tracker (L2+) */}
      {level >= 2 && showFeatures && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Wild Shape (Short Rest)</div>
            <div className="text-xs text-muted-foreground">{2 - wildShapeUsed} / 2 remaining · Max {wildShapeMaxCR(level)}</div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('wild_shape_used', Math.max(0, wildShapeUsed - 1))} disabled={wildShapeUsed <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('wild_shape_used', Math.min(2, wildShapeUsed + 1))} disabled={wildShapeUsed >= 2}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Wild Resurgence (L5) */}
      {level >= 5 && showFeatures && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Wild Resurgence (L5)</span>
          {' '}— 1×/day: expend a Wild Shape use to regain a L1 spell slot, or expend a spell slot to regain a Wild Shape use.
        </div>
      )}

      {/* Subclass (L3 in 2024) */}
      {level >= 3 && showFeatures && (
        <Field label="Druid Circle (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Druid" edition="5.5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={SUBCLASSES}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Druid"
              edition="5.5e"
            />
          )}
        </Field>
      )}

      {/* Spell Slots — static info during creation, tracker during play */}
      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
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
              <SpellSlotTracker slots={slots} spellSlots={spellSlots} onSetSlotUsed={setSlotUsed} readOnly={readOnly} isGm={isGm} />
              <SpellList spells={data.cantrips ?? []} onAdd={n => addSpell('cantrips', n)} onRemove={n => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" placeholder="Add cantrip…" isCantrips={true} />
              <SpellList spells={data.prepared_spells ?? []} readOnly={true} label={`Prepared Spells — ${(data.prepared_spells ?? []).length}/${prepareLimit} · Long Rest`} campaignId={campaignId} onCastSpell={!readOnly ? handleCastSpell : undefined} availableSlots={!readOnly ? availableSlots : undefined} />
            </div>
          )}

          {spellSubTab === 'prepare' && (
            <ClassSpellBrowser
              className="Druid"
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
          {(CLASS_FEATURES_2024.Druid[1] ?? []).map(feat => (
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
            (CLASS_FEATURES_2024.Druid[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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
      <Field label="Skill Proficiencies (choose 2)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillPicker value={data.skill_proficiencies ?? []} onChange={v => set('skill_proficiencies', v)} max={2} backgroundSkills={backgroundSkills} raceSkills={raceSkills} />
        )}
      </Field>
      )}
    </div>
  );
}
