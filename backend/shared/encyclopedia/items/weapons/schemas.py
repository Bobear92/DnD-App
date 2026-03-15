from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class WeaponBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Weapon name")
    weapon_category: str = Field(..., min_length=1, max_length=50, description="Weapon category: Simple, Martial")
    weapon_type: str = Field(..., min_length=1, max_length=50, description="Weapon type: Melee, Ranged")
    
    damage: str = Field(..., min_length=1, max_length=50, description="Damage dice (e.g., '1d8', '2d6')")
    damage_type: str = Field(..., min_length=1, max_length=50, description="Damage type: Slashing, Piercing, Bludgeoning")
    
    properties: Optional[str] = Field(None, description="Weapon properties (e.g., 'Versatile (1d10), Finesse')")
    cost: str = Field(..., min_length=1, max_length=50, description="Cost (e.g., '15 gp')")
    weight: str = Field(..., min_length=1, max_length=50, description="Weight (e.g., '3 lb')")
    
    description: Optional[str] = Field(None, description="Description and flavor text")


class WeaponCreate(WeaponBase):
    """Schema for creating a new weapon"""
    pass


class WeaponUpdate(BaseModel):
    """Schema for updating a weapon - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    weapon_category: Optional[str] = Field(None, min_length=1, max_length=50)
    weapon_type: Optional[str] = Field(None, min_length=1, max_length=50)
    damage: Optional[str] = Field(None, min_length=1, max_length=50)
    damage_type: Optional[str] = Field(None, min_length=1, max_length=50)
    properties: Optional[str] = None
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None


class WeaponResponse(WeaponBase):
    """Schema for weapon responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True