from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CreatureBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Creature name")
    size: str = Field(..., description="Size: Tiny, Small, Medium, Large, Huge, Gargantuan")
    type: str = Field(..., min_length=1, max_length=100, description="Type: Beast, Dragon, Humanoid, etc.")
    alignment: Optional[str] = Field(None, max_length=100, description="Alignment (e.g., Lawful Good)")
    challenge_rating: str = Field(..., description="Challenge Rating (e.g., '1/4', '5', '20')")
    
    armor_class: int = Field(..., ge=1, description="Armor Class")
    hit_points: str = Field(..., description="Hit Points (e.g., '45 (6d8 + 18)')")
    speed: str = Field(..., description="Speed (e.g., '30 ft., fly 60 ft.')")
    
    strength: int = Field(..., ge=1, le=30, description="Strength score (1-30)")
    dexterity: int = Field(..., ge=1, le=30, description="Dexterity score (1-30)")
    constitution: int = Field(..., ge=1, le=30, description="Constitution score (1-30)")
    intelligence: int = Field(..., ge=1, le=30, description="Intelligence score (1-30)")
    wisdom: int = Field(..., ge=1, le=30, description="Wisdom score (1-30)")
    charisma: int = Field(..., ge=1, le=30, description="Charisma score (1-30)")
    
    description: Optional[str] = Field(None, description="Lore and flavor text")


class CreatureCreate(CreatureBase):
    """Schema for creating a new creature"""
    pass


class CreatureUpdate(BaseModel):
    """Schema for updating a creature - all fields optional"""
    
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
    """Schema for creature responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True