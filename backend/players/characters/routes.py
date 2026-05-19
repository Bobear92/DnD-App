from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from players.characters.schemas import (
    CharacterCreate, CharacterGmUpdate, CharacterResponse,
    CharacterListItem, ToggleVisibilityRequest
)
from players.characters.service import (
    create_character, get_characters_for_user, get_character_by_id,
    update_character, delete_character, toggle_character_visibility
)
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/api/characters", tags=["Characters"])


@router.post("", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
def create_new_character(
    character_data: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_character(character_data, current_user.id, db)


@router.get("/campaign/{campaign_id}", response_model=List[CharacterListItem])
def list_characters_in_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_characters_for_user(current_user.id, campaign_id, current_user.is_admin, db)


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_character_by_id(character_id, current_user.id, current_user.is_admin, db)


@router.put("/{character_id}", response_model=CharacterResponse)
def update_character_endpoint(
    character_id: int,
    character_data: CharacterGmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a character. Players may update their own fields; GMs may also update gm_notes and visibility."""
    return update_character(character_id, character_data, current_user.id, current_user.is_admin, db)


@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character_endpoint(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a character (owner or campaign GM)."""
    delete_character(character_id, current_user.id, current_user.is_admin, db)


@router.patch("/{character_id}/visibility", status_code=status.HTTP_200_OK)
def toggle_visibility(
    character_id: int,
    visibility_data: ToggleVisibilityRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle character visibility to other players (GM only)."""
    toggle_character_visibility(character_id, visibility_data.is_visible, current_user.id, current_user.is_admin, db)
    return {"message": "Character visibility updated"}
