---
description: Generate and apply an Alembic migration
---

Run the Alembic migration workflow for this project.

1. `cd` into `backend/` (migrations must run from there)
2. Run: `alembic revision --autogenerate -m "$ARGUMENTS"`
3. Run: `alembic upgrade head`
4. Report what tables/columns were detected and created
5. **ALWAYS** remind the user to restart the backend server after the migration completes:
   > "Migration applied. **Restart the backend server** (`uvicorn main:app --reload` from `backend/`) so the running process picks up the schema changes."

If $ARGUMENTS is empty, ask the user for a migration description before proceeding.

## Arguments
$ARGUMENTS
