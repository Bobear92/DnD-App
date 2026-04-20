from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class MagicItem(Base):
    __tablename__ = "magic_items"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    item_type = Column(String(100), nullable=False)
    rarity = Column(String(50), nullable=False)

    attunement_required = Column(Boolean, default=False, nullable=False)
    effect = Column(Text, nullable=False)
    cost = Column(String(50), nullable=True)
    weight = Column(String(50), nullable=True)

    description = Column(Text)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<MagicItem(id={self.id}, name='{self.name}', rarity='{self.rarity}')>"
