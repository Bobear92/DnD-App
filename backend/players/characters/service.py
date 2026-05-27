from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from typing import List

from players.characters.models import Character, CharacterTimelineEvent, CharacterNpc
from players.characters.schemas import (
    CharacterCreate, CharacterUpdate, CharacterGmUpdate,
    CharacterTimelineEventCreate, CharacterTimelineEventResponse,
    CharacterNpcCreate, CharacterNpcResponse,
)
from players.characters.storage import save_character_image, delete_character_image_file
from gm.campaigns.models import CampaignMember
from gm.campaigns.campaign_tools.timeline.models import TimelineEvent
from gm.campaigns.campaign_tools.timeline.service import _compute_era_dates, _resolve_absolute_year
from gm.campaigns.campaign_tools.npcs.models import NPC, NPCStatus


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _get_membership(db: Session, campaign_id: int, user_id: int) -> CampaignMember | None:
    return db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id
    ).first()


def _resolve_character_and_access(
    db: Session, character_id: int, user_id: int, is_admin: bool
) -> tuple[Character, CampaignMember | None, bool, bool]:
    """Return (character, membership, is_gm, is_owner). Raises 404/403 as needed."""
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")
    is_gm = membership.role == "gm" or is_admin
    is_owner = character.user_id == user_id
    return character, membership, is_gm, is_owner


def _strip_private_fields(character: Character, is_gm: bool, is_owner: bool) -> Character:
    """Strip gm_notes and personal_notes based on caller's role."""
    if not is_gm:
        character.gm_notes = None
    if not is_gm and not is_owner:
        character.personal_notes = None
    return character


# ── Character CRUD ────────────────────────────────────────────────────────────

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
        backstory=character_data.backstory,
        personal_notes=character_data.personal_notes,
        theme_music_url=character_data.theme_music_url,
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

    is_gm = membership.role == "gm" or is_admin

    if is_gm:
        return db.query(Character).filter(Character.campaign_id == campaign_id).all()

    characters = db.query(Character).filter(
        Character.campaign_id == campaign_id,
        (Character.user_id == user_id) | (Character.is_visible_to_players == True)
    ).all()
    for c in characters:
        is_owner = c.user_id == user_id
        _strip_private_fields(c, is_gm=False, is_owner=is_owner)
    return characters


def get_character_by_id(character_id: int, user_id: int, is_admin: bool, db: Session) -> Character:
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_gm = membership.role == "gm" or is_admin
    is_owner = character.user_id == user_id

    if not (is_gm or is_owner or character.is_visible_to_players):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    return _strip_private_fields(character, is_gm, is_owner)


def update_character(character_id: int, character_data: CharacterUpdate | CharacterGmUpdate, user_id: int, is_admin: bool, db: Session) -> Character:
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_gm = membership.role == "gm" or is_admin
    is_owner = character.user_id == user_id

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own characters")

    update_fields = character_data.model_dump(exclude_unset=True)

    # Only GM may set gm_notes or is_visible_to_players
    if not is_gm:
        update_fields.pop("gm_notes", None)
        update_fields.pop("is_visible_to_players", None)

    # Only the owner (or GM with same account) should set personal_notes;
    # a non-owner GM may read personal_notes but shouldn't overwrite them.
    if is_gm and not is_owner:
        update_fields.pop("personal_notes", None)

    for field, value in update_fields.items():
        setattr(character, field, value)

    db.commit()
    db.refresh(character)
    return _strip_private_fields(character, is_gm, is_owner)


def delete_character(character_id: int, user_id: int, is_admin: bool, db: Session):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    membership = _get_membership(db, character.campaign_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_gm = membership.role == "gm" or is_admin
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
    is_gm = membership and (membership.role == "gm" or is_admin)

    if not is_gm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only GMs can change character visibility")

    character.is_visible_to_players = is_visible
    db.commit()


# ── Character image ───────────────────────────────────────────────────────────

async def upload_character_image(db: Session, character_id: int, file: UploadFile, user_id: int, is_admin: bool) -> Character:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can upload an image")

    if character.image_path:
        delete_character_image_file(character.image_path)

    image_path = await save_character_image(file, character_id)
    character.image_path = image_path
    db.commit()
    db.refresh(character)
    return _strip_private_fields(character, is_gm, is_owner)


def delete_character_image(db: Session, character_id: int, user_id: int, is_admin: bool) -> Character:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can delete the image")

    if character.image_path:
        delete_character_image_file(character.image_path)
        character.image_path = None
        db.commit()
        db.refresh(character)
    return _strip_private_fields(character, is_gm, is_owner)


# ── Character timeline events ─────────────────────────────────────────────────

def get_character_timeline_events(db: Session, character_id: int, user_id: int, is_admin: bool) -> List[CharacterTimelineEventResponse]:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner or character.is_visible_to_players):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_player = not is_gm
    links = db.query(CharacterTimelineEvent).filter(
        CharacterTimelineEvent.character_id == character_id
    ).all()

    result = []
    for link in links:
        event = db.query(TimelineEvent).filter(TimelineEvent.id == link.event_id).first()
        if not event:
            continue
        if is_player and not event.is_visible_to_players:
            continue
        era_dates = _compute_era_dates(
            db, character.campaign_id, event.absolute_year, event.month_order, event.day, is_player
        )
        result.append(CharacterTimelineEventResponse(
            id=link.id,
            character_id=link.character_id,
            event_id=link.event_id,
            event_title=event.title,
            era_dates=era_dates,
            link_description=link.description,
            created_at=link.created_at,
        ))
    return result


