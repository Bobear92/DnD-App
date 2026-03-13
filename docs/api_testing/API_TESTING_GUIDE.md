# D&D RPG API - Testing Guide

Complete guide for testing all API endpoints via Swagger UI.

**Base URL:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Campaigns](#campaigns)
4. [Characters](#characters)
5. [Encyclopedia - Bestiary](#encyclopedia---bestiary)
6. [Common Workflows](#common-workflows)
7. [Test Credentials](#test-credentials)

---

## Getting Started

### Start the Backend Server

```cmd
cd C:\Users\My PC\Documents\Projects\dnd-app\backend
venv\Scripts\activate
uvicorn main:app --reload
```

### Open Swagger UI

Navigate to: http://localhost:8000/docs

### Authorization

Most endpoints require authentication. After logging in:

1. Copy the `access_token` from the login response
2. Click the green **"Authorize"** button at the top right
3. Enter: `Bearer YOUR_TOKEN_HERE`
4. Click **Authorize**, then **Close**

---

## Authentication

### 1. Register a New User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123"
}
```

**Expected Response (201):**
```json
{
  "id": 5,
  "email": "newuser@example.com",
  "username": "newuser",
  "is_admin": false,
  "created_at": "2026-03-12T20:00:00-04:00"
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Admin Login:**
```json
{
  "email": "admin@dndapp.com",
  "password": "admin123"
}
```

**Player Login (Alice):**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**⚠️ Copy the `access_token` and use it to authorize!**

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "email": "admin@dndapp.com",
  "username": "admin",
  "is_admin": true,
  "created_at": "2026-03-01T10:00:00-04:00"
}
```

---

## Campaigns

**Note:** In V1, only admin can create and manage campaigns.

### 1. Create Campaign

**Endpoint:** `POST /api/gm/campaigns`

**Requires:** Admin authorization

**Request Body:**
```json
{
  "name": "Curse of Strahd",
  "description": "A gothic horror adventure in the land of Barovia"
}
```

**Expected Response (201):**
```json
{
  "id": 2,
  "name": "Curse of Strahd",
  "description": "A gothic horror adventure in the land of Barovia",
  "created_by": 1,
  "created_at": "2026-03-12T20:00:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Campaigns

**Endpoint:** `GET /api/gm/campaigns`

**Requires:** Authorization

**Response for Admin:** All campaigns  
**Response for Player:** Only campaigns they're a member of

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Dragon Heist Campaign",
    "description": "A thrilling adventure in Waterdeep",
    "created_by": 1,
    "created_at": "2026-03-01T10:00:00-04:00",
    "updated_at": null
  }
]
```

---

### 3. Get Campaign by ID

**Endpoint:** `GET /api/gm/campaigns/{id}`

**Example:** `/api/gm/campaigns/1`

**Requires:** Authorization (must be a member or admin)

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Dragon Heist Campaign",
  "description": "A thrilling adventure in Waterdeep",
  "created_by": 1,
  "members": [
    {
      "id": 1,
      "campaign_id": 1,
      "user_id": 1,
      "role": "gm",
      "joined_at": "2026-03-01T10:00:00-04:00",
      "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@dndapp.com"
      }
    },
    {
      "id": 2,
      "campaign_id": 1,
      "user_id": 2,
      "role": "player",
      "joined_at": "2026-03-01T10:30:00-04:00",
      "user": {
        "id": 2,
        "username": "alice",
        "email": "alice@example.com"
      }
    }
  ],
  "created_at": "2026-03-01T10:00:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Campaign

**Endpoint:** `PUT /api/gm/campaigns/{id}`

**Example:** `/api/gm/campaigns/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "name": "Dragon Heist - Updated",
  "description": "An updated description"
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Dragon Heist - Updated",
  "description": "An updated description",
  "created_by": 1,
  "created_at": "2026-03-01T10:00:00-04:00",
  "updated_at": "2026-03-12T20:30:00-04:00"
}
```

---

### 5. Delete Campaign

**Endpoint:** `DELETE /api/gm/campaigns/{id}`

**Example:** `/api/gm/campaigns/2`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Campaign deleted successfully"
}
```

---

### 6. Add Player to Campaign

**Endpoint:** `POST /api/gm/campaigns/{id}/players`

**Example:** `/api/gm/campaigns/1/players`

**Requires:** Admin authorization

**Request Body:**
```json
{
  "user_id": 3
}
```

**Expected Response (201):**
```json
{
  "id": 3,
  "campaign_id": 1,
  "user_id": 3,
  "role": "player",
  "joined_at": "2026-03-12T20:40:00-04:00",
  "user": {
    "id": 3,
    "username": "bob",
    "email": "bob@example.com"
  }
}
```

---

### 7. Remove Player from Campaign

**Endpoint:** `DELETE /api/gm/campaigns/{campaign_id}/players/{user_id}`

**Example:** `/api/gm/campaigns/1/players/3`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Player removed from campaign successfully"
}
```

---

## Characters

### 1. Create Character

**Endpoint:** `POST /api/characters`

**Requires:** Authorization (user must be a member of the campaign)

**Request Body:**
```json
{
  "name": "Thorin Ironforge",
  "race": "Dwarf",
  "char_class": "Fighter",
  "level": 3,
  "background": "Soldier",
  "alignment": "Lawful Good",
  "strength": 16,
  "dexterity": 12,
  "constitution": 15,
  "intelligence": 10,
  "wisdom": 13,
  "charisma": 8,
  "campaign_id": 1,
  "character_data": {
    "fighting_style": "Defense",
    "second_wind_used": false,
    "action_surge_used": false
  },
  "notes": "A grizzled veteran seeking redemption"
}
```

**Expected Response (201):**
```json
{
  "id": 2,
  "name": "Thorin Ironforge",
  "race": "Dwarf",
  "char_class": "Fighter",
  "level": 3,
  "background": "Soldier",
  "alignment": "Lawful Good",
  "strength": 16,
  "dexterity": 12,
  "constitution": 15,
  "intelligence": 10,
  "wisdom": 13,
  "charisma": 8,
  "character_data": {
    "fighting_style": "Defense",
    "second_wind_used": false,
    "action_surge_used": false
  },
  "user_id": 2,
  "campaign_id": 1,
  "is_visible_to_players": false,
  "notes": "A grizzled veteran seeking redemption",
  "created_at": "2026-03-12T21:00:00-04:00",
  "updated_at": null
}
```

---

### 2. Get Characters in Campaign

**Endpoint:** `GET /api/characters/campaign/{campaign_id}`

**Example:** `/api/characters/campaign/1`

**Requires:** Authorization (must be a member of the campaign)

**Returns:**
- **For Players:** Their own characters + characters with `is_visible_to_players: true`
- **For GM:** ALL characters in the campaign

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Elara Moonwhisper",
    "race": "High Elf",
    "char_class": "Wizard",
    "level": 2,
    "user_id": 2,
    "campaign_id": 1,
    "is_visible_to_players": true
  },
  {
    "id": 2,
    "name": "Thorin Ironforge",
    "race": "Dwarf",
    "char_class": "Fighter",
    "level": 3,
    "user_id": 2,
    "campaign_id": 1,
    "is_visible_to_players": false
  }
]
```

---

### 3. Get Specific Character

**Endpoint:** `GET /api/characters/{id}`

**Example:** `/api/characters/1`

**Requires:** Authorization (must be owner or GM)

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Elara Moonwhisper",
  "race": "High Elf",
  "char_class": "Wizard",
  "level": 2,
  "background": "Sage",
  "alignment": "Neutral Good",
  "strength": 8,
  "dexterity": 14,
  "constitution": 12,
  "intelligence": 16,
  "wisdom": 13,
  "charisma": 10,
  "character_data": {
    "spell_slots": {
      "1": 3
    },
    "spells_prepared": ["Magic Missile", "Shield", "Mage Armor"]
  },
  "user_id": 2,
  "campaign_id": 1,
  "is_visible_to_players": true,
  "notes": "A scholar seeking ancient knowledge",
  "created_at": "2026-03-01T11:00:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Character

**Endpoint:** `PUT /api/characters/{id}`

**Example:** `/api/characters/1`

**Requires:** Authorization (must be owner)

**Request Body (all fields optional):**
```json
{
  "level": 3,
  "character_data": {
    "spell_slots": {
      "1": 4,
      "2": 2
    },
    "spells_prepared": ["Magic Missile", "Shield", "Mage Armor", "Misty Step"]
  }
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Elara Moonwhisper",
  "level": 3,
  "character_data": {
    "spell_slots": {
      "1": 4,
      "2": 2
    },
    "spells_prepared": ["Magic Missile", "Shield", "Mage Armor", "Misty Step"]
  },
  "updated_at": "2026-03-12T21:15:00-04:00"
}
```

---

### 5. Delete Character

**Endpoint:** `DELETE /api/characters/{id}`

**Example:** `/api/characters/2`

**Requires:** Authorization (must be owner)

**Expected Response (200):**
```json
{
  "message": "Character deleted successfully"
}
```

---

### 6. Toggle Character Visibility

**Endpoint:** `PATCH /api/characters/{id}/visibility`

**Example:** `/api/characters/1/visibility`

**Requires:** GM authorization

**Request Body:**
```json
{
  "is_visible": true
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Elara Moonwhisper",
  "is_visible_to_players": true,
  "message": "Character visibility updated"
}
```

---

## Encyclopedia - Bestiary

### 1. Create Creature

**Endpoint:** `POST /api/encyclopedia/bestiary`

**Requires:** Admin authorization

**Request Body - Goblin:**
```json
{
  "name": "Goblin",
  "size": "Small",
  "type": "Humanoid",
  "alignment": "Neutral Evil",
  "challenge_rating": "1/4",
  "armor_class": 15,
  "hit_points": "7 (2d6)",
  "speed": "30 ft.",
  "strength": 8,
  "dexterity": 14,
  "constitution": 10,
  "intelligence": 10,
  "wisdom": 8,
  "charisma": 8,
  "description": "Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings."
}
```

**Request Body - Adult Red Dragon:**
```json
{
  "name": "Adult Red Dragon",
  "size": "Huge",
  "type": "Dragon",
  "alignment": "Chaotic Evil",
  "challenge_rating": "17",
  "armor_class": 19,
  "hit_points": "256 (19d12 + 133)",
  "speed": "40 ft., climb 40 ft., fly 80 ft.",
  "strength": 27,
  "dexterity": 10,
  "constitution": 25,
  "intelligence": 16,
  "wisdom": 13,
  "charisma": 21,
  "description": "The most covetous of the true dragons, red dragons tirelessly seek to increase their treasure hoards."
}
```

**Request Body - Owlbear:**
```json
{
  "name": "Owlbear",
  "size": "Large",
  "type": "Monstrosity",
  "alignment": "Unaligned",
  "challenge_rating": "3",
  "armor_class": 13,
  "hit_points": "59 (7d10 + 21)",
  "speed": "40 ft.",
  "strength": 20,
  "dexterity": 12,
  "constitution": 17,
  "intelligence": 3,
  "wisdom": 12,
  "charisma": 7,
  "description": "An owlbear's screech echoes through dark valleys and benighted forests, piercing the quiet of night."
}
```

**Expected Response (201):**
```json
{
  "name": "Goblin",
  "size": "Small",
  "type": "Humanoid",
  "alignment": "Neutral Evil",
  "challenge_rating": "1/4",
  "armor_class": 15,
  "hit_points": "7 (2d6)",
  "speed": "30 ft.",
  "strength": 8,
  "dexterity": 14,
  "constitution": 10,
  "intelligence": 10,
  "wisdom": 8,
  "charisma": 8,
  "description": "Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings.",
  "id": 1,
  "created_at": "2026-03-12T20:26:26-04:00",
  "updated_at": null
}
```

---

### 2. Get All Creatures

**Endpoint:** `GET /api/encyclopedia/bestiary`

**Requires:** Authorization

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Goblin",
    "size": "Small",
    "type": "Humanoid",
    "challenge_rating": "1/4"
  },
  {
    "id": 2,
    "name": "Owlbear",
    "size": "Large",
    "type": "Monstrosity",
    "challenge_rating": "3"
  }
]
```

---

### 3. Get Specific Creature

**Endpoint:** `GET /api/encyclopedia/bestiary/{id}`

**Example:** `/api/encyclopedia/bestiary/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Goblin",
  "size": "Small",
  "type": "Humanoid",
  "alignment": "Neutral Evil",
  "challenge_rating": "1/4",
  "armor_class": 15,
  "hit_points": "7 (2d6)",
  "speed": "30 ft.",
  "strength": 8,
  "dexterity": 14,
  "constitution": 10,
  "intelligence": 10,
  "wisdom": 8,
  "charisma": 8,
  "description": "Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings.",
  "created_at": "2026-03-12T20:26:26-04:00",
  "updated_at": null
}
```

---

### 4. Update Creature

**Endpoint:** `PUT /api/encyclopedia/bestiary/{id}`

**Example:** `/api/encyclopedia/bestiary/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "description": "Updated description for goblins with more lore details.",
  "armor_class": 16
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Goblin",
  "armor_class": 16,
  "description": "Updated description for goblins with more lore details.",
  "updated_at": "2026-03-12T21:30:00-04:00"
}
```

---

### 5. Delete Creature

**Endpoint:** `DELETE /api/encyclopedia/bestiary/{id}`

**Example:** `/api/encyclopedia/bestiary/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Creature 'Goblin' deleted successfully"
}
```

---

## Common Workflows

### Workflow 1: Admin Sets Up a New Campaign

1. **Login as admin** → `POST /api/auth/login`
2. **Authorize** with the token
3. **Create campaign** → `POST /api/gm/campaigns`
4. **Add players** → `POST /api/gm/campaigns/1/players` (repeat for each player)
5. **View campaign with members** → `GET /api/gm/campaigns/1`

---

### Workflow 2: Player Creates a Character

1. **Login as player** → `POST /api/auth/login` (use alice@example.com)
2. **Authorize** with the token
3. **Create character** → `POST /api/characters` (set campaign_id to 1)
4. **View all characters in campaign** → `GET /api/characters/campaign/1`

---

### Workflow 3: GM Makes Character Visible

1. **Login as admin** → `POST /api/auth/login`
2. **Authorize** with the token
3. **Toggle visibility** → `PATCH /api/characters/1/visibility` (set `is_visible: true`)
4. **Login as player** (different user)
5. **View campaign characters** → `GET /api/characters/campaign/1` (should now see the visible character)

---

### Workflow 4: Populate the Bestiary

1. **Login as admin** → `POST /api/auth/login`
2. **Authorize** with the token
3. **Create Goblin** → `POST /api/encyclopedia/bestiary`
4. **Create Owlbear** → `POST /api/encyclopedia/bestiary`
5. **Create Dragon** → `POST /api/encyclopedia/bestiary`
6. **View all creatures** → `GET /api/encyclopedia/bestiary`
7. **Login as player** (any user)
8. **View bestiary** → `GET /api/encyclopedia/bestiary` (players can read too!)

---

## Test Credentials

### Admin Account
- **Email:** admin@dndapp.com
- **Password:** admin123
- **Permissions:** Can create campaigns, manage players, create encyclopedia content

### Player Accounts

**Alice:**
- **Email:** alice@example.com
- **Password:** password123
- **Member of:** Dragon Heist Campaign (campaign_id: 1)

**Bob:**
- **Email:** bob@example.com
- **Password:** password123
- **Member of:** None (can be added by admin)

**Charlie:**
- **Email:** charlie@example.com
- **Password:** password123
- **Member of:** None (can be added by admin)

**Test User:**
- **Email:** testuser@example.com
- **Password:** test123
- **Member of:** None

---

## Quick Reference - All Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login and get token
- GET `/api/auth/me` - Get current user

### Campaigns (Admin Only for Create/Update/Delete)
- POST `/api/gm/campaigns` - Create campaign
- GET `/api/gm/campaigns` - List campaigns
- GET `/api/gm/campaigns/{id}` - Get campaign details
- PUT `/api/gm/campaigns/{id}` - Update campaign
- DELETE `/api/gm/campaigns/{id}` - Delete campaign
- POST `/api/gm/campaigns/{id}/players` - Add player
- DELETE `/api/gm/campaigns/{id}/players/{user_id}` - Remove player

### Characters
- POST `/api/characters` - Create character
- GET `/api/characters/campaign/{id}` - List characters in campaign
- GET `/api/characters/{id}` - Get character details
- PUT `/api/characters/{id}` - Update character
- DELETE `/api/characters/{id}` - Delete character
- PATCH `/api/characters/{id}/visibility` - Toggle visibility (GM only)

### Encyclopedia - Bestiary
- POST `/api/encyclopedia/bestiary` - Create creature (Admin only)
- GET `/api/encyclopedia/bestiary` - List all creatures
- GET `/api/encyclopedia/bestiary/{id}` - Get creature details
- PUT `/api/encyclopedia/bestiary/{id}` - Update creature (Admin only)
- DELETE `/api/encyclopedia/bestiary/{id}` - Delete creature (Admin only)

---

## Tips

- **Always authorize** after logging in by clicking the green "Authorize" button
- **Admin is required** for creating campaigns, managing players, and creating encyclopedia content
- **Players can only see** campaigns they're members of and characters they own or that are visible
- **JSONB character_data** field is flexible - store class-specific data like spell slots, ki points, etc.
- **Check pgAdmin** to see the actual database records after testing
- **Token expires** after 30 minutes - just login again if you get 401 errors

---

**Happy Testing! 🎲**