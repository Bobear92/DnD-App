# Fighter subclass retrospective (Jun 26 – Sep 21, 2026)

Covers Champion, Battle Master, Eldritch Knight, Arcane Archer, Cavalier, Echo Knight, Psi Warrior,
Rune Knight and the feat/grapple follow-ups after them: 78 commits, `a634037` → `6a62373`.

**Sources and their limits.** No session transcripts survive. Claude Code's 30-day cleanup ran on
2026-10-26 at 13:17, and the newest Fighter commit is from Sep 21. (`cleanupPeriodDays` is now
3650, and `docs/sessions/` logs every session from here on.) This retro is built from:
- the commit messages, which are detailed and usually say what QA found;
- the feedback memories, which record the corrections Robert made explicitly.

What's lost: interruptions, abandoned attempts that never reached a commit, and the exact wording of
Robert's corrections. Where this doc says "Robert stepped in", it is because a commit or memory says
the change was the user's call or came from QA. Treat it as a lower bound.

---

## 1. Recurring problems

### 1a. Stored feature text wasn't RAW, every time, and the fix often didn't reach the source

Every subclass from Arcane Archer on needed RAW corrections to its `SUBCLASS_DATA` blurbs, and several
were load-bearing (the mechanic would have been wrong if built from the blurb):

| Subclass | Blurb said | RAW | Commit |
|---|---|---|---|
| Eldritch Knight | Weapon Bond bonds one weapon (5e) | Two, in both editions | `c8fee53` |
| Arcane Archer | extra Arcane Shot use at 10th; no save ability; Superior Arcane Shot is its own feature | flat 2 uses; INT; it's an 18th-level clause of Arcane Shot | `fc82dc4` |
| Cavalier | Unwavering Mark deals half your PB; Warding Maneuver deals 1d8 force to the attacker | half your **Fighter level**; the **target gains resistance** | `7cd17ef` |
| Echo Knight | Shadow Martyr: no recharge; Legion of One: an invented clause; Echo Avatar: concentration | 1/short rest; it regains Unleash Incarnation on initiative; no concentration | `fd70397` |
| Psi Warrior (both eds.) | flat d6; leap "equal to" speed; Telekinetic Movement is a bonus action | d6→d12; **twice** walking speed; an **action** | `d0d328b` |
| Rune Knight | Runic Shield "use the lower roll"; Giant's Might/Juggernaut grant grappling | use the **new** roll; no grapple clause; Juggernaut's real clause is +5 ft reach | `d3455f6`, `6a50940` |

Feats had the same problem: 2014 and 2024 Charger (`0f5ebe1`), 2024 Sharpshooter pasted together
from 2014 + GWM (`0d22f07`), Grappler (`6a62373`).

**The part that keeps it recurring:** the correction often landed in the *consuming* module and not
the blurb. Psi Warrior's numbers come from `psiWarriorData.js` "never the stored feature blurbs". The
Runic Shield card text was fixed in `actionEconomyData.js` while **the `SUBCLASS_DATA` blurb still
says "use the lower of the two rolls" today**. That blurb feeds the encyclopedia SubclassPage and the
Features list. The Giant's Might grapple clause survived `d3455f6`, which said it was corrected, and
was only removed in `6a50940`, three weeks later, after a player read it and called the correct Grapple
card wrong. Found while planning §5: the **Fire Rune** passive is also wrong. RAW *doubles* your
proficiency bonus on checks that use a tool you're proficient with; the stored text says "add".

**Root cause:** `SUBCLASS_DATA` was authored as summaries, and the audit trusts it as input. RAW checks
happen only when building a mechanic forces Claude to read closely, and the fix lands wherever that
mechanic lives.

### 1b. Features first surfaced in the wrong place

Placement was chosen by **cost badge** ("what tab does this go in?") rather than by **the moment of
use** ("what is the player looking at when they reach for this?"):

