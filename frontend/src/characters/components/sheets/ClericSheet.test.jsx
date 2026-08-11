import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClericSheet from '@/characters/components/sheets/ClericSheet';

/**
 * Cleric (5e) is the vertical slice for the unified Spells tab: the first HAND-WRITTEN sheet to
 * delegate its spells section to the shared CasterSpellBlock. These tests pin the two things that
 * conversion could silently break:
 *   1. the unified level strip actually renders (and folds racial + feat spells into it), and
 *   2. Channel Divinity — a spell-adjacent tracker that lived INSIDE the old spells section —
 *      is still there, and still absent from the Features section.
 */

vi.mock('react-router-dom', () => ({
  // SubclassDetails reads campaignId from the URL for its encyclopedia link; no route here.
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 1, edition: '5e' } }),
}));

vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: { getSpells: vi.fn() },
}));

import encyclopediaService from '@/encyclopedia/encyclopediaService';

// The strip reads each spell's level from the compendium, so the catalog must resolve for it to
// appear (it falls back to a flat stacked list until then — see SpellSourceLevelView).
const CATALOG = [
  { name: 'Sacred Flame', level: 0, classes: 'Cleric' },
  { name: 'Guidance', level: 0, classes: 'Cleric' },
  { name: 'Bless', level: 1, classes: 'Cleric' },
  { name: 'Cure Wounds', level: 1, classes: 'Cleric' },
  { name: 'Spiritual Weapon', level: 2, classes: 'Cleric' },
  { name: 'Misty Step', level: 2, classes: 'Wizard' },
];

const BASE_DATA = {
  cantrips: ['Sacred Flame'],
  prepared_spells: ['Bless', 'Spiritual Weapon'],
  spell_slots: { 1: { total: 4, used: 0 } },
  hp_max: 8,
  current_hp: 8,
  subclass: 'Life Domain',
  channel_divinity_used: 0,
};

function sheet(section, extraProps = {}) {
  return render(
    <ClericSheet
      data={BASE_DATA}
      level={5}
      section={section}
      campaignId={1}
      abilityScores={{ wisdom: 16 }}
      readOnly
      {...extraProps}
    />,
  );
}

beforeEach(() => {
  encyclopediaService.getSpells.mockResolvedValue(CATALOG);
});

describe('ClericSheet — unified Spells tab layout', () => {
  it('renders the shared level strip with a tab per level the character has spells at', async () => {
    sheet('spells');
    // Cantrips (Sacred Flame) + 1st (Bless) + 2nd (Spiritual Weapon)
    expect(await screen.findByTestId('spell-level-tab-0')).toBeInTheDocument();
    expect(screen.getByTestId('spell-level-tab-1')).toBeInTheDocument();
    expect(screen.getByTestId('spell-level-tab-2')).toBeInTheDocument();
    // Nothing at 3rd — no tab for an empty level
    expect(screen.queryByTestId('spell-level-tab-3')).not.toBeInTheDocument();
  });

  it('counts the spells at each level in the strip', async () => {
    sheet('spells');
    expect(await screen.findByTestId('spell-level-tab-1')).toHaveTextContent('1st (1)');
  });

  it('switching level tabs swaps which prepared spells are listed', async () => {
    sheet('spells');
    // Anchor on the STRIP, not on a spell name: until the catalog resolves the block renders a flat
    // fallback, so a name found there is torn out by the re-render that builds the strip.
    await screen.findByTestId('spell-level-tab-0');
    // Defaults to the lowest present level (cantrips)
    expect(screen.getByText('Sacred Flame')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('spell-level-tab-2'));
    expect(screen.getByText('Spiritual Weapon')).toBeInTheDocument();
    expect(screen.queryByText('Bless')).not.toBeInTheDocument();
  });

  it('folds race-granted cantrips into the strip as a per-level source toggle', async () => {
    sheet('spells', { raceGrantedCantrips: ['Guidance'] });
    // Cantrip level now has two sources — Class and Racial
    expect(await screen.findByTestId('spell-source-class')).toBeInTheDocument();
    expect(screen.getByTestId('spell-source-racial')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('spell-source-racial'));
    expect(await screen.findByText('Guidance')).toBeInTheDocument();
  });

  it('folds feat-granted spells into the strip at their own level', async () => {
    sheet('spells', { featSpells: { cantrips: [], leveled: [{ name: 'Misty Step', level: 2 }] } });
    fireEvent.click(await screen.findByTestId('spell-level-tab-2'));
    expect(await screen.findByTestId('spell-source-feats')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('spell-source-feats'));
    expect(await screen.findByText('Misty Step')).toBeInTheDocument();
  });

  it('shows no source toggle at a level where only the class has spells', async () => {
    sheet('spells', { raceGrantedCantrips: ['Guidance'] });
    fireEvent.click(await screen.findByTestId('spell-level-tab-1'));
    expect(screen.queryByTestId('spell-source-racial')).not.toBeInTheDocument();
  });
});

