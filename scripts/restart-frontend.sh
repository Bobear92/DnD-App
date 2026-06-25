#!/usr/bin/env bash
# Restart the Vite dev server on a guaranteed-clean port 5173.
#
# The frontend is useless without the backend, so this script ENFORCES that the
# backend is up before starting Vite: if nothing answers on :8000 it launches
# restart-backend.sh and waits for it to become healthy first. (The backend may
# run on its own; the frontend may not.)
#
# Also kills whatever is currently listening on 5173-5176 (a stale dev server,
# or one that already drifted to a higher port) BEFORE starting, so the frontend
# never ends up on a surprise port. Run from anywhere in the repo.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_URL="http://localhost:8000/docs"
BACKEND_LOG="${TMPDIR:-/tmp}/dnd-backend.log"

backend_up() { curl -s -o /dev/null --max-time 2 "$BACKEND_URL"; }

if backend_up; then
  echo "Backend already up on :8000."
else
  echo "Backend not responding on :8000 — starting it first..."
  nohup bash "$REPO_ROOT/scripts/restart-backend.sh" > "$BACKEND_LOG" 2>&1 &
  echo "  (backend log: $BACKEND_LOG)"
  for _ in $(seq 1 30); do
    sleep 1
    if backend_up; then break; fi
  done
  if backend_up; then
    echo "Backend is up on :8000."
  else
    echo "ERROR: backend did not come up within 30s. Not starting the frontend." >&2
    echo "Check the backend log: $BACKEND_LOG" >&2
    exit 1
  fi
fi

echo "Killing any dev server on ports 5173-5176..."
powershell -NoProfile -Command "
  Get-NetTCPConnection -LocalPort 5173,5174,5175,5176 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id \$_ -Force -ErrorAction SilentlyContinue }
" || true

echo "Starting Vite on http://localhost:5173 ..."
cd "$REPO_ROOT/frontend"
exec npm run dev
