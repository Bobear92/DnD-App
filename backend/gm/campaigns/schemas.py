from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    edition: str = "5e"
    use_alignment: bool = True
    ability_score_method: str = "standard_spread"
    allow_reroll_ones: bool = False
    leveling_type: str = "milestone"


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    edition: Optional[str] = None
    use_alignment: Optional[bool] = None
    ability_score_method: Optional[str] = None
    allow_reroll_ones: Optional[bool] = None
    leveling_type: Optional[str] = None


class UserInfo(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True


class CampaignMemberResponse(BaseModel):
    id: int
    user_id: int
    user: UserInfo
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True


class CampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    edition: str
    use_alignment: bool
    ability_score_method: str
    allow_reroll_ones: bool
    leveling_type: str
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
    edition: str
    use_alignment: bool
    ability_score_method: str
    allow_reroll_ones: bool
    leveling_type: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class AddPlayerRequest(BaseModel):
    user_id: int


class RemovePlayerRequest(BaseModel):
    user_id: int
