import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PortentTracker, { isDivination, portentDiceCount } from './PortentTracker';

describe('PortentTracker helpers', () => {
  it('isDivination matches 5e and 2024 subclasses', () => {
    expect(isDivination('School of Divination')).toBe(true);
    expect(isDivination('Diviner')).toBe(true);
    expect(isDivination('School of Evocation')).toBe(false);
    expect(isDivination(undefined)).toBe(false);
  });

  it('portentDiceCount returns 2 below level 14 and 3 at/above (Greater Portent)', () => {
    expect(portentDiceCount(2)).toBe(2);
    expect(portentDiceCount(13)).toBe(2);
    expect(portentDiceCount(14)).toBe(3);
    expect(portentDiceCount(20)).toBe(3);
  });
});

describe('PortentTracker', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders nothing for a non-Divination subclass', () => {
    const { container } = render(
      <PortentTracker subclass="School of Evocation" level={2} data={{}} onChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows empty state and a Roll button when no rolls', () => {
    render(<PortentTracker subclass="School of Divination" level={2} data={{}} onChange={() => {}} />);
    expect(screen.getByText(/No foretelling rolls/i)).toBeInTheDocument();
    expect(screen.getByTestId('portent-roll-btn')).toHaveTextContent(/Roll Portent/i);
  });

  it('rolls 2 d20s and saves them via onChange', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // → floor(0.5*20)+1 = 11
    const onChange = vi.fn();
    render(<PortentTracker subclass="School of Divination" level={2} data={{}} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('portent-roll-btn'));
    expect(onChange).toHaveBeenCalledWith({
      portent_rolls: [
        { value: 11, used: false },
        { value: 11, used: false },
      ],
    });
  });

  it('rolls 3 d20s at level 14 (Greater Portent)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const onChange = vi.fn();
    render(<PortentTracker subclass="Diviner" level={14} data={{}} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('portent-roll-btn'));
    expect(onChange.mock.calls[0][0].portent_rolls).toHaveLength(3);
  });

  it('renders each saved die and expends one on click', () => {
    const onChange = vi.fn();
    const data = { portent_rolls: [{ value: 17, used: false }, { value: 4, used: false }] };
    render(<PortentTracker subclass="School of Divination" level={2} data={data} onChange={onChange} />);
    expect(screen.getByTestId('portent-die-0')).toHaveTextContent('17');
    expect(screen.getByTestId('portent-die-1')).toHaveTextContent('4');
    fireEvent.click(screen.getByTestId('portent-die-0'));
    expect(onChange).toHaveBeenCalledWith({
      portent_rolls: [{ value: 17, used: true }, { value: 4, used: false }],
    });
  });

  it('disables an expended die and shows the all-used note', () => {
    const data = { portent_rolls: [{ value: 17, used: true }, { value: 4, used: true }] };
    render(<PortentTracker subclass="School of Divination" level={2} data={data} onChange={() => {}} />);
    expect(screen.getByTestId('portent-die-0')).toBeDisabled();
    expect(screen.getByText(/All foretelling rolls expended/i)).toBeInTheDocument();
  });

  it('hides controls when readOnly', () => {
    const data = { portent_rolls: [{ value: 17, used: false }] };
    render(<PortentTracker subclass="School of Divination" level={2} data={data} readOnly onChange={() => {}} />);
    expect(screen.queryByTestId('portent-roll-btn')).not.toBeInTheDocument();
    expect(screen.getByTestId('portent-die-0')).toBeDisabled();
  });
});
