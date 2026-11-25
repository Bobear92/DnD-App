import React, { useState, useEffect, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import { formatAbilityMod } from '@/characters/components/shared/abilityMath';

const ABILITY_LABELS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

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

  // Rest state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [restDialog, setRestDialog] = useState(null); // null | 'short' | 'long'
  const [restLoading, setRestLoading] = useState(false);
  // What the rest WILL do, per character — a dry run of the same backend table that applies it
  // (RestRequest.dry_run). The dialog used to predict this from a hand-kept frontend copy of
  // the backend's rules, which had to be edited alongside it for every new pool.
  const [restPreview, setRestPreview] = useState({ status: 'idle', byId: {}, error: '' });
  // Guards against a slow preview for a dialog the GM has since closed or reopened.
  const previewRequest = useRef(0);

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

  const openRestDialog = async (restType) => {
    const ids = Array.from(selectedIds);
    const requestId = ++previewRequest.current;
    setRestDialog(restType);
    setRestPreview({ status: 'loading', byId: {}, error: '' });
    const result = await characterService.previewRest(campaignId, restType, ids);
    if (requestId !== previewRequest.current) return;
    if (result.success) {
      const byId = {};
      for (const item of result.data?.applied_to ?? []) byId[item.character_id] = item.changes ?? [];
      setRestPreview({ status: 'ready', byId, error: '' });
    } else {
      // The preview is information, not a gate: the GM can still confirm the rest.
      setRestPreview({ status: 'error', byId: {}, error: result.error });
    }
  };

  const closeRestDialog = () => {
    previewRequest.current += 1;
    setRestDialog(null);
  };

  const handleApplyRest = async () => {
    if (!restDialog || selectedIds.size === 0) return;
    setRestLoading(true);
    const result = await characterService.applyRest(campaignId, restDialog, Array.from(selectedIds));
    setRestLoading(false);
    if (result.success) {
      closeRestDialog();
      setSelectedIds(new Set());
      loadCharacters();
    } else {
      setError(result.error);
      closeRestDialog();
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
              onClick={() => openRestDialog('short')}
            >
              <Sun className="h-4 w-4 mr-1.5" />
              Short Rest
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="long-rest-btn"
              disabled={selectedIds.size === 0}
              onClick={() => openRestDialog('long')}
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
      <Dialog open={!!restDialog} onOpenChange={closeRestDialog}>
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
          {restPreview.status === 'error' && (
            <p className="text-xs text-amber-500" data-testid="rest-preview-error">
              Couldn't load what this rest will recover ({restPreview.error}). You can still apply it.
            </p>
          )}
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
                {restPreview.status === 'loading' && (
                  <p className="text-xs text-muted-foreground" data-testid={`rest-preview-loading-${char.id}`}>
                    Working out what recovers…
                  </p>
                )}
                {restPreview.status === 'ready' && (
                  <ul className="space-y-0.5" data-testid={`rest-preview-${char.id}`}>
                    {(restPreview.byId[char.id] ?? []).map(item => (
                      <li key={item} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRestDialog} disabled={restLoading}>
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

      {/* Who plays it — on every card that isn't your own (T3: the GM couldn't tell whose character was whose) */}
      {!isOwner && character.owner_username && (
        <div className={cn('text-xs text-muted-foreground', showCheckbox && 'pl-7')} data-testid={`char-owner-${character.id}`}>
          Played by <span className="font-medium text-foreground">{character.owner_username}</span>
        </div>
      )}

      {/* Ability scores */}
      <div className="grid grid-cols-6 gap-1">
        {ABILITY_KEYS.map((key, i) => (
          <div key={key} className="flex flex-col items-center rounded bg-muted/50 px-1 py-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">{ABILITY_LABELS[i]}</span>
            <span className="text-sm font-bold leading-none mt-0.5">{formatAbilityMod(character[key])}</span>
            <span className="text-[10px] text-muted-foreground">{character[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CharacterList;
