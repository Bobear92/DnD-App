import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionEconomyTab from './ActionEconomyTab';

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
  );
}

describe('ActionEconomyTab', () => {
  beforeEach(() => {
    encyclopediaService.getSpells.mockClear();
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

  it('flags disadvantage on a Heavy weapon for a Small (5e) character', () => {
    renderTab({ inventory: [greatswordEntry], race: 'Halfling' });
    expect(screen.getByText('Greatsword')).toBeInTheDocument();
    // The weapon's own detail line carries the disadvantage flag (scoped to avoid the
    // universal Dodge action, whose description also mentions "disadvantage").
    expect(screen.getByText(/2d6.*·\s*disadvantage/i)).toBeInTheDocument();
    // …and the full amber warning message is shown under the entry.
    expect(screen.getByText(/Small creatures attack with it at disadvantage/i)).toBeInTheDocument();
  });

  it('shows the Extra Attack note for a level 5 Fighter', () => {
    renderTab();
    expect(screen.getByTestId('ae-attacks-per-action')).toHaveTextContent('2 attacks');
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
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith(1));
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
});
