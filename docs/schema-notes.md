# Schema notes

The full annotated schema as it stood in CLAUDE.md on 2026-11-14: every column **with the reasoning behind it**, the `character_data` key reference, and seeding history. The current column listing is [schema.md](schema.md); this file is where rationale goes. When a column changes, update schema.md and the note here.

## Annotated schema (41 Tables)

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
  campaign_mode (String(20), default "full"),               ← "full" | "worldbuilding" (Literal-validated). ONE mode column rather than a boolean per feature: the
                                                              frontend expands it in campaignFeatures.js, so finer per-feature toggles later change one file.
                                                              HIDE-ONLY by the user's choice (Nov 2026): the API does not block characters/encounters in a
                                                              world-building campaign, and switching modes never deletes data — switching back restores everything.
  created_by (FK→users), created_at, updated_at

campaign_members
  id, campaign_id (FK→campaigns), user_id (FK→users),
  role ('gm' or 'player'), joined_at
  UNIQUE(campaign_id, user_id)

characters
  id, name, race, char_class, level, background, alignment,
  strength, dexterity, constitution, intelligence, wisdom, charisma,
  character_data (JSONB),   ← class-specific flexible data (HP, spell slots, features, skill profs, etc.)
                             ←   hp_rolls (integer): the CON-INDEPENDENT max-HP base = sum of hit-die results (level 1 = full die), no Constitution. Effective/displayed max HP = hp_rolls + level×CON-mod + passive per-level bonuses (Tough/Dwarven Toughness/Draconic Resilience), computed at display time via combatBonuses.effectiveMaxHp (and by the backend's `_effective_max_hp` for the long-rest HP restore; one shared fixture tests both) — so any CON change adjusts max HP dynamically & retroactively, no stored rewrite. Written at creation + level-up. Legacy characters stored `hp_max` (CON baked in) instead; hpRollBase() falls back to `hp_max − level×conMod` and the next level-up persists a real hp_rolls.
                             ←   currency ({cp, sp, ep, gp, pp} integers): the character's coin purse/wallet; seeded at creation from the chosen background's starting gold (BACKGROUND_STARTING_GOLD); editable in the CharacterDetail Items tab; coins shown depend on campaign.currency_type
                             ←   inventory (array): owned items, each a SNAPSHOT of an encyclopedia item ({uid, category, source_id, quantity, equipped, attuned, hand, ...itemFields}); managed in the CharacterDetail Items tab; equipping armor recomputes + writes character_data.armor_class (see inventoryData.js). WEAPONS + SHIELDS are held in HANDS: `hand` ∈ 'main'|'off'|'both' (a two-handed weapon = 'both'); `equipped` stays synced (equipped === hand is set); body armor still uses plain `equipped`. Legacy `equipped` weapons/shields migrate to hand slots on load (migrateHands). NOTE: `category` is the REST routing slug ('weapons'|'armor'|'adventuring-gear'|...) and `quantity` is the owned count; because adventuring-gear/food items carry their OWN `category`/`quantity` fields, buildEntry preserves those as `item_category`/`item_quantity` so they don't clobber the routing slug/count (the itemCategories gear/food configs read `item_category ?? category`)
                             ←   prepared_locked (boolean): prepare-casters only; true = player committed today's spell prep; GM can unlock via "Unlock (Long Rest)"
                             ←   draconic_bloodline ({name, damage}): Sorcerer Draconic Bloodline (5e)/Draconic Sorcery (2024) chosen dragon type; drives the Stats tab Draconic Ancestry line + the Stats Max HP value (folds in +1/Sorcerer level via MaxHpValue, with the source noted) + the 13+DEX AC option in the Items-tab computed AC summary. Separate from the Dragonborn race's draconic_ancestry.
                             ←   ek_spell_slots ({[spellName]: 'restricted'|'any'}): Eldritch Knight (5e only) — the SLOT CATEGORY each known spell was learned under. A 5e EK's leveled spells must be Abjuration/Evocation except the ones learned at levels 3/8/14/20 (four "any school" slots). The category belongs to the SLOT, not the spell's school (a Shield learned in the any-school slot stays swappable for any school), so it is recorded at pick time rather than inferred. `known_spells` stays a flat string[] (shared with every other known caster + actionEconomyData); this is an additive sidecar. Written by the LevelUpWizard New Spells step + the GM's CasterSpellBlock editor. Absent for the 2024 EK (no restriction). See subclassCasterData.js
                             ←   active_effects (string[]): the keys of the effects the character has switched ON (see effects/activeEffects.js). `giants_might`, `fighting_spirit` (Samurai — starting it also WRITES `temp_hp` = max(current, 5/10/15) in the same patch, via the effect's `onStart`) and `channel_rune_frost` (Frost Rune's Channel Rune — 10 minutes of +2 to Strength/Constitution checks and saves; the first effect gated on EQUIPMENT as well as level, so it simply stops resolving if the bearing item is unequipped mid-effect rather than being force-cleared). A long rest resets the feature's CHARGE but never clears this — a 1-minute effect ended long before the rest, and clearing it would imply a duration the app doesn't model
                             ←   subclass_save_proficiencies (string[], e.g. ['Charisma']): Samurai Elegant Courtier's RAW fallback — chosen ONLY when the character already had Wisdom-save proficiency from elsewhere (a conditional `offeredWhen` subclassGrant). The WIS proficiency itself is DERIVED (`skills/saveProficiencies.js`), never written into `wis_save_prof`
                             ←   strength_before_death_used (integer): Samurai L18 reaction, 1/long rest
                             ←   giants_might_size ('Large'|'Huge'): Rune Knight L18 Runic Juggernaut — the size Giant's Might grows to (RAW optional); unset = Huge; picked on the Giant's Might card toggle; drives size + the +5 ft reach (Huge only)
                             ←   runes (string[]): Rune Knight Rune Carving (5e Fighter, L3+) — the runes the character knows (2/3/4/5 at levels 3/7/10/15), chosen in the LevelUpWizard `level-choices` step from the `levelChoicesData` pool in `runesData.js` and shown read-only (with an owed-slot picker) by the sheet's `KnownOptionsBlock`. Hill is gated at L7 and Storm at L15 via option `minLevel`; one rune may be swapped per Fighter level. The rune save DC is 8 + PB + CON — CONSTITUTION, not the Intelligence Arcane Shot uses — and rides on the choice's `derived` line. Which OBJECT each rune is carved on lives in `rune_items` (below)
                             ←   rune_items ({[runeName]: uid}): Rune Knight Rune Carving — which inventory entry each known rune is carved on. Keyed by RUNE (the scarce resource: you have 2-5 runes and unbounded objects), which makes "one rune per object" a uniqueness check over the values. Assigned from the ITEM CARD in the Items tab (weapons/armor/shields only — the only wearable/holdable things the inventory models as equippable; jewelry waits on a worn-item model). This is the third instance of the designate-an-item pattern but deliberately NOT built on `WeaponDesignationPanel`: that one is ONE feature -> N weapons with the picker in a feature panel, this is N runes -> N items 1:1 with the control on the row. **Knowing a rune grants nothing** — every consumer gates on `activeRunes()` (known + carved + the bearing item EQUIPPED), so unequipping the axe removes the passive and its Channel Rune card. Deliberately NOT cleared on a long rest: RAW you re-inscribe then, but the app has no "already inscribed today" state and wiping five assignments each morning is worse than the divergence. See inventory/runeCarving.js
                             ←   channel_rune_<rune>_used (integer, x6): Rune Knight Channel Rune — one counter PER RUNE (cloud/fire/frost/stone/hill/storm), because RAW recharges each rune independently. 1 use, or 2 from Master of Runes (L15). Reset by `_compute_rest_patch` on BOTH rest types (the only Rune Knight pool that returns on a short rest). Its rest row + Action Economy card each `hidden()` themselves unless the rune is live
                             ←   bonded_weapon_uids (string[]): Eldritch Knight Weapon Bond (L3+, both editions) — the inventory-entry uids of the up-to-2 bonded weapons; chosen in the Items tab (Weapons → Bonded Weapons panel), shown read-only in the Features-tab EK panel; drives the Action Economy "Bonded {Weapon}" bonus-action entries (see weaponBondData.js)
                             ←   hex_weapon_uid (string|null): Hexblade Hex Warrior (5e Warlock, L1) — the inventory-entry uid of the designated weapon (must lack Two-Handed); chosen in the Items tab (Weapons → Hex Warrior Weapon), shown read-only in the WarlockSheet features; the weapon attacks with CHA when it beats STR/DEX (folded into getAttacks/computeAttack via hexWeapon; see weaponBondData.js)
                             ←   arcane_shot_options (string[]) + arcane_shot_used (integer): Arcane Archer (5e Fighter, L3+) — the Arcane Shot options known (a subclass-scoped levelChoicesData pool, chosen at level-up, swappable one-per-level) and the uses spent of the flat 2/short-rest pool (reset by `_compute_rest_patch` on BOTH rest types). See arcaneShotData.js
                             ←   subclass_cantrips (string[]): cantrips granted by a SUBCLASS feature (Arcane Archer Lore) — a subclassGrants `surface:'spells'` grant; shown as the Spells tab's own "Subclass" source and enough on its own to give a non-caster the Spells tab
  experience_points (integer, default 0),   ← XP total; used when leveling_type="experience".
                                            CLAMPED to [0, 355_000] on create + update by the service
                                            (MAX_EXPERIENCE_POINTS) — 355,000 is the level-20 threshold and
                                            XP past it buys nothing, so an over-award tops out instead of
                                            running away. Enforced in the SERVICE, not just the UI, so it
                                            holds for any caller; the frontend mirrors it as MAX_XP in
                                            CharacterDetail.jsx so the GM never sees a number the save changes
  level_up_pending (boolean, default false), ← set true when XP threshold crossed or GM triggers milestone LU.
                                            RE-DERIVED (not cleared) when a level-up completes, via
                                            CharacterDetail's `qualifiesForLevelUp(level, xp)`: one award can
                                            bank several levels, and clearing it outright stranded the character
                                            at the intermediate level until another point of XP made the
                                            add-XP path recompute the flag. Milestone campaigns still clear it —
                                            there the flag is GM-triggered and XP means nothing.
  user_id (FK→users), campaign_id (FK→campaigns),
  is_visible_to_players (boolean), notes,          ← "public notes" shown to all campaign members
  gm_notes (Text, nullable),                       ← GM only; always stripped from player/owner responses
  backstory (Text, nullable),                      ← markdown prose; owner + all members (read)
  personal_notes (Text, nullable),                 ← owner + GM only; stripped from other player responses
  appearance (JSONB, nullable),                    ← the character's PHYSICAL DESCRIPTION — free-text, display-only,
                                                     visible to every campaign member like `backstory` (no stripping).
                                                     NPCs have had age/gender/height/weight/appearance since that module
                                                     was built and player characters had NONE of it, so a GM could describe
                                                     a tavern keeper but not the party's own fighter. ONE JSONB column
                                                     rather than ~20 nullable String columns (the NPC shape): nothing
                                                     computes from any of it and the field list is MEANT to grow, which
                                                     would otherwise be a migration each time — the catalog lives in the
                                                     frontend (`appearance/appearanceData.js`, 23 fields in 4 groups) and
                                                     adding one is frontend-only. Deliberately NOT part of `character_data`,
                                                     which is class-specific MECHANICAL state. **Nothing may ever compute
                                                     from it** — `height` in particular must not reach `creatureSize`:
                                                     Great Stature's +3d4 inches never crosses a size category, and a sheet
                                                     where a tall character grappled differently would be inventing a rule.
                                                     Empty strings are stripped client-side (`cleanAppearance`) so an
                                                     untouched field never persists as "". Present in CharacterCreate/
                                                     Update/Response, deliberately ABSENT from CharacterListItem (the list
                                                     view is lightweight and no card shows a description)
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
                             ←   | {kind:"ability_score", ability, amount} (fixed) | {kind:"attack_mod", target:"unarmed", dice} | {kind:"action", name, economy, description, trigger} | {kind:"spell_grant", source_kind, cantrips, leveled, fixed, free_cast, ability} (Magic Initiate — grants picked spells) | {kind:"fighting_style", style} (a 2024 Fighting Style feat — Archery/Defense/Dueling/Thrown Weapon Fighting/Two-Weapon Fighting — merged into fightingStyles.gatherFightingStyles so it reaches the same attack/AC math as a class-granted style; before this those feats did nothing) | {kind:"maneuver_grant", count, die} (Martial Adept — player picks N Battle Master maneuvers + a die; snapshotted to choices.maneuvers; for a Battle Master the die/maneuvers fold into the shared Combat Superiority pool, else a standalone d6 in the Feats tab) | {kind:"note", text}
                             ←   NULL/empty = prose-only (surfaced by report_feat_effects.py). Resolved by frontend featEffects.js; snapshotted onto character_data.feats[i] at acquisition.
  repeatable (boolean), source, owner_type (ENUM), owner_id, created_at, updated_at
  Seeded via seed_feats.py: 41 PHB-2014 feats (edition "5e") + 73 PHB-2024 feats (edition "5.5e",
    Origin/General/Fighting Style/Epic Boon). Idempotent (skips existing by name+edition+owner_type=system).
    Re-running REFRESHES an existing system feat's `description`, `prerequisites` and `effects` from this file (it is the source of truth), and then **`sync_character_feat_snapshots` refreshes the `effects` copied onto every character's feats** (matched by feat id; `choices` untouched) — so a feat mechanized later reaches characters who already had it with no remove + re-add. `tests/test_feat_seed_data.py` GUARDS the authored data: a feat whose text grants a reaction must author a `reaction` action, and an Attack-action bonus action must author a bonus action with the Attack-action trigger; so a mis-authored feat is corrected by editing here and re-seeding — this is how the **2024 Sharpshooter** text was fixed: it had been seeded as the 2014 clauses with Great Weapon Master's "+proficiency bonus to damage" pasted on, and is really Bypass Cover / Firing in Melee / Long Shot (+30 ft normal range) with NO damage bonus.
    Also backfills `effects` from FEAT_EFFECTS_5E (5e: 23/41 complete) + FEAT_EFFECTS_2024 (5.5e: 29/73 complete), authored per their own edition's rules (2024 Alert/Observant differ from 2014, Origin feats grant no ASI, etc.). The rest are honest prose-only `note`s — pure rules-text riders, most fighting-style riders, Crafter/Musician sub-pools, or Epic Boons.
    **Coverage is CLAUSE-level** (it used to be feat-level, which let Grappler pass on its +1 ability score while its headline clause sat as text — found in QA). Every `note` carries one of three statuses via `_note(text, surfaced=None, unmodelable=None)`: **pending** (no tag — not built; the worklist), **`surfaced="<where on the sheet>"`** (built by a frontend table/card keyed on the feat name — the note only restates it), or **`unmodelable="<missing model>"`** (the USER signed off; never self-assigned). A feat is **complete** only with no pending clause. `python report_feat_effects.py` prints every pending clause per edition. **`--check` is a RATCHET GATE** on the committed `backend/feat_coverage_baseline.json` — complete feats may not DROP and pending clauses may not RISE (so a new text-only note fails CI until built, tagged `surfaced`, or signed off) — currently 5e 23/41 complete + 18 pending, 5.5e 29/73 complete + 44 pending. Pure logic unit-tested in `tests/test_report_feat_effects.py`; runs in CI + `/ship-it` Step 3b (not pytest, since it reads the seeded dev DB). Ratchet with `--write-baseline` after building more. Authoring procedure: the `/feat-effects` skill.

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
  id, name, damage, damage_type, weight, cost, weapon_category, weapon_type,
  properties (Text: comma-joined property NAMES, e.g. "Ammunition, Heavy, Two-Handed"),
  range_normal (Integer, nullable), range_long (Integer, nullable),
                             ← the distance band: attacks up to `range_normal` are unmodified,
                               beyond it but within `range_long` are at disadvantage. TWO INTEGERS,
                               not a "150/600" string, so no consumer parses prose (the mistake the
                               spells table's free-text `range` made — see docs/spell-upcast-review.md).
                               NULL for a pure melee weapon: its 5 ft is REACH, a different concept
                               (a Reach weapon's is 10). A THROWN melee weapon DOES get a band — its
                               throw range — so a dagger reads "Thrown 20/60 ft". `range_long` may be
                               NULL alone (one distance, no falloff — a net).
                               Seeded from the SRD `range` (ranged weapons) / `throw_range` (thrown);
                               seed_items.py previously DISCARDED both. 16 of 38 system weapons carry
                               a band (9 ranged + 7 thrown); the other 22 are melee and correctly NULL.
                               Re-running seed_items.py writes the band onto existing rows (it upserts
                               since 2026-11-16, deploy T5b; the old `backfill_weapon_ranges()` is gone).
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

  Item tables seeded via seed_items.py: weapons/armor/adventuring_gear from the 5e API /api/equipment,
    magic_items from /api/magic-items; potions + food_drink + a curated "Improvised Weapon" (1d4
    bludgeoning, weapon_category "Improvised", Thrown 20/60 — a system weapon so it can be equipped;
    relevant to Tavern Brawler) are curated in-script (SRD API doesn't expose them cleanly). Idempotent
    (skips existing by name + owner_type=system). Counts after seed: weapons 38 (37 SRD + Improvised Weapon),
    armor 13, adventuring_gear 116, magic_items 362, potions 40, food_drink 8. (A one-time cleanup removed
    59 corrupt magic-weapon/armor duplicate rows — empty category + mojibake fields — that already existed
    in magic_items and were 500-ing the weapons/armor list endpoints.)
  Potions (items deep dive T1, 2026-11-25; Robert: potion-type items belong under Potions): the API files
    potions/oils/philters under /api/magic-items. seed_items now upserts a potion-category record into
    `potions` (cost "—", weight "0.5 lb.", duration NULL) and skips a name that has a curated POTIONS row.
    Migration ebff797e3878 moved what was stored: each system magic_items row with item_type 'Potion' got a
    system potions row of its name (existing curated rows kept), owned inventory snapshots were re-pointed
    (category 'potions', new source_id, item_type/attunement_required dropped, uid/quantity kept), then the
    system rows were deleted. Campaign homebrew potions under magic_items were left alone. Its downgrade is
    a no-op on purpose. magic_items is now 322 system rows, none of type Potion.
```

**Note:** Encyclopedia tables (spells, creatures, all item tables) DO have `owner_type`/`owner_id` and
carry **no DB-level `UNIQUE(name)`** constraint (verified against `dnd_app_dev` July 2026 — an earlier
note here claiming otherwise was stale). Campaign overrides work today. Uniqueness is enforced in each
module's `service.py` (spells: name + edition + owner scope), which is what lets one spell exist once
per edition.
