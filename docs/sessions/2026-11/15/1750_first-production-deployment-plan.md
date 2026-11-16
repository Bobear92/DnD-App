---
session_id: 4051bf53-b2cf-4078-9910-980ee08763c7
title: First production deploy plan, T1–T5
date: 2026-11-15
started: 17:50
branch: feature/token-lifetime
area: tooling
tags: [docs, build, consolidation, deployment, data-safety, migration, seed-data, user-rule, guard-test]
issues: []
summary: Prod deploy plan + T1 API URL, T2 CORS, T3 start.sh/alembic, T4 R2, T5a merge-on-save, T5 token lifetime
turns: 28
stepped_in: true
last_uuid: 669c69a5-c968-4d5d-9a00-88f2f2af6fc1
---

# First production deploy plan, T1–T5

## Summary

- Planned the app's first production deploy (docs shipped as c463eba), then built T1.
- New `docs/deployment.md`: Render hosting (Static Site + Python Web Service + managed Postgres), env vars,
  `main` → `production` + `vX.Y.Z` tag release/rollback/hotfix flow, rollback-safe (expand → contract) migrations,
  how data persists between deploys, how a deploy can lose data, data operations.
- New `docs/tickets/first-production-deploy.md`: 12 tickets (T1 API base URL … T10 pre-public checks), incl. T5a
  merge-on-save for `character_data` and T5b seed scripts upsert.
- `docs/learnings.md`: new "Production and data safety" category + 3 unenforced-lesson rows. CLAUDE.md: one docs-index row.
- Codebase findings that shaped the plan: 22 hardcoded `localhost:8000` URLs; CORS hardcoded in `main.py`;
  uploads on local disk; `update_character` replaces `character_data` whole; `seed_spells.py` skips existing rows.
- **T1:** `frontend/src/lib/api.js` (`API_ORIGIN`/`API_BASE` from `VITE_API_URL`, `uploadUrl`); 17 files rewired by a
  match-exactly-once codemod; guard `noHardcodedApiUrl.test.js` + `api.test.js` (9 tests); `.env.example`; agent updated.
  Verified: prod build with `VITE_API_URL` set bakes it in with no `localhost:8000`; Playwright drive hit every service
  family (68 calls, 0 failures, uploads render).
- **T2:** `config.py` `allowed_origins` (env `ALLOWED_ORIGINS`) + parsed `cors_origins`; `main.py` uses it; `debug`
  defaults False (read nowhere). `tests/test_cors.py` (9); backend 997 / frontend 3923 green; live preflight: dev origin 200,
  unknown origin 400. security-reviewer agent + CLAUDE.md env block updated.
- **T3:** `backend/start.sh` (migrate then uvicorn, proxy headers); `.python-version` 3.12; `requirements-dev.txt` (pytest);
  removed `create_all` from `main.py` after proving all 44 tables come from migrations; `env.py` imports `main`; CI runs
  `alembic check`; `restart-backend.sh` migrates first; fixed `env.py` crash on `%` in DATABASE_URL. start.sh smoke on an empty
  DB: 30 migrations, served in 3 s, register 201. Backend 1002 / frontend 3923 green. Guards: `test_schema_ownership.py`.
