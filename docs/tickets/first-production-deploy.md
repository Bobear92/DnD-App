# First production deploy — ticket worklist

**Goal:** get the app running in production on Render with the release/rollback flow from
[docs/deployment.md](../deployment.md) set up. This is a practice deploy for a small group of friends,
not a launch, so the aim is a working pipeline, not a finished app.

**Status:** 0/12 done. Planned 2026-11-15. T5a and T5b were added after the data-loss discussion; T5a is the
one code change here that protects real players' data, so don't drop it to save time.

**Decisions still open (settle before the ticket that needs them):**
- Uploads: Render persistent disk (simpler, needs a paid instance) or Cloudflare R2 (durable, more code). Needed by T4.
- Tier: free (cold starts, database expires) or paid (~$13/mo). Needed by T6.

Code changes (T1–T5b) go on a feature branch and ship to `main` as usual. T6 onward is setup on Render and GitHub.

## T1 — One API base URL for the frontend
- [ ] The API URL is hardcoded as `'http://localhost:8000/...'` **22 times** across the service files and a few
  components (`authService.js`, `campaignService.js`, `characterService.js`, `classService.js`,
  `referenceService.js`, `encounterService.js`, `encyclopediaService.js`, `featService.js`, `SpellList.jsx`,
  `CharacterDetail.jsx`, …). Add one module, e.g. `src/lib/api.js`, exporting
  `API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'`, plus a helper for upload URLs
  (`characterService.js:236` builds `http://localhost:8000/${path}`). Every caller imports it.
- guard: a test that fails if `localhost:8000` appears in `src/` outside that module (same style as
  `noLevelAnnotations.test.js`), so it can't creep back.
- [ ] Update `.claude/agents/frontend-page-expert.md`, which tells new services to hardcode `localhost:8000`.
- done: `npm test` green; the app works locally without `VITE_API_URL` set.

## T2 — CORS and settings from the environment
- [ ] `backend/main.py` hardcodes `allow_origins=["http://localhost:3000", "http://localhost:5173"]`. Read
  `allowed_origins` from `config.py` (comma-separated env var; default to the two localhost origins).
- [ ] `config.py`: change the `debug` default to `False` (`.env` sets it true locally); check where `debug` is read.
- guard: backend test that a configured origin gets CORS headers and an unlisted one doesn't.

## T3 — Production start command and Python version
- [ ] Pin the Python version for Render (`.python-version` or `PYTHON_VERSION` = 3.12).
- [ ] Decide whether `pytest`/`httpx` stay in `requirements.txt` (harmless) or move to a `requirements-dev.txt`.
- [ ] Confirm `alembic upgrade head` works on an **empty** database (CI already does this; run it once locally against a scratch DB).

## T4 — Uploads that survive a deploy (needs the uploads decision)
- [ ] **Disk option:** make the uploads root configurable (`UPLOADS_DIR` env var) in the four storage modules
  (`players/characters/storage.py`, `npcs/storage.py`, `locations/storage.py`, `shared/music_storage.py`) and
  the `StaticFiles` mount, then mount the Render disk there. Session image storage uses the same root.
- [ ] **R2 option:** one shared storage backend behind those same helpers (a duplication tripwire: four
  storage modules means consolidate first, then swap); files are served from R2's public URL instead of `/uploads`.
- guard: existing upload tests stay green; a test that the configured root is respected.

## T5 — Token lifetime stopgap
- [ ] Raise `access_token_expire_minutes` for production (via env var) so a game session doesn't log players
  out. The real expiry handling stays on the "Not Yet Built" list.

