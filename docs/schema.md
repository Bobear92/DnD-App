# Database schema (46 tables)

Moved out of CLAUDE.md on 2026-11-23. **This file is the current column listing — update it in the same change as any model/migration.** Why a column is shaped the way it is goes in [schema-notes.md](schema-notes.md).

Columns and the constraints that affect how code is written. **Why** a column is shaped the way it is, the full `character_data` key reference, and seeding history live in [schema-notes.md](schema-notes.md) — put new rationale there and keep this listing to columns plus a one-line note.

```sql
-- Core
users
  id, email (unique), username (unique), password_hash,
  is_admin (boolean, default false), created_at, updated_at,
  password_changed_at (nullable)   ← set by a password reset; login tokens issued before it are rejected (get_current_user)

password_reset_tokens            ← one-time reset links (migration a01182d8bd3b)
  id, user_id (FK→users, CASCADE), token_hash (String(64), unique — SHA-256 of the emailed token; the raw token is never
  stored), expires_at (PASSWORD_RESET_MINUTES, default 60), used_at (nullable — single use), created_at

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

campaign_invites                ← a PENDING invite; the user becomes a campaign_members row only when THEY accept
  id, campaign_id (FK→campaigns, CASCADE), user_id (FK→users, CASCADE), invited_by (FK→users, CASCADE), created_at
  UNIQUE(campaign_id, user_id)  (migration b24c002b0ad5; separate table so no membership check can let an invitee in)

characters
  id, name, race, char_class, level, background, alignment,
  strength, dexterity, constitution, intelligence, wisdom, charisma,
  character_data (JSONB),   ← class-specific MECHANICAL state; shape varies by class. Per-key rationale: docs/schema-notes.md
                              PUT MERGES top-level keys (a missing key is kept); delete with `character_data_remove: [keys]`
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
  ALL seed scripts UPSERT system rows via shared/seeding.py (the file is the source of truth; campaign rows never touched).
  seed_data.py is DEV ONLY (known-password admin; refuses non-local DBs).

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

## Upload key layout

Every upload goes through `shared/file_storage.py` (its `UploadKind` rows are the source of truth), under a key
`uploads/<folder>/<ids...>/<uuid><ext>` — local disk in dev, R2 in production:

```
uploads/characters/{character_id}/uuid.ext          ← character portraits
uploads/maps/{campaign_id}/{location_id}/uuid.ext   ← location map images
uploads/npcs/{campaign_id}/{npc_id}/uuid.ext        ← NPC portraits
uploads/sessions/{campaign_id}/{session_id}/uuid.ext ← session images
uploads/music/{characters/<id> | npcs/<cid>/<id> | sessions/<cid>/<id>}/uuid.ext ← uploaded theme audio
```
