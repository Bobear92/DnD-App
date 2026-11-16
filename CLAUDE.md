# D&D RPG Application — Project Context

## Post-Turn Requirements (ENFORCE AFTER EVERY CODE CHANGE)

After every turn that modifies `.jsx` or `.py` files, complete ALL of these before finishing:

1. **Tests** — Run `npm test` in `frontend/`. All tests must pass. The Stop hook **blocks** if tests fail — you cannot end the turn until they pass.
2. **Docs audit** — CLAUDE.md: schema columns, endpoints, routes table, "Not Yet Built", and any new standing rule. **System descriptions go to the matching `docs/systems/*.md`; frontend component/service entries, per-page UI behaviours and the frontend test catalog go to `docs/frontend-map.md`; backend test files go to `docs/backend-tests.md`.** Never grow CLAUDE.md with narrative — it loads every turn and is capped at 100 KB by a test.
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
| Why a column or `character_data` key is shaped the way it is; seeding history | [docs/schema-notes.md](docs/schema-notes.md) |
| What each backend test file covers | [docs/backend-tests.md](docs/backend-tests.md) |
| Multi-session worklists | `docs/tickets/` (see its README) |
| Hosting, env vars, branches/releases/rollback, rollback-safe migrations | [docs/deployment.md](docs/deployment.md) |
| Planning a feature or class, before QA hand-off, or writing a retro — every lesson learned, by category, with what enforces it | [docs/learnings.md](docs/learnings.md) |

**Where new documentation goes:** a new or changed system description → its `docs/systems/` file (create one and add a row
here if none fits). CLAUDE.md gets at most a one-line change, plus any new STANDING RULE in "Character sheet rules".
`src/test/claudeMdBudget.test.js` fails the build if this file passes 100 KB or links a doc that does not exist.


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

**Short-lived feature branches, merged to `main` on every ship.** `main` is the deployable trunk and should never lag far behind.

1. **Branch FIRST — at the start of the session, before any work begins.** The moment a session has a subject (a feature, a bug, a QA pass), branch from an up-to-date `main`:
   `git checkout main && git pull --ff-only && git checkout -b feature/<short-name>`
   **This includes QA-only sessions** — a QA pass reliably turns into fixes, and branching after the first finding means the branch point is already contaminated. Branch before the app is even opened. Never accumulate unrelated work on one long-lived branch (a 10-commit / 100-file branch means `main` was stale for too long).
2. **Develop on the branch** — commit as you go; write tests alongside each change (see Post-Turn Requirements). Commit/push only when the user asks.
3. **Ship (`/ship`)** — run the full test suite + coverage gates → **verify runtime changes end-to-end** (Step 3c: drive the real app for any product-source change, skip for docs/tests/tooling-only) → audit CLAUDE.md → commit on the feature branch → **fast-forward `main` to the branch (`git merge --ff-only`) and push `main`** → delete the feature branch (local + remote). The `/ship` skill automates this final step (branch-aware).
4. **Next feature** starts from a fresh branch off the new `main`.

Commit messages end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Keep merges fast-forward (no merge commits); if `--ff-only` fails because `main` moved, rebase the feature branch on `main`, re-run tests, then merge.

**This is enforced, not just documented** (it was skipped once and a whole feature landed as a direct commit on `main`):
- `.claude/hooks/feature-branch-guard.mjs` — a `PreToolUse(Write|Edit)` hook blocks the FIRST edit of a repo file while `main`/`master` is checked out, with instructions to branch. Fires once per session, so re-issuing gets through when you genuinely need `main`. **It is a backstop, not the trigger** — it can only fire once an edit is already being attempted, which is too late for step 1 above. Branching is Claude's job at session start; the hook just catches the miss.
- `.githooks/pre-commit` — the tool-agnostic backstop: refuses a commit on `main` whatever is driving git. **One-time setup per clone: `git config core.hooksPath .githooks`.** `git merge --ff-only` creates no commit, so /ship's merge is unaffected; the escape hatch is `git commit --no-verify`.

Uncommitted work carries across `git checkout -b`, so branching late is always safe — nothing already edited is lost.

---

## Session Logs

Every Claude Code session has a log in `docs/sessions/YYYY-MM/DD/HHMM_<branch>.md`, indexed in `docs/sessions/INDEX.md` (newest first, plus a tag → sessions index — search by tag there before reading logs). The `session-log` hook creates the file on the session's first real turn (a session never prompted leaves no file; SessionStart deletes any zero-turn log) and appends a Turn log entry after every response — **never edit the Turn log or INDEX.md by hand.** Run **`/log`** before shipping (it is Step 5b of `/ship`) to write the title, area, summary, **where Claude struggled / where Robert stepped in**, decisions and open threads. Do not read old logs unless asked — they are history, not context.

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

```
backend/
├── auth/                        # Login, register, JWT — routes/service/models/schemas
├── players/
│   ├── characters/              # Character CRUD — routes/service/models/schemas/storage
│   ├── races/                   # D&D races (system + campaign-custom)
│   ├── backgrounds/             # D&D backgrounds (system + campaign-custom)
│   ├── feats/                   # D&D feats (system + campaign-custom)
│   └── classes/                 # D&D classes (system + campaign-custom); seeded 12×2 editions
├── gm/
│   ├── campaigns/               # Campaign + member management
│   │   └── campaign_tools/
│   │       ├── npcs/            # NPC management — routes/service/models/schemas/storage
│   │       ├── locations/       # Locations, maps, pins, NPC links — routes/service/models/schemas/storage
│   │       ├── calendar/        # Per-campaign calendar: seasons, months, eras — routes/service/models/schemas
│   │       ├── timeline/        # Timeline events with NPC/location links — routes/service/models/schemas
│   │       ├── session_notes/   # Session notes + 4 junction tables + image upload — routes/service/models/schemas/storage
│   │       └── encounters/      # Combat encounters + combatants (initiative order) — routes/service/models/schemas; GM-only incl. reads
│   └── tools/
│       └── loot_tables/         # Loot table generation (system + campaign)
├── uploads/
│   ├── characters/              # Character portraits: uploads/characters/{character_id}/uuid.ext
│   ├── maps/                    # Map images: uploads/maps/{campaign_id}/{location_id}/uuid.ext
│   ├── npcs/                    # NPC portraits: uploads/npcs/{campaign_id}/{npc_id}/uuid.ext
│   ├── sessions/                # Session images: uploads/sessions/{campaign_id}/{session_id}/uuid.ext
│   └── music/                   # Uploaded theme audio: uploads/music/{characters/<id> | npcs/<cid>/<id> | sessions/<cid>/<id>}/uuid.ext
├── shared/
│   ├── encyclopedia/
│   │   ├── bestiary/            # Creatures/monsters
│   │   ├── spells/              # Spells
│   │   └── items/
│   │       ├── weapons/
│   │       ├── armor/
│   │       ├── adventuring_gear/
│   │       ├── potions/
│   │       ├── magic_items/
│   │       └── food_drink/
│   ├── database.py              # SQLAlchemy engine + session
│   ├── dependencies.py          # get_db, get_current_user, require_admin, require_gm
│   ├── security.py              # Password hashing, JWT functions
│   ├── enums.py                 # OwnerType enum (system/campaign)
│   ├── music_storage.py         # Shared audio upload helper: save_music_file(file, subpath)/delete_music_file(path); used by characters/npcs/sessions; uploads/music/<subpath>/uuid.ext; allows mp3/ogg/wav/m4a/aac/flac/mp4/webm/mov, 50 MB limit
│   └── exceptions.py
├── migrations/                  # Alembic
├── main.py                      # FastAPI entry point
└── config.py                    # Env vars, settings
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
- **The GM invites players** — no self-service join for players
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
- **Portrait images** stored at `uploads/characters/{character_id}/uuid.ext`; served via StaticFiles

### Content
- **Only admin can create/edit/delete system (`owner_type='system'`) content**
- **Only the campaign's GM can create/edit/delete campaign (`owner_type='campaign'`) content**
- **Players consume content but cannot create or modify it**
- **Campaign queries return overrides first, then fall back to system entries**
- **Content can be copied between a GM's own campaigns** — always as independent copies

---

## Current Database Schema (41 Tables)

Columns and the constraints that affect how code is written. **Why** a column is shaped the way it is, the full `character_data` key reference, and seeding history live in [docs/schema-notes.md](docs/schema-notes.md) — put new rationale there and keep this listing to columns plus a one-line note.

```sql
-- Core
users
  id, email (unique), username (unique), password_hash,
  is_admin (boolean, default false), created_at, updated_at

