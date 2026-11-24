# D&D RPG Application — Project Context

## Post-Turn Requirements (ENFORCE AFTER EVERY CODE CHANGE)

After every turn that modifies `.jsx` or `.py` files, complete ALL of these before finishing:

1. **Tests** — Run `npm test` in `frontend/`. All tests must pass. The Stop hook **blocks** if tests fail — you cannot end the turn until they pass.
2. **Docs audit** — columns → `docs/schema.md`, endpoints → `docs/api.md`, routes → `docs/frontend-map.md`, to-dos → `docs/backlog.md`; CLAUDE.md gets only a new standing rule or cross-cutting convention. **System descriptions go to the matching `docs/systems/*.md`; frontend component/service entries, per-page UI behaviours and the frontend test catalog go to `docs/frontend-map.md`; backend test files go to `docs/backend-tests.md`.** Never grow CLAUDE.md with narrative — it loads every turn and is capped at 60 KB by a test.
3. **Agents audit** — Check `.claude/agents/` for stale references to patterns you changed.
4. **Backend restart** — If any `.py` file changed, kill python* and start `uvicorn main:app --reload` yourself. Never ask the user to restart.

The Stop hook runs after every turn and blocks completion if `npm test` reports failures.

### Docs index — read the matching file BEFORE working on that area

CLAUDE.md holds rules and compact reference only. The descriptions of how each built system works were moved out so they
load when needed rather than every turn. **They are not optional reading: open the file before touching that area.**

| Before you touch… | Read |
|---|---|
| Any frontend component, page or service; per-page UI behaviour; the test catalog | [docs/frontend-map.md](docs/frontend-map.md) |
| The Action Economy tab, attack cards, riders, attached features, combos, spell cards | [docs/systems/action-economy.md](docs/systems/action-economy.md) |
| Items tab, hands/equipping, ammunition, range and reach, magical attacks, starting equipment, equipment-gated features | [docs/systems/inventory.md](docs/systems/inventory.md) |
| Feats: the effects model, pickers, snapshots, feat-granted spells and maneuvers | [docs/systems/feat-effects.md](docs/systems/feat-effects.md) |
| Active effects (anything switched on/off, "Channel …" features) | [docs/systems/active-effects.md](docs/systems/active-effects.md) |
| Defenses, Senses, save features, companions, mounts | [docs/systems/sheet-panels.md](docs/systems/sheet-panels.md) |
| A Fighter subclass (Rune Knight, Samurai; Psi Warrior, Echo Knight, Cavalier, Arcane Archer are covered in action-economy) | [docs/systems/fighter-subclasses.md](docs/systems/fighter-subclasses.md) |
| Level-up pools (Metamagic, Invocations, Arcane Shot, runes) and subclass grants | [docs/systems/level-up-and-grants.md](docs/systems/level-up-and-grants.md) |
| Spells tab, subclass spellcasting, subclass-granted spells | [docs/systems/spells.md](docs/systems/spells.md) |
| Rests, the rest dialog, initiative recharges, Encounters | [docs/systems/rest-and-initiative.md](docs/systems/rest-and-initiative.md) |
| Encyclopedia mechanics reference pages | [docs/systems/mechanics-pages.md](docs/systems/mechanics-pages.md) |
| Coverage reports and ratchet baselines | [docs/systems/coverage-worklists.md](docs/systems/coverage-worklists.md) |
| A model, migration or table's columns | [docs/schema.md](docs/schema.md) |
| Why a column or `character_data` key is shaped the way it is; seeding history | [docs/schema-notes.md](docs/schema-notes.md) |
| A backend route: adding one, changing its auth, or calling it from a service | [docs/api.md](docs/api.md) |
| What's not built yet / deferred (add new to-dos here) | [docs/backlog.md](docs/backlog.md) |
| What each backend test file covers | [docs/backend-tests.md](docs/backend-tests.md) |
| Multi-session worklists | `docs/tickets/` (see its README) |
| Hosting, env vars, branches/releases/rollback, rollback-safe migrations | [docs/deployment.md](docs/deployment.md) |
| Planning a feature or class, before QA hand-off, or writing a retro — every lesson learned, by category, with what enforces it | [docs/learnings.md](docs/learnings.md) |

**Where new documentation goes:** a new or changed system description → its `docs/systems/` file (create one and add a row
here if none fits). CLAUDE.md gets at most a one-line change, plus any new STANDING RULE in "Character sheet rules".
`src/test/claudeMdBudget.test.js` fails the build if this file passes 60 KB or links a doc that does not exist.

### Multi-file changes — plan first
When a change touches **3 or more files**, state a brief plan before editing:
- Which files change and what specifically changes in each
- Which tests will be written or updated
- What CLAUDE.md sections need updating

Post the checklist, then proceed. This prevents wrong-approach detours.

