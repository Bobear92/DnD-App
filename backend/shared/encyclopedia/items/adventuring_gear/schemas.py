from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AdventuringGearBase(BaseModel):
    """Base schema with common fields"""
    
    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    category: str = Field(..., min_length=1, max_length=100, description="Category (e.g., 'Climbing Gear', 'Light Sources')")
    
    cost: str = Field(..., min_length=1, max_length=50, description="Cost (e.g., '1 gp', '5 sp')")
    weight: str = Field(..., min_length=1, max_length=50, description="Weight (e.g., '10 lb', '1 lb')")
    quantity: Optional[str] = Field(None, max_length=100, description="Quantity/unit (e.g., '50 feet', '10 torches')")
    
    description: Optional[str] = Field(None, description="Description and usage")


class AdventuringGearCreate(AdventuringGearBase):
    """Schema for creating new adventuring gear"""
    pass


class AdventuringGearUpdate(BaseModel):
    """Schema for updating adventuring gear - all fields optional"""
    
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    cost: Optional[str] = Field(None, min_length=1, max_length=50)
    weight: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class AdventuringGearResponse(AdventuringGearBase):
    """Schema for adventuring gear responses (includes database fields)"""
    
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True