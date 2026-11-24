from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from gm.campaigns.models import Campaign, CampaignMember, CampaignInvite
from gm.campaigns.schemas import CampaignCreate, CampaignUpdate
from auth.models import User

def create_campaign(campaign_data: CampaignCreate, creator_id: int, db: Session) -> Campaign:
    new_campaign = Campaign(
        name=campaign_data.name,
        description=campaign_data.description,
        edition=campaign_data.edition,
        campaign_mode=campaign_data.campaign_mode,
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
    if campaign_data.starting_equipment is not None:
        campaign.starting_equipment = campaign_data.starting_equipment
    if campaign_data.asi_feat_mode is not None:
        campaign.asi_feat_mode = campaign_data.asi_feat_mode
    if campaign_data.campaign_mode is not None:
        campaign.campaign_mode = campaign_data.campaign_mode

    db.commit()
    db.refresh(campaign)
    return campaign

def delete_campaign(campaign_id: int, db: Session):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    db.query(CampaignMember).filter(CampaignMember.campaign_id == campaign_id).delete()
    db.query(CampaignInvite).filter(CampaignInvite.campaign_id == campaign_id).delete()
    db.delete(campaign)
    db.commit()

# ── Invites (consent step: a GM invites, the player accepts) ─────────────────

def _get_invite_or_404(db: Session, invite_id: int) -> CampaignInvite:
    invite = db.query(CampaignInvite).filter(CampaignInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    return invite


def invite_player(campaign_id: int, player_user_id: int, gm_user_id: int, db: Session) -> CampaignInvite:
    if not db.query(Campaign).filter(Campaign.id == campaign_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    if not db.query(User).filter(User.id == player_user_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id, CampaignMember.user_id == player_user_id
    ).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this campaign")
    if db.query(CampaignInvite).filter(
        CampaignInvite.campaign_id == campaign_id, CampaignInvite.user_id == player_user_id
    ).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User has already been invited")
    invite = CampaignInvite(campaign_id=campaign_id, user_id=player_user_id, invited_by=gm_user_id)
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def get_campaign_invites(campaign_id: int, db: Session) -> list[CampaignInvite]:
    return (
        db.query(CampaignInvite)
        .filter(CampaignInvite.campaign_id == campaign_id)
        .order_by(CampaignInvite.created_at)
        .all()
    )


def cancel_invite(campaign_id: int, invite_id: int, db: Session) -> None:
    invite = _get_invite_or_404(db, invite_id)
    if invite.campaign_id != campaign_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    db.delete(invite)
    db.commit()


def get_my_invites(user_id: int, db: Session) -> list[CampaignInvite]:
    return (
        db.query(CampaignInvite)
        .filter(CampaignInvite.user_id == user_id)
        .order_by(CampaignInvite.created_at)
        .all()
    )


def _get_own_invite(db: Session, invite_id: int, user_id: int) -> CampaignInvite:
    invite = _get_invite_or_404(db, invite_id)
    if invite.user_id != user_id:
        # 404, not 403: another user's invite ids reveal nothing.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    return invite


def accept_invite(invite_id: int, user_id: int, db: Session) -> Campaign:
    invite = _get_own_invite(db, invite_id, user_id)
    campaign_id = invite.campaign_id
    already = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id, CampaignMember.user_id == user_id
    ).first()
    if not already:
        db.add(CampaignMember(campaign_id=campaign_id, user_id=user_id, role='player'))
    db.delete(invite)
    db.commit()
    return db.query(Campaign).filter(Campaign.id == campaign_id).first()


def decline_invite(invite_id: int, user_id: int, db: Session) -> None:
    invite = _get_own_invite(db, invite_id, user_id)
    db.delete(invite)
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
