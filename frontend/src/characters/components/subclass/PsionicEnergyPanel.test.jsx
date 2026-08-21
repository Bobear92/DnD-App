import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PsionicEnergyPanel from '@/characters/components/subclass/PsionicEnergyPanel';

// The pool DEFINITION card: how many dice and how big. The rest-resource tracker states a
// remaining count and each power's card states its own formula, but nothing stated the pool.
describe('PsionicEnergyPanel', () => {
  const show = (level, extra = {}) =>
    render(<PsionicEnergyPanel level={level} scores={{ intelligence: 16 }} {...extra} />);

  it('renders nothing before the subclass exists', () => {
    const { container } = show(2);
    expect(container).toBeEmptyDOMElement();
  });

  // Twice the proficiency bonus, so the count moves on the PB breakpoints, not every level.
  it('sizes the pool at twice the proficiency bonus', () => {
    show(3);
    expect(screen.getByTestId('psionic-energy-pool')).toHaveTextContent('4 × d6');
    show(9);
    expect(screen.getAllByTestId('psionic-energy-pool')[1]).toHaveTextContent('8 × d8');
  });

  // The stored feature blurb says a flat "d6s" in both editions — the whole reason these numbers
  // are computed rather than transcribed.
  it('grows the die with level rather than showing a flat d6', () => {
    show(5);
    expect(screen.getByTestId('psionic-energy-pool')).toHaveTextContent('d8');
    show(11);
    expect(screen.getAllByTestId('psionic-energy-pool')[1]).toHaveTextContent('d10');
    show(17);
    expect(screen.getAllByTestId('psionic-energy-pool')[2]).toHaveTextContent('d12');
  });

  it('names the next die step in words, and drops it at the top step', () => {
    show(3);
    expect(screen.getByTestId('psionic-energy-formula')).toHaveTextContent('grows to d8 at level 5');
    show(17);
    expect(screen.getAllByTestId('psionic-energy-formula')[1]).not.toHaveTextContent('grows to');
  });

  // Echoed, not controlled — a pool card showing a full pool while the tracker says one die is
  // left would be a number contradicting itself a tab away.
  it('echoes the unspent count from character_data', () => {
    show(5, { data: { psionic_energy_used: 3 } });
    expect(screen.getByTestId('psionic-energy-remaining')).toHaveTextContent('3 of 6 unspent');
  });

  it('never shows a negative unspent count', () => {
    show(3, { data: { psionic_energy_used: 99 } });
    expect(screen.getByTestId('psionic-energy-remaining')).toHaveTextContent('0 of 4 unspent');
  });

  // Both rolls fold in Intelligence — easy to forget on a class with no spellcasting ability.
  it('spells out the roll and the save DC against Intelligence', () => {
    show(5);
    expect(screen.getByTestId('psionic-energy-rolls')).toHaveTextContent('1d8 + 3');
    expect(screen.getByTestId('psionic-energy-rolls')).toHaveTextContent('14');
  });

  it('follows a dumped Intelligence down rather than assuming a positive modifier', () => {
    show(5, { scores: { intelligence: 8 } });
    expect(screen.getByTestId('psionic-energy-rolls')).toHaveTextContent('1d8 − 1');
    // 8 + PB 3 − 1, and the sign belongs to the operator: "+ −1" would read as a typo.
    expect(screen.getByTestId('psionic-energy-rolls')).toHaveTextContent('10');
    expect(screen.getByTestId('psionic-energy-rolls')).toHaveTextContent('8 + 3 − 1 INT');
  });

  it('is read-only — spending lives on the tracker and the action cards', () => {
    show(5, { data: { psionic_energy_used: 1 } });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
