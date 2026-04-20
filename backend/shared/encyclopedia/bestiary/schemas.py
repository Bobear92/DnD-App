from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class CreatureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    size: str = Field(..., description="Tiny, Small, Medium, Large, Huge, Gargantuan")
    type: str = Field(..., min_length=1, max_length=100)
    alignment: Optional[str] = Field(None, max_length=100)
    challenge_rating: str = Field(...)
    armor_class: int = Field(..., ge=1)
    hit_points: str = Field(...)
    speed: str = Field(...)
    strength: int = Field(..., ge=1, le=30)
    dexterity: int = Field(..., ge=1, le=30)
    constitution: int = Field(..., ge=1, le=30)
    intelligence: int = Field(..., ge=1, le=30)
    wisdom: int = Field(..., ge=1, le=30)
    charisma: int = Field(..., ge=1, le=30)
    description: Optional[str] = None


class CreatureCreate(CreatureBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class CreatureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    size: Optional[str] = None
    type: Optional[str] = Field(None, min_length=1, max_length=100)
    alignment: Optional[str] = Field(None, max_length=100)
    challenge_rating: Optional[str] = None
    armor_class: Optional[int] = Field(None, ge=1)
    hit_points: Optional[str] = None
    speed: Optional[str] = None
    strength: Optional[int] = Field(None, ge=1, le=30)
    dexterity: Optional[int] = Field(None, ge=1, le=30)
    constitution: Optional[int] = Field(None, ge=1, le=30)
    intelligence: Optional[int] = Field(None, ge=1, le=30)
    wisdom: Optional[int] = Field(None, ge=1, le=30)
    charisma: Optional[int] = Field(None, ge=1, le=30)
    description: Optional[str] = None


class CreatureResponse(CreatureBase):
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
