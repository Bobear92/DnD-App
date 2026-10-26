---
description: Write this session's log — title, area, summary, where Claude struggled, decisions, open threads
---

Fill in this session's log file in `docs/sessions/`. The `session-log` hook already created it and appends a **Turn log** entry after every response — you write the parts that need judgment.

## Find the file
It's the `docs/sessions/YYYY-MM/*.md` whose frontmatter `session_id` matches this session (newest file on today's date if unsure). Read it first — the Turn log is your record of what happened.

## What to write
Edit ONLY these (never the Turn log, `session_id`, `turns`, `last_uuid`, `started`, `date`):

**Frontmatter**
- `title:` — 3–8 words naming what the session was about (e.g. `Rune Knight bonus proficiencies`)
- `area:` — exactly one of `character-system`, `campaign-tools`, `encyclopedia`, `backend`, `tooling` (the main one)
- `tags:` — inline list of the other things touched, e.g. `[fighter, rune-knight, languages]`
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
