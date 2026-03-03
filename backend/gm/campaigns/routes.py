from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from gm.campaigns.schemas import (
    CampaignCreate, CampaignUpdate, CampaignResponse, 
    CampaignListItem, AddPlayerRequest, RemovePlayerRequest
)
from gm.campaigns.service import (
    create_campaign, get_campaigns_for_user, get_campaign_by_id,
    update_campaign, delete_campaign, add_player_to_campaign,
    remove_player_from_campaign
)
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/api/gm/campaigns", tags=["Campaigns"])

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_new_campaign(
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new campaign (admin only)"""
    if not current_user.is_admin:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create campaigns"
        )
    
    campaign = create_campaign(campaign_data, current_user.id, db)
    return campaign

@router.get("", response_model=List[CampaignListItem])
def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List campaigns (admin sees all, players see only their campaigns)"""
    campaigns = get_campaigns_for_user(current_user.id, current_user.is_admin, db)
    return campaigns

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific campaign"""
    campaign = get_campaign_by_id(campaign_id, current_user.id, current_user.is_admin, db)
    return campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign_endpoint(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a campaign (admin only)"""
    campaign = update_campaign(campaign_id, campaign_data, current_user.id, current_user.is_admin, db)
    return campaign

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign_endpoint(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a campaign (admin only)"""
    delete_campaign(campaign_id, current_user.id, current_user.is_admin, db)

@router.post("/{campaign_id}/players", status_code=status.HTTP_201_CREATED)
def add_player(
    campaign_id: int,
    player_data: AddPlayerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a player to a campaign (admin only)"""
    add_player_to_campaign(campaign_id, player_data.user_id, current_user.id, current_user.is_admin, db)
    return {"message": "Player added successfully"}

@router.delete("/{campaign_id}/players/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_player(
    campaign_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a player from a campaign (admin only)"""
    remove_player_from_campaign(campaign_id, user_id, current_user.id, current_user.is_admin, db)