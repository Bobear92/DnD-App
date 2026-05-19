import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff, Trash2, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';
import {
  BarbarianSheet, BardSheet, ClericSheet, DruidSheet,
  FighterSheet, MonkSheet, PaladinSheet, RangerSheet,
  RogueSheet, SorcererSheet, WarlockSheet, WizardSheet,
} from '../components';
import {
  BarbarianSheet as BarbarianSheet2024,
  BardSheet as BardSheet2024,
  ClericSheet as ClericSheet2024,
  DruidSheet as DruidSheet2024,
  FighterSheet as FighterSheet2024,
  MonkSheet as MonkSheet2024,
  PaladinSheet as PaladinSheet2024,
  RangerSheet as RangerSheet2024,
  RogueSheet as RogueSheet2024,
  SorcererSheet as SorcererSheet2024,
  WarlockSheet as WarlockSheet2024,
  WizardSheet as WizardSheet2024,
} from '../components/5e2024';
import { cn } from '@/lib/utils';

const ABILITY_LABELS = [
  { key: 'strength', label: 'Strength', abbrev: 'STR', save: 'str_save_prof' },
  { key: 'dexterity', label: 'Dexterity', abbrev: 'DEX', save: 'dex_save_prof' },
  { key: 'constitution', label: 'Constitution', abbrev: 'CON', save: 'con_save_prof' },
  { key: 'intelligence', label: 'Intelligence', abbrev: 'INT', save: 'int_save_prof' },
  { key: 'wisdom', label: 'Wisdom', abbrev: 'WIS', save: 'wis_save_prof' },
  { key: 'charisma', label: 'Charisma', abbrev: 'CHA', save: 'cha_save_prof' },
];

const CLASS_SAVE_PROFS = {
  Barbarian: ['str_save_prof', 'con_save_prof'],
  Bard:      ['dex_save_prof', 'cha_save_prof'],
  Cleric:    ['wis_save_prof', 'cha_save_prof'],
  Druid:     ['int_save_prof', 'wis_save_prof'],
  Fighter:   ['str_save_prof', 'con_save_prof'],
  Monk:      ['str_save_prof', 'dex_save_prof'],
  Paladin:   ['wis_save_prof', 'cha_save_prof'],
  Ranger:    ['str_save_prof', 'dex_save_prof'],
  Rogue:     ['dex_save_prof', 'int_save_prof'],
  Sorcerer:  ['con_save_prof', 'cha_save_prof'],
  Warlock:   ['wis_save_prof', 'cha_save_prof'],
  Wizard:    ['int_save_prof', 'wis_save_prof'],
};

const SKILL_MAP = [
  { skill: 'Acrobatics', ability: 'dexterity' },
  { skill: 'Animal Handling', ability: 'wisdom' },
  { skill: 'Arcana', ability: 'intelligence' },
  { skill: 'Athletics', ability: 'strength' },
  { skill: 'Deception', ability: 'charisma' },
  { skill: 'History', ability: 'intelligence' },
  { skill: 'Insight', ability: 'wisdom' },
  { skill: 'Intimidation', ability: 'charisma' },
  { skill: 'Investigation', ability: 'intelligence' },
  { skill: 'Medicine', ability: 'wisdom' },
  { skill: 'Nature', ability: 'intelligence' },
  { skill: 'Perception', ability: 'wisdom' },
  { skill: 'Performance', ability: 'charisma' },
  { skill: 'Persuasion', ability: 'charisma' },
  { skill: 'Religion', ability: 'intelligence' },
  { skill: 'Sleight of Hand', ability: 'dexterity' },
  { skill: 'Stealth', ability: 'dexterity' },
  { skill: 'Survival', ability: 'wisdom' },
];

function mod(score) { return Math.floor((score - 10) / 2); }
function modStr(score) { const m = mod(score); return m >= 0 ? `+${m}` : `${m}`; }
function profBonus(level) { return Math.ceil(level / 4) + 1; }

const CLASS_SHEETS_5E = {
  Barbarian: BarbarianSheet, Bard: BardSheet, Cleric: ClericSheet, Druid: DruidSheet,
  Fighter: FighterSheet, Monk: MonkSheet, Paladin: PaladinSheet, Ranger: RangerSheet,
  Rogue: RogueSheet, Sorcerer: SorcererSheet, Warlock: WarlockSheet, Wizard: WizardSheet,
};

