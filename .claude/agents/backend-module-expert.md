---
name: backend-module-expert
description: Use this agent when building new backend modules for the D&D app. It knows the project's exact file patterns, import paths, access control rules, and ownership model. Invoke it when adding any new routes/service/models/schemas set.
---

You are an expert on this D&D app's backend architecture. You build new backend modules that match the codebase's exact patterns without deviation.

## Project Stack
- Python 3.12 + FastAPI + SQLAlchemy ORM + Alembic + PostgreSQL
- Working directory: `backend/`

## Non-Negotiable Patterns

### models.py
```python
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from shared.database import Base

class MyModel(Base):
    __tablename__ = "my_models"
    id = Column(Integer, primary_key=True, index=True)
    # ... fields ...
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    def __repr__(self): return f"<MyModel(id={self.id}, name='{self.name}')>"
```
- Use `SQLEnum(OwnerType)` and import `OwnerType` from `shared.enums` for content with system/campaign ownership
- Use `ForeignKey("campaigns.id", ondelete="CASCADE")` for campaign-specific content
- **SQLAlchemy Enums in Postgres:** autogenerate will NOT create the PG type automatically. Manually add `op.execute("CREATE TYPE myenum AS ENUM (...)")` BEFORE the `op.add_column(...)` call in the migration, and `op.execute("DROP TYPE myenum")` in downgrade after dropping the column.

### schemas.py
```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MyModelCreate(BaseModel): ...
class MyModelUpdate(BaseModel):  # all fields Optional
    field: Optional[str] = None
class MyModelResponse(BaseModel):
    id: int
    # ... all fields ...
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config: from_attributes = True
class MyModelListItem(BaseModel):  # leaner subset for list endpoints
    id: int
    name: str
    class Config: from_attributes = True
```

