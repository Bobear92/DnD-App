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

## Step 6 — Commit and push

```bash
git add <specific files — never git add -A blindly>
git commit -m "$(cat <<'EOF'
<concise summary of what was built/fixed and why>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
git push origin main
```

Report the commit hash when done.

## Arguments
$ARGUMENTS
