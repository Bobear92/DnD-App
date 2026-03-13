from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class Creature(Base):
    """
    D&D 2024 Creature - part of the Encyclopedia Bestiary (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with JSONB for actions, abilities, etc. in V2+
    """
    __tablename__ = "creatures"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Info
    name = Column(String(200), unique=True, nullable=False, index=True)
    size = Column(String(50), nullable=False)  # Tiny, Small, Medium, Large, Huge, Gargantuan
    type = Column(String(100), nullable=False)  # Beast, Dragon, Humanoid, Undead, etc.
    alignment = Column(String(100))  # Lawful Good, Chaotic Evil, Unaligned, etc.
    challenge_rating = Column(String(20), nullable=False)  # "1/4", "5", "20"
    
    # Combat Stats
    armor_class = Column(Integer, nullable=False)
    hit_points = Column(String(100), nullable=False)  # "45 (6d8 + 18)"
    speed = Column(String(200), nullable=False)  # "30 ft., fly 60 ft."
    
    # Ability Scores
    strength = Column(Integer, nullable=False)
    dexterity = Column(Integer, nullable=False)
    constitution = Column(Integer, nullable=False)
    intelligence = Column(Integer, nullable=False)
    wisdom = Column(Integer, nullable=False)
    charisma = Column(Integer, nullable=False)
    
    # Description
    description = Column(Text)  # Lore and flavor text
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Creature(id={self.id}, name='{self.name}', cr='{self.challenge_rating}')>"