import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatSpellsSection from '@/characters/components/feats/FeatSpellsSection';

// SpellLevelTabs + SpellList are tested separately; mock them to surface what they receive.
vi.mock('@/characters/components/spells/SpellLevelTabs', () => ({
  default: ({ spells = [] }) => (
    <div data-testid="spell-level-tabs">
      {spells.map((s) => <span key={s.name} data-testid={`slt-${s.name}`}>{s.name}</span>)}
    </div>
  ),
}));
vi.mock('@/characters/components/spells/SpellList', () => ({
  default: ({ spells = [], onAdd, onRemove }) => (
    <div data-testid="spell-list">
      {spells.map((n) => <span key={n} data-testid={`sl-${n}`}>{n}</span>)}
      {onAdd && <button type="button" data-testid="sl-add" onClick={() => onAdd('Identify')}>add</button>}
      {onRemove && <button type="button" data-testid="sl-remove" onClick={() => onRemove(spells[0])}>remove</button>}
    </div>
  ),
}));

const RITUAL_CASTER = {
  id: 13, name: 'Ritual Caster',
  choices: { spell_grant: { source: 'Wizard', ability: 'intelligence', ritual: true, ritual_book: ['Detect Magic'] } },
};

const MAGIC_INITIATE = {
  id: 10, name: 'Magic Initiate',
  choices: { spell_grant: { source: 'Wizard', ability: 'intelligence', cantrips: ['Fire Bolt', 'Light'], leveled: [{ name: 'Mage Armor', level: 1 }], free_casts: ['Mage Armor'] } },
};

describe('FeatSpellsSection', () => {
  it('renders nothing when no feat grants spells', () => {
    const { container } = render(<FeatSpellsSection feats={[{ name: 'Alert' }]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the granted cantrips + leveled spells and the free-cast tracker', () => {
    render(<FeatSpellsSection feats={[MAGIC_INITIATE]} characterData={{}} onChange={vi.fn()} />);
    expect(screen.getByTestId('slt-Fire Bolt')).toBeInTheDocument();
    expect(screen.getByTestId('slt-Light')).toBeInTheDocument();
    expect(screen.getByTestId('slt-Mage Armor')).toBeInTheDocument();
    // Free-cast tracker for the level-1 spell, tagged with its source feat.
    const fc = screen.getByTestId('feat-freecast-Mage Armor');
    expect(fc).toHaveTextContent('Mage Armor');
    expect(fc).toHaveTextContent('Magic Initiate');
  });

  it('using the free cast persists the slugified used key via onChange', () => {
    const onChange = vi.fn();
    render(<FeatSpellsSection feats={[MAGIC_INITIATE]} characterData={{}} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Use Mage Armor'));
    fireEvent.click(screen.getByTestId('feat-freecast-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ feat_freecast_mage_armor_used: 1 });
  });

  it('reflects an already-used free cast and recovers it', () => {
    const onChange = vi.fn();
    render(<FeatSpellsSection feats={[MAGIC_INITIATE]} characterData={{ feat_freecast_mage_armor_used: 1 }} onChange={onChange} />);
    // Use is disabled (0 remaining); the − recover button restores it.
    expect(screen.getByLabelText('Use Mage Armor')).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Recover Mage Armor'));
    expect(onChange).toHaveBeenCalledWith({ feat_freecast_mage_armor_used: 0 });
  });

  it('hides the Use/recover controls when readOnly', () => {
    render(<FeatSpellsSection feats={[MAGIC_INITIATE]} characterData={{}} readOnly />);
    expect(screen.queryByLabelText('Use Mage Armor')).not.toBeInTheDocument();
  });

  it('renders a growable Ritual Book (Ritual Caster) with add/remove that persists onto the feat', () => {
    const onChange = vi.fn();
    render(<FeatSpellsSection feats={[{ name: 'Alert' }, RITUAL_CASTER]} characterData={{}} onChange={onChange} />);
    expect(screen.getByTestId('ritual-book-Ritual Caster')).toBeInTheDocument();
    expect(screen.getByTestId('sl-Detect Magic')).toBeInTheDocument();

    // Adding appends to the right feat instance's ritual_book and emits a { feats } patch.
    fireEvent.click(screen.getByTestId('sl-add'));
    expect(onChange).toHaveBeenLastCalledWith({ feats: [
      { name: 'Alert' },
      expect.objectContaining({ name: 'Ritual Caster', choices: { spell_grant: expect.objectContaining({ ritual_book: ['Detect Magic', 'Identify'] }) } }),
    ] });

    // Removing drops it from the book.
    fireEvent.click(screen.getByTestId('sl-remove'));
    expect(onChange).toHaveBeenLastCalledWith({ feats: [
      { name: 'Alert' },
      expect.objectContaining({ choices: { spell_grant: expect.objectContaining({ ritual_book: [] }) } }),
    ] });
  });

  it('hides ritual-book add/remove when readOnly', () => {
    render(<FeatSpellsSection feats={[RITUAL_CASTER]} characterData={{}} readOnly />);
    expect(screen.getByTestId('ritual-book-Ritual Caster')).toBeInTheDocument();
    expect(screen.queryByTestId('sl-add')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sl-remove')).not.toBeInTheDocument();
  });
});
