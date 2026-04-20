from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import AdventuringGear
from .schemas import AdventuringGearCreate, AdventuringGearUpdate
from shared.enums import OwnerType


def create_adventuring_gear(db: Session, gear_data: AdventuringGearCreate) -> AdventuringGear:
    existing = db.query(AdventuringGear).filter(
        AdventuringGear.name == gear_data.name,
        AdventuringGear.owner_type == gear_data.owner_type,
        AdventuringGear.owner_id == gear_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Adventuring gear '{gear_data.name}' already exists in this scope")
    db_gear = AdventuringGear(**gear_data.model_dump())
    db.add(db_gear)
    db.commit()
    db.refresh(db_gear)
    return db_gear


def get_all_adventuring_gear(db: Session, campaign_id: Optional[int] = None) -> List[AdventuringGear]:
    if campaign_id:
        campaign_items = db.query(AdventuringGear).filter(
            AdventuringGear.owner_type == OwnerType.campaign,
            AdventuringGear.owner_id == campaign_id
        ).all()
        overridden = {g.name for g in campaign_items}
        system_q = db.query(AdventuringGear).filter(AdventuringGear.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(AdventuringGear.name.notin_(overridden))
        return sorted(campaign_items + system_q.all(), key=lambda g: (g.category, g.name))
    return db.query(AdventuringGear).filter(
        AdventuringGear.owner_type == OwnerType.system
    ).order_by(AdventuringGear.category, AdventuringGear.name).all()


def get_adventuring_gear_by_id(db: Session, gear_id: int) -> AdventuringGear:
    db_gear = db.query(AdventuringGear).filter(AdventuringGear.id == gear_id).first()
    if not db_gear:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Adventuring gear {gear_id} not found")
    return db_gear


def update_adventuring_gear(db: Session, gear_id: int, gear_data: AdventuringGearUpdate) -> AdventuringGear:
    db_gear = get_adventuring_gear_by_id(db, gear_id)
    update_data = gear_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_gear.name:
        existing = db.query(AdventuringGear).filter(
            AdventuringGear.name == update_data["name"],
            AdventuringGear.owner_type == db_gear.owner_type,
            AdventuringGear.owner_id == db_gear.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Adventuring gear '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_gear, field, value)
    db.commit()
    db.refresh(db_gear)
    return db_gear


def delete_adventuring_gear(db: Session, gear_id: int) -> dict:
    db_gear = get_adventuring_gear_by_id(db, gear_id)
    db.delete(db_gear)
    db.commit()
    return {"message": f"Adventuring gear '{db_gear.name}' deleted successfully"}
