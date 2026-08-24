import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpellLevelTabs from '@/characters/components/spells/SpellLevelTabs';
import { SpellFocusProvider, useSpellFocus } from '@/characters/components/spells/SpellFocusContext';

// SpellList is tested on its own; mock it to isolate the tab logic + surface what it receives.
vi.mock('@/characters/components/spells/SpellList', () => ({
  default: ({ spells = [], isCantrips, rowExtras, singleGroup }) => (
    <div
      data-testid="spell-list"
      data-cantrips={String(!!isCantrips)}
      data-single-group={String(!!singleGroup)}
    >
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

  // This strip owns the level axis. Letting SpellList derive levels again nested a second,
  // contradictory strip inside the active tab (a 1st-level spell granted AT 2nd level).
  it('tells SpellList not to re-derive levels (singleGroup)', () => {
    render(<SpellLevelTabs spells={SPELLS} />);
    expect(screen.getByTestId('spell-list')).toHaveAttribute('data-single-group', 'true');
  });

  // "Jump to this spell" from an Action Economy spell card: the strip has to open the level tab
  // holding it, or the jump lands on a list the spell isn't in.
  describe('jump-to-spell focus', () => {
    function Jump({ name }) {
      const { focusSpell } = useSpellFocus();
      return <button type="button" data-testid="jump" onClick={() => focusSpell(name)}>go</button>;
    }

    const renderWithJump = (name, spells = SPELLS) => render(
      <SpellFocusProvider>
        <Jump name={name} />
        <SpellLevelTabs spells={spells} />
      </SpellFocusProvider>
    );

    it('opens the level tab holding the requested spell', () => {
      renderWithJump('Mage Armor');
      // Starts on Cantrips (the first level present).
      expect(screen.queryByTestId('sl-Mage Armor')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('jump'));
      expect(screen.getByTestId('sl-Mage Armor')).toBeInTheDocument();
    });

    it('opens the Cantrips tab for a cantrip requested from another level', () => {
      renderWithJump('Fire Bolt');
      fireEvent.click(screen.getByTestId('spell-level-tab-1'));
      expect(screen.queryByTestId('sl-Fire Bolt')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('jump'));
      expect(screen.getByTestId('sl-Fire Bolt')).toBeInTheDocument();
    });

    it('leaves the tab alone for a spell this strip does not hold', () => {
      // Another source's strip owns that spell; stealing the jump would show the wrong list.
      renderWithJump('Counterspell');
      fireEvent.click(screen.getByTestId('spell-level-tab-1'));
      fireEvent.click(screen.getByTestId('jump'));
      expect(screen.getByTestId('sl-Mage Armor')).toBeInTheDocument();
    });
  });

  it('renders an empty state when there are no spells', () => {
    render(<SpellLevelTabs spells={[]} emptyText="None yet." />);
    expect(screen.getByText('None yet.')).toBeInTheDocument();
    expect(screen.queryByTestId('spell-list')).not.toBeInTheDocument();
  });
});
