import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base


class EraDirection(enum.Enum):
    ascending = "ascending"
    descending = "descending"


class CampaignCalendar(Base):
    __tablename__ = "campaign_calendars"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    name = Column(String(200), nullable=False, default="Campaign Calendar")
    days_per_month = Column(Integer, nullable=False, default=30)
    # Current date in the campaign world
    current_era_id = Column(Integer, ForeignKey("calendar_eras.id", ondelete="SET NULL", use_alter=True, name="fk_calendar_current_era"), nullable=True)
    current_year = Column(Integer, nullable=True)
    current_month_order = Column(Integer, nullable=True)
    current_day = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<CampaignCalendar(id={self.id}, campaign_id={self.campaign_id}, name='{self.name}')>"


class CalendarSeason(Base):
    __tablename__ = "calendar_seasons"

    id = Column(Integer, primary_key=True, index=True)
    calendar_id = Column(Integer, ForeignKey("campaign_calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<CalendarSeason(id={self.id}, name='{self.name}', order_index={self.order_index})>"


class CalendarMonth(Base):
    __tablename__ = "calendar_months"

    id = Column(Integer, primary_key=True, index=True)
    calendar_id = Column(Integer, ForeignKey("campaign_calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    season_id = Column(Integer, ForeignKey("calendar_seasons.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<CalendarMonth(id={self.id}, name='{self.name}', order_index={self.order_index})>"


class CalendarEra(Base):
    __tablename__ = "calendar_eras"

    id = Column(Integer, primary_key=True, index=True)
    calendar_id = Column(Integer, ForeignKey("campaign_calendars.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    abbreviation = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    direction = Column(SQLEnum(EraDirection), nullable=False, default=EraDirection.ascending)
    is_primary = Column(Boolean, nullable=False, default=False)
    # Epoch offset: stored for conversion math.
    # Ascending:  absolute = era_year + epoch_offset
    # Descending: absolute = epoch_offset - era_year
    epoch_offset = Column(Integer, nullable=False, default=0)
    # Anchor inputs stored for future editing/reference
    anchor_era_id = Column(Integer, ForeignKey("calendar_eras.id", ondelete="SET NULL"), nullable=True)
    anchor_era_year = Column(Integer, nullable=True)
    anchor_this_year = Column(Integer, nullable=True)  # None = transition anchor for descending eras
    # Absolute year range where this era's label applies to events
    era_start_absolute = Column(Integer, nullable=True)  # null = from the beginning of time
    era_end_absolute = Column(Integer, nullable=True)    # null = no defined end
    is_current = Column(Boolean, nullable=False, default=False)
    is_visible_to_players = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<CalendarEra(id={self.id}, name='{self.name}', abbr='{self.abbreviation}')>"
