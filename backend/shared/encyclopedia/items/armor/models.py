from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class Armor(Base):
    __tablename__ = "armor"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    armor_type = Column(String(50), nullable=False)
    armor_class = Column(Integer, nullable=False)

    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)
    strength_requirement = Column(Integer, nullable=True)
    stealth_disadvantage = Column(Boolean, default=False, nullable=False)

    description = Column(Text)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Armor(id={self.id}, name='{self.name}', type='{self.armor_type}')>"
