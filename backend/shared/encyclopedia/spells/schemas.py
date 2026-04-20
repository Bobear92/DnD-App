from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from shared.enums import OwnerType


class SpellBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    level: int = Field(..., ge=0, le=9)
    school: str = Field(..., min_length=1, max_length=100)
    casting_time: str = Field(..., min_length=1, max_length=100)
    range: str = Field(..., min_length=1, max_length=100)
    components: str = Field(..., min_length=1, max_length=200)
    duration: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    classes: str = Field(..., min_length=1, max_length=200)


class SpellCreate(SpellBase):
    owner_type: OwnerType = OwnerType.system
    owner_id: Optional[int] = None


class SpellUpdate(BaseModel):
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
    id: int
    owner_type: OwnerType
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
