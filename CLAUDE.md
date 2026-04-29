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
│   │       └── npcs/            # NPC management (campaign-specific)
│   └── tools/
│       └── loot_tables/         # Loot table generation (system + campaign)
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

## Current Database Schema (17 Tables)

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
  id, campaign_id (FK→campaigns), name, race, occupation, alignment,
  description, backstory, location, stats (JSONB), notes,
  is_visible_to_players (boolean), created_at, updated_at

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
├── App.jsx                      # Router: /login, /campaigns, /dashboard, /characters, /locations/*
├── index.css                    # Tailwind import + shadcn CSS variables (light/dark)
├── lib/
│   └── utils.js                 # cn() helper for class merging
├── components/
│   └── ui/                      # shadcn/ui components: Button, Card, Dialog, Input, Label,
│                                #   Badge, Textarea, Select, Tabs (do not edit)
├── auth/
│   ├── pages/Login.jsx          # Login + Register (dual-mode toggle) ✅
│   └── authService.js
├── campaigns/
│   ├── pages/CampaignSelection.jsx  # List campaigns, create modal (any user) ✅
│   └── campaignService.js
├── characters/
│   ├── pages/CharacterList.jsx  # List characters, visibility toggle (GM) ✅
│   └── characterService.js
├── locations/
│   ├── locationService.js       # Full API client: locations, maps, pins, relationships
│   └── pages/
│       ├── LocationList.jsx     # Campaign locations grid + create dialog + player view toggle ✅
│       └── LocationDetail.jsx   # Maps tab (upload, zoom, pins, player view) + Info tab (always editable) ✅
├── dashboard/
│   └── Dashboard.jsx            # Overview cards — static placeholder data ⚠️
└── shared/
    └── components/layout/
        ├── MainLayout.jsx        # Wraps pages with Header + Sidebar
        ├── Header.jsx
        └── Sidebar.jsx          # "Locations" nav item → /locations
```

### Implemented Routes
| Path | Component | Status |
|------|-----------|--------|
| `/login` | Login | ✅ Functional |
| `/campaigns` | CampaignSelection | ✅ Any authenticated user can create |
| `/dashboard` | Dashboard | ⚠️ Static (not fetching data) |
| `/characters` | CharacterList | ✅ Functional |
| `/locations` | LocationList | ✅ Functional |
| `/locations/:locationId` | LocationDetail | ✅ Functional |
| `/characters/create` | — | ❌ Not built |
| `/characters/:id` | — | ❌ Not built |

### Locations UI — Key Behaviours
- **Maps tab:** thumbnail strip (left) + scrollable map viewer (right) with zoom (+/−/scroll wheel) and dark background
- **Pins:** click to open tooltip (toggle), X to close; linked pins are blue and navigate to linked location
- **Pin dialog:** link to existing location OR create a new one inline
- **Player view toggle:** filters to `is_visible_to_players=true` locations/maps/pins; auto-selects first visible map
- **Info tab:** always editable (no pencil-mode toggle); Save/Reset buttons in each card
- **Map upload:** 100 MB limit; client-side size validation with inline error before upload attempt
- Maps default to `is_visible_to_players=false` — GM must explicitly show each map to players

### Frontend Not Yet Built
- Character creation and detail pages
- NPC management UI
- Loot table UI
- Encyclopedia browsing UI (players read campaign-merged view)
- Admin panels (manage base compendium: races, backgrounds, feats, spells, items, creatures)
- GM panels (campaign overrides + homebrew content management)
- AuthContext and CampaignContext providers
- Token refresh / expiration handling
- `/gm/campaigns/:id/dashboard` and all GM campaign views
- Active campaign context (switching between campaigns a user belongs to)

---

## Testing (Backend)

**Every new backend module MUST have a corresponding test file.** Tests are written before or alongside the feature, not after.

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
├── test_npcs.py                    # NPC CRUD + visibility
├── test_characters.py              # character CRUD + visibility
├── test_loot_tables.py             # loot tables (system/campaign ownership)
├── test_races_backgrounds_feats.py # admin-only compendium (parametrized)
├── test_encyclopedia.py            # bestiary + spells + 6 item types (parametrized)
└── test_locations.py               # locations, maps, pins (not yet written)
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

# Database
psql -U postgres -d dnd_app_dev
alembic revision --autogenerate -m "description"
alembic upgrade head
```

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
- `gm/campaigns/campaign_tools/session_notes/` — Session notes
- Classes system (like races/backgrounds but for character classes)
- `tests/test_locations.py` — Location/map/pin tests not yet written

### Frontend
- Everything listed in "Frontend Not Yet Built" above
- No context providers (AuthContext, CampaignContext)
- No protected route wrapper (currently no auth guard on routes)
- No token expiry handling
