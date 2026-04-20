from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class MagicItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    item_type: str = Field(..., min_length=1, max_length=100)
    rarity: str = Field(..., min_length=1, max_length=50)
    attunement_required: bool = Field(default=False)
    effect: str = Field(..., min_length=1)
    cost: Optional[str] = Field(None, max_length=50)
    weight: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class MagicItemCreate(MagicItemBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class MagicItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    item_type: Optional[str] = Field(None, min_length=1, max_length=100)
    rarity: Optional[str] = Field(None, min_length=1, max_length=50)
    attunement_required: Optional[bool] = None
    effect: Optional[str] = Field(None, min_length=1)
    cost: Optional[str] = Field(None, max_length=50)
    weight: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class MagicItemResponse(MagicItemBase):
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