For a **large multi-slice feature** (repeats a pattern across many units — all remaining classes/subclasses/feats, a new edition's system, wiring every class into the action economy), use the **`/to-tickets` skill** instead of an inline checklist: it decomposes the goal into an ordered, proven-slice-first worklist persisted to `docs/tickets/<slug>.md` (see `docs/tickets/README.md`), so the work is resumable across sessions and driven off the machine worklists (coverage reports + `docs/character-system-backlog.md`). Often follows a `/grill` GO.

### Preserved intent rule
**Never re-introduce a feature, field, or component the user has explicitly removed.** If something is absent from the codebase, assume it was removed on purpose and confirm before adding it back.

### Prose-only needs sign-off (never self-assigned)
**When a feature, feat clause or pool option is triaged as prose-only / narrative / a `note`, FLAG IT AND SHOW THE USER before calling the work complete.** Collect them into one short list — one line each: `feature › clause — what it would take, and the MISSING MODEL that stops it` (no concentration/duration state, no distance-to-target, no surprise state, no target at all, no computed tool-check number, no mount entity, a choice the app never persists). Say which you think are genuinely un-modelable vs. merely **deferred**, and let the user decide.

"It's flavor" / "it's narrative" / "can't be computed" with nothing named is NOT a reason — if you can't name the missing model, the clause is probably mechanizable and the surface just hasn't been found. This is the escape hatch that hides missed mechanics: Shield Master's Interpose Shield, Sentinel's and Polearm Master's opportunity-attack clauses, and Storm Rune's entire reaction all shipped inside prose and were all found by the user in QA. Enforced in `/subclass-features` (Phase 1.5), `/feat-effects` and `/class-config`.

### Suggest new skills when patterns emerge
**When you notice a repeating pattern that would benefit from a new skill, tell the user.** Examples of triggers: three or more files following a near-identical scaffold (like the class sheets, since consolidated into the data-driven `/class-config` skill), a multi-step setup the user has walked you through more than once, or a tab/module pattern that's about to be repeated (e.g. a new encyclopedia tab following the same "system list + GM override + campaign homebrew + EditPage" shape). Surface the suggestion with what the skill would do — don't create it unprompted.

### Efficiency tripwires — STOP and flag before proceeding
These are hard checks, not aspirations. When any tripwire fires, **pause and tell the user we may need to rethink the approach** before writing code. A skill that automates a smell (e.g. "apply this edit across 24 files") is a band-aid, not a fix — surface it.

- **Duplication tripwire:** About to make a **near-identical edit to ≥3 files**? Stop. Propose a data-driven config or shared abstraction (hook/component/helper) *before* fanning the change out. Fanning out is the fallback, not the default.
- **Breadth-before-vertical tripwire:** About to build the **Nth variant** of an existing pattern (another class sheet, tab, module)? Confirm **one** vertical slice is proven end-to-end (creation → use → edge cases → rest/reset) before replicating. Don't scale an unproven pattern.
- **Rework-loop signal:** If a new request means **re-editing the same set of files we recently built**, the underlying pattern is probably wrong. Flag the root cause instead of patching across all the copies.
- **Skill-as-band-aid signal:** If a skill's only job is "make the same change across N files," say so out loud — the architecture likely needs consolidation, and the skill may be hiding it.
- **Context-bloat signal:** If a CLAUDE.md edit adds long prose describing per-component UI behavior already covered by tests, prefer trimming/linking over growing the file. This doc loads every turn — narrative changelog prose is a token cost, not documentation.

When unsure whether a tripwire applies, raise it anyway — a 10-second flag is cheaper than a 24× rework. See `docs/character-system-backlog.md` for the case study that motivated these (24 class sheets built before the interaction model was settled → Epics 1–3 became 24× reworks).

**The `/grill` skill is the active gate for these tripwires** — run it before building the Nth variant of a pattern, a ≥3-file fan-out, or an unproven abstraction; it interrogates the plan (pattern/duplication, vertical slice, smallest proving step, preserved intent, enforcement) and ends GO or NO-GO/CONSOLIDATE. A `PreToolUse(Write)` hook (`.claude/hooks/nth-variant-nudge.mjs`, wired in `.claude/settings.json`) fires it automatically: when a Write would create the Nth file of a known scaffold pattern (a hand-written `*Sheet.jsx`, a `configs/*.js` class config, a `subclassData/*.js` file) with ≥2 siblings, it blocks that one write (exit 2) with a reminder — once per pattern per session, then re-issue to proceed.

---

## Development Workflow (Git)

**Short-lived feature branches, merged to `main` on every ship.** `main` is the **develop line**; **`production`** (what Render deploys) moves only by `/release` or a rollback to a tag — see [docs/deployment.md](docs/deployment.md#branches-releases-rollback).

1. **Branch FIRST — at the start of the session, before any work begins.** The moment a session has a subject (a feature, a bug, a QA pass), branch from an up-to-date `main`:
   `git checkout main && git pull --ff-only && git checkout -b feature/<short-name>`
   **This includes QA-only sessions** — a QA pass reliably turns into fixes, and branching after the first finding means the branch point is already contaminated. Branch before the app is even opened. Never accumulate unrelated work on one long-lived branch (a 10-commit / 100-file branch means `main` was stale for too long).
2. **Develop on the branch** — commit as you go; write tests alongside each change (see Post-Turn Requirements). Commit/push only when the user asks.
3. **Ship (`/ship-it`)** — run the full test suite + coverage gates → **verify runtime changes end-to-end** (Step 3c: drive the real app for any product-source change, skip for docs/tests/tooling-only) → audit CLAUDE.md → commit on the feature branch → **fast-forward `main` to the branch (`git merge --ff-only`) and push `main`** → delete the feature branch (local + remote). The `/ship-it` skill automates this final step (branch-aware). It is not named `/ship`: Claude Code's built-in `/ship` (review-only, no merge) shadows a project command of that name.
4. **Next feature** starts from a fresh branch off the new `main`.
5. **Release (`/release`)** — only when Robert asks; needs his explicit yes before pushing. `/ship-it` never touches `production`.

**Migrations must be expand → contract** (add now, drop/rename in a later release); an autogenerate "rename" is a drop + add that deletes data.

Commit messages end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Keep merges fast-forward (no merge commits); if `--ff-only` fails because `main` moved, rebase the feature branch on `main`, re-run tests, then merge.

**This is enforced, not just documented** (it was skipped once and a whole feature landed as a direct commit on `main`):
- `.claude/hooks/feature-branch-guard.mjs` — a `PreToolUse(Write|Edit)` hook blocks the FIRST edit of a repo file while `main`/`master`/`production` is checked out, with instructions to branch. Fires once per session, so re-issuing gets through when you genuinely need `main`. **It is a backstop, not the trigger** — it can only fire once an edit is already being attempted, which is too late for step 1 above. Branching is Claude's job at session start; the hook just catches the miss.
- `.githooks/pre-commit` — the tool-agnostic backstop: refuses a commit on `main` or `production` whatever is driving git (both hooks tested by `src/test/branchGuards.test.js`). **One-time setup per clone: `git config core.hooksPath .githooks`.** `git merge --ff-only` creates no commit, so /ship-it's merge is unaffected; the escape hatch is `git commit --no-verify`.

Uncommitted work carries across `git checkout -b`, so branching late is always safe — nothing already edited is lost.

---

## Session Logs

Every Claude Code session has a log in `docs/sessions/YYYY-MM/DD/HHMM_<branch>.md`, indexed in `docs/sessions/INDEX.md` (newest first, plus a tag → sessions index — search by tag there before reading logs). The `session-log` hook creates the file on the session's first real turn (a session never prompted leaves no file; SessionStart deletes any zero-turn log) and appends a Turn log entry after every response — **never edit the Turn log or INDEX.md by hand.** Run **`/log`** before shipping (it is Step 5b of `/ship-it`) to write the title, area, summary, **where Claude struggled / where Robert stepped in**, decisions and open threads. Do not read old logs unless asked — they are history, not context.

---

## What This Is
A full-stack D&D campaign organizer and compendium. Users create campaigns, invite players, and manage all campaign content — with a customizable ruleset layered on top of the official D&D base compendium.

- **Backend:** Python 3.12 + FastAPI — `backend/`
- **Frontend:** React (Vite) + Tailwind CSS v4 + shadcn/ui — `frontend/` ← IN PROGRESS
- **Database:** PostgreSQL (`dnd_app_dev`) + SQLAlchemy ORM + Alembic migrations
- **Auth:** JWT tokens via python-jose + bcrypt via passlib
- **Repo:** https://github.com/Bobear92/DnD-App

---

## User Roles

### Admin (`is_admin = true`)
- Manages the **base compendium** — the shared D&D rules as written (spells, creatures, items, races, backgrounds, feats, etc.)
- Base compendium content is read-only for everyone else
- Not inherently a GM — admin is a separate super-user role

### Game Master (GM)
- **Any user** can create a campaign; doing so makes them the GM of that campaign
- A user can be GM of multiple campaigns simultaneously
- A user can be GM of some campaigns and a player in others
- GM permissions within a campaign:
  - Invite and remove players
  - Create campaign-specific content (NPCs, loot tables, locations, session notes)
  - Override any base compendium entry for their campaign (spell text, stat blocks, item stats, race traits, etc.)
  - Create entirely new homebrew content (custom races, spells, items, etc.) scoped to the campaign
  - Copy custom content from one of their campaigns to another
  - Control character and NPC visibility to players
  - View all characters in their campaign

### Player
- Sees only campaigns they have been invited to
- Creates and manages their own characters within a campaign
- Sees the **campaign-modified** version of the compendium (GM overrides apply), not the raw base
- Can have multiple characters per campaign
- Cannot create content — requests go through the GM

### Unauthenticated
- Login and register pages only

---

## Content Hierarchy

```
Base Compendium (admin-managed, system-owned, D&D rules as written)
    └── Campaign Layer (GM-managed, campaign-scoped)
            ├── Overrides: GM modifies a system entry for this campaign
            │   (e.g. Fireball does different damage, Goblin has extra traits)
            ├── Homebrew additions: new spells/items/races that don't exist in base
            └── Campaign tools: NPCs, loot tables, locations, session notes
                    └── Players consume the merged view (campaign overrides + base)
```

**Override pattern:** For each content type, `owner_type='campaign'` entries shadow
`owner_type='system'` entries of the same name within that campaign's context.
When a campaign queries spells (for example), the service returns campaign overrides
first, falling back to system entries for anything not overridden.

**Content portability:** A GM can copy any of their campaign's custom/override content
into another campaign they own. These are always copies — no shared references between
campaigns.

---

## Backend Structure (Role-Based Organization)

Each module is a folder of `routes.py / service.py / models.py / schemas.py`.

```
backend/
├── auth/              # login, register, JWT
├── players/           # characters, races, backgrounds, feats, classes
├── gm/campaigns/      # campaigns + members; campaign_tools/: npcs, locations, calendar, timeline, session_notes, encounters
├── gm/tools/          # loot_tables
├── shared/encyclopedia/  # bestiary, spells, items/{weapons, armor, adventuring_gear, potions, magic_items, food_drink}
├── shared/            # database.py, dependencies.py (get_current_user, require_admin, require_campaign_gm,
│                      #   check_content_ownership), security.py, enums.py (OwnerType), exceptions.py,
│                      #   file_storage.py ← THE upload store (portraits, maps, session images, music):
│                      #   STORAGE_BACKEND local (backend/uploads, served at /uploads) | r2 (prod). Never add a per-module storage.py
├── migrations/        # Alembic (owns the schema)
└── main.py, config.py
```

**Layer rule:** routes.py → service.py → models.py. Never backwards.

---

## Ownership Model

All content tables use `OwnerType` to distinguish base compendium from campaign content:

```python
class OwnerType(enum.Enum):
    system = "system"      # Admin-managed base compendium (D&D rules as written)
    campaign = "campaign"  # GM-managed content scoped to a specific campaign
```

Tables using this model: `races`, `backgrounds`, `feats`, `loot_tables`, `spells`, `creatures`, all item tables
- System items: `owner_type='system'`, `owner_id=NULL` — visible to all, editable by admin only
- Campaign items: `owner_type='campaign'`, `owner_id=campaign_id` — visible to campaign members only, editable by that campaign's GM

---

## Business Rules (Enforce These Always)

### Campaigns
- **Any authenticated user can create a campaign** — they become the GM (`campaign_members` role `'gm'`)
- **The GM invites; the player must accept** (`campaign_invites`) — no direct add, no self-service join
- **Players see ONLY campaigns they are assigned to**
- **Each campaign has exactly ONE GM** — the user who created it
- **A user can be GM of multiple campaigns** and/or a player in others simultaneously

### Characters
- **Characters belong to ONE campaign** — no many-to-many
- **A player can have multiple characters per campaign**
- **Players see:** own characters + characters where `is_visible_to_players = true`
- **GM sees:** ALL characters in their campaign; can edit, delete, and write private `gm_notes`
- **`gm_notes`** is always stripped from responses returned to players and character owners
- **`personal_notes`** is visible only to the character owner and the GM; stripped from all other player responses; GM cannot overwrite the owner's personal notes (service pops the field if `is_gm and not is_owner`)
- **`backstory`** and `notes` (public notes) are visible to all campaign members
- **Portrait images** stored at `uploads/characters/{character_id}/uuid.ext` via `shared/file_storage.py` (local disk in dev, R2 in production)

### Content
- **Only admin can create/edit/delete system (`owner_type='system'`) content**
- **Only the campaign's GM can create/edit/delete campaign (`owner_type='campaign'`) content**
- **Players consume content but cannot create or modify it**
- **Campaign queries return overrides first, then fall back to system entries**
- **Content can be copied between a GM's own campaigns** — always as independent copies

---

## Database Schema (45 Tables)

**The full column listing is [docs/schema.md](docs/schema.md); why each column is shaped the way it is goes in
[docs/schema-notes.md](docs/schema-notes.md).** Read schema.md before touching a model or migration, and update it in
the same change. Tables by area: core (`users`, `campaigns`, `campaign_members`, `campaign_invites`, `characters` + `character_timeline_events`,
`character_npcs`); compendium (`races`, `backgrounds`, `feats`, `character_classes`, `class_features`, `spells`,
`creatures`, the six item tables, `loot_tables`); GM tools (`npcs` + 2 relationship tables, `locations` + maps/pins/links/
relationships/npcs, the calendar's 5 tables, `timeline_events` + 2 junctions, `session_notes` + 4 junctions, `encounters` +
`encounter_combatants`).

The constraints that change how code is written:
- **`characters.character_data` (JSONB)** holds class-specific mechanical state. **PUT MERGES top-level keys** (a missing
  key is kept); delete with `character_data_remove: [keys]`.
  - **Max HP is computed at read time:** `hp_rolls` + level × CON mod + per-level bonuses (frontend `effectiveMaxHp` and
    backend `_effective_max_hp` share one fixture).
  - **`inventory` and `feats` are SNAPSHOTS.** A snapshotted shape that gains a field needs a data migration; never
    "remove and re-add", which loses equipped/hand/designations keyed to the uid.
  - **Every `<pool>_used` rest counter needs a row in the backend `_REST_RESOURCES` table.**
  - **`active_effects`** holds the keys of the effects switched on; a rest never clears it.
- **`characters.experience_points` is clamped to [0, 355_000] in the service** (the frontend mirrors it as `MAX_XP`).
  `level_up_pending` is re-derived on level-up in XP campaigns.
- **`characters.appearance`:** nothing may ever compute from it.
- **`campaigns.campaign_mode`:** read it ONLY via `campaigns/campaignFeatures.js`.
- **`weapons.range_normal`/`range_long` are two integers**, never a "150/600" string. They are NULL for a pure melee
  weapon, whose 5 ft is reach.
- **Encyclopedia tables have no DB-level `UNIQUE(name)`.** Uniqueness is enforced in each `service.py` (spells: name +
  edition + owner scope). That is what lets one spell exist once per edition.
- **Seed scripts UPSERT system rows** via `shared/seeding.py`; the seed file is the source of truth and campaign rows are
  never touched. `seed_data.py` is dev-only. Feat coverage is a ratchet gate: `python report_feat_effects.py --check`.

## Critical Implementation Details

### JWT Tokens
- Store user_id as **STRING** in token: `data={'sub': str(user.id)}`
- Expiration: `ACCESS_TOKEN_EXPIRE_MINUTES` (default 30; production 720). No refresh/re-login flow exists, so this is how long a player stays logged in
- Import: use `HTTPAuthorizationCredentials` from `fastapi.security` (NOT `HTTPAuthCredentials`)

### bcrypt Version
- **Pin bcrypt to 4.0.1** — bcrypt 5.x breaks passlib 1.7.4 with a `ValueError` on every hash call. `requirements.txt` should specify `bcrypt==4.0.1`. Do not upgrade.

### Character Data (JSONB)
- `character_data` stores class-specific fields: spell slots, ki points, fighting style, etc.
- Structure varies by class — this is intentional and flexible by design

### Campaign Members
- `campaign_members` responses include nested user object: `{id, username}` — never an email
- User info is eagerly loaded with member relationships

### GM Authorization
- A user is "GM of campaign X" if they have a `campaign_members` row with `role='gm'` for that campaign
- Checked two ways: the campaign routes use the `require_campaign_gm` dependency (`shared/dependencies.py`); the campaign-tool
  modules (calendar, encounters, locations, npcs, session_notes, timeline) call their own `_require_gm` in `service.py`.
  Either is correct — never `require_admin` for GM actions

### Calendar Circular FK
- `campaign_calendars.current_era_id → calendar_eras` and `calendar_eras.calendar_id → campaign_calendars` is a circular FK cycle
- Resolved with `use_alter=True, name="fk_calendar_current_era"` on the `current_era_id` FK — SQLAlchemy emits it as `ALTER TABLE` after creation and excludes it from topological sort
- Test teardown uses raw `DROP TABLE IF EXISTS ... CASCADE` instead of `Base.metadata.drop_all()` (which can't sort circular FKs)
- `conftest.py` nullifies `campaign_calendars.current_era_id` before each-test delete: `_CIRCULAR_FK_NULLIFIERS = ["UPDATE campaign_calendars SET current_era_id = NULL"]`

### Calendar Era Math
- **Absolute year**: hidden internal integer used for sorting/conversion; never shown to GM or players
- `era_to_absolute(era, era_year)`: `era_year + epoch_offset` (ascending) or `epoch_offset - era_year` (descending)
- `absolute_to_era(era, absolute_year)`: reverse of above
- **No year 0**: adjacent opposite-direction eras (e.g. BBF/ABF) offset by 1; BBF 1 = absolute X, ABF 1 = absolute X+1 (achieved via transition anchor)
- **Transition anchor** (descending era, `anchor_this_year=None`): year 1 of the descending era is the year immediately BEFORE the anchor reference year
- **`_load_calendar(db, cal)`**: manually attaches `.seasons`, `.months`, `.eras` as Python attributes on the ORM object so Pydantic `from_attributes=True` can serialize them (these are not SQLAlchemy relationships)

---

## API

Base URL `http://localhost:8000` (docs at `/docs`). **Every endpoint, with its method and auth rule, is listed in
[docs/api.md](docs/api.md).** Read it before adding or changing a route, and update its table in the same change.
Route prefixes: `/api/auth`, `/api/characters`, `/races` `/backgrounds` `/feats` (no `/api`), `/api/classes`,
`/api/gm/campaigns` (campaigns, plus `/{id}/locations|calendar|timeline|sessions|encounters`), `/api/gm/campaigns/npcs`,
`/api/gm/tools/loot-tables`, `/api/encyclopedia/{bestiary|spells|items/<category>}`.

Conventions every route follows:
- **GM-private fields are stripped for players.** `gm_notes` is always removed from character, NPC, location, timeline
  and session responses. A player gets only `is_visible_to_players` rows and is blocked from a hidden row's detail.
- **Character PUT** uses `CharacterGmUpdate`:
  - only the GM sets `gm_notes` and `is_visible_to_players`;
  - the GM cannot overwrite `personal_notes`;
  - `character_data` is merged (see Schema);
  - an `appearance` write replaces the whole object.
- **`?campaign_id=N` merges campaign rows over system rows** (same name, plus edition where it applies, means the
  campaign row wins).
- **`?edition=5e|5.5e`** filters spells, feats and classes. On spells, `5.5e` falls back to the 5e row of the same name.
- **A new campaign setting** goes on `PUT /api/gm/campaigns/{id}`, an unknown value returns 422, and it must be on both
  `CampaignResponse` and `CampaignListItem` or the frontend never sees it.
- **Rests:** `POST /api/characters/campaign/{id}/rest` (GM). What a rest restores is defined ONCE, in `_REST_RESOURCES` /
  `_INITIATIVE_RESOURCES`. `dry_run: true` previews the result for the rest dialog.
  → [rest-and-initiative](docs/systems/rest-and-initiative.md)
- **Encounters are GM-only, reads included.** Give players a view later by adding a visibility flag, not by loosening
  this. The service returns combatants in initiative order (unrolled last), so callers never re-sort.
- **`*ListItem` schemas drop fields silently.** A field missing from the list schema is stripped by `response_model`;
  see the round-trip test rule under Testing.

## Frontend UI Standards (ALWAYS FOLLOW)

**All frontend work MUST use Tailwind CSS + shadcn/ui. Never write custom CSS for new components.**

### Tailwind CSS v4
- Installed via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed
- Use Tailwind utility classes directly on JSX elements: `className="flex items-center gap-4 p-4"`
- CSS variables for theming are defined in `src/index.css`. **The app is dark-only**: the dark palette lives at `:root`, and `<html class="dark">` in `index.html` is what makes Tailwind's `dark:` variants apply (the variant is keyed on a `.dark` ancestor). Before that class existed, all ~550 `dark:` classes were dead and light-palette boxes rendered pale on the dark page; `src/test/darkTheme.test.js` guards it. For new UI prefer the theme tokens (`primary`, `foreground`, `muted-foreground`, `card`, `border`, `muted`) over light palettes like `bg-amber-50`
- `cn()` helper at `@/lib/utils` — use for conditional class merging:
  ```js
  import { cn } from "@/lib/utils"
  <div className={cn("base-class", isActive && "active-class")} />
  ```

### shadcn/ui
- Components live in `src/components/ui/` after installation
- Install new components: `npx shadcn@latest add <component>` (run from `frontend/`)
- Common components to reach for: `Button`, `Card`, `Dialog`, `Table`, `Input`, `Label`, `Badge`, `Sheet`
- Import path: `@/components/ui/<component>`
- Config file: `components.json` (do not edit manually)
- Icon library: `lucide-react` — import icons as `import { IconName } from "lucide-react"`
- **`<SelectItem value="">` is forbidden** — Radix UI reserves empty string to signal "clear the selection". Use a sentinel like `"__none__"` and convert back to `null`/`''` in `onValueChange`. Passing `value=""` crashes the entire React tree in React 19.

### Path Aliases
- `@/` resolves to `frontend/src/` — always use this for internal imports

### Existing CSS Files
- The existing `.css` files in `auth/`, `campaigns/`, `dashboard/`, `shared/` were written before Tailwind was added (`characters/` has been migrated)
- When touching these pages, migrate styles to Tailwind classes and delete the old CSS file
- Do NOT write new `.css` files for new components

---

## Frontend — Current State

The full `frontend/src/` component & service tree — every file's responsibility and its per-file test coverage — lives in **[docs/frontend-map.md](docs/frontend-map.md)**. **Read that file before doing frontend work.** Kept below (these guide every turn): the Auth/Campaign context pattern, a pointer to the routes table (in frontend-map) and to what's not built yet (docs/backlog.md).

### Auth + Campaign Context Pattern
- `AuthContext` — wraps the entire app; calls `/api/auth/me` on mount; `user` is null until resolved; exposes `setUser` so `Login` can update context without a page reload
- `CampaignContext` — `campaign` shape: `{id, name, description, edition, created_by, userRole: 'gm'|'player', ...}`
  - `userRole` is computed in CampaignSelection: `campaign.created_by === user.id ? 'gm' : 'player'`
  - `created_by` comes from `CampaignListItem` (the list endpoint includes it — required for role computation)
  - Persisted to localStorage so page refreshes restore context automatically
  - `authService.logout()` clears `selectedCampaign` from localStorage to prevent stale role surviving across sessions
- `MainLayout` — heals stale `userRole` on every mount: re-derives role from `campaign.created_by === user.id` and calls `enterCampaign` if the stored value is wrong. Guards against sessions where role was incorrectly persisted.
- `isGm` in pages/components: always use `campaign?.userRole === 'gm'`, never `user.is_admin`
- `ProtectedRoute` — redirects unauthenticated users to `/login` while `loading` is true shows nothing

### Routes
Every page lives under `/campaigns/:campaignId/…` except `/login` and `/campaigns`. The full routes table, with each
page's notes, is in [docs/frontend-map.md](docs/frontend-map.md#routes--full-notes). Add a new route's row there.

### UI — Key Behaviours
Per-page behaviour details (Locations, NPCs, Campaign Settings, Calendar/Timeline, TimelinePage, Sessions, Members, Characters) live in **[docs/frontend-map.md](docs/frontend-map.md#ui--key-behaviours)** — read it when touching those pages.

### Character sheet rules (standing — apply on every sheet/feature change)

These were learned in QA and used to sit mid-paragraph inside system descriptions. Each system's full notes are in
`docs/systems/` (see the docs index near the top); these are the rules that must hold whichever system you are in.

**Reading rules text**
- **"…you can use your reaction…" = a card in the REACTIONS tab.** A feat authors a `reaction` action effect; a class/subclass
  feature gets a `tab:'reaction'` entry. The guard tests read feature descriptions and option pools — when a feature's real
  text lives in another module, check that a guard actually covers it before trusting a green suite.
- **"If you take the Attack action, you can use a bonus action…" = an Action + Bonus COMBO card**, never a lone bonus action.
- **Anything named "Channel …" gets an active status, and while active it must DO something.** A bare Use counter that spends
  a charge and changes nothing is a bug.
- **A container feature is audited one level deeper**: a feature granting a pool is one row per option per clause, and the
  rules live in the pool's module.
- **Prose-only needs the user's sign-off** with the missing model named (see the top of this file).

**Cards and numbers**
- **A rider MODIFIES an action you already had; a feature that ADDS one gets its own entry.** Weapon-attack riders are rows
  in `ATTACK_RIDERS`, single-entry riders in `ENTRY_RIDERS`, limited-use features that ride on an attack in `ATTACHED_FEATURES`.
- **One damage number per attack.** Extra damage is folded into it only when it is *currently happening* (an active effect the
  player switched ON). Damage that costs a spend decided AFTER the hit (Psionic Strike, Fire Rune, Sneak Attack, Divine Smite)
  stays in its feature's own block beside the Use control. Never print a second damage line.
- **A raised number is marked by COLOURING THE TOTAL and naming the source in words** (legend, note, breakdown term) — never
  by a second number beside it; "+7 and +2" reads as +9.
- **Every derived number gets a click-to-see-the-math breakdown** (`BreakdownValue`), and its numbers come from the data
  module that owns them, never from retyped feature blurbs.
- **A situational bonus carries its condition everywhere it is shown.** A `save_mod` needs a `situation`; advantage scoped by
  situation never tags the save/skill row (a tag asserts "always roll twice").
- **One resolution point per question, shared by every surface** (`getAttacks` feeds both the Items tab and Action Economy;
  `creatureSize` resolves size for everyone) so two tabs cannot disagree.
- **A Use control sits inside the block of the feature it spends**, and a two-cost control labels each count.
- **Hide vs. warn:** a requirement the app cannot check is a WARNING on the card, never a reason to hide it; a control that
  would do nothing right now is hidden.
- **Never label a feature with the level it was gained** (see Testing).

**State**
- **Spending an effect's charge switches the effect ON in the same patch** (the rule lives in `RestResourceControl`); ending
  an effect never refunds. Duration is not modelled, and a rest never clears `active_effects`.
- **Every `grants` field of an active effect needs a reader** (`runeFieldReaders.test.js`) — a grant nobody reads is a silent no-op.
- **Knowing is not having:** a carved rune counts only while its item is EQUIPPED (`activeRunes()`); gate on the real condition.
- **A player never restores a resource** (the one exception is the Psi Warrior die regain, where the restore IS the feature).
  Stocking weapons and ammunition is GM-only.
- **What a rest recovers is defined once, in the backend** (`_REST_RESOURCES`); the frontend shows a dry run. Do not write a
  frontend prediction of backend behaviour.
- **A snapshotted shape that gains a field needs a data migration** (inventory entries) or a re-sync (feat snapshots).

**What the app deliberately does not model** — surface these as text, never as a computed claim: distance to target, the
target itself, cover, concentration, durations/rounds, surprise, grappled/prone state, mounts, light, and anything derived
from `appearance`.

**Removed on purpose — do not re-add** (preserved-intent rule): the always-visible `ActiveEffectsBanner`; the Stats-tab
Racial Features card; the earned-features dropdown on the class sheet; the frontend `getRestSummary` rest mirror.

**Extending:** a new pool, grant, rider, defense, sense or save feature should be a DATA ROW in its existing table. Gate the row with declarative keys — `charClass` / `subclass` / `minLevel` / `edition`, checked by `matchesGate` in `shared/featureGate.js` — and keep `applies(ctx)` for what those cannot say; never hand-roll the filter or compare an edition string yourself (`isEdition2024`). In CharacterDetail, read class/subclass/level/scores/character_data from the one `sheetCtx` (`shared/characterContext.js`), not from `character` or a draft directly. The base formulas live in `shared/abilityMath.js`. If it
needs new component code, say so before building — that is the signal the mechanism is not finished (or that `/grill` is due).

### Not Yet Built
**What's missing or deferred is in [docs/backlog.md](docs/backlog.md)**, and ordered, active work is in `docs/tickets/`.
Add new to-dos there, never here. The headline gaps:
- Action Economy for the 12 non-Fighter classes.
- The unified Spells tab.
- Migrating hand-written class sheets to `/class-config`.
- Multiclassing.
- The Monsters tab / Bestiary.
- Admin panels.
- Models that don't exist yet: surprise, conditions, concentration, mounts.

## Testing

**Every new module — backend or frontend — MUST have a corresponding test file. Tests are written before or alongside the feature, not after.**

## Testing (Backend)

### Running tests
```bash
cd backend
source venv/Scripts/activate
pytest                        # run all tests
pytest tests/test_auth.py     # single file
pytest -k "test_gm"           # by name pattern
pytest -v                     # verbose (show each test name)
```

### Test database
Tests run against `dnd_app_test` (never `dnd_app_dev`). The database is derived automatically from `DATABASE_URL` in `backend/.env`. Tables are created once per session and wiped between each test — no manual setup needed.

**NEVER run two pytest sessions against this repo at the same time.** The session fixture does `DROP SCHEMA public CASCADE` + `CREATE SCHEMA public` at session START, so two concurrent runs destroy each other's schema mid-test. The symptom is a terrifying mass failure (one collision produced **427 failed / 270 errors**) that looks exactly like a catastrophic regression but is pure interference — re-running alone gives a clean pass. This includes backgrounding one run and starting another in the foreground. If you see a sudden mass failure, check for a concurrent run BEFORE debugging the code.

The session fixture does `DROP SCHEMA public CASCADE` + `CREATE SCHEMA public` at **session start** (not just end) so that stale schemas from model changes or interrupted runs never cause `UndefinedColumn` failures. Never change this to `create_all`-only — it won't pick up new columns on existing tables.

### Fixtures and helpers (backend/tests/conftest.py)
| Helper | Returns | Use for |
|--------|---------|---------|
| `client` (fixture) | `TestClient` | Every test |
| `make_user(client, n)` | `(headers, user_id)` | Regular user |
| `make_admin(client, n)` | `(headers, user_id)` | Admin user (flips `is_admin` in DB) |
| `make_campaign(client, gm_headers)` | `campaign_id` | Campaign setup |
| `invite_player(client, gm_headers, campaign_id, player_user_id)` | — | Make them a player (invite + accept) |
| `register(client, ...)` | response | Low-level registration |
| `auth_headers(client, ...)` | `{"Authorization": ...}` | Low-level auth header |

### Test file naming and location
One file per module: `backend/tests/test_<module>.py`, with shared fixtures in `conftest.py` and shared cross-language
fixtures in `backend/tests/fixtures/`. **The per-file catalog (what each file covers, with counts) lives in
[docs/backend-tests.md](docs/backend-tests.md) — add new test files there, not here.**

### Required coverage for each new module

**Campaign-scoped content** (NPCs, Locations, etc.) — test all of:
- GM can create / update / delete
- Player cannot create / update / delete
- Non-member gets 403
- Visibility flag: GM sees all, player sees only `is_visible_to_players=true`

**System/campaign owned content** (Encyclopedia, Loot Tables) — test all of:
- Admin can create/update/delete system content
- Non-admin gets 403 on system content
- GM can create/update/delete campaign content for their campaign
- Non-GM gets 403 on campaign content
- Non-member cannot access campaign content
- `?campaign_id` list merges campaign entries over system entries (same name → campaign wins)

**Admin-only compendium** (Races, Backgrounds, Feats) — test all of:
- Admin can create/update/delete
- Non-admin gets 403
- Any authenticated user can list/get
- `?campaign_id` returns system + campaign entries

**User-owned content** (Characters) — test all of:
- Owner can create/update/delete
- Non-owner cannot update/delete
- GM sees all; player sees own + `is_visible_to_players=true`
- Only GM can toggle visibility

### Patterns to follow
- Use `pytest` classes to group related tests (`class TestCreateNPC:`)
- Use `pytest.mark.parametrize` when the same assertions apply across multiple endpoints (see `test_encyclopedia.py`, `test_races_backgrounds_feats.py`)
- Do not mock the database — all tests hit `dnd_app_test` via the real ORM
- Each test is fully self-contained: create all data it needs, assert, done

### List/detail schema round-trip (REQUIRED for every module with a `*ListItem` schema)
Any module that has a separate `*ListItem` schema (distinct from `*Response`) **must** include a `TestXxxListFieldRoundTrip` class. Each test writes a value via the API (POST or PUT) and reads it back from the **list** endpoint — not the detail endpoint — to verify the field survives the `response_model=List[*ListItem]` serialization.

**Why this matters:** FastAPI's `response_model` silently strips any field that exists in `*Response` but is missing from `*ListItem`. The field is saved to the DB correctly; only the list endpoint drops it. The detail endpoint passes because it uses `*Response`. Without a round-trip test, this regression is invisible.

```python
class TestWidgetListFieldRoundTrip:
    def _list(self, client, campaign_id, headers):
        return client.get(f"/api/.../widgets", headers=headers).json()

    def test_description_in_list_after_create(self, client):
        # POST with description → GET list → assert description present
        ...

    def test_description_in_list_after_update(self, client):
        # PUT with description → GET list → assert description updated
        ...
```

Modules covered: `timeline_events`, `locations`, `characters`, `session_notes`. NPCs are exempt — they use `NPCResponse` for both list and detail.

---

## Testing (Frontend)

Stack: **Vitest** + **React Testing Library** + **jsdom**. Run from `frontend/`.

### Running tests
```bash
cd frontend
npm test              # run all tests once
npm run test:watch    # watch mode during development
```

### Test file naming and location
Co-locate each test file next to the source file it tests (`Foo.jsx` → `Foo.test.jsx`). **The catalog of test files — what
each covers, with counts — lives in [docs/frontend-map.md](docs/frontend-map.md) (component tests beside their components;
page-level tests under "Page-level test catalog"). Add new entries there, not here.**

### Setup
- Config in `vite.config.js` under the `test` key (`environment: 'jsdom'`, `globals: true`)
- Global setup: `src/test/setup.js` (imports `@testing-library/jest-dom` matchers; adds `window.HTMLElement.prototype.scrollIntoView = () => {}` — required because Radix UI Select calls scrollIntoView which jsdom doesn't implement)

### What to test for each new frontend page/component
- **Service calls:** the right API method is invoked with the right arguments
- **Context interaction:** components read from and write to context correctly (not raw localStorage)
- **Navigation:** `navigate()` is called with the correct path on success
- **Error states:** API failures surface an error message; navigation and context updates do NOT happen
- **Auth/GM gating:** GM-only elements are hidden in player view; restricted actions are blocked

### Async anchoring — the CI-only flake (READ BEFORE WRITING AN `await` IN A TEST)
**Await the thing the assertion depends on, not whatever renders first.** Mocked services resolve
instantly locally but not on a loaded runner, so a test that gates on synchronously-rendered chrome
(a row built from props, a search box that renders above the `loading` branch, a filter control) and
then asserts synchronously on *fetched* content passes locally and fails in CI. Three fixes, by shape:
- Asserting on fetched content → `await screen.findByText('<fetched value>')`, not `findByTestId` on a prop-rendered wrapper.
- Asserting a *negative* (`queryBy…` is null/absent) → wait for the loaded state first, or it passes trivially against an empty page.
- Asserting a side effect of a service call (`navigate`, a reload) → `await waitFor(() => expect(...))`; it runs in the call's continuation, so it is not there yet when the call itself resolves.

Run `SLOW_MOCKS=1 npm test` (harness in `src/test/setup.js`) to surface these deterministically — it
defers every `mockResolvedValue` by 50ms. It found 20 real latent flakes across 9 files after one
reached CI. Not part of the default run or CI; see the file for its one known artifact.

### Never declare a component inside a component
A component defined in another component's body is a **new component type every render**, so React
unmounts and remounts its whole subtree, destroying local state underneath. This shipped as a real
bug: all 20 hand-written class sheets declared their own `Field` in-render, so any parent re-render
(a late fetch during creation, an autosave on the live sheet) wiped a half-typed custom instrument
or closed an open subclass dialog. Declare components at **module scope** and pass what they need as
props; `Field` is now shared from `@/characters/components/sheets/Field`.
`src/test/noNestedComponents.test.js` fails the build on any new occurrence (ESLint is not the gate
here — `npx eslint .` currently reports ~376 pre-existing errors, so a rule there would go unread).

### Never label a feature with the level it was gained
User-facing text must not carry an `(L15)` / `, L18` / `L2+` tag. Every surface that shows a feature already only shows it once the character HAS it — class sheets level-gate their blocks, `notes` entries carry `minLevel`, and the Action Economy tab lists what you can do right now — so the annotation is redundant clutter on a sheet the player scans mid-combat. Put the level in a **level gate**, not the label. Where the level genuinely IS the information (a not-yet-unlocked placeholder, a progression list), write it in words: "Level 2+", "7th at 13". `src/test/noLevelAnnotations.test.js` fails the build on any new occurrence (it ignores comments, identifiers like `WARLOCK_SPELLS_L1_2024`, and SVG path data, and carries positive/negative self-tests so the guard can't silently stop detecting).

### Mocking patterns
```js
// Mock a service module
vi.mock('../npcService', () => ({ default: { getNpcs: vi.fn() } }));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock a context hook
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 1, name: 'Test', userRole: 'gm' } }),
}));
```

### Key regression tests
The tests that pin specific past bugs (login not calling `setUser`, `created_by` missing from the campaign list, stale `userRole`, the `<SelectItem value="">` crash, undefined `campaignId` in module-level components, …) are described in [docs/frontend-map.md](docs/frontend-map.md#key-regression-tests). Do not delete or weaken a test named there without reading why it exists.

---

## Development Commands

**Always start servers with the kill-first restart scripts** — never run a bare
`npm run dev` / `uvicorn` on top of a possibly-running instance. Multiple
instances were causing the frontend to drift off port 5173 (Vite silently
increments to 5174+) and stale uvicorn workers to serve cached modules. Each
script terminates any existing instance before starting, and Vite is pinned to
5173 with `strictPort` so it fails loudly instead of drifting.

```bash
# Frontend — ensures the backend is up first (starts it if :8000 is dead; the
# frontend can't function without it), kills any dev server on 5173-5176, then
# starts Vite on 5173
bash scripts/restart-frontend.sh

# Backend — kills all python* (uvicorn reloader + worker), then starts uvicorn.
# The backend MAY run on its own; the frontend may not.
bash scripts/restart-backend.sh

# Frontend tests
cd frontend && npm test

# Coverage ratchet gates (fail the build on a mechanization regression — see the coverage
# worklists in docs/systems/coverage-worklists.md). Frontend class-coverage runs inside `npm test`
# (coverage-ratchet.test.js). Backend feat-coverage is a standalone check:
cd backend && source venv/Scripts/activate && python report_feat_effects.py --check
# Bump a floor after mechanizing more:  npm run coverage:baseline  /  python report_feat_effects.py --write-baseline

# Database
psql -U postgres -d dnd_app_dev
alembic revision --autogenerate -m "description"
alembic upgrade head
```

**CI (`.github/workflows/ci.yml`):** on push to `main` + every PR — a frontend job (`npm ci` +
`npm test`, which runs the config-contract fixture + class-coverage ratchet) and a backend job
(Postgres service + `pytest`, then seeds feats and runs `report_feat_effects.py --check`). This is
the durable hard gate; the frontend ratchet is *also* enforced every turn locally by the Stop hook.

**Migrations are only exercised from scratch in CI.** `pytest` builds the test schema with
`create_all`, so it never runs the alembic chain; the backend job's feat-coverage step creates an
empty DB and runs `alembic upgrade head` then `alembic check` (models must match the migrated schema), the sole from-scratch
migration gate. **Alembic owns the schema: `main.py` creates no tables** — every new model needs a migration
(`restart-backend.sh` and the production `start.sh` run `alembic upgrade head` first). Tests install `requirements-dev.txt`. Autogenerate
run against a dev DB that already has the tables produces an **empty** migration (this is how
`c54f8b027131` shipped with a `pass` body and broke the chain) — after `alembic revision
--autogenerate`, open the file and confirm it isn't empty.

### Backend Server Restart — REQUIRED After Every Backend Change

**The user cannot see or access the terminal Claude uses to run the server. Claude must restart the server itself** after every backend change — do not ask the user to do it.

After any change to backend code — models, schemas, routes, service logic, or migrations — restart with the kill-first script (it terminates the existing python/uvicorn instance before starting a fresh one):

```bash
# Restart (run_in_background=true), then confirm startup
bash scripts/restart-backend.sh
# in a separate call:
sleep 4 && curl -s http://localhost:8000/docs > /dev/null && echo "Server up"
```

The running process caches old modules and silently serves stale responses (missing fields, wrong behavior) until restarted. This has caused multi-session debugging rabbit holes where the DB and schema files were correct but the API returned wrong data.

---

## Environment Variables (`backend/.env`, gitignored)

```
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/dnd_app_dev
SECRET_KEY=your-secret-key-change-this-in-production
# Optional (production sets these — see docs/deployment.md):
# ALLOWED_ORIGINS=https://app.example.com   ← comma-separated CORS origins; default = localhost:3000,5173
# DEBUG=false                               ← defaults to false
# ACCESS_TOKEN_EXPIRE_MINUTES=720          ← default 30
```
Frontend: `VITE_API_URL` (build time) is read ONLY by `frontend/src/lib/api.js`; never hardcode the backend URL.

---

