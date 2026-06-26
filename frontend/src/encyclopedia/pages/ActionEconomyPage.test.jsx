import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActionEconomyPage from './ActionEconomyPage';

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
      <ActionEconomyPage />
    </MemoryRouter>
  );
}

describe('ActionEconomyPage', () => {
  beforeEach(() => {
    mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
  });

  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Action Economy' })).toBeInTheDocument();
    expect(screen.getByTestId('action-economy-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('renders all five buckets and the standard actions', () => {
    renderPage();
    expect(screen.getByText('No Action')).toBeInTheDocument();
    expect(screen.getByText('Action + Bonus Action')).toBeInTheDocument();
    // 5e universal action present
    expect(screen.getByText('Disengage')).toBeInTheDocument();
  });

  it('defaults the edition toggle to the campaign edition and switches to 2024-only actions', () => {
    mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
    renderPage();
    // "Utilize" is a 2024-only universal action — absent under 5e
    expect(screen.queryByText('Utilize')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('action-economy-edition-5.5e'));
    expect(screen.getByText('Utilize')).toBeInTheDocument();
  });
});
