import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatManeuverPicker from '@/characters/components/feats/FeatManeuverPicker';

const SPEC = { count: 2, die: 'd6', label: '2 maneuvers' };

describe('FeatManeuverPicker', () => {
  it('renders nothing without a spec', () => {
    const { container } = render(<FeatManeuverPicker spec={null} onChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the count and the full maneuver list', () => {
    render(<FeatManeuverPicker spec={SPEC} value={[]} onChange={vi.fn()} />);
    expect(screen.getByTestId('feat-maneuver-count')).toHaveTextContent('0/2');
    expect(screen.getByTestId('feat-maneuver-Trip Attack')).toBeInTheDocument();
    expect(screen.getByTestId('feat-maneuver-Riposte')).toBeInTheDocument();
  });

  it('selecting a maneuver reports it up', () => {
    const onChange = vi.fn();
    render(<FeatManeuverPicker spec={SPEC} value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('feat-maneuver-Trip Attack'));
    expect(onChange).toHaveBeenCalledWith(['Trip Attack']);
  });

  it('excludes maneuvers the character already knows (Battle Master)', () => {
    render(<FeatManeuverPicker spec={SPEC} value={[]} onChange={vi.fn()} knownManeuvers={['Trip Attack']} />);
    expect(screen.queryByTestId('feat-maneuver-Trip Attack')).not.toBeInTheDocument();
    expect(screen.getByTestId('feat-maneuver-Riposte')).toBeInTheDocument();
  });

  it('disables further picks once at the limit', () => {
    const onChange = vi.fn();
    render(<FeatManeuverPicker spec={SPEC} value={['Trip Attack', 'Riposte']} onChange={onChange} />);
    expect(screen.getByTestId('feat-maneuver-count')).toHaveTextContent('2/2');
    const third = screen.getByTestId('feat-maneuver-Parry');
    expect(third).toBeDisabled();
    fireEvent.click(third);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clicking a chosen maneuver deselects it', () => {
    const onChange = vi.fn();
    render(<FeatManeuverPicker spec={SPEC} value={['Trip Attack']} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('feat-maneuver-Trip Attack'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('uses the 2024 list when edition is 5.5e', () => {
    render(<FeatManeuverPicker spec={SPEC} value={[]} onChange={vi.fn()} edition="5.5e" />);
    expect(screen.getByTestId('feat-maneuver-Ambush')).toBeInTheDocument(); // 2024-only
  });
});
