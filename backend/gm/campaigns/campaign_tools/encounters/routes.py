from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import (
    EncounterCreate, EncounterUpdate, EncounterResponse, EncounterListItem,
    CombatantAdd, CombatantUpdate, CombatantResponse,
)
from . import service

router = APIRouter(
    prefix="/api/gm/campaigns/{campaign_id}/encounters",
    tags=["GM Campaign Tools - Encounters"],
)


# ── Encounters ────────────────────────────────────────────────────────────────

@router.post("", response_model=EncounterResponse, status_code=status.HTTP_201_CREATED)
def create_encounter(
    campaign_id: int,
    data: EncounterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_encounter(db, campaign_id, data, current_user.id)


@router.get("", response_model=List[EncounterListItem])
def list_encounters(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_encounters(db, campaign_id, current_user.id)


@router.get("/{encounter_id}", response_model=EncounterResponse)
def get_encounter(
    campaign_id: int,
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_encounter(db, campaign_id, encounter_id, current_user.id)


@router.put("/{encounter_id}", response_model=EncounterResponse)
def update_encounter(
    campaign_id: int,
    encounter_id: int,
    data: EncounterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_encounter(db, campaign_id, encounter_id, data, current_user.id)


@router.delete("/{encounter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_encounter(
    campaign_id: int,
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.delete_encounter(db, campaign_id, encounter_id, current_user.id)


# ── Combatants ────────────────────────────────────────────────────────────────

@router.post("/{encounter_id}/combatants", response_model=CombatantResponse, status_code=status.HTTP_201_CREATED)
def add_combatant(
    campaign_id: int,
    encounter_id: int,
    data: CombatantAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.add_combatant(db, campaign_id, encounter_id, data, current_user.id)


@router.put("/{encounter_id}/combatants/{combatant_id}", response_model=EncounterResponse)
def update_combatant(
    campaign_id: int,
    encounter_id: int,
    combatant_id: int,
    data: CombatantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set or clear one combatant's initiative; returns the re-sorted encounter."""
    return service.update_combatant(db, campaign_id, encounter_id, combatant_id, data, current_user.id)


@router.delete("/{encounter_id}/combatants/{combatant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_combatant(
    campaign_id: int,
    encounter_id: int,
    combatant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service.remove_combatant(db, campaign_id, encounter_id, combatant_id, current_user.id)
