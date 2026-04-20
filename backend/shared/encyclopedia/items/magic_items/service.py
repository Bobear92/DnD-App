from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from .models import MagicItem
from .schemas import MagicItemCreate, MagicItemUpdate
from shared.enums import OwnerType


def create_magic_item(db: Session, magic_item_data: MagicItemCreate) -> MagicItem:
    existing = db.query(MagicItem).filter(
        MagicItem.name == magic_item_data.name,
        MagicItem.owner_type == magic_item_data.owner_type,
        MagicItem.owner_id == magic_item_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Magic item '{magic_item_data.name}' already exists in this scope")
    db_item = MagicItem(**magic_item_data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_all_magic_items(db: Session, campaign_id: Optional[int] = None) -> List[MagicItem]:
    if campaign_id:
        campaign_items = db.query(MagicItem).filter(
            MagicItem.owner_type == OwnerType.campaign,
            MagicItem.owner_id == campaign_id
        ).all()
        overridden = {m.name for m in campaign_items}
        system_q = db.query(MagicItem).filter(MagicItem.owner_type == OwnerType.system)
        if overridden:
            system_q = system_q.filter(MagicItem.name.notin_(overridden))
        return sorted(campaign_items + system_q.all(), key=lambda m: (m.rarity, m.name))
    return db.query(MagicItem).filter(
        MagicItem.owner_type == OwnerType.system
    ).order_by(MagicItem.rarity, MagicItem.name).all()


def get_magic_item_by_id(db: Session, magic_item_id: int) -> MagicItem:
    db_item = db.query(MagicItem).filter(MagicItem.id == magic_item_id).first()
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Magic item {magic_item_id} not found")
    return db_item


def update_magic_item(db: Session, magic_item_id: int, magic_item_data: MagicItemUpdate) -> MagicItem:
    db_item = get_magic_item_by_id(db, magic_item_id)
    update_data = magic_item_data.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != db_item.name:
        existing = db.query(MagicItem).filter(
            MagicItem.name == update_data["name"],
            MagicItem.owner_type == db_item.owner_type,
            MagicItem.owner_id == db_item.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Magic item '{update_data['name']}' already exists in this scope")
    for field, value in update_data.items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_magic_item(db: Session, magic_item_id: int) -> dict:
    db_item = get_magic_item_by_id(db, magic_item_id)
    db.delete(db_item)
    db.commit()
    return {"message": f"Magic item '{db_item.name}' deleted successfully"}
