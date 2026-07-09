import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WarlockSheet from './WarlockSheet';

const rapier = { uid: 'w1', category: 'weapons', name: 'Rapier', damage: '1d8', damage_type: 'piercing', properties: 'Finesse' };
const greatsword = { uid: 'w2', category: 'weapons', name: 'Greatsword', damage: '2d6', damage_type: 'slashing', properties: 'Heavy, Two-Handed' };

const renderSheet = (data, props = {}) =>
  render(
    <MemoryRouter>
      <WarlockSheet data={data} level={props.level ?? 5} section="features" onChange={() => {}} {...props} />
    </MemoryRouter>
  );

describe('WarlockSheet — Hex Warrior weapon (Hexblade)', () => {
  it('shows a read-only Hex Warrior panel for a Hexblade with the designated weapon', () => {
    renderSheet({ subclass: 'The Hexblade', inventory: [rapier], hex_weapon_uid: 'w1' });
    expect(screen.getByTestId('hex-warrior-panel')).toBeInTheDocument();
    expect(screen.getByTestId('hex-features-designated-w1')).toHaveTextContent('Rapier');
    expect(screen.getByTestId('hex-warrior-items-hint')).toHaveTextContent(/Items tab/);
    // read-only — no toggle buttons
    expect(screen.queryByTestId('hex-features-toggle-w1')).not.toBeInTheDocument();
  });

  it('shows the empty state when no weapon is designated', () => {
    renderSheet({ subclass: 'The Hexblade', inventory: [greatsword] });
    expect(screen.getByTestId('hex-features-empty')).toBeInTheDocument();
  });

  it('does not render the panel for a non-Hexblade patron', () => {
    renderSheet({ subclass: 'The Fiend', inventory: [rapier] });
    expect(screen.queryByTestId('hex-warrior-panel')).not.toBeInTheDocument();
  });

  it('does not render the panel during creation', () => {
    renderSheet({ subclass: 'The Hexblade', inventory: [rapier] }, { creation: true, level: 1, section: 'all' });
    expect(screen.queryByTestId('hex-warrior-panel')).not.toBeInTheDocument();
  });
});
