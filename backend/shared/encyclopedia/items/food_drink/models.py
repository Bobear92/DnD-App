from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class FoodDrink(Base):
    __tablename__ = "food_drink"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    item_type = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)

    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)
    quantity = Column(String(100), nullable=True)
    effect = Column(Text, nullable=True)

    description = Column(Text)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<FoodDrink(id={self.id}, name='{self.name}', type='{self.item_type}')>"
