import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft, Eye, EyeOff, Trash2, Save, RotateCcw, TrendingUp, Star, Plus, Wand2, Shield,
  Sword, Swords, Zap, BookOpen, Music, User, X, Upload, Clock, ArrowUpRight,
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
import MusicPlayer from '../../shared/components/MusicPlayer';
import characterService, { mapCharacterImageUrl } from '../characterService';
import TraitBadgeList from '@/characters/components/race/TraitBadge';
import { getRaceGrantedSkillsFromTraits } from '@/characters/components/race/raceProficienciesData';
import { getBackgroundSkills } from '@/characters/components/race/backgroundSkillsData';
import { getFeatGrantedSkills } from '@/characters/components/feats/featProficiencyData';
import RacialResourceTracker from '@/characters/components/race/RacialResourceTracker';
import RestUseControl from '@/characters/components/race/RestUseControl';
import JumpCard from '@/characters/components/combat/JumpCard';
import WalletCard from '@/characters/components/inventory/WalletCard';
import { armorSpeedPenalty, wornNonProficientArmor, stealthDisadvantageArmor } from '@/characters/components/inventory/inventoryData';
import InventoryTab from '@/characters/components/inventory/InventoryTab';
import ActionEconomyTab from '@/characters/components/combat/ActionEconomyTab';
import FeatsSubTab from '@/characters/components/feats/FeatsSubTab';
import { getFeatStatMods, getFeatStatModSources, getFeatSaveProficiencies } from '@/characters/components/feats/featEffects';
import { computePassiveScores } from '@/characters/components/skills/passiveSkills';
import { skillBreakdown, saveBreakdown } from '@/characters/components/skills/skillMath';
import BreakdownValue, { BreakdownPanel } from '@/characters/components/skills/BreakdownValue';
import SaveFeaturesPanel from '@/characters/components/skills/SaveFeaturesPanel';
import DefensesPanel from '@/characters/components/defenses/DefensesPanel';
import { hasDefenses } from '@/characters/components/defenses/defenses';
import { getClassConfig } from '@/characters/components/sheets/classSheet/configs';
import { getCasterDescriptor } from '@/characters/components/classData/casterDescriptors';
import { MaxHpValue } from '@/characters/components/combat/CombatBonusInline';
import { hpRollBase, effectiveMaxHp as computeEffectiveMaxHp, remarkableAthlete } from '@/characters/components/combat/combatBonuses';
import { initiativeBreakdown, initiativeFeatNote } from '@/characters/components/combat/initiativeData';
import { draconicLabel } from '@/characters/components/subclass/draconicData';
import SpellLevelTabs from '@/characters/components/spells/SpellLevelTabs';
import FeatSpellsSection from '@/characters/components/feats/FeatSpellsSection';
import { getFeatGrantedSpells } from '@/characters/components/feats/featEffects';
import { getRacialSpellResources } from '@/characters/components/race/racialRestResources';
import { hasRelentlessEndurance, RELENTLESS_ENDURANCE_NOTE } from '@/characters/components/race/raceCombatNotes';
import { computeRaceGrantedCantrips } from '@/characters/components/race/raceCantrips';
import { survivorNote, heroicWarriorNote } from '@/characters/components/subclass/subclassCombatNotes';
import { getSubclassCaster } from '@/characters/components/classData/subclassCasterData';
import InspirationCard from '@/characters/components/combat/InspirationCard';
import settingsService from '../../settings/settingsService';
import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';
import {
  ArtificerSheet,
  BarbarianSheet, BardSheet, ClericSheet, DruidSheet,
  FighterSheet, MonkSheet, PaladinSheet, RangerSheet,
  RogueSheet, SorcererSheet, WarlockSheet, WizardSheet,
} from '@/characters/components/sheets';
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
} from '@/characters/components/sheets/2024';
import { cn } from '@/lib/utils';

// Racial rest-resource keys that are HP mechanics — tracked in the HP & Movement
// sub-tab, between Max HP and Hit Dice.
const HP_ADJACENT_RACIAL_KEYS = ['relentless_endurance_used'];

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

// The top of the 5e XP table (level 20). XP stops meaning anything past it — there is no
// level 21 to earn — so a GM's award is clamped here rather than letting the total run away.
// The backend clamps too (players/characters/service.py); this one keeps the UI honest
// immediately instead of showing a number the save will silently change.
export const MAX_XP = XP_THRESHOLDS[20];

function mod(score) { return Math.floor((score - 10) / 2); }
function modStr(score) { const m = mod(score); return m >= 0 ? `+${m}` : `${m}`; }
function profBonus(level) { return Math.ceil(level / 4) + 1; }

const CLASS_SHEETS_5E = {
  Artificer: ArtificerSheet,
  Barbarian: BarbarianSheet, Bard: BardSheet, Cleric: ClericSheet, Druid: DruidSheet,
  Fighter: FighterSheet, Monk: MonkSheet, Paladin: PaladinSheet, Ranger: RangerSheet,
  Rogue: RogueSheet, Sorcerer: SorcererSheet, Warlock: WarlockSheet, Wizard: WizardSheet,
};

const CLASS_SHEETS_2024 = {
  Barbarian: BarbarianSheet2024, Bard: BardSheet2024, Cleric: ClericSheet2024, Druid: DruidSheet2024,
  Fighter: FighterSheet2024, Monk: MonkSheet2024, Paladin: PaladinSheet2024, Ranger: RangerSheet2024,
  Rogue: RogueSheet2024, Sorcerer: SorcererSheet2024, Warlock: WarlockSheet2024, Wizard: WizardSheet2024,
};

