import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X, Lock, Unlock, ExternalLink } from 'lucide-react';
import SpellList from '../SpellList';
import OptionCardPicker from '../OptionCardPicker';
import SubclassPickerWithDetail from '../SubclassPickerWithDetail';
import SubclassDetails from '../SubclassDetails';
import { WIZARD_SUBCLASSES_2024 as SUBCLASSES } from '../classChoicesData';
import HitDiceTracker from '../HitDiceTracker';
import { CLASS_FEATURES_2024 } from '../classFeatures2024';
import { maxCastableLevel } from '../ClassSpellBrowser';
import { cn } from '@/lib/utils';

const WIZARD_CANTRIPS_2024 = [
  'Acid Splash', 'Blade Ward', 'Chill Touch', 'Dancing Lights', 'Elementalism',
  'Fire Bolt', 'Friends', 'Light', 'Mage Hand', 'Mending', 'Message',
  'Minor Illusion', 'Poison Spray', 'Prestidigitation', 'Ray of Frost',
  'Shocking Grasp', 'Thunderclap', 'Toll the Dead', 'True Strike',
];

const WIZARD_L1_SPELLS_2024 = [
  'Absorb Elements', 'Alarm', 'Burning Hands', 'Charm Person', 'Chromatic Orb',
  'Color Spray', 'Comprehend Languages', 'Detect Magic', 'Disguise Self',
  'Earth Tremor', 'Expeditious Retreat', 'False Life', 'Feather Fall',
  'Find Familiar', 'Fog Cloud', 'Grease', 'Ice Knife', 'Identify',
  'Illusory Script', 'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile',
  'Protection from Evil and Good', 'Ray of Sickness', 'Shield', 'Silent Image',
  'Sleep', 'Thunderwave', 'Unseen Servant', 'Witch Bolt',
];

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
function arcaneRecoveryLevels(level) { return Math.ceil(level / 2); }

