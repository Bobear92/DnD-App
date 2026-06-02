/**
 * CasterSpellBlock — universal prepared-caster spell UI (Wizard spike; reusable by any
 * prepared/spellbook caster). Two modes:
 *   - creation: static slot info + curated cantrip/spellbook pickers (SpellPickerCreation)
 *   - play (!creation, spells/all section): Prepared / Prepare Spells sub-tabs, slot tracker,
 *     Cast buttons (useSlotCaster), Arcane Recovery (highest-first within ⌈level/2⌉), and the
 *     spellbook chip prepare/lock flow.
 *
 * Slots are spent via Cast and restored only by GM rest (useSlotCaster never resets them).
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Lock, Unlock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import SpellList from '../SpellList';
import SpellPickerCreation from './SpellPickerCreation';
import { useSlotCaster } from './hooks/useSlotCaster';

const abMod = (score) => Math.floor(((score ?? 10) - 10) / 2);

export default function CasterSpellBlock({
  caster,
  data = {},
  onChange,
  readOnly = false,
  level = 1,
  creation = false,
  section = 'all',
  abilityScores = {},
  campaignId,
  isGm = false,
  raceGrantedCantrips = [],
}) {
  const set = (key, value) => onChange?.({ [key]: value });
  const addSpell = (key, name) => { const l = data[key] ?? []; if (!l.includes(name)) onChange?.({ [key]: [...l, name] }); };
  const removeSpell = (key, name) => onChange?.({ [key]: (data[key] ?? []).filter((s) => s !== name) });

  const [spellSubTab, setSpellSubTab] = useState('prepared');
  const [showArcaneConfirm, setShowArcaneConfirm] = useState(false);

  const slotsTable = caster.slotsForLevel(level);
  const { spellSlots, availableSlots, setSlotUsed, handleCastSpell } = useSlotCaster({ slots: slotsTable, data, onChange });

  const abilityMod = abMod(abilityScores[caster.spellcastingAbility ?? 'intelligence']);
  const prepareLimit = Math.max(1, level + abilityMod);
  const prepared = data.prepared_spells ?? [];
  const spellbook = data.spellbook ?? [];
  const locked = data.prepared_locked ?? false;
  const playerLocked = locked && !isGm;
  const togglePrepared = (spell) => {
    if (playerLocked) return;
    if (prepared.includes(spell)) onChange?.({ prepared_spells: prepared.filter((s) => s !== spell) });
    else if (prepared.length < prepareLimit) onChange?.({ prepared_spells: [...prepared, spell] });
  };

  const recoveryLevels = caster.arcaneRecovery ? Math.ceil(level / 2) : 0;
  const recoverableExpended = slotsTable.some((total, i) => i < 5 && total > 0 && (spellSlots[i + 1]?.used ?? 0) > 0);
  const handleArcaneRecovery = () => {
    if (data.arcane_recovery_used) { set('arcane_recovery_used', false); return; }
    let budget = recoveryLevels;
    const newSlots = { ...spellSlots };
    for (let sl = 5; sl >= 1 && budget > 0; sl--) {
      const total = slotsTable[sl - 1];
      if (!total) continue;
      let used = spellSlots[sl]?.used ?? 0;
      while (used > 0 && budget >= sl) { used -= 1; budget -= sl; }
      if (used !== (spellSlots[sl]?.used ?? 0)) newSlots[sl] = { total, used };
    }
    onChange?.({ spell_slots: newSlots, arcane_recovery_used: true });
  };

  // ── Creation: static info + curated pickers ──────────────────────────────────
  if (creation) {
    return (
      <>
        <div className="rounded-md border px-3 py-2 space-y-1">
          <Label className="text-xs text-muted-foreground">Spell Slots at Level 1</Label>
          <div className="text-sm font-medium">2 × Level 1 spell slots</div>
          <div className="text-xs text-muted-foreground">All slots recover on a Long Rest</div>
        </div>
        {caster.cantrips && (
          <SpellPickerCreation
            label={caster.cantrips.label}
            limit={caster.cantrips.limit}
            options={caster.cantrips.options}
            selected={data.cantrips ?? []}
            onChange={(v) => set('cantrips', v)}
            raceGrantedSpells={raceGrantedCantrips}
          />
        )}
        {caster.spellbook && (
          <SpellPickerCreation
            label={caster.spellbook.label}
            limit={caster.spellbook.limit}
            options={caster.spellbook.options}
            selected={data.spellbook ?? []}
            onChange={(v) => set('spellbook', v)}
          />
        )}
      </>
    );
  }

  // ── Play: only in the spells section ─────────────────────────────────────────
  if (section !== 'all' && section !== 'spells') return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {[['prepared', 'Prepared'], ['prepare', 'Prepare Spells']].map(([tab, lbl]) => (
          <button key={tab} type="button" onClick={() => setSpellSubTab(tab)}
            className={cn('px-3 py-1.5 text-sm font-medium -mb-px border-b-2 transition-colors',
              spellSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {lbl}
          </button>
        ))}
      </div>

      {spellSubTab === 'prepared' && (
        <div className="space-y-4">
          {caster.arcaneRecovery && (
            <>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Arcane Recovery (Short Rest)</div>
                  <div className="text-xs text-muted-foreground">Recover up to {recoveryLevels} total spell slot levels</div>
                </div>
                {!readOnly && (() => {
                  const canUse = !data.arcane_recovery_used && recoverableExpended;
                  const isUsed = !!data.arcane_recovery_used;
                  return (
                    <button
                      disabled={!isUsed && !canUse}
                      className={`text-xs px-3 py-1 rounded border transition-colors ${
                        isUsed ? 'bg-muted text-muted-foreground'
                          : canUse ? 'bg-primary text-primary-foreground'
                            : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'}`}
                      title={!isUsed && !canUse ? 'No expended spell slots to recover' : ''}
                      data-testid="arcane-recovery-button"
                      onClick={() => isUsed ? handleArcaneRecovery() : setShowArcaneConfirm(true)}
                    >
                      {isUsed ? 'Used' : 'Use (Short Rest)'}
                    </button>
                  );
                })()}
              </div>
              <Dialog open={showArcaneConfirm} onOpenChange={(open) => !open && setShowArcaneConfirm(false)}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Use Arcane Recovery?</DialogTitle>
                    <DialogDescription>This can only be used once per short rest.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" data-testid="arcane-recovery-cancel-button" onClick={() => setShowArcaneConfirm(false)}>Cancel</Button>
                    <Button type="button" data-testid="arcane-recovery-confirm-button" onClick={() => { handleArcaneRecovery(); setShowArcaneConfirm(false); }}>Use Recovery</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Spell Slots (Long Rest)</Label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {slotsTable.map((total, i) => {
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
          <SpellList spells={data.cantrips ?? []} onAdd={(n) => addSpell('cantrips', n)} onRemove={(n) => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" placeholder="Add cantrip…" isCantrips={true} />
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
                  : <span className="text-muted-foreground">Player can freely change prepared spells</span>}
              </div>
              {locked && (
                <Button size="sm" variant="outline" onClick={() => set('prepared_locked', false)} className="gap-1">
                  <Unlock className="h-3 w-3" />
                  Unlock (Long Rest)
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Prepared Spells</Label>
              <span className="text-xs text-muted-foreground">{prepared.length}/{prepareLimit} · Long Rest</span>
            </div>
            {!playerLocked && <p className="text-xs text-muted-foreground">Click spells from your spellbook to prepare or unprepare them.</p>}
          </div>

          <div className="flex flex-wrap gap-1.5" data-testid="prepared-spell-chips">
            {spellbook.length > 0 ? spellbook.map((spell) => {
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
                        : 'bg-background hover:bg-muted border-border text-muted-foreground'}`}>
                  {spell}
                </button>
              );
            }) : (
              <span className="text-xs text-muted-foreground italic">Add spells to your spellbook below to prepare them.</span>
            )}
          </div>

          <SpellList spells={spellbook} onAdd={(n) => addSpell('spellbook', n)} onRemove={(n) => removeSpell('spellbook', n)} readOnly={readOnly} label="Spellbook (all known spells)" placeholder="Add spell to spellbook…" />

          {prepared.filter((s) => !spellbook.includes(s)).length > 0 && (
            <SpellList spells={prepared.filter((s) => !spellbook.includes(s))} onRemove={!playerLocked ? (n) => removeSpell('prepared_spells', n) : undefined} readOnly={readOnly || playerLocked} label="Other Prepared Spells" placeholder="" />
          )}

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
  );
}