const SPELLCASTING_CLASSES = new Set(['Artificer', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']);

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const NPC_STATUSES = ['alive', 'dead', 'missing', 'unknown'];

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
  const [gmEdit, setGmEdit] = useState(false); // GM Edit toggle: unlocks permanent choices (Epic 1)
  const [featuresSubTab, setFeaturesSubTab] = useState('class'); // 'class' | 'feats'
  const [statsSubTab, setStatsSubTab] = useState('identity'); // 'identity' | 'abilities' | 'hp'
  // Which derived number has its arithmetic expanded: 'initiative' | `save:${ability}` |
  // `passive:${key}`. One at a time. (Skills keep their own equivalent state in SkillsDisplay.)
  const [openStat, setOpenStat] = useState(null);
  const [spellSource, setSpellSource] = useState('class'); // Spells tab source sub-tab: 'class' | 'racial' | 'feats'

  const [xpInput, setXpInput] = useState('');
  const [addingXp, setAddingXp] = useState(false);
  const [levelUpWizardOpen, setLevelUpWizardOpen] = useState(false);

  // Narrative state
  const [backstoryPreview, setBackstoryPreview] = useState(false);
  const [publicNotesPreview, setPublicNotesPreview] = useState(false);
  const [personalNotesPreview, setPersonalNotesPreview] = useState(false);
  const [portraitUploading, setPortraitUploading] = useState(false);
  const portraitInputRef = useRef(null);
  const [musicUploading, setMusicUploading] = useState(false);
  const musicInputRef = useRef(null);

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
      savingThrows.commit({ ...savingThrows.draft });
    });
  };

  // Keep a ref of the latest class data so back-to-back resource clicks (e.g. casting
  // several slots in a row) don't race on stale React state when auto-saving.
  const classDraftRef = useRef(null);
  useEffect(() => { classDraftRef.current = classSection.draft; }, [classSection.draft]);

  // Live resource interactions — spell slots, casting, arcane recovery, racial uses —
  // must persist immediately; players don't click a separate "Save" for these, and an
  // unsaved cast looks like the rest "restored" the slot. Each of these interactions
  // commits a discrete value (never per-keystroke), so an immediate PUT is safe.
  const autoSaveClassPatch = async (patch) => {
    const next = { ...(classDraftRef.current ?? {}), ...patch };
    classDraftRef.current = next;
    classSection.setDraft(next);
    const merged = { ...next, ...(savingThrows.draft ?? {}) };
    const result = await characterService.updateCharacter(characterId, { character_data: merged });
    if (result.success) {
      setCharacter(result.data);
      classSection.commit(result.data.character_data ?? merged);
    } else {
      setError(result.error);
    }
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
    // Clamp at the level-20 threshold: an over-award tops out rather than overflowing.
    const newXp = Math.min(MAX_XP, (character.experience_points ?? 0) + toAdd);
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

  const handleLevelUpComplete = async (newLevel, newCharacterData, extraUpdates = {}) => {
    // extraUpdates carries top-level character fields changed by level-up (e.g. ability
    // score increases from an ASI). character_data holds everything else.
    const result = await characterService.updateCharacter(characterId, {
      level: newLevel,
      character_data: newCharacterData,
      level_up_pending: false,
      ...extraUpdates,
    });
    if (result.success) {
      setCharacter(result.data);
      identity.commit({ ...identity.draft, level: newLevel, ...extraUpdates });
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

  const handleMusicUpload = async (file) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError('Audio must be under 50 MB'); return; }
    setMusicUploading(true);
    const result = await characterService.uploadMusic(characterId, file);
    setMusicUploading(false);
    if (result.success) {
      setCharacter(result.data);
      narrativeMeta.commit({ theme_music_url: result.data.theme_music_url ?? '' });
    } else {
      setError(result.error);
    }
  };

  const handleMusicDelete = async () => {
    const result = await characterService.deleteMusic(characterId);
    if (result.success) {
      setCharacter(result.data);
      narrativeMeta.commit({ theme_music_url: result.data.theme_music_url ?? '' });
    } else {
      setError(result.error);
    }
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

  // Armor worn without proficiency (RAW, both editions): disadvantage on STR/DEX ability
  // checks, saving throws, and attack rolls, and no spellcasting. Drives the saves note,
  // the skill "dis" tags, and the Spells-tab banner; the per-attack disadvantage is folded
  // in by getAttacks (Items + Action Economy tabs).
  const nonProfArmor = wornNonProficientArmor({
    inventory: (classSection.draft ?? character.character_data)?.inventory,
    charClass: character.char_class,
    characterData: classSection.draft ?? character.character_data ?? {},
  });
  // Bulky armor (Chain Mail, Half Plate, …) gives disadvantage on Dexterity (Stealth)
  // checks — independent of proficiency, and cancelled for medium armor by Medium Armor
  // Master. Drives the Stealth "dis" tag on the Abilities & Skills panel.
  const stealthArmor = stealthDisadvantageArmor(
    (classSection.draft ?? character.character_data)?.inventory ?? [],
    { feats: (classSection.draft ?? character.character_data)?.feats ?? [] },
  );
  const edition = campaign?.edition || '5e';
  const ClassSheet = (edition === '5.5e' ? CLASS_SHEETS_2024 : CLASS_SHEETS_5E)[character.char_class];

  const raceGrantedCantrips = computeRaceGrantedCantrips(character);
  // Leveled racial spells (Infernal Legacy's Hellish Rebuke, Drow Magic's Faerie Fire …) — each is
  // a once-per-rest use, so it comes from the same table that drives the Racial Features tracker.
  const raceGrantedLeveled = getRacialSpellResources(
    character.character_data?.race_traits ?? [],
    identity.draft?.level ?? character.level,
  );
  const featGrantedSpells = getFeatGrantedSpells(character.character_data?.feats);
  const hasFeatSpells = featGrantedSpells.cantrips.length + featGrantedSpells.leveled.length + featGrantedSpells.ritualBooks.length > 0;
  // Class-source spellcasting: a spellcasting class, or a caster SUBCLASS (Eldritch Knight
  // Fighter) once its spellcasting feature is earned.
  const subclassCaster = !!getSubclassCaster(
    character.char_class,
    edition,
    (classSection.draft ?? character.character_data)?.subclass,
    character.level,
  );
  // Cantrips granted by a SUBCLASS feature (Arcane Archer Lore) — stored by the subclass-grant
  // mechanism, shown as their own Spells-tab source the way race-granted cantrips are.
  const subclassCantrips = (classSection.draft ?? character.character_data)?.subclass_cantrips ?? [];
  const hasSpells = SPELLCASTING_CLASSES.has(character.char_class) || subclassCaster
    || raceGrantedCantrips.length > 0 || raceGrantedLeveled.length > 0
    || subclassCantrips.length > 0 || hasFeatSpells;
  const tabCount = hasSpells ? 6 : 5;

  const calendarEras = calendar?.eras ?? [];
  const calendarMonths = calendar?.months ?? [];

  // HP-adjacent racial resources (Half-Orc Relentless Endurance) live with HP: data-driven
  // sheets render the tracker between Max HP and Hit Dice via the CombatBlock `afterHpNode`
  // slot; hand-written sheets show it right below their combat block until they migrate
  // (same interim pattern as the feat speed note).
  const hpAdjacentRacialNode = classSection.draft !== null ? (
    <RacialResourceTracker
      traits={character?.character_data?.race_traits ?? []}
      level={identity.draft?.level ?? character.level}
      data={classSection.draft}
      onChange={autoSaveClassPatch}
      readOnly={!showEditable}
      includeKeys={HP_ADJACENT_RACIAL_KEYS}
    />
  ) : null;

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
            {isGm && !playerView && (
              <Button
                variant={gmEdit ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGmEdit(v => !v)}
                data-testid="gm-edit-toggle"
                title="Unlock permanent choices (subclass, fighting style) for editing"
              >
                {gmEdit ? 'GM Edit: On' : 'GM Edit: Off'}
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
            isGm={isGm && !playerView}
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
              <TabsTrigger value="items" className="flex items-center gap-1.5">
                <Sword className="h-3.5 w-3.5" /> Items
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5" /> Action Economy
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
                <div className="space-y-3">
                  {showEditable && (
                    <>
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                          value={narrativeMeta.draft.theme_music_url}
                          onChange={e => narrativeMeta.setDraft(d => ({ ...d, theme_music_url: e.target.value }))}
                          placeholder="Paste a Spotify, YouTube, or audio link…"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={musicInputRef}
                          type="file"
                          accept="audio/*,video/mp4,.mp3,.ogg,.wav,.m4a,.aac,.flac,.mp4,.webm"
                          className="hidden"
                          onChange={e => { handleMusicUpload(e.target.files?.[0]); e.target.value = ''; }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => musicInputRef.current?.click()}
                          disabled={musicUploading}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {musicUploading ? 'Uploading…' : 'Upload audio'}
                        </Button>
                        {narrativeMeta.draft.theme_music_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={handleMusicDelete}>
                            <X className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  {narrativeMeta.draft.theme_music_url ? (
                    <MusicPlayer src={narrativeMeta.draft.theme_music_url} />
                  ) : (
                    !showEditable && <p className="text-sm text-muted-foreground">No theme music set.</p>
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
              {/* Identity / Abilities / HP & Movement sub-tab toggle (same pattern as the
                  Features tab) — the Stats tab was one long column; these split it. */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={statsSubTab === 'identity' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatsSubTab('identity')}
                  data-testid="stats-subtab-identity"
                >
                  Identity
                </Button>
                <Button
                  type="button"
                  variant={statsSubTab === 'abilities' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatsSubTab('abilities')}
                  data-testid="stats-subtab-abilities"
                >
                  Abilities & Skills
                </Button>
                <Button
                  type="button"
                  variant={statsSubTab === 'hp' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatsSubTab('hp')}
                  data-testid="stats-subtab-hp"
                >
                  HP & Movement
                </Button>
              </div>

              {statsSubTab === 'identity' && (<>
              <SectionCard
                title="Identity"
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
                        {character?.character_data?.draconic_bloodline?.name && (
                          <p className="text-xs text-muted-foreground mt-0.5">Draconic Ancestry: <span className="font-medium text-foreground">{draconicLabel(character.character_data.draconic_bloodline)}</span></p>
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
                      {character?.character_data?.draconic_bloodline?.name && (
                        <Badge variant="outline">{draconicLabel(character.character_data.draconic_bloodline)}</Badge>
                      )}
                      <Badge variant="outline">Level {identity.draft.level}</Badge>
                      {identity.draft.background && <Badge variant="outline">{identity.draft.background}</Badge>}
                      {campaign?.use_alignment !== false && identity.draft.alignment && <Badge variant="outline">{identity.draft.alignment}</Badge>}
                    </div>
                  )}

                  {/* Racial traits and languages */}
                  {(() => {
                    const cd = character?.character_data ?? {};
                    const raceLangs = [...new Set(cd.race_languages ?? [])];
                    const raceSet = new Set(raceLangs);
                    const bgLangs = [...new Set(cd.background_languages ?? [])].filter(l => !raceSet.has(l));
                    const bgSet = new Set(bgLangs);
                    const featLangs = [...new Set(cd.feat_languages ?? [])].filter(l => !raceSet.has(l) && !bgSet.has(l));
                    const featSet = new Set(featLangs);
                    // A subclass grant can hand out a language instead of a skill (Cavalier /
                    // Samurai "Bonus Proficiency"), so it gets its own source group here.
                    const subclassLangs = [...new Set(cd.subclass_languages ?? [])]
                      .filter(l => !raceSet.has(l) && !bgSet.has(l) && !featSet.has(l));
                    const hasTraits = (cd.race_traits?.length ?? 0) > 0;
                    const anyLangs = raceLangs.length > 0 || bgLangs.length > 0
                      || featLangs.length > 0 || subclassLangs.length > 0;
                    if (!hasTraits && !anyLangs) return null;
                    return (
                      <div className="space-y-2">
                        {hasTraits && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Racial Traits <span className="font-normal normal-case text-muted-foreground/70">(click to learn more)</span></div>
                            <TraitBadgeList traits={cd.race_traits} />
                          </div>
                        )}
                        {anyLangs && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Languages</div>
                            <div className="space-y-1.5">
                              {raceLangs.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wide">From Race</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {raceLangs.map(l => (
                                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {bgLangs.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wide">From Background</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {bgLangs.map(l => (
                                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {featLangs.length > 0 && (
                                <div data-testid="languages-from-feats">
                                  <div className="text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wide">From Feats</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {featLangs.map(l => (
                                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {subclassLangs.length > 0 && (
                                <div data-testid="languages-from-subclass">
                                  <div className="text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wide">From Subclass</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {subclassLangs.map(l => (
                                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </SectionCard>
              </>)}

              {statsSubTab === 'abilities' && (
              <SectionCard
                title="Abilities, Saves & Skills"
                isDirty={savingThrows.isDirty}
                onSave={saveClassData}
                onReset={savingThrows.reset}
                canEdit={showEditable}
              >
                <div className="space-y-4">
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

                  {/* Derived stats row (Inspiration has its own card below) */}
                  <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div className="rounded-md border py-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Prof. Bonus</div>
                      <div className="font-bold">+{pb}</div>
                    </div>
                    <div className="rounded-md border py-2 px-2">
                      <div className="text-[10px] text-muted-foreground uppercase">Initiative</div>
                      {(() => {
                        const { breakdown, featSources: sources, advantage } = initiativeBreakdown({
                          dexterity: identity.draft.dexterity,
                          feats: classSection.draft?.feats ?? character.character_data?.feats ?? [],
                          pb,
                          charClass: character.char_class,
                          subclass: classSection.draft?.subclass ?? character.character_data?.subclass,
                          level: character.level,
                          edition,
                        });
                        return (
                          <>
                            <BreakdownValue
                              testId="initiative-value"
                              label="Initiative"
                              breakdown={breakdown}
                              className="font-bold"
                              expanded={openStat === 'initiative'}
                              onToggle={() => setOpenStat(openStat === 'initiative' ? null : 'initiative')}
                            />
                            {openStat === 'initiative' && (
                              <BreakdownPanel testId="initiative-breakdown" breakdown={breakdown} />
                            )}
                            {sources.length > 0 && (
                              <div className="text-[9px] text-emerald-600 leading-tight" data-testid="initiative-feat-note">
                                {initiativeFeatNote(sources)}
                              </div>
                            )}
                            {advantage && (
                              <div className="text-[9px] text-teal-600 leading-tight" data-testid="initiative-advantage-note">
                                Advantage (Remarkable Athlete)
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Passive scores — 10 + the skill's own modifier, so proficiency and
                      expertise count. Only the three passives tables actually use. */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Passive Scores</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      {computePassiveScores({
                        abilityScores: identity.draft,
                        pb,
                        classData: classSection.draft ?? character.character_data ?? {},
                        feats: classSection.draft?.feats ?? character.character_data?.feats ?? [],
                      }).map((p) => (
                        <div key={p.key} className="rounded-md border py-2 px-2" data-testid={`passive-${p.key}`}>
                          <div className="text-[10px] text-muted-foreground uppercase">{p.label}</div>
                          <BreakdownValue
                            testId={`passive-${p.key}-value`}
                            label={`passive ${p.label}`}
                            breakdown={p.breakdown}
                            signed={false}
                            className="font-bold"
                            expanded={openStat === `passive:${p.key}`}
                            onToggle={() => setOpenStat(openStat === `passive:${p.key}` ? null : `passive:${p.key}`)}
                          />
                          {p.featSources.length > 0 && (
                            <div className="text-[9px] text-emerald-600 leading-tight mt-0.5" data-testid={`passive-${p.key}-feat-note`}>
                              {p.featSources.map((s) => `+${s.amount} ${s.source}`).join(', ')}
                            </div>
                          )}
                          {openStat === `passive:${p.key}` && (
                            <BreakdownPanel testId={`passive-${p.key}-breakdown`} breakdown={p.breakdown} signed={false} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Saving Throws */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Saving Throws</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ABILITY_LABELS.map(({ key, abbrev, save }) => {
                        const featSaves = getFeatSaveProficiencies(classSection.draft?.feats ?? character.character_data?.feats ?? []);
                        const isProficient = (savingThrows.draft?.[save] ?? false) || featSaves.includes(key);
                        const armorDisadvantage = Boolean(nonProfArmor) && (key === 'strength' || key === 'dexterity');
                        const breakdown = saveBreakdown({
                          ability: key,
                          abilityScore: identity.draft[key],
                          pb,
                          isProficient,
                          notes: [armorDisadvantage && `Disadvantage — wearing ${nonProfArmor.name} without proficiency`],
                        });
                        return (
                          <div key={key} data-testid={`save-${key}`} className="rounded border px-2 py-1.5 text-sm">
                            <div className="flex items-center gap-2">
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
                              <BreakdownValue
                                testId={`save-bonus-${key}`}
                                label={`the ${abbrev} saving throw`}
                                breakdown={breakdown}
                                className="font-medium text-xs"
                                expanded={openStat === `save:${key}`}
                                onToggle={() => setOpenStat(openStat === `save:${key}` ? null : `save:${key}`)}
                              />
                            </div>
                            {openStat === `save:${key}` && (
                              <BreakdownPanel testId={`save-breakdown-${key}`} breakdown={breakdown} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {nonProfArmor && (
                      <p className="text-[10px] text-amber-600 mt-1" data-testid="saves-armor-warning">
                        STR &amp; DEX saving throws at disadvantage — wearing {nonProfArmor.name} without proficiency.
                      </p>
                    )}
                  </div>

                  {/* Features that change how the character's own saves work — advantage,
                      rerolls, situational bonuses. The grid above can only show a number. */}
                  <SaveFeaturesPanel
                    charClass={character.char_class}
                    subclass={classSection.draft?.subclass ?? character?.character_data?.subclass}
                    level={character.level}
                    edition={edition}
                  />

                  {/* Skills */}
                  <SkillsDisplay
                    identityDraft={identity.draft}
                    classData={classSection.draft}
                    pb={pb}
                    charClass={character.char_class}
                    level={character.level}
                    edition={edition}
                    readOnly={displayAsPlayer || !canEdit}
                    nonProfArmorName={nonProfArmor?.name}
                    stealthArmorName={stealthArmor?.name}
                  />
                </div>
              </SectionCard>
              )}

              {/* Inspiration — simple counter (default 0); persists immediately. Surfaces the
                  2024 Champion Fighter's Heroic Warrior reminder, which lands on inspiration. */}
              {statsSubTab === 'identity' && classSection.draft !== null && (() => {
                const raw = classSection.draft?.inspiration;
                const value = typeof raw === 'number' ? raw : (raw ? 1 : 0);
                return (
                  <InspirationCard
                    value={value}
                    onChange={(v) => autoSaveClassPatch({ inspiration: v })}
                    readOnly={!showEditable}
                    note={heroicWarriorNote({
                      charClass: character.char_class,
                      subclass: classSection.draft?.subclass ?? character?.character_data?.subclass,
                      level: identity.draft?.level ?? character.level,
                      edition,
                    })}
                  />
                );
              })()}

              {/* Combat stats (HP, Hit Dice, AC, Speed) */}
              {statsSubTab === 'hp' && ClassSheet && classSection.draft !== null && (
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
                    onHeal={autoSaveClassPatch}
                    effectiveMaxHp={
                      computeEffectiveMaxHp(classSection.draft ?? {}, {
                        level: identity.draft?.level ?? character.level,
                        conMod: Math.floor(((identity.draft?.constitution ?? character.constitution ?? 10) - 10) / 2),
                        charClass: character.char_class,
                        subclass: classSection.draft?.subclass,
                        raceTraits: character?.character_data?.race_traits ?? [],
                        feats: character?.character_data?.feats ?? [],
                      })
                    }
                    readOnly={!showEditable}
                    gmEdit={gmEdit}
                    isGm={isGm && !playerView}
                    level={identity.draft?.level ?? character.level}
                    section="stats"
                    scores={identity.draft ?? {}}
                    abilityScores={{ intelligence: identity.draft?.intelligence ?? 10, wisdom: identity.draft?.wisdom ?? 10, charisma: identity.draft?.charisma ?? 10 }}
                    /* HP/AC bonuses (display-only) folded into the sheet — Max HP shows the effective total + source, AC options under the AC field */
                    maxHpNode={
                      <MaxHpValue
                        charClass={character.char_class}
                        subclass={classSection.draft?.subclass}
                        raceTraits={character?.character_data?.race_traits ?? []}
                        feats={character?.character_data?.feats ?? []}
                        level={identity.draft?.level ?? character.level}
                        conMod={Math.floor(((identity.draft?.constitution ?? character.constitution ?? 10) - 10) / 2)}
                        baseMaxHp={hpRollBase(classSection.draft ?? {}, {
                          level: identity.draft?.level ?? character.level,
                          conMod: Math.floor(((identity.draft?.constitution ?? character.constitution ?? 10) - 10) / 2),
                        })}
                      />
                    }
                    afterHpNode={hpAdjacentRacialNode}
                  />
                  {/* Hand-written sheets don't support the afterHpNode slot yet — show the
                      HP-adjacent racial tracker right below their combat block instead. */}
                  {!getClassConfig(character.char_class, edition) && hpAdjacentRacialNode}
                  {/* Feat speed bonus (e.g. Mobile +10). Data-driven sheets (Fighter/Wizard) fold it
                      into CombatBlock's Total Speed, so only the hand-written sheets — which can't yet —
                      show this central annotation. Drops away as classes migrate to the config. */}
                  {(() => {
                    const feats = classSection.draft?.feats ?? character.character_data?.feats ?? [];
                    const featSpeed = getFeatStatMods(feats, 'speed', { pb });
                    if (!featSpeed || getClassConfig(character.char_class, edition)) return null;
                    const sources = getFeatStatModSources(feats, 'speed', { pb });
                    return (
                      <div className="mt-2 text-xs text-emerald-600" data-testid="speed-feat-note">
                        +{featSpeed} ft speed from {sources.map((s) => s.source).join(', ')}
                      </div>
                    );
                  })()}
                  {/* Armor Strength-requirement speed penalty (−10 ft). Data-driven sheets fold it
                      into CombatBlock's Total Speed; hand-written sheets show this annotation. */}
                  {(() => {
                    if (getClassConfig(character.char_class, edition)) return null;
                    const inv = classSection.draft?.inventory ?? character.character_data?.inventory ?? [];
                    const penalty = armorSpeedPenalty(inv, identity.draft ?? {});
                    return penalty ? (
                      <div className="mt-2 text-xs text-amber-600" data-testid="speed-armor-note">
                        −{penalty.penalty} ft speed: {penalty.name} requires Strength {penalty.required} (you have {penalty.str}).
                      </div>
                    ) : null;
                  })()}
                  {hasRelentlessEndurance(character?.character_data?.race_traits) && (
                    <div
                      className="mt-2 text-[11px] text-emerald-600 leading-tight"
                      data-testid="relentless-endurance-note"
                    >
                      {RELENTLESS_ENDURANCE_NOTE}
                    </div>
                  )}
                  {(() => {
                    const note = survivorNote({
                      charClass: character.char_class,
                      subclass: classSection.draft?.subclass ?? character?.character_data?.subclass,
                      level: identity.draft?.level ?? character.level,
                      edition,
                      conMod: Math.floor(((identity.draft?.constitution ?? character.constitution ?? 10) - 10) / 2),
                    });
                    return note ? (
                      <div
                        className="mt-2 text-[11px] text-emerald-600 leading-tight"
                        data-testid="survivor-note"
                      >
                        {note}
                      </div>
                    ) : null;
                  })()}
                  <div className="flex justify-end mt-1">
                    <Link
                      to={`/campaigns/${campaignId}/encyclopedia/mechanics/hit-dice`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      data-testid="hit-dice-learn-more"
                    >
                      How Hit Dice work <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </SectionCard>
              )}

              {/* Damage resistances / immunities / flat reductions. Rendered centrally rather
                  than through a sheet slot, so it works for data-driven AND hand-written
                  sheets alike — unlike the afterHpNode tracker above. Renders nothing when
                  the character has no defenses. */}
              {statsSubTab === 'hp' && (() => {
                const defenseCtx = {
                  charClass: character.char_class,
                  subclass: classSection.draft?.subclass ?? character?.character_data?.subclass,
                  level: identity.draft?.level ?? character.level,
                  edition,
                  characterData: {
                    ...(character?.character_data ?? {}),
                    ...(classSection.draft ?? {}),
                  },
                  pb,
                  campaignId,
                };
                // Gate the CARD, not just its contents — an empty titled card is worse than
                // no card, and the panel alone can only render null inside one.
                if (!hasDefenses(defenseCtx)) return null;
                return (
                  <SectionCard title="Defenses" canEdit={false}>
                    <DefensesPanel {...defenseCtx} />
                  </SectionCard>
                );
              })()}

              {/* Jumping — computed long/high jump distances (display-only); links to the mechanics page */}
              {statsSubTab === 'hp' && (
                <JumpCard
                  strength={identity.draft?.strength ?? character.strength}
                  feats={character?.character_data?.feats ?? []}
                  charClass={character.char_class}
                  subclass={classSection.draft?.subclass ?? character?.character_data?.subclass}
                  level={character.level}
                  edition={edition}
                />
              )}

              {/* No Racial Features card here. Every rest-rechargeable racial resource is
                  shown by the surface that owns its mechanic, each carrying its own Use
                  control writing the same `<key>_used`: Breath Weapon → the Action Economy
                  tab, Relentless Endurance → the HP & Movement sub-tab (hpAdjacentRacialNode),
                  the Drow Magic / Infernal Legacy spells → their Spells-tab rows. A generic
                  card here could only ever repeat one of those. */}
            </TabsContent>

            {/* ── Tab 2: Features ── */}
            <TabsContent value="features" className="space-y-4">
              {/* Class Features / Feats sub-tab toggle — feats apply to every class, so the
                  toggle lives here (not inside any one class sheet). */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={featuresSubTab === 'class' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeaturesSubTab('class')}
                  data-testid="features-subtab-class"
                >
                  Class Features
                </Button>
                <Button
                  type="button"
                  variant={featuresSubTab === 'feats' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeaturesSubTab('feats')}
                  data-testid="features-subtab-feats"
                >
                  Feats
                </Button>
              </div>

              {featuresSubTab === 'class' && ClassSheet && classSection.draft !== null && (
                <SectionCard
                  title={`${character.char_class} Features`}
                  isDirty={classSection.isDirty}
                  onSave={saveClassData}
                  onReset={classSection.reset}
                  canEdit={showEditable}
                >
                  <ClassSheet
                    data={classSection.draft}
                    onChange={patch => classSection.setDraft(d => ({ ...d, ...patch }))}
                    readOnly={!showEditable}
                    gmEdit={gmEdit}
                    isGm={isGm && !playerView}
                    level={identity.draft?.level ?? character.level}
                    section="features"
                    scores={identity.draft ?? {}}
                    abilityScores={{ intelligence: identity.draft?.intelligence ?? 10, wisdom: identity.draft?.wisdom ?? 10, charisma: identity.draft?.charisma ?? 10 }}
                  />
                </SectionCard>
              )}

              {featuresSubTab === 'feats' && (
                <SectionCard title="Feats" canEdit={false}>
                  <FeatsSubTab
                    feats={classSection.draft?.feats ?? character.character_data?.feats ?? []}
                    campaignId={campaignId}
                    edition={edition}
                    canManage={isGm && !playerView}
                    onChange={autoSaveClassPatch}
                    characterData={classSection.draft ?? character.character_data ?? {}}
                    readOnly={!showEditable}
                    pb={pb}
                  />
                </SectionCard>
              )}
            </TabsContent>

            {/* ── Tab 3: Items ── */}
            <TabsContent value="items" className="space-y-4">
              {/* Wallet — coins held by the character (mode set by campaign currency_type) */}
              {classSection.draft !== null && (
                <SectionCard
                  title="Wallet"
                  isDirty={classSection.isDirty}
                  onSave={saveClassData}
                  onReset={classSection.reset}
                  canEdit={showEditable}
                >
                  <WalletCard
                    currency={classSection.draft.currency}
                    mode={campaign?.currency_type}
                    onChange={(c) => classSection.setDraft(d => ({ ...d, currency: c }))}
                    readOnly={!showEditable}
                  />
                </SectionCard>
              )}
              {/* Inventory — categories, equip/attune, computed AC + attacks */}
              {classSection.draft !== null && (
                <InventoryTab
                  inventory={classSection.draft.inventory ?? []}
                  scores={identity.draft ?? {}}
                  level={identity.draft?.level ?? character.level}
                  charClass={character.char_class}
                  subclass={classSection.draft.subclass}
                  race={identity.draft?.race ?? character.race}
                  subrace={character?.character_data?.subrace}
                  campaignId={campaignId}
                  characterData={classSection.draft}
                  edition={edition}
                  readOnly={!showEditable}
                  onChange={autoSaveClassPatch}
                  isGm={isGm && !playerView}
                />
              )}
            </TabsContent>

            {/* ── Tab 4: Action Economy ── */}
            <TabsContent value="actions" className="space-y-4">
              {classSection.draft !== null && (
                <ActionEconomyTab
                  charClass={character.char_class}
                  subclass={classSection.draft.subclass}
                  level={identity.draft?.level ?? character.level}
                  edition={edition}
                  characterData={classSection.draft}
                  inventory={classSection.draft.inventory ?? []}
                  scores={identity.draft ?? {}}
                  race={identity.draft?.race ?? character.race}
                  subrace={character?.character_data?.subrace}
                  campaignId={campaignId}
                  onChange={autoSaveClassPatch}
                  readOnly={!showEditable}
                  isGm={isGm && !playerView}
                />
              )}
            </TabsContent>

            {/* ── Tab 5: Spells ── */}
            {hasSpells && (
              <TabsContent value="spells" className="space-y-4">
                {nonProfArmor && (
                  <div
                    className="rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-500"
                    data-testid="spells-armor-warning"
                  >
                    You can't cast spells while wearing armor you're not proficient with ({nonProfArmor.name}).
                    Unequip it in the Items tab to cast spells again.
                  </div>
                )}
                {(() => {
                  // Spells are grouped by SOURCE — Class / Racial / Feats — each shown only when
                  // the character actually has spells from it (so the tab doesn't get crowded).
                  const isCaster = ClassSheet && classSection.draft !== null
                    && (SPELLCASTING_CLASSES.has(character.char_class) || subclassCaster);
                  const featData = classSection.draft?.feats ?? character.character_data?.feats ?? [];
                  const fg = getFeatGrantedSpells(featData);
                  const hasFeat = fg.cantrips.length + fg.leveled.length + fg.ritualBooks.length > 0;
                  // Casters that render through the shared CasterSpellBlock show the unified level
                  // strip, so racial + feat spells fold INTO it (Class/Racial/Feats become a per-level
                  // source toggle) rather than showing as top-level sources. That's true for a
                  // data-driven config (Wizard, Eldritch Knight) OR a hand-written sheet that has been
                  // converted to delegate — which is exactly what having a caster descriptor means.
                  // A character with only racial/feat spells and no class casting keeps the top-level
                  // toggle, since there is no strip to fold into.
                  const foldSources = isCaster && (
                    !!getClassConfig(character.char_class, edition)
                    || !!getCasterDescriptor(character.char_class, edition)
                  );
                  const featTrackersNode = hasFeat ? (
                    <FeatSpellsSection
                      feats={featData}
                      characterData={classSection.draft ?? character.character_data ?? {}}
                      onChange={autoSaveClassPatch}
                      readOnly={!showEditable}
                      isGm={isGm && !playerView}
                      campaignId={campaignId}
                      showSpellTabs={false}
                    />
                  ) : null;
                  // The once-per-rest use for each leveled racial spell, as a control that rides ON
                  // that spell's row (both layouts: folded strip and top-level toggle). A separate
                  // tracker card here would list the same spell twice under one source — and, being
                  // outside the level strip, on every level tab. Same character_data keys as the
                  // Stats-tab Racial Features card, so the two can't drift.
                  const racialUseControls = classSection.draft !== null
                    ? Object.fromEntries(raceGrantedLeveled.map(s => [
                      s.name,
                      <RestUseControl
                        key={s.resourceKey}
                        label={s.label}
                        recharge={s.recharge}
                        used={classSection.draft?.[s.resourceKey] ?? 0}
                        max={s.max}
                        onUsedChange={(next) => autoSaveClassPatch({ [s.resourceKey]: next })}
                        readOnly={!showEditable}
                      />,
                    ]))
                    : null;
                  const sources = [
                    isCaster && { key: 'class', label: 'Class' },
                    // Subclass-granted cantrips (Arcane Archer Lore) have no fold path into the
                    // shared level strip, so they always get their own source rather than
                    // silently disappearing on a caster that folds.
                    subclassCantrips.length > 0 && { key: 'subclass', label: 'Subclass' },
                    !foldSources && (raceGrantedCantrips.length > 0 || raceGrantedLeveled.length > 0)
                      && { key: 'racial', label: 'Racial' },
                    !foldSources && hasFeat && { key: 'feats', label: 'Feats' },
                  ].filter(Boolean);
                  const active = sources.some(s => s.key === spellSource) ? spellSource : sources[0]?.key;
                  return (
                    <>
                      {sources.length > 1 && (
                        <div className="flex gap-1.5">
                          {sources.map(s => (
                            <Button
                              key={s.key}
                              type="button"
                              size="sm"
                              variant={active === s.key ? 'default' : 'outline'}
                              data-testid={`spell-source-${s.key}`}
                              onClick={() => setSpellSource(s.key)}
                            >
                              {s.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {active === 'class' && (
                        <SectionCard
                          title="Spellcasting"
                          isDirty={classSection.isDirty}
                          onSave={saveClassData}
                          onReset={classSection.reset}
                          canEdit={showEditable}
                        >
                          <ClassSheet
                            data={classSection.draft}
                            onChange={autoSaveClassPatch}
                            readOnly={!showEditable}
                            gmEdit={gmEdit}
                            level={identity.draft?.level ?? character.level}
                            section="spells"
                            abilityScores={{ intelligence: identity.draft?.intelligence ?? 10, wisdom: identity.draft?.wisdom ?? 10, charisma: identity.draft?.charisma ?? 10 }}
                            campaignId={campaignId}
                            isGm={isGm && !playerView}
                            raceGrantedCantrips={foldSources ? raceGrantedCantrips : []}
                            raceGrantedLeveled={foldSources ? raceGrantedLeveled : []}
                            racialUseControls={foldSources ? racialUseControls : null}
                            featSpells={foldSources ? { cantrips: fg.cantrips.map((c) => c.name), leveled: fg.leveled } : null}
                            featTrackers={foldSources ? featTrackersNode : null}
                          />
                        </SectionCard>
                      )}

                      {active === 'subclass' && (
                        <div className="rounded-lg border bg-card p-4 space-y-2" data-testid="subclass-cantrips">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {(classSection.draft ?? character.character_data)?.subclass} Cantrips
                          </div>
                          <SpellLevelTabs
                            spells={subclassCantrips.map(name => ({ name, level: 0 }))}
                            testIdPrefix="subclass-spell-tab"
                          />
                          <p className="text-xs text-muted-foreground">Always known. No spell slot required.</p>
                        </div>
                      )}

                      {active === 'racial' && (
                        <div className="rounded-lg border bg-card p-4 space-y-3" data-testid="racial-spells">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Race-Granted Spells
                          </div>
                          {/* Each leveled racial spell carries its own once-per-rest use control on
                              its row (rowExtras), so it appears exactly once — under its level. */}
                          <SpellLevelTabs
                            spells={[
                              ...raceGrantedCantrips.map(name => ({ name, level: 0 })),
                              ...raceGrantedLeveled.map(s => ({ name: s.name, level: s.level })),
                            ]}
                            testIdPrefix="racial-spell-tab"
                            rowExtras={racialUseControls ? (n => racialUseControls[n] ?? null) : undefined}
                          />
                          {raceGrantedCantrips.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Cantrips are always known and need no spell slot.
                            </p>
                          )}
                        </div>
                      )}

                      {active === 'feats' && (
                        <div className="rounded-lg border bg-card p-4 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Spells from Feats</div>
                          <FeatSpellsSection
                            feats={featData}
                            characterData={classSection.draft ?? character.character_data ?? {}}
                            onChange={autoSaveClassPatch}
                            readOnly={!showEditable}
                            isGm={isGm && !playerView}
                            campaignId={campaignId}
                          />
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        A spell that requires a ranged attack roll (Fire Bolt, Eldritch Blast…) has disadvantage
                        while an enemy is within 5 ft.{' '}
                        <Link
                          to={`/campaigns/${campaignId}/encyclopedia/mechanics/spacing`}
                          className="text-primary hover:underline"
                          data-testid="spacing-learn-more-spells"
                        >
                          How spacing works
                        </Link>
                      </p>
                    </>
                  );
                })()}
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
    import('@/characters/components/leveling/LevelUpWizard').then(m => setComponent(() => m.default)).catch(() => {});
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

function SkillsDisplay({ identityDraft, classData, pb, charClass, level, edition, readOnly, nonProfArmorName, stealthArmorName }) {
  // Which skill's arithmetic is currently expanded (one at a time).
  const [openSkill, setOpenSkill] = useState(null);
  const storedProfs = classData?.skill_proficiencies ?? [];
  const expertiseSkills = classData?.expertise_skills ?? [];
  // Existing characters created before race-granted skills were saved into the
  // skill_proficiencies array still need to show Perception/Intimidation etc.
  // proficient — derive from character_data.race_traits at render time.
  const raceGranted = getRaceGrantedSkillsFromTraits(classData?.race_traits ?? []);
  const skillProfs = [...new Set([...storedProfs, ...raceGranted])];
  // Skills granted by the chosen background, limited to those the character is
  // actually proficient in, so background-sourced profs can be shown distinctly.
  const bgGranted = getBackgroundSkills(identityDraft.background).filter((s) => skillProfs.includes(s));
  // Skills picked via a feat (Skilled / Skill Expert) — recorded on each feat instance.
  const featGranted = getFeatGrantedSkills(classData?.feats ?? []).filter((s) => skillProfs.includes(s));

  // Remarkable Athlete (Champion Fighter). 5e (L7): ½ PB (rounded up) on STR/DEX/CON
  // checks that don't already use proficiency. 2024 (L3): advantage on Athletics.
  // Both only help checks that don't already use proficiency → non-proficient skills.
  const ra = remarkableAthlete({ charClass, subclass: classData?.subclass, level, edition, pb });
  const raBonus = ra?.checkBonus ?? 0; // 5e numeric bonus
  const raBonusAbilities = ra?.checkBonusAbilities ?? [];
  const raAdvSkills = ra?.advantageSkills ?? []; // 2024 advantage (e.g. Athletics)

  const hasExpertise = expertiseSkills.length > 0;
  const legendParts = [];
  if (hasExpertise) legendParts.push('Purple = expertise');
  legendParts.push('Gold = proficient');
  if (bgGranted.length > 0) legendParts.push('Amber = from background');
  if (raceGranted.length > 0) legendParts.push('Emerald = from race');
  if (featGranted.length > 0) legendParts.push('Blue = from feat');
  if (raBonus > 0) legendParts.push('Teal = ½ prof (Remarkable Athlete)');
  if (raAdvSkills.length > 0) legendParts.push('Teal = advantage (Remarkable Athlete)');
  // Worn non-proficient armor: disadvantage on every STR/DEX ability check.
  if (nonProfArmorName) legendParts.push(`"dis" = disadvantage (wearing ${nonProfArmorName} without proficiency)`);
  // Bulky armor: disadvantage on Stealth specifically (unless a feat cancels it).
  if (stealthArmorName) legendParts.push(`"dis" on Stealth = wearing ${stealthArmorName}`);

  const rows = SKILL_MAP.map(({ skill, ability }) => {
    const isProf = skillProfs.includes(skill);
    const isExpert = expertiseSkills.includes(skill);
    // Remarkable Athlete only helps checks that don't already use PB → non-proficient skills.
    // 5e: ½-PB numeric on STR/DEX/CON skills. 2024: advantage on Athletics.
    const raNumeric = raBonus > 0 && !isProf && !isExpert && raBonusAbilities.includes(ability);
    const raAdvantage = !isExpert && raAdvSkills.includes(skill);
    // Two independent armor reasons for disadvantage, both shown with the same "dis" tag:
    // wearing armor you're not proficient with (every STR/DEX check), and armor that
    // imposes Stealth disadvantage (Stealth only). A character can have both at once.
    const nonProfDisadvantage = Boolean(nonProfArmorName) && (ability === 'strength' || ability === 'dexterity');
    const stealthDisadvantage = Boolean(stealthArmorName) && skill === 'Stealth';
    const armorDisadvantage = nonProfDisadvantage || stealthDisadvantage;

    return {
      skill,
      ability,
      isProf,
      isExpert,
      isFromBg: bgGranted.includes(skill),
      isFromRace: raceGranted.includes(skill),
      isFromFeat: featGranted.includes(skill),
      isFromRA: raNumeric || raAdvantage,
      raAdvantage,
      armorDisadvantage,
      breakdown: skillBreakdown({
        skill,
        ability,
        abilityScore: identityDraft[ability],
        pb,
        isProficient: isProf,
        isExpert,
        halfProficiency: raNumeric ? raBonus : 0,
        notes: [
          raAdvantage && 'Advantage — Remarkable Athlete',
          nonProfDisadvantage && `Disadvantage — wearing ${nonProfArmorName} without proficiency`,
          stealthDisadvantage && `Disadvantage — ${stealthArmorName} imposes disadvantage on Stealth`,
        ],
      }),
    };
  });

  // Split into two alphabetical columns (top-to-bottom per column, not left-to-right)
  // so each column reads as its own list and the divider between them means something.
  const half = Math.ceil(rows.length / 2);
  const columns = [rows.slice(0, half), rows.slice(half)];

  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Skills</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        {columns.map((column, i) => (
          <div key={i} className={cn(i === 1 && 'sm:border-l sm:border-border sm:pl-4')}>
            {column.map((row) => (
              <SkillRow
                key={row.skill}
                row={row}
                expanded={openSkill === row.skill}
                onToggle={() => setOpenSkill(openSkill === row.skill ? null : row.skill)}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        {legendParts.join(' · ')}
      </p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">Click a bonus to see how it is calculated.</p>
    </div>
  );
}

// One skill line: proficiency swatch, name, governing ability, and a bonus button that
// expands the arithmetic. Module scope — a component declared inside another component
// remounts its subtree on every parent render and would collapse this open row.
function SkillRow({ row, expanded, onToggle }) {
  const { skill, isProf, isExpert, isFromBg, isFromRace, isFromFeat, isFromRA, raAdvantage, armorDisadvantage, breakdown } = row;

  return (
    <div className="py-0.5">
      <div className="flex items-center gap-2 text-xs">
        <div className={cn(
          'h-3 w-3 rounded-sm border flex-shrink-0',
          isExpert
            ? 'bg-purple-500 border-purple-500'
            : isProf
              ? (isFromBg
                  ? 'bg-amber-500 border-amber-500'
                  : isFromRace
                    ? 'bg-emerald-500 border-emerald-500'
                    : isFromFeat
                      ? 'bg-sky-500 border-sky-500'
                      : 'bg-primary border-primary')
              : isFromRA
                ? 'bg-teal-400 border-teal-400'
                : 'bg-muted border-border'
        )} />
        <span className="flex-1 truncate">{skill}</span>
        <span
          className="text-[9px] font-medium text-muted-foreground/70 uppercase tabular-nums w-7 text-right flex-shrink-0"
          data-testid={`skill-ability-${skill}`}
        >
          {breakdown.abilityAbbrev}
        </span>
        {raAdvantage && (
          <span className="text-[9px] font-semibold text-teal-600 uppercase" data-testid={`skill-advantage-${skill}`}>adv</span>
        )}
        {armorDisadvantage && (
          <span className="text-[9px] font-semibold text-amber-600 uppercase" data-testid={`skill-armor-dis-${skill}`}>dis</span>
        )}
        <BreakdownValue
          testId={`skill-bonus-${skill}`}
          label={skill}
          breakdown={breakdown}
          expanded={expanded}
          onToggle={onToggle}
          className={cn('font-medium w-8 text-right', !expanded && 'text-muted-foreground')}
        />
      </div>
      {expanded && (
        <BreakdownPanel testId={`skill-breakdown-${skill}`} breakdown={breakdown} className="ml-5 mb-1.5" />
      )}
    </div>
  );
}
