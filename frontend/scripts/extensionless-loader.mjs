/**
 * Minimal Node ESM resolver hook so plain `node` can load this project's Vite-style modules,
 * which use extensionless relative imports (e.g. `import x from './inventoryData'`) and the
 * `@/` alias (`@` → src/, e.g. `import x from '@/characters/components/inventory/inventoryData'`).
 * Vite/Vitest resolve those; bare Node does not. On a failed resolve we retry with `.js`/`.jsx`,
 * then `/index.js`/`/index.jsx`.
 *
 * Used only by the report scripts (see report-class-coverage). Not part of the app or test build.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RELATIVE = (s) => s.startsWith('./') || s.startsWith('../');
const HAS_EXT = (s) => /\.[mc]?jsx?$/.test(s) || /\.json$/.test(s);
const SRC = new URL('../src/', import.meta.url); // `@` alias target
const SUFFIXES = ['', '.js', '.jsx', '/index.js', '/index.jsx'];

function firstExisting(base) {
  for (const suffix of SUFFIXES) {
    if (!suffix && HAS_EXT(base.pathname)) {
      if (existsSync(fileURLToPath(base))) return { url: base.href, shortCircuit: true };
      continue;
    }
    if (!suffix) continue;
    const candidate = new URL(base.href + suffix);
    if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // `@/` alias → src/ — handled before Node's resolver, which can't see it.
  if (specifier.startsWith('@/')) {
    const hit = firstExisting(new URL(specifier.slice(2), SRC));
    if (hit) return hit;
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (RELATIVE(specifier) && !HAS_EXT(specifier) && context.parentURL) {
      const hit = firstExisting(new URL(specifier, context.parentURL));
      if (hit) return hit;
    }
    throw err;
  }
}
