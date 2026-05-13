# D&D RPG Application — Project Context

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
│   ├── characters/              # Character CRUD — routes/service/models/schemas
│   ├── races/                   # D&D races (system + campaign-custom)
│   ├── backgrounds/             # D&D backgrounds (system + campaign-custom)
│   └── feats/                   # D&D feats (system + campaign-custom)
├── gm/
│   ├── campaigns/               # Campaign + member management
│   │   └── campaign_tools/
│   │       ├── npcs/            # NPC management — routes/service/models/schemas/storage
│   │       ├── locations/       # Locations, maps, pins, NPC links — routes/service/models/schemas/storage
│   │       ├── calendar/        # Per-campaign calendar: seasons, months, eras — routes/service/models/schemas
│   │       └── timeline/        # Timeline events with NPC/location links — routes/service/models/schemas
│   └── tools/
│       └── loot_tables/         # Loot table generation (system + campaign)
├── uploads/
│   ├── maps/                    # Map images: uploads/maps/{campaign_id}/{location_id}/uuid.ext
│   └── npcs/                    # NPC portraits: uploads/npcs/{campaign_id}/{npc_id}/uuid.ext
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
- **GM sees:** ALL characters in their campaign (read-only)

### Content
- **Only admin can create/edit/delete system (`owner_type='system'`) content**
- **Only the campaign's GM can create/edit/delete campaign (`owner_type='campaign'`) content**
- **Players consume content but cannot create or modify it**
- **Campaign queries return overrides first, then fall back to system entries**
- **Content can be copied between a GM's own campaigns** — always as independent copies

---

## Current Database Schema (28 Tables)

```sql
-- Core
users
  id, email (unique), username (unique), password_hash,
  is_admin (boolean, default false), created_at, updated_at

campaigns
  id, name, description, created_by (FK→users), created_at, updated_at

campaign_members
  id, campaign_id (FK→campaigns), user_id (FK→users),
  role ('gm' or 'player'), joined_at
  UNIQUE(campaign_id, user_id)

characters
  id, name, race, char_class, level, background, alignment,
  strength, dexterity, constitution, intelligence, wisdom, charisma,
  character_data (JSONB),   ← class-specific flexible data
  user_id (FK→users), campaign_id (FK→campaigns),
  is_visible_to_players (boolean), notes, created_at, updated_at

-- Player Reference Content (system + campaign ownership)
races
  id, name, description, ability_score_increases (JSON), size, speed,
  traits (JSON), languages (JSON), owner_type (ENUM), owner_id, created_at, updated_at

backgrounds
  id, name, description, skill_proficiencies (JSON), tool_proficiencies (JSON),
  languages (JSON), equipment (JSON), feature (JSON), characteristics (JSON),
  owner_type (ENUM), owner_id, created_at, updated_at

feats
  id, name, description, prerequisites (JSON), benefits (JSON),
  repeatable (boolean), source, owner_type (ENUM), owner_id, created_at, updated_at

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
  is_visible_to_players (boolean), created_at, updated_at

timeline_event_npcs                  ← junction: NPC linked to a timeline event
  id, event_id (FK→timeline_events CASCADE), npc_id (FK→npcs CASCADE),
  description, created_at
  UNIQUE(event_id, npc_id)

timeline_event_locations             ← junction: location linked to a timeline event
  id, event_id (FK→timeline_events CASCADE), location_id (FK→locations CASCADE),
  description, created_at
  UNIQUE(event_id, location_id)

loot_tables
  id, name, description, owner_type (string: 'system'/'campaign'),
  owner_id, loot_items (JSONB), created_at, updated_at

-- Encyclopedia (system-owned; campaign overrides use same tables with owner_type='campaign')
spells
  id, name, level, school, casting_time, range, components,
  duration, description, classes, owner_type (ENUM), owner_id, created_at, updated_at

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

### Characters
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/characters | Yes |
| GET | /api/characters/campaign/{id} | Yes (member) |
| GET | /api/characters/{id} | Yes (owner or GM) |
| PUT | /api/characters/{id} | Yes (owner) |
| DELETE | /api/characters/{id} | Yes (owner) |
| PATCH | /api/characters/{id}/visibility | Yes (GM of campaign) |

### Races / Backgrounds / Feats (same pattern each)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /races | Yes |
| GET | /races/{id} | Yes |
| POST | /races | Yes (admin for system; GM for campaign-scoped) |
| PUT | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
| DELETE | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
*(Replace `/races` with `/backgrounds` or `/feats` for those modules)*

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
| GET | /api/gm/campaigns/{id}/timeline | Yes (member; players see only visible events) |
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
- The existing `.css` files in `auth/`, `campaigns/`, `characters/`, `dashboard/`, `shared/` were written before Tailwind was added
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
│   ├── CampaignContext.jsx      # {campaign, enterCampaign, leaveCampaign}; persisted to localStorage
│   └── campaignService.js
├── characters/
│   ├── pages/CharacterList.jsx  # List characters, visibility toggle (GM) ✅
│   └── characterService.js
├── npcs/
│   ├── npcService.js            # Full API client: NPCs, relationships, player relationships, image upload
│   └── pages/
│       ├── NPCList.jsx          # Campaign NPC grid + create dialog + visibility toggle + player view ✅
│       └── NPCDetail.jsx        # Portrait upload, section cards with Save/Reset, relationships tabs ✅
├── locations/
│   ├── locationService.js       # Full API client: locations, maps, pins, relationships, location NPCs
│   └── pages/
│       ├── LocationList.jsx     # Campaign locations grid + create dialog + player view toggle ✅
│       └── LocationDetail.jsx   # Maps tab (upload, zoom, pins, player view) + Info tab ✅
├── dashboard/
│   └── Dashboard.jsx            # Overview cards — static placeholder data ⚠️
└── shared/
    └── components/
        ├── ProtectedRoute.jsx   # Redirects to /login if AuthContext user is null
        ├── ErrorBoundary.jsx    # Class component; wraps all routes in App.jsx; shows render error instead of blank page
        └── layout/
            ├── MainLayout.jsx   # Wraps pages with Sidebar + Header; reads from contexts
            ├── Header.jsx       # Campaign name (from CampaignContext) + user menu (from AuthContext)
            └── Sidebar.jsx      # Campaign-aware nav: uses useParams().campaignId for paths;
                                 #   GM vs player items from campaign.userRole; "Switch Campaign" link
```

