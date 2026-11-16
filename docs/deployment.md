# Production deployment

How the app gets from a laptop to production, and how releases and rollbacks work once it is there.
This is the standing reference; the one-time work to get the first deploy out is the worklist in
[docs/tickets/first-production-deploy.md](tickets/first-production-deploy.md).

Agreed with Robert on 2026-11-15. Anything marked **(open)** has not been decided yet.

---

## Hosting

**Render**, with the frontend, backend and database as three separate services, all deploying from GitHub.

| Piece | Render service | Settings |
|---|---|---|
| `frontend/` | Static Site | build `npm ci && npm run build`, publish `dist`, rewrite `/*` → `/index.html` (React Router) |
| `backend/` | Web Service (Python) | root `backend`, build `pip install -r requirements.txt` (production deps only; tests use `requirements-dev.txt`), start `bash start.sh` (runs `alembic upgrade head`, then uvicorn on `$PORT` with proxy headers; never `--reload`) |
| Postgres | Managed Postgres | paid tier (free databases expire after ~30 days and have no backups) |
| Uploads | **Cloudflare R2** bucket (decided 2026-11-16) | Render's filesystem is wiped on every deploy, so uploads cannot live on the backend's disk. See [Uploads](#uploads-cloudflare-r2) |

**Python version:** `.python-version` at the repo root pins **3.12**, the version CI tests (unpinned, Render currently
defaults to 3.14). Render documents the file at "the root of your repo" without saying how that interacts with a service
Root Directory, so check the first deploy's build log; if it shows a different version, set `PYTHON_VERSION` to a full
3.12.x version in the service settings (that takes precedence).

**Alembic owns the schema.** The app never creates tables itself (`main.py` used to run `create_all`); `start.sh` and the
dev restart script run `alembic upgrade head` before starting, and CI runs `alembic check` so a model without a migration
fails the build instead of a deploy.

Why Render: three pieces, one dashboard, deploy-on-push, managed HTTPS, no Docker or servers needed.
Railway and Fly.io are the fallbacks if it doesn't work out.

**Tier (open):** the free web service sleeps when idle (~30 s cold start). The plan is about $7/mo for
the backend plus about $6/mo for Postgres; check current pricing before you sign up.

---

## Environment variables

| Service | Variable | Notes |
|---|---|---|
| backend | `DATABASE_URL` | Render Postgres *internal* URL |
| backend | `SECRET_KEY` | long random value, generated once (`python -c "import secrets; print(secrets.token_urlsafe(64))"`), never the dev value |
| backend | `ALLOWED_ORIGINS` | comma-separated frontend origin(s) for CORS |
| backend | `DEBUG` | `false` |
| backend | `ACCESS_TOKEN_EXPIRE_MINUTES` | `720` (12 h: a long game night, a fresh login each day). Default 30. Longer = a stolen token works longer, and tokens can't be revoked, so don't go far past a day |
| backend | `STORAGE_BACKEND` | `r2` (default `local`, which production must not use) |
| backend | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | from the Cloudflare dashboard; the backend refuses to start with `STORAGE_BACKEND=r2` if any is missing |
| frontend | `VITE_API_URL` | the backend's public URL. Vite bakes it in at **build** time, so changing it needs a rebuild |
| frontend | `VITE_UPLOADS_URL` | the R2 bucket's public URL (r2.dev subdomain or custom domain); uploaded images and music load from here |

Nothing secret ever goes into the frontend: anything prefixed `VITE_` ends up in the public JS bundle.

## Uploads (Cloudflare R2)

Portraits, maps, session images and theme music all go through **one module**, `backend/shared/file_storage.py`.
Each upload is stored under a key like `uploads/characters/3/<uuid>.png`, and **that key is what the database
stores**. Locally (`STORAGE_BACKEND=local`) the key is a file under `backend/uploads/`, served by the API at `/uploads`.
In production (`STORAGE_BACKEND=r2`) the same key is an object in the R2 bucket, and the browser loads it from
`VITE_UPLOADS_URL` (`frontend/src/lib/api.js` › `uploadUrl`). Because the key doesn't change, switching needs no data migration.

**Setting up the bucket (once):**
1. Cloudflare dashboard → R2 → create a bucket (e.g. `dnd-uploads`). Note the **Account ID**.
2. R2 → *Manage API tokens* → create a token with **Object Read & Write** on that bucket only. Copy the access key ID
   and secret (shown once) into the backend's env vars.
3. Bucket → *Settings* → *Public access*: enable the `r2.dev` subdomain (fine to start; Cloudflare rate-limits it) or
   connect a custom domain (better for real use). That URL is `VITE_UPLOADS_URL`.
4. No bucket CORS rule is needed: images and audio load with plain `<img>`/`<audio>` tags.

**What "public" means here:** anyone with a file's URL can open it. The URLs contain a random UUID and aren't listed
anywhere, so they can't be guessed — the same exposure as today's `/uploads` mount, which also has no login. A map the
GM hides is hidden in the app, but its file URL still works for anyone who already has it. If that ever matters, the
fix is short-lived signed URLs, not a different store.

**Backups:** R2 has no automatic snapshots. The bucket is durable, but a bug that deletes objects deletes them. Worth
revisiting (object versioning or a periodic copy) once real campaigns depend on it.

---

## Branches, releases, rollback

```
feature/*  ──ff──▶  main (develop)  ──release──▶  production (= what is live)
                                        │
                                        └─ tag v0.1.0, v0.2.0, … (permanent rollback points)
```

- **`main` is the develop line.** Feature branches fast-forward into it via `/ship`, the same as today.
  Code on `main` has passed tests but is **not** necessarily released.
- **`production` mirrors prod.** Render deploys from this branch and only this branch. It only ever moves
  by fast-forward to a commit that is already on `main`, or to a tag on rollback. Nobody commits to it directly.
- **Every release is a tag** (`vMAJOR.MINOR.PATCH`). Tags are the version history and the rollback points.
  They never move and never need cleaning up. We chose tags over keeping several "prod staging" branches
  because a branch can be pushed to by mistake, and then it no longer shows what was released.
- **Staging is an environment, not a branch.** A real staging environment means a second Render backend
  and a second database. Deferred until the app has real users; for now `main` running locally is
  the pre-release check.

### Release
1. `main` is green in CI and has been QA'd locally.
2. **Data check.** List what the release does to the database:
   - Migrations: `git diff <last-tag>..main --stat -- backend/migrations/`.
   - Destructive operations in them: `git diff <last-tag>..main -- backend/migrations/ | grep -E "drop_|alter_column|UPDATE|DELETE|execute\("`.
     **Any hit means stop:** confirm it follows the expand → contract rule below and isn't an autogenerate rename (drop + add).
   - Seed or backfill scripts that need running after the deploy (`git diff <last-tag>..main --stat -- backend/seed_*.py backend/backfill_*.py`).
   - Changes to how the frontend saves `character_data` (see [How a deploy can lose data](#how-a-deploy-can-lose-data), item 3).
3. **If the release has a migration:** take a manual backup (`pg_dump`), and rehearse it: restore the latest prod
   backup into a local scratch database, run `alembic upgrade head`, and check that real rows came through.
4. `git checkout production && git merge --ff-only main && git tag vX.Y.Z && git push origin production vX.Y.Z`
5. Render deploys (`alembic upgrade head` runs at start). Run any seed/backfill scripts from step 2.
6. Smoke-test: log in, open a campaign, open **and save** an existing character, then reload it and check nothing went missing.

A future `/release` skill should automate steps 2–6 (`/ship` stays the feature-branch → `main` step).

### Rollback
- **Fastest:** Render dashboard → backend/frontend → *Rollback* to the previous deploy.
- **Durable:** `git checkout production && git reset --hard vPREVIOUS && git push --force-with-lease origin production`.
  This is the one place a force push is expected.
- Then fix forward on `main` and cut a new release.

### Hotfix (only when `main` holds unreleased work you don't want to ship)
Branch `hotfix/<name>` from the live tag → fix and test → fast-forward `production` to it, tag `vX.Y.Z+1`
→ merge the fix back into `main`. Create the branch only when needed.

---

## The migration rule: rollback-safe migrations

**Rolling back code does not roll back the database.** If `v0.3.0` adds or renames a column and we roll back to
`v0.2.0`, old code runs against the new schema. So every migration must be one the *previous* release can run against:

- **Add before you use; remove only later.** Add a column (nullable or with a default) in one release; only
  drop or rename it in a *later* release, after nothing reads the old shape (expand → contract).
- No renames in one step: add the new column, backfill, switch the code, then drop the old one in a later release.
- `character_data` JSONB shape changes follow the same rule: new code must tolerate old shapes, and data
  migrations (like `backfill_inventory_snapshots.py`) run *after* the code that reads both shapes is live.
- Check after `alembic revision --autogenerate` that the migration isn't empty (see CLAUDE.md, Development Commands),
  and that a rename didn't come out as `drop_column` + `add_column`. Write renames by hand as `op.alter_column(..., new_column_name=...)`
  only when nothing deployed still reads the old name; otherwise expand → contract.

---

## How data persists between deploys

**Nothing is pulled down or reseeded on a deploy.** The code and the data live in different places:

```
Render Web Service (backend code)   ← replaced on every deploy
        │  connects via DATABASE_URL
        ▼
Render Postgres (your data)         ← a separate, long-lived server; deploys never touch it
```

A deploy throws away the container running the old code and starts a new one. The new container connects
to the **same** database, so every user, campaign and character is still there. Data persists because it
is not kept on the app server. That is also why uploaded files need a disk or R2: today they are saved on
the app server, and a deploy replaces it.

| Kind of data | Examples | What happens between deploys |
|---|---|---|
| **User data** | users, campaigns, characters, NPCs, sessions, GM overrides/homebrew | Nothing. It stays in Postgres. |
| **Schema** | a new column or table | **Alembic migrations** change the existing tables in place. `alembic upgrade head` at deploy start applies only the migrations prod hasn't had; existing rows stay (a new column arrives as NULL or its default). |
| **Reference data** | the system compendium: classes, spells, feats, items | **Seed scripts** add or update `owner_type='system'` rows. Run the matching script once after a release that changes them. GM overrides are separate `owner_type='campaign'` rows the seeds never touch. |
| **Uploaded files** | portraits, maps, music | Persistent disk or R2 **(open)**. Outside both the code and the database. |

**Data never flows between dev and prod.**
- **Dev → prod: never.** Prod starts empty, is migrated and seeded, and then fills with real users' data.
- **Prod → dev: only to debug or to rehearse a migration**, by restoring a prod backup into a local scratch
  database. That copies real users' emails and password hashes onto a laptop, so do it on purpose, and
  drop the copy afterwards.

**Seed scripts must be the source of truth for system rows.** They aren't all yet: `seed_feats.py` updates
existing rows (and refreshes character feat snapshots), but `seed_spells.py` **skips** a spell that already
exists, so a corrected spell text never reaches a database that already has the spell. Every seed script
should upsert. This is a ticket in the first-deploy worklist.

---

## How a deploy can lose data

A deploy doesn't put data at risk by moving it; it puts data at risk by running new code that writes to it.
In order of danger for this app:

1. **Destructive migrations.** `drop_column`/`drop_table` deletes data permanently. **An autogenerate "rename"
   is really a drop plus an add:** renaming a model field makes `alembic revision --autogenerate` drop the old
   column, with its data, and add an empty new one. Narrowing a type truncates; a careless `NOT NULL` default
   overwrites real values.
2. **Data migrations with a bug.** An `UPDATE` with the wrong `WHERE`, or a backfill (like
   `backfill_inventory_snapshots.py`) that rewrites JSON, changes every row it matches.
3. **A frontend that saves bad data. This is the silent one.** The sheet sends back the whole `character_data`
   blob on every save. Until 2026-11-16 the backend **replaced** the stored blob with it, so a deployed frontend bug
   that dropped a key (`inventory`, `feats`, `spell_slots`) erased it from each character the next time its player
   saved, with no migration and nothing visible at deploy time. **Fixed (T5a): the backend now merges** — a missing key
   is kept, and deleting a key takes an explicit `character_data_remove` list. Still true: a bug that sends a *wrong
   value* for a key overwrites it, and two people saving one character at once (GM and player, or two tabs) still
   lose the earlier save, because each sends its own full copy. Sending only the changed keys would fix that; it is not built.
4. **Seed scripts that update.** `seed_feats.py` rewrites feat snapshots on every character that has a feat.
5. **Cascade deletes.** Many foreign keys are `ON DELETE CASCADE`. That's correct, but a bug that deletes the
   wrong campaign takes its characters, NPCs and sessions with it.

**What protects us:**
- **Postgres runs migrations in a transaction.** A migration that *fails* halfway is rolled back completely and
  the database stays on the old version. The danger is a migration that *succeeds* while doing the wrong thing.
- **A backup is the only real undo.** Alembic `downgrade()` is not one: it can recreate a dropped column but
  not the data that was in it. Back up before any release with a migration (release step 3).
- **Read every migration before it ships**, and treat `drop_`, `alter_column`, `UPDATE`, `DELETE` as stop signs
  (release step 2).
- **Rehearse on real data.** Tests run on empty tables; a restored prod backup has the NULLs, odd JSON shapes and
  old characters that break migrations (release step 3).
- **Expand → contract** (the migration rule below), so nothing is dropped while code still reads it.
- **`character_data` is merged on save** (`update_character`), so a missing key means "unchanged", not "delete".
  Deleting is explicit: `character_data_remove: [keys]`. The frontend turns a key the sheet set to `undefined` into
  that list (`characterService.toUpdatePayload`), so every deliberate "clear this" keeps working. Guarded by
  `backend/tests/test_character_data_merge.py`.

---

## Data operations

- **Seeding a fresh database** (once, from the Render shell, after `alembic upgrade head`): `seed_classes.py`,
  `seed_spells.py` (downloads from dnd5eapi.co), `seed_artificer_spells.py`, `seed_phb_spells.py`, `seed_feats.py`,
  `seed_items.py`, `seed_starting_items.py`, plus `seed_data.py` if still needed. All are idempotent (they don't
  duplicate rows when re-run). Re-run `seed_feats.py` after a release that changes feat effects.
- **Admin account:** register through the live app, then `UPDATE users SET is_admin = true WHERE email = '…';`.
- **Backups:** Render Postgres paid tier takes daily backups with point-in-time restore. Also take a manual
  `pg_dump` before any release with a migration.
- **Never point a local tool at the production database** unless it is a deliberate, one-off operation.
- **No ad-hoc SQL against prod** beyond the admin flag; a fix to data goes through a reviewed script.

---

## Known production gaps (not blockers for a first deploy with friends)

- **No token-expiry handling.** Production tokens last 12 hours (`ACCESS_TOKEN_EXPIRE_MINUTES=720`, ticket T5),
  which covers a session. When one does expire, the frontend doesn't notice: every request fails with "Could not
  validate credentials" while the player stays on the page, and only a reload sends them to login (losing unsaved
  sheet edits). Real fix: a 401 → re-login flow (one shared axios client would make that one change, not ~15), or refresh tokens.
- **Open registration.** Anyone with the URL can sign up.
- **No error monitoring** (Sentry or similar) and no uptime check.
