from .armor import router as armor_router
from .weapons import router as weapons_router
from .adventuring_gear import router as adventuring_gear_router
from .potions import router as potions_router

__all__ = ["armor_router", "weapons_router", "adventuring_gear_router", "potions_router"]