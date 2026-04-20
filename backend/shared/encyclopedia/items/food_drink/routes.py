from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import FoodDrinkCreate, FoodDrinkUpdate, FoodDrinkResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/items/food-drink",
                   tags=["Encyclopedia - Items - Food/Drink"])


@router.post("", response_model=FoodDrinkResponse, status_code=status.HTTP_201_CREATED)
def create_food_drink(
    food_drink_data: FoodDrinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(food_drink_data.owner_type, food_drink_data.owner_id, current_user, db)
    return service.create_food_drink(db, food_drink_data)


@router.get("", response_model=List[FoodDrinkResponse])
def get_all_food_drink(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_food_drink(db, campaign_id)


@router.get("/{food_drink_id}", response_model=FoodDrinkResponse)
def get_food_drink(
    food_drink_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_food_drink_by_id(db, food_drink_id)


@router.put("/{food_drink_id}", response_model=FoodDrinkResponse)
def update_food_drink(
    food_drink_id: int,
    food_drink_data: FoodDrinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = service.get_food_drink_by_id(db, food_drink_id)
    check_content_ownership(db_item.owner_type, db_item.owner_id, current_user, db)
    return service.update_food_drink(db, food_drink_id, food_drink_data)


@router.delete("/{food_drink_id}", status_code=status.HTTP_200_OK)
def delete_food_drink(
    food_drink_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = service.get_food_drink_by_id(db, food_drink_id)
    check_content_ownership(db_item.owner_type, db_item.owner_id, current_user, db)
    return service.delete_food_drink(db, food_drink_id)
