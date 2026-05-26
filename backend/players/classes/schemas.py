from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ClassFeatureResponse(BaseModel):
    id: int
    class_id: int
    level: int
    feature_name: str
    feature_description: str
    created_at: datetime

    class Config:
        from_attributes = True


class ClassFeatureCreate(BaseModel):
    level: int
    feature_name: str
    feature_description: str


class ClassFeatureUpdate(BaseModel):
    feature_name: Optional[str] = None
    feature_description: Optional[str] = None


class ClassCreate(BaseModel):
    name: str
    edition: str
    flavor_text: str
    hit_die: int
    primary_ability: str
    spellcasting_ability: Optional[str] = None
    saving_throws: List[str]
    armor_proficiencies: List[str]
    weapon_proficiencies: List[str]
    tool_proficiencies: List[str] = []
    skill_count: int
    skills_available: List[str]
    campaign_id: Optional[int] = None


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    edition: Optional[str] = None
    flavor_text: Optional[str] = None
    hit_die: Optional[int] = None
    primary_ability: Optional[str] = None
    spellcasting_ability: Optional[str] = None
    saving_throws: Optional[List[str]] = None
    armor_proficiencies: Optional[List[str]] = None
    weapon_proficiencies: Optional[List[str]] = None
    tool_proficiencies: Optional[List[str]] = None
    skill_count: Optional[int] = None
    skills_available: Optional[List[str]] = None


class ClassResponse(BaseModel):
    id: int
    name: str
    edition: str
    flavor_text: str
    hit_die: int
    primary_ability: str
    spellcasting_ability: Optional[str]
    saving_throws: List[str]
    armor_proficiencies: List[str]
    weapon_proficiencies: List[str]
    tool_proficiencies: List[str]
    skill_count: int
    skills_available: List[str]
    owner_type: str
    owner_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    features: List[ClassFeatureResponse] = []

    class Config:
        from_attributes = True
