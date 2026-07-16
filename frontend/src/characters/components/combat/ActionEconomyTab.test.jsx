import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActionEconomyTab from '@/characters/components/combat/ActionEconomyTab';

vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: {
    getSpells: vi.fn(() => Promise.resolve([
      { name: 'Healing Word', casting_time: '1 bonus action', level: 1, school: 'Evocation' },
      { name: 'Shield', casting_time: '1 reaction', level: 1, school: 'Abjuration' },
      { name: 'Fireball', casting_time: '1 action', level: 3, school: 'Evocation' },
    ])),
  },
}));

import encyclopediaService from '@/encyclopedia/encyclopediaService';

const longswordEntry = {
  uid: 'w1', category: 'weapons', equipped: true, name: 'Longsword',
  weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing', properties: '["Versatile"]',
};
const greatswordEntry = {
  uid: 'gs1', category: 'weapons', equipped: true, name: 'Greatsword',
  weapon_category: 'Martial', weapon_type: 'Melee', damage: '2d6', damage_type: 'Slashing', properties: '["Two-Handed", "Heavy"]',
};

function renderTab(props = {}) {
  return render(
    <MemoryRouter>
      <ActionEconomyTab
        charClass="Fighter"
        level={5}
        edition="5e"
        characterData={{}}
        inventory={[longswordEntry]}
        scores={{ strength: 16, dexterity: 12 }}
        campaignId={1}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('ActionEconomyTab', () => {
  beforeEach(() => {
    encyclopediaService.getSpells.mockClear();
  });

  it('links to the action-economy mechanics page', () => {
    renderTab();
    expect(screen.getByTestId('action-economy-learn-more')).toHaveAttribute(
      'href',
      '/campaigns/1/encyclopedia/mechanics/action-economy'
    );
  });

  it('renders the five sub-tabs, with No Action first', () => {
    renderTab();
    expect(screen.getByTestId('ae-subtab-no_action')).toBeInTheDocument();
    expect(screen.getByTestId('ae-subtab-action')).toBeInTheDocument();
    expect(screen.getByTestId('ae-subtab-bonus')).toBeInTheDocument();
    expect(screen.getByTestId('ae-subtab-action+bonus')).toBeInTheDocument();
    expect(screen.getByTestId('ae-subtab-reaction')).toBeInTheDocument();
    // No Action is the first tab in the strip
    const tabs = screen.getAllByTestId(/^ae-subtab-/);
    expect(tabs[0]).toHaveAttribute('data-testid', 'ae-subtab-no_action');
  });

  it('shows Action Surge under the No Action tab (not under Actions) at level 2', () => {
    renderTab({ level: 2 });
    // Not on the default Actions tab
    expect(screen.queryByText('Action Surge')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ae-subtab-no_action'));
    expect(screen.getByText('Action Surge')).toBeInTheDocument();
  });

  it('shows a Use button for Second Wind (Bonus) and persists the use via onChange', () => {
    const onChange = vi.fn();
    renderTab({ onChange });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    fireEvent.click(screen.getByRole('button', { name: /Use Second Wind/i }));
    fireEvent.click(screen.getByTestId('ae-rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ second_wind_used: 1 });
  });

  it('shows a Use button for Action Surge (No Action) and persists the use', () => {
    const onChange = vi.fn();
    renderTab({ level: 2, onChange });
    fireEvent.click(screen.getByTestId('ae-subtab-no_action'));
    fireEvent.click(screen.getByRole('button', { name: /Use Action Surge/i }));
    fireEvent.click(screen.getByTestId('ae-rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ action_surge_used: 1 });
  });

  it('disables the Use button when the resource is exhausted', () => {
    renderTab({ characterData: { second_wind_used: 1 }, onChange: vi.fn() });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByRole('button', { name: /Use Second Wind/i })).toBeDisabled();
  });

  it('does NOT show a player the − recover button for a spent feature (spend-only; returns on a rest)', () => {
    renderTab({ level: 2, characterData: { action_surge_used: 1 }, onChange: vi.fn() });
    fireEvent.click(screen.getByTestId('ae-subtab-no_action'));
    expect(screen.getByRole('button', { name: /Use Action Surge/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Recover Action Surge/i })).not.toBeInTheDocument();
  });

  it('gives the GM (isGm) a − recover button to correct a spent feature', () => {
    const onChange = vi.fn();
    renderTab({ level: 2, characterData: { action_surge_used: 1 }, onChange, isGm: true });
    fireEvent.click(screen.getByTestId('ae-subtab-no_action'));
    fireEvent.click(screen.getByRole('button', { name: /Recover Action Surge/i }));
    expect(onChange).toHaveBeenCalledWith({ action_surge_used: 0 });
  });

  it('hides the Use button in readOnly mode', () => {
    renderTab({ readOnly: true });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.queryByRole('button', { name: /Use Second Wind/i })).not.toBeInTheDocument();
    expect(screen.getByText('Second Wind')).toBeInTheDocument(); // still listed, just no control
  });

  it('shows the equipped weapon attack + universal Attack on the Actions tab', () => {
    renderTab();
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByTestId('ae-universal')).toBeInTheDocument();
  });

  it('shows a clickable to-hit breakdown on a weapon attack (Archery longbow)', () => {
    const longbow = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'ranged', damage: '1d8', damage_type: 'Piercing', properties: '[]',
    };
    // DEX 16 (+3), level 5 (PB +3), proficient, Archery +2 → +8
    renderTab({ inventory: [longbow], scores: { strength: 10, dexterity: 16 }, characterData: { fighting_style: 'Archery' } });
    const btn = screen.getByTestId('ae-tohit-weapon:lb1:0');
    expect(btn).toHaveTextContent('+8');
    // Breakdown is hidden until the to-hit is clicked.
    expect(screen.queryByTestId('ae-tohit-breakdown-weapon:lb1:0')).not.toBeInTheDocument();
    fireEvent.click(btn);
    const bd = screen.getByTestId('ae-tohit-breakdown-weapon:lb1:0');
    expect(bd).toHaveTextContent('+3 DEX');
    expect(bd).toHaveTextContent('+3 Proficiency');
    expect(bd).toHaveTextContent('+2 Archery fighting style');
    // Clicking again collapses it.
    fireEvent.click(btn);
    expect(screen.queryByTestId('ae-tohit-breakdown-weapon:lb1:0')).not.toBeInTheDocument();
  });

  it('flags disadvantage on a Heavy weapon for a Small (5e) character', () => {
    renderTab({ inventory: [greatswordEntry], race: 'Halfling' });
    expect(screen.getByText('Greatsword')).toBeInTheDocument();
    // The weapon's own detail line carries the disadvantage flag (scoped to avoid the
    // universal Dodge action, whose description also mentions "disadvantage").
    expect(screen.getByText(/2d6.*·\s*disadvantage/i)).toBeInTheDocument();
    // …and the full amber warning message is shown under the entry.
    expect(screen.getByText(/Small creatures attack with it at disadvantage/i)).toBeInTheDocument();
  });

  it('flags weapon attacks with disadvantage while wearing non-proficient armor', () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Wizard', inventory: [longswordEntry, chainMailEntry] });
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText(/1d8.*·\s*disadvantage/i)).toBeInTheDocument();
    expect(screen.getByText(/Chain Mail without proficiency/i)).toBeInTheDocument();
  });

  it('the unarmed fallback (no weapon equipped) is at disadvantage in non-proficient armor', () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Wizard', inventory: [chainMailEntry] });
    expect(screen.getByText('Unarmed Strike')).toBeInTheDocument();
    expect(screen.getByText(/bludgeoning.*·\s*disadvantage/i)).toBeInTheDocument();
  });

  it("shows a can't-cast note under the Spell section while wearing non-proficient armor", async () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Wizard', inventory: [chainMailEntry], characterData: { prepared_spells: ['Fireball'] } });
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    expect(screen.getByTestId('ae-armor-spells')).toHaveTextContent(/can't cast spells while wearing Chain Mail/i);
  });

  it('no armor-spells note when the worn armor is proficient', async () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Fighter', inventory: [chainMailEntry], characterData: { prepared_spells: ['Fireball'] } });
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    expect(screen.queryByTestId('ae-armor-spells')).not.toBeInTheDocument();
  });

  it('shows the Extra Attack note for a level 5 Fighter', () => {
    renderTab();
    expect(screen.getByTestId('ae-attacks-per-action')).toHaveTextContent('2 attacks');
  });

  const lightXbowEntry = {
    uid: 'lx1', category: 'weapons', equipped: true, name: 'Crossbow, Light',
    weapon_category: 'Simple', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing', properties: '["Ammunition", "Loading", "Two-Handed"]',
  };

  it('notes the Loading one-attack cap on the weapon entry + the Extra Attack caveat (no feat)', () => {
    renderTab({ inventory: [lightXbowEntry] });
    expect(screen.getByTestId('ae-loading-weapon:lx1:0')).toHaveTextContent(/only one attack per action/i);
    expect(screen.getByTestId('ae-loading-caveat')).toHaveTextContent(/fired only once per action/i);
  });

  it('Crossbow Expert lifts the cap: "ignored" note + no Extra Attack caveat', () => {
    renderTab({ inventory: [lightXbowEntry], characterData: { feats: [{ name: 'Crossbow Expert' }] } });
    expect(screen.getByTestId('ae-loading-weapon:lx1:0')).toHaveTextContent(/ignored \(Crossbow Expert\)/i);
    expect(screen.queryByTestId('ae-loading-caveat')).not.toBeInTheDocument();
  });

  it('puts the Loading mechanics-page link inside the loading weapon entry', () => {
    renderTab({ inventory: [lightXbowEntry] });
    expect(screen.getByTestId('loading-learn-more-weapon:lx1:0')).toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/loading');
  });

  it('notes the within-5-ft ranged disadvantage on a ranged weapon entry + links to the spacing page', () => {
    renderTab({ inventory: [lightXbowEntry] });
    expect(screen.getByTestId('ae-spacing-weapon:lx1:0')).toHaveTextContent(/disadvantage while an enemy is within 5 ft/i);
    expect(screen.getByTestId('spacing-learn-more-weapon:lx1:0')).toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/spacing');
  });

  it('Crossbow Expert flips the ranged spacing note to "no disadvantage"', () => {
    renderTab({ inventory: [lightXbowEntry], characterData: { feats: [{ name: 'Crossbow Expert' }] } });
    expect(screen.getByTestId('ae-spacing-weapon:lx1:0')).toHaveTextContent(/no disadvantage/i);
  });

  it('shows no spacing note on a melee-only weapon', () => {
    renderTab({ inventory: [longswordEntry] });
    expect(screen.queryByTestId('ae-spacing-weapon:w1:0')).not.toBeInTheDocument();
  });

  it('shows a Savage Attacks note on a melee weapon entry for a Half-Orc', () => {
    renderTab({ inventory: [longswordEntry], characterData: { race_traits: ['Savage Attacks', 'Relentless Endurance'] } });
    expect(screen.getByTestId('ae-savage-weapon:w1:0')).toHaveTextContent(/Savage Attacks/i);
  });

  it('no Savage Attacks note without the trait', () => {
    renderTab({ inventory: [longswordEntry] });
    expect(screen.queryByTestId('ae-savage-weapon:w1:0')).not.toBeInTheDocument();
  });

  it('shows the Champion crit range on a weapon attack entry', () => {
    renderTab({ inventory: [longswordEntry], subclass: 'Champion', level: 3 });
    expect(screen.getByTestId('ae-crit-weapon:w1:0')).toHaveTextContent('Crit 19–20 (Improved Critical)');
  });

  it('no crit range for a non-Champion weapon attack', () => {
    renderTab({ inventory: [longswordEntry], subclass: 'Battle Master', level: 3 });
    expect(screen.queryByTestId('ae-crit-weapon:w1:0')).not.toBeInTheDocument();
  });

  it('shows the 2024 Champion Remarkable Athlete post-crit move note on a weapon attack entry', () => {
    renderTab({ inventory: [longswordEntry], subclass: 'Champion', level: 3, edition: '5.5e' });
    expect(screen.getByTestId('ae-remarkable-move-weapon:w1:0')).toHaveTextContent('half your Speed');
  });

  it('no Remarkable Athlete move note in 5e / for a non-Champion', () => {
    renderTab({ inventory: [longswordEntry], subclass: 'Champion', level: 3, edition: '5e' });
    expect(screen.queryByTestId('ae-remarkable-move-weapon:w1:0')).not.toBeInTheDocument();
    cleanup();
    renderTab({ inventory: [longswordEntry], subclass: 'Battle Master', level: 3, edition: '5.5e' });
    expect(screen.queryByTestId('ae-remarkable-move-weapon:w1:0')).not.toBeInTheDocument();
  });

  it('shows a ranged-spell spacing note under the Spell section', async () => {
    renderTab({ characterData: { prepared_spells: ['Fireball'] } });
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    expect(screen.getByTestId('ae-spacing-spells')).toHaveTextContent(/ranged attack roll/i);
    expect(screen.getByTestId('spacing-learn-more-spells')).toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/spacing');
  });

  it('shows Second Wind under the Bonus Actions tab', () => {
    renderTab();
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByText('Second Wind')).toBeInTheDocument();
  });

  it('shows Indomitable under No Action and Opportunity Attack under Reactions at level 9', () => {
    renderTab({ level: 9 });
    fireEvent.click(screen.getByTestId('ae-subtab-no_action'));
    expect(screen.getByText('Indomitable')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ae-subtab-reaction'));
    expect(screen.getByText('Opportunity Attack')).toBeInTheDocument();
    expect(screen.queryByText('Indomitable')).not.toBeInTheDocument();
  });

  it('does not fetch spells when the character knows none', () => {
    renderTab();
    expect(encyclopediaService.getSpells).not.toHaveBeenCalled();
  });

  it('fetches and buckets known spells by casting time', async () => {
    renderTab({ characterData: { prepared_spells: ['Healing Word', 'Shield', 'Fireball'] } });
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith(1, '5e'));
    // Fireball (action) shows on the default Actions tab
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    // Healing Word is a bonus action
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByText('Healing Word')).toBeInTheDocument();
    // Shield is a reaction
    fireEvent.click(screen.getByTestId('ae-subtab-reaction'));
    expect(screen.getByText('Shield')).toBeInTheDocument();
  });

  it('shows Two-Weapon Fighting with main-hand/off-hand weapon rows on the Action+Bonus tab', () => {
    const light = (uid, name) => ({ uid, category: 'weapons', equipped: true, name, weapon_type: 'Melee', weapon_category: 'Martial', damage: '1d6', damage_type: 'piercing', properties: '["Finesse", "Light"]' });
    renderTab({ inventory: [light('a', 'Shortsword'), light('b', 'Dagger')] });
    fireEvent.click(screen.getByTestId('ae-subtab-action+bonus'));
    expect(screen.getByText('Two-Weapon Fighting')).toBeInTheDocument();
    expect(screen.getByTestId('ae-twf-main-hand')).toHaveTextContent('Shortsword');
    expect(screen.getByTestId('ae-twf-off-hand')).toHaveTextContent('Dagger');
  });

  it('shows the empty note on Action+Bonus without two light weapons', () => {
    renderTab();
    fireEvent.click(screen.getByTestId('ae-subtab-action+bonus'));
    expect(screen.getByTestId('ae-empty')).toBeInTheDocument();
  });

  it('shows the Tavern Brawler grapple combo (Unarmed Strike Action + Grapple Bonus) on Action+Bonus', () => {
    const tavernBrawler = { id: 14, name: 'Tavern Brawler', effects: [
      { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
      { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', trigger: 'After an unarmed hit', description: 'Grapple the target.' },
    ] };
    renderTab({ inventory: [], characterData: { feats: [tavernBrawler] } });
    fireEvent.click(screen.getByTestId('ae-subtab-action+bonus'));
    expect(screen.getByText('Tavern Brawler')).toBeInTheDocument();
    expect(screen.getByTestId('ae-twf-action')).toHaveTextContent('Unarmed Strike');
    expect(screen.getByTestId('ae-twf-action')).toHaveTextContent('1d4');
    const bonus = screen.getByTestId('ae-twf-bonus');
    expect(bonus).toHaveTextContent('Grapple');
    expect(bonus).toHaveTextContent(/grapple the target/i); // detail-only sub-row renders its detail
  });

  it('Great Weapon Master power-attack toggle swaps a Heavy melee weapon to −5/+10', () => {
    // Fighter L5 (PB +3), STR 16 (+3), proficient Greatsword: +6 to hit, 2d6 + 3 damage.
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 }, characterData: { feats: [{ name: 'Great Weapon Master' }] } });
    expect(screen.getByTestId('ae-tohit-weapon:gs1:0')).toHaveTextContent('+6');
    expect(screen.getByText(/2d6 \+ 3 Slashing/)).toBeInTheDocument();
    const toggle = screen.getByTestId('ae-gwm-toggle-weapon:gs1:0');
    fireEvent.click(toggle);
    expect(screen.getByTestId('ae-tohit-weapon:gs1:0')).toHaveTextContent('+1');
    expect(screen.getByText(/2d6 \+ 13 Slashing/)).toBeInTheDocument();
    // Toggling back restores the normal numbers.
    fireEvent.click(toggle);
    expect(screen.getByTestId('ae-tohit-weapon:gs1:0')).toHaveTextContent('+6');
  });

  it('shows no Great Weapon Master toggle without the feat', () => {
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 } });
    expect(screen.queryByTestId('ae-gwm-toggle-weapon:gs1:0')).not.toBeInTheDocument();
  });

  it('shows the GWM crit/kill bonus-attack note on the melee weapon entry AND as a standalone Bonus entry', () => {
    const gwmFeat = {
      name: 'Great Weapon Master',
      effects: [{ kind: 'action', name: 'Cleave (Bonus Attack)', economy: 'bonus', trigger: 'When you score a critical hit or reduce a creature to 0 HP with a melee weapon', description: 'Make one melee weapon attack as a bonus action.' }],
    };
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 }, characterData: { feats: [gwmFeat] } });
    expect(screen.getByTestId('ae-gwm-weapon:gs1:0')).toHaveTextContent(/critical hit.*bonus action/i);
    // The standalone "Cleave (Bonus Attack)" entry is also present in the Bonus Actions bucket.
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByText(/cleave/i)).toBeInTheDocument();
  });

  it('shows no GWM bonus-attack note without the feat', () => {
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 } });
    expect(screen.queryByTestId('ae-gwm-weapon:gs1:0')).not.toBeInTheDocument();
  });

  it('shows Weapon Bond as a Subclass bonus action for an Eldritch Knight at L3', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 3 });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByText('Weapon Bond')).toBeInTheDocument();
    expect(screen.getByText(/summon/i)).toBeInTheDocument();
  });

  it('shows no Weapon Bond for a Champion', () => {
    renderTab({ subclass: 'Champion', level: 3 });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.queryByText('Weapon Bond')).not.toBeInTheDocument();
  });

  it('renders the War Magic combo on Action+Bonus for an Eldritch Knight at L7', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 7 });
    fireEvent.click(screen.getByTestId('ae-subtab-action+bonus'));
    expect(screen.getByText('War Magic')).toBeInTheDocument();
    // Sub rows: cast a cantrip (Action) + the equipped weapon (Bonus)
    expect(screen.getByTestId('ae-twf-action')).toHaveTextContent(/cast a cantrip/i);
    expect(screen.getByTestId('ae-twf-bonus')).toHaveTextContent('Longsword');
  });

  it('shows the Eldritch Strike note on a weapon entry for an Eldritch Knight at L10', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 10 });
    expect(screen.getByTestId('ae-eldritch-weapon:w1:0')).toHaveTextContent(/disadvantage on the next saving throw/i);
  });

  it('shows no Eldritch Strike note below L10 or for a non-EK subclass', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 9 });
    expect(screen.queryByTestId('ae-eldritch-weapon:w1:0')).not.toBeInTheDocument();
    cleanup();
    renderTab({ subclass: 'Champion', level: 10 });
    expect(screen.queryByTestId('ae-eldritch-weapon:w1:0')).not.toBeInTheDocument();
  });

  it('appends the Arcane Charge rider to Action Surge for an Eldritch Knight at L15', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 15 });
    fireEvent.click(screen.getByTestId('ae-subtab-no_action'));
    expect(screen.getByText(/Arcane Charge/)).toBeInTheDocument();
    expect(screen.getByText(/teleport up to 30 ft/i)).toBeInTheDocument();
  });
});

