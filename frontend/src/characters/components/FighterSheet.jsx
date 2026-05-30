/**
 * Fighter (5e) — class-specific character_data section.
 * Props:
 *   data: the character_data object (read from character.character_data)
 *   onChange: (patch) => void — called with a partial update to character_data
 *   readOnly: bool
 *   level: int
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { FIGHTER_FIGHTING_STYLES_5E, FIGHTER_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';

function proficiencyBonus(level) {
  return Math.ceil(level / 4) + 1;
}

function actionSurgeTotal(level) {
  return level >= 17 ? 2 : level >= 2 ? 1 : 0;
}

function indomitableTotal(level) {
  if (level >= 17) return 3;
  if (level >= 13) return 2;
  if (level >= 9) return 1;
  return 0;
}

function extraAttacks(level) {
  if (level >= 20) return 4;
  if (level >= 11) return 3;
  if (level >= 5) return 2;
  return 1;
}

function hasFightingStyle(level) { return level >= 1; }
function hasActionSurge(level) { return level >= 2; }
function hasSubclass(level) { return level >= 3; }
function hasIndomitable(level) { return level >= 9; }

// Levels where ASI/Feat is gained
const ASI_LEVELS = [4, 6, 8, 12, 14, 16, 19];
function hasAsi(level) { return ASI_LEVELS.some(l => l <= level); }

export default function FighterSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], section = 'all' }) {
  if (section === 'spells') return null;
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  const ResourceTracker = ({ label, total, used, usedKey }) => (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{total - (used ?? 0)} / {total} remaining</span>
        {!readOnly && (
          <div className="flex gap-1">
            <button
              className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
              onClick={() => set(usedKey, Math.max(0, (used ?? 0) - 1))}
              disabled={(used ?? 0) <= 0}
            >−</button>
            <button
              className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
              onClick={() => set(usedKey, Math.min(total, (used ?? 0) + 1))}
              disabled={(used ?? 0) >= total}
            >+</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info */}
      {showFeatures && level >= 5 && (
      <div className="grid gap-3 text-sm grid-cols-1">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Extra Attacks</div>
          <div className="font-bold text-lg">{extraAttacks(level)}</div>
        </div>
      </div>
      )}

      {/* HP tracking */}
      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Max HP">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.hp_max ?? '—'}</div>
        </Field>
        <Field label="Current HP">
          <Input
            type="number"
            value={data.current_hp ?? ''}
            onChange={e => set('current_hp', parseInt(e.target.value) || 0)}
            readOnly={readOnly}
            className="text-center"
          />
        </Field>
        <Field label="Temp HP">
          <Input
            type="number"
            value={data.temp_hp ?? 0}
            onChange={e => set('temp_hp', parseInt(e.target.value) || 0)}
            readOnly={readOnly}
            className="text-center"
          />
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

      {/* Fighting Style */}
      {showFeatures && hasFightingStyle(level) && (
        <Field label="Fighting Style">
          {readOnly ? (
            <div className="text-sm py-2">{data.fighting_style || '—'}</div>
          ) : (
            <OptionCardPicker
              options={FIGHTER_FIGHTING_STYLES_5E}
              value={data.fighting_style ?? ''}
              onChange={v => set('fighting_style', v)}
            />
          )}
        </Field>
      )}

      {/* Second Wind */}
      {showFeatures && !creation && (
        <ResourceTracker
          label="Second Wind (Short Rest)"
          total={1}
          used={data.second_wind_used ? 1 : 0}
          usedKey="second_wind_used"
        />
      )}

      {/* Action Surge */}
      {showFeatures && hasActionSurge(level) && (
        <ResourceTracker
          label="Action Surge (Short Rest)"
          total={actionSurgeTotal(level)}
          used={data.action_surge_used ?? 0}
          usedKey="action_surge_used"
        />
      )}

      {/* Indomitable */}
      {showFeatures && hasIndomitable(level) && (
        <ResourceTracker
          label="Indomitable (Long Rest)"
          total={indomitableTotal(level)}
          used={data.indomitable_used ?? 0}
          usedKey="indomitable_used"
        />
      )}

      {/* Subclass */}
      {showFeatures && hasSubclass(level) && (
        <Field label="Martial Archetype (Subclass)">
          {(readOnly || !!data.subclass) ? (
            data.subclass ? (
              <SubclassDetails className="Fighter" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={FIGHTER_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Fighter"
              edition="5e"
            />
          )}
        </Field>
      )}

      {/* ASI/Feat reminder */}
      {showFeatures && hasAsi(level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— gained at levels 4, 6, 8, 12, 14, 16, 19. Track feat selections separately.
        </div>
      )}

      {/* Class features — creation: descriptions; normal: feature list */}
      {showFeatures && (creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Fighter[1] ?? []).map(feat => (
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
            (CLASS_FEATURES_5E.Fighter[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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
      <Field label="Skill Proficiencies">
        {readOnly ? (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
            {(data.skill_proficiencies ?? []).length === 0 && <span className="text-sm text-muted-foreground">None set</span>}
          </div>
        ) : (
          <SkillProficiencyPicker
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

function SkillProficiencyPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const ALLOWED = [
    'Acrobatics', 'Animal Handling', 'Athletics', 'History',
    'Insight', 'Intimidation', 'Perception', 'Survival',
  ];
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const extraBgSkills = backgroundSkills.filter(s => !ALLOWED.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !ALLOWED.includes(s) && !backgroundSkills.includes(s));
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) {
      onChange(value.filter(s => s !== skill));
    } else if (value.length < max) {
      onChange([...value, skill]);
    }
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {ALLOWED.map(skill => {
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
