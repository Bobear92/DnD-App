from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import Weapon
from .schemas import WeaponCreate, WeaponUpdate
from shared.enums import OwnerType


def create_weapon(db: Session, weapon_data: WeaponCreate) -> Weapon:
    existing = db.query(Weapon).filter(
        Weapon.name == weapon_data.name,
        Weapon.owner_type == weapon_data.owner_type,
        Weapon.owner_id == weapon_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Weapon '{weapon_data.name}' already exists in this scope")
    db_weapon = Weapon(**weapon_data.model_dump())
    db.add(db_weapon)
    db.commit()
    db.refresh(db_weapon)
    return db_weapon


def get_all_weapons(db: Session, campaign_id: Optional[int] = None) -> List[Weapon]:
    if campaign_id:
        campaign_items = db.query(Weapon).filter(
            Weapon.owner_type == OwnerType.campaign,
            Weapon.owner_id == campaign_id
        ).all()
        overridden = {w.name for w in campaign_items}
        system_q = db.query(Weapon).filter(Weapon.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(Weapon.name.notin_(overridden))
        return sorted(campaign_items + system_q.all(), key=lambda w: (w.weapon_category, w.name))
    return db.query(Weapon).filter(
        Weapon.owner_type == OwnerType.system
    ).order_by(Weapon.weapon_category, Weapon.name).all()


def get_weapon_by_id(db: Session, weapon_id: int) -> Weapon:
    db_weapon = db.query(Weapon).filter(Weapon.id == weapon_id).first()
    if not db_weapon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Weapon {weapon_id} not found")
    return db_weapon


def update_weapon(db: Session, weapon_id: int, weapon_data: WeaponUpdate) -> Weapon:
    db_weapon = get_weapon_by_id(db, weapon_id)
    update_data = weapon_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_weapon.name:
        existing = db.query(Weapon).filter(
            Weapon.name == update_data["name"],
            Weapon.owner_type == db_weapon.owner_type,
            Weapon.owner_id == db_weapon.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Weapon '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_weapon, field, value)
    db.commit()
    db.refresh(db_weapon)
    return db_weapon


def delete_weapon(db: Session, weapon_id: int) -> dict:
    db_weapon = get_weapon_by_id(db, weapon_id)
    db.delete(db_weapon)
    db.commit()
    return {"message": f"Weapon '{db_weapon.name}' deleted successfully"}
