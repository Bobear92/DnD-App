import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ManeuversPage from './ManeuversPage';

let mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '1' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ManeuversPage />
    </MemoryRouter>
  );
}

describe('ManeuversPage', () => {
  beforeEach(() => {
    mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
  });

  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByText('Battle Master Maneuvers')).toBeInTheDocument();
    expect(screen.getByTestId('maneuvers-back')).toHaveAttribute(
      'href',
      '/campaigns/1/encyclopedia'
    );
  });

  it('lists the 16 PHB 2014 maneuvers by default', () => {
    renderPage();
    expect(screen.getByText('16 maneuvers')).toBeInTheDocument();
    expect(screen.getByTestId('maneuver-toggle-Trip Attack')).toBeInTheDocument();
  });

  it('defaults the edition toggle to the campaign edition', () => {
    mockCampaign = { id: 1, edition: '5.5e', userRole: 'gm' };
    renderPage();
    // 2024-only maneuver present
    expect(screen.getByTestId('maneuver-toggle-Ambush')).toBeInTheDocument();
  });

  it('switches the list when the edition toggle changes', () => {
    renderPage();
    // 2014 list: no Ambush
    expect(screen.queryByTestId('maneuver-toggle-Ambush')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('maneuvers-edition-5.5e'));
    expect(screen.getByTestId('maneuver-toggle-Ambush')).toBeInTheDocument();
  });

  it('expands a maneuver to show its description', () => {
    renderPage();
    expect(screen.queryByText(/knock the target down/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('maneuver-toggle-Trip Attack'));
    expect(screen.getByText(/knock the target down/i)).toBeInTheDocument();
  });

  it('filters maneuvers by search', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('maneuvers-search'), {
      target: { value: 'parry' },
    });
    expect(screen.getByText('1 maneuver')).toBeInTheDocument();
    expect(screen.getByTestId('maneuver-toggle-Parry')).toBeInTheDocument();
    expect(screen.queryByTestId('maneuver-toggle-Trip Attack')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('maneuvers-search'), {
      target: { value: 'zzzzz' },
    });
    expect(screen.getByText('No maneuvers match your search.')).toBeInTheDocument();
  });
});
