from .npcs import router as npcs_router
from .locations import router as locations_router
from .calendar import router as calendar_router
from .timeline import router as timeline_router

__all__ = ["npcs_router", "locations_router", "calendar_router", "timeline_router"]