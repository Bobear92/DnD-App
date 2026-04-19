# D&D RPG Application — Project Context

## What This Is
A full-stack D&D campaign management app for players and Game Masters.
Solo developer project. Currently in V1 foundation phase.

- **Backend:** Python 3.12 + FastAPI — `backend/`
- **Frontend:** React (Vite) + Tailwind CSS v4 + shadcn/ui — `frontend/` ← IN PROGRESS
- **Database:** PostgreSQL (`dnd_app_dev`) + SQLAlchemy ORM + Alembic migrations
- **Auth:** JWT tokens via python-jose + bcrypt via passlib
- **Repo:** https://github.com/Bobear92/DnD-App

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
│   ├── dependencies.py          # get_db, get_current_user, require_admin
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

Many tables support both system-wide and campaign-specific content via `OwnerType`:

```python
class OwnerType(enum.Enum):
    system = "system"      # Admin-created base D&D content
    campaign = "campaign"  # GM-created custom content for a specific campaign
```

Tables using this model: `races`, `backgrounds`, `feats`, `loot_tables`
- System items: `owner_type='system'`, `owner_id=NULL` — visible to all
- Campaign items: `owner_type='campaign'`, `owner_id=campaign_id` — visible to that campaign

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

-- Encyclopedia (all system-only, admin-managed)
spells
  id, name (unique), level, school, casting_time, range, components,
  duration, description, classes, created_at, updated_at

creatures
  id, name (unique), size, type, alignment, challenge_rating, armor_class,
  hit_points, speed, strength/dex/con/int/wis/cha, description, created_at, updated_at

weapons
  id, name (unique), damage, damage_type, weight, cost, weapon_category,
  range, properties (JSON), description, created_at, updated_at

armor
  id, name (unique), armor_type, armor_class, cost, weight,
  strength_requirement, stealth_disadvantage, description, created_at, updated_at

adventuring_gear
  id, name (unique), category, cost, weight, description, created_at, updated_at

potions
  id, name (unique), rarity, effect, cost, description, created_at, updated_at

magic_items
  id, name (unique), item_type, rarity, attunement (boolean),
  description, created_at, updated_at

food_drink
  id, name (unique), category, item_type, cost, weight,
  description, created_at, updated_at