function SkillPicker({ value, onChange, max, backgroundSkills = [], raceSkills = [] }) {
  const ALLOWED = ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'];
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

const abMod = score => Math.floor(((score ?? 10) - 10) / 2);

export default function WizardSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], raceGrantedCantrips = [], section = 'all', abilityScores = {}, campaignId, isGm = false }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const [spellSubTab, setSpellSubTab] = useState('prepared');

  const intMod = abMod(abilityScores.intelligence);
  const prepareLimit = Math.max(1, level + intMod);
  const prepared = data.prepared_spells ?? [];
  const spellbook = data.spellbook ?? [];
  const locked = data.prepared_locked ?? false;
  const playerLocked = locked && !isGm;
  const togglePrepared = (spell) => {
    if (playerLocked) return;
    if (prepared.includes(spell)) onChange?.({ prepared_spells: prepared.filter(s => s !== spell) });
    else if (prepared.length < prepareLimit) onChange?.({ prepared_spells: [...prepared, spell] });
  };

  const slots = slotsForLevel(level);
  const spellSlots = data.spell_slots ?? {};
  const maxSpellLevel = maxCastableLevel(slots);

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: Math.max(0, Math.min(total, used)) } } });
  };

  // Slot availability for Cast buttons
  const availableSlots = {};
  slots.forEach((total, i) => {
    const sl = i + 1;
    if (total > 0) availableSlots[sl] = total - (spellSlots[sl]?.used ?? 0);
  });

  const handleCastSpell = (_name, spellLevel) => {
    const used = spellSlots[spellLevel]?.used ?? 0;
    setSlotUsed(spellLevel, used + 1);
  };

  const someSlotExpended = slots.some((total, i) => total > 0 && (spellSlots[i + 1]?.used ?? 0) > 0);

  const Field = ({ label, children }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Max HP">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.hp_max ?? '—'}</div>
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

      {/* AC */}
      {showCombat && (
        <Field label="Armor Class">
          <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </Field>
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

      {/* Memorize Spell (L1) */}
      {showFeatures && (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <div className="text-sm font-medium">Memorize Spell (Long Rest)</div>
          <div className="text-xs text-muted-foreground">Replace one prepared spell with another from your spellbook</div>
        </div>
        {!readOnly && (
          <button
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              data.memorize_spell_used ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}
            onClick={() => set('memorize_spell_used', !data.memorize_spell_used)}>
            {data.memorize_spell_used ? 'Used' : 'Available'}
          </button>
        )}
      </div>
      )}

      {/* Scholar (L2) */}
      {level >= 2 && showFeatures && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Scholar (L2)</span>
          {' '}— 1×/short rest: add d6 + INT modifier to Arcana, History, Nature, or Religion check.
        </div>
      )}

      {/* Subclass (L3 in 2024) */}
      {level >= 3 && showFeatures && (
        <Field label="Arcane Tradition (Subclass)">
          {(readOnly || !!data.subclass) ? (
            data.subclass ? (
              <SubclassDetails className="Wizard" edition="5.5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={SUBCLASSES}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Wizard"
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
      {/* Cantrips — picker during creation only */}
      {creation && (
        <SpellPickerCreation
          label="Cantrips Known (choose 3)"
          limit={3}
          options={WIZARD_CANTRIPS_2024}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
          raceGrantedSpells={raceGrantedCantrips}
        />
      )}

      {/* Spellbook — picker during creation only */}
      {creation && (
        <SpellPickerCreation
          label="Starting Spellbook (choose 6 × 1st-level spells)"
          limit={6}
          options={WIZARD_L1_SPELLS_2024}
          selected={data.spellbook ?? []}
          onChange={v => set('spellbook', v)}
        />
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
              {/* Arcane Recovery tracker */}
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Arcane Recovery (Short Rest)</div>
                  <div className="text-xs text-muted-foreground">Recover up to {arcaneRecoveryLevels(level)} total spell slot levels</div>
                </div>
                {!readOnly && (() => {
                  const canUse = !data.arcane_recovery_used && someSlotExpended;
                  const isUsed = !!data.arcane_recovery_used;
                  return (
                    <button
                      disabled={!isUsed && !canUse}
                      className={`text-xs px-3 py-1 rounded border transition-colors ${
                        isUsed
                          ? 'bg-muted text-muted-foreground'
                          : canUse
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
                      }`}
                      title={!isUsed && !canUse ? 'No expended spell slots to recover' : ''}
                      onClick={() => set('arcane_recovery_used', !data.arcane_recovery_used)}>
                      {isUsed ? 'Used' : 'Use (Short Rest)'}
                    </button>
                  );
                })()}
              </div>
              {/* Spell slots */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Spell Slots (Long Rest)</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {slots.map((total, i) => {
                    if (total === 0) return null;
                    const sl = i + 1;
                    const used = spellSlots[sl]?.used ?? 0;
                    return (
                      <div key={sl} className="rounded-md border text-center p-2">
                        <div className="text-xs text-muted-foreground">Level {sl}</div>
                        <div className="font-bold text-sm">{total - used}/{total}</div>
                        {!readOnly && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                              disabled={used <= 0} onClick={() => setSlotUsed(sl, used - 1)}>−</button>
                            {isGm && (
                              <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                                disabled={used >= total} onClick={() => setSlotUsed(sl, used + 1)}>+</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <SpellList spells={data.cantrips ?? []} onAdd={n => addSpell('cantrips', n)} onRemove={n => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" placeholder="Add cantrip…" isCantrips={true} />
              <SpellList
                spells={prepared}
                readOnly={true}
                label={`Prepared Spells — ${prepared.length}/${prepareLimit} · Long Rest`}
                onCastSpell={!readOnly ? handleCastSpell : undefined}
                availableSlots={!readOnly ? availableSlots : undefined}
              />
            </div>
          )}

          {spellSubTab === 'prepare' && (
            <div className="space-y-3">
              {/* Lock/unlock controls */}
              {playerLocked && (
                <div className="flex items-center gap-2 rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>Preparation locked until long rest.</span>
                </div>
              )}
              {!readOnly && isGm && locked && (
                <button onClick={() => set('prepared_locked', false)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border hover:bg-muted transition-colors">
                  <Unlock className="h-3.5 w-3.5" /> Unlock Preparation (Long Rest)
                </button>
              )}
              {/* Prepare counter + spellbook chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Prepared Spells</Label>
                  <span className="text-xs text-muted-foreground">{prepared.length}/{prepareLimit} · Long Rest</span>
                </div>
                <p className="text-xs text-muted-foreground">Click spells from your spellbook to prepare or unprepare them.</p>
                <div className="flex flex-wrap gap-1.5" data-testid="prepared-spell-chips">
                  {spellbook.length > 0 ? spellbook.map(spell => {
                    const isPrepared = prepared.includes(spell);
                    const atLimit = !isPrepared && prepared.length >= prepareLimit;
                    return (
                      <button key={spell} type="button"
                        disabled={readOnly || playerLocked || atLimit}
                        onClick={() => togglePrepared(spell)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          isPrepared
                            ? 'bg-primary text-primary-foreground border-primary'
                            : (readOnly || playerLocked || atLimit)
                              ? 'opacity-40 cursor-not-allowed bg-background border-border text-muted-foreground'
                              : 'bg-background hover:bg-muted border-border text-muted-foreground'
                        }`}>
                        {spell}
                      </button>
                    );
                  }) : (
                    <span className="text-xs text-muted-foreground italic">Add spells to your spellbook below to prepare them.</span>
                  )}
                </div>
              </div>
              {/* Spellbook management — never locked */}
              <SpellList spells={spellbook} onAdd={n => addSpell('spellbook', n)} onRemove={n => removeSpell('spellbook', n)} readOnly={readOnly} label="Spellbook (all known spells)" placeholder="Add spell to spellbook…" />
              {prepared.filter(s => !spellbook.includes(s)).length > 0 && (
                <SpellList spells={prepared.filter(s => !spellbook.includes(s))} onRemove={n => removeSpell('prepared_spells', n)} readOnly={readOnly || playerLocked} label="Other Prepared Spells" placeholder="" />
              )}
              {/* Lock button for players */}
              {!readOnly && !isGm && !locked && (
                <button onClick={() => set('prepared_locked', true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Lock className="h-3.5 w-3.5" /> Prepare for Today
                </button>
              )}
              <div className="pt-1">
                <Link to={`/campaigns/${campaignId}/encyclopedia`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Browse all spells in the Encyclopedia
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {showFeatures && (creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_2024.Wizard[1] ?? []).map(feat => (
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
            (CLASS_FEATURES_2024.Wizard[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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
