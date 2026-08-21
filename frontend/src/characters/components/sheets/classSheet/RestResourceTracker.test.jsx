import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  RestUseSteppers, RestResourceControl, shortResourceLabel,
} from '@/characters/components/sheets/classSheet/RestResourceTracker';

// RestUseSteppers is the inline − / + stepper the hand-written sheets use for a
// rest-rechargeable count. The rule under test: a player may SPEND (+) but never
// RECOVER (−); the − recover button is GM-only. The count comes back only from a rest.
describe('RestUseSteppers — spend/recover gating', () => {
  const base = { usedKey: 'rages_used', used: 1, total: 3, label: 'Rage' };

  it('a player (no isGm) sees + (spend) but not − (recover)', () => {
    render(<RestUseSteppers {...base} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Use Rage')).toBeInTheDocument();
    expect(screen.queryByLabelText('Recover Rage')).not.toBeInTheDocument();
  });

  it('the + spends a use (increments the used key)', () => {
    const onChange = vi.fn();
    render(<RestUseSteppers {...base} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Use Rage'));
    expect(onChange).toHaveBeenCalledWith({ rages_used: 2 });
  });

  it('the + is disabled once every use is spent', () => {
    render(<RestUseSteppers {...base} used={3} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Use Rage')).toBeDisabled();
  });

  it('the GM (isGm) gets the − recover button and it decrements the used key', () => {
    const onChange = vi.fn();
    render(<RestUseSteppers {...base} onChange={onChange} isGm />);
    fireEvent.click(screen.getByLabelText('Recover Rage'));
    expect(onChange).toHaveBeenCalledWith({ rages_used: 0 });
  });

  it('the GM − is disabled when nothing is spent', () => {
    render(<RestUseSteppers {...base} used={0} onChange={vi.fn()} isGm />);
    expect(screen.getByLabelText('Recover Rage')).toBeDisabled();
  });

  it('readOnly renders nothing', () => {
    const { container } = render(<RestUseSteppers {...base} onChange={vi.fn()} isGm readOnly />);
    expect(container).toBeEmptyDOMElement();
  });
});

// RestResourceControl's two optional secondary rows. Both let ONE Use button drive TWO counters,
// but in opposite directions, which is why they are separate props rather than one "linked row".
describe('RestResourceControl — fallbackRow (free use, then pay from a pool)', () => {
  const free = {
    key: 'telekinetic_movement_used', label: 'Telekinetic Movement — free use (Short Rest)',
    recharge: 'short', total: 1, used: 0, remaining: 1,
  };
  const pool = {
    key: 'psionic_energy_used', label: 'Psionic Energy Dice — d8 (Long Rest)',
    recharge: 'long', total: 4, used: 0, remaining: 4,
  };
  const use = () => fireEvent.click(screen.getByLabelText(/^Use Telekinetic Movement/));
  const confirm = () => fireEvent.click(screen.getByTestId('rest-use-confirm-button'));

  // The bug this whole prop exists for: a bare "1 / 1" beside a feature that ALSO spends a shared
  // pool reads as "you can do this once", which is what sent the reader looking for the bug.
  it('names which cost each count belongs to', () => {
    render(<RestResourceControl row={free} fallbackRow={pool} onChange={vi.fn()} />);
    expect(screen.getByText(/Free use 1 \/ 1/)).toBeInTheDocument();
    expect(screen.getByText(/Psionic Energy Dice 4 \/ 4/)).toBeInTheDocument();
  });

  it('spends the free use first, leaving the pool alone', () => {
    const onChange = vi.fn();
    render(<RestResourceControl row={free} fallbackRow={pool} onChange={onChange} />);
    use(); confirm();
    expect(onChange).toHaveBeenCalledWith({ telekinetic_movement_used: 1 });
  });

  // The regression: Use used to go dead here while four legal uses remained.
  it('stays usable once the free use is spent, and spends a die instead', () => {
    const onChange = vi.fn();
    const spentFree = { ...free, used: 1, remaining: 0 };
    render(<RestResourceControl row={spentFree} fallbackRow={pool} onChange={onChange} />);
    expect(screen.getByText(/Free use spent/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Use Telekinetic Movement/)).not.toBeDisabled();
    use(); confirm();
    expect(onChange).toHaveBeenCalledWith({ psionic_energy_used: 1 });
  });

  it('says the free use is gone and names the real cost in the confirm dialog', () => {
    render(
      <RestResourceControl
        row={{ ...free, used: 1, remaining: 0 }} fallbackRow={pool} onChange={vi.fn()}
      />
    );
    use();
    expect(screen.getByText(/free use is spent, so this costs one Psionic Energy Dice/)).toBeInTheDocument();
  });

  it('disables Use only when BOTH the free use and the pool are empty', () => {
    render(
      <RestResourceControl
        row={{ ...free, used: 1, remaining: 0 }}
        fallbackRow={{ ...pool, used: 4, remaining: 0 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Use Telekinetic Movement/)).toBeDisabled();
  });

  it('falls back to the plain count when there is no fallback row', () => {
    render(<RestResourceControl row={free} onChange={vi.fn()} />);
    expect(screen.getByText('1 / 1 remaining')).toBeInTheDocument();
  });
});

describe('RestResourceControl — restoresRow (spend a charge to refill a pool)', () => {
  const regain = {
    key: 'psionic_energy_regain_used', label: 'Regain a Psionic Energy Die (Short Rest)',
    recharge: 'short', total: 1, used: 0, remaining: 1,
  };
  const pool = {
    key: 'psionic_energy_used', label: 'Psionic Energy Dice — d8 (Long Rest)',
    recharge: 'long', total: 4, used: 3, remaining: 1,
  };

  // One save, two counters — the charge is spent and the die comes back together, so a failed
  // save can't leave the character having paid for nothing.
  it('spends its own charge and returns one use to the pool in a single patch', () => {
    const onChange = vi.fn();
    render(<RestResourceControl row={regain} restoresRow={pool} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/^Use Regain a Psionic Energy Die/));
    fireEvent.click(screen.getByTestId('rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({
      psionic_energy_regain_used: 1,
      psionic_energy_used: 2,
    });
  });

  it('never drives the restored pool below zero', () => {
    const onChange = vi.fn();
    render(
      <RestResourceControl
        row={regain} restoresRow={{ ...pool, used: 0, remaining: 4 }} onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText(/^Use Regain a Psionic Energy Die/));
    fireEvent.click(screen.getByTestId('rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({
      psionic_energy_regain_used: 1,
      psionic_energy_used: 0,
    });
  });

  it('tells the player what the use gives back', () => {
    render(<RestResourceControl row={regain} restoresRow={pool} onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/^Use Regain a Psionic Energy Die/));
    expect(screen.getByText(/returns one Psionic Energy Dice/)).toBeInTheDocument();
  });

  it('is spent once and then disabled — it is a once-per-rest charge', () => {
    render(
      <RestResourceControl
        row={{ ...regain, used: 1, remaining: 0 }} restoresRow={pool} onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/^Use Regain a Psionic Energy Die/)).toBeDisabled();
  });
});

describe('shortResourceLabel', () => {
  it('strips the em-dash qualifier and the recharge parenthetical', () => {
    expect(shortResourceLabel('Psionic Energy Dice — d8 (Long Rest)')).toBe('Psionic Energy Dice');
    expect(shortResourceLabel('Telekinetic Movement — free use (Short Rest)')).toBe('Telekinetic Movement');
  });

  it('leaves a plain label alone', () => {
    expect(shortResourceLabel('Second Wind')).toBe('Second Wind');
    expect(shortResourceLabel()).toBe('');
  });
});