### Auth + Campaign Context Pattern
- `AuthContext` — wraps the entire app; calls `/api/auth/me` on mount; `user` is null until resolved; exposes `setUser` so `Login` can update context without a page reload
- `CampaignContext` — `campaign` shape: `{id, name, description, created_by, userRole: 'gm'|'player', ...}`
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
| `/campaigns/:campaignId/settings` | CampaignSettings | ✅ Functional (GM only: Calendar + Timeline tabs) |
| `/campaigns/:campaignId/characters/create` | — | ❌ Not built |
| `/campaigns/:campaignId/characters/:id` | — | ❌ Not built |

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
- **Info tab sections:** Physical (age, gender, height, weight, appearance) | Personality (voice, traits, ideals, bonds, flaws, languages as removable tags) | Narrative (summary, description, backstory — labeled "Player visible") | GM Notes (amber-tinted "Private" card, GM only) | Location & Media (last known location select, last-seen notes, theme music URL with clickable link) | Combat Stats (freeform JSON textarea, GM only)
- **Player view:** all GM-only cards (GM Notes, Combat Stats, Player Relationships tab) hidden; all fields read-only; empty sections suppressed entirely
- **Relationships tab:** NPC-to-NPC list; related NPC name is a clickable link to their detail page; GM can add (select NPC + type + description) and delete
- **Player Relationships tab (GM only):** NPC-to-player list; populated from campaign members (players only); GM can add and delete
- **Language tags:** add via input + Enter or button, remove with × on each tag; stored as JSONB array
- **Last Known Location:** select from all campaign locations; in player view shows as a clickable link to that location's detail page
- **Portrait display note:** images are served via `app.mount("/uploads", StaticFiles(...))` in `main.py` — upload/delete/display are all functional

### Settings UI — Key Behaviours
- **Route:** `/campaigns/:campaignId/settings` — wrapped in `<MainLayout>` in App.jsx (not internally); GM-only controls; Settings link added to GM section of Sidebar
- **Calendar tab:** landing page (explainer + defaults bullet list + "Set Up Calendar" button) when 404; management UI when calendar exists
  - **General card:** calendar name, days_per_month, `use_weeks` toggle (ToggleLeft/ToggleRight icon), `days_per_week` input (shown only when `use_weeks=true`); Save button appears when dirty
  - **Seasons card:** inline editable list (click name to rename), add via input+Enter/button, delete with confirmation; deletion nullifies month assignments in local state
  - **Months card:** one row per month — ordinal (read-only), optional name input (placeholder "Month N" when blank), season select; Save button appears per row when dirty; `monthLabel()` helper returns name or "Month N"
  - **Weekdays card:** only shown when `use_weeks=true`; same add/edit/delete pattern as seasons; shows order_index as prefix
  - **Current Date card:** GM only; era select (sentinel `__none__`), year, month-ordinal select (showing `monthLabel()`), day inputs; saves via `PUT /calendar`
