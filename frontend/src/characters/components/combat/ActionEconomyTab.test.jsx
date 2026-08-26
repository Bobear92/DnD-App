import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
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

/**
 * Source groups render CLOSED by default (the headings are the tab's index). Almost every test
 * here is about what a CARD says, not about the disclosure, so the harness opens every group
 * after rendering or switching tabs. The default itself is asserted deliberately, by the
 * `collapsible source groups` block, which renders through `renderRaw`/`rawTab` instead.
 */
function openGroups() {
  screen.queryAllByRole('button', { expanded: false })
    .filter((b) => (b.getAttribute('data-testid') || '').startsWith('ae-group-toggle-'))
    .forEach((b) => fireEvent.click(b));
}

/** Switch sub-tab, then open that tab's groups. */
function goToTab(tab) {
  fireEvent.click(screen.getByTestId(`ae-subtab-${tab}`));
  openGroups();
}

/**
 * The Spell group only exists once the catalog fetch resolves, so it is still closed after the
 * synchronous open pass. Await its heading, then open what appeared.
 */
async function openGroupsAfterSpells() {
  await screen.findByTestId('ae-group-toggle-Spell');
  openGroups();
}

/** Switch sub-tab without touching the groups — for tests about the disclosure itself. */
function rawTab(tab) {
  fireEvent.click(screen.getByTestId(`ae-subtab-${tab}`));
}

function renderTab(props = {}) {
  const result = renderRaw(props);
  openGroups();
  return result;
}

