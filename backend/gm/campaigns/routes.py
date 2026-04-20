from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from gm.campaigns.schemas import (
    CampaignCreate, CampaignUpdate, CampaignResponse,
    CampaignListItem, AddPlayerRequest
)
from gm.campaigns.service import (
    create_campaign, get_campaigns_for_user, get_campaign_by_id,
    update_campaign, delete_campaign, add_player_to_campaign,
    remove_player_from_campaign
)
from shared.database import get_db
from shared.dependencies import get_current_user, require_campaign_gm
from auth.models import User

router = APIRouter(prefix="/api/gm/campaigns", tags=["Campaigns"])

@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_new_campaign(
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new campaign — any authenticated user becomes the GM"""
    return create_campaign(campaign_data, current_user.id, db)

@router.get("", response_model=List[CampaignListItem])
def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List campaigns the current user is a member of"""
    return get_campaigns_for_user(current_user.id, db)

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific campaign (members only)"""
    return get_campaign_by_id(campaign_id, current_user.id, db)

@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign_endpoint(
    campaign_id: int,
    campaign_data: CampaignUpdate,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Update a campaign (GM only)"""
    return update_campaign(campaign_id, campaign_data, db)

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign_endpoint(
    campaign_id: int,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Delete a campaign (GM only)"""
    delete_campaign(campaign_id, db)

@router.post("/{campaign_id}/players", status_code=status.HTTP_201_CREATED)
def add_player(
    campaign_id: int,
    player_data: AddPlayerRequest,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Add a player to a campaign (GM only)"""
    add_player_to_campaign(campaign_id, player_data.user_id, db)
    return {"message": "Player added successfully"}

@router.delete("/{campaign_id}/players/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_player(
    campaign_id: int,
    user_id: int,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Remove a player from a campaign (GM only)"""
    remove_player_from_campaign(campaign_id, user_id, db)
