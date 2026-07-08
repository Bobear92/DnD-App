import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArmorClassPage from './ArmorClassPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ArmorClassPage />
    </MemoryRouter>
  );
}

describe('ArmorClassPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    expect.assertions(2);
    renderPage();
    expect(screen.getByRole('heading', { name: 'Armor Class' })).toBeInTheDocument();
    expect(screen.getByTestId('armor-class-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('shows worked-example AC values computed from the real helpers', () => {
    renderPage();
    // Chain Mail (heavy 16) + shield +2 = 18; unarmored Barbarian 10+2+3 = 15
    expect(screen.getByText(/AC 18/)).toBeInTheDocument();
    expect(screen.getByText(/AC 15/)).toBeInTheDocument();
  });

  it('explains armor proficiency and its penalties', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Armor proficiency' })).toBeInTheDocument();
    expect(screen.getByText(/disadvantage on every ability check/i)).toBeInTheDocument();
    expect(screen.getByText(/can't cast spells/i)).toBeInTheDocument();
  });

  it('explains armor Strength requirements and the −10 ft speed penalty', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Strength requirements' })).toBeInTheDocument();
    expect(screen.getByText(/reduced by 10\s*feet/i)).toBeInTheDocument();
    expect(screen.getByText(/lower than the listed\s*requirement/i)).toBeInTheDocument();
  });
});
