from .bestiary import router as bestiary_router
from .spells import router as spells_router
from .items import armor_router, weapons_router, adventuring_gear_router, potions_router

__all__ = ["bestiary_router", "spells_router", "armor_router", "weapons_router", "adventuring_gear_router", "potions_router"]