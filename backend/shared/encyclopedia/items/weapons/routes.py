from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import WeaponCreate, WeaponUpdate, WeaponResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/items/weapons", tags=["Encyclopedia - Items - Weapons"])


@router.post("", response_model=WeaponResponse, status_code=status.HTTP_201_CREATED)
def create_weapon(
    weapon_data: WeaponCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(weapon_data.owner_type, weapon_data.owner_id, current_user, db)
    return service.create_weapon(db, weapon_data)


@router.get("", response_model=List[WeaponResponse])
def get_all_weapons(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_weapons(db, campaign_id)


@router.get("/{weapon_id}", response_model=WeaponResponse)
def get_weapon(
    weapon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_weapon_by_id(db, weapon_id)


@router.put("/{weapon_id}", response_model=WeaponResponse)
def update_weapon(
    weapon_id: int,
    weapon_data: WeaponUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_weapon = service.get_weapon_by_id(db, weapon_id)
    check_content_ownership(db_weapon.owner_type, db_weapon.owner_id, current_user, db)
    return service.update_weapon(db, weapon_id, weapon_data)


@router.delete("/{weapon_id}", status_code=status.HTTP_200_OK)
def delete_weapon(
    weapon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_weapon = service.get_weapon_by_id(db, weapon_id)
    check_content_ownership(db_weapon.owner_type, db_weapon.owner_id, current_user, db)
    return service.delete_weapon(db, weapon_id)
