import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InspirationCard from './InspirationCard';

describe('InspirationCard', () => {
  it('renders the value (defaults to 0)', () => {
    render(<InspirationCard />);
    expect(screen.getByTestId('inspiration-value')).toHaveTextContent('0');
  });

  it('renders a provided value', () => {
    render(<InspirationCard value={2} />);
    expect(screen.getByTestId('inspiration-value')).toHaveTextContent('2');
  });

  it('increments via the + button', () => {
    const onChange = vi.fn();
    render(<InspirationCard value={1} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('inspiration-inc'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('decrements via the − button', () => {
    const onChange = vi.fn();
    render(<InspirationCard value={2} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('inspiration-dec'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('floors at 0 — the − button is disabled at 0', () => {
    const onChange = vi.fn();
    render(<InspirationCard value={0} onChange={onChange} />);
    expect(screen.getByTestId('inspiration-dec')).toBeDisabled();
  });

  it('hides the steppers when readOnly', () => {
    render(<InspirationCard value={1} readOnly />);
    expect(screen.queryByTestId('inspiration-inc')).not.toBeInTheDocument();
    expect(screen.queryByTestId('inspiration-dec')).not.toBeInTheDocument();
  });

  it('renders a note when provided', () => {
    render(<InspirationCard value={0} note="Heroic Warrior: give yourself Heroic Inspiration." />);
    expect(screen.getByTestId('heroic-warrior-note')).toHaveTextContent(/Heroic Warrior/);
  });

  it('renders no note when none provided', () => {
    render(<InspirationCard value={0} />);
    expect(screen.queryByTestId('heroic-warrior-note')).not.toBeInTheDocument();
  });
});
