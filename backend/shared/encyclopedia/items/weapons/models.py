from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class Weapon(Base):
    """
    D&D 2024 Weapon - part of the Encyclopedia Items (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with structured properties (JSONB), images in V2+
    """
    __tablename__ = "weapons"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), unique=True, nullable=False, index=True)
    weapon_category = Column(String(50), nullable=False)
    weapon_type = Column(String(50), nullable=False)
    
    damage = Column(String(50), nullable=False)
    damage_type = Column(String(50), nullable=False)
    
    properties = Column(Text)
    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)
    
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Weapon(id={self.id}, name='{self.name}', type='{self.weapon_type}')>"