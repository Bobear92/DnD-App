from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from gm.campaigns.models import Campaign, CampaignMember
from gm.campaigns.schemas import CampaignCreate, CampaignUpdate
from auth.models import User

def create_campaign(campaign_data: CampaignCreate, creator_id: int, db: Session) -> Campaign:
    new_campaign = Campaign(
        name=campaign_data.name,
        description=campaign_data.description,
        edition=campaign_data.edition,
        created_by=creator_id
    )
    db.add(new_campaign)
    db.flush()

    gm_member = CampaignMember(
        campaign_id=new_campaign.id,
        user_id=creator_id,
        role='gm'
    )
    db.add(gm_member)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign

def get_campaigns_for_user(user_id: int, db: Session) -> list[Campaign]:
    member_records = db.query(CampaignMember).filter(
        CampaignMember.user_id == user_id
    ).all()
    campaign_ids = [m.campaign_id for m in member_records]
    return db.query(Campaign).filter(Campaign.id.in_(campaign_ids)).all()

def get_campaign_by_id(campaign_id: int, user_id: int, db: Session) -> Campaign:
    campaign = db.query(Campaign).options(
        joinedload(Campaign.members).joinedload(CampaignMember.user)
    ).filter(Campaign.id == campaign_id).first()

    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    is_member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id
    ).first()

    if not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this campaign")

    return campaign

def update_campaign(campaign_id: int, campaign_data: CampaignUpdate, db: Session) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    if campaign_data.name is not None:
        campaign.name = campaign_data.name
    if campaign_data.description is not None:
        campaign.description = campaign_data.description
    if campaign_data.edition is not None:
        campaign.edition = campaign_data.edition
    if campaign_data.use_alignment is not None:
        campaign.use_alignment = campaign_data.use_alignment
    if campaign_data.ability_score_method is not None:
        campaign.ability_score_method = campaign_data.ability_score_method
    if campaign_data.allow_reroll_ones is not None:
        campaign.allow_reroll_ones = campaign_data.allow_reroll_ones
    if campaign_data.leveling_type is not None:
        campaign.leveling_type = campaign_data.leveling_type
    if campaign_data.currency_type is not None:
        campaign.currency_type = campaign_data.currency_type

    db.commit()
    db.refresh(campaign)
    return campaign

def delete_campaign(campaign_id: int, db: Session):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    db.query(CampaignMember).filter(CampaignMember.campaign_id == campaign_id).delete()
    db.delete(campaign)
    db.commit()

def add_player_to_campaign(campaign_id: int, player_user_id: int, db: Session):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    user = db.query(User).filter(User.id == player_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == player_user_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this campaign")

    db.add(CampaignMember(campaign_id=campaign_id, user_id=player_user_id, role='player'))
    db.commit()

def remove_player_from_campaign(campaign_id: int, player_user_id: int, db: Session):
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == player_user_id,
        CampaignMember.role == 'player'
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found in this campaign")

    db.delete(member)
    db.commit()
