import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import HitDiceTracker from '@/characters/components/combat/HitDiceTracker';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HitDiceTracker — legacy +/- mode (no onHeal)', () => {
  it('renders the +/- stepper when no onHeal is provided', () => {
    render(<HitDiceTracker hitDie={10} level={5} used={1} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '−' })).toBeInTheDocument();
    expect(screen.queryByTestId('hit-dice-use-btn')).not.toBeInTheDocument();
  });

  it('shows die type and remaining/total', () => {
    render(<HitDiceTracker hitDie={8} level={4} used={1} onChange={() => {}} />);
    expect(screen.getByText(/^d8/)).toBeInTheDocument();
    expect(screen.getByText('3 / 4 remaining')).toBeInTheDocument();
  });

  it('+ calls onChange with incremented used', () => {
    const onChange = vi.fn();
    render(<HitDiceTracker hitDie={10} level={5} used={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('hides controls during creation', () => {
    render(<HitDiceTracker hitDie={10} level={5} used={0} onChange={() => {}} creation />);
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
    expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
  });
});

describe('HitDiceTracker — heal mode (onHeal provided)', () => {
  const baseProps = {
    hitDie: 10,
    level: 5,
    used: 0,
    conMod: 2,
    currentHp: 45,
    maxHp: 52,
  };

  it('shows a Use button instead of +/-', () => {
    render(<HitDiceTracker {...baseProps} onHeal={() => {}} />);
    expect(screen.getByTestId('hit-dice-use-btn')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
  });

  it('disables Use when no Hit Dice remain', () => {
    render(<HitDiceTracker {...baseProps} used={5} onHeal={() => {}} />);
    expect(screen.getByTestId('hit-dice-use-btn')).toBeDisabled();
  });

  it('opens the dialog with a notice and quantity defaulting to 1', () => {
    render(<HitDiceTracker {...baseProps} onHeal={() => {}} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    expect(screen.getByText('Spend Hit Dice to Heal')).toBeInTheDocument();
    expect(screen.getByText(/aren't regained until you finish a long rest/i)).toBeInTheDocument();
    expect(screen.getByTestId('hit-dice-qty')).toHaveTextContent('1');
  });

  it('quantity stepper clamps to remaining', () => {
    render(<HitDiceTracker {...baseProps} used={3} onHeal={() => {}} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    const more = screen.getByLabelText('More Hit Dice');
    // remaining = 2: 1 -> 2 -> capped
    fireEvent.click(more);
    expect(screen.getByTestId('hit-dice-qty')).toHaveTextContent('2');
    expect(more).toBeDisabled();
  });

  it('rolling calls onHeal with expended dice + healed HP and shows the breakdown', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // d10 -> 1
    const onHeal = vi.fn();
    render(<HitDiceTracker {...baseProps} onHeal={onHeal} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));

    // roll 1 + CON 2 = 3 HP; 45 -> 48; one die spent
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 48 });
    expect(screen.getByTestId('hit-dice-result')).toBeInTheDocument();
    expect(screen.getByText('+3 HP regained')).toBeInTheDocument();
    expect(screen.getByText('HP: 45 → 48')).toBeInTheDocument();
  });

  it('caps healed HP at maxHp', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // d10 -> 10
    const onHeal = vi.fn();
    render(<HitDiceTracker {...baseProps} currentHp={50} onHeal={onHeal} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    // 10 + 2 = 12, but 50 + 12 capped at 52
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 52 });
  });

  it('rolls multiple dice when quantity increased', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // each d10 -> 1
    const onHeal = vi.fn();
    render(<HitDiceTracker {...baseProps} onHeal={onHeal} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    fireEvent.click(screen.getByLabelText('More Hit Dice')); // qty 2
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    // 2 dice: (1+2) + (1+2) = 6 HP; 45 -> 51; 2 dice spent
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 2, current_hp: 51 });
  });

  it('floors a die contribution at 0 for negative CON modifier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // d10 -> 1
    const onHeal = vi.fn();
    render(<HitDiceTracker {...baseProps} conMod={-3} onHeal={onHeal} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    // 1 + (-3) = -2 -> floored to 0; HP unchanged at 45; die still spent
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 45 });
  });

  it('hides the Use button when readOnly', () => {
    render(<HitDiceTracker {...baseProps} onHeal={() => {}} readOnly />);
    expect(screen.queryByTestId('hit-dice-use-btn')).not.toBeInTheDocument();
  });

  describe('Durable feat', () => {
    it('notates the guaranteed minimum HP for the chosen number of dice', () => {
      // conMod 2 → per-die minimum = 2 × 2 = 4
      render(<HitDiceTracker {...baseProps} onHeal={() => {}} durable />);
      fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
      const note = screen.getByTestId('hit-dice-durable-min');
      expect(note).toHaveTextContent('at least 4 HP');
      expect(note).toHaveTextContent('4 per die');
      expect(note).toHaveTextContent('from 1 die');
      // Bumping to 2 dice doubles the minimum.
      fireEvent.click(screen.getByLabelText('More Hit Dice'));
      expect(screen.getByTestId('hit-dice-durable-min')).toHaveTextContent('at least 8 HP');
    });

    it('is not shown without the Durable feat', () => {
      render(<HitDiceTracker {...baseProps} onHeal={() => {}} />);
      fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
      expect(screen.queryByTestId('hit-dice-durable-min')).not.toBeInTheDocument();
    });

    it('floors a low roll at twice the CON modifier and flags it', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // d10 -> 1
      const onHeal = vi.fn();
      render(<HitDiceTracker {...baseProps} onHeal={onHeal} durable />);
      fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
      fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
      // 1 + 2 = 3, raised to the Durable minimum of 4; 45 -> 49
      expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 49 });
      expect(screen.getByText('+4 HP regained')).toBeInTheDocument();
      expect(screen.getByTestId('hit-dice-durable-applied')).toBeInTheDocument();
    });

    it('does not lower a roll already above the minimum', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.99); // d10 -> 10
      const onHeal = vi.fn();
      render(<HitDiceTracker {...baseProps} currentHp={30} onHeal={onHeal} durable />);
      fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
      fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
      // 10 + 2 = 12 (above the minimum of 4); 30 -> 42; no Durable flag
      expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 42 });
      expect(screen.getByText('+12 HP regained')).toBeInTheDocument();
      expect(screen.queryByTestId('hit-dice-durable-applied')).not.toBeInTheDocument();
    });
  });
});

