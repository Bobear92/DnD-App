from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import Armor
from .schemas import ArmorCreate, ArmorUpdate
from shared.enums import OwnerType


def create_armor(db: Session, armor_data: ArmorCreate) -> Armor:
    existing = db.query(Armor).filter(
        Armor.name == armor_data.name,
        Armor.owner_type == armor_data.owner_type,
        Armor.owner_id == armor_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Armor '{armor_data.name}' already exists in this scope")
    db_armor = Armor(**armor_data.model_dump())
    db.add(db_armor)
    db.commit()
    db.refresh(db_armor)
    return db_armor


def get_all_armor(db: Session, campaign_id: Optional[int] = None) -> List[Armor]:
    if campaign_id:
        campaign_items = db.query(Armor).filter(
            Armor.owner_type == OwnerType.campaign,
            Armor.owner_id == campaign_id
        ).all()
        overridden = {a.name for a in campaign_items}
        system_q = db.query(Armor).filter(Armor.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(Armor.name.notin_(overridden))
        return sorted(campaign_items + system_q.all(), key=lambda a: (a.armor_type, a.name))
    return db.query(Armor).filter(
        Armor.owner_type == OwnerType.system
    ).order_by(Armor.armor_type, Armor.name).all()


def get_armor_by_id(db: Session, armor_id: int) -> Armor:
    db_armor = db.query(Armor).filter(Armor.id == armor_id).first()
    if not db_armor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Armor {armor_id} not found")
    return db_armor


def update_armor(db: Session, armor_id: int, armor_data: ArmorUpdate) -> Armor:
    db_armor = get_armor_by_id(db, armor_id)
    update_data = armor_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_armor.name:
        existing = db.query(Armor).filter(
            Armor.name == update_data["name"],
            Armor.owner_type == db_armor.owner_type,
            Armor.owner_id == db_armor.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Armor '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_armor, field, value)
    db.commit()
    db.refresh(db_armor)
    return db_armor


def delete_armor(db: Session, armor_id: int) -> dict:
    db_armor = get_armor_by_id(db, armor_id)
    db.delete(db_armor)
    db.commit()
    return {"message": f"Armor '{db_armor.name}' deleted successfully"}
