#!/usr/bin/env bash
# Restart the FastAPI/uvicorn backend on a guaranteed-clean port 8000.
#
# Kills every running python process (uvicorn --reload spawns a reloader parent
# plus a worker, both python) BEFORE starting, so a stale server can't keep
# serving cached modules or hold port 8000. Run from anywhere in the repo.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Killing any running python (uvicorn) processes..."
powershell -NoProfile -Command "
  Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force
" || true

echo "Starting uvicorn on http://localhost:8000 ..."
cd "$REPO_ROOT/backend"
source venv/Scripts/activate
exec uvicorn main:app --reload
