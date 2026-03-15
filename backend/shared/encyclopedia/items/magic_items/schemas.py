from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MagicItemBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Magic item name")
    item_type: str = Field(..., min_length=1, max_length=100, description="Type: Magic Weapon, Magic Armor, Wondrous Item, Ring, Rod, Staff, Wand, Scroll")
    rarity: str = Field(..., min_length=1, max_length=50, description="Rarity: Common, Uncommon, Rare, Very Rare, Legendary, Artifact")
    
    attunement_required: bool = Field(default=False, description="Requires attunement")
    effect: str = Field(..., min_length=1, description="What the item does")
    cost: Optional[str] = Field(None, max_length=50, description="Cost (some items are priceless)")
    weight: Optional[str] = Field(None, max_length=50, description="Weight (some items are weightless)")
    
    description: Optional[str] = Field(None, description="Flavor text and lore")


class MagicItemCreate(MagicItemBase):
    """Schema for creating a new magic item"""
    pass


class MagicItemUpdate(BaseModel):
    """Schema for updating a magic item - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    item_type: Optional[str] = Field(None, min_length=1, max_length=100)
    rarity: Optional[str] = Field(None, min_length=1, max_length=50)
    attunement_required: Optional[bool] = None
    effect: Optional[str] = Field(None, min_length=1)
    cost: Optional[str] = Field(None, max_length=50)
    weight: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None


class MagicItemResponse(MagicItemBase):
    """Schema for magic item responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True