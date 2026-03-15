from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import AdventuringGearCreate, AdventuringGearUpdate, AdventuringGearResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/items/adventuring-gear",
    tags=["Encyclopedia - Items - Adventuring Gear"]
)


@router.post(
    "",
    response_model=AdventuringGearResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new adventuring gear"
)
def create_adventuring_gear(
    gear_data: AdventuringGearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create new adventuring gear in the encyclopedia.
    Admin only.
    """
    return service.create_adventuring_gear(db, gear_data)


@router.get(
    "",
    response_model=List[AdventuringGearResponse],
    summary="Get all adventuring gear"
)
def get_all_adventuring_gear(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all adventuring gear from the encyclopedia.
    Available to all authenticated users.
    Sorted by category, then name.
    """
    return service.get_all_adventuring_gear(db)


@router.get(
    "/{gear_id}",
    response_model=AdventuringGearResponse,
    summary="Get specific adventuring gear"
)
def get_adventuring_gear(
    gear_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get specific adventuring gear by ID.
    Available to all authenticated users.
    """
    return service.get_adventuring_gear_by_id(db, gear_id)


@router.put(
    "/{gear_id}",
    response_model=AdventuringGearResponse,
    summary="Update adventuring gear"
)
def update_adventuring_gear(
    gear_id: int,
    gear_data: AdventuringGearUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update existing adventuring gear.
    Admin only.
    """
    return service.update_adventuring_gear(db, gear_id, gear_data)


@router.delete(
    "/{gear_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete adventuring gear"
)
def delete_adventuring_gear(
    gear_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete adventuring gear from the encyclopedia.
    Admin only.
    """
    return service.delete_adventuring_gear(db, gear_id)