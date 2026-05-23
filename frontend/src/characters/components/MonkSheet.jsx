/**
 * Monk (5e) — class-specific character_data section.
 * d8 hit die, Ki Points (= level), Martial Arts die, Unarmored Defense (WIS to AC).
 */
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import { MONK_SUBCLASSES_5E } from './classChoicesData';

function martialArtsDie(level) {
  if (level >= 17) return 'd10';
  if (level >= 11) return 'd8';
  if (level >= 5)  return 'd6';
  return 'd4';
}

function unarmoredMovement(level) {
  if (level >= 18) return '+30 ft';
  if (level >= 14) return '+25 ft';
  if (level >= 10) return '+20 ft';
  if (level >= 6)  return '+15 ft';
  if (level >= 2)  return '+10 ft';
  return '+0 ft';
}

const ASI_LEVELS = [4, 8, 12, 16, 19];

function FeatureRow({ name, earned }) {
  return (
    <div className={`px-3 py-2 flex justify-between items-center ${earned ? '' : 'opacity-40'}`}>
      <span>{name}</span>
      {earned && <Badge variant="outline" className="text-xs">Unlocked</Badge>}
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

export default function MonkSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, scores = {}, backgroundSkills = [] }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const kiTotal = level;
  const kiUsed = data.ki_used ?? 0;

  const dexMod = Math.floor(((scores.dexterity ?? 10) - 10) / 2);
  const wisMod = Math.floor(((scores.wisdom ?? 10) - 10) / 2);
  const unarmoredAC = 10 + dexMod + wisMod;
  const dexStr = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  const wisStr = wisMod >= 0 ? `+${wisMod}` : `${wisMod}`;

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Combat info */}
      <div className={`grid gap-3 ${level >= 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Hit Die</div>
          <div className="font-bold text-lg">d8</div>
        </div>
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Martial Arts</div>
          <div className="font-bold text-lg">{martialArtsDie(level)}</div>
        </div>
        {level >= 2 && (
          <div className="rounded-md border px-3 py-2 text-center">
            <div className="text-xs text-muted-foreground">Unarmored Mvmt</div>
            <div className="font-bold text-lg">{unarmoredMovement(level)}</div>
          </div>
        )}
      </div>

      {/* HP */}
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

      {/* AC / Speed / Hit Dice */}
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

      {/* Ki points */}
      {level >= 2 && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Ki Points (Short Rest)</div>
            <div className="text-xs text-muted-foreground">{kiTotal - kiUsed} / {kiTotal} remaining</div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('ki_used', Math.max(0, kiUsed - 1))}
                disabled={kiUsed <= 0}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('ki_used', Math.min(kiTotal, kiUsed + 1))}
                disabled={kiUsed >= kiTotal}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Unarmored Defense */}
      {!creation && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">Unarmored Defense</div>
          <div>
            While not wearing armor, AC = 10 + DEX mod + WIS mod
            {' '}<span className="font-bold text-foreground">= {unarmoredAC}</span>
            <span className="ml-1 opacity-70">(10, {dexStr} DEX, {wisStr} WIS)</span>
          </div>
        </div>
      )}

      {/* Subclass (level 3) */}
      {level >= 3 && (
        <Field label="Monastic Tradition (Subclass)">
          {readOnly ? (
            <div className="text-sm py-2">{data.subclass || '—'}</div>
          ) : (
            <OptionCardPicker
              options={MONK_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
            />
          )}
        </Field>
      )}

      {/* Class features */}
      {creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Monk[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Unarmored Defense' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Your starting unarmored AC: <span className="font-bold">{unarmoredAC}</span>
                  <span className="font-normal text-muted-foreground ml-1">(10, {dexStr} DEX, {wisStr} WIS)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Class Features</Label>
          <div className="rounded-md border divide-y text-sm">
            <FeatureRow name="Martial Arts + Unarmored Defense" earned={level >= 1} />
            <FeatureRow name="Ki + Unarmored Movement" earned={level >= 2} />
            <FeatureRow name="Monastic Tradition (Subclass) + Deflect Missiles" earned={level >= 3} />
            <FeatureRow name="Slow Fall" earned={level >= 4} />
            <FeatureRow name="Extra Attack + Stunning Strike" earned={level >= 5} />
            <FeatureRow name="Ki-Empowered Strikes" earned={level >= 6} />
            <FeatureRow name="Evasion + Stillness of Mind" earned={level >= 7} />
            <FeatureRow name="Purity of Body" earned={level >= 10} />
            <FeatureRow name="Tongue of the Sun and Moon" earned={level >= 13} />
            <FeatureRow name="Diamond Soul" earned={level >= 14} />
            <FeatureRow name="Timeless Body" earned={level >= 15} />
            <FeatureRow name="Empty Body" earned={level >= 18} />
            <FeatureRow name="Perfect Self" earned={level >= 20} />
          </div>
        </div>
      )}

      {/* ASI reminder */}
      {ASI_LEVELS.some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
      )}

      {/* Skill proficiencies */}
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
            allowed={['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth']}
            backgroundSkills={backgroundSkills}
          />
        )}
      </Field>
    </div>
  );
}
