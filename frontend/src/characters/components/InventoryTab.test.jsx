import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InventoryTab from './InventoryTab';

vi.mock('../../encyclopedia/itemService', () => ({
  default: { getItems: vi.fn() },
}));

import itemService from '../../encyclopedia/itemService';

const chainMail = { uid: 'arm1', category: 'armor', name: 'Chain Mail', armor_type: 'Heavy', armor_class: 16, equipped: true, quantity: 1 };
const leather = { uid: 'arm2', category: 'armor', name: 'Leather', armor_type: 'Light', armor_class: 11, equipped: false, quantity: 1 };
const longsword = { uid: 'w1', category: 'weapons', name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing', equipped: true, quantity: 1 };
const greatsword = { uid: 'gs1', category: 'weapons', name: 'Greatsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '2d6', damage_type: 'Slashing', properties: '["Two-Handed", "Heavy"]', equipped: true, quantity: 1 };

function renderTab(props = {}) {
  return render(
    <MemoryRouter>
    <InventoryTab
      inventory={props.inventory ?? []}
      scores={props.scores ?? { strength: 16, dexterity: 10, constitution: 14 }}
      level={props.level ?? 1}
      charClass={props.charClass ?? 'Fighter'}
      subclass={props.subclass}
      race={props.race ?? 'Human'}
      campaignId="1"
      characterData={props.characterData ?? {}}
      edition={props.edition ?? '5e'}
      readOnly={props.readOnly ?? false}
      onChange={props.onChange ?? vi.fn()}
    />
    </MemoryRouter>
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

  it('shows feat-granted weapon proficiencies (Weapon Master) on the Weapons tab', () => {
    renderTab({ charClass: 'Wizard', characterData: { feat_weapon_proficiencies: ['Longbow', 'Rapier'] } });
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent('Longbow');
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent('Rapier');
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

  it('links the AC summary to the armor-class mechanics page', () => {
    renderTab();
    expect(screen.getByTestId('armor-class-learn-more')).toHaveAttribute(
      'href',
      '/campaigns/1/encyclopedia/mechanics/armor-class'
    );
  });

  it('shows attacks for equipped weapons with proficiency in to-hit', () => {
    renderTab({ inventory: [longsword], scores: { strength: 16 }, level: 1, charClass: 'Fighter' });
    const atk = screen.getByTestId('attack-w1');
    expect(atk).toHaveTextContent('Longsword');
    expect(atk).toHaveTextContent('+5'); // +3 STR + 2 PB
    expect(atk).toHaveTextContent('1d8 + 3 Slashing');
  });

  it('5e: warns a Small creature about an equipped Heavy weapon (row + attack)', () => {
    renderTab({ inventory: [greatsword], race: 'Halfling', edition: '5e', charClass: 'Fighter' });
    expect(screen.getByTestId('attack-gs1')).toHaveTextContent('disadvantage');
    expect(screen.getByTestId('attack-warning-gs1')).toHaveTextContent(/Small creatures/i);
    expect(screen.getByTestId('inv-warning-gs1')).toHaveTextContent(/Small creatures/i);
  });

  it('5e: does not warn a Medium creature about a Heavy weapon', () => {
    renderTab({ inventory: [greatsword], race: 'Human', edition: '5e', charClass: 'Fighter' });
    expect(screen.queryByTestId('attack-warning-gs1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('inv-warning-gs1')).not.toBeInTheDocument();
  });

  it('2024: warns about a Heavy weapon when Strength < 13, regardless of size', () => {
    renderTab({ inventory: [greatsword], race: 'Human', edition: '5.5e', scores: { strength: 10 }, charClass: 'Fighter' });
    expect(screen.getByTestId('attack-warning-gs1')).toHaveTextContent(/Strength 13/i);
  });

  it('5e: warns about an UNEQUIPPED Heavy weapon on its row (not just equipped)', () => {
    renderTab({ inventory: [{ ...greatsword, equipped: false }], race: 'Halfling', edition: '5e', charClass: 'Fighter' });
    expect(screen.getByTestId('inv-warning-gs1')).toHaveTextContent(/Small creatures/i);
  });

  it('renders weapon property badges (Heavy/Two-handed) on a weapon row', () => {
    renderTab({ inventory: [greatsword], race: 'Human', charClass: 'Fighter' });
    const row = screen.getByTestId('inv-row-gs1');
    expect(row).toHaveTextContent('Heavy');
    expect(row).toHaveTextContent('Two-handed');
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

  it('does not show a quantity stepper for weapons (individual items)', () => {
    renderTab({ inventory: [longsword] }); // weapons is the default tab
    const row = screen.getByTestId('inv-row-w1');
    expect(screen.queryByTestId('qty-w1')).not.toBeInTheDocument();
    expect(row.querySelector('[aria-label="Increase quantity"]')).toBeNull();
  });

  it('splits a stacked weapon into individual, separately-equippable rows', () => {
    const handaxes = { uid: 'h1', category: 'weapons', name: 'Handaxe', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d6', quantity: 2 };
    renderTab({ inventory: [handaxes] });
    expect(screen.getByTestId('inv-row-h1')).toBeInTheDocument();
    expect(screen.getByTestId('inv-row-h1-2')).toBeInTheDocument();
    // each has its own Equip button
    expect(screen.getByTestId('equip-btn-h1')).toBeInTheDocument();
    expect(screen.getByTestId('equip-btn-h1-2')).toBeInTheDocument();
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

  // ─── Ammunition ──────────────────────────────────────────────────────────────
  const longbow = { uid: 'lb1', category: 'weapons', name: 'Longbow', weapon_category: 'Martial', weapon_type: 'ranged', damage: '1d8', damage_type: 'Piercing', properties: '["Ammunition", "Heavy", "Two-handed"]', quantity: 1 };
  const arrows = { uid: 'am1', category: 'adventuring-gear', name: 'Arrows', item_category: 'Ammunition', quantity: 20, description: 'Ammunition for a bow.' };
  const bolts = { uid: 'am2', category: 'adventuring-gear', name: 'Crossbow Bolts', item_category: 'Ammunition', quantity: 20 };

  it('shows ammunition under the Weapons tab (not the Gear tab)', () => {
    renderTab({ inventory: [arrows] });
    // Weapons tab is the default — Ammunition section + row present
    expect(screen.getByTestId('ammunition-section')).toBeInTheDocument();
    expect(screen.getByTestId('ammo-row-am1')).toHaveTextContent('Arrows');
    // Gear tab excludes it
    fireEvent.click(screen.getByTestId('inv-category-adventuring-gear'));
    expect(screen.queryByTestId('inv-row-am1')).not.toBeInTheDocument();
  });

  it('shows an ammo count + Use button under a ranged weapon with the Ammunition property', () => {
    renderTab({ inventory: [longbow, arrows] });
    expect(screen.getByTestId('weapon-ammo-lb1')).toBeInTheDocument();
    expect(screen.getByTestId('ammo-count-lb1')).toHaveTextContent('Arrows');
    expect(screen.getByTestId('ammo-count-lb1')).toHaveTextContent('20');
    expect(screen.getByTestId('use-ammo-lb1')).toBeInTheDocument();
  });

  it('does not show an ammo control for a melee weapon', () => {
    renderTab({ inventory: [longsword] });
    expect(screen.queryByTestId('weapon-ammo-w1')).not.toBeInTheDocument();
  });

  it('Use Ammunition decrements the matched stack via onChange', () => {
    const onChange = vi.fn();
    renderTab({ inventory: [longbow, arrows], onChange });
    fireEvent.click(screen.getByTestId('use-ammo-lb1'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: expect.arrayContaining([expect.objectContaining({ uid: 'am1', quantity: 19 })]),
    }));
  });

  it('disables Use Ammunition at 0 and notes no matching ammunition', () => {
    renderTab({ inventory: [longbow, { ...arrows, quantity: 0 }] });
    expect(screen.getByTestId('use-ammo-lb1')).toBeDisabled();
    // a weapon with no matching ammo stack at all
    renderTab({ inventory: [{ ...longbow, uid: 'lb2' }, bolts] });
    expect(screen.getByTestId('weapon-ammo-lb2')).toHaveTextContent(/No matching ammunition/i);
  });

  it('offers a chooser when multiple matching stacks exist and selecting persists ammo_uid', () => {
    const onChange = vi.fn();
    const silvered = { uid: 'am3', category: 'adventuring-gear', name: 'Silvered Arrows', item_category: 'Ammunition', quantity: 10 };
    renderTab({ inventory: [longbow, arrows, silvered], onChange });
    const select = screen.getByTestId('ammo-select-lb1');
    fireEvent.change(select, { target: { value: 'am3' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: expect.arrayContaining([expect.objectContaining({ uid: 'lb1', ammo_uid: 'am3' })]),
    }));
  });

  it('Add Ammunition opens the picker filtered to ammunition and defaults to the bundle quantity', async () => {
    const onChange = vi.fn();
    itemService.getItems.mockResolvedValue([
      { id: 50, name: 'Arrows', category: 'Ammunition', quantity: '20', owner_type: 'system' },
      { id: 51, name: 'Backpack', category: 'Standard Gear', owner_type: 'system' },
    ]);
    renderTab({ onChange });
    fireEvent.click(screen.getByTestId('add-ammo-btn'));
    await waitFor(() => expect(screen.getByTestId('item-picker-option-50')).toBeInTheDocument());
    // non-ammo gear filtered out of the ammunition picker
    expect(screen.queryByTestId('item-picker-option-51')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('item-picker-option-50'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: expect.arrayContaining([expect.objectContaining({ name: 'Arrows', category: 'adventuring-gear', quantity: 20 })]),
    })));
  });

  it('hides ammo Use/Add controls when readOnly', () => {
    renderTab({ inventory: [longbow, arrows], readOnly: true });
    expect(screen.queryByTestId('use-ammo-lb1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-ammo-btn')).not.toBeInTheDocument();
    // count is still shown read-only
    expect(screen.getByTestId('ammo-count-lb1')).toHaveTextContent('20');
  });
});
