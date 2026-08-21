from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class WeaponBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    weapon_category: str = Field(..., min_length=1, max_length=50)
    weapon_type: str = Field(..., min_length=1, max_length=50)
    damage: str = Field(..., min_length=1, max_length=50)
    damage_type: str = Field(..., min_length=1, max_length=50)
    properties: Optional[str] = None
    range_normal: Optional[int] = Field(None, ge=0)
    range_long: Optional[int] = Field(None, ge=0)
    cost: str = Field(..., min_length=1, max_length=50)
    weight: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class WeaponCreate(WeaponBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class WeaponUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    weapon_category: Optional[str] = Field(None, min_length=1, max_length=50)
    weapon_type: Optional[str] = Field(None, min_length=1, max_length=50)
    damage: Optional[str] = Field(None, min_length=1, max_length=50)
    damage_type: Optional[str] = Field(None, min_length=1, max_length=50)
    properties: Optional[str] = None
    range_normal: Optional[int] = Field(None, ge=0)
    range_long: Optional[int] = Field(None, ge=0)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None


class WeaponResponse(WeaponBase):
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