function renderRaw(props = {}) {
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
    goToTab('no_action');
    expect(screen.getByText('Action Surge')).toBeInTheDocument();
  });

  it('shows a Use button for Second Wind (Bonus) and persists the use via onChange', () => {
    const onChange = vi.fn();
    renderTab({ onChange });
    goToTab('bonus');
    fireEvent.click(screen.getByRole('button', { name: /Use Second Wind/i }));
    fireEvent.click(screen.getByTestId('ae-rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ second_wind_used: 1 });
  });

  it('shows a Use button for Action Surge (No Action) and persists the use', () => {
    const onChange = vi.fn();
    renderTab({ level: 2, onChange });
    goToTab('no_action');
    fireEvent.click(screen.getByRole('button', { name: /Use Action Surge/i }));
    fireEvent.click(screen.getByTestId('ae-rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ action_surge_used: 1 });
  });

  // Breath Weapon's counter lives in the RACIAL rest-resource table, not any class config —
  // the tab used to build its resource index from the class config alone, so a racial
  // resourceKey resolved to nothing and the card had no Use button.
  describe('Dragonborn Breath Weapon', () => {
    const dragonborn = (extra = {}) => ({
      race_traits: ['Breath Weapon'],
      draconic_ancestry: { name: 'Red', damage: 'Fire', breath: '15 ft cone' },
      ...extra,
    });

    it('lists it under Actions with its computed damage, DC and area', () => {
      renderTab({ level: 6, characterData: dragonborn(), scores: { strength: 16, constitution: 16 } });
      expect(screen.getByText('Breath Weapon')).toBeInTheDocument();
      expect(screen.getByText(/3d6 fire damage/)).toBeInTheDocument();
      expect(screen.getByText(/DC 14 DEX save/)).toBeInTheDocument();
      expect(screen.getByText(/15 ft cone/)).toBeInTheDocument();
    });

    it('shows a Use button that persists the racial counter', () => {
      const onChange = vi.fn();
      renderTab({ characterData: dragonborn(), scores: { strength: 16, constitution: 16 }, onChange });
      fireEvent.click(screen.getByRole('button', { name: /Use Breath Weapon/i }));
      fireEvent.click(screen.getByTestId('ae-rest-use-confirm-button'));
      expect(onChange).toHaveBeenCalledWith({ breath_weapon_used: 1 });
    });

    it('disables the Use button once it has been spent', () => {
      renderTab({
        characterData: dragonborn({ breath_weapon_used: 1 }),
        scores: { strength: 16, constitution: 16 },
        onChange: vi.fn(),
      });
      expect(screen.getByRole('button', { name: /Use Breath Weapon/i })).toBeDisabled();
    });

    it('is absent for a character without the trait', () => {
      renderTab();
      expect(screen.queryByText('Breath Weapon')).not.toBeInTheDocument();
    });
  });

  it('disables the Use button when the resource is exhausted', () => {
    renderTab({ characterData: { second_wind_used: 1 }, onChange: vi.fn() });
    goToTab('bonus');
    expect(screen.getByRole('button', { name: /Use Second Wind/i })).toBeDisabled();
  });

  it('does NOT show a player the − recover button for a spent feature (spend-only; returns on a rest)', () => {
    renderTab({ level: 2, characterData: { action_surge_used: 1 }, onChange: vi.fn() });
    goToTab('no_action');
    expect(screen.getByRole('button', { name: /Use Action Surge/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Recover Action Surge/i })).not.toBeInTheDocument();
  });

  it('gives the GM (isGm) a − recover button to correct a spent feature', () => {
    const onChange = vi.fn();
    renderTab({ level: 2, characterData: { action_surge_used: 1 }, onChange, isGm: true });
    goToTab('no_action');
    fireEvent.click(screen.getByRole('button', { name: /Recover Action Surge/i }));
    expect(onChange).toHaveBeenCalledWith({ action_surge_used: 0 });
  });

  it('hides the Use button in readOnly mode', () => {
    renderTab({ readOnly: true });
    goToTab('bonus');
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
    // The weapon's own detail line carries the disadvantage flag (scoped via the damage chip
    // to avoid the universal Dodge action, whose description also mentions "disadvantage").
    expect(screen.getByTestId(/^ae-damage-weapon:/).closest('p'))
      .toHaveTextContent(/2d6.*·\s*disadvantage/i);
    // …and the full amber warning message is shown under the entry.
    expect(screen.getByText(/Small creatures attack with it at disadvantage/i)).toBeInTheDocument();
  });

  it('flags weapon attacks with disadvantage while wearing non-proficient armor', () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Wizard', inventory: [longswordEntry, chainMailEntry] });
    expect(screen.getByText('Longsword')).toBeInTheDocument();
    expect(screen.getByTestId(/^ae-damage-weapon:/).closest('p'))
      .toHaveTextContent(/1d8.*·\s*disadvantage/i);
    expect(screen.getByText(/Chain Mail without proficiency/i)).toBeInTheDocument();
  });

  it('the unarmed fallback (no weapon equipped) is at disadvantage in non-proficient armor', () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Wizard', inventory: [chainMailEntry] });
    expect(screen.getByText('Unarmed Strike')).toBeInTheDocument();
    expect(screen.getByTestId(/^ae-damage-weapon:/).closest('p'))
      .toHaveTextContent(/bludgeoning.*·\s*disadvantage/i);
  });

  it("shows a can't-cast note under the Spell section while wearing non-proficient armor", async () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Wizard', inventory: [chainMailEntry], characterData: { prepared_spells: ['Fireball'] } });
    await openGroupsAfterSpells();
    expect(screen.getByTestId('ae-armor-spells')).toHaveTextContent(/can't cast spells while wearing Chain Mail/i);
  });

  it('no armor-spells note when the worn armor is proficient', async () => {
    const chainMailEntry = { uid: 'a1', category: 'armor', equipped: true, name: 'Chain Mail', armor_type: 'heavy', armor_class: 16 };
    renderTab({ charClass: 'Fighter', inventory: [chainMailEntry], characterData: { prepared_spells: ['Fireball'] } });
    await openGroupsAfterSpells();
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

  // A spell card answers "what does it cost me?"; the next question is always the spell's own
  // text, which lives one tab over — so the NAME is a link into the Spells tab.
  it('links a spell card to that spell in the Spells tab', async () => {
    const onNavigateToSpell = vi.fn();
    renderTab({ characterData: { prepared_spells: ['Fireball'] }, onNavigateToSpell });
    await openGroupsAfterSpells();
    fireEvent.click(screen.getByTestId('ae-spell-link-Fireball'));
    expect(onNavigateToSpell).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fireball', level: 3, source: 'class' })
    );
  });

  it('sends a subclass-granted spell to the Subclass source, not the class list', async () => {
    // The jump has to land on the source the spell is actually filed under, or it opens a list
    // the spell isn't in.
    const onNavigateToSpell = vi.fn();
    renderTab({
      subclass: 'Arcane Archer',
      characterData: { subclass_cantrips: ['Fireball'] },
      onNavigateToSpell,
    });
    await openGroupsAfterSpells();
    fireEvent.click(screen.getByTestId('ae-spell-link-Fireball'));
    expect(onNavigateToSpell).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fireball', source: 'subclass' })
    );
  });

  it('leaves a spell name as plain text when there is nowhere to navigate', async () => {
    // The encyclopedia renders this same tab with no character sheet behind it.
    renderTab({ characterData: { prepared_spells: ['Fireball'] } });
    await openGroupsAfterSpells();
    expect(screen.queryByTestId('ae-spell-link-Fireball')).not.toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('does NOT turn a non-spell card into a link', () => {
    renderTab({ onNavigateToSpell: vi.fn() });
    goToTab('bonus');
    expect(screen.getByText('Second Wind')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^ae-spell-link-/)).toHaveLength(0);
  });

  it('shows a ranged-spell spacing note under the Spell section', async () => {
    renderTab({ characterData: { prepared_spells: ['Fireball'] } });
    await openGroupsAfterSpells();
    expect(screen.getByTestId('ae-spacing-spells')).toHaveTextContent(/ranged attack roll/i);
    expect(screen.getByTestId('spacing-learn-more-spells')).toHaveAttribute('href', '/campaigns/1/encyclopedia/mechanics/spacing');
  });

  it('shows Second Wind under the Bonus Actions tab', () => {
    renderTab();
    goToTab('bonus');
    expect(screen.getByText('Second Wind')).toBeInTheDocument();
  });

  it('shows Indomitable under No Action and Opportunity Attack under Reactions at level 9', () => {
    renderTab({ level: 9 });
    goToTab('no_action');
    expect(screen.getByText('Indomitable')).toBeInTheDocument();
    goToTab('reaction');
    expect(screen.getByText('Opportunity Attack')).toBeInTheDocument();
    expect(screen.queryByText('Indomitable')).not.toBeInTheDocument();
  });

  it('does not fetch spells when the character knows none', () => {
    renderTab();
    expect(encyclopediaService.getSpells).not.toHaveBeenCalled();
  });

  it('lists each known spell under the tab its casting time costs', async () => {
    renderTab({ characterData: { prepared_spells: ['Healing Word', 'Shield', 'Fireball'] } });
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith(1, '5e'));
    await openGroupsAfterSpells();
    // The action spell is named on the Actions tab — the old generic pointer is gone.
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.queryByText('Cast a Spell')).not.toBeInTheDocument();
    expect(screen.queryByText('Healing Word')).not.toBeInTheDocument();
    // ...and each of the others sits under the tab it actually costs.
    goToTab('bonus');
    expect(screen.getByText('Healing Word')).toBeInTheDocument();
    goToTab('reaction');
    expect(screen.getByText('Shield')).toBeInTheDocument();
  });

  it('heads the spell group "Spells" and shows it only when there are some', async () => {
    renderTab({ characterData: { prepared_spells: ['Fireball'] } });
    await openGroupsAfterSpells();
    expect(screen.getByText('Spells')).toBeInTheDocument();
    cleanup();
    renderTab(); // a Fighter who casts nothing
    expect(screen.queryByText('Spells')).not.toBeInTheDocument();
  });

  it('shows Two-Weapon Fighting with main-hand/off-hand weapon rows on the Action+Bonus tab', () => {
    const light = (uid, name) => ({ uid, category: 'weapons', equipped: true, name, weapon_type: 'Melee', weapon_category: 'Martial', damage: '1d6', damage_type: 'piercing', properties: '["Finesse", "Light"]' });
    renderTab({ inventory: [light('a', 'Shortsword'), light('b', 'Dagger')] });
    goToTab('action+bonus');
    expect(screen.getByText('Two-Weapon Fighting')).toBeInTheDocument();
    expect(screen.getByTestId('ae-twf-main-hand')).toHaveTextContent('Shortsword');
    expect(screen.getByTestId('ae-twf-off-hand')).toHaveTextContent('Dagger');
  });

  // The bonus half of Telekinetic Master is an ordinary weapon attack, so the combo card has to
  // carry the whole attack card — not a {name, toHit, damage} summary row. A player reaching for
  // it still needs the range band, Psionic Strike's Use control and the spacing rule to take it.
  it('renders the Telekinetic Master bonus half as a FULL weapon card', () => {
    const longbow = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing',
      properties: '["Ammunition", "Heavy", "Two-Handed"]', range_normal: 150, range_long: 600,
    };
    renderTab({
      level: 18,
      inventory: [longbow],
      subclass: 'Psi Warrior',
      scores: { strength: 12, dexterity: 20, intelligence: 18 },
    });
    goToTab('action+bonus');
    expect(screen.getByText('Telekinetic Master')).toBeInTheDocument();

    const bonus = screen.getByTestId('ae-combo-bonus-subclass:Telekinetic Master');
    expect(bonus).toHaveTextContent('Longbow');
    // The range band, which a summary row could not show.
    expect(bonus).toHaveTextContent('150/600');
    // Psionic Strike rides on this same attack, with its own Use control inside the card.
    expect(bonus).toHaveTextContent('Psionic Strike');
    // The within-5-ft rule for a ranged weapon.
    expect(bonus).toHaveTextContent(/disadvantage/i);
  });

  it('keeps the nested bonus card testids distinct from the weapon own card', () => {
    const longbow = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing',
      properties: '["Ammunition", "Two-Handed"]', range_normal: 150, range_long: 600,
    };
    renderTab({
      level: 18,
      inventory: [longbow],
      subclass: 'Psi Warrior',
      scores: { strength: 12, dexterity: 20, intelligence: 18 },
    });
    // Actions tab has the weapon's own card...
    expect(screen.getByTestId('ae-range-weapon:lb1:0')).toBeInTheDocument();
    // ...and the combo's nested copy is key-PREFIXED, so neither getByTestId is ambiguous.
    goToTab('action+bonus');
    expect(
      screen.getByTestId('ae-range-subclass:Telekinetic Master-bonus-weapon:lb1:0')
    ).toBeInTheDocument();
  });

  describe('collapsible source groups', () => {
    // A Psi Warrior's Actions tab stacks Weapon Attacks + Subclass + General, which is exactly
    // the case worth collapsing — you scroll past two groups to reach the third.
    const psiProps = {
      level: 18,
      subclass: 'Psi Warrior',
      inventory: [longswordEntry],
      scores: { strength: 16, dexterity: 12, intelligence: 18 },
    };

    it('makes each group a toggle when the tab has more than one', () => {
      renderRaw(psiProps);
      expect(screen.getByTestId('ae-group-toggle-Weapon')).toBeInTheDocument();
      expect(screen.getByTestId('ae-group-toggle-Subclass')).toBeInTheDocument();
      expect(screen.getByTestId('ae-group-toggle-universal')).toBeInTheDocument();
    });

    it('starts every group CLOSED, so the headings are the index rather than a wall of cards', () => {
      renderRaw(psiProps);
      expect(screen.getByTestId('ae-group-toggle-Weapon')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('ae-group-toggle-Subclass')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('ae-group-toggle-universal')).toHaveAttribute('aria-expanded', 'false');
      // The heading is there; its entries are not until it is opened.
      expect(screen.getByText('Weapon Attacks')).toBeInTheDocument();
      expect(screen.queryByText('Longsword')).not.toBeInTheDocument();
    });

    it('shows the entries of a group when its heading is clicked, and hides them again', () => {
      renderRaw(psiProps);
      fireEvent.click(screen.getByTestId('ae-group-toggle-Weapon'));
      expect(screen.getByTestId('ae-group-toggle-Weapon')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Longsword')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('ae-group-toggle-Weapon'));
      expect(screen.queryByText('Longsword')).not.toBeInTheDocument();
      expect(screen.getByText('Weapon Attacks')).toBeInTheDocument();
    });

    it('opens only the group clicked', () => {
      renderRaw(psiProps);
      fireEvent.click(screen.getByTestId('ae-group-toggle-Weapon'));
      expect(screen.getByTestId('ae-group-toggle-Subclass')).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('ae-group-toggle-universal')).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows a count on the heading, so a closed group says how much is hidden', () => {
      renderRaw(psiProps);
      // The universal action menu is several entries; the badge is what a closed group offers.
      expect(screen.getByTestId('ae-group-toggle-universal').textContent).toMatch(/\d/);
    });

    it('keeps the open state per TAB — the same group on another tab is unaffected', () => {
      renderRaw(psiProps);
      fireEvent.click(screen.getByTestId('ae-group-toggle-universal'));
      expect(screen.getByTestId('ae-group-toggle-universal')).toHaveAttribute('aria-expanded', 'true');
      // Reactions has its own General group (Opportunity Attack) — still closed.
      rawTab('reaction');
      expect(screen.getByTestId('ae-group-toggle-universal')).toHaveAttribute('aria-expanded', 'false');
      // ...and returning to Actions remembers the choice rather than silently re-closing.
      rawTab('action');
      expect(screen.getByTestId('ae-group-toggle-universal')).toHaveAttribute('aria-expanded', 'true');
    });

    it('offers NO toggle when the tab has only one group', () => {
      // A plain Fighter's Action+Bonus tab holds the single Two-Weapon Fighting group — there is
      // nothing to scan past, so a disclosure triangle would be a control that solves no problem.
      const light = (uid, name) => ({
        uid, category: 'weapons', equipped: true, name, weapon_type: 'Melee',
        weapon_category: 'Martial', damage: '1d6', damage_type: 'piercing',
        properties: '["Finesse", "Light"]',
      });
      renderRaw({ inventory: [light('a', 'Shortsword'), light('b', 'Dagger')] });
      rawTab('action+bonus');
      expect(screen.getByText('Two-Weapon Fighting')).toBeInTheDocument();
      expect(screen.queryByTestId('ae-group-toggle-Weapon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ae-group-toggle-universal')).not.toBeInTheDocument();
    });
  });

  it('shows the empty note on Action+Bonus without two light weapons', () => {
    renderTab();
    goToTab('action+bonus');
    expect(screen.getByTestId('ae-empty')).toBeInTheDocument();
  });

  it('shows the Tavern Brawler grapple combo (Unarmed Strike Action + Grapple Bonus) on Action+Bonus', () => {
    const tavernBrawler = { id: 14, name: 'Tavern Brawler', effects: [
      { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
      { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', trigger: 'After an unarmed hit', description: 'Grapple the target.' },
    ] };
    renderTab({ inventory: [], characterData: { feats: [tavernBrawler] } });
    goToTab('action+bonus');
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
    const toggle = screen.getByTestId('ae-power-attack-toggle-weapon:gs1:0');
    expect(toggle).toHaveTextContent(/Use Great Weapon Master/);
    fireEvent.click(toggle);
    expect(screen.getByTestId('ae-tohit-weapon:gs1:0')).toHaveTextContent('+1');
    expect(screen.getByText(/2d6 \+ 13 Slashing/)).toBeInTheDocument();
    // Toggling back restores the normal numbers.
    fireEvent.click(toggle);
    expect(screen.getByTestId('ae-tohit-weapon:gs1:0')).toHaveTextContent('+6');
  });

  it('shows no Great Weapon Master toggle without the feat', () => {
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 } });
    expect(screen.queryByTestId('ae-power-attack-toggle-weapon:gs1:0')).not.toBeInTheDocument();
  });

  // Sharpshooter grants the identical −5/+10 mechanic on a disjoint weapon set, so it rides the
  // same control rather than a parallel one.
  describe('Sharpshooter power attack', () => {
    const longbowEntry = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing',
      properties: '["Ammunition", "Heavy", "Two-Handed"]', range: '150/600',
    };
    const handaxeEntry = {
      uid: 'ha1', category: 'weapons', equipped: true, name: 'Handaxe',
      weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d6', damage_type: 'Slashing',
      properties: '["Light", "Thrown"]', range: '20/60',
    };
    const archer = (props = {}) => renderTab({
      inventory: [longbowEntry],
      scores: { strength: 10, dexterity: 16 },
      characterData: { feats: [{ name: 'Sharpshooter' }] },
      ...props,
    });

    it('swaps a ranged weapon to −5/+10', () => {
      // Fighter L5 (PB +3), DEX 16 (+3), proficient Longbow: +6 to hit, 1d8 + 3 damage.
      archer();
      expect(screen.getByTestId('ae-tohit-weapon:lb1:0')).toHaveTextContent('+6');
      const toggle = screen.getByTestId('ae-power-attack-toggle-weapon:lb1:0');
      expect(toggle).toHaveTextContent(/Use Sharpshooter/);
      fireEvent.click(toggle);
      expect(screen.getByTestId('ae-tohit-weapon:lb1:0')).toHaveTextContent('+1');
      expect(screen.getByText(/1d8 \+ 13 Piercing/)).toBeInTheDocument();
      fireEvent.click(toggle);
      expect(screen.getByTestId('ae-tohit-weapon:lb1:0')).toHaveTextContent('+6');
    });

    it('names Sharpshooter in the to-hit breakdown', () => {
      archer();
      fireEvent.click(screen.getByTestId('ae-power-attack-toggle-weapon:lb1:0'));
      fireEvent.click(screen.getByTestId('ae-tohit-weapon:lb1:0'));
      expect(screen.getByTestId('ae-tohit-breakdown-weapon:lb1:0')).toHaveTextContent('-5 Sharpshooter');
    });

    it('shows no toggle without the feat', () => {
      archer({ characterData: {} });
      expect(screen.queryByTestId('ae-power-attack-toggle-weapon:lb1:0')).not.toBeInTheDocument();
    });

    // RAW: "a ranged weapon". A thrown handaxe is a MELEE weapon making a ranged attack.
    it('does not offer it on a thrown melee weapon', () => {
      archer({ inventory: [handaxeEntry] });
      expect(screen.queryByTestId('ae-power-attack-toggle-weapon:ha1:0')).not.toBeInTheDocument();
    });

    it('does not offer it on a ranged weapon the character is not proficient with', () => {
      // A Wizard is not proficient with a martial Longbow.
      archer({ charClass: 'Wizard' });
      expect(screen.queryByTestId('ae-power-attack-toggle-weapon:lb1:0')).not.toBeInTheDocument();
    });

    // The 2024 feat replaces −5/+10 with a flat +PB, so the toggle must not appear there.
    it('does not offer it in a 2024 campaign', () => {
      archer({ edition: '5.5e' });
      expect(screen.queryByTestId('ae-power-attack-toggle-weapon:lb1:0')).not.toBeInTheDocument();
    });

    // Disjoint weapon sets: a character with both feats gets the right one on each card.
    it('gives each weapon the feat that actually applies to it', () => {
      renderTab({
        inventory: [greatswordEntry, longbowEntry],
        scores: { strength: 16, dexterity: 16 },
        characterData: { feats: [{ name: 'Great Weapon Master' }, { name: 'Sharpshooter' }] },
      });
      expect(screen.getByTestId('ae-power-attack-toggle-weapon:gs1:0')).toHaveTextContent(/Great Weapon Master/);
      expect(screen.getByTestId('ae-power-attack-toggle-weapon:lb1:1')).toHaveTextContent(/Sharpshooter/);
    });
  });

  it('shows the GWM crit/kill bonus-attack note on the melee weapon entry AND as a standalone Bonus entry', () => {
    const gwmFeat = {
      name: 'Great Weapon Master',
      effects: [{ kind: 'action', name: 'Cleave (Bonus Attack)', economy: 'bonus', trigger: 'When you score a critical hit or reduce a creature to 0 HP with a melee weapon', description: 'Make one melee weapon attack as a bonus action.' }],
    };
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 }, characterData: { feats: [gwmFeat] } });
    expect(screen.getByTestId('ae-gwm-weapon:gs1:0')).toHaveTextContent(/critical hit.*bonus action/i);
    // The standalone "Cleave (Bonus Attack)" entry is also present in the Bonus Actions bucket.
    goToTab('bonus');
    expect(screen.getByText(/cleave/i)).toBeInTheDocument();
  });

  it('shows no GWM bonus-attack note without the feat', () => {
    renderTab({ inventory: [greatswordEntry], scores: { strength: 16 } });
    expect(screen.queryByTestId('ae-gwm-weapon:gs1:0')).not.toBeInTheDocument();
  });

  it('shows Weapon Bond as a Subclass bonus action for an Eldritch Knight at L3', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 3 });
    goToTab('bonus');
    expect(screen.getByText('Weapon Bond')).toBeInTheDocument();
    expect(screen.getByText(/summon/i)).toBeInTheDocument();
  });

  it('shows no Weapon Bond for a Champion', () => {
    renderTab({ subclass: 'Champion', level: 3 });
    goToTab('bonus');
    expect(screen.queryByText('Weapon Bond')).not.toBeInTheDocument();
  });

  it('renders the War Magic combo on Action+Bonus for an Eldritch Knight at L7', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 7 });
    goToTab('action+bonus');
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

  it('shows Arcane Charge on its own line under Action Surge for an Eldritch Knight at L15', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 15 });
    goToTab('no_action');
    const rider = screen.getByTestId('ae-rider-arcane-charge');
    expect(rider).toHaveTextContent('Arcane Charge');
    // Collapsed to the name — the rules text arrives on click.
    expect(screen.queryByTestId('ae-rider-arcane-charge-text')).not.toBeInTheDocument();
    fireEvent.click(rider);
    expect(screen.getByTestId('ae-rider-arcane-charge-text')).toHaveTextContent(/teleport up to 30 ft/i);
    // It is a separate element from the Action Surge description, not run into it.
    expect(screen.getByText(/take one additional action for free/i)).not.toBe(rider);
    expect(screen.getByText(/take one additional action for free/i)).not.toHaveTextContent(/Arcane Charge/);
  });

  it('collapses a rider again on a second click', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 15 });
    goToTab('no_action');
    const rider = screen.getByTestId('ae-rider-arcane-charge');
    expect(rider).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(rider);
    expect(rider).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(rider);
    expect(rider).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('ae-rider-arcane-charge-text')).not.toBeInTheDocument();
  });

  it('shows no rider line for a Champion at L15', () => {
    renderTab({ subclass: 'Champion', level: 15 });
    goToTab('no_action');
    expect(screen.queryByTestId('ae-rider-arcane-charge')).not.toBeInTheDocument();
  });
});

