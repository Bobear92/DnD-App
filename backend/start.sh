#!/usr/bin/env bash
# Production start command. Render: Root Directory `backend`, Start Command `bash start.sh`.
#
# Migrations run first and a failure stops the deploy, so the server never starts on a schema it
# doesn't match. Alembic owns the schema: main.py does not create tables (see the note there).
set -euo pipefail
cd "$(dirname "$0")"

alembic upgrade head

# --proxy-headers: Render terminates HTTPS at its proxy, so trust X-Forwarded-Proto/For from it;
# otherwise redirects FastAPI generates (e.g. a trailing-slash redirect) would point at http://.
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips='*'
