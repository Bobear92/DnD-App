# Post-deploy follow-ups — ticket worklist

**Goal:** everything left open by the first production deploy ([first-production-deploy.md](first-production-deploy.md),
complete 2026-11-23, live at v0.1.2) in one place, so a new session can pick it up without reading old session logs.

**Status:** 1 done (T1). Collected 2026-11-23. Order is a suggestion. CLAUDE.md is now ~53 KB of a 60 KB cap
(`claudeMdBudget.test.js`); doc lines go to the files its Docs index names.

## T1 — Clean up CLAUDE.md (do first)
- [x] Trimmed CLAUDE.md 99.7 KB → ~53 KB (2026-11-23): column listing → `docs/schema.md`, endpoint tables →
  `docs/api.md` (CLAUDE.md keeps the cross-cutting API conventions), routes table → `docs/frontend-map.md` (already
  held it), to-do lists → `docs/backlog.md` (items already in this ticket deduped), backend tree compacted, stale
  `require_gm` references fixed. Budget test lowered to 60 KB; skills/agents/hook prompt repointed.
- [x] Rules (Post-Turn Requirements, Character sheet rules, workflow) kept.

## T2 — Security follow-ups (fix before inviting anyone beyond friends)
From the T10 review (detail: first-production-deploy.md › T10):
- [ ] Any user can read any campaign's homebrew (`?campaign_id` / campaign-owned rows on every compendium GET).
- [ ] User search returns emails; 2-character queries can harvest every address. Pairs with T3's username list.
- [ ] Music uploads keep the client's Content-Type, so the bucket can serve HTML.
- [ ] `is_admin` grants GM powers in `characters/service.py`.
- [ ] A GM adds players with no consent step.
- [ ] Children of a hidden location (maps / NPCs / links) are listable by id.
- [ ] Era ids from another campaign are accepted on timeline/session dates.
- [ ] Campaign classes are writable by anyone (latent — no API creates them).
- [ ] No login rate limit or password minimum.
- [ ] `/docs` is public in production.
- [ ] Every member's email is in `CampaignResponse` (the Members tab shows emails, including the GM's own).

## T3 — Robert's smoke-test findings (2026-11-23)
- [ ] **Invite Player: browsable username list** — pick from usernames, never show emails.
- [ ] **GM character cards show the owning player's username** for characters players made.
- [ ] **A login in another tab should switch this tab.** The token is shared in localStorage, so two normal windows
  silently act as whoever logged in last. Listen for the `storage` event and reload / re-read the user.
- [ ] **Player Locations view should match the GM's:** players get the top-level world-map preview (respecting
  visibility). Maps start hidden from players (separately from their location) — make that obvious to the GM. A real
  player sees the GM's empty text "No maps yet. Upload one to get started." (`LocationDetail.jsx`); should be
  "No visible maps."

## T4 — Feature requests (moved here from CLAUDE.md › Not Yet Built)
- [ ] Account emails + password reset (welcome email, admin notified of new accounts, forgot/reset password). Needs an
  email provider and a reset-token table; nothing sends email today.
- [ ] Items deep dive, incl. moving the 34 potion-type magic items into Potions (seed change + delete the prod rows).
- [ ] Bug: the Locations "Upload failed" banner stays up after a later upload succeeds.

## T5 — Production operations
- [ ] **Upgrade the free Render database before ~2026-12-18** (it expires; no backups on free).
- [ ] **Watch the next release that changes `backend/` or `frontend/`**: it should deploy both services with no manual
  click (CI now runs on `production`). A release touching neither Root Directory deploys nothing, silently — that is
  expected (deployment.md). If an app-code release doesn't deploy, set up Render Deploy Hooks called from `/release`.
- [ ] Decide on the prod "Smoke test" campaign + SmokeTestPlayer account: keep for release checks, or delete.
- [ ] Robert: optionally delete `C:\Users\rober\dnd-prod-db.env`; keep `C:\Users\rober\dnd-backups\` off OneDrive.

## T6 — Engineering follow-ups carried from the deploy
- [ ] `CalendarTab.test.jsx › player sees "not set up" message` flaked once under load — check with `SLOW_MOCKS=1`.
- [ ] Send only changed `character_data` keys on save (merge-on-save still carries a full stale copy).
- [ ] One shared axios client + token-expiry handling (each service duplicates the client and interceptor).
- [ ] R2 backups / versioning for uploads.
- [ ] Local venv is Python 3.14; production is 3.12.
- [ ] Optional app-level upload quota.