campaigns
  id, name, description, edition (String(10), default "5e"),
  use_alignment (boolean, default true),                    ← GM toggle; hides alignment field when false
  ability_score_method (String(20), default "standard_spread"), ← "standard_spread" | "point_buy" | "roll"
  allow_reroll_ones (boolean, default false),               ← only applies when ability_score_method="roll"
  leveling_type (String(20), default "milestone"),          ← "milestone" | "experience"
  currency_type (String(20), default "standard"),           ← "standard" (cp/sp/gp/pp) | "full" (adds electrum); drives which coins the character Wallet shows
  starting_equipment (String(20), default "equipment"),     ← "equipment" (grant class+background gear) | "equipment_or_gold" (also allow swapping class gear for class starting gold) | "none" (no starting gear or gold); drives the CharacterCreate Equipment step
  asi_feat_mode (String(20), default "asi_or_feat"),        ← "asi_only" | "asi_or_feat" (RAW 5e choice) | "asi_and_feat"; what a character gets at ASI levels; drives the LevelUpWizard ASI-or-Feat / Feat steps
  campaign_mode (String(20), default "full"),               ← "full" | "worldbuilding"; world-building HIDES (frontend-only, data kept) sheets, encounters, encyclopedia,
                                                              rules settings, NPC combat stats, session Characters Present. Read it ONLY via campaigns/campaignFeatures.js
  created_by (FK→users), created_at, updated_at

campaign_members
  id, campaign_id (FK→campaigns), user_id (FK→users),
  role ('gm' or 'player'), joined_at
  UNIQUE(campaign_id, user_id)

characters
  id, name, race, char_class, level, background, alignment,
  strength, dexterity, constitution, intelligence, wisdom, charisma,
  character_data (JSONB),   ← class-specific MECHANICAL state; shape varies by class. Per-key rationale: docs/schema-notes.md
      hp_rolls (int)        ← CON-independent max-HP base. Effective max = hp_rolls + level×CON-mod + per-level bonuses, computed
                              at read time (frontend combatBonuses.effectiveMaxHp, backend _effective_max_hp — one shared fixture).
                              Legacy characters stored hp_max (CON baked in) instead.
      current_hp, temp_hp, hit_dice_used, armor_class, inspiration
      currency {cp, sp, ep, gp, pp}
      inventory []          ← SNAPSHOTS of encyclopedia items: {uid, category (REST routing slug), source_id, quantity, equipped,
                              attuned, hand: 'main'|'off'|'both', ...itemFields}. A snapshotted shape that gains a field needs a
                              DATA MIGRATION (never "remove and re-add" — it loses equipped/hand/designations keyed to the uid).
      feats []              ← {id, name, level, effects (snapshot of feats.effects), choices}
      subclass, skill_proficiencies, expertise_skills, race_traits, feat_languages, feat_tool_proficiencies, feat_weapon_proficiencies
      spell_slots {level: {total, used}}, cantrips, known_spells, prepared_locked
      <pool>_used           ← rest counters (second_wind_used, channel_rune_<rune>_used, feat_freecast_<slug>_used, …). Every
                              class/subclass counter needs a row in the backend _REST_RESOURCES table.
      active_effects []     ← keys of effects switched ON (effects/activeEffects.js); a rest never clears it
      Fighter subclasses: maneuvers, ek_spell_slots, bonded_weapon_uids, arcane_shot_options, subclass_cantrips,
                          subclass_save_proficiencies, subclass_languages, runes, rune_items, giants_might_size
      Other: draconic_bloodline, draconic_ancestry, hex_weapon_uid, portent_rolls
  experience_points (integer, default 0),    ← CLAMPED to [0, 355_000] in the SERVICE (MAX_EXPERIENCE_POINTS); frontend mirrors it as MAX_XP
  level_up_pending (boolean, default false), ← XP campaigns RE-DERIVE it on level-up (one award can bank several levels); milestone campaigns clear it
  user_id (FK→users), campaign_id (FK→campaigns),
  is_visible_to_players (boolean), notes,          ← "public notes" shown to all campaign members
  gm_notes (Text, nullable),                       ← GM only; always stripped from player/owner responses
  backstory (Text, nullable),                      ← markdown prose; owner + all members (read)
  personal_notes (Text, nullable),                 ← owner + GM only; stripped from other player responses
  appearance (JSONB, nullable),                    ← free-text physical description, public to the party; field catalog lives in the
                                                     frontend (appearance/appearanceData.js). NOTHING may ever compute from it.
                                                     Absent from CharacterListItem.
  image_path (String(500), nullable),              ← portrait; served via /uploads/characters/
  theme_music_url (String(500), nullable),         ← pasted URL OR uploaded `uploads/music/...` path
  created_at, updated_at

character_timeline_events                ← junction: timeline event linked to a character
  id, character_id (FK→characters CASCADE), event_id (FK→timeline_events CASCADE),
  description, created_at
  UNIQUE(character_id, event_id) name="uq_character_timeline_event"

character_npcs                           ← junction: NPC linked to a character
  id, character_id (FK→characters CASCADE), npc_id (FK→npcs CASCADE),
  description, created_at
  UNIQUE(character_id, npc_id) name="uq_character_npc"

-- Player Reference Content (system + campaign ownership)
races
  id, name, description, ability_score_increases (JSON), size, speed,
  traits (JSON), languages (JSON), owner_type (ENUM), owner_id, created_at, updated_at

backgrounds
  id, name, description, skill_proficiencies (JSON), tool_proficiencies (JSON),
  languages (JSON), equipment (JSON), feature (JSON), characteristics (JSON),
  owner_type (ENUM), owner_id, created_at, updated_at

