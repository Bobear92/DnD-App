import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: the backend's address lives in ONE place, `src/lib/api.js` (API_ORIGIN / API_BASE /
 * uploadUrl), which reads VITE_API_URL at build time.
 *
 * Before this guard the dev URL `http://localhost:8000` was hardcoded 22 times across services and
 * components, so a deployed frontend would have kept calling the developer's own machine. Any new
 * service or upload URL must import from `@/lib/api` instead.
 *
 * Test files are exempt: their service mocks may build fake URLs. Lives in the test suite rather
 * than ESLint for the same reason as noNestedComponents (`npx eslint .` is not a gate here).
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = path.join(SRC, 'lib', 'api.js');

// The dev backend's origin in any spelling we have used or might.
const HARDCODED_BACKEND = /(?:localhost|127\.0\.0\.1):8000/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(e.name) && !/\.test\.(js|jsx)$/.test(e.name) ? [full] : [];
  });
}

export function findHardcodedBackend(text) {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter(({ text: t }) => HARDCODED_BACKEND.test(t));
}

describe('no hardcoded backend URL outside src/lib/api.js', () => {
  it('detects the forms it is meant to catch (self-test)', () => {
    expect(findHardcodedBackend("const BASE_URL = 'http://localhost:8000/api';")).toHaveLength(1);
    expect(findHardcodedBackend('src={`http://localhost:8000/${p}`}')).toHaveLength(1);
    expect(findHardcodedBackend("fetch('http://127.0.0.1:8000/api/x')")).toHaveLength(1);
    expect(findHardcodedBackend('const url = uploadUrl(value);')).toHaveLength(0);
    expect(findHardcodedBackend("const BASE_URL = `${API_BASE}/gm/campaigns`;")).toHaveLength(0);
  });

  it('still finds the one legitimate occurrence, so the scan is really reading files', () => {
    expect(findHardcodedBackend(fs.readFileSync(ALLOWED, 'utf8')).length).toBeGreaterThan(0);
  });

  it('no source file outside src/lib/api.js hardcodes the backend', () => {
    const offenders = walk(SRC)
      .filter((f) => f !== ALLOWED)
      .flatMap((f) =>
        findHardcodedBackend(fs.readFileSync(f, 'utf8')).map(
          (h) => `${path.relative(SRC, f)}:${h.line}  ${h.text}`,
        ),
      );
    expect(offenders, `Import API_BASE / API_ORIGIN / uploadUrl from '@/lib/api' instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});
