from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class Creature(Base):
    __tablename__ = "creatures"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    size = Column(String(50), nullable=False)
    type = Column(String(100), nullable=False)
    alignment = Column(String(100))
    challenge_rating = Column(String(20), nullable=False)

    armor_class = Column(Integer, nullable=False)
    hit_points = Column(String(100), nullable=False)
    speed = Column(String(200), nullable=False)

    strength = Column(Integer, nullable=False)
    dexterity = Column(Integer, nullable=False)
    constitution = Column(Integer, nullable=False)
    intelligence = Column(Integer, nullable=False)
    wisdom = Column(Integer, nullable=False)
    charisma = Column(Integer, nullable=False)

    description = Column(Text)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Creature(id={self.id}, name='{self.name}', cr='{self.challenge_rating}')>"
