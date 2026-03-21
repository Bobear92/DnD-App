from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

# Background creation (admin only for system backgrounds)
class BackgroundCreate(BaseModel):
    name: str
    description: str
    skill_proficiencies: List[str] | Dict[str, Any]  # ["Insight", "Religion"] or {"choice": 2, "from": [...]}
    tool_proficiencies: List[str] | Dict[str, Any] = []
    languages: List[str] | Dict[str, Any] = []
    equipment: List[str] = []
    feature: Dict[str, str]  # {"name": "Feature Name", "description": "..."}
    characteristics: Dict[str, Any] = {}
    
    # For campaign backgrounds (GM custom)
    campaign_id: Optional[int] = None

# Background update
class BackgroundUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    skill_proficiencies: Optional[List[str] | Dict[str, Any]] = None
    tool_proficiencies: Optional[List[str] | Dict[str, Any]] = None
    languages: Optional[List[str] | Dict[str, Any]] = None
    equipment: Optional[List[str]] = None
    feature: Optional[Dict[str, str]] = None
    characteristics: Optional[Dict[str, Any]] = None

# Background response
class BackgroundResponse(BaseModel):
    id: int
    name: str
    description: str
    skill_proficiencies: List[str] | Dict[str, Any]
    tool_proficiencies: List[str] | Dict[str, Any]
    languages: List[str] | Dict[str, Any]
    equipment: List[str]
    feature: Dict[str, str]
    characteristics: Dict[str, Any]
    
    owner_type: str
    owner_id: Optional[int]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Simple list view
class BackgroundListItem(BaseModel):
    id: int
    name: str
    description: str
    owner_type: str
    
    class Config:
        from_attributes = True