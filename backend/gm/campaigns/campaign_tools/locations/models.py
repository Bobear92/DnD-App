import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base


class RelationshipDirection(enum.Enum):
    a_above_b = "a_above_b"
    b_above_a = "b_above_a"
    same_level = "same_level"


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    gm_notes = Column(Text, nullable=True)
    location_type = Column(String(100), nullable=True)
    status = Column(String(100), nullable=True)
    is_visible_to_players = Column(Boolean, default=False, nullable=False)

    # Environment
    weather = Column(Text, nullable=True)
    plant_life = Column(Text, nullable=True)
    animal_life = Column(Text, nullable=True)
    terrain = Column(Text, nullable=True)
    climate = Column(Text, nullable=True)

    # Lore & Culture
    history = Column(Text, nullable=True)
    rumors = Column(Text, nullable=True)
    government = Column(Text, nullable=True)
    religion = Column(Text, nullable=True)
    economy = Column(Text, nullable=True)

    # Adventure
    threats = Column(Text, nullable=True)
    available_services = Column(Text, nullable=True)
    points_of_interest = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Location(id={self.id}, name='{self.name}', campaign_id={self.campaign_id})>"


class LocationNPC(Base):
    __tablename__ = "location_npcs"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    npc_id = Column(Integer, ForeignKey("npcs.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("location_id", "npc_id", name="uq_location_npc"),
    )

    def __repr__(self):
        return f"<LocationNPC(id={self.id}, location_id={self.location_id}, npc_id={self.npc_id})>"


class LocationRelationship(Base):
    __tablename__ = "location_relationships"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    location_a_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    location_b_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(200), nullable=True)
    direction = Column(SQLEnum(RelationshipDirection), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("location_a_id", "location_b_id", name="uq_location_relationship"),
    )

    def __repr__(self):
        return f"<LocationRelationship(id={self.id}, a={self.location_a_id}, b={self.location_b_id}, direction='{self.direction}')>"


class LocationMap(Base):
    __tablename__ = "location_maps"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    image_path = Column(String(500), nullable=False)
    is_visible_to_players = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<LocationMap(id={self.id}, name='{self.name}', location_id={self.location_id})>"


class MapPin(Base):
    __tablename__ = "map_pins"

    id = Column(Integer, primary_key=True, index=True)
    map_id = Column(Integer, ForeignKey("location_maps.id", ondelete="CASCADE"), nullable=False, index=True)
    x_percent = Column(Float, nullable=False)
    y_percent = Column(Float, nullable=False)
    label = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    linked_location_id = Column(Integer, ForeignKey("locations.id", ondelete="SET NULL"), nullable=True)
    is_visible_to_players = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<MapPin(id={self.id}, label='{self.label}', map_id={self.map_id})>"


class LocationLink(Base):
    __tablename__ = "location_links"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(100), nullable=False)
    content_id = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<LocationLink(id={self.id}, location_id={self.location_id}, content_type='{self.content_type}', content_id={self.content_id})>"
