from .armor import router as armor_router
from .weapons import router as weapons_router
from .adventuring_gear import router as adventuring_gear_router
from .potions import router as potions_router
from .food_drink import router as food_drink_router
from .magic_items import router as magic_items_router

__all__ = ["armor_router", "weapons_router", "adventuring_gear_router", "potions_router", "food_drink_router", "magic_items_router"]