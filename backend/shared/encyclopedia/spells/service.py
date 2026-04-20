from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import Spell
from .schemas import SpellCreate, SpellUpdate
from shared.enums import OwnerType


def create_spell(db: Session, spell_data: SpellCreate) -> Spell:
    existing = db.query(Spell).filter(
        Spell.name == spell_data.name,
        Spell.owner_type == spell_data.owner_type,
        Spell.owner_id == spell_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Spell '{spell_data.name}' already exists in this scope")
    db_spell = Spell(**spell_data.model_dump())
    db.add(db_spell)
    db.commit()
    db.refresh(db_spell)
    return db_spell


def get_all_spells(db: Session, campaign_id: Optional[int] = None) -> List[Spell]:
    if campaign_id:
        campaign_spells = db.query(Spell).filter(
            Spell.owner_type == OwnerType.campaign,
            Spell.owner_id == campaign_id
        ).all()
        overridden = {s.name for s in campaign_spells}
        system_q = db.query(Spell).filter(Spell.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(Spell.name.notin_(overridden))
        return sorted(campaign_spells + system_q.all(), key=lambda s: (s.level, s.name))
    return db.query(Spell).filter(
        Spell.owner_type == OwnerType.system
    ).order_by(Spell.level, Spell.name).all()


def get_spell_by_id(db: Session, spell_id: int) -> Spell:
    db_spell = db.query(Spell).filter(Spell.id == spell_id).first()
    if not db_spell:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Spell {spell_id} not found")
    return db_spell


def update_spell(db: Session, spell_id: int, spell_data: SpellUpdate) -> Spell:
    db_spell = get_spell_by_id(db, spell_id)
    update_data = spell_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_spell.name:
        existing = db.query(Spell).filter(
            Spell.name == update_data["name"],
            Spell.owner_type == db_spell.owner_type,
            Spell.owner_id == db_spell.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Spell '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_spell, field, value)
    db.commit()
    db.refresh(db_spell)
    return db_spell


def delete_spell(db: Session, spell_id: int) -> dict:
    db_spell = get_spell_by_id(db, spell_id)
    db.delete(db_spell)
    db.commit()
    return {"message": f"Spell '{db_spell.name}' deleted successfully"}