describe('HitDiceTracker — Roll at the Table (manual entry)', () => {
  const baseProps = {
    hitDie: 10,
    level: 5,
    used: 0,
    conMod: 2,
    currentHp: 45,
    maxHp: 60,
  };

  const openManual = (props = {}) => {
    render(<HitDiceTracker {...baseProps} {...props} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    fireEvent.click(screen.getByTestId('hit-dice-mode-manual'));
  };

  it('defaults to rolling in the app — no inputs until the method is chosen', () => {
    render(<HitDiceTracker {...baseProps} onHeal={() => {}} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    expect(screen.getByTestId('hit-dice-mode-auto')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('hit-dice-manual-entry')).not.toBeInTheDocument();
  });

  it('shows one input per die and resizes with the die count', () => {
    openManual({ onHeal: () => {} });
    expect(screen.getByTestId('hit-dice-manual-input-0')).toBeInTheDocument();
    expect(screen.queryByTestId('hit-dice-manual-input-1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('More Hit Dice'));
    expect(screen.getByTestId('hit-dice-manual-input-1')).toBeInTheDocument();
  });

  it('uses the typed die instead of rolling, and never calls Math.random', () => {
    const random = vi.spyOn(Math, 'random');
    const onHeal = vi.fn();
    openManual({ onHeal });
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '7' } });
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    // 7 + 2 CON = 9; 45 → 54
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 54 });
    expect(random).not.toHaveBeenCalled();
    expect(screen.getByText('+9 HP regained')).toBeInTheDocument();
  });

  it('sums several typed dice', () => {
    const onHeal = vi.fn();
    openManual({ onHeal });
    fireEvent.click(screen.getByLabelText('More Hit Dice'));
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '3' } });
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-1'), { target: { value: '8' } });
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    // (3+2) + (8+2) = 15; 45 → 60 (capped at max)
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 2, current_hp: 60 });
  });

  it('blocks submission until every die has a valid value', () => {
    openManual({ onHeal: () => {} });
    fireEvent.click(screen.getByLabelText('More Hit Dice'));
    expect(screen.getByTestId('hit-dice-roll-btn')).toBeDisabled();
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '5' } });
    expect(screen.getByTestId('hit-dice-roll-btn')).toBeDisabled();
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-1'), { target: { value: '5' } });
    expect(screen.getByTestId('hit-dice-roll-btn')).not.toBeDisabled();
  });

  it('rejects a value outside 1–hitDie with an error', () => {
    openManual({ onHeal: () => {} });
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '11' } });
    expect(screen.getByTestId('hit-dice-manual-error')).toBeInTheDocument();
    expect(screen.getByTestId('hit-dice-roll-btn')).toBeDisabled();
  });

  it('still applies the Durable floor to a low typed die', () => {
    const onHeal = vi.fn();
    openManual({ onHeal, durable: true });
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '1' } });
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    // 1 + 2 = 3, raised to the Durable minimum of 4; 45 → 49
    expect(onHeal).toHaveBeenCalledWith({ hit_dice_used: 1, current_hp: 49 });
    expect(screen.getByTestId('hit-dice-durable-applied')).toBeInTheDocument();
  });

  it('says the dice were Entered, not Rolled', () => {
    openManual({ onHeal: () => {} });
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '6' } });
    fireEvent.click(screen.getByTestId('hit-dice-roll-btn'));
    expect(screen.getByTestId('hit-dice-result')).toHaveTextContent(/Entered/);
    expect(screen.getByTestId('hit-dice-result')).not.toHaveTextContent(/Rolled/);
  });

  it('labels the button Apply rather than Roll', () => {
    openManual({ onHeal: () => {} });
    expect(screen.getByTestId('hit-dice-roll-btn')).toHaveTextContent('Apply 1 Hit Die');
  });

  it('resets to the rolling method when the dialog is reopened', () => {
    render(<HitDiceTracker {...baseProps} onHeal={() => {}} />);
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    fireEvent.click(screen.getByTestId('hit-dice-mode-manual'));
    fireEvent.change(screen.getByTestId('hit-dice-manual-input-0'), { target: { value: '4' } });
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByTestId('hit-dice-use-btn'));
    expect(screen.getByTestId('hit-dice-mode-auto')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('hit-dice-manual-entry')).not.toBeInTheDocument();
  });
});
