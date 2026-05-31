/**
 * Wizard (5e) — class-specific character_data section.
 * Full caster: spell slots levels 1–9, spellbook, prepared list.
 */
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import SpellList from './SpellList';
import { CLASS_FEATURES_5E } from './classFeatures5e';
import OptionCardPicker from './OptionCardPicker';
import SubclassPickerWithDetail from './SubclassPickerWithDetail';
import SubclassDetails from './SubclassDetails';
import { WIZARD_SUBCLASSES_5E } from './classChoicesData';
import HitDiceTracker from './HitDiceTracker';
import PortentTracker from './PortentTracker';
import { maxCastableLevel } from './ClassSpellBrowser';
import { cn } from '@/lib/utils';
import { Lock, Unlock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const WIZARD_CANTRIPS_5E = [
  'Acid Splash', 'Blade Ward', 'Booming Blade', 'Chill Touch', 'Control Flames',
  'Create Bonfire', 'Dancing Lights', 'Fire Bolt', 'Friends', 'Frostbite',
  'Green-Flame Blade', 'Gust', 'Infestation', 'Light', 'Lightning Lure',
  'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Mold Earth',
  'Poison Spray', 'Prestidigitation', 'Ray of Frost', 'Shape Water',
  'Shocking Grasp', 'Sapping Sting', 'Thunderclap', 'Toll the Dead', 'True Strike',
];

const WIZARD_L1_SPELLS_5E = [
  'Absorb Elements', 'Alarm', 'Burning Hands', 'Catapult', 'Cause Fear',
  'Charm Person', 'Chromatic Orb', 'Color Spray', 'Comprehend Languages',
  'Detect Magic', 'Disguise Self', 'Earth Tremor', 'Expeditious Retreat',
  'False Life', 'Feather Fall', 'Find Familiar', 'Fog Cloud', 'Grease',
  'Ice Knife', 'Identify', 'Illusory Script', 'Jump', 'Longstrider',
  'Mage Armor', 'Magic Missile', 'Protection from Evil and Good',
  'Ray of Sickness', 'Shield', 'Silent Image', 'Sleep', 'Snare',
  "Tasha's Caustic Brew", 'Thunderwave', 'Unseen Servant', 'Witch Bolt',
];

// Wizard full caster slot table
const WIZARD_SLOTS = {
  1:  [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

function slotsForLevel(level) {
  return WIZARD_SLOTS[Math.min(Math.max(level, 1), 20)];
}

function arcaneRecoveryLevels(level) {
  return Math.ceil(level / 2);
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

export default function WizardSheet({ data = {}, onChange, readOnly = false, level = 1, creation = false, backgroundSkills = [], raceSkills = [], raceGrantedCantrips = [], section = 'all', abilityScores = {}, campaignId, isGm = false, acExtra = null, maxHpNode = null }) {
  const set = (key, value) => onChange?.({ [key]: value });
  const showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells');
  const showFeatures = section === 'all' || section === 'features';
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter(s => s !== name) });

  const [spellSubTab, setSpellSubTab] = useState('prepared');
  const [showArcaneConfirm, setShowArcaneConfirm] = useState(false);

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

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
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

  // Arcane Recovery can only restore expended slots of 5th level or lower.
  const recoverableExpended = slots.some((total, i) => i < 5 && total > 0 && (spellSlots[i + 1]?.used ?? 0) > 0);

  const handleArcaneRecovery = () => {
    if (data.arcane_recovery_used) { set('arcane_recovery_used', false); return; }
    let budget = arcaneRecoveryLevels(level);
    const newSlots = { ...spellSlots };
    // Recover the highest-value expended slots first (levels 1–5 only).
    for (let sl = 5; sl >= 1 && budget > 0; sl--) {
      const total = slots[sl - 1];
      if (!total) continue;
      let used = spellSlots[sl]?.used ?? 0;
      while (used > 0 && budget >= sl) { used -= 1; budget -= sl; }
      if (used !== (spellSlots[sl]?.used ?? 0)) newSlots[sl] = { total, used };
    }
    onChange?.({ spell_slots: newSlots, arcane_recovery_used: true });
  };


  return (
    <div className="space-y-4">
      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Max HP</Label>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{maxHpNode ?? (data.hp_max ?? '—')}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Current HP</Label>
          <Input type="number" value={data.current_hp ?? ''} onChange={e => set('current_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Temp HP</Label>
          <Input type="number" value={data.temp_hp ?? 0} onChange={e => set('temp_hp', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
      </div>
      )}

      {/* Hit Dice */}
      {showCombat && (
        <HitDiceTracker hitDie={6} level={level} used={data.hit_dice_used} onChange={v => set('hit_dice_used', v)} readOnly={readOnly} creation={creation} />
      )}

      {/* AC */}
      {showCombat && (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Armor Class</Label>
        <Input type="number" value={data.armor_class ?? ''} onChange={e => set('armor_class', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
      </div>
      )}

      {showCombat && acExtra}

      {showCombat && (
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Speed (ft)</Label>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{data.speed ?? 30}</div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Speed Bonus (ft)</Label>
          <Input type="number" value={data.speed_bonus ?? 0} onChange={e => set('speed_bonus', parseInt(e.target.value) || 0)} readOnly={readOnly} className="text-center" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Total Speed (ft)</Label>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-center font-medium">{(data.speed ?? 30) + (data.speed_bonus ?? 0)}</div>
        </div>
      </div>
      )}

      {showFeatures && level >= 2 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Arcane Tradition (Subclass)</Label>
          {(readOnly || (!creation && !!data.subclass)) ? (
            data.subclass ? (
              <SubclassDetails className="Wizard" edition="5e" subclassName={data.subclass} level={level} />
            ) : (
              <div className="text-sm py-2">—</div>
            )
          ) : (
            <SubclassPickerWithDetail
              options={WIZARD_SUBCLASSES_5E}
              value={data.subclass ?? ''}
              onChange={v => set('subclass', v)}
              className="Wizard"
              edition="5e"
            />
          )}
        </div>
      )}

      {/* Portent — Divination subclass only (renders null otherwise) */}
      {showFeatures && (
        <PortentTracker subclass={data.subclass} level={level} data={data} onChange={onChange} readOnly={readOnly} />
      )}

      {creation && (
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
        </div>
      )}
      {creation && (
        <SpellPickerCreation
          label="Cantrips Known (choose 3)"
          limit={3}
          options={WIZARD_CANTRIPS_5E}
          selected={data.cantrips ?? []}
          onChange={v => set('cantrips', v)}
          raceGrantedSpells={raceGrantedCantrips}
        />
      )}
      {creation && (
        <SpellPickerCreation
          label="Starting Spellbook (choose 6 × 1st-level spells)"
          limit={6}
          options={WIZARD_L1_SPELLS_5E}
          selected={data.spellbook ?? []}
          onChange={v => set('spellbook', v)}
        />
      )}

      {!creation && (section === 'all' || section === 'spells') && (
        <div className="space-y-4">
          <div className="flex gap-1 border-b">
            {[['prepared', 'Prepared'], ['prepare', 'Prepare Spells']].map(([tab, label]) => (
              <button key={tab} type="button" onClick={() => setSpellSubTab(tab)}
                className={cn('px-3 py-1.5 text-sm font-medium -mb-px border-b-2 transition-colors',
                  spellSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                )}>
                {label}
              </button>
            ))}
          </div>

          {spellSubTab === 'prepared' && (
            <div className="space-y-4">
              {/* Arcane Recovery */}
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Arcane Recovery (Short Rest)</div>
                  <div className="text-xs text-muted-foreground">Recover up to {arcaneRecoveryLevels(level)} total spell slot levels</div>
                </div>
                {!readOnly && (() => {
                  const canUse = !data.arcane_recovery_used && recoverableExpended;
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
                      data-testid="arcane-recovery-button"
                      onClick={() => isUsed ? handleArcaneRecovery() : setShowArcaneConfirm(true)}
                    >
                      {isUsed ? 'Used' : 'Use (Short Rest)'}
                    </button>
                  );
                })()}
              </div>
              <Dialog open={showArcaneConfirm} onOpenChange={open => !open && setShowArcaneConfirm(false)}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Use Arcane Recovery?</DialogTitle>
                    <DialogDescription>
                      This can only be used once per short rest.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="arcane-recovery-cancel-button"
                      onClick={() => setShowArcaneConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      data-testid="arcane-recovery-confirm-button"
                      onClick={() => { handleArcaneRecovery(); setShowArcaneConfirm(false); }}
                    >
                      Use Recovery
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Spell slots */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Spell Slots (Long Rest)</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {slots.map((total, i) => {
                    if (total === 0) return null;
                    const slotLevel = i + 1;
                    const used = spellSlots[slotLevel]?.used ?? 0;
                    return (
                      <div key={slotLevel} className="rounded-md border text-center p-2">
                        <div className="text-xs text-muted-foreground">Level {slotLevel}</div>
                        <div className="font-bold text-sm">{total - used}/{total}</div>
                        {!readOnly && (
                          <div className="flex justify-center gap-0.5 mt-1">
                            <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                              disabled={used <= 0} onClick={() => setSlotUsed(slotLevel, used - 1)}>−</button>
                            {isGm && (
                              <button className="h-5 w-5 text-xs rounded border hover:bg-muted disabled:opacity-40"
                                disabled={used >= total} onClick={() => setSlotUsed(slotLevel, used + 1)}>+</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Cantrips */}
              <SpellList spells={data.cantrips ?? []} onAdd={n => addSpell('cantrips', n)} onRemove={n => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" placeholder="Add cantrip…" isCantrips={true} />
              {/* Prepared spells — cast buttons when not readOnly */}
              <SpellList
                spells={prepared}
                readOnly={true}
                label={`Prepared Spells — ${prepared.length}/${prepareLimit} · Long Rest`}
                placeholder=""
                onCastSpell={!readOnly ? handleCastSpell : undefined}
                availableSlots={!readOnly ? availableSlots : undefined}
              />
            </div>
          )}

          {spellSubTab === 'prepare' && (
            <div className="space-y-4">
              {/* Lock/unlock UI */}
              {playerLocked ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm text-amber-800 dark:text-amber-300">
                    Spells prepared for today. Ask your GM for a long rest to re-prepare.
                  </span>
                </div>
              ) : !isGm ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2.5 bg-muted/30">
                  <div>
                    <div className="text-sm font-medium">Commit today's preparation?</div>
                    <div className="text-xs text-muted-foreground">{prepared.length}/{prepareLimit} spells selected · Locks until long rest</div>
                  </div>
                  <Button size="sm" onClick={() => set('prepared_locked', true)} className="gap-1 shrink-0 ml-3">
                    <Lock className="h-3 w-3" />
                    Prepare for Today
                  </Button>
                </div>
              ) : null}
              {isGm && (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/20">
                  <div className="text-sm flex items-center gap-1.5">
                    {locked
                      ? <><Lock className="h-3.5 w-3.5 text-amber-500" /><span>Player's preparation is locked</span></>
                      : <span className="text-muted-foreground">Player can freely change prepared spells</span>
                    }
                  </div>
                  {locked && (
                    <Button size="sm" variant="outline" onClick={() => set('prepared_locked', false)} className="gap-1">
                      <Unlock className="h-3 w-3" />
                      Unlock (Long Rest)
                    </Button>
                  )}
                </div>
              )}

              {/* Prepared counter + instructions */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Prepared Spells</Label>
                  <span className="text-xs text-muted-foreground">{prepared.length}/{prepareLimit} · Long Rest</span>
                </div>
                {!playerLocked && <p className="text-xs text-muted-foreground">Click spells from your spellbook to prepare or unprepare them.</p>}
              </div>

              {/* Spellbook toggle chips */}
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
                          : (playerLocked || atLimit)
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

              {/* Spellbook management (learning spells is never locked) */}
              <SpellList spells={spellbook} onAdd={n => addSpell('spellbook', n)} onRemove={n => removeSpell('spellbook', n)} readOnly={readOnly} label="Spellbook (all known spells)" placeholder="Add spell to spellbook…" />

              {/* Non-spellbook prepared spells */}
              {prepared.filter(s => !spellbook.includes(s)).length > 0 && (
                <SpellList spells={prepared.filter(s => !spellbook.includes(s))} onRemove={!playerLocked ? n => removeSpell('prepared_spells', n) : undefined} readOnly={readOnly || playerLocked} label="Other Prepared Spells" placeholder="" />
              )}

              {/* Encyclopedia link */}
              <div className="pt-2 border-t">
                <Link to={`/campaigns/${campaignId}/encyclopedia`}
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  Browse all spells in the Encyclopedia
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {showFeatures && (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Skill Proficiencies{creation ? ' (choose 2)' : ''}</Label>
        {(creation && !readOnly) ? (
          <SkillPicker
            value={data.skill_proficiencies ?? []}
            onChange={v => set('skill_proficiencies', v)}
            max={2}
            allowed={['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion']}
            backgroundSkills={backgroundSkills}
            raceSkills={raceSkills}
          />
        ) : (
          <div className="flex flex-wrap gap-1">
            {(data.skill_proficiencies ?? []).map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
        )}
      </div>
      )}

      {showFeatures && (
      creation ? (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Level 1 Features</Label>
          {(CLASS_FEATURES_5E.Wizard[1] ?? []).map(feat => (
            <div key={feat.name} className="rounded-md border bg-muted/20 p-3 space-y-1.5">
              <div className="font-semibold text-sm">{feat.name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{feat.description}</div>
              {feat.name === 'Arcane Recovery' && (
                <div className="mt-1 text-xs font-medium text-foreground bg-background rounded px-2 py-1 border">
                  Recover up to <span className="font-bold">{arcaneRecoveryLevels(level)} spell slot level{arcaneRecoveryLevels(level) > 1 ? 's' : ''}</span> on a short rest
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class Features</Label>
          {Array.from({ length: level }, (_, i) => i + 1).flatMap(lvl =>
            (CLASS_FEATURES_5E.Wizard[lvl] ?? []).map(feat => ({ ...feat, lvl }))
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

      {showFeatures && [4, 8, 12, 16, 19].some(l => l <= level) && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Ability Score Improvements / Feats</span>
          {' '}— at levels 4, 8, 12, 16, 19.
        </div>
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
