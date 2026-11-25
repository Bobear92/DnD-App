# First production deploy — ticket worklist

**Goal:** get the app running in production on Render with the release/rollback flow from
[docs/deployment.md](../deployment.md) set up. This is a practice deploy for a small group of friends,
not a launch, so the aim is a working pipeline, not a finished app.

**Status:** ✅ 12/12 done (2026-11-23) — live at v0.1.1. Remaining security follow-ups are listed under T10. Planned 2026-11-15. T5a and T5b were added after the data-loss discussion; T5a is the
one code change here that protects real players' data, so don't drop it to save time.

**Decisions:**
- Uploads: **Cloudflare R2** (decided 2026-11-16).

- Tier: **free** for both the database and the backend while in development (decided 2026-11-18). The free
  database expires ~30 days after creation (created 2026-11-18) and has no backups — upgrade it to paid before
  real players' data goes in. Region: **Virginia (US East)** for every service.
- Cost guard: Cloudflare budget alert at **$1** (Manage account → Notifications). It only emails; there is no hard cap.

Code changes (T1–T5b) go on a feature branch and ship to `main` as usual. T6 onward is setup on Render and GitHub.

## T1 — One API base URL for the frontend ✅
- **Landed 2026-11-15.** `src/lib/api.js` exports `API_ORIGIN`, `API_BASE` and `uploadUrl(path)`; all 17 files
  import it (the 7 hand-written upload-URL builders now go through `uploadUrl`, which is the seam T4 will swap).
  Guard: `src/test/noHardcodedApiUrl.test.js` (with self-tests); unit tests: `src/lib/api.test.js`. A production
  build with `VITE_API_URL` set bakes that URL in and contains no `localhost:8000`. `frontend/.env.example` added.
- [x] The API URL is hardcoded as `'http://localhost:8000/...'` **22 times** across the service files and a few
  components (`authService.js`, `campaignService.js`, `characterService.js`, `classService.js`,
  `referenceService.js`, `encounterService.js`, `encyclopediaService.js`, `featService.js`, `SpellList.jsx`,
  `CharacterDetail.jsx`, …). Add one module, e.g. `src/lib/api.js`, exporting
  `API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'`, plus a helper for upload URLs
  (`characterService.js:236` builds `http://localhost:8000/${path}`). Every caller imports it.
- guard: a test that fails if `localhost:8000` appears in `src/` outside that module (same style as
  `noLevelAnnotations.test.js`), so it can't creep back.
- [x] Update `.claude/agents/frontend-page-expert.md`, which tells new services to hardcode `localhost:8000`.
- done: `npm test` green; the app works locally without `VITE_API_URL` set.

## T2 — CORS and settings from the environment ✅
- **Landed 2026-11-16.** `config.py` has `allowed_origins` (string env var `ALLOWED_ORIGINS`) + a parsed `cors_origins`
  list (trims spaces and trailing slashes); `main.py` reads it. `debug` defaults to `False` — it turned out to be read
  nowhere, so this is a safe default only. Tests: `backend/tests/test_cors.py` (9).
- [x] `backend/main.py` hardcodes `allow_origins=["http://localhost:3000", "http://localhost:5173"]`. Read
  `allowed_origins` from `config.py` (comma-separated env var; default to the two localhost origins).
- [x] `config.py`: change the `debug` default to `False` (`.env` sets it true locally); check where `debug` is read.
- guard: backend test that a configured origin gets CORS headers and an unlisted one doesn't.

## T3 — Production start command and Python version ✅
- **Landed 2026-11-16.** `backend/start.sh` (migrate, then uvicorn on `$PORT` with `--proxy-headers`); `.python-version`
  = 3.12 at the repo root (Render defaults to 3.14 unpinned; CI tests 3.12); `pytest` moved to `requirements-dev.txt`
  (`httpx` stays: the seed scripts download SRD data with it); `main.py` no longer runs `create_all` — every one of the 44
  model tables is created by migrations alone (checked); `env.py` imports `main` so `alembic check` sees every model, and
  CI now runs `alembic check` after the from-scratch upgrade; `restart-backend.sh` runs `alembic upgrade head` first.
  **Found and fixed:** `env.py` crashed on a DATABASE_URL containing `%` (a percent-encoded password) — ConfigParser
  interpolation — which would have failed every deploy. Smoke test: `bash start.sh` on an empty DB applied 30 migrations,
  served in 3 s, registered a user. Guards: `backend/tests/test_schema_ownership.py`.
