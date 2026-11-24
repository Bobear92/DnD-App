# API endpoints

Moved out of CLAUDE.md on 2026-11-23. **Update the matching table in the same change as any route.** The cross-cutting API rules (visibility stripping, merge semantics, GM-only reads) stay in CLAUDE.md › API.

Base URL: `http://localhost:8000` | Docs: `http://localhost:8000/docs`

**Compendium reads are member-scoped** (races, backgrounds, feats, classes, bestiary, spells, the six item types): a
`?campaign_id=N` list returns 403 unless you are a member of N (`require_campaign_query_member`, attached once to
`COMPENDIUM_ROUTERS` in `main.py`), and a get-by-id of a campaign-owned row returns 403 to non-members
(`check_content_read` in each detail route). System rows stay readable by any logged-in user. Campaign member payloads
(`UserInfo`) carry `{id, username}`, no email.

## Auth
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/auth/register | No |
| POST | /api/auth/login | No |
| GET | /api/auth/me | Yes |
| GET | /api/auth/users/search?q=X | Yes — returns up to 10 `{id, username}` matching the **username only** (min 2 chars; never matches or returns emails); excludes requester; used in GM invite flow |

## Campaigns
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

## Characters
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/characters | Yes |
| GET | /api/characters/campaign/{id} | Yes (member) |
| GET | /api/characters/{id} | Yes (owner or GM) |
| PUT | /api/characters/{id} | Yes (owner or GM); `character_data` is MERGED into the stored blob (top-level, shallow) — `character_data_remove: [keys]` deletes; accepts `appearance` (the physical-description JSONB; a write REPLACES the object, which is what lets a cleared field clear); uses `CharacterGmUpdate` — only GM can set `gm_notes`/`is_visible_to_players`; GM cannot overwrite `personal_notes`; `experience_points` is clamped to [0, 355_000] |
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
| POST | /api/characters/campaign/{id}/rest | Yes (GM of campaign); body `{ rest_type: "short"\|"long"\|"initiative", character_ids: int[], opt_ins?, dry_run? }` (unknown `rest_type` → 422); returns `RestResponse` with per-character `changes`. `dry_run: true` returns the same changes WITHOUT saving (the rest dialog shows it). Every class/subclass pool is ONE ROW in `_REST_RESOURCES`; `initiative` uses `_INITIATIVE_RESOURCES` (modes `regain_when_empty` / `floor` / `opt_in`). A long rest restores HP to the effective max (`_effective_max_hp`). Full behaviour: [docs/systems/rest-and-initiative.md](systems/rest-and-initiative.md) |
| GET | /api/characters/campaign/{id}/initiative-options?character_ids=1,2 | Yes (GM of campaign); read-only. Per character, the initiative features they must CHOOSE to use and whether the charge is still `available`. Characters with no choice are omitted, so an empty list means nobody has one. Exists so the encounter page can offer the opt-in **without** mirroring `_INITIATIVE_RESOURCES` |

## Races / Backgrounds / Feats (same pattern each)
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /races | Yes |
| GET | /races/{id} | Yes |
| POST | /races | Yes (admin for system; GM for campaign-scoped) |
| PUT | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
| DELETE | /races/{id} | Yes (admin for system; GM for campaign-scoped) |
*(Replace `/races` with `/backgrounds` or `/feats` for those modules)*

`/feats` GET also accepts `?edition=5e|5.5e` (filters feats by edition) and `?campaign_id=N`. `FeatCreate`/`FeatUpdate`/`FeatResponse`/`FeatListItem` all carry `edition` (default "5e"); `FeatListItem` also exposes `prerequisites` + `source` + `effects` so the encyclopedia detail view + the feat-effects resolvers need no extra fetch. `FeatCreate`/`FeatUpdate`/`FeatResponse`/`FeatListItem` all carry `effects` (nullable list). Seeded by `seed_feats.py`.

## Classes
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| GET | /api/classes | Yes; accepts `?edition=5e|5.5e`, `?campaign_id=N`, `?name=X` |
| GET | /api/classes/{id} | Yes |
| POST | /api/classes | Yes (admin for system) |
| PUT | /api/classes/{id} | Yes (admin for system) |
| DELETE | /api/classes/{id} | Yes (admin for system) |

Response includes nested `features: List[ClassFeatureResponse]` (all levels 1–20).
When `?campaign_id=N` is provided, campaign-scoped classes with the same `name+edition` shadow system entries (same deduplication pattern as races/backgrounds).
System classes are seeded via `backend/seed_classes.py` (upserts — re-run to apply edits; 25 entries: 12 classes × 2 editions + Artificer 5e only; uses `CLASSES_5E_ONLY = {"Artificer"}` guard to skip 5.5e creation).

## NPCs
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

## Locations
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

## Loot Tables
| Method | Endpoint | Auth Required |
|--------|----------|---------------|
| POST | /api/gm/tools/loot-tables | Yes (admin for system; GM for campaign-scoped) |
| GET | /api/gm/tools/loot-tables | Yes |
| GET | /api/gm/tools/loot-tables/{id} | Yes |
| PUT | /api/gm/tools/loot-tables/{id} | Yes (admin for system; GM for campaign-scoped) |
| DELETE | /api/gm/tools/loot-tables/{id} | Yes (admin for system; GM for campaign-scoped) |

## Encyclopedia (Bestiary, Spells — same pattern; Items below)
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

## Encyclopedia Items (same 5-method pattern for each)
- `/api/encyclopedia/items/weapons`
- `/api/encyclopedia/items/armor`
- `/api/encyclopedia/items/adventuring-gear`
- `/api/encyclopedia/items/potions`
- `/api/encyclopedia/items/magic-items`
- `/api/encyclopedia/items/food-drink`

## Calendar (per-campaign)
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

## Timeline (per-campaign)
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

## Session Notes (per-campaign)
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

## Encounters (per-campaign) — GM combat/initiative tool
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
