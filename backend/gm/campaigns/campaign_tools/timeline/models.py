from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from shared.database import Base


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    # Date — stored in the GM's chosen era; absolute_year is computed for sorting
    era_id = Column(Integer, ForeignKey("calendar_eras.id", ondelete="SET NULL"), nullable=True)
    year = Column(Integer, nullable=True)
    month_order = Column(Integer, nullable=True)  # 1-based order_index of the calendar month
    day = Column(Integer, nullable=True)
    absolute_year = Column(Integer, nullable=True)  # computed from era + year for ORDER BY
    gm_notes = Column(Text, nullable=True)
    is_visible_to_players = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<TimelineEvent(id={self.id}, title='{self.title}', campaign_id={self.campaign_id})>"


class TimelineEventNPC(Base):
    __tablename__ = "timeline_event_npcs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("timeline_events.id", ondelete="CASCADE"), nullable=False, index=True)
    npc_id = Column(Integer, ForeignKey("npcs.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "npc_id", name="uq_timeline_event_npc"),
    )

    def __repr__(self):
        return f"<TimelineEventNPC(event_id={self.event_id}, npc_id={self.npc_id})>"


class TimelineEventLocation(Base):
    __tablename__ = "timeline_event_locations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("timeline_events.id", ondelete="CASCADE"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("event_id", "location_id", name="uq_timeline_event_location"),
    )

    def __repr__(self):
        return f"<TimelineEventLocation(event_id={self.event_id}, location_id={self.location_id})>"
