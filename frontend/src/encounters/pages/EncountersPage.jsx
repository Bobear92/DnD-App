import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Swords, Dices, Plus, Trash2, Play, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import MainLayout from '@/shared/components/layout/MainLayout';
import { useCampaign } from '@/campaigns/CampaignContext';
import characterService from '@/characters/characterService';
import encounterService from '@/encounters/encounterService';
import { initiativeForCharacter, rollInitiative } from '@/characters/components/combat/initiativeData';
import { profBonus } from '@/characters/components/classData/classProgressionTables';

/**
 * The GM's encounter page (V1): pick who's in the fight, roll or type their initiative, read the
 * order — and start combat, which applies the initiative recharges (Ever-Ready Shot and friends)
 * and reports what each character got back.
 *
 * V1 holds player characters only (monsters wait for the Bestiary) and stops at the order — no
 * round counter or turn marker. GM-only, including reads: the API 403s a player either way.
 */

function CombatantRow({ combatant, modifier, advantage, onChangeInitiative, onRemove, position }) {
  const mod = modifier ?? 0;
  return (
    <div
      className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
      data-testid={`combatant-row-${combatant.character_id}`}
    >
      <div className="w-6 text-center text-xs font-bold text-muted-foreground">
        {combatant.initiative == null ? '—' : position}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{combatant.character_name}</div>
        <div className="text-xs text-muted-foreground">
          {combatant.char_class}
          {combatant.level != null && ` · Level ${combatant.level}`}
          {' · '}
          <span data-testid={`combatant-mod-${combatant.character_id}`}>
            Initiative {mod >= 0 ? `+${mod}` : mod}
          </span>
          {advantage && (
            <span className="text-teal-600" data-testid={`combatant-advantage-${combatant.character_id}`}>
              {' '}· Advantage
            </span>
          )}
        </div>
      </div>
      <Input
        type="number"
        className="h-8 w-20 text-center"
        placeholder="—"
        value={combatant.initiative ?? ''}
        onChange={(e) => onChangeInitiative(combatant, e.target.value)}
        data-testid={`init-input-${combatant.id}`}
        aria-label={`Initiative for ${combatant.character_name}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(combatant)}
        data-testid={`remove-combatant-${combatant.id}`}
        aria-label={`Remove ${combatant.character_name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * The choices a character can make at initiative. Only features that cost something the player
 * owns (Monk 2024 Uncanny Metabolism spends a 1/long-rest charge) — everything else fires
 * automatically, so it never appears here.
 */
function OptInRow({ characterId, name, options, chosen, onToggle }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2 space-y-1.5" data-testid={`opt-ins-${characterId}`}>
      <div className="text-sm font-semibold">{name}</div>
      {options.map((option) => {
        const picked = chosen.includes(option.feature);
        return (
          <div key={option.feature} className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={picked}
              disabled={!option.available}
              onChange={() => onToggle(characterId, option.feature)}
              data-testid={`opt-in-${characterId}-${option.feature}`}
              id={`opt-in-${characterId}-${option.feature}`}
            />
            <label
              htmlFor={`opt-in-${characterId}-${option.feature}`}
              className={cn('text-xs leading-snug', !option.available && 'text-muted-foreground')}
            >
              <span className="font-medium text-foreground">{option.feature}</span>
              {' — '}
              {option.description}
              {!option.available && (
                <span className="text-destructive" data-testid={`opt-in-spent-${characterId}`}>
                  {' '}Already used; returns on a long rest.
                </span>
              )}
            </label>
          </div>
        );
      })}
    </div>
  );
}

export default function EncountersPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';
  const edition = campaign?.edition === '5.5e' ? '5.5e' : '5e';

  const [encounters, setEncounters] = useState([]);
  const [active, setActive] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCharacterIds, setNewCharacterIds] = useState([]);

  // What the last Start Combat handed back, per character.
  const [startSummary, setStartSummary] = useState(null);
  // Features a character must CHOOSE to use at initiative (Monk 2024 Uncanny Metabolism), fetched
  // rather than mirrored so the page and the backend can't disagree about who has one.
  const [optionsByCharacter, setOptionsByCharacter] = useState({});
  const [chosenOptIns, setChosenOptIns] = useState({});

  const load = useCallback(async () => {
    if (!isGm) { setLoading(false); return; }
    setLoading(true);
    const [encRes, charRes] = await Promise.all([
      encounterService.getEncounters(campaignId),
      characterService.getCharactersByCampaign(campaignId),
    ]);
    if (encRes.success) setEncounters(encRes.data);
    else setError(encRes.error);
    if (charRes.success) setCharacters(charRes.data);
    setLoading(false);
  }, [campaignId, isGm]);

  useEffect(() => { load(); }, [load]);

  const loadOptions = async (encounter) => {
    const ids = (encounter?.combatants ?? []).map((c) => c.character_id);
    if (ids.length === 0) { setOptionsByCharacter({}); return; }
    const res = await characterService.getInitiativeOptions(campaignId, ids);
    if (!res.success) return;   // the order still works without the opt-ins
    setOptionsByCharacter(Object.fromEntries(res.data.map((row) => [row.character_id, row.options])));
  };

  const openEncounter = async (id) => {
    setStartSummary(null);
    setChosenOptIns({});
    const res = await encounterService.getEncounter(campaignId, id);
    if (res.success) {
      setActive(res.data);
      loadOptions(res.data);
    } else setError(res.error);
  };

  const toggleOptIn = (characterId, feature) => {
    setChosenOptIns((prev) => {
      const current = prev[characterId] ?? [];
      const next = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];
      if (next.length === 0) {
        const { [characterId]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [characterId]: next };
    });
  };

  const characterById = (id) => characters.find((c) => c.id === id);

  // The modifier is read off the sheet, so a GM never re-derives it by hand.
  const modifierFor = (characterId) => {
    const char = characterById(characterId);
    if (!char) return { total: 0, advantage: false };
    return initiativeForCharacter(char, { edition, pb: profBonus(char.level ?? 1) });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const res = await encounterService.createEncounter(campaignId, {
      name: newName.trim(),
      character_ids: newCharacterIds,
    });
    setBusy(false);
    if (!res.success) { setError(res.error); return; }
    setCreateOpen(false);
    setNewName('');
    setNewCharacterIds([]);
    setStartSummary(null);
    setActive(res.data);
    load();
  };

  const handleDeleteEncounter = async (encounter) => {
    const res = await encounterService.deleteEncounter(campaignId, encounter.id);
    if (!res.success) { setError(res.error); return; }
    if (active?.id === encounter.id) setActive(null);
    load();
  };

  const handleAddCharacter = async (character) => {
    const res = await encounterService.addCombatant(campaignId, active.id, character.id);
    if (!res.success) { setError(res.error); return; }
    openEncounter(active.id);
    load();
  };

  const handleRemoveCombatant = async (combatant) => {
    const res = await encounterService.removeCombatant(campaignId, active.id, combatant.id);
    if (!res.success) { setError(res.error); return; }
    openEncounter(active.id);
    load();
  };

  const handleChangeInitiative = async (combatant, raw) => {
    const value = raw === '' ? null : Number(raw);
    if (value !== null && Number.isNaN(value)) return;
    // Optimistic so typing doesn't fight the round-trip; the response re-sorts authoritatively.
    setActive((prev) => prev && {
      ...prev,
      combatants: prev.combatants.map((c) => (c.id === combatant.id ? { ...c, initiative: value } : c)),
    });
    const res = await encounterService.setInitiative(campaignId, active.id, combatant.id, value);
    if (res.success) setActive(res.data);
  };

  const handleRollAll = async () => {
    if (!active?.combatants?.length) return;
    setBusy(true);
    let latest = active;
    // Sequential: each response carries the whole re-sorted encounter, so parallel writes would
    // race and the last one home would win with a stale order.
    for (const combatant of active.combatants) {
      const { total } = rollInitiative(modifierFor(combatant.character_id).total);
      const res = await encounterService.setInitiative(campaignId, active.id, combatant.id, total);
      if (res.success) latest = res.data;
      else { setError(res.error); break; }
    }
    setActive(latest);
    setBusy(false);
  };

  const handleStartCombat = async () => {
    if (!active?.combatants?.length) return;
    setBusy(true);
    const ids = active.combatants.map((c) => c.character_id);
    const optIns = Object.keys(chosenOptIns).length ? chosenOptIns : null;
    const res = await characterService.applyRest(campaignId, 'initiative', ids, optIns);
    setBusy(false);
    if (!res.success) { setError(res.error); return; }
    setStartSummary(res.data.applied_to);
    // Spending a once-per-long-rest charge changes what's still on offer.
    setChosenOptIns({});
    loadOptions(active);
  };

  if (!isGm) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground" data-testid="encounters-gm-only">
          <ShieldAlert className="h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">Encounters are a GM tool</p>
          <p className="text-sm">Your GM runs initiative; anything you regain shows up on your sheet.</p>
        </div>
      </MainLayout>
    );
  }

  const inEncounter = new Set((active?.combatants ?? []).map((c) => c.character_id));
  const available = characters.filter((c) => !inEncounter.has(c.id));
  const rolled = (active?.combatants ?? []).filter((c) => c.initiative != null).length;

  return (
    <MainLayout>
      <div className="flex flex-col h-full min-h-0" data-testid="encounters-page">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Encounters
            </h1>
            <p className="text-sm text-muted-foreground">
              Roll initiative for the party and start combat
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} data-testid="new-encounter-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Encounter
          </Button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="encounters-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading encounters…</div>
        ) : (
          <div className="flex-1 min-h-0 flex">
            {/* Encounter list */}
            <div className="w-64 shrink-0 border-r border-border overflow-y-auto p-2 space-y-1">
              {encounters.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground" data-testid="encounters-empty">
                  No encounters yet.
                </p>
              ) : encounters.map((enc) => (
                <div key={enc.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEncounter(enc.id)}
                    data-testid={`encounter-row-${enc.id}`}
                    className={cn(
                      'flex-1 text-left px-3 py-2 rounded-md transition-colors',
                      active?.id === enc.id ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="text-sm font-semibold truncate">{enc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {enc.combatant_count} {enc.combatant_count === 1 ? 'combatant' : 'combatants'}
                    </div>
                  </button>
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={() => handleDeleteEncounter(enc)}
                    data-testid={`delete-encounter-${enc.id}`}
                    aria-label={`Delete ${enc.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Active encounter */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!active ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Swords className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Select an encounter</p>
                  <p className="text-sm mt-1">Or create one to start rolling initiative.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h2 className="text-lg font-bold" data-testid="active-encounter-name">{active.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {rolled} of {active.combatants.length} rolled
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRollAll}
                        disabled={busy || active.combatants.length === 0}
                        data-testid="roll-all-btn"
                      >
                        <Dices className="h-4 w-4 mr-2" />
                        Roll All
                      </Button>
                      <Button
                        onClick={handleStartCombat}
                        disabled={busy || active.combatants.length === 0}
                        data-testid="start-combat-btn"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Combat
                      </Button>
                    </div>
                  </div>

                  {/* Initiative order */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Initiative Order
                    </Label>
                    {active.combatants.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="no-combatants">
                        Nobody in this encounter yet — add characters below.
                      </p>
                    ) : active.combatants.map((c, i) => {
                      const { total, advantage } = modifierFor(c.character_id);
                      return (
                        <CombatantRow
                          key={c.id}
                          combatant={c}
                          position={i + 1}
                          modifier={total}
                          advantage={advantage}
                          onChangeInitiative={handleChangeInitiative}
                          onRemove={handleRemoveCombatant}
                        />
                      );
                    })}
                  </div>

                  {/* Choices to make before starting — only shown when somebody has one */}
                  {Object.keys(optionsByCharacter).length > 0 && (
                    <div className="space-y-2" data-testid="opt-in-section">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Before You Start
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        These cost a limited use, so they only happen if you choose them.
                      </p>
                      {Object.entries(optionsByCharacter).map(([characterId, options]) => {
                        const combatant = active.combatants.find((c) => String(c.character_id) === String(characterId));
                        return (
                          <OptInRow
                            key={characterId}
                            characterId={Number(characterId)}
                            name={combatant?.character_name ?? 'Unknown'}
                            options={options}
                            chosen={chosenOptIns[characterId] ?? []}
                            onToggle={toggleOptIn}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* What Start Combat gave back */}
                  {startSummary && (
                    <div className="rounded-md border bg-muted/30 p-4 space-y-2" data-testid="start-summary">
                      <div className="text-sm font-semibold">Combat started</div>
                      {startSummary.map((item) => (
                        <div key={item.character_id} className="text-xs" data-testid={`regained-${item.character_id}`}>
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span className="text-muted-foreground"> — {item.changes.join('; ')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add characters */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Add Characters
                    </Label>
                    {available.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="all-characters-added">
                        Every character in this campaign is already in the encounter.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {available.map((char) => (
                          <Button
                            key={char.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddCharacter(char)}
                            data-testid={`add-character-${char.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1.5" />
                            {char.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New encounter */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Encounter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="encounter-name">Name</Label>
              <Input
                id="encounter-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Goblin ambush"
                data-testid="new-encounter-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Who's fighting?</Label>
              <div className="flex flex-wrap gap-2">
                {characters.map((char) => {
                  const picked = newCharacterIds.includes(char.id);
                  return (
                    <Button
                      key={char.id}
                      type="button"
                      variant={picked ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewCharacterIds((prev) => (
                        picked ? prev.filter((id) => id !== char.id) : [...prev, char.id]
                      ))}
                      data-testid={`new-encounter-char-${char.id}`}
                    >
                      {char.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy || !newName.trim()} data-testid="create-encounter-btn">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
