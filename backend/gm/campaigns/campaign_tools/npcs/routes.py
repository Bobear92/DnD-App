from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import (
    NPCCreate, NPCUpdate, NPCResponse,
    NPCRelationshipCreate, NPCRelationshipResponse,
    NPCPlayerRelationshipCreate, NPCPlayerRelationshipResponse,
)
from . import service


router = APIRouter(
    prefix="/api/gm/campaigns/npcs",
    tags=["GM Campaign Tools - NPCs"]
)


# ── NPC CRUD ───────────────────────────────────────────────────────────────────

@router.post("", response_model=NPCResponse, status_code=status.HTTP_201_CREATED,
             summary="Create new NPC")
def create_npc(npc_data: NPCCreate, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    return service.create_npc(db, npc_data, current_user.id)


@router.get("/campaign/{campaign_id}", response_model=List[NPCResponse],
            summary="List all NPCs in a campaign")
def get_npcs_by_campaign(campaign_id: int, db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    return service.get_npcs_by_campaign(db, campaign_id, current_user.id)


@router.get("/{npc_id}", response_model=NPCResponse, summary="Get a specific NPC")
def get_npc(npc_id: int, db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)):
    return service.get_npc_by_id(db, npc_id, current_user.id)


@router.put("/{npc_id}", response_model=NPCResponse, summary="Update NPC")
def update_npc(npc_id: int, npc_data: NPCUpdate, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    return service.update_npc(db, npc_id, npc_data, current_user.id)


@router.delete("/{npc_id}", status_code=status.HTTP_200_OK, summary="Delete NPC")
def delete_npc(npc_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    return service.delete_npc(db, npc_id, current_user.id)


@router.patch("/{npc_id}/visibility", response_model=NPCResponse,
              summary="Toggle NPC visibility to players")
def toggle_npc_visibility(npc_id: int, db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    return service.toggle_npc_visibility(db, npc_id, current_user.id)


# ── Image ──────────────────────────────────────────────────────────────────────

@router.post("/{npc_id}/image", response_model=NPCResponse,
             summary="Upload NPC portrait image (GM only)")
async def upload_npc_image(npc_id: int, file: UploadFile = File(...),
                            db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    return await service.upload_npc_image(db, npc_id, file, current_user.id)


@router.delete("/{npc_id}/image", response_model=NPCResponse,
               summary="Delete NPC portrait image (GM only)")
def delete_npc_image(npc_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    return service.delete_npc_image_endpoint(db, npc_id, current_user.id)


# ── Theme music ──────────────────────────────────────────────────────────────

@router.post("/{npc_id}/music", response_model=NPCResponse,
             summary="Upload NPC theme music (GM only)")
async def upload_npc_music(npc_id: int, file: UploadFile = File(...),
                           db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    return await service.upload_npc_music(db, npc_id, file, current_user.id)


@router.delete("/{npc_id}/music", response_model=NPCResponse,
               summary="Delete NPC theme music (GM only)")
def delete_npc_music(npc_id: int, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    return service.delete_npc_music_endpoint(db, npc_id, current_user.id)


# ── NPC Relationships ──────────────────────────────────────────────────────────

@router.get("/{npc_id}/relationships", response_model=List[NPCRelationshipResponse],
            summary="List NPC-to-NPC relationships")
def get_npc_relationships(npc_id: int, db: Session = Depends(get_db),
                           current_user: User = Depends(get_current_user)):
    return service.get_npc_relationships(db, npc_id, current_user.id)


@router.post("/{npc_id}/relationships", response_model=NPCRelationshipResponse,
             status_code=status.HTTP_201_CREATED, summary="Add NPC-to-NPC relationship (GM only)")
def add_npc_relationship(npc_id: int, data: NPCRelationshipCreate,
                          db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    return service.add_npc_relationship(db, npc_id, data, current_user.id)


@router.delete("/{npc_id}/relationships/{rel_id}", status_code=status.HTTP_200_OK,
               summary="Delete NPC-to-NPC relationship (GM only)")
def delete_npc_relationship(npc_id: int, rel_id: int, db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    return service.delete_npc_relationship(db, npc_id, rel_id, current_user.id)


# ── NPC–Player Relationships ───────────────────────────────────────────────────

@router.get("/{npc_id}/player-relationships", response_model=List[NPCPlayerRelationshipResponse],
            summary="List NPC-to-player relationships")
def get_npc_player_relationships(npc_id: int, db: Session = Depends(get_db),
                                  current_user: User = Depends(get_current_user)):
    return service.get_npc_player_relationships(db, npc_id, current_user.id)


@router.post("/{npc_id}/player-relationships", response_model=NPCPlayerRelationshipResponse,
             status_code=status.HTTP_201_CREATED, summary="Add NPC-to-player relationship (GM only)")
def add_npc_player_relationship(npc_id: int, data: NPCPlayerRelationshipCreate,
                                 db: Session = Depends(get_db),
                                 current_user: User = Depends(get_current_user)):
    return service.add_npc_player_relationship(db, npc_id, data, current_user.id)


@router.delete("/{npc_id}/player-relationships/{rel_id}", status_code=status.HTTP_200_OK,
               summary="Delete NPC-to-player relationship (GM only)")
def delete_npc_player_relationship(npc_id: int, rel_id: int, db: Session = Depends(get_db),
                                    current_user: User = Depends(get_current_user)):
    return service.delete_npc_player_relationship(db, npc_id, rel_id, current_user.id)
