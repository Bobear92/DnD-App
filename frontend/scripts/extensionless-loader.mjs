/**
 * Minimal Node ESM resolver hook so plain `node` can load this project's Vite-style modules,
 * which use extensionless relative imports (e.g. `import x from './inventoryData'`). Vite/Vitest
 * resolve those; bare Node does not. On a failed resolve we retry with `.js`, then `/index.js`.
 *
 * Used only by the report scripts (see report-class-coverage). Not part of the app or test build.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RELATIVE = (s) => s.startsWith('./') || s.startsWith('../');
const HAS_EXT = (s) => /\.[mc]?jsx?$/.test(s) || /\.json$/.test(s);

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (RELATIVE(specifier) && !HAS_EXT(specifier) && context.parentURL) {
      for (const suffix of ['.js', '/index.js']) {
        const candidate = new URL(specifier + suffix, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) {
          return { url: candidate.href, shortCircuit: true };
        }
      }
    }
    throw err;
  }
}
