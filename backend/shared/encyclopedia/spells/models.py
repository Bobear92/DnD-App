from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class Spell(Base):
    """
    D&D 2024 Spell - part of the Encyclopedia (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with JSONB for higher level effects in V2+
    """
    __tablename__ = "spells"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), unique=True, nullable=False, index=True)
    level = Column(Integer, nullable=False)
    school = Column(String(100), nullable=False)
    
    casting_time = Column(String(100), nullable=False)
    range = Column(String(100), nullable=False)
    components = Column(String(200), nullable=False)
    duration = Column(String(100), nullable=False)
    
    description = Column(Text, nullable=False)
    classes = Column(String(200), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Spell(id={self.id}, name='{self.name}', level={self.level})>"