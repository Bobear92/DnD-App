import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../authService', () => ({
  default: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
  },
}));

const mockSetUser = vi.fn();
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ setUser: mockSetUser }),
}));

import authService from '../authService';
import Login from './Login';

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

const FAKE_USER = { id: 1, email: 'gm@dnd.com', username: 'gm' };

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ── Login tests ──────────────────────────────────────────────────────────────

describe('Login — successful login', () => {
  beforeEach(() => {
    authService.login.mockResolvedValue({
      success: true,
      data: { access_token: 'tok' },
    });
    authService.getCurrentUser.mockResolvedValue({
      success: true,
      data: FAKE_USER,
    });
  });

  it('calls authService.login with email and password', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'gm@dnd.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /enter the realm/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({
      email: 'gm@dnd.com',
      password: 'password123',
    }));
  });

  it('calls setUser from AuthContext — not just localStorage', async () => {
    // This test specifically guards against the regression where Login only
    // wrote to localStorage but never called setUser, leaving AuthContext.user
    // null and causing ProtectedRoute to bounce the user back to /login.
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'gm@dnd.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /enter the realm/i }));

    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith(FAKE_USER));
  });

  it('navigates to /campaigns when no campaign is stored', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'gm@dnd.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /enter the realm/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns'));
  });

  it('navigates to the campaign dashboard when a campaign is stored', async () => {
    localStorage.setItem('selectedCampaign', JSON.stringify({ id: 7, name: 'Test Campaign' }));
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'gm@dnd.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /enter the realm/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns/7/dashboard'));
  });
});

describe('Login — failed login', () => {
  it('shows the error message and does not navigate', async () => {
    authService.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@dnd.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /enter the realm/i }));

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error when getCurrentUser fails after login', async () => {
    authService.login.mockResolvedValue({ success: true, data: { access_token: 'tok' } });
    authService.getCurrentUser.mockResolvedValue({ success: false, error: 'Server error' });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'gm@dnd.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /enter the realm/i }));

    await waitFor(() => expect(screen.getByText('Failed to load user data')).toBeInTheDocument());
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ── Register tests ───────────────────────────────────────────────────────────

describe('Login — registration', () => {
  beforeEach(() => {
    authService.register.mockResolvedValue({ success: true });
    authService.login.mockResolvedValue({ success: true, data: { access_token: 'tok' } });
    authService.getCurrentUser.mockResolvedValue({ success: true, data: FAKE_USER });
  });

  it('switches to register mode when "Create an account" is clicked', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it('calls setUser and navigates after successful registration', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
    await userEvent.type(screen.getByLabelText(/email/i), 'new@dnd.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'newplayer');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /begin your journey/i }));

    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith(FAKE_USER));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns');
  });

  it('shows error on registration failure', async () => {
    authService.register.mockResolvedValue({ success: false, error: 'Email already taken' });

    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /create an account/i }));
    await userEvent.type(screen.getByLabelText(/email/i), 'taken@dnd.com');
    await userEvent.type(screen.getByLabelText(/username/i), 'someone');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /begin your journey/i }));

    await waitFor(() => expect(screen.getByText('Email already taken')).toBeInTheDocument());
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});
