import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RacialResourceTracker from './RacialResourceTracker';
import { getRacialRestResources } from './racialRestResources';

describe('getRacialRestResources', () => {
  it('returns nothing for a race with no rest-gated traits', () => {
    expect(getRacialRestResources(['Darkvision', 'Keen Senses'], 5)).toHaveLength(0);
  });

  it('returns Breath Weapon for Dragonborn', () => {
    const res = getRacialRestResources(['Breath Weapon', 'Damage Resistance'], 1);
    expect(res.map(r => r.key)).toEqual(['breath_weapon_used']);
  });

  it('gates Drow Magic spells by level', () => {
    expect(getRacialRestResources(['Drow Magic'], 1).map(r => r.key)).toEqual([]);
    expect(getRacialRestResources(['Drow Magic'], 3).map(r => r.key)).toEqual(['drow_faerie_fire_used']);
    expect(getRacialRestResources(['Drow Magic'], 5).map(r => r.key)).toEqual([
      'drow_faerie_fire_used',
      'drow_darkness_used',
    ]);
  });

  it('gates Infernal Legacy spells by level', () => {
    expect(getRacialRestResources(['Infernal Legacy'], 5).map(r => r.key)).toEqual([
      'infernal_hellish_rebuke_used',
      'infernal_darkness_used',
    ]);
  });
});

describe('RacialResourceTracker', () => {
  it('renders nothing when there are no applicable resources', () => {
    const { container } = render(
      <RacialResourceTracker traits={['Darkvision']} level={5} data={{}} onChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Relentless Endurance with full uses by default', () => {
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{}} onChange={() => {}} />);
    expect(screen.getByText('Relentless Endurance')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('shows 0 remaining when used', () => {
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{ relentless_endurance_used: 1 }} onChange={() => {}} />);
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('expends a use via the Use button after confirming', () => {
    const onChange = vi.fn();
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{}} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Use Relentless Endurance'));
    // clicking Use does not expend immediately — it opens a confirmation dialog
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('racial-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ relentless_endurance_used: 1 });
  });

  it('does not expend when the confirmation is cancelled', () => {
    const onChange = vi.fn();
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{}} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Use Relentless Endurance'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('confirmation tells the player Breath Weapon recharges on a short or long rest', () => {
    render(<RacialResourceTracker traits={['Breath Weapon']} level={1} data={{}} onChange={() => {}} />);
    fireEvent.click(screen.getByLabelText('Use Breath Weapon'));
    expect(screen.getByText(/available again after a short or long rest/i)).toBeInTheDocument();
  });

  it('confirmation tells the player Relentless Endurance recharges on a long rest', () => {
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{}} onChange={() => {}} />);
    fireEvent.click(screen.getByLabelText('Use Relentless Endurance'));
    expect(screen.getByText(/available again after a long rest/i)).toBeInTheDocument();
  });

  it('disables the Use button when no uses remain', () => {
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{ relentless_endurance_used: 1 }} onChange={() => {}} />);
    expect(screen.getByLabelText('Use Relentless Endurance')).toBeDisabled();
  });

  it('filters resources via includeKeys', () => {
    render(
      <RacialResourceTracker
        traits={['Breath Weapon', 'Drow Magic']}
        level={5}
        data={{}}
        onChange={() => {}}
        includeKeys={['breath_weapon_used']}
      />
    );
    expect(screen.getByText('Breath Weapon')).toBeInTheDocument();
    expect(screen.queryByText('Faerie Fire')).not.toBeInTheDocument();
  });

  it('filters resources via excludeKeys', () => {
    render(
      <RacialResourceTracker
        traits={['Breath Weapon', 'Drow Magic']}
        level={5}
        data={{}}
        onChange={() => {}}
        excludeKeys={['breath_weapon_used']}
      />
    );
    expect(screen.queryByText('Breath Weapon')).not.toBeInTheDocument();
    expect(screen.getByText('Faerie Fire')).toBeInTheDocument();
  });

  it('renders nothing when includeKeys filters out every resource', () => {
    const { container } = render(
      <RacialResourceTracker
        traits={['Drow Magic']}
        level={5}
        data={{}}
        onChange={() => {}}
        includeKeys={['breath_weapon_used']}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('recovers a use via the − button', () => {
    const onChange = vi.fn();
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{ relentless_endurance_used: 1 }} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Recover Relentless Endurance'));
    expect(onChange).toHaveBeenCalledWith({ relentless_endurance_used: 0 });
  });

  it('shows the recharge label (short or long rest) for Breath Weapon', () => {
    render(<RacialResourceTracker traits={['Breath Weapon']} level={1} data={{}} onChange={() => {}} />);
    expect(screen.getByText(/Short or long rest/i)).toBeInTheDocument();
  });

  it('hides +/− buttons when readOnly', () => {
    render(<RacialResourceTracker traits={['Relentless Endurance']} level={5} data={{}} readOnly onChange={() => {}} />);
    expect(screen.queryByLabelText('Use Relentless Endurance')).not.toBeInTheDocument();
  });
});
