import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SpecialAttacksPage from './SpecialAttacksPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '5' }),
}));

vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 5, edition: '5e' } }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <SpecialAttacksPage />
    </MemoryRouter>
  );
}

const to2024 = () => fireEvent.click(screen.getByTestId('special-attacks-edition-5.5e'));

describe('SpecialAttacksPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Special Melee Attacks/i })).toBeInTheDocument();
    expect(screen.getByTestId('special-attacks-back')).toHaveAttribute('href', '/campaigns/5/encyclopedia');
  });

  // The whole reason the cards are badged "replaces one attack" — filing these as actions is the
  // misreading the page exists to correct.
  it('leads with the fact that they are not actions of their own', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /not actions/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Extra Attack/).length).toBeGreaterThan(0);
  });

  it('describes both Grapple and Shove', () => {
    renderPage();
    expect(screen.getByTestId('special-attack-Grapple')).toBeInTheDocument();
    expect(screen.getByTestId('special-attack-Shove')).toBeInTheDocument();
  });

  it('covers how to use them, when, and an example of play', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /What being Grappled does/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Escaping a grapple/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /When to reach for one/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /At the table/i })).toBeInTheDocument();
  });

  // The size ladder is computed through the shared helper, so the page can never state a limit the
  // sheet's card disagrees with.
  it('works the size limit through the helper for each size', () => {
    renderPage();
    expect(screen.getByTestId('special-attacks-size-medium'))
      .toHaveTextContent('You are Medium — you can grapple a creature up to Large.');
    expect(screen.getByTestId('special-attacks-size-large'))
      .toHaveTextContent('You are Large — you can grapple a creature up to Huge.');
    expect(screen.getByTestId('special-attacks-size-small'))
      .toHaveTextContent('You are Small — you can grapple a creature up to Medium.');
  });

  it("explains that Giant's Might raises the limit by changing your size", () => {
    renderPage();
    expect(screen.getAllByText(/Giant's Might/).length).toBeGreaterThan(0);
    expect(screen.getByTestId("special-attacks-modifier-Giant's Might (Rune Knight)")).toBeInTheDocument();
  });

  it('lists the in-app feats that change grappling and shoving', () => {
    renderPage();
    expect(screen.getByTestId('special-attacks-modifier-Grappler')).toBeInTheDocument();
    expect(screen.getByTestId('special-attacks-modifier-Shield Master')).toBeInTheDocument();
    expect(screen.getByTestId('special-attacks-modifier-Tavern Brawler')).toBeInTheDocument();
  });

  it('is honest about what the app does not track', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /doesn't track/i })).toBeInTheDocument();
  });

  it('cross-links to the related mechanics pages', () => {
    renderPage();
    expect(screen.getByTestId('special-attacks-economy-link'))
      .toHaveAttribute('href', '/campaigns/5/encyclopedia/mechanics/action-economy');
    expect(screen.getByTestId('special-attacks-spacing-link'))
      .toHaveAttribute('href', '/campaigns/5/encyclopedia/mechanics/spacing');
    expect(screen.getByTestId('special-attacks-object-link'))
      .toHaveAttribute('href', '/campaigns/5/encyclopedia/mechanics/object-interaction');
  });
});

// The toggle earns its place: 2014 resolves the attempt with a contested check and 2024 with a
// saving throw, so the two editions are not a rewording of each other.
describe('SpecialAttacksPage — edition toggle', () => {
  it('defaults to the campaign edition and shows the 2014 contested check', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /How you make the attempt \(2014\)/ })).toBeInTheDocument();
    expect(screen.getByTestId('special-attack-Grapple')).toHaveTextContent(/contested by/i);
  });

  it('switches to the 2024 saving throw against your Unarmed Strike DC', () => {
    renderPage();
    to2024();
    expect(screen.getByRole('heading', { name: /How you make the attempt \(2024\)/ })).toBeInTheDocument();
    expect(screen.getByTestId('special-attack-Grapple')).toHaveTextContent(/saving throw/i);
    expect(screen.getByTestId('special-attack-Grapple')).toHaveTextContent(/Unarmed Strike/i);
  });

  it('describes the 2024 framing as an Unarmed Strike option', () => {
    renderPage();
    to2024();
    expect(screen.getByText(/two of the three options/i)).toBeInTheDocument();
  });

  // The Rune Knight is 5e-only, and Crusher is a 2024 feat — so the modifier list is not shared.
  it('swaps the modifier list for the edition', () => {
    renderPage();
    expect(screen.queryByTestId('special-attacks-modifier-Crusher')).not.toBeInTheDocument();
    to2024();
    expect(screen.getByTestId('special-attacks-modifier-Crusher')).toBeInTheDocument();
    expect(screen.queryByTestId("special-attacks-modifier-Giant's Might (Rune Knight)")).not.toBeInTheDocument();
  });
});
