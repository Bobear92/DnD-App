from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from shared.database import Base


class Encounter(Base):
    """One combat the GM is running. V1 holds only player characters and their initiative —
    monsters wait for the Bestiary, turn/round tracking is deliberately out of scope."""

    __tablename__ = "encounters"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Encounter(id={self.id}, name='{self.name}', campaign_id={self.campaign_id})>"


class EncounterCombatant(Base):
    """A character in an encounter. `initiative` is null until rolled or typed in, which is what
    lets the GM add everyone first and roll second."""

    __tablename__ = "encounter_combatants"

    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False)
    initiative = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("encounter_id", "character_id", name="uq_encounter_combatant"),
    )

    def __repr__(self):
        return f"<EncounterCombatant(encounter_id={self.encounter_id}, character_id={self.character_id})>"
