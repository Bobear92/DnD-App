/**
 * Barbarian (5e) — class-specific character_data section.
 * d12 hit die, Rage resource, Unarmored Defense (CON to AC), Primal Path subclass.
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { BARBARIAN_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';

// Rage count by level
function rageCount(level) {
  if (level >= 17) return '∞';
  if (level >= 12) return 6;
  if (level >= 8)  return 5;
  if (level >= 6)  return 4;
  if (level >= 3)  return 3;
  return 2;
}

// Rage damage bonus by level
function rageDamage(level) {
  if (level >= 16) return '+4';
  if (level >= 9)  return '+3';
  return '+2';
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

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

export default function BarbarianSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, scores = {}, backgroundSkills = [], section = 'all' }) {
  if (section === 'spells') return null;
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section !== 'stats';
  const rages = rageCount(level);
  const rageDmg = rageDamage(level);
  const usedRages = data.rages_used ?? 0;

  const dexMod = Math.floor(((scores.dexterity ?? 10) - 10) / 2);
  const conMod = Math.floor(((scores.constitution ?? 10) - 10) / 2);
  const unarmoredAC = 10 + dexMod + conMod;
  const dexStr = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  const conStr = conMod >= 0 ? `+${conMod}` : `${conMod}`;

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info — Extra Attack only appears at level 5+ */}
      {showFeatures && (
      <div className={`grid gap-3 ${level >= 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Rage Damage</div>
          <div className="font-bold text-lg">{rageDmg}</div>
        </div>
        {level >= 5 && (
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-xs text-muted-foreground">Extra Attack</div>
            <div className="font-bold text-lg">2</div>
          </div>
        )}
      </div>
      )}

      {/* HP */}
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
        <HitDiceTracker hitDie={12} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
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

      {/* Rage tracker */}
      {showFeatures && !creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Rage (Long Rest)</div>
            <div className="text-xs text-muted-foreground">
              {rages === '∞' ? 'Unlimited rages' : `${typeof rages === 'number' ? rages - usedRages : '∞'} / ${rages} remaining`}
            </div>
          </div>
          {!readOnly && rages !== '∞' && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('rages_used', Math.max(0, usedRages - 1))}
                disabled={usedRages <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('rages_used', Math.min(rages, usedRages + 1))}
                disabled={usedRages >= rages}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Unarmored Defense (non-creation: standalone box) */}
      {showFeatures && !creation && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm space-y-0.5">
          <div className="font-medium">Unarmored Defense</div>
          <div className="text-xs text-muted-foreground">
            While not wearing armor, AC = 10 + DEX mod + CON mod
            {' '}<span className="font-bold text-foreground">= {unarmoredAC}</span>
            <span className="ml-1 opacity-70">(10, {dexStr} DEX, {conStr} CON)</span>
          </div>
        </div>
      )}

      {/* Reckless Attack toggle */}
      {showFeatures && !creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Reckless Attack</div>
            <div className="text-xs text-muted-foreground">Advantage on attack rolls; enemies gain advantage against you</div>
          </div>
          {!readOnly && (
            <button
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                data.reckless_attack ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
              onClick={() => set('reckless_attack', !data.reckless_attack)}
            >
              {data.reckless_attack ? 'Active' : 'Off'}
            </button>
          )}
        </div>
      )}

      {/* Subclass (level 3) */}
      {showFeatures && level >= 3 && (
        <Field label="Primal Path (Subclass)">
          {(readOnly || !!data.subclass) ? (
            data.subclass ? (
              <SubclassDetails className="Barbarian" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={BARBARIAN_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Barbarian"
              edition="5e"
            />
          )}
        </Field>
      )}

      {/* Class features */}
      {showFeatures && (creation ? (
        /* During creation: show only level 1 features with full descriptions */
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Barbarian[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Unarmored Defense' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Your starting unarmored AC: <span className="font-bold">{unarmoredAC}</span>
                  <span className="font-normal text-muted-foreground ml-1">(10, {dexStr} DEX, {conStr} CON)</span>
                </div>
              )}
              {feat.name === 'Rage' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Rages per long rest: <span className="font-bold">{rageCount(level)}</span>
                  {' '}· Damage bonus: <span className="font-bold">{rageDamage(level)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Normal view: only features earned at current level */
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Barbarian[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {/* ASI reminder */}
      {showFeatures && ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {/* Skill proficiencies */}
      {showFeatures && (
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
            allowed={['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival']}
            backgroundSkills={backgroundSkills}
          />
        )}
      </Field>
      )}
    </div>
  );
}
