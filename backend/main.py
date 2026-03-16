from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.database import engine, Base
from auth.routes import router as auth_router
from gm import campaigns_router, loot_tables_router
from players.characters.routes import router as characters_router
from shared.encyclopedia import bestiary_router, spells_router, armor_router, weapons_router, adventuring_gear_router, potions_router, food_drink_router, magic_items_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="D&D RPG API")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(campaigns_router)
app.include_router(characters_router)
app.include_router(loot_tables_router)
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