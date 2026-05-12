from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import CampaignCalendar, CalendarSeason, CalendarMonth, CalendarEra, EraDirection
from .schemas import (
    CalendarCreate, CalendarUpdate,
    SeasonCreate, SeasonUpdate,
    MonthCreate, MonthUpdate,
    EraCreate, EraUpdate, EraVisibilityUpdate,
)
from gm.campaigns.models import CampaignMember


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _require_gm(db: Session, campaign_id: int, user_id: int) -> None:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
        CampaignMember.role == "gm",
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the GM can perform this action")


def _require_member(db: Session, campaign_id: int, user_id: int) -> None:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be a member of this campaign")


# ── Era math ──────────────────────────────────────────────────────────────────

def era_to_absolute(era: CalendarEra, era_year: int) -> int:
    """Convert an era year to the absolute internal year."""
    if era.direction == EraDirection.ascending:
        return era_year + era.epoch_offset
    return era.epoch_offset - era_year


def absolute_to_era(era: CalendarEra, absolute_year: int) -> int:
    """Convert an absolute internal year to this era's year."""
    if era.direction == EraDirection.ascending:
        return absolute_year - era.epoch_offset
    return era.epoch_offset - absolute_year


def _compute_epoch_offset(
    db: Session,
    direction: EraDirection,
    anchor_era_id: Optional[int],
    anchor_era_year: Optional[int],
    anchor_this_year: Optional[int],
) -> int:
    """Compute epoch_offset from GM-provided anchor inputs.

    Ascending era:
      anchor = "anchor_era_year in ref era = anchor_this_year in this era"
      epoch_offset = ref_absolute(anchor_era_year) - anchor_this_year

    Descending era, same-year anchor (anchor_this_year provided):
      anchor = "anchor_era_year in ref era = anchor_this_year in this era"
      epoch_offset = ref_absolute(anchor_era_year) + anchor_this_year

    Descending era, transition anchor (anchor_this_year is None):
      year 1 of this era is the year immediately BEFORE anchor_era_year in the ref era.
      epoch_offset = ref_absolute(anchor_era_year)
      → era year 1 = epoch_offset - 1 = ref_absolute - 1 (one year before the transition)
    """
    if anchor_era_id is None:
        return 0  # primary era

    ref_era = db.query(CalendarEra).filter(CalendarEra.id == anchor_era_id).first()
    if not ref_era:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor era not found")

    ref_absolute = era_to_absolute(ref_era, anchor_era_year)

    if direction == EraDirection.ascending:
        if anchor_this_year is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="anchor_this_year is required for ascending eras",
            )
        return ref_absolute - anchor_this_year

    # Descending
    if anchor_this_year is None:
        # Transition anchor: year 1 of this era is the year before anchor_era_year
        return ref_absolute
    # Same-year anchor
    return ref_absolute + anchor_this_year


def _compute_era_range(
    direction: EraDirection,
    epoch_offset: int,
    era_oldest_year: Optional[int],
) -> tuple[Optional[int], Optional[int]]:
    """Return (era_start_absolute, era_end_absolute).

    Ascending: starts at year 1 (auto), ends at era_oldest_year if provided.
    Descending: starts at era_oldest_year if provided, ends at year 1 (auto).
    """
    if direction == EraDirection.ascending:
        start = epoch_offset + 1
        end = (epoch_offset + era_oldest_year) if era_oldest_year else None
        return start, end

    # Descending: year 1 is the newest (closest to transition), largest year is oldest
    end = epoch_offset - 1          # absolute year of era year 1
    start = (epoch_offset - era_oldest_year) if era_oldest_year else None
    return start, end


# ── Calendar CRUD ─────────────────────────────────────────────────────────────

def get_calendar(db: Session, campaign_id: int, user_id: int) -> CampaignCalendar:
    _require_member(db, campaign_id, user_id)
    cal = db.query(CampaignCalendar).filter(CampaignCalendar.campaign_id == campaign_id).first()
    if not cal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No calendar found for this campaign")
    return _load_calendar(db, cal)


