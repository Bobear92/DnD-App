from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class CharacterCreate(BaseModel):
    name: str
    race: str
    char_class: str
    level: int = 1
    background: Optional[str] = None
    alignment: Optional[str] = None

    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    intelligence: int = 10
    wisdom: int = 10
    charisma: int = 10

    character_data: Dict[str, Any] = {}
    notes: Optional[str] = None
    experience_points: int = 0
    campaign_id: int

class CharacterUpdate(BaseModel):
    """Player update — all character fields except gm_notes."""
    name: Optional[str] = None
    race: Optional[str] = None
    char_class: Optional[str] = None
    level: Optional[int] = None
    background: Optional[str] = None
    alignment: Optional[str] = None

    strength: Optional[int] = None
    dexterity: Optional[int] = None
    constitution: Optional[int] = None
    intelligence: Optional[int] = None
    wisdom: Optional[int] = None
    charisma: Optional[int] = None

    character_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    experience_points: Optional[int] = None
    level_up_pending: Optional[bool] = None


class CharacterGmUpdate(CharacterUpdate):
    """GM update — extends player update with gm_notes and GM-only fields."""
    gm_notes: Optional[str] = None
    is_visible_to_players: Optional[bool] = None

class CharacterResponse(BaseModel):
    id: int
    name: str
    race: str
    char_class: str
    level: int
    background: Optional[str]
    alignment: Optional[str]

    strength: int
    dexterity: int
    constitution: int
    intelligence: int
    wisdom: int
    charisma: int

    character_data: Dict[str, Any]

    user_id: int
    campaign_id: int
    is_visible_to_players: bool
    experience_points: int
    level_up_pending: bool

    notes: Optional[str]
    gm_notes: Optional[str]

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class CharacterListItem(BaseModel):
    id: int
    name: str
    race: str
    char_class: str
    level: int
    background: Optional[str]
    alignment: Optional[str]
    campaign_id: int
    user_id: int
    is_visible_to_players: bool
    experience_points: int
    level_up_pending: bool

    strength: int
    dexterity: int
    constitution: int
    intelligence: int
    wisdom: int
    charisma: int

    character_data: Dict[str, Any]

    class Config:
        from_attributes = True

class ToggleVisibilityRequest(BaseModel):
    is_visible: bool
