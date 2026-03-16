from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import LootTable
from .schemas import LootTableCreate, LootTableUpdate
from gm.campaigns.models import CampaignMember


def create_loot_table(db: Session, loot_table_data: LootTableCreate, current_user_id: int, is_admin: bool) -> LootTable:
    """
    Create a new loot table.
    Admin can create system tables (owner_type='system').
    GM can create campaign tables (owner_type='campaign') for their own campaigns.
    """
    if loot_table_data.owner_type == 'system':
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can create system loot tables"
            )
        if loot_table_data.owner_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System loot tables must have owner_id=NULL"
            )
    
    elif loot_table_data.owner_type == 'campaign':
        if loot_table_data.owner_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campaign loot tables must have an owner_id (campaign_id)"
            )
        
        membership = db.query(CampaignMember).filter(
            CampaignMember.campaign_id == loot_table_data.owner_id,
            CampaignMember.user_id == current_user_id,
            CampaignMember.role == 'gm'
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be the GM of this campaign to create loot tables for it"
            )
    
    db_loot_table = LootTable(**loot_table_data.model_dump())
    db.add(db_loot_table)
    
    try:
        db.commit()
        db.refresh(db_loot_table)
        return db_loot_table
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create loot table due to database constraint"
        )


def get_all_loot_tables(db: Session, current_user_id: int, is_admin: bool) -> List[LootTable]:
    """
    Get loot tables accessible to the user.
    Returns: system tables + campaign tables for campaigns the user is a member of.
    """
    user_campaign_ids = db.query(CampaignMember.campaign_id).filter(
        CampaignMember.user_id == current_user_id
    ).all()
    user_campaign_ids = [c[0] for c in user_campaign_ids]
    
    query = db.query(LootTable).filter(
        (LootTable.owner_type == 'system') |
        (LootTable.owner_id.in_(user_campaign_ids))
    )
    
    return query.order_by(LootTable.owner_type, LootTable.name).all()


def get_loot_table_by_id(db: Session, loot_table_id: int, current_user_id: int, is_admin: bool) -> LootTable:
    """
    Get a specific loot table by ID.
    User must have permission to view it.
    """
    db_loot_table = db.query(LootTable).filter(LootTable.id == loot_table_id).first()
    if not db_loot_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Loot table with id {loot_table_id} not found"
        )
    
    if db_loot_table.owner_type == 'system':
        return db_loot_table
    
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == db_loot_table.owner_id,
        CampaignMember.user_id == current_user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this loot table"
        )
    
    return db_loot_table


def update_loot_table(db: Session, loot_table_id: int, loot_table_data: LootTableUpdate, current_user_id: int, is_admin: bool) -> LootTable:
    """
    Update a loot table.
    Admin can update system tables.
    GM can update their own campaign tables.
    """
    db_loot_table = get_loot_table_by_id(db, loot_table_id, current_user_id, is_admin)
    
    if db_loot_table.owner_type == 'system':
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can update system loot tables"
            )
    else:
        membership = db.query(CampaignMember).filter(
            CampaignMember.campaign_id == db_loot_table.owner_id,
            CampaignMember.user_id == current_user_id,
            CampaignMember.role == 'gm'
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the GM of this campaign can update this loot table"
            )
    
    update_data = loot_table_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_loot_table, field, value)
    
    try:
        db.commit()
        db.refresh(db_loot_table)
        return db_loot_table
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update loot table due to database constraint"
        )


def delete_loot_table(db: Session, loot_table_id: int, current_user_id: int, is_admin: bool) -> dict:
    """
    Delete a loot table.
    Admin can delete system tables.
    GM can delete their own campaign tables.
    """
    db_loot_table = get_loot_table_by_id(db, loot_table_id, current_user_id, is_admin)
    
    if db_loot_table.owner_type == 'system':
        if not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can delete system loot tables"
            )
    else:
        membership = db.query(CampaignMember).filter(
            CampaignMember.campaign_id == db_loot_table.owner_id,
            CampaignMember.user_id == current_user_id,
            CampaignMember.role == 'gm'
        ).first()
        
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the GM of this campaign can delete this loot table"
            )
    
    db.delete(db_loot_table)
    db.commit()
    
    return {"message": f"Loot table '{db_loot_table.name}' deleted successfully"}