def create_calendar(db: Session, campaign_id: int, data: CalendarCreate, user_id: int) -> CampaignCalendar:
    _require_gm(db, campaign_id, user_id)
    existing = db.query(CampaignCalendar).filter(CampaignCalendar.campaign_id == campaign_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A calendar already exists for this campaign")
    cal = CampaignCalendar(campaign_id=campaign_id, name=data.name, days_per_month=data.days_per_month)
    db.add(cal)
    db.commit()
    db.refresh(cal)
    return _load_calendar(db, cal)


def update_calendar(db: Session, campaign_id: int, data: CalendarUpdate, user_id: int) -> CampaignCalendar:
    _require_gm(db, campaign_id, user_id)
    cal = db.query(CampaignCalendar).filter(CampaignCalendar.campaign_id == campaign_id).first()
    if not cal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No calendar found for this campaign")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cal, field, value)
    db.commit()
    db.refresh(cal)
    return _load_calendar(db, cal)


def _load_calendar(db: Session, cal: CampaignCalendar):
    """Attach seasons, months, and eras onto a calendar instance for response serialization."""
    cal.seasons = (
        db.query(CalendarSeason)
        .filter(CalendarSeason.calendar_id == cal.id)
        .order_by(CalendarSeason.order_index)
        .all()
    )
    cal.months = (
        db.query(CalendarMonth)
        .filter(CalendarMonth.calendar_id == cal.id)
        .order_by(CalendarMonth.order_index)
        .all()
    )
    cal.eras = (
        db.query(CalendarEra)
        .filter(CalendarEra.calendar_id == cal.id)
        .order_by(CalendarEra.id)
        .all()
    )
    return cal


# ── Season CRUD ───────────────────────────────────────────────────────────────

def create_season(db: Session, campaign_id: int, data: SeasonCreate, user_id: int) -> CalendarSeason:
    _require_gm(db, campaign_id, user_id)
    cal = _get_calendar_or_404(db, campaign_id)
    season = CalendarSeason(calendar_id=cal.id, name=data.name, order_index=data.order_index)
    db.add(season)
    db.commit()
    db.refresh(season)
    return season


def update_season(db: Session, campaign_id: int, season_id: int, data: SeasonUpdate, user_id: int) -> CalendarSeason:
    _require_gm(db, campaign_id, user_id)
    season = _get_season_or_404(db, campaign_id, season_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(season, field, value)
    db.commit()
    db.refresh(season)
    return season


def delete_season(db: Session, campaign_id: int, season_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    season = _get_season_or_404(db, campaign_id, season_id)
    db.delete(season)
    db.commit()


# ── Month CRUD ────────────────────────────────────────────────────────────────

def create_month(db: Session, campaign_id: int, data: MonthCreate, user_id: int) -> CalendarMonth:
    _require_gm(db, campaign_id, user_id)
    cal = _get_calendar_or_404(db, campaign_id)
    if data.season_id:
        _get_season_or_404(db, campaign_id, data.season_id)
    month = CalendarMonth(
        calendar_id=cal.id,
        season_id=data.season_id,
        name=data.name,
        description=data.description,
        order_index=data.order_index,
    )
    db.add(month)
    db.commit()
    db.refresh(month)
    return month


def update_month(db: Session, campaign_id: int, month_id: int, data: MonthUpdate, user_id: int) -> CalendarMonth:
    _require_gm(db, campaign_id, user_id)
    month = _get_month_or_404(db, campaign_id, month_id)
    if data.season_id:
        _get_season_or_404(db, campaign_id, data.season_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(month, field, value)
    db.commit()
    db.refresh(month)
    return month


def delete_month(db: Session, campaign_id: int, month_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    month = _get_month_or_404(db, campaign_id, month_id)
    db.delete(month)
    db.commit()


# ── Era CRUD ──────────────────────────────────────────────────────────────────

def create_era(db: Session, campaign_id: int, data: EraCreate, user_id: int) -> CalendarEra:
    _require_gm(db, campaign_id, user_id)
    cal = _get_calendar_or_404(db, campaign_id)

    existing_eras = db.query(CalendarEra).filter(CalendarEra.calendar_id == cal.id).count()
    is_primary = existing_eras == 0  # first era becomes primary

    if is_primary:
        if data.direction != "ascending" and data.direction.value != "ascending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The primary (first) era must be ascending",
            )
        epoch_offset = 0
        anchor_era_id = None
        anchor_era_year = None
        anchor_this_year = None
    else:
        if data.anchor_era_id is None or data.anchor_era_year is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="anchor_era_id and anchor_era_year are required for non-primary eras",
            )
        # Verify anchor era belongs to this calendar
        anchor_era = db.query(CalendarEra).filter(
            CalendarEra.id == data.anchor_era_id,
            CalendarEra.calendar_id == cal.id,
        ).first()
        if not anchor_era:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anchor era not found in this calendar")

        epoch_offset = _compute_epoch_offset(
            db,
            data.direction if isinstance(data.direction, EraDirection) else EraDirection(data.direction),
            data.anchor_era_id,
            data.anchor_era_year,
            data.anchor_this_year,
        )
        anchor_era_id = data.anchor_era_id
        anchor_era_year = data.anchor_era_year
        anchor_this_year = data.anchor_this_year

    direction = data.direction if isinstance(data.direction, EraDirection) else EraDirection(data.direction)
    era_start_absolute, era_end_absolute = _compute_era_range(direction, epoch_offset, data.era_oldest_year)

    if data.is_current:
        # Clear is_current on all other eras in this calendar
        db.query(CalendarEra).filter(CalendarEra.calendar_id == cal.id).update({"is_current": False})

    era = CalendarEra(
        calendar_id=cal.id,
        name=data.name,
        abbreviation=data.abbreviation,
        description=data.description,
        direction=direction,
        is_primary=is_primary,
        epoch_offset=epoch_offset,
        anchor_era_id=anchor_era_id,
        anchor_era_year=anchor_era_year,
        anchor_this_year=anchor_this_year,
        era_start_absolute=era_start_absolute,
        era_end_absolute=era_end_absolute,
        is_current=data.is_current,
        is_visible_to_players=data.is_visible_to_players,
    )
    db.add(era)
    db.commit()
    db.refresh(era)
    return era


def update_era(db: Session, campaign_id: int, era_id: int, data: EraUpdate, user_id: int) -> CalendarEra:
    _require_gm(db, campaign_id, user_id)
    era = _get_era_or_404(db, campaign_id, era_id)

    if data.is_current is True:
        db.query(CalendarEra).filter(
            CalendarEra.calendar_id == era.calendar_id,
            CalendarEra.id != era_id,
        ).update({"is_current": False})

    for field, value in data.model_dump(exclude_unset=True, exclude={"era_oldest_year"}).items():
        setattr(era, field, value)

    if data.era_oldest_year is not None:
        start, end = _compute_era_range(era.direction, era.epoch_offset, data.era_oldest_year)
        era.era_start_absolute = start
        era.era_end_absolute = end

    db.commit()
    db.refresh(era)
    return era


def delete_era(db: Session, campaign_id: int, era_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    era = _get_era_or_404(db, campaign_id, era_id)
    if era.is_primary:
        other_count = db.query(CalendarEra).filter(
            CalendarEra.calendar_id == era.calendar_id,
            CalendarEra.id != era_id,
        ).count()
        if other_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete the primary era while other eras exist. Delete other eras first.",
            )
    db.delete(era)
    db.commit()


def update_era_visibility(
    db: Session, campaign_id: int, era_id: int, data: EraVisibilityUpdate, user_id: int
) -> CalendarEra:
    _require_gm(db, campaign_id, user_id)
    era = _get_era_or_404(db, campaign_id, era_id)
    era.is_visible_to_players = data.is_visible_to_players
    db.commit()
    db.refresh(era)
    return era


# ── Internal fetchers ─────────────────────────────────────────────────────────

def _get_calendar_or_404(db: Session, campaign_id: int) -> CampaignCalendar:
    cal = db.query(CampaignCalendar).filter(CampaignCalendar.campaign_id == campaign_id).first()
    if not cal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No calendar found for this campaign")
    return cal


def _get_season_or_404(db: Session, campaign_id: int, season_id: int) -> CalendarSeason:
    cal = _get_calendar_or_404(db, campaign_id)
    season = db.query(CalendarSeason).filter(
        CalendarSeason.id == season_id,
        CalendarSeason.calendar_id == cal.id,
    ).first()
    if not season:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Season {season_id} not found")
    return season


def _get_month_or_404(db: Session, campaign_id: int, month_id: int) -> CalendarMonth:
    cal = _get_calendar_or_404(db, campaign_id)
    month = db.query(CalendarMonth).filter(
        CalendarMonth.id == month_id,
        CalendarMonth.calendar_id == cal.id,
    ).first()
    if not month:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Month {month_id} not found")
    return month


def _get_era_or_404(db: Session, campaign_id: int, era_id: int) -> CalendarEra:
    cal = _get_calendar_or_404(db, campaign_id)
    era = db.query(CalendarEra).filter(
        CalendarEra.id == era_id,
        CalendarEra.calendar_id == cal.id,
    ).first()
    if not era:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Era {era_id} not found")
    return era
