# D&D RPG Application — Project Context

## Post-Turn Requirements (ENFORCE AFTER EVERY CODE CHANGE)

After every turn that modifies `.jsx` or `.py` files, complete ALL of these before finishing:

1. **Tests** — Run `npm test` in `frontend/`. All tests must pass. The Stop hook **blocks** if tests fail — you cannot end the turn until they pass.
2. **CLAUDE.md audit** — Update schema, endpoints, and "What's NOT Built Yet" as needed. **Frontend component/service entries, per-page UI behaviours, and the test-file listing (with counts) now live in `docs/frontend-map.md` — put new frontend catalog entries there, not back in CLAUDE.md** (keeps the per-turn context lean).
3. **Agents audit** — Check `.claude/agents/` for stale references to patterns you changed.
4. **Backend restart** — If any `.py` file changed, kill python* and start `uvicorn main:app --reload` yourself. Never ask the user to restart.

The Stop hook runs after every turn and blocks completion if `npm test` reports failures.

### Multi-file changes — plan first
When a change touches **3 or more files**, state a brief plan before editing:
- Which files change and what specifically changes in each
- Which tests will be written or updated
- What CLAUDE.md sections need updating

Post the checklist, then proceed. This prevents wrong-approach detours.

For a **large multi-slice feature** (repeats a pattern across many units — all remaining classes/subclasses/feats, a new edition's system, wiring every class into the action economy), use the **`/to-tickets` skill** instead of an inline checklist: it decomposes the goal into an ordered, proven-slice-first worklist persisted to `docs/tickets/<slug>.md` (see `docs/tickets/README.md`), so the work is resumable across sessions and driven off the machine worklists (coverage reports + `docs/character-system-backlog.md`). Often follows a `/grill` GO.

### Preserved intent rule
**Never re-introduce a feature, field, or component the user has explicitly removed.** If something is absent from the codebase, assume it was removed on purpose and confirm before adding it back.

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
  created_by (FK→users), created_at, updated_at

campaign_members
  id, campaign_id (FK→campaigns), user_id (FK→users),
  role ('gm' or 'player'), joined_at
  UNIQUE(campaign_id, user_id)

characters
  id, name, race, char_class, level, background, alignment,
  strength, dexterity, constitution, intelligence, wisdom, charisma,
  character_data (JSONB),   ← class-specific flexible data (HP, spell slots, features, skill profs, etc.)
                             ←   hp_rolls (integer): the CON-INDEPENDENT max-HP base = sum of hit-die results (level 1 = full die), no Constitution. Effective/displayed max HP = hp_rolls + level×CON-mod + passive per-level bonuses (Tough/Dwarven Toughness/Draconic Resilience), computed at display time via combatBonuses.effectiveMaxHp — so any CON change adjusts max HP dynamically & retroactively, no stored rewrite. Written at creation + level-up. Legacy characters stored `hp_max` (CON baked in) instead; hpRollBase() falls back to `hp_max − level×conMod` and the next level-up persists a real hp_rolls.
                             ←   currency ({cp, sp, ep, gp, pp} integers): the character's coin purse/wallet; seeded at creation from the chosen background's starting gold (BACKGROUND_STARTING_GOLD); editable in the CharacterDetail Items tab; coins shown depend on campaign.currency_type
                             ←   inventory (array): owned items, each a SNAPSHOT of an encyclopedia item ({uid, category, source_id, quantity, equipped, attuned, hand, ...itemFields}); managed in the CharacterDetail Items tab; equipping armor recomputes + writes character_data.armor_class (see inventoryData.js). WEAPONS + SHIELDS are held in HANDS: `hand` ∈ 'main'|'off'|'both' (a two-handed weapon = 'both'); `equipped` stays synced (equipped === hand is set); body armor still uses plain `equipped`. Legacy `equipped` weapons/shields migrate to hand slots on load (migrateHands). NOTE: `category` is the REST routing slug ('weapons'|'armor'|'adventuring-gear'|...) and `quantity` is the owned count; because adventuring-gear/food items carry their OWN `category`/`quantity` fields, buildEntry preserves those as `item_category`/`item_quantity` so they don't clobber the routing slug/count (the itemCategories gear/food configs read `item_category ?? category`)
                             ←   prepared_locked (boolean): prepare-casters only; true = player committed today's spell prep; GM can unlock via "Unlock (Long Rest)"
                             ←   draconic_bloodline ({name, damage}): Sorcerer Draconic Bloodline (5e)/Draconic Sorcery (2024) chosen dragon type; drives the Stats tab Draconic Ancestry line + the Stats Max HP value (folds in +1/Sorcerer level via MaxHpValue, with the source noted) + the 13+DEX AC option in the Items-tab computed AC summary. Separate from the Dragonborn race's draconic_ancestry.
                             ←   ek_spell_slots ({[spellName]: 'restricted'|'any'}): Eldritch Knight (5e only) — the SLOT CATEGORY each known spell was learned under. A 5e EK's leveled spells must be Abjuration/Evocation except the ones learned at levels 3/8/14/20 (four "any school" slots). The category belongs to the SLOT, not the spell's school (a Shield learned in the any-school slot stays swappable for any school), so it is recorded at pick time rather than inferred. `known_spells` stays a flat string[] (shared with every other known caster + actionEconomyData); this is an additive sidecar. Written by the LevelUpWizard New Spells step + the GM's CasterSpellBlock editor. Absent for the 2024 EK (no restriction). See subclassCasterData.js
                             ←   bonded_weapon_uids (string[]): Eldritch Knight Weapon Bond (L3+, both editions) — the inventory-entry uids of the up-to-2 bonded weapons; chosen in the Items tab (Weapons → Bonded Weapons panel), shown read-only in the Features-tab EK panel; drives the Action Economy "Bonded {Weapon}" bonus-action entries (see weaponBondData.js)
                             ←   hex_weapon_uid (string|null): Hexblade Hex Warrior (5e Warlock, L1) — the inventory-entry uid of the designated weapon (must lack Two-Handed); chosen in the Items tab (Weapons → Hex Warrior Weapon), shown read-only in the WarlockSheet features; the weapon attacks with CHA when it beats STR/DEX (folded into getAttacks/computeAttack via hexWeapon; see weaponBondData.js)
                             ←   arcane_shot_options (string[]) + arcane_shot_used (integer): Arcane Archer (5e Fighter, L3+) — the Arcane Shot options known (a subclass-scoped levelChoicesData pool, chosen at level-up, swappable one-per-level) and the uses spent of the flat 2/short-rest pool (reset by `_compute_rest_patch` on BOTH rest types). See arcaneShotData.js
                             ←   subclass_cantrips (string[]): cantrips granted by a SUBCLASS feature (Arcane Archer Lore) — a subclassGrants `surface:'spells'` grant; shown as the Spells tab's own "Subclass" source and enough on its own to give a non-caster the Spells tab
  experience_points (integer, default 0),   ← XP total; used when leveling_type="experience"
  level_up_pending (boolean, default false), ← set true when XP threshold crossed or GM triggers milestone LU
  user_id (FK→users), campaign_id (FK→campaigns),
  is_visible_to_players (boolean), notes,          ← "public notes" shown to all campaign members
  gm_notes (Text, nullable),                       ← GM only; always stripped from player/owner responses
  backstory (Text, nullable),                      ← markdown prose; owner + all members (read)
  personal_notes (Text, nullable),                 ← owner + GM only; stripped from other player responses
  image_path (String(500), nullable),              ← portrait; served via /uploads/characters/
  theme_music_url (String(500), nullable),         ← pasted URL (Spotify/YouTube/audio) OR uploaded `uploads/music/...` path; player-visible; played in-browser via MusicPlayer
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
  id, name, edition (String(10), default "5e"),    ← "5e" | "5.5e"; one row per edition (a feat in both editions = 2 rows, like character_classes)
  description, prerequisites (JSON: {} or {"text": "..."}), benefits (JSON),
  effects (JSON, nullable),  ← structured mechanical effects so a feat is more than a description card; array of typed objects
                             ←   {kind:"stat_mod", stat, amount} (Alert +5 initiative) | {kind:"ability_choice", abilities, amount} (Tavern Brawler +1 STR/CON)
                             ←   | {kind:"ability_score", ability, amount} (fixed) | {kind:"attack_mod", target:"unarmed", dice} | {kind:"action", name, economy, description, trigger} | {kind:"spell_grant", source_kind, cantrips, leveled, fixed, free_cast, ability} (Magic Initiate — grants picked spells) | {kind:"maneuver_grant", count, die} (Martial Adept — player picks N Battle Master maneuvers + a die; snapshotted to choices.maneuvers; for a Battle Master the die/maneuvers fold into the shared Combat Superiority pool, else a standalone d6 in the Feats tab) | {kind:"note", text}
                             ←   NULL/empty = prose-only (surfaced by report_feat_effects.py). Resolved by frontend featEffects.js; snapshotted onto character_data.feats[i] at acquisition.
  repeatable (boolean), source, owner_type (ENUM), owner_id, created_at, updated_at
  Seeded via seed_feats.py: 41 PHB-2014 feats (edition "5e") + 73 PHB-2024 feats (edition "5.5e",
    Origin/General/Fighting Style/Epic Boon). Idempotent (skips existing by name+edition+owner_type=system).
    Also backfills `effects` from FEAT_EFFECTS_5E (5e: 31/41) + FEAT_EFFECTS_2024 (5.5e: 52/73), authored per their own edition's rules (2024 Alert/Observant differ from 2014, Origin feats grant no ASI, etc.). The rest are honest prose-only `note`s — pure rules-text riders, most fighting-style riders, Crafter/Musician sub-pools, or Epic Boons.
    `python report_feat_effects.py` prints per-edition mechanized-vs-prose-only coverage (the "what still needs implementing" worklist). **`--check` is a RATCHET GATE** (compares to the committed `backend/feat_coverage_baseline.json` — 5e 31/41, 5.5e 52/73 — exit 1 if mechanized coverage regressed; run in CI + `/ship` Step 3b, not pytest since it reads the seeded dev DB). Bump the floor with `--write-baseline` after mechanizing more. Authoring procedure: the `/feat-effects` skill.

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
  id, name, edition (String(10), default "5e"),    ← "5e" | "5.5e"; a spell whose 2024 text DIFFERS
                                                     gets its own row (like feats/character_classes).
                                                     A spell with no 5.5e row is NOT duplicated — see
                                                     the edition fallback below.
  level, school, casting_time, range, components (Text),
  duration, description, higher_level (Text, nullable),
  ritual (boolean, default false), concentration (boolean, default false),
  classes, owner_type (ENUM), owner_id, created_at, updated_at
  Identity = name + edition + owner scope (enforced in service.py; no DB UNIQUE constraint).
  EDITION FALLBACK (get_all_spells): `?edition=5e` returns only 5e rows. `?edition=5.5e` (or "2024")
    returns 5.5e rows SHADOWING 5e rows of the same name — so a 2024 campaign sees the whole
    compendium, reading 2024 text where it's been authored and 2014 text everywhere else. Authoring
    2024 spell text is therefore incremental: add a 5.5e row and it takes over. Shadowing precedence:
    campaign beats system; within a tier, the exact edition beats the 5e fallback. With NO edition
    filter every edition of a spell is its own entry (matches the /feats no-filter behaviour).
  Seeded: 319 5e spells via seed_spells.py (D&D 5e API; rows tagged edition="5e"). The API is SRD-only
    and does NOT tag any spell with Artificer, so seed_artificer_spells.py appends "Artificer" to the
    `classes` field of the 59 Artificer-list spells present in the SRD (levels 1-5; uses SRD names like
    "Faithful Hound", "Arcane Hand"). 15 non-SRD Artificer spells (Absorb Elements, Catapult, etc.) are
    not in the compendium and are skipped. Idempotent; seed_spells.py's update path never touches
    `classes` so the tags survive re-seeding.
  Also seeded: seed_phb_spells.py — PHB spells the SRD API omits entirely (curated in-script, same as
    seed_items.py does for potions/food). Currently Blade Ward (5e + 5.5e — the 2024 version is a
    genuinely different spell: concentration, −1d4 to attackers) and Friends (5e). Before this, a
    character who knew one of these saw an EMPTY spell-detail dialog — the spell simply wasn't in the
    compendium. Any other non-SRD spell we want is a data entry here. Idempotent (name+edition+system).

creatures
  id, name, size, type, alignment, challenge_rating, armor_class,
  hit_points, speed, strength/dex/con/int/wis/cha, description,
  owner_type (ENUM), owner_id, created_at, updated_at

weapons
  id, name, damage, damage_type, weight, cost, weapon_category,
  range, properties (JSON), description, owner_type (ENUM), owner_id, created_at, updated_at

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

  Item tables seeded via seed_items.py: weapons/armor/adventuring_gear from the 5e API /api/equipment,
    magic_items from /api/magic-items; potions + food_drink + a curated "Improvised Weapon" (1d4
    bludgeoning, weapon_category "Improvised", Thrown 20/60 — a system weapon so it can be equipped;
    relevant to Tavern Brawler) are curated in-script (SRD API doesn't expose them cleanly). Idempotent
    (skips existing by name + owner_type=system). Counts after seed: weapons 38 (37 SRD + Improvised Weapon),
    armor 13, adventuring_gear 116, magic_items 362, potions 40, food_drink 8. (A one-time cleanup removed
    59 corrupt magic-weapon/armor duplicate rows — empty category + mojibake fields — that already existed
    in magic_items and were 500-ing the weapons/armor list endpoints.)
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
Campaign PUT accepts all settings fields: `use_alignment`, `ability_score_method`, `allow_reroll_ones`, `leveling_type`, `currency_type`, `starting_equipment`, `asi_feat_mode`. `currency_type` ("standard" | "full"), `starting_equipment` ("equipment" | "equipment_or_gold" | "none"), and `asi_feat_mode` ("asi_only" | "asi_or_feat" | "asi_and_feat") are in `CampaignResponse` + `CampaignListItem` so they reach the frontend CampaignContext. (Like the other settings, `asi_feat_mode` is set only via PUT — `create_campaign` relies on the column default.)

### Characters
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/characters | Yes |
| GET | /api/characters/campaign/{id} | Yes (member) |
| GET | /api/characters/{id} | Yes (owner or GM) |
| PUT | /api/characters/{id} | Yes (owner or GM); uses `CharacterGmUpdate` — only GM can set `gm_notes`/`is_visible_to_players`; GM cannot overwrite `personal_notes` |
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
| POST | /api/characters/campaign/{id}/rest | Yes (GM of campaign); body: `{ rest_type: "short"\|"long"\|"initiative", character_ids: int[] }` (an unrecognised `rest_type` is now a 422 — it used to silently patch nothing and report success); returns `RestResponse` with per-character change summaries. Also resets racial rest resources (from `_RACIAL_REST_RESOURCES`, level-gated), clears Divination Wizard `portent_rolls` on a long rest, resets Eldritch Knight Fighter `spell_slots` on a long rest (Fighter isn't in `_SPELLCASTING_CLASSES`), and resets feat spell-grant **free casts** (`feat_freecast_<slug>_used` via `_feat_freecast_used_key`, from each feat's `choices.spell_grant.free_cast`) on a long rest. **`rest_type: "initiative"`** is not a rest — it is the GM's encounter flow, computed by `_compute_initiative_patch` from the `_INITIATIVE_RESOURCES` table (the SINGLE source of truth; deliberately NOT mirrored on the frontend, which renders the returned `changes` instead of predicting them). Three shapes via `mode`: `regain_when_empty` (RAW "…and have no uses remaining"), `floor` (top up to at least N, never reduces), `opt_in` (the player CHOOSES — it spends its own `charge_key`, so it never fires unless named in `RestRequest.opt_ins` `{character_id: [feature]}`; the page learns who has one from **`GET /api/characters/campaign/{id}/initiative-options?character_ids=`**, GM-only, rather than mirroring the table). `total`/`amount` accept an int, the `'level'`/`'pb'` sentinels, **or a callable taking the pool context** — a pool's size isn't always constant (a Battle Master's is `6 + Martial Adept dice`, a Bard's is their CHA modifier), and a flat number would refill someone who still had a use left. The formula lives on the row, so a new feature stays a one-row change. Authored (all 8 initiative-triggered features in the app): Ever-Ready Shot (Arcane Archer L15), Relentless (Battle Master L15, both editions), Superior Inspiration (Bard 5e L20), Perfect Self (Monk 5e L20 — regains **4**, which is why `amount` is a number not a flag), Perfect Focus (Monk 2024 L15, `floor`), Uncanny Metabolism (Monk 2024 L2, `opt_in`), Tireless Spirit (Samurai L10). A long rest also clears `uncanny_metabolism_used` |
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
- CSS variables for theming are defined in `src/index.css` (light + dark mode)
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
| `/campaigns/:campaignId/encounters` | EncountersPage | ✅ Functional (GM combat/initiative tool: encounter list + create, add/remove player characters, **Roll All** (d20 + the modifier read off each sheet via `initiativeForCharacter`) or per-row manual entry, server-sorted initiative order, and **Start Combat** → `applyRest(…, 'initiative', …)` with a per-character "what was regained" summary. GM-only incl. reads — a player sees a "GM tool" notice and no fetch fires. No monsters, no turn/round tracking in V1) |
| `/campaigns/:campaignId/encyclopedia` | EncyclopediaPage | ✅ Functional (Classes tab: edition toggle + class browser; Skills tab: 18 static 5e skills + ability filter; Spells tab: search/school/level filters + GM override; Spells tab contains GM-only sub-tabs — System Spells / Campaign Spells; Feats tab: edition-aware read-only feat browser) |
| `/campaigns/:campaignId/encyclopedia/spells/:spellId` | SpellEditPage | ✅ Functional (GM create/edit campaign spell; `new` creates homebrew) |
| `/campaigns/:campaignId/encyclopedia/items/:category/:itemId` | ItemEditPage | ✅ Functional (GM create/edit campaign item for any of the 6 categories; `new` creates homebrew) |
| `/campaigns/:campaignId/encyclopedia/maneuvers` | ManeuversPage | ✅ Functional (Battle Master maneuver reference, edition toggle + search; linked from the Battle Master subclass overview and the Martial Adept feat) |
| `/campaigns/:campaignId/encyclopedia/classes/:className` | ClassPage | ✅ Functional (one class's full reference — every level, not just earned features — rendering the shared `ClassOverview` with an edition toggle; the linkable target the Classes tab lacked, since it selects a class into local state; linked from `class-encyclopedia-link` in the ClassSheet features section, which replaced the old earned-features dropdown) |
| `/campaigns/:campaignId/encyclopedia/classes/:className/:subclassName` | SubclassPage | ✅ Functional (one subclass's full reference — every level, not just earned features — rendering the shared `SubclassOverview` with an edition toggle; the linkable target the Classes tab lacked, since it shows subclasses in a dialog; linked from `subclass-encyclopedia-link` in `SubclassDetails` on every character sheet) |
| `/campaigns/:campaignId/encyclopedia/mechanics/jump` | JumpPage | ✅ Functional (static jump-mechanics reference: long/high, running start, Athlete feat, worked example; linked from the CharacterDetail Stats-tab JumpCard) |
| `/campaigns/:campaignId/encyclopedia/mechanics/armor-class` | ArmorClassPage | ✅ Functional (static AC reference: armor categories/shields/unarmored defenses/feat AC mods/armor Strength requirements (−10 ft speed when unmet)/armor proficiency (STR-DEX disadvantage + no casting when worn unproficient), worked examples via computeArmorClass; linked from the Items-tab InventoryTab AC summary "Learn more") |
| `/campaigns/:campaignId/encyclopedia/mechanics/action-economy` | ActionEconomyPage | ✅ Functional (static action-economy reference: the 5 buckets via TABS/TAB_LABELS, standard actions bound to UNIVERSAL_ACTIONS_*, edition toggle since the action menu differs; linked from the Action Economy tab "Learn more") |
| `/campaigns/:campaignId/encyclopedia/mechanics/hit-dice` | HitDicePage | ✅ Functional (static hit-dice reference: pool = level × class die, short-rest spend = die+CON, long-rest recovery = half total rounded down min 1, Durable floor via durableHitDieMin, Bard Song of Rest; linked from the Stats-tab Hit Points & Movement card "How Hit Dice work") |
| `/campaigns/:campaignId/encyclopedia/mechanics/loading` | LoadingPage | ✅ Functional (static Loading-property reference, edition toggle since 2024 removed the property: one shot per action/bonus/reaction regardless of Extra Attack, the 4 loading weapons, Crossbow Expert removes it on proficient crossbows + Action Surge/War Priest as extra-action workarounds; note text sourced from `weaponLoadingNote`; linked from the Items tab + Action Economy tab loading notes) |
| `/campaigns/:campaignId/encyclopedia/mechanics/object-interaction` | ObjectInteractionPage | ✅ Functional (static "Drawing & Stowing Weapons" reference — pure rules, no helper/card, no edition toggle: one free object interaction per turn, swapping weapons = two interactions, Dual Wielder draws/stows two; cross-links Loading/AC/Action Economy; linked from the Dual Wielder feat (FeatsTab dialog + FeatsSubTab row) and the Items-tab Weapons sub-tab) |
| `/campaigns/:campaignId/encyclopedia/mechanics/magical-attacks` | MagicalAttacksPage | ✅ Functional (static "Magical Attacks & Resistance" reference: what resistance/immunity to nonmagical B/P/S does to damage, the three ways an attack becomes magical (item / feature / spell), the in-app features that grant it (only Magic Arrow auto-tagged so far), a worked example computed through `magicalAttackSource`, the two in-app features that grant a *character* the resistance, the 2024 statblock change (prose, no edition toggle — the mechanic is unchanged), and an honest list of what the app can't track (magic weapons unequippable, no spell duration, no bestiary resistances); linked ONLY from the expanded `MagicAttackBadge` note, so the link appears exactly when the Magic tag does) |
| `/campaigns/:campaignId/encyclopedia/mechanics/spacing` | SpacingPage | ✅ Functional (static "Spacing & the 5-Foot Rule" reference — pure rules, no helper/card, no edition toggle: what "within 5 ft" means, opportunity attacks + Disengage, disadvantage on ranged weapon AND ranged spell attacks within 5 ft, and the in-app feats/features that bend these rules (Crossbow Expert etc.); cross-links Action Economy + Loading; linked from each ranged weapon row in the Items tab, the CharacterDetail Spells tab, and the Action Economy tab (per ranged weapon entry + the Spell section)) |

### UI — Key Behaviours
Per-page behaviour details (Locations, NPCs, Campaign Settings, Calendar/Timeline, TimelinePage, Sessions, Members, Characters) live in **[docs/frontend-map.md](docs/frontend-map.md#ui--key-behaviours)** — read it when touching those pages.

### Frontend Not Yet Built
- Action Economy tab — **framework + Fighter (5e + 2024) built** (vertical slice). Auto-derived sources (weapon attacks, spells-by-casting-time, Two-Weapon Fighting, universal action menu) work for ALL classes; the curated class-feature→action-economy map (`actionEconomyData.js`) currently covers Fighter only. **Subclass features now have their own map** (`SUBCLASS_FEATURE_ACTIONS_*`, level-gated from SUBCLASS_DATA — wired: Eldritch Knight Weapon Bond + the War Magic combo + Arcane Charge rider as curated blocks; Arcane Archer Arcane Shot + Curving Shot). **Arcane Shot demonstrates the "attach to the attack it rides on" shape**: rather than a free-floating No Action entry, a qualifying shortbow/longbow attack entry carries an `arcaneShot` payload (cost, save DC, each known option with its description) plus the shared `arcane_shot_used` resourceKey, and the tab renders it as a block inside that weapon's card with the Use control in it — so the option is read off the same card as the attack. It falls back to a standalone entry only when no bow is equipped (RAW excludes crossbows), so the feature never vanishes. **`RACIAL_ACTIONS` entries can be COMPUTED** — an entry may carry `compute({characterData, level, scores})` that derives its own detail from the character, plus a `resourceKey` into `RACIAL_REST_RESOURCES` (the tab merges racial resources alongside the class config's, so the card gets a Use button writing the same `<key>_used` as the Stats tab). Wired: **Dragonborn Breath Weapon** — damage (2d6→3d6@6→4d6@11→5d6@16), save DC (8+CON+PB), save ability and area all resolved from level + the stored `draconic_ancestry` via `race/breathWeaponData.js`, instead of the old static string that showed a level-1 card at level 16. Remaining racial gap: **racial SPELLS still don't reach this tab** — `characterSpellNames` reads only cantrips/prepared/known, so a Tiefling's Hellish Rebuke (a reaction) and Thaumaturgy are absent; `getRacialSpellResources` is the resolver to wire. Remaining: author `CLASS_FEATURE_ACTIONS_*` for the other 12 classes (+ more subclass features), establish the "rider" convention for no-action abilities (Sneak Attack, Divine Smite, Rage), and wire chosen options into the action economy (Battle Master maneuvers — now stored in `character_data.maneuvers`, Sorcerer metamagic, Warlock invocations — not yet stored).
- **Unified Spells tab — mechanism built, 1 of 15 sheets converted.** Every caster should render the one shared layout (level strip + per-level Class/Racial/Feats source toggle). A hand-written sheet opts in by delegating its spells section to `CasterSpellBlock` with an entry in `classData/casterDescriptors.js` (presence = the fold switch read by `CharacterDetail.foldSources`). Done: Wizard + Eldritch Knight (config-driven, always used it) and **Cleric 5e**. The other 14 caster sheets still hand-roll their section. **Remaining work is per-class and is meant to be picked up during that class's QA pass — see `docs/tickets/unified-spells-tab.md`** (deferred behind finishing the Fighter subclasses). School-based separation stays EK-only (+ Arcane Trickster when built, which needs Rogue spellcasting first — it does not exist yet).
- Multiclassing support (deferred — will be its own feature after both editions complete)
- Equipment / Inventory — **built** (CharacterDetail Items tab: Wallet + `InventoryTab`; add encyclopedia items per category, quantity/equip/attune/remove, computed AC from equipped armor + attack rows from equipped weapons, proficiency flags; **hand-based equipping** — weapons + shields are held in Main/Off hands via a Hands panel (two-handed = both hands, a free hand surfaces the unarmed strike + somatic-casting note, a Versatile weapon has a grip button to switch between one-handed and a two-handed grip for the larger die); body armor still uses a plain Equip toggle; **ammunition tracking** — ammo shown under the Weapons tab with a per-ranged-weapon ammo selector + Use button that decrements the matched stack; the control itself is the shared `WeaponAmmoControl`, also rendered on every Ammunition weapon's card in the **Action Economy** tab (same spend rule, same out-of-ammunition flag, writes the same `{inventory}` patch — so the two tabs can't drift). **Stocking weapons + ammunition is GM-only** (`isGm`, threaded as `isGm && !playerView`): Add Weapon, Add Ammunition, every weapon/ammo delete and the ammo ± steppers require the GM — a player equips, holds and spends (Use Ammunition) but never mints or destroys, so a quiver goes DOWN only by firing. The other categories stay player-managed). **Armor Stealth disadvantage is wired** (`stealthDisadvantageArmor`/`armorStealthNote`): the compendium's `stealth_disadvantage` flag now reaches the sheet — an `inv-stealth-warning-{uid}` note on the armor row (before and after equipping) and the `dis` tag on **Stealth** in the Abilities & Skills panel, independent of the armor-proficiency disadvantage (a proficient Fighter in Chain Mail still can't sneak). Medium Armor Master cancels it for medium armor only and says so on the row rather than going silent. Each stealth note also carries an `inv-stealth-learn-more-{uid}` link into the **Armor Class** mechanics page (which gained a Stealth-disadvantage section rather than getting a page of its own) — the link lives inside the note, so it shows only when the character owns armor that would impose the disadvantage. Remaining polish: weight/encumbrance, 2024-edition weapon-mastery hooks, custom (non-encyclopedia) loot entries, equipping a magic weapon/armor feeding its bonus into AC/attacks, and AUTO-spending ammo when an attack is rolled (spending is manual — a Use button now sits on the Action Economy attack card as well as the Items tab; the app displays attacks rather than rolling them, so there is no roll to hook). **Fighting styles now fold into the attack/AC math** (fightingStyles.js → Archery/Dueling/Thrown/Defense; see the inventory section). **Magical attacks — vertical slice built** (`weaponMagic.js`): `magicalAttackSource(weapon, {charClass, subclass, level, edition})` answers *per weapon* whether its attacks overcome resistance/immunity to nonmagical damage, returning `{source, note}` so the badge can name WHY (a character-level flag would be wrong — every source covers a subset of what you wield). Resolved once inside `getAttacks` (row field `magical`) and rendered by the shared **`MagicAttackBadge`** — a "Magic · {source}" tag whose rule text expands on CLICK (`{testId}-note`), not hover — on BOTH the Items-tab attack row (`attack-magical-{uid}`) and the Action Economy attack card (`ae-magical-{key}`), so neither the answer nor the presentation can drift. Authored source: **Magic Arrow** (Arcane Archer L7, shortbow/longbow only). Item-intrinsic magic weapons are NOT yet a source — they live in `magic_items` and can't be equipped as weapons, so nothing is currently mis-marked as mundane; spell-granted magic (Magic Weapon, Shillelagh) is deliberately excluded until a buff-duration model exists. Further sources (Monk Ki-Empowered Strikes, Warlock Improved Pact Weapon) are pure data entries in `MAGIC_ATTACK_SOURCES`. **NOT calculated — conditional "rider" damage:** Sneak Attack, Divine Smite / Improved Divine Smite, Rage damage — these are once-per-turn or situational extras that can't be honestly baked into a flat damage string; they stay prose in the feature tables until a "rider" convention is designed (same gap noted for the Action Economy tab). (**Great Weapon Master** and **Sharpshooter**'s −5/+10 are surfaced as an explicit per-weapon toggle in the Action Economy tab rather than baked into the flat string — one shared control, see actionEconomyData.js `powerAttackVariant`, which both feats drive on disjoint weapon sets (Heavy melee vs. ranged).)
- Starting equipment at creation — **built for 5e** (CharacterCreate Equipment step + `startingEquipmentData.js`/resolver; class (a)/(b) choices + weapon picks + background items resolve into `character_data.inventory`; gated by the GM `starting_equipment` campaign setting; `seed_starting_items.py` seeded packs/ammo/focuses/tools/clothes). **2024 not yet authored** — 2024 class equipment slots into the same mechanism; 2024 *background* equipment is blocked on building the 2024 background system (no 2024 backgrounds exist; creation uses the hardcoded 2014 `BACKGROUNDS_5E`).
- Feat selection UI — built for 5e: feats live in the encyclopedia (Feats tab, edition-aware), the Variant Human creation flow picks one feat + skill, the **LevelUpWizard ASI levels** offer ASI and/or a feat per the GM's `campaign.asi_feat_mode` (asi_only / asi_or_feat / asi_and_feat), and the **CharacterDetail Features → Feats sub-tab** (`FeatsSubTab`) lists owned feats with descriptions + GM add/remove. All stored in `character_data.feats` as `{id, name}`. **5.5e (2024) ASI/feat flow: TODO** — the LevelUpWizard feat step is edition-aware and functions for 2024 campaigns, but 2024-specific feat handling is unvalidated: 2024 feat categories (Origin/General/Fighting Style/Epic Boon) and **half-feats that grant a +1 ability score alongside their benefit** (the wizard doesn't yet apply a feat's bundled ASI). **Feat effects model — built (5e vertical slice).** Feats carry a structured `effects` JSON array (backend `feats.effects`); the frontend `featEffects.js` resolves them into real mechanics — `stat_mod` (Alert → +5 initiative on the Stats tab), `ability_choice`/`ability_score` (half-feats like Tavern Brawler → ability chooser at acquisition, folded into the score), `attack_mod` (Tavern Brawler → 1d4 unarmed in Action Economy), `action` (Tavern Brawler grapple → an Action+Bonus combo: Unarmed Strike or equipped Improvised Weapon as the Action, Grapple as the Bonus), `proficiency` fixed weapon grant (Tavern Brawler → "Improvised weapons" in the Items-tab banner + per-weapon proficiency check; an "Improvised Weapon" is a seeded system weapon you can equip), `note` (display-only). Effects are snapshotted onto `character_data.feats[i]` at acquisition and shown as chips in the Feats sub-tab. `report_feat_effects.py` lists per-edition mechanized-vs-prose-only coverage. **Status: 5e 26/41 feats mechanized** (see `report_feat_effects.py`). Consumers live: `stat_mod` initiative (CharacterDetail derived row) + passive_perception / passive_investigation / passive_insight (the Abilities & Skills **Passive Scores** row, via `skills/passiveSkills.js` — siblings `skills/skillMath.js` (shared arithmetic) + `skills/BreakdownValue.jsx` (the clickable number + its expandable panel) put a click-to-see-the-math breakdown behind EVERY derived number: skills, saving throws, passive scores and initiative — a passive is 10 + the skill modifier, so proficiency counts and expertise doubles it) + speed (CharacterDetail annotation `speed-feat-note`); `ability_score`/`ability_choice` (LevelUpWizard half-feat chooser **and** Variant Human *creation* chooser `human-feat-ability-{stat}`); `action` (Action Economy); `attack_mod` unarmed die; `resource` pools (Lucky, Martial Adept — FeatsSubTab tracker via RestResourceControl + backend `_compute_rest_patch` reset + getRestSummary); `proficiency` **fixed** grants (armor → Items-tab banners via gatherProficiencies) + **saving_throw** (Resilient → saves display) + **count-choice pickers** (Skilled 3 skills/tools, Linguist 3 languages, Weapon Master 4 weapons — `featProficiencyData.js` drives count-limited pickers in the LevelUpWizard feat step + Variant Human creation; picks merge into skill_proficiencies / feat_tool_proficiencies / feat_languages / feat_weapon_proficiencies and surface in banners + the "From Feats" languages group); `note` (display-only). 2024 feats are authored too (`FEAT_EFFECTS_2024`, 50/73) and consumed by the same edition-agnostic resolvers. **PB-scaled** values are supported: a `stat_mod` `amount` or `resource` `total` of `'pb'` resolves against the proficiency bonus the consumer passes (`getFeatStatMods(feats, stat, {pb})`, `getFeatResources(feats, {pb})`) — drives 2024 Alert's initiative-proficiency + Lucky's PB luck points. `expertise` (Skill Expert) is wired too — a count-choice grant whose pool is the character's proficient skills (incl. a skill picked from the same feat), routed to `expertise_skills`. **Conditional AC** is wired via `ac_mod` effects evaluated inside `computeArmorClass` (which has the equipment context): Defense (+1 while wearing armor), Dual Wielder (+1 with two equipped melee weapons), Medium Armor Master (raises the medium-armor DEX cap to 3). **`stat_mod` speed** folds into the shared **CombatBlock** Total Speed for data-driven sheets (Fighter/Wizard, `total-speed`/`total-speed-feat-note`); the hand-written sheets — which can't yet — show a central CharacterDetail annotation (`speed-feat-note`, suppressed when `getClassConfig` finds a config), so it drops away progressively as classes migrate via `/class-config`. The wizard's feat **prereq gating now covers the armor bucket** too — it derives the character's armor proficiencies from the class table + race grants + feat-granted armor (so the ladder works: Lightly → Moderately → Heavily Armored), so a caster sees armor feats locked. The feat-effects consumer set is nearly complete (5e 31/41, 5.5e 52/73 — the rest are honest notes). **`spell_grant` (Magic Initiate, both editions) — BUILT (vertical):** the effect + resolvers (`getSpellGrantSpecs` / `getFeatGrantedSpells` → `{cantrips, leveled, freeCasts}` + `featFreeCastUsedKey`, snapshotted to `choices.spell_grant`); the `FeatSpellGrantPicker` wired into the LevelUpWizard feat step + Variant Human creation (picks a list + ability + cantrips + a 1st-level spell, blocks Next via `spellGrantComplete`); the CharacterDetail **Spells tab Class/Racial/Feats source sub-tabs** (`spell-source-{key}`, only non-empty shown) with the Feats section (`FeatSpellsSection`) showing the granted spells (per-level `SpellLevelTabs`) + a **1/long-rest free-cast tracker** (`feat_freecast_<slug>_used`, reset on a long rest by `_compute_rest_patch` + mirrored in `getRestSummary`). Also authored: **Spell Sniper** (5e class cantrip / 2024 group cantrip), **Telekinetic** (fixed Mage Hand cantrip + bonus-action shove `action`), **Telepathic** (fixed Detect Thoughts), **Fey Touched** (fixed Misty Step + a chosen Divination/Enchantment L1), **Shadow Touched** (fixed Invisibility + a chosen Illusion/Necromancy L1) — via the extended spell-grant model: a `spell_grant` may carry always-granted `fixed:[{name,level}]` spells (shown read-only); a leveled slot may carry a `school:[...]` filter (chosen from any spell of that school, no class list); `ability:'none'` skips the ability picker when a 2024 half-feat's ASI already sets it; and `free_cast:'long_rest'` means **every leveled granted spell (fixed level≥1 + chosen leveled) is a 1/long-rest free cast** (so Fey/Shadow give two). `resolveSpellGrantValue(spec, value)` snapshots the final shape — picks + `fixed` + a `free_casts:[names]` list — into `choices.spell_grant` (pure-fixed/school feats need no source pick so they auto-complete). `_compute_rest_patch` + `getFeatGrantedSpells` read the `free_casts` list (tolerating an older singular `free_cast`). **Ritual Caster** is also done via a `ritual: True` leveled slot: the picker filters that slot to ritual-tagged spells of the chosen class, and `resolveSpellGrantValue` converts the picks into a **growable, editable `ritual_book:[names]`** (cast as rituals only — no free cast); `getFeatGrantedSpells` returns `ritualBooks:[{featIndex, source, spells}]`, which the Spells-tab Feats section renders as an editable `SpellList` (add/remove persists onto the feat instance via an `{feats}` patch). **All spell-granting feats are now authored** (Magic Initiate, Spell Sniper, Telekinetic, Telepathic, Fey/Shadow Touched, Ritual Caster). **`maneuver_grant` (Martial Adept) — BUILT (5e):** the effect `{count, die}` + resolvers (`getManeuverGrantSpec`/`maneuverGrantComplete`/`getFeatManeuvers`/`martialAdeptDieCount`/`martialAdeptManeuverCount`); the `FeatManeuverPicker` wired into the LevelUpWizard feat step + Variant Human creation (pick N maneuvers, excluding any already known, blocks Next), snapshotted to `choices.maneuvers`. A **Battle Master** folds the feat's +1 die (at their die size) and +N maneuvers into the shared Combat Superiority pool (`BattleMasterPanel`) with the picks merged into `character_data.maneuvers`; a **non-Battle-Master** gets a standalone d6 (the existing `martial_adept_superiority` resource, reset on a short rest by `_compute_rest_patch`) + the chosen maneuvers shown in the `FeatsSubTab` maneuver panel. Author more via `/feat-effects`. Authoring procedure: the `/feat-effects` skill.
- Level-up pool choices — **generic mechanism built + proven on three pools**: **Sorcerer Metamagic**, **Warlock Eldritch Invocations**, and **Arcane Archer Arcane Shot** (`levelChoicesData.js` + the LevelUpWizard `level-choices` step). Each new pool drove one small generic addition and no new component code — option-level gating via `minLevel` (`availablePoolOptions(…, level)`) for invocations; a **`subclass` field** for Arcane Shot, so a pool can belong to a SUBCLASS rather than the whole class (`getLevelChoices(…, subclass)` is passed the wizard's `effectiveSubclass`, so a subclass chosen in the same run still gets its pool) plus `getEarnedLevelChoices` + optional `improvementAt` / `derived(level, scores)` for the sheet display. Further pools are pure data entries: Expertise (Rogue 1/6, Bard 3/10), Fighting Style for non-Fighters (Ranger/Paladin), Pact Boon, etc. (Battle Master Maneuvers have their own dedicated step.) The chosen options display read-only on a data-driven sheet via the shared **`KnownOptionsBlock`** (owed-slot picker, GM-Edit remove, level-gated improved option text — past `improvementAt` an option's `improvedDescription` REPLACES its description, resolved for every surface by `poolOptionDescription`, so nobody appends an "…increases to 4d6" rider that reads as extra damage — derived line) — deliberately pool-agnostic rather than a second `BattleMasterPanel`. **Replace-on-level-up is built** — the `level-choices` step (Metamagic, Invocations), the Battle Master `maneuvers` step, and the known-caster `spells` step all let the player swap one held option/maneuver/spell when leveling (via a `ReplaceOneSelect` for the pools/maneuvers, or just remove+add in the spells step). **Remaining gap**: full *prerequisite* gating beyond level (Pact Boon / specific cantrip / another-invocation deps — only `minLevel` is enforced; other prereqs are noted in the option description). The hand-written sheet free-text inputs remain the fallback.
- Subclass grants (proficiency + class-pool picks) — **one consolidated mechanism, proven on three subclasses**: `subclassGrants.js` handles a subclass *proficiency* choice (Battle Master "Student of War"), a *class-pool* pick (Champion "Additional Fighting Style"), and a *skill + cantrip* pair (Arcane Archer "Arcane Archer Lore") via the LevelUpWizard `subclass-grants` step. `surface` says which panel displays the chosen value and now has four values — `'sheet'` (the ClassSheet subclass block, owed-slot fillable; the default and the ONLY one that renders there), `'banner'` (Items-tab proficiency banners), `'skills'` (the Abilities & Skills panel), `'spells'` (the Spells tab's Subclass source) — so a grant is never shown twice. Merged from the former `subclassProficiencyData` + `subclassLevelChoices` while only two subclasses were wired (cheap consolidation window). Adding another subclass (either kind) is pure data entry. Kept SEPARATE: `levelChoicesData.js` (class-scoped pools — Metamagic/Invocations — with cumulative knownAtLevel + replace-on-level-up + minLevel; a genuinely different shape, and the Sorcerer/Warlock sheets' pool source). Don't fold class-scoped pools into subclassGrants; if a 3rd distinct shape appears, reconsider — flagged via the `/subclass-features` skill.
- Subclass spellcasting — **built, Eldritch Knight proven (both editions)** via `subclassCasterData.js` (known-caster model: third-caster slots + cantrips/spells-known progressions) resolved by ClassSheet (`activeCaster`), rendered by CasterSpellBlock's `kind:'known'` block, leveled through the LevelUpWizard New Spells step, and reset by the backend long-rest flow. The model also carries the **per-edition school restriction + swap rules** (5e Abjuration/Evocation with four any-school slots at levels 3/8/14/20, recorded per-slot in `character_data.ek_spell_slots`; one leveled swap per Fighter level in both editions; a cantrip swap in 2024 only) — a restricted caster renders two categorized spell lists on the sheet and two school-filtered pickers in the level-up wizard, all driven off the caster entry, so the next restricted subclass is data entry. **Arcane Trickster remaining**: pure data entry in `subclassCasterData.js` + the equivalent wiring on the hand-written Rogue sheets (Rogue isn't data-driven yet — flag that part before building).
  - **Class-feature coverage worklist + RATCHET GATE:** `npm run report:class-coverage` (frontend; `scripts/report-class-coverage.mjs`) prints, per edition + class, which class features are mechanized (`asi` / `choice` / `action`) vs. prose-only — the gap list for what to wire next (mirrors the backend `report_feat_effects.py`). Conservative/under-counting by design: it loads only pure-data sources (feature tables, `levelChoicesData`, `actionEconomyData`), so features wired ONLY in a `.jsx` class config/sheet (locked choices, some rest trackers) show as prose-only. Current baseline: 5e 78/270, 5.5e 61/270. (`scripts/extensionless-loader.mjs` lets plain Node load the project's Vite-style extensionless imports; `report-class-coverage.test.js` covers `buildClassCoverage`, 7 tests.) **The numbers are a committed floor** (`scripts/coverage-baseline.json`, via exported `coverageTotals()`): `coverage-ratchet.test.js` (5 tests) fails `npm test` if mechanized coverage drops below it — so the Stop hook + CI catch a regression automatically. When you mechanize more, run `npm run coverage:baseline` to ratchet the floor up and commit the new baseline.
  - **Spell upcast coverage worklist:** `npm run report:upcast-coverage` (frontend; `scripts/report-upcast-coverage.mjs`, backend must be up) runs `spellUpcast.classifyUpcast` over the whole live catalog and writes `docs/spell-upcast-review.md` — the list of spells whose upcast text the Cast dialog can't turn into a computed number (target/duration/DC upcasts, ambiguous or malformed dice), grouped by reason, so we can later decide which deserve structured upcast data. Re-run whenever spells are added. Current baseline: 322 spells → 232 none / 28 computed / 62 prose-only. (Some prose-only entries are seed-data typos — Moonbeam "1dl0", Shatter's malformed tail, "3nd level" — flagged for a separate data cleanup.)
- **Encounters / Roll Initiative — V1 built (GM-driven), worklist in `docs/tickets/roll-initiative-v1.md`.** Done: the shared `initiativeData.js` helper (one source for the modifier — DEX + feat `stat_mod`s + the Champion advantage flag — consumed by both the Stats tab and the encounter page), the persisted encounters module, `rest_type:'initiative'` + the `_INITIATIVE_RESOURCES` table, and the page. **All 8 initiative-triggered features in the app are authored** across the three shapes — `regain_when_empty` (Ever-Ready Shot, Battle Master Relentless ×2 editions, Bard Superior Inspiration, Monk Perfect Self which regains 4, Samurai Tireless Spirit), `floor` (Monk 2024 Perfect Focus), and `opt_in` (Monk 2024 Uncanny Metabolism, which spends its own charge and so is offered as a checkbox on the page via the initiative-options endpoint). Building Tireless Spirit also **created the Samurai Fighting Spirit pool**, which had never existed (a `subclass:'Samurai'` rest-resource row on the Fighter config + its long-rest reset). Deferred by design: monsters (waiting on the Bestiary tab), turn/round tracking, and players rolling on their own screens (there is no live-update transport in the app — no websockets, no polling).
- Loot table UI
- Encyclopedia browsing UI — Classes, Skills, Spells, Items (Weapons/Armor/Gear/Potions/Magic Items/Food & Drink — system browse + GM override + campaign homebrew + edit), Feats, and **Mechanics** (game-mechanic reference pages — see below) tabs exist; Monsters tab not yet built. Items are not yet integrated into the character sheet (Weapons & Armor tab inventory is the next step)
- **Game-mechanics reference pages — framework + Jump built (vertical slice).** Pattern: a pure helper module (`jumpData.js`) is the single source of truth, consumed by both a static encyclopedia page (`JumpPage`, routed under the Mechanics tab via `mechanicsRegistry.js`) AND a computed surface on the relevant sheet (Stats-tab `JumpCard`) that links back to the page. Built: Jump (Flow A — helper+card), Armor Class (Flow B — reuses computeArmorClass, linked from the Items-tab AC summary), Action Economy (Flow B — reuses actionEconomyData with an edition toggle, linked from the Action Economy tab), Hit Dice (Flow B — documents HitDiceTracker + rest recovery, linked from the Stats-tab Hit Points & Movement card), Loading (Flow B — reuses inventoryData's weaponLoadingNote, edition toggle since 2024 dropped the property, linked from the Items + Action Economy tab loading notes), Object Interaction / "Drawing & Stowing Weapons" (page-only, NO helper/card — a pure rules concept with nothing to compute; no edition toggle; linked from the Dual Wielder feat in both feat surfaces + the Items-tab Weapons sub-tab), Spacing / "the 5-Foot Rule" (page-only, NO helper/card — no edition toggle; the 5-ft rule, opportunity attacks + Disengage, within-5-ft disadvantage on ranged weapon AND ranged spell attacks, plus a page-local list of the in-app feats/features that bend it; linked from each ranged weapon row in the Items tab, the CharacterDetail Spells tab, and the Action Economy tab (per ranged weapon entry + the Spell section)). **Magical Attacks & Resistance** (Flow B, page-only — the per-weapon answer already lives in `weaponMagic.js`: resistance to nonmagical B/P/S, the three routes to a magical attack, the in-app features granting it, a worked example run through `magicalAttackSource`, the 2024 statblock change as prose rather than an edition toggle, and what the app can't track; linked from INSIDE the `MagicAttackBadge` expanded note so the link exists only where the Magic tag does). Registry roadmap ("Coming soon" cards): Conditions, Concentration. **Use the `/mechanics-page` skill** to author each — it encodes both flows (Flow A new mechanic: helper+card → page → link; Flow B page-only when the math already exists like AC/Action Economy: page → link from the existing surface).
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
```
backend/tests/
├── conftest.py                     # shared fixtures + helpers
├── test_auth.py                    # auth module
├── test_campaigns.py               # campaign CRUD + member management + TestUserSearch (search by username/email, excludes self, min 2 chars, auth required, response shape) + TestCampaignCurrency (currency_type defaults to "standard", GM can set "full", present in list response) + TestCampaignStartingEquipment (defaults to "equipment", GM can set equipment_or_gold/none, present in list) + TestCampaignAsiFeatMode (defaults to "asi_or_feat", GM can set asi_only/asi_and_feat, present in list)
├── test_calendar_timeline.py       # calendar (6+2+3+4+8+8), timeline events (13), event links (6), location filter (5) = 57 tests
                                    #   TestCalendarCRUD(6), TestSeasons(2), TestMonths(3), TestMonthOptionalName(4),
                                    #   TestWeekdays(7), TestEras(8), TestTimelineEvents(13, incl. gm_notes), TestEventListFieldRoundTrip(8), TestEventLinks(6), TestLocationFilter(5)
├── test_characters.py              # character CRUD + visibility, TestGmNotes (gm_can_set/get, stripped_from_owner, player_cannot_set), TestGmDelete (gm_can_delete, other_player_cannot), TestCampaignEdition (defaults_to_5e, create/update/list), TestCharacterListFieldRoundTrip incl. character_data, TestApplyRest (GM can short/long rest, player 403, non-member 403, cross-campaign filter, Warlock pact slots, Wizard HP+slots, hit dice recovery (half total rounded down min 1 — even + odd level), response shape, Dragonborn Breath Weapon short-rest reset, Relentless Endurance long-rest-only, Drow darkness level-gated, Portent cleared on long rest, Portent untouched on short rest, Battle Master Superiority Dice reset on short + long rest, non-Battle-Master Fighter unaffected, feat resource pools — Lucky+Martial Adept reset on long rest, only short-recharge feat resource resets on a short rest), TestCharacterMusic (owner/GM upload, non-owner player 403, disallowed extension 400, delete clears url), feat spell-grant free cast (long rest resets feat_freecast_<slug>_used, short rest leaves it), Eldritch Knight spell slots (long rest resets spell_slots, short rest doesn't, Champion Fighter untouched), **TestInitiativeRest** (54 — `rest_type:"initiative"`: GM applies, player 403, non-member 403, cross-campaign filter, unknown rest_type 422; Ever-Ready Shot regains 1 only when the pool is EMPTY, never exceeds it, level-gated, other subclass/class untouched; it is not a rest — Second Wind/Action Surge/HP/spell slots left alone; Battle Master Relentless in BOTH editions incl. **the Martial Adept 7th die** (6 spent is not empty for that character — the case a flat pool size would get wrong); Bard Superior Inspiration with the pool following CHA (empty at CHA 18, not at CHA 20, minimum of one); Monk Perfect Self regaining **4**; Perfect Focus's `floor` shape (tops up to PB, no-op at or above it, **never reduces** a fuller pool, 2024-only, level-gated); Uncanny Metabolism's `opt_in` shape (does nothing unchosen, regains PB when chosen, never overfills, refuses once its charge is spent, doesn't burn the charge on a full pool, charge returns on a long rest, applies only to the character who chose); the initiative-options endpoint (lists an available opt-in, marks a spent one unavailable, omits characters with no choice, level-gated, player 403, cross-campaign filter, empty id list); Samurai Fighting Spirit (resets on a long rest, survives a short one, other subclasses untouched) + Tireless Spirit; and one call applying all of them across a party) (121 tests)
├── test_encyclopedia.py            # bestiary + spells + 6 item types (parametrized); TestSpellFields: ritual/concentration/higher_level defaults, round-trips, survive update, appear in list; TestSpellEdition (10): edition defaults to 5e, round-trips in detail + list, same name in BOTH editions is two rows, duplicate name in the same edition rejected, ?edition returns that edition's text, a 5e query never returns a 5.5e-only spell, **2024 falls back to 5e text when no 5.5e row exists**, a 5.5e row shadows (not duplicates) the 5e fallback, campaign override shadows system within an edition, campaign override beats a 5e fallback row (138 tests total)
├── test_encounters.py              # GM combat/initiative tool: TestCreateEncounter (6 — create, create-with-combatants, dedupe, player 403, non-member 403, cross-campaign character 404), TestListAndGetEncounter (6 — list + combatant_count, campaign scoping, player 403 on list AND on get, 404s), TestUpdateAndDeleteEncounter (5 — rename, player 403, delete, player 403, cascade leaves the character), TestCombatants (9 — add + denormalised name/class/level, player 403, duplicate 400, cross-campaign 404, set/clear initiative, player 403, remove, player 403), TestInitiativeOrder (4 — highest first, unrolled sink last, name tie-break, negatives above unrolled), TestEncounterListFieldRoundTrip (3) = 33 tests
├── test_locations.py               # locations, maps, pins, location NPCs, hierarchy, pin→parent persistence (61 tests)
├── test_loot_tables.py             # loot tables (system/campaign ownership)
├── test_npcs.py                    # NPC CRUD, visibility, gm_notes stripping, image, relationships, player-relationships, last_known_location, TestNPCMusic (GM upload, player 403, delete clears url) (39 tests)
├── test_session_notes.py           # session CRUD (10), list (4), visibility (2), gm_notes (3), fields (2), list-field round-trip (3), filters (?npc_id/?location_id/?event_id) (3), NPC links (5), location links (3), event links (3), character links (4), TestSessionMusic (GM upload, player 403, delete clears url) (3) = 45 tests
└── test_races_backgrounds_feats.py # admin-only compendium (parametrized) + TestFeatEdition (edition defaults to 5e, round-trips in detail + list, ?edition filter, no-filter returns all, update edition) (6) + TestFeatEffects (effects default to null, round-trip in detail + list, survive update) (4)
```

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
Co-locate test files next to the source file they test:
```
frontend/src/
├── auth/
│   ├── AuthContext.jsx
│   ├── AuthContext.test.jsx          # context state, setUser exposure, logout + selectedCampaign clearing (6 tests)
│   └── pages/
│       ├── Login.jsx
│       └── Login.test.jsx            # login flow, setUser call, navigation, error states (8 tests)
├── campaigns/
│   └── pages/
│       ├── CampaignSelection.jsx
│       ├── CampaignSelection.test.jsx  # load list, empty state, enter (role=gm/player), navigate to dashboard, create modal (submit+close+reload), logout (11 tests)
│       ├── CampaignMembers.jsx         # Member list (GM + players), invite flow (search → select → add), remove player; GM-only controls ✅
│       └── CampaignMembers.test.jsx    # load/render, GM badge, empty players, invite panel, search+dropdown, filter existing members, select enables Add, addPlayer+reload, addPlayer error, removePlayer+reload, GM not removable, load error (12 tests)
├── characters/
│   └── pages/
│       ├── CharacterList.jsx
│       ├── CharacterList.test.jsx    # loading, fetch with campaignId, error, empty state, card render, click-to-navigate, GM title+visibility toggles+reload, player title+no toggles; rest buttons (show, disabled/enabled on selection, checkboxes, select all, dialog opens for short/long, character names shown, confirms short/long rest calls applyRest, cancel no-op); rest buttons hidden for players + GM player-view; long-rest summary lists a feat spell free cast (Magic Initiate → "Mage Armor (feat free cast)"); long-rest summary lists "All spell slots" for an Eldritch Knight Fighter; both rest summaries list "Arcane Shot" for an Arcane Archer (30 tests)
│       ├── CharacterCreate.jsx
│       ├── CharacterCreate.test.jsx  # class picker (13 classes including Artificer), class overview step (advances on class select, back returns to class picker, classService.getClassByName called with edition, shows API data), advances to identity step, step indicator, race cards (9 PHB races), bg cards (13 PHB), race card expands detail, bg card expands detail + deselect, bg sets form value, custom race input, Next disabled when name empty, Next enabled after name, alignment toggle (identity step), back nav (identity→class_overview, features→identity), API races replace hardcoded when returned, advances to features step, identity summary on step 4, error on failure, correct payload + navigate, Wizard/Fighter/Barbarian/Cleric/Warlock fields, no Level field, level:1 in payload, hp_rolls auto-calculated (CON-independent roll base), HP/AC hidden, point buy starts at 8, bg skills flow to class sheet (legend + extra amber buttons), custom instrument button, OptionCardPicker: Fighter fighting style cards show descriptions, clicking selects value in payload, Cleric/Warlock subclass cards show descriptions, subclass info button visible + clicking opens SubclassOverview dialog with flavor text; subrace picker (shows for Dwarf/Elf, hidden for Human, Next blocked without selection, detail panel, clears on race change, ASIs applied to scores, CON bonus raises effective HP (dynamic), stores subrace/race_traits/race_languages in character_data, racial-asi-preview in step 4); skill gate: details-next stays disabled until required class skill count chosen; step 5 overview advance (advanceToReview helper, Create Character on step 5); race choices (Dragonborn draconic ancestry picker + Next-blocking + payload, Half-Elf ASI+skill versatility picker + Next-blocking + payload, Human extra language picker + non-blocking + payload); background choices (Criminal/Noble/Soldier gaming set picker, Entertainer/Outlander instrument picker, Guild Artisan/Folk Hero artisan's tools picker, Acolyte/Sage language pickers + payload); Monk tool/instrument picker in step 4; race-granted skills (Elf shows Perception+Keen Senses in race-skill-grants card, Half-Orc shows Intimidation+Menacing, Human has no race-skill-grants card, Elf shows emerald legend in Fighter sheet, Half-Orc Intimidation appears as extra emerald button on Wizard, race skill in payload skill_proficiencies, step 5 review shows Race-Granted skills); Variant Human (Standard/Variant choice shown, Variant unlocks ASI/skill/feat pickers with edition-filtered feat options, Next blocked until 2 ASI + skill + feat chosen, payload applies +1-to-two & stores feat in character_data.feats + skill in proficiencies, switching back to Standard clears picks & restores +1-to-all); Variant Human feat prerequisites (spellcasting feat locked in the picker for a non-caster (cannot be selected) + selectable for a caster, armor feat locked when class lacks the proficiency, ability-score prereq does NOT lock at Identity, ability-score prereq blocks Features → Review + note with highest score, Variant +1s folded into the ability check); review page shows the chosen feat name + description (+ prerequisite when present, `review-variant-human-feat-desc`) PLUS a **Feat Choices** block (`review-feat-choices`) listing everything picked as part of the feat — skills/expertise/tools/languages/weapons/maneuvers — and a separate `review-feat-spells` row for spell-grant feats (Magic Initiate cantrips+spell, Fey/Shadow Touched, Ritual Caster book), so no feat choice is lost at review; starting currency (review shows 0 gp with no background, Charlatan background → 15 gp in review-starting-gold + character_data.currency seeded in payload — both in `equipment` mode, passing through the Equipment step); Starting equipment step (shows class (a)/(b) options in `equipment` mode, payload includes resolved inventory with Chain Mail, `none` mode skips the step + zeroes gold/inventory, `equipment_or_gold` take-gold adds class wealth + drops class gear). review lists the resolved starting equipment + wallet (review-equipment shows "Wallet:" + items incl. Chain Mail). Default mock campaign is `starting_equipment:'none'` so the existing flow tests skip the Equipment step; advanceToReview passes through it when present; selectClass waits on the name input (not the step-count string); Variant Human half-feat (Tavern Brawler) prompts an ability choice (`human-feat-ability-{stat}`) that blocks Next and folds +1 into the final scores + stores `choices.ability` on the feat; Variant Human count-choice feat (Linguist) prompts language picks (`human-feat-prof-opt-language-{name}`) that block Next until N chosen + store feat_languages; Variant Human Tough feat folds +2 into the review's effective Starting HP but stores the CON-independent roll base only in hp_rolls (display-only); Variant Human Skill Expert grants a skill then offers Expertise from the proficient pool (variant + granted skill) + stores expertise_skills; Hill Dwarf stores the roll base in hp_rolls (10) with CON (+1) and the +1 Dwarven Toughness shown only as the review's effective HP (12); Variant Human spell-grant feat (Magic Initiate) shows the FeatSpellGrantPicker + blocks Next until filled + stores choices.spell_grant on the feat no-double-dip (a feat-granted skill — Skilled/Skill Expert — is merged into the class skill picker's `grantedSkillsForPicker` so it shows non-clickable + can't be re-picked as a class skill; the feat proficiency picker is also given a `featProfCharacterData` so it excludes skills/tools/languages already chosen from race/background/class — no reverse double-dip), feat choices surfaced at review (Magic Initiate spells → `review-feat-spells`, Skill Expert skill → `review-feat-choices`); redundant half-feats locked in the picker (Fighter → Weapon Master "all weapon proficiencies" + Heavily Armored "already proficient with heavy armor"; Heavily Armored stays selectable for a Barbarian — has medium, not heavy); Resilient offers only abilities whose save the class lacks (Variant Human Fighter → no STR/CON option); Variant Human maneuver-grant feat (Martial Adept) shows the FeatManeuverPicker + blocks Next until 2 maneuvers chosen + surfaces them at review (`review-feat-choices`) + stores choices.maneuvers on the feat; Variant Human + Alert folds the feat's +5 into the review-page Initiative (`review-initiative` +7 with a `review-initiative-feat-note`) (132 tests)
│       ├── CharacterDetail.jsx
│       └── CharacterDetail.test.jsx  # loading, error, name+class display, ability scores (waitFor), prof bonus, editable owner fields, GM Notes hidden (player), GM Notes shown (GM), Player View toggle, switching view hides GM Notes, updateCharacter with gm_notes, visibility toggle (GM), Fighter features, read-only non-owner; Leveling card — milestone (GM Level Up button, calls updateCharacter, owner sees pending banner), experience (XP label, GM Add XP input, add XP calls updateCharacter, threshold triggers level_up_pending); subrace and racial data (subrace badge read-only, subrace label editable, racial traits+languages from character_data, no traits section when absent); max HP read-only (value from hp_max key, not an input); speed fields (3 labels present, base speed not an input, total speed = sum, correct totals when speed+bonus set); tab structure (Narrative+Stats+Features+Items+Action Economy triggers always present, Spells tab absent for Fighter, Spells tab shown for Wizard/Artificer/Tiefling/High Elf/Forest Gnome, 5 tabs non-caster / 6 tabs caster); level is read-only (not in any input, shown in header); class features link out (L5 Fighter's features section has no `class-features-toggle` dropdown and no earned-feature prose — a `class-encyclopedia-link` to `/campaigns/1/encyclopedia/classes/Fighter` instead, with the level-gated mechanised "Extra Attacks" block still rendered); subclass locking (GM view: set subclass shows locked text + flavor text + earned features + no info buttons; no subclass at unlock level shows picker); Hit Dice Tracker (Hit Dice label, die type d10, remaining/total count, pre-populated count; GM interactive: minus disabled at 0, + updates count + enables Save, + then Save calls updateCharacter with hit_dice_used); Narrative tab — Personal Notes (owner sees, GM sees, non-owner player hidden), Backstory+Public Notes headings; Related NPCs card (empty state, toggle visible for owner, hidden for non-owner, shows NPC name, createCharacterNpc call, removeCharacterNpc call); Timeline Events card (empty state, toggle visible for owner, hidden for non-owner, shows event title, Unknown date, createTimelineEvent call, removeTimelineEvent call); race-granted skills on SkillsDisplay (Elf with Keen Senses shows emerald legend, Half-Orc with Menacing shows emerald legend, Human shows no emerald legend, Perception not double-counted when in both arrays); skills legend says "Gold = proficient" (not Blue); SkillsDisplay legend (hides "Purple = expertise" when no expertise, shows it for Rogue with expertise, shows "Amber = from background" for Soldier's Athletics, hides it when no proficient skill comes from the background, shows "Blue = from feat" for a Skilled-feat skill + hides it when no feat granted a proficient skill, shows "Teal = ½ prof (Remarkable Athlete)" for a 5e Champion Fighter L7 + hides it below L7, 2024 Champion L3 gets Athletics+Initiative advantage tags + "Teal = advantage" legend not the ½-PB one + hidden below L3); languages grouped by source (From Race / From Background labels, background language deduped against race, From Race hidden when only background langs present); Racial Features card (shown for Half-Orc with Relentless Endurance, hidden when no rest-gated traits, owner expending a use auto-saves immediately via updateCharacter with relentless_endurance_used — no Save click); Draconic Bloodline Sorcerer (Max HP folds in the bonus → shows 57 with "+5 Draconic Resilience" note and no separate Bonus/Effective rows, 13+DEX AC surfaced in the Items-tab AC summary (not in Stats — no "Armor Class Options" anywhere), Draconic Ancestry "Red Dragon (Fire)" line; plain Fighter shows base 52 with no source note and no AC options); Wallet (Weapons & Armor tab — standard 4 coins no electrum by default, electrum shown when campaign currency_type=full, owner sees stored gp/sp in inputs, read-only for non-owner); Inventory/Items tab (renders inventory AC summary + category sub-tabs, renders a stored inventory item; tab trigger renamed "Weapons & Armor" → "Items"); Action Economy tab (trigger present, 5 tabs non-caster / 6 caster); Features tab Class Features / Feats sub-tab (toggle present, defaults to Class Features with FeatsSubTab hidden, clicking Feats shows FeatsSubTab with character feats, player owner canManage=false, GM canManage=true — FeatsSubTab mocked); feat effects — initiative (Alert +5 + note), passive scores (Observant +5 to passive Perception AND passive Investigation, each with a source note; all three passives render), speed (hand-written Barbarian shows the central `speed-feat-note` annotation; data-driven Fighter folds Mobile +10 into Total Speed and suppresses the annotation; none when no feat), armor Str-requirement speed penalty (hand-written Barbarian + equipped Chain Mail + STR 11 shows the central `speed-armor-note`; data-driven Fighter folds the −10 into Total Speed (20) + `total-speed-armor-note` and suppresses the annotation; none when STR meets the requirement), Resilient save proficiency (chosen ability → save bonus incl. PB), feat-granted languages ("From Feats" group), PB-scaled initiative (2024 Alert +PB); Spells tab source sub-tabs (Fighter + Magic Initiate → Spells tab + "Spells from Feats" + feat-freecast tracker; Wizard + Magic Initiate → spell-source-class + spell-source-feats buttons); Spells tab links to the spacing mechanics page (`spacing-learn-more-spells`); Relentless Endurance note by the HP section (`relentless-endurance-note` shown for a Half-Orc, absent without the trait); Survivor note by the HP section (`survivor-note` shown for a L18 Champion with 5+CON regain, absent below L18/non-Champion); Inspiration card (`inspiration-card` defaults to 0, + button persists `character_data.inspiration` via updateCharacter, Heroic Warrior note `heroic-warrior-note` shown for a 2024 L10 Champion, absent for a 5e non-Champion); max HP derives from CON dynamically (hp_rolls model — roll base + CON×level shown as effective Max HP, a higher CON yields a higher Max HP from the same roll base); Stats sub-tabs (three toggle buttons render, defaults to Identity with abilities/HP content hidden, Abilities & Skills shows scores/saves/skills + hides identity fields, HP & Movement shows combat block + Jump card; `openStatsSubTab` helper clicks `stats-subtab-{tab}` — Stats-tab content tests must open the right sub-tab first); Relentless Endurance HP-adjacent placement (tracker in the HP & Movement sub-tab — between Max HP and Hit Dice for the data-driven Fighter via afterHpNode, below the combat block for a hand-written Barbarian; no Racial Features card on Identity when it's the only rest resource; Dragonborn Breath Weapon stays on Identity); armor non-proficiency (Wizard in Chain Mail: Spells-tab `spells-armor-warning` can't-cast banner + absent when nothing non-proficient worn, `saves-armor-warning` + `skill-armor-dis-{Athletics,Acrobatics}` tags on the Abilities sub-tab with no tag on Arcana, all absent for a proficient Fighter); Eldritch Knight Spells tab (shown for an EK Fighter, absent for a Champion Fighter); Player View hides GM slot steppers (EK slot tracker shows `slot-dec-1` in GM view, gone after toggling Player View — isGm gated on !playerView); mocks @/components/ui/tabs, react-markdown, settingsService, FeatsSubTab; Arcane Archer subclass cantrip (a granted `subclass_cantrips` entry gives the non-caster Fighter the Spells tab + a `subclass-cantrips` card naming the subclass, absent before the cantrip is picked); weapon + ammunition stocking is GM-only (the owning player sees no add/delete/± controls but keeps Use Ammunition; the GM sees them all and Player View takes them away); leveled racial spells (a L4 Tiefling's Racial source shows Hellish Rebuke under its Lvl 2 tab with the long-rest Use control ON that row — no separate tracker card — and NOT the L5 Darkness, the Cantrips tab shows Thaumaturgy alone with no Use control, L5 adds Darkness, and a leveled grant alone — Drow Magic's Faerie Fire — gives a non-caster the Spells tab) (182 tests)
├── npcs/
│   └── pages/
│       ├── NPCDetail.jsx
│       ├── NPCDetail.test.jsx        # render smoke test, SelectItem regression, error state, GM vs player visibility, Timeline Events card (GM empty/events/hidden badge, player hide/show), Sessions card (GM empty/sessions/hidden badge, player hide/show), Timeline Events link/create/remove (GM toggle, create new flow, unlink, player view guards) (23 tests)
│       ├── NPCList.jsx
│       └── NPCList.test.jsx          # render, search (includes summary), location filter (unplaced + hierarchy subtree), sort, GM vs player view (10 tests)
├── locations/
│   └── pages/
│       ├── LocationList.jsx
│       ├── LocationList.test.jsx     # campaignId prop regression (tree/card navigate), GM toolbar show/hide/navigate (5 tests)
│       └── LocationDetail.test.jsx  # Timeline Events card (9 tests) + Sessions card (7 tests); GM always-visible/empty/events/dates/hidden, player preview (no card when empty, shows card when exists), fetch params; uses Tabs mock + player-view toggle via title button
├── sessions/
│   └── pages/
│       ├── SessionList.jsx
│       ├── SessionList.test.jsx      # loading, empty state, card render (number, date, era dates, Hidden badge), GM New Session button/create/navigate, eye toggle, delete dialog, player view (no controls) (14 tests)
│       ├── SessionDetail.jsx
│       └── SessionDetail.test.jsx   # loading/error, header (title/date/era/Hidden), GM vs player view (Details card, GM Notes, Upload Image, content), updateSession, link cards, SelectItem regression (null era_id), Timeline Events create new (toggle, pre-fill, createEvent+addEventLink, disabled state), NPCs create new (toggle, createNpc+addNpcLink, disabled), Locations create new (toggle, createLocation+addLocationLink, disabled) (27 tests)
├── dashboard/
│   ├── Dashboard.jsx
│   └── Dashboard.test.jsx            # loading spinner, 404 no-calendar (player/GM messages), date formatting (named month, Month N fallback), GM vs player gating, Player View toggle hides form, save date calls updateCalendar (9 tests)
├── timeline/
│   └── pages/
│       ├── TimelinePage.jsx
│       └── TimelinePage.test.jsx     # loading, no-calendar landing (GM/player), eras section (names/badges/GM controls), point-in-time events, span events (Span badge, end date label), unknown date section, GM actions (create/edit dialog, createEvent call), EndDateLabel (isSpan detection, era fallback, month name, Month N, end_day), Edit dialog pre-fills end date (regression: stale-server bug) (28 tests)
├── settings/
│   └── pages/
│       ├── CalendarTab.jsx
│       ├── CalendarTab.test.jsx      # 404→landing, GM vs player landing, setup form, management UI, use_weeks toggle, Month N placeholder, seasons, CalendarInfoPanel toggle (16 tests)
│       ├── TimelineTab.jsx
│       └── TimelineTab.test.jsx      # no-eras landing (era diagram, prose, setup form), eras-exist (list, badges, GM controls), events (title, era_dates, visibility), Unknown Date section (GM + player), linked NPC/location names (npc_name/location_name fields, clickable), Sessions section in expanded event (GM empty/sessions/hidden badge, player hide/show) (27 tests)
└── shared/
    └── components/
        ├── ProtectedRoute.jsx
        ├── ProtectedRoute.test.jsx   # loading/null/authenticated cases (3 tests)
        ├── MusicPlayer.jsx
        ├── MusicPlayer.test.jsx      # parseYouTubeId/parseSpotifyEmbed/detectSource helpers + rendering per source type (audio/video/YouTube/Spotify/link) (18 tests)
        └── layout/
            ├── MainLayout.jsx
            └── MainLayout.test.jsx   # userRole healing: stale player→gm, correct unchanged, player for non-creator, null guards (5 tests)
```

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
`Login.test.jsx` — "calls setUser from AuthContext — not just localStorage" — guards against the bug where Login wrote to localStorage but never called `setUser`, leaving `AuthContext.user` null and causing `ProtectedRoute` to bounce the user back to `/login` immediately after a successful login.

`test_campaigns.py::TestListCampaigns::test_list_includes_created_by` — asserts `created_by` is present in the list response. Without it, the frontend cannot compute `userRole` and every user defaults to `'player'`, hiding all GM controls.

`MainLayout.test.jsx` — "calls enterCampaign with gm when created_by matches user.id but role is stored as player" — guards against stale `userRole` in localStorage surviving across sessions.

`NPCDetail.test.jsx` — "does not crash with null last_known_location_id" — guards against the Radix UI `<SelectItem value="">` crash that blanks the entire React tree in React 19. Also guards GM vs player visibility of the GM Notes card.

`TimelinePage.test.jsx` — "Edit dialog pre-fills end_year from span event" / "Edit dialog leaves end_year blank for point-in-time event" — guards against the stale uvicorn bug where the server silently drops `end_*` fields on INSERT because the ORM model was cached before the migration ran. The frontend form initialization is correct; the test ensures the full round-trip (event → API → state → form) preserves end date values. Also guards `isSpan` detection and `EndDateLabel` fallback logic.

`LocationList.test.jsx` — "clicking the top-level node navigates with the correct campaignId — not undefined" — guards against `LocationTreeNode` and `LocationCard` being module-level components that can't close over `useParams()`'s `campaignId`. Without the prop fix, all tree/card clicks navigate to `/campaigns/undefined/locations/X`.

`NPCList.test.jsx` — "filters by summary text" — guards against search only checking name/race/occupation and missing the summary field. "location filter includes NPCs at child locations" — guards the hierarchy-aware subtree walk that must follow both `parent_location_id` and `pin_child_ids`.

`CharacterDetail.test.jsx` — "shows ability score values" uses `waitFor` + `getByDisplayValue` — guards against the `showEditable` logic not rendering the input until data loads. `getAllByText('+3')` instead of `getByText` — guards against the ambiguity between proficiency bonus and STR modifier both rendering "+3" at level 5. "level is not rendered as an editable input" — guards against level reverting to an editable `<Input>` and letting players manually change it; uses `queryByDisplayValue('5')` (no ability score equals 5 in BASE_CHARACTER) to assert level is a read-only div. "does NOT show Spells tab for non-spellcasting Fighter" + "shows Spells tab for Wizard/Tiefling/High Elf/Forest Gnome" — guards the `hasSpells` detection logic and `computeRaceGrantedCantrips()` helper.

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
# worklists in "What's NOT Built Yet"). Frontend class-coverage runs inside `npm test`
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
```

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
