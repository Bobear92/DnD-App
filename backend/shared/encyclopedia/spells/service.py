from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from fastapi import HTTPException, status
from typing import List, Optional

from .models import Spell
from .schemas import SpellCreate, SpellUpdate
from shared.enums import OwnerType

# A 2024 campaign reads 5.5e text where it exists and falls back to the 5e row of the
# same name otherwise, so a 2024 campaign still sees the whole compendium while 5.5e
# text is authored spell by spell. A 5e campaign never sees 5.5e rows.
EDITION_FALLBACKS = {
    "5.5e": ["5.5e", "5e"],
    "2024": ["5.5e", "5e"],
}


def _edition_candidates(edition: Optional[str]) -> Optional[List[str]]:
    if not edition:
        return None
    return EDITION_FALLBACKS.get(edition, [edition])


def create_spell(db: Session, spell_data: SpellCreate) -> Spell:
    existing = db.query(Spell).filter(
        Spell.name == spell_data.name,
        Spell.edition == spell_data.edition,
        Spell.owner_type == spell_data.owner_type,
        Spell.owner_id == spell_data.owner_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Spell '{spell_data.name}' already exists in this scope")
    db_spell = Spell(**spell_data.model_dump())
    db.add(db_spell)
    db.commit()
    db.refresh(db_spell)
    return db_spell


def get_all_spells(db: Session, campaign_id: Optional[int] = None,
                   edition: Optional[str] = None) -> List[Spell]:
    editions = _edition_candidates(edition)

    query = db.query(Spell)
    if editions:
        query = query.filter(Spell.edition.in_(editions))
    if campaign_id:
        query = query.filter(or_(
            Spell.owner_type == OwnerType.system,
            and_(Spell.owner_type == OwnerType.campaign, Spell.owner_id == campaign_id),
        ))
    else:
        query = query.filter(Spell.owner_type == OwnerType.system)

    # Shadowing: a campaign entry beats a system one, and (when an edition was asked
    # for) that edition's own text beats the 5e text it would otherwise fall back to.
    exact = editions[0] if editions else None
    best = {}
    for spell in query.all():
        # With no edition filter, each edition of a spell stands as its own entry.
        key = spell.name if editions else (spell.name, spell.edition)
        rank = (
            spell.owner_type == OwnerType.campaign,
            bool(exact) and spell.edition == exact,
        )
        if key not in best or rank > best[key][0]:
            best[key] = (rank, spell)

    return sorted((s for _, s in best.values()), key=lambda s: (s.level, s.name))


def get_spell_by_id(db: Session, spell_id: int) -> Spell:
    db_spell = db.query(Spell).filter(Spell.id == spell_id).first()
    if not db_spell:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Spell {spell_id} not found")
    return db_spell


def update_spell(db: Session, spell_id: int, spell_data: SpellUpdate) -> Spell:
    db_spell = get_spell_by_id(db, spell_id)
    update_data = spell_data.model_dump(exclude_unset=True)

    new_name = update_data.get("name", db_spell.name)
    new_edition = update_data.get("edition", db_spell.edition)
    if new_name != db_spell.name or new_edition != db_spell.edition:
        existing = db.query(Spell).filter(
            Spell.name == new_name,
            Spell.edition == new_edition,
            Spell.owner_type == db_spell.owner_type,
            Spell.owner_id == db_spell.owner_id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Spell '{new_name}' already exists in this scope")

    for field, value in update_data.items():
        setattr(db_spell, field, value)
    db.commit()
    db.refresh(db_spell)
    return db_spell


def delete_spell(db: Session, spell_id: int) -> dict:
    db_spell = get_spell_by_id(db, spell_id)
    db.delete(db_spell)
    db.commit()
    return {"message": f"Spell '{db_spell.name}' deleted successfully"}
