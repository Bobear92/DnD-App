import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, UniqueConstraint, Enum as SAEnum
from sqlalchemy.sql import func
from shared.database import Base


class TimeOfDay(enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"
    night = "night"
    dawn = "dawn"


class SessionNote(Base):
    __tablename__ = "session_notes"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    session_number = Column(Integer, nullable=True)
    title = Column(String(500), nullable=False)
    real_world_date = Column(Date, nullable=True)
    # In-world calendar date
    era_id = Column(Integer, ForeignKey("calendar_eras.id", ondelete="SET NULL"), nullable=True)
    year = Column(Integer, nullable=True)
    month_order = Column(Integer, nullable=True)
    day = Column(Integer, nullable=True)
    time_of_day = Column(SAEnum(TimeOfDay), nullable=True)
    absolute_year = Column(Integer, nullable=True)  # computed for era_dates display
    # Content
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    gm_notes = Column(Text, nullable=True)
    music_url = Column(String(500), nullable=True)
    is_visible_to_players = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SessionNote(id={self.id}, title='{self.title}', campaign_id={self.campaign_id})>"


class SessionNoteNPC(Base):
    __tablename__ = "session_note_npcs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("session_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    npc_id = Column(Integer, ForeignKey("npcs.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("session_id", "npc_id", name="uq_session_note_npc"),
    )


class SessionNoteLocation(Base):
    __tablename__ = "session_note_locations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("session_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("session_id", "location_id", name="uq_session_note_location"),
    )


class SessionNoteTimelineEvent(Base):
    __tablename__ = "session_note_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("session_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("timeline_events.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("session_id", "event_id", name="uq_session_note_timeline_event"),
    )


class SessionNoteCharacter(Base):
    __tablename__ = "session_note_characters"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("session_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("session_id", "character_id", name="uq_session_note_character"),
    )
