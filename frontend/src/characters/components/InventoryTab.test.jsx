import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InventoryTab from './InventoryTab';

vi.mock('../../encyclopedia/itemService', () => ({
  default: { getItems: vi.fn() },
}));

import itemService from '../../encyclopedia/itemService';

const chainMail = { uid: 'arm1', category: 'armor', name: 'Chain Mail', armor_type: 'Heavy', armor_class: 16, equipped: true, quantity: 1 };
const leather = { uid: 'arm2', category: 'armor', name: 'Leather', armor_type: 'Light', armor_class: 11, equipped: false, quantity: 1 };
const longsword = { uid: 'w1', category: 'weapons', name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing', equipped: true, quantity: 1 };

function renderTab(props = {}) {
  return render(
    <InventoryTab
      inventory={props.inventory ?? []}
      scores={props.scores ?? { strength: 16, dexterity: 10, constitution: 14 }}
      level={props.level ?? 1}
      charClass={props.charClass ?? 'Fighter'}
      subclass={props.subclass}
      race={props.race ?? 'Human'}
      campaignId="1"
      characterData={props.characterData ?? {}}
      readOnly={props.readOnly ?? false}
      onChange={props.onChange ?? vi.fn()}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  itemService.getItems.mockResolvedValue([
    { id: 7, name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', damage_type: 'Piercing', owner_type: 'system' },
  ]);
});

describe('InventoryTab', () => {
  it('renders all six category sub-tabs', () => {
    renderTab();
    ['weapons', 'armor', 'adventuring-gear', 'potions', 'magic-items', 'food-drink'].forEach((id) =>
      expect(screen.getByTestId(`inv-category-${id}`)).toBeInTheDocument()
    );
  });

  it('renders a Tools sub-tab', () => {
    renderTab();
    expect(screen.getByTestId('inv-category-tools')).toBeInTheDocument();
  });

  it('shows weapon proficiencies on the Weapons tab', () => {
    renderTab({ charClass: 'Fighter' });
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent(/martial weapons/i);
  });

  it('shows armor proficiencies on the Armor tab', () => {
    renderTab({ charClass: 'Fighter' });
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent(/all armor/i);
  });

  it('shows tool proficiencies and owned tools on the Tools tab; gear excludes tools', () => {
    const masonsTools = { uid: 't1', category: 'adventuring-gear', name: "Mason's tools", quantity: 1 };
    const backpack = { uid: 'g1', category: 'adventuring-gear', name: 'Backpack', item_category: 'Gear', quantity: 1 };
    renderTab({
      inventory: [masonsTools, backpack],
      charClass: 'Rogue',
      characterData: { background_tool_choice: "Mason's tools" },
    });
    fireEvent.click(screen.getByTestId('inv-category-tools'));
    // tool proficiency banner shows the class text + chosen tool grant
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent(/thieves/i);
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent("Mason's tools");
    // the tool item row shows in the Tools tab, the backpack does not
    expect(screen.getByTestId('inv-row-t1')).toBeInTheDocument();
    expect(screen.queryByTestId('inv-row-g1')).not.toBeInTheDocument();
    // the Gear tab shows the backpack, not the tool
    fireEvent.click(screen.getByTestId('inv-category-adventuring-gear'));
    expect(screen.getByTestId('inv-row-g1')).toBeInTheDocument();
    expect(screen.queryByTestId('inv-row-t1')).not.toBeInTheDocument();
  });

  it('computes AC from equipped armor', () => {
    renderTab({ inventory: [chainMail], scores: { dexterity: 16 } });
    expect(screen.getByTestId('inventory-ac')).toHaveTextContent('16'); // heavy, no DEX
  });

  it('shows attacks for equipped weapons with proficiency in to-hit', () => {
    renderTab({ inventory: [longsword], scores: { strength: 16 }, level: 1, charClass: 'Fighter' });
    const atk = screen.getByTestId('attack-w1');
    expect(atk).toHaveTextContent('Longsword');
    expect(atk).toHaveTextContent('+5'); // +3 STR + 2 PB
    expect(atk).toHaveTextContent('1d8 + 3 Slashing');
  });

  it('shows an empty state for a category with no items', () => {
    renderTab({ inventory: [] });
    expect(screen.getByText('No weapons yet.')).toBeInTheDocument();
  });

  it('opens the picker and adds the chosen item', async () => {
    const onChange = vi.fn();
    renderTab({ onChange });
    fireEvent.click(screen.getByTestId('inv-add-btn'));
    await waitFor(() => expect(screen.getByTestId('item-picker-option-7')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('item-picker-option-7'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        inventory: expect.arrayContaining([expect.objectContaining({ name: 'Dagger', category: 'weapons' })]),
      })
    ));
  });

  it('equipping armor patches both inventory and armor_class', () => {
    const onChange = vi.fn();
    renderTab({ inventory: [leather], scores: { dexterity: 16 }, onChange });
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    fireEvent.click(screen.getByTestId('equip-btn-arm2'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      armor_class: 14, // 11 leather + 3 DEX
      inventory: expect.arrayContaining([expect.objectContaining({ uid: 'arm2', equipped: true })]),
    }));
  });

  it('removing an item calls onChange without it', () => {
    const onChange = vi.fn();
    renderTab({ inventory: [longsword], onChange });
    fireEvent.click(screen.getByTestId('remove-item-w1'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ inventory: [] }));
  });

  it('quantity stepper increments', () => {
    const onChange = vi.fn();
    const torch = { uid: 'g1', category: 'adventuring-gear', name: 'Torch', quantity: 1 };
    renderTab({ inventory: [torch], onChange });
    fireEvent.click(screen.getByTestId('inv-category-adventuring-gear'));
    const row = screen.getByTestId('inv-row-g1');
    fireEvent.click(row.querySelector('[aria-label="Increase quantity"]'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: [expect.objectContaining({ uid: 'g1', quantity: 2 })],
    }));
  });

  it('flags an equipped weapon the character is not proficient with', () => {
    // Wizard is not proficient with a Martial Longsword
    renderTab({ inventory: [longsword], charClass: 'Wizard', scores: { strength: 16 } });
    expect(screen.getByTestId('attack-w1')).toHaveTextContent('not proficient');
  });

  it('hides edit controls when readOnly', () => {
    renderTab({ inventory: [longsword], readOnly: true });
    expect(screen.queryByTestId('inv-add-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('equip-btn-w1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('remove-item-w1')).not.toBeInTheDocument();
  });

  it('enforces the 3-item attunement cap on the button state', () => {
    const onChange = vi.fn();
    const magic = [1, 2, 3, 4].map((n) => ({ uid: `m${n}`, category: 'magic-items', name: `Item ${n}`, attuned: n <= 3, quantity: 1 }));
    renderTab({ inventory: magic, onChange });
    fireEvent.click(screen.getByTestId('inv-category-magic-items'));
    expect(screen.getByTestId('attune-btn-m4')).toBeDisabled(); // 3 already attuned
  });
});
