from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

# Feat creation (admin only for system feats)
class FeatCreate(BaseModel):
    name: str
    description: str
    prerequisites: Dict[str, Any] = {}
    benefits: Dict[str, Any]
    repeatable: bool = False
    source: Optional[str] = None
    
    # For campaign feats (GM custom)
    campaign_id: Optional[int] = None

# Feat update
class FeatUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    prerequisites: Optional[Dict[str, Any]] = None
    benefits: Optional[Dict[str, Any]] = None
    repeatable: Optional[bool] = None
    source: Optional[str] = None

# Feat response
class FeatResponse(BaseModel):
    id: int
    name: str
    description: str
    prerequisites: Dict[str, Any]
    benefits: Dict[str, Any]
    repeatable: bool
    source: Optional[str]
    
    owner_type: str
    owner_id: Optional[int]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# Simple list view
class FeatListItem(BaseModel):
    id: int
    name: str
    description: str
    repeatable: bool
    owner_type: str
    
    class Config:
        from_attributes = True