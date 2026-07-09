import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpellSlotTracker from '@/characters/components/spells/SpellSlotTracker';

const SLOTS = [4, 3, 2, 0, 0, 0, 0, 0, 0];

describe('SpellSlotTracker', () => {
  it('renders remaining/total per non-zero slot level', () => {
    render(<SpellSlotTracker slots={SLOTS} spellSlots={{ 1: { total: 4, used: 1 } }} />);
    expect(screen.getByTestId('slot-remaining-1')).toHaveTextContent('3/4');
    expect(screen.getByTestId('slot-remaining-2')).toHaveTextContent('3/3');
    expect(screen.getByTestId('slot-remaining-3')).toHaveTextContent('2/2');
    expect(screen.queryByTestId('slot-remaining-4')).not.toBeInTheDocument();
  });

  it('renders null when the class has no slots yet (Paladin L1)', () => {
    const { container } = render(<SpellSlotTracker slots={[0, 0, 0, 0, 0]} />);
    expect(container.firstChild).toBeNull();
  });

  it('players get NO steppers — only the casting note', () => {
    render(<SpellSlotTracker slots={SLOTS} isGm={false} />);
    expect(screen.queryByTestId('slot-dec-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slot-inc-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('slot-tracker-note')).toHaveTextContent(/spent by casting/);
  });

  it('GM gets −/+ steppers that call onSetSlotUsed, and no player note', () => {
    const onSetSlotUsed = vi.fn();
    render(
      <SpellSlotTracker
        slots={SLOTS}
        spellSlots={{ 1: { total: 4, used: 1 } }}
        isGm
        onSetSlotUsed={onSetSlotUsed}
      />
    );
    expect(screen.queryByTestId('slot-tracker-note')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('slot-dec-1')); // expend → used + 1
    expect(onSetSlotUsed).toHaveBeenCalledWith(1, 2);
    fireEvent.click(screen.getByTestId('slot-inc-1')); // restore → used − 1
    expect(onSetSlotUsed).toHaveBeenCalledWith(1, 0);
  });

  it('GM steppers clamp: − disabled when fully expended, + disabled when full', () => {
    render(
      <SpellSlotTracker
        slots={[2, 0, 0, 0, 0]}
        spellSlots={{ 1: { total: 2, used: 2 } }}
        isGm
        onSetSlotUsed={vi.fn()}
      />
    );
    expect(screen.getByTestId('slot-dec-1')).toBeDisabled();
    expect(screen.getByTestId('slot-inc-1')).not.toBeDisabled();
  });

  it('readOnly hides steppers even for the GM and shows no note', () => {
    render(<SpellSlotTracker slots={SLOTS} isGm readOnly />);
    expect(screen.queryByTestId('slot-dec-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slot-tracker-note')).not.toBeInTheDocument();
  });
});
