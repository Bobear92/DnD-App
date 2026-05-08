import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

// Mock authService so tests don't hit the real API
vi.mock('./authService', () => ({
  default: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

import authService from './authService';

// Helper: render a component that reads from AuthContext
function ContextConsumer() {
  const ctx = useAuth();
  return (
    <div>
      <span data-testid="user">{ctx.user ? ctx.user.email : 'null'}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="has-setUser">{typeof ctx.setUser === 'function' ? 'yes' : 'no'}</span>
      <button onClick={ctx.logout}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <ContextConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('starts with loading=true then resolves to user=null when no token', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('fetches and sets user when a token exists in localStorage', async () => {
    localStorage.setItem('token', 'valid-token');
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: 1, email: 'gm@dnd.com', username: 'gm' },
    });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('gm@dnd.com');
    });
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('clears the token when the stored token is invalid', async () => {
    localStorage.setItem('token', 'bad-token');
    authService.getCurrentUser.mockResolvedValue({ success: false });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('exposes setUser so consumers can update the user without a round-trip', async () => {
    renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    // setUser must be in the context value — this is what Login relies on
    expect(screen.getByTestId('has-setUser').textContent).toBe('yes');
  });

  it('logout clears the user from context and calls authService.logout', async () => {
    localStorage.setItem('token', 'valid-token');
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: 1, email: 'gm@dnd.com', username: 'gm' },
    });

    const { getByRole } = renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('gm@dnd.com');
    });

    getByRole('button', { name: 'logout' }).click();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
    expect(authService.logout).toHaveBeenCalled();
  });

  it('logout clears selectedCampaign from localStorage so stale role cannot persist', async () => {
    localStorage.setItem('token', 'valid-token');
    localStorage.setItem('selectedCampaign', JSON.stringify({ id: 1, userRole: 'player' }));
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: { id: 1, email: 'gm@dnd.com', username: 'gm' },
    });
    // authService.logout must clear selectedCampaign
    authService.logout.mockImplementation(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedCampaign');
    });

    const { getByRole } = renderWithProvider();
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('gm@dnd.com');
    });

    getByRole('button', { name: 'logout' }).click();

    expect(localStorage.getItem('selectedCampaign')).toBeNull();
  });
});
