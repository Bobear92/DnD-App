from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class CharacterClass(Base):
    __tablename__ = "character_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    edition = Column(String(10), nullable=False)  # "5e" or "5.5e"
    flavor_text = Column(Text, nullable=False)
    hit_die = Column(Integer, nullable=False)  # 6, 8, 10, 12
    primary_ability = Column(String(100), nullable=False)
    spellcasting_ability = Column(String(50), nullable=True)  # null = non-caster
    saving_throws = Column(JSON, nullable=False)
    armor_proficiencies = Column(JSON, nullable=False)
    weapon_proficiencies = Column(JSON, nullable=False)
    tool_proficiencies = Column(JSON, nullable=False)
    skill_count = Column(Integer, nullable=False)
    skills_available = Column(JSON, nullable=False)

    owner_type = Column(SQLEnum(OwnerType), nullable=False)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    features = relationship(
        "ClassFeature",
        back_populates="char_class",
        order_by="ClassFeature.level, ClassFeature.id",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<CharacterClass(id={self.id}, name='{self.name}', edition='{self.edition}')>"


class ClassFeature(Base):
    __tablename__ = "class_features"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(
        Integer,
        ForeignKey("character_classes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level = Column(Integer, nullable=False)
    feature_name = Column(String(200), nullable=False)
    feature_description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    char_class = relationship("CharacterClass", back_populates="features")

    def __repr__(self):
        return f"<ClassFeature(class_id={self.class_id}, level={self.level}, name='{self.feature_name}')>"
