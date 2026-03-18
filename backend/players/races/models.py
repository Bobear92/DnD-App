from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
import enum

class OwnerType(enum.Enum):
    system = "system"      # Admin-created base D&D races
    campaign = "campaign"  # GM-created custom races

class Race(Base):
    __tablename__ = "races"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Ability Score Increases (flexible JSONB)
    # Example: {"strength": 2, "constitution": 1} or {"choice": 1} for +1 to any
    ability_score_increases = Column(JSON, nullable=False, default={})
    
    # Size (Small, Medium, Large, etc.)
    size = Column(String(20), nullable=False)
    
    # Speed in feet
    speed = Column(Integer, nullable=False, default=30)
    
    # Racial traits (flexible JSONB array)
    # Example: [{"name": "Darkvision", "description": "60 feet"}, ...]
    traits = Column(JSON, nullable=False, default=[])
    
    # Languages
    # Example: ["Common", "Elvish"] or {"known": ["Common"], "choice": 1}
    languages = Column(JSON, nullable=False, default=[])
    
    # Ownership
    owner_type = Column(SQLEnum(OwnerType), nullable=False)
    owner_id = Column(Integer, nullable=True)  # NULL for system, campaign_id for campaign
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Race(id={self.id}, name='{self.name}', owner_type='{self.owner_type.value}')>"