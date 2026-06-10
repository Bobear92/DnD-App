// Registers the extensionless-import resolver hook before the report module loads, so the
// report can import the project's Vite-style (extensionless) modules under plain Node.
import { register } from 'node:module';
register('./extensionless-loader.mjs', import.meta.url);
