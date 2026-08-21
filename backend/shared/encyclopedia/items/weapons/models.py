from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from shared.database import Base
from shared.enums import OwnerType


class Weapon(Base):
    __tablename__ = "weapons"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(200), nullable=False, index=True)
    weapon_category = Column(String(50), nullable=False)
    weapon_type = Column(String(50), nullable=False)

    damage = Column(String(50), nullable=False)
    damage_type = Column(String(50), nullable=False)

    properties = Column(Text)

    # The distance band at which this weapon attacks: normal range, then long range (attacks
    # beyond normal but within long are at disadvantage). Two INTEGERS rather than a "150/600"
    # string so consumers never parse prose — the same call the spells table's free-text `range`
    # got wrong and that `docs/spell-upcast-review.md` exists to document.
    #
    # NULL for a weapon with no band. A melee weapon's 5-ft "range" is REACH, a different concept
    # (a Reach weapon's is 10 ft), so it is deliberately not stored here. A thrown melee weapon
    # DOES get a band — its throw range — because that is a real distance attack.
    # `range_long` alone may be NULL for a weapon with a single distance and no falloff.
    range_normal = Column(Integer, nullable=True)
    range_long = Column(Integer, nullable=True)

    cost = Column(String(50), nullable=False)
    weight = Column(String(50), nullable=False)

    description = Column(Text)

    owner_type = Column(SQLEnum(OwnerType), nullable=False, default=OwnerType.system)
    owner_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Weapon(id={self.id}, name='{self.name}', type='{self.weapon_type}')>"
