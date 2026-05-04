from fastapi import APIRouter, Depends, Form, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import (
    LocationCreate, LocationUpdate, LocationResponse, LocationListItem,
    LocationNPCAdd, LocationNPCResponse,
    LocationRelationshipCreate, LocationRelationshipResponse,
    LocationMapResponse,
    MapPinCreate, MapPinUpdate, MapPinResponse,
    LocationLinkCreate, LocationLinkResponse,
)
from . import service

router = APIRouter(
    prefix="/api/gm/campaigns/{campaign_id}/locations",
    tags=["GM Campaign Tools - Locations"],
)


# ── Locations ─────────────────────────────────────────────────────────────────

@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    campaign_id: int,
    data: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_location(db, campaign_id, data, current_user.id)


@router.get("", response_model=List[LocationListItem])
def list_locations(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_locations(db, campaign_id, current_user.id)


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_location_by_id(db, campaign_id, location_id, current_user.id)


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    campaign_id: int,
    location_id: int,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_location(db, campaign_id, location_id, data, current_user.id)


@router.delete("/{location_id}", status_code=status.HTTP_200_OK)
def delete_location(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_location(db, campaign_id, location_id, current_user.id)


@router.patch("/{location_id}/visibility", response_model=LocationResponse)
def toggle_visibility(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.toggle_location_visibility(db, campaign_id, location_id, current_user.id)


# ── Location NPCs ─────────────────────────────────────────────────────────────

@router.get("/{location_id}/npcs", response_model=List[LocationNPCResponse])
def list_location_npcs(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_location_npcs(db, campaign_id, location_id, current_user.id)


@router.post("/{location_id}/npcs", response_model=LocationNPCResponse, status_code=status.HTTP_201_CREATED)
def add_location_npc(
    campaign_id: int,
    location_id: int,
    data: LocationNPCAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.add_location_npc(db, campaign_id, location_id, data, current_user.id)


@router.delete("/{location_id}/npcs/{ln_id}", status_code=status.HTTP_200_OK)
def remove_location_npc(
    campaign_id: int,
    location_id: int,
    ln_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.remove_location_npc(db, campaign_id, location_id, ln_id, current_user.id)


# ── Relationships ─────────────────────────────────────────────────────────────

@router.post("/{location_id}/relationships", response_model=LocationRelationshipResponse, status_code=status.HTTP_201_CREATED)
def add_relationship(
    campaign_id: int,
    location_id: int,
    data: LocationRelationshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.add_relationship(db, campaign_id, location_id, data, current_user.id)


@router.get("/{location_id}/relationships", response_model=List[LocationRelationshipResponse])
def list_relationships(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_relationships(db, campaign_id, location_id, current_user.id)


@router.delete("/{location_id}/relationships/{rel_id}", status_code=status.HTTP_200_OK)
def delete_relationship(
    campaign_id: int,
    location_id: int,
    rel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_relationship(db, campaign_id, location_id, rel_id, current_user.id)


# ── Maps ──────────────────────────────────────────────────────────────────────

@router.post("/{location_id}/maps", response_model=LocationMapResponse, status_code=status.HTTP_201_CREATED)
async def upload_map(
    campaign_id: int,
    location_id: int,
    name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.upload_map(db, campaign_id, location_id, name, file, current_user.id)


@router.get("/{location_id}/maps", response_model=List[LocationMapResponse])
def list_maps(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_maps(db, campaign_id, location_id, current_user.id)


@router.delete("/{location_id}/maps/{map_id}", status_code=status.HTTP_200_OK)
def delete_map(
    campaign_id: int,
    location_id: int,
    map_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_map(db, campaign_id, location_id, map_id, current_user.id)


@router.patch("/{location_id}/maps/{map_id}/visibility", response_model=LocationMapResponse)
def toggle_map_visibility(
    campaign_id: int,
    location_id: int,
    map_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.toggle_map_visibility(db, campaign_id, location_id, map_id, current_user.id)


# ── Pins ──────────────────────────────────────────────────────────────────────

@router.post("/{location_id}/maps/{map_id}/pins", response_model=MapPinResponse, status_code=status.HTTP_201_CREATED)
def create_pin(
    campaign_id: int,
    location_id: int,
    map_id: int,
    data: MapPinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_pin(db, campaign_id, location_id, map_id, data, current_user.id)


@router.get("/{location_id}/maps/{map_id}/pins", response_model=List[MapPinResponse])
def list_pins(
    campaign_id: int,
    location_id: int,
    map_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_pins(db, campaign_id, location_id, map_id, current_user.id)


@router.put("/{location_id}/maps/{map_id}/pins/{pin_id}", response_model=MapPinResponse)
def update_pin(
    campaign_id: int,
    location_id: int,
    map_id: int,
    pin_id: int,
    data: MapPinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_pin(db, campaign_id, location_id, map_id, pin_id, data, current_user.id)


@router.delete("/{location_id}/maps/{map_id}/pins/{pin_id}", status_code=status.HTTP_200_OK)
def delete_pin(
    campaign_id: int,
    location_id: int,
    map_id: int,
    pin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_pin(db, campaign_id, location_id, map_id, pin_id, current_user.id)


# ── Links ─────────────────────────────────────────────────────────────────────

@router.post("/{location_id}/links", response_model=LocationLinkResponse, status_code=status.HTTP_201_CREATED)
def create_link(
    campaign_id: int,
    location_id: int,
    data: LocationLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_link(db, campaign_id, location_id, data, current_user.id)


@router.get("/{location_id}/links", response_model=List[LocationLinkResponse])
def list_links(
    campaign_id: int,
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_links(db, campaign_id, location_id, current_user.id)


@router.delete("/{location_id}/links/{link_id}", status_code=status.HTTP_200_OK)
def delete_link(
    campaign_id: int,
    location_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_link(db, campaign_id, location_id, link_id, current_user.id)
