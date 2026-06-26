import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JumpPage from './JumpPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <JumpPage />
    </MemoryRouter>
  );
}

describe('JumpPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Jumping' })).toBeInTheDocument();
    expect(screen.getByTestId('jump-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('shows the worked example with the computed STR-16 Athlete numbers', () => {
    renderPage();
    // running long jump = STR 16, standing high jump = 3 (½ of 6)
    expect(screen.getByText(/Strength 16/)).toBeInTheDocument();
    expect(screen.getAllByText(/16 ft/).length).toBeGreaterThan(0);
  });
});
