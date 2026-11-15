import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import FeatureRoute from './FeatureRoute';

let mockCampaign;
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

function renderAt(feature) {
  return render(
    <MemoryRouter initialEntries={['/campaigns/7/characters']}>
      <Routes>
        <Route path="/campaigns/:campaignId/characters" element={<FeatureRoute feature={feature}><p>Guarded page</p></FeatureRoute>} />
        <Route path="/campaigns/:campaignId/dashboard" element={<p>Dashboard 7</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FeatureRoute', () => {
  it('renders the page when the feature is on', () => {
    mockCampaign = { id: 7, campaign_mode: 'full' };
    renderAt('characters');
    expect(screen.getByText('Guarded page')).toBeInTheDocument();
  });

  it('redirects to the dashboard when world-building mode turns the feature off', () => {
    mockCampaign = { id: 7, campaign_mode: 'worldbuilding' };
    renderAt('characters');
    expect(screen.queryByText('Guarded page')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard 7')).toBeInTheDocument();
  });
});
