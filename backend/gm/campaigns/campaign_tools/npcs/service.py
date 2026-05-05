from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, UploadFile, status
from typing import List

from .models import NPC, NPCRelationship, NPCPlayerRelationship
from .schemas import (
    NPCCreate, NPCUpdate,
    NPCRelationshipCreate, NPCRelationshipResponse,
    NPCPlayerRelationshipCreate, NPCPlayerRelationshipResponse,
)
from .storage import save_npc_image, delete_npc_image
from gm.campaigns.models import CampaignMember
from auth.models import User


# ── Helpers ────────────────────────────────────────────────────────────────────

def _require_member(db: Session, campaign_id: int, user_id: int) -> CampaignMember:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="You must be a member of this campaign")
    return member


def _require_gm(db: Session, campaign_id: int, user_id: int) -> None:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
        CampaignMember.role == 'gm',
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only the GM of this campaign can perform this action")


def _get_npc_or_404(db: Session, npc_id: int) -> NPC:
    npc = db.query(NPC).filter(NPC.id == npc_id).first()
    if not npc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"NPC {npc_id} not found")
    return npc


def _strip_gm_fields(npc: NPC) -> NPC:
    """Null out GM-only fields before returning to a player."""
    npc.gm_notes = None
    return npc


def _build_relationship_response(rel: NPCRelationship, db: Session) -> NPCRelationshipResponse:
    npc_b = db.query(NPC).filter(NPC.id == rel.npc_b_id).first()
    return NPCRelationshipResponse(
        id=rel.id,
        npc_a_id=rel.npc_a_id,
        npc_b_id=rel.npc_b_id,
        npc_b_name=npc_b.name if npc_b else "Unknown",
        relationship_type=rel.relationship_type,
        description=rel.description,
        created_at=rel.created_at,
    )


def _build_player_rel_response(rel: NPCPlayerRelationship, db: Session) -> NPCPlayerRelationshipResponse:
    user = db.query(User).filter(User.id == rel.user_id).first()
    return NPCPlayerRelationshipResponse(
        id=rel.id,
        npc_id=rel.npc_id,
        user_id=rel.user_id,
        username=user.username if user else "Unknown",
        campaign_id=rel.campaign_id,
        relationship_type=rel.relationship_type,
        description=rel.description,
        created_at=rel.created_at,
    )


# ── NPC CRUD ───────────────────────────────────────────────────────────────────

def create_npc(db: Session, npc_data: NPCCreate, current_user_id: int) -> NPC:
    _require_gm(db, npc_data.campaign_id, current_user_id)

    db_npc = NPC(**npc_data.model_dump())
    db.add(db_npc)
    try:
        db.commit()
        db.refresh(db_npc)
        return db_npc
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Failed to create NPC due to database constraint")


def get_npcs_by_campaign(db: Session, campaign_id: int, current_user_id: int) -> List[NPC]:
    member = _require_member(db, campaign_id, current_user_id)
    query = db.query(NPC).filter(NPC.campaign_id == campaign_id)
    if member.role == 'player':
        query = query.filter(NPC.is_visible_to_players == True)
    npcs = query.order_by(NPC.name).all()
    if member.role == 'player':
        for npc in npcs:
            _strip_gm_fields(npc)
    return npcs


def get_npc_by_id(db: Session, npc_id: int, current_user_id: int) -> NPC:
    npc = _get_npc_or_404(db, npc_id)
    member = _require_member(db, npc.campaign_id, current_user_id)
    if member.role == 'player' and not npc.is_visible_to_players:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This NPC is not visible to players")
    if member.role == 'player':
        _strip_gm_fields(npc)
    return npc


def update_npc(db: Session, npc_id: int, npc_data: NPCUpdate, current_user_id: int) -> NPC:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)

    for field, value in npc_data.model_dump(exclude_unset=True).items():
        setattr(npc, field, value)

    try:
        db.commit()
        db.refresh(npc)
        return npc
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Failed to update NPC due to database constraint")


def delete_npc(db: Session, npc_id: int, current_user_id: int) -> dict:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)

    if npc.image_path:
        delete_npc_image(npc.image_path)

    name = npc.name
    db.delete(npc)
    db.commit()
    return {"message": f"NPC '{name}' deleted successfully"}


