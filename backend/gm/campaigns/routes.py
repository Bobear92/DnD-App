from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from gm.campaigns.schemas import (
    CampaignCreate, CampaignUpdate, CampaignResponse,
    CampaignListItem, InvitePlayerRequest, CampaignInviteResponse
)
from gm.campaigns.service import (
    create_campaign, get_campaigns_for_user, get_campaign_by_id,
    update_campaign, delete_campaign, remove_player_from_campaign,
    invite_player, get_campaign_invites, cancel_invite,
    get_my_invites, accept_invite, decline_invite,
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

# The invitee's routes are declared before /{campaign_id} so "invites" is never parsed as a campaign id.

@router.get("/invites/mine", response_model=List[CampaignInviteResponse])
def list_my_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """The current user's pending invites."""
    return get_my_invites(current_user.id, db)

@router.post("/invites/{invite_id}/accept", response_model=CampaignListItem)
def accept_invite_endpoint(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept your own invite: you join the campaign as a player. Returns the campaign."""
    return accept_invite(invite_id, current_user.id, db)

@router.post("/invites/{invite_id}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_invite_endpoint(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline your own invite."""
    decline_invite(invite_id, current_user.id, db)

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

# Players join by invite + accept (consent step, post-deploy T2). There is deliberately no direct "add player" route.

@router.post("/{campaign_id}/invites", response_model=CampaignInviteResponse, status_code=status.HTTP_201_CREATED)
def invite_player_endpoint(
    campaign_id: int,
    data: InvitePlayerRequest,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Invite a user to the campaign (GM only). They join only once they accept."""
    return invite_player(campaign_id, data.user_id, current_user.id, db)

@router.get("/{campaign_id}/invites", response_model=List[CampaignInviteResponse])
def list_campaign_invites(
    campaign_id: int,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Pending invites for this campaign (GM only)."""
    return get_campaign_invites(campaign_id, db)

@router.delete("/{campaign_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invite_endpoint(
    campaign_id: int,
    invite_id: int,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Withdraw a pending invite (GM only)."""
    cancel_invite(campaign_id, invite_id, db)

@router.delete("/{campaign_id}/players/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_player(
    campaign_id: int,
    user_id: int,
    current_user: User = Depends(require_campaign_gm),
    db: Session = Depends(get_db)
):
    """Remove a player from a campaign (GM only)"""
    remove_player_from_campaign(campaign_id, user_id, db)
