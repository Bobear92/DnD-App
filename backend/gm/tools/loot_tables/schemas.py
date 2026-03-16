from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime


class LootTableBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Loot table name")
    description: Optional[str] = Field(None, description="What this table is for")
    owner_type: str = Field(..., description="Owner type: 'system' or 'campaign'")
    owner_id: Optional[int] = Field(None, description="NULL for system, campaign_id for campaign tables")
    loot_items: Dict[str, Any] = Field(..., description="JSONB structure with currency and items")
    
    @field_validator('owner_type')
    @classmethod
    def validate_owner_type(cls, v):
        if v not in ['system', 'campaign']:
            raise ValueError("owner_type must be 'system' or 'campaign'")
        return v


class LootTableCreate(LootTableBase):
    """Schema for creating a new loot table"""
    pass


class LootTableUpdate(BaseModel):
    """Schema for updating a loot table - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    loot_items: Optional[Dict[str, Any]] = None


class LootTableResponse(LootTableBase):
    """Schema for loot table responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True