from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from . import models, schemas
from shared.exceptions import NotFoundException, ForbiddenException

def get_all_races(db: Session, user_id: int, campaign_id: int = None):
    """
    Get all races available to the user.
    - System races (owner_type = 'system')
    - Campaign races if campaign_id provided
    """
    query = db.query(models.Race)
    
    if campaign_id:
        # System races OR races from this campaign
        query = query.filter(
            or_(
                models.Race.owner_type == models.OwnerType.system,
                and_(
                    models.Race.owner_type == models.OwnerType.campaign,
                    models.Race.owner_id == campaign_id
                )
            )
        )
    else:
        # Only system races
        query = query.filter(models.Race.owner_type == models.OwnerType.system)
    
    return query.order_by(models.Race.name).all()

def get_race_by_id(db: Session, race_id: int):
    """Get specific race by ID."""
    race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not race:
        raise NotFoundException(f"Race with id {race_id} not found")
    return race

def create_race(db: Session, race_data: schemas.RaceCreate, user_id: int, is_admin: bool):
    """
    Create a new race.
    - Admin can create system races
    - GMs can create campaign races (future feature)
    """
    # V1: Only admin can create system races
    if not is_admin:
        raise ForbiddenException("Only administrators can create races")
    
    # Create system race
    race = models.Race(
        name=race_data.name,
        description=race_data.description,
        ability_score_increases=race_data.ability_score_increases,
        size=race_data.size,
        speed=race_data.speed,
        traits=race_data.traits,
        languages=race_data.languages,
        owner_type=models.OwnerType.system,
        owner_id=None
    )
    
    db.add(race)
    db.commit()
    db.refresh(race)
    return race

def update_race(db: Session, race_id: int, race_data: schemas.RaceUpdate, user_id: int, is_admin: bool):
    """
    Update a race.
    - Admin can update system races
    - GMs can update their campaign races (future)
    """
    race = get_race_by_id(db, race_id)
    
    # V1: Only admin can update
    if not is_admin:
        raise ForbiddenException("Only administrators can update races")
    
    # Update fields
    update_data = race_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(race, field, value)
    
    db.commit()
    db.refresh(race)
    return race

def delete_race(db: Session, race_id: int, user_id: int, is_admin: bool):
    """
    Delete a race.
    - Admin can delete system races
    - GMs can delete their campaign races (future)
    """
    race = get_race_by_id(db, race_id)
    
    # V1: Only admin can delete
    if not is_admin:
        raise ForbiddenException("Only administrators can delete races")
    
    db.delete(race)
    db.commit()
    return {"message": f"Race '{race.name}' deleted successfully"}