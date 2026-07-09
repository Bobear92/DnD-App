import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeaponBondPanel from './WeaponBondPanel';

const rapier = { uid: 'w1', category: 'weapons', name: 'Rapier', damage: '1d8', damage_type: 'piercing' };
const longsword = { uid: 'w2', category: 'weapons', name: 'Longsword', damage: '1d8', damage_type: 'slashing' };

describe('WeaponBondPanel', () => {
  it('renders read-only bonded weapons with a hint pointing to the Items tab', () => {
    render(<WeaponBondPanel data={{ inventory: [rapier, longsword], bonded_weapon_uids: ['w1'] }} level={5} />);
    expect(screen.getByTestId('weapon-bond-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bond-features-designated-w1')).toHaveTextContent('Rapier');
    expect(screen.getByTestId('weapon-bond-items-hint')).toHaveTextContent(/Items tab/);
    // read-only: no toggle buttons
    expect(screen.queryByTestId('bond-features-toggle-w1')).not.toBeInTheDocument();
  });

  it('shows the empty state when no weapon is bonded', () => {
    render(<WeaponBondPanel data={{ inventory: [rapier] }} level={3} />);
    expect(screen.getByTestId('bond-features-empty')).toBeInTheDocument();
  });

  it('renders nothing below L3 (no Weapon Bond yet)', () => {
    const { container } = render(<WeaponBondPanel data={{ inventory: [rapier] }} level={2} />);
    expect(container).toBeEmptyDOMElement();
  });
});
