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
import SpellList from '@/characters/components/spells/SpellList';
import SpellAddPicker from '@/characters/components/spells/SpellAddPicker';
import SpellSlotTracker from '@/characters/components/spells/SpellSlotTracker';
import ClassSpellBrowser, { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import SpellPickerCreation from '@/characters/components/sheets/classSheet/SpellPickerCreation';
import { useSlotCaster } from '@/characters/components/sheets/classSheet/hooks/useSlotCaster';
import {
  ekSpellSlots, ekSpellsInSlot, EK_SLOT_RESTRICTED, EK_SLOT_ANY,
} from '@/characters/components/classData/subclassCasterData';

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
  gmEdit = false,
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

  // Shared spell-slot tracker grid (used by both the prepared and the known layouts).
  // Players get no manual steppers — slots are spent via Cast and restored by GM rest.
  const slotGrid = (
    <SpellSlotTracker
      slots={slotsTable}
      spellSlots={spellSlots}
      onSetSlotUsed={setSlotUsed}
      readOnly={readOnly}
      isGm={isGm}
    />
  );

  // ── Known caster (subclass casters like the Eldritch Knight): no prepare flow ─────
  // A fixed spell list picked at level-up (the LevelUpWizard New Spells step) — the sheet
  // shows the slot tracker + cantrip/known lists with Cast buttons. Players can't edit the
  // lists here (spells change only at level-up); the GM can curate at whim via browse
  // pickers + the free-text fallback. No creation UI: subclass casters unlock after L1.
  if (caster.kind === 'known') {
    if (creation || (section !== 'all' && section !== 'spells')) return null;
    const cantripLimit = caster.cantripsKnownAt ? caster.cantripsKnownAt(level) : null;
    const knownLimit = caster.spellsKnownAt ? caster.spellsKnownAt(level) : null;
    // The lists are set in stone (level-up only) — even the GM's editing tools stay hidden
    // until the header GM Edit toggle is on, so the sheet never reads as "re-choose spells".
    const canEditLists = isGm && gmEdit && !readOnly;
    const maxKnownLevel = maxCastableLevel(slotsTable);

    // School-restricted known caster (5e Eldritch Knight): two categories instead of one list.
    // GM Edit ignores the school restriction on the free-text add (per house rule), but the slot
    // is still recorded so a later level-up swap stays in the right category.
    const known = data.known_spells ?? [];
    const slotMap = ekSpellSlots(data);
    const addKnownInSlot = (name, slot) => {
      if (known.includes(name)) return;
      onChange?.({ known_spells: [...known, name], ek_spell_slots: { ...slotMap, [name]: slot } });
    };
    const removeKnownSpell = (name) => {
      const { [name]: _dropped, ...rest } = slotMap;
      onChange?.({ known_spells: known.filter((s) => s !== name), ek_spell_slots: rest });
    };
    const ekSections = caster.restrictedSchools ? [
      {
        key: 'restricted',
        slot: EK_SLOT_RESTRICTED,
        title: `${caster.restrictedSchools.join(' & ')} Spells`,
        spells: ekSpellsInSlot(known, slotMap, EK_SLOT_RESTRICTED),
        limit: caster.restrictedSlotsAt(level),
        schools: caster.restrictedSchools,
      },
      {
        key: 'any',
        slot: EK_SLOT_ANY,
        title: 'Any School',
        spells: ekSpellsInSlot(known, slotMap, EK_SLOT_ANY),
        limit: caster.anySlotsAt(level),
        schools: null,
      },
    ] : null;

    return (
      <div className="space-y-4" data-testid="known-caster-block">
        {caster.note && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{caster.note}</div>
        )}
        {slotGrid}
        <SpellList
          spells={data.cantrips ?? []}
          onRemove={canEditLists ? (n) => removeSpell('cantrips', n) : undefined}
          readOnly={readOnly}
          label={`Cantrips Known${cantripLimit != null ? ` — ${(data.cantrips ?? []).length}/${cantripLimit}` : ''}`}
          isCantrips={true}
        />
        {canEditLists && caster.spellList && (
          <div className="rounded-md border p-3 space-y-2" data-testid="gm-cantrip-browser">
            <div className="text-xs font-medium text-muted-foreground">GM — edit cantrips from the {caster.spellList} list</div>
            <ClassSpellBrowser
              mode="learn"
              className={caster.spellList}
              campaignId={campaignId}
              preparedSpells={data.cantrips ?? []}
              prepareLimit={cantripLimit}
              onAdd={(n) => addSpell('cantrips', n)}
              onRemove={(n) => removeSpell('cantrips', n)}
              minSpellLevel={0}
              maxSpellLevel={0}
              grantedSpells={raceGrantedCantrips}
              grantedLabel="Granted by their race"
            />
          </div>
        )}
        {/* A school-restricted known caster (5e Eldritch Knight) keeps its spells in two
            categories — Abjuration/Evocation slots, and the "any school" slots earned at
            levels 3/8/14/20. The slot each spell occupies is recorded on character_data
            (ek_spell_slots), so it is shown here rather than guessed from the spell's school:
            a Shield learned in the any-school slot is still an any-school spell. */}
        {ekSections ? ekSections.map(({ key, slot, title, spells, limit, schools }) => (
          <div key={key} className="space-y-2" data-testid={`ek-known-${key}`}>
            <SpellList
              spells={spells}
              onRemove={canEditLists ? removeKnownSpell : undefined}
              readOnly={readOnly}
              label={`${title} — ${spells.length}/${limit}`}
              onCastSpell={!readOnly ? handleCastSpell : undefined}
              availableSlots={!readOnly ? availableSlots : undefined}
            />
            {canEditLists && caster.spellList && maxKnownLevel > 0 && (
              <div className="rounded-md border p-3 space-y-2" data-testid={`gm-spell-browser-${key}`}>
                <div className="text-xs font-medium text-muted-foreground">
                  GM — edit {schools ? schools.join(' & ') : 'any-school'} spells · up to level {maxKnownLevel}
                </div>
                <ClassSpellBrowser
                  mode="learn"
                  className={caster.spellList}
                  campaignId={campaignId}
                  preparedSpells={spells}
                  prepareLimit={limit}
                  onAdd={(n) => addKnownInSlot(n, slot)}
                  onRemove={removeKnownSpell}
                  minSpellLevel={1}
                  maxSpellLevel={maxKnownLevel}
                  schools={schools}
                />
              </div>
            )}
          </div>
        )) : (
          <>
            <SpellList
              spells={data.known_spells ?? []}
              onRemove={canEditLists ? (n) => removeSpell('known_spells', n) : undefined}
              readOnly={readOnly}
              label={`Spells Known${knownLimit != null ? ` — ${(data.known_spells ?? []).length}/${knownLimit}` : ''}`}
              onCastSpell={!readOnly ? handleCastSpell : undefined}
              availableSlots={!readOnly ? availableSlots : undefined}
            />
            {canEditLists && caster.spellList && maxKnownLevel > 0 && (
              <div className="rounded-md border p-3 space-y-2" data-testid="gm-spell-browser">
                <div className="text-xs font-medium text-muted-foreground">GM — edit spells from the {caster.spellList} list · up to level {maxKnownLevel}</div>
                <ClassSpellBrowser
                  mode="learn"
                  className={caster.spellList}
                  campaignId={campaignId}
                  preparedSpells={data.known_spells ?? []}
                  prepareLimit={knownLimit}
                  onAdd={(n) => addSpell('known_spells', n)}
                  onRemove={(n) => removeSpell('known_spells', n)}
                  minSpellLevel={1}
                  maxSpellLevel={maxKnownLevel}
                />
              </div>
            )}
          </>
        )}
        {!canEditLists && !readOnly && (
          <p className="text-xs text-muted-foreground italic" data-testid="known-lists-note">
            {isGm
              ? 'These lists change at level-up. Turn on GM Edit (page header) to adjust them directly.'
              : 'You learn and swap spells when you level up. Your GM can adjust these lists directly.'}
          </p>
        )}
        <div className="pt-2 border-t">
          <Link to={`/campaigns/${campaignId}/encyclopedia`}
            className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
            <ExternalLink className="h-3 w-3" />
            Browse all spells in the Encyclopedia
          </Link>
        </div>
      </div>
    );
  }

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
          {slotGrid}
          <SpellList spells={data.cantrips ?? []} onRemove={(n) => removeSpell('cantrips', n)} readOnly={readOnly} label="Cantrips Known" isCantrips={true} />
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

          <SpellList spells={spellbook} onRemove={(n) => removeSpell('spellbook', n)} readOnly={readOnly} label="Spellbook (all known spells)" />

          {/* Copying a spell into the spellbook goes through the compendium — never free text. */}
          {!readOnly && caster.spellList && (
            <SpellAddPicker
              className={caster.spellList}
              campaignId={campaignId}
              spells={spellbook}
              onAdd={(n) => addSpell('spellbook', n)}
              onRemove={(n) => removeSpell('spellbook', n)}
              minSpellLevel={1}
              maxSpellLevel={maxCastableLevel(slotsTable)}
              label="Add a spell to the spellbook"
              testId="spellbook-add"
            />
          )}

          {prepared.filter((s) => !spellbook.includes(s)).length > 0 && (
            <SpellList spells={prepared.filter((s) => !spellbook.includes(s))} onRemove={!playerLocked ? (n) => removeSpell('prepared_spells', n) : undefined} readOnly={readOnly || playerLocked} label="Other Prepared Spells" />
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