- **T4 (Robert chose Cloudflare R2):** consolidated 5 near-identical storage modules into `shared/file_storage.py`
  (UploadKind rows; local + r2 backends via boto3); stored keys unchanged (no migration); `/uploads` mount local-only; fail-fast
  on missing R2 creds; frontend `VITE_UPLOADS_URL`; fixed session-image delete path traversal; tests use a temp uploads dir.
  `test_file_storage.py` (25, R2 via fake client). Backend 1027 / frontend 3925 green; live dev round-trip (upload, serve,
  replace removes old, delete, gif refused). Not yet proven against real R2 (needs Robert's bucket; T6 step).
- **T5a:** PUT merges `character_data` (shallow) + explicit `character_data_remove`; frontend `toUpdatePayload` maps
  top-level `undefined` keys to removals. Audit found no top-level removal by omission. Backend 1040 / frontend 3932 green;
  live API check and a real browser autosave (inspiration +1) both kept untouched keys.
- **T5:** token lifetime was already env-configurable; added tests + docs (production 720 min), switched `security.py` to
  timezone-aware UTC. Backend 1045 / frontend 3932 green; real logins: 30 min default, 720 with the env var.

## Where Claude struggled / where Robert stepped in

- **Robert redirected the branching model.** Claude's first answer had Render deploy from `main`; Robert proposed
  develop/staging/prod-parity branches. Agreed outcome: his `main`-as-develop + prod-parity branch, with tags instead of
  multiple staging branches. Claude should have asked how he wanted releases gated before assuming deploy-on-`main`.
- **Robert held the session at discussion** ("No lets continue to discuss") when Claude offered to start T1 code
  straight after writing the plan. Lesson: in a planning session, don't push toward implementation each turn.
- Claude made a self-referential edit in `deployment.md` (a line pointing to its own section) and had to revert it.
- The `character_data` whole-blob replacement was found only when asked "can data be lost?". It belonged in the
  first pre-deploy list.
- **Mass vitest failure was the shell, not the code.** Every suite failed with "reading 'config'" after the cwd became
  lowercase `c:/`; took a stash-everything run to prove it, then PowerShell (`C:/`) passed. Now in learnings + memory.
- T3 verification harness churn: Windows Python launched WSL bash, then a no-sleep retry loop, then piped-stdout hang;
  running start.sh from Git Bash directly worked first time. The `%` bug also printed the local DB password into Claude's
  output (stayed local); later scratch scripts redact URLs.
- T4: the fake S3 client's offset-based pagination failed the folder-delete test; real S3 tokens survive deletes, but the
  code was restructured to list-then-batch-delete so it doesn't depend on cursor semantics.
- T5a: the plan said merging "reduces last-write-wins"; building it showed it doesn't (each save carries a full stale
  copy). Corrected in the ticket/docs/learnings. Browser check first missed that the sheet opens on Narrative.
- The first Playwright pass missed encyclopedia/feats because the tabs are buttons, not ARIA tabs; fixed in the script.

## Decisions

- Host on Render; frontend, backend and database as separate services; deploy from a `production` branch.
- `main` = develop line; `production` mirrors prod and moves only by fast-forward (or reset to a tag on rollback).
- Releases are immutable tags, not versioned staging branches; staging *environment* deferred until real users.
- Migrations must be rollback-safe (expand → contract); back up and rehearse on a prod copy before any migration release.
- Data never flows dev → prod; prod → dev only deliberately.
- Merge-on-save for `character_data` is a pre-launch fix (T5a), not a nice-to-have.
- Production token lifetime 720 minutes (12 h) — Claude's recommendation, a Render env var, easy to change.
- Uploads: Cloudflare R2 over a Render disk (Robert); consolidate the storage modules first, then add R2 behind one API.
- Removed `create_all` (alembic owns the schema everywhere) rather than guarding it to dev — Claude's call, flagged in the summary.
- T1 kept narrow: the per-service duplicated axios + token interceptor was NOT consolidated (follow-up, pairs with token expiry).

## Open threads

- **Next: T5b** (seed scripts upsert) — last code ticket. T6/T7 need Robert's Render + Cloudflare accounts.
- Follow-up from T5a: send only changed keys (e.g. `autoSaveClassPatch` sends just its patch) to stop concurrent saves
  overwriting each other.
- R2 follow-ups: prove against the real bucket in T6; R2 has no automatic backups (versioning/periodic copy later);
  hidden maps' file URLs stay reachable to anyone holding them (signed URLs if that ever matters).
- Local venv is Python 3.14 while CI/prod pin 3.12; works today, worth aligning eventually.
- T6: confirm Render's build log shows 3.12 (`.python-version` at repo root vs service Root Directory is undocumented).
- Follow-up: one shared axios client (every service repeats the token interceptor); natural with token-expiry work.
- Open decisions: uploads (Render disk vs Cloudflare R2, needed by T4); tier (free vs ~$13/mo paid, needed by T6).
- CLAUDE.md Development Workflow still calls `main` "the deployable trunk"; rewrite in T9 once `production` exists.
- Robert can create the Render account and connect GitHub any time.

## Turn log

<!-- Appended automatically after every response by .claude/hooks/session-log.mjs. Do not edit. -->

### 1. 2026-11-15 17:50

**Robert:**
> okay let us now plan our first deployment to production. 
> 
> We are far from done with the app, but lets get some deployments under our belt before we try and deploy a huge complicated project. 
> 
> For our app how do you recommend we deploy to production and what are the steps we need to do that?

