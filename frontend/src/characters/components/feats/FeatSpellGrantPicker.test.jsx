import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeatSpellGrantPicker, { spellGrantComplete, resolveSpellGrantValue, CLASS_SPELL_ABILITY, GROUP_CLASSES } from '@/characters/components/feats/FeatSpellGrantPicker';

vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: { getSpells: vi.fn() },
}));
import encyclopediaService from '@/encyclopedia/encyclopediaService';

const SPELLS = [
  { id: 1, name: 'Fire Bolt', level: 0, classes: 'Sorcerer, Wizard', school: 'Evocation' },
  { id: 2, name: 'Light', level: 0, classes: 'Bard, Cleric, Sorcerer, Wizard', school: 'Evocation' },
  { id: 3, name: 'Mage Hand', level: 0, classes: 'Bard, Sorcerer, Warlock, Wizard', school: 'Conjuration' },
  { id: 4, name: 'Mage Armor', level: 1, classes: 'Sorcerer, Wizard', school: 'Abjuration' },
  { id: 5, name: 'Shield', level: 1, classes: 'Sorcerer, Wizard', school: 'Abjuration' },
  { id: 6, name: 'Cure Wounds', level: 1, classes: 'Bard, Cleric, Druid', school: 'Evocation' }, // not on the Wizard list
  { id: 7, name: 'Charm Person', level: 1, classes: 'Bard, Sorcerer, Wizard', school: 'Enchantment' },
  { id: 8, name: 'Detect Magic', level: 1, classes: 'Cleric, Wizard', school: 'Divination', ritual: true },
  { id: 9, name: 'Identify', level: 1, classes: 'Bard, Wizard', school: 'Divination', ritual: true },
];

const CLASS_SPEC = { source_kind: 'class', cantrips: 2, leveled: [{ level: 1, count: 1 }], free_cast: 'long_rest', ability: 'class', label: 'Magic Initiate' };
const GROUP_SPEC = { source_kind: 'group', cantrips: 2, leveled: [{ level: 1, count: 1 }], free_cast: 'long_rest', ability: 'choice', label: 'Magic Initiate' };
// Pure-fixed grant (Telepathic): no list to pick from, one always-granted spell that's the free cast.
const FIXED_SPEC = { source_kind: 'fixed', cantrips: 0, leveled: [], fixed: [{ name: 'Detect Thoughts', level: 2 }], free_cast: 'long_rest', ability: 'none', label: 'Telepathic' };
// School-filtered + multi-free-cast grant (Fey Touched): fixed Misty Step + a chosen Div/Ench L1.
const SCHOOL_SPEC = { source_kind: 'school', cantrips: 0, leveled: [{ level: 1, count: 1, school: ['Divination', 'Enchantment'] }], fixed: [{ name: 'Misty Step', level: 2 }], free_cast: 'long_rest', ability: 'none', label: 'Fey Touched' };
// Ritual Caster: pick a class, then 2 ritual 1st-level spells from it → a growable ritual book.
const RITUAL_SPEC = { source_kind: 'class', cantrips: 0, leveled: [{ level: 1, count: 2, ritual: true }], free_cast: null, ability: 'class', label: 'Ritual Caster' };

function Harness({ spec, onValue }) {
  const [value, setValue] = useState(null);
  return (
    <FeatSpellGrantPicker
      spec={spec}
      value={value}
      onChange={(v) => { setValue(v); onValue?.(v); }}
      campaignId={1}
    />
  );
}

