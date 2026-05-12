from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EraDirection(str, Enum):
    ascending = "ascending"
    descending = "descending"


# ── CampaignCalendar ──────────────────────────────────────────────────────────

class CalendarCreate(BaseModel):
    name: str = Field(default="Campaign Calendar", max_length=200)
    days_per_month: int = Field(default=30, ge=1, le=365)


class CalendarUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    days_per_month: Optional[int] = Field(None, ge=1, le=365)
    current_era_id: Optional[int] = None
    current_year: Optional[int] = None
    current_month_order: Optional[int] = Field(None, ge=1)
    current_day: Optional[int] = Field(None, ge=1)


class CalendarResponse(BaseModel):
    id: int
    campaign_id: int
    name: str
    days_per_month: int
    current_era_id: Optional[int] = None
    current_year: Optional[int] = None
    current_month_order: Optional[int] = None
    current_day: Optional[int] = None
    seasons: List["SeasonResponse"] = []
    months: List["MonthResponse"] = []
    eras: List["EraResponse"] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── CalendarSeason ────────────────────────────────────────────────────────────

class SeasonCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    order_index: int = Field(..., ge=1)


class SeasonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    order_index: Optional[int] = Field(None, ge=1)


class SeasonResponse(BaseModel):
    id: int
    calendar_id: int
    name: str
    order_index: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── CalendarMonth ─────────────────────────────────────────────────────────────

class MonthCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    order_index: int = Field(..., ge=1)
    season_id: Optional[int] = None


class MonthUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=1)
    season_id: Optional[int] = None


class MonthResponse(BaseModel):
    id: int
    calendar_id: int
    season_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    order_index: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── CalendarEra ───────────────────────────────────────────────────────────────

class EraCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    abbreviation: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    direction: EraDirection = EraDirection.ascending
    # Anchor against an existing era (omit for the first/primary era)
    anchor_era_id: Optional[int] = None
    anchor_era_year: Optional[int] = None
    # Year in THIS era that equals anchor_era_year in the anchor era.
    # For descending eras only: omit to use a "transition" anchor —
    # meaning year 1 of this era is the year immediately before anchor_era_year.
    anchor_this_year: Optional[int] = None
    # Oldest year in this era's own numbering (determines how far the label reaches).
    # Ascending: this is the last year of the era (null = ongoing/no end).
    # Descending: this is the highest year number (e.g. 30000 for "BBF 30,000"; null = no defined start).
    era_oldest_year: Optional[int] = Field(None, ge=1)
    is_current: bool = False
    is_visible_to_players: bool = False


class EraUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    abbreviation: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    era_oldest_year: Optional[int] = Field(None, ge=1)
    is_current: Optional[bool] = None
    is_visible_to_players: Optional[bool] = None


class EraVisibilityUpdate(BaseModel):
    is_visible_to_players: bool


class EraResponse(BaseModel):
    id: int
    calendar_id: int
    name: str
    abbreviation: str
    description: Optional[str] = None
    direction: EraDirection
    is_primary: bool
    epoch_offset: int
    anchor_era_id: Optional[int] = None
    anchor_era_year: Optional[int] = None
    anchor_this_year: Optional[int] = None
    era_start_absolute: Optional[int] = None
    era_end_absolute: Optional[int] = None
    is_current: bool
    is_visible_to_players: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


CalendarResponse.model_rebuild()
