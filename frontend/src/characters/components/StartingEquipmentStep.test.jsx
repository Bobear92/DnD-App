import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StartingEquipmentStep from './StartingEquipmentStep';

vi.mock('../../encyclopedia/itemService', () => ({
  default: { getItems: vi.fn() },
}));

import itemService from '../../encyclopedia/itemService';

const WEAPONS = [
  { id: 1, name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing' },
  { id: 2, name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', damage_type: 'Piercing' },
];
const ARMOR = [{ id: 10, name: 'Chain Mail', armor_type: 'Heavy', armor_class: 16 }];
const GEAR = [
  { id: 20, name: "Dungeoneer's Pack", category: 'Equipment Pack', description: 'A backpack, a crowbar, a hammer, 10 pitons, 10 torches, a tinderbox, rations, and a waterskin.' },
  { id: 21, name: "Explorer's Pack", category: 'Equipment Pack', description: 'A backpack, a bedroll, a mess kit, a tinderbox, 10 torches, rations, and a waterskin.' },
];

beforeEach(() => {
  vi.clearAllMocks();
  itemService.getItems.mockImplementation((cat) =>
    Promise.resolve(cat === 'weapons' ? WEAPONS : cat === 'armor' ? ARMOR : GEAR)
  );
});

function renderStep(props = {}) {
  return render(
    <StartingEquipmentStep
      charClass={props.charClass ?? 'Fighter'}
      backgroundName={props.backgroundName ?? 'Soldier'}
      campaignId="1"
      mode={props.mode ?? 'equipment'}
      onResult={props.onResult ?? vi.fn()}
    />
  );
}

describe('StartingEquipmentStep', () => {
  it('renders the class choice options', async () => {
    renderStep();
    expect(await screen.findByTestId('equip-opt-f1-a')).toBeInTheDocument();
    expect(screen.getByTestId('equip-opt-f1-b')).toBeInTheDocument();
  });

  it('resolves default selections to inventory and reports via onResult', async () => {
    const onResult = vi.fn();
    renderStep({ onResult });
    await waitFor(() => {
      const last = onResult.mock.calls.at(-1)?.[0];
      expect(last?.inventory.some((e) => e.name === 'Chain Mail' && e.source_id === 10)).toBe(true);
    });
  });

  it('lets the player pick a martial weapon for a choose slot', async () => {
    const onResult = vi.fn();
    renderStep({ onResult });
    const pick = await screen.findByTestId('equip-pick-f2:a:0');
    fireEvent.change(pick, { target: { value: 'Longsword' } });
    await waitFor(() => {
      const last = onResult.mock.calls.at(-1)?.[0];
      expect(last.inventory.some((e) => e.name === 'Longsword')).toBe(true);
    });
  });

  it('switching to option b changes the resolved items', async () => {
    const onResult = vi.fn();
    renderStep({ onResult });
    await screen.findByTestId('equip-opt-f1-b');
    fireEvent.click(screen.getByTestId('equip-opt-f1-b')); // leather + longbow + arrows
    await waitFor(() => {
      const last = onResult.mock.calls.at(-1)?.[0];
      expect(last.inventory.some((e) => e.name === 'Leather')).toBe(true);
      expect(last.inventory.some((e) => e.name === 'Chain Mail')).toBe(false);
    });
  });

  it('shows pack contents on the pack options so they can be compared', async () => {
    renderStep();
    // Fighter group f4: (a) Dungeoneer's Pack, (b) Explorer's Pack — both list contents.
    await waitFor(() => expect(screen.getByTestId('equip-opt-contents-f4-a')).toBeInTheDocument());
    expect(screen.getByTestId('equip-opt-contents-f4-a')).toHaveTextContent('crowbar');
    expect(screen.getByTestId('equip-opt-contents-f4-b')).toHaveTextContent('bedroll');
  });

  it('shows the background items', async () => {
    renderStep({ backgroundName: 'Soldier' });
    expect(await screen.findByTestId('equip-background-items')).toHaveTextContent('Gaming Set');
  });

  it('hides the take-gold option unless the campaign allows it', async () => {
    renderStep({ mode: 'equipment' });
    await screen.findByTestId('equip-opt-f1-a');
    expect(screen.queryByTestId('equip-take-gold')).not.toBeInTheDocument();
  });

  it('take-gold reports class starting wealth and drops class equipment', async () => {
    const onResult = vi.fn();
    renderStep({ mode: 'equipment_or_gold', backgroundName: 'Soldier', onResult });
    fireEvent.click(await screen.findByTestId('equip-take-gold'));
    await waitFor(() => {
      const last = onResult.mock.calls.at(-1)?.[0];
      expect(last.bonusGold).toBe(125); // Fighter starting wealth
      expect(last.inventory.some((e) => e.name === 'Chain Mail')).toBe(false);
      // background items remain
      expect(last.inventory.some((e) => e.name === 'Gaming Set')).toBe(true);
    });
  });
});
