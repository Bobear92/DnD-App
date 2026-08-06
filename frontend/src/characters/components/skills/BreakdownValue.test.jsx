import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BreakdownValue, { BreakdownPanel } from './BreakdownValue';
import { buildBreakdown } from './skillMath';

const BREAKDOWN = buildBreakdown({
  parts: [
    { key: 'ability', label: 'WIS modifier', value: -1 },
    { key: 'proficiency', label: 'Proficiency bonus', value: 4 },
  ],
  notes: ['Advantage — Remarkable Athlete'],
});

describe('BreakdownValue', () => {
  it('renders the total as a signed bonus', () => {
    render(<BreakdownValue testId="v" breakdown={BREAKDOWN} />);
    expect(screen.getByTestId('v')).toHaveTextContent('+3');
  });

  it('renders the total unsigned when signed={false} (passive scores)', () => {
    const passive = buildBreakdown({ parts: [{ key: 'base', label: 'Base', value: 10, signed: false }] });
    render(<BreakdownValue testId="v" breakdown={passive} signed={false} />);
    expect(screen.getByTestId('v')).toHaveTextContent('10');
    expect(screen.getByTestId('v')).not.toHaveTextContent('+10');
  });

  it('calls onToggle when clicked and reflects expanded state', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<BreakdownValue testId="v" breakdown={BREAKDOWN} onToggle={onToggle} />);
    expect(screen.getByTestId('v')).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByTestId('v'));
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<BreakdownValue testId="v" breakdown={BREAKDOWN} onToggle={onToggle} expanded />);
    expect(screen.getByTestId('v')).toHaveAttribute('aria-expanded', 'true');
  });

  it('names what it explains in the tooltip', () => {
    render(<BreakdownValue testId="v" label="Perception" breakdown={BREAKDOWN} />);
    expect(screen.getByTestId('v')).toHaveAttribute('title', 'How Perception is calculated');
  });
});

describe('BreakdownPanel', () => {
  it('lists every part with its signed value', () => {
    render(<BreakdownPanel testId="p" breakdown={BREAKDOWN} />);
    const panel = screen.getByTestId('p');
    expect(panel).toHaveTextContent('WIS modifier');
    expect(panel).toHaveTextContent('−1');
    expect(panel).toHaveTextContent('Proficiency bonus');
    expect(panel).toHaveTextContent('+4');
  });

  it('shows a Total that matches the parts', () => {
    render(<BreakdownPanel testId="p" breakdown={BREAKDOWN} />);
    expect(screen.getByTestId('p')).toHaveTextContent('Total');
    expect(screen.getByTestId('p')).toHaveTextContent('+3');
  });

  it('renders an unsigned part unsigned (a passive score base)', () => {
    const passive = buildBreakdown({
      parts: [
        { key: 'base', label: 'Base', value: 10, signed: false },
        { key: 'ability', label: 'INT modifier', value: 4 },
      ],
    });
    render(<BreakdownPanel testId="p" breakdown={passive} signed={false} />);
    const panel = screen.getByTestId('p');
    expect(panel).toHaveTextContent('Base');
    expect(panel).toHaveTextContent('+4'); // the ability part is still a signed bonus
    expect(panel).not.toHaveTextContent('+10');
  });

  it('shows advantage/disadvantage notes', () => {
    render(<BreakdownPanel testId="p" breakdown={BREAKDOWN} />);
    expect(screen.getByTestId('p')).toHaveTextContent('Advantage — Remarkable Athlete');
  });

  it('renders nothing extra when there are no notes', () => {
    const plain = buildBreakdown({ parts: [{ key: 'ability', label: 'STR modifier', value: 2 }] });
    render(<BreakdownPanel testId="p" breakdown={plain} />);
    expect(screen.getByTestId('p')).toHaveTextContent('STR modifier');
    expect(screen.getByTestId('p')).not.toHaveTextContent('Advantage');
  });
});