feats
  id, name, edition (String(10), default "5e"),    ← "5e" | "5.5e"; one row per edition (like character_classes)
  description, prerequisites (JSON: {} or {"text": "..."}), benefits (JSON),
  effects (JSON, nullable),  ← array of typed mechanical effects: stat_mod, ability_choice, ability_score, attack_mod, action,
                               proficiency, expertise, resource, ac_mod, save_mod, save_advantage, damage_reduction, spell_grant,
                               fighting_style, maneuver_grant, note. NULL/empty = prose-only. Shapes, consumers and authoring:
                               docs/systems/feat-effects.md + the /feat-effects skill. Snapshotted onto character_data.feats[i]
                               at acquisition; re-running seed_feats.py refreshes those snapshots.
  repeatable (boolean), source, owner_type (ENUM), owner_id, created_at, updated_at
  Seeded via seed_feats.py (41 PHB-2014 "5e" + 73 PHB-2024 "5.5e"; idempotent; the file is the source of truth). Coverage is
    CLAUSE-level and a RATCHET GATE: `python report_feat_effects.py --check` against backend/feat_coverage_baseline.json.
    Seeding history, note statuses and current counts: docs/schema-notes.md

character_classes
  id, name (String(100)), edition (String(10)),
  flavor_text (Text), hit_die (Integer), primary_ability (String(100)),
  spellcasting_ability (String(50), nullable),
  saving_throws (JSON), armor_proficiencies (JSON), weapon_proficiencies (JSON),
  tool_proficiencies (JSON), skill_count (Integer), skills_available (JSON),
  owner_type (ENUM: system/campaign), owner_id (nullable),
  created_at, updated_at
  INDEX: ix_character_classes_name

class_features
  id, class_id (FK→character_classes CASCADE),
  level (Integer), feature_name (String(200)), feature_description (Text),
  created_at
  INDEX: ix_class_features_class_id

-- GM Campaign Tools
npcs
  id, campaign_id (FK→campaigns),
  -- Core
  name, race, occupation, alignment,
  status (ENUM: alive/dead/missing/unknown),
  -- Physical
  age, gender, height, weight (all String), appearance (Text), image_path,
  -- Personality & voice
  voice, personality_traits, ideals, bonds, flaws (all Text),
  languages (JSONB),                ← ["Common", "Elvish"]
  -- Narrative (player-visible)
  summary,                          ← short blurb for cards/lists outside the NPC page
  description, backstory,
  -- Location tracking
  last_known_location_id (FK→locations, SET NULL), last_seen_notes,
  -- Media
  theme_music_url,
  -- Combat
  stats (JSONB),
  -- GM only (never returned to players)
  gm_notes,
  is_visible_to_players (boolean), created_at, updated_at

npc_relationships                    ← NPC-to-NPC named relationships
  id, npc_a_id (FK→npcs CASCADE), npc_b_id (FK→npcs CASCADE),
  relationship_type, description, created_at
  UNIQUE(npc_a_id, npc_b_id)

npc_player_relationships             ← NPC-to-player named relationships (campaign-scoped)
  id, npc_id (FK→npcs CASCADE), user_id (FK→users CASCADE),
  campaign_id (FK→campaigns CASCADE),
  relationship_type, description, created_at
  UNIQUE(npc_id, user_id, campaign_id)

location_npcs                        ← junction: NPCs manually linked to a location
  id, location_id (FK→locations), npc_id (FK→npcs),
  description,                      ← NPC's role at this specific location (optional)
  created_at
  UNIQUE(location_id, npc_id)

locations
  id, campaign_id (FK→campaigns), name,
  description,                      ← player-visible
  gm_notes,                         ← GM only, never returned to players
  location_type, status,
  -- Hierarchy
  parent_location_id (FK→locations, nullable, ondelete SET NULL),
  is_top_level (boolean, default false),   ← exactly one per campaign; service auto-clears old
  is_unknown (boolean, default false),     ← GM marks deliberately; mutually exclusive with top-level/parent
  -- Environment
  weather, plant_life, animal_life, terrain, climate,
  -- Lore & Culture
  history, rumors, government, religion, economy,
  -- Adventure
  threats, available_services, points_of_interest,
  is_visible_to_players (boolean), created_at, updated_at

location_relationships
  id, campaign_id (FK→campaigns),
  location_a_id (FK→locations), location_b_id (FK→locations),
  label, direction (ENUM: a_above_b/b_above_a/same_level),
  created_at, updated_at
  UNIQUE(location_a_id, location_b_id)

location_maps
  id, location_id (FK→locations), name, image_path,
  is_visible_to_players (boolean), created_at, updated_at

map_pins
  id, map_id (FK→location_maps), x_percent, y_percent,
  label, description, linked_location_id (FK→locations, nullable),
  is_visible_to_players (boolean), created_at, updated_at

location_links                       ← polymorphic: links a location to any other content type
  id, location_id (FK→locations), content_type (string), content_id, notes, created_at

-- GM Campaign Calendar System
campaign_calendars
  id, campaign_id (FK→campaigns CASCADE, UNIQUE),
  name (default "Campaign Calendar"), days_per_month (default 30),
  use_weeks (boolean, default false),   ← GM must opt in; false = no weekday tracking
  days_per_week (integer, nullable),    ← only meaningful when use_weeks=true
  current_era_id (FK→calendar_eras SET NULL, use_alter=True ← breaks circular FK),
  current_year, current_month_order, current_day,
  created_at, updated_at

calendar_seasons
  id, calendar_id (FK→campaign_calendars CASCADE),
  name, order_index, created_at, updated_at

calendar_months
  id, calendar_id (FK→campaign_calendars CASCADE),
  season_id (FK→calendar_seasons SET NULL, nullable),
  name (nullable),                      ← optional; display as "Month N" when null
  description, order_index, created_at, updated_at

calendar_weekdays
  id, calendar_id (FK→campaign_calendars CASCADE),
  name, order_index, created_at, updated_at

calendar_eras
  id, calendar_id (FK→campaign_calendars CASCADE),
  name, abbreviation, description,
  direction (ENUM: ascending/descending),
  is_primary (boolean),             ← auto-set on first era; must be ascending
  epoch_offset (int),               ← absolute = era_year + offset (asc) or offset - era_year (desc)
  anchor_era_id (FK→calendar_eras SET NULL, nullable),
  anchor_era_year, anchor_this_year (nullable = transition anchor for descending),
  era_start_absolute, era_end_absolute (nullable = open-ended),
  is_current (boolean),
  is_visible_to_players (boolean), created_at, updated_at

-- GM Campaign Timeline
timeline_events
  id, campaign_id (FK→campaigns CASCADE),
  title, description,
  gm_notes (Text, nullable),                ← GM only; never returned to players
  era_id (FK→calendar_eras SET NULL, nullable),
  year, month_order, day (all nullable),
  absolute_year (computed from era + year; used for ORDER BY),
  -- End date: null = point-in-time event; set = span event (days/weeks/months/years)
  end_era_id (FK→calendar_eras SET NULL, nullable),
  end_year, end_month_order, end_day (all nullable),
  end_absolute_year (computed from end_era + end_year; used for span overlap detection),
  is_visible_to_players (boolean), created_at, updated_at

