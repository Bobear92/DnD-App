import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from shared.database import Base


class NPCStatus(enum.Enum):
    alive = "alive"
    dead = "dead"
    missing = "missing"
    unknown = "unknown"


class NPC(Base):
    __tablename__ = "npcs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False, index=True)

    # Core identity
    name = Column(String(200), nullable=False, index=True)
    race = Column(String(100), nullable=False)
    occupation = Column(String(200), nullable=True)
    alignment = Column(String(50), nullable=True)
    status = Column(SQLEnum(NPCStatus), nullable=True, default=NPCStatus.alive)

    # Physical
    age = Column(String(100), nullable=True)
    gender = Column(String(100), nullable=True)
    height = Column(String(100), nullable=True)
    weight = Column(String(100), nullable=True)
    appearance = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)

    # Personality & voice
    voice = Column(Text, nullable=True)
    personality_traits = Column(Text, nullable=True)
    ideals = Column(Text, nullable=True)
    bonds = Column(Text, nullable=True)
    flaws = Column(Text, nullable=True)
    languages = Column(JSONB, nullable=True)  # ["Common", "Elvish"]

    # Narrative (player-visible)
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    backstory = Column(Text, nullable=True)

    # Location tracking
    last_known_location_id = Column(Integer, ForeignKey('locations.id', ondelete='SET NULL'), nullable=True)
    last_seen_notes = Column(Text, nullable=True)

    # Media
    theme_music_url = Column(String(500), nullable=True)

    # Combat stats (flexible JSONB)
    stats = Column(JSONB, nullable=True)

    # GM only — never returned to players
    gm_notes = Column(Text, nullable=True)
    is_visible_to_players = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<NPC(id={self.id}, name='{self.name}', campaign_id={self.campaign_id})>"


class NPCRelationship(Base):
    """NPC-to-NPC relationship (directional: a → b)."""
    __tablename__ = "npc_relationships"

    id = Column(Integer, primary_key=True, index=True)
    npc_a_id = Column(Integer, ForeignKey('npcs.id', ondelete='CASCADE'), nullable=False, index=True)
    npc_b_id = Column(Integer, ForeignKey('npcs.id', ondelete='CASCADE'), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('npc_a_id', 'npc_b_id', name='uq_npc_relationship'),
    )

    def __repr__(self):
        return f"<NPCRelationship(id={self.id}, a={self.npc_a_id}, b={self.npc_b_id}, type='{self.relationship_type}')>"


class NPCPlayerRelationship(Base):
    """NPC-to-player relationship, scoped to a campaign."""
    __tablename__ = "npc_player_relationships"

    id = Column(Integer, primary_key=True, index=True)
    npc_id = Column(Integer, ForeignKey('npcs.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    campaign_id = Column(Integer, ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('npc_id', 'user_id', 'campaign_id', name='uq_npc_player_relationship'),
    )

    def __repr__(self):
        return f"<NPCPlayerRelationship(id={self.id}, npc_id={self.npc_id}, user_id={self.user_id})>"
