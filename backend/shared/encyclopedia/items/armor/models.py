from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class Armor(Base):
    """
    D&D 2024 Armor - part of the Encyclopedia Items (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with images, special properties in V2+
    """
    __tablename__ = "armor"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), unique=True, nullable=False, index=True)
    armor_type = Column(String(50), nullable=False)
    armor_class = Column(Integer, nullable=False)
    
    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)
    strength_requirement = Column(Integer, nullable=True)
    stealth_disadvantage = Column(Boolean, default=False, nullable=False)
    
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Armor(id={self.id}, name='{self.name}', type='{self.armor_type}')>"