timeline_event_npcs                  ← junction: NPC linked to a timeline event
  id, event_id (FK→timeline_events CASCADE), npc_id (FK→npcs CASCADE),
  description, created_at
  UNIQUE(event_id, npc_id)

timeline_event_locations             ← junction: location linked to a timeline event
  id, event_id (FK→timeline_events CASCADE), location_id (FK→locations CASCADE),
  description, created_at
  UNIQUE(event_id, location_id)

-- GM Campaign Session Notes
session_notes
  id, campaign_id (FK→campaigns CASCADE),
  session_number (nullable integer),
  title,
  real_world_date (Date, nullable),           ← real-world date the session was played
  era_id (FK→calendar_eras SET NULL, nullable),
  year, month_order, day (all nullable),      ← in-world start date
  end_year, end_month_order, end_day (all nullable), ← in-world end date; null = point-in-time session
  absolute_year (computed from era + year; used for era_dates display),
  summary,                                     ← short blurb for session list card
  content (Text, nullable),                    ← full Markdown prose ("chapter of a book")
  gm_notes (Text, nullable),                   ← GM only; never returned to players
  music_url (nullable),                        ← pasted URL (Spotify/YouTube/audio) OR uploaded `uploads/music/...` path; played in-browser via MusicPlayer
  is_visible_to_players (boolean, default false),
  created_at, updated_at

session_note_npcs                    ← junction: NPC featured in a session
  id, session_id (FK→session_notes CASCADE), npc_id (FK→npcs CASCADE),
  description, created_at
  UNIQUE(session_id, npc_id)

session_note_locations               ← junction: location visited in a session
  id, session_id (FK→session_notes CASCADE), location_id (FK→locations CASCADE),
  description, created_at
  UNIQUE(session_id, location_id)

session_note_events                  ← junction: timeline event linked to a session
  id, session_id (FK→session_notes CASCADE), event_id (FK→timeline_events CASCADE),
  description, created_at
  UNIQUE(session_id, event_id)

session_note_characters              ← junction: character present in a session
  id, session_id (FK→session_notes CASCADE), character_id (FK→characters CASCADE),
  description, created_at
  UNIQUE(session_id, character_id)

-- GM Combat Encounters (V1: player characters + initiative order only)
encounters
  id, campaign_id (FK→campaigns CASCADE), name, created_at, updated_at

encounter_combatants                 ← junction: a character in an encounter
  id, encounter_id (FK→encounters CASCADE), character_id (FK→characters CASCADE),
  initiative (Integer, nullable),    ← null until rolled/typed; unrolled rows sort LAST (a 2 beats "hasn't rolled")
  created_at, updated_at
  UNIQUE(encounter_id, character_id) name="uq_encounter_combatant"

loot_tables
  id, name, description, owner_type (string: 'system'/'campaign'),
  owner_id, loot_items (JSONB), created_at, updated_at

-- Encyclopedia (system-owned; campaign overrides use same tables with owner_type='campaign')
spells
  id, name, edition (String(10), default "5e"),    ← a spell gets its own 5.5e row ONLY where its 2024 text differs
  level, school, casting_time, range, components (Text),
  duration, description, higher_level (Text, nullable),
  ritual (boolean, default false), concentration (boolean, default false),
  classes, owner_type (ENUM), owner_id, created_at, updated_at
  Identity = name + edition + owner scope (enforced in service.py; no DB UNIQUE constraint).
  EDITION FALLBACK (get_all_spells): `?edition=5e` returns only 5e rows; `?edition=5.5e` returns 5.5e rows SHADOWING 5e rows of
    the same name (campaign beats system; within a tier the exact edition beats the fallback). No filter = every edition listed.
  Seeding (seed_spells.py — 319 SRD 5e spells; seed_artificer_spells.py; seed_phb_spells.py for non-SRD spells): docs/schema-notes.md

creatures
  id, name, size, type, alignment, challenge_rating, armor_class,
  hit_points, speed, strength/dex/con/int/wis/cha, description,
  owner_type (ENUM), owner_id, created_at, updated_at

weapons
  id, name, damage, damage_type, weight, cost, weapon_category, weapon_type,
  properties (Text: comma-joined property NAMES, e.g. "Ammunition, Heavy, Two-Handed"),
  range_normal (Integer, nullable), range_long (Integer, nullable),
                             ← the distance band as TWO INTEGERS (never a "150/600" string). NULL for a pure melee weapon
                               (its 5 ft is REACH, a different concept); a THROWN melee weapon carries its throw range.
  description, owner_type (ENUM), owner_id, created_at, updated_at

armor
  id, name, armor_type, armor_class, cost, weight,
  strength_requirement, stealth_disadvantage, description,
  owner_type (ENUM), owner_id, created_at, updated_at

adventuring_gear
  id, name, category, cost, weight, description,
  owner_type (ENUM), owner_id, created_at, updated_at

potions
  id, name, rarity, effect, cost, description,
  owner_type (ENUM), owner_id, created_at, updated_at

magic_items
  id, name, item_type, rarity, attunement (boolean), description,
  owner_type (ENUM), owner_id, created_at, updated_at

food_drink
  id, name, category, item_type, cost, weight, description,
  owner_type (ENUM), owner_id, created_at, updated_at

  Item tables are seeded via seed_items.py (idempotent). Row counts and seeding history: docs/schema-notes.md
```

**Note:** Encyclopedia tables (spells, creatures, all item tables) DO have `owner_type`/`owner_id` and
carry **no DB-level `UNIQUE(name)`** constraint (verified against `dnd_app_dev` July 2026 — an earlier
note here claiming otherwise was stale). Campaign overrides work today. Uniqueness is enforced in each
module's `service.py` (spells: name + edition + owner scope), which is what lets one spell exist once
per edition.

---

## Critical Implementation Details

### JWT Tokens
- Store user_id as **STRING** in token: `data={'sub': str(user.id)}`
- Expiration: 30 minutes (configured in config.py)
- Import: use `HTTPAuthorizationCredentials` from `fastapi.security` (NOT `HTTPAuthCredentials`)

### bcrypt Version
- **Pin bcrypt to 4.0.1** — bcrypt 5.x breaks passlib 1.7.4 with a `ValueError` on every hash call. `requirements.txt` should specify `bcrypt==4.0.1`. Do not upgrade.

### Character Data (JSONB)
- `character_data` stores class-specific fields: spell slots, ki points, fighting style, etc.
- Structure varies by class — this is intentional and flexible by design

### Campaign Members
- `campaign_members` responses include nested user object: `{id, username, email}`
- User info is eagerly loaded with member relationships

### GM Authorization
- A user is "GM of campaign X" if they have a `campaign_members` row with `role='gm'` for that campaign
- `require_gm(campaign_id)` dependency checks this — do not use `require_admin` for GM actions

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

## Working API Endpoints

Base URL: `http://localhost:8000` | Docs: `http://localhost:8000/docs`

### Auth
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/auth/register | No |
| POST | /api/auth/login | No |
| GET | /api/auth/me | Yes |
| GET | /api/auth/users/search?q=X | Yes — returns up to 10 users matching username or email (min 2 chars); excludes requester; used in GM invite flow |