- Arcane Shot: No Action entry → onto the bow's attack card (`241d994`)
- Unleash Incarnation: No Action tab → onto melee attack cards (`c5db618`)
- Vigilant Defender: a rider → its own "Extra reactions" section, because as a rider it was invisible (`baf5acd`)
- Telekinetic Master: a lone bonus action → an Action+Bonus combo (`89c404d`)
- Reclaim Potential: features area → the HP card, beside temp HP (`c5db618`)
- Spells: one "Cast a Spell" pointer per bucket (`a26ecc7`) → a card each (`89c404d`)
- Damage: an "on a hit" second total (`a457891`) → read as doubled damage → one folded number (`ca38fab`)
- Psionic Strike and the Fire Rune: damage folded into every swing → removed, since spending is decided after the hit (`9417519`, `ca38fab`)
- ActiveEffectsBanner: added (`d3455f6`) → removed at the user's call (`9417519`)
- Channel Rune: Frost: a `+2` tag next to a total → read as "+7 and 2 more" → coloured total (`9417519`)

**Root cause:** a cost badge is the first thing a feature's text states, so it becomes the routing key.
But a player looks at a card for a reason, and the right surface is the one already on screen at that
moment. That is usually an attack card, the HP block or a save row, not a tab named after the action.

### 1c. The same mechanism re-generalized for each new subclass

Nearly every subclass extended a mechanism the previous one had called done:

| Mechanism | Extended by |
|---|---|
| `subclassGrants` `surface` | Arcane Archer (`skills`/`spells`), Cavalier (per-option `storeField`) |
| `levelChoicesData` | Arcane Archer (`subclass` field) |
| rest-resource `total` | Cavalier (`total(level, {scores})`), Psi Warrior (`label` fn, `fallbackRow`, `restoresRow`, `hidden`) |
| `SUBCLASS_FEATURE_ACTIONS` | Cavalier (`compute`, `saveDc`, `extraReaction`), Psi Warrior (an **array** per feature) |
| attach-to-attack shape | `arcaneShot` payload → `ATTACK_RIDERS` (Cavalier) → `ENTRY_RIDERS` (Sentinel) → `ATTACHED_FEATURES` + `attachedAs` (Psi Warrior) |
| defenses / saveFeatures | Rune Knight (`applies(ctx)`) |
| active effects `grants` | Rune Knight QA (`checkBonus`/`saveBonus`), Hill (`resistances`) |

**This is mostly healthy.** Each extension was small and driven by real data, and the payoff showed:
Rune Carving was the fourth pool and "added NOTHING". The cost is *timing*: most extensions were found
mid-build or in QA rather than at the audit, so they arrived as rework of a file built a week earlier.
The audit could have predicted many of them by asking, per clause, *"does the existing mechanism's
contract cover this exact shape?"* (a pool sized by ability modifier; a free use that then costs a
pool die; one feature with two costs).

### 1d. QA passes found what the first pass missed, mostly "computed but shown nowhere"

Every subclass got at least one QA commit after its build commit, and Arcane Archer got four. The
Rune Knight was still producing findings four weeks after it shipped (`9417519` → `ca38fab` →
`6a50940` → `90e7d04` → `9c770d8`). The single biggest category is summed up by `9417519`: *"Every
finding this session was a mechanic that was computed correctly and displayed nowhere."*

- Giant's Might produced `advantageAbilities`/`advantageSaves` that nothing read
- Knowing a rune granted nothing until carving existed
- `subclass_languages` was stored and deduped against but never shown (Cavalier)
- Samurai Fighting Spirit and the Psi Warrior die regain were reset by the backend with no UI to spend or announce them
- Feats added from the sheet stored **no effects at all** (`45981f8`)
- creature size was computed and printed nowhere (`d3455f6`)
- **still true today:** Runic Juggernaut's `reachBonus` is aggregated in `activeEffects.js` and read by nothing, and the Fire Rune's `passive.toolBonus` has no reader either

**Root cause:** tests check that a producer returns the right value. Nothing checks that every
produced field has a reader. The rule "a `grants` field with no reader is a silent no-op" was written
down in CLAUDE.md but is not enforced.

