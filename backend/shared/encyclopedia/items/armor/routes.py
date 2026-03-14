from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import ArmorCreate, ArmorUpdate, ArmorResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/items/armor",
    tags=["Encyclopedia - Items - Armor"]
)


@router.post(
    "",
    response_model=ArmorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new armor"
)
def create_armor(
    armor_data: ArmorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create new armor in the encyclopedia.
    Admin only.
    """
    return service.create_armor(db, armor_data)


@router.get(
    "",
    response_model=List[ArmorResponse],
    summary="Get all armor"
)
def get_all_armor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all armor from the encyclopedia.
    Available to all authenticated users.
    Sorted by armor type, then name.
    """
    return service.get_all_armor(db)


@router.get(
    "/{armor_id}",
    response_model=ArmorResponse,
    summary="Get specific armor"
)
def get_armor(
    armor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific armor by ID.
    Available to all authenticated users.
    """
    return service.get_armor_by_id(db, armor_id)


@router.put(
    "/{armor_id}",
    response_model=ArmorResponse,
    summary="Update armor"
)
def update_armor(
    armor_id: int,
    armor_data: ArmorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update existing armor.
    Admin only.
    """
    return service.update_armor(db, armor_id, armor_data)


@router.delete(
    "/{armor_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete armor"
)
def delete_armor(
    armor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete armor from the encyclopedia.
    Admin only.
    """
    return service.delete_armor(db, armor_id)