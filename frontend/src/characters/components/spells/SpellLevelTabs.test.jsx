import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpellLevelTabs from '@/characters/components/spells/SpellLevelTabs';

// SpellList is tested on its own; mock it to isolate the tab logic + surface what it receives.
vi.mock('@/characters/components/spells/SpellList', () => ({
  default: ({ spells = [], isCantrips, rowExtras }) => (
    <div data-testid="spell-list" data-cantrips={String(!!isCantrips)}>
      {spells.map((n) => (
        <span key={n} data-testid={`sl-${n}`}>{n}{rowExtras?.(n)}</span>
      ))}
    </div>
  ),
}));

const SPELLS = [
  { name: 'Light', level: 0 },
  { name: 'Fire Bolt', level: 0 },
  { name: 'Mage Armor', level: 1 },
];

describe('SpellLevelTabs', () => {
  it('shows a tab only for levels that have spells, with a count', () => {
    render(<SpellLevelTabs spells={SPELLS} />);
    expect(screen.getByTestId('spell-level-tab-0')).toHaveTextContent('Cantrips (2)');
    expect(screen.getByTestId('spell-level-tab-1')).toHaveTextContent('Lvl 1 (1)');
    expect(screen.queryByTestId('spell-level-tab-2')).not.toBeInTheDocument();
  });

  it('defaults to the lowest level and passes its spells (cantrips flagged) to SpellList', () => {
    render(<SpellLevelTabs spells={SPELLS} />);
    expect(screen.getByTestId('spell-list')).toHaveAttribute('data-cantrips', 'true');
    expect(screen.getByTestId('sl-Fire Bolt')).toBeInTheDocument();
    expect(screen.getByTestId('sl-Light')).toBeInTheDocument();
    expect(screen.queryByTestId('sl-Mage Armor')).not.toBeInTheDocument();
  });

  it('switches the shown spells when another level tab is clicked', () => {
    render(<SpellLevelTabs spells={SPELLS} />);
    fireEvent.click(screen.getByTestId('spell-level-tab-1'));
    expect(screen.getByTestId('spell-list')).toHaveAttribute('data-cantrips', 'false');
    expect(screen.getByTestId('sl-Mage Armor')).toBeInTheDocument();
    expect(screen.queryByTestId('sl-Fire Bolt')).not.toBeInTheDocument();
  });

  // A racial spell that IS its own once-per-rest resource carries its use control on its row,
  // so it isn't listed a second time in a tracker card.
  it('forwards rowExtras to SpellList for the shown level only', () => {
    const rowExtras = (n) => (n === 'Mage Armor' ? <b data-testid="extra-mage-armor">1/1</b> : null);
    render(<SpellLevelTabs spells={SPELLS} rowExtras={rowExtras} />);
    expect(screen.queryByTestId('extra-mage-armor')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('spell-level-tab-1'));
    expect(screen.getByTestId('extra-mage-armor')).toBeInTheDocument();
  });

  it('renders an empty state when there are no spells', () => {
    render(<SpellLevelTabs spells={[]} emptyText="None yet." />);
    expect(screen.getByText('None yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('spell-list')).not.toBeInTheDocument();
  });
});
