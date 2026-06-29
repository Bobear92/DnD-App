import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoadingPage from './LoadingPage';

let mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LoadingPage />
    </MemoryRouter>
  );
}

describe('LoadingPage', () => {
  beforeEach(() => {
    mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
  });

  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByTestId('loading-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('5e: lists the four loading weapons and the helper-sourced cap + ignored notes', () => {
    renderPage();
    expect(screen.getAllByText(/Light Crossbow/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hand Crossbow/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Heavy Crossbow/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Blowgun/).length).toBeGreaterThan(0);
    // Note text comes from weaponLoadingNote — can't drift from the sheet.
    expect(screen.getByText(/only one attack per action/i)).toBeInTheDocument();
    expect(screen.getByText(/ignored \(Crossbow Expert\)/i)).toBeInTheDocument();
  });

  it('5e: documents the in-app feats/features that change it', () => {
    renderPage();
    // "Crossbow Expert" / "Action Surge" appear in both the features section and the example.
    expect(screen.getAllByText('Crossbow Expert').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Action Surge').length).toBeGreaterThan(0);
    expect(screen.getByText('War Priest')).toBeInTheDocument();
  });

  it('defaults the edition toggle to the campaign edition and switches to the 2024 "removed" copy', () => {
    renderPage();
    // 5e content present by default
    expect(screen.getByText(/What the Loading property does/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('loading-edition-5.5e'));
    expect(screen.getByText(/removed the Loading property/i)).toBeInTheDocument();
    // 5e-only section gone under 2024
    expect(screen.queryByText(/What the Loading property does/)).not.toBeInTheDocument();
  });
});
