from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class Spell(Base):
    __tablename__ = "spells"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    level = Column(Integer, nullable=False)
    school = Column(String(100), nullable=False)

    casting_time = Column(String(100), nullable=False)
    range = Column(String(100), nullable=False)
    components = Column(Text, nullable=False)
    duration = Column(String(100), nullable=False)

    description = Column(Text, nullable=False)
    higher_level = Column(Text, nullable=True)
    ritual = Column(Boolean, nullable=False, default=False)
    concentration = Column(Boolean, nullable=False, default=False)
    classes = Column(String(200), nullable=False)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Spell(id={self.id}, name='{self.name}', level={self.level})>"
