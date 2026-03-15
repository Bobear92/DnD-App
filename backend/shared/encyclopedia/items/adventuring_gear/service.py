from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import AdventuringGear
from .schemas import AdventuringGearCreate, AdventuringGearUpdate


def create_adventuring_gear(db: Session, gear_data: AdventuringGearCreate) -> AdventuringGear:
    """
    Create new adventuring gear.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(AdventuringGear).filter(AdventuringGear.name == gear_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adventuring gear with name '{gear_data.name}' already exists"
        )
    
    db_gear = AdventuringGear(**gear_data.model_dump())
    db.add(db_gear)
    
    try:
        db.commit()
        db.refresh(db_gear)
        return db_gear
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create adventuring gear due to database constraint"
        )


def get_all_adventuring_gear(db: Session) -> List[AdventuringGear]:
    """
    Get all adventuring gear.
    Available to all authenticated users.
    """
    return db.query(AdventuringGear).order_by(AdventuringGear.category, AdventuringGear.name).all()


def get_adventuring_gear_by_id(db: Session, gear_id: int) -> AdventuringGear:
    """
    Get specific adventuring gear by ID.
    Available to all authenticated users.
    """
    db_gear = db.query(AdventuringGear).filter(AdventuringGear.id == gear_id).first()
    if not db_gear:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Adventuring gear with id {gear_id} not found"
        )
    return db_gear


def update_adventuring_gear(db: Session, gear_id: int, gear_data: AdventuringGearUpdate) -> AdventuringGear:
    """
    Update adventuring gear.
    Only admin users can call this (enforced in routes).
    """
    db_gear = get_adventuring_gear_by_id(db, gear_id)
    
    update_data = gear_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_gear.name:
        existing = db.query(AdventuringGear).filter(AdventuringGear.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Adventuring gear with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_gear, field, value)
    
    try:
        db.commit()
        db.refresh(db_gear)
        return db_gear
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update adventuring gear due to database constraint"
        )


def delete_adventuring_gear(db: Session, gear_id: int) -> dict:
    """
    Delete adventuring gear.
    Only admin users can call this (enforced in routes).
    """
    db_gear = get_adventuring_gear_by_id(db, gear_id)
    
    db.delete(db_gear)
    db.commit()
    
    return {"message": f"Adventuring gear '{db_gear.name}' deleted successfully"}