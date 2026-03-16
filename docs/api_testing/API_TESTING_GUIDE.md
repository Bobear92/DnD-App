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
6. [Encyclopedia - Spells](#encyclopedia---spells)
7. [Encyclopedia - Items - Armor](#encyclopedia---items---armor)
8. [Encyclopedia - Items - Weapons](#encyclopedia---items---weapons)
9. [Encyclopedia - Items - Adventuring Gear](#encyclopedia---items---adventuring-gear)
10. [Encyclopedia - Items - Potions](#encyclopedia---items---potions)
11. [Encyclopedia - Items - Food/Drink](#encyclopedia---items---fooddrink)
12. [Encyclopedia - Items - Magic Items](#encyclopedia---items---magic-items)
13. [GM Tools - Loot Tables](#gm-tools---loot-tables)
14. [GM Campaign Tools - NPCs](#gm-campaign-tools---npcs)
15. [Common Workflows](#common-workflows)
16. [Test Credentials](#test-credentials)

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

## Encyclopedia - Spells

### 1. Create Spell

**Endpoint:** `POST /api/encyclopedia/spells`

**Requires:** Admin authorization

**Request Body - Fireball:**
```json
{
  "name": "Fireball",
  "level": 3,
  "school": "Evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": "V, S, M (a tiny ball of bat guano and sulfur)",
  "duration": "Instantaneous",
  "description": "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
  "classes": "Sorcerer, Wizard"
}
```

**Request Body - Magic Missile:**
```json
{
  "name": "Magic Missile",
  "level": 1,
  "school": "Evocation",
  "casting_time": "1 action",
  "range": "120 feet",
  "components": "V, S",
  "duration": "Instantaneous",
  "description": "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.",
  "classes": "Sorcerer, Wizard"
}
```

**Expected Response (201):**
```json
{
  "name": "Fireball",
  "level": 3,
  "school": "Evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": "V, S, M (a tiny ball of bat guano and sulfur)",
  "duration": "Instantaneous",
  "description": "A bright streak flashes from your pointing finger...",
  "classes": "Sorcerer, Wizard",
  "id": 1,
  "created_at": "2026-03-15T12:00:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Spells

**Endpoint:** `GET /api/encyclopedia/spells`

**Requires:** Authorization

**Note:** Spells are sorted by level, then name

**Expected Response (200):**
```json
[
  {
    "id": 2,
    "name": "Magic Missile",
    "level": 1,
    "school": "Evocation"
  },
  {
    "id": 1,
    "name": "Fireball",
    "level": 3,
    "school": "Evocation"
  }
]
```

---

### 3. Get Specific Spell

**Endpoint:** `GET /api/encyclopedia/spells/{id}`

**Example:** `/api/encyclopedia/spells/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Fireball",
  "level": 3,
  "school": "Evocation",
  "casting_time": "1 action",
  "range": "150 feet",
  "components": "V, S, M (a tiny ball of bat guano and sulfur)",
  "duration": "Instantaneous",
  "description": "A bright streak flashes from your pointing finger...",
  "classes": "Sorcerer, Wizard",
  "created_at": "2026-03-15T12:00:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Spell

**Endpoint:** `PUT /api/encyclopedia/spells/{id}`

**Example:** `/api/encyclopedia/spells/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "description": "Updated spell description with more detail about area effects."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Fireball",
  "description": "Updated spell description with more detail about area effects.",
  "updated_at": "2026-03-15T12:30:00-04:00"
}
```

---

### 5. Delete Spell

**Endpoint:** `DELETE /api/encyclopedia/spells/{id}`

**Example:** `/api/encyclopedia/spells/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Spell 'Fireball' deleted successfully"
}
```

---

## Encyclopedia - Items - Armor

### 1. Create Armor

**Endpoint:** `POST /api/encyclopedia/items/armor`

**Requires:** Admin authorization

**Request Body - Plate Armor:**
```json
{
  "name": "Plate Armor",
  "armor_type": "Heavy",
  "armor_class": "18",
  "cost": "1500 gp",
  "weight": "65 lb",
  "strength_requirement": 15,
  "stealth_disadvantage": true,
  "description": "Plate consists of shaped, interlocking metal plates to cover the entire body. A suit of plate includes gauntlets, heavy leather boots, a visored helmet, and thick layers of padding underneath the armor."
}
```

**Request Body - Leather Armor:**
```json
{
  "name": "Leather Armor",
  "armor_type": "Light",
  "armor_class": "11 + Dex modifier",
  "cost": "10 gp",
  "weight": "10 lb",
  "strength_requirement": null,
  "stealth_disadvantage": false,
  "description": "The breastplate and shoulder protectors of this armor are made of leather that has been stiffened by being boiled in oil."
}
```

**Expected Response (201):**
```json
{
  "name": "Plate Armor",
  "armor_type": "Heavy",
  "armor_class": "18",
  "cost": "1500 gp",
  "weight": "65 lb",
  "strength_requirement": 15,
  "stealth_disadvantage": true,
  "description": "Plate consists of shaped, interlocking metal plates to cover the entire body...",
  "id": 1,
  "created_at": "2026-03-15T12:15:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Armor

**Endpoint:** `GET /api/encyclopedia/items/armor`

**Requires:** Authorization

**Note:** Armor is sorted by armor_type, then name

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Plate Armor",
    "armor_type": "Heavy",
    "armor_class": "18"
  }
]
```

---

### 3. Get Specific Armor

**Endpoint:** `GET /api/encyclopedia/items/armor/{id}`

**Example:** `/api/encyclopedia/items/armor/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Plate Armor",
  "armor_type": "Heavy",
  "armor_class": "18",
  "cost": "1500 gp",
  "weight": "65 lb",
  "strength_requirement": 15,
  "stealth_disadvantage": true,
  "description": "Plate consists of shaped, interlocking metal plates to cover the entire body...",
  "created_at": "2026-03-15T12:15:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Armor

**Endpoint:** `PUT /api/encyclopedia/items/armor/{id}`

**Example:** `/api/encyclopedia/items/armor/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "cost": "1600 gp",
  "description": "Updated description for plate armor."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Plate Armor",
  "cost": "1600 gp",
  "description": "Updated description for plate armor.",
  "updated_at": "2026-03-15T12:45:00-04:00"
}
```

---

### 5. Delete Armor

**Endpoint:** `DELETE /api/encyclopedia/items/armor/{id}`

**Example:** `/api/encyclopedia/items/armor/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Armor 'Plate Armor' deleted successfully"
}
```

---

## Encyclopedia - Items - Weapons

### 1. Create Weapon

**Endpoint:** `POST /api/encyclopedia/items/weapons`

**Requires:** Admin authorization

**Request Body - Longsword:**
```json
{
  "name": "Longsword",
  "weapon_category": "Martial",
  "weapon_type": "Melee",
  "damage": "1d8",
  "damage_type": "Slashing",
  "properties": "Versatile (1d10)",
  "cost": "15 gp",
  "weight": "3 lb",
  "description": "A longsword is a versatile blade favored by many warriors for its balance of reach and power."
}
```

**Request Body - Shortbow:**
```json
{
  "name": "Shortbow",
  "weapon_category": "Simple",
  "weapon_type": "Ranged",
  "damage": "1d6",
  "damage_type": "Piercing",
  "properties": "Ammunition (range 80/320), Two-Handed",
  "cost": "25 gp",
  "weight": "2 lb",
  "description": "A shortbow is a compact ranged weapon ideal for hunters and skirmishers."
}
```

**Expected Response (201):**
```json
{
  "name": "Longsword",
  "weapon_category": "Martial",
  "weapon_type": "Melee",
  "damage": "1d8",
  "damage_type": "Slashing",
  "properties": "Versatile (1d10)",
  "cost": "15 gp",
  "weight": "3 lb",
  "description": "A longsword is a versatile blade favored by many warriors for its balance of reach and power.",
  "id": 1,
  "created_at": "2026-03-15T12:30:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Weapons

**Endpoint:** `GET /api/encyclopedia/items/weapons`

**Requires:** Authorization

**Note:** Weapons are sorted by weapon_category, then name

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Longsword",
    "weapon_category": "Martial",
    "weapon_type": "Melee",
    "damage": "1d8"
  }
]
```

---

### 3. Get Specific Weapon

**Endpoint:** `GET /api/encyclopedia/items/weapons/{id}`

**Example:** `/api/encyclopedia/items/weapons/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Longsword",
  "weapon_category": "Martial",
  "weapon_type": "Melee",
  "damage": "1d8",
  "damage_type": "Slashing",
  "properties": "Versatile (1d10)",
  "cost": "15 gp",
  "weight": "3 lb",
  "description": "A longsword is a versatile blade favored by many warriors for its balance of reach and power.",
  "created_at": "2026-03-15T12:30:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Weapon

**Endpoint:** `PUT /api/encyclopedia/items/weapons/{id}`

**Example:** `/api/encyclopedia/items/weapons/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "cost": "20 gp",
  "description": "Updated description for longsword."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Longsword",
  "cost": "20 gp",
  "description": "Updated description for longsword.",
  "updated_at": "2026-03-15T13:00:00-04:00"
}
```

---

### 5. Delete Weapon

**Endpoint:** `DELETE /api/encyclopedia/items/weapons/{id}`

**Example:** `/api/encyclopedia/items/weapons/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Weapon 'Longsword' deleted successfully"
}
```

---

## Encyclopedia - Items - Adventuring Gear

### 1. Create Adventuring Gear

**Endpoint:** `POST /api/encyclopedia/items/adventuring-gear`

**Requires:** Admin authorization

**Request Body - Rope:**
```json
{
  "name": "Rope, Hempen (50 feet)",
  "category": "Climbing Gear",
  "cost": "1 gp",
  "weight": "10 lb",
  "quantity": "50 feet",
  "description": "Rope, whether made of hemp or silk, has 2 hit points and can be burst with a DC 17 Strength check. Hempen rope is sturdy and versatile, useful for climbing, binding, and securing."
}
```

**Request Body - Torch:**
```json
{
  "name": "Torch",
  "category": "Light Sources",
  "cost": "1 cp",
  "weight": "1 lb",
  "quantity": "1 torch",
  "description": "A torch burns for 1 hour, providing bright light in a 20-foot radius and dim light for an additional 20 feet."
}
```

**Expected Response (201):**
```json
{
  "name": "Rope, Hempen (50 feet)",
  "category": "Climbing Gear",
  "cost": "1 gp",
  "weight": "10 lb",
  "quantity": "50 feet",
  "description": "Rope, whether made of hemp or silk, has 2 hit points and can be burst with a DC 17 Strength check...",
  "id": 1,
  "created_at": "2026-03-15T12:42:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Adventuring Gear

**Endpoint:** `GET /api/encyclopedia/items/adventuring-gear`

**Requires:** Authorization

**Note:** Gear is sorted by category, then name

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Rope, Hempen (50 feet)",
    "category": "Climbing Gear",
    "cost": "1 gp"
  }
]
```

---

### 3. Get Specific Adventuring Gear

**Endpoint:** `GET /api/encyclopedia/items/adventuring-gear/{id}`

**Example:** `/api/encyclopedia/items/adventuring-gear/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Rope, Hempen (50 feet)",
  "category": "Climbing Gear",
  "cost": "1 gp",
  "weight": "10 lb",
  "quantity": "50 feet",
  "description": "Rope, whether made of hemp or silk, has 2 hit points and can be burst with a DC 17 Strength check...",
  "created_at": "2026-03-15T12:42:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Adventuring Gear

**Endpoint:** `PUT /api/encyclopedia/items/adventuring-gear/{id}`

**Example:** `/api/encyclopedia/items/adventuring-gear/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "cost": "1.5 gp",
  "description": "Updated description for hempen rope."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Rope, Hempen (50 feet)",
  "cost": "1.5 gp",
  "description": "Updated description for hempen rope.",
  "updated_at": "2026-03-15T13:15:00-04:00"
}
```

---

### 5. Delete Adventuring Gear

**Endpoint:** `DELETE /api/encyclopedia/items/adventuring-gear/{id}`

**Example:** `/api/encyclopedia/items/adventuring-gear/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Adventuring gear 'Rope, Hempen (50 feet)' deleted successfully"
}
```

---

## Encyclopedia - Items - Potions

### 1. Create Potion

**Endpoint:** `POST /api/encyclopedia/items/potions`

**Requires:** Admin authorization

**Request Body - Potion of Healing:**
```json
{
  "name": "Potion of Healing",
  "rarity": "Common",
  "effect": "Restores 2d4+2 hit points",
  "duration": "Instantaneous",
  "cost": "50 gp",
  "weight": "0.5 lb",
  "description": "A character who drinks the magical red fluid in this vial regains hit points. Whatever its potency, the potion's red liquid glimmers when agitated."
}
```

**Request Body - Potion of Invisibility:**
```json
{
  "name": "Potion of Invisibility",
  "rarity": "Very Rare",
  "effect": "Become invisible for 1 hour",
  "duration": "1 hour",
  "cost": "5000 gp",
  "weight": "0.5 lb",
  "description": "When you drink this potion, you become invisible for 1 hour. Anything you wear or carry is invisible with you. The effect ends early if you attack or cast a spell."
}
```

**Expected Response (201):**
```json
{
  "name": "Potion of Healing",
  "rarity": "Common",
  "effect": "Restores 2d4+2 hit points",
  "duration": "Instantaneous",
  "cost": "50 gp",
  "weight": "0.5 lb",
  "description": "A character who drinks the magical red fluid in this vial regains hit points...",
  "id": 1,
  "created_at": "2026-03-15T17:22:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Potions

**Endpoint:** `GET /api/encyclopedia/items/potions`

**Requires:** Authorization

**Note:** Potions are sorted by rarity, then name

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Potion of Healing",
    "rarity": "Common",
    "effect": "Restores 2d4+2 hit points"
  }
]
```

---

### 3. Get Specific Potion

**Endpoint:** `GET /api/encyclopedia/items/potions/{id}`

**Example:** `/api/encyclopedia/items/potions/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Potion of Healing",
  "rarity": "Common",
  "effect": "Restores 2d4+2 hit points",
  "duration": "Instantaneous",
  "cost": "50 gp",
  "weight": "0.5 lb",
  "description": "A character who drinks the magical red fluid in this vial regains hit points...",
  "created_at": "2026-03-15T17:22:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Potion

**Endpoint:** `PUT /api/encyclopedia/items/potions/{id}`

**Example:** `/api/encyclopedia/items/potions/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "cost": "60 gp",
  "description": "Updated description for potion of healing."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Potion of Healing",
  "cost": "60 gp",
  "description": "Updated description for potion of healing.",
  "updated_at": "2026-03-15T17:45:00-04:00"
}
```

---

### 5. Delete Potion

**Endpoint:** `DELETE /api/encyclopedia/items/potions/{id}`

**Example:** `/api/encyclopedia/items/potions/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Potion 'Potion of Healing' deleted successfully"
}
```

---

## Encyclopedia - Items - Food/Drink

### 1. Create Food/Drink

**Endpoint:** `POST /api/encyclopedia/items/food-drink`

**Requires:** Admin authorization

**Request Body - Rations:**
```json
{
  "name": "Rations (1 day)",
  "item_type": "Food",
  "category": "Rations",
  "cost": "5 sp",
  "weight": "2 lb",
  "quantity": "1 day",
  "effect": "Provides sustenance for 1 day",
  "description": "Rations consist of dry foods suitable for extended travel, including jerky, dried fruit, hardtack, and nuts."
}
```

**Request Body - Ale:**
```json
{
  "name": "Ale (gallon)",
  "item_type": "Drink",
  "category": "Ale/Wine",
  "cost": "2 sp",
  "weight": "8 lb",
  "quantity": "1 gallon",
  "effect": null,
  "description": "A standard tavern drink, ale is often served in tankards or pitchers."
}
```

**Expected Response (201):**
```json
{
  "name": "Rations (1 day)",
  "item_type": "Food",
  "category": "Rations",
  "cost": "5 sp",
  "weight": "2 lb",
  "quantity": "1 day",
  "effect": "Provides sustenance for 1 day",
  "description": "Rations consist of dry foods suitable for extended travel...",
  "id": 1,
  "created_at": "2026-03-15T17:33:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Food/Drink

**Endpoint:** `GET /api/encyclopedia/items/food-drink`

**Requires:** Authorization

**Note:** Food/Drink is sorted by item_type, category, then name

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Rations (1 day)",
    "item_type": "Food",
    "category": "Rations"
  }
]
```

---

### 3. Get Specific Food/Drink

**Endpoint:** `GET /api/encyclopedia/items/food-drink/{id}`

**Example:** `/api/encyclopedia/items/food-drink/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Rations (1 day)",
  "item_type": "Food",
  "category": "Rations",
  "cost": "5 sp",
  "weight": "2 lb",
  "quantity": "1 day",
  "effect": "Provides sustenance for 1 day",
  "description": "Rations consist of dry foods suitable for extended travel...",
  "created_at": "2026-03-15T17:33:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Food/Drink

**Endpoint:** `PUT /api/encyclopedia/items/food-drink/{id}`

**Example:** `/api/encyclopedia/items/food-drink/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "cost": "6 sp",
  "description": "Updated description for rations."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Rations (1 day)",
  "cost": "6 sp",
  "description": "Updated description for rations.",
  "updated_at": "2026-03-15T18:00:00-04:00"
}
```

---

### 5. Delete Food/Drink

**Endpoint:** `DELETE /api/encyclopedia/items/food-drink/{id}`

**Example:** `/api/encyclopedia/items/food-drink/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Food/Drink 'Rations (1 day)' deleted successfully"
}
```

---

## Encyclopedia - Items - Magic Items

### 1. Create Magic Item

**Endpoint:** `POST /api/encyclopedia/items/magic-items`

**Requires:** Admin authorization

**Request Body - Bag of Holding:**
```json
{
  "name": "Bag of Holding",
  "item_type": "Wondrous Item",
  "rarity": "Uncommon",
  "attunement_required": false,
  "effect": "This bag has an interior space considerably larger than its outside dimensions. The bag can hold up to 500 pounds, not exceeding a volume of 64 cubic feet. The bag weighs 15 pounds, regardless of its contents. Retrieving an item from the bag requires an action.",
  "cost": "500 gp",
  "weight": "15 lb",
  "description": "This bag appears to be a common cloth sack about 2 feet by 4 feet in size. The bag of holding opens into a nondimensional space: its inside is larger than its outside dimensions."
}
```

**Request Body - Ring of Protection:**
```json
{
  "name": "Ring of Protection",
  "item_type": "Ring",
  "rarity": "Rare",
  "attunement_required": true,
  "effect": "You gain a +1 bonus to AC and saving throws while wearing this ring.",
  "cost": "3000 gp",
  "weight": null,
  "description": "A simple silver ring that radiates protective magic."
}
```

**Expected Response (201):**
```json
{
  "name": "Bag of Holding",
  "item_type": "Wondrous Item",
  "rarity": "Uncommon",
  "attunement_required": false,
  "effect": "This bag has an interior space considerably larger than its outside dimensions...",
  "cost": "500 gp",
  "weight": "15 lb",
  "description": "This bag appears to be a common cloth sack about 2 feet by 4 feet in size...",
  "id": 1,
  "created_at": "2026-03-15T17:44:00-04:00",
  "updated_at": null
}
```

---

### 2. Get All Magic Items

**Endpoint:** `GET /api/encyclopedia/items/magic-items`

**Requires:** Authorization

**Note:** Magic Items are sorted by rarity, then name

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Bag of Holding",
    "item_type": "Wondrous Item",
    "rarity": "Uncommon"
  }
]
```

---

### 3. Get Specific Magic Item

**Endpoint:** `GET /api/encyclopedia/items/magic-items/{id}`

**Example:** `/api/encyclopedia/items/magic-items/1`

**Requires:** Authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Bag of Holding",
  "item_type": "Wondrous Item",
  "rarity": "Uncommon",
  "attunement_required": false,
  "effect": "This bag has an interior space considerably larger than its outside dimensions...",
  "cost": "500 gp",
  "weight": "15 lb",
  "description": "This bag appears to be a common cloth sack about 2 feet by 4 feet in size...",
  "created_at": "2026-03-15T17:44:00-04:00",
  "updated_at": null
}
```

---

### 4. Update Magic Item

**Endpoint:** `PUT /api/encyclopedia/items/magic-items/{id}`

**Example:** `/api/encyclopedia/items/magic-items/1`

**Requires:** Admin authorization

**Request Body (all fields optional):**
```json
{
  "cost": "550 gp",
  "description": "Updated description for Bag of Holding."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Bag of Holding",
  "cost": "550 gp",
  "description": "Updated description for Bag of Holding.",
  "updated_at": "2026-03-15T18:15:00-04:00"
}
```

---

### 5. Delete Magic Item

**Endpoint:** `DELETE /api/encyclopedia/items/magic-items/{id}`

**Example:** `/api/encyclopedia/items/magic-items/1`

**Requires:** Admin authorization

**Expected Response (200):**
```json
{
  "message": "Magic item 'Bag of Holding' deleted successfully"
}
```

---

## GM Tools - Loot Tables

### 1. Create Loot Table (System)

**Endpoint:** `POST /api/gm/tools/loot-tables`

**Requires:** Admin authorization (for system tables)

**Request Body - System Loot Table:**
```json
{
  "name": "Challenge 0-4 Individual Treasure",
  "description": "Individual treasure for monsters with CR 0-4",
  "owner_type": "system",
  "owner_id": null,
  "loot_items": {
    "currency": {
      "copper": "5d6",
      "silver": "2d6",
      "electrum": "0",
      "gold": "1d4",
      "platinum": "0"
    },
    "items": [
      {
        "item": "Potion of Healing",
        "quantity": 1,
        "probability": 0.3
      },
      {
        "item": "Common Magic Item",
        "quantity": 1,
        "probability": 0.1
      }
    ]
  }
}
```

**Expected Response (201):**
```json
{
  "name": "Challenge 0-4 Individual Treasure",
  "description": "Individual treasure for monsters with CR 0-4",
  "owner_type": "system",
  "owner_id": null,
  "loot_items": {
    "currency": {
      "copper": "5d6",
      "silver": "2d6",
      "electrum": "0",
      "gold": "1d4",
      "platinum": "0"
    },
    "items": [
      {
        "item": "Potion of Healing",
        "quantity": 1,
        "probability": 0.3
      }
    ]
  },
  "id": 1,
  "created_at": "2026-03-15T21:26:00-04:00",
  "updated_at": null
}
```

---

### 2. Create Loot Table (Campaign)

**Endpoint:** `POST /api/gm/tools/loot-tables`

**Requires:** GM authorization (for campaign tables)

**Request Body - Campaign Loot Table:**
```json
{
  "name": "Dragon Heist - Goblin Cave Loot",
  "description": "Custom loot for the goblin cave in our Dragon Heist campaign",
  "owner_type": "campaign",
  "owner_id": 1,
  "loot_items": {
    "currency": {
      "copper": "10d6",
      "silver": "5d6",
      "gold": "2d4"
    },
    "items": [
      {
        "item": "Rusty Shortsword",
        "quantity": 2,
        "probability": 0.8
      },
      {
        "item": "Healing Potion",
        "quantity": 1,
        "probability": 0.5
      },
      {
        "item": "Mysterious Key",
        "quantity": 1,
        "probability": 1.0
      }
    ]
  }
}
```

**Expected Response (201):**
```json
{
  "name": "Dragon Heist - Goblin Cave Loot",
  "description": "Custom loot for the goblin cave in our Dragon Heist campaign",
  "owner_type": "campaign",
  "owner_id": 1,
  "loot_items": {
    "currency": {
      "copper": "10d6",
      "silver": "5d6",
      "gold": "2d4"
    },
    "items": [
      {
        "item": "Rusty Shortsword",
        "quantity": 2,
        "probability": 0.8
      }
    ]
  },
  "id": 2,
  "created_at": "2026-03-15T21:27:00-04:00",
  "updated_at": null
}
```

---

### 3. Get All Loot Tables

**Endpoint:** `GET /api/gm/tools/loot-tables`

**Requires:** Authorization

**Returns:** System loot tables + campaign loot tables for campaigns the user is a member of

**Expected Response (200):**
```json
[
  {
    "id": 2,
    "name": "Dragon Heist - Goblin Cave Loot",
    "owner_type": "campaign",
    "owner_id": 1
  },
  {
    "id": 1,
    "name": "Challenge 0-4 Individual Treasure",
    "owner_type": "system",
    "owner_id": null
  }
]
```

---

### 4. Get Specific Loot Table

**Endpoint:** `GET /api/gm/tools/loot-tables/{id}`

**Example:** `/api/gm/tools/loot-tables/1`

**Requires:** Authorization (must have permission to view)

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Challenge 0-4 Individual Treasure",
  "description": "Individual treasure for monsters with CR 0-4",
  "owner_type": "system",
  "owner_id": null,
  "loot_items": {
    "currency": {
      "copper": "5d6",
      "silver": "2d6",
      "electrum": "0",
      "gold": "1d4",
      "platinum": "0"
    },
    "items": [
      {
        "item": "Potion of Healing",
        "quantity": 1,
        "probability": 0.3
      }
    ]
  },
  "created_at": "2026-03-15T21:26:00-04:00",
  "updated_at": null
}
```

---

### 5. Update Loot Table

**Endpoint:** `PUT /api/gm/tools/loot-tables/{id}`

**Example:** `/api/gm/tools/loot-tables/2`

**Requires:** Admin (for system tables) or GM (for campaign tables)

**Request Body (all fields optional):**
```json
{
  "description": "Updated description for the goblin cave loot",
  "loot_items": {
    "currency": {
      "copper": "15d6",
      "silver": "5d6",
      "gold": "2d4"
    },
    "items": [
      {
        "item": "Rusty Shortsword",
        "quantity": 2,
        "probability": 0.8
      },
      {
        "item": "Healing Potion",
        "quantity": 2,
        "probability": 0.6
      }
    ]
  }
}
```

**Expected Response (200):**
```json
{
  "id": 2,
  "name": "Dragon Heist - Goblin Cave Loot",
  "description": "Updated description for the goblin cave loot",
  "loot_items": {
    "currency": {
      "copper": "15d6"
    }
  },
  "updated_at": "2026-03-15T21:50:00-04:00"
}
```

---

### 6. Delete Loot Table

**Endpoint:** `DELETE /api/gm/tools/loot-tables/{id}`

**Example:** `/api/gm/tools/loot-tables/2`

**Requires:** Admin (for system tables) or GM (for campaign tables)

**Expected Response (200):**
```json
{
  "message": "Loot table 'Dragon Heist - Goblin Cave Loot' deleted successfully"
}
```

---

## GM Campaign Tools - NPCs

### 1. Create NPC

**Endpoint:** `POST /api/gm/campaigns/npcs`

**Requires:** GM authorization

**Request Body - Grizznak the Goblin:**
```json
{
  "campaign_id": 1,
  "name": "Grizznak the Goblin Chief",
  "race": "Goblin",
  "occupation": "Tribal Chief",
  "alignment": "Chaotic Evil",
  "description": "A scarred goblin with one missing ear and a crude iron crown. His yellow eyes gleam with cunning and malice.",
  "backstory": "Grizznak rose to power by poisoning the previous chief. He rules through fear and has been raiding nearby villages for supplies.",
  "location": "Goblin Cave - Northern Mountains",
  "stats": {
    "armor_class": 15,
    "hit_points": 27,
    "challenge_rating": 1
  },
  "notes": "Will flee if reduced to below 10 HP. Knows the location of a hidden treasure.",
  "is_visible_to_players": false
}
```

**Request Body - Elara the Shopkeeper:**
```json
{
  "campaign_id": 1,
  "name": "Elara Brightwind",
  "race": "Half-Elf",
  "occupation": "Shopkeeper",
  "alignment": "Neutral Good",
  "description": "A friendly middle-aged shopkeeper with kind eyes and a welcoming smile.",
  "backstory": "Elara inherited the general store from her parents and has run it for 20 years.",
  "location": "Brightwind General Store - Waterdeep",
  "stats": null,
  "notes": "Knows local gossip and rumors. Will offer discount to helpful adventurers.",
  "is_visible_to_players": true
}
```

**Expected Response (201):**
```json
{
  "name": "Grizznak the Goblin Chief",
  "race": "Goblin",
  "occupation": "Tribal Chief",
  "alignment": "Chaotic Evil",
  "description": "A scarred goblin with one missing ear and a crude iron crown...",
  "backstory": "Grizznak rose to power by poisoning the previous chief...",
  "location": "Goblin Cave - Northern Mountains",
  "stats": {
    "armor_class": 15,
    "hit_points": 27,
    "challenge_rating": 1
  },
  "notes": "Will flee if reduced to below 10 HP. Knows the location of a hidden treasure.",
  "is_visible_to_players": false,
  "id": 1,
  "campaign_id": 1,
  "created_at": "2026-03-16T16:48:00-04:00",
  "updated_at": null
}
```

---

### 2. Get NPCs by Campaign

**Endpoint:** `GET /api/gm/campaigns/npcs/campaign/{campaign_id}`

**Example:** `/api/gm/campaigns/npcs/campaign/1`

**Requires:** Authorization (must be a member of the campaign)

**Returns:**
- **For GM:** All NPCs in the campaign
- **For Players:** Only NPCs with `is_visible_to_players: true`

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "name": "Grizznak the Goblin Chief",
    "race": "Goblin",
    "occupation": "Tribal Chief",
    "is_visible_to_players": false,
    "campaign_id": 1
  }
]
```

---

### 3. Get Specific NPC

**Endpoint:** `GET /api/gm/campaigns/npcs/{id}`

**Example:** `/api/gm/campaigns/npcs/1`

**Requires:** Authorization (GM or player with visibility)

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Grizznak the Goblin Chief",
  "race": "Goblin",
  "occupation": "Tribal Chief",
  "alignment": "Chaotic Evil",
  "description": "A scarred goblin with one missing ear and a crude iron crown...",
  "backstory": "Grizznak rose to power by poisoning the previous chief...",
  "location": "Goblin Cave - Northern Mountains",
  "stats": {
    "armor_class": 15,
    "hit_points": 27,
    "challenge_rating": 1
  },
  "notes": "Will flee if reduced to below 10 HP. Knows the location of a hidden treasure.",
  "is_visible_to_players": false,
  "campaign_id": 1,
  "created_at": "2026-03-16T16:48:00-04:00",
  "updated_at": null
}
```

