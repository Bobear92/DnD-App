# D&D RPG Application — Project Context

## Post-Turn Requirements (ENFORCE AFTER EVERY CODE CHANGE)

After every turn that modifies `.jsx` or `.py` files, complete ALL of these before finishing:

1. **Tests** — Run `npm test` in `frontend/`. All tests must pass. The Stop hook **blocks** if tests fail — you cannot end the turn until they pass.
2. **CLAUDE.md audit** — Update schema, endpoints, UI behaviours, test file listing (with count), and "What's NOT Built Yet" as needed.
3. **Agents audit** — Check `.claude/agents/` for stale references to patterns you changed.
4. **Backend restart** — If any `.py` file changed, kill python* and start `uvicorn main:app --reload` yourself. Never ask the user to restart.

The Stop hook runs after every turn and blocks completion if `npm test` reports failures.

### Multi-file changes — plan first
When a change touches **3 or more files**, state a brief plan before editing:
- Which files change and what specifically changes in each
- Which tests will be written or updated
- What CLAUDE.md sections need updating

Post the checklist, then proceed. This prevents wrong-approach detours.

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
│   │       └── session_notes/   # Session notes + 4 junction tables + image upload — routes/service/models/schemas/storage
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

## Current Database Schema (39 Tables)

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
  created_by (FK→users), created_at, updated_at

campaign_members
  id, campaign_id (FK→campaigns), user_id (FK→users),
  role ('gm' or 'player'), joined_at
  UNIQUE(campaign_id, user_id)

characters
  id, name, race, char_class, level, background, alignment,
  strength, dexterity, constitution, intelligence, wisdom, charisma,
  character_data (JSONB),   ← class-specific flexible data (HP, spell slots, features, skill profs, etc.)
                             ←   currency ({cp, sp, ep, gp, pp} integers): the character's coin purse/wallet; seeded at creation from the chosen background's starting gold (BACKGROUND_STARTING_GOLD); editable in the CharacterDetail Weapons & Armor tab; coins shown depend on campaign.currency_type
                             ←   prepared_locked (boolean): prepare-casters only; true = player committed today's spell prep; GM can unlock via "Unlock (Long Rest)"
                             ←   draconic_bloodline ({name, damage}): Sorcerer Draconic Bloodline (5e)/Draconic Sorcery (2024) chosen dragon type; drives the Stats tab Draconic Ancestry line + the Stats Max HP value (folds in +1/Sorcerer level via MaxHpValue, with the source noted) + AcOptionsLine 13+DEX under the AC field. Separate from the Dragonborn race's draconic_ancestry.
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
  repeatable (boolean), source, owner_type (ENUM), owner_id, created_at, updated_at
  Seeded via seed_feats.py: 41 PHB-2014 feats (edition "5e") + 73 PHB-2024 feats (edition "5.5e",
    Origin/General/Fighting Style/Epic Boon). Idempotent (skips existing by name+edition+owner_type=system).

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

loot_tables
  id, name, description, owner_type (string: 'system'/'campaign'),
  owner_id, loot_items (JSONB), created_at, updated_at

-- Encyclopedia (system-owned; campaign overrides use same tables with owner_type='campaign')
spells
  id, name, level, school, casting_time, range, components (Text),
  duration, description, higher_level (Text, nullable),
  ritual (boolean, default false), concentration (boolean, default false),
  classes, owner_type (ENUM), owner_id, created_at, updated_at
  Seeded: 319 5e spells via seed_spells.py (D&D 5e API). The API is SRD-only and does NOT tag
    any spell with Artificer, so seed_artificer_spells.py appends "Artificer" to the `classes` field
    of the 59 Artificer-list spells present in the SRD (levels 1-5; uses SRD names like "Faithful Hound",
    "Arcane Hand"). 15 non-SRD Artificer spells (Absorb Elements, Catapult, etc.) are not in the
    compendium and are skipped. Idempotent; seed_spells.py's update path never touches `classes` so the
    tags survive re-seeding.

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
    magic_items from /api/magic-items; potions + food_drink are curated in-script (SRD API doesn't expose
    them cleanly). Idempotent (skips existing by name + owner_type=system). Counts after seed: weapons 37,
    armor 13, adventuring_gear 116, magic_items 362, potions 40, food_drink 8. (A one-time cleanup removed
    59 corrupt magic-weapon/armor duplicate rows — empty category + mojibake fields — that already existed
    in magic_items and were 500-ing the weapons/armor list endpoints.)
