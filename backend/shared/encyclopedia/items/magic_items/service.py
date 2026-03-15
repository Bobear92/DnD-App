from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import MagicItem
from .schemas import MagicItemCreate, MagicItemUpdate


def create_magic_item(db: Session, magic_item_data: MagicItemCreate) -> MagicItem:
    """
    Create a new magic item.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(MagicItem).filter(MagicItem.name == magic_item_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Magic item with name '{magic_item_data.name}' already exists"
        )
    
    db_magic_item = MagicItem(**magic_item_data.model_dump())
    db.add(db_magic_item)
    
    try:
        db.commit()
        db.refresh(db_magic_item)
        return db_magic_item
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create magic item due to database constraint"
        )


def get_all_magic_items(db: Session) -> List[MagicItem]:
    """
    Get all magic items.
    Available to all authenticated users.
    """
    return db.query(MagicItem).order_by(MagicItem.rarity, MagicItem.name).all()


def get_magic_item_by_id(db: Session, magic_item_id: int) -> MagicItem:
    """
    Get a specific magic item by ID.
    Available to all authenticated users.
    """
    db_magic_item = db.query(MagicItem).filter(MagicItem.id == magic_item_id).first()
    if not db_magic_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Magic item with id {magic_item_id} not found"
        )
    return db_magic_item


def update_magic_item(db: Session, magic_item_id: int, magic_item_data: MagicItemUpdate) -> MagicItem:
    """
    Update a magic item.
    Only admin users can call this (enforced in routes).
    """
    db_magic_item = get_magic_item_by_id(db, magic_item_id)
    
    update_data = magic_item_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_magic_item.name:
        existing = db.query(MagicItem).filter(MagicItem.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Magic item with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_magic_item, field, value)
    
    try:
        db.commit()
        db.refresh(db_magic_item)
        return db_magic_item
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update magic item due to database constraint"
        )


def delete_magic_item(db: Session, magic_item_id: int) -> dict:
    """
    Delete a magic item.
    Only admin users can call this (enforced in routes).
    """
    db_magic_item = get_magic_item_by_id(db, magic_item_id)
    
    db.delete(db_magic_item)
    db.commit()
    
    return {"message": f"Magic item '{db_magic_item.name}' deleted successfully"}