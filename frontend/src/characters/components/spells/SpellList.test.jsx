import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpellList from '@/characters/components/spells/SpellList';

vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 42 } }),
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
  },
  {
    name: 'Fireball', level: 3, school: 'Evocation',
    casting_time: '1 action', range: '150 feet', components: 'V, S, M',
    duration: 'Instantaneous', description: 'A fiery explosion erupts.', classes: 'Sorcerer, Wizard',
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
    mockFetchEmpty();
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

  // ── Level grouping ─────────────────────────────────────────────────────
  it('groups spells into the correct level sections from the catalog', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile', 'Fireball']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByText('1st Level')).toBeInTheDocument());
    expect(screen.getByText('3rd Level')).toBeInTheDocument();
    expect(screen.getByText('Magic Missile')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('only shows a level section when the character has a spell at that level', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByText('1st Level')).toBeInTheDocument());
    expect(screen.queryByText('3rd Level')).not.toBeInTheDocument();
    expect(screen.queryByText('2nd Level')).not.toBeInTheDocument();
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

  it('places known-level sections before "Other Spells"', async () => {
    mockFetchCatalog();
    render(<SpellList spells={['Magic Missile', 'Homebrew Spell']} label="Spells Known" />);
    await waitFor(() => expect(screen.getByText('1st Level')).toBeInTheDocument());
    const headings = screen.getAllByText(/^(1st Level|Other Spells)$/);
    expect(headings[0]).toHaveTextContent('1st Level');
    expect(headings[1]).toHaveTextContent('Other Spells');
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
      expect(screen.getByText('A fiery explosion erupts.')).toBeInTheDocument();
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

  // ── Add spell ───────────────────────────────────────────────────────────
  it('shows the add input when onAdd is provided and readOnly=false', () => {
    render(<SpellList spells={[]} onAdd={vi.fn()} label="Spells" readOnly={false} />);
    expect(screen.getByPlaceholderText('Add spell…')).toBeInTheDocument();
  });

  it('hides the add input when onAdd is not provided', () => {
    render(<SpellList spells={[]} label="Spells" readOnly={false} />);
    expect(screen.queryByPlaceholderText('Add spell…')).not.toBeInTheDocument();
  });

  it('hides the add input when readOnly=true even if onAdd is provided', () => {
    render(<SpellList spells={[]} onAdd={vi.fn()} label="Spells" readOnly />);
    expect(screen.queryByPlaceholderText('Add spell…')).not.toBeInTheDocument();
  });

  it('calls onAdd with the trimmed value when the + button is clicked', () => {
    const onAdd = vi.fn();
    render(<SpellList spells={[]} onAdd={onAdd} label="Spells" readOnly={false} />);
    fireEvent.change(screen.getByPlaceholderText('Add spell…'), { target: { value: ' Fireball ' } });
    fireEvent.click(screen.getByTestId('spell-add-button'));
    expect(onAdd).toHaveBeenCalledWith('Fireball');
  });

  it('calls onAdd when Enter is pressed in the add input', () => {
    const onAdd = vi.fn();
    render(<SpellList spells={[]} onAdd={onAdd} label="Spells" readOnly={false} />);
    const input = screen.getByPlaceholderText('Add spell…');
    fireEvent.change(input, { target: { value: 'Magic Missile' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith('Magic Missile');
  });

  it('does not call onAdd when the spell is already in the list', () => {
    const onAdd = vi.fn();
    render(<SpellList spells={['Fireball']} onAdd={onAdd} isCantrips label="Spells" readOnly={false} />);
    const input = screen.getByPlaceholderText('Add spell…');
    fireEvent.change(input, { target: { value: 'Fireball' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('clears the input after a successful add', () => {
    const onAdd = vi.fn();
    render(<SpellList spells={[]} onAdd={onAdd} label="Spells" readOnly={false} />);
    const input = screen.getByPlaceholderText('Add spell…');
    fireEvent.change(input, { target: { value: 'Fireball' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('');
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

  it('uses a custom placeholder when the placeholder prop is provided', () => {
    render(<SpellList spells={[]} onAdd={vi.fn()} label="Spells" placeholder="Add prepared spell…" readOnly={false} />);
    expect(screen.getByPlaceholderText('Add prepared spell…')).toBeInTheDocument();
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
});
