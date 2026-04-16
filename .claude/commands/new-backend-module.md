---
description: Scaffold a new backend module (models/schemas/service/routes + migration)
---

Scaffold a complete new backend module for this D&D app. The argument is: `<module_name> <module_path> <description>`

Example: `locations gm/campaigns/campaign_tools/locations Campaign-specific map locations`

## What to build

Create these 5 files following the project's exact patterns:

### 1. `backend/$MODULE_PATH/models.py`
- Import from `shared.database import Base` and `shared.enums import OwnerType` (only if ownership model applies)
- SQLAlchemy model with: `id` (PK), relevant fields, `created_at`/`updated_at` timestamps using `func.now()`
- If campaign-specific (like NPCs): include `campaign_id = Column(Integer, ForeignKey("campaigns.id"))`
- If system+campaign content (like Races): include `owner_type` (SQLEnum OwnerType) and `owner_id`
- Add `__repr__` method

### 2. `backend/$MODULE_PATH/schemas.py`
- Four Pydantic models: `{Name}Create`, `{Name}Update`, `{Name}Response`, `{Name}ListItem`
- `Update` schema: all fields `Optional`
- `Response` schema: include `id`, `created_at`, `updated_at Optional`, and `class Config: from_attributes = True`
- `ListItem`: leaner version of Response for list endpoints

### 3. `backend/$MODULE_PATH/service.py`
- Import: `from sqlalchemy.orm import Session`, `from . import models, schemas`, `from shared.exceptions import NotFoundException, ForbiddenException`
- Functions: `get_all_*`, `get_*_by_id`, `create_*`, `update_*`, `delete_*`
- `get_by_id` raises `NotFoundException` if not found
- `update_*` uses `model_dump(exclude_unset=True)` + `setattr` loop
- `delete_*` returns `{"message": "... deleted successfully"}`
- Enforce access control (admin/GM) and raise `ForbiddenException` when violated

### 4. `backend/$MODULE_PATH/routes.py`
- Import: `from fastapi import APIRouter, Depends, status`, `from shared.database import get_db`, `from shared.dependencies import get_current_user`, `from auth.models import User`
- Standard 5 endpoints: `GET /` (list), `GET /{id}`, `POST /` (201), `PUT /{id}`, `DELETE /{id}`
- Pass `current_user.id` and `current_user.is_admin` to service functions

### 5. `backend/$MODULE_PATH/__init__.py`
- Export the router: `from .routes import router`

## After creating files

1. Register the router in `backend/main.py` — import it and call `app.include_router(...)`
2. Run the Alembic migration:
   ```
   cd backend && alembic revision --autogenerate -m "add $MODULE_NAME table"
   alembic upgrade head
   ```
3. Confirm the table was created

## Arguments
$ARGUMENTS
