import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
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

app = FastAPI(title="D&D RPG API")

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
app.include_router(races_router)
app.include_router(backgrounds_router)
app.include_router(feats_router)
app.include_router(classes_router)
app.include_router(npcs_router)
app.include_router(loot_tables_router)
app.include_router(locations_router)
app.include_router(calendar_router)
app.include_router(timeline_router)
app.include_router(session_notes_router)
app.include_router(encounters_router)
app.include_router(bestiary_router)
app.include_router(spells_router)
app.include_router(armor_router)
app.include_router(weapons_router)
app.include_router(adventuring_gear_router)
app.include_router(potions_router)
app.include_router(food_drink_router)
app.include_router(magic_items_router)

@app.get("/")
def read_root():
    return {"message": "D&D RPG API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