```

**Note:** Encyclopedia tables (spells, creatures, items) currently have `UNIQUE` constraints on `name`
and no `owner_type` column in the DB. These need migrations to support campaign overrides — tracked
in "What's NOT Built Yet."

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
Campaign PUT accepts all settings fields: `use_alignment`, `ability_score_method`, `allow_reroll_ones`, `leveling_type`, `currency_type`. `currency_type` ("standard" | "full") is in `CampaignResponse` + `CampaignListItem` so it reaches the frontend CampaignContext.

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
| POST | /api/characters/campaign/{id}/rest | Yes (GM of campaign); body: `{ rest_type: "short"\|"long", character_ids: int[] }`; returns `RestResponse` with per-character change summaries. Also resets racial rest resources (from `_RACIAL_REST_RESOURCES`, level-gated) and clears Divination Wizard `portent_rolls` on a long rest |

### Races / Backgrounds / Feats (same pattern each)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /races | Yes |
| GET | /races/{id} | Yes |
| POST | /races | Yes (admin for system; GM for campaign-scoped) |
| PUT | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
| DELETE | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
*(Replace `/races` with `/backgrounds` or `/feats` for those modules)*

`/feats` GET also accepts `?edition=5e|5.5e` (filters feats by edition) and `?campaign_id=N`. `FeatCreate`/`FeatUpdate`/`FeatResponse`/`FeatListItem` all carry `edition` (default "5e"); `FeatListItem` also exposes `prerequisites` + `source` so the encyclopedia detail view needs no extra fetch. Seeded by `seed_feats.py`.

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

```
frontend/src/
├── App.jsx                      # Router: providers (AuthProvider, CampaignProvider) + all routes
├── index.css                    # Tailwind import + shadcn CSS variables (light/dark)
├── lib/
│   └── utils.js                 # cn() helper for class merging
├── components/
│   └── ui/                      # shadcn/ui components: Button, Card, Dialog, Input, Label,
│                                #   Badge, Textarea, Select, Tabs (do not edit)
├── auth/
│   ├── pages/Login.jsx          # Login + Register (dual-mode toggle) ✅
│   ├── AuthContext.jsx          # Calls /api/auth/me on load; exposes {user, loading, logout}
│   └── authService.js
├── campaigns/
│   ├── pages/CampaignSelection.jsx  # List campaigns, create modal, enter → sets CampaignContext ✅
│   ├── pages/CampaignMembers.jsx    # Member list + invite (search → select → add) + remove; GM-only controls ✅
│   ├── pages/CampaignSettingsPage.jsx # /settings route — General tab (edition, alignment, ability score method, leveling, currency coin-types) + Members tab ✅
│   ├── pages/CampaignSettingsPage.test.jsx # currency setting: GM sees currency-type-select, player sees read-only "CP, SP, GP, PP" / "CP, SP, EP, GP, PP" (3 tests)
│   ├── CampaignContext.jsx      # {campaign, enterCampaign, leaveCampaign}; persisted to localStorage
│   └── campaignService.js       # getAllCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign,
│                                #   addPlayer(campaignId, userId), removePlayer(campaignId, userId),
│                                #   searchUsers(q) → GET /api/auth/users/search
├── characters/
│   ├── characterService.js      # API client: CRUD, toggleVisibility, deleteCharacter, uploadImage, deleteImage, uploadMusic, deleteMusic, getTimelineEvents, createTimelineEvent, removeTimelineEvent, getCharacterNpcs, createCharacterNpc, removeCharacterNpc, applyRest(campaignId, restType, characterIds); exports mapCharacterImageUrl(path)
│   ├── referenceService.js      # Fetches races + backgrounds from API for CharacterCreate identity step; falls back to hardcoded lists when API returns empty
│   ├── components/
│   │   ├── BarbarianSheet.jsx   # Barbarian (5e): rage tracker, unarmored defense, reckless attack, Primal Path ✅
│   │   ├── BardSheet.jsx        # Bard (5e): full caster, bardic inspiration die (LR until L5), expertise, College ✅
│   │   ├── ClericSheet.jsx      # Cleric (5e): full caster, channel divinity (LR), Divine Domain at L1; Spells tab: "Prepared" sub-tab (CD tracker + slots + cantrips + read-only prepared list) + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │   ├── DruidSheet.jsx       # Druid (5e): full caster, wild shape tracker, Druid Circle at L2; Spells tab: "Prepared" sub-tab + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │   │  (Fighter 5e + Wizard 5e are now data-driven — rendered by classSheet/ClassSheet.jsx bound to a config; the old FighterSheet.jsx/WizardSheet.jsx files were deleted in the Epic 0 spike. components/index.js re-exports them as FighterSheet/WizardSheet.)
│   │   ├── MonkSheet.jsx        # Monk (5e): ki point tracker, martial arts die, unarmored defense ✅
│   │   ├── PaladinSheet.jsx     # Paladin (5e): half-caster starting L2, lay on hands, sacred oath; Spells tab: "Prepared" sub-tab (slots + cantrips + read-only list) + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │   ├── RangerSheet.jsx      # Ranger (5e): half-caster starting L1, favored enemy/terrain, Archetype ✅
│   │   ├── RogueSheet.jsx       # Rogue (5e): sneak attack, expertise picker (all 18 skills), roguish archetype; skill proficiency picker restricted to 11 Rogue skills (Acrobatics, Athletics, Deception, Insight, Intimidation, Investigation, Perception, Performance, Persuasion, Sleight of Hand, Stealth) ✅
│   │   ├── SorcererSheet.jsx    # Sorcerer (5e): full caster (KNOWN caster — picks fixed spells), sorcery points tracker in Spells tab (L2+, converts to/from slots), metamagic, Sorcerous Origin L1; creation shows curated SpellPickerCreation toggles (4 cantrips + 2 L1 spells, race-granted cantrips in violet) instead of static text; Draconic Bloodline subclass renders a `DraconicAncestorPicker` in the Features section (stores `character_data.draconic_bloodline = {name, damage}`; chosen at character creation and locked to a read-only badge once set outside creation — `readOnly={readOnly || (!creation && !!data.draconic_bloodline)}`, same lock pattern as the subclass picker); Draconic Resilience HP is folded into the Stats tab Max HP value (`MaxHpValue` via the sheet's `maxHpNode` slot) and its AC option shows under the AC field (`AcOptionsLine` via `acExtra`) ✅
│   │   ├── WarlockSheet.jsx     # Warlock (5e): pact magic (short-rest slots), invocations L2+, Patron L1 ✅
│   │   ├── ArtificerSheet.jsx   # Artificer (5e only): half-caster from L1, infusion tracker (Known/Active), Flash of Genius (L7+, INT mod uses/LR), attunement slots display (L10/14/18), subclass L3 (Alchemist/Armorer/Artillerist/Battle Smith), Spell-Storing Item (L11+); Spells tab: "Prepared" sub-tab (slots + cantrips + read-only prepared list + Spell-Storing Item) + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │   ├── ClassSpellBrowser.jsx # Shared prepare-spell picker for Cleric/Druid/Paladin/Ranger/Artificer (5e + 2024); lazy-loads spells via encyclopediaService, filters by class name and level ≤ maxSpellLevel, groups by level alphabetically; lock/unlock UI (player "Prepare for Today" button, GM "Unlock (Long Rest)" button); exports maxCastableLevel(slots) helper ✅
│   │   ├── HitDiceTracker.jsx   # Shared hit-dice widget: shows die type × total always; when !creation shows remaining/total count. Two modes: **heal mode** (when `onHeal` passed — the data-driven Fighter/Wizard CombatBlock) shows a "Use" button (data-testid hit-dice-use-btn) opening a Spend-Hit-Dice dialog (notice that expended dice return only on a long rest, quantity stepper 1..remaining via "More/Fewer Hit Dice", hit-dice-roll-btn rolls qty×d{hitDie}+conMod each floored at 0, applies onHeal({hit_dice_used, current_hp}) capped at maxHp, then shows roll breakdown + "+N HP regained" + "HP: x → y" in hit-dice-result; CharacterDetail wires onHeal=autoSaveClassPatch so the heal persists immediately + passes effectiveMaxHp incl. HP bonuses); **legacy mode** (no onHeal — the 22 hand-written sheets) keeps the +/− stepper passing new hit_dice_used integer via onChange(v). readOnly/creation hide controls in both modes ✅
│   │   ├── classSheet/          # Data-driven class sheet (Epic 0 spike — Fighter + Wizard, both editions). One ClassSheet.jsx + per-class config + shared hooks replaces the 4 hand-written Fighter/Wizard sheets. Same prop contract as the legacy sheets plus a `gmEdit` prop (GM Edit toggle). The other 22 classes still use their own sheets.
│   │   │   ├── ClassSheet.jsx       # Universal renderer: composes CombatBlock, locked choices (fighting style), RestResourceTracker, notes, subclass, Portent, CasterSpellBlock, features list, ASI, skill picker — all gated by config + `section`. Reuses OptionCardPicker/SubclassPickerWithDetail/SubclassDetails/PortentTracker.
│   │   │   ├── CombatBlock.jsx       # Shared HP/HitDice/AC/Speed region (maxHpNode/acExtra slots)
│   │   │   ├── CasterSpellBlock.jsx  # Creation spell pickers + Prepared/Prepare sub-tabs + Arcane Recovery + spellbook chips + lock/unlock (uses useSlotCaster); converged single prepare UI for both Wizard editions
│   │   │   ├── RestResourceTracker.jsx # Use-button + confirm ("won't come back until a short/long rest") + − recover for rest-rechargeable features (Second Wind/Action Surge/Indomitable/Memorize Spell); data-testid rest-resource-{key}, rest-use-confirm-button
│   │   │   ├── SkillProficiencyPicker.jsx / SpellPickerCreation.jsx # creation pickers lifted from the old sheets (amber bg / emerald race / violet race-cantrip)
│   │   │   ├── hooks/{useLockedChoice,useSlotCaster,useRestResource}.js # useLockedChoice: locked = readOnly || (!creation && !gmEdit && hasValue). useSlotCaster: availableSlots/setSlotUsed/handleCastSpell (slots reset only by GM rest). useRestResource: resolves config restResources → rows for the level.
│   │   │   └── configs/{fighter,wizard}.js + index.jsx # per-class+edition config objects; index.jsx exports getClassConfig(class,edition) + bound wrappers (FighterSheet5e/2024, WizardSheet5e/2024) consumed via the two components index files
│   │   ├── PortentTracker.jsx   # Divination Wizard subclass feature (5e "School of Divination" L2 / 2024 "Diviner" L3): "Roll Portent" rolls 2 d20s (3 at L14 Greater Portent), each saved die is a clickable chip you expend individually; long rest clears via backend; renders null for non-Divination subclasses; rendered in both WizardSheet Features sections under the subclass panel; stores character_data.portent_rolls = [{value,used}]; exports isDivination(subclass) + portentDiceCount(level) ✅
│   │   ├── RacialResourceTracker.jsx # Use-counter widget for rest-rechargeable racial traits; renders null when no applicable resources; reads/writes <key>_used counters in character_data; each resource has a "Use" button (opens a confirmation dialog stating when it recharges — "available again after a short or long rest" / "after a long rest" — and only expends on Confirm) + a "−" recover button; both hidden when readOnly; optional `includeKeys`/`excludeKeys` props filter which resource keys render so one resource can live in a different tab; Breath Weapon (`breath_weapon_used`) renders in the CharacterDetail "Weapons & Armor" tab (an actual attack), all other racials (Relentless Endurance, Drow Magic, Infernal Legacy) in the Stats tab "Racial Features" card ✅
│   │   ├── racialRestResources.js # RACIAL_REST_RESOURCES table (trait → {key, max, recharge: short|long, minLevel, label, note}) + getRacialRestResources(traits, level) helper; covers Breath Weapon (Dragonborn, short), Relentless Endurance (Half-Orc, long), Drow Magic (faerie fire L3/darkness L5, long), Infernal Legacy (hellish rebuke L3/darkness L5, long); mirrored in backend _compute_rest_patch ✅
│   │   ├── combatBonuses.js     # Cross-cutting HP/AC bonus helpers: getHpBonuses({charClass, subclass, raceTraits, level}) (Draconic Resilience +1/Sorcerer level for Draconic Bloodline/Draconic Sorcery; Hill Dwarf Dwarven Toughness +1/level), totalHpBonus, getAcOptions({charClass, subclass, scores}) (Barbarian 10+DEX+CON, Monk 10+DEX+WIS, Draconic Resilience 13+DEX), isDraconicSorcerer; add a new source here and it appears in every sheet's inline HP/AC rows — no per-sheet edits ✅
│   │   ├── currencyData.js     # Currency model: COINS (cp/sp/ep/gp/pp with gpValue + color), CURRENCY_MODES (standard=pp/gp/sp/cp, full=+ep), coinsForMode(mode), EMPTY_WALLET, totalInGp(currency), formatGp(n); BACKGROUND_STARTING_GOLD (13 PHB backgrounds → starting gp) + startingGoldForBackground(name) + startingWallet(bg) ✅
│   │   ├── WalletCard.jsx       # Character coin purse: coin inputs (per `mode` = campaign.currency_type) + computed total-in-gp readout; readOnly shows static values; onChange fires the full updated wallet; data-testid wallet-card / wallet-coin-{key} / wallet-total. Rendered in CharacterDetail Weapons & Armor tab ✅
│   │   ├── WalletCard.test.jsx  # standard 4 coins (no ep) / full 5 coins, default standard, editable input for owner, readOnly static values, onChange full wallet, clamps negatives, total in gp; currencyData helpers (totalInGp, formatGp, startingGoldForBackground) (11 tests)
│   │   ├── CombatBonusInline.jsx # Exports MaxHpValue (the Max HP cell's value — shows EFFECTIVE max HP = stored hp_max + passive bonuses with a small "+N Source" note, so the Max HP field reads the real number; falls back to plain hp_max / "—" when no bonus; never mutates hp_max) and AcOptionsLine (renders under the AC field — non-armor AC formulas; null when none). All 25 sheets accept `maxHpNode`/`acExtra` render slots (default null): the Max HP cell renders `{maxHpNode ?? (data.hp_max ?? '—')}` and `{showCombat && acExtra}` sits after the AC field; CharacterDetail builds both and passes them only to the stats-section sheet, so the bonus is folded into the value it modifies (not a separate card/row). Filename differs from combatBonuses.js by more than case (Windows self-import safety) ✅
│   │   ├── draconicData.js      # DRACONIC_ANCESTRIES (10 dragon types → {name, damage}) + draconicLabel({name,damage}) → "Red Dragon (Fire)"; subclass-version of draconic ancestry, stored separately from the Dragonborn race's draconic_ancestry ✅
│   │   ├── DraconicAncestorPicker.jsx # Dragon Ancestor picker for Sorcerer Draconic Bloodline (5e)/Draconic Sorcery (2024); stores {name, damage} in character_data.draconic_bloodline; readOnly renders a badge (or "No dragon type chosen"); data-testid draconic-bloodline-{Name} per button, draconic-bloodline-badge on the locked badge ✅
│   │   ├── TraitBadge.jsx       # TraitBadgeList component: renders racial trait names as clickable badges; click a badge to toggle a description panel below the list (one at a time); traits without a known description render as plain non-interactive badges; used in CharacterCreate (race card, subrace card, step 5 review) and CharacterDetail ✅
│   │   ├── raceTraitsData.js    # RACE_TRAIT_DESCRIPTIONS map: ~37 PHB racial trait names → full description strings; covers all traits in RACES_5E (Dragonborn, Dwarf/subraces, Elf/subraces, Gnome/subraces, Half-Elf, Half-Orc, Halfling/subraces, Human, Tiefling) ✅
│   │   ├── raceProficienciesData.js # Maps racial traits → granted proficiencies; TRAIT_SKILL_GRANTS (Keen Senses → Perception, Menacing → Intimidation), plus TRAIT_WEAPON_GRANTS / TRAIT_ARMOR_GRANTS / TRAIT_TOOL_GRANTS documented for future UI; helpers: getRaceGrantedSkills(race, subrace), getRaceGrantedSkillsFromTraits(traits[]), getRaceSkillSources(race, subrace) → [{skill, trait}] ✅
│   │   ├── OptionCardPicker.jsx # Reusable card-based picker: each option shows name + 1-line description; replaces plain <select> for fighting styles, subclasses, pact boons; accepts optional `onDetailClick` prop that adds an Info button per card; clicking the already-selected card deselects it (`onChange('')`) so the user can clear a choice and compare other options ✅
│   │   ├── FeatPicker.jsx       # Reusable feat selection control: trigger button (`{prefix}-select`) opens a searchable Dialog listing every feat with full description + amber prerequisite (browse/compare before choosing); clicking a feat (`{prefix}-option-{id}`) selects it via onChange({id,name}); chosen feat's description stays visible below the trigger (`{prefix}-detail`); used by CharacterCreate Variant Human (testIdPrefix "human-feat"); replaces the old bare <select> ✅
│   │   ├── featPrerequisites.js # Reusable feat-prerequisite parser/checker: parsePrerequisite(text) → ability/spell/armor/level requirement objects (fail-open on unrecognized text); checkFeatPrerequisite(feat, ctx) → {met, unmet:[{kind, dependsOn:'ability'|'class'|'level', reason}]}; null ctx fields skip that bucket (not knowable yet). Drives Variant Human feat gating in CharacterCreate ✅
│   │   ├── SubclassPickerWithDetail.jsx # Drop-in for subclass OptionCardPicker: bundles OptionCardPicker + Dialog + SubclassOverview; used in all 24 class sheets for the subclass selection section ✅
│   │   ├── SubclassOverview.jsx # Read-only subclass detail panel: colored header bar with subclass name + "Subclass of ClassName" + edition badges, flavor text, level-by-level features with level circle dividers; feature items are collapsible — click feature name to expand/collapse description; `data-testid="feature-toggle-{name}"` on each toggle button; used inside a Dialog from SubclassPickerWithDetail and ClassOverview ✅
│   │   ├── SubclassDetails.jsx  # Inline subclass panel shown in Features tab once subclass is locked: renders subclass name, flavor text, and all features earned at ≤ current level; feature items are collapsible — click feature name to expand/collapse description; `data-testid="feature-toggle-{name}"` on each toggle button; falls back to plain name when subclass data not found ✅
│   │   ├── classChoicesData.js  # All {value, description} arrays for fighting styles (5e + 2024), subclasses (all 13 classes: 12 × 2 editions + Artificer 5e only), pact boons; also exports SUBCLASS_UNLOCK_LEVEL_5E/2024 (class→level maps) and SUBCLASS_OPTIONS_5E/2024 (class→option arrays) used by LevelUpWizard; Artificer: unlock L3, 4 subclasses ✅
│   │   ├── subclassData/        # Per-class subclass flavor text + features: barbarian.js bard.js cleric.js druid.js fighter.js monk.js paladin.js ranger.js rogue.js sorcerer.js warlock.js wizard.js + artificer.js (5e only: Alchemist/Armorer/Artillerist/Battle Smith); combined by index.js into SUBCLASS_DATA[className][edition][subclassName] ✅
│   │   ├── index.js             # Exports all 13 5e sheets + SUPPORTED_CLASSES_5E + CLASS_DESCRIPTIONS/HIT_DICE
│   │   └── 5e2024/
│   │       ├── BarbarianSheet.jsx # Barbarian (2024): weapon mastery, primal knowledge, updated features; creation gate shows only L1 features ✅
│   │       ├── BardSheet.jsx      # Bard (2024): bardic inspiration short-rest from L1; creation gate shows only L1 features ✅
│   │       ├── ClericSheet.jsx    # Cleric (2024): divine order L1, subclass L3, channel divinity short-rest; Spells tab: "Prepared" sub-tab (CD tracker + slots + cantrips + read-only list) + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │       ├── DruidSheet.jsx     # Druid (2024): primal order L1, subclass L3, wild resurgence L5; Spells tab: "Prepared" sub-tab + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │       │  (Fighter 2024 + Wizard 2024 are data-driven via classSheet/ — old FighterSheet.jsx/WizardSheet.jsx deleted in Epic 0 spike; 5e2024/index.js re-exports them as FighterSheet/WizardSheet.)
│   │       ├── MonkSheet.jsx      # Monk (2024): focus points (renamed from ki), weapon mastery; creation gate shows only L1 features ✅
│   │       ├── PaladinSheet.jsx   # Paladin (2024): spell slots from L1, weapon mastery; Spells tab: "Prepared" sub-tab (slots + cantrips + read-only list) + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │       ├── RangerSheet.jsx    # Ranger (2024): weapon mastery, deft explorer; Spells tab: "Prepared" sub-tab (slots + read-only list) + "Prepare Spells" sub-tab (ClassSpellBrowser, level-filtered, lock/unlock) ✅
│   │       ├── RogueSheet.jsx     # Rogue (2024): weapon mastery, steady aim L3; skill proficiency picker restricted to 11 Rogue skills via ROGUE_ALLOWED; expertise picker keeps ALL_SKILLS; creation gate shows only L1 features ✅
│   │       ├── SorcererSheet.jsx  # Sorcerer (2024): innate sorcery L1, sorcery points tracker in Spells tab (L2+), subclass L3, sorcerous restoration L5; KNOWN caster — creation shows curated SpellPickerCreation toggles (4 cantrips + 2 L1 spells) instead of static text; creation gate shows only L1 features; Draconic Sorcery subclass renders a `DraconicAncestorPicker` in the Features section (stores `character_data.draconic_bloodline = {name, damage}`; chosen when the subclass is taken and locked to a read-only badge once set outside creation — `readOnly={readOnly || (!creation && !!data.draconic_bloodline)}`, same lock pattern as the subclass picker); Draconic Resilience HP is folded into the Stats tab Max HP value (`MaxHpValue` via the sheet's `maxHpNode` slot) and its AC option shows under the AC field (`AcOptionsLine` via `acExtra`) ✅
│   │       ├── WarlockSheet.jsx   # Warlock (2024): invocations L1, magical cunning L2, subclass L3, boon L5; creation gate shows only L1 features ✅
│   │       └── index.js           # Exports all 12 2024 sheets + SUPPORTED_CLASSES_2024 + metadata
│   │   ├── AbilityScoreAssignment.jsx # Three ability score methods: StandardSpreadAssignment, PointBuyAssignment, DiceRollAssignment ✅
│   │   ├── classFeatures5e.js   # HIT_DICE_5E + CLASS_FEATURES_5E: 13 classes × 20 levels (12 PHB + Artificer from TCoE), 2014 rules ✅
│   │   ├── classFeatures2024.js # HIT_DICE_2024 + CLASS_FEATURES_2024: all 12 classes × 20 levels, 2024 rules ✅
│   │   ├── classProgressionTables.js # CLASS_PROGRESSION export: full-caster/half-caster slot arrays + class-specific column definitions (Rages, Sneak Attack, Weapon Masteries, Pact Magic, Infusions, etc.) for 13 classes (12 × 2 editions + Artificer 5e only); Artificer columns: Cantrips Known, Infusions Known, Infused Items + half-caster slots from L1; profBonus(level) + ordinal(n) helpers ✅
│   │   ├── ClassOverview.jsx    # Read-only class detail panel: colored header bar, quick stats grid, flavor text, PHB-style progression table (class-specific columns + grouped spell slot headers), flat feature sections by level, clickable subclass cards at subclass-choosing level (clicking opens a SubclassOverview Dialog) ✅
│   │   ├── LevelUpWizard.jsx    # Dynamic-step modal: HP → (Subclass, if unlocking at this level) → Features → (New Spells, known casters only) → Confirm; subclass step only appears when leveling exactly to the class's unlock level and no subclass chosen yet; New Spells step appears for KNOWN casters (Bard/Sorcerer/Warlock via KNOWN_CASTERS set) — shows target cantrips/spells-known counts at the new level (read from CLASS_PROGRESSION columns) + SpellList free-add pickers for cantrips and known_spells; saves level, hp_max, subclass, and (known casters) cantrips/known_spells into character_data ✅
│   │   ├── LevelUpWizard.test.jsx # subclass step visibility (5e Wizard L1→2, Fighter L2→3, 2024 Fighter, non-unlock level, already has subclass); Next disabled until picked; onComplete includes subclass; confirm shows choice; no subclass key when no step; New Spells step (shown for known caster Sorcerer, hidden for prepared Wizard + non-caster Fighter, cantrip/spell pickers render, chosen cantrips/known_spells included in onComplete) (17 tests)
│   │   ├── SubclassOverview.test.jsx # renders subclass name/badges, flavor text, features by level, unavailable fallback, Barbarian/Cleric/Warlock/Wizard/Fighter subclasses; collapsible features (description hidden by default, click to expand/collapse, aria-expanded, independent per feature, Cleric description) (18 tests)
│   │   ├── TraitBadge.test.jsx  # renders trait names, description hidden by default, click to show, click again to hide, replaces description on new selection, no interaction for unknown traits, Dwarven Armor Training/Toughness/Fey Ancestry descriptions, role=button on clickable traits only (9 tests)
│   │   ├── raceProficienciesData.test.js # TRAIT_SKILL_GRANTS map (Keen Senses → Perception, Menacing → Intimidation); getRaceGrantedSkills (null inputs, base Elf, High Elf subrace inheritance, Half-Orc, Dwarf empty, Human empty, dedup, sorted); getRaceGrantedSkillsFromTraits (empty, Keen Senses, Menacing, non-granting trait); getRaceSkillSources (Elf, Half-Orc, empty, dedup) (31 tests)
│   │   ├── SorcererSheet.test.jsx # section routing: Sorcery Points tracker in spells (L2+), not in features; section isolation for HP/features/spells; Draconic Bloodline Dragon Ancestor picker (hidden for non-draconic + in stats section, shown in features for Draconic Bloodline, badge when readOnly, empty-state text, onChange {name,damage} on pick, null on deselect during creation, locks to a read-only badge after creation once chosen, stays editable during creation) (22 tests)
│   │   ├── combatBonuses.test.js # isDraconicSorcerer (5e/2024/other/non-Sorcerer/no-subclass); getHpBonuses (Draconic Resilience scaling, Dwarven Toughness, stacking, empty); getAcOptions (Barbarian 10+DEX+CON, Monk 10+DEX+WIS, Draconic 13+DEX, missing-score defaults, non-AC class empty) (16 tests)
│   │   ├── CombatBonusInline.test.jsx # MaxHpValue (plain base when no bonus, effective total + "+N Source" note for Draconic Resilience, Dwarven Toughness for any class, em dash when baseMaxHp missing); AcOptionsLine (null for non-AC class, Barbarian 10+DEX+CON, Draconic 13+DEX) (7 tests)
│   │   ├── ClassSpellBrowser.test.jsx # loading state, class filter, maxSpellLevel filter, getSpells call, onAdd/onRemove, lock banner, Prepare for Today, onLock/onUnlock, search, encyclopedia link, at-limit disabled, empty search; maxCastableLevel helper (18 tests)
│   │   ├── FeatPicker.test.jsx  # placeholder when unselected, dialog lists every feat + description, prerequisite shown, select passes {id,name}, selected name+detail below trigger, search filter, empty-search state (7 tests)
│   │   ├── featPrerequisites.test.js # parsePrerequisite (empty, single/either-or ability, 13+ shorthand, spell phrasings, armor prof/training, level not-as-ability, combined 2024, fail-open unknown); checkFeatPrerequisite (no prereq, ability met/unmet/either-or/skip-until-known, spell caster/non-caster/unknown, armor present/missing/unknown, level) (21 tests)
│   │   ├── WizardSheet.test.jsx # renders the data-driven ClassSheet bound to the wizard config (WizardSheet5e) — behavior tests, import swap only. prepared spells (limit, chips, toggle, at-limit, empty message, overflow, default limit); sub-tab navigation (tab buttons, defaults, switching); lock/unlock mechanics (banner, Prepare for Today, onLock, GM unlock, locked chips, GM no Prepare button); section routing stats/features/spells/all; Arcane Recovery (enabled/disabled/used/reset, opens confirm dialog before recovering — not immediate, Cancel no-op, Confirm recovers a slot + marks used, highest-value-first within ⌈level/2⌉ budget, disabled when only 6th+ slot expended); Cast button (shown, readOnly hidden, disabled at 0 slots, decrements slot); Portent (Divination subclass): not rendered for non-Divination, rendered in Features section, not in Spells section, rolls 2 d20s via onChange, expends a saved die (61 tests)
│   │   ├── SpellList.test.jsx # empty state, isCantrips mode (alpha sort, Cantrips heading, still fetches catalog for detail dialog, full cantrip details in dialog), level grouping (section-per-level, alpha sort, Other Spells, ordering, API call with campaignId), detail dialog (open, full details, Cantrip badge, level badge, fallback), add (input visibility, + button, Enter, duplicate guard, clear), remove (onRemove call, readOnly hides), custom placeholder, Cast button (shown with onCastSpell, hidden without, disabled at 0 slots, not on cantrips; opens confirm dialog before firing — does not call onCastSpell immediately, dialog states the slot level, calls onCastSpell only after Confirm, no call on Cancel) (35 tests)
│   │   ├── PortentTracker.test.jsx # isDivination + portentDiceCount helpers (2 vs 3 at L14); null for non-Divination; empty state + Roll button; rolls 2 d20s (mocked Math.random) saved via onChange; rolls 3 at L14; renders saved dice + expends on click; disabled expended die + all-used note; readOnly hides controls (10 tests)
│   │   ├── RacialResourceTracker.test.jsx # getRacialRestResources (none/Breath Weapon/Drow level-gating/Infernal); tracker null when no resources; Relentless Endurance render + used count; Use button opens confirm dialog (expends on confirm, no-op on cancel) / − recovers; confirm dialog recharge text (Breath Weapon short-or-long, Relentless Endurance long); Use disabled at 0 remaining; Breath Weapon short-or-long-rest label; includeKeys/excludeKeys filtering + null when filtered empty; readOnly hides buttons (18 tests)
│   │   ├── HitDiceTracker.test.jsx # legacy +/- mode (stepper renders, die/remaining, + onChange, hidden during creation); heal mode (Use button replaces +/-, disabled at 0 remaining, dialog opens with notice + qty 1, qty stepper clamps to remaining, roll calls onHeal with expended dice + healed HP + breakdown, caps at maxHp, multi-die roll, floors negative CON at 0, readOnly hides Use) (14 tests)
│   │   └── classSheet/ tests   # ClassSheet.test.jsx (Fighter via config: martial section isolation, extra attacks, fighting style + subclass lock with gmEdit unlock, Second Wind use-button + confirm, creation hides rest resources, readOnly hides buttons, 2024 weapon mastery/tactical mind — 13 tests); hooks/{useLockedChoice (5), useSlotCaster (3), useRestResource (4)}.test.js; configs/configs.test.js (getClassConfig routing, required fields, Fighter=martial/Wizard=full-caster, Fighter rest resources — 6 tests)
│   ├── classService.js          # API client: getClasses(edition, campaignId), getClassByName(name, edition, campaignId) → GET /api/classes ✅
│   └── pages/
│       ├── CharacterList.jsx    # List characters, visibility toggle (GM), player view toggle ✅
│       ├── CharacterCreate.jsx  # 5-step flow: Class → Overview → Identity → Features → Review; edition-aware; fetches class data from /api/classes for the overview step ✅
│       └── CharacterDetail.jsx  # Full character sheet: identity, ability scores, saves, skills, class features, GM notes; leveling card (XP bar, add XP, milestone LU); LevelUpWizard; edition-aware ✅
├── npcs/
│   ├── npcService.js            # Full API client: NPCs, relationships, player relationships, image upload, music upload (uploadMusic/deleteMusic)
│   └── pages/
│       ├── NPCList.jsx          # Campaign NPC grid + create dialog + visibility toggle + player view ✅
│       └── NPCDetail.jsx        # Portrait upload, section cards with Save/Reset, relationships tabs ✅
├── locations/
│   ├── locationService.js       # Full API client: locations, maps, pins, relationships, location NPCs
│   └── pages/
│       ├── LocationList.jsx     # Campaign locations grid + create dialog + player view toggle ✅
│       └── LocationDetail.jsx   # Maps tab (upload, zoom, pins, player view) + Info tab ✅
├── sessions/
│   ├── sessionService.js        # Full API client: sessions CRUD, visibility, image upload, music upload (uploadMusic/deleteMusic), 4 link CRUD sets
│   └── pages/
│       ├── SessionList.jsx      # Session cards grid + create dialog + eye/delete controls + player view ✅
│       └── SessionDetail.jsx    # Markdown editor + image upload at cursor + metadata card + GM Notes + 4 LinkCards ✅
├── encyclopedia/
│   ├── featService.js              # Axios feat API client (baseURL http://localhost:8000, no /api prefix — feats mount at /feats): getFeats(campaignId, edition), getFeat(id), createFeat, updateFeat, deleteFeat
│   ├── itemService.js              # Generic axios item client (baseURL http://localhost:8000/api): getItems(category, campaignId), getItem(category, id), createItem(category, data), updateItem, deleteItem — `category` = REST slug ('weapons'|'armor'|'adventuring-gear'|'potions'|'magic-items'|'food-drink'); one client for all 6 item categories
│   ├── data/
│   │   ├── skillsData.js            # Static data for all 18 5e skills: name, ability (3-letter code), flavor, description, examples[]; exports SKILLS, SKILLS_BY_NAME, ABILITY_FULL, ABILITY_COLORS, abilityColor(ability) helper
│   │   └── itemCategories.js        # Per-category config driving the Items tab (one object × 6 categories): id (REST slug), label, singular, icon (lucide), accent, subtitle/badges (list row), filters (dropdowns from distinct values), stats (detail grid), bodyKey (long-prose field), fields (edit form: text|textarea|select|number|checkbox), empty (blank template). Exports ITEM_CATEGORIES, ITEM_CATEGORY_MAP, getItemCategory(id). The generic ItemsTab/CampaignItemsTab/ItemEditPage are all driven by this — adding/adjusting a category is a data change here, not new components. itemCategories.test.js: config integrity (6 categories, field/empty/required coverage, getters don't throw, getItemCategory lookup) (6 tests)
│   └── pages/
│       ├── EncyclopediaPage.jsx      # 5-tab layout: Classes (two-panel browser, edition toggle) | Skills (static skill browser) | Spells (search+school+level filters, GM override; GM gets "System Spells"/"Campaign Spells" sub-tabs inside the tab) | Items (6 category sub-tabs — Weapons/Armor/Gear/Potions/Magic Items/Food & Drink; each has a GM-only "System {cat}"/"Campaign {cat}" sub-tab; players see only the system list) | Feats (edition-aware, read-only browser); the edition toggle shows on the edition-aware tabs (Classes + Feats, via EDITION_AWARE_TABS), defaults to the campaign edition; GM + player ✅
│       ├── FeatsTab.jsx              # Read-only feat browser: search + feat list (Award icon, repeatable RefreshCw indicator, source badge) + detail dialog (prerequisite amber card + full description); fetches via featService.getFeats(campaignId, edition); driven by the encyclopedia edition toggle; GM + player
│       ├── FeatsTab.test.jsx         # loading state, getFeats called with campaignId+edition, renders feats, feat count, search filter, empty-search state, detail dialog (description), prerequisite shown in dialog, re-fetch on edition change, empty service result (10 tests)
│       ├── encyclopediaService.js   # Axios spell API client: getSpells(campaignId), getSpell(id), createSpell, updateSpell, deleteSpell
│       ├── EncyclopediaPage.test.jsx # header/Classes tab, empty state, all 13 classes (including Artificer), edition toggle defaults (5e/2024), classService call args, overview renders, empty state hides, edition switch re-fetches, player access, loading state; Spells tab renders, clicking tab shows SpellsTab, edition toggle hidden on Spells tab; Campaign Spells is no longer a top-level tab, System/Campaign sub-tabs render inside Spells for GM only, player sees no sub-tabs, clicking Campaign Spells sub-tab swaps for CampaignSpellsTab, Spells sub-tab defaults to System Spells; Skills tab renders, player access, click shows SkillsTab, edition toggle hidden on Skills tab; Feats tab renders, player access, click shows FeatsTab with campaignId+edition props, edition toggle stays visible on Feats tab, toggling passes 5.5e to FeatsTab; Items tab renders, player access, click shows ItemsTab (default weapons category, campaignId), edition toggle hidden on Items, all 6 category sub-tabs render, switching category updates ItemsTab, GM System/Campaign sub-tabs, player sees no sub-tabs, Campaign sub-tab swaps to CampaignItemsTab (38 tests)
│       ├── SkillsTab.jsx            # Two-pane browser: left sidebar with search input + ability filter pills (STR/DEX/CON/INT/WIS/CHA + All) + skill list; right detail panel with colored header bar (ability-tinted bg), flavor italic, "What it does" description, "Example checks" list, d20+ability modifier rule reminder; static client-side data — no API calls, no campaign/edition switching; accessible to GM + player; first skill auto-selected on mount
│       ├── SkillsTab.test.jsx       # all 18 skills render, default-selected first skill (Acrobatics), switches detail on click, flavor text shown, description shown, example checks shown, d20+modifier rule reminder, search filter + case-insensitive, ability filter (single, toggle-off, All reset), empty state when no match, combined search+ability filters, sidebar full ability names, data integrity (every skill has flavor/description/3+ examples), abilities covered (STR/DEX/INT/WIS/CHA — CON has none) (17 tests)
│       ├── SpellsTab.test.jsx # loading state, renders all spells, spell count, search filter, school filter, level filter, All Schools button, ritual indicator, campaign override label, empty state, detail dialog open, At Higher Levels shown/hidden, Override button GM/player gating, Edit Override for campaign spell, createSpell+navigate on Override click (18 tests)
│       ├── SpellsTab.jsx      # System spell browser: search/school/level filters, spell rows with ritual/concentration/school badges, campaign override "(Campaign)" label, spell detail dialog with all fields + At Higher Levels + GM Override/Edit buttons
│       ├── CampaignSpellsTab.test.jsx # loading, getSpells with campaignId, renders campaign spells, excludes system spells, Campaign badge, empty state, New Homebrew btn, New navigates, edit navigates, delete dialog, cancel no-op, confirm delete+reload, search filter, ritual label (14 tests)
│       ├── CampaignSpellsTab.jsx # GM-only list of campaign-scoped spells (overrides + homebrew); search; New Homebrew Spell → SpellEditPage; edit/delete per row; delete confirmation dialog
│       ├── SpellEditPage.test.jsx # new: title, no getSpell, empty form, Create Spell btn, no delete btn, createSpell+navigate, name-required error, API error handling; edit: loading, title, form populate, Save Changes btn, delete btn, updateSpell called, save disabled when clean, deleteSpell+navigate, confirm cancel, getSpell error; nav: back button, checkboxes render, checkbox toggle (22 tests)
│       ├── SpellEditPage.jsx  # Full-page create/edit form for campaign spells; fields: name, level, school, ritual/concentration, casting time, range, components, duration, description, higher_level, classes; Save/Delete; back to encyclopedia; route: /campaigns/:campaignId/encyclopedia/spells/:spellId (new or id)
│       ├── ItemsTab.jsx       # Generic system item browser (mirrors SpellsTab), driven by an itemCategories config: search + config-built filter dropdowns, list rows (accent bar + subtitle + badges), detail dialog (config stat grid + body prose), GM "Override for this Campaign" (copies all config fields → campaign copy → ItemEditPage) / "Edit this Override". One component serves all 6 categories
│       ├── ItemsTab.test.jsx  # loading, getItems(category,campaignId), renders items, count, name search, config dropdown filter, (Campaign) label, empty state, detail dialog, Override GM/player gating, Edit Override, createItem+navigate on Override (14 tests)
│       ├── CampaignItemsTab.jsx # Generic GM-only campaign item list (mirrors CampaignSpellsTab): filters owner_type='campaign', search, New Homebrew → ItemEditPage, per-row edit/delete, delete confirm dialog
│       ├── CampaignItemsTab.test.jsx # getItems(category,campaignId), campaign-only filter, empty state, New Homebrew nav, edit nav, search, delete dialog confirm/cancel (8 tests)
│       ├── ItemEditPage.jsx   # Generic create/edit form for campaign items; reads :category + :itemId; renders config.fields by type (text/textarea/select/number/checkbox), coerces numbers/booleans, validates required fields; Save/Delete; route: /campaigns/:campaignId/encyclopedia/items/:category/:itemId (new or id)
│       └── ItemEditPage.test.jsx # new (title, Create btn, no delete, no getItem, required-field block, create+navigate, armor number coercion); edit (load+populate, Save Changes, delete btn, save disabled when clean→dirty, updateItem, delete+navigate); unknown-category fallback (10 tests)
├── dashboard/
│   ├── Dashboard.jsx            # Current date display (loads calendar API) + GM date-set form ✅
│   └── Dashboard.test.jsx       # loading, 404 no-calendar, date formatting, GM/player gating, save date (9 tests) ✅
└── shared/
    └── components/
        ├── ProtectedRoute.jsx   # Redirects to /login if AuthContext user is null
        ├── ErrorBoundary.jsx    # Class component; wraps all routes in App.jsx; shows render error instead of blank page
        ├── MusicPlayer.jsx      # Shared inline music player; takes `src` (a pasted URL or an uploaded `uploads/...` path), auto-detects type, renders the right element: HTML5 <audio>/<video> for files, YouTube IFrame embed, Spotify embed (with Premium-required note), or a link fallback for unknown sources; exports detectSource/parseYouTubeId/parseSpotifyEmbed helpers; used in CharacterDetail, NPCDetail, SessionDetail
        ├── MusicPlayer.test.jsx # parseYouTubeId (youtu.be/watch/embed/shorts/null), parseSpotifyEmbed (track/playlist/locale/null), detectSource (empty/uploaded audio+video/direct file/YouTube/Spotify/link fallback), rendering (empty→nothing, audio, video, YouTube iframe src, Spotify iframe src + Premium note, link fallback) (18 tests)
        └── layout/
            ├── MainLayout.jsx   # Wraps pages with Sidebar + Header; reads from contexts
            ├── Header.jsx       # Campaign name (from CampaignContext) + user menu (from AuthContext)
            └── Sidebar.jsx      # Campaign-aware nav: uses useParams().campaignId for paths;
                                 #   GM vs player items from campaign.userRole; "Switch Campaign" link
