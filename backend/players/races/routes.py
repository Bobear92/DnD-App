from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from . import service, schemas
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/races", tags=["Races"])

@router.get("", response_model=List[schemas.RaceListItem])
def get_races(
    campaign_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all races.
    - System races are always available
    - Campaign races included if campaign_id provided
    """
    races = service.get_all_races(db, current_user.id, campaign_id)
    return races

@router.get("/{race_id}", response_model=schemas.RaceResponse)
def get_race(
    race_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific race by ID."""
    race = service.get_race_by_id(db, race_id)
    return race

@router.post("", response_model=schemas.RaceResponse, status_code=status.HTTP_201_CREATED)
def create_race(
    race_data: schemas.RaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new race (admin only).
    """
    race = service.create_race(db, race_data, current_user.id, current_user.is_admin)
    return race

@router.put("/{race_id}", response_model=schemas.RaceResponse)
def update_race(
    race_id: int,
    race_data: schemas.RaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a race (admin only).
    """
    race = service.update_race(db, race_id, race_data, current_user.id, current_user.is_admin)
    return race

@router.delete("/{race_id}")
def delete_race(
    race_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a race (admin only).
    """
    result = service.delete_race(db, race_id, current_user.id, current_user.is_admin)
    return result