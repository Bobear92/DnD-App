import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RestUseControl from '@/characters/components/race/RestUseControl';

const setup = (props = {}) => {
  const onUsedChange = vi.fn();
  render(
    <RestUseControl label="Hellish Rebuke" recharge="long" used={0} max={1}
      onUsedChange={onUsedChange} {...props} />
  );
  return { onUsedChange };
};

describe('RestUseControl', () => {
  it('shows remaining out of max', () => {
    setup({ used: 1, max: 3 });
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('never shows a negative remaining', () => {
    setup({ used: 5, max: 1 });
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  // Spending is confirmed, recovering is not — an accidental Use costs a resource.
  it('spends only after confirming', () => {
    const { onUsedChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Use Hellish Rebuke' }));
    expect(onUsedChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('racial-use-confirm-button'));
    expect(onUsedChange).toHaveBeenCalledWith(1);
  });

  it('does not spend when the dialog is cancelled', () => {
    const { onUsedChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Use Hellish Rebuke' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onUsedChange).not.toHaveBeenCalled();
  });

  it('recovers a use immediately, with no dialog', () => {
    const { onUsedChange } = setup({ used: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Recover Hellish Rebuke' }));
    expect(onUsedChange).toHaveBeenCalledWith(0);
  });

  it('disables Use at zero remaining and − at zero spent', () => {
    setup({ used: 1, max: 1 });
    expect(screen.getByRole('button', { name: 'Use Hellish Rebuke' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Recover Hellish Rebuke' })).toBeEnabled();
  });

  it('tells the player when it comes back — short vs long rest', () => {
    setup({ recharge: 'short' });
    fireEvent.click(screen.getByRole('button', { name: 'Use Hellish Rebuke' }));
    expect(screen.getByText(/after a short or long rest/i)).toBeInTheDocument();
  });

  it('readOnly leaves the read-out but no controls', () => {
    setup({ readOnly: true, used: 0, max: 2 });
    expect(screen.getByText('2/2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Use Hellish Rebuke/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Recover Hellish Rebuke/ })).not.toBeInTheDocument();
  });
});
