import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

vi.mock('../authService', () => ({ default: { forgotPassword: vi.fn() } }));
import authService from '../authService';

const SAME_REPLY = "If an account uses that email, we've sent a link to reset its password.";

function renderPage() {
  return render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
}

describe('ForgotPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the trimmed email and shows the server reply', async () => {
    authService.forgotPassword.mockResolvedValue({ success: true, message: SAME_REPLY });
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  me@example.com ' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByTestId('forgot-sent')).toHaveTextContent(SAME_REPLY);
    expect(authService.forgotPassword).toHaveBeenCalledWith('me@example.com');
    expect(screen.queryByLabelText('Email')).toBeNull();
  });

  it('never says an account does not exist — it shows whatever the server replied', async () => {
    authService.forgotPassword.mockResolvedValue({ success: true, message: SAME_REPLY });
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nobody@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await screen.findByTestId('forgot-sent');
    expect(screen.queryByText(/no account|not found|doesn't exist/i)).toBeNull();
  });

  it('shows an error (e.g. throttled) and keeps the form', async () => {
    authService.forgotPassword.mockResolvedValue({ success: false, error: 'Too many reset requests. Try again later.' });
    renderPage();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'me@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText(/too many reset requests/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('the send button waits for an email and there is a way back to login', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login');
  });
});