def toggle_npc_visibility(db: Session, npc_id: int, current_user_id: int) -> NPC:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)
    npc.is_visible_to_players = not npc.is_visible_to_players
    db.commit()
    db.refresh(npc)
    return npc


# ── Image upload ───────────────────────────────────────────────────────────────

async def upload_npc_image(db: Session, npc_id: int, file: UploadFile, current_user_id: int) -> NPC:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)

    if npc.image_path:
        delete_npc_image(npc.image_path)

    npc.image_path = await save_npc_image(file, npc.campaign_id, npc_id)
    db.commit()
    db.refresh(npc)
    return npc


def delete_npc_image_endpoint(db: Session, npc_id: int, current_user_id: int) -> NPC:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)

    if npc.image_path:
        delete_npc_image(npc.image_path)
        npc.image_path = None
        db.commit()
        db.refresh(npc)

    return npc


# ── NPC Relationships ──────────────────────────────────────────────────────────

def get_npc_relationships(db: Session, npc_id: int, current_user_id: int) -> List[NPCRelationshipResponse]:
    npc = _get_npc_or_404(db, npc_id)
    _require_member(db, npc.campaign_id, current_user_id)
    rels = db.query(NPCRelationship).filter(NPCRelationship.npc_a_id == npc_id).all()
    return [_build_relationship_response(r, db) for r in rels]


def add_npc_relationship(db: Session, npc_id: int, data: NPCRelationshipCreate,
                         current_user_id: int) -> NPCRelationshipResponse:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)

    npc_b = _get_npc_or_404(db, data.npc_b_id)
    if npc_b.campaign_id != npc.campaign_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Both NPCs must belong to the same campaign")
    if data.npc_b_id == npc_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="An NPC cannot have a relationship with itself")

    rel = NPCRelationship(npc_a_id=npc_id, npc_b_id=data.npc_b_id,
                          relationship_type=data.relationship_type, description=data.description)
    db.add(rel)
    try:
        db.commit()
        db.refresh(rel)
        return _build_relationship_response(rel, db)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="This relationship already exists")


def delete_npc_relationship(db: Session, npc_id: int, rel_id: int, current_user_id: int) -> dict:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)
    rel = db.query(NPCRelationship).filter(
        NPCRelationship.id == rel_id,
        NPCRelationship.npc_a_id == npc_id,
    ).first()
    if not rel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Relationship {rel_id} not found")
    db.delete(rel)
    db.commit()
    return {"message": "Relationship deleted"}


# ── NPC–Player Relationships ───────────────────────────────────────────────────

def get_npc_player_relationships(db: Session, npc_id: int,
                                  current_user_id: int) -> List[NPCPlayerRelationshipResponse]:
    npc = _get_npc_or_404(db, npc_id)
    _require_member(db, npc.campaign_id, current_user_id)
    rels = db.query(NPCPlayerRelationship).filter(NPCPlayerRelationship.npc_id == npc_id).all()
    return [_build_player_rel_response(r, db) for r in rels]


def add_npc_player_relationship(db: Session, npc_id: int, data: NPCPlayerRelationshipCreate,
                                 current_user_id: int) -> NPCPlayerRelationshipResponse:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)

    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == npc.campaign_id,
        CampaignMember.user_id == data.user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="That user is not a member of this campaign")

    rel = NPCPlayerRelationship(
        npc_id=npc_id,
        user_id=data.user_id,
        campaign_id=npc.campaign_id,
        relationship_type=data.relationship_type,
        description=data.description,
    )
    db.add(rel)
    try:
        db.commit()
        db.refresh(rel)
        return _build_player_rel_response(rel, db)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="A relationship between this NPC and player already exists")


def delete_npc_player_relationship(db: Session, npc_id: int, rel_id: int,
                                    current_user_id: int) -> dict:
    npc = _get_npc_or_404(db, npc_id)
    _require_gm(db, npc.campaign_id, current_user_id)
    rel = db.query(NPCPlayerRelationship).filter(
        NPCPlayerRelationship.id == rel_id,
        NPCPlayerRelationship.npc_id == npc_id,
    ).first()
    if not rel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Player relationship {rel_id} not found")
    db.delete(rel)
    db.commit()
    return {"message": "Player relationship deleted"}
