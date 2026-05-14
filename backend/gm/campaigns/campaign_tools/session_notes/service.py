from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from typing import List, Optional

from .models import (
    SessionNote, SessionNoteNPC, SessionNoteLocation,
    SessionNoteTimelineEvent, SessionNoteCharacter,
)
from .schemas import (
    SessionNoteCreate, SessionNoteUpdate, SessionNoteVisibilityUpdate,
    SessionNoteNPCAdd, SessionNoteNPCResponse,
    SessionNoteLocationAdd, SessionNoteLocationResponse,
    SessionNoteEventAdd, SessionNoteEventResponse,
    SessionNoteCharacterAdd, SessionNoteCharacterResponse,
    SessionImageResponse,
)
from .storage import save_session_image, delete_session_image_file, delete_session_images_dir
from gm.campaigns.models import CampaignMember
from gm.campaigns.campaign_tools.timeline.schemas import EraDate
from gm.campaigns.campaign_tools.timeline.service import _compute_era_dates, _resolve_absolute_year
from gm.campaigns.campaign_tools.npcs.models import NPC
from gm.campaigns.campaign_tools.locations.models import Location
from gm.campaigns.campaign_tools.timeline.models import TimelineEvent
from players.characters.models import Character


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _require_gm(db: Session, campaign_id: int, user_id: int) -> None:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
        CampaignMember.role == "gm",
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the GM can perform this action")


def _require_member(db: Session, campaign_id: int, user_id: int) -> CampaignMember:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of this campaign")
    return member


# ── Response builder ──────────────────────────────────────────────────────────

def _session_to_response(db: Session, session: SessionNote, is_player: bool) -> SessionNote:
    """Attach era_dates and all link lists to a session for serialization."""
    era_dates = _compute_era_dates(
        db, session.campaign_id, session.absolute_year, session.month_order, session.day, is_player
    )
    session.era_dates = era_dates

    npc_links_raw = db.query(SessionNoteNPC).filter(SessionNoteNPC.session_id == session.id).all()
    npc_links = []
    for link in npc_links_raw:
        npc = db.query(NPC).filter(NPC.id == link.npc_id).first()
        if npc and (not is_player or npc.is_visible_to_players):
            npc_links.append(SessionNoteNPCResponse(
                id=link.id, session_id=link.session_id, npc_id=link.npc_id,
                npc_name=npc.name, description=link.description, created_at=link.created_at,
            ))
    session.npc_links = npc_links

    loc_links_raw = db.query(SessionNoteLocation).filter(SessionNoteLocation.session_id == session.id).all()
    location_links = []
    for link in loc_links_raw:
        loc = db.query(Location).filter(Location.id == link.location_id).first()
        if loc and (not is_player or loc.is_visible_to_players):
            location_links.append(SessionNoteLocationResponse(
                id=link.id, session_id=link.session_id, location_id=link.location_id,
                location_name=loc.name, description=link.description, created_at=link.created_at,
            ))
    session.location_links = location_links

    event_links_raw = db.query(SessionNoteTimelineEvent).filter(SessionNoteTimelineEvent.session_id == session.id).all()
    event_links = []
    for link in event_links_raw:
        event = db.query(TimelineEvent).filter(TimelineEvent.id == link.event_id).first()
        if event and (not is_player or event.is_visible_to_players):
            event_links.append(SessionNoteEventResponse(
                id=link.id, session_id=link.session_id, event_id=link.event_id,
                event_title=event.title, description=link.description, created_at=link.created_at,
            ))
    session.event_links = event_links

    char_links_raw = db.query(SessionNoteCharacter).filter(SessionNoteCharacter.session_id == session.id).all()
    character_links = []
    for link in char_links_raw:
        char = db.query(Character).filter(Character.id == link.character_id).first()
        if char and (not is_player or char.is_visible_to_players):
            character_links.append(SessionNoteCharacterResponse(
                id=link.id, session_id=link.session_id, character_id=link.character_id,
                character_name=char.name, description=link.description, created_at=link.created_at,
            ))
    session.character_links = character_links

    if is_player:
        session.gm_notes = None

    return session


# ── Session CRUD ──────────────────────────────────────────────────────────────

