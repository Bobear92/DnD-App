import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import InventoryTab from '@/characters/components/inventory/InventoryTab';

vi.mock('@/encyclopedia/itemService', () => ({
  default: { getItems: vi.fn() },
}));

import itemService from '@/encyclopedia/itemService';

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

  it('links the Weapons tab to the drawing & stowing mechanics page', () => {
    renderTab();
    expect(screen.getByTestId('object-interaction-learn-more')).toHaveAttribute(
      'href', '/campaigns/1/encyclopedia/mechanics/object-interaction');
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

  const lightXbow = { uid: 'lx1', category: 'weapons', name: 'Crossbow, Light', weapon_category: 'Simple', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing', properties: '["Ammunition", "Loading", "Two-Handed"]', equipped: true, quantity: 1 };

  it('5e: notes the Loading one-attack cap on a crossbow without Crossbow Expert', () => {
    renderTab({ inventory: [lightXbow], race: 'Human', edition: '5e', charClass: 'Fighter' });
    expect(screen.getByTestId('inv-loading-lx1')).toHaveTextContent(/only one attack per action/i);
  });

  it('5e: Crossbow Expert turns the note into "Loading ignored"', () => {
    renderTab({ inventory: [lightXbow], race: 'Human', edition: '5e', charClass: 'Fighter', characterData: { feats: [{ name: 'Crossbow Expert' }] } });
    expect(screen.getByTestId('inv-loading-lx1')).toHaveTextContent(/ignored \(Crossbow Expert\)/i);
  });

  it('2024: no Loading note (the property was removed)', () => {
    renderTab({ inventory: [lightXbow], race: 'Human', edition: '5.5e', charClass: 'Fighter' });
    expect(screen.queryByTestId('inv-loading-lx1')).not.toBeInTheDocument();
  });

  it('puts the "How the Loading property works" link inside the loading weapon row', () => {
    renderTab({ inventory: [lightXbow], race: 'Human', edition: '5e', charClass: 'Fighter' });
    expect(screen.getByTestId('loading-learn-more-lx1')).toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/loading');
  });

  it('no Loading link on a non-loading weapon row', () => {
    renderTab({ inventory: [longsword], race: 'Human', edition: '5e', charClass: 'Fighter' });
    expect(screen.queryByTestId('loading-learn-more-w1')).not.toBeInTheDocument();
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

  it('splits a stacked weapon into individual, separately-holdable rows', () => {
    const handaxes = { uid: 'h1', category: 'weapons', name: 'Handaxe', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d6', quantity: 2 };
    renderTab({ inventory: [handaxes] });
    expect(screen.getByTestId('inv-row-h1')).toBeInTheDocument();
    expect(screen.getByTestId('inv-row-h1-2')).toBeInTheDocument();
    // weapons have no per-row equip button — they're held via the Hands panel
    expect(screen.queryByTestId('equip-btn-h1')).not.toBeInTheDocument();
    // both individual handaxes are offered as hand options
    const mainSelect = screen.getByTestId('hand-select-main');
    expect(within(mainSelect).getAllByRole('option', { name: 'Handaxe' })).toHaveLength(2);
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

describe('InventoryTab — Hands', () => {
  const shield = { uid: 'sh1', category: 'armor', name: 'Shield', armor_type: 'Shield', armor_class: 2, quantity: 1 };
  const dagger = { uid: 'd1', category: 'weapons', name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', properties: '["Light", "Finesse"]', quantity: 1 };

  it('renders main + off hand slots on the Weapons tab', () => {
    renderTab({ inventory: [] });
    expect(screen.getByTestId('hands-panel')).toBeInTheDocument();
    expect(screen.getByTestId('hand-slot-main')).toBeInTheDocument();
    expect(screen.getByTestId('hand-slot-off')).toBeInTheDocument();
  });

  it('shows the unarmed-strike / free-to-cast note for an empty hand', () => {
    renderTab({ inventory: [], scores: { strength: 16 } });
    const free = screen.getByTestId('hand-free-main');
    expect(free).toHaveTextContent('Unarmed Strike');
    expect(free).toHaveTextContent('somatic');
  });

  it('placing a weapon in the main hand persists hand + equipped', () => {
    const onChange = vi.fn();
    renderTab({ inventory: [{ ...dagger, quantity: 1 }], onChange });
    fireEvent.change(screen.getByTestId('hand-select-main'), { target: { value: 'd1' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: expect.arrayContaining([expect.objectContaining({ uid: 'd1', hand: 'main', equipped: true })]),
    }));
  });

  it('a two-handed weapon fills both hands and locks the off-hand slot', () => {
    // greatsword is migrated from equipped:true → hand 'both'
    renderTab({ inventory: [greatsword] });
    expect(screen.getByTestId('hand-locked-off')).toHaveTextContent('both hands');
    expect(screen.queryByTestId('hand-select-off')).not.toBeInTheDocument();
  });

  it('a held shield contributes +2 AC and appears in a hand slot', () => {
    renderTab({ inventory: [chainMail, { ...shield, equipped: true }] });
    // Chain Mail 16 + shield 2 = 18
    expect(screen.getByTestId('inventory-ac')).toHaveTextContent('18');
    // shield migrated into a hand → shown in the Hands panel (it's controlled there, not the Armor tab)
    expect(screen.getByTestId('hands-panel')).toHaveTextContent('Shield');
  });

  it('weapons show a hand badge when held', () => {
    renderTab({ inventory: [longsword] }); // equipped:true → migrated to main hand
    expect(screen.getByTestId('hand-badge-w1')).toHaveTextContent('Main hand');
  });

  it('read-only view shows held items without selects', () => {
    renderTab({ inventory: [longsword], readOnly: true });
    expect(screen.queryByTestId('hand-select-main')).not.toBeInTheDocument();
    expect(screen.getByTestId('hand-slot-main')).toHaveTextContent('Longsword');
  });

  // Real seeded format: just "Versatile" with no die — the two-handed die is derived from base damage.
  const versatileSword = { uid: 'vl1', category: 'weapons', name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', properties: '["Versatile"]', quantity: 1 };

  it('a one-handed versatile weapon offers a grip-two-handed button that fills both hands', () => {
    const onChange = vi.fn();
    renderTab({ inventory: [{ ...versatileSword, hand: 'main', equipped: true }], onChange });
    fireEvent.click(screen.getByTestId('hand-grip-main'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: expect.arrayContaining([expect.objectContaining({ uid: 'vl1', hand: 'both' })]),
    }));
  });

  it('a versatile weapon gripped two-handed shows the larger die and a revert button', () => {
    renderTab({ inventory: [{ ...versatileSword, hand: 'both', equipped: true }], scores: { strength: 10 } });
    expect(screen.getByTestId('hand-slot-main')).toHaveTextContent('1d10');
    expect(screen.getByTestId('hand-grip-main')).toHaveTextContent('Use one hand');
    // off hand is locked by the two-handed grip
    expect(screen.getByTestId('hand-locked-off')).toBeInTheDocument();
  });

  it('does not offer a grip button for a non-versatile weapon', () => {
    renderTab({ inventory: [longsword] }); // plain longsword fixture has no Versatile property
    expect(screen.queryByTestId('hand-grip-main')).not.toBeInTheDocument();
  });
});
