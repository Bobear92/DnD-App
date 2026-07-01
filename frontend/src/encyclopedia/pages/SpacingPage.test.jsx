import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpacingPage from './SpacingPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SpacingPage />
    </MemoryRouter>
  );
}

describe('SpacingPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Spacing & the 5-Foot Rule/i })).toBeInTheDocument();
    expect(screen.getByTestId('spacing-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('explains opportunity attacks and Disengage', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Opportunity attacks/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Disengage/).length).toBeGreaterThan(0);
  });

  it('explains ranged and ranged-spell attacks take disadvantage within 5 feet', () => {
    renderPage();
    expect(screen.getByText(/Ranged attacks in melee/i)).toBeInTheDocument();
    expect(screen.getByText(/Spell attacks in melee/i)).toBeInTheDocument();
  });

  it('lists Crossbow Expert as a modifier that removes the within-5-ft ranged penalty', () => {
    renderPage();
    expect(screen.getByTestId('spacing-modifier-Crossbow Expert')).toBeInTheDocument();
  });

  it('clarifies Sharpshooter does not help with adjacency', () => {
    renderPage();
    expect(screen.getByText(/Sharpshooter/)).toBeInTheDocument();
  });

  it('cross-links to the action economy and loading pages', () => {
    renderPage();
    expect(screen.getByTestId('spacing-economy-link')).toHaveAttribute(
      'href', '/campaigns/5/encyclopedia/mechanics/action-economy');
    expect(screen.getByTestId('spacing-loading-link')).toHaveAttribute(
      'href', '/campaigns/5/encyclopedia/mechanics/loading');
  });
});