**Claude:**
> ## Recommendation: Render, with the frontend and backend deployed separately
> 
> Your stack is a React static build, a FastAPI service and Postgres. Render runs all three from one dashboard and deploys from your GitHub `main`, which fits the `/ship` workflow you already use: you push `main` and it deploys. There are no servers to look after, and you don't need Docker for a first deploy.
> 
> | Piece | Render service | Rough cost* |
> |---|---|---|
> | `frontend/` (Vite build) | Static Site | Free |
> | `backend/` (FastAPI) | Web Service (Python) | ~$7/mo on Starter. The free tier sleeps after inactivity and takes about 30s to wake. |
> | Postgres | Managed Postgres | ~$6/mo on Basic. Free databases expire after about 30 days, so don't keep real data on one. |
> | Uploads (portraits, maps, music) | Cloudflare R2, or a Render disk | R2 is free at your size |
> 
> \*Prices from memory, so check them before you …

**Commands run:** 2

### 2. 2026-11-15 17:57

**Robert:**
> Okay lets talk about a couple of stuff.
> 
> First branching strategy. Our main should be our develop branch. Working code goes up there. Then we should have a prod staging branches (this should have multiple versions, not sure how many before we delete, so if we need to fall back to a previous version we can) . This is where we have our code that will go to production. Then we should have a prod parity branch. One branch that is just a copy of prod. 
> 
> What do you think about the branching strategy?

**Claude:**
> Your three layers are right: an integration line, a frozen release candidate, and a record of what's in prod. But I'd use tags instead of multiple staging branches. Branches are the wrong tool for version history.
> 
> ## Where I agree
> 
> - **`main` as the develop line:** yes. Your current workflow (short-lived feature branches fast-forwarded into `main`) stays as it is.
> - **A branch that mirrors prod:** yes. It's also the cleanest deploy trigger. Render watches that branch, so a push to it is a deploy, and the branch always shows exactly what's live.
> 
> ## Where I'd change it
> 
> **Multiple prod-staging branches: use tags instead.** You want to be able to fall back to a previous version. Tags do that better:
> 
> - **A tag can't move.** `v0.3.0` always points at the same commit, while a branch can be pushed to by accident, so a "previous version" branch can stop being the previous version.
> - **No clea …

### 3. 2026-11-15 18:00

**Robert:**
> okay this all makes sense. Lets start taking these plans and what you stated earlier that needs to be done before we deploy to production and save them within the project so we dont loose them. Maybe a couple of files. Some for general production deployments and others for getting ready for our first deployment.

**Claude:**
> I saved the plans in two new files and added one line to CLAUDE.md. Everything is on a new branch, `feature/production-deploy-plan`, and nothing is committed yet.
> 
> **[docs/deployment.md](docs/deployment.md)** is the guide for every deploy, not just the first:
> - **Hosting:** Render, with the frontend, backend and database as separate services, plus the build and start settings for each.
> - **Environment variables:** what each service needs.
> - **Branches and releases:** `main` is the develop line; `production` mirrors what's live; each release is a `vX.Y.Z` tag.
> - **Procedures:** step-by-step release, rollback and hotfix.
> - **Migration rule:** every migration has to be one the previous release can still run against, because rolling back code doesn't roll back the database.
> - **Data:** seeding a fresh database, creating the admin account, backups.
> - **Known gaps:** token expiry, open registr …

**Files edited:** `docs/deployment.md`, `docs/tickets/first-production-deploy.md`, `CLAUDE.md` · **Commands run:** 2

### 4. 2026-11-15 18:04

**Robert:**
> No lets continue to discuss. 
> 
> Lets talk about how data persists from one deployment to another. 
> 
> How does this happen? Do we create a function during deployments that pulls down all the data and reseeds it? How do we go about this.

**Claude:**
> No. Nothing gets pulled down or reseeded. The data never leaves the database, and a deploy doesn't touch it.
> 
> ## The key idea: code and data live in different places
> 
> ```
> Render Web Service (backend code)   ← replaced on every deploy
>         │  connects via DATABASE_URL
>         ▼
> Render Postgres (your data)         ← a separate, long-lived server; deploys never touch it
> ```
> 
> The database is its own server that runs all the time. A deploy throws away the old container running your FastAPI code and starts a new one. The new container connects to the **same** database through the same `DATABASE_URL`, and every user, campaign and character is still there. It works the same way on your laptop: restarting uvicorn doesn't wipe `dnd_app_dev`.
> 
> So persistence comes from keeping the data off the app server. That's also why uploads need special handling: they're currently saved on the app server's …

### 5. 2026-11-15 18:07

**Robert:**
> What if we are editing the database in prod through a deployment? Can data be lost then?

