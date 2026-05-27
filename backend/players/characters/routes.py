from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from players.characters.schemas import (
    CharacterCreate, CharacterGmUpdate, CharacterResponse,
    CharacterListItem, ToggleVisibilityRequest,
    CharacterTimelineEventCreate, CharacterTimelineEventResponse,
    CharacterNpcCreate, CharacterNpcResponse,
)
from players.characters.service import (
    create_character, get_characters_for_user, get_character_by_id,
    update_character, delete_character, toggle_character_visibility,
    upload_character_image, delete_character_image,
    get_character_timeline_events, create_character_timeline_event, remove_character_timeline_event,
    get_character_npcs, create_character_npc, remove_character_npc,
)
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/api/characters", tags=["Characters"])


# ── Character CRUD ────────────────────────────────────────────────────────────

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


# ── Character image ───────────────────────────────────────────────────────────

@router.post("/{character_id}/image", response_model=CharacterResponse)
async def upload_image(
    character_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await upload_character_image(db, character_id, file, current_user.id, current_user.is_admin)


@router.delete("/{character_id}/image", response_model=CharacterResponse)
def remove_image(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return delete_character_image(db, character_id, current_user.id, current_user.is_admin)


# ── Character timeline events ─────────────────────────────────────────────────

@router.get("/{character_id}/timeline-events", response_model=List[CharacterTimelineEventResponse])
def list_timeline_events(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_character_timeline_events(db, character_id, current_user.id, current_user.is_admin)


@router.post("/{character_id}/timeline-events", response_model=CharacterTimelineEventResponse, status_code=status.HTTP_201_CREATED)
def add_timeline_event(
    character_id: int,
    data: CharacterTimelineEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_character_timeline_event(db, character_id, data, current_user.id, current_user.is_admin)


@router.delete("/{character_id}/timeline-events/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timeline_event_link(
    character_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    remove_character_timeline_event(db, character_id, link_id, current_user.id, current_user.is_admin)


# ── Character NPCs ────────────────────────────────────────────────────────────

@router.get("/{character_id}/npcs", response_model=List[CharacterNpcResponse])
def list_character_npcs(
    character_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_character_npcs(db, character_id, current_user.id, current_user.is_admin)


@router.post("/{character_id}/npcs", response_model=CharacterNpcResponse, status_code=status.HTTP_201_CREATED)
def add_character_npc(
    character_id: int,
    data: CharacterNpcCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_character_npc(db, character_id, data, current_user.id, current_user.is_admin)


@router.delete("/{character_id}/npcs/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_npc_link(
    character_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    remove_character_npc(db, character_id, link_id, current_user.id, current_user.is_admin)
