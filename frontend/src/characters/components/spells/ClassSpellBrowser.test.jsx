import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClassSpellBrowser, { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import encyclopediaService from '@/encyclopedia/encyclopediaService';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: { getSpells: vi.fn() },
}));

// The browser reads the campaign's edition from context so it requests that edition's
// spell text (a 2024 campaign gets the 2024 Blade Ward, not the 2014 one).
let mockEdition = '5e';
vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 42, edition: mockEdition } }),
}));

const MOCK_SPELLS = [
  { id: 1, name: 'Cure Wounds',   level: 1, classes: 'Cleric, Druid', ritual: false, concentration: false,
    school: 'Evocation', casting_time: '1 action', range: 'Touch',
    description: 'A creature you touch regains hit points equal to 1d8 plus your spellcasting ability modifier.' },
  { id: 2, name: 'Bless',         level: 1, classes: 'Cleric, Paladin', ritual: false, concentration: true },
  { id: 3, name: 'Zone of Truth', level: 2, classes: 'Cleric, Paladin', ritual: true, concentration: false },
  { id: 4, name: 'Fireball',      level: 3, classes: 'Sorcerer, Wizard', ritual: false, concentration: false,
    school: 'Evocation' },
  { id: 5, name: 'Detect Magic',  level: 1, classes: 'Cleric, Bard', ritual: true, concentration: false },
  { id: 6, name: 'Fire Bolt',     level: 0, classes: 'Sorcerer, Wizard', ritual: false, concentration: false },
  { id: 7, name: 'Shield',        level: 1, classes: 'Sorcerer, Wizard', ritual: false, concentration: false,
    school: 'Abjuration', casting_time: '1 reaction', range: 'Self',
    description: 'An invisible barrier of magical force appears and protects you, granting +5 AC until the start of your next turn.' },
  { id: 8, name: 'Charm Person',  level: 1, classes: 'Bard, Wizard', ritual: false, concentration: true,
    school: 'Enchantment' },
];

function browser(props = {}) {
  return render(<ClassSpellBrowser
    className="Cleric"
    campaignId={1}
    preparedSpells={[]}
    prepareLimit={5}
    onAdd={vi.fn()}
    onRemove={vi.fn()}
    {...props}
  />);
}

beforeEach(() => {
  mockEdition = '5e';
  encyclopediaService.getSpells.mockResolvedValue(MOCK_SPELLS);
});

