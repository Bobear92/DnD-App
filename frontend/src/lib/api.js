// The ONE place the frontend learns where the backend lives.
//
// Locally nothing needs setting: it falls back to the dev backend on :8000. A deployed build sets
// VITE_API_URL (e.g. https://dnd-api.onrender.com) at BUILD time — Vite bakes it into the bundle,
// so changing it needs a rebuild. Never put a secret in a VITE_ variable; it ships to every browser.
//
// src/test/noHardcodedApiUrl.test.js fails the build if a backend URL is hardcoded anywhere else.

const DEV_ORIGIN = 'http://localhost:8000';

/** The backend origin, without a trailing slash. Used directly only by routes mounted outside /api (feats). */
export const API_ORIGIN = (import.meta.env.VITE_API_URL || DEV_ORIGIN).replace(/\/+$/, '');

/** Base for every `/api/...` route. */
export const API_BASE = `${API_ORIGIN}/api`;

/**
 * Where uploaded files are served from. Locally the backend serves them at /uploads. In production
 * they live in a Cloudflare R2 bucket (backend/shared/file_storage.py) and VITE_UPLOADS_URL is that
 * bucket's public URL — the stored key `uploads/...` is the object key, so the same path works on both.
 */
export const UPLOADS_ORIGIN = (import.meta.env.VITE_UPLOADS_URL || API_ORIGIN).replace(/\/+$/, '');

/**
 * Turn a stored upload path (`uploads/characters/3/abc.png`) into a URL the browser can load.
 * Returns null for an empty path so callers can render "no image".
 */
export function uploadUrl(path) {
  if (!path) return null;
  return `${UPLOADS_ORIGIN}/${String(path).replace(/^\/+/, '')}`;
}
