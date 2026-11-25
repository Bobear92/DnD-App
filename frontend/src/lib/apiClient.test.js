import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createApiClient, handleSessionExpired, isExpiredSessionError, _resetSessionExpiredGuard,
} from './apiClient';

// Run a request through the client's real interceptors with a fake transport (no network).
function clientWith(adapter, base = 'http://api.test/api/gm/campaigns') {
  const client = createApiClient(base);
  client.defaults.adapter = adapter;
  return client;
}
const reply = (status, data = {}) => async (config) => {
  if (status < 400) return { status, data, headers: {}, config, statusText: 'OK' };
  const err = new Error(`HTTP ${status}`);
  err.config = config;
  err.response = { status, data, headers: {}, config };
  throw err;
};

let assign;
beforeEach(() => {
  localStorage.clear();
  _resetSessionExpiredGuard();
  assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
});

describe('createApiClient — the one client every service uses', () => {
  it('sends the stored login token', async () => {
    localStorage.setItem('token', 'tok-123');
    let seen;
    await clientWith(async (config) => { seen = config.headers.Authorization; return reply(200)(config); }).get('/1');
    expect(seen).toBe('Bearer tok-123');
  });

  it('sends no Authorization header when logged out', async () => {
    let seen = 'unset';
    await clientWith(async (config) => { seen = config.headers.Authorization; return reply(200)(config); }).get('/1');
    expect(seen).toBeUndefined();
  });

  it('an expired login (401 on a request that carried a token) clears it and goes to /login?expired=1', async () => {
    localStorage.setItem('token', 'old');
    localStorage.setItem('selectedCampaign', '{"id":1}');
    await expect(clientWith(reply(401, { detail: 'Could not validate credentials' })).get('/1')).rejects.toThrow();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('selectedCampaign')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login?expired=1');
  });

  it('many requests failing at once redirect only once', async () => {
    localStorage.setItem('token', 'old');
    const client = clientWith(reply(401));
    await Promise.allSettled([client.get('/1'), client.get('/2'), client.get('/3')]);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('a wrong password on login is NOT a session expiry', async () => {
    localStorage.setItem('token', 'still-valid');
    const auth = clientWith(reply(401, { detail: 'Invalid email or password' }), 'http://api.test/api/auth');
    await expect(auth.post('/login', {})).rejects.toThrow();
    expect(assign).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('still-valid');
  });

  it('a 401 for an anonymous request does not redirect', async () => {
    await expect(clientWith(reply(401)).get('/1')).rejects.toThrow();
    expect(assign).not.toHaveBeenCalled();
  });

  it('403 and 500 pass through untouched — the caller still gets the error', async () => {
    localStorage.setItem('token', 'tok');
    for (const status of [403, 500]) {
      const err = await clientWith(reply(status, { detail: 'nope' })).get('/1').catch((e) => e);
      expect(err.response.status).toBe(status);
    }
    expect(assign).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('tok');
  });
});

describe('isExpiredSessionError / handleSessionExpired', () => {
  const err = (status, url, auth = 'Bearer x') => ({
    response: { status }, config: { baseURL: 'http://api.test/api', url, headers: auth ? { Authorization: auth } : {} },
  });

  it('classifies', () => {
    expect(isExpiredSessionError(err(401, '/characters/1'))).toBe(true);
    expect(isExpiredSessionError(err(401, '/auth/login'))).toBe(false);
    expect(isExpiredSessionError(err(401, '/auth/register'))).toBe(false);
    expect(isExpiredSessionError(err(401, '/characters/1', null))).toBe(false);
    expect(isExpiredSessionError(err(403, '/characters/1'))).toBe(false);
    expect(isExpiredSessionError({ message: 'Network Error' })).toBe(false);
  });

  it('uses the injected navigator', () => {
    const go = vi.fn();
    handleSessionExpired(go);
    expect(go).toHaveBeenCalledWith('/login?expired=1');
  });
});
