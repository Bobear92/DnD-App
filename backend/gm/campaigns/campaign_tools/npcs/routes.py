from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import NPCCreate, NPCUpdate, NPCResponse
from . import service


router = APIRouter(
    prefix="/api/gm/campaigns/npcs",
    tags=["GM Campaign Tools - NPCs"]
)


@router.post(
    "",
    response_model=NPCResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new NPC"
)
def create_npc(
    npc_data: NPCCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new NPC in a campaign.
    Only the GM of the campaign can create NPCs.
    """
    return service.create_npc(db, npc_data, current_user.id)


@router.get(
    "/campaign/{campaign_id}",
    response_model=List[NPCResponse],
    summary="Get all NPCs in a campaign"
)
def get_npcs_by_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all NPCs in a campaign.
    GM sees all NPCs. Players see only visible NPCs.
    """
    return service.get_npcs_by_campaign(db, campaign_id, current_user.id)


@router.get(
    "/{npc_id}",
    response_model=NPCResponse,
    summary="Get specific NPC"
)
def get_npc(
    npc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific NPC by ID.
    GM can see all NPCs. Players can only see visible NPCs.
    """
    return service.get_npc_by_id(db, npc_id, current_user.id)


@router.put(
    "/{npc_id}",
    response_model=NPCResponse,
    summary="Update NPC"
)
def update_npc(
    npc_id: int,
    npc_data: NPCUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an NPC.
    Only the GM of the campaign can update NPCs.
    """
    return service.update_npc(db, npc_id, npc_data, current_user.id)


@router.delete(
    "/{npc_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete NPC"
)
def delete_npc(
    npc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an NPC.
    Only the GM of the campaign can delete NPCs.
    """
    return service.delete_npc(db, npc_id, current_user.id)


@router.patch(
    "/{npc_id}/visibility",
    response_model=NPCResponse,
    summary="Toggle NPC visibility"
)
def toggle_npc_visibility(
    npc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle NPC visibility to players.
    Only the GM of the campaign can toggle visibility.
    """
    return service.toggle_npc_visibility(db, npc_id, current_user.id)