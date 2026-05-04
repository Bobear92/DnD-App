from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, UploadFile, status
from typing import List

from .models import Location, LocationNPC, LocationRelationship, LocationMap, MapPin, LocationLink
from .schemas import (
    LocationCreate, LocationUpdate,
    LocationNPCAdd, LocationNPCResponse,
    LocationRelationshipCreate,
    MapPinCreate, MapPinUpdate,
    LocationLinkCreate,
)
from .storage import save_map_image, delete_map_image
from gm.campaigns.models import CampaignMember
from gm.campaigns.campaign_tools.npcs.models import NPC


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_gm(db: Session, campaign_id: int, user_id: int) -> None:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
        CampaignMember.role == "gm",
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the GM of this campaign can perform this action",
        )


def _require_member(db: Session, campaign_id: int, user_id: int) -> CampaignMember:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this campaign",
        )
    return member


def _get_location_or_404(db: Session, location_id: int) -> Location:
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    return loc


def _get_map_or_404(db: Session, map_id: int) -> LocationMap:
    m = db.query(LocationMap).filter(LocationMap.id == map_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    return m


def _build_npc_response(ln: LocationNPC, npc: NPC) -> LocationNPCResponse:
    return LocationNPCResponse(
        id=ln.id,
        npc_id=npc.id,
        name=npc.name,
        race=npc.race,
        occupation=npc.occupation,
        summary=npc.summary,
        description=ln.description,
        is_visible_to_players=npc.is_visible_to_players,
    )


# ── Locations ─────────────────────────────────────────────────────────────────

def create_location(db: Session, campaign_id: int, data: LocationCreate, user_id: int) -> Location:
    _require_gm(db, campaign_id, user_id)
    loc = Location(campaign_id=campaign_id, **data.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


def get_locations(db: Session, campaign_id: int, user_id: int) -> List[Location]:
    member = _require_member(db, campaign_id, user_id)
    query = db.query(Location).filter(Location.campaign_id == campaign_id)
    if member.role == "player":
        query = query.filter(Location.is_visible_to_players == True)
    return query.order_by(Location.name).all()


def get_location_by_id(db: Session, campaign_id: int, location_id: int, user_id: int) -> Location:
    member = _require_member(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    if member.role == "player" and not loc.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This location is not visible to players")
    if member.role == "player":
        loc.gm_notes = None
    return loc


def update_location(db: Session, campaign_id: int, location_id: int, data: LocationUpdate, user_id: int) -> Location:
    _require_gm(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    db.commit()
    db.refresh(loc)
    return loc


def delete_location(db: Session, campaign_id: int, location_id: int, user_id: int) -> dict:
    _require_gm(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    for m in db.query(LocationMap).filter(LocationMap.location_id == location_id).all():
        delete_map_image(m.image_path)
    db.delete(loc)
    db.commit()
    return {"message": f"Location '{loc.name}' deleted successfully"}


def toggle_location_visibility(db: Session, campaign_id: int, location_id: int, user_id: int) -> Location:
    _require_gm(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    loc.is_visible_to_players = not loc.is_visible_to_players
    db.commit()
    db.refresh(loc)
    return loc


# ── Location NPCs ─────────────────────────────────────────────────────────────

def get_location_npcs(db: Session, campaign_id: int, location_id: int, user_id: int) -> List[LocationNPCResponse]:
    member = _require_member(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    query = (
        db.query(LocationNPC, NPC)
        .join(NPC, LocationNPC.npc_id == NPC.id)
        .filter(LocationNPC.location_id == location_id)
    )
    if member.role == "player":
        query = query.filter(NPC.is_visible_to_players == True)
    return [_build_npc_response(ln, npc) for ln, npc in query.all()]


def add_location_npc(db: Session, campaign_id: int, location_id: int, data: LocationNPCAdd, user_id: int) -> LocationNPCResponse:
    _require_gm(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    npc = db.query(NPC).filter(NPC.id == data.npc_id, NPC.campaign_id == campaign_id).first()
    if not npc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"NPC {data.npc_id} not found in this campaign")
    ln = LocationNPC(location_id=location_id, npc_id=data.npc_id, description=data.description)
    db.add(ln)
    try:
        db.commit()
        db.refresh(ln)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This NPC is already linked to this location")
    return _build_npc_response(ln, npc)


def remove_location_npc(db: Session, campaign_id: int, location_id: int, ln_id: int, user_id: int) -> dict:
    _require_gm(db, campaign_id, user_id)
    ln = db.query(LocationNPC).filter(
        LocationNPC.id == ln_id,
        LocationNPC.location_id == location_id,
    ).first()
    if not ln:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location NPC link {ln_id} not found")
    db.delete(ln)
    db.commit()
    return {"message": "NPC removed from location"}


# ── Relationships ─────────────────────────────────────────────────────────────

def add_relationship(
    db: Session, campaign_id: int, location_id: int, data: LocationRelationshipCreate, user_id: int
) -> LocationRelationship:
    _require_gm(db, campaign_id, user_id)
    loc_a = _get_location_or_404(db, location_id)
    loc_b = _get_location_or_404(db, data.location_b_id)
    if loc_a.campaign_id != campaign_id or loc_b.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Both locations must belong to this campaign")
    if location_id == data.location_b_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A location cannot be linked to itself")

    rel = LocationRelationship(
        campaign_id=campaign_id,
        location_a_id=location_id,
        location_b_id=data.location_b_id,
        label=data.label,
        direction=data.direction,
    )
    db.add(rel)
    try:
        db.commit()
        db.refresh(rel)
        return rel
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A relationship between these two locations already exists",
        )


def get_relationships(db: Session, campaign_id: int, location_id: int, user_id: int) -> List[LocationRelationship]:
    _require_member(db, campaign_id, user_id)
    _get_location_or_404(db, location_id)
    return db.query(LocationRelationship).filter(
        (LocationRelationship.location_a_id == location_id) |
        (LocationRelationship.location_b_id == location_id)
    ).all()


def delete_relationship(db: Session, campaign_id: int, location_id: int, rel_id: int, user_id: int) -> dict:
    _require_gm(db, campaign_id, user_id)
    rel = db.query(LocationRelationship).filter(LocationRelationship.id == rel_id).first()
    if not rel or (rel.location_a_id != location_id and rel.location_b_id != location_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Relationship {rel_id} not found")
    db.delete(rel)
    db.commit()
    return {"message": "Relationship deleted successfully"}


# ── Maps ──────────────────────────────────────────────────────────────────────

async def upload_map(
    db: Session, campaign_id: int, location_id: int, name: str, file: UploadFile, user_id: int
) -> LocationMap:
    _require_gm(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")

    image_path = await save_map_image(file, campaign_id, location_id)
    m = LocationMap(location_id=location_id, name=name, image_path=image_path)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def get_maps(db: Session, campaign_id: int, location_id: int, user_id: int) -> List[LocationMap]:
    member = _require_member(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    query = db.query(LocationMap).filter(LocationMap.location_id == location_id)
    if member.role == "player":
        query = query.filter(LocationMap.is_visible_to_players == True)
    return query.order_by(LocationMap.name).all()


def delete_map(db: Session, campaign_id: int, location_id: int, map_id: int, user_id: int) -> dict:
    _require_gm(db, campaign_id, user_id)
    m = _get_map_or_404(db, map_id)
    if m.location_id != location_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    delete_map_image(m.image_path)
    db.delete(m)
    db.commit()
    return {"message": f"Map '{m.name}' deleted successfully"}


def toggle_map_visibility(db: Session, campaign_id: int, location_id: int, map_id: int, user_id: int) -> LocationMap:
    _require_gm(db, campaign_id, user_id)
    m = _get_map_or_404(db, map_id)
    if m.location_id != location_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    m.is_visible_to_players = not m.is_visible_to_players
    db.commit()
    db.refresh(m)
    return m


# ── Pins ──────────────────────────────────────────────────────────────────────

def create_pin(db: Session, campaign_id: int, location_id: int, map_id: int, data: MapPinCreate, user_id: int) -> MapPin:
    _require_gm(db, campaign_id, user_id)
    m = _get_map_or_404(db, map_id)
    if m.location_id != location_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    pin = MapPin(map_id=map_id, **data.model_dump())
    db.add(pin)
    db.commit()
    db.refresh(pin)
    return pin


def get_pins(db: Session, campaign_id: int, location_id: int, map_id: int, user_id: int) -> List[MapPin]:
    member = _require_member(db, campaign_id, user_id)
    m = _get_map_or_404(db, map_id)
    if m.location_id != location_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    query = db.query(MapPin).filter(MapPin.map_id == map_id)
    if member.role == "player":
        query = query.filter(MapPin.is_visible_to_players == True)
    return query.all()


def update_pin(
    db: Session, campaign_id: int, location_id: int, map_id: int, pin_id: int, data: MapPinUpdate, user_id: int
) -> MapPin:
    _require_gm(db, campaign_id, user_id)
    m = _get_map_or_404(db, map_id)
    if m.location_id != location_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    pin = db.query(MapPin).filter(MapPin.id == pin_id, MapPin.map_id == map_id).first()
    if not pin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pin {pin_id} not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pin, field, value)
    db.commit()
    db.refresh(pin)
    return pin


def delete_pin(db: Session, campaign_id: int, location_id: int, map_id: int, pin_id: int, user_id: int) -> dict:
    _require_gm(db, campaign_id, user_id)
    m = _get_map_or_404(db, map_id)
    if m.location_id != location_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Map {map_id} not found")
    pin = db.query(MapPin).filter(MapPin.id == pin_id, MapPin.map_id == map_id).first()
    if not pin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pin {pin_id} not found")
    db.delete(pin)
    db.commit()
    return {"message": "Pin deleted successfully"}


# ── Links ─────────────────────────────────────────────────────────────────────

def create_link(
    db: Session, campaign_id: int, location_id: int, data: LocationLinkCreate, user_id: int
) -> LocationLink:
    _require_gm(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    link = LocationLink(location_id=location_id, **data.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


def get_links(db: Session, campaign_id: int, location_id: int, user_id: int) -> List[LocationLink]:
    _require_member(db, campaign_id, user_id)
    loc = _get_location_or_404(db, location_id)
    if loc.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Location {location_id} not found")
    return db.query(LocationLink).filter(LocationLink.location_id == location_id).all()


def delete_link(db: Session, campaign_id: int, location_id: int, link_id: int, user_id: int) -> dict:
    _require_gm(db, campaign_id, user_id)
    link = db.query(LocationLink).filter(
        LocationLink.id == link_id, LocationLink.location_id == location_id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Link {link_id} not found")
    db.delete(link)
    db.commit()
    return {"message": "Link deleted successfully"}
