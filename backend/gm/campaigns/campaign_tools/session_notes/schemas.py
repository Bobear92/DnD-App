from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

from gm.campaigns.campaign_tools.timeline.schemas import EraDate


# ── Session Note CRUD ─────────────────────────────────────────────────────────

class SessionNoteCreate(BaseModel):
    session_number: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=500)
    real_world_date: Optional[date] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = Field(None, ge=1)
    day: Optional[int] = Field(None, ge=1)
    end_year: Optional[int] = None
    end_month_order: Optional[int] = Field(None, ge=1)
    end_day: Optional[int] = Field(None, ge=1)
    summary: Optional[str] = None
    content: Optional[str] = None
    gm_notes: Optional[str] = None
    music_url: Optional[str] = None
    music_description: Optional[str] = None
    is_visible_to_players: bool = False


class SessionNoteUpdate(BaseModel):
    session_number: Optional[int] = None
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    real_world_date: Optional[date] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = Field(None, ge=1)
    day: Optional[int] = Field(None, ge=1)
    end_year: Optional[int] = None
    end_month_order: Optional[int] = Field(None, ge=1)
    end_day: Optional[int] = Field(None, ge=1)
    summary: Optional[str] = None
    content: Optional[str] = None
    gm_notes: Optional[str] = None
    music_url: Optional[str] = None
    music_description: Optional[str] = None
    is_visible_to_players: Optional[bool] = None


class SessionNoteVisibilityUpdate(BaseModel):
    is_visible_to_players: bool


class SessionNoteResponse(BaseModel):
    id: int
    campaign_id: int
    session_number: Optional[int] = None
    title: str
    real_world_date: Optional[date] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = None
    day: Optional[int] = None
    end_year: Optional[int] = None
    end_month_order: Optional[int] = None
    end_day: Optional[int] = None
    absolute_year: Optional[int] = None
    era_dates: List[EraDate] = []
    summary: Optional[str] = None
    content: Optional[str] = None
    gm_notes: Optional[str] = None
    music_url: Optional[str] = None
    music_description: Optional[str] = None
    is_visible_to_players: bool
    npc_links: List["SessionNoteNPCResponse"] = []
    location_links: List["SessionNoteLocationResponse"] = []
    event_links: List["SessionNoteEventResponse"] = []
    character_links: List["SessionNoteCharacterResponse"] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SessionNoteListItem(BaseModel):
    id: int
    campaign_id: int
    session_number: Optional[int] = None
    title: str
    real_world_date: Optional[date] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = None
    day: Optional[int] = None
    end_year: Optional[int] = None
    end_month_order: Optional[int] = None
    end_day: Optional[int] = None
    absolute_year: Optional[int] = None
    era_dates: List[EraDate] = []
    summary: Optional[str] = None
    is_visible_to_players: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Image upload ──────────────────────────────────────────────────────────────

class SessionImageResponse(BaseModel):
    image_url: str


# ── NPC link ──────────────────────────────────────────────────────────────────

class SessionNoteNPCAdd(BaseModel):
    npc_id: int
    description: Optional[str] = None


class SessionNoteNPCResponse(BaseModel):
    id: int
    session_id: int
    npc_id: int
    npc_name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Location link ─────────────────────────────────────────────────────────────

class SessionNoteLocationAdd(BaseModel):
    location_id: int
    description: Optional[str] = None


class SessionNoteLocationResponse(BaseModel):
    id: int
    session_id: int
    location_id: int
    location_name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Timeline event link ───────────────────────────────────────────────────────

class SessionNoteEventAdd(BaseModel):
    event_id: int
    description: Optional[str] = None


class SessionNoteEventResponse(BaseModel):
    id: int
    session_id: int
    event_id: int
    event_title: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Character link ────────────────────────────────────────────────────────────

class SessionNoteCharacterAdd(BaseModel):
    character_id: int
    description: Optional[str] = None


class SessionNoteCharacterResponse(BaseModel):
    id: int
    session_id: int
    character_id: int
    character_name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


SessionNoteResponse.model_rebuild()
