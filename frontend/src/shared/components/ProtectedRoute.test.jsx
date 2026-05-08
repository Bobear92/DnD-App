import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function renderProtected(ui) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={<ProtectedRoute>{ui}</ProtectedRoute>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders nothing while auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    const { container } = renderProtected(<div>Secret</div>);
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to /login when user is null and loading is false', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderProtected(<div>Secret</div>);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({ user: { id: 1, email: 'gm@dnd.com' }, loading: false });
    renderProtected(<div>Secret</div>);
    expect(screen.getByText('Secret')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
