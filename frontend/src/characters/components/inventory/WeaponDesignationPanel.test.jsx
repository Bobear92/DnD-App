import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeaponDesignationPanel from './WeaponDesignationPanel';

const rapier = { uid: 'w1', category: 'weapons', name: 'Rapier', damage: '1d8', damage_type: 'piercing', properties: 'Finesse' };
const longsword = { uid: 'w2', category: 'weapons', name: 'Longsword', damage: '1d8', damage_type: 'slashing', properties: 'Versatile (1d10)' };
const greatsword = { uid: 'w3', category: 'weapons', name: 'Greatsword', damage: '2d6', damage_type: 'slashing', properties: 'Heavy, Two-Handed' };
const shield = { uid: 'a1', category: 'armor', name: 'Shield' };
const INV = [rapier, longsword, greatsword, shield];

const setup = (props = {}) =>
  render(
    <WeaponDesignationPanel
      title="Bonded Weapons"
      description="Summon a bonded weapon as a bonus action."
      inventory={INV}
      designatedUids={[]}
      capacity={2}
      onToggle={vi.fn()}
      testIdPrefix="bond"
      {...props}
    />
  );

describe('WeaponDesignationPanel', () => {
  it('renders title, description, count, and the empty state', () => {
    setup();
    expect(screen.getByText('Bonded Weapons')).toBeInTheDocument();
    expect(screen.getByText(/summon a bonded weapon/i)).toBeInTheDocument();
    expect(screen.getByTestId('bond-count')).toHaveTextContent('0/2');
    expect(screen.getByTestId('bond-empty')).toBeInTheDocument();
  });

  it('lists only weapons (not armor) as choices and toggles via onToggle', () => {
    const onToggle = vi.fn();
    setup({ onToggle });
    expect(screen.queryByText('Shield')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('bond-toggle-w1'));
    expect(onToggle).toHaveBeenCalledWith('w1');
  });

  it('shows designated weapons with a badge and the clear label on their button', () => {
    setup({ designatedUids: ['w1'] });
    expect(screen.getByTestId('bond-designated-w1')).toHaveTextContent('Rapier');
    expect(screen.getByTestId('bond-count')).toHaveTextContent('1/2');
    expect(screen.getByTestId('bond-toggle-w1')).toHaveTextContent('Unbond');
    expect(screen.getByTestId('bond-toggle-w2')).toHaveTextContent('Bond');
  });

  it('disables further designation at capacity (but not un-designation)', () => {
    setup({ designatedUids: ['w1', 'w2'] });
    expect(screen.getByTestId('bond-toggle-w3')).toBeDisabled();
    expect(screen.getByTestId('bond-toggle-w1')).not.toBeDisabled();
  });

  it('swapAtCapacity keeps other buttons enabled at capacity (Hex Warrior swap)', () => {
    setup({ designatedUids: ['w1'], capacity: 1, swapAtCapacity: true });
    expect(screen.getByTestId('bond-toggle-w2')).not.toBeDisabled();
  });

  it('ineligible weapons show the reason and no toggle button', () => {
    setup({
      eligible: (e) => !/two-handed/i.test(e.properties || ''),
      ineligibleReason: 'Two-Handed weapons cannot be chosen.',
    });
    expect(screen.getByTestId('bond-ineligible-w3')).toHaveTextContent(/two-handed/i);
    expect(screen.queryByTestId('bond-toggle-w3')).not.toBeInTheDocument();
    expect(screen.getByTestId('bond-toggle-w1')).toBeInTheDocument();
  });

  it('readOnly hides the chooser but keeps the designated list', () => {
    setup({ designatedUids: ['w2'], readOnly: true });
    expect(screen.getByTestId('bond-designated-w2')).toBeInTheDocument();
    expect(screen.queryByTestId('bond-toggle-w1')).not.toBeInTheDocument();
  });

  it('shows a "no weapons yet" hint when the inventory has no weapons', () => {
    setup({ inventory: [shield] });
    expect(screen.getByTestId('bond-no-weapons')).toBeInTheDocument();
  });
});
