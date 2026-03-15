from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import Weapon
from .schemas import WeaponCreate, WeaponUpdate


def create_weapon(db: Session, weapon_data: WeaponCreate) -> Weapon:
    """
    Create a new weapon.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(Weapon).filter(Weapon.name == weapon_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Weapon with name '{weapon_data.name}' already exists"
        )
    
    db_weapon = Weapon(**weapon_data.model_dump())
    db.add(db_weapon)
    
    try:
        db.commit()
        db.refresh(db_weapon)
        return db_weapon
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create weapon due to database constraint"
        )


def get_all_weapons(db: Session) -> List[Weapon]:
    """
    Get all weapons.
    Available to all authenticated users.
    """
    return db.query(Weapon).order_by(Weapon.weapon_category, Weapon.name).all()


def get_weapon_by_id(db: Session, weapon_id: int) -> Weapon:
    """
    Get a specific weapon by ID.
    Available to all authenticated users.
    """
    db_weapon = db.query(Weapon).filter(Weapon.id == weapon_id).first()
    if not db_weapon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weapon with id {weapon_id} not found"
        )
    return db_weapon


def update_weapon(db: Session, weapon_id: int, weapon_data: WeaponUpdate) -> Weapon:
    """
    Update a weapon.
    Only admin users can call this (enforced in routes).
    """
    db_weapon = get_weapon_by_id(db, weapon_id)
    
    update_data = weapon_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_weapon.name:
        existing = db.query(Weapon).filter(Weapon.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Weapon with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_weapon, field, value)
    
    try:
        db.commit()
        db.refresh(db_weapon)
        return db_weapon
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update weapon due to database constraint"
        )


def delete_weapon(db: Session, weapon_id: int) -> dict:
    """
    Delete a weapon.
    Only admin users can call this (enforced in routes).
    """
    db_weapon = get_weapon_by_id(db, weapon_id)
    
    db.delete(db_weapon)
    db.commit()
    
    return {"message": f"Weapon '{db_weapon.name}' deleted successfully"}