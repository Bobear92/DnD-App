from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class ArmorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    armor_type: str = Field(..., min_length=1, max_length=50)
    armor_class: int = Field(..., ge=0)
    cost: str = Field(..., min_length=1, max_length=50)
    weight: str = Field(..., min_length=1, max_length=50)
    strength_requirement: Optional[int] = Field(None, ge=0, le=30)
    stealth_disadvantage: bool = Field(default=False)
    description: Optional[str] = None


class ArmorCreate(ArmorBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class ArmorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    armor_type: Optional[str] = Field(None, min_length=1, max_length=50)
    armor_class: Optional[int] = Field(None, ge=0)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    strength_requirement: Optional[int] = Field(None, ge=0, le=30)
    stealth_disadvantage: Optional[bool] = None
    description: Optional[str] = None


class ArmorResponse(ArmorBase):
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