### 1e. "Prose-only" clauses turned out to be mechanizable, usually within a week

| Left as prose because… | Built as | Gap |
|---|---|---|
| Ever-Ready Shot / Relentless: "mechanize both together or neither" (`fc82dc4`, Aug 6) | Roll Initiative V1 (`2bb148a`, Aug 12) | 6 days |
| Telekinetic Master's telekinesis: "nothing models a leveled spell granted at will" (`d0d328b`, Aug 17) | `subclassSpells.js` (`89c404d`, Aug 23) | 6 days |
| Stone Rune darkvision: "no vision model" (`a457891`, Aug 25) | `senses/` (`9417519`, Aug 31) | 6 days |
| Giant's Might: the long-standing "no active-effect model" line | `effects/activeEffects.js` (`d3455f6`) | same session |
| Sentinel / Polearm Master OA clauses, Interpose Shield, Storm's reaction, Shield Master's save bonus, Grappler's headline, Observant's passive Investigation | each a data row in an existing table | found in QA |

The stated reason was usually true: the model didn't exist. But "no model exists" was treated as
"can't be built", when each missing model turned out to be a single module built in one session. That
is why "prose-only needs sign-off" is now a hard rule (`9c770d8`).

---

## 2. Where Robert stepped in, and why Claude couldn't get there alone

From the commit messages ("user's call", "found in QA") and the feedback memories:

| Stepped in on | Evidence |
|---|---|
| Reversing the "no active effects" line; then "every *Channel* feature needs an active status that **does** something" | `d3455f6`; memory 2026-09-17 |
| "Use your reaction" = a Reactions card, and "Attack action → bonus action" = a combo. **He had to point these out one at a time** (Tavern Brawler, Telekinetic Master, Shield Master) | memories |
| Prose-only triage needs his sign-off | memory 2026-09-18; `9c770d8` |
| Remove the ActiveEffectsBanner | `9417519` |
| Sum Shield Master's conditional bonus into the printed save, against the initial build | `de18d60` |
| Grappler as a real card: "leave as little as possible to text" | `6a62373` |
| RAW the stored text got wrong: Giant's Might grappling, Weapon Bond count | `6a50940`, `c8fee53` |
| Presentation reads: "doubled damage", "+2 reads as on top", "5 / 5 remaining beside a longsword" | `ca38fab`, `9417519`, `c5db618` |
| Process: branch at session start (Aug 8), ship only on `/ship` (Aug 14), Robert drives QA | memories, `80f8b31` |

**Why Claude couldn't get there alone:**
1. **Tests check Claude's model of the feature, not the rules.** A green suite showed that the code
   matched the blurb, and the blurb was the thing that was wrong. RAW knowledge came from Robert, or
   from Claude reading closely only once a mechanic forced it.
2. **Claude never reads the sheet as a player mid-combat.** "Two lines starting with the same string
   read as doubled damage" is obvious at the table and invisible in jsdom. Verifying in the running
   app (from `fc82dc4` on) checked that things *rendered*, not that they *read correctly*.
3. **Rules were learned per instance, not per shape.** Each combo or reaction was recognised only after
   Robert named it, until he asked for the general rule and it became a guard test.
4. **"Can't be modelled" was self-assigned.** The judgment that a model was too big to build belonged
   to Robert, and he usually disagreed.

---

## 3. What worked (repeat it)

- **Consolidate at the 2nd–3rd consumer, and prove the migration with unchanged tests.**
  `subclassGrants` (merged while two subclasses were wired), `ATTACK_RIDERS`, `ENTRY_RIDERS`,
  `ATTACHED_FEATURES`. "Both existing blocks migrated; their tests pass unchanged, which is the proof."
- **A finished mechanism is visible: the next unit costs zero code.** Rune Carving added nothing as the
  fourth pool, and Samurai's Bonus Proficiency was pure data.
