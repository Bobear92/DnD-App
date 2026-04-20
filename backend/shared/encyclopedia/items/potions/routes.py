from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import PotionCreate, PotionUpdate, PotionResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/items/potions", tags=["Encyclopedia - Items - Potions"])


@router.post("", response_model=PotionResponse, status_code=status.HTTP_201_CREATED)
def create_potion(
    potion_data: PotionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(potion_data.owner_type, potion_data.owner_id, current_user, db)
    return service.create_potion(db, potion_data)


@router.get("", response_model=List[PotionResponse])
def get_all_potions(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_potions(db, campaign_id)


@router.get("/{potion_id}", response_model=PotionResponse)
def get_potion(
    potion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_potion_by_id(db, potion_id)


@router.put("/{potion_id}", response_model=PotionResponse)
def update_potion(
    potion_id: int,
    potion_data: PotionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_potion = service.get_potion_by_id(db, potion_id)
    check_content_ownership(db_potion.owner_type, db_potion.owner_id, current_user, db)
    return service.update_potion(db, potion_id, potion_data)


@router.delete("/{potion_id}", status_code=status.HTTP_200_OK)
def delete_potion(
    potion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_potion = service.get_potion_by_id(db, potion_id)
    check_content_ownership(db_potion.owner_type, db_potion.owner_id, current_user, db)
    return service.delete_potion(db, potion_id)