def list_sessions(
    db: Session, campaign_id: int, user_id: int,
    npc_id: Optional[int] = None,
    location_id: Optional[int] = None,
    event_id: Optional[int] = None,
) -> List[SessionNote]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"

    query = db.query(SessionNote).filter(SessionNote.campaign_id == campaign_id)
    if is_player:
        query = query.filter(SessionNote.is_visible_to_players == True)
    if npc_id is not None:
        query = query.join(
            SessionNoteNPC,
            (SessionNoteNPC.session_id == SessionNote.id) &
            (SessionNoteNPC.npc_id == npc_id),
        )
    if location_id is not None:
        query = query.join(
            SessionNoteLocation,
            (SessionNoteLocation.session_id == SessionNote.id) &
            (SessionNoteLocation.location_id == location_id),
        )
    if event_id is not None:
        query = query.join(
            SessionNoteTimelineEvent,
            (SessionNoteTimelineEvent.session_id == SessionNote.id) &
            (SessionNoteTimelineEvent.event_id == event_id),
        )

    sessions = query.order_by(
        SessionNote.session_number.asc().nullslast(),
        SessionNote.real_world_date.asc().nullslast(),
        SessionNote.id.asc(),
    ).all()

    for s in sessions:
        s.era_dates = _compute_era_dates(
            db, campaign_id, s.absolute_year, s.month_order, s.day, is_player
        )
        if is_player:
            s.gm_notes = None

    return sessions


def get_session(db: Session, campaign_id: int, session_id: int, user_id: int) -> SessionNote:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    session = _get_session_or_404(db, campaign_id, session_id)
    if is_player and not session.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session not visible")
    return _session_to_response(db, session, is_player)


def create_session(db: Session, campaign_id: int, data: SessionNoteCreate, user_id: int) -> SessionNote:
    _require_gm(db, campaign_id, user_id)
    absolute_year = _resolve_absolute_year(db, data.era_id, data.year)
    session = SessionNote(
        campaign_id=campaign_id,
        session_number=data.session_number,
        title=data.title,
        real_world_date=data.real_world_date,
        era_id=data.era_id,
        year=data.year,
        month_order=data.month_order,
        day=data.day,
        time_of_day=data.time_of_day.value if data.time_of_day else None,
        absolute_year=absolute_year,
        summary=data.summary,
        content=data.content,
        gm_notes=data.gm_notes,
        music_url=data.music_url,
        is_visible_to_players=data.is_visible_to_players,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_to_response(db, session, is_player=False)


def update_session(db: Session, campaign_id: int, session_id: int, data: SessionNoteUpdate, user_id: int) -> SessionNote:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)

    update_data = data.model_dump(exclude_unset=True)
    if "time_of_day" in update_data and update_data["time_of_day"] is not None:
        update_data["time_of_day"] = update_data["time_of_day"].value
    for field, value in update_data.items():
        setattr(session, field, value)

    session.absolute_year = _resolve_absolute_year(db, session.era_id, session.year)

    db.commit()
    db.refresh(session)
    return _session_to_response(db, session, is_player=False)


def delete_session(db: Session, campaign_id: int, session_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)
    delete_session_images_dir(campaign_id, session_id)
    db.delete(session)
    db.commit()


def update_session_visibility(
    db: Session, campaign_id: int, session_id: int, data: SessionNoteVisibilityUpdate, user_id: int
) -> SessionNote:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)
    session.is_visible_to_players = data.is_visible_to_players
    db.commit()
    db.refresh(session)
    return _session_to_response(db, session, is_player=False)


# ── Image upload ──────────────────────────────────────────────────────────────

async def upload_image(
    db: Session, campaign_id: int, session_id: int, file: UploadFile, user_id: int
) -> SessionImageResponse:
    _require_gm(db, campaign_id, user_id)
    _get_session_or_404(db, campaign_id, session_id)
    image_path = await save_session_image(file, campaign_id, session_id)
    return SessionImageResponse(image_url=image_path)


def delete_image(
    db: Session, campaign_id: int, session_id: int, filename: str, user_id: int
) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_session_or_404(db, campaign_id, session_id)
    if not delete_session_image_file(campaign_id, session_id, filename):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")


