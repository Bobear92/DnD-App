from fastapi import APIRouter, Depends, File, UploadFile, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import (
    SessionNoteCreate, SessionNoteUpdate, SessionNoteVisibilityUpdate,
    SessionNoteResponse, SessionNoteListItem, SessionImageResponse,
    SessionNoteNPCAdd, SessionNoteNPCResponse,
    SessionNoteLocationAdd, SessionNoteLocationResponse,
    SessionNoteEventAdd, SessionNoteEventResponse,
    SessionNoteCharacterAdd, SessionNoteCharacterResponse,
)
from . import service

router = APIRouter(
    prefix="/api/gm/campaigns/{campaign_id}/sessions",
    tags=["GM Campaign Tools - Session Notes"],
)


# ── Session CRUD ──────────────────────────────────────────────────────────────

@router.post("", response_model=SessionNoteResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    campaign_id: int,
    data: SessionNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_session(db, campaign_id, data, current_user.id)


@router.get("", response_model=List[SessionNoteListItem])
def list_sessions(
    campaign_id: int,
    npc_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    event_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_sessions(db, campaign_id, current_user.id, npc_id=npc_id, location_id=location_id, event_id=event_id)


@router.get("/{session_id}", response_model=SessionNoteResponse)
def get_session(
    campaign_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_session(db, campaign_id, session_id, current_user.id)


@router.put("/{session_id}", response_model=SessionNoteResponse)
def update_session(
    campaign_id: int,
    session_id: int,
    data: SessionNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_session(db, campaign_id, session_id, data, current_user.id)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    campaign_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_session(db, campaign_id, session_id, current_user.id)


@router.patch("/{session_id}/visibility", response_model=SessionNoteResponse)
def update_session_visibility(
    campaign_id: int,
    session_id: int,
    data: SessionNoteVisibilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_session_visibility(db, campaign_id, session_id, data, current_user.id)


# ── Images ────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/images", response_model=SessionImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(
    campaign_id: int,
    session_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.upload_image(db, campaign_id, session_id, file, current_user.id)


@router.delete("/{session_id}/images/{filename}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    campaign_id: int,
    session_id: int,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_image(db, campaign_id, session_id, filename, current_user.id)


# ── NPC links ─────────────────────────────────────────────────────────────────

@router.get("/{session_id}/npcs", response_model=List[SessionNoteNPCResponse])
def list_npc_links(
    campaign_id: int, session_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.list_npc_links(db, campaign_id, session_id, current_user.id)


@router.post("/{session_id}/npcs", response_model=SessionNoteNPCResponse, status_code=status.HTTP_201_CREATED)
def add_npc_link(
    campaign_id: int, session_id: int, data: SessionNoteNPCAdd,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.add_npc_link(db, campaign_id, session_id, data, current_user.id)


@router.delete("/{session_id}/npcs/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_npc_link(
    campaign_id: int, session_id: int, link_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    service.remove_npc_link(db, campaign_id, session_id, link_id, current_user.id)


# ── Location links ────────────────────────────────────────────────────────────

@router.get("/{session_id}/locations", response_model=List[SessionNoteLocationResponse])
def list_location_links(
    campaign_id: int, session_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.list_location_links(db, campaign_id, session_id, current_user.id)


@router.post("/{session_id}/locations", response_model=SessionNoteLocationResponse, status_code=status.HTTP_201_CREATED)
def add_location_link(
    campaign_id: int, session_id: int, data: SessionNoteLocationAdd,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.add_location_link(db, campaign_id, session_id, data, current_user.id)


@router.delete("/{session_id}/locations/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_location_link(
    campaign_id: int, session_id: int, link_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    service.remove_location_link(db, campaign_id, session_id, link_id, current_user.id)


# ── Timeline event links ──────────────────────────────────────────────────────

@router.get("/{session_id}/timeline-events", response_model=List[SessionNoteEventResponse])
def list_event_links(
    campaign_id: int, session_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.list_event_links(db, campaign_id, session_id, current_user.id)


@router.post("/{session_id}/timeline-events", response_model=SessionNoteEventResponse, status_code=status.HTTP_201_CREATED)
def add_event_link(
    campaign_id: int, session_id: int, data: SessionNoteEventAdd,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.add_event_link(db, campaign_id, session_id, data, current_user.id)


@router.delete("/{session_id}/timeline-events/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_event_link(
    campaign_id: int, session_id: int, link_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    service.remove_event_link(db, campaign_id, session_id, link_id, current_user.id)


# ── Character links ───────────────────────────────────────────────────────────

@router.get("/{session_id}/characters", response_model=List[SessionNoteCharacterResponse])
def list_character_links(
    campaign_id: int, session_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.list_character_links(db, campaign_id, session_id, current_user.id)


@router.post("/{session_id}/characters", response_model=SessionNoteCharacterResponse, status_code=status.HTTP_201_CREATED)
def add_character_link(
    campaign_id: int, session_id: int, data: SessionNoteCharacterAdd,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    return service.add_character_link(db, campaign_id, session_id, data, current_user.id)


@router.delete("/{session_id}/characters/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_character_link(
    campaign_id: int, session_id: int, link_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    service.remove_character_link(db, campaign_id, session_id, link_id, current_user.id)
