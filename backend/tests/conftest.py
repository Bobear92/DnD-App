import os

# Override DATABASE_URL before any app code is imported so the test DB is used
# for engine creation, Base.metadata.create_all in main.py, and all queries.
from dotenv import load_dotenv

load_dotenv()  # load backend/.env for DATABASE_URL and SECRET_KEY
_dev_url = os.environ.get("DATABASE_URL", "")
os.environ["DATABASE_URL"] = _dev_url.replace("dnd_app_dev", "dnd_app_test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from shared.database import Base, get_db
from main import app

_engine = create_engine(os.environ["DATABASE_URL"])
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

# Tables with circular FKs that must be nullified before deletion/drop.
_CIRCULAR_FK_NULLIFIERS = [
    "UPDATE campaign_calendars SET current_era_id = NULL",
]


@pytest.fixture(scope="session", autouse=True)
def _create_tables():
    Base.metadata.create_all(bind=_engine)
    yield
    # DROP all tables at once with CASCADE to bypass circular FK sort issues.
    table_names = ", ".join(f'"{t}"' for t in Base.metadata.tables.keys())
    with _engine.begin() as conn:
        conn.execute(text(f"DROP TABLE IF EXISTS {table_names} CASCADE"))


@pytest.fixture(autouse=True)
def _clean_tables(_create_tables):
    yield
    with _engine.begin() as conn:
        for stmt in _CIRCULAR_FK_NULLIFIERS:
            conn.execute(text(stmt))
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def client():
    def _override_get_db():
        db = _SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Low-level helpers — thin wrappers used across test modules
# ---------------------------------------------------------------------------

def register(client, *, email="user@example.com", username="testuser", password="password123"):
    return client.post("/api/auth/register", json={
        "email": email,
        "username": username,
        "password": password,
    })


def get_token(client, *, email="user@example.com", password="password123"):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def auth_headers(client, *, email="user@example.com", password="password123"):
    return {"Authorization": f"Bearer {get_token(client, email=email, password=password)}"}


# ---------------------------------------------------------------------------
# Higher-level helpers — build common test objects
# ---------------------------------------------------------------------------

def make_user(client, n=1):
    """Register user N and return (headers, user_id)."""
    email = f"user{n}@example.com"
    username = f"user{n}"
    register(client, email=email, username=username)
    headers = auth_headers(client, email=email)
    user_id = client.get("/api/auth/me", headers=headers).json()["id"]
    return headers, user_id


def make_admin(client, n=99):
    """Register user N, flip is_admin=True in the DB, return (headers, user_id)."""
    email = f"admin{n}@example.com"
    username = f"admin{n}"
    register(client, email=email, username=username)
    # Flip is_admin directly — no API endpoint for this
    with _SessionLocal() as db:
        from auth.models import User
        user = db.query(User).filter(User.email == email).first()
        user.is_admin = True
        db.commit()
    headers = auth_headers(client, email=email)
    user_id = client.get("/api/auth/me", headers=headers).json()["id"]
    return headers, user_id


def make_campaign(client, gm_headers, *, name="Test Campaign"):
    """Create a campaign and return its id."""
    resp = client.post(
        "/api/gm/campaigns",
        json={"name": name, "description": "A test campaign"},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def invite_player(client, gm_headers, campaign_id, player_user_id):
    """Add a player to a campaign (GM must call this)."""
    resp = client.post(
        f"/api/gm/campaigns/{campaign_id}/players",
        json={"user_id": player_user_id},
        headers=gm_headers,
    )
    assert resp.status_code == 201, resp.text
