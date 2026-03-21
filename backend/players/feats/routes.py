from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from . import service, schemas
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/feats", tags=["Feats"])

@router.get("", response_model=List[schemas.FeatListItem])
def get_feats(
    campaign_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all feats.
    - System feats are always available
    - Campaign feats included if campaign_id provided
    """
    feats = service.get_all_feats(db, current_user.id, campaign_id)
    return feats

@router.get("/{feat_id}", response_model=schemas.FeatResponse)
def get_feat(
    feat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific feat by ID."""
    feat = service.get_feat_by_id(db, feat_id)
    return feat

@router.post("", response_model=schemas.FeatResponse, status_code=status.HTTP_201_CREATED)
def create_feat(
    feat_data: schemas.FeatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new feat (admin only).
    """
    feat = service.create_feat(db, feat_data, current_user.id, current_user.is_admin)
    return feat

@router.put("/{feat_id}", response_model=schemas.FeatResponse)
def update_feat(
    feat_id: int,
    feat_data: schemas.FeatUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a feat (admin only).
    """
    feat = service.update_feat(db, feat_id, feat_data, current_user.id, current_user.is_admin)
    return feat

@router.delete("/{feat_id}")
def delete_feat(
    feat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a feat (admin only).
    """
    result = service.delete_feat(db, feat_id, current_user.id, current_user.is_admin)
    return result