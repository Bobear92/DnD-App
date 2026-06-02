/**
 * SkillProficiencyPicker — shared creation-time class skill picker.
 *
 * Lifted verbatim from the per-class sheets (Fighter/Wizard …). Background-granted skills
 * render amber + non-clickable, race-granted skills emerald + non-clickable, and skills
 * outside the class list that come from background/race appear as extra disabled chips.
 */
import React from 'react';
import { SKILLS_BY_NAME } from '../../../encyclopedia/data/skillsData';

const skillTip = (skill) => SKILLS_BY_NAME[skill]?.flavor || undefined;

export default function SkillProficiencyPicker({
  value = [],
  onChange,
  max,
  allowed = [],
  backgroundSkills = [],
  raceSkills = [],
}) {
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const extraBgSkills = backgroundSkills.filter((s) => !allowed.includes(s));
  const extraRaceSkills = raceSkills.filter((s) => !allowed.includes(s) && !backgroundSkills.includes(s));
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter((s) => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {allowed.map((skill) => {
          const fromBg = isFromBg(skill);
          const fromRace = isFromRace(skill);
          const isSelected = value.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              title={skillTip(skill)}
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
        {extraBgSkills.map((skill) => (
          <button key={skill} type="button" disabled title={skillTip(skill)}
            className="text-xs px-2 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-600 cursor-not-allowed">
            {skill}
          </button>
        ))}
        {extraRaceSkills.map((skill) => (
          <button key={skill} type="button" disabled title={skillTip(skill)}
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
