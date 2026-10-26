---
description: Write this session's log — title, area, summary, where Claude struggled, decisions, open threads
---

Fill in this session's log file in `docs/sessions/`. The `session-log` hook already created it and appends a **Turn log** entry after every response — you write the parts that need judgment.

## Find the file
It's the `docs/sessions/YYYY-MM/DD/HHMM_<name>.md` whose frontmatter `session_id` matches this session (newest file on today's date if unsure). Read it first — the Turn log is your record of what happened.

## What to write
Edit ONLY these (never the Turn log, `session_id`, `turns`, `last_uuid`, `started`, `date`), plus `docs/sessions/TAGS.md` when a new tag is needed:

**Frontmatter**
- `title:` — 3–8 words naming what the session was about (e.g. `Rune Knight bonus proficiencies`)
- `area:` — exactly one of `character-system`, `campaign-tools`, `encyclopedia`, `backend`, `tooling` (the main one)
- `tags:` — inline list, e.g. `[build, fighter, rune-knight, bonus-proficiencies, subclass-proficiencies, items-tab]`. Tags are how later searches find this session, so **pick them from `docs/sessions/TAGS.md`** (read it first). Cover every category that applies:
  - kind of work (`build`, `qa`, …)
  - the **class AND the subclass** whenever one was touched, not just the class
  - each feat / feature / pool option that got real work
  - each shared mechanism changed (`attack-riders`, `active-effects`, …)
  - each surface touched (`action-economy`, `level-up-wizard`, …)
  - risk markers (`migration`, `seed-data`, …), and the edition only when it mattered
  - decisions (`user-rule`, `prose-signoff`, `guard-test`)

  **A tag not in TAGS.md:** if nothing there fits, add the new tag to the right section of TAGS.md in the same edit, with a one-line meaning. Never invent a synonym for an existing tag. INDEX.md lists any tag missing from TAGS.md under "Tags not in TAGS.md", so drift shows.
- `issues:` — inline list from the **Issues** section of TAGS.md (`raw-correction`, `wrong-surface`, `computed-not-shown`, `mechanism-extended`, `prose-to-mechanic`, `rework`, `presentation`). Mark each one that actually happened this session, even if it was fixed; leave `[]` if none did. INDEX counts them per class/subclass, which is how a retro sees whether a problem is shrinking. Say what each one was in the **Where Claude struggled** section.
- `summary:` — one line, ≤120 chars, for the INDEX table
- `stepped_in:` — set `true` if Robert corrected, redirected or took over at any point, even without an interruption (the hook only detects interruptions)

**Sections** (replace the placeholder text; keep each tight — bullets, no narrative)
- `# heading` — same as `title`
- **Summary** — what got done, with commit hashes if any
- **Where Claude struggled / where Robert stepped in** — the most important section. Be honest and specific: wrong assumptions, rework, rules misread, things that took several attempts, every point Robert corrected or took the wheel, and what would have avoided it. If Robert already wrote notes here, keep them and add yours below.
- **Decisions** — choices made and why (one line each)
- **Open threads** — what's unfinished or deferred, with enough detail to pick it up cold

`INDEX.md` regenerates itself from the frontmatter after this response — don't edit it.

## Arguments
$ARGUMENTS
