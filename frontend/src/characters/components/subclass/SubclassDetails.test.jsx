import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SubclassDetails from '@/characters/components/subclass/SubclassDetails';

// Rendered on a real campaign route so the component's own useParams() sees a campaignId —
// that is where the encyclopedia link's path comes from.
function renderOnRoute(props, campaignId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}/characters/9`]}>
      <Routes>
        <Route path="/campaigns/:campaignId/characters/:characterId" element={<SubclassDetails {...props} />} />
      </Routes>
    </MemoryRouter>
  );
}

const ARCANE_ARCHER = { className: 'Fighter', edition: '5e', subclassName: 'Arcane Archer', level: 3 };

describe('SubclassDetails', () => {
  it('lists only the features earned at this level', () => {
    renderOnRoute(ARCANE_ARCHER);
    expect(screen.getByTestId('feature-toggle-Arcane Shot')).toBeInTheDocument();
    // Curving Shot is a level-7 feature.
    expect(screen.queryByTestId('feature-toggle-Curving Shot')).not.toBeInTheDocument();
  });

  it('expands a feature description on click', () => {
    renderOnRoute(ARCANE_ARCHER);
    const toggle = screen.getByTestId('feature-toggle-Arcane Shot');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  // The sheet shows only what's earned, so the full subclass (every level) lives in the
  // encyclopedia — the link is how you get there from the character sheet.
  it('links to the subclass encyclopedia page, URL-encoding the names', () => {
    renderOnRoute(ARCANE_ARCHER, '4');
    expect(screen.getByTestId('subclass-encyclopedia-link')).toHaveAttribute(
      'href',
      '/campaigns/4/encyclopedia/classes/Fighter/Arcane%20Archer'
    );
  });

  // It reads as part of the subclass blurb, not as a footnote under a list of features whose
  // length varies with level.
  it('places the link under the description, above the features list', () => {
    renderOnRoute(ARCANE_ARCHER);
    const link = screen.getByTestId('subclass-encyclopedia-link');
    const firstFeature = screen.getByTestId('feature-toggle-Arcane Shot');
    // DOCUMENT_POSITION_FOLLOWING = the feature comes after the link.
    expect(link.compareDocumentPosition(firstFeature) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('omits the link when rendered outside a campaign route', () => {
    render(
      <MemoryRouter>
        <SubclassDetails {...ARCANE_ARCHER} />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('subclass-encyclopedia-link')).not.toBeInTheDocument();
  });

  it('falls back to the bare subclass name when there is no data for it', () => {
    renderOnRoute({ ...ARCANE_ARCHER, subclassName: 'Nonsense' });
    expect(screen.getByText('Nonsense')).toBeInTheDocument();
    expect(screen.queryByTestId('subclass-encyclopedia-link')).not.toBeInTheDocument();
  });
});
