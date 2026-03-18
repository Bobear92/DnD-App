from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Race creation (admin only for system races)
class RaceCreate(BaseModel):
    name: str
    description: str
    ability_score_increases: Dict[str, Any]  # {"strength": 2} or {"choice": 1}
    size: str  # "Small", "Medium", "Large"
    speed: int = 30
    traits: List[Dict[str, str]] = []  # [{"name": "Darkvision", "description": "60 feet"}]
    languages: Dict[str, Any] = {}  # {"known": ["Common"], "choice": 1}
    
    # For campaign races (GM custom)
    campaign_id: Optional[int] = None

# Race update
class RaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    ability_score_increases: Optional[Dict[str, Any]] = None
    size: Optional[str] = None
    speed: Optional[int] = None
    traits: Optional[List[Dict[str, str]]] = None
    languages: Optional[Dict[str, Any]] = None

# Race response
class RaceResponse(BaseModel):
    id: int
    name: str
    description: str
    ability_score_increases: Dict[str, Any]
    size: str
    speed: int
    traits: List[Dict[str, str]]
    languages: Dict[str, Any]
    
    owner_type: str
    owner_id: Optional[int]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Simple list view
class RaceListItem(BaseModel):
    id: int
    name: str
    description: str
    size: str
    speed: int
    owner_type: str
    
    class Config:
        from_attributes = True