### Campaigns
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns | Yes (any user) |
| GET | /api/gm/campaigns | Yes |
| GET | /api/gm/campaigns/{id} | Yes (member) |
| PUT | /api/gm/campaigns/{id} | Yes (GM of campaign) |
| DELETE | /api/gm/campaigns/{id} | Yes (GM of campaign) |
| POST | /api/gm/campaigns/{id}/players | Yes (GM of campaign) |
| DELETE | /api/gm/campaigns/{id}/players/{user_id} | Yes (GM of campaign) |

Campaign creation uses `get_current_user` (any authenticated user). Member management uses `require_campaign_gm`.
Campaign PUT accepts all settings fields: `use_alignment`, `ability_score_method`, `allow_reroll_ones`, `leveling_type`, `currency_type`, `starting_equipment`, `asi_feat_mode`, `campaign_mode` (also accepted on POST; unknown value → 422). `currency_type` ("standard" | "full"), `starting_equipment` ("equipment" | "equipment_or_gold" | "none"), and `asi_feat_mode` ("asi_only" | "asi_or_feat" | "asi_and_feat") are in `CampaignResponse` + `CampaignListItem` so they reach the frontend CampaignContext. (Like the other settings, `asi_feat_mode` is set only via PUT — `create_campaign` relies on the column default.)

### Characters
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/characters | Yes |
| GET | /api/characters/campaign/{id} | Yes (member) |
| GET | /api/characters/{id} | Yes (owner or GM) |
| PUT | /api/characters/{id} | Yes (owner or GM); accepts `appearance` (the physical-description JSONB; a write REPLACES the object, which is what lets a cleared field clear); uses `CharacterGmUpdate` — only GM can set `gm_notes`/`is_visible_to_players`; GM cannot overwrite `personal_notes`; `experience_points` is clamped to [0, 355_000] |
| DELETE | /api/characters/{id} | Yes (owner or GM) |
| PATCH | /api/characters/{id}/visibility | Yes (GM of campaign) |
| POST | /api/characters/{id}/image | Yes (owner or GM, multipart) |
| DELETE | /api/characters/{id}/image | Yes (owner or GM) |
| POST | /api/characters/{id}/music | Yes (owner or GM, multipart); stores uploaded audio path into `theme_music_url` |
| DELETE | /api/characters/{id}/music | Yes (owner or GM); clears `theme_music_url` |
| GET | /api/characters/{id}/timeline-events | Yes (owner or GM) |
| POST | /api/characters/{id}/timeline-events | Yes (owner or GM); creates a new `timeline_events` row + `character_timeline_events` junction |
| DELETE | /api/characters/{id}/timeline-events/{link_id} | Yes (owner or GM) |
| GET | /api/characters/{id}/npcs | Yes (owner or GM) |
| POST | /api/characters/{id}/npcs | Yes (owner or GM); creates a new `npcs` row + `character_npcs` junction |
| DELETE | /api/characters/{id}/npcs/{link_id} | Yes (owner or GM) |
| POST | /api/characters/campaign/{id}/rest | Yes (GM of campaign); body `{ rest_type: "short"\|"long"\|"initiative", character_ids: int[], opt_ins?, dry_run? }` (unknown `rest_type` → 422); returns `RestResponse` with per-character `changes`. `dry_run: true` returns the same changes WITHOUT saving (the rest dialog shows it). Every class/subclass pool is ONE ROW in `_REST_RESOURCES`; `initiative` uses `_INITIATIVE_RESOURCES` (modes `regain_when_empty` / `floor` / `opt_in`). A long rest restores HP to the effective max (`_effective_max_hp`). Full behaviour: [docs/systems/rest-and-initiative.md](docs/systems/rest-and-initiative.md) |
| GET | /api/characters/campaign/{id}/initiative-options?character_ids=1,2 | Yes (GM of campaign); read-only. Per character, the initiative features they must CHOOSE to use and whether the charge is still `available`. Characters with no choice are omitted, so an empty list means nobody has one. Exists so the encounter page can offer the opt-in **without** mirroring `_INITIATIVE_RESOURCES` |

### Races / Backgrounds / Feats (same pattern each)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /races | Yes |
| GET | /races/{id} | Yes |
| POST | /races | Yes (admin for system; GM for campaign-scoped) |
| PUT | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
| DELETE | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
*(Replace `/races` with `/backgrounds` or `/feats` for those modules)*

`/feats` GET also accepts `?edition=5e|5.5e` (filters feats by edition) and `?campaign_id=N`. `FeatCreate`/`FeatUpdate`/`FeatResponse`/`FeatListItem` all carry `edition` (default "5e"); `FeatListItem` also exposes `prerequisites` + `source` + `effects` so the encyclopedia detail view + the feat-effects resolvers need no extra fetch. `FeatCreate`/`FeatUpdate`/`FeatResponse`/`FeatListItem` all carry `effects` (nullable list). Seeded by `seed_feats.py`.

### Classes
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /api/classes | Yes; accepts `?edition=5e|5.5e`, `?campaign_id=N`, `?name=X` |
| GET | /api/classes/{id} | Yes |
| POST | /api/classes | Yes (admin for system) |
| PUT | /api/classes/{id} | Yes (admin for system) |
| DELETE | /api/classes/{id} | Yes (admin for system) |

Response includes nested `features: List[ClassFeatureResponse]` (all levels 1–20).
When `?campaign_id=N` is provided, campaign-scoped classes with the same `name+edition` shadow system entries (same deduplication pattern as races/backgrounds).
System classes are seeded via `backend/seed_classes.py` (run once; 25 entries: 12 classes × 2 editions + Artificer 5e only; uses `CLASSES_5E_ONLY = {"Artificer"}` guard to skip 5.5e creation).

### NPCs
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/npcs | Yes (GM of campaign) |
| GET | /api/gm/campaigns/npcs/campaign/{id} | Yes (member) |
| GET | /api/gm/campaigns/npcs/{id} | Yes (member) |
| PUT | /api/gm/campaigns/npcs/{id} | Yes (GM of campaign) |
| DELETE | /api/gm/campaigns/npcs/{id} | Yes (GM of campaign) |
| PATCH | /api/gm/campaigns/npcs/{id}/visibility | Yes (GM of campaign) |
| POST | /api/gm/campaigns/npcs/{id}/image | Yes (GM, multipart) |
| DELETE | /api/gm/campaigns/npcs/{id}/image | Yes (GM of campaign) |
| POST | /api/gm/campaigns/npcs/{id}/music | Yes (GM, multipart); stores uploaded audio path into `theme_music_url` |
| DELETE | /api/gm/campaigns/npcs/{id}/music | Yes (GM of campaign); clears `theme_music_url` |
| GET/POST | /api/gm/campaigns/npcs/{id}/relationships | Yes (member / GM) |
| DELETE | /api/gm/campaigns/npcs/{id}/relationships/{rel_id} | Yes (GM of campaign) |
| GET/POST | /api/gm/campaigns/npcs/{id}/player-relationships | Yes (member / GM) |
| DELETE | /api/gm/campaigns/npcs/{id}/player-relationships/{rel_id} | Yes (GM of campaign) |

`gm_notes` is always stripped from NPC responses for players.
`last_known_location_id` NPCs surface in location NPC lists as `source="last_seen"` (deduped against manually linked `source="linked"` NPCs).

