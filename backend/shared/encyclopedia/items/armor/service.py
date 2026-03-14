from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import Armor
from .schemas import ArmorCreate, ArmorUpdate


def create_armor(db: Session, armor_data: ArmorCreate) -> Armor:
    """
    Create a new armor.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(Armor).filter(Armor.name == armor_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Armor with name '{armor_data.name}' already exists"
        )
    
    db_armor = Armor(**armor_data.model_dump())
    db.add(db_armor)
    
    try:
        db.commit()
        db.refresh(db_armor)
        return db_armor
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create armor due to database constraint"
        )


def get_all_armor(db: Session) -> List[Armor]:
    """
    Get all armor.
    Available to all authenticated users.
    """
    return db.query(Armor).order_by(Armor.armor_type, Armor.name).all()


def get_armor_by_id(db: Session, armor_id: int) -> Armor:
    """
    Get a specific armor by ID.
    Available to all authenticated users.
    """
    db_armor = db.query(Armor).filter(Armor.id == armor_id).first()
    if not db_armor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Armor with id {armor_id} not found"
        )
    return db_armor


def update_armor(db: Session, armor_id: int, armor_data: ArmorUpdate) -> Armor:
    """
    Update an armor.
    Only admin users can call this (enforced in routes).
    """
    db_armor = get_armor_by_id(db, armor_id)
    
    update_data = armor_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_armor.name:
        existing = db.query(Armor).filter(Armor.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Armor with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_armor, field, value)
    
    try:
        db.commit()
        db.refresh(db_armor)
        return db_armor
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update armor due to database constraint"
        )


def delete_armor(db: Session, armor_id: int) -> dict:
    """
    Delete an armor.
    Only admin users can call this (enforced in routes).
    """
    db_armor = get_armor_by_id(db, armor_id)
    
    db.delete(db_armor)
    db.commit()
    
    return {"message": f"Armor '{db_armor.name}' deleted successfully"}