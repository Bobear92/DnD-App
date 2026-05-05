from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime


class NPCBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    race: str = Field(..., min_length=1, max_length=100)
    occupation: Optional[str] = Field(None, max_length=200)
    alignment: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, description="alive / dead / missing / unknown")

    # Physical
    age: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=100)
    height: Optional[str] = Field(None, max_length=100)
    weight: Optional[str] = Field(None, max_length=100)
    appearance: Optional[str] = None

    # Personality
    voice: Optional[str] = None
    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None
    languages: Optional[List[str]] = Field(None, description='e.g. ["Common", "Elvish"]')

    # Narrative
    summary: Optional[str] = None
    description: Optional[str] = None
    backstory: Optional[str] = None

    # Location tracking
    last_known_location_id: Optional[int] = None
    last_seen_notes: Optional[str] = None

    # Media
    theme_music_url: Optional[str] = Field(None, max_length=500)

    # Combat
    stats: Optional[Dict[str, Any]] = None

    # GM only — stripped from player responses in service
    gm_notes: Optional[str] = None

    is_visible_to_players: bool = Field(default=False)


class NPCCreate(NPCBase):
    campaign_id: int


class NPCUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    race: Optional[str] = Field(None, min_length=1, max_length=100)
    occupation: Optional[str] = Field(None, max_length=200)
    alignment: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = None

    age: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=100)
    height: Optional[str] = Field(None, max_length=100)
    weight: Optional[str] = Field(None, max_length=100)
    appearance: Optional[str] = None

    voice: Optional[str] = None
    personality_traits: Optional[str] = None
    ideals: Optional[str] = None
    bonds: Optional[str] = None
    flaws: Optional[str] = None
    languages: Optional[List[str]] = None

    summary: Optional[str] = None
    description: Optional[str] = None
    backstory: Optional[str] = None

    last_known_location_id: Optional[int] = None
    last_seen_notes: Optional[str] = None
    theme_music_url: Optional[str] = Field(None, max_length=500)
    stats: Optional[Dict[str, Any]] = None
    gm_notes: Optional[str] = None
    is_visible_to_players: Optional[bool] = None




class NPCResponse(NPCBase):
    id: int
    campaign_id: int
    image_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── NPC Relationships ──────────────────────────────────────────────────────────

class NPCRelationshipCreate(BaseModel):
    npc_b_id: int = Field(..., description="The related NPC")
    relationship_type: str = Field(..., min_length=1, max_length=100,
                                   description="ally / enemy / family / rival / employer / etc.")
    description: Optional[str] = None


class NPCRelationshipResponse(BaseModel):
    id: int
    npc_a_id: int
    npc_b_id: int
    npc_b_name: str
    relationship_type: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── NPC–Player Relationships ───────────────────────────────────────────────────

class NPCPlayerRelationshipCreate(BaseModel):
    user_id: int = Field(..., description="The player")
    relationship_type: str = Field(..., min_length=1, max_length=100,
                                   description="friendly / hostile / indifferent / owes a debt / etc.")
    description: Optional[str] = None


class NPCPlayerRelationshipResponse(BaseModel):
    id: int
    npc_id: int
    user_id: int
    username: str
    campaign_id: int
    relationship_type: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
