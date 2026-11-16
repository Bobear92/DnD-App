import { describe, it, expect, vi, afterEach } from 'vitest';

// api.js reads VITE_API_URL / VITE_UPLOADS_URL once at import time, so each case re-imports it.
async function load(env, uploadsEnv) {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (env !== undefined) vi.stubEnv('VITE_API_URL', env);
  vi.stubEnv('VITE_UPLOADS_URL', uploadsEnv ?? '');
  return import('./api');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('api base URL', () => {
  it('falls back to the local dev backend when VITE_API_URL is unset', async () => {
    const api = await load('');
    expect(api.API_ORIGIN).toBe('http://localhost:8000');
    expect(api.API_BASE).toBe('http://localhost:8000/api');
  });

  it('uses VITE_API_URL when set', async () => {
    const api = await load('https://dnd-api.example.com');
    expect(api.API_ORIGIN).toBe('https://dnd-api.example.com');
    expect(api.API_BASE).toBe('https://dnd-api.example.com/api');
  });

  it('drops trailing slashes so paths never double up', async () => {
    const api = await load('https://dnd-api.example.com//');
    expect(api.API_BASE).toBe('https://dnd-api.example.com/api');
  });
});

describe('uploadUrl', () => {
  it('returns null for an empty path so callers can show "no image"', async () => {
    const { uploadUrl } = await load('');
    expect(uploadUrl(null)).toBeNull();
    expect(uploadUrl(undefined)).toBeNull();
    expect(uploadUrl('')).toBeNull();
  });

  it('prefixes a stored upload path with the backend origin', async () => {
    const { uploadUrl } = await load('https://dnd-api.example.com');
    expect(uploadUrl('uploads/characters/3/a.png')).toBe('https://dnd-api.example.com/uploads/characters/3/a.png');
  });

  it('serves uploads from the R2 public URL when VITE_UPLOADS_URL is set (production)', async () => {
    const api = await load('https://dnd-api.example.com', 'https://pub-abc.r2.dev/');
    expect(api.uploadUrl('uploads/maps/1/2/m.png')).toBe('https://pub-abc.r2.dev/uploads/maps/1/2/m.png');
    // API calls still go to the backend
    expect(api.API_BASE).toBe('https://dnd-api.example.com/api');
  });

  it('falls back to the backend for uploads when VITE_UPLOADS_URL is unset (dev)', async () => {
    const { UPLOADS_ORIGIN } = await load('https://dnd-api.example.com');
    expect(UPLOADS_ORIGIN).toBe('https://dnd-api.example.com');
  });

  it('does not double the slash when the stored path starts with one', async () => {
    const { uploadUrl } = await load('');
    expect(uploadUrl('/uploads/npcs/1/2/b.png')).toBe('http://localhost:8000/uploads/npcs/1/2/b.png');
  });
});