const CLASS_SHEETS_2024 = {
  Barbarian: BarbarianSheet2024, Bard: BardSheet2024, Cleric: ClericSheet2024, Druid: DruidSheet2024,
  Fighter: FighterSheet2024, Monk: MonkSheet2024, Paladin: PaladinSheet2024, Ranger: RangerSheet2024,
  Rogue: RogueSheet2024, Sorcerer: SorcererSheet2024, Warlock: WarlockSheet2024, Wizard: WizardSheet2024,
};

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

function useSection(initial) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const reset = () => setDraft(saved);
  const commit = (newVal) => { setDraft(newVal); setSaved(newVal); };
  return { draft, setDraft, isDirty, reset, commit };
}

export default function CharacterDetail() {
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams();
  const { campaign } = useCampaign();
  const { user } = useAuth();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [playerView, setPlayerView] = useState(false);

  // Section drafts
  const identity = useSection(null);
  const classSection = useSection(null);
  const savingThrows = useSection(null);
  const gmNotes = useSection('');

  const isGm = campaign?.userRole === 'gm';
  const isOwner = character?.user_id === user?.id;
  const canEdit = isOwner || isGm;
  const displayAsPlayer = !isGm || playerView;
  // Owner can always edit their own character; GM can edit only when not in player-view preview
  const showEditable = isOwner || (isGm && !playerView);

  useEffect(() => { load(); }, [characterId]);

  const load = async () => {
    setLoading(true);
    const result = await characterService.getCharacterById(characterId);
    if (result.success) {
      const c = result.data;
      setCharacter(c);
      identity.commit({
        name: c.name, race: c.race, level: c.level,
        background: c.background ?? '', alignment: c.alignment ?? '',
        strength: c.strength, dexterity: c.dexterity, constitution: c.constitution,
        intelligence: c.intelligence, wisdom: c.wisdom, charisma: c.charisma,
        notes: c.notes ?? '',
      });
      classSection.commit(c.character_data ?? {});
      // Save throw proficiencies stored in character_data
      const defaultProfs = CLASS_SAVE_PROFS[c.char_class] ?? [];
      const storedProfs = {};
      ABILITY_LABELS.forEach(a => {
        storedProfs[a.save] = (c.character_data ?? {})[a.save] ??
          defaultProfs.includes(a.save);
      });
      savingThrows.commit(storedProfs);
      gmNotes.commit(c.gm_notes ?? '');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const saveSection = async (payload, onSuccess) => {
    const result = await characterService.updateCharacter(characterId, payload);
    if (result.success) {
      setCharacter(result.data);
      onSuccess?.(result.data);
    } else {
      setError(result.error);
    }
  };

  const saveIdentity = async () => {
    await saveSection({
      name: identity.draft.name,
      race: identity.draft.race,
      level: identity.draft.level,
      background: identity.draft.background,
      alignment: identity.draft.alignment,
      strength: identity.draft.strength,
      dexterity: identity.draft.dexterity,
      constitution: identity.draft.constitution,
      intelligence: identity.draft.intelligence,
      wisdom: identity.draft.wisdom,
      charisma: identity.draft.charisma,
      notes: identity.draft.notes,
    }, (updated) => {
      identity.commit({
        name: updated.name, race: updated.race, level: updated.level,
        background: updated.background ?? '', alignment: updated.alignment ?? '',
        strength: updated.strength, dexterity: updated.dexterity, constitution: updated.constitution,
        intelligence: updated.intelligence, wisdom: updated.wisdom, charisma: updated.charisma,
        notes: updated.notes ?? '',
      });
    });
  };

  const saveClassData = async () => {
    // Merge save throw profs into character_data
    const merged = { ...classSection.draft, ...savingThrows.draft };
    await saveSection({ character_data: merged }, (updated) => {
      classSection.commit(updated.character_data ?? {});
    });
  };

  const saveGmNotes = async () => {
    await saveSection({ gm_notes: gmNotes.draft }, () => gmNotes.commit(gmNotes.draft));
  };

  const handleToggleVisibility = async () => {
    const result = await characterService.toggleVisibility(character.id, !character.is_visible_to_players);
    if (result.success) load();
    else setError(result.error);
  };

  const handleDelete = async () => {
    const result = await characterService.deleteCharacter(characterId);
    if (result.success) navigate(`/campaigns/${campaignId}/characters`);
    else setError(result.error);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading character…
        </div>
      </MainLayout>
    );
  }

  if (!character) {
    return (
      <MainLayout>
        <div className="p-6 text-muted-foreground">
          {error || 'Character not found.'}
        </div>
      </MainLayout>
    );
  }

  const pb = profBonus(identity.draft?.level ?? character.level);
  const edition = campaign?.edition || '5e';
  const ClassSheet = (edition === '5.5e' ? CLASS_SHEETS_2024 : CLASS_SHEETS_5E)[character.char_class];

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/campaigns/${campaignId}/characters`)} className="p-2 rounded hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{character.name}</h1>
              <p className="text-sm text-muted-foreground">
                Level {character.level} {character.char_class}
                {character.race ? ` · ${character.race}` : ''}
                {character.background ? ` · ${character.background}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isGm && (
              <Button variant="outline" size="sm" onClick={() => setPlayerView(v => !v)}>
                {playerView ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                {playerView ? 'GM View' : 'Player View'}
              </Button>
            )}
            {isGm && !displayAsPlayer && (
              <>
                <button
                  onClick={handleToggleVisibility}
                  title={character.is_visible_to_players ? 'Visible to players' : 'Hidden from players'}
                  className="p-2 rounded hover:bg-muted"
                >
                  {character.is_visible_to_players
                    ? <Eye className="h-4 w-4 text-green-600" />
                    : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button onClick={() => setDeleteOpen(true)} className="p-2 rounded hover:bg-muted">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Identity + Ability Scores */}
        {identity.draft && (
          <SectionCard
            title="Identity & Ability Scores"
            isDirty={identity.isDirty}
            onSave={saveIdentity}
            onReset={identity.reset}
            canEdit={showEditable}
          >
            <div className="space-y-4">
              {showEditable ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={identity.draft.name} onChange={e => identity.setDraft(d => ({ ...d, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Race / Species</Label>
                    <Input value={identity.draft.race} onChange={e => identity.setDraft(d => ({ ...d, race: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Level</Label>
                    <Input type="number" min={1} max={20} value={identity.draft.level}
                      onChange={e => identity.setDraft(d => ({ ...d, level: parseInt(e.target.value) || 1 }))}
                      className="text-center" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Background</Label>
                    <Input value={identity.draft.background} onChange={e => identity.setDraft(d => ({ ...d, background: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Alignment</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={identity.draft.alignment}
                      onChange={e => identity.setDraft(d => ({ ...d, alignment: e.target.value }))}
                    >
                      <option value="">Select alignment…</option>
                      {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">{identity.draft.race || 'Unknown race'}</Badge>
                  <Badge variant="outline">Level {identity.draft.level}</Badge>
                  {identity.draft.background && <Badge variant="outline">{identity.draft.background}</Badge>}
                  {identity.draft.alignment && <Badge variant="outline">{identity.draft.alignment}</Badge>}
                </div>
              )}

              {/* Ability scores */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Ability Scores</div>
                <div className="grid grid-cols-6 gap-2">
                  {ABILITY_LABELS.map(({ key, abbrev }) => (
                    <div key={key} className="flex flex-col items-center">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{abbrev}</span>
                      {showEditable ? (
                        <Input
                          type="number" min={1} max={30}
                          value={identity.draft[key]}
                          onChange={e => identity.setDraft(d => ({ ...d, [key]: parseInt(e.target.value) || 10 }))}
                          className="w-full text-center font-bold p-1 h-10"
                        />
                      ) : (
                        <div className="rounded-md border w-full text-center py-2 font-bold">
                          {identity.draft[key]}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{modStr(identity.draft[key])}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derived stats row */}
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="rounded-md border py-2">
                  <div className="text-[10px] text-muted-foreground uppercase">Prof. Bonus</div>
                  <div className="font-bold">+{pb}</div>
                </div>
                <div className="rounded-md border py-2">
                  <div className="text-[10px] text-muted-foreground uppercase">Initiative</div>
                  <div className="font-bold">{modStr(identity.draft.dexterity)}</div>
                </div>
                <div className="rounded-md border py-2">
                  <div className="text-[10px] text-muted-foreground uppercase">Passive Perc.</div>
                  <div className="font-bold">{10 + mod(identity.draft.wisdom) + pb}</div>
                </div>
                <div className="rounded-md border py-2">
                  <div className="text-[10px] text-muted-foreground uppercase">Inspiration</div>
                  <div className="font-bold">{classSection.draft?.inspiration ? '✓' : '—'}</div>
                </div>
              </div>

              {/* Saving Throws */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Saving Throws</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ABILITY_LABELS.map(({ key, abbrev, save }) => {
                    const isProficient = savingThrows.draft?.[save] ?? false;
                    const bonus = mod(identity.draft[key]) + (isProficient ? pb : 0);
                    return (
                      <div key={key} className="flex items-center gap-2 rounded border px-2 py-1.5 text-sm">
                        {showEditable ? (
                          <button
                            type="button"
                            onClick={() => {
                              savingThrows.setDraft(d => ({ ...d, [save]: !d[save] }));
                            }}
                            className={cn(
                              'h-3.5 w-3.5 rounded-sm border flex-shrink-0 transition-colors',
                              isProficient ? 'bg-primary border-primary' : 'bg-background border-border'
                            )}
                          />
                        ) : (
                          <div className={cn('h-3.5 w-3.5 rounded-sm border flex-shrink-0', isProficient ? 'bg-primary border-primary' : 'bg-muted border-border')} />
                        )}
                        <span className="flex-1 text-xs">{abbrev}</span>
                        <span className="font-medium text-xs">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <SkillsDisplay
                identityDraft={identity.draft}
                classData={classSection.draft}
                pb={pb}
                readOnly={displayAsPlayer || !canEdit}
              />

              {/* Player notes */}
              {(showEditable) || identity.draft.notes ? (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  {showEditable ? (
                    <Textarea
                      value={identity.draft.notes}
                      onChange={e => identity.setDraft(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Personal notes, backstory, equipment…"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{identity.draft.notes}</p>
                  )}
                </div>
              ) : null}
            </div>
          </SectionCard>
        )}

        {/* Class features */}
        {ClassSheet && classSection.draft !== null && (
          <SectionCard
            title={`${character.char_class} Features`}
            isDirty={classSection.isDirty || savingThrows.isDirty}
            onSave={saveClassData}
            onReset={() => { classSection.reset(); savingThrows.reset(); }}
            canEdit={showEditable}
          >
            <ClassSheet
              data={classSection.draft}
              onChange={patch => classSection.setDraft(d => ({ ...d, ...patch }))}
              readOnly={displayAsPlayer || !canEdit}
              level={identity.draft?.level ?? character.level}
            />
          </SectionCard>
        )}

        {/* GM Notes */}
        {isGm && !displayAsPlayer && (
          <SectionCard
            title="GM Notes"
            isDirty={gmNotes.isDirty}
            onSave={saveGmNotes}
            onReset={gmNotes.reset}
            canEdit={true}
            variant="amber"
          >
            <Textarea
              value={gmNotes.draft}
              onChange={e => gmNotes.setDraft(e.target.value)}
              placeholder="Private GM notes — never visible to the player…"
              rows={4}
            />
          </SectionCard>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{character.name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function SectionCard({ title, children, isDirty, onSave, onReset, canEdit, variant }) {
  return (
    <div className={cn(
      'rounded-lg border bg-card',
      variant === 'amber' && 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className={cn('font-semibold text-sm', variant === 'amber' && 'text-amber-800 dark:text-amber-300')}>
          {title}
          {variant === 'amber' && <span className="ml-2 text-xs font-normal opacity-70">Private</span>}
        </h2>
        {canEdit && isDirty && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onReset} className="h-7 text-xs">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={onSave} className="h-7 text-xs">
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SkillsDisplay({ identityDraft, classData, pb, readOnly }) {
  const skillProfs = classData?.skill_proficiencies ?? [];
  const expertiseSkills = classData?.expertise_skills ?? [];

  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Skills</div>
      <div className="grid grid-cols-2 gap-1">
        {SKILL_MAP.map(({ skill, ability }) => {
          const base = mod(identityDraft[ability]);
          const isProf = skillProfs.includes(skill);
          const isExpert = expertiseSkills.includes(skill);
          const bonus = base + (isExpert ? pb * 2 : isProf ? pb : 0);
          return (
            <div key={skill} className="flex items-center gap-2 text-xs py-0.5">
              <div className={cn(
                'h-3 w-3 rounded-sm border flex-shrink-0',
                isExpert ? 'bg-purple-500 border-purple-500' : isProf ? 'bg-primary border-primary' : 'bg-muted border-border'
              )} />
              <span className="flex-1 truncate">{skill}</span>
              <span className="font-medium tabular-nums text-muted-foreground">
                {bonus >= 0 ? `+${bonus}` : bonus}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">Purple = expertise · Blue = proficient</p>
    </div>
  );
}