**Claude:**
> Yes. A deploy that changes the database is the moment data **can** be lost, and I don't want to undersell that. The data isn't at risk because it's being moved; it's at risk because the deploy runs code that writes to it. Here's where the risk is, from most to least dangerous for this app.
> 
> ## Ways a deploy can destroy data
> 
> **1. Destructive migrations.** This is the obvious one:
> - `drop_column` or `drop_table` deletes that data permanently.
> - **A rename that autogenerate reads as a drop plus an add.** If you rename `backstory` to `history` in the model, `alembic revision --autogenerate` doesn't know it's a rename. It writes a migration that drops `backstory`, with all its text, and adds an empty `history`. This is the classic trap.
> - Narrowing a type (say `Text` to `String(100)`) truncates or fails.
> - Making a column `NOT NULL` with a careless default overwrites real values.
> 
> **2. Data …

**Commands run:** 2

### 6. 2026-11-15 18:13

**Robert:**
> okay add all these learnings to our docs.

**Claude:**
> I've added everything from the data discussions to three docs files on the `feature/production-deploy-plan` branch. Nothing is committed yet. The CLAUDE.md size and link test still passes; I didn't run the full test suite because only docs changed.
> 
> **[docs/deployment.md](docs/deployment.md)**
> - **How data persists between deploys** (new section): a deploy replaces the code, never the data. It covers how each kind of data moves between deploys (user data, schema, reference data, uploads), why data never flows from dev to prod, and the finding that `seed_spells.py` skips existing rows instead of updating them.
> - **How a deploy can lose data** (new section): the five ways, ranked. Top is destructive migrations, including the trap where an Alembic "rename" actually drops the column and its data. Next are buggy data migrations, then the silent one: saving a character replaces `character_data …

**Files edited:** `docs/deployment.md`, `docs/tickets/first-production-deploy.md`, `docs/learnings.md` · **Commands run:** 3

### 7. 2026-11-15 18:19

**Robert:**
> Okay what is the first step on the path to production deployment.

**Claude:**
> The first step is **T1: give the frontend one API base URL** in place of the 22 hardcoded `http://localhost:8000` strings.
> 
> **Why it comes first:**
> - **It blocks everything else.** As long as the frontend points at `localhost:8000`, a deployed frontend can't talk to a deployed backend, however well Render is set up.
> - **It has no open decisions.** It doesn't depend on the uploads or tier choice, so we can start now.
> - **It's small and safe.** One new module (`API_BASE` from `VITE_API_URL`, falling back to localhost), every caller imports it, and a guard test stops `localhost:8000` from creeping back. Locally nothing changes, so it can go to `main` on its own long before any deploy.
> 
> **Before T1, ship the planning docs.** They're on `feature/production-deploy-plan` and uncommitted. Run `/ship` to get them onto `main`, then I'll branch `feature/api-base-url` from the fresh `main` for T1. T …

### 8. 2026-11-15 18:20

**Robert:**
> yep lets ship the docs now. /ship

**Claude:**
> The deployment plan is on `main` as commit `c463eba` and pushed. `feature/production-deploy-plan` is deleted, and the working tree is clean.
> 
> - **Checks:** all 3,914 frontend tests passed. I skipped the backend coverage gate and the run-the-app check because no code changed.
> - **Commit contents:** `docs/deployment.md`, the 12-ticket worklist, the new "Production and data safety" section in `docs/learnings.md`, the docs-index line in CLAUDE.md, and the filled-in session log.
> - **Also in the commit:** two new session tags in TAGS.md (`deployment` and `data-safety`), and log updates left uncommitted by two earlier sessions.
> - **Agents:** `frontend-page-expert.md` still tells new services to hardcode `localhost:8000`. That's correct until T1 changes it, so I added updating it to the T1 checklist.
> 
> Next is T1, the single API base URL, on a fresh `feature/api-base-url` branch. Say when to star …

**Files edited:** `docs/tickets/first-production-deploy.md`, `docs/sessions/TAGS.md`, `docs/sessions/2026-11/15/1750_first-production-deployment-plan.md` · **Commands run:** 5

### 9. 2026-11-15 19:11

**Robert:**
> Lets start T1

**Claude:**
> T1 is done and on the branch `feature/api-base-url`, not committed yet. The frontend now gets the backend's address from one place, so a deployed build will call the deployed backend instead of `localhost:8000`.
> 
> - **One shared module:** the new [frontend/src/lib/api.js](frontend/src/lib/api.js) reads `VITE_API_URL` when the app is built and falls back to `http://localhost:8000` when it isn't set. Locally nothing changes. It also has `uploadUrl(path)`, which builds the address for uploaded images and audio.
> - **17 files updated:** every service and component that had the address typed in now imports it from that module. That includes the seven separate bits of code that each built upload URLs themselves. When uploads move to a disk or R2 (T4), only `uploadUrl` changes.
> - **Guard test:** [noHardcodedApiUrl.test.js](frontend/src/test/noHardcodedApiUrl.test.js) fails the build if the addres …

