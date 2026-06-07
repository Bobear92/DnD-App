import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BattleMasterPanel from './BattleMasterPanel';

describe('BattleMasterPanel', () => {
  it('shows the superiority dice tracker (4 dice at level 3, die size, recharge note)', () => {
    render(<BattleMasterPanel data={{}} level={3} onChange={vi.fn()} />);
    const dice = screen.getByTestId('superiority-dice');
    expect(dice).toHaveTextContent('4 / 4 remaining'); // 4 dice at level 3, none used
    expect(screen.getByText(/d8 · short or long rest/)).toBeInTheDocument();
  });

  it('expends a superiority die through the Use button', () => {
    const onChange = vi.fn();
    render(<BattleMasterPanel data={{}} level={3} onChange={onChange} />);
    const dice = screen.getByTestId('superiority-dice');
    fireEvent.click(within(dice).getByRole('button', { name: /Use Superiority Dice/i }));
    fireEvent.click(screen.getByTestId('superiority-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ superiority_dice_used: 1 });
  });

  it('lets the owner fill OWED maneuver slots (when below the level limit)', () => {
    const onChange = vi.fn();
    render(<BattleMasterPanel data={{ maneuvers: [] }} level={3} onChange={onChange} edition="5e" />);
    expect(screen.getByTestId('maneuvers-count')).toHaveTextContent('0/3 chosen');
    expect(screen.getByTestId('maneuvers-owed-note')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('maneuver-Trip Attack'));
    expect(onChange).toHaveBeenCalledWith({ maneuvers: ['Trip Attack'] });
  });

  it('locks maneuvers once full — shows only known ones and cannot add/remove on the fly', () => {
    const onChange = vi.fn();
    render(<BattleMasterPanel data={{ maneuvers: ['Trip Attack', 'Riposte', 'Parry'] }} level={3} onChange={onChange} />);
    expect(screen.getByTestId('maneuvers-locked-note')).toBeInTheDocument();
    // Unchosen maneuvers aren't even shown
    expect(screen.queryByTestId('maneuver-Precision Attack')).not.toBeInTheDocument();
    // Clicking a known maneuver does not remove it (no GM Edit)
    fireEvent.click(screen.getByTestId('maneuver-Trip Attack'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('GM Edit unlocks swapping a chosen maneuver', () => {
    const onChange = vi.fn();
    render(<BattleMasterPanel data={{ maneuvers: ['Trip Attack', 'Riposte', 'Parry'] }} level={3} onChange={onChange} gmEdit />);
    expect(screen.queryByTestId('maneuvers-locked-note')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('maneuver-Trip Attack')); // remove allowed under GM Edit
    expect(onChange).toHaveBeenCalledWith({ maneuvers: ['Riposte', 'Parry'] });
  });

  it('shows each maneuver with its full description', () => {
    render(<BattleMasterPanel data={{}} level={3} onChange={vi.fn()} />);
    expect(screen.getByTestId('maneuver-Trip Attack')).toHaveTextContent(/knock the target down/i);
  });

  it('readOnly shows only known maneuvers and no Use/pick controls', () => {
    render(<BattleMasterPanel data={{ maneuvers: ['Riposte'] }} level={3} readOnly />);
    expect(screen.getByTestId('maneuver-Riposte')).toBeInTheDocument();
    expect(screen.queryByTestId('maneuver-Trip Attack')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Use Superiority Dice/i })).not.toBeInTheDocument();
  });
});
