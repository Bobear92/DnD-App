import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';

let mockCampaign;
vi.mock('../../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/campaigns/3/dashboard']}>
      <Routes>
        <Route path="/campaigns/:campaignId/*" element={<Sidebar collapsed={false} toggleSidebar={() => {}} />} />
      </Routes>
    </MemoryRouter>,
  );
}

const RULES_LINKS = ['Characters', 'Encounters', 'Encyclopedia'];
const LORE_LINKS = ['NPCs', 'Locations', 'Timeline', 'Calendar', 'Session Notes', 'Campaign Settings'];

describe('Sidebar — campaign mode', () => {
  it('shows the rules features to the GM of a full campaign', () => {
    mockCampaign = { id: 3, userRole: 'gm', campaign_mode: 'full' };
    renderSidebar();
    [...RULES_LINKS, ...LORE_LINKS].forEach(l => expect(screen.getByText(l)).toBeInTheDocument());
  });

  it('hides characters, encounters and the encyclopedia from the GM in world-building mode', () => {
    mockCampaign = { id: 3, userRole: 'gm', campaign_mode: 'worldbuilding' };
    renderSidebar();
    RULES_LINKS.forEach(l => expect(screen.queryByText(l)).not.toBeInTheDocument());
    LORE_LINKS.forEach(l => expect(screen.getByText(l)).toBeInTheDocument());
  });

  it('hides My Characters and the encyclopedia from players in world-building mode', () => {
    mockCampaign = { id: 3, userRole: 'player', campaign_mode: 'worldbuilding' };
    renderSidebar();
    expect(screen.queryByText('My Characters')).not.toBeInTheDocument();
    expect(screen.queryByText('Encyclopedia')).not.toBeInTheDocument();
    expect(screen.getByText('NPCs')).toBeInTheDocument();
  });

  it('treats a stored campaign without the setting as full', () => {
    mockCampaign = { id: 3, userRole: 'player' };
    renderSidebar();
    expect(screen.getByText('My Characters')).toBeInTheDocument();
  });
});

describe('Sidebar — order', () => {
  it('puts Campaign Settings first in the GM nav', () => {
    mockCampaign = { id: 3, userRole: 'gm', campaign_mode: 'full' };
    renderSidebar();
    const links = screen.getAllByRole('link').map(a => a.textContent.trim()).filter(Boolean);
    expect(links[0]).toBe('Campaign Settings');
    expect(links[1]).toBe('Dashboard');
  });
});
