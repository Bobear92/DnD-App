from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import MagicItemCreate, MagicItemUpdate, MagicItemResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/items/magic-items",
    tags=["Encyclopedia - Items - Magic Items"]
)


@router.post(
    "",
    response_model=MagicItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new magic item"
)
def create_magic_item(
    magic_item_data: MagicItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create new magic item in the encyclopedia.
    Admin only.
    """
    return service.create_magic_item(db, magic_item_data)


@router.get(
    "",
    response_model=List[MagicItemResponse],
    summary="Get all magic items"
)
def get_all_magic_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all magic items from the encyclopedia.
    Available to all authenticated users.
    Sorted by rarity, then name.
    """
    return service.get_all_magic_items(db)


@router.get(
    "/{magic_item_id}",
    response_model=MagicItemResponse,
    summary="Get specific magic item"
)
def get_magic_item(
    magic_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific magic item by ID.
    Available to all authenticated users.
    """
    return service.get_magic_item_by_id(db, magic_item_id)


@router.put(
    "/{magic_item_id}",
    response_model=MagicItemResponse,
    summary="Update magic item"
)
def update_magic_item(
    magic_item_id: int,
    magic_item_data: MagicItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update existing magic item.
    Admin only.
    """
    return service.update_magic_item(db, magic_item_id, magic_item_data)


@router.delete(
    "/{magic_item_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete magic item"
)
def delete_magic_item(
    magic_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete magic item from the encyclopedia.
    Admin only.
    """
    return service.delete_magic_item(db, magic_item_id)