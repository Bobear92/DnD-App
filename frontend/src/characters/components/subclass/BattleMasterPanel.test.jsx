import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BattleMasterPanel from '@/characters/components/subclass/BattleMasterPanel';

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

  it('folds a Martial Adept feat into the pool: +1 die and +N maneuver slots', () => {
    const feats = [{ name: 'Martial Adept', effects: [{ kind: 'maneuver_grant', count: 2, die: 'd6' }], choices: { maneuvers: ['Lunging Attack', 'Parry'] } }];
    render(<BattleMasterPanel data={{ maneuvers: ['Trip Attack', 'Riposte', 'Parry', 'Lunging Attack'], feats }} level={3} onChange={vi.fn()} />);
    // Level 3 grants 4 dice + 1 from the feat = 5
    expect(screen.getByTestId('superiority-dice')).toHaveTextContent('5 / 5 remaining');
    // Known limit is 3 (level) + 2 (feat) = 5, so 4 chosen is still under limit (not over)
    expect(screen.getByTestId('maneuvers-count')).toHaveTextContent('4/5 chosen');
    expect(screen.getByTestId('battle-master-feat-note')).toHaveTextContent(/\+1 superiority die and \+2 maneuvers/);
  });

  it('shows no feat note without a maneuver-grant feat', () => {
    render(<BattleMasterPanel data={{ maneuvers: [] }} level={3} onChange={vi.fn()} />);
    expect(screen.queryByTestId('battle-master-feat-note')).not.toBeInTheDocument();
    expect(screen.getByTestId('superiority-dice')).toHaveTextContent('4 / 4 remaining');
  });

  it('computes the maneuver save DC from the higher of STR/DEX (STR higher)', () => {
    // Level 3 (PB +2), STR 18 (+4), DEX 12 (+1) → 8 + 2 + 4 = 14
    render(<BattleMasterPanel data={{}} level={3} scores={{ strength: 18, dexterity: 12 }} onChange={vi.fn()} />);
    expect(screen.getByTestId('maneuver-save-dc')).toHaveTextContent('14');
    expect(screen.getByTestId('maneuver-save-dc-note')).toHaveTextContent('Strength');
    expect(screen.getByTestId('maneuver-save-dc-note')).toHaveTextContent('higher');
  });

  it('uses Dexterity when it is the higher modifier', () => {
    // Level 5 (PB +3), STR 10 (+0), DEX 18 (+4) → 8 + 3 + 4 = 15
    render(<BattleMasterPanel data={{}} level={5} scores={{ strength: 10, dexterity: 18 }} onChange={vi.fn()} />);
    expect(screen.getByTestId('maneuver-save-dc')).toHaveTextContent('15');
    expect(screen.getByTestId('maneuver-save-dc-note')).toHaveTextContent('Dexterity');
  });

  it('notes a tie when STR and DEX modifiers are equal', () => {
    render(<BattleMasterPanel data={{}} level={3} scores={{ strength: 16, dexterity: 16 }} onChange={vi.fn()} />);
    expect(screen.getByTestId('maneuver-save-dc-note')).toHaveTextContent('tied-highest');
  });
});
