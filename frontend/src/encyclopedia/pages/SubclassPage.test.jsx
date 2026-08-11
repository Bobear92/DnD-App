import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SubclassPage from './SubclassPage';

let mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

// The subclass name arrives URL-encoded ("Arcane%20Archer") — the page decodes both params.
let mockParams = { campaignId: '1', className: 'Fighter', subclassName: 'Arcane%20Archer' };
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => mockParams,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SubclassPage />
    </MemoryRouter>
  );
}

describe('SubclassPage', () => {
  beforeEach(() => {
    mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
    mockParams = { campaignId: '1', className: 'Fighter', subclassName: 'Arcane%20Archer' };
  });

  it('renders the decoded subclass name, its class, and a back link', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Arcane Archer' })).toBeInTheDocument();
    expect(screen.getByText('Fighter subclass')).toBeInTheDocument();
    expect(screen.getByTestId('subclass-page-back')).toHaveAttribute(
      'href',
      '/campaigns/1/encyclopedia'
    );
  });

  // The whole point of the page over the sheet's own block: every level, not just what's earned.
  it('shows the subclass features at every level, not only the early ones', () => {
    renderPage();
    const body = screen.getByTestId('subclass-page-body');
    expect(body).toHaveTextContent('Arcane Shot');
    expect(body).toHaveTextContent('Curving Shot');
    expect(body).toHaveTextContent('Ever-Ready Shot');
  });

  it('defaults to the campaign edition', () => {
    // Champion exists in both editions, so the default is visible either way.
    mockCampaign = { id: 1, edition: '5.5e', userRole: 'gm' };
    mockParams = { campaignId: '1', className: 'Fighter', subclassName: 'Champion' };
    renderPage();
    expect(screen.getByTestId('subclass-page-body')).toHaveTextContent('2024 Rules');
  });

  it('switches edition with the toggle', () => {
    renderPage();
    expect(screen.getByTestId('subclass-page-body')).toHaveTextContent('5e (2014)');
    fireEvent.click(screen.getByTestId('subclass-page-edition-5.5e'));
    // Arcane Archer is a 5e-only subclass, so 2024 has nothing to show — the overview says so
    // rather than rendering a blank page.
    expect(screen.getByTestId('subclass-page-body')).toHaveTextContent(/not available/i);
  });

  it('renders the Battle Master maneuvers link with the campaign in its path', () => {
    mockParams = { campaignId: '7', className: 'Fighter', subclassName: 'Battle%20Master' };
    renderPage();
    expect(screen.getByTestId('subclass-maneuvers-link')).toHaveAttribute(
      'href',
      '/campaigns/7/encyclopedia/maneuvers'
    );
  });

  it('falls back to the overview empty state for an unknown subclass', () => {
    mockParams = { campaignId: '1', className: 'Fighter', subclassName: 'Nonsense' };
    renderPage();
    expect(screen.getByTestId('subclass-page-body')).toHaveTextContent(/not available/i);
  });
});