**Files edited:** `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/t1-codemod.mjs`, `frontend/src/lib/api.js`, `frontend/src/test/noHardcodedApiUrl.test.js`, `frontend/src/lib/api.test.js`, `docs/frontend-map.md`, `.claude/agents/frontend-page-expert.md`, `frontend/.env.example`, `docs/tickets/first-production-deploy.md`, `docs/learnings.md`, `../../../.claude/projects/c--Users-rober-Documents-Projects-dnd-app/memory/feedback_vitest_drive_letter.md` · **Commands run:** 22

### 10. 2026-11-15 20:25

**Robert:**
> /ship

**Claude:**
> T1 is on `main` as commit `8e12151` and pushed. `feature/api-base-url` is deleted, and the working tree is clean.
> 
> - **Tests:** all 172 test files and 3,923 tests pass.
> - **Real-app check:** I started both servers, logged in as the test GM in a scripted browser, and opened characters, a character sheet, NPCs, locations, sessions, encounters, every encyclopedia tab, a class page and character creation. All 68 calls to the backend succeeded, across every group of API endpoints (auth, campaigns, characters, encyclopedia, classes and feats). There were no console errors, and the uploaded portrait and NPC images loaded. Separately, a production build with `VITE_API_URL` set contains that URL and no `localhost:8000`.
> - **Docs and agent:** `frontend-map.md`, the `frontend-page-expert` agent and the ticket list (now 1 of 12 done) were updated before shipping. CLAUDE.md didn't need changes.
> - **S …

**Files edited:** `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/verify-t1.cjs` · **Commands run:** 10

### 11. 2026-11-16 10:33

**Robert:**
> <task-notification>
> <task-id>bo21rob9z</task-id>
> <tool-use-id>toolu_01Nk3LqYpqUAkYBnSQ27MJyR</tool-use-id>
> <status>stopped</status>
> <summary>Background shell command didn't finish before the previous session ended</summary>
> <note>No completion record was found for it in the previous session. It may have been stopped (via the UI, Monitor timeout, or agent teardown — these leave no transcript marker), or it may have been running when the previous Claude Code process exited. Check the output file for partial results before assuming it completed.</note>
> </task-notification>

**Claude:**
> _(no text reply)_

### 12. 2026-11-16 10:33

**Robert:**
> okay lets continue with T2

**Claude:**
> T2 is done on the branch `feature/env-cors-settings`, not committed yet. The backend now reads which websites may call it from an environment variable, so production can name the real frontend without a code change.
> 
> - **[backend/config.py](backend/config.py):** new `allowed_origins` setting, read from `ALLOWED_ORIGINS` as a comma-separated list. It defaults to the two local dev addresses, so nothing changes on your machine. Stray spaces and trailing slashes are trimmed, because a browser never sends a trailing slash and the match would silently fail otherwise.
> - **`debug` now defaults to `False`.** I checked, and nothing in the code reads `debug`, so this only makes the default safe and changes no behaviour.
> - **[backend/main.py](backend/main.py):** uses that setting instead of the hardcoded list.
> - **Tests:** the new [backend/tests/test_cors.py](backend/tests/test_cors.py) has 9 tests. …

**Files edited:** `backend/config.py`, `backend/main.py`, `backend/tests/test_cors.py`, `docs/backend-tests.md`, `CLAUDE.md`, `.claude/agents/security-reviewer.md` · **Commands run:** 11

### 13. 2026-11-16 10:56

**Robert:**
> /ship

**Claude:**
> T2 is on `main` as commit `869e920` and pushed. `feature/env-cors-settings` is deleted, and the working tree is clean.
> 
> - **Tests:** frontend 3,923 and backend 997, all passing. The feat-coverage gate passed with no change.
> - **Real-server check:** on the restarted backend, a request from the dev frontend (`localhost:5173`) is allowed and one from an unknown website is refused.
> - **Docs and agents:** CLAUDE.md's environment-variable section, backend-tests.md, the `security-reviewer` agent and the ticket list (now 2 of 12 done) were updated before shipping. The session log now covers T2 and lists T3 as next.
> 
> Next is T3: the production start command, pinning the Python version for Render, deciding whether `pytest` stays in the production requirements, and the new question of what to do with the automatic table creation in `main.py`.