# ── NPC links ─────────────────────────────────────────────────────────────────

def list_npc_links(db: Session, campaign_id: int, session_id: int, user_id: int) -> List[SessionNoteNPCResponse]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    session = _get_session_or_404(db, campaign_id, session_id)
    if is_player and not session.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session not visible")

    links = db.query(SessionNoteNPC).filter(SessionNoteNPC.session_id == session_id).all()
    result = []
    for link in links:
        npc = db.query(NPC).filter(NPC.id == link.npc_id).first()
        if npc and (not is_player or npc.is_visible_to_players):
            result.append(SessionNoteNPCResponse(
                id=link.id, session_id=link.session_id, npc_id=link.npc_id,
                npc_name=npc.name, description=link.description, created_at=link.created_at,
            ))
    return result


def add_npc_link(db: Session, campaign_id: int, session_id: int, data: SessionNoteNPCAdd, user_id: int) -> SessionNoteNPCResponse:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)
    npc = db.query(NPC).filter(NPC.id == data.npc_id, NPC.campaign_id == campaign_id).first()
    if not npc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC not found in this campaign")
    existing = db.query(SessionNoteNPC).filter(
        SessionNoteNPC.session_id == session.id, SessionNoteNPC.npc_id == data.npc_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NPC already linked to this session")
    link = SessionNoteNPC(session_id=session.id, npc_id=data.npc_id, description=data.description)
    db.add(link)
    db.commit()
    db.refresh(link)
    return SessionNoteNPCResponse(
        id=link.id, session_id=link.session_id, npc_id=link.npc_id,
        npc_name=npc.name, description=link.description, created_at=link.created_at,
    )


def remove_npc_link(db: Session, campaign_id: int, session_id: int, link_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_session_or_404(db, campaign_id, session_id)
    link = db.query(SessionNoteNPC).filter(
        SessionNoteNPC.id == link_id, SessionNoteNPC.session_id == session_id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC link not found")
    db.delete(link)
    db.commit()


# ── Location links ────────────────────────────────────────────────────────────

def list_location_links(db: Session, campaign_id: int, session_id: int, user_id: int) -> List[SessionNoteLocationResponse]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    session = _get_session_or_404(db, campaign_id, session_id)
    if is_player and not session.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session not visible")

    links = db.query(SessionNoteLocation).filter(SessionNoteLocation.session_id == session_id).all()
    result = []
    for link in links:
        loc = db.query(Location).filter(Location.id == link.location_id).first()
        if loc and (not is_player or loc.is_visible_to_players):
            result.append(SessionNoteLocationResponse(
                id=link.id, session_id=link.session_id, location_id=link.location_id,
                location_name=loc.name, description=link.description, created_at=link.created_at,
            ))
    return result


def add_location_link(db: Session, campaign_id: int, session_id: int, data: SessionNoteLocationAdd, user_id: int) -> SessionNoteLocationResponse:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)
    loc = db.query(Location).filter(Location.id == data.location_id, Location.campaign_id == campaign_id).first()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found in this campaign")
    existing = db.query(SessionNoteLocation).filter(
        SessionNoteLocation.session_id == session.id, SessionNoteLocation.location_id == data.location_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Location already linked to this session")
    link = SessionNoteLocation(session_id=session.id, location_id=data.location_id, description=data.description)
    db.add(link)
    db.commit()
    db.refresh(link)
    return SessionNoteLocationResponse(
        id=link.id, session_id=link.session_id, location_id=link.location_id,
        location_name=loc.name, description=link.description, created_at=link.created_at,
    )


def remove_location_link(db: Session, campaign_id: int, session_id: int, link_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_session_or_404(db, campaign_id, session_id)
    link = db.query(SessionNoteLocation).filter(
        SessionNoteLocation.id == link_id, SessionNoteLocation.session_id == session_id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location link not found")
    db.delete(link)
    db.commit()


# ── Timeline event links ──────────────────────────────────────────────────────

def list_event_links(db: Session, campaign_id: int, session_id: int, user_id: int) -> List[SessionNoteEventResponse]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    session = _get_session_or_404(db, campaign_id, session_id)
    if is_player and not session.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session not visible")

    links = db.query(SessionNoteTimelineEvent).filter(SessionNoteTimelineEvent.session_id == session_id).all()
    result = []
    for link in links:
        event = db.query(TimelineEvent).filter(TimelineEvent.id == link.event_id).first()
        if event and (not is_player or event.is_visible_to_players):
            result.append(SessionNoteEventResponse(
                id=link.id, session_id=link.session_id, event_id=link.event_id,
                event_title=event.title, description=link.description, created_at=link.created_at,
            ))
    return result


def add_event_link(db: Session, campaign_id: int, session_id: int, data: SessionNoteEventAdd, user_id: int) -> SessionNoteEventResponse:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)
    event = db.query(TimelineEvent).filter(TimelineEvent.id == data.event_id, TimelineEvent.campaign_id == campaign_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline event not found in this campaign")
    existing = db.query(SessionNoteTimelineEvent).filter(
        SessionNoteTimelineEvent.session_id == session.id, SessionNoteTimelineEvent.event_id == data.event_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event already linked to this session")
    link = SessionNoteTimelineEvent(session_id=session.id, event_id=data.event_id, description=data.description)
    db.add(link)
    db.commit()
    db.refresh(link)
    return SessionNoteEventResponse(
        id=link.id, session_id=link.session_id, event_id=link.event_id,
        event_title=event.title, description=link.description, created_at=link.created_at,
    )


def remove_event_link(db: Session, campaign_id: int, session_id: int, link_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_session_or_404(db, campaign_id, session_id)
    link = db.query(SessionNoteTimelineEvent).filter(
        SessionNoteTimelineEvent.id == link_id, SessionNoteTimelineEvent.session_id == session_id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event link not found")
    db.delete(link)
    db.commit()


# ── Character links ───────────────────────────────────────────────────────────

def list_character_links(db: Session, campaign_id: int, session_id: int, user_id: int) -> List[SessionNoteCharacterResponse]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    session = _get_session_or_404(db, campaign_id, session_id)
    if is_player and not session.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Session not visible")

    links = db.query(SessionNoteCharacter).filter(SessionNoteCharacter.session_id == session_id).all()
    result = []
    for link in links:
        char = db.query(Character).filter(Character.id == link.character_id).first()
        if char and (not is_player or char.is_visible_to_players):
            result.append(SessionNoteCharacterResponse(
                id=link.id, session_id=link.session_id, character_id=link.character_id,
                character_name=char.name, description=link.description, created_at=link.created_at,
            ))
    return result


def add_character_link(db: Session, campaign_id: int, session_id: int, data: SessionNoteCharacterAdd, user_id: int) -> SessionNoteCharacterResponse:
    _require_gm(db, campaign_id, user_id)
    session = _get_session_or_404(db, campaign_id, session_id)
    char = db.query(Character).filter(Character.id == data.character_id, Character.campaign_id == campaign_id).first()
    if not char:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found in this campaign")
    existing = db.query(SessionNoteCharacter).filter(
        SessionNoteCharacter.session_id == session.id, SessionNoteCharacter.character_id == data.character_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Character already linked to this session")
    link = SessionNoteCharacter(session_id=session.id, character_id=data.character_id, description=data.description)
    db.add(link)
    db.commit()
    db.refresh(link)
    return SessionNoteCharacterResponse(
        id=link.id, session_id=link.session_id, character_id=link.character_id,
        character_name=char.name, description=link.description, created_at=link.created_at,
    )


def remove_character_link(db: Session, campaign_id: int, session_id: int, link_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_session_or_404(db, campaign_id, session_id)
    link = db.query(SessionNoteCharacter).filter(
        SessionNoteCharacter.id == link_id, SessionNoteCharacter.session_id == session_id
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character link not found")
    db.delete(link)
    db.commit()


# ── Internal helpers ──────────────────────────────────────────────────────────

def _get_session_or_404(db: Session, campaign_id: int, session_id: int) -> SessionNote:
    session = db.query(SessionNote).filter(
        SessionNote.id == session_id,
        SessionNote.campaign_id == campaign_id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {session_id} not found")
    return session