### Locations
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/{id}/locations | Yes (GM) |
| GET | /api/gm/campaigns/{id}/locations | Yes (member) |
| GET | /api/gm/campaigns/{id}/locations/{lid} | Yes (member; player blocked if hidden) |
| PUT | /api/gm/campaigns/{id}/locations/{lid} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/locations/{lid} | Yes (GM) |
| PATCH | /api/gm/campaigns/{id}/locations/{lid}/visibility | Yes (GM) |
| GET | /api/gm/campaigns/{id}/locations/{lid}/npcs | Yes (member; filters hidden NPCs for players) |
| POST | /api/gm/campaigns/{id}/locations/{lid}/npcs | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/locations/{lid}/npcs/{ln_id} | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/locations/{lid}/relationships | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/locations/{lid}/relationships/{rel_id} | Yes (GM) |
| GET | /api/gm/campaigns/{id}/locations/{lid}/maps | Yes (member; filters hidden for players) |
| POST | /api/gm/campaigns/{id}/locations/{lid}/maps | Yes (GM, multipart) |
| DELETE | /api/gm/campaigns/{id}/locations/{lid}/maps/{map_id} | Yes (GM) |
| PATCH | /api/gm/campaigns/{id}/locations/{lid}/maps/{map_id}/visibility | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/locations/{lid}/maps/{map_id}/pins | Yes (member / GM) |
| PUT/DELETE | /api/gm/campaigns/{id}/locations/{lid}/maps/{map_id}/pins/{pin_id} | Yes (GM) |
| GET/POST/DELETE | /api/gm/campaigns/{id}/locations/{lid}/links | Yes (member / GM) |

`gm_notes` is always stripped from location responses for players.

### Loot Tables
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/tools/loot-tables | Yes (admin for system; GM for campaign-scoped) |
| GET | /api/gm/tools/loot-tables | Yes |
| GET | /api/gm/tools/loot-tables/{id} | Yes |
| PUT | /api/gm/tools/loot-tables/{id} | Yes (admin for system; GM for campaign-scoped) |
| DELETE | /api/gm/tools/loot-tables/{id} | Yes (admin for system; GM for campaign-scoped) |

### Encyclopedia (Bestiary, Spells — same pattern; Items below)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /api/encyclopedia/bestiary | Yes |
| GET | /api/encyclopedia/bestiary/{id} | Yes |
| POST | /api/encyclopedia/bestiary | Yes (admin for system; GM for campaign override) |
| PUT | /api/encyclopedia/bestiary/{id} | Yes (admin for system; GM for campaign override) |
| DELETE | /api/encyclopedia/bestiary/{id} | Yes (admin for system; GM for campaign override) |
*(Replace `/bestiary` with `/spells` for spells)*

`GET /api/encyclopedia/spells` also accepts `?edition=5e|5.5e` (alongside `?campaign_id=N`). `5.5e`
falls back to 5e text per spell name — see the `spells` schema note. `SpellCreate`/`SpellUpdate`/
`SpellResponse` all carry `edition` (default `"5e"`).

### Encyclopedia Items (same 5-method pattern for each)
- `/api/encyclopedia/items/weapons`
- `/api/encyclopedia/items/armor`
- `/api/encyclopedia/items/adventuring-gear`
- `/api/encyclopedia/items/potions`
- `/api/encyclopedia/items/magic-items`
- `/api/encyclopedia/items/food-drink`

### Calendar (per-campaign)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/{id}/calendar | Yes (GM) |
| GET | /api/gm/campaigns/{id}/calendar | Yes (member) |
| PUT | /api/gm/campaigns/{id}/calendar | Yes (GM) |
| POST | /api/gm/campaigns/{id}/calendar/seasons | Yes (GM) |
| PUT | /api/gm/campaigns/{id}/calendar/seasons/{season_id} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/calendar/seasons/{season_id} | Yes (GM) |
| POST | /api/gm/campaigns/{id}/calendar/months | Yes (GM) |
| PUT | /api/gm/campaigns/{id}/calendar/months/{month_id} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/calendar/months/{month_id} | Yes (GM) |
| POST | /api/gm/campaigns/{id}/calendar/eras | Yes (GM) |
| PUT | /api/gm/campaigns/{id}/calendar/eras/{era_id} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/calendar/eras/{era_id} | Yes (GM) |
| PATCH | /api/gm/campaigns/{id}/calendar/eras/{era_id}/visibility | Yes (GM) |
| POST | /api/gm/campaigns/{id}/calendar/weekdays | Yes (GM) |
| PUT | /api/gm/campaigns/{id}/calendar/weekdays/{weekday_id} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/calendar/weekdays/{weekday_id} | Yes (GM) |

GET calendar response includes nested `seasons`, `months`, `eras`, `weekdays` lists.
First era created is automatically `is_primary=True` and must be ascending.
Non-primary eras require `anchor_era_id` + `anchor_era_year` for epoch offset math.

### Timeline (per-campaign)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/{id}/timeline | Yes (GM) |
| GET | /api/gm/campaigns/{id}/timeline | Yes (member; players see only visible events); accepts `?location_id=N` or `?npc_id=N` to filter to events linked to that location/NPC |
| GET | /api/gm/campaigns/{id}/timeline/{event_id} | Yes (member; players blocked if hidden) |
| PUT | /api/gm/campaigns/{id}/timeline/{event_id} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/timeline/{event_id} | Yes (GM) |
| PATCH | /api/gm/campaigns/{id}/timeline/{event_id}/visibility | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/timeline/{event_id}/npcs | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/timeline/{event_id}/npcs/{link_id} | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/timeline/{event_id}/locations | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/timeline/{event_id}/locations/{link_id} | Yes (GM) |

Events sorted by `absolute_year ASC NULLS FIRST, month_order ASC, day ASC`.
Each event response includes `era_dates: List[EraDate]` — the event's date expressed in every era whose range covers the event's `absolute_year`. Hidden eras are excluded for players.
Span events: `end_era_id`, `end_year`, `end_month_order`, `end_day`, `end_absolute_year` are all nullable; null = point-in-time event. Spans can cross era boundaries (start and end era may differ). `end_absolute_year` is computed from `end_era_id + end_year` using the same math as `absolute_year`.

### Session Notes (per-campaign)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/{id}/sessions | Yes (GM) |
| GET | /api/gm/campaigns/{id}/sessions | Yes (member; players see only visible); accepts `?npc_id=N`, `?location_id=N`, `?event_id=N` |
| GET | /api/gm/campaigns/{id}/sessions/{session_id} | Yes (member; players blocked if hidden) |
| PUT | /api/gm/campaigns/{id}/sessions/{session_id} | Yes (GM) |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id} | Yes (GM) |
| PATCH | /api/gm/campaigns/{id}/sessions/{session_id}/visibility | Yes (GM) |
| POST | /api/gm/campaigns/{id}/sessions/{session_id}/image | Yes (GM, multipart) |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id}/image | Yes (GM) |
| POST | /api/gm/campaigns/{id}/sessions/{session_id}/music | Yes (GM, multipart); stores uploaded audio path into `music_url`, returns full session |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id}/music | Yes (GM); clears `music_url` |
| GET/POST | /api/gm/campaigns/{id}/sessions/{session_id}/npcs | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id}/npcs/{link_id} | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/sessions/{session_id}/locations | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id}/locations/{link_id} | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/sessions/{session_id}/events | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id}/events/{link_id} | Yes (GM) |
| GET/POST | /api/gm/campaigns/{id}/sessions/{session_id}/characters | Yes (member / GM) |
| DELETE | /api/gm/campaigns/{id}/sessions/{session_id}/characters/{link_id} | Yes (GM) |

