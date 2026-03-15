from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PotionBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Potion name")
    rarity: str = Field(..., min_length=1, max_length=50, description="Rarity: Common, Uncommon, Rare, Very Rare, Legendary")
    
    effect: str = Field(..., min_length=1, description="What the potion does")
    duration: Optional[str] = Field(None, max_length=100, description="Duration (e.g., 'Instantaneous', '1 hour')")
    cost: str = Field(..., min_length=1, max_length=50, description="Cost (e.g., '50 gp')")
    weight: str = Field(..., min_length=1, max_length=50, description="Weight (e.g., '0.5 lb')")
    
    description: Optional[str] = Field(None, description="Flavor text and additional details")


class PotionCreate(PotionBase):
    """Schema for creating a new potion"""
    pass


class PotionUpdate(BaseModel):
    """Schema for updating a potion - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    rarity: Optional[str] = Field(None, min_length=1, max_length=50)
    effect: Optional[str] = Field(None, min_length=1)
    duration: Optional[str] = Field(None, max_length=100)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None


class PotionResponse(PotionBase):
    """Schema for potion responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True