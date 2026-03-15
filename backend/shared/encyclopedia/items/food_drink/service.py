from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import FoodDrink
from .schemas import FoodDrinkCreate, FoodDrinkUpdate


def create_food_drink(db: Session, food_drink_data: FoodDrinkCreate) -> FoodDrink:
    """
    Create new food/drink item.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(FoodDrink).filter(FoodDrink.name == food_drink_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Food/Drink with name '{food_drink_data.name}' already exists"
        )
    
    db_food_drink = FoodDrink(**food_drink_data.model_dump())
    db.add(db_food_drink)
    
    try:
        db.commit()
        db.refresh(db_food_drink)
        return db_food_drink
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create food/drink due to database constraint"
        )


def get_all_food_drink(db: Session) -> List[FoodDrink]:
    """
    Get all food/drink items.
    Available to all authenticated users.
    """
    return db.query(FoodDrink).order_by(FoodDrink.item_type, FoodDrink.category, FoodDrink.name).all()


def get_food_drink_by_id(db: Session, food_drink_id: int) -> FoodDrink:
    """
    Get specific food/drink by ID.
    Available to all authenticated users.
    """
    db_food_drink = db.query(FoodDrink).filter(FoodDrink.id == food_drink_id).first()
    if not db_food_drink:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food/Drink with id {food_drink_id} not found"
        )
    return db_food_drink


def update_food_drink(db: Session, food_drink_id: int, food_drink_data: FoodDrinkUpdate) -> FoodDrink:
    """
    Update food/drink item.
    Only admin users can call this (enforced in routes).
    """
    db_food_drink = get_food_drink_by_id(db, food_drink_id)
    
    update_data = food_drink_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_food_drink.name:
        existing = db.query(FoodDrink).filter(FoodDrink.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Food/Drink with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_food_drink, field, value)
    
    try:
        db.commit()
        db.refresh(db_food_drink)
        return db_food_drink
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update food/drink due to database constraint"
        )


def delete_food_drink(db: Session, food_drink_id: int) -> dict:
    """
    Delete food/drink item.
    Only admin users can call this (enforced in routes).
    """
    db_food_drink = get_food_drink_by_id(db, food_drink_id)
    
    db.delete(db_food_drink)
    db.commit()
    
    return {"message": f"Food/Drink '{db_food_drink.name}' deleted successfully"}