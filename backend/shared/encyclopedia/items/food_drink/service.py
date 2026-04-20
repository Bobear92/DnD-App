from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import FoodDrink
from .schemas import FoodDrinkCreate, FoodDrinkUpdate
from shared.enums import OwnerType


def create_food_drink(db: Session, food_drink_data: FoodDrinkCreate) -> FoodDrink:
    existing = db.query(FoodDrink).filter(
        FoodDrink.name == food_drink_data.name,
        FoodDrink.owner_type == food_drink_data.owner_type,
        FoodDrink.owner_id == food_drink_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Food/Drink '{food_drink_data.name}' already exists in this scope")
    db_item = FoodDrink(**food_drink_data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_all_food_drink(db: Session, campaign_id: Optional[int] = None) -> List[FoodDrink]:
    if campaign_id:
        campaign_items = db.query(FoodDrink).filter(
            FoodDrink.owner_type == OwnerType.campaign,
            FoodDrink.owner_id == campaign_id
        ).all()
        overridden = {f.name for f in campaign_items}
        system_q = db.query(FoodDrink).filter(FoodDrink.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(FoodDrink.name.notin_(overridden))
        return sorted(campaign_items + system_q.all(),
                      key=lambda f: (f.item_type, f.category, f.name))
    return db.query(FoodDrink).filter(
        FoodDrink.owner_type == OwnerType.system
    ).order_by(FoodDrink.item_type, FoodDrink.category, FoodDrink.name).all()


def get_food_drink_by_id(db: Session, food_drink_id: int) -> FoodDrink:
    db_item = db.query(FoodDrink).filter(FoodDrink.id == food_drink_id).first()
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Food/Drink {food_drink_id} not found")
    return db_item


def update_food_drink(db: Session, food_drink_id: int, food_drink_data: FoodDrinkUpdate) -> FoodDrink:
    db_item = get_food_drink_by_id(db, food_drink_id)
    update_data = food_drink_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_item.name:
        existing = db.query(FoodDrink).filter(
            FoodDrink.name == update_data["name"],
            FoodDrink.owner_type == db_item.owner_type,
            FoodDrink.owner_id == db_item.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Food/Drink '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_food_drink(db: Session, food_drink_id: int) -> dict:
    db_item = get_food_drink_by_id(db, food_drink_id)
    db.delete(db_item)
    db.commit()
    return {"message": f"Food/Drink '{db_item.name}' deleted successfully"}
