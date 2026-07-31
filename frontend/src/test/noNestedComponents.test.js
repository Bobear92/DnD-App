import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: no component may be DECLARED INSIDE another component.
 *
 * A component defined in another component's body is a brand-new component type on every
 * render. React cannot match it to the previous tree, so it unmounts the old subtree and
 * mounts a fresh one — destroying all local state underneath. That shipped as a real bug:
 * all 20 hand-written class sheets declared their own `Field` in-render, so any parent
 * re-render (a late fetch during character creation, an autosave on the live sheet) wiped
 * a half-typed custom instrument or closed an open subclass dialog.
 *
 * This lives in the test suite rather than ESLint because `npx eslint .` currently reports
 * ~376 pre-existing errors, so a lint rule would not be seen. `npm test` is enforced by the
 * Stop hook and CI.
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// An indented `const Foo = (` / `function Foo(` where Foo is PascalCase: indentation means it
// is inside another function body. Module-level declarations start at column 0 and are fine.
const NESTED = /^[ \t]+(?:const|let|var)\s+([A-Z][A-Za-z0-9]*)\s*=\s*(?:React\.)?(?:memo\()?\(|^[ \t]+function\s+([A-Z][A-Za-z0-9]*)\s*\(/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.jsx$/.test(e.name) && !/\.test\.jsx$/.test(e.name) ? [full] : [];
  });
}

/** Lines that both match the nested shape AND actually return JSX (so it is a component). */
function findNestedComponents(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const hits = [];
  lines.forEach((line, i) => {
    const m = line.match(NESTED);
    if (!m) return;
    const name = m[1] || m[2];
    // Look at the next few lines: a component renders markup, a helper/object does not.
    const window = lines.slice(i, i + 4).join('\n');
    if (!/<[A-Za-z]/.test(window)) return; // not JSX — a plain helper or lookup table
    hits.push(`${path.relative(SRC, file).replace(/\\/g, '/')}:${i + 1} — ${name}`);
  });
  return hits;
}

describe('no components declared inside components', () => {
  it('every .jsx file declares its components at module scope', () => {
    const offenders = walk(SRC).flatMap(findNestedComponents);
    expect(offenders).toEqual([]);
  });

  it('the detector actually catches the shape it is guarding against', () => {
    // Guards the guard: if the regex stops matching, the suite above would pass vacuously.
    const tmp = path.join(SRC, 'test', '__nested_fixture.jsx');
    fs.writeFileSync(
      tmp,
      'export default function Outer() {\n' +
        '  const Inner = ({ label }) => (\n    <div>{label}</div>\n  );\n' +
        '  return <Inner label="x" />;\n}\n',
    );
    try {
      expect(findNestedComponents(tmp)).toHaveLength(1);
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
