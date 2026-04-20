from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import Creature
from .schemas import CreatureCreate, CreatureUpdate
from shared.enums import OwnerType


def create_creature(db: Session, creature_data: CreatureCreate) -> Creature:
    existing = db.query(Creature).filter(
        Creature.name == creature_data.name,
        Creature.owner_type == creature_data.owner_type,
        Creature.owner_id == creature_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Creature '{creature_data.name}' already exists in this scope")
    db_creature = Creature(**creature_data.model_dump())
    db.add(db_creature)
    db.commit()
    db.refresh(db_creature)
    return db_creature


def get_all_creatures(db: Session, campaign_id: Optional[int] = None) -> List[Creature]:
    if campaign_id:
        campaign_creatures = db.query(Creature).filter(
            Creature.owner_type == OwnerType.campaign,
            Creature.owner_id == campaign_id
        ).all()
        overridden = {c.name for c in campaign_creatures}
        system_q = db.query(Creature).filter(Creature.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(Creature.name.notin_(overridden))
        return sorted(campaign_creatures + system_q.all(), key=lambda c: c.name)
    return db.query(Creature).filter(
        Creature.owner_type == OwnerType.system
    ).order_by(Creature.name).all()


def get_creature_by_id(db: Session, creature_id: int) -> Creature:
    db_creature = db.query(Creature).filter(Creature.id == creature_id).first()
    if not db_creature:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Creature {creature_id} not found")
    return db_creature


def update_creature(db: Session, creature_id: int, creature_data: CreatureUpdate) -> Creature:
    db_creature = get_creature_by_id(db, creature_id)
    update_data = creature_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_creature.name:
        existing = db.query(Creature).filter(
            Creature.name == update_data["name"],
            Creature.owner_type == db_creature.owner_type,
            Creature.owner_id == db_creature.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Creature '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_creature, field, value)
    db.commit()
    db.refresh(db_creature)
    return db_creature


def delete_creature(db: Session, creature_id: int) -> dict:
    db_creature = get_creature_by_id(db, creature_id)
    db.delete(db_creature)
    db.commit()
    return {"message": f"Creature '{db_creature.name}' deleted successfully"}
