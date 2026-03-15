from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import PotionCreate, PotionUpdate, PotionResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/items/potions",
    tags=["Encyclopedia - Items - Potions"]
)


@router.post(
    "",
    response_model=PotionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new potion"
)
def create_potion(
    potion_data: PotionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create new potion in the encyclopedia.
    Admin only.
    """
    return service.create_potion(db, potion_data)


@router.get(
    "",
    response_model=List[PotionResponse],
    summary="Get all potions"
)
def get_all_potions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all potions from the encyclopedia.
    Available to all authenticated users.
    Sorted by rarity, then name.
    """
    return service.get_all_potions(db)


@router.get(
    "/{potion_id}",
    response_model=PotionResponse,
    summary="Get specific potion"
)
def get_potion(
    potion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific potion by ID.
    Available to all authenticated users.
    """
    return service.get_potion_by_id(db, potion_id)


@router.put(
    "/{potion_id}",
    response_model=PotionResponse,
    summary="Update potion"
)
def update_potion(
    potion_id: int,
    potion_data: PotionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update existing potion.
    Admin only.
    """
    return service.update_potion(db, potion_id, potion_data)


@router.delete(
    "/{potion_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete potion"
)
def delete_potion(
    potion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete potion from the encyclopedia.
    Admin only.
    """
    return service.delete_potion(db, potion_id)