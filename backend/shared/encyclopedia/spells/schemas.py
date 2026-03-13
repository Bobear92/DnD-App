from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SpellBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Spell name")
    level: int = Field(..., ge=0, le=9, description="Spell level (0-9, where 0 = cantrip)")
    school: str = Field(..., min_length=1, max_length=100, description="School of magic")
    
    casting_time: str = Field(..., min_length=1, max_length=100, description="Casting time (e.g., '1 action')")
    range: str = Field(..., min_length=1, max_length=100, description="Range (e.g., '150 feet', 'Self')")
    components: str = Field(..., min_length=1, max_length=200, description="Components (e.g., 'V, S, M (bat guano)')")
    duration: str = Field(..., min_length=1, max_length=100, description="Duration (e.g., 'Instantaneous')")
    
    description: str = Field(..., min_length=1, description="Spell effect description")
    classes: str = Field(..., min_length=1, max_length=200, description="Classes that can use this spell")


class SpellCreate(SpellBase):
    """Schema for creating a new spell"""
    pass


class SpellUpdate(BaseModel):
    """Schema for updating a spell - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    level: Optional[int] = Field(None, ge=0, le=9)
    school: Optional[str] = Field(None, min_length=1, max_length=100)
    casting_time: Optional[str] = Field(None, min_length=1, max_length=100)
    range: Optional[str] = Field(None, min_length=1, max_length=100)
    components: Optional[str] = Field(None, min_length=1, max_length=200)
    duration: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1)
    classes: Optional[str] = Field(None, min_length=1, max_length=200)


class SpellResponse(SpellBase):
    """Schema for spell responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True