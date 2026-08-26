import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Moon, Plus, Sun, Swords, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import { useCampaign } from '../../campaigns/CampaignContext';
import { useAuth } from '../../auth/AuthContext';
import { getRacialRestResources } from '@/characters/components/race/racialRestResources';
import { getFeatResources, getFeatGrantedSpells } from '@/characters/components/feats/featEffects';
import { isDivination } from '@/characters/components/subclass/PortentTracker';
import { cn } from '@/lib/utils';

const ABILITY_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function modifier(score) {
  return Math.floor((score - 10) / 2);
}

function modStr(score) {
  const m = modifier(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

const CLASS_COLORS = {
  Fighter: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Paladin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Rogue: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Wizard: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

function classBadgeClass(charClass) {
  return CLASS_COLORS[charClass] || 'bg-muted text-muted-foreground';
}

const SPELLCASTING_CLASSES = new Set(['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Wizard', 'Artificer']);

function getRestSummary(cls, edition, level, restType, characterData = {}) {
  const is2024 = edition === '5.5e';
  const traits = characterData?.race_traits ?? [];
  const racial = getRacialRestResources(traits, level);
  const featResources = getFeatResources(characterData?.feats ?? [], { pb: Math.ceil((level || 1) / 4) + 1 });

  if (restType === 'short') {
    const items = [];
    if (cls === 'Warlock') items.push('Pact magic slots');
    if (cls === 'Monk') items.push(is2024 ? 'Focus points' : 'Ki points');
    if (cls === 'Fighter') {
      items.push('Action Surge & Second Wind');
      if (characterData?.subclass === 'Battle Master') items.push('Superiority Dice');
      if (characterData?.subclass === 'Arcane Archer') items.push('Arcane Shot');
      if (characterData?.subclass === 'Echo Knight' && level >= 10) items.push('Shadow Martyr');
      // The Psionic Energy POOL is long-rest only; a short rest returns just the two
      // once-per-rest charges that spend alongside it.
      if (characterData?.subclass === 'Psi Warrior') {
        items.push('Psionic Energy die regain & Telekinetic Movement');
      }
      // Channel Rune is the only Rune Knight resource that returns on a SHORT rest — both
      // Giant's Might and Runic Shield are long-rest only.
      if (characterData?.subclass === 'Rune Knight' && level >= 3) items.push('Channel Rune');
    }
    if (cls === 'Bard' && (is2024 || level >= 5)) items.push('Bardic Inspiration');
    if ((cls === 'Cleric' || cls === 'Paladin') && is2024) items.push('Channel Divinity');
    if (cls === 'Wizard') items.push('Arcane Recovery');
    // Racial features that recharge on a short rest
    racial.filter(r => r.recharge === 'short').forEach(r => items.push(r.label));
    // Feat resources that recharge on a short rest (e.g. Martial Adept superiority die)
    featResources.filter(r => r.recharge === 'short').forEach(r => items.push(r.label));
    return items.length > 0 ? items : ['No short rest resources'];
  }

  const items = ['HP fully restored', 'Hit dice partially recovered'];
  if (SPELLCASTING_CLASSES.has(cls)) items.push('All spell slots');
  if (cls === 'Barbarian') items.push('Rages');
  else if (cls === 'Bard') items.push('Bardic Inspiration');
  else if (cls === 'Cleric') items.push('Channel Divinity, spell preparation unlocked');
  else if (cls === 'Druid') items.push('Wild Shape, spell preparation unlocked');
  else if (cls === 'Fighter') {
    items.push('Action Surge, Second Wind & Indomitable');
    if (characterData?.subclass === 'Battle Master') items.push('Superiority Dice');
    if (characterData?.subclass === 'Arcane Archer') items.push('Arcane Shot');
    if (characterData?.subclass === 'Eldritch Knight') items.push('All spell slots');
    if (characterData?.subclass === 'Samurai') items.push('Fighting Spirit');
    if (characterData?.subclass === 'Cavalier') {
      items.push('Unwavering Mark');
      if (level >= 7) items.push('Warding Maneuver');
    }
    if (characterData?.subclass === 'Echo Knight') {
      items.push('Unleash Incarnation');
      if (level >= 10) items.push('Shadow Martyr');
      if (level >= 15) items.push('Reclaim Potential');
    }
    if (characterData?.subclass === 'Psi Warrior') {
      items.push('Psionic Energy dice');
      if (level >= 7) items.push('Psi-Powered Leap');
      if (level >= 15) items.push('Bulwark of Force');
    }
    if (characterData?.subclass === 'Rune Knight') {
      items.push("Giant's Might");
      if (level >= 7) items.push('Runic Shield');
      // A long rest is also a short one, so Channel Rune comes back as well.
      if (level >= 3) items.push('Channel Rune');
    }
  }
  else if (cls === 'Monk') items.push(is2024 ? 'Focus points' : 'Ki points');
  else if (cls === 'Paladin') items.push('Lay on Hands, Divine Sense & Channel Divinity, spell preparation unlocked');
  else if (cls === 'Ranger') items.push('Spell preparation unlocked');
  else if (cls === 'Sorcerer') items.push(is2024 ? 'Sorcery points, Innate Sorcery' : 'Sorcery points');
  else if (cls === 'Warlock') items.push(is2024 ? 'Pact magic slots, Magical Cunning' : 'Pact magic slots');
  else if (cls === 'Wizard') items.push(is2024 ? 'Arcane Recovery, Memorize Spell, spell preparation unlocked' : 'Arcane Recovery, spell preparation unlocked');
  else if (cls === 'Artificer') items.push('Flash of Genius, spell preparation unlocked');
  // Racial features (long rest recovers both short- and long-recharge ones)
  racial.forEach(r => items.push(r.label));
  // Feat resources (long rest recovers all)
  featResources.forEach(r => items.push(r.label));
  // Feat spell-grant free casts (Magic Initiate, etc.) — 1/long rest
  getFeatGrantedSpells(characterData?.feats ?? []).freeCasts.forEach(fc => items.push(`${fc.name} (feat free cast)`));
  // Divination Wizard: Portent dice cleared (re-roll after the rest)
  if (cls === 'Wizard' && isDivination(characterData?.subclass)) items.push('Portent dice cleared (re-roll)');
  return items;
}

const CharacterList = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [playerView, setPlayerView] = useState(false);

  // Rest state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [restDialog, setRestDialog] = useState(null); // null | 'short' | 'long'
  const [restLoading, setRestLoading] = useState(false);

  const isGm = campaign?.userRole === 'gm';
  const displayAsPlayer = !isGm || playerView;

  useEffect(() => {
    loadCharacters();
  }, [campaignId]);

  const loadCharacters = async () => {
    if (!campaignId) { navigate('/campaigns'); return; }
    setLoading(true);
    const result = await characterService.getCharactersByCampaign(campaignId);
    if (result.success) setCharacters(result.data);
    else setError(result.error);
    setLoading(false);
  };

  const handleToggleVisibility = async (char) => {
    const result = await characterService.toggleVisibility(char.id, !char.is_visible_to_players);
    if (result.success) loadCharacters();
    else setError(result.error);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await characterService.deleteCharacter(deleteTarget.id);
    if (result.success) {
      setDeleteTarget(null);
      loadCharacters();
    } else {
      setError(result.error);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === visibleCharacters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleCharacters.map(c => c.id)));
    }
  };

  const handleApplyRest = async () => {
    if (!restDialog || selectedIds.size === 0) return;
    setRestLoading(true);
    const result = await characterService.applyRest(campaignId, restDialog, Array.from(selectedIds));
    setRestLoading(false);
    if (result.success) {
      setRestDialog(null);
      setSelectedIds(new Set());
      loadCharacters();
    } else {
      setError(result.error);
      setRestDialog(null);
    }
  };

  const visibleCharacters = displayAsPlayer
    ? characters.filter(c => c.user_id === user?.id || c.is_visible_to_players)
    : characters;

  const selectedChars = visibleCharacters.filter(c => selectedIds.has(c.id));
  const allSelected = visibleCharacters.length > 0 && selectedIds.size === visibleCharacters.length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading characters...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isGm ? 'All Characters' : 'My Characters'}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isGm ? 'Manage all player characters in your campaign' : 'Create and manage your adventurers'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlayerView(v => !v)}
              >
                {playerView ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                {playerView ? 'GM View' : 'Player View'}
              </Button>
            )}
            <Button onClick={() => navigate(`/campaigns/${campaignId}/characters/create`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Character
            </Button>
          </div>
        </div>

        {/* Rest controls — GM only, not in player view */}
        {isGm && !playerView && visibleCharacters.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Rest:</span>
            <Button
              variant="outline"
              size="sm"
              data-testid="short-rest-btn"
              disabled={selectedIds.size === 0}
              onClick={() => setRestDialog('short')}
            >
              <Sun className="h-4 w-4 mr-1.5" />
              Short Rest
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="long-rest-btn"
              disabled={selectedIds.size === 0}
              onClick={() => setRestDialog('long')}
            >
              <Moon className="h-4 w-4 mr-1.5" />
              Long Rest
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="select-all-btn"
              onClick={handleSelectAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Create button for players in empty state OR always for GM quick access */}
        {!isGm && visibleCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Swords className="h-16 w-16 opacity-20" />
            <h2 className="text-lg font-semibold text-foreground">No Characters Yet</h2>
            <p className="text-sm">Create your first character to begin your adventure!</p>
            <Button onClick={() => navigate(`/campaigns/${campaignId}/characters/create`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Character
            </Button>
          </div>
        ) : isGm && visibleCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Swords className="h-16 w-16 opacity-20" />
            <p className="text-sm">No players have created characters yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCharacters.map((char) => (
              <CharacterCard
                key={char.id}
                character={char}
                isGm={isGm}
                isOwner={char.user_id === user?.id}
                displayAsPlayer={displayAsPlayer}
                showCheckbox={isGm && !displayAsPlayer}
                isSelected={selectedIds.has(char.id)}
                onToggleSelect={() => handleToggleSelect(char.id)}
                onView={() => navigate(`/campaigns/${campaignId}/characters/${char.id}`)}
                onToggleVisibility={() => handleToggleVisibility(char)}
                onDelete={() => setDeleteTarget(char)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rest confirmation dialog */}
      <Dialog open={!!restDialog} onOpenChange={() => setRestDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {restDialog === 'short' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {restDialog === 'short' ? 'Short Rest' : 'Long Rest'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apply a {restDialog === 'short' ? 'short' : 'long'} rest to {selectedChars.length} selected character{selectedChars.length !== 1 ? 's' : ''}?
          </p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedChars.map(char => (
              <div key={char.id} className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm">{char.name}</span>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded-full', classBadgeClass(char.char_class))}>
                    {char.char_class}
                  </span>
                  <span className="text-xs text-muted-foreground">Lv {char.level}</span>
                </div>
                <ul className="space-y-0.5">
                  {getRestSummary(char.char_class, campaign?.edition || '5e', char.level, restDialog, char.character_data).map(item => (
                    <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestDialog(null)} disabled={restLoading}>
              Cancel
            </Button>
            <Button onClick={handleApplyRest} disabled={restLoading} data-testid="confirm-rest-btn">
              {restLoading ? 'Applying…' : `Confirm ${restDialog === 'short' ? 'Short' : 'Long'} Rest`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

function CharacterCard({ character, isGm, isOwner, displayAsPlayer, showCheckbox, isSelected, onToggleSelect, onView, onToggleVisibility, onDelete }) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow space-y-3',
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={onView}
    >
      {/* Selection checkbox */}
      {showCheckbox && (
        <div
          className="absolute top-3 left-3 z-10"
          onClick={e => { e.stopPropagation(); onToggleSelect(); }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            data-testid={`char-checkbox-${character.id}`}
            className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* GM controls */}
      {isGm && !displayAsPlayer && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            className="p-1 rounded hover:bg-muted"
            title={character.is_visible_to_players ? 'Visible to players' : 'Hidden from players'}
            onClick={onToggleVisibility}
          >
            {character.is_visible_to_players
              ? <Eye className="h-4 w-4 text-green-600" />
              : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </button>
          <button
            className="p-1 rounded hover:bg-muted"
            title="Delete character"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={cn('flex items-start gap-2 pr-14', showCheckbox && 'pl-7')}>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{character.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', classBadgeClass(character.char_class))}>
              {character.char_class}
            </span>
            <span className="text-xs text-muted-foreground">Level {character.level}</span>
            {isGm && !displayAsPlayer && !character.is_visible_to_players && (
              <Badge variant="secondary" className="text-xs">Hidden</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Race + background */}
      <div className={cn('text-sm text-muted-foreground', showCheckbox && 'pl-7')}>
        {character.race}{character.background ? ` · ${character.background}` : ''}
      </div>

      {/* Ability scores */}
      <div className="grid grid-cols-6 gap-1">
        {ABILITY_KEYS.map((key, i) => (
          <div key={key} className="flex flex-col items-center rounded bg-muted/50 px-1 py-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">{ABILITY_LABELS[i]}</span>
            <span className="text-sm font-bold leading-none mt-0.5">{modStr(character[key])}</span>
            <span className="text-[10px] text-muted-foreground">{character[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CharacterList;