```

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
| `/campaigns/:campaignId/encyclopedia` | EncyclopediaPage | ✅ Functional (Classes tab: edition toggle + class browser; Skills tab: 18 static 5e skills + ability filter; Spells tab: search/school/level filters + GM override; Spells tab contains GM-only sub-tabs — System Spells / Campaign Spells; Feats tab: edition-aware read-only feat browser) |
| `/campaigns/:campaignId/encyclopedia/spells/:spellId` | SpellEditPage | ✅ Functional (GM create/edit campaign spell; `new` creates homebrew) |
| `/campaigns/:campaignId/encyclopedia/items/:category/:itemId` | ItemEditPage | ✅ Functional (GM create/edit campaign item for any of the 6 categories; `new` creates homebrew) |

### Locations UI — Key Behaviours
- **Maps tab:** thumbnail strip (left) + scrollable map viewer (right) with zoom (+/−/scroll wheel) and dark background
- **Pins:** click to open tooltip (toggle), X to close; linked pins are blue and navigate to linked location
- **Pin dialog:** link to existing location OR create a new one inline
- **Player view toggle:** filters to `is_visible_to_players=true` locations/maps/pins/NPCs; auto-selects first visible map
- **Map upload:** 100 MB limit; client-side size validation with inline error before upload attempt
- Maps default to `is_visible_to_players=false` — GM must explicitly show each map to players
- **Info tab — GM view:** always editable; section cards for Details, GM Notes (private), Lore & Culture, Environment, Adventure, Hierarchy, Important NPCs; Save/Reset buttons per card
- **Info tab — Player view:** read-only; empty sections hidden entirely; GM Notes never shown; NPC cards only show NPCs where `is_visible_to_players=true` on the NPC
- **Important NPCs:** two sources merged in the NPC list response — `source="linked"` (manual `location_npcs` junction, has role description) and `source="last_seen"` (NPC's `last_known_location_id` points here, shows `last_seen_notes`). Deduped: if an NPC is both, `linked` wins. NPC cards show portrait thumbnail (left strip, 64px wide, if `image_path` exists), name, race, occupation, role/last_seen description, and NPC `summary`. Cards are clickable and navigate to `/campaigns/:campaignId/npcs/:npcId`. GM remove button uses `stopPropagation` so it doesn't trigger navigation.
- **Timeline Events card (Info tab):** loaded on page mount via `GET /timeline?location_id=N`; shown in both GM and player views; GM view always shows the card (empty state: "No timeline events linked") with visibility badges for hidden events; player view shows only when events exist (visible-only events); each row shows title + era dates (`year abbreviation` separated by `·`) or "Unknown date" italic; events are managed from the Campaign Time page
- **Sessions card (Info tab):** loaded on mount via `GET /sessions?location_id=N`; GM view always shows (empty state: "No session notes linked to this location.") with Hidden badges; player view shows only when sessions exist; each row shows session title + real_world_date + Hidden badge (GM); clickable → SessionDetail
- **Hierarchy card (GM only):** set top-level, set parent, mark as unknown; child list shows manually-set children (link icon) and pin-derived children (pin icon + "via map pin" label)
- **LocationList — GM view:** three sections — World Hierarchy tree (from top-level), Unsorted (staging area, locations not placed anywhere), Unknown Locations. When the top-level location has maps, a GM toolbar row appears above the map with an "Edit [name]" button that navigates to that location's `LocationDetail` page for full editing (info, maps, pins).
- **LocationList — Player view:** toggle Hierarchy / A–Z; search bar; Unknown Locations section at bottom of hierarchy view
- **Hierarchy tree:** indented expandable tree; click node to navigate; pin-derived children included automatically from `map_pins.linked_location_id`
- **Unsorted locations:** visible to GM only; any location with no parent, not top-level, not unknown, not pin-linked from any other location's map
- **`pin_child_ids`:** computed at query time in `get_locations` — for each location, the IDs of locations linked via pins on that location's maps
- **Pin → parent persistence:** when a GM creates or updates a pin with a `linked_location_id`, the service automatically sets the linked location's `parent_location_id` to the map's parent location — but only if the linked location has no parent yet, is not top-level, and is not unknown ("first pin wins"). This makes the hierarchy fully explicit in the DB.
- **Top-level map on LocationList:** if a top-level location has maps, the first map is displayed above the hierarchy tree as a read-only image preview (no pins); multiple maps show a tab strip; a GM toolbar above the map shows an "Edit [name]" button to navigate to LocationDetail for full editing; respects player view filter (only visible maps shown to players)

### NPCs UI — Key Behaviours
- **NPCList grid:** portrait thumbnail (placeholder icon when none), color-coded status badge (alive/dead/missing/unknown), race · occupation subtitle, summary text
- **GM controls on card:** eye toggle (visibility) + delete button overlaid on portrait; Player View preview toggle
- **Filters:** search bar (matches name, race, occupation, and summary text) + location dropdown + status dropdown + sort select
- **NPCList purpose:** acts as a searchable NPC database — designed for cross-cutting queries ("what blacksmiths have we found?", "who was that bandit we killed?") rather than geographic browsing (use Locations for that)
- **Location filter:** flat dropdown of all campaign locations; selecting a location shows NPCs whose `last_known_location_id` is anywhere in that location's subtree (walks `parent_location_id` + `pin_child_ids` recursively on the client); "Unplaced" option shows NPCs with no `last_known_location_id`
- **Sort options:** Name A–Z (default) | Name Z–A | Recently added (by id desc) | Status (alive → missing → unknown → dead)
- **Create dialog:** name (required), race, occupation, alignment, status select, summary, visible-to-players checkbox; navigates directly to NPCDetail on create
- **NPCDetail portrait:** click or drag-drop to upload (10 MB limit, client-side check); remove button; upload overlay while in progress
- **NPCDetail core fields:** name, status, race, occupation, alignment, visibility checkbox — inline editing in portrait row; per-section Save/Reset appear only when dirty
- **Info tab sections:** Physical (age, gender, height, weight, appearance) | Personality (voice, traits, ideals, bonds, flaws, languages as removable tags) | Narrative (summary, description, backstory — labeled "Player visible") | GM Notes (amber-tinted "Private" card, GM only) | Location & Media (last known location select, last-seen notes, theme music — paste-a-link input + "Upload audio" button via `musicInputRef`/`npcService.uploadMusic` + Remove + inline `<MusicPlayer>` that plays Spotify/YouTube/uploaded audio in-browser; the old quick-info grid "Listen" link was removed in favour of the player) | Combat Stats (freeform JSON textarea, GM only) | Timeline Events (loaded on mount via `GET /timeline?npc_id=N`)
- **Timeline Events card (Info tab — NPCDetail):** GM view always shows the card (with count) and a `+` toggle button in the header; clicking `+` shows an inline form with two modes — "Link existing" (select from all campaign events not already linked, optional description) and "Create new" (title required, description, era/year/month/day date fields, visible-to-players checkbox); each event row has a `×` unlink button (GM only); remove fetches the junction link ID via `getEventNpcs` then calls `removeEventNpc`; player view shows only when events exist and has no add/remove controls; event titles link to the Timeline page; data-testid `timeline-events-toggle` on `+` button, `unlink-event-{id}` on remove buttons
- **Sessions card (Info tab — NPCDetail):** loaded on mount via `GET /sessions?npc_id=N`; GM view always shows (empty state: "No session notes linked to this NPC.") with Hidden badges; player view shows only when sessions exist; each row shows `#N — Title` (or just title if no number) + real_world_date; clickable → SessionDetail
- **Player view:** all GM-only cards (GM Notes, Combat Stats, Player Relationships tab) hidden; all fields read-only; empty sections suppressed entirely; Timeline Events and Sessions cards hidden when no events/sessions
- **Relationships tab:** NPC-to-NPC list; related NPC name is a clickable link to their detail page; GM can add (select NPC + type + description) and delete
- **Player Relationships tab (GM only):** NPC-to-player list; populated from campaign members (players only); GM can add and delete
- **Language tags:** add via input + Enter or button, remove with × on each tag; stored as JSONB array
- **Last Known Location:** select from all campaign locations; in player view shows as a clickable link to that location's detail page
- **Portrait display note:** images are served via `app.mount("/uploads", StaticFiles(...))` in `main.py` — upload/delete/display are all functional

