from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from . import service, schemas
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/backgrounds", tags=["Backgrounds"])

@router.get("", response_model=List[schemas.BackgroundListItem])
def get_backgrounds(
    campaign_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all backgrounds.
    - System backgrounds are always available
    - Campaign backgrounds included if campaign_id provided
    """
    backgrounds = service.get_all_backgrounds(db, current_user.id, campaign_id)
    return backgrounds

@router.get("/{background_id}", response_model=schemas.BackgroundResponse)
def get_background(
    background_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific background by ID."""
    background = service.get_background_by_id(db, background_id)
    return background

@router.post("", response_model=schemas.BackgroundResponse, status_code=status.HTTP_201_CREATED)
def create_background(
    background_data: schemas.BackgroundCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new background (admin only).
    """
    background = service.create_background(db, background_data, current_user.id, current_user.is_admin)
    return background

@router.put("/{background_id}", response_model=schemas.BackgroundResponse)
def update_background(
    background_id: int,
    background_data: schemas.BackgroundUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a background (admin only).
    """
    background = service.update_background(db, background_id, background_data, current_user.id, current_user.is_admin)
    return background

@router.delete("/{background_id}")
def delete_background(
    background_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a background (admin only).
    """
    result = service.delete_background(db, background_id, current_user.id, current_user.is_admin)
    return result