- **Timeline tab:** landing page (CSS era diagram + prose explanation + "Set Up Timeline" button) when no eras; full management UI when eras exist
  - **Era diagram:** renders styled divs showing `← [Before Era] 3·2·1 | 1·2·3·4 [Era] →` with "Year 1 meets Year 1 — no year zero" caption
  - **Eras card:** list with Primary/Current/direction/visibility badges; edit dialog (name, abbreviation, is_current, is_visible_to_players); visibility eye toggle; delete (blocked with error message if primary and others exist)
  - **Add Era dialog:** direction select (disabled/locked to ascending for first era), anchor era + anchor year fields (required when non-primary)
  - **Timeline Events card:** sorted list (backend order); each row is collapsible — shows title, `EraDateList` (year + abbreviation for each era_date), visibility badge; expand reveals description + linked NPCs/locations with add/remove + GM Notes amber card
  - **`EraDateList`:** renders `{year} {abbreviation}` for each era_date, separated by `·`
  - **GM Notes (timeline events):** amber-tinted "Private" card in the expanded EventDetail section; GM-only textarea with inline Save/Reset that appear when dirty; saves via `PUT /timeline/{event_id}` with `{ gm_notes }`. Stripped from all player-facing responses (list + detail). Never shown in player view.
  - **Event NPC/location links:** loaded on expand; GM sees add row (select + description + plus button); remove button per link
  - **Player view:** Add Era / Add Event buttons hidden; visibility toggles hidden; GM-only eras hidden from era list
  - **`settingsService.js`:** all calendar + timeline API methods; uses same axios pattern + token interceptor as npcService

### Frontend Not Yet Built
- Character creation and detail pages (`/campaigns/:campaignId/characters/create`, `/:id`)
- Loot table UI
- Encyclopedia browsing UI (players read campaign-merged view)
- Admin panels (manage base compendium: races, backgrounds, feats, spells, items, creatures)
- GM panels (campaign overrides + homebrew content management)
- Token refresh / expiration handling
- Dashboard with real data (`/campaigns/:campaignId/dashboard`)

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
├── test_campaigns.py               # campaign CRUD + member management
├── test_calendar_timeline.py       # calendar (6+2+3+4+8+7), timeline events (13), event links (6) = 49 tests
                                    #   TestCalendarCRUD(6), TestSeasons(2), TestMonths(3), TestMonthOptionalName(4),
                                    #   TestWeekdays(7), TestEras(8), TestTimelineEvents(13, incl. gm_notes), TestEventListFieldRoundTrip(8), TestEventLinks(6)
├── test_characters.py              # character CRUD + visibility
├── test_encyclopedia.py            # bestiary + spells + 6 item types (parametrized)
├── test_locations.py               # locations, maps, pins, location NPCs, hierarchy, pin→parent persistence (61 tests)
├── test_loot_tables.py             # loot tables (system/campaign ownership)
├── test_npcs.py                    # NPC CRUD, visibility, gm_notes stripping, image, relationships, player-relationships, last_known_location (36 tests)
└── test_races_backgrounds_feats.py # admin-only compendium (parametrized)
```

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
├── npcs/
│   └── pages/
│       ├── NPCDetail.jsx
│       ├── NPCDetail.test.jsx        # render smoke test, SelectItem regression, error state, GM vs player visibility (5 tests)
│       ├── NPCList.jsx
│       └── NPCList.test.jsx          # render, search (includes summary), location filter (unplaced + hierarchy subtree), sort, GM vs player view (10 tests)
├── locations/
│   └── pages/
│       ├── LocationList.jsx
│       └── LocationList.test.jsx     # campaignId prop regression (tree/card navigate), GM toolbar show/hide/navigate (5 tests)
├── settings/
│   └── pages/
│       ├── CalendarTab.jsx
│       ├── CalendarTab.test.jsx      # 404→landing, GM vs player landing, setup form, management UI, use_weeks toggle, Month N placeholder, seasons (14 tests)
│       ├── TimelineTab.jsx
│       └── TimelineTab.test.jsx      # no-eras landing (era diagram, prose, setup form), eras-exist (list, badges, GM controls), events (title, era_dates, visibility) (14 tests)
└── shared/
    └── components/
        ├── ProtectedRoute.jsx
        ├── ProtectedRoute.test.jsx   # loading/null/authenticated cases (3 tests)
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

`LocationList.test.jsx` — "clicking the top-level node navigates with the correct campaignId — not undefined" — guards against `LocationTreeNode` and `LocationCard` being module-level components that can't close over `useParams()`'s `campaignId`. Without the prop fix, all tree/card clicks navigate to `/campaigns/undefined/locations/X`.

`NPCList.test.jsx` — "filters by summary text" — guards against search only checking name/race/occupation and missing the summary field. "location filter includes NPCs at child locations" — guards the hierarchy-aware subtree walk that must follow both `parent_location_id` and `pin_child_ids`.

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

### Backend — Features Not Yet Started
- `gm/campaigns/campaign_tools/session_notes/` — Session notes (NPC session attendance will be a junction table here)
- Classes system (like races/backgrounds but for character classes)

### Frontend
- Everything listed in "Frontend Not Yet Built" above
- No token expiry handling