describe('ActionEconomyTab — Weapon Bond + Hex Warrior', () => {
  const rapierEntry = {
    uid: 'rp1', category: 'weapons', equipped: true, hand: 'main', name: 'Rapier',
    weapon_category: 'Martial', weapon_type: 'melee', damage: '1d8', damage_type: 'Piercing', properties: 'Finesse',
  };

  it('renders "Bonded Rapier" on Bonus Actions for an EK with a bonded weapon', () => {
    renderTab({
      subclass: 'Eldritch Knight', level: 3,
      inventory: [rapierEntry],
      characterData: { bonded_weapon_uids: ['rp1'] },
    });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByText('Bonded Rapier')).toBeInTheDocument();
    expect(screen.queryByText('Weapon Bond')).not.toBeInTheDocument();
    // equipped bonded weapon → its real attack row renders as a sub-row
    expect(screen.getByText(/summon your bonded rapier/i)).toBeInTheDocument();
  });

  it('keeps the generic Weapon Bond entry with a picker hint when nothing is bonded', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 3, inventory: [rapierEntry] });
    fireEvent.click(screen.getByTestId('ae-subtab-bonus'));
    expect(screen.getByText('Weapon Bond')).toBeInTheDocument();
    expect(screen.getByText(/no weapon bonded yet/i)).toBeInTheDocument();
  });

  it('shows the Hex Warrior CHA note on the hex weapon attack entry', () => {
    renderTab({
      charClass: 'Warlock', subclass: 'The Hexblade', level: 1,
      scores: { strength: 10, dexterity: 12, charisma: 18 },
      inventory: [rapierEntry],
      characterData: { hex_weapon_uid: 'rp1' },
    });
    // default Actions tab — the weapon entry carries the hex note
    const note = screen.getByTestId(/^ae-hex-weapon:rp1/);
    expect(note).toHaveTextContent(/Hex Warrior/);
    // CHA +4 + prof +2 (Hex Warrior grants martial weapon proficiency) = +6; the to-hit
    // renders as the clickable breakdown chip, the rest as detail text.
    expect(screen.getByTestId(/^ae-tohit-weapon:rp1/)).toHaveTextContent('+6');
    expect(screen.getByText(/to hit · 1d8 \+ 4 Piercing/)).toBeInTheDocument();
  });

  it('shows no hex note for a non-Hexblade Warlock with the same stored uid', () => {
    renderTab({
      charClass: 'Warlock', subclass: 'The Fiend', level: 1,
      scores: { strength: 10, dexterity: 12, charisma: 18 },
      inventory: [rapierEntry],
      characterData: { hex_weapon_uid: 'rp1' },
    });
    expect(screen.queryByTestId(/^ae-hex-weapon:rp1/)).not.toBeInTheDocument();
  });
});
