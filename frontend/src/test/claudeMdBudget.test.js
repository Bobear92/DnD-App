/**
 * CLAUDE.md budget + docs-index guard.
 *
 * CLAUDE.md is loaded into context on EVERY turn. It grew to 240 KB one paragraph at a time —
 * 93 KB of it filed under "Not Yet Built" while describing finished systems — before being split
 * into docs/systems/*.md. This test keeps it from growing back:
 *
 *   • a byte budget, so narrative has to go to the docs file for its system instead;
 *   • every doc CLAUDE.md links must exist, so the index never points at nothing;
 *   • every docs/systems file must be listed in the index, so a new system description is not
 *     written and then never read.
 *
 * If the budget fails: move the description you just added into the matching docs/systems file
 * (or docs/frontend-map.md / docs/schema-notes.md / docs/backend-tests.md) and leave one line.
 * Raising the number is the last resort, not the fix.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(process.cwd(), '..');
const CLAUDE_MD = path.join(REPO, 'CLAUDE.md');
const SYSTEMS_DIR = path.join(REPO, 'docs', 'systems');

export const CLAUDE_MD_BUDGET_BYTES = 100_000;

const text = fs.readFileSync(CLAUDE_MD, 'utf-8');

/** Repo-relative doc paths linked from markdown text: `](docs/foo.md)` and `](docs/foo.md#anchor)`. */
export function linkedDocs(markdown) {
  const found = new Set();
  for (const m of markdown.matchAll(/\]\((docs\/[^)#\s]+\.md)(#[^)]*)?\)/g)) found.add(m[1]);
  return [...found];
}

describe('CLAUDE.md budget', () => {
  it('stays under the byte budget (it loads every turn)', () => {
    const bytes = Buffer.byteLength(text, 'utf-8');
    expect(
      bytes,
      `CLAUDE.md is ${bytes} bytes (budget ${CLAUDE_MD_BUDGET_BYTES}). Move the system description you added into `
      + 'docs/systems/<system>.md and leave a one-line pointer.',
    ).toBeLessThanOrEqual(CLAUDE_MD_BUDGET_BYTES);
  });

  it('is not empty or truncated (a broken read must fail, not pass)', () => {
    expect(Buffer.byteLength(text, 'utf-8')).toBeGreaterThan(20_000);
    expect(text).toContain('### Docs index');
    expect(text).toContain('### Character sheet rules');
  });
});

describe('CLAUDE.md docs index', () => {
  const links = linkedDocs(text);

  it('links at least the system docs', () => {
    expect(links.length).toBeGreaterThan(10);
  });

  it.each(links.map((l) => [l]))('%s exists', (rel) => {
    expect(fs.existsSync(path.join(REPO, rel)), `${rel} is linked from CLAUDE.md but does not exist`).toBe(true);
  });

  it('lists every docs/systems file, so none is written and then never read', () => {
    const files = fs.readdirSync(SYSTEMS_DIR).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThan(5);
    const unlisted = files.filter((f) => !links.includes(`docs/systems/${f}`));
    expect(unlisted, `Add a "Docs index" row in CLAUDE.md for: ${unlisted.join(', ')}`).toEqual([]);
  });

  it('no system doc is an empty shell', () => {
    for (const f of fs.readdirSync(SYSTEMS_DIR).filter((n) => n.endsWith('.md'))) {
      const size = fs.statSync(path.join(SYSTEMS_DIR, f)).size;
      expect(size, `docs/systems/${f} is only ${size} bytes`).toBeGreaterThan(500);
    }
  });
});

describe('linkedDocs', () => {
  it('finds plain and anchored doc links and ignores everything else', () => {
    const md = 'See [a](docs/a.md), [b](docs/systems/b.md#part), [c](https://x.test/docs/c.md), `docs/d.md` and [e](src/e.md).';
    expect(linkedDocs(md).sort()).toEqual(['docs/a.md', 'docs/systems/b.md']);
  });

  it('reports each file once however often it is linked', () => {
    expect(linkedDocs('[x](docs/a.md) [y](docs/a.md#z)')).toEqual(['docs/a.md']);
  });
});
