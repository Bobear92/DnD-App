from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import SpellCreate, SpellUpdate, SpellResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/spells", tags=["Encyclopedia - Spells"])


@router.post("", response_model=SpellResponse, status_code=status.HTTP_201_CREATED)
def create_spell(
    spell_data: SpellCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(spell_data.owner_type, spell_data.owner_id, current_user, db)
    return service.create_spell(db, spell_data)


@router.get("", response_model=List[SpellResponse])
def get_all_spells(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_spells(db, campaign_id)


@router.get("/{spell_id}", response_model=SpellResponse)
def get_spell(
    spell_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_spell_by_id(db, spell_id)


@router.put("/{spell_id}", response_model=SpellResponse)
def update_spell(
    spell_id: int,
    spell_data: SpellUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_spell = service.get_spell_by_id(db, spell_id)
    check_content_ownership(db_spell.owner_type, db_spell.owner_id, current_user, db)
    return service.update_spell(db, spell_id, spell_data)


@router.delete("/{spell_id}", status_code=status.HTTP_200_OK)
def delete_spell(
    spell_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_spell = service.get_spell_by_id(db, spell_id)
    check_content_ownership(db_spell.owner_type, db_spell.owner_id, current_user, db)
    return service.delete_spell(db, spell_id)