**Commands run:** 2

### 14. 2026-11-16 10:59

**Robert:**
> Okay lets continue with T3

**Claude:**
> The backend suite is still running; it takes about 15 minutes and I'll be notified when it finishes. I'm holding the dev-server restart until then, because the restart script kills every Python process, including the test run.

**Files edited:** `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/migration_check.py`, `backend/migrations/env.py`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/table_parity.py`, `backend/main.py`, `backend/start.sh`, `.python-version`, `.github/workflows/ci.yml`, `scripts/restart-backend.sh`, `backend/tests/conftest.py`, `backend/tests/test_schema_ownership.py`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/start_sh_smoke.py`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/scratch_db.py`, `docs/backend-tests.md`, `.claude/agents/backend-module-expert.md` · **Commands run:** 21

### 15. 2026-11-16 11:28

**Robert:**
> <task-notification>
> <task-id>b958qdqci</task-id>
> <tool-use-id>toolu_01Qh817Wo4s7fLXhAfEHaBoH</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\b958qdqci.output</output-file>
> <status>completed</status>
> <summary>Background command "Run full backend test suite" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> T3 is done on the branch `feature/prod-start-command`, not committed yet.
> 
> **What changed:**
> - **[backend/start.sh](backend/start.sh):** the production start command. It runs `alembic upgrade head` first and stops if that fails, then starts uvicorn on Render's port. It also tells uvicorn to trust Render's HTTPS proxy, so any redirects FastAPI generates keep `https`. Render's start command will just be `bash start.sh`.
> - **[.python-version](.python-version):** pins **3.12**, the version CI tests. Unpinned, Render currently defaults to 3.14.
>   - Render's docs don't say whether this file is read when the backend lives in a subfolder, so T6 now includes checking the build log for 3.12. If it's wrong, set `PYTHON_VERSION` to a full 3.12 version number in Render's settings.
>   - Your local venv is 3.14. That works (all tests pass on it), but it isn't the version CI and production use.
> - **Requi …

**Commands run:** 3

### 16. 2026-11-16 11:30

**Robert:**
> /ship

**Claude:**
> T3 is on `main` as commit `e201ef5` and pushed. The branch `feature/prod-start-command` is deleted, and the working tree is clean.
> 
> - **Tests:** backend 1,002 pass (1 skipped: the Python-version check, which only runs in CI) and frontend 3,923 pass. The feat-coverage gate passed.
> - **Real runs:** `bash start.sh` on an empty database migrated it, served the API and registered a user. The dev backend restarted with the new script and logins work.
> - **Docs:** I added two lessons to `docs/learnings.md`: "run the real start path on an empty database" (it caught the `%` bug) and "Alembic owns the schema". The session log covers T3.
> 
> **Still running:** the CI run for this push (`43908436883`). It's the first time CI installs from `requirements-dev.txt` and runs the new `alembic check` step, so I'm waiting for the result and will tell you when it's in.
> 
> **Next is T4, uploaded files that survive …

**Files edited:** `docs/learnings.md` · **Commands run:** 6

### 17. 2026-11-16 11:34

**Robert:**
> Lets do the Cloudflare R2. 
> 
> Lets continue with T4

**Claude:**
> The frontend suite passes (3,925 tests, 2 new). I'm waiting on the backend suite; once it's done I'll restart the dev server and do a real upload round-trip through the refactored path.

**Files edited:** `backend/shared/file_storage.py`, `backend/config.py`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/t4-codemod.mjs`, `backend/main.py`, `backend/tests/conftest.py`, `backend/tests/test_file_storage.py`, `backend/tests/test_locations.py`, `frontend/src/lib/api.js`, `frontend/src/lib/api.test.js`, `frontend/.env.example`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/t4-docs.mjs`, `docs/backend-tests.md`, `docs/frontend-map.md`, `../../../.claude/projects/c--Users-rober-Documents-Projects-dnd-app/memory/project_locations_module.md` · **Commands run:** 20

### 18. 2026-11-16 11:43

**Robert:**
> <task-notification>
> <task-id>bz7e4ff03</task-id>
> <tool-use-id>toolu_01HvNJrbZat6q8F8zRKXG2DS</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\bz7e4ff03.output</output-file>
> <status>completed</status>
> <summary>Background command "Wait for CI run and show job results" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> The CI run for T3 (`e201ef5`) passed on GitHub. Both jobs succeeded, including the first runs of `requirements-dev.txt` and the new `alembic check` step. The T4 backend suite is still running locally.

**Commands run:** 1

### 19. 2026-11-16 11:50

**Robert:**
> <task-notification>
> <task-id>b84lchchc</task-id>
> <tool-use-id>toolu_01TvELB6AZZ3kHxCJEKUsYAV</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\b84lchchc.output</output-file>
> <status>completed</status>
> <summary>Background command "Run full backend test suite" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> T4 is done on the branch `feature/r2-uploads`, not committed yet. Uploads now go through one storage module that can use Cloudflare R2 in production, and nothing changes for local development.
> 
> **What changed:**
> - **One storage module instead of five.** The four per-feature `storage.py` files and `music_storage.py` were near-copies, so I merged them into [backend/shared/file_storage.py](backend/shared/file_storage.py) before adding R2. Each upload type (character portrait, NPC portrait, map, session image, music) is now one data row with its folder, allowed types and size limit. Two storage backends sit behind the same calls: local disk (the default) and R2.
> - **No data migration needed.** The database still stores `uploads/characters/3/<uuid>.png`, and in R2 that same string is the file's name in the bucket. In production the frontend just loads files from the bucket's public address (` …

