from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import ArmorCreate, ArmorUpdate, ArmorResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/items/armor", tags=["Encyclopedia - Items - Armor"])


@router.post("", response_model=ArmorResponse, status_code=status.HTTP_201_CREATED)
def create_armor(
    armor_data: ArmorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(armor_data.owner_type, armor_data.owner_id, current_user, db)
    return service.create_armor(db, armor_data)


@router.get("", response_model=List[ArmorResponse])
def get_all_armor(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_armor(db, campaign_id)


@router.get("/{armor_id}", response_model=ArmorResponse)
def get_armor(
    armor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_armor_by_id(db, armor_id)


@router.put("/{armor_id}", response_model=ArmorResponse)
def update_armor(
    armor_id: int,
    armor_data: ArmorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_armor = service.get_armor_by_id(db, armor_id)
    check_content_ownership(db_armor.owner_type, db_armor.owner_id, current_user, db)
    return service.update_armor(db, armor_id, armor_data)


@router.delete("/{armor_id}", status_code=status.HTTP_200_OK)
def delete_armor(
    armor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_armor = service.get_armor_by_id(db, armor_id)
    check_content_ownership(db_armor.owner_type, db_armor.owner_id, current_user, db)
    return service.delete_armor(db, armor_id)
