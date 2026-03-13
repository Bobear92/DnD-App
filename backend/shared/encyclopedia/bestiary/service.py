from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import Creature
from .schemas import CreatureCreate, CreatureUpdate


def create_creature(db: Session, creature_data: CreatureCreate) -> Creature:
    """
    Create a new creature.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(Creature).filter(Creature.name == creature_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Creature with name '{creature_data.name}' already exists"
        )
    
    db_creature = Creature(**creature_data.model_dump())
    db.add(db_creature)
    
    try:
        db.commit()
        db.refresh(db_creature)
        return db_creature
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create creature due to database constraint"
        )


def get_all_creatures(db: Session) -> List[Creature]:
    """
    Get all creatures.
    Available to all authenticated users.
    """
    return db.query(Creature).order_by(Creature.name).all()


def get_creature_by_id(db: Session, creature_id: int) -> Creature:
    """
    Get a specific creature by ID.
    Available to all authenticated users.
    """
    db_creature = db.query(Creature).filter(Creature.id == creature_id).first()
    if not db_creature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Creature with id {creature_id} not found"
        )
    return db_creature


def update_creature(db: Session, creature_id: int, creature_data: CreatureUpdate) -> Creature:
    """
    Update a creature.
    Only admin users can call this (enforced in routes).
    """
    db_creature = get_creature_by_id(db, creature_id)
    
    update_data = creature_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_creature.name:
        existing = db.query(Creature).filter(Creature.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Creature with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_creature, field, value)
    
    try:
        db.commit()
        db.refresh(db_creature)
        return db_creature
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update creature due to database constraint"
        )


def delete_creature(db: Session, creature_id: int) -> dict:
    """
    Delete a creature.
    Only admin users can call this (enforced in routes).
    """
    db_creature = get_creature_by_id(db, creature_id)
    
    db.delete(db_creature)
    db.commit()
    
    return {"message": f"Creature '{db_creature.name}' deleted successfully"}