### Campaign Settings UI — Key Behaviours
- **Route:** `/campaigns/:campaignId/settings` — wrapped in `<MainLayout>`; GM-only editing controls; accessible to all members (read-only for players); "Campaign Settings" link (Settings icon) in GM section of Sidebar
- **General tab:** Campaign Identity section (name, description, edition select — 5e/5.5e), Roleplaying Options (alignment toggle — hides alignment from all character forms when off), Ability Score Assignment (method select: Standard Array / Point Buy / Dice Roll; conditional "Allow reroll 1s" toggle appears when Dice Roll chosen), Leveling section (Milestone / Experience XP select), Currency section (coin-types select — "Copper, Silver, Gold, Platinum" = `standard` vs "All five (adds Electrum)" = `full`; `data-testid="currency-type-select"`); Save/Reset buttons appear per section when dirty; players see read-only view of settings (currency shows "CP, SP, GP, PP" / "CP, SP, EP, GP, PP")
- **Members tab:** full member management (extracted from old /members page); GM section (crown icon, "You" badge); players list with invite/remove; invite search (≥2 chars, debounced); same `data-testid` attributes as CampaignMembers.jsx

### Calendar/Timeline Settings UI — Key Behaviours
- **Route:** `/campaigns/:campaignId/campaign-time` — wrapped in `<MainLayout>` in App.jsx (not internally); GM-only controls; "Campaign Time" link in GM section of Sidebar
- **Calendar tab:** landing page (explainer + defaults bullet list + "Set Up Calendar" button) when 404; management UI when calendar exists
  - **General card:** calendar name, days_per_month, `use_weeks` toggle (ToggleLeft/ToggleRight icon), `days_per_week` input (shown only when `use_weeks=true`); Save button appears when dirty
  - **Seasons card:** inline editable list (click name to rename), add via input+Enter/button, delete with confirmation; deletion nullifies month assignments in local state
  - **Months card:** one row per month — ordinal (read-only), optional name input (placeholder "Month N" when blank), season select; Save button appears per row when dirty; `monthLabel()` helper returns name or "Month N"
  - **Weekdays card:** only shown when `use_weeks=true`; same add/edit/delete pattern as seasons; shows order_index as prefix
  - **Current Date card:** GM only; era select (sentinel `__none__`), year (`type="text"` + `inputMode="numeric"`, commas allowed and stripped on save), month-ordinal select (showing `monthLabel()`), day inputs; saves via `PUT /calendar`
- **Timeline tab:** landing page (CSS era diagram + prose explanation + "Set Up Timeline" button) when no eras; full management UI when eras exist
  - **Era diagram:** renders styled divs showing `← [Before Era] 3·2·1 | 1·2·3·4 [Era] →` with "Year 1 meets Year 1 — no year zero" caption
  - **Eras card:** sorted list; each row shows name, year span (e.g. "Yr 1 – Yr 10,000" for ascending, "5,000 BBF – 1 BBF" for descending, "ancient – 1 BBF" when no defined oldest year), Primary/Current/direction/visibility badges
    - **Sort toggle** (GM only): ArrowUpDown button in card header switches between "Chronological" (by `era_start_absolute` ascending, null = −∞ / oldest possible) and "Manual" (custom order with up/down arrows per row); mode + order persisted to localStorage per campaign
    - **Edit dialog:** name, abbreviation, `is_current`, `is_visible_to_players`; for non-current eras also shows "Timeline stops at year" field (`era_oldest_year`) with comma-allowed numeric input; saves via `PUT /calendar/eras/{era_id}`
    - **Visibility eye toggle**; delete blocked with error message if primary era and others still exist
    - **Deleting an era:** backend nulls `absolute_year` on all linked timeline events via raw SQL before deleting the era; frontend optimistically moves those events to the Unknown Date section
  - **Add Era dialog:** two-mode selector at top — **Parallel Era** (single timeline, ascending or descending, anchor required for non-primary) and **Before/After Split** (guided setup for a BC/AD-style pair: user names both eras + picks the split point; dialog auto-creates both with correct anchor math); year inputs accept commas
    - First era is always ascending (direction locked); subsequent eras show mode cards
    - Anchor era + anchor year fields appear in Parallel mode for non-primary eras
  - **Timeline Events card:** sorted list (backend order); each row is collapsible — shows title, `EraDateList` (year + abbreviation for each era_date), visibility badge; expand reveals description + linked NPCs/locations with add/remove + GM Notes amber card
  - **`EraDateList`:** renders `{year} {abbreviation}` for each era_date, separated by `·`; when `era_dates` is empty renders Clock icon + "Unknown date" italic text
  - **Unknown Date section:** events with no `era_dates` (no era assigned, or era was deleted) appear below all dated events under a Clock-icon divider; GM can edit these events to assign them to an era
  - **GM Notes (timeline events):** amber-tinted "Private" card in the expanded EventDetail section; GM-only textarea with inline Save/Reset that appear when dirty; saves via `PUT /timeline/{event_id}` with `{ gm_notes }`. Stripped from all player-facing responses (list + detail). Never shown in player view.
  - **Event NPC/location links:** loaded on expand; GM sees add row (select + description + plus button); remove button per link; NPC and location names are clickable links that navigate to their detail pages (`/npcs/:id` and `/locations/:id`); backend returns flat `npc_name`/`location_name` fields (not nested objects)
  - **Sessions section (EventDetail):** loaded on expand via `GET /sessions?event_id=N`; read-only list of sessions linked to this event; GM view always shows (empty state: "No sessions linked.") with Hidden badges; player view shows only when sessions exist; session titles are clickable → SessionDetail; sessions are linked from the SessionDetail page (not from here)
  - **Player view:** Add Era / Add Event buttons hidden; visibility toggles hidden; sort toggle hidden; GM-only eras hidden from era list; Unknown Date section visible (shows events with empty era_dates that are `is_visible_to_players`)
  - **`settingsService.js`:** all calendar + timeline API methods; uses same axios pattern + token interceptor as npcService

