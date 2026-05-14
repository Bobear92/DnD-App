from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import (
    EventCreate, EventUpdate, EventVisibilityUpdate, EventResponse, EventListItem,
    EventNPCAdd, EventNPCResponse,
    EventLocationAdd, EventLocationResponse,
)
from . import service

router = APIRouter(
    prefix="/api/gm/campaigns/{campaign_id}/timeline",
    tags=["GM Campaign Tools - Timeline"],
)


# ── Events ────────────────────────────────────────────────────────────────────

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    campaign_id: int,
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_event(db, campaign_id, data, current_user.id)


@router.get("", response_model=List[EventListItem])
def list_events(
    campaign_id: int,
    location_id: Optional[int] = Query(None),
    npc_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_events(db, campaign_id, current_user.id, location_id=location_id, npc_id=npc_id)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(
    campaign_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_event(db, campaign_id, event_id, current_user.id)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    campaign_id: int,
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_event(db, campaign_id, event_id, data, current_user.id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    campaign_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_event(db, campaign_id, event_id, current_user.id)


@router.patch("/{event_id}/visibility", response_model=EventResponse)
def update_event_visibility(
    campaign_id: int,
    event_id: int,
    data: EventVisibilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_event_visibility(db, campaign_id, event_id, data, current_user.id)


# ── NPC links ─────────────────────────────────────────────────────────────────

@router.get("/{event_id}/npcs", response_model=List[EventNPCResponse])
def list_npc_links(
    campaign_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_npc_links(db, campaign_id, event_id, current_user.id)


@router.post("/{event_id}/npcs", response_model=EventNPCResponse, status_code=status.HTTP_201_CREATED)
def add_npc_link(
    campaign_id: int,
    event_id: int,
    data: EventNPCAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.add_npc_link(db, campaign_id, event_id, data, current_user.id)


@router.delete("/{event_id}/npcs/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_npc_link(
    campaign_id: int,
    event_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.remove_npc_link(db, campaign_id, event_id, link_id, current_user.id)


# ── Location links ────────────────────────────────────────────────────────────

@router.get("/{event_id}/locations", response_model=List[EventLocationResponse])
def list_location_links(
    campaign_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_location_links(db, campaign_id, event_id, current_user.id)


@router.post("/{event_id}/locations", response_model=EventLocationResponse, status_code=status.HTTP_201_CREATED)
def add_location_link(
    campaign_id: int,
    event_id: int,
    data: EventLocationAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.add_location_link(db, campaign_id, event_id, data, current_user.id)


@router.delete("/{event_id}/locations/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_location_link(
    campaign_id: int,
    event_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.remove_location_link(db, campaign_id, event_id, link_id, current_user.id)