describe('ClassSpellBrowser', () => {
  it('shows loading state initially', () => {
    browser();
    expect(screen.getByText('Loading spells…')).toBeInTheDocument();
  });

  it('filters spells to the specified class', async () => {
    browser({ className: 'Cleric' });
    // Cleric spells: Cure Wounds, Bless, Zone of Truth, Detect Magic (NOT Fireball)
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    expect(screen.getByText('Bless')).toBeInTheDocument();
    expect(screen.getByText('Zone of Truth')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
  });

  it('filters spells to maxSpellLevel', async () => {
    browser({ className: 'Cleric', maxSpellLevel: 1 });
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    // Zone of Truth (level 2) should be hidden when maxSpellLevel=1
    expect(screen.queryByText('Zone of Truth')).not.toBeInTheDocument();
  });

  it("requests the campaign's edition — a 2024 campaign gets 2024 spell text", async () => {
    mockEdition = '5.5e';
    browser({ campaignId: 42 });
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith(42, '5.5e'));
  });

  it('calls getSpells with the campaignId', async () => {
    browser({ campaignId: 42 });
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith(42, '5e'));
  });

  it('calls onAdd when + Prepare button clicked', async () => {
    const onAdd = vi.fn();
    browser({ onAdd });
    await waitFor(() => expect(screen.getAllByRole('button', { name: '+ Prepare' }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: '+ Prepare' })[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when Remove button clicked for prepared spell', async () => {
    const onRemove = vi.fn();
    browser({ preparedSpells: ['Cure Wounds'], onRemove });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledWith('Cure Wounds');
  });

  it('shows lock banner when player is locked', async () => {
    browser({ locked: true, isGm: false });
    await waitFor(() => expect(screen.getByText(/Spells prepared for today/)).toBeInTheDocument());
  });

  it('shows Prepare for Today when unlocked and not GM', async () => {
    browser({ locked: false, isGm: false });
    await waitFor(() => expect(screen.getByRole('button', { name: /Prepare for Today/ })).toBeInTheDocument());
  });

  it('calls onLock when Prepare for Today clicked', async () => {
    const onLock = vi.fn();
    browser({ locked: false, isGm: false, onLock });
    await waitFor(() => fireEvent.click(screen.getByRole('button', { name: /Prepare for Today/ })));
    expect(onLock).toHaveBeenCalled();
  });

  it('shows GM unlock button when locked', async () => {
    browser({ locked: true, isGm: true });
    await waitFor(() => expect(screen.getByRole('button', { name: /Unlock.*Long Rest/i })).toBeInTheDocument());
  });

  it('calls onUnlock when GM unlock button clicked', async () => {
    const onUnlock = vi.fn();
    browser({ locked: true, isGm: true, onUnlock });
    await waitFor(() => fireEvent.click(screen.getByRole('button', { name: /Unlock.*Long Rest/i })));
    expect(onUnlock).toHaveBeenCalled();
  });

  it('search filter narrows spell list', async () => {
    browser();
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search spells…'), { target: { value: 'cure' } });
    expect(screen.getByText('Cure Wounds')).toBeInTheDocument();
    expect(screen.queryByText('Bless')).not.toBeInTheDocument();
  });

  it('shows encyclopedia link', async () => {
    browser({ campaignId: 7 });
    await waitFor(() => expect(screen.getByText(/Browse all spells in the Encyclopedia/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Browse all spells in the Encyclopedia/ })).toHaveAttribute('href', '/campaigns/7/encyclopedia');
  });

  it('+ Prepare buttons disabled when at limit', async () => {
    browser({ preparedSpells: ['Cure Wounds', 'Bless', 'Zone of Truth', 'Detect Magic', 'Fireball'], prepareLimit: 5 });
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Prepare/ }).length).toBeGreaterThan(0));
    const prepareButtons = screen.queryAllByRole('button', { name: '+ Prepare' });
    prepareButtons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('shows the spell description and school/time/range meta on each row', async () => {
    browser();
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    expect(screen.getByTestId('spell-desc-1')).toHaveTextContent(/regains hit points/);
    expect(screen.getByText('Evocation · 1 action · Touch')).toBeInTheDocument();
    // A spell with no description/meta renders neither (no crash, no empty line).
    expect(screen.queryByTestId('spell-desc-2')).not.toBeInTheDocument();
  });

  it('clicking anywhere on the spell row toggles the clamped description to full text', async () => {
    browser();
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    const desc = screen.getByTestId('spell-desc-1');
    expect(desc).toHaveClass('line-clamp-2');
    // The whole row is the toggle (role=button with aria-expanded).
    const row = screen.getByRole('button', { name: /Cure Wounds/, expanded: false });
    fireEvent.click(row);
    expect(screen.getByTestId('spell-desc-1')).not.toHaveClass('line-clamp-2');
    fireEvent.click(screen.getByRole('button', { name: /Cure Wounds/, expanded: true }));
    expect(screen.getByTestId('spell-desc-1')).toHaveClass('line-clamp-2');
  });

  it('the add button does not toggle the description (stopPropagation)', async () => {
    const onAdd = vi.fn();
    browser({ onAdd });
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: '+ Prepare' })[0]);
    expect(onAdd).toHaveBeenCalled();
    // Every row still collapsed.
    expect(screen.getByTestId('spell-desc-1')).toHaveClass('line-clamp-2');
  });

  it('a granted spell shows the granted badge instead of an add button', async () => {
    const onAdd = vi.fn();
    browser({
      mode: 'learn', className: 'Wizard', minSpellLevel: 0, maxSpellLevel: 0,
      grantedSpells: ['Fire Bolt'], grantedLabel: 'Granted by your race', onAdd,
    });
    await waitFor(() => expect(screen.getByText('Fire Bolt')).toBeInTheDocument());
    expect(screen.getByTestId('spell-granted-6')).toHaveTextContent('Granted by your race');
    // No Learn button on the granted row — clicking the row only expands, never adds.
    const row = screen.getByRole('button', { name: /Fire Bolt/ });
    expect(row.querySelector('button')).toBeNull();
    fireEvent.click(row);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows empty state when no spells match search', async () => {
    browser();
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search spells…'), { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No spells match your search.')).toBeInTheDocument();
  });
});

