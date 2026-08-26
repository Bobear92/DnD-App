import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RuneCarvingControl from '@/characters/components/inventory/RuneCarvingControl';

const axe = { uid: 'w1', category: 'weapons', name: 'Battleaxe', equipped: true, hand: 'main' };
const bow = { uid: 'w2', category: 'weapons', name: 'Longbow', equipped: false };

const cd = (rune_items = {}, runes = ['Cloud Rune', 'Fire Rune']) => ({
  subclass: 'Rune Knight', runes, rune_items, inventory: [axe, bow],
});

const setup = (props = {}) => {
  const onAssign = vi.fn();
  const onClear = vi.fn();
  render(
    <RuneCarvingControl
      entry={axe}
      characterData={cd()}
      level={7}
      onAssign={onAssign}
      onClear={onClear}
      {...props}
    />,
  );
  return { onAssign, onClear };
};

describe('choosing a rune', () => {
  it('offers each known rune as a button', () => {
    setup();
    expect(screen.getByTestId('rune-assign-w1-cloud')).toBeInTheDocument();
    expect(screen.getByTestId('rune-assign-w1-fire')).toBeInTheDocument();
  });

  it('calls onAssign with the rune name', async () => {
    const { onAssign } = setup();
    await userEvent.click(screen.getByTestId('rune-assign-w1-cloud'));
    expect(onAssign).toHaveBeenCalledWith('Cloud Rune');
  });

  it('does not offer a rune already carved on another item', () => {
    setup({ characterData: cd({ 'Cloud Rune': 'w2' }) });
    expect(screen.queryByTestId('rune-assign-w1-cloud')).not.toBeInTheDocument();
    expect(screen.getByTestId('rune-assign-w1-fire')).toBeInTheDocument();
  });

  // With every rune carved elsewhere there is nothing to offer, and saying so on each of a
  // long inventory's rows would be pure noise — the rune is already labelled where it lives.
  it('renders nothing when every known rune is carved on something else', () => {
    const { container } = render(
      <RuneCarvingControl
        entry={axe}
        characterData={cd({ 'Cloud Rune': 'w2', 'Fire Rune': 'w2' })}
        level={7}
        onAssign={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('a carved rune', () => {
  it('shows the rune name and what it actually does', () => {
    setup({ characterData: cd({ 'Cloud Rune': 'w1' }) });
    expect(screen.getByTestId('rune-badge-w1')).toHaveTextContent('Cloud Rune');
    expect(screen.getByTestId('rune-passive-w1'))
      .toHaveTextContent(/Advantage on Sleight of Hand and Deception checks/i);
  });

  it('offers Remove, which calls onClear', async () => {
    const { onClear } = setup({ characterData: cd({ 'Cloud Rune': 'w1' }) });
    const btn = screen.getByTestId('rune-assign-w1-cloud');
    expect(btn).toHaveTextContent('Remove');
    await userEvent.click(btn);
    expect(onClear).toHaveBeenCalledWith('Cloud Rune');
  });

  // The single most misleading thing this control could do is look identical whether or not
  // the rune is doing anything, so an unequipped bearer says so in place of the benefit.
  it('reports itself INACTIVE when the bearing item is not equipped', () => {
    render(
      <RuneCarvingControl
        entry={bow}
        characterData={cd({ 'Fire Rune': 'w2' })}
        level={7}
        onAssign={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByTestId('rune-passive-w2')).toHaveTextContent(/Inactive — equip Longbow/i);
    expect(screen.getByTestId('rune-passive-w2')).not.toHaveTextContent(/add your proficiency bonus/i);
  });
});

describe('read-only and empty states', () => {
  it('renders nothing at all when there is no rune and nothing can be carved', () => {
    const { container } = render(
      <RuneCarvingControl entry={axe} characterData={cd({}, [])} level={7} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a carved rune but no buttons in read-only view', () => {
    render(
      <RuneCarvingControl entry={axe} characterData={cd({ 'Cloud Rune': 'w1' })} level={7} readOnly />,
    );
    expect(screen.getByTestId('rune-badge-w1')).toBeInTheDocument();
    expect(screen.queryByTestId('rune-assign-w1-cloud')).not.toBeInTheDocument();
  });

  it('renders nothing in read-only view when no rune is carved', () => {
    const { container } = render(
      <RuneCarvingControl entry={axe} characterData={cd()} level={7} readOnly />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
