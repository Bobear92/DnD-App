from sqlalchemy.orm import Session
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from gm.campaigns.models import Campaign, CampaignMember
from gm.campaigns.schemas import CampaignCreate, CampaignUpdate
from auth.models import User

def create_campaign(campaign_data: CampaignCreate, creator_id: int, db: Session) -> Campaign:
    """Create a new campaign (admin only, becomes GM automatically)"""
    # Create campaign
    new_campaign = Campaign(
        name=campaign_data.name,
        description=campaign_data.description,
        created_by=creator_id
    )
    
    db.add(new_campaign)
    db.flush()  # Get the campaign ID
    
    # Add creator as GM
    gm_member = CampaignMember(
        campaign_id=new_campaign.id,
        user_id=creator_id,
        role='gm'
    )
    
    db.add(gm_member)
    db.commit()
    db.refresh(new_campaign)
    
    return new_campaign

def get_campaigns_for_user(user_id: int, is_admin: bool, db: Session) -> list[Campaign]:
    """Get campaigns based on user permissions"""
    if is_admin:
        # Admin sees all campaigns
        return db.query(Campaign).all()
    else:
        # Players only see campaigns they're members of
        member_records = db.query(CampaignMember).filter(
            CampaignMember.user_id == user_id
        ).all()
        
        campaign_ids = [member.campaign_id for member in member_records]
        return db.query(Campaign).filter(Campaign.id.in_(campaign_ids)).all()

def get_campaign_by_id(campaign_id: int, user_id: int, is_admin: bool, db: Session) -> Campaign:
    """Get a specific campaign if user has access"""
    from sqlalchemy.orm import joinedload
    
    campaign = db.query(Campaign).options(
        joinedload(Campaign.members).joinedload(CampaignMember.user)
    ).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check access
    if not is_admin:
        # Players can only see campaigns they're members of
        is_member = db.query(CampaignMember).filter(
            CampaignMember.campaign_id == campaign_id,
            CampaignMember.user_id == user_id
        ).first()
        
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this campaign"
            )
    
    return campaign

def update_campaign(campaign_id: int, campaign_data: CampaignUpdate, user_id: int, is_admin: bool, db: Session) -> Campaign:
    """Update a campaign (admin only)"""
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update campaigns"
        )
    
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Update fields
    if campaign_data.name is not None:
        campaign.name = campaign_data.name
    if campaign_data.description is not None:
        campaign.description = campaign_data.description
    
    db.commit()
    db.refresh(campaign)
    
    return campaign

def delete_campaign(campaign_id: int, user_id: int, is_admin: bool, db: Session):
    """Delete a campaign (admin only)"""
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete campaigns"
        )
    
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Delete campaign members first (foreign key constraint)
    db.query(CampaignMember).filter(CampaignMember.campaign_id == campaign_id).delete()
    
    # Delete campaign
    db.delete(campaign)
    db.commit()

def add_player_to_campaign(campaign_id: int, player_user_id: int, admin_user_id: int, is_admin: bool, db: Session):
    """Add a player to a campaign (admin only)"""
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add players to campaigns"
        )
    
    # Check campaign exists
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check user exists
    user = db.query(User).filter(User.id == player_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a member
    existing_member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == player_user_id
    ).first()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this campaign"
        )
    
    # Add as player
    new_member = CampaignMember(
        campaign_id=campaign_id,
        user_id=player_user_id,
        role='player'
    )
    
    db.add(new_member)
    db.commit()

def remove_player_from_campaign(campaign_id: int, player_user_id: int, admin_user_id: int, is_admin: bool, db: Session):
    """Remove a player from a campaign (admin only)"""
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can remove players from campaigns"
        )
    
    # Find the membership
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == player_user_id,
        CampaignMember.role == 'player'  # Can't remove the GM
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found in this campaign"
        )
    
    db.delete(member)
    db.commit()