- [x] Pin the Python version for Render (`.python-version` or `PYTHON_VERSION` = 3.12).
- [x] Decide whether `pytest`/`httpx` stay in `requirements.txt` (harmless) or move to a `requirements-dev.txt`.
- [x] `main.py` runs `Base.metadata.create_all()` at import. In prod the start command runs `alembic upgrade head` first, so
  it is a no-op there, but if the app ever starts against an empty DB before alembic, it creates tables that alembic then
  fails on. Decide: remove it (alembic owns the schema) or guard it to dev only.
- [x] Confirm `alembic upgrade head` works on an **empty** database (CI already does this; run it once locally against a scratch DB).

## T4 — Uploads that survive a deploy ✅ (Cloudflare R2)
- **Landed 2026-11-16.** The five per-module storage files (`characters/`, `npcs/`, `locations/`, `session_notes/`
  `storage.py` + `shared/music_storage.py`) were near-identical, so they were consolidated first into
  `backend/shared/file_storage.py`: each upload kind is an `UploadKind` data row; `local` and `r2` backends sit behind
  `save_upload` / `delete_upload` / `delete_upload_file` / `delete_upload_folder`. Stored keys are unchanged
  (`uploads/...`), so no data migration. `main.py` mounts `/uploads` only for local storage and fails fast if `r2` lacks
  credentials. Frontend `uploadUrl` uses `VITE_UPLOADS_URL`. Also fixed: session-image delete joined a URL `filename` into a
  path (`../` could reach another session's files); tests no longer write into `backend/uploads` (temp dir via conftest).
  Tests: `backend/tests/test_file_storage.py` (R2 via a fake client); `test_locations.py` map tests now use real storage.
- [x] **Proven against real R2** (2026-11-20, Robert's map upload after the 31-character-key fix) — needs the bucket and credentials. Do it in T6: upload a portrait on the live
  site, confirm the object appears in the bucket and the image renders, redeploy, confirm it still renders.
- [x] ~~**Disk option:** make the uploads root configurable (`UPLOADS_DIR` env var) in the four storage modules
  (`players/characters/storage.py`, `npcs/storage.py`, `locations/storage.py`, `shared/music_storage.py`) and
  the `StaticFiles` mount, then mount the Render disk there. Session image storage uses the same root.~~ (not chosen)
- [x] **R2 option:** one shared storage backend behind those same helpers (a duplication tripwire: four
  storage modules means consolidate first, then swap); files are served from R2's public URL instead of `/uploads`.
- guard: existing upload tests stay green; a test that the configured root is respected.

## T5 — Token lifetime stopgap ✅
- **Landed 2026-11-16.** It was already configurable (`access_token_expire_minutes` is a settings field, so
  `ACCESS_TOKEN_EXPIRE_MINUTES` overrides it) — just untested and undocumented. Added tests (lifetime matches the
  setting, env var overrides, default 30, expired token → 401) and documented **720** for production. Also switched
  `security.py` from deprecated `datetime.utcnow()` to timezone-aware UTC. Expiry behaviour on the frontend is
  documented in deployment.md › Known production gaps.
- [x] Raise `access_token_expire_minutes` for production (via env var) so a game session doesn't log players
  out. The real expiry handling stays on the "Not Yet Built" list.

## T5a — Merge `character_data` on save instead of replacing it ✅
- **Landed 2026-11-16.** `update_character` merges incoming top-level keys into the stored blob (shallow: nested
  values are still replaced whole); new optional `character_data_remove: [keys]` deletes explicitly (and wins over a
  value sent in the same request); `null` is still stored as `null`. Frontend `characterService.toUpdatePayload` turns
  top-level keys set to `undefined` (which JSON would silently drop — the old way to clear a key) into
  `character_data_remove`, so existing "clear it" writes keep their meaning. Audit: every frontend writer spreads the
  stored blob; no top-level removal by omission or rest-destructuring exists (the only removals are nested). Backend
  writers (rest, initiative, seeds) assign directly and are unaffected. Tests: `test_character_data_merge.py` (13),
  `characterService.test.js` (7).
- **Correction to the plan:** merging does *not* reduce "GM and player save at once" losses — the sheet sends its
  whole (possibly stale) copy, so the later save still overwrites the earlier one's values. Fixing that means sending
  only changed keys (`autoSaveClassPatch` could send just its patch now that the backend merges). Not done; follow-up.
- [x] `update_character` (`backend/players/characters/service.py`) assigns the incoming `character_data` whole,
  so a frontend bug that drops a key wipes it for every character as players save, silently and over days
  (see [deployment.md › How a deploy can lose data](../deployment.md#how-a-deploy-can-lose-data)). Merge the
  incoming top-level keys into the stored blob instead.
- [x] Find every flow that removes a key **on purpose** and give it an explicit delete (e.g. a key set to `null`
  means delete, or a `remove_keys` list). Audit the frontend's `character_data` writers first; this is where the
  design risk is.
- guard: backend tests: a save missing a key keeps it; an explicit delete removes it; the rest/initiative/level-up
  paths still produce the same results.

## T5b — Seed scripts upsert ✅
- **Landed 2026-11-16.** One helper, `backend/shared/seeding.py` › `upsert_system_row` (matches only
  `owner_type=system, owner_id=NULL`; created / updated / unchanged / not_owned), used by `seed_spells.py`,
  `seed_phb_spells.py`, `seed_classes.py` (columns + the whole feature list, rebuilt only when it differs),
  `seed_items.py` (equipment, magic items, curated; `backfill_weapon_ranges` removed — the upsert writes ranges) and
  `seed_starting_items.py`. `seed_feats.py` already upserted (docstring fixed; now also syncs `repeatable`/`source`).
  Ownership conflicts handled: `seed_spells.py` applies the Artificer tag itself (no flip-flop with the tagger);
  `seed_starting_items.py` only updates rows with ITS categories — 14 names are SRD rows owned by `seed_items.py`.
  **Found:** `seed_data.py` (listed for production!) creates an admin `admin@dndapp.com` / `admin123` and ran
  `create_all`; it now refuses non-local databases and no longer creates tables, and is off the production list.
  Tests: `backend/tests/test_seeding.py` (network seeds via a fake API client).
- [x] Make every seed script treat its file as the source of truth for `owner_type='system'` rows: update an existing
  row instead of skipping it. Today `seed_spells.py` (and possibly others; check all eight) skips spells that
  already exist, so a corrected text never reaches prod. `seed_feats.py` already updates.
- [x] Never touch `owner_type='campaign'` rows.
- guard: a backend test per script: run twice, change a value in between, the row is updated and not duplicated;
  a campaign override with the same name is unchanged.

## T6 — Render: database and backend ✅
- **Landed 2026-11-18.** Backend live at `https://dnd-app-api.onrender.com` (service `dnd-app-api`, free, Virginia),
  database `dnd-app-db` (free). `production` branch created from `main` at `1bac949`. R2 bucket `dnd-app-uploads`,
  public URL `https://pub-a1ce541f177b4225b2ae82461e297fe2.r2.dev` (→ `VITE_UPLOADS_URL` in T7), account API token
  `dnd-app-render-backend` scoped to that bucket, Object Read & Write. Checked from outside: `/docs` 200, a login for an
  unknown user → 401 (so the DB is reached and migrated), `/api/auth/me` → 401, `/uploads/*` → 404 (R2 mode), an
  unlisted CORS origin is refused. `PYTHON_VERSION=3.12.8` set explicitly, because the service root is `backend/` and
  `.python-version` sits at the repo root.
- [x] Database external access blocked (Networking › PostgreSQL Inbound IP Rules emptied, 2026-11-18) — its password
  was exposed in a screenshot while the DB was empty. The backend still reaches it internally (verified). T8 must add
  one IP there temporarily to seed, then remove it.
- [x] R2 proven on the live site 2026-11-20: a map upload stored and rendered from the r2.dev URL. The first try failed with
  `InvalidArgument: Credential access key has length 31, should be 32` (a character lost when the key was hand-copied); the
  token was recreated using the copy buttons. Still owed (T10): redeploy and confirm the map survives.
- [x] Follow-up (UI): the Locations "Upload failed" banner stays up after a later upload succeeds. (Fixed 2026-11-25 — see post-deploy-followups.md › T4.)
- [x] Create Render Postgres; note the internal URL.
- [x] Python 3.12 pinned via `PYTHON_VERSION`.
- [x] Create the backend Web Service from the repo, root `backend/`, start command `bash start.sh`, **deploying from the `production` branch**.
- [x] Create the R2 bucket, API token and public URL ([deployment.md › Uploads](../deployment.md#uploads-cloudflare-r2)).
- [x] Set env vars (ALLOWED_ORIGINS still pending T7): `DATABASE_URL`, `SECRET_KEY` (freshly generated), `ALLOWED_ORIGINS` (`https://dnd-app-ginj.onrender.com`), `DEBUG=false`,
  `STORAGE_BACKEND=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
  `ACCESS_TOKEN_EXPIRE_MINUTES=720`.
- done: `https://<backend>/docs` loads.

## T7 — Render: frontend ✅
- **Landed 2026-11-18.** Site live at `https://dnd-app-ginj.onrender.com` (Static Site `dnd-app`; `dnd-app` itself was
  taken, hence the suffix). `NODE_VERSION=22` set. Checked from outside: `/` and a deep link both 200 (rewrite works);
  the bundle contains the backend URL and the R2 URL and no `localhost:8000`; a CORS preflight from the site is allowed
  and one from an unlisted origin gets 400.
- [x] Create the Static Site, root `frontend/`, build `npm ci && npm run build`, publish `dist`, branch `production`.
- [x] Set `VITE_API_URL` to the backend URL and `VITE_UPLOADS_URL` to the R2 public URL; add the rewrite `/*` → `/index.html`.
- [x] Put the Static Site's URL into the backend's `ALLOWED_ORIGINS`; redeploy the backend.
- done: the login page loads, and refreshing on a deep link (e.g. `/campaigns/1/characters`) doesn't 404.

## T8 — Seed production and create the admin ✅
- **Landed 2026-11-20.** Robert registered (`BobearDM`), opened the DB to his IP, put the External URL in
  `C:\Users\rober\dnd-prod-db.env` (outside the repo; Notepad's Save As defaulted to OneDrive\Documents, which syncs to
  the cloud, so it was moved). A local runner loaded it into the child processes' environment only and never printed it.
  Seeded in order; `seed_items.py` hit a dnd5eapi.co read timeout on its two list calls, still printed "Done" and exited 0
  with only the 15 curated items — re-run (then `seed_starting_items.py` again, to keep the dev order for the 14 shared
  names). Prod counts: 25 classes / 537 features, 322 spells, 114 feats, 38 weapons, 13 armor, 144 gear, 6 potions,
  361 magic items, 8 food & drink. Matches dev except potions (dev has 34 more from the legacy `seed_5e_srd.py`; prod
  has them as magic items) and one dev duplicate Potion of Healing (pre-T5b). `is_admin` set; IP rule removed and the
  laptop's connection confirmed refused.
- [x] **Fixed the silent partial seed:** `shared/seeding.fetch_json` retries 3× (2 s, 4 s) then raises `SeedFetchError`.
  In `seed_items.py` and `seed_spells.py` a failed LIST aborts the seed; a failed record is counted `failed` (never
  "skipped") and `exit_if_failed` ends the run non-zero naming it, after saving everything else. Tests: 6 in
  `test_seeding.py › TestNetworkSeedsNeverFailSilently`.
- [x] Robert's check (2026-11-20): Encyclopedia populated; a level-20 Fighter created and working on the live site.
- [x] The free tier has **no Render shell**: add Robert's IP to the database's inbound rules, run the seed scripts from
  this laptop against the database's **External** URL (set in the terminal only, never in `backend/.env`) in the order
  in [deployment.md › Data operations](../deployment.md#data-operations), then **remove the IP rule**.
  **Not `seed_data.py`** (it refuses a remote database anyway).
- [x] Register through the live app (Robert's real account, strong password); flip `is_admin` with SQL in the same IP window.
- done: the Encyclopedia shows classes, spells, feats and items; character creation works end to end.

## T9 — Release flow and repo docs ✅
- [x] Render auto-deploy set to "after CI checks pass" on both services (Robert, 2026-11-20).
- [x] Tag the first release `v0.1.0` on `production` — released 2026-11-20 with `/release`: production 1bac949 → 2ad9779,
  annotated tag pushed. First run found `git checkout production` aborts on the always-dirty session logs; the skill now
  moves production with `git fetch . origin/main:production` (ff-only, no checkout).
- [x] Update CLAUDE.md › Development Workflow: `main` is the develop line (no longer "the deployable trunk");
  `production` and tags handle releases; link [docs/deployment.md](../deployment.md). Add the
  rollback-safe migration rule as a standing rule.
- [x] Write a `/release` skill (`.claude/commands/release.md`) that follows [deployment.md › Release](../deployment.md#release) steps 2–6:
  list migrations and seed/backfill changes since the last tag; **stop** on `drop_`, `alter_column`, `UPDATE`,
  `DELETE` or `execute(` in a migration (and on drop + add pairs, the autogenerate-rename trap); require a backup
  and a rehearsal on a restored prod backup when there is a migration; fast-forward `production`; tag; push; list
  the seed scripts to run; smoke-test including saving an existing character.
- [x] Add "Back up and rehearse before a migration release" to deployment.md's release procedure checks (done in
  the doc; the skill enforces it).
- [x] Update the `.githooks/pre-commit` and `feature-branch-guard.mjs` protection to cover `production` too. Tested by
  `frontend/src/test/branchGuards.test.js` (8: throwaway repos; the two production cases fail against the old hooks).

## T10 — Pre-public checks ✅ (2026-11-23)
- [x] Confirm GitHub two-factor is on (it guards the repo, the Render deploy source and both social logins). Robert confirmed 2026-11-23.
- [x] Run the `security-reviewer` agent over auth, campaign membership and visibility before sharing the URL.
  Whole-codebase review, 2026-11-22. **Fixed (v0.1.1)**, each with a regression test that fails on the old code:
  1. **Critical — stored XSS in session content** (rendered raw for players; any user can add anyone to their campaign,
     so it was one-step token theft). `src/lib/sanitizeHtml.js` (DOMPurify) at the one raw-HTML render;
     `src/test/noUnsanitizedHtml.test.js` fails on any `dangerouslySetInnerHTML` without it.
  2. **Cross-campaign location children** (maps, pins, NPC links, relationships, links checked the URL campaign's GM but
     not that the location was in it; a pin could re-parent another campaign's location). `_get_campaign_location` /
     `_get_campaign_map` / `_check_linked_location` in `locations/service.py`.
  3. **Deleting any upload through a music field** (a client-writable `theme_music_url`/`music_url` was passed to
     `delete_upload`). `file_storage.delete_owned_upload` deletes only under the resource's own folder.
  4. **Hidden calendar eras sent to players.** `calendar/service._player_calendar` (a response copy, never the ORM row).
  5. **Hidden NPCs via relationship endpoints.** `npcs/service._require_npc_visible` + the other side filtered.
  Tests: `backend/tests/test_security_review.py` (15), `sanitizeHtml.test.js`, `RichTextEditor.test.jsx`, the guard.
  **Follow-ups (not yet fixed — fix before inviting people beyond friends):** any user can read any campaign's
  homebrew (`?campaign_id` / campaign-owned rows on every compendium GET); user search returns emails (2-char queries
  can harvest every address); music uploads keep the client's Content-Type, so the bucket can serve HTML; `is_admin`
  grants GM powers in `characters/service.py`; a GM adds players with no consent step; children of a hidden location
  (maps/NPCs/links) are listable by id; era ids from another campaign are accepted on timeline/session dates; campaign
  classes are writable by anyone (latent — no API creates them); no login rate limit or password minimum; `/docs` public
  in production; every member's email in `CampaignResponse`.
- [x] **v0.1.1 released** (2026-11-23, `af5b16a`). Render did NOT auto-deploy: "After CI checks pass" waits for a check
  run to complete on `production`, and CI ran on `main` only. Robert deployed both services manually; live bundle
  `index-82I08alL.js` carries the sanitizer, /docs 200, login 401, CORS allowed, deep link 200. Fixed for next time:
  `ci.yml` now also runs on pushes to `production` (ships in the next release).
- [x] Smoke test as a GM and as an invited player on the live site (create a campaign, invite, create a character, upload a portrait,
  redeploy, and confirm the portrait survives). Done 2026-11-23 on v0.1.1 by Robert (BobearDM + SmokeTestPlayer): invite,
  player character + portrait, GM notes hidden from the player, saves on two characters kept, portraits and the world map
  survived a manual API redeploy. Found (to-dos in CLAUDE.md): two accounts in one browser share the login token (use a
  private window); GM cards should show the owning player; invite needs a username list without emails; maps start hidden
  and real players see the GM's "Upload one" empty text.
- [x] Take a manual database dump. Render backups exist only on the paid database tier — upgrade first (the free
  database expires around 2026-12-18). Done 2026-11-22 via the temporary-IP procedure:
  `C:\Users\rober\dnd-backups\dnd-prod-20261122-1348.dump` (custom format, 374 KB, 45 tables; pg_dump 18.3).
  Holds every account's email and password hash — keep it off synced folders. Restore with `pg_restore --no-owner`.
