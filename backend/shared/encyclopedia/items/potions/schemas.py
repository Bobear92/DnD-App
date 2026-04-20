from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class PotionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    rarity: str = Field(..., min_length=1, max_length=50)
    effect: str = Field(..., min_length=1)
    duration: Optional[str] = Field(None, max_length=100)
    cost: str = Field(..., min_length=1, max_length=50)
    weight: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class PotionCreate(PotionBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class PotionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    rarity: Optional[str] = Field(None, min_length=1, max_length=50)
    effect: Optional[str] = Field(None, min_length=1)
    duration: Optional[str] = Field(None, max_length=100)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None


class PotionResponse(PotionBase):
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
