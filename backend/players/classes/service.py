from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from . import models, schemas
from shared.enums import OwnerType
from shared.exceptions import NotFoundException, ForbiddenException


def get_all_classes(
    db: Session,
    edition: str = None,
    campaign_id: int = None,
    name: str = None,
):
    query = db.query(models.CharacterClass)

    if edition:
        query = query.filter(models.CharacterClass.edition == edition)
    if name:
        query = query.filter(models.CharacterClass.name == name)

    if campaign_id:
        query = query.filter(
            or_(
                models.CharacterClass.owner_type == OwnerType.system,
                and_(
                    models.CharacterClass.owner_type == OwnerType.campaign,
                    models.CharacterClass.owner_id == campaign_id,
                ),
            )
        )
    else:
        query = query.filter(models.CharacterClass.owner_type == OwnerType.system)

    all_classes = query.all()

    # Campaign override wins: if a campaign class exists with the same name+edition
    # as a system class, only return the campaign version.
    if campaign_id:
        campaign_keys = {
            (c.name, c.edition)
            for c in all_classes
            if c.owner_type == OwnerType.campaign
        }
        all_classes = [
            c
            for c in all_classes
            if c.owner_type == OwnerType.campaign
            or (c.name, c.edition) not in campaign_keys
        ]

    return sorted(all_classes, key=lambda c: c.name)


def get_class_by_id(db: Session, class_id: int):
    cls = db.query(models.CharacterClass).filter(models.CharacterClass.id == class_id).first()
    if not cls:
        raise NotFoundException(f"Class with id {class_id} not found")
    return cls


def create_class(db: Session, data: schemas.ClassCreate, user_id: int, is_admin: bool):
    if not is_admin:
        raise ForbiddenException("Only administrators can create system classes")

    cls = models.CharacterClass(
        name=data.name,
        edition=data.edition,
        flavor_text=data.flavor_text,
        hit_die=data.hit_die,
        primary_ability=data.primary_ability,
        spellcasting_ability=data.spellcasting_ability,
        saving_throws=data.saving_throws,
        armor_proficiencies=data.armor_proficiencies,
        weapon_proficiencies=data.weapon_proficiencies,
        tool_proficiencies=data.tool_proficiencies,
        skill_count=data.skill_count,
        skills_available=data.skills_available,
        owner_type=OwnerType.system,
        owner_id=None,
    )
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls


def update_class(db: Session, class_id: int, data: schemas.ClassUpdate, user_id: int, is_admin: bool):
    cls = get_class_by_id(db, class_id)

    if cls.owner_type == OwnerType.system and not is_admin:
        raise ForbiddenException("Only administrators can update system classes")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cls, field, value)

    db.commit()
    db.refresh(cls)
    return cls


def delete_class(db: Session, class_id: int, user_id: int, is_admin: bool):
    cls = get_class_by_id(db, class_id)

    if cls.owner_type == OwnerType.system and not is_admin:
        raise ForbiddenException("Only administrators can delete system classes")

    db.delete(cls)
    db.commit()
    return {"message": f"Class '{cls.name}' ({cls.edition}) deleted successfully"}


def add_feature(db: Session, class_id: int, data: schemas.ClassFeatureCreate, user_id: int, is_admin: bool):
    cls = get_class_by_id(db, class_id)
    if cls.owner_type == OwnerType.system and not is_admin:
        raise ForbiddenException("Only administrators can modify system class features")

    feature = models.ClassFeature(
        class_id=class_id,
        level=data.level,
        feature_name=data.feature_name,
        feature_description=data.feature_description,
    )
    db.add(feature)
    db.commit()
    db.refresh(feature)
    return feature


def update_feature(db: Session, feature_id: int, data: schemas.ClassFeatureUpdate, user_id: int, is_admin: bool):
    feature = db.query(models.ClassFeature).filter(models.ClassFeature.id == feature_id).first()
    if not feature:
        raise NotFoundException(f"Feature with id {feature_id} not found")

    cls = get_class_by_id(db, feature.class_id)
    if cls.owner_type == OwnerType.system and not is_admin:
        raise ForbiddenException("Only administrators can modify system class features")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(feature, field, value)

    db.commit()
    db.refresh(feature)
    return feature


def delete_feature(db: Session, feature_id: int, user_id: int, is_admin: bool):
    feature = db.query(models.ClassFeature).filter(models.ClassFeature.id == feature_id).first()
    if not feature:
        raise NotFoundException(f"Feature with id {feature_id} not found")

    cls = get_class_by_id(db, feature.class_id)
    if cls.owner_type == OwnerType.system and not is_admin:
        raise ForbiddenException("Only administrators can modify system class features")

    db.delete(feature)
    db.commit()
    return {"message": "Feature deleted"}
