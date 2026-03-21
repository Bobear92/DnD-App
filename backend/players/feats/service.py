from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from . import models, schemas
from shared.exceptions import NotFoundException, ForbiddenException

def get_all_feats(db: Session, user_id: int, campaign_id: int = None):
    """
    Get all feats available to the user.
    - System feats (owner_type = 'system')
    - Campaign feats if campaign_id provided
    """
    query = db.query(models.Feat)
    
    if campaign_id:
        # System feats OR feats from this campaign
        query = query.filter(
            or_(
                models.Feat.owner_type == models.OwnerType.system,
                and_(
                    models.Feat.owner_type == models.OwnerType.campaign,
                    models.Feat.owner_id == campaign_id
                )
            )
        )
    else:
        # Only system feats
        query = query.filter(models.Feat.owner_type == models.OwnerType.system)
    
    return query.order_by(models.Feat.name).all()

def get_feat_by_id(db: Session, feat_id: int):
    """Get specific feat by ID."""
    feat = db.query(models.Feat).filter(models.Feat.id == feat_id).first()
    if not feat:
        raise NotFoundException(f"Feat with id {feat_id} not found")
    return feat

def create_feat(db: Session, feat_data: schemas.FeatCreate, user_id: int, is_admin: bool):
    """
    Create a new feat.
    - Admin can create system feats
    - GMs can create campaign feats (future feature)
    """
    # V1: Only admin can create system feats
    if not is_admin:
        raise ForbiddenException("Only administrators can create feats")
    
    # Create system feat
    feat = models.Feat(
        name=feat_data.name,
        description=feat_data.description,
        prerequisites=feat_data.prerequisites,
        benefits=feat_data.benefits,
        repeatable=feat_data.repeatable,
        source=feat_data.source,
        owner_type=models.OwnerType.system,
        owner_id=None
    )
    
    db.add(feat)
    db.commit()
    db.refresh(feat)
    return feat

def update_feat(db: Session, feat_id: int, feat_data: schemas.FeatUpdate, user_id: int, is_admin: bool):
    """
    Update a feat.
    - Admin can update system feats
    - GMs can update their campaign feats (future)
    """
    feat = get_feat_by_id(db, feat_id)
    
    # V1: Only admin can update
    if not is_admin:
        raise ForbiddenException("Only administrators can update feats")
    
    # Update fields
    update_data = feat_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(feat, field, value)
    
    db.commit()
    db.refresh(feat)
    return feat

def delete_feat(db: Session, feat_id: int, user_id: int, is_admin: bool):
    """
    Delete a feat.
    - Admin can delete system feats
    - GMs can delete their campaign feats (future)
    """
    feat = get_feat_by_id(db, feat_id)
    
    # V1: Only admin can delete
    if not is_admin:
        raise ForbiddenException("Only administrators can delete feats")
    
    db.delete(feat)
    db.commit()
    return {"message": f"Feat '{feat.name}' deleted successfully"}