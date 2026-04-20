from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class FoodDrinkBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    item_type: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=100)
    cost: str = Field(..., min_length=1, max_length=50)
    weight: str = Field(..., min_length=1, max_length=50)
    quantity: Optional[str] = Field(None, max_length=100)
    effect: Optional[str] = None
    description: Optional[str] = None


class FoodDrinkCreate(FoodDrinkBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class FoodDrinkUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    item_type: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[str] = Field(None, max_length=100)
    effect: Optional[str] = None
    description: Optional[str] = None


class FoodDrinkResponse(FoodDrinkBase):
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
