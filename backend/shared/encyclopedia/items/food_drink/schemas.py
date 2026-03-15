from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FoodDrinkBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    item_type: str = Field(..., min_length=1, max_length=50, description="Type: Food or Drink")
    category: str = Field(..., min_length=1, max_length=100, description="Category (e.g., 'Rations', 'Ale/Wine', 'Fresh Food')")
    
    cost: str = Field(..., min_length=1, max_length=50, description="Cost (e.g., '5 sp', '2 cp')")
    weight: str = Field(..., min_length=1, max_length=50, description="Weight (e.g., '2 lb', '8 lb')")
    quantity: Optional[str] = Field(None, max_length=100, description="Quantity/unit (e.g., '1 day', '1 gallon')")
    effect: Optional[str] = Field(None, description="Special effects if any")
    
    description: Optional[str] = Field(None, description="Description and flavor text")


class FoodDrinkCreate(FoodDrinkBase):
    """Schema for creating new food/drink"""
    pass


class FoodDrinkUpdate(BaseModel):
    """Schema for updating food/drink - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    item_type: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[str] = Field(None, max_length=100)
    effect: Optional[str] = None
    description: Optional[str] = None


class FoodDrinkResponse(FoodDrinkBase):
    """Schema for food/drink responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True