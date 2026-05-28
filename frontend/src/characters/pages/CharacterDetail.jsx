import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft, Eye, EyeOff, Trash2, Save, RotateCcw, TrendingUp, Star, Plus, Wand2, Shield,
  Sword, Zap, BookOpen, Music, User, X, Upload, ExternalLink, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService, { mapCharacterImageUrl } from '../characterService';
import settingsService from '../../settings/settingsService';
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

const XP_THRESHOLDS = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000,
  64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

function xpForLevel(level) { return XP_THRESHOLDS[Math.min(level, 20)] ?? 355000; }

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

const SPELLCASTING_CLASSES = new Set(['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']);

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const NPC_STATUSES = ['alive', 'dead', 'missing', 'unknown'];

function computeRaceGrantedCantrips(character) {
  const cd = character?.character_data ?? {};
  const cantrips = [];
  if (cd.high_elf_cantrip) cantrips.push(cd.high_elf_cantrip);
  const SUBRACE_CANTRIPS = { 'Forest Gnome': 'Minor Illusion', 'Drow': 'Dancing Lights' };
  if (SUBRACE_CANTRIPS[cd.subrace]) cantrips.push(SUBRACE_CANTRIPS[cd.subrace]);
  const RACE_CANTRIPS = { 'Tiefling': 'Thaumaturgy' };
  if (RACE_CANTRIPS[character?.race]) cantrips.push(RACE_CANTRIPS[character.race]);
  return cantrips;
}

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

  const [xpInput, setXpInput] = useState('');
  const [addingXp, setAddingXp] = useState(false);
  const [levelUpWizardOpen, setLevelUpWizardOpen] = useState(false);

  // Narrative state
  const [backstoryPreview, setBackstoryPreview] = useState(false);
  const [publicNotesPreview, setPublicNotesPreview] = useState(false);
  const [personalNotesPreview, setPersonalNotesPreview] = useState(false);
  const [portraitUploading, setPortraitUploading] = useState(false);
  const portraitInputRef = useRef(null);

  // Calendar for era/month selects in event form
  const [calendar, setCalendar] = useState(null);

  // Timeline events linked to character
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', era_id: '__none__', year: '', month_order: '__none__', day: '', is_visible_to_players: false, link_description: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  // NPCs linked to character
  const [characterNpcs, setCharacterNpcs] = useState([]);
  const [showNpcForm, setShowNpcForm] = useState(false);
  const [npcForm, setNpcForm] = useState({ name: '', race: '', occupation: '', alignment: '', status: 'alive', summary: '', is_visible_to_players: false, relationship_description: '' });
  const [savingNpc, setSavingNpc] = useState(false);

  const identity = useSection(null);
  const classSection = useSection(null);
  const savingThrows = useSection(null);
  const gmNotes = useSection('');
  const backstory = useSection('');
  const publicNotes = useSection('');
  const personalNotes = useSection('');
  const narrativeMeta = useSection({ theme_music_url: '' });

  const isGm = campaign?.userRole === 'gm';
  const isOwner = character?.user_id === user?.id;
  const canEdit = isOwner || isGm;
  const displayAsPlayer = !isGm || playerView;
  const showEditable = isOwner || (isGm && !playerView);
  const showPersonalNotes = isOwner || (isGm && !playerView);

  useEffect(() => { load(); }, [characterId]);

  useEffect(() => {
    if (campaignId) {
      settingsService.getCalendar(campaignId).catch(() => null).then(cal => setCalendar(cal ?? null));
    }
  }, [campaignId]);

  const load = async () => {
    setLoading(true);
    const [charResult, eventsResult, npcsResult] = await Promise.all([
      characterService.getCharacterById(characterId),
      characterService.getTimelineEvents(characterId),
      characterService.getCharacterNpcs(characterId),
    ]);
    if (charResult.success) {
      const c = charResult.data;
      setCharacter(c);
      identity.commit({
        name: c.name, race: c.race,
        background: c.background ?? '', alignment: c.alignment ?? '',
        strength: c.strength, dexterity: c.dexterity, constitution: c.constitution,
        intelligence: c.intelligence, wisdom: c.wisdom, charisma: c.charisma,
        level: c.level,
      });
      classSection.commit(c.character_data ?? {});
      const defaultProfs = CLASS_SAVE_PROFS[c.char_class] ?? [];
      const storedProfs = {};
      ABILITY_LABELS.forEach(a => {
        storedProfs[a.save] = (c.character_data ?? {})[a.save] ??
          defaultProfs.includes(a.save);
      });
      savingThrows.commit(storedProfs);
      gmNotes.commit(c.gm_notes ?? '');
      backstory.commit(c.backstory ?? '');
      publicNotes.commit(c.notes ?? '');
      personalNotes.commit(c.personal_notes ?? '');
      narrativeMeta.commit({ theme_music_url: c.theme_music_url ?? '' });
    } else {
      setError(charResult.error);
    }
    if (eventsResult.success) setTimelineEvents(eventsResult.data);
    if (npcsResult.success) setCharacterNpcs(npcsResult.data);
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
      background: identity.draft.background,
      alignment: identity.draft.alignment,
      strength: identity.draft.strength,
      dexterity: identity.draft.dexterity,
      constitution: identity.draft.constitution,
      intelligence: identity.draft.intelligence,
      wisdom: identity.draft.wisdom,
      charisma: identity.draft.charisma,
    }, (updated) => {
      identity.commit({
        name: updated.name, race: updated.race, level: updated.level,
        background: updated.background ?? '', alignment: updated.alignment ?? '',
        strength: updated.strength, dexterity: updated.dexterity, constitution: updated.constitution,
        intelligence: updated.intelligence, wisdom: updated.wisdom, charisma: updated.charisma,
      });
    });
  };

  const saveClassData = async () => {
    const merged = { ...classSection.draft, ...savingThrows.draft };
    await saveSection({ character_data: merged }, (updated) => {
      classSection.commit(updated.character_data ?? {});
    });
  };

  const saveGmNotes = async () => {
    await saveSection({ gm_notes: gmNotes.draft }, () => gmNotes.commit(gmNotes.draft));
  };

  const saveBackstory = async () => {
    await saveSection({ backstory: backstory.draft }, (updated) => backstory.commit(updated.backstory ?? ''));
  };

  const savePublicNotes = async () => {
    await saveSection({ notes: publicNotes.draft }, (updated) => publicNotes.commit(updated.notes ?? ''));
  };

  const savePersonalNotes = async () => {
    await saveSection({ personal_notes: personalNotes.draft }, (updated) => personalNotes.commit(updated.personal_notes ?? ''));
  };

  const saveNarrativeMeta = async () => {
    await saveSection(
      { theme_music_url: narrativeMeta.draft.theme_music_url || null },
      (updated) => narrativeMeta.commit({ theme_music_url: updated.theme_music_url ?? '' })
    );
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

  const handleAddXp = async () => {
    const toAdd = parseInt(xpInput.replace(/,/g, ''));
    if (isNaN(toAdd) || toAdd <= 0) return;
    const newXp = (character.experience_points ?? 0) + toAdd;
    const nextLevel = (character.level ?? 1) + 1;
    const pendingLevelUp = nextLevel <= 20 && newXp >= xpForLevel(nextLevel);
    setAddingXp(true);
    const result = await characterService.updateCharacter(characterId, {
      experience_points: newXp,
      ...(pendingLevelUp ? { level_up_pending: true } : {}),
    });
    setAddingXp(false);
    if (result.success) {
      setCharacter(result.data);
      setXpInput('');
    } else {
      setError(result.error);
    }
  };

  const handleMilestoneLevelUp = async () => {
    const result = await characterService.updateCharacter(characterId, { level_up_pending: true });
    if (result.success) setCharacter(result.data);
    else setError(result.error);
  };

  const handleLevelUpComplete = async (newLevel, newCharacterData) => {
    const result = await characterService.updateCharacter(characterId, {
      level: newLevel,
      character_data: newCharacterData,
      level_up_pending: false,
    });
    if (result.success) {
      setCharacter(result.data);
      identity.commit({ ...identity.draft, level: newLevel });
      classSection.commit(newCharacterData);
      setLevelUpWizardOpen(false);
    } else {
      setError(result.error);
    }
  };

  const handlePortraitUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return; }
    setPortraitUploading(true);
    const result = await characterService.uploadImage(characterId, file);
    setPortraitUploading(false);
    if (result.success) setCharacter(result.data);
    else setError(result.error);
  };

  const handlePortraitDelete = async () => {
    const result = await characterService.deleteImage(characterId);
    if (result.success) setCharacter(result.data);
    else setError(result.error);
  };

  const handleAddEvent = async () => {
    if (!eventForm.title.trim()) return;
    setSavingEvent(true);
    const payload = {
      title: eventForm.title.trim(),
      description: eventForm.description || null,
      era_id: eventForm.era_id === '__none__' ? null : parseInt(eventForm.era_id),
      year: eventForm.year ? parseInt(eventForm.year.replace(/,/g, '')) : null,
      month_order: eventForm.month_order === '__none__' ? null : parseInt(eventForm.month_order),
      day: eventForm.day ? parseInt(eventForm.day) : null,
      is_visible_to_players: eventForm.is_visible_to_players,
      link_description: eventForm.link_description || null,
    };
    const result = await characterService.createTimelineEvent(characterId, payload);
    setSavingEvent(false);
    if (result.success) {
      setTimelineEvents(ev => [...ev, result.data]);
      setEventForm({ title: '', description: '', era_id: '__none__', year: '', month_order: '__none__', day: '', is_visible_to_players: false, link_description: '' });
      setShowEventForm(false);
    } else {
      setError(result.error);
    }
  };

  const handleRemoveEvent = async (linkId) => {
    const result = await characterService.removeTimelineEvent(characterId, linkId);
    if (result.success) setTimelineEvents(ev => ev.filter(e => e.id !== linkId));
    else setError(result.error);
  };

  const handleAddNpc = async () => {
    if (!npcForm.name.trim()) return;
    setSavingNpc(true);
    const result = await characterService.createCharacterNpc(characterId, {
      ...npcForm,
      name: npcForm.name.trim(),
    });
    setSavingNpc(false);
    if (result.success) {
      setCharacterNpcs(n => [...n, result.data]);
      setNpcForm({ name: '', race: '', occupation: '', alignment: '', status: 'alive', summary: '', is_visible_to_players: false, relationship_description: '' });
      setShowNpcForm(false);
    } else {
      setError(result.error);
    }
  };

  const handleRemoveNpc = async (linkId) => {
    const result = await characterService.removeCharacterNpc(characterId, linkId);
    if (result.success) setCharacterNpcs(n => n.filter(x => x.id !== linkId));
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

  const raceGrantedCantrips = computeRaceGrantedCantrips(character);
  const hasSpells = SPELLCASTING_CLASSES.has(character.char_class) || raceGrantedCantrips.length > 0;
  const tabCount = hasSpells ? 5 : 4;

  const calendarEras = calendar?.eras ?? [];
  const calendarMonths = calendar?.months ?? [];

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

        {/* Leveling card */}
        {character && (
          <LevelingCard
            character={character}
            campaign={campaign}
            isGm={isGm}
            isOwner={isOwner}
            displayAsPlayer={displayAsPlayer}
            xpInput={xpInput}
            setXpInput={setXpInput}
            addingXp={addingXp}
            onAddXp={handleAddXp}
            onMilestoneLevelUp={handleMilestoneLevelUp}
            onOpenWizard={() => setLevelUpWizardOpen(true)}
          />
        )}

        {/* Level-up wizard */}
        {levelUpWizardOpen && character && (
          <LevelUpWizard
            character={character}
            campaign={campaign}
            onComplete={handleLevelUpComplete}
            onClose={() => setLevelUpWizardOpen(false)}
          />
        )}

        {/* Tabbed character sheet */}
        {identity.draft && (
          <Tabs defaultValue="narrative" className="space-y-4">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabCount},1fr)` }}>
              <TabsTrigger value="narrative" className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Narrative
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> Stats
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Features
              </TabsTrigger>
              <TabsTrigger value="gear" className="flex items-center gap-1.5">
                <Sword className="h-3.5 w-3.5" /> Weapons & Armor
              </TabsTrigger>
              {hasSpells && (
                <TabsTrigger value="spells" className="flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" /> Spells
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── Tab 0: Narrative ── */}
            <TabsContent value="narrative" className="space-y-4">

              {/* Portrait */}
              <div className="rounded-lg border bg-card p-4">
                <h2 className="font-semibold text-sm mb-3">Character Portrait</h2>
                <div className="flex gap-4 items-start">
                  {/* Portrait image / upload zone */}
                  <div
                    className={cn(
                      'relative w-32 h-40 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30 flex-shrink-0',
                      showEditable && 'cursor-pointer hover:bg-muted/50 transition-colors',
                      portraitUploading && 'opacity-60'
                    )}
                    onClick={() => showEditable && portraitInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); showEditable && handlePortraitUpload(e.dataTransfer.files[0]); }}
                  >
                    {character.image_path ? (
                      <>
                        <img
                          src={mapCharacterImageUrl(character.image_path)}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                        {showEditable && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground text-center p-2">
                        {portraitUploading ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <>
                            <User className="h-8 w-8 opacity-40" />
                            {showEditable && <span className="text-xs">Click or drop to upload</span>}
                          </>
                        )}
                      </div>
                    )}
                    {portraitUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    {showEditable && (
                      <>
                        <input
                          ref={portraitInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={e => handlePortraitUpload(e.target.files[0])}
                        />
                        {character.image_path && (
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 text-destructive hover:text-destructive" onClick={handlePortraitDelete}>
                            <X className="h-3 w-3" /> Remove portrait
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP · max 10 MB</p>
                      </>
                    )}
                    {!showEditable && !character.image_path && (
                      <p className="text-sm text-muted-foreground">No portrait uploaded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Music */}
              <SectionCard
                title="Theme Music"
                isDirty={narrativeMeta.isDirty}
                onSave={saveNarrativeMeta}
                onReset={narrativeMeta.reset}
                canEdit={showEditable}
              >
                <div className="space-y-2">
                  {showEditable ? (
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        value={narrativeMeta.draft.theme_music_url}
                        onChange={e => narrativeMeta.setDraft(d => ({ ...d, theme_music_url: e.target.value }))}
                        placeholder="Paste a URL to a song or playlist…"
                        className="flex-1"
                      />
                      {narrativeMeta.draft.theme_music_url && (
                        <a href={narrativeMeta.draft.theme_music_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                  ) : narrativeMeta.draft.theme_music_url ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <a href={narrativeMeta.draft.theme_music_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {narrativeMeta.draft.theme_music_url}
                      </a>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No theme music set.</p>
                  )}
                </div>
              </SectionCard>

              {/* Backstory */}
              <SectionCard
                title="Backstory"
                isDirty={backstory.isDirty}
                onSave={saveBackstory}
                onReset={backstory.reset}
                canEdit={showEditable}
                extraHeader={showEditable && (
                  <button
                    type="button"
                    onClick={() => setBackstoryPreview(v => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border"
                  >
                    {backstoryPreview ? 'Write' : 'Preview'}
                  </button>
                )}
              >
                {showEditable && !backstoryPreview ? (
                  <Textarea
                    value={backstory.draft}
                    onChange={e => backstory.setDraft(e.target.value)}
                    placeholder="Write your character's backstory here… Markdown is supported."
                    rows={12}
                    className="font-mono text-sm resize-y min-h-[200px]"
                  />
                ) : (backstory.draft || !showEditable) ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    {backstory.draft
                      ? <ReactMarkdown>{backstory.draft}</ReactMarkdown>
                      : <p className="text-muted-foreground">No backstory written yet.</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No backstory written yet.</p>
                )}
              </SectionCard>

              {/* Public Notes */}
              <SectionCard
                title="Public Notes"
                isDirty={publicNotes.isDirty}
                onSave={savePublicNotes}
                onReset={publicNotes.reset}
                canEdit={showEditable}
                subtitle="Visible to all campaign members"
                extraHeader={showEditable && (
                  <button
                    type="button"
                    onClick={() => setPublicNotesPreview(v => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border"
                  >
                    {publicNotesPreview ? 'Write' : 'Preview'}
                  </button>
                )}
              >
                {showEditable && !publicNotesPreview ? (
                  <Textarea
                    value={publicNotes.draft}
                    onChange={e => publicNotes.setDraft(e.target.value)}
                    placeholder="Notes visible to all players in the campaign…"
                    rows={5}
                    className="text-sm resize-y"
                  />
                ) : (publicNotes.draft || !showEditable) ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    {publicNotes.draft
                      ? <ReactMarkdown>{publicNotes.draft}</ReactMarkdown>
                      : <p className="text-muted-foreground">No public notes.</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No public notes.</p>
                )}
              </SectionCard>

              {/* Personal Notes — owner + GM only */}
              {showPersonalNotes && (
                <SectionCard
                  title="Personal Notes"
                  isDirty={personalNotes.isDirty}
                  onSave={savePersonalNotes}
                  onReset={personalNotes.reset}
                  canEdit={isOwner}
                  variant="personal"
                  subtitle="Visible only to you and the GM"
                  extraHeader={isOwner && (
                    <button
                      type="button"
                      onClick={() => setPersonalNotesPreview(v => !v)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border"
                    >
                      {personalNotesPreview ? 'Write' : 'Preview'}
                    </button>
                  )}
                >
                  {isOwner && !personalNotesPreview ? (
                    <Textarea
                      value={personalNotes.draft}
                      onChange={e => personalNotes.setDraft(e.target.value)}
                      placeholder="Private notes — only you and the GM can see these…"
                      rows={5}
                      className="text-sm resize-y"
                    />
                  ) : (personalNotes.draft || !isOwner) ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                      {personalNotes.draft
                        ? <ReactMarkdown>{personalNotes.draft}</ReactMarkdown>
                        : <p className="text-muted-foreground">No personal notes.</p>}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No personal notes.</p>
                  )}
                </SectionCard>
              )}

              {/* Related NPCs */}
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div>
                    <h2 className="font-semibold text-sm">Related NPCs</h2>
                    {characterNpcs.length > 0 && (
                      <span className="text-xs text-muted-foreground">{characterNpcs.length} linked</span>
                    )}
                  </div>
                  {showEditable && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowNpcForm(v => !v)} data-testid="npcs-toggle">
                      <Plus className="h-3 w-3" /> {showNpcForm ? 'Cancel' : 'Add NPC'}
                    </Button>
                  )}
                </div>

                {showNpcForm && showEditable && (
                  <div className="p-4 border-b bg-muted/20 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Name *</Label>
                        <Input value={npcForm.name} onChange={e => setNpcForm(f => ({ ...f, name: e.target.value }))} placeholder="NPC name" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Race</Label>
                        <Input value={npcForm.race} onChange={e => setNpcForm(f => ({ ...f, race: e.target.value }))} placeholder="e.g. Human" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Occupation</Label>
                        <Input value={npcForm.occupation} onChange={e => setNpcForm(f => ({ ...f, occupation: e.target.value }))} placeholder="e.g. Blacksmith" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select value={npcForm.status} onValueChange={v => setNpcForm(f => ({ ...f, status: v }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {NPC_STATUSES.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Summary</Label>
                      <Textarea value={npcForm.summary} onChange={e => setNpcForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief description…" rows={2} className="text-sm resize-none" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Relationship to character</Label>
                      <Input value={npcForm.relationship_description} onChange={e => setNpcForm(f => ({ ...f, relationship_description: e.target.value }))} placeholder="e.g. Childhood mentor, estranged sibling…" className="h-8 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="npc-visible" checked={npcForm.is_visible_to_players} onChange={e => setNpcForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} className="rounded" />
                      <Label htmlFor="npc-visible" className="text-xs cursor-pointer">Visible to players</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNpcForm(false)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleAddNpc} disabled={savingNpc || !npcForm.name.trim()}>
                        {savingNpc ? 'Saving…' : 'Create & Link NPC'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  {characterNpcs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No NPCs linked to this character yet.</p>
                  ) : (
                    characterNpcs.map(link => (
                      <div key={link.id} className="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
                        {link.npc_image_path ? (
                          <img src={`http://localhost:8000/${link.npc_image_path}`} alt={link.npc_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link to={`/campaigns/${campaignId}/npcs/${link.npc_id}`} className="font-medium text-sm hover:underline">
                            {link.npc_name}
                          </Link>
                          {(link.npc_race || link.npc_occupation) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[link.npc_race, link.npc_occupation].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {link.relationship_description && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{link.relationship_description}</p>
                          )}
                        </div>
                        {showEditable && (
                          <button onClick={() => handleRemoveNpc(link.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive" data-testid={`unlink-npc-${link.id}`}>
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Timeline Events */}
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div>
                    <h2 className="font-semibold text-sm">Timeline Events</h2>
                    {timelineEvents.length > 0 && (
                      <span className="text-xs text-muted-foreground">{timelineEvents.length} linked</span>
                    )}
                  </div>
                  {showEditable && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowEventForm(v => !v)} data-testid="timeline-events-toggle">
                      <Plus className="h-3 w-3" /> {showEventForm ? 'Cancel' : 'Add Event'}
                    </Button>
                  )}
                </div>

                {showEventForm && showEditable && (
                  <div className="p-4 border-b bg-muted/20 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Event Title *</Label>
                      <Input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Born in the village of Millhaven" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details about this event…" rows={2} className="text-sm resize-none" />
                    </div>
                    {calendarEras.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Era</Label>
                          <Select value={eventForm.era_id} onValueChange={v => setEventForm(f => ({ ...f, era_id: v }))}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Era…" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">No era</SelectItem>
                              {calendarEras.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Year</Label>
                          <Input value={eventForm.year} onChange={e => setEventForm(f => ({ ...f, year: e.target.value }))} placeholder="Year" className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Day</Label>
                          <Input type="number" value={eventForm.day} onChange={e => setEventForm(f => ({ ...f, day: e.target.value }))} placeholder="Day" className="h-8 text-sm" min={1} />
                        </div>
                      </div>
                    )}
                    {calendarMonths.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs">Month</Label>
                        <Select value={eventForm.month_order} onValueChange={v => setEventForm(f => ({ ...f, month_order: v }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Month…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">No month</SelectItem>
                            {calendarMonths.map(m => <SelectItem key={m.order_index} value={String(m.order_index)}>{m.name || `Month ${m.order_index}`}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Link note (optional)</Label>
                      <Input value={eventForm.link_description} onChange={e => setEventForm(f => ({ ...f, link_description: e.target.value }))} placeholder="e.g. Character's birthdate" className="h-8 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="event-visible" checked={eventForm.is_visible_to_players} onChange={e => setEventForm(f => ({ ...f, is_visible_to_players: e.target.checked }))} className="rounded" />
                      <Label htmlFor="event-visible" className="text-xs cursor-pointer">Visible to players</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowEventForm(false)}>Cancel</Button>
                      <Button size="sm" className="h-7 text-xs" onClick={handleAddEvent} disabled={savingEvent || !eventForm.title.trim()}>
                        {savingEvent ? 'Saving…' : 'Create Event'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  {timelineEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No timeline events linked to this character.</p>
                  ) : (
                    timelineEvents.map(link => (
                      <div key={link.id} className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{link.event_title}</div>
                          {link.era_dates?.length > 0 ? (
                            <div className="text-xs text-muted-foreground">
                              {link.era_dates.map((ed, i) => (
                                <span key={i}>{i > 0 && ' · '}{ed.year} {ed.abbreviation}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unknown date</span>
                          )}
                          {link.link_description && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{link.link_description}</p>
                          )}
                        </div>
                        {showEditable && (
                          <button onClick={() => handleRemoveEvent(link.id)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive flex-shrink-0" data-testid={`unlink-event-${link.id}`}>
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* GM Notes — inside narrative tab */}
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
            </TabsContent>

            {/* ── Tab 1: Stats ── */}
            <TabsContent value="stats" className="space-y-4">
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
                        {character?.character_data?.subrace && (
                          <p className="text-xs text-muted-foreground mt-0.5">Subrace: <span className="font-medium text-foreground">{character.character_data.subrace}</span></p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Level</Label>
                        <div className="rounded-md border bg-muted/30 px-3 py-2 text-center text-sm font-medium">
                          {identity.draft.level}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Background</Label>
                        <Input value={identity.draft.background} onChange={e => identity.setDraft(d => ({ ...d, background: e.target.value }))} />
                      </div>
                      {campaign?.use_alignment !== false && (
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
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline">{identity.draft.race || 'Unknown race'}</Badge>
                      {character?.character_data?.subrace && (
                        <Badge variant="outline">{character.character_data.subrace}</Badge>
                      )}
                      <Badge variant="outline">Level {identity.draft.level}</Badge>
                      {identity.draft.background && <Badge variant="outline">{identity.draft.background}</Badge>}
                      {campaign?.use_alignment !== false && identity.draft.alignment && <Badge variant="outline">{identity.draft.alignment}</Badge>}
                    </div>
                  )}

                  {/* Racial traits and languages */}
                  {(() => {
                    const cd = character?.character_data ?? {};
                    const allLanguages = [...new Set([...(cd.race_languages ?? []), ...(cd.background_languages ?? [])])];
                    const hasTraits = (cd.race_traits?.length ?? 0) > 0;
                    if (!hasTraits && allLanguages.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        {hasTraits && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Racial Traits</div>
                            <div className="flex flex-wrap gap-1.5">
                              {cd.race_traits.map(t => (
                                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {allLanguages.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Languages</div>
                            <div className="flex flex-wrap gap-1.5">
                              {allLanguages.map(l => (
                                <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Ability scores */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Ability Scores</div>
                    <div className="grid grid-cols-6 gap-2">
                      {ABILITY_LABELS.map(({ key, abbrev }) => (
                        <div key={key} className="flex flex-col items-center">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">{abbrev}</span>
                          <div className="rounded-md border w-full text-center py-2 font-bold">
                            {identity.draft[key]}
                          </div>
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
                                onClick={() => savingThrows.setDraft(d => ({ ...d, [save]: !d[save] }))}
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
                </div>
              </SectionCard>

              {/* Combat stats (HP, Hit Dice, AC, Speed) */}
              {ClassSheet && classSection.draft !== null && (
                <SectionCard
                  title="Hit Points & Movement"
                  isDirty={classSection.isDirty}
                  onSave={saveClassData}
                  onReset={classSection.reset}
                  canEdit={showEditable}
                >
                  <ClassSheet
                    data={classSection.draft}
                    onChange={patch => classSection.setDraft(d => ({ ...d, ...patch }))}
                    readOnly={displayAsPlayer || !canEdit}
                    level={identity.draft?.level ?? character.level}
                    section="stats"
                    abilityScores={{ intelligence: identity.draft?.intelligence ?? 10, wisdom: identity.draft?.wisdom ?? 10, charisma: identity.draft?.charisma ?? 10 }}
                  />
                </SectionCard>
              )}
            </TabsContent>

            {/* ── Tab 2: Features ── */}
            <TabsContent value="features" className="space-y-4">
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
                    section="features"
                    abilityScores={{ intelligence: identity.draft?.intelligence ?? 10, wisdom: identity.draft?.wisdom ?? 10, charisma: identity.draft?.charisma ?? 10 }}
                  />
                </SectionCard>
              )}
            </TabsContent>

            {/* ── Tab 3: Weapons & Armor ── */}
            <TabsContent value="gear">
              <div className="rounded-lg border bg-card p-8 text-center space-y-2">
                <Sword className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">Equipment &amp; Inventory</p>
                <p className="text-sm text-muted-foreground">Coming soon — weapons, armor, and gear will live here.</p>
              </div>
            </TabsContent>

            {/* ── Tab 4: Spells ── */}
            {hasSpells && (
              <TabsContent value="spells" className="space-y-4">
                {ClassSheet && classSection.draft !== null && SPELLCASTING_CLASSES.has(character.char_class) && (
                  <SectionCard
                    title="Spellcasting"
                    isDirty={classSection.isDirty}
                    onSave={saveClassData}
                    onReset={classSection.reset}
                    canEdit={showEditable}
                  >
                    <ClassSheet
                      data={classSection.draft}
                      onChange={patch => classSection.setDraft(d => ({ ...d, ...patch }))}
                      readOnly={displayAsPlayer || !canEdit}
                      level={identity.draft?.level ?? character.level}
                      section="spells"
                      abilityScores={{ intelligence: identity.draft?.intelligence ?? 10, wisdom: identity.draft?.wisdom ?? 10, charisma: identity.draft?.charisma ?? 10 }}
                    />
                  </SectionCard>
                )}
                {raceGrantedCantrips.length > 0 && (
                  <div className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Race-Granted Cantrips</div>
                    <div className="flex flex-wrap gap-1.5">
                      {raceGrantedCantrips.map(c => (
                        <Badge key={c} variant="secondary" className="text-sm">{c}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Always known. No spell slot required.</p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
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

// ─── Leveling Card ────────────────────────────────────────────────────────────

function LevelingCard({ character, campaign, isGm, isOwner, displayAsPlayer, xpInput, setXpInput, addingXp, onAddXp, onMilestoneLevelUp, onOpenWizard }) {
  const isXp = campaign?.leveling_type === 'experience';
  const level = character.level ?? 1;
  const xp = character.experience_points ?? 0;
  const nextLevelThreshold = level < 20 ? xpForLevel(level + 1) : null;
  const prevLevelThreshold = xpForLevel(level);
  const progressPct = nextLevelThreshold
    ? Math.min(100, Math.round(((xp - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100))
    : 100;

  const canLevelUp = isOwner && character.level_up_pending;
  const showGmControls = isGm && !displayAsPlayer;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Leveling</h2>
          <span className="text-xs text-muted-foreground">
            {campaign?.leveling_type === 'experience' ? 'Experience Points' : 'Milestone'}
          </span>
        </div>
        {showGmControls && campaign?.leveling_type === 'milestone' && !character.level_up_pending && (
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={onMilestoneLevelUp}>
            <Star className="h-3.5 w-3.5" /> Level Up
          </Button>
        )}
      </div>

      {isXp && (
        <div className="space-y-1.5">
          <div className="flex items-end justify-between text-xs">
            <span className="text-muted-foreground">Level {level}</span>
            {nextLevelThreshold ? (
              <span className="font-medium">{xp.toLocaleString()} / {nextLevelThreshold.toLocaleString()} XP</span>
            ) : (
              <span className="font-medium text-amber-600">{xp.toLocaleString()} XP · Max Level</span>
            )}
          </div>
          {nextLevelThreshold && (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {showGmControls && isXp && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Add XP…"
            value={xpInput}
            onChange={e => setXpInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAddXp()}
            className="h-8 w-28 text-sm"
          />
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onAddXp} disabled={addingXp || !xpInput}>
            <Plus className="h-3.5 w-3.5" /> Add XP
          </Button>
        </div>
      )}

      {canLevelUp && (
        <button
          type="button"
          onClick={onOpenWizard}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-300 text-amber-800 dark:text-amber-300 text-sm font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
        >
          <Star className="h-4 w-4" />
          Level Up Available! — Click to open wizard
        </button>
      )}

      {isGm && !displayAsPlayer && character.level_up_pending && (
        <p className="text-xs text-amber-600">
          Waiting for {isOwner ? 'you' : 'player'} to complete the level-up wizard.
        </p>
      )}
    </div>
  );
}

function LevelUpWizard({ character, campaign, onComplete, onClose }) {
  const [LevelUpWizardComponent, setComponent] = React.useState(null);
  React.useEffect(() => {
    import('../components/LevelUpWizard').then(m => setComponent(() => m.default)).catch(() => {});
  }, []);
  if (!LevelUpWizardComponent) return null;
  return <LevelUpWizardComponent character={character} campaign={campaign} onComplete={onComplete} onClose={onClose} />;
}

// ─────────────────────────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children, isDirty, onSave, onReset, canEdit, variant, extraHeader }) {
  return (
    <div className={cn(
      'rounded-lg border bg-card',
      variant === 'amber' && 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20',
      variant === 'personal' && 'border-blue-200 bg-blue-50/30 dark:bg-blue-950/10',
    )}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h2 className={cn(
            'font-semibold text-sm',
            variant === 'amber' && 'text-amber-800 dark:text-amber-300',
            variant === 'personal' && 'text-blue-700 dark:text-blue-300',
          )}>
            {title}
            {variant === 'amber' && <span className="ml-2 text-xs font-normal opacity-70">Private</span>}
            {variant === 'personal' && <span className="ml-2 text-xs font-normal opacity-70">Personal</span>}
          </h2>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {extraHeader}
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
