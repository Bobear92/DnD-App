from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class NPCBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="NPC name")
    race: str = Field(..., min_length=1, max_length=100, description="Race (e.g., Human, Elf, Goblin)")
    occupation: Optional[str] = Field(None, max_length=200, description="Occupation/class (e.g., Blacksmith, Wizard)")
    alignment: Optional[str] = Field(None, max_length=50, description="Alignment (e.g., Lawful Good)")
    
    summary: Optional[str] = Field(None, description="Brief blurb shown in cards/lists outside the NPC page")
    description: Optional[str] = Field(None, description="Physical appearance and personality")
    backstory: Optional[str] = Field(None, description="History and motivations")
    location: Optional[str] = Field(None, max_length=200, description="Where they're typically found")
    
    stats: Optional[Dict[str, Any]] = Field(None, description="JSONB combat stats if needed")
    
    notes: Optional[str] = Field(None, description="Private GM notes")
    is_visible_to_players: bool = Field(default=False, description="Can players see this NPC?")


class NPCCreate(NPCBase):
    """Schema for creating a new NPC"""
    
    campaign_id: int = Field(..., description="Campaign this NPC belongs to")


class NPCUpdate(BaseModel):
    """Schema for updating an NPC - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    race: Optional[str] = Field(None, min_length=1, max_length=100)
    occupation: Optional[str] = Field(None, max_length=200)
    alignment: Optional[str] = Field(None, max_length=50)
    summary: Optional[str] = None
    description: Optional[str] = None
    backstory: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)
    stats: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    is_visible_to_players: Optional[bool] = None


class NPCResponse(NPCBase):
    """Schema for NPC responses (includes database fields)"""
    
    id: int
    campaign_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True