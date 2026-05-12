from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Era date display ──────────────────────────────────────────────────────────

class EraDate(BaseModel):
    """One era's representation of an event date."""
    era_id: int
    era_name: str
    abbreviation: str
    year: int
    month_name: Optional[str] = None
    day: Optional[int] = None
    is_visible_to_players: bool


# ── TimelineEvent ─────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = Field(None, ge=1)
    day: Optional[int] = Field(None, ge=1)
    is_visible_to_players: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = Field(None, ge=1)
    day: Optional[int] = Field(None, ge=1)
    is_visible_to_players: Optional[bool] = None


class EventVisibilityUpdate(BaseModel):
    is_visible_to_players: bool


class EventResponse(BaseModel):
    id: int
    campaign_id: int
    title: str
    description: Optional[str] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = None
    day: Optional[int] = None
    absolute_year: Optional[int] = None
    # Computed: this event's date expressed in every applicable era
    era_dates: List[EraDate] = []
    is_visible_to_players: bool
    npc_links: List["EventNPCResponse"] = []
    location_links: List["EventLocationResponse"] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EventListItem(BaseModel):
    id: int
    campaign_id: int
    title: str
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = None
    day: Optional[int] = None
    absolute_year: Optional[int] = None
    era_dates: List[EraDate] = []
    is_visible_to_players: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Event NPC link ────────────────────────────────────────────────────────────

class EventNPCAdd(BaseModel):
    npc_id: int
    description: Optional[str] = None


class EventNPCResponse(BaseModel):
    id: int
    event_id: int
    npc_id: int
    npc_name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Event Location link ───────────────────────────────────────────────────────

class EventLocationAdd(BaseModel):
    location_id: int
    description: Optional[str] = None


class EventLocationResponse(BaseModel):
    id: int
    event_id: int
    location_id: int
    location_name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


EventResponse.model_rebuild()
