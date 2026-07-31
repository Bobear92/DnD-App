/**
 * Rogue (5e) — class-specific character_data section.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { ROGUE_SUBCLASSES_5E } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import Field from '@/characters/components/sheets/Field';

const ALL_SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival',
];

const ROGUE_ALLOWED = [
  'Acrobatics', 'Athletics', 'Deception', 'Insight', 'Intimidation',
  'Investigation', 'Perception', 'Performance', 'Persuasion', 'Sleight of Hand', 'Stealth',
];

function sneak_attack_dice(level) {
  return Math.ceil(level / 2);
}

const ASI_LEVELS = [4, 8, 10, 12, 16, 19];
function hasAsi(level) { return ASI_LEVELS.some(l => l <= level); }

export default function RogueSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], section = 'all', acExtra = null, maxHpNode = null }) {
  if (section === 'spells') return null;
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';

  return (
    <div className="space-y-4">
      {/* Combat info */}
      {showFeatures && (
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Sneak Attack</div>
          <div className="font-bold text-lg">{sneak_attack_dice(level)}d6</div>
        </div>
      </div>
      )}

      {/* HP tracking */}
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



      {/* Speed */}
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

      {/* Subclass (level 3) */}
      {showFeatures && level >= 3 && (
        <Field label="Roguish Archetype (Subclass)">
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Rogue" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={ROGUE_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Rogue"
              edition="5e"
            />
          )}
        </Field>
      )}

      {/* Class features */}
      {showFeatures && (creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Rogue[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Sneak Attack' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Starting damage: <span className="font-bold">{sneak_attack_dice(1)}d6</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Rogue[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {/* Skill proficiencies — during creation only */}
      {creation && showFeatures && (
      <Field label="Skill Proficiencies (choose 4)">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        ) : (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => {
              const pool = [...new Set([...v, ...backgroundSkills, ...raceSkills])];
              const cleanedExpertise = (data.expertise_skills ?? []).filter(s => pool.includes(s));
              onChange?.({ skill_proficiencies: v, expertise_skills: cleanedExpertise });
            }}
            max={4}
            backgroundSkills={backgroundSkills}
            raceSkills={raceSkills}
          />
        )}
      </Field>
      )}

      {/* Expertise Skills */}
      {showFeatures && (
      <div className="rounded-md border divide-y text-sm">
        <div className="px-3 py-2 flex justify-between items-center">
          <span className="font-medium">Expertise Skills</span>
          <span className="text-xs text-muted-foreground">{level >= 6 ? '4 skills' : '2 skills'}</span>
        </div>
        {readOnly ? (
          <div className="px-3 py-2 flex flex-wrap gap-1">
            {(data.expertise_skills ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            {(data.expertise_skills ?? []).length === 0 && <span className="text-muted-foreground text-xs">None set</span>}
          </div>
        ) : (
          <div className="px-3 py-2">
            <ExpertisePicker
              value={data.expertise_skills ?? []}
              onChange={v => set('expertise_skills', v)}
              max={level >= 6 ? 4 : 2}
              skills={[...new Set([...(data.skill_proficiencies ?? []), ...backgroundSkills])]}
            />
          </div>
        )}
      </div>
      )}

      {/* ASI reminder */}
      {showFeatures && hasAsi(level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 10, 12, 16, 19.
        </div>
      )}
    </div>
  );
}

function SkillPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const extraBgSkills = backgroundSkills.filter(s => !ROGUE_ALLOWED.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !ROGUE_ALLOWED.includes(s) && !backgroundSkills.includes(s));
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ROGUE_ALLOWED.map(skill => {
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

function ExpertisePicker({ value, onChange, max, skills = [] }) {
  const toggle = (skill) => {
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  if (skills.length === 0) {
    return <p className="text-xs text-muted-foreground">No proficient skills to apply expertise to.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map(skill => (
        <button
          key={skill}
          type="button"
          onClick={() => toggle(skill)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            value.includes(skill)
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-background hover:bg-muted border-border text-muted-foreground'
          } ${!value.includes(skill) && value.length >= max ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {skill}
        </button>
      ))}
      <span className="text-xs text-muted-foreground self-center ml-1">{value.length}/{max} expertise</span>
    </div>
  );
}
