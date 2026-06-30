import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import WeaponPropertyBadges from '@/characters/components/inventory/WeaponPropertyBadges';

const BADGES = [
  { label: 'Martial', variant: 'outline' },
  { label: 'Two-handed', variant: 'outline' },
  { label: 'Heavy', variant: 'secondary' },
];

describe('WeaponPropertyBadges', () => {
  it('renders nothing when there are no badges', () => {
    const { container } = render(<WeaponPropertyBadges badges={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders each attribute badge', () => {
    render(<WeaponPropertyBadges badges={BADGES} />);
    expect(screen.getByTestId('weapon-prop-Martial')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-prop-Two-handed')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-prop-Heavy')).toBeInTheDocument();
  });

  it('shows a description on click and hides it on re-click', () => {
    render(<WeaponPropertyBadges badges={BADGES} />);
    expect(screen.queryByTestId('weapon-prop-description')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('weapon-prop-Heavy'));
    expect(screen.getByTestId('weapon-prop-description')).toHaveTextContent(/disadvantage/i);
    fireEvent.click(screen.getByTestId('weapon-prop-Heavy'));
    expect(screen.queryByTestId('weapon-prop-description')).not.toBeInTheDocument();
  });

  it('switches the description when another badge is clicked', () => {
    render(<WeaponPropertyBadges badges={BADGES} />);
    fireEvent.click(screen.getByTestId('weapon-prop-Heavy'));
    fireEvent.click(screen.getByTestId('weapon-prop-Two-handed'));
    expect(screen.getByTestId('weapon-prop-description')).toHaveTextContent(/both hands/i);
  });

  it('does not make an unknown attribute clickable', () => {
    render(<WeaponPropertyBadges badges={[{ label: 'Mystery' }]} />);
    const badge = screen.getByTestId('weapon-prop-Mystery');
    expect(badge).not.toHaveAttribute('role', 'button');
    fireEvent.click(badge);
    expect(screen.queryByTestId('weapon-prop-description')).not.toBeInTheDocument();
  });
});
