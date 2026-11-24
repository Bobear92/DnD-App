import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from shared.dependencies import require_campaign_query_member
from shared.file_storage import LocalStorage, get_storage
from auth.routes import router as auth_router
from gm import campaigns_router, npcs_router, loot_tables_router, locations_router, calendar_router, timeline_router, session_notes_router, encounters_router
from players.characters.routes import router as characters_router
from players.races import router as races_router
from players.backgrounds import router as backgrounds_router
from players.feats import router as feats_router
from players.classes import router as classes_router
from shared.encyclopedia import bestiary_router, spells_router, armor_router, weapons_router, adventuring_gear_router, potions_router, food_drink_router, magic_items_router

# No Base.metadata.create_all() here: ALEMBIC OWNS THE SCHEMA, in dev and production alike. Creating
# tables at import let a model ship without a migration (it worked locally, then broke a fresh DB), and
# a server started against an empty DB before `alembic upgrade head` would create tables alembic then
# fails on. start.sh and scripts/restart-backend.sh run the migrations first; tests build their own
# schema in conftest.py. CI's `alembic check` fails if a model and the migrations disagree.

def docs_routes(enabled: bool) -> dict:
    """/docs, /redoc and /openapi.json exist only when API_DOCS=true (local dev). Production leaves it unset."""
    if enabled:
        return {"docs_url": "/docs", "redoc_url": "/redoc", "openapi_url": "/openapi.json"}
    return {"docs_url": None, "redoc_url": None, "openapi_url": None}


app = FastAPI(title="D&D RPG API", **docs_routes(settings.api_docs))

# CORS middleware for frontend — origins come from ALLOWED_ORIGINS (config.py), defaulting to the
# local dev frontends. Never "*": with allow_credentials that would be rejected by browsers anyway.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploaded files (shared/file_storage.py). With local storage the API serves them itself at /uploads;
# with R2 (production) the browser loads them from the bucket's public URL and this mount is absent.
# get_storage() also fails fast here if STORAGE_BACKEND=r2 is missing its credentials.
_storage = get_storage()
if isinstance(_storage, LocalStorage):
    os.makedirs(_storage.root, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=_storage.root), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(campaigns_router)
app.include_router(characters_router)
app.include_router(npcs_router)
app.include_router(loot_tables_router)
app.include_router(locations_router)
app.include_router(calendar_router)
app.include_router(timeline_router)
app.include_router(session_notes_router)
app.include_router(encounters_router)

# Compendium routers: `?campaign_id=N` merges campaign N's homebrew into a list, so only N's members may pass it.
# (Detail routes check the row's owner with check_content_read.) Tested in tests/test_security_leaks.py.
COMPENDIUM_ROUTERS = [
    races_router, backgrounds_router, feats_router, classes_router,
    bestiary_router, spells_router, armor_router, weapons_router,
    adventuring_gear_router, potions_router, food_drink_router, magic_items_router,
]
for _router in COMPENDIUM_ROUTERS:
    app.include_router(_router, dependencies=[Depends(require_campaign_query_member)])

@app.get("/")
def read_root():
    return {"message": "D&D RPG API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
