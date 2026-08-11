import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MagicalAttacksPage from './MagicalAttacksPage';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '1' }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MagicalAttacksPage />
    </MemoryRouter>
  );
}

describe('MagicalAttacksPage', () => {
  it('renders the heading and a back link to the encyclopedia', () => {
    renderPage();
    expect(screen.getByText('Magical Attacks & Resistance')).toBeInTheDocument();
    expect(screen.getByTestId('magical-attacks-back')).toHaveAttribute(
      'href',
      '/campaigns/1/encyclopedia'
    );
  });

  it('explains what the resistance actually does to damage', () => {
    renderPage();
    expect(screen.getByText(/Resistance halves the damage/i)).toBeInTheDocument();
    expect(screen.getByText(/Immunity zeroes it/i)).toBeInTheDocument();
  });

  it('lists all three ways an attack becomes magical', () => {
    renderPage();
    expect(screen.getByText(/The weapon itself is magical/i)).toBeInTheDocument();
    expect(screen.getByText(/A class or subclass feature says so/i)).toBeInTheDocument();
    expect(screen.getByText(/A spell makes it magical for a while/i)).toBeInTheDocument();
  });

  // Every feature named is a real entry in this app's class/subclass data — the page must not
  // cite rules content the app doesn't actually model.
  it('names only in-app features as magic sources, flagging which are auto-tagged', () => {
    renderPage();
    const sources = screen.getByTestId('magical-attacks-sources');
    for (const name of ['Magic Arrow', 'Ki-Empowered Strikes', 'One with the Blade', 'Primal Strike', 'Blessing of the Forge']) {
      expect(within(sources).getByTestId(`magic-source-${name}`)).toBeInTheDocument();
    }
    // Only Magic Arrow is mechanized so far.
    expect(within(sources).getAllByText('Tagged on your sheet')).toHaveLength(1);
    expect(within(sources).getByTestId('magic-source-Magic Arrow'))
      .toHaveTextContent('Tagged on your sheet');
  });

  // The worked example calls magicalAttackSource, so it can't drift from the character sheet.
  it('works the example through the real resolver — bow magical, dagger not', () => {
    renderPage();
    const example = screen.getByTestId('magical-attacks-example');
    expect(example).toHaveTextContent(/Longbow.*magical \(Magic Arrow\)/i);
    expect(example).toHaveTextContent(/Dagger.*not magical/i);
  });

  it('is honest about what the app cannot track', () => {
    renderPage();
    expect(screen.getByText(/Magic weapons you own aren't equippable yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Spell-granted magic isn't tagged/i)).toBeInTheDocument();
    expect(screen.getByText(/bestiary doesn't record resistances/i)).toBeInTheDocument();
  });

  it('covers the 2024 difference in prose rather than an edition toggle', () => {
    renderPage();
    expect(screen.getByText(/What changed in the 2024 rules/i)).toBeInTheDocument();
    expect(screen.queryByTestId(/edition-5\.5e$/)).not.toBeInTheDocument();
  });

  it('cross-links the related mechanics pages', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /Action Economy/i }))
      .toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/action-economy');
    expect(screen.getByRole('link', { name: /Spacing/i }))
      .toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/spacing');
  });
});
