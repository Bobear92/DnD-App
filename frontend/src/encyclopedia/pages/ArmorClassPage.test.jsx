import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArmorClassPage from './ArmorClassPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ArmorClassPage />
    </MemoryRouter>
  );
}

describe('ArmorClassPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    expect.assertions(2);
    renderPage();
    expect(screen.getByRole('heading', { name: 'Armor Class' })).toBeInTheDocument();
    expect(screen.getByTestId('armor-class-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  it('shows worked-example AC values computed from the real helpers', () => {
    renderPage();
    // Chain Mail (heavy 16) + shield +2 = 18; unarmored Barbarian 10+2+3 = 15
    expect(screen.getByText(/AC 18/)).toBeInTheDocument();
    expect(screen.getByText(/AC 15/)).toBeInTheDocument();
  });

  it('explains armor proficiency and its penalties', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Armor proficiency' })).toBeInTheDocument();
    expect(screen.getByText(/disadvantage on every ability check/i)).toBeInTheDocument();
    expect(screen.getByText(/can't cast spells/i)).toBeInTheDocument();
  });

  it('explains armor Strength requirements and the −10 ft speed penalty', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Strength requirements' })).toBeInTheDocument();
    expect(screen.getByText(/reduced by 10\s*feet/i)).toBeInTheDocument();
    expect(screen.getByText(/lower than the listed\s*requirement/i)).toBeInTheDocument();
  });
  // Extended rather than given its own page: Stealth disadvantage is an armor property, and
  // the armor row links here. The specific armors must match the seeded compendium.
  it('explains Stealth disadvantage and which armors actually impose it', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Stealth disadvantage' })).toBeInTheDocument();
    const list = screen.getByTestId('armor-class-stealth-list');
    expect(list).toHaveTextContent(/only Padded armor/i);
    expect(list).toHaveTextContent(/Scale Mail and Half Plate/i);
    // The quiet medium armors — the thing players most often get wrong.
    expect(list).toHaveTextContent(/Chain Shirt, Breastplate and Hide do not/i);
    expect(list).toHaveTextContent(/Ring Mail, Chain Mail, Splint, Plate/i);
    expect(list).toHaveTextContent(/Shields never impose it/i);
  });

  it('notes that Medium Armor Master clears it for medium armor only', () => {
    renderPage();
    // The feat is also listed in the AC section, so scope to the distinctive Stealth wording.
    expect(screen.getAllByText(/Medium Armor Master/).length).toBeGreaterThan(1);
    expect(screen.getByText(/heavy armor still gives it away/i)).toBeInTheDocument();
  });
});
