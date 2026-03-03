from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from players.characters.models import Character
from players.characters.schemas import CharacterCreate, CharacterUpdate
from gm.campaigns.models import CampaignMember

def create_character(character_data: CharacterCreate, user_id: int, db: Session) -> Character:
    """Create a new character (player must be in the campaign)"""
    # Check if user is a member of the campaign
    is_member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == character_data.campaign_id,
        CampaignMember.user_id == user_id
    ).first()
    
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this campaign to create a character"
        )
    
    # Create character
    new_character = Character(
        name=character_data.name,
        race=character_data.race,
        char_class=character_data.char_class,
        level=character_data.level,
        background=character_data.background,
        alignment=character_data.alignment,
        strength=character_data.strength,
        dexterity=character_data.dexterity,
        constitution=character_data.constitution,
        intelligence=character_data.intelligence,
        wisdom=character_data.wisdom,
        charisma=character_data.charisma,
        character_data=character_data.character_data,
        notes=character_data.notes,
        user_id=user_id,
        campaign_id=character_data.campaign_id,
        is_visible_to_players=False  # Default to hidden
    )
    
    db.add(new_character)
    db.commit()
    db.refresh(new_character)
    
    return new_character

def get_characters_for_user(user_id: int, campaign_id: int, is_admin: bool, db: Session) -> list[Character]:
    """Get characters visible to user in a campaign"""
    # Check if user is GM of this campaign
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this campaign"
        )
    
    is_gm = membership.role == 'gm' or is_admin
    
    if is_gm:
        # GM sees all characters in the campaign
        return db.query(Character).filter(
            Character.campaign_id == campaign_id
        ).all()
    else:
        # Players see their own characters + visible characters
        return db.query(Character).filter(
            Character.campaign_id == campaign_id,
            (Character.user_id == user_id) | (Character.is_visible_to_players == True)
        ).all()

def get_character_by_id(character_id: int, user_id: int, is_admin: bool, db: Session) -> Character:
    """Get a specific character if user has access"""
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Check if user is GM of the campaign
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == character.campaign_id,
        CampaignMember.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this character"
        )
    
    is_gm = membership.role == 'gm' or is_admin
    
    # GM can see all characters, players can see their own + visible
    if is_gm or character.user_id == user_id or character.is_visible_to_players:
        return character
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You don't have access to this character"
    )

def update_character(character_id: int, character_data: CharacterUpdate, user_id: int, db: Session) -> Character:
    """Update a character (owner only)"""
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Only owner can update
    if character.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own characters"
        )
    
    # Update fields
    update_data = character_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(character, field, value)
    
    db.commit()
    db.refresh(character)
    
    return character

def delete_character(character_id: int, user_id: int, db: Session):
    """Delete a character (owner only)"""
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Only owner can delete
    if character.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own characters"
        )
    
    db.delete(character)
    db.commit()

def toggle_character_visibility(character_id: int, is_visible: bool, user_id: int, is_admin: bool, db: Session):
    """Toggle character visibility (GM only)"""
    character = db.query(Character).filter(Character.id == character_id).first()
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Check if user is GM of the campaign
    membership = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == character.campaign_id,
        CampaignMember.user_id == user_id
    ).first()
    
    is_gm = membership and (membership.role == 'gm' or is_admin)
    
    if not is_gm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GMs can change character visibility"
        )
    
    character.is_visible_to_players = is_visible
    db.commit()