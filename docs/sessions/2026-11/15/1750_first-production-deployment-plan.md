---
session_id: 4051bf53-b2cf-4078-9910-980ee08763c7
title: First production deployment plan
date: 2026-11-15
started: 17:50
branch: feature/production-deploy-plan
area: tooling
tags: [docs, deployment, data-safety, migration, seed-data, user-rule]
issues: []
summary: Planned the first prod deploy: Render, main→production+tags release flow, data-safety rules, 12-ticket worklist
turns: 7
stepped_in: true
last_uuid: 79023811-f723-4b16-abf5-e570f5399624
---

# First production deployment plan

## Summary

- Discussion-only session planning the app's first production deploy; no product code changed.
- New `docs/deployment.md`: Render hosting (Static Site + Python Web Service + managed Postgres), env vars,
  `main` → `production` + `vX.Y.Z` tag release/rollback/hotfix flow, rollback-safe (expand → contract) migrations,
  how data persists between deploys, how a deploy can lose data, data operations.
- New `docs/tickets/first-production-deploy.md`: 12 tickets (T1 API base URL … T10 pre-public checks), incl. T5a
  merge-on-save for `character_data` and T5b seed scripts upsert.
- `docs/learnings.md`: new "Production and data safety" category + 3 unenforced-lesson rows. CLAUDE.md: one docs-index row.
- Codebase findings that shaped the plan: 22 hardcoded `localhost:8000` URLs; CORS hardcoded in `main.py`;
  uploads on local disk; `update_character` replaces `character_data` whole; `seed_spells.py` skips existing rows.

## Where Claude struggled / where Robert stepped in

- **Robert redirected the branching model.** Claude's first answer had Render deploy from `main`; Robert proposed
  develop/staging/prod-parity branches. Agreed outcome: his `main`-as-develop + prod-parity branch, with tags instead of
  multiple staging branches. Claude should have asked how he wanted releases gated before assuming deploy-on-`main`.
- **Robert held the session at discussion** ("No lets continue to discuss") when Claude offered to start T1 code
  straight after writing the plan. Lesson: in a planning session, don't push toward implementation each turn.
- Claude made a self-referential edit in `deployment.md` (a line pointing to its own section) and had to revert it.
- The `character_data` whole-blob replacement was found only when asked "can data be lost?". It belonged in the
  first pre-deploy list.

## Decisions

- Host on Render; frontend, backend and database as separate services; deploy from a `production` branch.
- `main` = develop line; `production` mirrors prod and moves only by fast-forward (or reset to a tag on rollback).
- Releases are immutable tags, not versioned staging branches; staging *environment* deferred until real users.
- Migrations must be rollback-safe (expand → contract); back up and rehearse on a prod copy before any migration release.
- Data never flows dev → prod; prod → dev only deliberately.
- Merge-on-save for `character_data` is a pre-launch fix (T5a), not a nice-to-have.

## Open threads

- **Next: T1** (one `API_BASE` module from `VITE_API_URL`, guard test against `localhost:8000`, update
  `frontend-page-expert` agent) on a fresh `feature/api-base-url` branch.
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
