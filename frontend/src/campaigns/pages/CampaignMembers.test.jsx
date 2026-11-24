import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import CampaignMembers from './CampaignMembers';

// The member list, invites and invite search live in MembersPanel (tested in components/MembersPanel.test.jsx);
// this page is a header around it.
vi.mock('../components/MembersPanel', () => ({
  default: ({ campaignId, onMembersLoaded }) => (
    <button data-testid="panel" onClick={() => onMembersLoaded([{ id: 1 }, { id: 2 }])}>
      panel for {campaignId}
    </button>
  ),
}));
vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock('../CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 10, name: 'Test Campaign', userRole: 'gm' } }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/campaigns/10/members']}>
      <Routes>
        <Route path="/campaigns/:campaignId/members" element={<CampaignMembers />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CampaignMembers', () => {
  it('renders the shared MembersPanel for the campaign in the URL', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Campaign Members' })).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toHaveTextContent('panel for 10');
  });

  it('shows the member count once the panel reports it', async () => {
    renderPage();
    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    screen.getByTestId('panel').click();
    expect(await screen.findByText('Test Campaign · 2 members')).toBeInTheDocument();
  });
});
