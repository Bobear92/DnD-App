import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import { useCampaign } from '../../campaigns/CampaignContext';
import './CharacterList.css';

const CharacterList = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isGm = campaign?.userRole === 'gm';

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadCharacters();
  }, [campaignId]);

  const loadCharacters = async () => {
    if (!campaignId) { navigate('/campaigns'); return; }
    setLoading(true);

    const result = await characterService.getCharactersByCampaign(campaignId);
    if (result.success) {
      setCharacters(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleCreateCharacter = () => {
    navigate(`/campaigns/${campaignId}/characters/create`);
  };

  const handleViewCharacter = (characterId) => {
    navigate(`/campaigns/${campaignId}/characters/${characterId}`);
  };

  const handleToggleVisibility = async (characterId) => {
    const result = await characterService.toggleVisibility(characterId);
    if (result.success) {
      // Reload characters to see updated visibility
      loadCharacters();
    } else {
      setError(result.error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Loading characters...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="characters-page">
        <div className="page-header">
          <div className="header-content">
            <h1>{isGm ? 'All Characters' : 'My Characters'}</h1>
            <p className="page-subtitle">
              {isGm 
                ? 'Manage all player characters in your campaign'
                : 'Create and manage your adventurers'}
            </p>
          </div>
          <button onClick={handleCreateCharacter} className="create-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create Character
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 4V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="12" r="0.5" fill="currentColor"/>
            </svg>
            {error}
          </div>
        )}

        <div className="characters-grid">
          {characters.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="20" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 50C16 40 22 32 32 32C42 32 48 40 48 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h2>No Characters Yet</h2>
              <p>
                {isGm 
                  ? "No players have created characters yet."
                  : "Create your first character to begin your adventure!"}
              </p>
              {!isGm && (
                <button onClick={handleCreateCharacter} className="empty-create-button">
                  Create Your First Character
                </button>
              )}
            </div>
          ) : (
            characters.map((character) => (
              <div key={character.id} className="character-card">
                <div className="character-card-header">
                  <h3 className="character-name">{character.name}</h3>
                  {isGm && isGm && (
                    <span className="owner-badge">Player Character</span>
                  )}
                  {isGm && (
                    <button
                      onClick={() => handleToggleVisibility(character.id)}
                      className={`visibility-toggle ${character.is_visible_to_players ? 'visible' : 'hidden'}`}
                      title={character.is_visible_to_players ? 'Visible to players' : 'Hidden from players'}
                    >
                      {character.is_visible_to_players ? '👁️' : '👁️‍🗨️'}
                    </button>
                  )}
                </div>

                <div className="character-card-body">
                  <div className="character-details">
                    <div className="detail-row">
                      <span className="detail-label">Race:</span>
                      <span className="detail-value">{character.race}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Class:</span>
                      <span className="detail-value">{character.char_class}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Level:</span>
                      <span className="detail-value">{character.level}</span>
                    </div>
                  </div>

                  <div className="character-stats">
                    <div className="stat-item">
                      <span className="stat-label">STR</span>
                      <span className="stat-value">{character.strength}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">DEX</span>
                      <span className="stat-value">{character.dexterity}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">CON</span>
                      <span className="stat-value">{character.constitution}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">INT</span>
                      <span className="stat-value">{character.intelligence}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">WIS</span>
                      <span className="stat-value">{character.wisdom}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">CHA</span>
                      <span className="stat-value">{character.charisma}</span>
                    </div>
                  </div>
                </div>

                <div className="character-card-footer">
                  <button 
                    onClick={() => handleViewCharacter(character.id)}
                    className="view-button"
                  >
                    View Character
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CharacterList;