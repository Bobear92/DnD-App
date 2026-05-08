from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RelationshipDirection(str, Enum):
    a_above_b = "a_above_b"
    b_above_a = "b_above_a"
    same_level = "same_level"


# ── Location ──────────────────────────────────────────────────────────────────

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    gm_notes: Optional[str] = None
    location_type: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=100)
    is_visible_to_players: bool = Field(default=False)
    # Hierarchy
    parent_location_id: Optional[int] = None
    is_top_level: bool = Field(default=False)
    is_unknown: bool = Field(default=False)
    # Environment
    weather: Optional[str] = None
    plant_life: Optional[str] = None
    animal_life: Optional[str] = None
    terrain: Optional[str] = None
    climate: Optional[str] = None
    # Lore & Culture
    history: Optional[str] = None
    rumors: Optional[str] = None
    government: Optional[str] = None
    religion: Optional[str] = None
    economy: Optional[str] = None
    # Adventure
    threats: Optional[str] = None
    available_services: Optional[str] = None
    points_of_interest: Optional[str] = None


class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    gm_notes: Optional[str] = None
    location_type: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=100)
    is_visible_to_players: Optional[bool] = None
    # Hierarchy
    parent_location_id: Optional[int] = None
    is_top_level: Optional[bool] = None
    is_unknown: Optional[bool] = None
    # Environment
    weather: Optional[str] = None
    plant_life: Optional[str] = None
    animal_life: Optional[str] = None
    terrain: Optional[str] = None
    climate: Optional[str] = None
    # Lore & Culture
    history: Optional[str] = None
    rumors: Optional[str] = None
    government: Optional[str] = None
    religion: Optional[str] = None
    economy: Optional[str] = None
    # Adventure
    threats: Optional[str] = None
    available_services: Optional[str] = None
    points_of_interest: Optional[str] = None


class LocationResponse(BaseModel):
    id: int
    campaign_id: int
    name: str
    description: Optional[str] = None
    gm_notes: Optional[str] = None
    location_type: Optional[str] = None
    status: Optional[str] = None
    is_visible_to_players: bool
    # Hierarchy
    parent_location_id: Optional[int] = None
    is_top_level: bool = False
    is_unknown: bool = False
    # Environment
    weather: Optional[str] = None
    plant_life: Optional[str] = None
    animal_life: Optional[str] = None
    terrain: Optional[str] = None
    climate: Optional[str] = None
    # Lore & Culture
    history: Optional[str] = None
    rumors: Optional[str] = None
    government: Optional[str] = None
    religion: Optional[str] = None
    economy: Optional[str] = None
    # Adventure
    threats: Optional[str] = None
    available_services: Optional[str] = None
    points_of_interest: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LocationListItem(BaseModel):
    id: int
    campaign_id: int
    name: str
    description: Optional[str] = None
    location_type: Optional[str] = None
    status: Optional[str] = None
    is_visible_to_players: bool
    # Hierarchy
    parent_location_id: Optional[int] = None
    is_top_level: bool = False
    is_unknown: bool = False
    pin_child_ids: List[int] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ── LocationNPC ───────────────────────────────────────────────────────────────

class LocationNPCAdd(BaseModel):
    npc_id: int
    description: Optional[str] = Field(None, description="This NPC's role at this location")


class LocationNPCResponse(BaseModel):
    id: Optional[int] = None  # None for last_seen NPCs (no junction row)
    npc_id: int
    name: str
    race: str
    occupation: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None  # junction role description or last_seen_notes
    image_path: Optional[str] = None
    is_visible_to_players: bool
    source: str = "linked"  # "linked" (manual junction) or "last_seen" (last_known_location_id)

    class Config:
        from_attributes = True


# ── LocationRelationship ──────────────────────────────────────────────────────

class LocationRelationshipCreate(BaseModel):
    location_b_id: int = Field(..., description="The other location to link to")
    label: Optional[str] = Field(None, max_length=200)
    direction: RelationshipDirection


class LocationRelationshipResponse(BaseModel):
    id: int
    campaign_id: int
    location_a_id: int
    location_b_id: int
    label: Optional[str] = None
    direction: RelationshipDirection
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── LocationMap ───────────────────────────────────────────────────────────────

class LocationMapResponse(BaseModel):
    id: int
    location_id: int
    name: str
    image_path: str
    is_visible_to_players: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── MapPin ────────────────────────────────────────────────────────────────────

class MapPinCreate(BaseModel):
    x_percent: float = Field(..., ge=0.0, le=100.0)
    y_percent: float = Field(..., ge=0.0, le=100.0)
    label: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    linked_location_id: Optional[int] = None
    is_visible_to_players: bool = Field(default=False)


class MapPinUpdate(BaseModel):
    x_percent: Optional[float] = Field(None, ge=0.0, le=100.0)
    y_percent: Optional[float] = Field(None, ge=0.0, le=100.0)
    label: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    linked_location_id: Optional[int] = None
    is_visible_to_players: Optional[bool] = None


class MapPinResponse(BaseModel):
    id: int
    map_id: int
    x_percent: float
    y_percent: float
    label: Optional[str] = None
    description: Optional[str] = None
    linked_location_id: Optional[int] = None
    is_visible_to_players: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── LocationLink ──────────────────────────────────────────────────────────────

class LocationLinkCreate(BaseModel):
    content_type: str = Field(..., max_length=100, description="e.g. 'npc', 'loot_table', 'creature', 'item'")
    content_id: int
    notes: Optional[str] = None


class LocationLinkResponse(BaseModel):
    id: int
    location_id: int
    content_type: str
    content_id: int
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
