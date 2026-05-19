import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Plus, Swords, Trash2 } from 'lucide-react';
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

  const visibleCharacters = displayAsPlayer
    ? characters.filter(c => c.user_id === user?.id || c.is_visible_to_players)
    : characters;

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
    </MainLayout>
  );
};

function CharacterCard({ character, isGm, isOwner, displayAsPlayer, onView, onToggleVisibility, onDelete }) {
  return (
    <div
      className="group relative rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow space-y-3"
      onClick={onView}
    >
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
      <div className="flex items-start gap-2 pr-14">
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
      <div className="text-sm text-muted-foreground">
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
