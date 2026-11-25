import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';

vi.mock('../authService', () => ({ PASSWORD_MIN_LENGTH: 8, default: { resetPassword: vi.fn() } }));
import authService from '../authService';

function renderPage(url = '/reset-password?token=abc123token') {
  return render(<MemoryRouter initialEntries={[url]}><ResetPassword /></MemoryRouter>);
}

function fill(pw, confirm = pw) {
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: pw } });
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: confirm } });
  fireEvent.submit(screen.getByLabelText('New password').closest('form'));
}

describe('ResetPassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the token from the link with the new password, then points to login', async () => {
    authService.resetPassword.mockResolvedValue({ success: true, message: 'Your password has been changed.' });
    renderPage();
    fill('brandnew99');
    expect(await screen.findByTestId('reset-done')).toHaveTextContent('Your password has been changed.');
    expect(authService.resetPassword).toHaveBeenCalledWith('abc123token', 'brandnew99');
    expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute('href', '/login');
  });

  it('refuses a short password before calling the API', async () => {
    renderPage();
    fill('short12');
    expect(await screen.findByTestId('reset-error')).toHaveTextContent('at least 8 characters');
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('refuses mismatched passwords before calling the API', async () => {
    renderPage();
    fill('brandnew99', 'brandnew98');
    expect(await screen.findByTestId('reset-error')).toHaveTextContent("don't match");
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('an expired/used link offers a new one', async () => {
    authService.resetPassword.mockResolvedValue({
      success: false, error: 'This reset link is invalid or has expired. Request a new one.',
    });
    renderPage();
    fill('brandnew99');
    expect(await screen.findByTestId('reset-error')).toHaveTextContent('invalid or has expired');
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('without a token in the URL it explains instead of showing the form', () => {
    renderPage('/reset-password');
    expect(screen.getByTestId('reset-no-token')).toBeInTheDocument();
    expect(screen.queryByLabelText('New password')).toBeNull();
  });
});
