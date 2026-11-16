import re
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile, status
from typing import List

from players.characters.models import Character, CharacterTimelineEvent, CharacterNpc
from players.characters.schemas import (
    CharacterCreate, CharacterUpdate, CharacterGmUpdate,
    CharacterTimelineEventCreate, CharacterTimelineEventResponse,
    CharacterNpcCreate, CharacterNpcResponse,
    RestRequest, RestResponse, RestResultItem, InitiativeOption, InitiativeOptionsItem,
)
from shared.file_storage import save_upload, delete_upload, CHARACTER_IMAGE, MUSIC
from gm.campaigns.models import Campaign, CampaignMember
from gm.campaigns.campaign_tools.timeline.models import TimelineEvent
from gm.campaigns.campaign_tools.timeline.service import _compute_era_dates, _resolve_absolute_year
from gm.campaigns.campaign_tools.npcs.models import NPC, NPCStatus


# The top of the 5e XP table — the level-20 threshold. XP past it buys nothing (there is no
# level 21), so a total is clamped here rather than allowed to run away. Mirrored on the
# frontend as MAX_XP in characters/pages/CharacterDetail.jsx.
MAX_EXPERIENCE_POINTS = 355_000


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
        appearance=character_data.appearance,
        notes=character_data.notes,
        backstory=character_data.backstory,
        personal_notes=character_data.personal_notes,
        theme_music_url=character_data.theme_music_url,
        experience_points=min(MAX_EXPERIENCE_POINTS, max(0, character_data.experience_points or 0)),
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

    # XP tops out at the level-20 threshold. Past it XP means nothing — there is no level 21
    # to earn — so an over-award is clamped rather than left to run away. Clamped HERE, not
    # only in the UI, so it holds for any caller (the frontend clamps too, so the GM never
    # sees a number the save would silently change).
    if update_fields.get("experience_points") is not None:
        update_fields["experience_points"] = min(MAX_EXPERIENCE_POINTS, max(0, update_fields["experience_points"]))

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
        delete_upload(character.image_path)

    image_path = await save_upload(file, CHARACTER_IMAGE, character_id)
    character.image_path = image_path
    db.commit()
    db.refresh(character)
    return _strip_private_fields(character, is_gm, is_owner)


def delete_character_image(db: Session, character_id: int, user_id: int, is_admin: bool) -> Character:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can delete the image")

    if character.image_path:
        delete_upload(character.image_path)
        character.image_path = None
        db.commit()
        db.refresh(character)
    return _strip_private_fields(character, is_gm, is_owner)


# ── Character theme music ─────────────────────────────────────────────────────

async def upload_character_music(db: Session, character_id: int, file: UploadFile, user_id: int, is_admin: bool) -> Character:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can upload music")

    delete_upload(character.theme_music_url)

    character.theme_music_url = await save_upload(file, MUSIC, "characters", character_id)
    db.commit()
    db.refresh(character)
    return _strip_private_fields(character, is_gm, is_owner)