## T5a — Merge `character_data` on save instead of replacing it
- [ ] `update_character` (`backend/players/characters/service.py`) assigns the incoming `character_data` whole,
  so a frontend bug that drops a key wipes it for every character as players save, silently and over days
  (see [deployment.md › How a deploy can lose data](../deployment.md#how-a-deploy-can-lose-data)). Merge the
  incoming top-level keys into the stored blob instead.
- [ ] Find every flow that removes a key **on purpose** and give it an explicit delete (e.g. a key set to `null`
  means delete, or a `remove_keys` list). Audit the frontend's `character_data` writers first; this is where the
  design risk is.
- guard: backend tests: a save missing a key keeps it; an explicit delete removes it; the rest/initiative/level-up
  paths still produce the same results.
- Also reduces the "GM and player save at once, last write wins" loss, though it doesn't eliminate it for the same key.

## T5b — Seed scripts upsert
- [ ] Make every seed script treat its file as the source of truth for `owner_type='system'` rows: update an existing
  row instead of skipping it. Today `seed_spells.py` (and possibly others; check all eight) skips spells that
  already exist, so a corrected text never reaches prod. `seed_feats.py` already updates.
- [ ] Never touch `owner_type='campaign'` rows.
- guard: a backend test per script: run twice, change a value in between, the row is updated and not duplicated;
  a campaign override with the same name is unchanged.

## T6 — Render: database and backend (needs the tier decision)
- [ ] Create Render Postgres; note the internal URL.
- [ ] Create the backend Web Service from the repo, root `backend/`, **deploying from the `production` branch**
  (create it from `main` first: `git branch production main && git push origin production`).
- [ ] Set env vars: `DATABASE_URL`, `SECRET_KEY` (freshly generated), `ALLOWED_ORIGINS` (fill in after T7), `DEBUG=false`.
- [ ] Attach the persistent disk (if chosen in T4).
- done: `https://<backend>/docs` loads.

## T7 — Render: frontend
- [ ] Create the Static Site, root `frontend/`, build `npm ci && npm run build`, publish `dist`, branch `production`.
- [ ] Set `VITE_API_URL` to the backend URL; add the rewrite `/*` → `/index.html`.
- [ ] Put the Static Site's URL into the backend's `ALLOWED_ORIGINS`; redeploy the backend.
- done: the login page loads, and refreshing on a deep link (e.g. `/campaigns/1/characters`) doesn't 404.

## T8 — Seed production and create the admin
- [ ] From the Render shell, run the seed scripts in the order in [deployment.md › Data operations](../deployment.md#data-operations).
- [ ] Register through the live app; flip `is_admin` with SQL.
- done: the Encyclopedia shows classes, spells, feats and items; character creation works end to end.

## T9 — Release flow and repo docs
- [ ] Render auto-deploy set to "after CI checks pass".
- [ ] Tag the first release `v0.1.0` on `production`.
- [ ] Update CLAUDE.md › Development Workflow: `main` is the develop line (no longer "the deployable trunk");
  `production` and tags handle releases; link [docs/deployment.md](../deployment.md). Add the
  rollback-safe migration rule as a standing rule.
- [ ] Write a `/release` skill that follows [deployment.md › Release](../deployment.md#release) steps 2–6:
  list migrations and seed/backfill changes since the last tag; **stop** on `drop_`, `alter_column`, `UPDATE`,
  `DELETE` or `execute(` in a migration (and on drop + add pairs, the autogenerate-rename trap); require a backup
  and a rehearsal on a restored prod backup when there is a migration; fast-forward `production`; tag; push; list
  the seed scripts to run; smoke-test including saving an existing character.
- [ ] Add "Back up and rehearse before a migration release" to deployment.md's release procedure checks (done in
  the doc; the skill enforces it).
- [ ] Update the `.githooks/pre-commit` and `feature-branch-guard.mjs` protection to cover `production` too.

## T10 — Pre-public checks
- [ ] Run the `security-reviewer` agent over auth, campaign membership and visibility before sharing the URL.
- [ ] Smoke test as a GM and as an invited player on the live site (create a campaign, invite, create a character, upload a portrait,
  redeploy, and confirm the portrait survives).
- [ ] Take a manual database dump and confirm Render backups are on.
