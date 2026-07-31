import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SpellList from '@/characters/components/spells/SpellList';

let mockEdition = '5e';
vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 42, edition: mockEdition } }),
}));

const CATALOG = [
  {
    name: 'Eldritch Blast', level: 0, school: 'Evocation',
    casting_time: '1 action', range: '120 feet', components: 'V, S',
    duration: 'Instantaneous', description: 'A beam of crackling energy.', classes: 'Warlock',
  },
  {
    name: 'Burning Hands', level: 1, school: 'Evocation',
    casting_time: '1 action', range: 'Self', components: 'V, S',
    duration: 'Instantaneous', description: 'A sheet of flames scorches.', classes: 'Sorcerer, Wizard',
  },
  {
    name: 'Magic Missile', level: 1, school: 'Evocation',
    casting_time: '1 action', range: '120 feet', components: 'V, S',
    duration: 'Instantaneous', description: 'Three glowing darts strike.', classes: 'Sorcerer, Wizard',
    higher_level: 'Creates one more dart for each slot level above 1st.',
  },
  {
    name: 'Fireball', level: 3, school: 'Evocation',
    casting_time: '1 action', range: '150 feet', components: 'V, S, M',
    duration: 'Instantaneous',
    description: 'Each creature in a 20-foot-radius sphere must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save.',
    higher_level: 'When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.',
    classes: 'Sorcerer, Wizard',
  },
  {
    name: 'Shield', level: 1, school: 'Abjuration',
    casting_time: '1 reaction', range: 'Self', components: 'V, S',
    duration: '1 round', description: 'An invisible barrier of magical force appears. You have a +5 bonus to AC.',
    classes: 'Sorcerer, Wizard',
  },
  {
    name: 'Fire Bolt', level: 0, school: 'Evocation',
    casting_time: '1 action', range: '120 feet', components: 'V, S', duration: 'Instantaneous',
    description: "Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage.\n\nThis spell's damage increases by 1d10 when you reach 5th level (2d10), 11th level (3d10), and 17th level (4d10).",
    classes: 'Sorcerer, Wizard',
  },
  {
    name: 'Sacred Flame', level: 0, school: 'Evocation',
    casting_time: '1 action', range: '60 feet', components: 'V, S', duration: 'Instantaneous',
    description: "The target must succeed on a dexterity saving throw or take 1d8 radiant damage.\n\nThe spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
    classes: 'Cleric',
  },
  {
    name: 'Mage Hand', level: 0, school: 'Conjuration',
    casting_time: '1 action', range: '30 feet', components: 'V, S', duration: '1 minute',
    description: 'A spectral, floating hand appears at a point you choose within range.',
    classes: 'Sorcerer, Wizard',
  },
];

function mockFetchCatalog() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(CATALOG),
  }));
}

function mockFetchEmpty() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  }));
}

