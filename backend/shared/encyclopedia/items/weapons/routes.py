from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import WeaponCreate, WeaponUpdate, WeaponResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/items/weapons",
    tags=["Encyclopedia - Items - Weapons"]
)


@router.post(
    "",
    response_model=WeaponResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new weapon"
)
def create_weapon(
    weapon_data: WeaponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create new weapon in the encyclopedia.
    Admin only.
    """
    return service.create_weapon(db, weapon_data)


@router.get(
    "",
    response_model=List[WeaponResponse],
    summary="Get all weapons"
)
def get_all_weapons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all weapons from the encyclopedia.
    Available to all authenticated users.
    Sorted by weapon category, then name.
    """
    return service.get_all_weapons(db)


@router.get(
    "/{weapon_id}",
    response_model=WeaponResponse,
    summary="Get specific weapon"
)
def get_weapon(
    weapon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific weapon by ID.
    Available to all authenticated users.
    """
    return service.get_weapon_by_id(db, weapon_id)


@router.put(
    "/{weapon_id}",
    response_model=WeaponResponse,
    summary="Update weapon"
)
def update_weapon(
    weapon_id: int,
    weapon_data: WeaponUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update existing weapon.
    Admin only.
    """
    return service.update_weapon(db, weapon_id, weapon_data)


@router.delete(
    "/{weapon_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete weapon"
)
def delete_weapon(
    weapon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete weapon from the encyclopedia.
    Admin only.
    """
    return service.delete_weapon(db, weapon_id)