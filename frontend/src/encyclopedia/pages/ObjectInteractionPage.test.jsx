import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ObjectInteractionPage from './ObjectInteractionPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ObjectInteractionPage />
    </MemoryRouter>
  );
}

describe('ObjectInteractionPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Drawing & Stowing Weapons/i })).toBeInTheDocument();
    expect(screen.getByTestId('object-interaction-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('explains the one free object interaction and why swapping costs a moment', () => {
    renderPage();
    expect(screen.getByText(/One free object interaction per turn/i)).toBeInTheDocument();
    expect(screen.getByText(/two separate interactions/i)).toBeInTheDocument();
  });

  it('documents how Dual Wielder lifts the limit', () => {
    renderPage();
    expect(screen.getByText(/Dual Wielder lifts the limit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dual Wielder/).length).toBeGreaterThan(0);
  });

  it('cross-links to the Loading, Armor Class, and Action Economy pages', () => {
    renderPage();
    expect(screen.getByTestId('object-interaction-loading-link')).toHaveAttribute(
      'href', '/campaigns/5/encyclopedia/mechanics/loading');
    expect(screen.getByTestId('object-interaction-ac-link')).toHaveAttribute(
      'href', '/campaigns/5/encyclopedia/mechanics/armor-class');
    expect(screen.getByTestId('object-interaction-economy-link')).toHaveAttribute(
      'href', '/campaigns/5/encyclopedia/mechanics/action-economy');
  });
});