// Unwavering Mark reaches the player as two surfaces: the free mark on the melee attack card
// it triggers from, and the limited follow-up attack as its own bonus-action card.
describe('ActionEconomyTab — Cavalier Unwavering Mark', () => {
  it('hangs the mark off the melee attack card, name only until clicked', () => {
    renderTab({ subclass: 'Cavalier', level: 7 });
    const rider = screen.getByTestId('ae-rider-unwavering-mark');
    expect(rider).toHaveTextContent('Unwavering Mark');
    expect(screen.queryByTestId('ae-rider-unwavering-mark-text')).not.toBeInTheDocument();
    fireEvent.click(rider);
    expect(screen.getByTestId('ae-rider-unwavering-mark-text'))
      .toHaveTextContent(/disadvantage on any attack roll that doesn't target you/i);
  });

  it('shows the follow-up attack as a Marked Target bonus action with folded damage', () => {
    renderTab({ subclass: 'Cavalier', level: 7 });
    goToTab('bonus');
    expect(screen.getByText('Marked Target')).toBeInTheDocument();
    // Half Fighter level is already in the number, and advantage is stated on the row.
    const row = screen.getByTestId('ae-twf-attack');
    expect(row).toHaveTextContent(/1d8 \+ 6 slashing/i);
    expect(row).toHaveTextContent(/with advantage/i);
  });

  it('shows neither surface for a Champion', () => {
    renderTab({ subclass: 'Champion', level: 7 });
    expect(screen.queryByTestId('ae-rider-unwavering-mark')).not.toBeInTheDocument();
    goToTab('bonus');
    expect(screen.queryByText('Marked Target')).not.toBeInTheDocument();
  });
});

describe('ActionEconomyTab — extra reactions', () => {
  it('gives Vigilant Defender its own section in the Reactions tab', () => {
    renderTab({ subclass: 'Cavalier', level: 18 });
    goToTab('reaction');
    const section = screen.getByTestId('ae-extra-reactions');
    expect(section).toHaveTextContent('Vigilant Defender');
    expect(section).toHaveTextContent(/on other creatures' turns/i);
    // It says plainly that it does not compete with your one normal reaction.
    expect(section).toHaveTextContent(/don't use your one normal reaction/i);
  });

  it('keeps it out of the ordinary reaction groups', () => {
    renderTab({ subclass: 'Cavalier', level: 18 });
    goToTab('reaction');
    // The Subclass group holds Warding Maneuver, not the extra reaction.
    const extra = screen.getByTestId('ae-extra-reactions');
    const universal = screen.getByTestId('ae-universal');
    expect(universal).not.toHaveTextContent('Vigilant Defender');
    expect(extra).not.toHaveTextContent('Warding Maneuver');
  });

  it('shows no such section below L18 or for another subclass', () => {
    renderTab({ subclass: 'Cavalier', level: 17 });
    goToTab('reaction');
    expect(screen.queryByTestId('ae-extra-reactions')).not.toBeInTheDocument();
    cleanup();
    renderTab({ subclass: 'Champion', level: 18 });
    goToTab('reaction');
    expect(screen.queryByTestId('ae-extra-reactions')).not.toBeInTheDocument();
  });
});

describe('ActionEconomyTab — a feature-imposed save DC', () => {
  const KEY = 'subclass:Ferocious Charger';

  it('shows the DC as a number, with the arithmetic behind a click', () => {
    renderTab({ subclass: 'Cavalier', level: 15, scores: { strength: 16, dexterity: 12, constitution: 14 } });
    goToTab('no_action');
    // L15 → PB +5, STR 16 → +3, so 8 + 5 + 3 = 16.
    const dc = screen.getByTestId(`ae-save-dc-${KEY}`);
    expect(dc).toHaveTextContent('16');
    expect(screen.queryByTestId(`ae-save-dc-breakdown-${KEY}`)).not.toBeInTheDocument();
    fireEvent.click(dc);
    const panel = screen.getByTestId(`ae-save-dc-breakdown-${KEY}`);
    expect(panel).toHaveTextContent('Base');
    expect(panel).toHaveTextContent('Proficiency bonus');
    expect(panel).toHaveTextContent('STR modifier');
  });

  it('keeps the arithmetic out of the rules sentence', () => {
    renderTab({ subclass: 'Cavalier', level: 15 });
    goToTab('no_action');
    expect(screen.getByText(/move at least 10 feet in a straight line/i))
      .not.toHaveTextContent(/8 \+ PB/);
  });
});

describe('ActionEconomyTab — Mounted Combatant rider', () => {
  const mounted = { characterData: { feats: [{ id: 26, name: 'Mounted Combatant', level: 4 }] } };

  it('hangs the feat off a melee attack card, name only until clicked', () => {
    renderTab({ inventory: [longswordEntry], ...mounted });
    const rider = screen.getByTestId('ae-rider-mounted-combatant');
    expect(rider).toHaveTextContent('Mounted Combatant');
    expect(screen.queryByTestId('ae-rider-mounted-combatant-text')).not.toBeInTheDocument();
    fireEvent.click(rider);
    expect(screen.getByTestId('ae-rider-mounted-combatant-text'))
      .toHaveTextContent(/advantage on melee attack rolls/i);
  });

  it('is absent without the feat', () => {
    renderTab({ inventory: [longswordEntry] });
    expect(screen.queryByTestId('ae-rider-mounted-combatant')).not.toBeInTheDocument();
  });
});

// Damage gets the same click-to-see-the-math treatment the to-hit already had, so a wrong
// number can be traced to the term that produced it instead of being taken on trust.
describe('ActionEconomyTab — damage breakdown', () => {
  it('expands a weapon attack damage into its terms on click', () => {
    renderTab({ inventory: [longswordEntry] });
    const chip = screen.getByTestId(/^ae-damage-weapon:/);
    expect(chip).toHaveTextContent('1d8');
    // Closed until asked for — the card leads with the number, not the arithmetic.
    expect(screen.queryByTestId(/^ae-damage-breakdown-weapon:/)).not.toBeInTheDocument();
    fireEvent.click(chip);
    const bd = screen.getByTestId(/^ae-damage-breakdown-weapon:/);
    expect(bd).toHaveTextContent('1d8 weapon die');
    expect(bd).toHaveTextContent(/STR/);
  });

  it('collapses again on a second click', () => {
    renderTab({ inventory: [longswordEntry] });
    const chip = screen.getByTestId(/^ae-damage-weapon:/);
    expect(chip).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(chip);
    expect(screen.queryByTestId(/^ae-damage-breakdown-weapon:/)).not.toBeInTheDocument();
  });

  it("names the mark's half-level term on the Marked Target row", () => {
    renderTab({ subclass: 'Cavalier', level: 7, inventory: [longswordEntry] });
    goToTab('bonus');
    fireEvent.click(screen.getByTestId('ae-sub-damage-attack'));
    expect(screen.getByTestId('ae-sub-damage-attack-breakdown'))
      .toHaveTextContent(/half Fighter level \(Unwavering Mark\)/i);
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
    goToTab('bonus');
    expect(screen.getByText('Bonded Rapier')).toBeInTheDocument();
    expect(screen.queryByText('Weapon Bond')).not.toBeInTheDocument();
    // equipped bonded weapon → its real attack row renders as a sub-row
    expect(screen.getByText(/summon your bonded rapier/i)).toBeInTheDocument();
  });

  it('keeps the generic Weapon Bond entry with a picker hint when nothing is bonded', () => {
    renderTab({ subclass: 'Eldritch Knight', level: 3, inventory: [rapierEntry] });
    goToTab('bonus');
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
    // CHA +4 + prof +2 (Hex Warrior grants martial weapon proficiency) = +6; to-hit and
    // damage each render as their own clickable breakdown chip.
    expect(screen.getByTestId(/^ae-tohit-weapon:rp1/)).toHaveTextContent('+6');
    expect(screen.getByTestId(/^ae-damage-weapon:rp1/)).toHaveTextContent('1d8 + 4 Piercing');
    expect(screen.getByTestId(/^ae-tohit-weapon:rp1/).closest('p')).toHaveTextContent(/to hit ·/);
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

  // Ammunition is spent from the card you're attacking from, using the same control (and the
  // same spend rule) as the Items tab.
  describe('ammunition on the attack card', () => {
    const bow = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing',
      properties: '["Ammunition", "Heavy", "Two-Handed"]', range: '150/600',
    };
    const arrows = {
      uid: 'am1', category: 'adventuring-gear', name: 'Arrows',
      item_category: 'Ammunition', quantity: 20,
    };
    const archer = (props = {}) => renderTab({
      scores: { strength: 10, dexterity: 18 },
      inventory: [bow, arrows],
      onChange: vi.fn(),
      ...props,
    });

    it('shows the ammo control on an Ammunition weapon card', () => {
      archer();
      expect(screen.getByTestId('ae-ammo-count-lb1')).toHaveTextContent('Arrows: 20 remaining');
      expect(screen.getByTestId('ae-use-ammo-lb1')).toBeInTheDocument();
    });

    it('does not show it on a weapon without the Ammunition property', () => {
      renderTab(); // default inventory is a Longsword
      expect(screen.queryByTestId(/^ae-weapon-ammo-/)).not.toBeInTheDocument();
    });

    it('Use Ammunition writes the decremented stack back through onChange', () => {
      const onChange = vi.fn();
      archer({ onChange });
      fireEvent.click(screen.getByTestId('ae-use-ammo-lb1'));
      expect(onChange).toHaveBeenCalledWith({
        inventory: [bow, expect.objectContaining({ uid: 'am1', quantity: 19 })],
      });
    });

    it('flags an empty quiver on the card and disables the button', () => {
      archer({ inventory: [bow, { ...arrows, quantity: 0 }] });
      expect(screen.getByTestId('ae-ammo-out-lb1')).toHaveTextContent(/out of ammunition/i);
      expect(screen.getByTestId('ae-use-ammo-lb1')).toBeDisabled();
    });

    it('points at the Items tab when no matching ammunition is carried', () => {
      archer({ inventory: [bow] });
      expect(screen.getByTestId('ae-weapon-ammo-lb1')).toHaveTextContent(/add some in the Items tab/i);
    });

    it('a read-only viewer sees the count but cannot spend', () => {
      archer({ readOnly: true });
      expect(screen.getByTestId('ae-ammo-count-lb1')).toBeInTheDocument();
      expect(screen.queryByTestId('ae-use-ammo-lb1')).not.toBeInTheDocument();
    });
  });

  // Arcane Shot is read off the same card as the attack it rides on, so an archer doesn't have
  // to cross-reference a separate No Action entry mid-combat.
  describe('Arcane Shot on the bow attack card', () => {
    const longbowEntry = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing',
      properties: '["Ammunition", "Heavy", "Two-Handed"]', range: '150/600',
    };
    const crossbowEntry = {
      ...longbowEntry, uid: 'xb1', name: 'Heavy Crossbow',
      properties: '["Ammunition", "Heavy", "Two-Handed", "Loading"]',
    };
    const archer = (props = {}) => renderTab({
      charClass: 'Fighter', subclass: 'Arcane Archer', level: 7,
      scores: { strength: 10, dexterity: 18, intelligence: 16 },
      inventory: [longbowEntry],
      characterData: {
        subclass: 'Arcane Archer',
        arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow'],
      },
      ...props,
    });

    it('renders the block inside the bow attack card, not as its own entry', () => {
      archer();
      expect(screen.getByTestId(/^ae-arcane-shot-weapon:lb1/)).toBeInTheDocument();
      goToTab('no_action');
      expect(screen.queryByText('Arcane Shot')).not.toBeInTheDocument();
    });

    // The save DC is the at-a-glance combat state. The action cost is NOT shown: the block sits
    // inside the bow's ACTION card and rides on that same attack, so a "No Action" tag next to
    // it reads as a second, separate thing to spend.
    it('shows the save DC without expanding anything, and no action-cost tag', () => {
      archer();
      const block = screen.getByTestId(/^ae-arcane-shot-weapon:lb1/);
      expect(block).toHaveTextContent('Arcane Shot');
      expect(block).toHaveTextContent('14'); // 8 + PB 3 + INT +3
      expect(block).not.toHaveTextContent(/no action/i);
    });

    // "14" alone doesn't say whether a new Intelligence score has landed yet, so the DC opens
    // into its arithmetic like every other derived number on the sheet.
    it('expands the save DC into its calculation when clicked', () => {
      archer();
      const dc = screen.getByTestId(/^ae-arcane-shot-dc-weapon:lb1/);
      expect(dc).toHaveTextContent('14');
      expect(dc).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId(/^ae-arcane-shot-dc-breakdown-weapon:lb1/)).not.toBeInTheDocument();

      fireEvent.click(dc);
      const panel = screen.getByTestId(/^ae-arcane-shot-dc-breakdown-weapon:lb1/);
      expect(panel).toHaveTextContent('Base');
      expect(panel).toHaveTextContent('Proficiency bonus');
      expect(panel).toHaveTextContent('+3');
      expect(panel).toHaveTextContent('INT modifier');
      expect(panel).toHaveTextContent('Total');
      // A DC is a target number, not a bonus — it must not render as "+14".
      expect(panel).not.toHaveTextContent('+14');
    });

    it('collapses the save DC calculation again on a second click', () => {
      archer();
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-dc-weapon:lb1/));
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-dc-weapon:lb1/));
      expect(screen.queryByTestId(/^ae-arcane-shot-dc-breakdown-weapon:lb1/)).not.toBeInTheDocument();
    });

    // Superior Arcane Shot is written into the option's own text: a trailing "the damage
    // increases to 4d6" beside a description still saying 2d6 was being read as extra damage.
    it('shows the upgraded option text at level 18, with no appended improvement clause', () => {
      archer({ level: 18 });
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/));
      const bursting = screen.getByTestId('ae-arcane-shot-option-Bursting Arrow');
      expect(bursting).toHaveTextContent(/each take 4d6 force damage/);
      expect(bursting).not.toHaveTextContent(/2d6/);
      expect(bursting).not.toHaveTextContent(/increases to/);
    });

    it('shows the base option text below level 18', () => {
      archer({ level: 17 });
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/));
      expect(screen.getByTestId('ae-arcane-shot-option-Bursting Arrow'))
        .toHaveTextContent(/each take 2d6 force damage/);
    });

    // An archer knows up to six options, each a paragraph — expanded by default they would
    // bury every attack row below this card.
    it('collapses the options behind a toggle showing how many are known', () => {
      archer();
      const toggle = screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveTextContent('(2)');
      expect(screen.queryByTestId('ae-arcane-shot-option-Bursting Arrow')).not.toBeInTheDocument();
    });

    it('reveals every known option with its description when expanded', () => {
      archer();
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/));
      expect(screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/)).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('ae-arcane-shot-option-Bursting Arrow')).toHaveTextContent(/detonates/i);
      expect(screen.getByTestId('ae-arcane-shot-option-Shadow Arrow')).toHaveTextContent(/psychic/i);
    });

    it('collapses again on a second click', () => {
      archer();
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/));
      fireEvent.click(screen.getByTestId(/^ae-arcane-shot-toggle-weapon:lb1/));
      expect(screen.queryByTestId('ae-arcane-shot-option-Bursting Arrow')).not.toBeInTheDocument();
    });

    it('spends a use from inside the block', () => {
      const onChange = vi.fn();
      archer({ onChange });
      fireEvent.click(screen.getByRole('button', { name: /Use Arcane Shot/i }));
      fireEvent.click(screen.getByTestId(/^ae-arcane-weapon:lb1.*-use-confirm-button$/));
      expect(onChange).toHaveBeenCalledWith({ arcane_shot_used: 1 });
    });

    it('prompts to pick options when none are chosen', () => {
      archer({ characterData: { subclass: 'Arcane Archer' } });
      expect(screen.getByTestId(/^ae-arcane-shot-weapon:lb1/)).toHaveTextContent(/no options chosen yet/i);
    });

    it('does not attach to a crossbow — that archer keeps the standalone entry', () => {
      archer({ inventory: [crossbowEntry] });
      expect(screen.queryByTestId(/^ae-arcane-shot-/)).not.toBeInTheDocument();
      goToTab('no_action');
      expect(screen.getByText('Arcane Shot')).toBeInTheDocument();
    });

    it('shows nothing for a Champion holding the same longbow', () => {
      archer({ subclass: 'Champion', characterData: { subclass: 'Champion' } });
      expect(screen.queryByTestId(/^ae-arcane-shot-/)).not.toBeInTheDocument();
    });
  });

  // "Does this attack overcome resistance to nonmagical damage?" — answered on the attack card,
  // naming the source so the player knows when it stops applying.
  describe('magical attack tag', () => {
    const longbow = {
      uid: 'lb1', category: 'weapons', equipped: true, name: 'Longbow',
      weapon_category: 'Martial', weapon_type: 'Ranged', damage: '1d8', damage_type: 'Piercing',
      properties: '["Ammunition", "Heavy", "Two-Handed"]', range: '150/600',
    };
    const dagger = {
      uid: 'dg1', category: 'weapons', equipped: true, name: 'Dagger',
      weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', damage_type: 'Piercing',
      properties: '["Finesse", "Light", "Thrown"]',
    };
    const archer = (props = {}) => renderTab({
      charClass: 'Fighter', subclass: 'Arcane Archer', level: 7,
      scores: { strength: 10, dexterity: 18, intelligence: 16 },
      inventory: [longbow, dagger],
      characterData: { subclass: 'Arcane Archer' },
      ...props,
    });

    it('tags the bow with its source and leaves the dagger untagged', () => {
      archer();
      expect(screen.getByTestId('ae-magical-weapon:lb1:0')).toHaveTextContent('Magic · Magic Arrow');
      expect(screen.queryByTestId('ae-magical-weapon:dg1:1')).not.toBeInTheDocument();
    });

    // Click, not hover — a tooltip is unreachable on touch and unreadable at a glance.
    it('reveals the rule text on click and hides it again', () => {
      archer();
      const tag = screen.getByTestId('ae-magical-weapon:lb1:0');
      expect(tag).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId('ae-magical-weapon:lb1:0-note')).not.toBeInTheDocument();
      fireEvent.click(tag);
      expect(tag).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('ae-magical-weapon:lb1:0-note'))
        .toHaveTextContent(/overcoming resistance and immunity to nonmagical/i);
      fireEvent.click(tag);
      expect(screen.queryByTestId('ae-magical-weapon:lb1:0-note')).not.toBeInTheDocument();
    });

    // The mechanics link lives inside the tag, so it appears only where the tag does.
    it('offers the mechanics page from the expanded note, and only then', () => {
      archer();
      expect(screen.queryByTestId('ae-magical-weapon:lb1:0-learn-more')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('ae-magical-weapon:lb1:0'));
      expect(screen.getByTestId('ae-magical-weapon:lb1:0-learn-more')).toHaveAttribute(
        'href',
        '/campaigns/1/encyclopedia/mechanics/magical-attacks'
      );
    });

    it('is absent before the feature level', () => {
      archer({ level: 6 });
      expect(screen.queryByTestId(/^ae-magical-/)).not.toBeInTheDocument();
    });

    it('is absent for a Champion holding the same longbow', () => {
      archer({ subclass: 'Champion', characterData: { subclass: 'Champion' } });
      expect(screen.queryByTestId(/^ae-magical-/)).not.toBeInTheDocument();
    });
  });
});