def delete_character_music(db: Session, character_id: int, user_id: int, is_admin: bool) -> Character:
    character, _, is_gm, is_owner = _resolve_character_and_access(db, character_id, user_id, is_admin)

    if not (is_gm or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the character owner or GM can delete music")

    if character.theme_music_url:
        delete_upload(character.theme_music_url)
        character.theme_music_url = None
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


# ── Rest ──────────────────────────────────────────────────────────────────────

# 'initiative' is not a rest in the fiction — it reuses this endpoint because it is the same
# operation (GM applies a resource patch to selected characters) and shares its authorization.
_REST_TYPES = {'short', 'long', 'initiative'}

_SPELLCASTING_CLASSES = {'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Wizard', 'Artificer'}

# ── Initiative-triggered recharges ────────────────────────────────────────────
#
# A handful of features refill a resource "when you roll initiative". They are applied by the GM's
# encounter flow (rest_type 'initiative'), never by a short/long rest.
#
# This table is the SINGLE source of truth — deliberately not mirrored on the frontend. The UI shows
# what this returned (RestResponse.changes) rather than predicting it, so the two can't disagree
# about which features fired. There are three shapes, hence `mode`; a boolean flag would have been
# wrong from the first row (Monk's Perfect Self regains FOUR, not one):
#
#   'regain_when_empty' — RAW "and have no uses remaining": no-op unless the pool is fully spent,
#                         then give back `amount`.
#   'floor'             — top the pool up so at least `amount` remains; never takes any away.
#   'opt_in'            — the player chooses (and it costs its own charge). NOT YET IMPLEMENTED —
#                         Monk 2024 Uncanny Metabolism needs a per-character opt-in on the page.
#
# `total` and `amount` accept an int, the sentinels 'level' / 'pb', or a callable taking the pool
# context — because a pool's size is not always a constant. A Battle Master at 15th has SIX dice
# plus one per Martial Adept feat, and a Bard's Inspiration pool is their Charisma modifier; a flat
# number would refill someone who still had a die left. The formula lives on the row, so adding a
# feature stays a one-row change.
# `unit` is (singular, plural) for the change message, default ('use', 'uses').
_INITIATIVE_RESOURCES = [
    {
        'feature': 'Ever-Ready Shot',
        'label': 'Arcane Shot',
        'char_class': 'Fighter',
        'subclass': 'Arcane Archer',
        'edition': '5e',          # None means "either edition"
        'min_level': 15,
        'key': 'arcane_shot_used',
        'total': 2,               # flat two uses at every level (see arcaneShotData.js)
        'mode': 'regain_when_empty',
        'amount': 1,
    },
    {
        # Both editions word it the same way and both unlock at 15th.
        'feature': 'Relentless',
        'label': 'Superiority Dice',
        'char_class': 'Fighter',
        'subclass': 'Battle Master',
        'edition': None,
        'min_level': 15,
        'key': 'superiority_dice_used',
        # 6 dice from 15th (4 at 3rd, 5 at 7th), plus one per Martial Adept feat — mirrors the
        # frontend's superiorityDiceCount(level) + martialAdeptDieCount(feats).
        'total': lambda ctx: 6 + _martial_adept_dice(ctx['cd']),
        'mode': 'regain_when_empty',
        'amount': 1,
        'unit': ('die', 'dice'),
    },
    {
        'feature': 'Superior Inspiration',
        'label': 'Bardic Inspiration',
        'char_class': 'Bard',
        'subclass': None,
        'edition': '5e',          # the 2024 Bard's version isn't in our feature tables yet
        'min_level': 20,
        'key': 'bardic_inspiration_used',
        'total': lambda ctx: max(1, _ability_mod(getattr(ctx['char'], 'charisma', 10))),
        'mode': 'regain_when_empty',
        'amount': 1,
    },
    {
        # The OPT-IN shape: the Monk CHOOSES to use this, it is not gated on being empty, and it
        # costs its own 1/long-rest charge. `amount` follows the feature text our app displays
        # ("regain Focus Points equal to your Proficiency Bonus"), which is a simplification of
        # the published 2024 wording — see docs/tickets/roll-initiative-v1.md.
        'feature': 'Uncanny Metabolism',
        'label': 'Focus Points',
        'description': 'Regain Focus Points equal to your proficiency bonus. Once per long rest.',
        'char_class': 'Monk',
        'subclass': None,
        'edition': '5.5e',
        'min_level': 2,
        'key': 'ki_used',
        'total': 'level',
        'mode': 'opt_in',
        'amount': 'pb',
        'charge_key': 'uncanny_metabolism_used',
        'unit': ('point', 'points'),
    },
    {
        # Samurai's Fighting Spirit is three uses per long rest (see configs/fighter.js).
        'feature': 'Tireless Spirit',
        'label': 'Fighting Spirit',
        'char_class': 'Fighter',
        'subclass': 'Samurai',
        'edition': '5e',          # our subclass data has no 2024 Samurai
        'min_level': 10,
        'key': 'fighting_spirit_used',
        'total': 3,
        'mode': 'regain_when_empty',
        'amount': 1,
    },
    {
        # Legion of One's second half: "when you roll initiative and have no uses of Unleash
        # Incarnation remaining, you regain one use of that feature". The pool is the CON
        # modifier floored at one (mirrors the frontend's abilityModUses('constitution')) —
        # a flat number would call a CON 12 Echo Knight with one use left "empty".
        'feature': 'Legion of One',
        'label': 'Unleash Incarnation',
        'char_class': 'Fighter',
        'subclass': 'Echo Knight',
        'edition': '5e',          # Echo Knight has no 2024 version
        'min_level': 18,
        'key': 'unleash_incarnation_used',
        'total': lambda ctx: max(1, _ability_mod(getattr(ctx['char'], 'constitution', 10))),
        'mode': 'regain_when_empty',
        'amount': 1,
    },
    {
        # The FLOOR shape: "have fewer Focus Points than your Proficiency Bonus → your total
        # becomes equal to your Proficiency Bonus". Not conditional on being empty, and it must
        # never take points away from a Monk who has more than PB.
        'feature': 'Perfect Focus',
        'label': 'Focus Points',
        'char_class': 'Monk',
        'subclass': None,
        'edition': '5.5e',
        'min_level': 15,
        'key': 'ki_used',
        'total': 'level',         # focus points = monk level
        'mode': 'floor',
        'amount': 'pb',
        'unit': ('point', 'points'),
    },
    {
        # "…and have no ki points remaining, you regain 4 ki points" — the reason `amount` is a
        # number rather than a boolean flag.
        'feature': 'Perfect Self',
        'label': 'Ki',
        'char_class': 'Monk',
        'subclass': None,
        'edition': '5e',
        'min_level': 20,
        'key': 'ki_used',
        'total': 'level',         # ki points = monk level
        'mode': 'regain_when_empty',
        'amount': 4,
        'unit': ('point', 'points'),
    },
]


def _ability_mod(score) -> int:
    return ((score or 10) - 10) // 2


def _martial_adept_dice(cd: dict) -> int:
    """Extra superiority dice from feats — one per feat carrying a `maneuver_grant` effect.
    Mirrors the frontend `martialAdeptDieCount`."""
    count = 0
    for feat in (cd.get('feats') or []):
        if not isinstance(feat, dict):
            continue
        for effect in (feat.get('effects') or []):
            if isinstance(effect, dict) and effect.get('kind') == 'maneuver_grant':
                count += 1
                break
    return count


def _resolve_pool_value(value, ctx: dict) -> int:
    """Resolve an _INITIATIVE_RESOURCES `total`/`amount`: a callable, 'level', 'pb', or an int."""
    if callable(value):
        return int(value(ctx))
    if value == 'level':
        return ctx['level']
    if value == 'pb':
        return ctx['pb']
    return int(value)


def _proficiency_bonus(level: int) -> int:
    return 2 + (max(1, level) - 1) // 4


def _initiative_specs_for(char: Character, cd: dict, edition: str):
    """The _INITIATIVE_RESOURCES rows that apply to this character (class/subclass/edition/level)."""
    level = char.level or 1
    for spec in _INITIATIVE_RESOURCES:
        if spec['char_class'] != char.char_class:
            continue
        if spec.get('subclass') and cd.get('subclass') != spec['subclass']:
            continue
        if spec.get('edition') and spec['edition'] != edition:
            continue
        if level < spec['min_level']:
            continue
        yield spec


def get_initiative_options(
    db: Session, campaign_id: int, character_ids: list[int], user_id: int, is_admin: bool
) -> list:
    """Per character, the initiative features they must CHOOSE to use (and whether the choice is
    still available). Read-only: it exists so the encounter page can offer the opt-in without
    mirroring _INITIATIVE_RESOURCES, which would let the two copies disagree."""
    membership = _get_membership(db, campaign_id, user_id)
    if not membership or (membership.role != 'gm' and not is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the GM can read initiative options")

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    characters = db.query(Character).filter(
        Character.id.in_(character_ids),
        Character.campaign_id == campaign_id,
    ).all()

    results = []
    for char in characters:
        cd = char.character_data or {}
        options = []
        for spec in _initiative_specs_for(char, cd, campaign.edition):
            if spec['mode'] != 'opt_in':
                continue
            spent = bool(cd.get(spec.get('charge_key')))
            options.append(InitiativeOption(
                feature=spec['feature'],
                label=spec['label'],
                description=spec.get('description', ''),
                available=not spent,
            ))
        if options:
            results.append(InitiativeOptionsItem(
                character_id=char.id, name=char.name, options=options,
            ))
    return results


def _compute_initiative_patch(
    char: Character, edition: str, opted_in: set | None = None
) -> tuple[dict, list]:
    """Return (character_data_patch, human_readable_changes) for rolling initiative.

    `opted_in` holds the feature names this character chose to use — an `opt_in` row does nothing
    without it, because the player decides whether to spend the charge."""
    cd = char.character_data or {}
    level = char.level or 1
    pb = _proficiency_bonus(level)
    opted_in = opted_in or set()
    patch: dict = {}
    changes: list = []

    for spec in _initiative_specs_for(char, cd, edition):
        if spec['mode'] == 'opt_in' and spec['feature'] not in opted_in:
            continue

        ctx = {'char': char, 'cd': cd, 'level': level, 'pb': pb}
        total = _resolve_pool_value(spec['total'], ctx)
        amount = _resolve_pool_value(spec['amount'], ctx)
        used = cd.get(spec['key']) or 0

        if spec['mode'] == 'regain_when_empty':
            if used < total:
                continue  # RAW: only when you have none left
            new_used = max(0, used - amount)
        elif spec['mode'] == 'floor':
            # Leave at least `amount` in the pool; never reduce someone who has more.
            new_used = min(used, max(0, total - amount))
        elif spec['mode'] == 'opt_in':
            # Costs its own charge, so refuse when that charge is already spent — and don't burn
            # it on a full pool, where the feature would do nothing anyway.
            charge_key = spec.get('charge_key')
            if charge_key and cd.get(charge_key):
                continue
            if used == 0:
                continue
            new_used = max(0, used - amount)
            if charge_key:
                patch[charge_key] = 1
        else:
            continue

        if new_used == used:
            continue

        patch[spec['key']] = new_used
        regained = used - new_used
        singular, plural = spec.get('unit', ('use', 'uses'))
        changes.append(
            f"{spec['label']}: {regained} {singular if regained == 1 else plural} "
            f"regained ({spec['feature']})"
        )

    if not changes:
        changes.append('Nothing regained on initiative')

    return patch, changes


# Racial / subracial rest resources — mirrors frontend racialRestResources.js (the two are
# checked against each other through tests/fixtures/rest_resources_contract.json).
# Each tuple: (trait_name, character_data_key, recharge, min_level).
# recharge 'short' recovers on a short OR long rest; 'long' on a long rest only.
_RACIAL_REST_RESOURCES = [
    ('Breath Weapon', 'breath_weapon_used', 'short', 1),
    ('Relentless Endurance', 'relentless_endurance_used', 'long', 1),
    ('Drow Magic', 'drow_faerie_fire_used', 'long', 3),
    ('Drow Magic', 'drow_darkness_used', 'long', 5),
    ('Infernal Legacy', 'infernal_hellish_rebuke_used', 'long', 3),
    ('Infernal Legacy', 'infernal_darkness_used', 'long', 5),
]


def _feat_freecast_used_key(spell_name: str) -> str:
    """character_data key tracking a feat-granted spell's 1/long-rest free cast.
    MUST stay in sync with the frontend `featFreeCastUsedKey` (featEffects.js)."""
    slug = re.sub(r'[^a-z0-9]+', '_', (spell_name or '').lower()).strip('_')
    return f"feat_freecast_{slug}_used"


# Rune Knight Channel Rune keys, one per rune. Each rune recharges INDEPENDENTLY — RAW is
# "you can't use it again until you finish a short or long rest" per rune — so they cannot share
# a pool. Mirrors CHANNEL_RUNE_KEYS in frontend runesData.js. The reset is unconditional rather
# than per-carved-rune: which runes are carved is frontend state, so a rune moved between rests
# can't keep a stale count.
_CHANNEL_RUNE_KEYS = [
    'channel_rune_cloud_used',
    'channel_rune_fire_used',
    'channel_rune_frost_used',
    'channel_rune_stone_used',
    'channel_rune_hill_used',
    'channel_rune_storm_used',
]


# ── Rest resources ────────────────────────────────────────────────────────────
#
# Every class/subclass counter a short or long rest resets is ONE ROW here. This table is the
# single source of truth for what a rest recovers: the GM's rest dialog shows what a dry run of
# this returned (RestRequest.dry_run) instead of predicting it from a second copy, the same call
# the initiative flow made. Adding a feature's pool is a one-row change.
#
#   keys       — the character_data counters the row resets.
#   recharge   — 'short' recovers on a short OR long rest (a long rest is also a short one);
#                'long' recovers on a long rest only.
#   char_class — a class name, a tuple of them, or None for "any class".
#   subclass   — a subclass name, a tuple of them, or None for "any".
#   edition    — '5e' / '5.5e', or None for either.
#   min_level  — the level the FEATURE is gained, so a rest never promises a pool the character
#                doesn't have.
#   value      — what "unspent" looks like: 0 for a counter (default), False for a once-per-rest
#                flag, [] for a rolled list.
#   only_if_spent — report the row only when something was actually spent (the reset still
#                happens). For rows where "recovered" would read oddly on an untouched resource.
#
# Pool SIZES stay a frontend concern (class config `restResources`): a reset only zeroes the
# spent count, so the backend never needs to know that a Cavalier's pool is their STR modifier.
# The frontend rows are checked against this table by restResourceContract.test.js through
# tests/fixtures/rest_resources_contract.json — a frontend tracker with no row here would be a
# counter no rest ever resets.
def _rest(message, keys, recharge, char_class, min_level=1, subclass=None, edition=None,
          value=0, only_if_spent=False):
    return {
        'message': message, 'keys': list(keys), 'recharge': recharge, 'char_class': char_class,
        'subclass': subclass, 'edition': edition, 'min_level': min_level, 'value': value,
        'only_if_spent': only_if_spent,
    }


_REST_RESOURCES = [
    # ── Fighter ──
    _rest('Second Wind recovered', ['second_wind_used'], 'short', 'Fighter'),
    _rest('Action Surge recovered', ['action_surge_used'], 'short', 'Fighter', min_level=2),
    _rest('Indomitable recovered', ['indomitable_used'], 'long', 'Fighter', min_level=9),
    _rest('Superiority Dice recovered', ['superiority_dice_used'], 'short', 'Fighter',
          min_level=3, subclass='Battle Master'),
    _rest('Arcane Shot recovered', ['arcane_shot_used'], 'short', 'Fighter',
          min_level=3, subclass='Arcane Archer'),
    _rest('Fighting Spirit recovered', ['fighting_spirit_used'], 'long', 'Fighter',
          min_level=3, subclass='Samurai'),
    _rest('Strength Before Death recovered', ['strength_before_death_used'], 'long', 'Fighter',
          min_level=18, subclass='Samurai'),
    _rest('Unwavering Mark recovered', ['unwavering_mark_used'], 'long', 'Fighter',
          min_level=3, subclass='Cavalier'),
    _rest('Warding Maneuver recovered', ['warding_maneuver_used'], 'long', 'Fighter',
          min_level=7, subclass='Cavalier'),
    _rest('Unleash Incarnation recovered', ['unleash_incarnation_used'], 'long', 'Fighter',
          min_level=3, subclass='Echo Knight'),
    # The only Echo Knight pool that comes back on a short rest.
    _rest('Shadow Martyr recovered', ['shadow_martyr_used'], 'short', 'Fighter',
          min_level=10, subclass='Echo Knight'),
    _rest('Reclaim Potential recovered', ['reclaim_potential_used'], 'long', 'Fighter',
          min_level=15, subclass='Echo Knight'),
    # The Psionic Energy POOL is long-rest only. What a short rest returns are the two
    # once-per-rest charges: the bonus action that regains one die, and the free use of
    # Telekinetic Movement. (Psi-Powered Leap / Bulwark of Force free uses are long-rest.)
    _rest('Psionic Energy dice recovered', ['psionic_energy_used'], 'long', 'Fighter',
          min_level=3, subclass='Psi Warrior'),
    _rest('Psionic Energy die regain & Telekinetic Movement recovered',
          ['psionic_energy_regain_used', 'telekinetic_movement_used'], 'short', 'Fighter',
          min_level=3, subclass='Psi Warrior'),
    _rest('Psi-Powered Leap recovered', ['psi_powered_leap_used'], 'long', 'Fighter',
          min_level=7, subclass='Psi Warrior'),
    _rest('Bulwark of Force recovered', ['bulwark_of_force_used'], 'long', 'Fighter',
          min_level=15, subclass='Psi Warrior'),
    # Giant's Might is also an ACTIVE EFFECT — a rest resets the charge but deliberately leaves
    # `active_effects` alone: a 1-minute effect ended long before the rest, and clearing it
    # would imply a duration the app doesn't model.
    _rest("Giant's Might recovered", ['giants_might_used'], 'long', 'Fighter',
          min_level=3, subclass='Rune Knight'),
    _rest('Runic Shield recovered', ['runic_shield_used'], 'long', 'Fighter',
          min_level=7, subclass='Rune Knight'),
    # The only Rune Knight resource that returns on a short rest.
    _rest('Channel Rune uses recovered', _CHANNEL_RUNE_KEYS, 'short', 'Fighter',
          min_level=3, subclass='Rune Knight'),

    # ── Other classes ──
    _rest('Rages recovered', ['rages_used'], 'long', 'Barbarian'),
    _rest('Bardic Inspiration recovered', ['bardic_inspiration_used'], 'long', 'Bard'),
    # Font of Inspiration: a 5e Bard gets it back on a short rest from 5th; 2024 from 1st.
    _rest('Bardic Inspiration recovered', ['bardic_inspiration_used'], 'short', 'Bard',
          min_level=5, edition='5e'),
    _rest('Bardic Inspiration recovered', ['bardic_inspiration_used'], 'short', 'Bard',
          edition='5.5e'),
    _rest('Channel Divinity recovered', ['channel_divinity_used'], 'long', ('Cleric', 'Paladin')),
    _rest('Channel Divinity recovered', ['channel_divinity_used'], 'short', ('Cleric', 'Paladin'),
          edition='5.5e'),
    _rest('Wild Shape recovered', ['wild_shape_used'], 'long', 'Druid'),
    _rest('Ki points recovered', ['ki_used'], 'short', 'Monk', edition='5e'),
    _rest('Focus points recovered', ['ki_used'], 'short', 'Monk', edition='5.5e'),
    # Uncanny Metabolism's own 1/long-rest charge (see _INITIATIVE_RESOURCES).
    _rest('Uncanny Metabolism recovered', ['uncanny_metabolism_used'], 'long', 'Monk',
          edition='5.5e', only_if_spent=True),
    _rest('Lay on Hands & Divine Sense recovered', ['lay_on_hands_used', 'divine_sense_used'],
          'long', 'Paladin'),
    _rest('Sorcery points recovered', ['sorcery_points_used'], 'long', 'Sorcerer'),
    _rest('Innate Sorcery refreshed', ['innate_sorcery_used'], 'long', 'Sorcerer',
          edition='5.5e', value=False),
    _rest('Pact magic slots recovered', ['pact_slots_used'], 'short', 'Warlock'),
    _rest('Magical Cunning refreshed', ['magical_cunning_used'], 'long', 'Warlock',
          edition='5.5e', value=False),
    _rest('Arcane Recovery refreshed', ['arcane_recovery_used'], 'short', 'Wizard', value=False),
    _rest('Memorize Spell refreshed', ['memorize_spell_used'], 'long', 'Wizard',
          edition='5.5e', value=False),
    _rest('Flash of Genius recovered', ['flash_of_genius_used'], 'long', 'Artificer'),
    # Prepare-casters: a long rest unlocks today's committed spell preparation.
    _rest('Spell preparation unlocked', ['prepared_locked'], 'long',
          ('Cleric', 'Druid', 'Paladin', 'Ranger', 'Wizard', 'Artificer'), value=False),
    # Divination Wizard (5e "School of Divination", 2024 "Diviner"): Portent dice are re-rolled
    # after a long rest, so the stored rolls are cleared.
    _rest('Portent dice cleared — roll anew', ['portent_rolls'], 'long', None,
          subclass=('School of Divination', 'Diviner'), value=[], only_if_spent=True),
]

# Subclasses that cast from `spell_slots` although their class isn't in _SPELLCASTING_CLASSES.
_SUBCLASS_CASTERS = {('Fighter', 'Eldritch Knight')}


def _matches(spec_value, actual) -> bool:
    """A row field of None matches anything; a tuple matches any member."""
    if spec_value is None:
        return True
    if isinstance(spec_value, (tuple, list, set)):
        return actual in spec_value
    return spec_value == actual


def _rest_specs_for(char: Character, cd: dict, rest_type: str, edition: str):
    """The _REST_RESOURCES rows this rest recovers for this character."""
    level = char.level or 1
    for spec in _REST_RESOURCES:
        if spec['recharge'] == 'long' and rest_type != 'long':
            continue
        if not _matches(spec['char_class'], char.char_class):
            continue
        if not _matches(spec['subclass'], cd.get('subclass')):
            continue
        if spec['edition'] and spec['edition'] != edition:
            continue
        if level < spec['min_level']:
            continue
        yield spec


def _is_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _hp_bonus_per_level(char: Character, cd: dict) -> int:
    """Passive max-HP bonuses that scale with level. Mirrors frontend getHpBonusesPerLevel."""
    bonus = 0
    if char.char_class == 'Sorcerer' and cd.get('subclass') in ('Draconic Bloodline', 'Draconic Sorcery'):
        bonus += 1  # Draconic Resilience
    if 'Dwarven Toughness' in (cd.get('race_traits') or []):
        bonus += 1
    for feat in (cd.get('feats') or []):
        name = feat if isinstance(feat, str) else (feat or {}).get('name')
        if name == 'Tough':
            bonus += 2
            break
    return bonus


def _effective_max_hp(char: Character, cd: dict) -> int | None:
    """The character's real maximum HP, or None when the sheet stores no HP at all.

    `character_data.hp_rolls` holds only the hit-die results; Constitution and the per-level
    bonuses are layered on at read time, so no stored number IS the max. A long rest used to
    read `hp_max`, which nothing has written since the hp_rolls model shipped — every character
    created after that silently kept their wounds through a long rest.

    Mirrors frontend combatBonuses.effectiveMaxHp; both run tests/fixtures/max_hp_cases.json,
    so the two cannot drift. Legacy characters stored `hp_max` with Constitution baked in.
    """
    level = char.level or 1
    con = _ability_mod(char.constitution)
    rolls, legacy = cd.get('hp_rolls'), cd.get('hp_max')
    if _is_number(rolls):
        base = rolls
    elif _is_number(legacy):
        base = legacy - level * con
    else:
        return None
    total = base + con * level + _hp_bonus_per_level(char, cd) * level
    return int(max(level, total))


def _reset_spell_slots(cd: dict) -> dict:
    return {
        str(sl): {'total': data.get('total', 0), 'used': 0}
        for sl, data in (cd.get('spell_slots') or {}).items()
        if isinstance(data, dict)
    }


def _compute_rest_patch(char: Character, rest_type: str, edition: str) -> tuple[dict, list]:
    """Return (character_data_patch, human_readable_changes)."""
    cd = char.character_data or {}
    cls = char.char_class
    level = char.level or 1
    patch: dict = {}
    changes: list = []

    if rest_type == 'long':
        max_hp = _effective_max_hp(char, cd)
        if max_hp is not None:
            patch['current_hp'] = max_hp
            changes.append(f'HP restored to {max_hp}')
        patch['temp_hp'] = 0

        hit_dice_used = cd.get('hit_dice_used', 0)
        # RAW: a long rest recovers spent Hit Dice equal to half your total, rounded
        # down (minimum 1) — NOT ceil, which over-recovers by one at odd levels.
        recovered_hd = max(1, level // 2)
        patch['hit_dice_used'] = max(0, hit_dice_used - recovered_hd)
        if hit_dice_used > 0:
            changes.append(f'Hit dice recovered (up to {recovered_hd})')

        if cls in _SPELLCASTING_CLASSES or (cls, cd.get('subclass')) in _SUBCLASS_CASTERS:
            patch['spell_slots'] = _reset_spell_slots(cd)
            changes.append('Spell slots recovered')

    # ── Class / subclass pools — one row each in _REST_RESOURCES ──
    for spec in _rest_specs_for(char, cd, rest_type, edition):
        spent = any(cd.get(key) for key in spec['keys'])
        for key in spec['keys']:
            # Copy the reset value: a list default must not be shared between characters.
            patch[key] = list(spec['value']) if isinstance(spec['value'], list) else spec['value']
        if spec['only_if_spent'] and not spent:
            continue
        # Two rows can describe one resource (a Bard's Inspiration has a long row and a short
        # one, and a long rest matches both) — say it once.
        if spec['message'] not in changes:
            changes.append(spec['message'])

    # ── Racial / subracial rest resources (both rest types) ──
    traits = set(cd.get('race_traits') or [])
    racial_recovered = False
    for trait, key, recharge, min_level in _RACIAL_REST_RESOURCES:
        if trait not in traits or level < min_level:
            continue
        recharges_now = recharge == 'short' or rest_type == 'long'
        if not recharges_now:
            continue
        if cd.get(key):
            racial_recovered = True
        patch[key] = 0
    if racial_recovered:
        changes.append('Racial features recovered')

    # ── Feat resource pools (Lucky, Martial Adept, …) — from snapshotted feat effects ──
    feat_recovered = False
    for feat in (cd.get('feats') or []):
        if not isinstance(feat, dict):
            continue
        for eff in (feat.get('effects') or []):
            if not isinstance(eff, dict) or eff.get('kind') != 'resource' or not eff.get('key'):
                continue
            recharges_now = eff.get('recharge') == 'short' or rest_type == 'long'
            if not recharges_now:
                continue
            used_key = f"{eff['key']}_used"
            if cd.get(used_key):
                feat_recovered = True
            patch[used_key] = 0
    if feat_recovered:
        changes.append('Feat resources recovered')

    # ── Feat spell-grant free casts (Magic Initiate, …) — 1 per long rest ──
    if rest_type == 'long':
        freecast_recovered = False
        for feat in (cd.get('feats') or []):
            if not isinstance(feat, dict):
                continue
            sg = (feat.get('choices') or {}).get('spell_grant')
            if not isinstance(sg, dict):
                continue
            # New snapshots store a `free_casts` list; tolerate an older singular `free_cast`.
            fc_names = sg.get('free_casts') or ([sg['free_cast']] if sg.get('free_cast') else [])
            for name in fc_names:
                used_key = _feat_freecast_used_key(name)
                if cd.get(used_key):
                    freecast_recovered = True
                patch[used_key] = 0
        if freecast_recovered:
            changes.append('Feat spell casts recovered')

    if rest_type == 'short' and not changes:
        changes.append('No short rest resources to recover')

    return patch, changes


def rest_resources_contract() -> dict:
    """The parts of the rest tables the FRONTEND also declares, as plain data.

    Committed as tests/fixtures/rest_resources_contract.json and read by the frontend's
    restResourceContract.test.js, which checks every class-config rest row and the racial table
    against it. That is what turns "keep the two in sync" from a comment into a failing test."""
    def as_list(value):
        if value is None:
            return None
        return sorted(value) if isinstance(value, (tuple, list, set)) else [value]

    return {
        'class_resources': [
            {
                'keys': spec['keys'],
                'recharge': spec['recharge'],
                'char_class': as_list(spec['char_class']),
                'subclass': as_list(spec['subclass']),
                'edition': spec['edition'],
                'min_level': spec['min_level'],
            }
            for spec in _REST_RESOURCES
        ],
        'racial_resources': [
            {'trait': trait, 'key': key, 'recharge': recharge, 'min_level': min_level}
            for trait, key, recharge, min_level in _RACIAL_REST_RESOURCES
        ],
    }


def apply_rest(
    db: Session,
    campaign_id: int,
    rest_data: RestRequest,
    user_id: int,
    is_admin: bool,
) -> RestResponse:
    membership = _get_membership(db, campaign_id, user_id)
    if not membership or (membership.role != 'gm' and not is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the GM can apply rests")

    # Previously an unrecognised rest_type silently patched nothing and reported success.
    if rest_data.rest_type not in _REST_TYPES:
        raise HTTPException(
            status_code=422,  # starlette renamed its 422 constant; the literal is version-proof
            detail=f"rest_type must be one of {sorted(_REST_TYPES)}",
        )

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

    characters = db.query(Character).filter(
        Character.id.in_(rest_data.character_ids),
        Character.campaign_id == campaign_id,
    ).all()

    applied_to = []
    for char in characters:
        if rest_data.rest_type == 'initiative':
            opted_in = set((rest_data.opt_ins or {}).get(str(char.id), []))
            patch, changes = _compute_initiative_patch(char, campaign.edition, opted_in)
        else:
            patch, changes = _compute_rest_patch(char, rest_data.rest_type, campaign.edition)
        if patch and not rest_data.dry_run:
            char_data = dict(char.character_data or {})
            char_data.update(patch)
            char.character_data = char_data
        applied_to.append(RestResultItem(character_id=char.id, name=char.name, changes=changes))

    if not rest_data.dry_run:
        db.commit()
    return RestResponse(rest_type=rest_data.rest_type, applied_to=applied_to)