describe('SpellList', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mockEdition = '5e';
    mockFetchEmpty();
  });

  // ── Edition ────────────────────────────────────────────────────────────
  // The catalog request must carry the campaign's edition, or a 2024 campaign reads
  // 2014 spell text (e.g. the wrong Blade Ward — a different spell in 2024).
  describe('edition', () => {
    it("requests the campaign's edition", async () => {
      mockFetchCatalog();
      render(<SpellList spells={['Fireball']} label="Spells" />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      expect(fetch.mock.calls[0][0]).toContain('edition=5e');
      expect(fetch.mock.calls[0][0]).toContain('campaign_id=42');
    });

    it('requests 5.5e text for a 2024 campaign', async () => {
      mockEdition = '5.5e';
      mockFetchCatalog();
      render(<SpellList spells={['Fireball']} label="Spells" />);
      await waitFor(() => expect(fetch).toHaveBeenCalled());
      expect(fetch.mock.calls[0][0]).toContain('edition=5.5e');
    });
  });

  // ── Empty state ────────────────────────────────────────────────────────
  it('shows "None added" when spells array is empty', () => {
    render(<SpellList spells={[]} label="Spells Known" />);
    expect(screen.getByText('None added')).toBeInTheDocument();
  });

  it('does not show "None added" when spells are present', () => {
    render(<SpellList spells={['Fire Bolt']} isCantrips label="Cantrips Known" />);
    expect(screen.queryByText('None added')).not.toBeInTheDocument();
  });

  // ── isCantrips mode ────────────────────────────────────────────────────
  it('renders all spells under a "Cantrips" heading when isCantrips=true', () => {
    render(<SpellList spells={['Eldritch Blast', 'Mage Hand']} isCantrips label="Cantrips Known" />);
    expect(screen.getByText('Cantrips')).toBeInTheDocument();
    expect(screen.getByText('Eldritch Blast')).toBeInTheDocument();
    expect(screen.getByText('Mage Hand')).toBeInTheDocument();
  });

  it('still fetches the catalog when isCantrips=true (for the detail dialog)', () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal('fetch', fetchSpy);
    render(<SpellList spells={['Fire Bolt']} isCantrips label="Cantrips" />);
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('shows full cantrip details in the dialog when the cantrip is in the catalog', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Eldritch Blast']} isCantrips label="Cantrips" />);
    await waitFor(() => expect(screen.getByText('Eldritch Blast')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Eldritch Blast'));
    await waitFor(() => {
      expect(screen.getByText('A beam of crackling energy.')).toBeInTheDocument();
      expect(screen.getByText('120 feet')).toBeInTheDocument();
    });
    expect(screen.queryByText(/hasn't been added to the compendium/i)).not.toBeInTheDocument();
  });

  it('sorts cantrips alphabetically within the Cantrips section', () => {
    render(<SpellList spells={['Prestidigitation', 'Eldritch Blast', 'Chill Touch']} isCantrips label="Cantrips" />);
    const spellNames = ['Prestidigitation', 'Eldritch Blast', 'Chill Touch'];
    const spellButtons = screen.getAllByRole('button').filter(b =>
      spellNames.includes(b.textContent.trim())
    );
    expect(spellButtons[0]).toHaveTextContent('Chill Touch');
    expect(spellButtons[1]).toHaveTextContent('Eldritch Blast');
    expect(spellButtons[2]).toHaveTextContent('Prestidigitation');
  });

  // ── Level grouping → per-level sub-tabs ─────────────────────────────────
  it('breaks a multi-level list into per-level sub-tabs, showing only the active level', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile', 'Fireball']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByTestId('spell-level-tabs')).toBeInTheDocument());
    // A tab per present level, each with its count; the stacked "1st Level" headings are gone.
    expect(screen.getByTestId('spell-level-tab-1')).toHaveTextContent('1st (1)');
    expect(screen.getByTestId('spell-level-tab-3')).toHaveTextContent('3rd (1)');
    expect(screen.queryByText('1st Level')).not.toBeInTheDocument();
    // Defaults to the lowest level: 1st shown, 3rd hidden until its tab is clicked.
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('spell-level-tab-3'));
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.queryByText('Magic Missile')).not.toBeInTheDocument();
  });

  it('does not show sub-tabs (or a level heading) when the list is a single level', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByText('Magic Missile')).toBeInTheDocument());
    // A single-level list keeps its stacked heading (no tab needed). The level comes from the
    // fetched catalog, so wait on the heading before asserting what is absent.
    expect(await screen.findByText('1st Level')).toBeInTheDocument();
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
    expect(screen.queryByText('3rd Level')).not.toBeInTheDocument();
  });

  it('does not tab a cantrips-only list (all one level)', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Fire Bolt', 'Mage Hand']} isCantrips label="Cantrips" />);
    await waitFor(() => expect(screen.getByText('Fire Bolt')).toBeInTheDocument());
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
    expect(screen.getByText('Mage Hand')).toBeInTheDocument();
  });

  it('respects levelTabs={false} — stacks all levels with headings, no tab bar', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile', 'Fireball']} label="Spells Known" levelTabs={false} />);
    await waitFor(() => expect(screen.getByText('1st Level')).toBeInTheDocument());
    expect(screen.getByText('3rd Level')).toBeInTheDocument();
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
  });

  it('sorts spells alphabetically within each level section', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile', 'Burning Hands']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByText('1st Level')).toBeInTheDocument());
    const spellButtons = screen.getAllByRole('button').filter(b =>
      ['Burning Hands', 'Magic Missile'].includes(b.textContent.trim())
    );
    expect(spellButtons[0]).toHaveTextContent('Burning Hands');
    expect(spellButtons[1]).toHaveTextContent('Magic Missile');
  });

  it('shows an "Other Spells" section for spells not in the catalog', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Weird Homebrew Spell']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByText('Other Spells')).toBeInTheDocument());
    expect(screen.getByText('Weird Homebrew Spell')).toBeInTheDocument();
  });

  it('orders the level sub-tabs with known levels before "Other"', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile', 'Homebrew Spell']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByTestId('spell-level-tabs')).toBeInTheDocument());
    const tabs = within(screen.getByTestId('spell-level-tabs')).getAllByRole('button');
    expect(tabs[0]).toHaveTextContent('1st');
    expect(tabs[1]).toHaveTextContent('Other');
  });

  // ── API call ────────────────────────────────────────────────────────────
  it('calls the spells API with the campaign_id from context', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    vi.stubGlobal('fetch', fetchSpy);
    render(<SpellList spells={['Fireball']} label="Spells" />);
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('campaign_id=42'),
        expect.anything(),
      )
    );
  });

  // ── Spell detail dialog ─────────────────────────────────────────────────
  it('opens a dialog when a spell name is clicked', async () => {
    render(<SpellList spells={['Eldritch Blast']} isCantrips label="Cantrips" />);
    fireEvent.click(screen.getByText('Eldritch Blast'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  });

  it('shows full spell details in the dialog when the spell is in the catalog', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Fireball']} label="Spells" />);
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Fireball'));
    await waitFor(() => {
      expect(screen.getByText('Evocation')).toBeInTheDocument();
      expect(screen.getByText('1 action')).toBeInTheDocument();
      expect(screen.getByText('150 feet')).toBeInTheDocument();
      expect(screen.getByText('V, S, M')).toBeInTheDocument();
      expect(screen.getByText('Instantaneous')).toBeInTheDocument();
      expect(screen.getByText(/8d6 fire damage/)).toBeInTheDocument();
      expect(screen.getByText(/Sorcerer, Wizard/)).toBeInTheDocument();
    });
  });

  it('shows a "Cantrip" badge in the dialog for level-0 spells', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Eldritch Blast']} label="Spells" />);
    await waitFor(() => expect(screen.getByText('Eldritch Blast')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Eldritch Blast'));
    await waitFor(() => expect(screen.getByText('Cantrip')).toBeInTheDocument());
  });

  it('shows the correct level badge in the dialog for leveled spells', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile']} label="Spells" />);
    await waitFor(() => expect(screen.getByText('Magic Missile')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Magic Missile'));
    await waitFor(() => expect(screen.getAllByText('1st Level').length).toBeGreaterThanOrEqual(1));
  });

  it('shows a fallback message in the dialog when the spell is not in the catalog', async () => {
    render(<SpellList spells={['Unknown Spell']} isCantrips label="Cantrips" />);
    fireEvent.click(screen.getByText('Unknown Spell'));
    await waitFor(() =>
      expect(screen.getByText(/hasn't been added to the compendium/i)).toBeInTheDocument()
    );
  });

  // ── No free-text add ────────────────────────────────────────────────────
  // A character may only know spells that exist in the compendium, so SpellList is
  // display+remove only. Every add goes through a catalog picker (SpellAddPicker /
  // ClassSpellBrowser / SpellPickerCreation). This guards the input never coming back.
  it('never renders a free-text add input', () => {
    render(<SpellList spells={[]} label="Spells" readOnly={false} />);
    expect(screen.queryByPlaceholderText(/add .*spell/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/add .*cantrip/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('spell-add-button')).not.toBeInTheDocument();
  });

  // ── Remove spell ────────────────────────────────────────────────────────
  it('calls onRemove with the spell name when the remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<SpellList spells={['Fire Bolt']} onRemove={onRemove} isCantrips label="Cantrips" readOnly={false} />);
    fireEvent.click(screen.getByTestId('remove-spell-Fire Bolt'));
    expect(onRemove).toHaveBeenCalledWith('Fire Bolt');
  });

  it('hides remove buttons when readOnly=true', () => {
    render(<SpellList spells={['Fire Bolt']} onRemove={vi.fn()} isCantrips label="Cantrips" readOnly />);
    expect(screen.queryByTestId('remove-spell-Fire Bolt')).not.toBeInTheDocument();
  });

  // ── Cast spell button ───────────────────────────────────────────────────
  it('shows Cast button on leveled spells when onCastSpell is provided', async () => {
    mockFetchCatalog();
    const onCastSpell = vi.fn();
    render(<SpellList
      spells={['Magic Missile']}
      label="Prepared"
      onCastSpell={onCastSpell}
      availableSlots={{ 1: 2 }}
    />);
    await waitFor(() => expect(screen.getByTestId('cast-spell-Magic Missile')).toBeInTheDocument());
  });

  it('does not show Cast button when onCastSpell is not provided', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile']} label="Prepared" />);
    await waitFor(() => expect(screen.getByText('Magic Missile')).toBeInTheDocument());
    expect(screen.queryByTestId('cast-spell-Magic Missile')).not.toBeInTheDocument();
  });

  it('disables Cast button when availableSlots for that level is 0', async () => {
    mockFetchCatalog();
    render(<SpellList
      spells={['Magic Missile']}
      label="Prepared"
      onCastSpell={vi.fn()}
      availableSlots={{ 1: 0 }}
    />);
    await waitFor(() => {
      expect(screen.getByTestId('cast-spell-Magic Missile')).toBeDisabled();
    });
  });

  it('does not call onCastSpell immediately when Cast button clicked — opens confirm dialog first', async () => {
    mockFetchCatalog();
    const onCastSpell = vi.fn();
    render(<SpellList
      spells={['Magic Missile']}
      label="Prepared"
      onCastSpell={onCastSpell}
      availableSlots={{ 1: 2 }}
    />);
    await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
    expect(onCastSpell).not.toHaveBeenCalled();
    expect(screen.getByTestId('cast-confirm-button')).toBeInTheDocument();
  });

  it('confirm dialog states which spell-slot level will be used', async () => {
    mockFetchCatalog();
    render(<SpellList
      spells={['Magic Missile']}
      label="Prepared"
      onCastSpell={vi.fn()}
      availableSlots={{ 1: 2 }}
    />);
    await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
    expect(screen.getByText(/this will use a level 1 spell slot/i)).toBeInTheDocument();
  });

  it('calls onCastSpell with name and level only after confirming', async () => {
    mockFetchCatalog();
    const onCastSpell = vi.fn();
    render(<SpellList
      spells={['Magic Missile']}
      label="Prepared"
      onCastSpell={onCastSpell}
      availableSlots={{ 1: 2 }}
    />);
    await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-confirm-button'));
    expect(onCastSpell).toHaveBeenCalledWith('Magic Missile', 1);
  });

  it('does not call onCastSpell when the cast is cancelled', async () => {
    mockFetchCatalog();
    const onCastSpell = vi.fn();
    render(<SpellList
      spells={['Magic Missile']}
      label="Prepared"
      onCastSpell={onCastSpell}
      availableSlots={{ 1: 2 }}
    />);
    await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-cancel-button'));
    expect(onCastSpell).not.toHaveBeenCalled();
  });

  it('does not show Cast button on cantrips (isCantrips mode)', () => {
    const onCastSpell = vi.fn();
    render(<SpellList
      spells={['Fire Bolt']}
      isCantrips
      label="Cantrips"
      onCastSpell={onCastSpell}
      availableSlots={{ 0: 99 }}
    />);
    expect(screen.queryByTestId('cast-spell-Fire Bolt')).not.toBeInTheDocument();
  });

  // ── Upcasting ───────────────────────────────────────────────────────────
  describe('upcasting', () => {
    it('enables Cast when only a HIGHER-level slot is available (base level exhausted)', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Magic Missile']}
        label="Prepared"
        onCastSpell={vi.fn()}
        availableSlots={{ 1: 0, 2: 1 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
      // Base-level (1) slots are gone but a 2nd-level slot is free → still castable.
      expect(screen.getByTestId('cast-spell-Magic Missile')).not.toBeDisabled();
    });

    it('offers a slot chooser for each available level at or above the base, defaulting to the lowest', async () => {
      mockFetchCatalog();
      const onCastSpell = vi.fn();
      render(<SpellList
        spells={['Magic Missile']}
        label="Prepared"
        onCastSpell={onCastSpell}
        availableSlots={{ 1: 2, 2: 1, 3: 1 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
      fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
      expect(screen.getByTestId('cast-slot-1')).toBeInTheDocument();
      expect(screen.getByTestId('cast-slot-2')).toBeInTheDocument();
      expect(screen.getByTestId('cast-slot-3')).toBeInTheDocument();
      // Default (no chooser interaction) spends the lowest available slot.
      fireEvent.click(screen.getByTestId('cast-confirm-button'));
      expect(onCastSpell).toHaveBeenCalledWith('Magic Missile', 1);
    });

    it('casts with the chosen higher slot level when upcast', async () => {
      mockFetchCatalog();
      const onCastSpell = vi.fn();
      render(<SpellList
        spells={['Magic Missile']}
        label="Prepared"
        onCastSpell={onCastSpell}
        availableSlots={{ 1: 2, 2: 1, 3: 1 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
      fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
      fireEvent.click(screen.getByTestId('cast-slot-3'));
      fireEvent.click(screen.getByTestId('cast-confirm-button'));
      expect(onCastSpell).toHaveBeenCalledWith('Magic Missile', 3);
    });

    it("shows the spell's At Higher Levels text in the cast dialog", async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Magic Missile']}
        label="Prepared"
        onCastSpell={vi.fn()}
        availableSlots={{ 1: 2, 2: 1 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
      fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
      expect(screen.getByTestId('cast-higher-level')).toHaveTextContent(/one more dart/i);
    });

    it('shows no slot chooser when only the base-level slot is available', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Magic Missile']}
        label="Prepared"
        onCastSpell={vi.fn()}
        availableSlots={{ 1: 2 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
      fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
      expect(screen.queryByTestId('cast-slot-1')).not.toBeInTheDocument();
      expect(screen.getByText(/this will use a level 1 spell slot/i)).toBeInTheDocument();
    });

    it('computes and shows the damage dice at the chosen upcast level (Fireball 5th → 10d6)', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Fireball']}
        label="Prepared"
        onCastSpell={vi.fn()}
        availableSlots={{ 3: 1, 4: 1, 5: 1 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Fireball'));
      fireEvent.click(screen.getByTestId('cast-spell-Fireball'));
      // Base level (3) shows 8d6.
      expect(screen.getByTestId('cast-damage')).toHaveTextContent('8d6');
      // Upcast to a 5th-level slot → 10d6.
      fireEvent.click(screen.getByTestId('cast-slot-5'));
      expect(screen.getByTestId('cast-damage')).toHaveTextContent('10d6');
    });

    it('shows the computed save DC for a save spell when spellSaveDc is provided', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Fireball']}
        label="Prepared"
        onCastSpell={vi.fn()}
        availableSlots={{ 3: 1 }}
        spellSaveDc={15}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Fireball'));
      fireEvent.click(screen.getByTestId('cast-spell-Fireball'));
      expect(screen.getByTestId('cast-save-dc')).toHaveTextContent('15');
      expect(screen.getByTestId('cast-save-dc')).toHaveTextContent('DEX');
    });

    it('notes when a spell does nothing extra at higher levels (no higher_level text)', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Shield']}
        label="Prepared"
        onCastSpell={vi.fn()}
        availableSlots={{ 1: 2, 2: 1 }}
      />);
      await waitFor(() => screen.getByTestId('cast-spell-Shield'));
      fireEvent.click(screen.getByTestId('cast-spell-Shield'));
      expect(screen.getByTestId('cast-no-extra')).toBeInTheDocument();
      expect(screen.queryByTestId('cast-higher-level')).not.toBeInTheDocument();
    });
  });

  // ── Cantrip scaling on the row ──────────────────────────────────────────
  describe('cantrip row scaling', () => {
    it('shows damage-at-level + attack bonus on an attack cantrip row', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Fire Bolt']}
        label="Cantrips" isCantrips
        characterLevel={11}
        spellAttackBonus={7}
      />);
      await waitFor(() => screen.getByTestId('cantrip-meta-Fire Bolt'));
      const meta = screen.getByTestId('cantrip-meta-Fire Bolt');
      expect(meta).toHaveTextContent('3d10 damage');
      expect(meta).toHaveTextContent('+7');
    });

    it('shows damage-at-level + save DC on a save cantrip row', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Sacred Flame']}
        label="Cantrips" isCantrips
        characterLevel={5}
        spellSaveDc={15}
      />);
      await waitFor(() => screen.getByTestId('cantrip-meta-Sacred Flame'));
      const meta = screen.getByTestId('cantrip-meta-Sacred Flame');
      expect(meta).toHaveTextContent('2d8 damage');
      expect(meta).toHaveTextContent('Save DC 15 (DEX)');
    });

    it('shows no meta line for a utility cantrip (Mage Hand)', async () => {
      mockFetchCatalog();
      render(<SpellList
        spells={['Mage Hand']}
        label="Cantrips" isCantrips
        characterLevel={11}
        spellSaveDc={15}
        spellAttackBonus={7}
      />);
      await waitFor(() => screen.getByText('Mage Hand'));
      expect(screen.queryByTestId('cantrip-meta-Mage Hand')).not.toBeInTheDocument();
    });

    it('shows no meta line when characterLevel is not supplied', async () => {
      mockFetchCatalog();
      render(<SpellList spells={['Fire Bolt']} label="Cantrips" isCantrips spellAttackBonus={7} />);
      await waitFor(() => screen.getByText('Fire Bolt'));
      expect(screen.queryByTestId('cantrip-meta-Fire Bolt')).not.toBeInTheDocument();
    });
  });
});
