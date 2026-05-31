---
description: End-of-session efficiency retro — name any inefficiency smells from this session
---

Do a short, honest retrospective on **how we worked this session** — not what features we built, but whether the *process* was efficient. This is a deliberate checkpoint so inefficiency smells get surfaced explicitly instead of going unnoticed.

Keep it tight (tokens matter). Be brutally honest — flagging a real smell is the whole point; do not pad with praise.

## What to look for
Review this session's work against the **Efficiency tripwires** in CLAUDE.md and call out anything that fired or nearly fired:

- **Duplication** — did we make the same/near-identical edit across ≥3 files instead of abstracting? Should it have been data-driven or a shared hook/component/helper?
- **Breadth-before-vertical** — did we scale a pattern (Nth class sheet/tab/module) before one vertical slice was proven end-to-end?
- **Rework loop** — did a request require re-editing files we recently built? If so, the underlying pattern is likely wrong — name the root cause.
- **Skill-as-band-aid** — did we lean on (or wish for) a skill whose only job is "apply this change across N files"? That hints the architecture needs consolidation.
- **Context bloat** — did CLAUDE.md grow with per-component prose already covered by tests? Did the size hook fire?
- **Tests coupled to structure** — did we write/patch tests that assert structure (mocks of layout components) rather than behavior, such that a refactor would break them needlessly?

## Output format
1. **Smells found** — bullet list, each: what fired + the cheaper approach we should have taken. If none, say so plainly (don't invent one).
2. **Backlog update** — if any smell is worth acting on later, offer to append it to `docs/character-system-backlog.md` (do not write without confirmation).
3. **One-line verdict** — was this session's process efficient, and the single highest-leverage process change for next time.

## Arguments
$ARGUMENTS
