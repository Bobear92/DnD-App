import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RestUseSteppers } from '@/characters/components/sheets/classSheet/RestResourceTracker';

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
