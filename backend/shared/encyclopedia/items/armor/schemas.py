from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ArmorBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Armor name")
    armor_type: str = Field(..., min_length=1, max_length=50, description="Armor type: Light, Medium, Heavy, Shield")
    armor_class: int = Field(..., ge=0, description="Armor Class value")
    
    cost: str = Field(..., min_length=1, max_length=50, description="Cost (e.g., '1500 gp', '10 gp')")
    weight: str = Field(..., min_length=1, max_length=50, description="Weight (e.g., '65 lb', '10 lb')")
    strength_requirement: Optional[int] = Field(None, ge=0, le=30, description="Minimum Strength requirement")
    stealth_disadvantage: bool = Field(default=False, description="Gives disadvantage on Stealth checks")
    
    description: Optional[str] = Field(None, description="Description and flavor text")


class ArmorCreate(ArmorBase):
    """Schema for creating new armor"""
    pass


class ArmorUpdate(BaseModel):
    """Schema for updating armor - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    armor_type: Optional[str] = Field(None, min_length=1, max_length=50)
    armor_class: Optional[int] = Field(None, ge=0)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    strength_requirement: Optional[int] = Field(None, ge=0, le=30)
    stealth_disadvantage: Optional[bool] = None
    description: Optional[str] = None


class ArmorResponse(ArmorBase):
    """Schema for armor responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True