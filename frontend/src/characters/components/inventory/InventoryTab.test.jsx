import { render, screen, waitFor, fireEvent, within, cleanup } from '@testing-library/react';
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
      isGm={props.isGm ?? false}
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

  it('warns on an equipped armor row when the Strength requirement is unmet', () => {
    renderTab({
      inventory: [{ ...chainMail, strength_requirement: 13 }],
      scores: { strength: 11, dexterity: 10 },
    });
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    expect(screen.getByTestId('inv-str-warning-arm1'))
      .toHaveTextContent(/Requires Strength 13 \(you have 11\).*speed reduced by 10 ft while worn/i);
  });

  it('warns before equipping too — unequipped armor with unmet STR shows the future penalty', () => {
    renderTab({
      inventory: [{ ...chainMail, equipped: false, strength_requirement: 13 }],
      scores: { strength: 11, dexterity: 10 },
    });
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    expect(screen.getByTestId('inv-str-warning-arm1'))
      .toHaveTextContent(/wearing it will reduce your speed by 10 ft/i);
  });

  it('shows the non-proficiency banner when wearing armor without proficiency', () => {
    renderTab({ inventory: [chainMail], charClass: 'Wizard' });
    const banner = screen.getByTestId('armor-nonprof-warning');
    expect(banner).toHaveTextContent(/Chain Mail without proficiency/i);
    expect(banner).toHaveTextContent(/can't cast spells/i);
  });

  it('no non-proficiency banner for a proficient class or when a feat grants the armor', () => {
    renderTab({ inventory: [chainMail], charClass: 'Fighter' });
    expect(screen.queryByTestId('armor-nonprof-warning')).not.toBeInTheDocument();
    cleanup();
    renderTab({
      inventory: [chainMail],
      charClass: 'Wizard',
      characterData: { feats: [{ name: 'Heavily Armored', effects: [{ kind: 'proficiency', prof_type: 'armor', items: ['Heavy'] }] }] },
    });
    expect(screen.queryByTestId('armor-nonprof-warning')).not.toBeInTheDocument();
  });

  it('weapon attacks show disadvantage while wearing non-proficient armor', () => {
    renderTab({ inventory: [chainMail, longsword], charClass: 'Wizard' });
    expect(screen.getByTestId('attack-w1')).toHaveTextContent('(disadvantage)');
    expect(screen.getByTestId('attack-warning-w1')).toHaveTextContent(/Chain Mail without proficiency/i);
  });

  // The compendium has carried `stealth_disadvantage` all along; nothing on the sheet read it.
  describe('armor Stealth disadvantage', () => {
    const stealthMail = { ...chainMail, stealth_disadvantage: true };
    const halfPlate = {
      uid: 'hp1', category: 'armor', name: 'Half Plate', armor_type: 'Medium',
      armor_class: 15, stealth_disadvantage: true, equipped: true, quantity: 1,
    };

    it('warns on the worn armor row', () => {
      renderTab({ inventory: [stealthMail] });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.getByTestId('inv-stealth-warning-arm1'))
        .toHaveTextContent(/Disadvantage on Dexterity \(Stealth\) checks while worn/i);
    });

    it('warns before equipping too', () => {
      renderTab({ inventory: [{ ...stealthMail, equipped: false }] });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.getByTestId('inv-stealth-warning-arm1'))
        .toHaveTextContent(/Wearing it will impose disadvantage/i);
    });

    it('says the feat cancels it rather than going silent (medium armor only)', () => {
      const feats = { feats: [{ name: 'Medium Armor Master' }] };
      renderTab({ inventory: [halfPlate], characterData: feats });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.getByTestId('inv-stealth-warning-hp1'))
        .toHaveTextContent(/negated by Medium Armor Master/i);
      cleanup();
      // Heavy armor is untouched by the feat.
      renderTab({ inventory: [stealthMail], characterData: feats });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.getByTestId('inv-stealth-warning-arm1'))
        .toHaveTextContent(/Disadvantage on Dexterity \(Stealth\)/i);
    });

    it('shows nothing for armor without the flag', () => {
      renderTab({ inventory: [leather] });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.queryByTestId('inv-stealth-warning-arm2')).not.toBeInTheDocument();
    });

    // The link rides inside the note, so it can only appear when the character owns armor that
    // would impose the disadvantage — including when the feat cancels it.
    it('links to the armor mechanics page from the note, and only from there', () => {
      renderTab({ inventory: [stealthMail, leather] });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.getByTestId('inv-stealth-learn-more-arm1')).toHaveAttribute(
        'href', '/campaigns/1/encyclopedia/mechanics/armor-class');
      // Leather imposes nothing → no note and no link on its row.
      expect(screen.queryByTestId('inv-stealth-learn-more-arm2')).not.toBeInTheDocument();
    });

    it('still offers the link when a feat negates the disadvantage', () => {
      renderTab({ inventory: [halfPlate], characterData: { feats: [{ name: 'Medium Armor Master' }] } });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.getByTestId('inv-stealth-learn-more-hp1')).toBeInTheDocument();
    });

    it('shows no link at all when no owned armor imposes it', () => {
      renderTab({ inventory: [leather] });
      fireEvent.click(screen.getByTestId('inv-category-armor'));
      expect(screen.queryByTestId(/^inv-stealth-learn-more-/)).not.toBeInTheDocument();
    });
  });

  it('shows no Strength warning when the requirement is met or absent', () => {
    renderTab({
      inventory: [{ ...chainMail, strength_requirement: 13 }, leather],
      scores: { strength: 14, dexterity: 10 },
    });
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    expect(screen.queryByTestId('inv-str-warning-arm1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('inv-str-warning-arm2')).not.toBeInTheDocument();
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

  it('shows the Champion crit range on weapon rows', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Champion', level: 3 });
    expect(screen.getByTestId('crit-range-w1')).toHaveTextContent('Crit 19–20 (Improved Critical)');
  });

  it('upgrades the crit range to Superior Critical at L15', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Champion', level: 15 });
    expect(screen.getByTestId('crit-range-w1')).toHaveTextContent('Crit 18–20 (Superior Critical)');
  });

  it('shows no crit range for a non-Champion / low-level Champion', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Battle Master', level: 15 });
    expect(screen.queryByTestId('crit-range-w1')).not.toBeInTheDocument();
    cleanup();
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Champion', level: 2 });
    expect(screen.queryByTestId('crit-range-w1')).not.toBeInTheDocument();
  });

  it('shows the 2024 Champion Remarkable Athlete post-crit move note on weapon rows', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e' });
    fireEvent.click(screen.getByTestId('remarkable-move-w1'));
    expect(screen.getByTestId('remarkable-move-w1-text')).toHaveTextContent('half your Speed');
  });

  it('shows no Remarkable Athlete move note in 5e / for a non-Champion', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5e' });
    expect(screen.queryByTestId('remarkable-move-w1')).not.toBeInTheDocument();
    cleanup();
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Battle Master', level: 3, edition: '5.5e' });
    expect(screen.queryByTestId('remarkable-move-w1')).not.toBeInTheDocument();
  });

  // Warding Maneuver's prerequisite IS the equipment, so the item row is where it belongs.
  it('shows the Warding Maneuver note on a melee weapon and a shield for a L7 Cavalier', () => {
    const shield = { uid: 'sh1', category: 'armor', name: 'Shield', armor_type: 'Shield', armor_class: 2, equipped: true, quantity: 1 };
    renderTab({ inventory: [longsword, shield], charClass: 'Fighter', subclass: 'Cavalier', level: 7 });
    fireEvent.click(screen.getByTestId('warding-maneuver-w1'));
    expect(screen.getByTestId('warding-maneuver-w1-text')).toHaveTextContent(/roll a d8/i);
    // The shield lives under the Armor sub-tab.
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    fireEvent.click(screen.getByTestId('warding-maneuver-sh1'));
    expect(screen.getByTestId('warding-maneuver-sh1-text')).toHaveTextContent(/resistance/i);
  });

  it('shows no Warding Maneuver note below L7, or on a ranged weapon', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Cavalier', level: 6 });
    expect(screen.queryByTestId('warding-maneuver-w1')).not.toBeInTheDocument();
    cleanup();
    const bow = { uid: 'lb1', category: 'weapons', name: 'Longbow', weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing', quantity: 1 };
    renderTab({ inventory: [bow], charClass: 'Fighter', subclass: 'Cavalier', level: 7 });
    expect(screen.queryByTestId('warding-maneuver-lb1')).not.toBeInTheDocument();
  });

  it('shows the Eldritch Strike note on weapon rows for an Eldritch Knight at L10', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Eldritch Knight', level: 10 });
    fireEvent.click(screen.getByTestId('eldritch-strike-w1'));
    expect(screen.getByTestId('eldritch-strike-w1-text')).toHaveTextContent(/disadvantage on the next saving throw/i);
  });

  it('shows no Eldritch Strike note below L10 / for a non-EK subclass', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Eldritch Knight', level: 9 });
    expect(screen.queryByTestId('eldritch-strike-w1')).not.toBeInTheDocument();
    cleanup();
    renderTab({ inventory: [longsword], charClass: 'Fighter', subclass: 'Champion', level: 10 });
    expect(screen.queryByTestId('eldritch-strike-w1')).not.toBeInTheDocument();
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

  it('flags the within-5-ft ranged disadvantage on a ranged weapon + links to the spacing page', () => {
    renderTab({ inventory: [lightXbow], charClass: 'Fighter' });
    expect(screen.getByTestId('spacing-note-lx1')).toHaveTextContent(/disadvantage while an enemy is within 5 ft/i);
    expect(screen.getByTestId('spacing-learn-more-lx1')).toHaveAttribute(
      'href', '/campaigns/1/encyclopedia/mechanics/spacing');
  });

  it('Crossbow Expert turns the spacing note into "no disadvantage"', () => {
    renderTab({ inventory: [lightXbow], charClass: 'Fighter', characterData: { feats: [{ name: 'Crossbow Expert' }] } });
    expect(screen.getByTestId('spacing-note-lx1')).toHaveTextContent(/no disadvantage/i);
  });

  it('shows the spacing note on a thrown weapon too', () => {
    const handaxe = { uid: 'ha1', category: 'weapons', name: 'Handaxe', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d6', damage_type: 'Slashing', properties: '["Light", "Thrown"]', quantity: 1 };
    renderTab({ inventory: [handaxe], charClass: 'Fighter' });
    expect(screen.getByTestId('spacing-note-ha1')).toBeInTheDocument();
  });

  it('shows no spacing note on a melee-only weapon', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter' });
    expect(screen.queryByTestId('spacing-note-w1')).not.toBeInTheDocument();
  });

  it('shows a Savage Attacks note on a melee weapon for a Half-Orc', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', characterData: { race_traits: ['Savage Attacks', 'Relentless Endurance'] } });
    // Collapsed to the name; the rules text arrives on click.
    expect(screen.getByTestId('savage-attacks-w1')).toHaveTextContent(/Savage Attacks/i);
    expect(screen.queryByTestId('savage-attacks-w1-text')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('savage-attacks-w1'));
    expect(screen.getByTestId('savage-attacks-w1-text')).toHaveTextContent(/one extra time/i);
  });

  it('no Savage Attacks note on a ranged weapon even for a Half-Orc', () => {
    renderTab({ inventory: [lightXbow], charClass: 'Fighter', characterData: { race_traits: ['Savage Attacks'] } });
    expect(screen.queryByTestId('savage-attacks-lx1')).not.toBeInTheDocument();
  });

  it('no Savage Attacks note without the trait', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', characterData: {} });
    expect(screen.queryByTestId('savage-attacks-w1')).not.toBeInTheDocument();
  });

  it('shows a Great Weapon Master bonus-attack note on a melee weapon row', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', characterData: { feats: [{ name: 'Great Weapon Master' }] } });
    fireEvent.click(screen.getByTestId('gwm-bonus-w1'));
    expect(screen.getByTestId('gwm-bonus-w1-text')).toHaveTextContent(/critical hit.*bonus action/i);
  });

  it('no Great Weapon Master bonus-attack note on a ranged weapon', () => {
    renderTab({ inventory: [lightXbow], charClass: 'Fighter', characterData: { feats: [{ name: 'Great Weapon Master' }] } });
    expect(screen.queryByTestId('gwm-bonus-lx1')).not.toBeInTheDocument();
  });

  it('no Great Weapon Master bonus-attack note without the feat', () => {
    renderTab({ inventory: [longsword], charClass: 'Fighter', characterData: {} });
    expect(screen.queryByTestId('gwm-bonus-w1')).not.toBeInTheDocument();
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
    renderTab({ onChange, isGm: true }); // stocking weapons is GM-only
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
    renderTab({ inventory: [longsword], onChange, isGm: true }); // removing a weapon is GM-only
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

  it("treats an equipped Improvised Weapon as proficient when Tavern Brawler grants it", () => {
    const improvised = { uid: 'iw1', category: 'weapons', name: 'Improvised Weapon', weapon_category: 'Improvised', weapon_type: 'Melee', damage: '1d4', damage_type: 'Bludgeoning', equipped: true, quantity: 1 };
    const tavernBrawler = { name: 'Tavern Brawler', effects: [{ kind: 'proficiency', prof_type: 'weapon', items: ['Improvised weapons'] }] };
    // Without the feat: a Wizard isn't proficient with an improvised weapon.
    renderTab({ inventory: [improvised], charClass: 'Wizard', scores: { strength: 16 } });
    expect(screen.getByTestId('attack-iw1')).toHaveTextContent('not proficient');
    cleanup();
    // With Tavern Brawler: proficient, and the grant shows in the weapon banner.
    renderTab({ inventory: [improvised], charClass: 'Wizard', scores: { strength: 16 }, characterData: { feats: [tavernBrawler] } });
    expect(screen.getByTestId('attack-iw1')).not.toHaveTextContent('not proficient');
    expect(screen.getByTestId('proficiency-banner')).toHaveTextContent(/improvised weapons/i);
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
    renderTab({ onChange, isGm: true }); // stocking ammunition is GM-only
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

// The party's armoury is the GM's to hand out: a player uses what they have but can't mint
// or destroy weapons and ammunition. A quiver goes DOWN only by firing.
describe('InventoryTab — GM-only stocking of weapons + ammunition', () => {
  const bow = { uid: 'lb1', category: 'weapons', name: 'Longbow', weapon_category: 'Martial', weapon_type: 'ranged', damage: '1d8', damage_type: 'Piercing', properties: '["Ammunition", "Heavy", "Two-handed"]', quantity: 1 };
  const quiver = { uid: 'am1', category: 'adventuring-gear', name: 'Arrows', item_category: 'Ammunition', quantity: 20 };
  const player = (props = {}) => renderTab({ inventory: [longsword, bow, quiver], ...props });
  const gm = (props = {}) => player({ isGm: true, ...props });

  it('a player gets no Add Weapon button; the GM does', () => {
    player();
    expect(screen.queryByTestId('inv-add-btn')).not.toBeInTheDocument();
    cleanup();
    gm();
    expect(screen.getByTestId('inv-add-btn')).toBeInTheDocument();
  });

  it('a player cannot delete a weapon; the GM can', () => {
    player();
    expect(screen.queryByTestId('remove-item-w1')).not.toBeInTheDocument();
    cleanup();
    gm();
    expect(screen.getByTestId('remove-item-w1')).toBeInTheDocument();
  });

  it('a player gets no Add Ammunition button and cannot delete a stack', () => {
    player();
    expect(screen.queryByTestId('add-ammo-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('remove-item-am1')).not.toBeInTheDocument();
    cleanup();
    gm();
    expect(screen.getByTestId('add-ammo-btn')).toBeInTheDocument();
    expect(screen.getByTestId('remove-item-am1')).toBeInTheDocument();
  });

  // The whole point: a player's ammo count moves only through the Use button.
  it('a player cannot hand-edit the ammo count, but CAN still spend a round', () => {
    const onChange = vi.fn();
    player({ onChange });
    expect(screen.queryByLabelText('Increase ammunition')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Decrease ammunition')).not.toBeInTheDocument();
    expect(screen.getByTestId('ammo-qty-am1')).toHaveTextContent('20'); // still readable
    fireEvent.click(screen.getByTestId('use-ammo-lb1'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      inventory: expect.arrayContaining([expect.objectContaining({ uid: 'am1', quantity: 19 })]),
    }));
  });

  it('the GM keeps the ammo steppers', () => {
    gm();
    expect(screen.getByLabelText('Increase ammunition')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrease ammunition')).toBeInTheDocument();
  });

  // Scoped deliberately: only weapons + ammunition are GM-stocked.
  it('leaves the other categories player-managed', () => {
    const torch = { uid: 'g1', category: 'adventuring-gear', name: 'Torch', quantity: 1 };
    renderTab({ inventory: [torch] });
    fireEvent.click(screen.getByTestId('inv-category-adventuring-gear'));
    expect(screen.getByTestId('inv-add-btn')).toBeInTheDocument();
    expect(screen.getByTestId('remove-item-g1')).toBeInTheDocument();
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
    expect(free).toHaveTextContent('4 bludgeoning'); // base unarmed = 1 + STR mod (+3), no feat
    expect(free).toHaveTextContent('somatic');
  });

  it('reflects the Tavern Brawler unarmed die (1d4 + STR) in the free-hand note', () => {
    const tavernBrawler = { name: 'Tavern Brawler', effects: [{ kind: 'attack_mod', target: 'unarmed', dice: '1d4' }] };
    renderTab({ inventory: [], scores: { strength: 16 }, characterData: { feats: [tavernBrawler] } });
    expect(screen.getByTestId('hand-free-main')).toHaveTextContent('1d4 +3 bludgeoning');
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

describe('InventoryTab — Weapon Bond (Eldritch Knight)', () => {
  const rapier = { uid: 'rp1', category: 'weapons', name: 'Rapier', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Piercing', properties: 'Finesse', equipped: false, quantity: 1 };

  it('shows the Bonded Weapons panel for an EK L3+ and bonding persists bonded_weapon_uids', () => {
    const onChange = vi.fn();
    renderTab({ subclass: 'Eldritch Knight', level: 3, inventory: [longsword, rapier], onChange });
    expect(screen.getByTestId('bond-panel')).toBeInTheDocument();
    expect(screen.getByTestId('bond-count')).toHaveTextContent('0/2');
    fireEvent.click(screen.getByTestId('bond-toggle-rp1'));
    expect(onChange).toHaveBeenCalledWith({ bonded_weapon_uids: ['rp1'] });
  });

  it('shows a Bonded badge on the bonded weapon row and the designated entry', () => {
    renderTab({
      subclass: 'Eldritch Knight', level: 3, inventory: [longsword, rapier],
      characterData: { bonded_weapon_uids: ['rp1'] },
    });
    expect(screen.getByTestId('bond-badge-rp1')).toHaveTextContent('Bonded');
    expect(screen.getByTestId('bond-designated-rp1')).toHaveTextContent('Rapier');
    expect(screen.queryByTestId('bond-badge-w1')).not.toBeInTheDocument();
  });

  it('does not show the panel for a Champion, below L3, or in readOnly chooser form', () => {
    renderTab({ subclass: 'Champion', level: 5, inventory: [longsword] });
    expect(screen.queryByTestId('bond-panel')).not.toBeInTheDocument();
    cleanup();
    renderTab({ subclass: 'Eldritch Knight', level: 2, inventory: [longsword] });
    expect(screen.queryByTestId('bond-panel')).not.toBeInTheDocument();
    cleanup();
    renderTab({
      subclass: 'Eldritch Knight', level: 3, inventory: [longsword], readOnly: true,
      characterData: { bonded_weapon_uids: ['w1'] },
    });
    expect(screen.getByTestId('bond-designated-w1')).toBeInTheDocument();
    expect(screen.queryByTestId('bond-toggle-w1')).not.toBeInTheDocument();
  });
});

describe('InventoryTab — Hex Warrior weapon (Hexblade Warlock)', () => {
  const rapier = { uid: 'rp1', category: 'weapons', name: 'Rapier', weapon_category: 'Martial', weapon_type: 'melee', damage: '1d8', damage_type: 'Piercing', properties: 'Finesse', equipped: true, hand: 'main', quantity: 1 };

  it('shows the Hex Warrior panel for a 5e Hexblade and designating persists hex_weapon_uid', () => {
    const onChange = vi.fn();
    renderTab({ charClass: 'Warlock', subclass: 'The Hexblade', inventory: [rapier], onChange });
    expect(screen.getByTestId('hex-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('hex-toggle-rp1'));
    expect(onChange).toHaveBeenCalledWith({ hex_weapon_uid: 'rp1' });
  });

  it('excludes Two-Handed weapons with a reason and hides the panel for other patrons', () => {
    renderTab({ charClass: 'Warlock', subclass: 'The Hexblade', inventory: [greatsword] });
    expect(screen.getByTestId('hex-ineligible-gs1')).toHaveTextContent(/two-handed/i);
    expect(screen.queryByTestId('hex-toggle-gs1')).not.toBeInTheDocument();
    cleanup();
    renderTab({ charClass: 'Warlock', subclass: 'The Fiend', inventory: [rapier] });
    expect(screen.queryByTestId('hex-panel')).not.toBeInTheDocument();
  });

  it('the hex weapon attacks with CHA when it beats STR/DEX, with a Hex Warrior note + badge', () => {
    renderTab({
      charClass: 'Warlock', subclass: 'The Hexblade', level: 1,
      scores: { strength: 10, dexterity: 12, charisma: 18 },
      inventory: [rapier],
      characterData: { hex_weapon_uid: 'rp1' },
    });
    expect(screen.getByTestId('hex-badge-rp1')).toHaveTextContent('Hex Weapon');
    // CHA +4 + prof +2 = +6 (finesse DEX would be +1+2 = +3)
    expect(screen.getByTestId('attack-rp1')).toHaveTextContent('+6 · 1d8 + 4 Piercing');
    expect(screen.getByTestId('attack-hex-rp1')).toHaveTextContent(/Hex Warrior/);
  });

  // Whether an attack overcomes resistance to nonmagical damage — same resolver as the Action
  // Economy tab, so the two tabs can't disagree.
  describe('magical attack tag', () => {
    const longbow = {
      uid: 'lb1', category: 'weapons', name: 'Longbow', weapon_category: 'Martial',
      weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing', equipped: true, quantity: 1,
    };
    const archer = (props = {}) => renderTab({
      charClass: 'Fighter', subclass: 'Arcane Archer', level: 7,
      scores: { strength: 10, dexterity: 16 },
      inventory: [longbow, longsword],
      ...props,
    });

    it('tags the bow with its source and leaves the longsword untagged', () => {
      archer();
      expect(screen.getByTestId('attack-magical-lb1')).toHaveTextContent('Magic · Magic Arrow');
      expect(screen.queryByTestId('attack-magical-w1')).not.toBeInTheDocument();
    });

    // Click, not hover — same control as the Action Economy tab (MagicAttackBadge).
    it('reveals the rule text on click and hides it again', () => {
      archer();
      const tag = screen.getByTestId('attack-magical-lb1');
      expect(screen.queryByTestId('attack-magical-lb1-note')).not.toBeInTheDocument();
      fireEvent.click(tag);
      expect(screen.getByTestId('attack-magical-lb1-note'))
        .toHaveTextContent(/overcoming resistance and immunity to nonmagical/i);
      fireEvent.click(tag);
      expect(screen.queryByTestId('attack-magical-lb1-note')).not.toBeInTheDocument();
    });

    // The mechanics link lives inside the tag, so it can only ever appear where the tag does —
    // the app never points a character at a rule it can't use.
    it('offers the mechanics page from the expanded note, and only then', () => {
      archer();
      expect(screen.queryByTestId('attack-magical-lb1-learn-more')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('attack-magical-lb1'));
      expect(screen.getByTestId('attack-magical-lb1-learn-more')).toHaveAttribute(
        'href',
        '/campaigns/1/encyclopedia/mechanics/magical-attacks'
      );
    });

    it('is absent below the feature level', () => {
      archer({ level: 6 });
      expect(screen.queryByTestId(/^attack-magical-/)).not.toBeInTheDocument();
    });

    it('is absent for a Champion holding the same longbow', () => {
      archer({ subclass: 'Champion' });
      expect(screen.queryByTestId(/^attack-magical-/)).not.toBeInTheDocument();
    });
  });
});

describe('Rune Carving on the item cards (Rune Knight)', () => {
  const runeKnight = (rune_items = {}, inventory = [longsword, chainMail]) => ({
    subclass: 'Rune Knight',
    runes: ['Cloud Rune', 'Fire Rune'],
    rune_items,
    inventory,
  });

  const renderRk = (props = {}) => renderTab({
    inventory: [longsword, chainMail],
    charClass: 'Fighter',
    subclass: 'Rune Knight',
    level: 7,
    characterData: runeKnight(),
    ...props,
  });

  it('offers a rune control on a weapon row', async () => {
    renderRk();
    expect(await screen.findByTestId('rune-control-w1')).toBeInTheDocument();
  });

  it('offers one on armor too — armor and shields can bear a rune', async () => {
    renderRk();
    // The armor row lives on the Armor sub-tab.
    fireEvent.click(screen.getByTestId('inv-category-armor'));
    expect(await screen.findByTestId('rune-control-arm1')).toBeInTheDocument();
  });

  it('shows NO rune control for a non-Rune-Knight Fighter', async () => {
    renderTab({
      inventory: [longsword],
      charClass: 'Fighter',
      subclass: 'Champion',
      level: 7,
      characterData: { subclass: 'Champion' },
    });
    // Anchor on the row itself — "Longsword" also appears in the hand-assignment <option>s.
    await screen.findByTestId('inv-row-w1');
    expect(screen.queryByTestId('rune-control-w1')).not.toBeInTheDocument();
  });

  it('persists a carve as a rune_items patch', async () => {
    const onChange = vi.fn();
    renderRk({ onChange });
    fireEvent.click(await screen.findByTestId('rune-assign-w1-cloud'));
    expect(onChange).toHaveBeenCalledWith({ rune_items: { 'Cloud Rune': 'w1' } });
  });

  it('shows the passive on an equipped bearer and flags an unequipped one', async () => {
    renderRk({ characterData: runeKnight({ 'Cloud Rune': 'w1' }) });
    expect(await screen.findByTestId('rune-passive-w1'))
      .toHaveTextContent(/Advantage on Sleight of Hand/i);

    cleanup();
    const sheathed = { ...longsword, equipped: false };
    renderRk({
      inventory: [sheathed],
      characterData: runeKnight({ 'Cloud Rune': 'w1' }, [sheathed]),
    });
    expect(await screen.findByTestId('rune-passive-w1')).toHaveTextContent(/Inactive/i);
  });

  // A rune left pointing at a deleted uid would read as carved forever while granting nothing,
  // and would block that rune from being carved anywhere else.
  it('clears a rune when its bearing item is deleted', async () => {
    const onChange = vi.fn();
    renderRk({ characterData: runeKnight({ 'Cloud Rune': 'w1' }), onChange, isGm: true });
    await screen.findByTestId('rune-control-w1');
    fireEvent.click(screen.getByTestId('remove-item-w1'));
    expect(onChange).toHaveBeenCalledWith({ rune_items: {} });
  });
});
