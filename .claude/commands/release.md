---
description: Release main to production — data check, version + notes, fast-forward production, tag, verify the live site
---

Cut a release: move `production` (what Render deploys) forward to `main`, tag it, and check the live site.
`/ship-it` gets work onto `main`; **`/release` is the only way `production` moves forward.** The standing reference
is `docs/deployment.md` › *Branches, releases, rollback* and *The migration rule* — read them if anything here is unclear.

**Never push, tag or touch production data without Robert's explicit "yes" in this conversation (Step 4).**
Everything before Step 4 is read-only.

## Step 1 — Preconditions (stop on any failure)

```bash
git fetch origin --tags
git status --short                       # must be empty (session-log files are fine; mention them)
git rev-parse main origin/main            # must be equal: main is pushed
git merge-base --is-ancestor origin/production origin/main && echo ok   # production must be behind main, never diverged
gh run list --branch main --limit 5 --json headSha,conclusion,status    # the run for main's HEAD must be completed/success
```

- If `production` is not an ancestor of `main` (a hotfix or rollback happened), stop and explain — that needs the
  Hotfix/Rollback procedure in deployment.md, not a fast-forward.
- If `main` equals `origin/production` there is nothing to release; say so and stop.
- If CI for `main`'s HEAD is still running, wait for it (`gh run watch <id> --exit-status`); if it failed, stop.

## Step 2 — What the release contains

`LAST` = the newest tag reachable from `origin/production` (`git describe --tags --abbrev=0 origin/production`);
on the very first release there is none — use `origin/production` itself as the base.

```bash
git log --oneline LAST..origin/main
git diff --stat LAST..origin/main -- backend/migrations/
git diff LAST..origin/main -- backend/migrations/ | grep -nE "drop_|alter_column|UPDATE|DELETE|execute\("
git diff --stat LAST..origin/main -- 'backend/seed_*.py' 'backend/backfill_*.py' 'backend/scripts/'
git diff LAST..origin/main -- frontend/src | grep -nE "character_data|updateCharacter|toUpdatePayload" | head -40
```

**Stop and discuss with Robert on any of:**
- a destructive hit in a migration (`drop_`, `alter_column`, `UPDATE`, `DELETE`, `execute(`), or a `drop_column` and
  `add_column` on the same table in one migration — the autogenerate-rename trap that deletes the column's data.
  Check it follows expand → contract (deployment.md › The migration rule);
- a change to how the frontend saves `character_data` (deployment.md › How a deploy can lose data, item 3).

## Step 3 — Migrations need a backup and a rehearsal

Skip if Step 2 listed no migration files. Otherwise, before Step 4:
1. **Backup.** The free database has no Render backups. Take a `pg_dump` through the laptop-job procedure
   (deployment.md › Data operations: temporary IP rule → External URL in `C:\Users\rober\dnd-prod-db.env`, never
   printed → dump → remove the rule). Tell Robert *before* the step that shows the URL not to screenshot it.
2. **Rehearse.** Restore that dump into a scratch local database, run `alembic upgrade head` against it, and check real
   rows came through (counts before/after for the touched tables). Drop the scratch database afterwards.
3. If either fails, stop.

## Step 4 — Version, notes, and Robert's go-ahead

- **Version:** `vMAJOR.MINOR.PATCH`. While pre-1.0: bump MINOR for anything players would notice (features, data
  changes), PATCH for fixes/docs/tooling only. The first release is `v0.1.0`.
- **Notes:** 3–10 plain-language bullets from Step 2's log, grouped *Features / Fixes / Behind the scenes*, plus a
  *Data* line: migrations (or "none"), seeds to run (or "none").
- Show Robert the version, the notes, the commit range, and the data findings, then **ask for an explicit yes.**
  Do not continue without it.

## Step 5 — Fast-forward, tag, push

```bash
git fetch . origin/main:production       # moves local production WITHOUT checking it out; refuses anything but a fast-forward
git tag -a vX.Y.Z production -m "vX.Y.Z" -m "<the notes from Step 4>"
git push origin production vX.Y.Z
git ls-remote origin refs/heads/production 'refs/tags/vX.Y.Z^{}'   # both must show main's HEAD
```

**Don't `git checkout production`:** the session-log hook keeps `docs/sessions/*` modified, so a checkout aborts
(v0.1.0 hit this). If the fetch says "non-fast-forward", stop — production diverged (deployment.md › Hotfix/Rollback).
`.githooks/pre-commit` refuses commits on `production`; a fast-forward creates none, so it does not fire.
The push to `production` starts a CI run (`ci.yml` runs on `main` and `production`); Render auto-deploys when that
run passes, ~10 minutes later. If no new deploy shows in Render after ~20 minutes, ask Robert for **Manual Deploy →
Deploy latest commit** on both services (v0.1.1 needed it). A service whose Root Directory (`backend` / `frontend`) the release does not
touch is skipped on purpose, silently — a docs/tooling-only release deploys nothing, and that is fine. The backend runs `alembic upgrade head` on start.

## Step 6 — Verify the live site from outside

Wait for the new frontend bundle and a healthy backend (the free backend may be asleep: allow ~60 s per request):

```bash
SITE=https://dnd-app-ginj.onrender.com; API=https://dnd-app-api.onrender.com
curl -s $SITE/ | grep -o 'assets/index-[^"]*\.js'          # changes when the new frontend is live — unless no frontend/src change shipped (same build, same name)
curl -s -o /dev/null -w "%{http_code}\n" $API/docs           # 200
curl -s -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"x"}' -w " [%{http_code}]\n"   # 401 = DB reached and migrated
curl -s -o /dev/null -D - -X OPTIONS $API/api/auth/login -H "Origin: $SITE" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin  # the site is allowed
curl -s -o /dev/null -w "%{http_code}\n" $SITE/campaigns/1/characters            # 200 = SPA rewrite intact
```

Record the frontend bundle name **before** Step 5 so the change is visible. If the backend fails to start (a
migration error shows in Render's logs), roll back: deployment.md › Rollback.

## Step 7 — Seeds, smoke test, report

- Run any seed scripts Step 2 flagged, through the laptop-job procedure (deployment.md › Data operations). A seed that
  cannot download a record exits non-zero — re-run it.
- Ask Robert to smoke-test in the browser: log in, open a campaign, **open and save an existing character, reload it,
  and check nothing went missing**; open a map or portrait (R2).
- Report: the tag, the commit, what was verified, seeds run, and anything left for Robert. Update
  `docs/tickets/*` if a ticket tracked this release. `production` and the tag need no commit of their own.
