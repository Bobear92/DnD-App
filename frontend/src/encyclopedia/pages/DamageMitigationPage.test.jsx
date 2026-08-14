import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DamageMitigationPage from './DamageMitigationPage';
import { applyDamage } from '@/characters/components/defenses/defenses';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '1' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <DamageMitigationPage />
    </MemoryRouter>
  );
}

describe('DamageMitigationPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByText('Taking Damage')).toBeInTheDocument();
    expect(screen.getByTestId('damage-mitigation-back'))
      .toHaveAttribute('href', '/campaigns/1/encyclopedia');
  });

  it('names all four ways damage changes', () => {
    renderPage();
    for (const term of ['Resistance', 'Immunity', 'Vulnerability', 'Flat reduction']) {
      expect(screen.getAllByText(term).length).toBeGreaterThan(0);
    }
  });

  it('works the Barbarian example through the helper rather than stating a number', () => {
    // If applyDamage's order ever changes, this test changes with it — the page cannot drift.
    const expected = applyDamage({ amount: 16, resistant: true, reduction: 3 });
    renderPage();
    expect(screen.getByTestId('damage-example-barbarian-final'))
      .toHaveTextContent(String(expected.final));
    // The whole point of the example: halve first (8), then subtract (5).
    expect(expected.steps.map((s) => s.value)).toEqual([16, 8, 5]);
  });

  it('contrasts the wrong order explicitly so the rule lands', () => {
    renderPage();
    expect(screen.getByText(/16 − 3\) ÷ 2 = 6/)).toBeInTheDocument();
  });

  it('shows resistance and vulnerability cancelling rather than compounding', () => {
    const expected = applyDamage({ amount: 16, resistant: true, vulnerable: true });
    expect(expected.final).toBe(16);
    renderPage();
    const example = screen.getByTestId('damage-example-cancel');
    expect(within(example).getByText(/cancel/i)).toBeInTheDocument();
  });

  it('states that halving rounds down', () => {
    renderPage();
    expect(screen.getByText(/rounds down/i)).toBeInTheDocument();
  });

  it('lists real in-app temporary hit point sources with who receives them', () => {
    renderPage();
    const sources = screen.getByTestId('temp-hp-sources');
    expect(within(sources).getByText('Reclaim Potential')).toBeInTheDocument();
    expect(within(sources).getByText("Dark One's Blessing")).toBeInTheDocument();
    // Rally grants to an ally, not to you — the list says so rather than implying self-buff.
    expect(screen.getByTestId('temp-hp-source-Rally')).toHaveTextContent(/an ally/i);
  });

  it('spells out that temporary hit points never stack', () => {
    renderPage();
    expect(screen.getByText(/never stack/i)).toBeInTheDocument();
  });

  it('lists reaction-based reductions separately from standing ones', () => {
    renderPage();
    const reactions = screen.getByTestId('reaction-reductions');
    expect(within(reactions).getByText('Parry')).toBeInTheDocument();
    expect(within(reactions).getByText('Deflect Missiles')).toBeInTheDocument();
  });

  it('is honest that nothing in the app gives a character vulnerability', () => {
    renderPage();
    expect(screen.getByText(/Nothing gives your character/i)).toBeInTheDocument();
  });

  it('distinguishes damage immunity from condition immunity', () => {
    renderPage();
    expect(screen.getByText(/Damage immunity is not condition immunity/i)).toBeInTheDocument();
  });

  it('links to the magical-attacks page rather than restating what nonmagical means', () => {
    renderPage();
    expect(screen.getByText('Magical Attacks & Resistance').closest('a'))
      .toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/magical-attacks');
  });
});
