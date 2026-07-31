/**
 * Warlock (5e) — class-specific character_data section.
 * d8, Pact Magic (unique short-rest slots), Eldritch Invocations, Otherworldly Patron (level 1).
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SpellList from '@/characters/components/spells/SpellList';
import SpellAddPicker from '@/characters/components/spells/SpellAddPicker';
import { CLASS_FEATURES_5E } from '@/characters/components/classData/classFeatures5e';
import OptionCardPicker from '@/characters/components/shared/OptionCardPicker';
import SubclassPickerWithDetail from '@/characters/components/subclass/SubclassPickerWithDetail';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';
import { WARLOCK_SUBCLASSES_5E, PACT_BOONS_5E } from '@/characters/components/classData/classChoicesData';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';
import { eldritchInvocationsKnownAtLevel } from '@/characters/components/classData/levelChoicesData';
import WeaponDesignationPanel from '@/characters/components/inventory/WeaponDesignationPanel';
import { hexWeaponUid, HEX_WARRIOR_NOTE, canBeHexWeapon } from '@/characters/components/inventory/weaponBondData';
import Field from '@/characters/components/sheets/Field';

// Pact Magic slot table: [slot_count, slot_level]
const PACT_SLOTS = {
  1:  [1, 1], 2:  [2, 1], 3:  [2, 2], 4:  [2, 2],
  5:  [2, 3], 6:  [2, 3], 7:  [2, 4], 8:  [2, 4],
  9:  [2, 5], 10: [2, 5], 11: [3, 5], 12: [3, 5],
  13: [3, 5], 14: [3, 5], 15: [3, 5], 16: [3, 5],
  17: [4, 5], 18: [4, 5], 19: [4, 5], 20: [4, 5],
};

function pactSlotsForLevel(level) {
  return PACT_SLOTS[Math.min(Math.max(level, 1), 20)];
}

// Shared with the LevelUpWizard's Eldritch Invocations level-choice step (so the in-sheet
// free-text fallback and the wizard agree on the max). 5e: none until L2.
const invocationCount = (level) => eldritchInvocationsKnownAtLevel(level, '5e');

const ASI_LEVELS = [4, 8, 12, 16, 19];

const WARLOCK_CANTRIPS_5E = [
  'Blade Ward', 'Chill Touch', 'Eldritch Blast', 'Friends',
  'Mage Hand', 'Minor Illusion', 'Poison Spray', 'Prestidigitation',
  'Toll the Dead', 'True Strike',
];

const WARLOCK_SPELLS_L1_5E = [
  'Armor of Agathys', 'Arms of Hadar', 'Charm Person', 'Comprehend Languages',
  'Expeditious Retreat', 'Hellish Rebuke', 'Hex', 'Illusory Script',
  'Protection from Evil and Good', 'Unseen Servant', 'Witch Bolt',
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

function SkillPicker({ value, onChange, max, allowed, backgroundSkills = [], raceSkills = [] }) {
  const isFromBg = (s) => backgroundSkills.includes(s);
  const isFromRace = (s) => raceSkills.includes(s) && !isFromBg(s);
  const isGranted = (s) => isFromBg(s) || raceSkills.includes(s);
  const toggle = (skill) => {
    if (isGranted(skill)) return;
    if (value.includes(skill)) onChange(value.filter(s => s !== skill));
    else if (value.length < max) onChange([...value, skill]);
  };
  const extraBgSkills = backgroundSkills.filter(s => !allowed.includes(s));
  const extraRaceSkills = raceSkills.filter(s => !allowed.includes(s) && !backgroundSkills.includes(s));
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {allowed.map(skill => {
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

export default function WarlockSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], raceGrantedCantrips = [], section = 'all', acExtra = null, maxHpNode = null, isGm = false, campaignId }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });
  // Known spells/cantrips are permanent choices — players change them only at level-up
  // (or freely during creation); the GM can edit the lists at whim.
  const canEditSpellLists = creation || (isGm && !readOnly);
  const [newInvocation, setNewInvocation] = useState('');

  const [slotCount, slotLevel] = pactSlotsForLevel(level);
  const slotsUsed = data.pact_slots_used ?? 0;
  // Pact Magic casting: every known spell burns one pact slot (all slots share slotLevel).
  const pactAvailableSlots = {};
  for (let l = 1; l <= slotLevel; l++) pactAvailableSlots[l] = slotCount - slotsUsed;
  const handleCastSpell = () => set('pact_slots_used', Math.min(slotCount, slotsUsed + 1));

  return (
    <div className="space-y-4">
      {showFeatures && (
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-md border px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">Pact Slots</div>
          <div className="font-bold text-lg">{slotCount} × level {slotLevel}</div>
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

      {showFeatures && !creation && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <div className="text-sm font-medium">Pact Magic Slots (Short Rest)</div>
            <div className="text-xs text-muted-foreground">{slotCount - slotsUsed} / {slotCount} level-{slotLevel} slots remaining</div>
          </div>
          {isGm && !readOnly && (
            <div className="flex items-center gap-1">
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('pact_slots_used', Math.min(slotCount, slotsUsed + 1))} disabled={slotsUsed >= slotCount}>−</button>
              <button className="h-6 w-6 rounded border text-xs hover:bg-muted disabled:opacity-40"
                onClick={() => set('pact_slots_used', Math.max(0, slotsUsed - 1))} disabled={slotsUsed <= 0}>+</button>
            </div>
          )}
          {!isGm && !readOnly && (
            <div className="text-xs text-muted-foreground italic max-w-40 text-right" data-testid="pact-tracker-note">
              Spent by casting · recover on a rest from your GM
            </div>
          )}
        </div>
      )}

      {showFeatures && (
      <Field label="Otherworldly Patron (Subclass)">
        {(readOnly || (!creation && !!data.subclass)) ? (
          data.subclass ? (
            <SubclassDetails className="Warlock" edition="5e" subclassName={data.subclass} level={level} />
          ) : (
            <div className="text-sm py-2">—</div>
          )
        ) : (
          <SubclassPickerWithDetail
            options={WARLOCK_SUBCLASSES_5E}
            value={data.subclass ?? ''}
            onChange={v => set('subclass', v)}
            className="Warlock"
            edition="5e"
          />
        )}
      </Field>
      )}

      {showFeatures && !creation && data.subclass === 'The Hexblade' && (
        <div className="space-y-1.5" data-testid="hex-warrior-panel">
          <WeaponDesignationPanel
            title="Hex Warrior Weapon"
            description={HEX_WARRIOR_NOTE}
            inventory={data.inventory || []}
            designatedUids={hexWeaponUid(data) ? [hexWeaponUid(data)] : []}
            capacity={1}
            eligible={canBeHexWeapon}
            ineligibleReason="Has the Two-Handed property — Hex Warrior can't be applied to it."
            readOnly
            badgeLabel="Hex Weapon"
            emptyText="No weapon designated yet."
            testIdPrefix="hex-features"
          />
          <p className="text-xs text-muted-foreground" data-testid="hex-warrior-items-hint">
            Designate or change your Hex Warrior weapon in the Items tab (Weapons → Hex Warrior Weapon).
          </p>
        </div>
      )}

      {showFeatures && level >= 3 && (
        <Field label="Pact Boon">
          {readOnly ? (
            <div className="text-sm py-2">{data.pact_boon || '—'}</div>
          ) : (
            <OptionCardPicker
              options={PACT_BOONS_5E}
              value={data.pact_boon ?? ''}
              onChange={v => set('pact_boon', v)}
            />
          )}
        </Field>
      )}

      {showFeatures && level >= 2 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Eldritch Invocations ({invocationCount(level)} max)</Label>
          <div className="flex flex-wrap gap-1 min-h-8 rounded-md border p-2">
            {(data.eldritch_invocations ?? []).map(inv => (
              <Badge key={inv} variant="secondary" className="gap-1">
                {inv}
                {!readOnly && (
                  <button onClick={() => onChange?.({ eldritch_invocations: (data.eldritch_invocations ?? []).filter(i => i !== inv) })} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {(data.eldritch_invocations ?? []).length === 0 && <span className="text-xs text-muted-foreground">None added</span>}
          </div>
          {!readOnly && (data.eldritch_invocations ?? []).length < invocationCount(level) && (
            <div className="flex gap-2">
              <Input placeholder="Add invocation…" value={newInvocation} onChange={e => setNewInvocation(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = newInvocation.trim();
                    if (!trimmed) return;
                    const list = data.eldritch_invocations ?? [];
                    if (!list.includes(trimmed) && list.length < invocationCount(level)) onChange?.({ eldritch_invocations: [...list, trimmed] });
                    setNewInvocation('');
                  }
                }} className="flex-1 h-8 text-sm" />
              <Button type="button" size="sm" variant="outline" onClick={() => {
                const trimmed = newInvocation.trim();
                if (!trimmed) return;
                const list = data.eldritch_invocations ?? [];
                if (!list.includes(trimmed) && list.length < invocationCount(level)) onChange?.({ eldritch_invocations: [...list, trimmed] });
                setNewInvocation('');
              }}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      )}

      {creation && (
        <SpellPickerCreation label="Cantrips Known (choose 2)" limit={2} options={WARLOCK_CANTRIPS_5E}
          selected={data.cantrips ?? []} onChange={v => set('cantrips', v)} raceGrantedSpells={raceGrantedCantrips} />
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <>
          <SpellList spells={data.cantrips ?? []} onRemove={canEditSpellLists ? (n => removeSpell('cantrips', n)) : undefined} readOnly={readOnly} label="Cantrips Known" isCantrips={true} />
          {canEditSpellLists && (
          <SpellAddPicker
            className="Warlock"
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
      )}
      {creation && (
        <SpellPickerCreation label="Spells Known at Level 1 (choose 2)" limit={2} options={WARLOCK_SPELLS_L1_5E}
          selected={data.known_spells ?? []} onChange={v => set('known_spells', v)} />
      )}
      {!creation && (section === 'all' || section === 'spells') && (
        <>
          <SpellList spells={data.known_spells ?? []} onRemove={canEditSpellLists ? (n => removeSpell('known_spells', n)) : undefined} readOnly={readOnly} label="Spells Known" onCastSpell={!readOnly ? handleCastSpell : undefined} availableSlots={!readOnly ? pactAvailableSlots : undefined} />
          {canEditSpellLists && (
          <SpellAddPicker
            className="Warlock"
            campaignId={campaignId}
            spells={data.known_spells ?? []}
            onAdd={n => addSpell('known_spells', n)}
            onRemove={n => removeSpell('known_spells', n)}
            minSpellLevel={1}
            maxSpellLevel={slotLevel}
            label="Add a spell"
            testId="known-add"
          />
          )}
        </>
      )}

      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Pact Magic — Level 1</Label>
          <div className="text-sm font-medium">1 × Level 1 pact magic slot</div>
          <div className="text-xs text-muted-foreground">Slot recovers on a Short Rest · Warlocks cannot swap spells freely — choose carefully</div>
        </div>
      )}

      {showFeatures && level >= 11 && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Mystic Arcanum</span>
          {' '}— 6th level (L11), 7th (L13), 8th (L15), 9th (L17). One casting each per long rest. Track with your spell list.
        </div>
      )}

      {showFeatures && (
      creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Warlock[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Pact Magic' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Starting slots: <span className="font-bold">{slotCount} × level {slotLevel}</span>
                  <span className="font-normal text-muted-foreground ml-1">— regain on short rest</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Warlock[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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
            allowed={['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion']}
            backgroundSkills={backgroundSkills}
            raceSkills={raceSkills}
          />
        )}
      </Field>
      )}
    </div>
  );
}
