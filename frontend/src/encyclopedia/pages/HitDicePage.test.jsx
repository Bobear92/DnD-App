import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HitDicePage from './HitDicePage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <HitDicePage />
    </MemoryRouter>
  );
}

describe('HitDicePage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Hit Dice' })).toBeInTheDocument();
    expect(screen.getByTestId('hit-dice-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('documents short-rest spending and half-rounded-down long-rest recovery', () => {
    renderPage();
    expect(screen.getAllByText(/Constitution modifier/i).length).toBeGreaterThan(0);
    // RAW recovery: half of total, rounded down — level 5 → 2
    expect(screen.getByText(/half your total, rounded down/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Hit Dice/)).toBeInTheDocument();
  });
});
