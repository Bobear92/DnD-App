from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List

from gm.campaigns.campaign_tools.timeline.schemas import EraDate


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
    backstory: Optional[str] = None
    personal_notes: Optional[str] = None
    theme_music_url: Optional[str] = None
    experience_points: int = 0
    campaign_id: int


class CharacterUpdate(BaseModel):
    """Player update — all character fields the owner may change."""
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
    backstory: Optional[str] = None
    personal_notes: Optional[str] = None
    theme_music_url: Optional[str] = None
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
    backstory: Optional[str]
    personal_notes: Optional[str]
    image_path: Optional[str]
    theme_music_url: Optional[str]

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
    image_path: Optional[str] = None

    class Config:
        from_attributes = True


class ToggleVisibilityRequest(BaseModel):
    is_visible: bool


# ── Rest ──────────────────────────────────────────────────────────────────────

class RestRequest(BaseModel):
    rest_type: str  # "short" | "long" | "initiative" (see service._REST_TYPES)
    character_ids: List[int]
    # Initiative only: {character_id: [feature names]} the player chose to use. Features with
    # mode 'opt_in' (Monk 2024 Uncanny Metabolism) do nothing unless named here, because they
    # cost a limited charge and the choice is the player's. Keys arrive as JSON strings.
    opt_ins: Optional[Dict[str, List[str]]] = None


class InitiativeOption(BaseModel):
    feature: str
    label: str
    description: str = ""
    available: bool = True   # false once its own charge is spent


class InitiativeOptionsItem(BaseModel):
    character_id: int
    name: str
    options: List[InitiativeOption] = []


class RestResultItem(BaseModel):
    character_id: int
    name: str
    changes: List[str]


class RestResponse(BaseModel):
    rest_type: str
    applied_to: List[RestResultItem]


# ── Narrative: Timeline event create + response ───────────────────────────────

class CharacterTimelineEventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    era_id: Optional[int] = None
    year: Optional[int] = None
    month_order: Optional[int] = Field(None, ge=1)
    day: Optional[int] = Field(None, ge=1)
    is_visible_to_players: bool = False
    link_description: Optional[str] = None


class CharacterTimelineEventResponse(BaseModel):
    id: int
    character_id: int
    event_id: int
    event_title: str
    era_dates: List[EraDate] = []
    link_description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Narrative: NPC create + response ─────────────────────────────────────────

class CharacterNpcCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    race: Optional[str] = None
    occupation: Optional[str] = None
    alignment: Optional[str] = None
    status: Optional[str] = "alive"
    summary: Optional[str] = None
    is_visible_to_players: bool = False
    relationship_description: Optional[str] = None


class CharacterNpcResponse(BaseModel):
    id: int
    character_id: int
    npc_id: int
    npc_name: str
    npc_race: Optional[str]
    npc_occupation: Optional[str]
    npc_image_path: Optional[str]
    relationship_description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