**Files edited:** `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/upload_roundtrip.py` · **Commands run:** 4

### 20. 2026-11-16 13:34

**Robert:**
> /ship

**Claude:**
> T4 is on `main` as commit `195f8ef` and pushed. `feature/r2-uploads` is deleted, and the working tree is clean.
> 
> - **Before shipping:** backend 1,027 and frontend 3,925 tests passed. The feat-coverage gate passed, and the real upload round-trip worked on the dev server.
> - **In the commit:** the new storage module and its tests, the five old storage modules deleted, the frontend `VITE_UPLOADS_URL` change, and all the docs plus the session log.
> - **Still running:** the CI check for this push. It's the first time CI installs `boto3`, and I'll report the result when it finishes.
> 
> Four of the 12 deploy tickets are done. Next is either:
> - **T5a, merge-on-save for `character_data`:** the fix that stops a frontend bug from silently erasing saved character data. It's the more important one.
> - **T5, the login-lifetime stopgap:** a small setting change, so players aren't logged out mid-session.

**Commands run:** 4

### 21. 2026-11-16 13:36

**Robert:**
> Lets go forward with T5a

**Claude:**
> The docs are updated, and no agent or command describes the old save behaviour. I'm waiting for the backend suite, which tells us whether any existing test relied on "replace". Then I'll restart the backend and run the scenario against the live server.