### TimelinePage UI — Key Behaviours
- **Route:** `/campaigns/:campaignId/timeline` — standalone visual timeline page
- **Visual center-line layout:** events alternate left/right in a zigzag column; a vertical center line connects them; span events color the line segment between their start and all events they encompass
- **Event card:** shows `EraDateList` (start date), `EndDateLabel` (end date arrow label for span events), title, description snippet, Hidden/Span badges; GM sees Edit/visibility/delete controls
- **`isSpan` detection:** `end_absolute_year != null || end_year != null || end_day != null || end_month_order != null` — any non-null end field makes an event a span
- **Span badge:** shown on event card when `isSpan` is true; filled circle dot on center line (vs hollow for point-in-time)
- **`EndDateLabel`:** rendered only when `isSpan`; shows `end_year end_era.abbreviation month day` joined by spaces; falls back to start date fields when end fields are null — `effectiveEndEraId = end_era_id ?? era_id`, `effectiveEndYear = end_year ?? year`; uses `calendarMonths` (from `calendar.months`) for month name lookup by `order_index`; renders "Month N" when month has no name; renders "?" when all parts are empty (defensive, hard to trigger)
- **`EventFormDialog` (create + edit):** Start Date section (era, year, day) + End Date section (era, year, day) with label "leave blank for a point-in-time event"; both sections accept commas in year inputs; on edit, initializes `end_year`, `end_era_id`, `end_month_order`, `end_day` from event — null fields initialize to `''`/`'__none__'` not from start date fields
- **Eras section:** collapsible card; same content as TimelineTab (name, abbreviation, Primary/Current/direction/visibility badges, sort toggle, Add Era button); GM can edit/delete eras; changes refresh full calendar+events load
- **Unknown Date section:** events with `absolute_year === null` appear in a grid below the center-line; GM can edit these to assign an era
- **Player View toggle (GM):** hides GM controls, New Event button, sort toggle, Edit/delete buttons; filters to `is_visible_to_players` events and eras; shows "Showing player view" subtitle; toggle persists for session only
- **Expand:** clicking a card opens `ExpandedEventDetail` inline; loads NPC/location links and sessions; GM sees add/remove controls and GM Notes; player sees read-only links