---

### 4. Update NPC

**Endpoint:** `PUT /api/gm/campaigns/npcs/{id}`

**Example:** `/api/gm/campaigns/npcs/1`

**Requires:** GM authorization

**Request Body (all fields optional):**
```json
{
  "stats": {
    "armor_class": 16,
    "hit_points": 30,
    "challenge_rating": 1
  },
  "notes": "Updated: Will flee if reduced to below 10 HP. Now wears better armor."
}
```

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Grizznak the Goblin Chief",
  "stats": {
    "armor_class": 16,
    "hit_points": 30,
    "challenge_rating": 1
  },
  "notes": "Updated: Will flee if reduced to below 10 HP. Now wears better armor.",
  "updated_at": "2026-03-16T17:00:00-04:00"
}
```

---

### 5. Delete NPC

**Endpoint:** `DELETE /api/gm/campaigns/npcs/{id}`

**Example:** `/api/gm/campaigns/npcs/1`

**Requires:** GM authorization

**Expected Response (200):**
```json
{
  "message": "NPC 'Grizznak the Goblin Chief' deleted successfully"
}
```

---

### 6. Toggle NPC Visibility

**Endpoint:** `PATCH /api/gm/campaigns/npcs/{id}/visibility`

**Example:** `/api/gm/campaigns/npcs/1/visibility`

**Requires:** GM authorization

**Expected Response (200):**
```json
{
  "id": 1,
  "name": "Grizznak the Goblin Chief",
  "is_visible_to_players": true,
  "updated_at": "2026-03-16T16:50:00-04:00"
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

### Workflow 3: GM Creates Campaign NPCs

1. **Login as admin (GM)** → `POST /api/auth/login`
2. **Authorize** with the token
3. **Create hidden NPC** → `POST /api/gm/campaigns/npcs` (set `is_visible_to_players: false`)
4. **Create visible NPC** → `POST /api/gm/campaigns/npcs` (set `is_visible_to_players: true`)
5. **View all NPCs** → `GET /api/gm/campaigns/npcs/campaign/1`
6. **Toggle visibility** → `PATCH /api/gm/campaigns/npcs/1/visibility`

---

### Workflow 4: GM Creates Custom Loot Table

1. **Login as admin (GM)** → `POST /api/auth/login`
2. **Authorize** with the token
3. **Create campaign loot table** → `POST /api/gm/tools/loot-tables` (set `owner_type: "campaign"`, `owner_id: 1`)
4. **View all loot tables** → `GET /api/gm/tools/loot-tables` (see both system and campaign tables)

---

### Workflow 5: Populate the Encyclopedia

1. **Login as admin** → `POST /api/auth/login`
2. **Authorize** with the token
3. **Create Creatures** → `POST /api/encyclopedia/bestiary` (Goblin, Owlbear, Dragon)
4. **Create Spells** → `POST /api/encyclopedia/spells` (Magic Missile, Fireball)
5. **Create Armor** → `POST /api/encyclopedia/items/armor` (Plate, Leather)
6. **Create Weapons** → `POST /api/encyclopedia/items/weapons` (Longsword, Shortbow)
7. **Create Adventuring Gear** → `POST /api/encyclopedia/items/adventuring-gear` (Rope, Torch)
8. **Create Potions** → `POST /api/encyclopedia/items/potions` (Potion of Healing)
9. **Create Food/Drink** → `POST /api/encyclopedia/items/food-drink` (Rations, Ale)
10. **Create Magic Items** → `POST /api/encyclopedia/items/magic-items` (Bag of Holding, Ring of Protection)
11. **Login as player** (any user)
12. **View encyclopedia** → All users can read encyclopedia content!

---

## Test Credentials

### Admin Account
- **Email:** admin@dndapp.com
- **Password:** admin123
- **Permissions:** Can create campaigns, manage players, create encyclopedia content, create system loot tables

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

### Encyclopedia - Spells
- POST `/api/encyclopedia/spells` - Create spell (Admin only)
- GET `/api/encyclopedia/spells` - List all spells
- GET `/api/encyclopedia/spells/{id}` - Get spell details
- PUT `/api/encyclopedia/spells/{id}` - Update spell (Admin only)
- DELETE `/api/encyclopedia/spells/{id}` - Delete spell (Admin only)

### Encyclopedia - Items - Armor
- POST `/api/encyclopedia/items/armor` - Create armor (Admin only)
- GET `/api/encyclopedia/items/armor` - List all armor
- GET `/api/encyclopedia/items/armor/{id}` - Get armor details
- PUT `/api/encyclopedia/items/armor/{id}` - Update armor (Admin only)
- DELETE `/api/encyclopedia/items/armor/{id}` - Delete armor (Admin only)

### Encyclopedia - Items - Weapons
- POST `/api/encyclopedia/items/weapons` - Create weapon (Admin only)
- GET `/api/encyclopedia/items/weapons` - List all weapons
- GET `/api/encyclopedia/items/weapons/{id}` - Get weapon details
- PUT `/api/encyclopedia/items/weapons/{id}` - Update weapon (Admin only)
- DELETE `/api/encyclopedia/items/weapons/{id}` - Delete weapon (Admin only)

### Encyclopedia - Items - Adventuring Gear
- POST `/api/encyclopedia/items/adventuring-gear` - Create gear (Admin only)
- GET `/api/encyclopedia/items/adventuring-gear` - List all gear
- GET `/api/encyclopedia/items/adventuring-gear/{id}` - Get gear details
- PUT `/api/encyclopedia/items/adventuring-gear/{id}` - Update gear (Admin only)
- DELETE `/api/encyclopedia/items/adventuring-gear/{id}` - Delete gear (Admin only)

### Encyclopedia - Items - Potions
- POST `/api/encyclopedia/items/potions` - Create potion (Admin only)
- GET `/api/encyclopedia/items/potions` - List all potions
- GET `/api/encyclopedia/items/potions/{id}` - Get potion details
- PUT `/api/encyclopedia/items/potions/{id}` - Update potion (Admin only)
- DELETE `/api/encyclopedia/items/potions/{id}` - Delete potion (Admin only)

### Encyclopedia - Items - Food/Drink
- POST `/api/encyclopedia/items/food-drink` - Create food/drink (Admin only)
- GET `/api/encyclopedia/items/food-drink` - List all food/drink
- GET `/api/encyclopedia/items/food-drink/{id}` - Get food/drink details
- PUT `/api/encyclopedia/items/food-drink/{id}` - Update food/drink (Admin only)
- DELETE `/api/encyclopedia/items/food-drink/{id}` - Delete food/drink (Admin only)

### Encyclopedia - Items - Magic Items
- POST `/api/encyclopedia/items/magic-items` - Create magic item (Admin only)
- GET `/api/encyclopedia/items/magic-items` - List all magic items
- GET `/api/encyclopedia/items/magic-items/{id}` - Get magic item details
- PUT `/api/encyclopedia/items/magic-items/{id}` - Update magic item (Admin only)
- DELETE `/api/encyclopedia/items/magic-items/{id}` - Delete magic item (Admin only)

### GM Tools - Loot Tables
- POST `/api/gm/tools/loot-tables` - Create loot table (Admin for system, GM for campaign)
- GET `/api/gm/tools/loot-tables` - List accessible loot tables
- GET `/api/gm/tools/loot-tables/{id}` - Get loot table details
- PUT `/api/gm/tools/loot-tables/{id}` - Update loot table (Admin/GM)
- DELETE `/api/gm/tools/loot-tables/{id}` - Delete loot table (Admin/GM)

### GM Campaign Tools - NPCs
- POST `/api/gm/campaigns/npcs` - Create NPC (GM only)
- GET `/api/gm/campaigns/npcs/campaign/{id}` - List NPCs in campaign
- GET `/api/gm/campaigns/npcs/{id}` - Get NPC details
- PUT `/api/gm/campaigns/npcs/{id}` - Update NPC (GM only)
- DELETE `/api/gm/campaigns/npcs/{id}` - Delete NPC (GM only)
- PATCH `/api/gm/campaigns/npcs/{id}/visibility` - Toggle visibility (GM only)

---

## Tips

- **Always authorize** after logging in by clicking the green "Authorize" button
- **Admin is required** for creating campaigns, managing players, and creating encyclopedia content
- **GMs can create** campaign-specific loot tables and NPCs for their campaigns
- **Players can only see** campaigns they're members of and NPCs/characters that are visible
- **JSONB fields** (character_data, stats, loot_items) are flexible - store structured data as needed
- **Hybrid ownership** - Loot tables can be system-wide (admin) or campaign-specific (GM)
- **Visibility controls** - NPCs and characters have visibility toggles for GM control
- **Check pgAdmin** to see the actual database records after testing
- **Token expires** after 30 minutes - just login again if you get 401 errors

---

**Happy Testing! 🎲**