describe('FeatSpellGrantPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    encyclopediaService.getSpells.mockResolvedValue(SPELLS);
  });

  it('shows class options and derives the spellcasting ability from the chosen class', async () => {
    render(<Harness spec={CLASS_SPEC} />);
    // Class list, not a group/ability dropdown.
    expect(screen.getByTestId('feat-spell-source')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-spell-ability')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Wizard' } });
    expect(screen.getByTestId('feat-spell-ability-derived')).toHaveTextContent('intelligence');
    await waitFor(() => expect(screen.getByTestId('feat-spell-cantrip-Fire Bolt')).toBeInTheDocument());
    // Only Wizard-list spells appear (Cure Wounds is not on it).
    expect(screen.getByTestId('feat-spell-leveled-1-Mage Armor')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-spell-leveled-1-Cure Wounds')).not.toBeInTheDocument();
  });

  it('limits cantrip selection to the required count', async () => {
    render(<Harness spec={CLASS_SPEC} />);
    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Wizard' } });
    await waitFor(() => expect(screen.getByTestId('feat-spell-cantrip-Fire Bolt')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('feat-spell-cantrip-Fire Bolt'));
    fireEvent.click(screen.getByTestId('feat-spell-cantrip-Light'));
    // At the limit of 2 → the third cantrip is disabled.
    expect(screen.getByTestId('feat-spell-cantrip-Mage Hand')).toBeDisabled();
  });

  it('reports a complete value once source + cantrips + the level-1 spell are chosen', async () => {
    const onValue = vi.fn();
    render(<Harness spec={CLASS_SPEC} onValue={onValue} />);
    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Wizard' } });
    await waitFor(() => expect(screen.getByTestId('feat-spell-cantrip-Fire Bolt')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('feat-spell-cantrip-Fire Bolt'));
    fireEvent.click(screen.getByTestId('feat-spell-cantrip-Light'));
    fireEvent.click(screen.getByTestId('feat-spell-leveled-1-Mage Armor'));

    const last = onValue.mock.calls.at(-1)[0];
    expect(last).toMatchObject({
      source: 'Wizard', ability: 'intelligence',
      cantrips: ['Fire Bolt', 'Light'],
      leveled: [{ name: 'Mage Armor', level: 1 }],
    });
    expect(spellGrantComplete(CLASS_SPEC, last)).toBe(true);
    // The free cast is derived at storage from the chosen leveled spell.
    expect(resolveSpellGrantValue(CLASS_SPEC, last).free_casts).toEqual(['Mage Armor']);
  });

  it('group feats show a list dropdown AND a spellcasting-ability chooser', async () => {
    render(<Harness spec={GROUP_SPEC} />);
    expect(screen.getByTestId('feat-spell-ability')).toBeInTheDocument();
    // Choosing Arcane pulls from its class list (Wizard's Fire Bolt qualifies).
    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Arcane' } });
    fireEvent.change(screen.getByTestId('feat-spell-ability'), { target: { value: 'charisma' } });
    await waitFor(() => expect(screen.getByTestId('feat-spell-cantrip-Fire Bolt')).toBeInTheDocument());
  });

  it('changing the source resets prior spell picks', async () => {
    const onValue = vi.fn();
    render(<Harness spec={CLASS_SPEC} onValue={onValue} />);
    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Wizard' } });
    await waitFor(() => expect(screen.getByTestId('feat-spell-cantrip-Fire Bolt')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('feat-spell-cantrip-Fire Bolt'));
    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Sorcerer' } });
    const last = onValue.mock.calls.at(-1)[0];
    expect(last.cantrips).toEqual([]);
    expect(last.source).toBe('Sorcerer');
  });

  it('spellGrantComplete validates source/ability/cantrip/leveled counts', () => {
    expect(spellGrantComplete(CLASS_SPEC, null)).toBe(false);
    expect(spellGrantComplete(CLASS_SPEC, { source: 'Wizard', ability: 'intelligence', cantrips: ['A'], leveled: [{ name: 'X', level: 1 }] })).toBe(false); // 1 cantrip < 2
    expect(spellGrantComplete(CLASS_SPEC, { source: 'Wizard', ability: 'intelligence', cantrips: ['A', 'B'], leveled: [] })).toBe(false); // no L1
    expect(spellGrantComplete(CLASS_SPEC, { source: 'Wizard', ability: 'intelligence', cantrips: ['A', 'B'], leveled: [{ name: 'X', level: 1 }] })).toBe(true);
    // Group feats also require an ability pick.
    expect(spellGrantComplete(GROUP_SPEC, { source: 'Arcane', ability: '', cantrips: ['A', 'B'], leveled: [{ name: 'X', level: 1 }] })).toBe(false);
    expect(spellGrantComplete(null, null)).toBe(true); // no spec → nothing to complete
  });

  it('exposes the class→ability and group→classes maps', () => {
    expect(CLASS_SPELL_ABILITY.Wizard).toBe('intelligence');
    expect(CLASS_SPELL_ABILITY.Cleric).toBe('wisdom');
    expect(GROUP_CLASSES.Arcane).toContain('Wizard');
    expect(GROUP_CLASSES.Divine).toContain('Cleric');
  });

  it('a pure-fixed grant shows the always-granted spell, no list/ability pickers, and is auto-complete', () => {
    render(<Harness spec={FIXED_SPEC} />);
    const fixed = screen.getByTestId('feat-spell-fixed');
    expect(fixed).toHaveTextContent('Detect Thoughts');
    expect(fixed).toHaveTextContent('1/long rest'); // the free-cast spell is flagged
    // Nothing to choose → no source / ability dropdowns.
    expect(screen.queryByTestId('feat-spell-source')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feat-spell-ability')).not.toBeInTheDocument();
    expect(spellGrantComplete(FIXED_SPEC, null)).toBe(true);
  });

  it('a school-filtered grant (Fey Touched) shows the fixed spell + only on-school choices, no list/ability picker', async () => {
    const onValue = vi.fn();
    render(<Harness spec={SCHOOL_SPEC} onValue={onValue} />);
    // Misty Step is always granted; no class-list or ability dropdown needed.
    expect(screen.getByTestId('feat-spell-fixed')).toHaveTextContent('Misty Step');
    expect(screen.queryByTestId('feat-spell-source')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feat-spell-ability')).not.toBeInTheDocument();
    // The level-1 grid is filtered to Divination/Enchantment — Charm Person + Detect Magic only.
    await waitFor(() => expect(screen.getByTestId('feat-spell-leveled-1-Charm Person')).toBeInTheDocument());
    expect(screen.getByTestId('feat-spell-leveled-1-Detect Magic')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-spell-leveled-1-Mage Armor')).not.toBeInTheDocument(); // Abjuration
    expect(screen.queryByTestId('feat-spell-leveled-1-Shield')).not.toBeInTheDocument();
    // Not complete until the chosen 1st-level spell is picked.
    expect(spellGrantComplete(SCHOOL_SPEC, onValue.mock.calls.at(-1)?.[0] ?? null)).toBe(false);
    fireEvent.click(screen.getByTestId('feat-spell-leveled-1-Charm Person'));
    expect(spellGrantComplete(SCHOOL_SPEC, onValue.mock.calls.at(-1)[0])).toBe(true);
  });

  it('a ritual grant (Ritual Caster) filters the class list to ritual spells and stores a ritual_book', async () => {
    const onValue = vi.fn();
    render(<Harness spec={RITUAL_SPEC} onValue={onValue} />);
    fireEvent.change(screen.getByTestId('feat-spell-source'), { target: { value: 'Wizard' } });
    await waitFor(() => expect(screen.getByTestId('feat-spell-leveled-1-Detect Magic')).toBeInTheDocument());
    // Only ritual spells on the Wizard list — Mage Armor/Shield (non-ritual) are excluded.
    expect(screen.getByTestId('feat-spell-leveled-1-Identify')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-spell-leveled-1-Mage Armor')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('feat-spell-leveled-1-Detect Magic'));
    fireEvent.click(screen.getByTestId('feat-spell-leveled-1-Identify'));
    expect(spellGrantComplete(RITUAL_SPEC, onValue.mock.calls.at(-1)[0])).toBe(true);
    // Resolves to an editable ritual book of names (no free cast — cast as rituals only).
    expect(resolveSpellGrantValue(RITUAL_SPEC, onValue.mock.calls.at(-1)[0]))
      .toEqual({ source: 'Wizard', ability: 'intelligence', ritual: true, ritual_book: ['Detect Magic', 'Identify'] });
  });

  it('resolveSpellGrantValue merges fixed spells and lists every leveled free cast', () => {
    // Chosen-leveled free cast (Magic Initiate): the chosen 1st-level spell.
    expect(resolveSpellGrantValue(CLASS_SPEC, { source: 'Wizard', ability: 'intelligence', cantrips: ['Fire Bolt', 'Light'], leveled: [{ name: 'Mage Armor', level: 1 }] }))
      .toEqual({ source: 'Wizard', ability: 'intelligence', cantrips: ['Fire Bolt', 'Light'], leveled: [{ name: 'Mage Armor', level: 1 }], fixed: [], free_casts: ['Mage Armor'] });
    // Fixed free cast (Telepathic): even with no player value, the fixed leveled spell is a free cast.
    expect(resolveSpellGrantValue(FIXED_SPEC, null))
      .toEqual({ source: '', ability: '', cantrips: [], leveled: [], fixed: [{ name: 'Detect Thoughts', level: 2 }], free_casts: ['Detect Thoughts'] });
    // Multi free cast (Fey Touched): the fixed level-2 spell AND the chosen 1st-level spell.
    expect(resolveSpellGrantValue(SCHOOL_SPEC, { leveled: [{ name: 'Charm Person', level: 1 }] }).free_casts)
      .toEqual(['Misty Step', 'Charm Person']);
    expect(resolveSpellGrantValue(null, { source: 'X' })).toEqual({ source: 'X' });
  });
});
