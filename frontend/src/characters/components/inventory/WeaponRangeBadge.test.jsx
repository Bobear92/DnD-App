import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeaponRangeBadge from '@/characters/components/inventory/WeaponRangeBadge';

// One badge for both attack surfaces (Items row + Action Economy card), so the wording cannot
// drift — the same reason MagicAttackBadge is shared.
describe('WeaponRangeBadge', () => {
  const band = (over = {}) => ({ normal: 150, long: 600, thrown: false, label: '150/600 ft', ...over });

  it('renders nothing for a weapon with no band', () => {
    const { container } = render(<WeaponRangeBadge range={null} testId="r" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the band', () => {
    render(<WeaponRangeBadge range={band()} testId="r" />);
    expect(screen.getByTestId('r')).toHaveTextContent('Range 150/600 ft');
  });

  // A bare "150/600" says nothing on its own — the threshold is the reason the second number is
  // there, so it is stated inline rather than hidden behind a click.
  it('states what the second number means', () => {
    render(<WeaponRangeBadge range={band()} testId="r" />);
    expect(screen.getByTestId('r-note')).toHaveTextContent('disadvantage past 150 ft');
  });

  it('says the disadvantage is lifted, and names the source', () => {
    render(<WeaponRangeBadge range={band({ longRangeOk: true, longRangeSource: 'Sharpshooter' })} testId="r" />);
    expect(screen.getByTestId('r-note')).toHaveTextContent('no disadvantage past 150 ft (Sharpshooter)');
  });

  // Nothing to explain when there is no falloff.
  it('omits the threshold note for a single-distance weapon', () => {
    render(<WeaponRangeBadge range={band({ long: null, label: '5 ft' })} testId="r" />);
    expect(screen.getByTestId('r')).toHaveTextContent('Range 5 ft');
    expect(screen.queryByTestId('r-note')).not.toBeInTheDocument();
  });

  // A feature that MOVED the number names itself, so a player checking the sheet against the
  // book doesn't read the larger normal range as a bug.
  it('credits a feature that increased the normal range', () => {
    render(<WeaponRangeBadge range={band({ normal: 180, label: '180/600 ft', rangeBonusFt: 30, rangeBonusSource: 'Sharpshooter' })} testId="r" />);
    expect(screen.getByTestId('r')).toHaveTextContent('Range 180/600 ft');
    expect(screen.getByTestId('r-bonus')).toHaveTextContent('+30 ft normal range (Sharpshooter)');
    // 2024 Long Shot raises the range; it does NOT lift the disadvantage past it.
    expect(screen.getByTestId('r-note')).toHaveTextContent('disadvantage past 180 ft');
  });

  it('shows no bonus line for an unmodified band', () => {
    render(<WeaponRangeBadge range={band()} testId="r" />);
    expect(screen.queryByTestId('r-bonus')).not.toBeInTheDocument();
  });

  it('marks a thrown weapon as thrown', () => {
    render(<WeaponRangeBadge range={band({ thrown: true, normal: 20, long: 60, label: 'Thrown 20/60 ft' })} testId="r" />);
    expect(screen.getByTestId('r')).toHaveTextContent('Range Thrown 20/60 ft');
  });
});
