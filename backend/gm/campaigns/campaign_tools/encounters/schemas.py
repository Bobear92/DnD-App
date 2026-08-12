from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── Combatants ────────────────────────────────────────────────────────────────

class CombatantAdd(BaseModel):
    character_id: int
    initiative: Optional[int] = None


class CombatantUpdate(BaseModel):
    """Initiative only — everything else about a combatant comes from the character."""
    initiative: Optional[int] = None


class CombatantResponse(BaseModel):
    id: int
    encounter_id: int
    character_id: int
    initiative: Optional[int] = None
    # Denormalised for display so the page needs no second fetch per row.
    character_name: str
    char_class: Optional[str] = None
    level: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Encounters ────────────────────────────────────────────────────────────────

class EncounterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    # Optional so the GM can create an empty encounter and add people after.
    character_ids: List[int] = []


class EncounterUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)


class EncounterResponse(BaseModel):
    id: int
    campaign_id: int
    name: str
    combatants: List[CombatantResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EncounterListItem(BaseModel):
    id: int
    campaign_id: int
    name: str
    combatant_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
