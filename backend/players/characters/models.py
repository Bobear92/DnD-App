from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from shared.database import Base

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)

    # Basic Info
    name = Column(String, nullable=False)
    race = Column(String, nullable=False)  # V1: Simple string
    char_class = Column(String, nullable=False)  # "class" is reserved keyword
    level = Column(Integer, default=1, nullable=False)
    background = Column(String, nullable=True)
    alignment = Column(String, nullable=True)

    # Core D&D Stats
    strength = Column(Integer, default=10, nullable=False)
    dexterity = Column(Integer, default=10, nullable=False)
    constitution = Column(Integer, default=10, nullable=False)
    intelligence = Column(Integer, default=10, nullable=False)
    wisdom = Column(Integer, default=10, nullable=False)
    charisma = Column(Integer, default=10, nullable=False)

    # Class-Specific Data (flexible JSONB)
    character_data = Column(JSONB, default={}, nullable=False)

    # Ownership & Campaign
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)

    # Leveling
    experience_points = Column(Integer, default=0, nullable=False)
    level_up_pending = Column(Boolean, default=False, nullable=False)

    # Visibility (GM controls)
    is_visible_to_players = Column(Boolean, default=False, nullable=False)

    # Notes
    notes = Column(Text, nullable=True)          # public — visible to all members
    gm_notes = Column(Text, nullable=True)        # GM only — never returned to players or owner

    # Narrative (new fields)
    backstory = Column(Text, nullable=True)
    personal_notes = Column(Text, nullable=True)  # owner + GM only
    image_path = Column(String(500), nullable=True)
    theme_music_url = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Character(id={self.id}, name='{self.name}', class='{self.char_class}', level={self.level})>"


class CharacterTimelineEvent(Base):
    """Junction: timeline event created from / linked to a character."""
    __tablename__ = "character_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("timeline_events.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("character_id", "event_id", name="uq_character_timeline_event"),
    )


class CharacterNpc(Base):
    """Junction: NPC created from / linked to a character."""
    __tablename__ = "character_npcs"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    npc_id = Column(Integer, ForeignKey("npcs.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("character_id", "npc_id", name="uq_character_npc"),
    )