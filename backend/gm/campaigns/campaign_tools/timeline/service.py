from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import TimelineEvent, TimelineEventNPC, TimelineEventLocation
from .schemas import (
    EventCreate, EventUpdate, EventVisibilityUpdate,
    EventNPCAdd, EventLocationAdd,
    EraDate, EventNPCResponse, EventLocationResponse,
)
from gm.campaigns.models import CampaignMember
from gm.campaigns.campaign_tools.calendar.models import CampaignCalendar, CalendarEra, CalendarMonth, EraDirection
from gm.campaigns.campaign_tools.calendar.service import era_to_absolute, absolute_to_era
from gm.campaigns.campaign_tools.npcs.models import NPC
from gm.campaigns.campaign_tools.locations.models import Location


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


# ── Era date computation ──────────────────────────────────────────────────────

def _compute_era_dates(
    db: Session,
    campaign_id: int,
    absolute_year: Optional[int],
    month_order: Optional[int],
    day: Optional[int],
    is_player: bool,
) -> List[EraDate]:
    """Return the event's date expressed in every applicable (and visible) era."""
    if absolute_year is None:
        return []

    cal = db.query(CampaignCalendar).filter(CampaignCalendar.campaign_id == campaign_id).first()
    if not cal:
        return []

    eras = db.query(CalendarEra).filter(CalendarEra.calendar_id == cal.id).all()
    result = []

    month_name: Optional[str] = None
    if month_order is not None:
        m = db.query(CalendarMonth).filter(
            CalendarMonth.calendar_id == cal.id,
            CalendarMonth.order_index == month_order,
        ).first()
        if m:
            month_name = m.name

    for era in eras:
        if is_player and not era.is_visible_to_players:
            continue
        # Check if absolute_year falls within this era's applicable range
        if era.era_start_absolute is not None and absolute_year < era.era_start_absolute:
            continue
        if era.era_end_absolute is not None and absolute_year > era.era_end_absolute:
            continue
        era_year = absolute_to_era(era, absolute_year)
        if era_year <= 0:
            continue  # no year 0 or negative years displayed
        result.append(EraDate(
            era_id=era.id,
            era_name=era.name,
            abbreviation=era.abbreviation,
            year=era_year,
            month_name=month_name,
            day=day,
            is_visible_to_players=era.is_visible_to_players,
        ))

    return result


def _event_to_response(db: Session, event: TimelineEvent, is_player: bool):
    """Attach era_dates, npc_links, and location_links to an event for serialization."""
    era_dates = _compute_era_dates(
        db, event.campaign_id, event.absolute_year, event.month_order, event.day, is_player
    )

    npc_links_raw = db.query(TimelineEventNPC).filter(TimelineEventNPC.event_id == event.id).all()
    npc_links = []
    for link in npc_links_raw:
        npc = db.query(NPC).filter(NPC.id == link.npc_id).first()
        if npc and (not is_player or npc.is_visible_to_players):
            npc_links.append(EventNPCResponse(
                id=link.id,
                event_id=link.event_id,
                npc_id=link.npc_id,
                npc_name=npc.name,
                description=link.description,
                created_at=link.created_at,
            ))

    location_links_raw = db.query(TimelineEventLocation).filter(TimelineEventLocation.event_id == event.id).all()
    location_links = []
    for link in location_links_raw:
        loc = db.query(Location).filter(Location.id == link.location_id).first()
        if loc and (not is_player or loc.is_visible_to_players):
            location_links.append(EventLocationResponse(
                id=link.id,
                event_id=link.event_id,
                location_id=link.location_id,
                location_name=loc.name,
                description=link.description,
                created_at=link.created_at,
            ))

    event.era_dates = era_dates
    event.npc_links = npc_links
    event.location_links = location_links
    return event


# ── Timeline event CRUD ───────────────────────────────────────────────────────

def list_events(db: Session, campaign_id: int, user_id: int) -> List[TimelineEvent]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"

    query = db.query(TimelineEvent).filter(TimelineEvent.campaign_id == campaign_id)
    if is_player:
        query = query.filter(TimelineEvent.is_visible_to_players == True)
    events = query.order_by(
        TimelineEvent.absolute_year.asc().nullsfirst(),
        TimelineEvent.month_order.asc().nullsfirst(),
        TimelineEvent.day.asc().nullsfirst(),
    ).all()

    for event in events:
        era_dates = _compute_era_dates(
            db, campaign_id, event.absolute_year, event.month_order, event.day, is_player
        )
        event.era_dates = era_dates

    return events


def get_event(db: Session, campaign_id: int, event_id: int, user_id: int) -> TimelineEvent:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    event = _get_event_or_404(db, campaign_id, event_id)
    if is_player and not event.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Event not visible")
    return _event_to_response(db, event, is_player)


