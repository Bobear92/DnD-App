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

const FIGHTING_STYLES_5E = [
  'Archery', 'Defense', 'Dueling', 'Great Weapon Fighting',
  'Protection', 'Two-Weapon Fighting',
];

const FIGHTER_SUBCLASSES_5E = [
  'Champion', 'Battle Master', 'Eldritch Knight',
  'Arcane Archer', 'Cavalier', 'Echo Knight', 'Psi Warrior', 'Rune Knight', 'Samurai',
];

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

export default function FighterSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });

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
      <div className={`grid gap-3 text-sm ${level >= 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Hit Die</div>
          <div className="font-bold text-lg">d10</div>
        </div>
        {level >= 5 && (
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-xs text-muted-foreground">Extra Attacks</div>
            <div className="font-bold text-lg">{extraAttacks(level)}</div>
          </div>
        )}
      </div>

      {/* HP tracking */}
      {!creation && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Current HP">
          <Input
            type="number"
            value={data.current_hp ?? ''}
            onChange={e => set('current_hp', parseInt(e.target.value) || 0)}
            readOnly={readOnly}
            className="text-center"
          />
        </Field>
        <Field label="Max HP">
          <Input
            type="number"
            value={data.max_hp ?? ''}
            onChange={e => set('max_hp', parseInt(e.target.value) || 0)}
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

      {/* AC / Speed / Initiative */}
      {!creation && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Armor Class">
          <Input
            type="number"
            value={data.armor_class ?? ''}
            onChange={e => set('armor_class', parseInt(e.target.value) || 0)}
            readOnly={readOnly}
            className="text-center"
          />
        </Field>
        <Field label="Speed (ft)">
          <Input
            type="number"
            value={data.speed ?? 30}
            onChange={e => set('speed', parseInt(e.target.value) || 30)}
            readOnly={readOnly}
            className="text-center"
          />
        </Field>
        <Field label="Hit Dice Used">
          <Input
            type="number"
            value={data.hit_dice_used ?? 0}
            onChange={e => set('hit_dice_used', parseInt(e.target.value) || 0)}
            readOnly={readOnly}
            className="text-center"
          />
        </Field>
      </div>
      )}

      {/* Fighting Style */}
      {hasFightingStyle(level) && (
        <Field label="Fighting Style">
          {readOnly ? (
            <div className="text-sm py-2">{data.fighting_style || '—'}</div>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.fighting_style ?? ''}
              onChange={e => set('fighting_style', e.target.value)}
            >
              <option value="">Select fighting style…</option>
              {FIGHTING_STYLES_5E.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </Field>
      )}

      {/* Second Wind */}
      {!creation && (
        <ResourceTracker
          label="Second Wind (Short Rest)"
          total={1}
          used={data.second_wind_used ? 1 : 0}
          usedKey="second_wind_used"
        />
      )}

      {/* Action Surge */}
      {hasActionSurge(level) && (
        <ResourceTracker
          label="Action Surge (Short Rest)"
          total={actionSurgeTotal(level)}
          used={data.action_surge_used ?? 0}
          usedKey="action_surge_used"
        />
      )}

      {/* Indomitable */}
      {hasIndomitable(level) && (
        <ResourceTracker
          label="Indomitable (Long Rest)"
          total={indomitableTotal(level)}
          used={data.indomitable_used ?? 0}
          usedKey="indomitable_used"
        />
      )}

      {/* Subclass */}
      {hasSubclass(level) && (
        <Field label="Martial Archetype (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={data.subclass ?? ''}
              onChange={e => set('subclass', e.target.value)}
            >
              <option value="">Select subclass…</option>
              {FIGHTER_SUBCLASSES_5E.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </Field>
      )}

      {/* ASI/Feat reminder */}
      {hasAsi(level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— gained at levels 4, 6, 8, 12, 14, 16, 19. Track feat selections separately.
        </div>
      )}

      {/* Class features — creation: descriptions; normal: feature list */}
      {creation ? (
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
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Class Features</Label>
          <div className="rounded-md border divide-y text-sm">
            <FeatureRow name="Fighting Style + Second Wind" earned={level >= 1} />
            <FeatureRow name="Action Surge (1/rest)" earned={level >= 2} />
            <FeatureRow name="Martial Archetype (Subclass)" earned={level >= 3} />
            <FeatureRow name="Extra Attack (2)" earned={level >= 5} />
            <FeatureRow name="Indomitable (1/rest)" earned={level >= 9} />
            <FeatureRow name="Extra Attack (3)" earned={level >= 11} />
            <FeatureRow name="Action Surge (2/rest)" earned={level >= 17} />
            <FeatureRow name="Extra Attack (4)" earned={level >= 20} />
          </div>
        </div>
      )}

      {/* Skill proficiencies */}
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
          />
        )}
      </Field>
    </div>
  );
}

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
    </div>
  );
}

function SkillProficiencyPicker({ value, onChange, max, backgroundSkills = [] }) {
  const ALLOWED = [
    'Acrobatics', 'Animal Handling', 'Athletics', 'History',
    'Insight', 'Intimidation', 'Perception', 'Survival',
  ];
  const extraBgSkills = backgroundSkills.filter(s => !ALLOWED.includes(s));
  const toggle = (skill) => {
    if (backgroundSkills.includes(skill)) return;
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
      {backgroundSkills.length > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">Amber = already granted by your background</p>
      )}
    </div>
  );
}
