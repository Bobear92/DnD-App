from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import Spell
from .schemas import SpellCreate, SpellUpdate


def create_spell(db: Session, spell_data: SpellCreate) -> Spell:
    """
    Create a new spell.
    Only admin users can call this (enforced in routes).
    """
    existing = db.query(Spell).filter(Spell.name == spell_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Spell with name '{spell_data.name}' already exists"
        )
    
    db_spell = Spell(**spell_data.model_dump())
    db.add(db_spell)
    
    try:
        db.commit()
        db.refresh(db_spell)
        return db_spell
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create spell due to database constraint"
        )


def get_all_spells(db: Session) -> List[Spell]:
    """
    Get all spells.
    Available to all authenticated users.
    """
    return db.query(Spell).order_by(Spell.level, Spell.name).all()


def get_spell_by_id(db: Session, spell_id: int) -> Spell:
    """
    Get a specific spell by ID.
    Available to all authenticated users.
    """
    db_spell = db.query(Spell).filter(Spell.id == spell_id).first()
    if not db_spell:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spell with id {spell_id} not found"
        )
    return db_spell


def update_spell(db: Session, spell_id: int, spell_data: SpellUpdate) -> Spell:
    """
    Update a spell.
    Only admin users can call this (enforced in routes).
    """
    db_spell = get_spell_by_id(db, spell_id)
    
    update_data = spell_data.model_dump(exclude_unset=True)
    
    if "name" in update_data and update_data["name"] != db_spell.name:
        existing = db.query(Spell).filter(Spell.name == update_data["name"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Spell with name '{update_data['name']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_spell, field, value)
    
    try:
        db.commit()
        db.refresh(db_spell)
        return db_spell
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update spell due to database constraint"
        )


def delete_spell(db: Session, spell_id: int) -> dict:
    """
    Delete a spell.
    Only admin users can call this (enforced in routes).
    """
    db_spell = get_spell_by_id(db, spell_id)
    
    db.delete(db_spell)
    db.commit()
    
    return {"message": f"Spell '{db_spell.name}' deleted successfully"}