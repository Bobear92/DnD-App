from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user, require_admin
from auth.models import User
from .schemas import SpellCreate, SpellUpdate, SpellResponse
from . import service


router = APIRouter(
    prefix="/api/encyclopedia/spells",
    tags=["Encyclopedia - Spells"]
)


@router.post(
    "",
    response_model=SpellResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new spell"
)
def create_spell(
    spell_data: SpellCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Create a new spell in the encyclopedia.
    Admin only.
    """
    return service.create_spell(db, spell_data)


@router.get(
    "",
    response_model=List[SpellResponse],
    summary="Get all spells"
)
def get_all_spells(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all spells from the encyclopedia.
    Available to all authenticated users.
    Sorted by level, then name.
    """
    return service.get_all_spells(db)


@router.get(
    "/{spell_id}",
    response_model=SpellResponse,
    summary="Get a specific spell"
)
def get_spell(
    spell_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific spell by ID.
    Available to all authenticated users.
    """
    return service.get_spell_by_id(db, spell_id)


@router.put(
    "/{spell_id}",
    response_model=SpellResponse,
    summary="Update a spell"
)
def update_spell(
    spell_id: int,
    spell_data: SpellUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update an existing spell.
    Admin only.
    """
    return service.update_spell(db, spell_id, spell_data)


@router.delete(
    "/{spell_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a spell"
)
def delete_spell(
    spell_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Delete a spell from the encyclopedia.
    Admin only.
    """
    return service.delete_spell(db, spell_id)