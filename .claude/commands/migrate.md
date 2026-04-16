---
description: Generate and apply an Alembic migration
---

Run the Alembic migration workflow for this project.

1. `cd` into `backend/` (migrations must run from there)
2. Run: `alembic revision --autogenerate -m "$ARGUMENTS"`
3. Run: `alembic upgrade head`
4. Report what tables/columns were detected and created

If $ARGUMENTS is empty, ask the user for a migration description before proceeding.

## Arguments
$ARGUMENTS
