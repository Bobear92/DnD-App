from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from shared.database import get_db
from shared.dependencies import get_current_user, check_content_ownership
from auth.models import User
from .schemas import MagicItemCreate, MagicItemUpdate, MagicItemResponse
from . import service

router = APIRouter(prefix="/api/encyclopedia/items/magic-items",
                   tags=["Encyclopedia - Items - Magic Items"])


@router.post("", response_model=MagicItemResponse, status_code=status.HTTP_201_CREATED)
def create_magic_item(
    magic_item_data: MagicItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_content_ownership(magic_item_data.owner_type, magic_item_data.owner_id, current_user, db)
    return service.create_magic_item(db, magic_item_data)


@router.get("", response_model=List[MagicItemResponse])
def get_all_magic_items(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_all_magic_items(db, campaign_id)


@router.get("/{magic_item_id}", response_model=MagicItemResponse)
def get_magic_item(
    magic_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_magic_item_by_id(db, magic_item_id)


@router.put("/{magic_item_id}", response_model=MagicItemResponse)
def update_magic_item(
    magic_item_id: int,
    magic_item_data: MagicItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = service.get_magic_item_by_id(db, magic_item_id)
    check_content_ownership(db_item.owner_type, db_item.owner_id, current_user, db)
    return service.update_magic_item(db, magic_item_id, magic_item_data)


@router.delete("/{magic_item_id}", status_code=status.HTTP_200_OK)
def delete_magic_item(
    magic_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_item = service.get_magic_item_by_id(db, magic_item_id)
    check_content_ownership(db_item.owner_type, db_item.owner_id, current_user, db)
    return service.delete_magic_item(db, magic_item_id)