```

---

## V1 Business Rules (Enforce These Always)

- **Only `is_admin = true` users can create campaigns** — regular users cannot
- **Only admin can assign players to campaigns** — no self-service join
- **Players see ONLY campaigns they are assigned to** — cannot browse others
- **Each campaign has exactly ONE GM** — the admin who created it
- **Characters belong to ONE campaign** — no many-to-many in V1
- **Players see:** own characters + characters where `is_visible_to_players = true`
- **GM sees:** ALL characters in their campaign (read-only)
- **Unauthenticated users:** login/register pages only

---

## Critical Implementation Details

### JWT Tokens
- Store user_id as **STRING** in token: `data={'sub': str(user.id)}`
- Expiration: 30 minutes (configured in config.py)
- Import: use `HTTPAuthorizationCredentials` from `fastapi.security` (NOT `HTTPAuthCredentials`)

### bcrypt Warning
- bcrypt version mismatch warning is **harmless** — password hashing works correctly, ignore it

### Character Data (JSONB)
- `character_data` stores class-specific fields: spell slots, ki points, fighting style, etc.
- Structure varies by class — this is intentional and flexible by design

### Campaign Members
- `campaign_members` responses include nested user object: `{id, username, email}`
- User info is eagerly loaded with member relationships

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
| POST | /api/gm/campaigns | Yes (admin) |
| GET | /api/gm/campaigns | Yes |
| GET | /api/gm/campaigns/{id} | Yes |
| PUT | /api/gm/campaigns/{id} | Yes (admin) |
| DELETE | /api/gm/campaigns/{id} | Yes (admin) |
| POST | /api/gm/campaigns/{id}/players | Yes (admin) |
| DELETE | /api/gm/campaigns/{id}/players/{user_id} | Yes (admin) |

### Characters
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/characters | Yes |
| GET | /api/characters/campaign/{id} | Yes |
| GET | /api/characters/{id} | Yes |
| PUT | /api/characters/{id} | Yes (owner) |
| DELETE | /api/characters/{id} | Yes (owner) |
| PATCH | /api/characters/{id}/visibility | Yes (GM) |

### Races / Backgrounds / Feats (same pattern each)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /races | Yes |
| GET | /races/{id} | Yes |
| POST | /races | Yes (admin) |
| PUT | /races/{id} | Yes (admin) |
| DELETE | /races/{id} | Yes (admin) |
*(Replace `/races` with `/backgrounds` or `/feats` for those modules)*

### NPCs
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/campaigns/npcs | Yes (GM) |
| GET | /api/gm/campaigns/npcs/campaign/{id} | Yes |
| GET | /api/gm/campaigns/npcs/{id} | Yes |
| PUT | /api/gm/campaigns/npcs/{id} | Yes (GM) |
| DELETE | /api/gm/campaigns/npcs/{id} | Yes (GM) |
| PATCH | /api/gm/campaigns/npcs/{id}/visibility | Yes (GM) |

### Loot Tables
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/tools/loot-tables | Yes (admin/GM) |
| GET | /api/gm/tools/loot-tables | Yes |
| GET | /api/gm/tools/loot-tables/{id} | Yes |
| PUT | /api/gm/tools/loot-tables/{id} | Yes (admin/GM) |
| DELETE | /api/gm/tools/loot-tables/{id} | Yes (admin/GM) |

### Encyclopedia (Bestiary, Spells — same pattern; Items below)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /api/encyclopedia/bestiary | Yes |
| GET | /api/encyclopedia/bestiary/{id} | Yes |
| POST | /api/encyclopedia/bestiary | Yes (admin) |
| PUT | /api/encyclopedia/bestiary/{id} | Yes (admin) |
| DELETE | /api/encyclopedia/bestiary/{id} | Yes (admin) |
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
├── App.jsx                      # Router: /login, /campaigns, /dashboard, /characters
├── index.css                    # Tailwind import + shadcn CSS variables (light/dark)
├── lib/
│   └── utils.js                 # cn() helper for class merging
├── components/
│   └── ui/                      # shadcn/ui components (auto-generated, do not edit)
├── auth/
│   ├── pages/Login.jsx          # Login + Register (dual-mode toggle) ✅
│   └── authService.js           # register(), login(), logout(), getCurrentUser()
├── campaigns/
│   ├── pages/CampaignSelection.jsx  # List campaigns, create modal (admin only) ✅
│   └── campaignService.js
├── characters/
│   ├── pages/CharacterList.jsx  # List characters, visibility toggle (GM) ✅
│   └── characterService.js
├── dashboard/
│   └── Dashboard.jsx            # Overview cards — static placeholder data ⚠️
└── shared/
    └── components/layout/
        ├── MainLayout.jsx        # Wraps pages with Header + Sidebar
        ├── Header.jsx
        └── Sidebar.jsx
```

### Implemented Routes
| Path | Component | Status |
|------|-----------|--------|
| `/login` | Login | ✅ Functional |
| `/campaigns` | CampaignSelection | ✅ Functional |
| `/dashboard` | Dashboard | ⚠️ Static (not fetching data) |
| `/characters` | CharacterList | ✅ Functional |
| `/characters/create` | — | ❌ Not built |
| `/characters/:id` | — | ❌ Not built |

### Frontend Not Yet Built
- Character creation and detail pages
- NPC management UI
- Loot table UI
- Encyclopedia browsing/editing UI
- Admin panels (manage races, backgrounds, feats, spells, items, creatures)
- AuthContext and CampaignContext providers
- Token refresh / expiration handling
- `/gm/campaigns/:id/dashboard` and all GM views

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

### Backend
- `gm/campaigns/campaign_tools/locations/` — Locations system
- `gm/campaigns/campaign_tools/session_notes/` — Session notes
- Classes system (like races/backgrounds but for character classes)
- No automated tests (`tests/` directory not yet created)

### Frontend
- Everything listed in "Frontend Not Yet Built" above
- No context providers (AuthContext, CampaignContext)
- No protected route wrapper (currently no auth guard on routes)
- No token expiry handling
