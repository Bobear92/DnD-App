from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List

from .models import NPC
from .schemas import NPCCreate, NPCUpdate
from gm.campaigns.models import CampaignMember


def create_npc(db: Session, npc_data: NPCCreate, current_user_id: int) -> NPC:
    """
    Create a new NPC.
    Only the GM of the campaign can create NPCs.
    """
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == npc_data.campaign_id,
        CampaignMember.user_id == current_user_id,
        CampaignMember.role == 'gm'
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be the GM of this campaign to create NPCs"
        )
    
    db_npc = NPC(**npc_data.model_dump())
    db.add(db_npc)
    
    try:
        db.commit()
        db.refresh(db_npc)
        return db_npc
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create NPC due to database constraint"
        )


def get_npcs_by_campaign(db: Session, campaign_id: int, current_user_id: int) -> List[NPC]:
    """
    Get all NPCs in a campaign.
    GM sees all NPCs. Players see only visible NPCs.
    """
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == current_user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this campaign to view NPCs"
        )
    
    query = db.query(NPC).filter(NPC.campaign_id == campaign_id)
    
    if membership.role == 'player':
        query = query.filter(NPC.is_visible_to_players == True)
    
    return query.order_by(NPC.name).all()


def get_npc_by_id(db: Session, npc_id: int, current_user_id: int) -> NPC:
    """
    Get a specific NPC by ID.
    GM can see all NPCs. Players can only see visible NPCs.
    """
    db_npc = db.query(NPC).filter(NPC.id == npc_id).first()
    if not db_npc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NPC with id {npc_id} not found"
        )
    
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == db_npc.campaign_id,
        CampaignMember.user_id == current_user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this NPC"
        )
    
    if membership.role == 'player' and not db_npc.is_visible_to_players:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This NPC is not visible to players"
        )
    
    return db_npc


def update_npc(db: Session, npc_id: int, npc_data: NPCUpdate, current_user_id: int) -> NPC:
    """
    Update an NPC.
    Only the GM of the campaign can update NPCs.
    """
    db_npc = db.query(NPC).filter(NPC.id == npc_id).first()
    if not db_npc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NPC with id {npc_id} not found"
        )
    
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == db_npc.campaign_id,
        CampaignMember.user_id == current_user_id,
        CampaignMember.role == 'gm'
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the GM of this campaign can update NPCs"
        )
    
    update_data = npc_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_npc, field, value)
    
    try:
        db.commit()
        db.refresh(db_npc)
        return db_npc
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update NPC due to database constraint"
        )


def delete_npc(db: Session, npc_id: int, current_user_id: int) -> dict:
    """
    Delete an NPC.
    Only the GM of the campaign can delete NPCs.
    """
    db_npc = db.query(NPC).filter(NPC.id == npc_id).first()
    if not db_npc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NPC with id {npc_id} not found"
        )
    
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == db_npc.campaign_id,
        CampaignMember.user_id == current_user_id,
        CampaignMember.role == 'gm'
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the GM of this campaign can delete NPCs"
        )
    
    db.delete(db_npc)
    db.commit()
    
    return {"message": f"NPC '{db_npc.name}' deleted successfully"}


def toggle_npc_visibility(db: Session, npc_id: int, current_user_id: int) -> NPC:
    """
    Toggle NPC visibility to players.
    Only the GM of the campaign can toggle visibility.
    """
    db_npc = db.query(NPC).filter(NPC.id == npc_id).first()
    if not db_npc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"NPC with id {npc_id} not found"
        )
    
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == db_npc.campaign_id,
        CampaignMember.user_id == current_user_id,
        CampaignMember.role == 'gm'
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the GM of this campaign can toggle NPC visibility"
        )
    
    db_npc.is_visible_to_players = not db_npc.is_visible_to_players
    
    db.commit()
    db.refresh(db_npc)
    
    return db_npc