// QA: Unleash Incarnation lived in the No Action tab, where it was hard to find — you reach
// for it in the middle of taking the Attack action, so it belongs on the attack card itself.
describe('ActionEconomyTab — Unleash Incarnation on the melee attack card', () => {
  const echoKnight = (props = {}) => renderTab({
    charClass: 'Fighter', subclass: 'Echo Knight', level: 5,
    scores: { strength: 16, dexterity: 12, constitution: 16 },
    inventory: [longswordEntry],
    characterData: { subclass: 'Echo Knight' },
    ...props,
  });

  it('renders the block inside the melee attack card, not as its own No Action entry', () => {
    echoKnight();
    const block = screen.getByTestId(/^ae-attached-unleash-incarnation-weapon:w1/);
    expect(block).toHaveTextContent('Unleash Incarnation');
    expect(block).toHaveTextContent(/additional melee attack with Longsword/);
    goToTab('no_action');
    expect(screen.queryByText('Unleash Incarnation')).not.toBeInTheDocument();
  });

  it('shows the remaining uses inside the block', () => {
    // CON 16 → +3 uses per long rest, one already spent.
    echoKnight({ characterData: { subclass: 'Echo Knight', unleash_incarnation_used: 1 } });
    expect(screen.getByTestId(/^ae-attached-unleash-incarnation-weapon:w1/))
      .toHaveTextContent('2 / 3 remaining');
  });

  it('spends a use from inside the block', () => {
    const onChange = vi.fn();
    echoKnight({ onChange });
    fireEvent.click(screen.getByRole('button', { name: /Use Unleash Incarnation/i }));
    fireEvent.click(screen.getByTestId('ae-attached-unleash-incarnation-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ unleash_incarnation_used: 1 });
  });

  it('attaches to every melee attack card when two weapons are equipped', () => {
    echoKnight({ inventory: [longswordEntry, greatswordEntry] });
    expect(screen.getByTestId(/^ae-attached-unleash-incarnation-weapon:w1/)).toBeInTheDocument();
    expect(screen.getByTestId(/^ae-attached-unleash-incarnation-weapon:gs1/)).toBeInTheDocument();
  });

  it('is absent for another Fighter subclass', () => {
    echoKnight({ subclass: 'Champion', characterData: { subclass: 'Champion' } });
    expect(screen.queryByTestId(/^ae-attached-unleash-incarnation/)).not.toBeInTheDocument();
  });

  // The app's FIRST active effect. The toggle lives on the card whose action starts it, because
  // activating it IS the action.
  describe("Giant's Might — the active-effect toggle", () => {
    const runeKnight = (props = {}) => renderTab({
      subclass: 'Rune Knight', level: 10,
      characterData: { subclass: 'Rune Knight' },
      onChange: vi.fn(),
      ...props,
    });

    const openBonus = () => goToTab('bonus');

    it('renders the toggle on the card, reading Not active by default', () => {
      runeKnight();
      openBonus();
      expect(screen.getByTestId("ae-effect-giants_might-subclass:Giant's Might")).toHaveTextContent('Not active');
      expect(screen.getByTestId('ae-effect-start-giants_might')).toBeInTheDocument();
    });

    it('shows the remaining uses of the pool beside it', () => {
      // PB at level 10 is 4.
      runeKnight();
      openBonus();
      expect(screen.getByTestId('ae-effect-uses-giants_might')).toHaveTextContent('4 / 4');
    });

    it('spends a use AND switches the effect on in ONE patch', () => {
      // Two patches could leave a spent charge with no effect running — the trap the single
      // patch exists to prevent.
      const onChange = vi.fn();
      runeKnight({ onChange });
      openBonus();
      fireEvent.click(screen.getByTestId('ae-effect-start-giants_might'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        active_effects: ['giants_might'],
        giants_might_used: 1,
      });
    });

    it('offers End — and ending never refunds the use', () => {
      const onChange = vi.fn();
      runeKnight({
        characterData: { subclass: 'Rune Knight', active_effects: ['giants_might'], giants_might_used: 1 },
        onChange,
      });
      openBonus();
      expect(screen.getByTestId("ae-effect-giants_might-subclass:Giant's Might")).toHaveTextContent('Active now');
      fireEvent.click(screen.getByTestId('ae-effect-end-giants_might'));
      expect(onChange).toHaveBeenCalledWith({ active_effects: [] });
    });

    it('cannot be started with no uses left', () => {
      runeKnight({
        characterData: { subclass: 'Rune Knight', giants_might_used: 4 },
      });
      openBonus();
      expect(screen.getByTestId('ae-effect-start-giants_might')).toBeDisabled();
    });

    it('is read-only for a viewer who cannot edit', () => {
      runeKnight({ readOnly: true });
      openBonus();
      expect(screen.getByTestId('ae-effect-start-giants_might')).toBeDisabled();
    });

    it('does not also show the standard Use control — the toggle owns the spend', () => {
      runeKnight();
      openBonus();
      expect(screen.queryByTestId('ae-rest-use-giants_might_used')).not.toBeInTheDocument();
    });

    it('shows no toggle for a subclass without an active effect', () => {
      renderTab({ subclass: 'Champion', level: 10, characterData: { subclass: 'Champion' } });
      goToTab('bonus');
      expect(screen.queryByTestId(/^ae-effect-/)).not.toBeInTheDocument();
    });
  });
});

// "Calculate the total damage" — the arithmetic a player would otherwise do mid-turn. It sits at
// CARD level under the printed damage, never folded INTO it: the printed string has to stay true
// for an ordinary swing, and every term in the total is conditional.
describe('ActionEconomyTab — "on a hit" damage total on the attack card', () => {
  const runeKnight = (props = {}) => renderTab({
    charClass: 'Fighter', subclass: 'Rune Knight', level: 7,
    scores: { strength: 16, dexterity: 12, constitution: 14 },
    inventory: [longswordEntry],
    characterData: {
      subclass: 'Rune Knight',
      runes: ['Fire Rune'],
      rune_items: { 'Fire Rune': 'w1' },
      inventory: [longswordEntry],
    },
    ...props,
  });

  // The weapon entry key carries an index suffix (weapon:w1:0), so match on the prefix.
  const total = () => screen.getByTestId(/^ae-damage-total-weapon:w1/);

  it('shows the combined damage on the card, under the printed damage', () => {
    runeKnight();
    expect(total()).toHaveTextContent(/On a hit:/);
    expect(total()).toHaveTextContent(/2d6 fire/);
  });

  it('leaves the printed damage alone — it must stay true for an ordinary swing', () => {
    runeKnight();
    const printed = screen.getByTestId(/^ae-damage-weapon:w1/);
    expect(printed).toHaveTextContent('1d8');
    expect(printed).not.toHaveTextContent(/fire/i);
  });

  // The total is what you read mid-swing; the rune's rules paragraph is reference you need once.
  // If a later edit pushes the number back down into the rider block, this fails.
  it('puts the total at the top of the card, ABOVE the Fire Rune block', () => {
    runeKnight();
    const totalEl = total();
    const block = screen.getByTestId(/^ae-attached-fire-rune-weapon:w1/);
    expect(totalEl.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });

  it('names each source, so a grown total does not read as a bug in the weapon damage', () => {
    runeKnight();
    expect(total()).toHaveTextContent(/\(weapon\)/);
    expect(total()).toHaveTextContent(/\(Fire Rune\)/);
  });

  it("includes Giant's Might while the effect is switched on", () => {
    runeKnight({
      characterData: {
        subclass: 'Rune Knight',
        runes: ['Fire Rune'],
        rune_items: { 'Fire Rune': 'w1' },
        inventory: [longswordEntry],
        active_effects: ['giants_might'],
      },
    });
    expect(total()).toHaveTextContent(/1d6/);
    expect(total()).toHaveTextContent(/\(Giant's Might\)/);
  });

  it("excludes Giant's Might while it is off", () => {
    runeKnight();
    expect(total()).not.toHaveTextContent(/Giant's Might/);
  });

  it('shows no total when nothing adds damage', () => {
    renderTab({
      charClass: 'Fighter', subclass: 'Echo Knight', level: 5,
      scores: { strength: 16, constitution: 16 },
      inventory: [longswordEntry],
      characterData: { subclass: 'Echo Knight' },
    });
    expect(screen.queryByTestId(/^ae-damage-total-/)).not.toBeInTheDocument();
  });
});
