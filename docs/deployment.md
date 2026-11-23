# Production deployment

How the app gets from a laptop to production, and how releases and rollbacks work once it is there.
This is the standing reference; the one-time work to get the first deploy out is the worklist in
[docs/tickets/first-production-deploy.md](tickets/first-production-deploy.md).

Agreed with Robert on 2026-11-15; first deployed 2026-11-18. Anything marked **(open)** has not been decided yet.

---

## Hosting

**Render**, with the frontend, backend and database as three separate services, all deploying from GitHub.

| Piece | Render service | Settings |
|---|---|---|
| `frontend/` | Static Site | build `npm ci && npm run build`, publish `dist`, rewrite `/*` → `/index.html` (React Router) |
| `backend/` | Web Service (Python) | root `backend`, build `pip install -r requirements.txt` (production deps only; tests use `requirements-dev.txt`), start `bash start.sh` (runs `alembic upgrade head`, then uvicorn on `$PORT` with proxy headers; never `--reload`) |
| Postgres | Managed Postgres | **free for now** (see [Live services](#live-services)); paid before real players' data goes in — free databases expire ~30 days after creation and have no backups |
| Uploads | **Cloudflare R2** bucket (decided 2026-11-16) | Render's filesystem is wiped on every deploy, so uploads cannot live on the backend's disk. See [Uploads](#uploads-cloudflare-r2) |

**Python version:** CI tests **3.12**. `.python-version` at the repo root says so, but the backend service's Root
Directory is `backend/`, so Render may not see that file; the service therefore sets `PYTHON_VERSION=3.12.8` explicitly
(it takes precedence). Bump both together. The frontend sets `NODE_VERSION=22` the same way.

**Alembic owns the schema.** The app never creates tables itself (`main.py` used to run `create_all`); `start.sh` and the
dev restart script run `alembic upgrade head` before starting, and CI runs `alembic check` so a model without a migration
fails the build instead of a deploy.

Why Render: three pieces, one dashboard, deploy-on-push, managed HTTPS, no Docker or servers needed.
Railway and Fly.io are the fallbacks if it doesn't work out.

**Tier (decided 2026-11-18): free while in development.** The free web service sleeps after ~15 minutes idle (the
next request waits up to a minute) and has no shell/SSH. Upgrade before real players: about $7/mo for the backend
(Starter) and $6/mo for Postgres. **Render's create form pre-selects the $7 plan** — pick the plan deliberately on every
new service.

### Live services

| | Name | URL / detail |
|---|---|---|
| Frontend | Static Site `dnd-app` | https://dnd-app-ginj.onrender.com (`dnd-app` was taken, hence the suffix) |
| Backend | Web Service `dnd-app-api` | https://dnd-app-api.onrender.com (`/docs` for the API docs) |
| Database | Postgres `dnd-app-db` | free; created 2026-11-18, so it **expires around 2026-12-18** unless upgraded first (Render emails before) |
| Uploads | R2 bucket `dnd-app-uploads` | public URL `https://pub-a1ce541f177b4225b2ae82461e297fe2.r2.dev` |

All Render services are in **Virginia (US East)**. They must share a region: the backend reaches the database by its
*internal* URL, which only works inside one region's private network. Every service deploys from the **`production`**
branch, never `main`.

**Database network access is closed.** The database's Networking › *PostgreSQL Inbound IP Rules* list is empty, so
nothing outside Render can connect, even with the password; the backend is unaffected because it uses the internal
URL. To run something from a laptop (seeding, a dump), add that one IP there, do the job, and delete the rule again.

### Accounts and cost guards

- **Two-factor is on** for Render and Cloudflare (Google Authenticator), with backup codes kept off the phone.
  An account created with "Sign in with GitHub" has **no password of its own**; Cloudflare needed one set through
  *Forgot password* before it would enable two-factor. A social login is only as safe as the GitHub/Google account.
- **The Render GitHub app sees only the DnD-App repository.**
- **Cloudflare budget alert at $1** (Manage account → Notifications; it was auto-created at $10). It only emails —
  Cloudflare has no hard spending cap for R2. Free allowance: 10 GB, 1M writes, 10M reads a month, Standard class only.
- **Kill switch** if R2 usage ever runs away: disable the bucket's public URL and delete the API token. Nothing is lost.
- **Never screenshot a screen that shows a secret**: a two-factor QR code, a database URL, an API key. Twice in the
  first deploy one went into a chat by screenshot and had to be replaced or locked down.

---

## Environment variables

| Service | Variable | Notes |
|---|---|---|
| backend | `DATABASE_URL` | Render Postgres *internal* URL |
| backend | `SECRET_KEY` | long random value, generated once — Render's **Generate** button, or `python -c "import secrets; print(secrets.token_urlsafe(64))"` — never the dev value |
| backend | `ALLOWED_ORIGINS` | comma-separated frontend origin(s) for CORS. Set **after** the Static Site exists (its URL isn't known before); saving it needs a backend redeploy |
| backend | `DEBUG` | `false` |
| backend | `ACCESS_TOKEN_EXPIRE_MINUTES` | `720` (12 h: a long game night, a fresh login each day). Default 30. Longer = a stolen token works longer, and tokens can't be revoked, so don't go far past a day |
| backend | `STORAGE_BACKEND` | `r2` (default `local`, which production must not use) |
| backend | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | from the Cloudflare dashboard; the backend refuses to start with `STORAGE_BACKEND=r2` if any is missing |
| backend | `PYTHON_VERSION` | `3.12.8` (see Hosting) |
| frontend | `NODE_VERSION` | `22` |
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
1. Cloudflare dashboard → *Storage & databases* → R2 (activating it asks for a payment method even on the free plan)
   → create a bucket (`dnd-app-uploads`, location Automatic with an Eastern North America hint, **Standard** class).
   Note the **Account ID** (R2 overview → *Account Details*; copy it with the icon, the text is truncated).
2. R2 overview → *Account Details* → *API Tokens* → **Manage** → **Create Account API token** (account tokens survive a
   user leaving; user tokens don't) with **Object Read & Write**, applied to that bucket only, TTL forever, **no client
   IP filter** (Render's outbound IPs change). Copy the access key ID and secret (shown once) into the backend's env
   vars **with the copy buttons**, and check the lengths: the ID is 32 characters, the secret 64 (a hand-copied ID one
   character short fails every upload with `Credential access key has length 31, should be 32`). Ignore the jurisdiction-specific endpoints: the backend builds the default
   `https://<account-id>.r2.cloudflarestorage.com` itself.
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

**Run it with `/release`** (`.claude/commands/release.md`), which automates steps 1–6 and asks for an explicit yes before pushing; `/ship` stays the feature-branch → `main` step. `.githooks/pre-commit` refuses a commit on `production`, and Claude's edit guard blocks editing there.

**Render waits for CI.** Both services are set to Auto-Deploy *After CI checks pass*. Render deploys when a check run **completes** on the branch it watches, so CI runs on pushes to `production` as well as `main`: a `/release` push starts a fresh run on the already-tested commit, and the deploy begins when it passes (~10 min). Before this, CI ran on `main` only, a fast-forward of `production` started no run, and Render never deployed — v0.1.1 needed **Manual Deploy → Deploy latest commit** on both services, which is still the fallback if no deploy appears. **Each service also has a Root Directory** (`backend`, `frontend`): a release that changes nothing under it does **not** deploy that service, and Render logs nothing for the skip — v0.1.2 (docs/CI only) deployed neither, correctly.

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
| **Uploaded files** | portraits, maps, music | The Cloudflare R2 bucket. Outside both the code and the database. |

**Data never flows between dev and prod.**
- **Dev → prod: never.** Prod starts empty, is migrated and seeded, and then fills with real users' data.
- **Prod → dev: only to debug or to rehearse a migration**, by restoring a prod backup into a local scratch
  database. That copies real users' emails and password hashes onto a laptop, so do it on purpose, and
  drop the copy afterwards.

**Seed scripts are the source of truth for system rows** (T5b). Every production seed **upserts** through
`backend/shared/seeding.py`: re-running one brings existing rows in line with the file or API, so a corrected
spell text or item weight reaches an already-seeded database. Only `owner_type=system` rows are matched — campaign
overrides and homebrew are never touched. Two consequences to know:
- **An admin's API edit to a system row is overwritten** on the next seed run. Fix the seed file instead.
- **Character inventories are snapshots**, so an updated item row does not change items characters already carry.

`seed_starting_items.py` and `seed_items.py` produce 14 of the same gear names; each row has one owner (decided by
its category), so the two don't overwrite each other.

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

- **Seeding** — the free tier has **no Render shell**, so run the scripts from a laptop: add your IP to the database's
  inbound rules, set `DATABASE_URL` to the database's **External** URL in that terminal only (never in `backend/.env`),
  run them, then remove the IP rule. Render hides the External URL while the inbound rules are empty, so add the
  rule first. Keep the URL in a file outside the repo and out of OneDrive (Notepad's Save As defaults to the synced
  Documents folder), and a network seed that cannot download a record now retries, then exits non-zero naming it (re-run it; seeds are safe to re-run).
  In this order, and safe to re-run any time:
  `seed_classes.py`, `seed_spells.py` (downloads from dnd5eapi.co), `seed_artificer_spells.py`, `seed_phb_spells.py`,
  `seed_feats.py`, `seed_items.py` (downloads), `seed_starting_items.py` (after `seed_items.py`). All upsert. Re-run the
  matching script after a release that changes its file (`seed_feats.py` also re-syncs character feat snapshots).
- **Never in production:** `seed_data.py` creates an **admin with a known password** (`admin@dndapp.com` / `admin123`)
  and test users; it now refuses any non-local database. `scripts/seed_5e_srd.py` is a legacy dev seeder whose
  `--clear` flag wipes system records.
- **Admin account:** register through the live app, then `UPDATE users SET is_admin = true WHERE email = '…';`.
- **Backups:** Render Postgres paid tier takes daily backups with point-in-time restore; **the free tier has none**. Also take a manual
  `pg_dump` before any release with a migration.
- **Never point a local tool at the production database** unless it is a deliberate, one-off operation.
- **No ad-hoc SQL against prod** beyond the admin flag; a fix to data goes through a reviewed script.

---

## Known production gaps (not blockers for a first deploy with friends)

- **No token-expiry handling.** Production tokens last 12 hours (`ACCESS_TOKEN_EXPIRE_MINUTES=720`, ticket T5),
  which covers a session. When one does expire, the frontend doesn't notice: every request fails with "Could not
  validate credentials" while the player stays on the page, and only a reload sends them to login (losing unsaved
  sheet edits). Real fix: a 401 → re-login flow (one shared axios client would make that one change, not ~15), or refresh tokens.
- **Open registration.** Anyone with the URL can sign up. Nobody is told when they do, and there is no forgot-password flow (a lost password needs SQL) — planned as "Account emails + password reset" in CLAUDE.md › Not Yet Built.
- **No error monitoring** (Sentry or similar) and no uptime check.
- **Free-tier cold starts**: the backend sleeps after ~15 idle minutes, so the first request after a break takes up to a minute (until the Starter upgrade).
