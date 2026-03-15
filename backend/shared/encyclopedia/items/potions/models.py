from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class Potion(Base):
    """
    D&D 2024 Potion - part of the Encyclopedia Items (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with structured effects (JSONB), images in V2+
    """
    __tablename__ = "potions"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), unique=True, nullable=False, index=True)
    rarity = Column(String(50), nullable=False)
    
    effect = Column(Text, nullable=False)
    duration = Column(String(100), nullable=True)
    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)
    
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Potion(id={self.id}, name='{self.name}', rarity='{self.rarity}')>"