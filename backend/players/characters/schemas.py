from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

# Character creation
class CharacterCreate(BaseModel):
    name: str
    race: str
    char_class: str
    level: int = 1
    background: Optional[str] = None
    alignment: Optional[str] = None
    
    # Stats
    strength: int = 10
    dexterity: int = 10
    constitution: int = 10
    intelligence: int = 10
    wisdom: int = 10
    charisma: int = 10
    
    # Class-specific data (flexible)
    character_data: Dict[str, Any] = {}
    
    # Notes
    notes: Optional[str] = None
    
    # Campaign assignment
    campaign_id: int

# Character update (all fields optional)
class CharacterUpdate(BaseModel):
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

# Character response
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
    
    notes: Optional[str]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Simple list view
class CharacterListItem(BaseModel):
    id: int
    name: str
    race: str
    char_class: str
    level: int
    campaign_id: int
    
    class Config:
        from_attributes = True

# GM visibility toggle
class ToggleVisibilityRequest(BaseModel):
    is_visible: bool