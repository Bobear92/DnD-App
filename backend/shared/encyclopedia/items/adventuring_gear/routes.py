from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import AdventuringGearCreate, AdventuringGearUpdate, AdventuringGearResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/items/adventuring-gear",
                   tags=["Encyclopedia - Items - Adventuring Gear"])


@router.post("", response_model=AdventuringGearResponse, status_code=status.HTTP_201_CREATED)
def create_adventuring_gear(
    gear_data: AdventuringGearCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(gear_data.owner_type, gear_data.owner_id, current_user, db)
    return service.create_adventuring_gear(db, gear_data)


@router.get("", response_model=List[AdventuringGearResponse])
def get_all_adventuring_gear(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_adventuring_gear(db, campaign_id)


@router.get("/{gear_id}", response_model=AdventuringGearResponse)
def get_adventuring_gear(
    gear_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_adventuring_gear_by_id(db, gear_id)


@router.put("/{gear_id}", response_model=AdventuringGearResponse)
def update_adventuring_gear(
    gear_id: int,
    gear_data: AdventuringGearUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_gear = service.get_adventuring_gear_by_id(db, gear_id)
    check_content_ownership(db_gear.owner_type, db_gear.owner_id, current_user, db)
    return service.update_adventuring_gear(db, gear_id, gear_data)


@router.delete("/{gear_id}", status_code=status.HTTP_200_OK)
def delete_adventuring_gear(
    gear_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_gear = service.get_adventuring_gear_by_id(db, gear_id)
    check_content_ownership(db_gear.owner_type, db_gear.owner_id, current_user, db)
    return service.delete_adventuring_gear(db, gear_id)