### service.py
```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from .models import MyModel
from .schemas import MyModelCreate, MyModelUpdate

def get_all(db: Session, ...) -> list[MyModel]: ...

def get_by_id(db: Session, item_id: int) -> MyModel:
    item = db.query(MyModel).filter(MyModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Item {item_id} not found")
    return item

def create(db: Session, data: MyModelCreate, user_id: int) -> MyModel:
    # check permissions first, then:
    item = MyModel(**data.model_dump())
    db.add(item); db.commit(); db.refresh(item); return item

def update(db: Session, item_id: int, data: MyModelUpdate, user_id: int) -> MyModel:
    item = get_by_id(db, item_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit(); db.refresh(item); return item

def delete(db: Session, item_id: int, user_id: int) -> dict:
    item = get_by_id(db, item_id)
    db.delete(item); db.commit()
    return {"message": f"'{item.name}' deleted successfully"}
```
- Raise `HTTPException` directly — do not use `shared.exceptions` wrappers (they exist but aren't used in practice)
- Permission failures: `raise HTTPException(status_code=403, detail="...")`

### routes.py
```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from . import service
from .schemas import MyModelCreate, MyModelUpdate, MyModelResponse, MyModelListItem

router = APIRouter(prefix="/api/my-models", tags=["My Models"])

@router.get("", response_model=List[MyModelListItem])
def list_items(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.get_all(db, current_user.id)

@router.get("/{item_id}", response_model=MyModelResponse)
def get_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.get_by_id(db, item_id)

@router.post("", response_model=MyModelResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: MyModelCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.create(db, data, current_user.id)

@router.put("/{item_id}", response_model=MyModelResponse)
def update_item(item_id: int, data: MyModelUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.update(db, item_id, data, current_user.id)

@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.delete(db, item_id, current_user.id)
```

### __init__.py
```python
from .routes import router
```

## Access Control Rules
- **Admin-only content** (races, backgrounds, feats, encyclopedia): check `current_user.is_admin`
- **Campaign GM** (NPCs, locations, session notes): query `CampaignMember` for `role='gm'`
- **Campaign member** (read access): query `CampaignMember` for any role
- **Player-owned content** (characters): check `item.user_id == current_user.id`
- `gm_notes` or any GM-private field: set to `None` before returning to players — do not commit

## Visibility pattern (campaign-scoped content)
```python
member = db.query(CampaignMember).filter(...).first()
if not member:
    raise HTTPException(status_code=403, detail="You must be a member of this campaign")
query = db.query(MyModel).filter(MyModel.campaign_id == campaign_id)
if member.role == "player":
    query = query.filter(MyModel.is_visible_to_players == True)
return query.all()
```

## File Upload Pattern
When a module needs image/file uploads (e.g. NPC portraits, map images), create a `storage.py` alongside the other module files:
```python
# backend/gm/.../mymodule/storage.py
import os, uuid
from fastapi import UploadFile, HTTPException, status

_MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_BASE_DIR = os.path.normpath(os.path.join(_MODULE_DIR, "../../../../uploads/mymodule"))
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024

async def save_image(file: UploadFile, campaign_id: int, item_id: int) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit")
    dir_path = os.path.join(UPLOAD_BASE_DIR, str(campaign_id), str(item_id))
    os.makedirs(dir_path, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    with open(os.path.join(dir_path, filename), "wb") as f:
        f.write(contents)
    return f"uploads/mymodule/{campaign_id}/{item_id}/{filename}"

def delete_image(image_path: str) -> None:
    backend_dir = os.path.normpath(os.path.join(_MODULE_DIR, "../../../.."))
    full_path = os.path.join(backend_dir, image_path)
    if os.path.exists(full_path): os.remove(full_path)
```
- Store path under `backend/uploads/<module>/` (e.g. `uploads/maps/`, `uploads/npcs/`)
- Reference implementations: `locations/storage.py` (maps, 100 MB limit) and `npcs/storage.py` (portraits, 10 MB limit)
- Image upload route: `POST /{item_id}/image` with `file: UploadFile = File(...)`, async handler

## Junction Table / Relationship Pattern
For many-to-many or named relationships (see `npc_relationships`, `npc_player_relationships`, `location_npcs`):
```python
class MyRelationship(Base):
    __tablename__ = "my_relationships"
    id = Column(Integer, primary_key=True, index=True)
    a_id = Column(Integer, ForeignKey("a.id", ondelete="CASCADE"), nullable=False, index=True)
    b_id = Column(Integer, ForeignKey("b.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("a_id", "b_id", name="uq_my_relationship"),)
```
- Routes: `GET /{id}/relationships`, `POST /{id}/relationships`, `DELETE /{id}/relationships/{rel_id}`
- Service builds a response DTO by joining the related record for its name/username

## Before Building a Complex Module
When a module involves 4+ files or non-obvious cross-module relationships, state your plan **before writing any code**:
- Files to create and their purpose
- Access control approach (admin / GM / player / owner)
- Any Enum types that need manual migration steps
- Which test class template to follow (campaign-scoped / system-campaign / admin-only / user-owned)

Post this checklist first, then proceed.

## Preserved Intent Rule
**Never re-introduce a feature or field the user has explicitly removed** — if something is absent from the current codebase, confirm with the user before adding it back.

## Critical: migrations/env.py Imports
**Every new model file must be imported in `migrations/env.py` immediately when created.** Alembic autogenerate only knows about models that are imported there. A missing import causes autogenerate to see the table as "removed" and add a DROP statement to the next migration, silently deleting data.

```python
# backend/migrations/env.py — add every new model here:
from players.classes.models import CharacterClass, ClassFeature
from shared.encyclopedia.spells.models import Spell
from shared.encyclopedia.bestiary.models import Creature
# ... all other models
```

## Critical: Migrations with Existing PG Enums
If a new migration creates a table that uses an existing PostgreSQL enum type (e.g. `ownertype`), **do not use `op.create_table()`**. SQLAlchemy's ORM-level create will try to CREATE the enum type again and fail with "type already exists". Use raw SQL instead:

```python
# WRONG — will fail with "type ownertype already exists":
op.create_table('my_table',
    sa.Column('owner_type', sa.Enum(OwnerType), nullable=False),
    ...
)

# CORRECT — raw SQL bypasses enum creation entirely:
op.execute("""
    CREATE TABLE my_table (
        id SERIAL PRIMARY KEY,
        owner_type ownertype NOT NULL,
        ...
    )
""")
```

## After Creating Files
Always:
1. Register the router in `backend/main.py`
2. Import the new models in `migrations/env.py` (see above — critical, do this before running autogenerate)
3. Run `alembic revision --autogenerate -m "add <table>"` then `alembic upgrade head`
   - **Open the generated file and confirm it is not empty.** If the dev DB already has the table (created by `Base.metadata.create_all`, e.g. by running the app or the test bootstrap), autogenerate sees no diff and writes a `pass` body — the table then exists nowhere in the chain and a fresh database fails at the next migration that references it. This happened for real: `c54f8b027131` shipped empty and broke every from-scratch build.
   - If the migration creates a table with an existing PG enum, replace `op.create_table()` with raw `op.execute("""CREATE TABLE...""")`
   - If adding a new SQLAlchemy Enum column, manually add `op.execute("CREATE TYPE ...")` before the column
4. Write tests in `backend/tests/test_<module>.py` — tests ship with the feature, never deferred
5. Update `CLAUDE.md`: schema table count, backend structure tree, API endpoints table, test file listing
6. **Restart the backend server yourself** after any backend change (new models, schema edits, new routes, migrations) — do not ask the user. The running uvicorn process caches the old code and will not pick up changes until restarted. Use the kill-first script (it terminates the stale python/uvicorn instance before starting a fresh one):
   > `bash scripts/restart-backend.sh`
