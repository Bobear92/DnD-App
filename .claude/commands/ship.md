---
description: Finish a session — verify tests exist, update docs, commit, and push to GitHub
---

Complete the post-turn checklist and ship the current session's changes.

## Step 1 — Identify what changed

```bash
git diff --name-only HEAD
git status --short
```

## Step 2 — Verify tests exist

For every new `.jsx` component or page file, confirm a co-located `.test.jsx` exists.

Required coverage per new frontend page:
- Loading state, error state
- Service is called with correct arguments (including `campaignId`)
- GM-only elements hidden in player view
- Navigation called with correct path on success
- Key interactions (create/save/delete) call the right service method

For every new backend module (`routes.py` / `service.py`), confirm `backend/tests/test_<module>.py` exists with:
- GM can create / update / delete
- Player gets 403 on write operations
- Non-member gets 403
- Visibility gating (GM sees all; player sees `is_visible_to_players=True` only)
- `gm_notes` stripped from player responses (if applicable)

If any test file is missing, write it now before continuing.

## Step 3 — Run the full test suite

```bash
cd frontend && npm test -- --run
```

All tests must pass. Fix failures before continuing — do not skip or suppress.

`npm test` also runs the **coverage ratchet** (`scripts/coverage-ratchet.test.js`) and the
**config-contract fixture** (`configContracts.test.js`) — a class-feature mechanization regression
or a malformed data-driven config fails here.

## Step 3b — Backend coverage gate (only if backend changed)

The feat-effects gate reads the seeded dev DB, so it isn't a pytest test — run it here:

```bash
cd backend && source venv/Scripts/activate && python report_feat_effects.py --check
```

Exit 0 = OK. If it reports a **regression**, a feat lost its mechanized `effects` — fix it, don't
lower the baseline. If it says coverage **improved**, ratchet the floor up so the gain can't be
silently undone: `python report_feat_effects.py --write-baseline` and commit the updated
`feat_coverage_baseline.json`. (Mirror on the frontend: `npm run coverage:baseline` after
mechanizing more class features.)

## Step 3c — Verify runtime changes end-to-end

Green tests are not proof the feature works in the running app — the documented failure mode is a
stale uvicorn worker serving cached modules while the DB and schema files were correct. This step
drives the *actual* app for any change with a runtime surface.

**First decide if it applies.** Look at the Step 1 changed-files list:
- **SKIP** when the diff touches only tests (`*.test.*`), docs (`*.md`), tooling/config (`.claude/**`,
  `.github/**`, `scripts/**`, `*.json`, baselines) — there's no runtime behavior to observe. State
  "verify: skipped (no runtime surface)" and move on. (This session's tooling/docs ship would skip.)
- **RUN** when the diff touches product source: frontend `src/**/*.{jsx,js}` (non-test) or backend
  `routes.py`/`service.py`/`models.py`/`schemas.py`.

**When it applies, invoke the `verify` skill scoped to the changed flow.** It picks the best
available driving method; the repo essentials it should cover:
- **Backend changed** → `bash scripts/restart-backend.sh` (kills stale python first), then
  `sleep 4 && curl -s http://localhost:8000/docs >/dev/null && echo up`, then `curl` the *specific*
  changed endpoint(s) with a real token and read the actual JSON — confirm the new field/behavior is
  really served, not just asserted in a test.
- **Frontend changed** → `npm run build` must succeed (catches what jsdom tests don't), then drive
  the changed flow in the real app. Playwright + Chromium are installed (no config yet — write an
  ad-hoc script under a scratch dir): log in as the test GM (`gm@dnd.com` / `password123`), navigate
  to the changed page, exercise it, and assert the visible outcome. Servers must be up
  (`scripts/restart-frontend.sh` ensures the backend too).

Observe behavior, don't just re-run tests. If verification fails, fix before committing — do not
ship on green tests alone.

## Step 4 — Audit CLAUDE.md

Update these sections as needed:
- **Database schema**: table count (currently 37), new table definitions
- **Backend structure tree**: new modules/files
- **API endpoints tables**: new routes
- **Frontend file tree**: new components/pages with descriptions and test counts
- **Implemented routes table**: new routes with status
- **Test file listing**: new test files with test counts
- **What's NOT Built Yet**: remove items just completed, add newly deferred items

## Step 5 — Check agents

Scan `.claude/agents/` for any stale pattern references caused by this session's changes (e.g., renamed files, changed import paths, updated conventions).

## Step 6 — Commit, merge to main, and push

Development uses **short-lived feature branches** (see CLAUDE.md → "Development Workflow"). Shipping always lands the work on `main`.

First commit the work on the current feature branch:

```bash
git add <specific files — never git add -A blindly>
git commit -m "$(cat <<'EOF'
<concise summary of what was built/fixed and why>

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

Then land it on `main`. Detect the current branch:

```bash
BRANCH=$(git branch --show-current)
```

- **If `BRANCH` is `main`** — you skipped branching; just push:
  ```bash
  git push origin main
  ```

- **If `BRANCH` is a feature branch** — fast-forward `main` and clean up:
  ```bash
  git checkout main
  git merge --ff-only "$BRANCH"     # fast-forward only — never a merge commit
  git push origin main
  git branch -d "$BRANCH"                       # delete local feature branch
  git push origin --delete "$BRANCH" 2>/dev/null || true   # delete remote if it was pushed
  ```
  If `--ff-only` fails, `main` advanced since you branched: `git rebase main` on the feature branch, re-run the tests, then retry.

Report the `main` commit hash (`git rev-parse --short main`) when done.

## Arguments
$ARGUMENTS
