from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from shared.database import Base


class NPC(Base):
    """
    D&D 2024 NPC - campaign-specific non-player character.
    Created by GM, belongs to a specific campaign.
    
    V1: Basic fields with optional stats. Will expand with relationships, quests, inventory in V2+
    """
    __tablename__ = "npcs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False, index=True)
    
    name = Column(String(200), nullable=False, index=True)
    race = Column(String(100), nullable=False)
    occupation = Column(String(200), nullable=True)
    alignment = Column(String(50), nullable=True)
    
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    backstory = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    
    stats = Column(JSONB, nullable=True)
    
    notes = Column(Text, nullable=True)
    is_visible_to_players = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<NPC(id={self.id}, name='{self.name}', campaign_id={self.campaign_id})>"