- **One helper feeding two surfaces.** `WeaponAmmoControl`, `WeaponRangeBadge`, `MagicAttackBadge`,
  `echoArmorClass`, `specialAttacksData` and `RestResourceControl` owning the spend-and-activate rule.
  Drift between tabs stopped being a class of bug.
- **Every derived number shows its math** (`BreakdownValue`, `AttackNumber`). This made wrong numbers
  findable in QA and gave Robert something precise to point at.
- **QA findings became guard tests,** not just fixes: the reaction guard, the combo guard, the
  option-pool guard (mutation-tested), `noLevelAnnotations`, `noNestedComponents`, and clause-level feat
  coverage. Each one stops a whole category from recurring.
- **End-to-end verification in the running app,** from `fc82dc4` on: the rest endpoint, a reload,
  a real second player account for GM gating. It caught bugs the suite missed (`/campaigns/undefined/`).
- **Migrations, not "remove and re-add":** `2acc0cc10b51` and `sync_character_feat_snapshots`.
- **User rules became memories and skill text quickly,** so the same correction wasn't needed three times.

---

## 4. Proposed process changes (NOT applied — for Robert's review)

1. **`/subclass-features` Phase 0 — RAW text check, corrected at the source.** Before triage, compare
   every feature blurb **and every pool option** against RAW and list the discrepancies. Correct them in
   `SUBCLASS_DATA` / the pool module *in the same change* as the mechanic, never only in the consumer's
   local copy, and pin each corrected clause with a test (the `activeEffects.test.js` shape). Where
   Claude isn't sure of the RAW wording, say so and ask Robert for the text rather than guessing.
   *Would have caught:* every row in §1a, including the Runic Shield and Fire Rune blurbs still wrong today.
2. **Triage table gets a "moment of use" column.** Per clause: *what is the player looking at when they
   use this?* Route there first and pick the cost badge second. Default rules: triggered by a hit or an
   attack → attach to the attack card; changes HP → the HP block; changes a roll → that roll's row.
   *Would have caught:* most of §1b.
3. **A producer/consumer guard test.** A test asserting that every field `ACTIVE_EFFECTS.grants` can
   return, and every `RUNE_OPTIONS.passive` field, is in a registry of fields with a named reader. It
   fails on a field nobody reads. *Would catch today:* `reachBonus`, `toolBonus`. Same family as the
   option-pool guard.
4. **Prose-only lines carry a model-size estimate.** Each sign-off line adds `model: small (one module)
   / large (new subsystem)`. History says small ones should default to *build now*: initiative, senses,
   subclass spells and active effects were each one session.
5. **A "player read-through" step before handing QA to Robert,** added to `/subclass-features` Phase 3.
   Read each new card as a player mid-combat against the presentation rules learned the hard way:
   - one number per quantity, never a second number beside a total
   - a remaining-count sits beside its owner, not beside the weapon
   - no two lines that open with the same string
   - nothing stated in prose that the sheet should show (size, reach, range)
   - nothing badged with a cost the player doesn't actually pay
6. **Per-clause contract check during audit (for §1c).** For each clause routed to an existing
   mechanism, state the mechanism's contract in one line and check that the clause fits it exactly: a
   pool sized by an ability modifier, a free use that falls back to a pool die, one feature with two
   costs. A mismatch becomes a planned extension at the audit, not a QA rework.
7. **Fix stale skill/doc text.**
   - `/subclass-features` "Proven so far" omits Psi Warrior and Rune Knight.
   - Its routing row "Fixed proficiency → not modeled" is wrong: `SUBCLASS_PROF_GRANTS_5E` in
     `inventoryProficiencies.js` already models fixed subclass grants (Hexblade).
   - CLAUDE.md's Rune Knight entry plans a new `classData/subclassProficiencies.js` for the same thing,
     and the CLAUDE.md Fire Rune line repeats the "+PB to tool checks" error.
8. **`/log` at the end of every session** (now installed), so the next retro reads transcripts rather
   than reconstructing from commits.