Sessions ordered by `session_number ASC NULLS LAST, real_world_date ASC, id ASC`.
Each session response includes `era_dates: List[EraDate]` (same pattern as timeline events).
`gm_notes` and `content` are excluded from `SessionNoteListItem` (not just nulled) — list view is lightweight.
`gm_notes` is always stripped from session responses for players.
Image upload stores to `uploads/sessions/{campaign_id}/{session_id}/uuid.ext`, served via StaticFiles.

### Encounters (per-campaign) — GM combat/initiative tool
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/{id}/encounters | Yes (GM); body `{name, character_ids: int[]}` — ids are de-duped and must belong to this campaign (404 otherwise) |
| GET | /api/gm/campaigns/{id}/encounters | Yes (GM); `EncounterListItem` incl. `combatant_count` |
| GET | /api/gm/campaigns/{id}/encounters/{encounter_id} | Yes (GM) |
| PUT | /api/gm/campaigns/{id}/encounters/{encounter_id} | Yes (GM); renames |
| DELETE | /api/gm/campaigns/{id}/encounters/{encounter_id} | Yes (GM); cascades to combatants, not to characters |
| POST | /api/gm/campaigns/{id}/encounters/{encounter_id}/combatants | Yes (GM); 400 if that character is already in the encounter |
| PUT | /api/gm/campaigns/{id}/encounters/{encounter_id}/combatants/{combatant_id} | Yes (GM); sets/clears `initiative`, returns the whole re-sorted encounter |
| DELETE | /api/gm/campaigns/{id}/encounters/{encounter_id}/combatants/{combatant_id} | Yes (GM) |

**GM-only including READS** — there is no player surface and no `is_visible_to_players` flag; a player
gets 403 on GET as well as on writes. Give players a view later by adding the flag, not by loosening this.
Combatants are returned in initiative order by the service (highest first, unrolled LAST — a 2 beats
"hasn't rolled" — ties broken by name so the order is stable between requests), so no caller re-sorts.
`CombatantResponse` denormalises `character_name`/`char_class`/`level` so the page needs no per-row fetch.
V1 holds player characters only: monsters wait for the Bestiary, and turn/round tracking is out of scope.

---

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

The full `frontend/src/` component & service tree — every file's responsibility and its per-file test coverage — lives in **[docs/frontend-map.md](docs/frontend-map.md)**. **Read that file before doing frontend work.** Kept below (these guide every turn): the Auth/Campaign context pattern, the routes table, and what's not built yet.

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