def create_character_timeline_event(
    db: Session, character_id: int, data: CharacterTimelineEventCreate, user_id: int, is_admin: bool
) -> CharacterTimelineEventResponse:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can add timeline events")

    absolute_year = _resolve_absolute_year(db, data.era_id, data.year) if data.era_id and data.year is not None else None

    event = TimelineEvent(
        campaign_id=character.campaign_id,
        title=data.title,
        description=data.description,
        era_id=data.era_id,
        year=data.year,
        month_order=data.month_order,
        day=data.day,
        absolute_year=absolute_year,
        is_visible_to_players=data.is_visible_to_players,
    )
    db.add(event)
    db.flush()

    link = CharacterTimelineEvent(
        character_id=character_id,
        event_id=event.id,
        description=data.link_description,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    era_dates = _compute_era_dates(
        db, character.campaign_id, absolute_year, data.month_order, data.day, is_player=False
    )
    return CharacterTimelineEventResponse(
        id=link.id,
        character_id=link.character_id,
        event_id=link.event_id,
        event_title=event.title,
        era_dates=era_dates,
        link_description=link.description,
        created_at=link.created_at,
    )


def remove_character_timeline_event(db: Session, character_id: int, link_id: int, user_id: int, is_admin: bool) -> None:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can remove timeline events")

    link = db.query(CharacterTimelineEvent).filter(
        CharacterTimelineEvent.id == link_id,
        CharacterTimelineEvent.character_id == character_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timeline event link not found")

    db.delete(link)
    db.commit()


# ── Character NPCs ────────────────────────────────────────────────────────────

def get_character_npcs(db: Session, character_id: int, user_id: int, is_admin: bool) -> List[CharacterNpcResponse]:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner or character.is_visible_to_players):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this character")

    is_player = not is_gm
    links = db.query(CharacterNpc).filter(
        CharacterNpc.character_id == character_id
    ).all()

    result = []
    for link in links:
        npc = db.query(NPC).filter(NPC.id == link.npc_id).first()
        if not npc:
            continue
        if is_player and not npc.is_visible_to_players:
            continue
        result.append(CharacterNpcResponse(
            id=link.id,
            character_id=link.character_id,
            npc_id=link.npc_id,
            npc_name=npc.name,
            npc_race=npc.race,
            npc_occupation=npc.occupation,
            npc_image_path=npc.image_path,
            relationship_description=link.description,
            created_at=link.created_at,
        ))
    return result


def create_character_npc(
    db: Session, character_id: int, data: CharacterNpcCreate, user_id: int, is_admin: bool
) -> CharacterNpcResponse:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can add NPCs")

    try:
        npc_status = NPCStatus(data.status) if data.status else NPCStatus.alive
    except ValueError:
        npc_status = NPCStatus.alive

    npc = NPC(
        campaign_id=character.campaign_id,
        name=data.name,
        race=data.race or "",
        occupation=data.occupation,
        alignment=data.alignment,
        status=npc_status,
        summary=data.summary,
        is_visible_to_players=data.is_visible_to_players,
    )
    db.add(npc)
    db.flush()

    link = CharacterNpc(
        character_id=character_id,
        npc_id=npc.id,
        description=data.relationship_description,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    return CharacterNpcResponse(
        id=link.id,
        character_id=link.character_id,
        npc_id=link.npc_id,
        npc_name=npc.name,
        npc_race=npc.race,
        npc_occupation=npc.occupation,
        npc_image_path=npc.image_path,
        relationship_description=link.description,
        created_at=link.created_at,
    )


def remove_character_npc(db: Session, character_id: int, link_id: int, user_id: int, is_admin: bool) -> None:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can remove NPCs")

    link = db.query(CharacterNpc).filter(
        CharacterNpc.id == link_id,
        CharacterNpc.character_id == character_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NPC link not found")

    db.delete(link)
    db.commit()