describe('ClericSheet — Channel Divinity survives the delegation', () => {
  it('renders inside the spells section', async () => {
    sheet('spells');
    expect(await screen.findByText('Channel Divinity (Short Rest)')).toBeInTheDocument();
  });

  it('shows remaining uses (2 at level 6+, 1 below)', async () => {
    sheet('spells', { level: 6 });
    expect(await screen.findByText('2 / 2 remaining')).toBeInTheDocument();
  });

  it('still renders its own separate copy in the features section', () => {
    // Pre-existing behaviour, deliberately preserved: the Cleric sheet showed a Channel Divinity
    // tracker in BOTH the Features and the Spells section before the spells section was delegated
    // to CasterSpellBlock. Delegation must not quietly drop either one.
    sheet('features');
    expect(screen.getByText('Channel Divinity (Short Rest)')).toBeInTheDocument();
  });

  it('renders exactly one tracker within the spells section', async () => {
    sheet('spells');
    expect(await screen.findByText('Channel Divinity (Short Rest)')).toBeInTheDocument();
    expect(screen.getAllByText('Channel Divinity (Short Rest)')).toHaveLength(1);
  });
});

describe('ClericSheet — prepare-from-class-list flow', () => {
  it('shows the prepare limit (level + WIS mod) on the prepared list', async () => {
    // WIS 16 → +3, level 5 → limit 8; 2 prepared. The prepared list (and so its limit label) lives
    // on the LEVELED tabs — the cantrip tab shows cantrips — matching the Wizard/EK layout.
    sheet('spells');
    fireEvent.click(await screen.findByTestId('spell-level-tab-1'));
    expect(await screen.findByText(/2\/8/)).toBeInTheDocument();
  });

  it('renders the class-list browser on the Prepare Spells sub-tab', async () => {
    sheet('spells', { readOnly: false });
    fireEvent.click(await screen.findByRole('button', { name: 'Prepare Spells' }));
    // The browser prepares from the whole Cleric list — it fetches the compendium itself.
    expect(await screen.findByText('Cure Wounds')).toBeInTheDocument();
  });

  it('a player casting from a slot gets no GM steppers, only the casting note', async () => {
    sheet('spells', { readOnly: false });
    expect(await screen.findByTestId('slot-tracker-note')).toBeInTheDocument();
    expect(screen.queryByTestId('slot-dec-1')).not.toBeInTheDocument();
  });

  it('the GM gets slot steppers that patch spell_slots', async () => {
    const onChange = vi.fn();
    sheet('spells', { readOnly: false, isGm: true, onChange });
    fireEvent.click(await screen.findByTestId('slot-dec-1'));
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 1: { total: 4, used: 1 } } });
  });
});

describe('ClericSheet — section routing is unchanged', () => {
  it('spells section does not render class features', () => {
    sheet('spells');
    expect(screen.queryByText('Class Features')).not.toBeInTheDocument();
  });

  it('features section does not render the spell slot grid', () => {
    sheet('features');
    expect(screen.queryByText('Spell Slots (Long Rest)')).not.toBeInTheDocument();
  });

  it('features section still renders class features', () => {
    sheet('features');
    expect(screen.getByText('Class Features')).toBeInTheDocument();
  });
});
