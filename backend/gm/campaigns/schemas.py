from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Campaign schemas
class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# First, add a simple UserInfo schema at the top (after the imports)
class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        from_attributes = True

# First, add a simple UserInfo schema at the top (after the imports)
class UserInfo(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        from_attributes = True

# Then update CampaignMemberResponse
class CampaignMemberResponse(BaseModel):
    id: int
    user_id: int
    user: UserInfo  # Nested user info
    role: str
    joined_at: datetime
    
    class Config:
        from_attributes = True

class CampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    members: List[CampaignMemberResponse] = []
    
    class Config:
        from_attributes = True

class CampaignListItem(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Player assignment schemas
class AddPlayerRequest(BaseModel):
    user_id: int

class RemovePlayerRequest(BaseModel):
    user_id: int