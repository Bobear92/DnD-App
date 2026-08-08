import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeaponAmmoControl from '@/characters/components/inventory/WeaponAmmoControl';

// The control shared by the Items tab and the Action Economy tab. It never touches
// character_data itself — it hands the caller a new inventory array to persist.
const longbow = { uid: 'lb1', category: 'weapons', name: 'Longbow', properties: '["Ammunition", "Two-Handed"]' };
const arrows = { uid: 'am1', category: 'adventuring-gear', name: 'Arrows', item_category: 'Ammunition', quantity: 20 };
const silvered = { uid: 'am2', category: 'adventuring-gear', name: 'Silvered Arrows', item_category: 'Ammunition', quantity: 5 };
const bolts = { uid: 'am3', category: 'adventuring-gear', name: 'Crossbow Bolts', item_category: 'Ammunition', quantity: 30 };

const renderControl = (props = {}) => render(
  <WeaponAmmoControl weapon={longbow} inventory={[longbow, arrows]} onChange={vi.fn()} {...props} />
);

describe('WeaponAmmoControl', () => {
  it('shows the matching stack and how many are left', () => {
    renderControl();
    expect(screen.getByTestId('ammo-count-lb1')).toHaveTextContent('Arrows: 20 remaining');
  });

  it('Use Ammunition spends one from the selected stack', () => {
    const onChange = vi.fn();
    renderControl({ onChange });
    fireEvent.click(screen.getByTestId('use-ammo-lb1'));
    expect(onChange).toHaveBeenCalledWith([
      longbow,
      expect.objectContaining({ uid: 'am1', quantity: 19 }),
    ]);
  });

  it('flags an empty stack and disables the Use button', () => {
    renderControl({ inventory: [longbow, { ...arrows, quantity: 0 }] });
    expect(screen.getByTestId('ammo-out-lb1')).toHaveTextContent(/out of ammunition/i);
    expect(screen.getByTestId('use-ammo-lb1')).toBeDisabled();
  });

  it('shows no out-of-ammo flag while rounds remain', () => {
    renderControl();
    expect(screen.queryByTestId('ammo-out-lb1')).not.toBeInTheDocument();
    expect(screen.getByTestId('use-ammo-lb1')).not.toBeDisabled();
  });

  it('shows the empty hint when nothing in the inventory fits the weapon', () => {
    renderControl({ inventory: [longbow, bolts] }); // bolts are for crossbows
    expect(screen.getByTestId('weapon-ammo-lb1')).toHaveTextContent('No matching ammunition — add some below.');
    expect(screen.queryByTestId('use-ammo-lb1')).not.toBeInTheDocument();
  });

  it('takes a surface-specific empty hint', () => {
    renderControl({ inventory: [longbow], emptyHint: 'No matching ammunition — add some in the Items tab.' });
    expect(screen.getByTestId('weapon-ammo-lb1')).toHaveTextContent('add some in the Items tab');
  });

  it('offers a picker when more than one stack matches, and switching persists the choice', () => {
    const onChange = vi.fn();
    renderControl({ inventory: [longbow, arrows, silvered], onChange });
    const select = screen.getByTestId('ammo-select-lb1');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'am2' } });
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ uid: 'lb1', ammo_uid: 'am2' }),
      arrows,
      silvered,
    ]);
  });

  // Callers pass the LIVE inventory entry (it carries the stored ammo_uid), not a stale copy.
  it('honours the weapon stored ammo_uid over the first match', () => {
    const bound = { ...longbow, ammo_uid: 'am2' };
    renderControl({ weapon: bound, inventory: [bound, arrows, silvered] });
    expect(screen.getByTestId('ammo-count-lb1')).toHaveTextContent('Silvered Arrows: 5 remaining');
  });

  it('readOnly hides the picker and the Use button but still shows the count', () => {
    renderControl({ inventory: [longbow, arrows, silvered], readOnly: true });
    expect(screen.getByTestId('ammo-count-lb1')).toBeInTheDocument();
    expect(screen.queryByTestId('use-ammo-lb1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ammo-select-lb1')).not.toBeInTheDocument();
  });

  // Both surfaces can be mounted at once, so the ids have to be namespaceable.
  it('namespaces every test id with idPrefix', () => {
    renderControl({ idPrefix: 'ae-' });
    expect(screen.getByTestId('ae-weapon-ammo-lb1')).toBeInTheDocument();
    expect(screen.getByTestId('ae-ammo-count-lb1')).toBeInTheDocument();
    expect(screen.getByTestId('ae-use-ammo-lb1')).toBeInTheDocument();
    expect(screen.queryByTestId('weapon-ammo-lb1')).not.toBeInTheDocument();
  });
});