describe('ClassSpellBrowser — learn mode (known casters / Eldritch Knight)', () => {
  it('hides the prepare/lock UI and uses + Learn buttons', async () => {
    browser({ mode: 'learn', className: 'Wizard', locked: true, isGm: false });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    expect(screen.queryByText(/Spells prepared for today/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Prepare for Today/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '+ Learn' }).length).toBeGreaterThan(0);
    // Learn mode ignores the daily-prep lock — the buttons stay enabled.
    expect(screen.getAllByRole('button', { name: '+ Learn' })[0]).not.toBeDisabled();
  });

  it('minSpellLevel=0/maxSpellLevel=0 renders a cantrip-only picker with a Cantrips header', async () => {
    browser({ mode: 'learn', className: 'Wizard', minSpellLevel: 0, maxSpellLevel: 0 });
    await waitFor(() => expect(screen.getByText('Fire Bolt')).toBeInTheDocument());
    expect(screen.getByText('Cantrips')).toBeInTheDocument();
    expect(screen.queryByText('Shield')).not.toBeInTheDocument();   // level 1 excluded
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument(); // level 3 excluded
    // Single-level range → no level filter dropdown.
    expect(screen.queryByText('All Levels')).not.toBeInTheDocument();
  });

  it('default (prepare) mode still excludes cantrips', async () => {
    browser({ className: 'Wizard', maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    expect(screen.queryByText('Fire Bolt')).not.toBeInTheDocument();
  });

  it('null prepareLimit shows a plain count and never hits the limit', async () => {
    browser({ mode: 'learn', className: 'Wizard', prepareLimit: null, preparedSpells: ['Shield'] });
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    expect(screen.getByText(/1 spells chosen/)).toBeInTheDocument();
    screen.getAllByRole('button', { name: '+ Learn' }).forEach(btn => expect(btn).not.toBeDisabled());
  });
});

describe('maxCastableLevel', () => {
  it('returns 0 for all-zero slot array', () => {
    expect(maxCastableLevel([0, 0, 0, 0, 0])).toBe(0);
  });

  it('returns highest level with at least one slot', () => {
    expect(maxCastableLevel([4, 3, 2, 0, 0])).toBe(3);
    expect(maxCastableLevel([4, 3, 3, 3, 1])).toBe(5);
  });

  it('returns 1 for only level 1 slots', () => {
    expect(maxCastableLevel([2, 0, 0, 0, 0])).toBe(1);
  });
});

describe('schools filter (5e Eldritch Knight)', () => {
  it('offers only spells of the given schools', async () => {
    browser({ className: 'Wizard', schools: ['Abjuration', 'Evocation'], maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument()); // Abjuration
    expect(screen.getByText('Fireball')).toBeInTheDocument();                    // Evocation
    expect(screen.queryByText('Charm Person')).not.toBeInTheDocument();          // Enchantment — not a legal pick
  });

  it('offers the whole class list when no schools are given (the any-school slot / 2024 EK)', async () => {
    browser({ className: 'Wizard', maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Charm Person')).toBeInTheDocument());
    expect(screen.getByText('Shield')).toBeInTheDocument();
  });

  it('matches schools case-insensitively', async () => {
    browser({ className: 'Wizard', schools: ['abjuration'], maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
  });
});

describe('school filter dropdown', () => {
  it('offers exactly the restricted pair on a school-restricted picker', async () => {
    browser({ className: 'Wizard', schools: ['Abjuration', 'Evocation'], maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByTestId('spell-school-filter')).toBeInTheDocument());
    const opts = [...screen.getByTestId('spell-school-filter').options].map(o => o.textContent);
    expect(opts).toEqual(['All Schools', 'Abjuration', 'Evocation']);
  });

  it('offers every school present in the list on an unrestricted picker', async () => {
    browser({ className: 'Wizard', maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByTestId('spell-school-filter')).toBeInTheDocument());
    const opts = [...screen.getByTestId('spell-school-filter').options].map(o => o.textContent);
    // Wizard spells in the fixture: Shield (Abj), Fireball (Evo), Charm Person (Ench).
    expect(opts).toEqual(['All Schools', 'Abjuration', 'Enchantment', 'Evocation']);
  });

  it('is hidden on a cantrip-only picker — leveled spells only', async () => {
    browser({ className: 'Wizard', minSpellLevel: 0, maxSpellLevel: 0 });
    await waitFor(() => expect(screen.getByText('Fire Bolt')).toBeInTheDocument());
    expect(screen.queryByTestId('spell-school-filter')).not.toBeInTheDocument();
  });

  it('narrows the visible spells to the chosen school', async () => {
    browser({ className: 'Wizard', maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('spell-school-filter'), { target: { value: 'Abjuration' } });
    expect(screen.getByText('Shield')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
    expect(screen.queryByText('Charm Person')).not.toBeInTheDocument();
    // Back to All Schools restores the full list.
    fireEvent.change(screen.getByTestId('spell-school-filter'), { target: { value: '' } });
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('cannot widen past the legal set — filtering a restricted picker still hides off-school spells', async () => {
    browser({ className: 'Wizard', schools: ['Abjuration', 'Evocation'], maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('spell-school-filter'), { target: { value: 'Evocation' } });
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.queryByText('Charm Person')).not.toBeInTheDocument();
  });

  it('is hidden when only one school is available (nothing to filter)', async () => {
    browser({ className: 'Wizard', schools: ['Abjuration'], maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    expect(screen.queryByTestId('spell-school-filter')).not.toBeInTheDocument();
  });

  it('empty state names the filtered school', async () => {
    // The school options are derived from the spells actually present, so a school on its own
    // can never come up empty — it takes a school + level pair that nothing satisfies.
    // (Wizard fixture: the only Enchantment spell is level 1, so Enchantment + level 3 is empty.)
    browser({ className: 'Wizard', maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Charm Person')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('spell-school-filter'), { target: { value: 'Enchantment' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } }); // level filter
    expect(screen.getByText(/No Enchantment spells available/)).toBeInTheDocument();
  });
});

describe('lockedSpells (a chosen spell you may not give up right now)', () => {
  it('shows Locked instead of Remove, and offers no way to drop it', async () => {
    const onRemove = vi.fn();
    browser({ className: 'Wizard', preparedSpells: ['Shield'], lockedSpells: ['Shield'], onRemove, maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    expect(screen.getByTestId('spell-locked-7')).toHaveTextContent('Locked');
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('an unlocked chosen spell still shows Remove', async () => {
    browser({ className: 'Wizard', preparedSpells: ['Shield'], maxSpellLevel: 3 });
    await waitFor(() => expect(screen.getByText('Shield')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    expect(screen.queryByTestId('spell-locked-7')).not.toBeInTheDocument();
  });
});
