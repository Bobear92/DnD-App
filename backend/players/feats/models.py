from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType

class Feat(Base):
    __tablename__ = "feats"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    edition = Column(String(10), nullable=False, default="5e", server_default="5e")
    description = Column(Text, nullable=False)
    
    # Prerequisites (optional)
    # Example: {"level": 4, "ability_scores": {"strength": 13}, "proficiency": ["Heavy Armor"]}
    prerequisites = Column(JSON, nullable=False, default={})
    
    # Benefits (what the feat grants)
    # Example: {"ability_score_increase": {"strength": 1}, "features": ["Great Weapon Master attack"]}
    benefits = Column(JSON, nullable=False)

    # Structured mechanical effects (drives in-app mechanics, not just a description card).
    # Array of typed effect objects, e.g.
    #   {"kind": "stat_mod", "stat": "initiative", "amount": 5}                       (Alert)
    #   {"kind": "ability_choice", "abilities": ["strength","constitution"], "amount": 1}  (Tavern Brawler)
    #   {"kind": "attack_mod", "target": "unarmed", "dice": "1d4"}
    #   {"kind": "action", "name": "...", "economy": "bonus", "description": "...", "trigger": "..."}
    #   {"kind": "ability_score", "ability": "strength", "amount": 1}                  (fixed)
    #   {"kind": "note", "text": "..."}                                               (display-only)
    # NULL/empty = no structured effects yet (prose-only); surfaced by the coverage report.
    effects = Column(JSON, nullable=True)
    
    # Repeatable (can this feat be taken multiple times?)
    repeatable = Column(Boolean, default=False, nullable=False)
    
    # Source book reference (optional)
    source = Column(String(100), nullable=True)
    
    # Ownership
    owner_type = Column(SQLEnum(OwnerType), nullable=False)
    owner_id = Column(Integer, nullable=True)  # NULL for system, campaign_id for campaign
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Feat(id={self.id}, name='{self.name}', owner_type='{self.owner_type.value}')>"