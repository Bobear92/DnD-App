from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from shared.database import Base


class FoodDrink(Base):
    """
    D&D 2024 Food/Drink - part of the Encyclopedia Items (global reference material).
    Admin-managed, viewable by all users.
    
    V1: Basic fields only. Will expand with spoilage mechanics, special effects (JSONB), images in V2+
    """
    __tablename__ = "food_drink"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(200), unique=True, nullable=False, index=True)
    item_type = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)
    
    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)
    quantity = Column(String(100), nullable=True)
    effect = Column(Text, nullable=True)
    
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<FoodDrink(id={self.id}, name='{self.name}', type='{self.item_type}')>"