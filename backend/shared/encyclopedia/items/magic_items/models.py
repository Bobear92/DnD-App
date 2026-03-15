from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class MagicItem(Base):
    """
    D&D 2024 Magic Item - part of the Encyclopedia Items (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with structured effects (JSONB), charges, curses, images in V2+
    """
    __tablename__ = "magic_items"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), unique=True, nullable=False, index=True)
    item_type = Column(String(100), nullable=False)
    rarity = Column(String(50), nullable=False)
    
    attunement_required = Column(Boolean, default=False, nullable=False)
    effect = Column(Text, nullable=False)
    cost = Column(String(50), nullable=True)
    weight = Column(String(50), nullable=True)
    
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<MagicItem(id={self.id}, name='{self.name}', rarity='{self.rarity}')>"