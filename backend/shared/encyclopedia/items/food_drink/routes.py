from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import FoodDrinkCreate, FoodDrinkUpdate, FoodDrinkResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/items/food-drink",
    tags=["Encyclopedia - Items - Food/Drink"]
)


@router.post(
    "",
    response_model=FoodDrinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new food/drink"
)
def create_food_drink(
    food_drink_data: FoodDrinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create new food/drink in the encyclopedia.
    Admin only.
    """
    return service.create_food_drink(db, food_drink_data)


@router.get(
    "",
    response_model=List[FoodDrinkResponse],
    summary="Get all food/drink"
)
def get_all_food_drink(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all food/drink from the encyclopedia.
    Available to all authenticated users.
    Sorted by type, category, then name.
    """
    return service.get_all_food_drink(db)


@router.get(
    "/{food_drink_id}",
    response_model=FoodDrinkResponse,
    summary="Get specific food/drink"
)
def get_food_drink(
    food_drink_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get specific food/drink by ID.
    Available to all authenticated users.
    """
    return service.get_food_drink_by_id(db, food_drink_id)


@router.put(
    "/{food_drink_id}",
    response_model=FoodDrinkResponse,
    summary="Update food/drink"
)
def update_food_drink(
    food_drink_id: int,
    food_drink_data: FoodDrinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update existing food/drink.
    Admin only.
    """
    return service.update_food_drink(db, food_drink_id, food_drink_data)


@router.delete(
    "/{food_drink_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete food/drink"
)
def delete_food_drink(
    food_drink_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete food/drink from the encyclopedia.
    Admin only.
    """
    return service.delete_food_drink(db, food_drink_id)