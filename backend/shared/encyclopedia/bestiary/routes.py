from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import CreatureCreate, CreatureUpdate, CreatureResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/bestiary",
    tags=["Encyclopedia - Bestiary"]
)


@router.post(
    "",
    response_model=CreatureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new creature"
)
def create_creature(
    creature_data: CreatureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new creature in the bestiary.
    Admin only.
    """
    return service.create_creature(db, creature_data)


@router.get(
    "",
    response_model=List[CreatureResponse],
    summary="Get all creatures"
)
def get_all_creatures(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all creatures from the bestiary.
    Available to all authenticated users.
    """
    return service.get_all_creatures(db)


@router.get(
    "/{creature_id}",
    response_model=CreatureResponse,
    summary="Get a specific creature"
)
def get_creature(
    creature_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific creature by ID.
    Available to all authenticated users.
    """
    return service.get_creature_by_id(db, creature_id)


@router.put(
    "/{creature_id}",
    response_model=CreatureResponse,
    summary="Update a creature"
)
def update_creature(
    creature_id: int,
    creature_data: CreatureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update an existing creature.
    Admin only.
    """
    return service.update_creature(db, creature_id, creature_data)


@router.delete(
    "/{creature_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a creature"
)
def delete_creature(
    creature_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a creature from the bestiary.
    Admin only.
    """
    return service.delete_creature(db, creature_id)