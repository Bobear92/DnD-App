from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import CreatureCreate, CreatureUpdate, CreatureResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/bestiary", tags=["Encyclopedia - Bestiary"])


@router.post("", response_model=CreatureResponse, status_code=status.HTTP_201_CREATED)
def create_creature(
    creature_data: CreatureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(creature_data.owner_type, creature_data.owner_id, current_user, db)
    return service.create_creature(db, creature_data)


@router.get("", response_model=List[CreatureResponse])
def get_all_creatures(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_creatures(db, campaign_id)


@router.get("/{creature_id}", response_model=CreatureResponse)
def get_creature(
    creature_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_creature_by_id(db, creature_id)


@router.put("/{creature_id}", response_model=CreatureResponse)
def update_creature(
    creature_id: int,
    creature_data: CreatureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_creature = service.get_creature_by_id(db, creature_id)
    check_content_ownership(db_creature.owner_type, db_creature.owner_id, current_user, db)
    return service.update_creature(db, creature_id, creature_data)


@router.delete("/{creature_id}", status_code=status.HTTP_200_OK)
def delete_creature(
    creature_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_creature = service.get_creature_by_id(db, creature_id)
    check_content_ownership(db_creature.owner_type, db_creature.owner_id, current_user, db)
    return service.delete_creature(db, creature_id)
