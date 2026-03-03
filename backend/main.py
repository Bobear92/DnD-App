from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from shared.database import engine, Base
from auth.routes import router as auth_router
from gm.campaigns.routes import router as campaigns_router

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

@app.get("/")
def read_root():
    return {"message": "D&D RPG API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}