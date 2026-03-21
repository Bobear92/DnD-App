from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from . import models, schemas
from shared.exceptions import NotFoundException, ForbiddenException

def get_all_backgrounds(db: Session, user_id: int, campaign_id: int = None):
    """
    Get all backgrounds available to the user.
    - System backgrounds (owner_type = 'system')
    - Campaign backgrounds if campaign_id provided
    """
    query = db.query(models.Background)
    
    if campaign_id:
        # System backgrounds OR backgrounds from this campaign
        query = query.filter(
            or_(
                models.Background.owner_type == models.OwnerType.system,
                and_(
                    models.Background.owner_type == models.OwnerType.campaign,
                    models.Background.owner_id == campaign_id
                )
            )
        )
    else:
        # Only system backgrounds
        query = query.filter(models.Background.owner_type == models.OwnerType.system)
    
    return query.order_by(models.Background.name).all()

def get_background_by_id(db: Session, background_id: int):
    """Get specific background by ID."""
    background = db.query(models.Background).filter(models.Background.id == background_id).first()
    if not background:
        raise NotFoundException(f"Background with id {background_id} not found")
    return background

def create_background(db: Session, background_data: schemas.BackgroundCreate, user_id: int, is_admin: bool):
    """
    Create a new background.
    - Admin can create system backgrounds
    - GMs can create campaign backgrounds (future feature)
    """
    # V1: Only admin can create system backgrounds
    if not is_admin:
        raise ForbiddenException("Only administrators can create backgrounds")
    
    # Create system background
    background = models.Background(
        name=background_data.name,
        description=background_data.description,
        skill_proficiencies=background_data.skill_proficiencies,
        tool_proficiencies=background_data.tool_proficiencies,
        languages=background_data.languages,
        equipment=background_data.equipment,
        feature=background_data.feature,
        characteristics=background_data.characteristics,
        owner_type=models.OwnerType.system,
        owner_id=None
    )
    
    db.add(background)
    db.commit()
    db.refresh(background)
    return background

def update_background(db: Session, background_id: int, background_data: schemas.BackgroundUpdate, user_id: int, is_admin: bool):
    """
    Update a background.
    - Admin can update system backgrounds
    - GMs can update their campaign backgrounds (future)
    """
    background = get_background_by_id(db, background_id)
    
    # V1: Only admin can update
    if not is_admin:
        raise ForbiddenException("Only administrators can update backgrounds")
    
    # Update fields
    update_data = background_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(background, field, value)
    
    db.commit()
    db.refresh(background)
    return background

def delete_background(db: Session, background_id: int, user_id: int, is_admin: bool):
    """
    Delete a background.
    - Admin can delete system backgrounds
    - GMs can delete their campaign backgrounds (future)
    """
    background = get_background_by_id(db, background_id)
    
    # V1: Only admin can delete
    if not is_admin:
        raise ForbiddenException("Only administrators can delete backgrounds")
    
    db.delete(background)
    db.commit()
    return {"message": f"Background '{background.name}' deleted successfully"}