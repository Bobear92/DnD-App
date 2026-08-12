from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List

from .models import Encounter, EncounterCombatant
from .schemas import (
    EncounterCreate, EncounterUpdate, EncounterResponse, EncounterListItem,
    CombatantAdd, CombatantUpdate, CombatantResponse,
)
from gm.campaigns.models import CampaignMember
from players.characters.models import Character


# ── Auth helpers ──────────────────────────────────────────────────────────────
#
# Encounters are GM-only in V1 — including reads. There is no player surface and no
# is_visible_to_players flag: the GM builds the order, and what a player sees is the effect on
# their own sheet. Give players a view later by adding the flag, not by loosening this.

def _require_gm(db: Session, campaign_id: int, user_id: int) -> None:
    member = db.query(CampaignMember).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.user_id == user_id,
        CampaignMember.role == "gm",
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the GM can manage encounters")


def _get_encounter(db: Session, campaign_id: int, encounter_id: int) -> Encounter:
    enc = db.query(Encounter).filter(
        Encounter.id == encounter_id,
        Encounter.campaign_id == campaign_id,
    ).first()
    if not enc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Encounter not found")
    return enc


# ── Serialization ─────────────────────────────────────────────────────────────

def _combatant_rows(db: Session, encounter_id: int) -> List[CombatantResponse]:
    """Combatants in initiative order — highest first, unrolled last, ties broken by name so the
    order is stable between requests. Sorted here so every caller gets the same order."""
    rows = db.query(EncounterCombatant, Character).join(
        Character, Character.id == EncounterCombatant.character_id
    ).filter(EncounterCombatant.encounter_id == encounter_id).all()

    ordered = sorted(
        rows,
        key=lambda r: (
            r[0].initiative is None,          # unrolled sink to the bottom
            -(r[0].initiative or 0),          # then highest initiative first
            (r[1].name or '').lower(),
        ),
    )
    return [
        CombatantResponse(
            id=c.id,
            encounter_id=c.encounter_id,
            character_id=c.character_id,
            initiative=c.initiative,
            character_name=char.name,
            char_class=char.char_class,
            level=char.level,
            created_at=c.created_at,
        )
        for c, char in ordered
    ]


def _encounter_response(db: Session, enc: Encounter) -> EncounterResponse:
    return EncounterResponse(
        id=enc.id,
        campaign_id=enc.campaign_id,
        name=enc.name,
        combatants=_combatant_rows(db, enc.id),
        created_at=enc.created_at,
        updated_at=enc.updated_at,
    )


# ── Encounters ────────────────────────────────────────────────────────────────

def create_encounter(db: Session, campaign_id: int, data: EncounterCreate, user_id: int) -> EncounterResponse:
    _require_gm(db, campaign_id, user_id)

    enc = Encounter(campaign_id=campaign_id, name=data.name)
    db.add(enc)
    db.flush()

    for character_id in dict.fromkeys(data.character_ids):  # de-dupe, keep order
        _validate_character(db, campaign_id, character_id)
        db.add(EncounterCombatant(encounter_id=enc.id, character_id=character_id))

    db.commit()
    db.refresh(enc)
    return _encounter_response(db, enc)


def list_encounters(db: Session, campaign_id: int, user_id: int) -> List[EncounterListItem]:
    _require_gm(db, campaign_id, user_id)

    encounters = db.query(Encounter).filter(
        Encounter.campaign_id == campaign_id
    ).order_by(Encounter.created_at.desc(), Encounter.id.desc()).all()

    return [
        EncounterListItem(
            id=e.id,
            campaign_id=e.campaign_id,
            name=e.name,
            combatant_count=db.query(EncounterCombatant).filter(
                EncounterCombatant.encounter_id == e.id
            ).count(),
            created_at=e.created_at,
            updated_at=e.updated_at,
        )
        for e in encounters
    ]


def get_encounter(db: Session, campaign_id: int, encounter_id: int, user_id: int) -> EncounterResponse:
    _require_gm(db, campaign_id, user_id)
    return _encounter_response(db, _get_encounter(db, campaign_id, encounter_id))


def update_encounter(
    db: Session, campaign_id: int, encounter_id: int, data: EncounterUpdate, user_id: int
) -> EncounterResponse:
    _require_gm(db, campaign_id, user_id)
    enc = _get_encounter(db, campaign_id, encounter_id)

    if data.name is not None:
        enc.name = data.name

    db.commit()
    db.refresh(enc)
    return _encounter_response(db, enc)


def delete_encounter(db: Session, campaign_id: int, encounter_id: int, user_id: int) -> None:
    _require_gm(db, campaign_id, user_id)
    enc = _get_encounter(db, campaign_id, encounter_id)
    db.delete(enc)
    db.commit()


# ── Combatants ────────────────────────────────────────────────────────────────

def _validate_character(db: Session, campaign_id: int, character_id: int) -> Character:
    """A combatant must be a character in THIS campaign — otherwise an encounter could pull in
    (and later patch resources on) a character from a campaign the GM doesn't run."""
    char = db.query(Character).filter(
        Character.id == character_id,
        Character.campaign_id == campaign_id,
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found in this campaign",
        )
    return char


def add_combatant(
    db: Session, campaign_id: int, encounter_id: int, data: CombatantAdd, user_id: int
) -> CombatantResponse:
    _require_gm(db, campaign_id, user_id)
    _get_encounter(db, campaign_id, encounter_id)
    char = _validate_character(db, campaign_id, data.character_id)

    existing = db.query(EncounterCombatant).filter(
        EncounterCombatant.encounter_id == encounter_id,
        EncounterCombatant.character_id == data.character_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That character is already in this encounter",
        )

    combatant = EncounterCombatant(
        encounter_id=encounter_id,
        character_id=data.character_id,
        initiative=data.initiative,
    )
    db.add(combatant)
    db.commit()
    db.refresh(combatant)

    return CombatantResponse(
        id=combatant.id,
        encounter_id=combatant.encounter_id,
        character_id=combatant.character_id,
        initiative=combatant.initiative,
        character_name=char.name,
        char_class=char.char_class,
        level=char.level,
        created_at=combatant.created_at,
    )


def update_combatant(
    db: Session, campaign_id: int, encounter_id: int, combatant_id: int,
    data: CombatantUpdate, user_id: int,
) -> EncounterResponse:
    """Set (or clear) one combatant's initiative. Returns the whole encounter because changing a
    value re-sorts the order — the caller always wants the new order, never just the one row."""
    _require_gm(db, campaign_id, user_id)
    enc = _get_encounter(db, campaign_id, encounter_id)

    combatant = db.query(EncounterCombatant).filter(
        EncounterCombatant.id == combatant_id,
        EncounterCombatant.encounter_id == encounter_id,
    ).first()
    if not combatant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Combatant not found")

    combatant.initiative = data.initiative
    db.commit()
    return _encounter_response(db, enc)


def remove_combatant(
    db: Session, campaign_id: int, encounter_id: int, combatant_id: int, user_id: int
) -> None:
    _require_gm(db, campaign_id, user_id)
    _get_encounter(db, campaign_id, encounter_id)

    combatant = db.query(EncounterCombatant).filter(
        EncounterCombatant.id == combatant_id,
        EncounterCombatant.encounter_id == encounter_id,
    ).first()
    if not combatant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Combatant not found")

    db.delete(combatant)
    db.commit()
