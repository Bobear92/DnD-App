// THE axios client factory. Every service builds its client here (src/test/singleApiClient.test.js fails the build
// on an `axios.create` or an interceptor anywhere else), so auth and session expiry are handled in one place.
//
// Before this, 13 services each copied the same token interceptor and none noticed an expired login: every request
// failed with "Could not validate credentials" while the player stayed on the page, and only a reload sent them to
// /login (post-deploy ticket T6).

import axios from 'axios';

/** Login, register and search never mean "your session ended": a wrong password is a 401 too. */
const AUTH_ENDPOINTS_THAT_401 = ['/auth/login', '/auth/register'];

let redirecting = false;

/**
 * The token this browser holds was rejected: clear it and send the user to log in again — once, however many
 * requests fail at the same moment. `go` is injectable for tests.
 */
export function handleSessionExpired(go = (path) => window.location.assign(path)) {
  if (redirecting) return;
  redirecting = true;
  localStorage.removeItem('token');
  localStorage.removeItem('selectedCampaign');
  go('/login?expired=1');
}

/** Tests only: allow another redirect. */
export function _resetSessionExpiredGuard() {
  redirecting = false;
}

/** True when a failed request means the user's session is over (not a wrong password, not an anonymous call). */
export function isExpiredSessionError(error) {
  if (error?.response?.status !== 401) return false;
  const sentToken = Boolean(error.config?.headers?.Authorization);
  const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
  return sentToken && !AUTH_ENDPOINTS_THAT_401.some((p) => url.includes(p));
}

/** An axios client for `baseURL` that sends the login token and handles an expired session. */
export function createApiClient(baseURL, { headers } = {}) {
  const client = axios.create({ baseURL, ...(headers ? { headers } : {}) });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isExpiredSessionError(error)) handleSessionExpired();
      return Promise.reject(error);
    },
  );

  return client;
}
