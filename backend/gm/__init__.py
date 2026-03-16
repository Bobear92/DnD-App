from .campaigns import router as campaigns_router, npcs_router
from .tools import loot_tables_router

__all__ = ["campaigns_router", "npcs_router", "loot_tables_router"]