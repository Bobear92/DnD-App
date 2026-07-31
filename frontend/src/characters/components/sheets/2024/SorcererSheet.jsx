import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from '@/characters/components/spells/SpellList';
import SpellAddPicker from '@/characters/components/spells/SpellAddPicker';
import { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import SpellSlotTracker from '@/characters/components/spells/SpellSlotTracker';
import { useSlotCaster } from '@/characters/components/sheets/classSheet/hooks/useSlotCaster';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { SORCERER_SUBCLASSES_2024 as SUBCLASSES } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import { CLASS_FEATURES_2024 } from '@/characters/components/classData/classFeatures2024';
import DraconicAncestorPicker from '@/characters/components/subclass/DraconicAncestorPicker';
import { isDraconicSorcerer } from '@/characters/components/combat/combatBonuses';
import { METAMAGIC_OPTIONS as METAMAGIC_POOL, metamagicKnownAtLevel } from '@/characters/components/classData/levelChoicesData';
import Field from '@/characters/components/sheets/Field';

// Names only — canonical pool (with descriptions) + count live in levelChoicesData,
// shared with the LevelUpWizard's Metamagic step.
const METAMAGIC_OPTIONS = METAMAGIC_POOL.map((o) => o.name);

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
const metamagicCount = metamagicKnownAtLevel;

const SORCERER_CANTRIPS_2024 = [
  'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Elementalism',
  'Fire Bolt', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message', 'Minor Illusion',
  'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shocking Grasp', 'Sorcerous Burst', 'True Strike',
];

const SORCERER_SPELLS_L1_2024 = [
  'Burning Hands', 'Charm Person', 'Chromatic Orb', 'Color Spray',
  'Comprehend Languages', 'Detect Magic', 'Disguise Self', 'Expeditious Retreat',
  'False Life', 'Feather Fall', 'Fog Cloud', 'Grease', 'Jump', 'Mage Armor', 'Magic Missile',
  'Ray of Sickness', 'Shield', 'Silent Image', 'Sleep', 'Thunderwave', 'Witch Bolt',
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

function SkillPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const ALLOWED = ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'];
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

export default function SorcererSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], raceGrantedCantrips = [], section = 'all', acExtra = null, maxHpNode = null, isGm = false, campaignId }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });
  // Known spells/cantrips are permanent choices — players change them only at level-up
  // (or freely during creation); the GM can edit the lists at whim.
  const canEditSpellLists = creation || (isGm && !readOnly);
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';

  const slots = slotsForLevel(level);
  const { spellSlots, availableSlots, setSlotUsed, handleCastSpell } = useSlotCaster({ slots, data, onChange });
  const sorceryPointsTotal = level >= 2 ? level : 0;
  const sorceryUsed = data.sorcery_points_used ?? 0;
  const mmMax = metamagicCount(level);


  return (
    <div className="space-y-4">
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
        <HitDiceTracker hitDie={6} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
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

      {/* Innate Sorcery (L1) */}
      {showFeatures && !creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Innate Sorcery (Long Rest)</div>
            <div className="text-xs text-muted-foreground">1 minute: advantage on spell attack rolls + DC +1</div>
          </div>
          {/* A player may spend (Available→Used); only the GM can reset it (recharges on a long rest). */}
          {!readOnly && (
            data.innate_sorcery_used ? (
              isGm ? (
                <button
                  className="text-xs px-3 py-1 rounded border transition-colors bg-muted text-muted-foreground"
                  onClick={() => set('innate_sorcery_used', false)}>
                  Used
                </button>
              ) : (
                <span className="text-xs px-3 py-1 rounded border bg-muted text-muted-foreground">Used</span>
              )
            ) : (
              <button
                className="text-xs px-3 py-1 rounded border transition-colors bg-primary text-primary-foreground"
                onClick={() => set('innate_sorcery_used', true)}>
                Available
              </button>
            )
          )}
        </div>
      )}

      {/* Subclass (L3 in 2024) */}
      {level >= 3 && showFeatures && (
        <Field label="Sorcerous Origin (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Sorcerer" edition="5.5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={SUBCLASSES}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Sorcerer"
              edition="5.5e"
            />
          )}
        </Field>
      )}

      {showFeatures && isDraconicSorcerer('Sorcerer', data.subclass) && (
        <DraconicAncestorPicker
          value={data.draconic_bloodline ?? null}
          onChange={v => set('draconic_bloodline', v)}
          readOnly={readOnly || (!creation && !!data.draconic_bloodline)}
        />
      )}

      {/* Metamagic picker (L3+) */}
      {mmMax > 0 && showFeatures && (
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
      {creation && (
        <div className="space-y-3">
          <div className="rounded-md border px-3 py-2 space-y-1">
            <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
            <div className="text-sm font-medium">2 × Level 1 spell slots</div>
            <div className="text-xs text-muted-foreground">All slots recover on a Long Rest · Sorcerers learn a fixed set of spells — choose carefully</div>
          </div>
          <SpellPickerCreation
            label="Cantrips Known (choose 4)"
            limit={4}
            options={SORCERER_CANTRIPS_2024}
            selected={data.cantrips ?? []}
            onChange={v => set('cantrips', v)}
            raceGrantedSpells={raceGrantedCantrips}
          />
          <SpellPickerCreation
            label="Spells Known at Level 1 (choose 2)"
            limit={2}
            options={SORCERER_SPELLS_L1_2024}
            selected={data.known_spells ?? []}
            onChange={v => set('known_spells', v)}
          />
        </div>
      )}
      {!creation && sorceryPointsTotal > 0 && (section === 'all' || section === 'spells') && (
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

      {!creation && (section === 'all' || section === 'spells') && (
        <SpellSlotTracker slots={slots} spellSlots={spellSlots} onSetSlotUsed={setSlotUsed} readOnly={readOnly} isGm={isGm} />
      )}

      {!creation && (section === 'all' || section === 'spells') && (
        <>
          <>
            <SpellList spells={data.cantrips ?? []} onRemove={canEditSpellLists ? (n => removeSpell('cantrips', n)) : undefined} readOnly={readOnly} label="Cantrips Known" isCantrips={true} />
            {canEditSpellLists && (
            <SpellAddPicker
              className="Sorcerer"
              campaignId={campaignId}
              spells={data.cantrips ?? []}
              onAdd={n => addSpell('cantrips', n)}
              onRemove={n => removeSpell('cantrips', n)}
              minSpellLevel={0}
              maxSpellLevel={0}
              label="Add a cantrip"
              testId="cantrip-add"
            />
            )}
          </>
          <>
            <SpellList spells={data.known_spells ?? []} onRemove={canEditSpellLists ? (n => removeSpell('known_spells', n)) : undefined} readOnly={readOnly} label="Spells Known" onCastSpell={!readOnly ? handleCastSpell : undefined} availableSlots={!readOnly ? availableSlots : undefined} />
            {canEditSpellLists && (
            <SpellAddPicker
              className="Sorcerer"
              campaignId={campaignId}
              spells={data.known_spells ?? []}
              onAdd={n => addSpell('known_spells', n)}
              onRemove={n => removeSpell('known_spells', n)}
              minSpellLevel={1}
              maxSpellLevel={maxCastableLevel(slots)}
              label="Add a spell"
              testId="known-add"
            />
            )}
          </>
        </>
      )}

      {showFeatures && (creation ? (
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
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_2024.Sorcerer[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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
