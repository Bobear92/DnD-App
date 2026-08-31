import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SensesPanel from '@/characters/components/senses/SensesPanel';

const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };

describe('SensesPanel', () => {
  it('renders nothing for a character with ordinary vision', () => {
    const { container } = render(
      <SensesPanel characterData={{ race_traits: ['Extra Language'] }} race="Human" level={5} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('leads with the range, and names where it came from', () => {
    render(
      <SensesPanel
        characterData={{ race_traits: ['Darkvision'] }}
        race="Dwarf"
        subrace="Hill Dwarf"
        level={5}
      />
    );
    expect(screen.getByTestId('sense-range-darkvision')).toHaveTextContent('60 ft');
    expect(screen.getByTestId('sense-darkvision')).toHaveTextContent('Hill Dwarf');
  });

  it("shows the Stone Rune's 120 ft and the object it is carved on", () => {
    render(
      <SensesPanel
        characterData={{
          subclass: 'Rune Knight',
          runes: ['Stone Rune'],
          rune_items: { 'Stone Rune': 'w1' },
          inventory: [axe],
        }}
        race="Human"
        level={7}
      />
    );
    expect(screen.getByTestId('sense-range-darkvision')).toHaveTextContent('120 ft');
    expect(screen.getByTestId('sense-darkvision')).toHaveTextContent('Stone Rune');
    expect(screen.getByTestId('sense-darkvision')).toHaveTextContent('Carved on Battleaxe');
  });

  // A player who stows the rune-bearing axe drops to 60 ft, not to nothing — so the losing
  // source is named rather than dropped.
  it('says what a larger range replaced, and that ranges do not stack', () => {
    render(
      <SensesPanel
        characterData={{
          race_traits: ['Darkvision'],
          subclass: 'Rune Knight',
          runes: ['Stone Rune'],
          rune_items: { 'Stone Rune': 'w1' },
          inventory: [axe],
        }}
        race="Dwarf"
        level={7}
      />
    );
    const superseded = screen.getByTestId('sense-superseded-darkvision');
    expect(superseded).toHaveTextContent('60 ft from Dwarf');
    expect(superseded).toHaveTextContent(/don't stack/i);
  });

  it('shows no superseded line when only one source grants the sense', () => {
    render(<SensesPanel characterData={{ race_traits: ['Darkvision'] }} race="Dwarf" level={5} />);
    expect(screen.queryByTestId('sense-superseded-darkvision')).not.toBeInTheDocument();
  });

  it('lists a sight-affecting trait name-only, expanding to its rules text on click', () => {
    render(
      <SensesPanel
        characterData={{ race_traits: ['Superior Darkvision', 'Sunlight Sensitivity'] }}
        race="Elf"
        subrace="Dark Elf (Drow)"
        level={5}
      />
    );
    const note = screen.getByTestId('sense-note-sunlight-sensitivity');
    expect(note).toHaveTextContent('Sunlight Sensitivity');
    expect(screen.queryByText(/direct sunlight/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Sunlight Sensitivity'));
    expect(screen.getByText(/direct sunlight/i)).toBeInTheDocument();
  });
});
