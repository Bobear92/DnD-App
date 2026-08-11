import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClassPage from './ClassPage';
import classService from '../../characters/classService';

let mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
vi.mock('../../campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: mockCampaign }),
}));

// A class name can contain a space once homebrew classes exist, so the param is URL-encoded.
let mockParams = { campaignId: '1', className: 'Fighter' };
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => mockParams,
}));

vi.mock('../../characters/classService', () => ({
  default: { getClassByName: vi.fn() },
}));

// Enough of a class row for ClassOverview: the header chips, the progression table and the
// per-level feature prose. Levels 1 and 20 prove the page shows the WHOLE class, not what's earned.
function fighterRow(edition = '5e') {
  return {
    name: 'Fighter',
    edition,
    flavor_text: 'A master of martial combat.',
    hit_die: 10,
    primary_ability: 'Strength or Dexterity',
    spellcasting_ability: null,
    saving_throws: ['Strength', 'Constitution'],
    armor_proficiencies: ['All armor', 'Shields'],
    weapon_proficiencies: ['Simple', 'Martial'],
    tool_proficiencies: [],
    skill_count: 2,
    skills_available: ['Athletics', 'Perception'],
    features: [
      { level: 1, feature_name: 'Second Wind', feature_description: 'Regain hit points as a bonus action.' },
      { level: 20, feature_name: 'Extra Attack (4 attacks)', feature_description: 'You can attack four times.' },
    ],
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ClassPage />
    </MemoryRouter>
  );
}

describe('ClassPage', () => {
  beforeEach(() => {
    mockCampaign = { id: 1, edition: '5e', userRole: 'gm' };
    mockParams = { campaignId: '1', className: 'Fighter' };
    classService.getClassByName.mockResolvedValue(fighterRow());
  });

  it('renders the decoded class name and a back link', async () => {
    mockParams = { campaignId: '1', className: 'Battle%20Dancer' };
    classService.getClassByName.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Battle Dancer' })).toBeInTheDocument();
    expect(screen.getByTestId('class-page-back')).toHaveAttribute('href', '/campaigns/1/encyclopedia');
  });

  it('fetches the class by name for the campaign edition', async () => {
    renderPage();
    await waitFor(() =>
      expect(classService.getClassByName).toHaveBeenCalledWith('Fighter', '5e', '1')
    );
  });

  // The whole point of the page over the sheet: every level, not just what the character earned.
  it('shows the class features at every level', async () => {
    renderPage();
    // Each feature also appears in the progression table, so anchor on the description heading.
    expect(await screen.findByRole('heading', { level: 3, name: 'Second Wind' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Extra Attack (4 attacks)' })).toBeInTheDocument();
  });

  it('defaults to the campaign edition', async () => {
    mockCampaign = { id: 1, edition: '5.5e', userRole: 'gm' };
    classService.getClassByName.mockResolvedValue(fighterRow('5.5e'));
    renderPage();
    expect(await screen.findByText('2024 Rules')).toBeInTheDocument();
    expect(classService.getClassByName).toHaveBeenCalledWith('Fighter', '5.5e', '1');
  });

  it('refetches when the edition toggle is switched', async () => {
    renderPage();
    expect(await screen.findByText('5e (2014)')).toBeInTheDocument();
    classService.getClassByName.mockResolvedValue(fighterRow('5.5e'));
    fireEvent.click(screen.getByTestId('class-page-edition-5.5e'));
    expect(await screen.findByText('2024 Rules')).toBeInTheDocument();
    expect(classService.getClassByName).toHaveBeenLastCalledWith('Fighter', '5.5e', '1');
  });

  // Artificer has no 2024 row, so an edition with nothing to show must say so, not go blank.
  it('shows the overview empty state when the class has no row for that edition', async () => {
    classService.getClassByName.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByText(/details unavailable/i)).toBeInTheDocument();
  });
});
