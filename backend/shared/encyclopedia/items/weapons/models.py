from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class Weapon(Base):
    __tablename__ = "weapons"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    weapon_category = Column(String(50), nullable=False)
    weapon_type = Column(String(50), nullable=False)

    damage = Column(String(50), nullable=False)
    damage_type = Column(String(50), nullable=False)

    properties = Column(Text)
    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)

    description = Column(Text)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Weapon(id={self.id}, name='{self.name}', type='{self.weapon_type}')>"
