from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import Potion
from .schemas import PotionCreate, PotionUpdate
from shared.enums import OwnerType


def create_potion(db: Session, potion_data: PotionCreate) -> Potion:
    existing = db.query(Potion).filter(
        Potion.name == potion_data.name,
        Potion.owner_type == potion_data.owner_type,
        Potion.owner_id == potion_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Potion '{potion_data.name}' already exists in this scope")
    db_potion = Potion(**potion_data.model_dump())
    db.add(db_potion)
    db.commit()
    db.refresh(db_potion)
    return db_potion


def get_all_potions(db: Session, campaign_id: Optional[int] = None) -> List[Potion]:
    if campaign_id:
        campaign_items = db.query(Potion).filter(
            Potion.owner_type == OwnerType.campaign,
            Potion.owner_id == campaign_id
        ).all()
        overridden = {p.name for p in campaign_items}
        system_q = db.query(Potion).filter(Potion.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(Potion.name.notin_(overridden))
        return sorted(campaign_items + system_q.all(), key=lambda p: (p.rarity, p.name))
    return db.query(Potion).filter(
        Potion.owner_type == OwnerType.system
    ).order_by(Potion.rarity, Potion.name).all()


def get_potion_by_id(db: Session, potion_id: int) -> Potion:
    db_potion = db.query(Potion).filter(Potion.id == potion_id).first()
    if not db_potion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Potion {potion_id} not found")
    return db_potion


def update_potion(db: Session, potion_id: int, potion_data: PotionUpdate) -> Potion:
    db_potion = get_potion_by_id(db, potion_id)
    update_data = potion_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_potion.name:
        existing = db.query(Potion).filter(
            Potion.name == update_data["name"],
            Potion.owner_type == db_potion.owner_type,
            Potion.owner_id == db_potion.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Potion '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_potion, field, value)
    db.commit()
    db.refresh(db_potion)
    return db_potion


def delete_potion(db: Session, potion_id: int) -> dict:
    db_potion = get_potion_by_id(db, potion_id)
    db.delete(db_potion)
    db.commit()
    return {"message": f"Potion '{db_potion.name}' deleted successfully"}
