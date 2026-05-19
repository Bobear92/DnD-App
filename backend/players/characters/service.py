from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from players.characters.models import Character
from players.characters.schemas import CharacterCreate, CharacterUpdate, CharacterGmUpdate
from gm.campaigns.models import CampaignMember


def _get_membership(db: Session, campaign_id: int, user_id: int) -> CampaignMember | None:
    return db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id
    ).first()


def create_character(character_data: CharacterCreate, user_id: int, db: Session) -> Character:
    membership = _get_membership(db, character_data.campaign_id, user_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of this campaign to create a character"
        )

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
        is_visible_to_players=False,
    )

    db.add(new_character)
    db.commit()
    db.refresh(new_character)
    return new_character


def get_characters_for_user(user_id: int, campaign_id: int, is_admin: bool, db: Session) -> list[Character]:
    membership = _get_membership(db, campaign_id, user_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this campaign"
        )

    is_gm = membership.role == 'gm' or is_admin

    if is_gm:
        return db.query(Character).filter(Character.campaign_id == campaign_id).all()

    characters = db.query(Character).filter(
        Character.campaign_id == campaign_id,
        (Character.user_id == user_id) | (Character.is_visible_to_players == True)
    ).all()
    # Strip gm_notes for players
    for c in characters:
        if c.user_id != user_id:
            c.gm_notes = None
    return characters


def get_character_by_id(character_id: int, user_id: int, is_admin: bool, db: Session) -> Character:
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_gm = membership.role == 'gm' or is_admin

    if not (is_gm or character.user_id == user_id or character.is_visible_to_players):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    if not is_gm:
        character.gm_notes = None
    return character


def update_character(character_id: int, character_data: CharacterUpdate | CharacterGmUpdate, user_id: int, is_admin: bool, db: Session) -> Character:
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_gm = membership.role == 'gm' or is_admin
    is_owner = character.user_id == user_id

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own characters")

    update_fields = character_data.model_dump(exclude_unset=True)

    # Only GMs may set gm_notes or is_visible_to_players via this endpoint
    if not is_gm:
        update_fields.pop("gm_notes", None)
        update_fields.pop("is_visible_to_players", None)

    for field, value in update_fields.items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)

    if not is_gm:
        character.gm_notes = None
    return character


def delete_character(character_id: int, user_id: int, is_admin: bool, db: Session):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_gm = membership.role == 'gm' or is_admin
    is_owner = character.user_id == user_id

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own characters")

    db.delete(character)
    db.commit()


def toggle_character_visibility(character_id: int, is_visible: bool, user_id: int, is_admin: bool, db: Session):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    is_gm = membership and (membership.role == 'gm' or is_admin)

    if not is_gm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only GMs can change character visibility")

    character.is_visible_to_players = is_visible
    db.commit()
