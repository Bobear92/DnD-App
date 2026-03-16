from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from shared.database import Base


class LootTable(Base):
    """
    D&D 2024 Loot Table - hybrid model for both system and campaign-specific tables.
    
    System tables (owner_type='system'): Created by admin, available to all GMs
    Campaign tables (owner_type='campaign'): Created by GM, specific to their campaign
    
    V1: Basic structure. Will expand with more complex generation logic in V2+
    """
    __tablename__ = "loot_tables"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    
    owner_type = Column(String(20), nullable=False, index=True)
    owner_id = Column(Integer, nullable=True, index=True)
    
    loot_items = Column(JSONB, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LootTable(id={self.id}, name='{self.name}', owner_type='{self.owner_type}')>"