**Files edited:** `backend/players/characters/schemas.py`, `backend/players/characters/service.py`, `frontend/src/characters/characterService.js`, `backend/tests/test_character_data_merge.py`, `frontend/src/characters/characterService.test.js`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/t5a-docs.mjs` · **Commands run:** 20

### 22. 2026-11-16 13:45

**Robert:**
> <task-notification>
> <task-id>b790wxowc</task-id>
> <tool-use-id>toolu_01YbPEkYK1PfNBXbZm5uY5LN</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\b790wxowc.output</output-file>
> <status>completed</status>
> <summary>Background command "Wait for CI on the T4 push" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> CI for the T4 push (`195f8ef`) passed: both jobs succeeded with `boto3` installed. The T5a backend suite is still running locally.

**Commands run:** 1

### 23. 2026-11-16 13:51

**Robert:**
> what next?

**Claude:**
> T5a isn't finished yet. Two steps are left before it's ready to ship:
> 
> 1. **The full backend suite is still running.** It's the important check here, because it shows whether any existing test depended on the old "replace the whole blob" behaviour. I'll get a notification when it finishes.
> 2. **A live check:** restart the backend, then on the real server save a character with a key missing, confirm the key survives, and confirm an explicit remove deletes it.
> 
> After that it's ready for `/ship`.
> 
> **Then the remaining tickets, in order:**
> - **T5, the login-lifetime stopgap.** Small: logins expire after 30 minutes and the app doesn't handle it, so players get kicked out mid-session. The fix makes the lifetime a setting with a longer value in production.
> - **T5b, seed scripts update existing rows.** Today `seed_spells.py` and possibly others skip rows that already exist, so a corrected spell …

### 24. 2026-11-16 13:54

**Robert:**
> <task-notification>
> <task-id>be62zpv6k</task-id>
> <tool-use-id>toolu_01624mRYwx7V8w47DYYRRdEo</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\be62zpv6k.output</output-file>
> <status>completed</status>
> <summary>Background command "Run full backend suite" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> T5a is done on the branch `feature/character-data-merge`, not committed yet. Saving a character no longer erases fields the save didn't include.
> 
> - **Backend:** all 1,040 tests pass (1 skipped: a check that only runs in CI). No existing test depended on the old "replace the whole blob" behaviour.
> - **Frontend:** all 3,932 tests pass.
> - **Live server:** on a temporary character, I saved only `current_hp`. `inventory` and `feats` survived, an explicit remove of `feats` deleted only `feats`, and a re-read from the database matched. I deleted the temporary character afterwards.
> 
> The "failed" notice that just came in is the previous server instance being stopped by the restart, as before. The dev backend is up.
> 
> When you run `/ship`, it will also drive a real character-sheet save in the browser, since `characterService` changed.
> 
> After that, T5 (login lifetime) and T5b (seed scripts update ex …

**Files edited:** `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/merge_live.py` · **Commands run:** 3

### 25. 2026-11-16 13:57

**Robert:**
> /ship

**Claude:**
> T5a is on `main` as commit `bc5f351` and pushed. Saving a character now keeps any field the save didn't include, instead of erasing it. `feature/character-data-merge` is deleted, and the working tree is clean.
> 
> **Checks:**
> - **Tests:** backend 1,040 and frontend 3,932, all passing. The feat-coverage gate passed and the production build succeeded.
> - **Real browser save:** on a temporary character, I clicked "Increase inspiration" in the sheet. One save went out, inspiration was stored as 1, and the character's inventory and feats were untouched. I deleted the character afterwards.
> - **Console errors:** the browser showed two 404s, both for the calendar of a campaign that has no calendar set up. That predates this change and doesn't affect the sheet.
> - **CI:** the GitHub run for this push is still going. I'll report when it finishes.
> 
> **One correction to the earlier plan:** I'd said mergin …

**Files edited:** `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/verify-t5a.cjs` · **Commands run:** 12

### 26. 2026-11-16 14:01

**Robert:**
> Okay lets continue with T5

**Claude:**
> The frontend suite passes (3,932 tests) and the `security-reviewer` agent is updated. Once the backend suite finishes, I'll restart the server and confirm a real login gets a 30-minute token, the dev default.

**Files edited:** `backend/shared/security.py`, `../../../AppData/Local/Temp/claude/045254e682df5b07/4051bf53-b2cf-4078-9910-980ee08763c7/scratchpad/t5-docs.mjs`, `.claude/agents/security-reviewer.md` · **Commands run:** 11

### 27. 2026-11-16 14:13

**Robert:**
> <task-notification>
> <task-id>bp9qzsv4x</task-id>
> <tool-use-id>toolu_01KiBeNfSpwmukx4zYCXjKEc</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\bp9qzsv4x.output</output-file>
> <status>completed</status>
> <summary>Background command "Wait for CI on the T5a push" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> CI for the T5a push (`bc5f351`) passed on both jobs. The T5 backend suite is still running locally.

**Commands run:** 1

### 28. 2026-11-16 14:17

**Robert:**
> <task-notification>
> <task-id>bqyqzz4vr</task-id>
> <tool-use-id>toolu_01Gz9CJiT8ZnpgPUXTDuw15C</tool-use-id>
> <output-file>C:\Users\rober\AppData\Local\Temp\claude\045254e682df5b07\4051bf53-b2cf-4078-9910-980ee08763c7\tasks\bqyqzz4vr.output</output-file>
> <status>completed</status>
> <summary>Background command "Run full backend suite" completed (exit code 0)</summary>
> </task-notification>

**Claude:**
> T5 is done on the branch `feature/token-lifetime`, not committed yet. Production logins can now last 12 hours.
> 
> - **It was already configurable.** The token lifetime is read from settings, so an `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable already overrode the 30-minute default. Nothing tested or documented that, so this ticket adds the proof and the docs.
> - **Real server check:** a login on the dev server gets a 30-minute token. A second server started with `ACCESS_TOKEN_EXPIRE_MINUTES=720`, the production value, issues a 720-minute (12-hour) token.
> - **New tests:** a token lasts as long as the setting says, the environment variable overrides it, the default is 30, an expired token is refused, and a valid one works.
> - **Small fix:** `security.py` used `datetime.utcnow()`, which is deprecated from Python 3.12, the version we pin. It now uses a timezone-aware time. The auth tests pa …

**Commands run:** 4
