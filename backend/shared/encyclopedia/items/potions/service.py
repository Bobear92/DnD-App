from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import Potion
from .schemas import PotionCreate, PotionUpdate


def create_potion(db: Session, potion_data: PotionCreate) -> Potion:
    """
    Create a new potion.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(Potion).filter(Potion.name == potion_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Potion with name '{potion_data.name}' already exists"
        )
    
    db_potion = Potion(**potion_data.model_dump())
    db.add(db_potion)
    
    try:
        db.commit()
        db.refresh(db_potion)
        return db_potion
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create potion due to database constraint"
        )


def get_all_potions(db: Session) -> List[Potion]:
    """
    Get all potions.
    Available to all authenticated users.
    """
    return db.query(Potion).order_by(Potion.rarity, Potion.name).all()


def get_potion_by_id(db: Session, potion_id: int) -> Potion:
    """
    Get a specific potion by ID.
    Available to all authenticated users.
    """
    db_potion = db.query(Potion).filter(Potion.id == potion_id).first()
    if not db_potion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Potion with id {potion_id} not found"
        )
    return db_potion


def update_potion(db: Session, potion_id: int, potion_data: PotionUpdate) -> Potion:
    """
    Update a potion.
    Only admin users can call this (enforced in routes).
    """
    db_potion = get_potion_by_id(db, potion_id)
    
    update_data = potion_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_potion.name:
        existing = db.query(Potion).filter(Potion.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Potion with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_potion, field, value)
    
    try:
        db.commit()
        db.refresh(db_potion)
        return db_potion
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update potion due to database constraint"
        )


def delete_potion(db: Session, potion_id: int) -> dict:
    """
    Delete a potion.
    Only admin users can call this (enforced in routes).
    """
    db_potion = get_potion_by_id(db, potion_id)
    
    db.delete(db_potion)
    db.commit()
    
    return {"message": f"Potion '{db_potion.name}' deleted successfully"}