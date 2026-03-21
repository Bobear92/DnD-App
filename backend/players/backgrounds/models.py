from sqlalchemy import Column, Integer, String, Text, JSON, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType

class Background(Base):
    __tablename__ = "backgrounds"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Skill Proficiencies
    # Example: ["Insight", "Religion"] or {"choice": 2, "from": ["History", "Religion", "Insight"]}
    skill_proficiencies = Column(JSON, nullable=False, default=[])
    
    # Tool Proficiencies (optional)
    # Example: ["Thieves' Tools"] or {"choice": 1, "from": ["Gaming Set", "Musical Instrument"]}
    tool_proficiencies = Column(JSON, nullable=False, default=[])
    
    # Languages (optional)
    # Example: ["Elvish"] or {"choice": 1}
    languages = Column(JSON, nullable=False, default=[])
    
    # Equipment
    # Example: ["A holy symbol", "A prayer book", "5 sticks of incense", "Vestments", "Common clothes", "15 gp"]
    equipment = Column(JSON, nullable=False, default=[])
    
    # Feature (background-specific ability)
    # Example: {"name": "Shelter of the Faithful", "description": "..."}
    feature = Column(JSON, nullable=False)
    
    # Suggested Characteristics (personality traits, ideals, bonds, flaws)
    # Optional flavor text for roleplay
    characteristics = Column(JSON, nullable=True, default={})
    
    # Ownership
    owner_type = Column(SQLEnum(OwnerType), nullable=False)
    owner_id = Column(Integer, nullable=True)  # NULL for system, campaign_id for campaign
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Background(id={self.id}, name='{self.name}', owner_type='{self.owner_type.value}')>"