def create_event(db: Session, campaign_id: int, data: EventCreate, user_id: int) -> TimelineEvent:
    _require_gm(db, campaign_id, user_id)

    absolute_year = _resolve_absolute_year(db, data.era_id, data.year)

    event = TimelineEvent(
        campaign_id=campaign_id,
        title=data.title,
        description=data.description,
        era_id=data.era_id,
        year=data.year,
        month_order=data.month_order,
        day=data.day,
        absolute_year=absolute_year,
        is_visible_to_players=data.is_visible_to_players,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_to_response(db, event, is_player=False)


def update_event(db: Session, campaign_id: int, event_id: int, data: EventUpdate, user_id: int) -> TimelineEvent:
    _require_gm(db, campaign_id, user_id)
    event = _get_event_or_404(db, campaign_id, event_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    # Recompute absolute_year if era or year changed
    event.absolute_year = _resolve_absolute_year(db, event.era_id, event.year)

    db.commit()
    db.refresh(event)
    return _event_to_response(db, event, is_player=False)


def delete_event(db: Session, campaign_id: int, event_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    event = _get_event_or_404(db, campaign_id, event_id)
    db.delete(event)
    db.commit()


def update_event_visibility(
    db: Session, campaign_id: int, event_id: int, data: EventVisibilityUpdate, user_id: int
) -> TimelineEvent:
    _require_gm(db, campaign_id, user_id)
    event = _get_event_or_404(db, campaign_id, event_id)
    event.is_visible_to_players = data.is_visible_to_players
    db.commit()
    db.refresh(event)
    return _event_to_response(db, event, is_player=False)


# ── NPC links ─────────────────────────────────────────────────────────────────

def add_npc_link(db: Session, campaign_id: int, event_id: int, data: EventNPCAdd, user_id: int) -> EventNPCResponse:
    _require_gm(db, campaign_id, user_id)
    event = _get_event_or_404(db, campaign_id, event_id)

    npc = db.query(NPC).filter(NPC.id == data.npc_id, NPC.campaign_id == campaign_id).first()
    if not npc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC not found in this campaign")

    existing = db.query(TimelineEventNPC).filter(
        TimelineEventNPC.event_id == event.id,
        TimelineEventNPC.npc_id == data.npc_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NPC already linked to this event")

    link = TimelineEventNPC(event_id=event.id, npc_id=data.npc_id, description=data.description)
    db.add(link)
    db.commit()
    db.refresh(link)
    return EventNPCResponse(
        id=link.id, event_id=link.event_id, npc_id=link.npc_id,
        npc_name=npc.name, description=link.description, created_at=link.created_at,
    )


def remove_npc_link(db: Session, campaign_id: int, event_id: int, link_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_event_or_404(db, campaign_id, event_id)
    link = db.query(TimelineEventNPC).filter(
        TimelineEventNPC.id == link_id,
        TimelineEventNPC.event_id == event_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC link not found")
    db.delete(link)
    db.commit()


def list_npc_links(db: Session, campaign_id: int, event_id: int, user_id: int) -> List[EventNPCResponse]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    event = _get_event_or_404(db, campaign_id, event_id)
    if is_player and not event.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Event not visible")

    links = db.query(TimelineEventNPC).filter(TimelineEventNPC.event_id == event_id).all()
    result = []
    for link in links:
        npc = db.query(NPC).filter(NPC.id == link.npc_id).first()
        if npc and (not is_player or npc.is_visible_to_players):
            result.append(EventNPCResponse(
                id=link.id, event_id=link.event_id, npc_id=link.npc_id,
                npc_name=npc.name, description=link.description, created_at=link.created_at,
            ))
    return result


# ── Location links ────────────────────────────────────────────────────────────

def add_location_link(
    db: Session, campaign_id: int, event_id: int, data: EventLocationAdd, user_id: int
) -> EventLocationResponse:
    _require_gm(db, campaign_id, user_id)
    event = _get_event_or_404(db, campaign_id, event_id)

    loc = db.query(Location).filter(Location.id == data.location_id, Location.campaign_id == campaign_id).first()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found in this campaign")

    existing = db.query(TimelineEventLocation).filter(
        TimelineEventLocation.event_id == event.id,
        TimelineEventLocation.location_id == data.location_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Location already linked to this event")

    link = TimelineEventLocation(event_id=event.id, location_id=data.location_id, description=data.description)
    db.add(link)
    db.commit()
    db.refresh(link)
    return EventLocationResponse(
        id=link.id, event_id=link.event_id, location_id=link.location_id,
        location_name=loc.name, description=link.description, created_at=link.created_at,
    )


def remove_location_link(db: Session, campaign_id: int, event_id: int, link_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_event_or_404(db, campaign_id, event_id)
    link = db.query(TimelineEventLocation).filter(
        TimelineEventLocation.id == link_id,
        TimelineEventLocation.event_id == event_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location link not found")
    db.delete(link)
    db.commit()


def list_location_links(
    db: Session, campaign_id: int, event_id: int, user_id: int
) -> List[EventLocationResponse]:
    member = _require_member(db, campaign_id, user_id)
    is_player = member.role != "gm"
    event = _get_event_or_404(db, campaign_id, event_id)
    if is_player and not event.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Event not visible")

    links = db.query(TimelineEventLocation).filter(TimelineEventLocation.event_id == event_id).all()
    result = []
    for link in links:
        loc = db.query(Location).filter(Location.id == link.location_id).first()
        if loc and (not is_player or loc.is_visible_to_players):
            result.append(EventLocationResponse(
                id=link.id, event_id=link.event_id, location_id=link.location_id,
                location_name=loc.name, description=link.description, created_at=link.created_at,
            ))
    return result


# ── Internal helpers ──────────────────────────────────────────────────────────

def _resolve_absolute_year(db: Session, era_id: Optional[int], year: Optional[int]) -> Optional[int]:
    """Compute absolute_year from era + year. Returns None if either is absent."""
    if era_id is None or year is None:
        return None
    era = db.query(CalendarEra).filter(CalendarEra.id == era_id).first()
    if not era:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Era not found")
    return era_to_absolute(era, year)


def _get_event_or_404(db: Session, campaign_id: int, event_id: int) -> TimelineEvent:
    event = db.query(TimelineEvent).filter(
        TimelineEvent.id == event_id,
        TimelineEvent.campaign_id == campaign_id,
    ).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Event {event_id} not found")
    return event