### Implemented Routes
| Path | Component | Status |
|------|-----------|--------|
| `/login` | Login | ✅ Functional |
| `/campaigns` | CampaignSelection | ✅ Any authenticated user can create |
| `/campaigns/:campaignId/dashboard` | Dashboard | ⚠️ Static placeholder |
| `/campaigns/:campaignId/characters` | CharacterList | ✅ Functional |
| `/campaigns/:campaignId/locations` | LocationList | ✅ Functional |
| `/campaigns/:campaignId/locations/:locationId` | LocationDetail | ✅ Functional |
| `/campaigns/:campaignId/npcs` | NPCList | ✅ Functional |
| `/campaigns/:campaignId/npcs/:npcId` | NPCDetail | ✅ Functional |
| `/campaigns/:campaignId/campaign-time` | CampaignSettings | ✅ Functional (Calendar only — Timeline moved to its own route) |
| `/campaigns/:campaignId/timeline` | TimelinePage | ✅ Functional (visual center-line timeline; GM + player) |
| `/campaigns/:campaignId/sessions` | SessionList | ✅ Functional |
| `/campaigns/:campaignId/sessions/:sessionId` | SessionDetail | ✅ Functional |
| `/campaigns/:campaignId/characters/create` | CharacterCreate | ✅ Functional (all 12 classes, 5e + 5.5e edition-aware) |
| `/campaigns/:campaignId/characters/:characterId` | CharacterDetail | ✅ Functional |
| `/campaigns/:campaignId/members` | CampaignMembers | ✅ Functional (GM: member list + invite + remove; visible to all members) |
| `/campaigns/:campaignId/settings` | CampaignSettingsPage | ✅ Functional (GM: General tab — edition, alignment, ability score method, leveling; Members tab — invite/remove) |
| `/campaigns/:campaignId/encounters` | EncountersPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia` | EncyclopediaPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/spells/:spellId` | SpellEditPage | ✅ Functional (GM create/edit campaign spell; `new` creates homebrew) |
| `/campaigns/:campaignId/encyclopedia/items/:category/:itemId` | ItemEditPage | ✅ Functional (GM create/edit campaign item for any of the 6 categories; `new` creates homebrew) |
| `/campaigns/:campaignId/encyclopedia/maneuvers` | ManeuversPage | ✅ Functional (Battle Master maneuver reference, edition toggle + search; linked from the Battle Master subclass overview and the Martial Adept feat) |
| `/campaigns/:campaignId/encyclopedia/classes/:className` | ClassPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/classes/:className/:subclassName` | SubclassPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/jump` | JumpPage | ✅ Functional (static jump-mechanics reference: long/high, running start, Athlete feat, worked example; linked from the CharacterDetail Stats-tab JumpCard) |
| `/campaigns/:campaignId/encyclopedia/mechanics/armor-class` | ArmorClassPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/action-economy` | ActionEconomyPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/hit-dice` | HitDicePage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/loading` | LoadingPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/object-interaction` | ObjectInteractionPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/magical-attacks` | MagicalAttacksPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/damage-mitigation` | DamageMitigationPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/spacing` | SpacingPage | ✅ Functional — notes in frontend-map |
| `/campaigns/:campaignId/encyclopedia/mechanics/special-attacks` | SpecialAttacksPage | ✅ Functional — notes in frontend-map |

Rows marked "notes in frontend-map" have their full description (what the page covers, where it is linked from) in [docs/frontend-map.md](docs/frontend-map.md#routes--full-notes).

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

### Frontend Not Yet Built

Only what is genuinely missing or deferred. Descriptions of what IS built live in `docs/systems/` and `docs/frontend-map.md`.

**Character system**
- **Action Economy for the other 12 classes** — the curated class-feature map covers Fighter only (auto-derived weapon/spell/universal entries work for everyone). Also open: a "rider" convention for no-action abilities (Sneak Attack, Divine Smite, Rage); wiring chosen options into the tab (Battle Master maneuvers incl. the Parry + Riposte reaction cards, Metamagic, Invocations); the un-wired Attack-action combos (War Priest, Sudden Strike, Monk Martial Arts/Flurry, Commander's Strike). → [action-economy](docs/systems/action-economy.md)
- **Unified Spells tab** — 1 of 15 caster sheets converted; the rest is per-class work. → [spells](docs/systems/spells.md), `docs/tickets/unified-spells-tab.md`
- **Hand-written class sheets** — only Fighter and Wizard are data-driven configs; the others migrate via `/class-config`.
- **Arcane Trickster** — data entry in `subclassCasterData.js`, blocked on Rogue becoming data-driven. → [spells](docs/systems/spells.md)
- **Inventory polish** — weight/encumbrance, 2024 weapon mastery, custom (non-encyclopedia) loot, equipping magic weapons/armor, worn items such as jewelry, auto-spending ammo. → [inventory](docs/systems/inventory.md)
- **2024 starting equipment and 2024 backgrounds** — creation uses the 2014 backgrounds. → [inventory](docs/systems/inventory.md)
- **2024 ASI/feat flow** — unvalidated (feat categories, half-feat ASIs); pending feat clauses are listed by `report_feat_effects.py`. → [feat-effects](docs/systems/feat-effects.md)
- **Level-up pools still to author** — Expertise, Fighting Style for non-Fighters, Pact Boon; prerequisite gating beyond `minLevel`. → [level-up-and-grants](docs/systems/level-up-and-grants.md)
- **Models that do not exist yet** (each keeps several features as prose): surprise state (deferred by the user until enough features need it), a Conditions panel, concentration/durations, mounts & vehicles, companions with real hit points (wants the Bestiary), a display for creature size. → [sheet-panels](docs/systems/sheet-panels.md), [active-effects](docs/systems/active-effects.md)
- **Un-authored data rows** — equipment-gated features (Protection, Interception, Defensive Duelist, …) and save features (Aura of Protection, Indomitable, Danger Sense, …). → [inventory](docs/systems/inventory.md), [sheet-panels](docs/systems/sheet-panels.md)
- **Encounters beyond V1** — monsters (waiting on the Bestiary), turn/round tracking, players rolling on their own screens. → [rest-and-initiative](docs/systems/rest-and-initiative.md)
- **Mechanics pages still owed** — Conditions, Concentration. → [mechanics-pages](docs/systems/mechanics-pages.md)


**Elsewhere in the app**
- Multiclassing support (deferred — will be its own feature after both editions complete)
- **Character personality (traits / ideals / bonds / flaws) — NOT BUILT.** The same gap the Appearance section just closed for physical description: NPCs have `personality_traits`, `ideals`, `bonds` and `flaws` columns; player characters have none, even though backgrounds carry a `characteristics` JSON the creation flow never turns into stored character state. The shape is already proven — a sibling JSONB column plus a catalog module beside `appearance/appearanceData.js`, rendered as a second Narrative-tab card — and the background's suggested traits would make good datalist suggestions. Deliberately left out of the appearance pass to keep its scope honest.
- Loot table UI
- **World items for world-building campaigns** — agreed with the user (Nov 2026), not built: a lore list of the world's notable items (description, picture, linked NPCs) that stays visible in world-building mode while the item's stat block hides. Items today are encyclopedia rows with no image or NPC link, so this is a new module. Also: the create-campaign modal does not offer `campaign_mode` yet (the API accepts it; Settings can switch it).
- Encyclopedia browsing UI — Classes, Skills, Spells, Items (Weapons/Armor/Gear/Potions/Magic Items/Food & Drink — system browse + GM override + campaign homebrew + edit), Feats, and **Mechanics** (game-mechanic reference pages — see below) tabs exist; Monsters tab not yet built. Items are not yet integrated into the character sheet (Weapons & Armor tab inventory is the next step)
- Campaign spell override/homebrew management — built (SpellsTab override button, CampaignSpellsTab, SpellEditPage); admin panels for base compendium not yet built
- Admin panels (manage base compendium: races, backgrounds, feats, spells, items, creatures)
- GM panels (campaign overrides + homebrew content management)
- Token refresh / expiration handling
- Persistent/global music player (deferred — current `MusicPlayer` is inline per-page and stops on navigation; a root-level context player that keeps ambience playing across pages is a future enhancement)



---

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
| `invite_player(client, gm_headers, campaign_id, player_user_id)` | — | Add player to campaign |
| `register(client, ...)` | response | Low-level registration |
| `auth_headers(client, ...)` | `{"Authorization": ...}` | Low-level auth header |

### Test file naming and location
One file per module: `backend/tests/test_<module>.py`, with shared fixtures in `conftest.py` and shared cross-language
fixtures in `backend/tests/fixtures/`. **The per-file catalog (what each file covers, with counts) lives in
[docs/backend-tests.md](docs/backend-tests.md) — add new test files there, not here.**

Modules covered by `TestXxxListFieldRoundTrip`: `timeline_events`, `locations`, `characters`, `session_notes`. NPCs exempt (use same response schema for list + detail).

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

Modules currently covered: `timeline_events` (`TestEventListFieldRoundTrip`), `locations` (`TestLocationListFieldRoundTrip`), `characters` (`TestCharacterListFieldRoundTrip`). NPCs are exempt — they use `NPCResponse` for both list and detail.

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
empty DB and runs `alembic upgrade head`, which is the sole from-scratch migration gate. Autogenerate
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
```
Frontend: `VITE_API_URL` (build time) is read ONLY by `frontend/src/lib/api.js`; never hardcode the backend URL.

---

## What's NOT Built Yet

### Backend — Design Gaps (Need Schema + Logic Changes)

- **2024 spell text is authored incrementally.** `spells` now has an `edition` column, but only spells whose 2024 text genuinely differs need a 5.5e row (currently just Blade Ward). Every other spell serves its 5e text to 2024 campaigns via the fallback in `get_all_spells` — correct for most spells, but wrong wherever WotC rewrote one (e.g. True Strike, the damage cantrips' scaling). Adding a 5.5e row to `seed_phb_spells.py` is all it takes to fix any given spell.
- Non-SRD spells are missing from the compendium (the API seed is SRD-only). `seed_phb_spells.py` curates them in; currently Blade Ward + Friends. Others (the 15 non-SRD Artificer spells: Absorb Elements, Catapult, …; XGE/TCoE spells) are still absent — a character who knows one sees an empty spell-detail dialog.
- **Structured upcast data (future, tied to GM spell creation).** The Cast dialog computes upcast damage/DC by PARSING the free-form `higher_level`/`description` prose (`spellUpcast.js`) — honest but only ~31% of scaling spells parse cleanly (see `docs/spell-upcast-review.md`). The durable fix is a small structured upcast field on the `spells` table (like `feats.effects`: `{kind:'damage'|'healing'|'targets'|'duration'|…, dice/amount, per_levels}`) captured by the GM spell-creation form, so homebrew + newly-seeded spells are AUTHORED not parsed, and the prose parser shrinks to a legacy-catalog concern. A `/spell-effects` authoring skill (mirroring `/feat-effects`) would follow if we adopt this.
- `require_gm(campaign_id)` dependency not yet implemented in `shared/dependencies.py`
- Content copy/export between a GM's campaigns not yet implemented

### Frontend
- Everything listed in "Frontend Not Yet Built" above
- No token expiry handling
