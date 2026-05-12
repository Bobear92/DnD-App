from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import (
    CalendarCreate, CalendarUpdate, CalendarResponse,
    SeasonCreate, SeasonUpdate, SeasonResponse,
    MonthCreate, MonthUpdate, MonthResponse,
    EraCreate, EraUpdate, EraVisibilityUpdate, EraResponse,
)
from . import service

router = APIRouter(
    prefix="/api/gm/campaigns/{campaign_id}/calendar",
    tags=["GM Campaign Tools - Calendar"],
)


# ── Calendar ──────────────────────────────────────────────────────────────────

@router.post("", response_model=CalendarResponse, status_code=status.HTTP_201_CREATED)
def create_calendar(
    campaign_id: int,
    data: CalendarCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_calendar(db, campaign_id, data, current_user.id)


@router.get("", response_model=CalendarResponse)
def get_calendar(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_calendar(db, campaign_id, current_user.id)


@router.put("", response_model=CalendarResponse)
def update_calendar(
    campaign_id: int,
    data: CalendarUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_calendar(db, campaign_id, data, current_user.id)


# ── Seasons ───────────────────────────────────────────────────────────────────

@router.post("/seasons", response_model=SeasonResponse, status_code=status.HTTP_201_CREATED)
def create_season(
    campaign_id: int,
    data: SeasonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_season(db, campaign_id, data, current_user.id)


@router.put("/seasons/{season_id}", response_model=SeasonResponse)
def update_season(
    campaign_id: int,
    season_id: int,
    data: SeasonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_season(db, campaign_id, season_id, data, current_user.id)


@router.delete("/seasons/{season_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_season(
    campaign_id: int,
    season_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_season(db, campaign_id, season_id, current_user.id)


# ── Months ────────────────────────────────────────────────────────────────────

@router.post("/months", response_model=MonthResponse, status_code=status.HTTP_201_CREATED)
def create_month(
    campaign_id: int,
    data: MonthCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_month(db, campaign_id, data, current_user.id)


@router.put("/months/{month_id}", response_model=MonthResponse)
def update_month(
    campaign_id: int,
    month_id: int,
    data: MonthUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_month(db, campaign_id, month_id, data, current_user.id)


@router.delete("/months/{month_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_month(
    campaign_id: int,
    month_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_month(db, campaign_id, month_id, current_user.id)


# ── Eras ──────────────────────────────────────────────────────────────────────

@router.post("/eras", response_model=EraResponse, status_code=status.HTTP_201_CREATED)
def create_era(
    campaign_id: int,
    data: EraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_era(db, campaign_id, data, current_user.id)


@router.put("/eras/{era_id}", response_model=EraResponse)
def update_era(
    campaign_id: int,
    era_id: int,
    data: EraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_era(db, campaign_id, era_id, data, current_user.id)


@router.delete("/eras/{era_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_era(
    campaign_id: int,
    era_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_era(db, campaign_id, era_id, current_user.id)


@router.patch("/eras/{era_id}/visibility", response_model=EraResponse)
def update_era_visibility(
    campaign_id: int,
    era_id: int,
    data: EraVisibilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_era_visibility(db, campaign_id, era_id, data, current_user.id)
