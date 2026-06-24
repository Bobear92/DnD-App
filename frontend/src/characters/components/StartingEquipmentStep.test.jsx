import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StartingEquipmentStep from './StartingEquipmentStep';

vi.mock('../../encyclopedia/itemService', () => ({
  default: { getItems: vi.fn() },
}));

import itemService from '../../encyclopedia/itemService';

const WEAPONS = [
  { id: 1, name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing', properties: '["Versatile"]', weight: 3, cost: '15 gp' },
  { id: 2, name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', damage_type: 'Piercing' },
  { id: 3, name: 'Greatsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '2d6', damage_type: 'Slashing', properties: '["Two-Handed", "Heavy"]', weight: 6, cost: '50 gp', description: 'A massive two-handed blade.' },
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
      size={props.size ?? 'Medium'}
      edition={props.edition ?? '5e'}
      scores={props.scores ?? { strength: 15, dexterity: 14 }}
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
    fireEvent.click(await screen.findByTestId('equip-weapon-f2:a:0-Longsword'));
    await waitFor(() => {
      const last = onResult.mock.calls.at(-1)?.[0];
      expect(last.inventory.some((e) => e.name === 'Longsword')).toBe(true);
    });
  });

  it('shows full weapon info on each martial weapon card', async () => {
    renderStep();
    const greatsword = await screen.findByTestId('equip-weapon-f2:a:0-Greatsword');
    expect(greatsword).toHaveTextContent('Greatsword');
    expect(greatsword).toHaveTextContent('2d6 Slashing');
    expect(greatsword).toHaveTextContent('Martial');
    expect(greatsword).toHaveTextContent('Two-handed');
    expect(greatsword).toHaveTextContent('Heavy');
    expect(greatsword).toHaveTextContent('6 lb');
    expect(greatsword).toHaveTextContent('50 gp');
    expect(greatsword).toHaveTextContent('A massive two-handed blade.');
    // Versatile longsword shows its handedness too
    const longsword = screen.getByTestId('equip-weapon-f2:a:0-Longsword');
    expect(longsword).toHaveTextContent('Versatile');
  });

  it('explains a weapon attribute when its badge is clicked', async () => {
    renderStep();
    const card = await screen.findByTestId('equip-weapon-f2:a:0-Greatsword');
    fireEvent.click(within(card).getByTestId('weapon-prop-Heavy'));
    expect(within(card).getByTestId('weapon-prop-description')).toHaveTextContent(/disadvantage/i);
  });

  it('5e: warns a Small creature on a Heavy weapon card', async () => {
    renderStep({ size: 'Small', edition: '5e' });
    await screen.findByTestId('equip-weapon-f2:a:0-Greatsword');
    expect(screen.getByTestId('equip-weapon-warning-f2:a:0-Greatsword')).toHaveTextContent(/Small creatures/i);
    // Non-heavy Longsword gets no warning
    expect(screen.queryByTestId('equip-weapon-warning-f2:a:0-Longsword')).not.toBeInTheDocument();
  });

  it('5e: no Heavy warning for a Medium creature', async () => {
    renderStep({ size: 'Medium', edition: '5e' });
    await screen.findByTestId('equip-weapon-f2:a:0-Greatsword');
    expect(screen.queryByTestId('equip-weapon-warning-f2:a:0-Greatsword')).not.toBeInTheDocument();
  });

  it('offers weapon facet filters drawn from the choosable weapons', async () => {
    renderStep();
    expect(await screen.findByTestId('weapon-filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-filter-Martial')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-filter-Two-handed')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-filter-Heavy')).toBeInTheDocument();
    expect(screen.getByTestId('weapon-filter-Versatile')).toBeInTheDocument();
  });

  it('filtering by Two-handed hides non-matching weapon cards', async () => {
    renderStep();
    await screen.findByTestId('equip-weapon-f2:a:0-Longsword');
    fireEvent.click(screen.getByTestId('weapon-filter-Two-handed'));
    expect(screen.getByTestId('equip-weapon-f2:a:0-Greatsword')).toBeInTheDocument();
    expect(screen.queryByTestId('equip-weapon-f2:a:0-Longsword')).not.toBeInTheDocument();
  });

  it('explains a filter when its ⓘ button is clicked', async () => {
    renderStep();
    fireEvent.click(await screen.findByTestId('weapon-filter-info-Two-handed'));
    expect(screen.getByTestId('weapon-filter-description')).toHaveTextContent(/both hands/i);
  });

  it('clears active filters via the Clear button', async () => {
    renderStep();
    fireEvent.click(await screen.findByTestId('weapon-filter-Two-handed'));
    expect(screen.queryByTestId('equip-weapon-f2:a:0-Longsword')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('weapon-filter-clear'));
    expect(screen.getByTestId('equip-weapon-f2:a:0-Longsword')).toBeInTheDocument();
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
