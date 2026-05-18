---
description: Generate and apply an Alembic migration
---

Run the Alembic migration workflow for this project.

1. `cd` into `backend/` (migrations must run from there)
2. Run: `alembic revision --autogenerate -m "$ARGUMENTS"`
3. Run: `alembic upgrade head`
4. Report what tables/columns were detected and created
5. **ALWAYS** restart the backend server yourself after the migration completes — the user cannot access Claude's terminal:
   ```powershell
   Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
   Then start fresh (Bash, background):
   ```bash
   cd "c:/Users/rober/Documents/Projects/dnd-app/backend" && source venv/Scripts/activate && uvicorn main:app --reload &
   sleep 4 && curl -s http://localhost:8000/docs > /dev/null && echo "Server up"
   ```

If $ARGUMENTS is empty, ask the user for a migration description before proceeding.

## Arguments
$ARGUMENTS
