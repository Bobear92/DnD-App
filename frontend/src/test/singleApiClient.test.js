import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Guard: every request to the backend goes through `createApiClient` in `src/lib/apiClient.js`, which attaches the
 * login token AND sends the user to /login when the server rejects an expired one.
 *
 * Before this, 13 services each copied their own `axios.create` + token interceptor (and SpellList used a raw
 * `fetch` with a hand-built header), and none of them noticed an expired login — the page just failed every request
 * until a reload (post-deploy ticket T6). A new copy would silently skip expiry handling again, so the build fails on:
 *   - `axios.create(` or `.interceptors.` anywhere but apiClient.js
 *   - a direct `axios.get/post/put/patch/delete(` call
 *   - a raw `fetch(` call
 *   - building `Authorization: \`Bearer ...\`` by hand
 * Test files are exempt (their mocks build fake clients).
 */

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = path.join(SRC, 'lib', 'apiClient.js');

const RULES = [
  { name: 'axios.create', re: /\baxios\.create\(/ },
  { name: 'interceptors', re: /\.interceptors\./ },
  { name: 'direct axios call', re: /\baxios\.(get|post|put|patch|delete|request)\(/ },
  { name: 'raw fetch', re: /(^|[^.\w])fetch\(/ },
  { name: 'hand-built Bearer header', re: /Bearer \$\{/ },
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(e.name) && !/\.test\.(js|jsx)$/.test(e.name) ? [full] : [];
  });
}

export function findClientBypasses(text) {
  return text
    .split(/\r?\n/)
    .map((line, i) => ({ line: i + 1, text: line.trim() }))
    .filter(({ text: t }) => !t.startsWith('//') && !t.startsWith('*'))
    .flatMap(({ line, text: t }) => RULES.filter((r) => r.re.test(t)).map((r) => ({ line, rule: r.name, text: t })));
}

describe('one API client: no request bypasses src/lib/apiClient.js', () => {
  it('detects what it is meant to catch (self-test)', () => {
    expect(findClientBypasses("const api = axios.create({ baseURL: X });")).toHaveLength(1);
    expect(findClientBypasses("api.interceptors.request.use((c) => c);")).toHaveLength(1);
    expect(findClientBypasses("const r = await axios.post(url, body);")).toHaveLength(1);
    expect(findClientBypasses("const res = await fetch(`${API_BASE}/x`);")).toHaveLength(1);
    expect(findClientBypasses("headers: { Authorization: `Bearer ${token}` },")).toHaveLength(1);
  });

  it('ignores what it should (self-test)', () => {
    expect(findClientBypasses("const api = createApiClient(BASE_URL);")).toHaveLength(0);
    expect(findClientBypasses("// before: axios.create( ... ) and fetch( ... )")).toHaveLength(0);
    expect(findClientBypasses("fetchSpellCatalog(campaignId, edition).then(setCatalog);")).toHaveLength(0);
    expect(findClientBypasses("await api.get('/x');")).toHaveLength(0);
  });

  it('finds no bypass in src/ outside lib/apiClient.js', () => {
    const offenders = walk(SRC)
      .filter((f) => f !== ALLOWED)
      .flatMap((f) => findClientBypasses(fs.readFileSync(f, 'utf8')).map((o) => `${path.relative(SRC, f)}:${o.line} [${o.rule}] ${o.text}`));
    expect(offenders, `Use createApiClient from @/lib/apiClient instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});