### Sessions UI — Key Behaviours
- **SessionList grid:** session number badge, title, real-world date, era dates (from `era_dates` list), summary, Hidden badge (GM view); GM eye/delete controls on hover
- **Create dialog:** session_number (optional), real_world_date (date picker), title (required), summary, is_visible_to_players → navigates to SessionDetail on create
- **SessionDetail header:** session number + title, real-world date, in-world era dates, music URL link, eye toggle (GM)
- **Metadata card (GM only):** session_number, real_world_date, music_url (with "Upload audio" + Remove buttons via `musicInputRef`/`sessionService.uploadMusic`, 50 MB limit), music label, summary, is_visible_to_players — Save/Reset on dirty
- **Theme Music player:** an inline `<MusicPlayer>` renders below the header for GM + players whenever `music_url` is set (auto-detects Spotify/YouTube/uploaded audio, plays in-browser); replaces the old header "Listen" links
- **Content card:** Write/Preview toggle; Markdown textarea (with `ref` for cursor tracking) for GM; read-only ReactMarkdown for players; Image Upload button (GM) inserts `\n![](http://localhost:8000/{image_url})\n` at cursor
- **GM Notes card (GM only):** amber border/bg "Private" card with Save/Reset when dirty; always stripped from player responses
- **Linked content (bottom grid):** Characters Present | NPCs Featured | Locations Visited | Timeline Events — Characters use a generic `LinkCard` (link-only); NPCs use `NpcLinkCard`, Locations use `LocationLinkCard`, Timeline Events use `EventLinkCard` — all three support a "Link existing / Create new" mode toggle; read-only list for players; NPC/location names are `<Link>` components to their detail pages
- **NpcLinkCard (create mode):** name (required), race, occupation, status select (alive/dead/missing/unknown), summary, link description, visible-to-players checkbox; calls `npcService.createNpc` then `sessionService.addNpcLink`; new NPC added to `allNpcs` state. Toggle button has `data-testid="npcs-toggle"`.
- **LocationLinkCard (create mode):** name (required), location_type, link description, visible-to-players checkbox; calls `locationService.createLocation` then `sessionService.addLocationLink`; new location added to `allLocations` state. Toggle button has `data-testid="locations-toggle"`.
- **Timeline Events card (SessionDetail):** uses `EventLinkCard` with a "Link existing / Create new" mode toggle. "Link existing" = standard select flow; "Create new" = inline form (title required, link description optional, date fields pre-filled from session's era/year/month/day). On create, calls `settingsService.createEvent` then `sessionService.addEventLink`; newly created event defaults to `is_visible_to_players: false` and is added to `allEvents` state. The toggle button has `data-testid="timeline-events-toggle"` for tests.
- **Sessions listed in Sidebar** for both GM and player (`BookOpen` icon, "Session Notes" label)
- **`react-markdown`** is installed for Markdown rendering in content card
- **`mapSessionImageUrl(path)`** helper in `sessionService.js` → `http://localhost:8000/${path}`

### Members UI — Key Behaviours
- **Route:** `/campaigns/:campaignId/members` — wrapped in `<MainLayout>`; accessible to all campaign members; GM-only controls gated on `campaign?.userRole === 'gm'`
- **GM section:** top card showing the campaign's GM with a Crown icon and "You" badge for the current user
- **Players section:** list of all players with avatar initials, username, email, join date; player count badge in card header; empty state with invite prompt if GM
- **Remove button:** Trash icon per player row (GM only); disabled during removal; not shown for GM themselves; calls `removePlayer(campaignId, userId)` then reloads
- **Invite section (GM only):** search input with magnifier icon; `searchUsers(q)` fires on change when `q ≥ 2 chars` (debounced via useEffect cancel); dropdown appears below input listing matching users; existing members are filtered out of results; selecting a user fills the input and shows a confirmation line ("Ready to invite username (email)"); Add button enabled only after selection; calls `addPlayer(campaignId, userId)` then reloads members
- **`searchUsers(q)`:** calls `GET /api/auth/users/search?q=X` on the auth API; results include `{id, username, email}`; min 2 chars enforced client + server side; requester excluded server-side
- **`data-testid` attributes:** `invite-search` on the search input, `search-dropdown` on the results dropdown, `search-result-{id}` on each result row

### Characters UI — Key Behaviours
- **CharacterList grid:** class color-coded header bar, ability score modifiers grid, level/class badge, race subtitle; clickable cards navigate to CharacterDetail; GM eye toggle + trash button appear on hover
- **CharacterList — GM view:** title "All Characters"; sees all characters regardless of `is_visible_to_players`; Player View toggle (filters to visible-only, hides GM controls); visibility eye icon + delete dialog per card
- **CharacterList — player view:** title "My Characters"; sees own characters + `is_visible_to_players=true` characters; no eye/delete controls; "Create Your First Character" empty state button
- **CharacterList — Rest controls (GM only, hidden in Player View):** "Short Rest" and "Long Rest" buttons (`data-testid="short-rest-btn"`, `data-testid="long-rest-btn"`) appear in the top toolbar; both are disabled until at least one character is selected; "Select All / Deselect All" toggle button (`data-testid="select-all-btn"`); each character card shows a checkbox (`data-testid="char-checkbox-{id}"`) for selection; selected cards get a `ring-2 ring-primary` highlight; clicking a rest button opens a confirmation dialog showing the selected characters' names, class badges, levels, and a bullet list of what each rest resets (from `getRestSummary(cls, edition, level, restType)`); "Confirm" (`data-testid="confirm-rest-btn"`) calls `characterService.applyRest(campaignId, restType, [...selectedIds])` then reloads the character list; rest controls and checkboxes are hidden entirely for players and for GM in Player View mode
- **`getRestSummary(cls, edition, level, restType, characterData)`:** client-side helper (mirroring backend logic) that returns a `string[]` describing what resources reset; also lists applicable racial rest features (via `getRacialRestResources`) and Portent dice (Divination Wizard); used only to populate the pre-confirm dialog — the backend is the source of truth for what actually changes
- **CharacterCreate — edition switching:** `campaign.edition` drives which class sheets and metadata are used; `'5e'` → `components/` (5e rules); `'5.5e'` → `components/5e2024/` (2024 rules); class picker subtitle shows edition label
- **CharacterCreate — step 1 (class picker):** color-coded class cards showing class name, hit die, description; back chevron navigates to character list; all 12 classes available for both editions
- **CharacterCreate — step 2 (class overview):** `classService.getClassByName(cls, edition, campaignId)` is called immediately on class select; `ClassOverview` component renders: colored header bar with class name + edition badge + spellcaster badge, quick stats grid (hit die, primary ability, saving throws, armor, weapons, skills, tools), flavor text paragraphs, PHB-style progression table (Level / Prof Bonus / Features + class-specific columns with grouped spell slot headers), flat feature sections by level (level circle divider, feature name as `<h3>`, description as `<p>`), subclass cards at the subclass-choosing level (2-column grid, accent left border, name + 1-line description); feature names in the progression table are clickable buttons that smooth-scroll to the corresponding feature section via `featureId(level, name)` anchors; when API returns null, shows "Class details unavailable. You can still proceed."; "Back" returns to class picker; `data-testid="overview-next"` on "Continue to Identity" button
- **CharacterCreate — step 3 (identity):** Dedicated page for name (required, blocks "Next" when empty), race picker, background picker, alignment; `referenceService` fetches races + backgrounds from API on entry (`GET /races?campaign_id=X`, `GET /backgrounds?campaign_id=X`); falls back to hardcoded `RACES_5E` (9 common races) / `BACKGROUNDS_5E` (13 PHB backgrounds) when API returns empty; race cards show name, size, speed, ASI; clicking a card expands a detail panel with description + trait badges + languages badges; search bar filters race cards; custom race text input below the grid (clears card selection); **Subrace picker** — appears below the race detail panel when the selected race has subraces (Dwarf → Hill/Mountain, Elf → High/Wood/Dark Elf Drow, Gnome → Forest/Rock, Halfling → Lightfoot/Stout); each subrace card shows name + ASI + trait badges; clicking expands a detail panel; Next is blocked until a subrace is selected when subraces exist; `data-testid="subrace-section"` on picker container, `data-testid="subrace-card-{name}"` on each card; **Race Choices section** (`data-testid="race-choices-section"`) renders after the subrace section for races/subraces with additional choices: **Dragonborn** must pick Draconic Ancestry (10 dragon types, each card shows `data-testid="draconic-ancestry-{name}"`, damage type + breath shape; stored as `character_data.draconic_ancestry`; blocks Next until chosen); **High Elf subrace** must pick a Wizard cantrip (`data-testid="high-elf-cantrip-select"`, stored as `character_data.high_elf_cantrip`; blocks Next) and optionally an extra language (`data-testid="high-elf-language-select"`, added to `race_languages`); **Half-Elf** must pick 2 ability scores for +1 each (`data-testid="half-elf-asi-{stat}"`, max 2; included in `combinedRaceAsi`; blocks Next) and 2 skill proficiencies (`data-testid="half-elf-skill-{slug}"`, max 2; merged into `skill_proficiencies`; blocks Next); switching race or subrace clears all race choices; background cards show name, skill badges, feature name; clicking expands description + skills + tools + equipment; click again to deselect; **Background Choices section** (`data-testid="bg-choices-section"`) appears after BgDetail when the background has choices — tool type select (`data-testid="bg-tool-choice-select"`) for Criminal/Entertainer/Folk Hero/Guild Artisan/Noble/Outlander/Soldier; language selects (`data-testid="bg-language-{i}-select"`) for Acolyte (2) / Hermit (1) / Sage (2); all background choices non-blocking; switching background clears choices; stored as `background_tool_choice` and `background_languages`; alignment select hidden when `campaign.use_alignment === false`; `data-testid="identity-next"` on Next button, `data-testid="identity-back"` on Back button (back returns to class overview, not class picker)
- **CharacterCreate — step 4 (class features):** Proficiencies card + Ability Scores section + Class Features sheet + Personal Notes + "Next: Review" button (`data-testid="details-next"`); shows identity summary bar at top with "Edit" link back to step 3 (includes subrace name when selected); Ability Scores renders based on `campaign.ability_score_method`; racial ASI preview box (`data-testid="racial-asi-preview"`) shows combined base+subrace ASI bonuses; **"Next: Review" is disabled until BOTH ability scores are complete AND the required number of class skill proficiencies are chosen** — `CLASS_SKILL_REQUIRED` map defines per-class count (Bard/Ranger=3, Rogue=4, all others=2); hint text "Select N more skills to continue." appears when scores are done but skills aren't
- **CharacterCreate — race-granted cantrips:** `raceGrantedCantrips` array computed from `raceChoices.high_elf_cantrip` + hardcoded maps (`SUBRACE_GRANTED_CANTRIPS`: Forest Gnome → Minor Illusion, Drow → Dancing Lights; `RACE_GRANTED_CANTRIPS_MAP`: Tiefling → Thaumaturgy). Passed to `ClassSheet` in steps 4 and 5 as `raceGrantedCantrips` prop. Sheets with a creation-mode cantrip picker (Wizard 5e/2024, Bard 5e, Warlock 5e/2024) show race-granted cantrips in violet, non-clickable, not counting toward the class pick limit; legend "Violet = already granted by your race or subrace" appears when any race cantrip is present. Step 5 Race Details section shows all race-granted cantrips as violet badges under "Race-Granted Cantrips".
- **CharacterCreate — step 5 (overview/review):** Character Summary card (name, class, race/subrace, background, alignment) + **Race Details section** (full race description, subrace description when selected, ASI badges from combined base+subrace + Half-Elf chosen stats, size, speed, all racial traits as secondary badges, languages including High Elf chosen language as outline badges; Draconic Ancestry row shown when chosen; Race-Granted Cantrips row shown for High Elf/Forest Gnome/Tiefling/Drow; Skill Versatility badges shown for Half-Elf) + **Background Details section** (full background description, feature name, skill proficiency badges, tool proficiencies text, "Chosen Tool" when a tool type was selected, "Chosen Languages" badges when background language choices were made, starting equipment text) + Ability Scores grid (6 stat boxes with final values, modifiers, and racial bonus annotation — Half-Elf +1s shown as racial bonuses) + Starting Stats row (HP, Prof Bonus, Initiative, Passive Perception, Speed, **Starting Gold** — `review-starting-gold`, derived from the chosen background via `startingGoldForBackground`) + Proficiencies card (shows class-chosen + background-granted skills merged) + Class Features in `readOnly={true} creation={true}` mode (shows only level 1 features for all 12 classes in both editions) + Personal Notes (only if entered); "Edit Identity" and "Edit Features" links jump back to the relevant step; "Create Character" calls `handleSubmit` — `hp_max` auto-calculated as `hitDie + (CON + racial CON bonus) modifier` (min 1); racial ASIs applied to scores at submit (includes Half-Elf chosen stats); `character_data` extended with `currency` (`{cp,sp,ep,gp,pp}` — gp seeded from the background's starting gold), `subrace`, `race_traits`, `race_languages` (includes High Elf extra language), `draconic_ancestry` (object: `{ name, damage, breath }`), `high_elf_cantrip`, `background_tool_choice`, `background_languages`; `character_data.skill_proficiencies` includes class-chosen + background-granted + Half-Elf Skill Versatility picks merged (via `Set` deduplication); navigates to CharacterDetail on success
- **CharacterCreate — background skill highlighting:** background skills flow from `selectedBgObj.skills` to class sheet via `backgroundSkills` prop; (1) skills in the background that ARE in the class's allowed list appear amber and non-clickable; (2) skills NOT in the class's allowed list appear as extra amber disabled buttons after the class list; legend "Amber = already granted by your background" appears whenever `backgroundSkills.length > 0`; `backgroundSkills` is NOT passed to Expertise pickers (Bard/Rogue)
- **CharacterCreate — race skill highlighting:** race skills derived from `getRaceGrantedSkills(race, subrace)` (Elf base "Keen Senses" → Perception, inherited by High Elf/Wood Elf/Drow; Half-Orc "Menacing" → Intimidation) flow to class sheet via `raceSkills` prop; (1) skills in the class's allowed list appear **emerald** and non-clickable; (2) skills NOT in the allowed list appear as extra emerald disabled buttons after the background ones; legend "Emerald = already granted by your race" appears whenever `raceSkills.length > 0`; race skills are merged into final `character_data.skill_proficiencies` at submit via the same `Set` dedup that handles background skills. Step 3 surfaces a green "Skill Proficiencies from Race" card (`data-testid="race-skill-grants"`) below the race detail panel showing each grant as `"Perception (from Keen Senses)"`. Step 5 review section shows the same as a "Skill Proficiencies (from Race)" badge row (`data-testid="review-race-skill-grants"`). Half-Elf's "Skill Versatility" remains a player-pick (NOT auto-granted via Keen Senses pattern) — that flow is separate.
- **CharacterDetail — race/background-granted skills on skill panel:** `SkillsDisplay` computes `raceGranted = getRaceGrantedSkillsFromTraits(character_data.race_traits)` and unions it with stored `skill_proficiencies`, so existing characters (whose stored array may not include race grants) still show Perception/Intimidation proficient. It also computes `bgGranted = getBackgroundSkills(identityDraft.background)` (from `backgroundSkillsData.js` — 13 PHB backgrounds → skills) limited to skills the character is actually proficient in, so background-sourced proficiencies are identifiable by background name (works for existing characters too). Indicator colors by source: expertise = **purple**, background = **amber** (`bg-amber-500`), race = **emerald** (`bg-emerald-500`), other class proficiency = `bg-primary` (gold, `#d4af37`); when a skill is both background and race, background (amber) wins. The legend is built conditionally from `legendParts`: `"Purple = expertise"` only when the character has ≥1 expertise skill, `"Gold = proficient"` always, `"Amber = from background"` only when a proficient skill comes from the background, `"Emerald = from race"` only when race grants apply — joined by ` · `. (The legend says "Gold" because the proficient swatch is `bg-primary` = gold, not blue.)
- **CharacterCreate — Race Choices section** (`data-testid="race-choices-section"`): rendered in step 3 for races/subraces with additional choices beyond ASIs: **Dragonborn** picks Draconic Ancestry (10 dragon types shown as cards with `data-testid="draconic-ancestry-{Name}"`, each shows damage type + breath shape; blocks Next until chosen; stored as `character_data.draconic_ancestry: { name, damage, breath }`); **High Elf subrace** picks a Wizard cantrip (`data-testid="high-elf-cantrip-select"`, blocks Next, stored as `character_data.high_elf_cantrip`) and optionally an extra language (`data-testid="high-elf-language-select"`, added to `race_languages`); **Half-Elf** picks 2 ability scores for +1 each (`data-testid="half-elf-asi-{stat}"`, max 2; blocks Next until 2 chosen; included in `combinedRaceAsi`), 2 skill proficiencies (`data-testid="half-elf-skill-{slug}"`, max 2; blocks Next until 2 chosen; merged into `skill_proficiencies`), and an extra language (`data-testid="half-elf-language-select"`, optional; added to `race_languages`); the Half-Elf skill picker flags background-granted skills amber (un-picked ones disabled so you can't waste a slot); **Human** first picks a type — Standard vs Variant (`data-testid="human-type-standard"` / `human-type-variant`; default Standard). **Standard Human** keeps the +1-to-all `asiBonus`. **Variant Human** REPLACES the +1-to-all with: +1 to two chosen scores (`data-testid="human-variant-asi-{stat}"`, max 2 — via `isVariantHuman`/`humanVariantAsi` folded into `combinedRaceAsi`, base asiBonus nulled), one skill proficiency (`data-testid="human-variant-skill-{slug}"`, single-select; background skills flagged amber + disabled; merged into `skill_proficiencies` + passed to the class sheet as race-granted so it can't be re-picked), and one feat from the edition-filtered list (picked via the `FeatPicker` component — `data-testid="human-feat-select"` trigger button opens a searchable dialog listing every feat with its full description + prerequisite so the player can browse/compare before choosing; options from `featService.getFeats(campaignId, edition)` fetched in the identity `useEffect` → `apiFeats`; stored as `character_data.feats = [{id, name}]` with `human_variant: true`; `human-feat-detail` shows the chosen feat's description on the form; `human-feat-empty` when no feats exist for the edition). **Feat prerequisite gating** (`featPrerequisites.js` — `checkFeatPrerequisite(feat, ctx)`): the chosen feat's free-text prerequisite is parsed into ability-score / spellcasting / armor-proficiency / level requirements (unparseable text is ignored — fail-open). Class/level/armor/spell requirements are known at the Identity step and BLOCK Identity → Features (`data-testid="feat-prereq-identity-note"` shows the reason); ability-score requirements need the assigned scores so they BLOCK Features → Review (`data-testid="feat-prereq-features-note"`, reason includes the highest qualifying score; the Variant +1s are folded in). Level-1 spellcasting uses the class's `spellcasting_ability` (5e Paladin excepted — no spells until L2); armor categories derive from `CLASS_PROFICIENCIES_5E[class].armor` + race-granted armor. Frontend-only guardrail (mirrors the existing score/skill creation gates). Variant Human BLOCKS Next until 2 ASI stats + 1 skill + 1 feat are chosen; switching back to Standard clears the variant picks. Both types also pick an optional extra language (`data-testid="human-language-select"`; added to `race_languages`). Step 5 review shows a "Variant Human" block (`data-testid="review-variant-human"`) with the feat + skill badges. **Skill-overlap gate (step 3):** a player-chosen Half-Elf skill that duplicates a background skill BLOCKS Next with `data-testid="skill-double-error"`; an automatic trait grant (Keen Senses→Perception, Menacing→Intimidation) overlapping a background skill only WARNS via `data-testid="skill-overlap-warning"` (non-blocking). Half-Elf versatility skills are also passed to the class sheet as race-granted (emerald, non-clickable) so they can't be re-picked as class skills.
- **CharacterCreate — Background Choices section** (`data-testid="bg-choices-section"`): rendered in step 3 for backgrounds that grant tool or language choices; **gaming set** (Criminal/Noble/Soldier): dropdown `data-testid="bg-tool-choice-select"` showing 4 gaming sets; **musical instrument** (Entertainer/Outlander): same dropdown showing instrument list; **artisan's tools** (Guild Artisan/Folk Hero): same dropdown showing artisan's tools list; all tool choices stored as `character_data.background_tool_choice`; **language choices** (Acolyte: 2, Hermit: 1, Sage: 2): selects `data-testid="bg-language-{i}-select"` showing `STANDARD_LANGUAGES_LIST`; stored as `character_data.background_languages` array; background tool + language choices are **required** (block Next until chosen). The background tool dropdown disables a tool already chosen for the race ("already from race") and vice-versa (bidirectional exclusion).
- **CharacterCreate — Monk tool choice** (step 4): dropdown `data-testid="monk-tool-choice-select"` showing artisan's tools + musical instruments as `<optgroup>`s; stored in `classData.tool_choice` → auto-saved to `character_data.tool_choice`; optional/non-blocking
- **CharacterCreate — SpellPickerCreation:** curated toggle-list only (no free-text custom spell input); GM creates new spells; players pick from the provided list
- **CharacterCreate — spell slot display during creation:** all magic classes show a static info box ("2 × Level 1 spell slots / All slots recover on a Long Rest") instead of the +/− tracker; Paladin 5e has no slots at level 1 so hidden entirely; Warlock uses the `!creation` gate on the pact magic tracker
- **CharacterCreate — spell lists hidden during creation:** all `SpellList` components (cantrips, prepared spells, known spells, spellbook) are wrapped in `{!creation && (...)}` across most spellcasting class sheets; spells are managed from CharacterDetail after creation. **Exceptions — shown during creation:** 5e BardSheet uses `SpellPickerCreation` curated toggle list (Bard has fixed known spells); both SorcererSheets (5e + 2024) use `SpellPickerCreation` curated toggle lists (4 cantrips + 2 L1 spells — Sorcerer is a known caster with a fixed spell set chosen at creation/level-up); both WarlockSheets (5e + 2024) show free-text `SpellList` for cantrips and known_spells during creation because Warlocks cannot freely swap spells between rests
- **CharacterCreate — InstrumentPicker (Bard):** standard instruments shown as toggle buttons; custom instruments entered via "Other instrument…" input + Enter or `+` button; custom instruments are stored in the `value` array alongside standard ones; after adding, custom instruments appear as selected (primary-colored) toggle buttons rendered after the standard list (`customInstruments = value.filter(i => !MUSICAL_INSTRUMENTS.includes(i))`)
- **CharacterDetail — subrace and racial data display:** editable view shows `Subrace: {name}` below the race input when `character_data.subrace` is set; read-only view shows subrace as a Badge alongside race; Racial Traits section (`TraitBadgeList`) and Languages section (outline badges) appear between the identity fields and ability scores when `character_data.race_traits` / `race_languages` are non-empty; sections are hidden entirely when the arrays are empty; clicking a trait badge toggles a description panel below the badge list
- **CharacterDetail — edition switching:** `edition = campaign?.edition || '5e'`; selects `CLASS_SHEETS_5E` or `CLASS_SHEETS_2024` map to find the right sheet component for the character's class
- **CharacterDetail — tab layout:** five-tab structure for spellcasters, four-tab for non-spellcasters (shadcn/ui Tabs); default tab is "narrative":
  - **Tab 0 "Narrative"** — always shown first; contains: Portrait upload, Theme Music URL, Backstory (markdown), Public Notes (markdown), Personal Notes (blue-tinted, owner+GM only), Related NPCs card, Timeline Events card, GM Notes (amber, GM only — moved here from page bottom)
  - **Tab 1 "Stats"** — Identity & Ability Scores card (the Race/Species block shows a "Draconic Ancestry" line/badge when `character_data.draconic_bloodline` is set) + Hit Points & Movement card (class sheet with `section="stats"`, receives a full `scores` prop so Barbarian/Monk unarmored-AC boxes compute correctly; the **Max HP value itself shows the effective total** via **`MaxHpValue`** — stored hp_max + passive bonuses with a small "+N Source" note (e.g. "+1 Draconic Resilience"), never mutates hp_max — and an inline **`AcOptionsLine`** sits right under the Armor Class field listing non-armor AC formulas; both passed in as the sheet's `maxHpNode`/`acExtra` slots and add nothing when no bonus applies, so the bonus is folded into the value it modifies, not a separate card/row) + **Racial Features card** (`RacialResourceTracker` with `excludeKeys={['breath_weapon_used']}`, shown only when the character has ≥1 rest-rechargeable racial trait other than Breath Weapon — Relentless Endurance, Drow Magic L3+, Infernal Legacy L3+; Breath Weapon itself lives in the Weapons & Armor tab; shares `classSection`/`saveClassData` so Save/Reset persist with the rest of character_data)
  - **Tab 2 "Features"** — `{char_class} Features` card (class sheet with `section="features"`, includes subclass picker/lock, class features up to current level)
  - **Tab 3 "Weapons & Armor"** — **Racial Features card** holding the Breath Weapon (`RacialResourceTracker` with `includeKeys={['breath_weapon_used']}`, shown only for Dragonborn; "Use" button → confirmation dialog → expends; recharges on a short or long rest), a **Wallet card** (`WalletCard` — coin inputs for `character_data.currency`, shown coins per `campaign.currency_type`: standard = pp/gp/sp/cp, full = + ep; computed total-in-gp readout; saved via `saveClassData`/SectionCard Save; readOnly for non-owners/player-view), and an Equipment & Inventory placeholder card ("Coming soon"); always shown regardless of class
  - **Tab 4 "Spells"** — only shown when `hasSpells=true`; contains class spellcasting section (`section="spells"`) for casters, plus Race-Granted Cantrips card when applicable (renders a read-only `SpellList` in `isCantrips` mode so each cantrip name is clickable for its detail dialog)
  - `hasSpells = SPELLCASTING_CLASSES.has(char_class) || raceGrantedCantrips.length > 0`
  - `computeRaceGrantedCantrips(character)` — reads `character_data.high_elf_cantrip`, `SUBRACE_CANTRIPS[subrace]` (Forest Gnome → Minor Illusion, Drow → Dancing Lights), `RACE_CANTRIPS[race]` (Tiefling → Thaumaturgy)
  - **Note for tests:** CharacterDetail.test.jsx mocks `@/components/ui/tabs` to render all TabsContent unconditionally (same pattern as LocationDetail.test.jsx), so tab content is always in the DOM without clicking
- **CharacterDetail — Narrative tab details:**
  - **Portrait upload:** click or drag-drop zone (10 MB limit, JPEG/PNG/WebP); served from `uploads/characters/{character_id}/`; remove button when image exists; only editable by `showEditable` (owner or GM non-playerView)
  - **Theme Music:** owner/GM see a paste-a-link `Input` (saved via `narrativeMeta` useSection) + an "Upload audio" button (`musicInputRef`, calls `characterService.uploadMusic` immediately, 50 MB limit) + a "Remove" button when set; an inline `<MusicPlayer>` renders below for everyone (auto-detects Spotify/YouTube/uploaded-file and plays in-browser); players with no music set see "No theme music set."
  - **Backstory:** large resize-y monospace textarea + Write/Preview toggle; markdown rendered with ReactMarkdown; `showEditable` gated; saved via separate `backstory` useSection calling `PUT /api/characters/{id}` with `{ backstory }`
  - **Public Notes:** smaller textarea + Write/Preview; labeled "Visible to all campaign members"; `showEditable` gated; saved via `publicNotes` useSection calling `PUT` with `{ notes }`
  - **Personal Notes:** blue-tinted SectionCard (`variant="personal"`); labeled "Visible only to you and the GM"; shown only when `showPersonalNotes = isOwner || (isGm && !playerView)`; only owner can edit (textarea hidden for GM-non-owner); saved via `personalNotes` useSection calling `PUT` with `{ personal_notes }`
  - **Related NPCs card:** create-only form toggle (`data-testid="npcs-toggle"`, owner/GM only); form fields: name (required), race, occupation, status select, summary, relationship description, visible-to-players checkbox; submit calls `characterService.createCharacterNpc` → creates NPC + junction; list shows portrait thumbnail, name (Link to NPCDetail), race/occupation, relationship; remove button (`data-testid="unlink-npc-{id}"`); calendar loaded via `settingsService.getCalendar(campaignId)` for era/month selects
  - **Timeline Events card:** create-only form toggle (`data-testid="timeline-events-toggle"`, owner/GM only); form fields: title (required), description, era select, year, month select, day, link note, visible-to-players checkbox; era/month selects only shown when calendar has eras/months; submit calls `characterService.createTimelineEvent` → creates event + junction; list shows Clock icon, event_title, era_dates or "Unknown date" italic, link_description; remove button (`data-testid="unlink-event-{id}"`)
  - **GM Notes:** amber-tinted SectionCard (`variant="amber"`); gated `isGm && !displayAsPlayer`; **moved from page bottom into Narrative tab** — no longer separate from tabs
- **CharacterDetail — key logic:**
  - `showEditable = isOwner || (isGm && !playerView)` — players always edit their own characters; GM edits freely unless in Player View preview mode
  - **ClassSheet `readOnly` prop** uses `readOnly={!showEditable}` in all three tabs (Stats, Features, Spells) — so players who own their character can edit current HP, temp HP, speed bonus, AC, and use spell slots; non-owners and playerView get `readOnly=true`
  - **GM Edit toggle (Epic 1):** GM-only header button (`data-testid="gm-edit-toggle"`, shown when `isGm && !playerView`, default OFF) toggling `gmEdit` state, passed to all three ClassSheet renders. When ON, the data-driven ClassSheet's locked permanent choices (subclass, fighting style) become editable again via `useLockedChoice` (`locked = readOnly || (!creation && !gmEdit && hasValue)`); players never receive `gmEdit=true`. Currently only the data-driven Fighter/Wizard sheets honor it; the other 22 sheets ignore the extra prop.
  - `displayAsPlayer = !isGm || playerView` — controls which sections are hidden (GM Notes, Personal Notes, Player View toggle itself)
  - `showPersonalNotes = isOwner || (isGm && !playerView)` — Personal Notes visible only to owner and GM (not player-view)
  - `useSection(initial)` hook: `{ draft, setDraft, isDirty, reset, commit }` — per-section Save/Reset buttons appear only when dirty
  - **`autoSaveClassPatch(patch)` — live resources persist immediately (no Save click):** the **Spells tab** ClassSheet and the **Stats tab `RacialResourceTracker`** use `onChange={autoSaveClassPatch}` instead of the manual-Save `classSection.setDraft`. Spell slot use (−), casting (Cast button), Arcane Recovery, prepared-spell toggles, the prep lock, and racial resource ± all commit a discrete value, so each fires an immediate `updateCharacter` PUT. This fixes the bug where an unsaved cast made a later rest look like it "restored" the slot — the cast was simply never persisted. Uses `classDraftRef` (synced from `classSection.draft` via `useEffect`) so rapid back-to-back clicks don't race on stale React state; merges in `savingThrows.draft` and `classSection.commit`s the server response. The **Stats** (HP/AC/Speed — text inputs) and **Features** (subclass/features) tabs keep manual per-section Save.
  - Calendar loaded on mount via `settingsService.getCalendar(campaignId)` in a separate `useEffect`; gracefully handles 404 (sets `calendar=null`, hides era/month fields in event form)
- **Leveling card:** shown above Identity; adapts to `campaign.leveling_type` — milestone or experience
  - **Milestone:** GM sees "Level Up" button → sets `level_up_pending: true`; player sees amber "Level Up Available!" banner when `level_up_pending=true`
  - **Experience:** XP bar shows progress to next level (using `XP_THRESHOLDS`); GM gets "Add XP" input; when XP crosses next-level threshold, `level_up_pending` auto-sets to true alongside the XP update
  - **Level-up wizard trigger:** when `isOwner && level_up_pending`, clicking the banner opens `LevelUpWizard`
- **LevelUpWizard (dynamic-step modal):**
  - Steps: HP → (Subclass, conditional) → Features → Confirm
  - **Subclass step** appears only when `newLevel === SUBCLASS_UNLOCK[char_class]` AND `!character_data.subclass`; unlock levels: 5e — Cleric/Sorcerer/Warlock L1, Druid/Wizard L2, all others L3; 2024 — all classes L3
  - Subclass step shows a permanent-choice warning + `SubclassPickerWithDetail`; Next is blocked until a subclass is selected
  - HP step: "Roll the Dice" (random d{hitDie}) or "Take Average" (⌊die/2⌋+1); CON modifier applied; shows HP gained + new HP max preview
  - Features step: lists all features from `CLASS_FEATURES_5E`/`CLASS_FEATURES_2024` at the new level; "No new features" state for empty levels
  - Confirm step: summary card (level jump, HP gained, subclass chosen if applicable, features gained); "Confirm Level Up" calls `onComplete(newLevel, { ...character_data, hp_max: newHpMax, subclass? })` + sets `level_up_pending: false`
- **Identity + Ability Scores card:** editable name, race, background, alignment (hidden when `campaign.use_alignment === false`); **level is read-only** — displayed as a static div, never an editable input; level only changes via the LevelUpWizard; 6 ability score inputs with live modifier display; Saving Throws section (proficiency checkboxes, stored in `character_data`)
- **Derived stats row:** Proficiency Bonus (`Math.ceil(level/4) + 1`), Initiative (DEX mod), Passive Perception (10 + WIS mod + prof if proficient), Inspiration toggle
- **Skills display:** all 18 skills with proficiency/expertise indicators and computed bonus; expertise = double proficiency
- **Class Features card / Spellcasting card:** renders class-specific sheet component — each accepts `{ data, onChange, readOnly, level, creation, section, abilityScores, backgroundSkills, raceSkills }`.
  - `backgroundSkills: string[]` — skills granted by the chosen background (rendered amber, non-clickable in the SkillPicker; only meaningful during `creation=true`)
  - `raceSkills: string[]` — skills granted by racial traits via `getRaceGrantedSkills(race, subrace)` (rendered emerald, non-clickable; only meaningful during `creation=true`)
  - `section: 'all' | 'stats' | 'features' | 'spells'` — controls what a sheet renders; defaults to `'all'` (used in CharacterCreate where section is never passed)
  - `abilityScores: { intelligence, wisdom, charisma }` — passed from CharacterDetail so prepare-caster sheets can compute prepare limits; defaults to `{}` (all scores treated as 10 when absent)
  - In CharacterDetail: Stats/Features/Spells tabs all pass `abilityScores` from `identity.draft`
  - **Prepare-caster limits** (only in non-creation Spells section): Wizard/Cleric/Druid = `level + mod`; Paladin 5e = `⌊level/2⌋ + CHA mod`; Paladin 2024/Ranger 2024 = `level + mod`; minimum 1
  - **Wizard prepared spells UX:** spellbook entries shown as clickable toggle chips — click to prepare/unprepare; limit enforced (chips disabled when at limit); non-spellbook prepared spells shown in "Other Prepared Spells" SpellList
  - **Cleric/Druid/Paladin/Ranger2024 prepared spells:** SpellList with dynamic label `"Prepared Spells — X/Y · Long Rest"`
  - **Section isolation — enforced in all 24 sheets:**
    - `showFeatures = section === 'all' || section === 'features'` — class features, subclass, ASI reminder
    - `showCombat = section === 'stats' || (!creation && section !== 'features' && section !== 'spells')` — HP/AC/Speed
    - Spell content (slots, cantrips, spellbook, prepared spells): `!creation && (section === 'all' || section === 'spells')` — never shown in 'stats' or 'features' tabs
    - Skill proficiency picker: `creation && showFeatures` — only during CharacterCreate; CharacterDetail uses its own 18-skill panel instead
  - **Subclass locking:** all 24 class sheets (5e + 2024) show the subclass picker only when `!(readOnly || (!creation && !!data.subclass))`. Once `data.subclass` is set **outside of creation**, the picker is replaced by `SubclassDetails` which renders: the subclass name, flavor text, and all subclass features earned at or below the character's current level (level-gated, same as class features). Features not yet unlocked are not shown — players visit the Encyclopedia for the full subclass overview. Falls back to plain name when subclass data is unavailable. This prevents players from switching subclasses after the initial permanent choice. In GM view (`readOnly=false`), a character without a subclass shows the picker; one with a subclass shows the detail panel even for GM. **During character creation (`creation=true`) the picker is NEVER locked** — even after a subclass is selected the full picker stays visible so the player can freely switch between or deselect subclasses before reaching the review step; the permanent lock only takes effect afterward in CharacterDetail. (Only affects 5e Sorcerer/Cleric/Warlock, whose subclass unlocks at L1; L2/L3-unlock classes don't show the picker at creation since creation is always level 1.)
  - Non-spellcasting sheets (Barbarian, Fighter, Monk, Rogue — both editions): `if (section === 'spells') return null;` as the first line
  - Spellcasting sheets: features wrapped in `showFeatures`, spell content in `!creation && (section === 'all' || section === 'spells')`
  - When `creation=true` (CharacterCreate only), the HP grid (current/max/temp HP), `HitDiceTracker`, Armor Class, and Speed row are hidden — these are irrelevant at creation since HP is auto-calculated and AC depends on armor/DEX
  - **Speed row (3 fields, non-creation only):** Speed (ft) — read-only static display of `data.speed ?? 30` (base racial speed, set from `selectedRaceObj.speed` at character creation); Speed Bonus (ft) — user-editable `data.speed_bonus ?? 0` for temporary bonuses (e.g. Longstrider); Total Speed (ft) — read-only computed `(data.speed ?? 30) + (data.speed_bonus ?? 0)`
  - **Hit Dice (non-creation only):** `HitDiceTracker` component — shows `d{hitDie} × level`, remaining/total count, and +/− buttons (buttons hidden when `readOnly`); `onChange(v)` stores `hit_dice_used` integer in `character_data`; Armor Class is a standalone field below it
  - **Max HP:** read-only static display of `data.hp_max` (set at creation from hit die + CON modifier, updated via LevelUpWizard only); never an editable input
  - **Languages displayed (CharacterDetail Stats card):** grouped by source under a single "Languages" header — a "From Race" subsection (`character_data.race_languages`, which includes trait- and choice-granted race languages) and a "From Background" subsection (`character_data.background_languages`, deduped against the race set so a language in both shows once under "From Race"); each subsection is hidden when empty
  - **Class features in CharacterDetail (non-creation mode):** only features at or below the character's current level are shown, using `Array.from({ length: level }, ...).flatMap(lvl => CLASS_FEATURES[Class][lvl])`. Each feature card shows a `Lvl N` badge, feature name, and full description. Future features are NOT shown at all (users can consult the Encyclopedia for progression). The old `FeatureRow` component (which showed all 20 levels with future ones greyed out) has been removed from all 24 sheets.
  - **Class features in CharacterCreate (creation mode):** only level 1 features are shown (unchanged); the `creation=true` gate already existed before this change.
- **GM Notes card (GM only):** amber-tinted "Private" card; always stripped from all responses returned to players and owners
- **Player View toggle (GM):** preview what a player sees; hides GM Notes card and all editing controls; re-renders the class sheet in `readOnly` mode
- **`CLASS_SAVE_PROFS` map:** default saving throw proficiencies per class stored in `character_data`; GM can override per-character via the save throw checkboxes
- **5e spell slot tables (local to each sheet):** `PALADIN_SLOTS` (half-caster, Paladin starts at L2); `RANGER_SLOTS` (half-caster, Ranger starts at L1); `WIZARD_SLOTS` / `SPELL_SLOTS` (full caster, levels 1–9) for Bard/Cleric/Druid/Sorcerer/Wizard; `PACT_SLOTS` (Warlock Pact Magic, short-rest)
- **5.5e (2024) key differences from 5e:**
  - Weapon Mastery (Barbarian/Fighter/Monk/Paladin/Ranger/Rogue) — badge list of chosen weapons, stored as `weapon_masteries`
  - Subclasses moved: Cleric L1→L3, Druid L2→L3, Sorcerer L1→L3, Warlock L1→L3
  - Paladin spell slots start at L1 (same half-caster table as Ranger)
  - Bardic Inspiration is Short Rest from L1 (not Long Rest until L5)
  - Monk renames Ki to Focus Points (same key `ki_used`)
  - Cleric Channel Divinity is Short Rest, 2 uses from L2; Divine Order choice at L1
  - Druid Primal Order choice at L1; Wild Resurgence at L5
  - Sorcerer Innate Sorcery at L1 (1×/LR toggle); Sorcerous Restoration at L5 (regain 4 SP on short rest)
  - Warlock Eldritch Invocations at L1 (not L2); Pact Boon at L5 (not L3); Magical Cunning at L2 (1×/LR recover half slots)
  - Wizard Memorize Spell at L1 (1×/LR); Scholar at L2; Arcane Tradition subclass at L3 (not L2)
  - Fighter Tactical Mind at L2; larger Weapon Mastery pool (up to 6 weapons at L16)
  - Rogue Steady Aim at L3 (bonus action → advantage)
- **Spell tracking:** slot count grid + named spell lists (prepared spells, cantrips, spellbook for Wizard) stored as string arrays in `character_data`; spell lists rendered by the shared `SpellList` component (`characters/components/SpellList.jsx`) which groups spells by level (cantrips first, then 1st–9th, then "Other Spells" for spells not found in the catalog), sorts alphabetically within each section, only shows a section when the character has at least one spell at that level, and shows a clickable spell name that opens a Dialog with full spell details; `isCantrips=true` prop forces all spells into the Cantrips (level-0) section for grouping but still fetches the catalog so the detail dialog shows full cantrip details (without the fetch, cantrips always fell back to the "not in compendium" message); `onCastSpell(name, level)` prop adds a "Cast" button per non-cantrip spell (disabled when `availableSlots[level] <= 0`; clicking Cast opens a confirmation dialog ("This will use a level N spell slot.") with Cancel / Cast buttons — `onCastSpell` fires only after the user confirms, preventing accidental slot use); `availableSlots { [level]: remaining }` prop drives Cast button state
- **Spell slot tracker (Wizard 5e + 2024 Prepared sub-tab):** `−` button (use a slot) shown for all non-readOnly users; `+` button (restore a slot) shown only for GMs (`isGm && !readOnly`) — players cannot manually restore slots; Arcane Recovery "Use (Short Rest)" button enabled only when there is a recoverable expended slot (`recoverableExpended` — an expended slot of level ≤ 5); on click `handleArcaneRecovery` restores expended slots highest-value-first within a budget of ⌈level/2⌉ slot-levels (never 6th+) and sets `arcane_recovery_used: true` in the same `onChange`; clicking when "Used" resets the flag (long rest) without touching slots
- **Prepare-caster Spells tab (Cleric/Druid/Paladin/Ranger 2024/Wizard — 5e + 2024):** Two button-based sub-tabs inside the Spells tab (NOT shadcn Tabs, to avoid nested Radix contexts):
  - **"Prepared" sub-tab (default):** cantrips, prepared spell list with Cast buttons (Wizard only — SpellList with `onCastSpell`/`availableSlots` props), spell slot tracker, and class-specific spell features (e.g., Channel Divinity for Cleric, Arcane Recovery for Wizard)
  - **"Prepare Spells" sub-tab:** spell selection UI; Cleric/Druid/Paladin/Ranger use `ClassSpellBrowser` (fetches class spell list filtered to castable levels via `maxCastableLevel(slots)`); Wizard uses spellbook chip-toggles + spellbook management (SpellList) + encyclopedia link; both implementations include lock/unlock UI
  - **Lock mechanic:** `prepared_locked` boolean in `character_data`; when false and !isGm: "Prepare for Today" button locks preparation; when locked and !isGm: amber "Spells prepared for today" banner, all add/remove actions disabled; when locked and isGm: "Unlock (Long Rest)" button; GM can always toggle
  - `ClassSpellBrowser` props: `className, campaignId, preparedSpells, prepareLimit, onAdd, onRemove, locked, isGm, maxSpellLevel, onLock, onUnlock`; encyclopedia link at bottom of every "Prepare Spells" sub-tab
  - CharacterDetail passes `campaignId={campaignId}` and `isGm={isGm}` to the ClassSheet in the Spells tab
- **Class-specific resources:** `rages_used` (Barbarian), `ki_used` (Monk/Monk2024 Focus Points), `bardic_inspiration_used` (Bard), `channel_divinity_used` (Cleric), `wild_shape_used` (Druid), `sorcery_points_used` (Sorcerer), `pact_slots_used` (Warlock)
- **Subclass resource — Portent (Divination Wizard):** `portent_rolls` = `[{ value: 1-20, used: bool }, …]`; rolled via `PortentTracker` (2 dice, 3 at L14 Greater Portent), expended per-die; cleared to `[]` on a long rest by the backend
- **Racial rest resources:** `_used` counters in `character_data` defined by `RACIAL_REST_RESOURCES` (`racialRestResources.js`, mirrored in backend `_compute_rest_patch`): `breath_weapon_used` (Dragonborn, short/long), `relentless_endurance_used` (Half-Orc, long), `drow_faerie_fire_used`/`drow_darkness_used` (Drow, long, L3/L5), `infernal_hellish_rebuke_used`/`infernal_darkness_used` (Tiefling, long, L3/L5)

### Frontend Not Yet Built
- Multiclassing support (deferred — will be its own feature after both editions complete)
- Equipment / Inventory (in progress — the **Wallet** (CP/SP/GP/PP, + EP in `full` mode) is built: editable in the CharacterDetail Weapons & Armor tab, seeded at creation from background starting gold, coin set driven by `campaign.currency_type`. The weapons/armor/gear item lists themselves are not yet attached to the character sheet — next step.)
- Feat selection UI — partially built: feats live in the encyclopedia (Feats tab, edition-aware) and the Variant Human creation flow picks one feat + skill (stored in `character_data.feats`). General feat selection at ASI levels (level-up feats) + the class-sheet feat section are still deferred.
- Loot table UI
- Encyclopedia browsing UI — Classes, Skills, Spells, Items (Weapons/Armor/Gear/Potions/Magic Items/Food & Drink — system browse + GM override + campaign homebrew + edit), and Feats tabs exist; Monsters tab not yet built. Items are not yet integrated into the character sheet (Weapons & Armor tab inventory is the next step)
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
├── test_campaigns.py               # campaign CRUD + member management + TestUserSearch (search by username/email, excludes self, min 2 chars, auth required, response shape) + TestCampaignCurrency (currency_type defaults to "standard", GM can set "full", present in list response)
├── test_calendar_timeline.py       # calendar (6+2+3+4+8+8), timeline events (13), event links (6), location filter (5) = 57 tests
                                    #   TestCalendarCRUD(6), TestSeasons(2), TestMonths(3), TestMonthOptionalName(4),
                                    #   TestWeekdays(7), TestEras(8), TestTimelineEvents(13, incl. gm_notes), TestEventListFieldRoundTrip(8), TestEventLinks(6), TestLocationFilter(5)
├── test_characters.py              # character CRUD + visibility, TestGmNotes (gm_can_set/get, stripped_from_owner, player_cannot_set), TestGmDelete (gm_can_delete, other_player_cannot), TestCampaignEdition (defaults_to_5e, create/update/list), TestCharacterListFieldRoundTrip incl. character_data, TestApplyRest (GM can short/long rest, player 403, non-member 403, cross-campaign filter, Warlock pact slots, Wizard HP+slots, hit dice recovery, response shape, Dragonborn Breath Weapon short-rest reset, Relentless Endurance long-rest-only, Drow darkness level-gated, Portent cleared on long rest, Portent untouched on short rest), TestCharacterMusic (owner/GM upload, non-owner player 403, disallowed extension 400, delete clears url) (53 tests)
├── test_encyclopedia.py            # bestiary + spells + 6 item types (parametrized); TestSpellFields: ritual/concentration/higher_level defaults, round-trips, survive update, appear in list (128 tests total)
├── test_locations.py               # locations, maps, pins, location NPCs, hierarchy, pin→parent persistence (61 tests)
├── test_loot_tables.py             # loot tables (system/campaign ownership)
├── test_npcs.py                    # NPC CRUD, visibility, gm_notes stripping, image, relationships, player-relationships, last_known_location, TestNPCMusic (GM upload, player 403, delete clears url) (39 tests)
├── test_session_notes.py           # session CRUD (10), list (4), visibility (2), gm_notes (3), fields (2), list-field round-trip (3), filters (?npc_id/?location_id/?event_id) (3), NPC links (5), location links (3), event links (3), character links (4), TestSessionMusic (GM upload, player 403, delete clears url) (3) = 45 tests
└── test_races_backgrounds_feats.py # admin-only compendium (parametrized) + TestFeatEdition (edition defaults to 5e, round-trips in detail + list, ?edition filter, no-filter returns all, update edition) (6)
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
│       ├── CharacterList.test.jsx    # loading, fetch with campaignId, error, empty state, card render, click-to-navigate, GM title+visibility toggles+reload, player title+no toggles; rest buttons (show, disabled/enabled on selection, checkboxes, select all, dialog opens for short/long, character names shown, confirms short/long rest calls applyRest, cancel no-op); rest buttons hidden for players + GM player-view (24 tests)
│       ├── CharacterCreate.jsx
│       ├── CharacterCreate.test.jsx  # class picker (13 classes including Artificer), class overview step (advances on class select, back returns to class picker, classService.getClassByName called with edition, shows API data), advances to identity step, step indicator, race cards (9 PHB races), bg cards (13 PHB), race card expands detail, bg card expands detail + deselect, bg sets form value, custom race input, race search filter, Next disabled when name empty, Next enabled after name, alignment toggle (identity step), back nav (identity→class_overview, features→identity), API races replace hardcoded when returned, advances to features step, identity summary on step 4, error on failure, correct payload + navigate, Wizard/Fighter/Barbarian/Cleric/Warlock fields, no Level field, level:1 in payload, hp_max auto-calculated, HP/AC hidden, point buy starts at 8, bg skills flow to class sheet (legend + extra amber buttons), custom instrument button, OptionCardPicker: Fighter fighting style cards show descriptions, clicking selects value in payload, Cleric/Warlock subclass cards show descriptions, subclass info button visible + clicking opens SubclassOverview dialog with flavor text; subrace picker (shows for Dwarf/Elf, hidden for Human, Next blocked without selection, detail panel, clears on race change, ASIs applied to scores, CON bonus raises hp_max, stores subrace/race_traits/race_languages in character_data, racial-asi-preview in step 4); skill gate: details-next stays disabled until required class skill count chosen; step 5 overview advance (advanceToReview helper, Create Character on step 5); race choices (Dragonborn draconic ancestry picker + Next-blocking + payload, Half-Elf ASI+skill versatility picker + Next-blocking + payload, Human extra language picker + non-blocking + payload); background choices (Criminal/Noble/Soldier gaming set picker, Entertainer/Outlander instrument picker, Guild Artisan/Folk Hero artisan's tools picker, Acolyte/Sage language pickers + payload); Monk tool/instrument picker in step 4; race-granted skills (Elf shows Perception+Keen Senses in race-skill-grants card, Half-Orc shows Intimidation+Menacing, Human has no race-skill-grants card, Elf shows emerald legend in Fighter sheet, Half-Orc Intimidation appears as extra emerald button on Wizard, race skill in payload skill_proficiencies, step 5 review shows Race-Granted skills); Variant Human (Standard/Variant choice shown, Variant unlocks ASI/skill/feat pickers with edition-filtered feat options, Next blocked until 2 ASI + skill + feat chosen, payload applies +1-to-two & stores feat in character_data.feats + skill in proficiencies, switching back to Standard clears picks & restores +1-to-all); Variant Human feat prerequisites (spellcasting feat blocks Identity for non-caster + note, armor feat blocks Identity when class lacks the proficiency, ability-score prereq does NOT block Identity, ability-score prereq blocks Features → Review + note with highest score, Variant +1s folded into the ability check); review page shows the chosen feat name + description (+ prerequisite when present, `review-variant-human-feat-desc`); starting currency (review shows 0 gp with no background, Charlatan background → 15 gp in review-starting-gold + character_data.currency seeded in payload) (116 tests)
│       ├── CharacterDetail.jsx
│       └── CharacterDetail.test.jsx  # loading, error, name+class display, ability scores (waitFor), prof bonus, editable owner fields, GM Notes hidden (player), GM Notes shown (GM), Player View toggle, switching view hides GM Notes, updateCharacter with gm_notes, visibility toggle (GM), Fighter features, read-only non-owner; Leveling card — milestone (GM Level Up button, calls updateCharacter, owner sees pending banner), experience (XP label, GM Add XP input, add XP calls updateCharacter, threshold triggers level_up_pending); subrace and racial data (subrace badge read-only, subrace label editable, racial traits+languages from character_data, no traits section when absent); max HP read-only (value from hp_max key, not an input); speed fields (3 labels present, base speed not an input, total speed = sum, correct totals when speed+bonus set); tab structure (Narrative+Stats+Features+Weapons+Armor triggers always present, Spells tab absent for Fighter, Spells tab shown for Wizard/Artificer/Tiefling/High Elf/Forest Gnome, 4 vs 5 tab count); level is read-only (not in any input, shown in header); class features level-gating (L5 Fighter shows "Extra Attack (2 attacks)", does not show any Indomitable variant); subclass locking (GM view: set subclass shows locked text + flavor text + earned features + no info buttons; no subclass at unlock level shows picker); Hit Dice Tracker (Hit Dice label, die type d10, remaining/total count, pre-populated count; GM interactive: minus disabled at 0, + updates count + enables Save, + then Save calls updateCharacter with hit_dice_used); Narrative tab — Personal Notes (owner sees, GM sees, non-owner player hidden), Backstory+Public Notes headings; Related NPCs card (empty state, toggle visible for owner, hidden for non-owner, shows NPC name, createCharacterNpc call, removeCharacterNpc call); Timeline Events card (empty state, toggle visible for owner, hidden for non-owner, shows event title, Unknown date, createTimelineEvent call, removeTimelineEvent call); race-granted skills on SkillsDisplay (Elf with Keen Senses shows emerald legend, Half-Orc with Menacing shows emerald legend, Human shows no emerald legend, Perception not double-counted when in both arrays); skills legend says "Gold = proficient" (not Blue); SkillsDisplay legend (hides "Purple = expertise" when no expertise, shows it for Rogue with expertise, shows "Amber = from background" for Soldier's Athletics, hides it when no proficient skill comes from the background); languages grouped by source (From Race / From Background labels, background language deduped against race, From Race hidden when only background langs present); Racial Features card (shown for Half-Orc with Relentless Endurance, hidden when no rest-gated traits, owner expending a use auto-saves immediately via updateCharacter with relentless_endurance_used — no Save click); Draconic Bloodline Sorcerer (Max HP folds in the bonus → shows 57 with "+5 Draconic Resilience" note and no separate Bonus/Effective rows, Armor Class Options 13+DEX under the AC field, Draconic Ancestry "Red Dragon (Fire)" line; plain Fighter shows base 52 with no source note and no AC options); Wallet (Weapons & Armor tab — standard 4 coins no electrum by default, electrum shown when campaign currency_type=full, owner sees stored gp/sp in inputs, read-only for non-owner); mocks @/components/ui/tabs, react-markdown, settingsService (94 tests)
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

```bash
# Backend
cd backend
source venv/Scripts/activate     # Windows (bash)
uvicorn main:app --reload         # Dev server at http://localhost:8000

# Frontend
cd frontend
npm run dev                       # Dev server at http://localhost:5173
npm test                          # run frontend tests

# Database
psql -U postgres -d dnd_app_dev
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Backend Server Restart — REQUIRED After Every Backend Change

**The user cannot see or access the terminal Claude uses to run the server. Claude must restart the server itself** after every backend change — do not ask the user to do it.

After any change to backend code — models, schemas, routes, service logic, or migrations — kill the running process and start a fresh one:

```powershell
# 1. Kill existing server (PowerShell)
Get-Process -Name python* -ErrorAction SilentlyContinue | Stop-Process -Force
```
```bash
# 2. Start fresh (Bash, run_in_background=false to confirm startup)
cd "c:/Users/rober/Documents/Projects/dnd-app/backend" && source venv/Scripts/activate && uvicorn main:app --reload &
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
- Encyclopedia tables (spells, creatures, all items) have no `owner_type`/`owner_id` columns and have `UNIQUE(name)` constraints — need migrations to support campaign overrides
- `require_gm(campaign_id)` dependency not yet implemented in `shared/dependencies.py`
- Content copy/export between a GM's campaigns not yet implemented

### Frontend
- Everything listed in "Frontend Not Yet Built" above
- No token expiry handling
