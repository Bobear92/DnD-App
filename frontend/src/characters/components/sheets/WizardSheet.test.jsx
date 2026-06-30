import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Wizard is now the data-driven ClassSheet bound to the wizard config (Epic 0 spike).
// These remain behavior tests — the bound wrapper has the same prop contract as the old sheet.
import { WizardSheet5e as WizardSheet } from '@/characters/components/sheets/classSheet/configs';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/campaigns/CampaignContext', () => ({
  useCampaign: () => ({ campaign: { id: 1 } }),
}));

const BASE_DATA = {
  cantrips: ['Fire Bolt'],
  spellbook: ['Magic Missile'],
  prepared_spells: ['Shield'],
  spell_slots: { 1: { total: 2, used: 0 } },
  hp_max: 8,
  current_hp: 8,
  subclass: 'School of Evocation',
};

function sheet(section, extraProps = {}) {
  return render(<WizardSheet data={BASE_DATA} level={5} section={section} readOnly {...extraProps} />);
}

function clickPrepareSpells() {
  fireEvent.click(screen.getByRole('button', { name: 'Prepare Spells' }));
}

describe('WizardSheet prepared spells', () => {
  it('shows prepare limit in spells section (level + INT mod)', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spellbook: ['Magic Missile', 'Shield'], prepared_spells: [] }}
      level={5}
      section="spells"
      abilityScores={{ intelligence: 16 }}
      readOnly
    />);
    // INT 16 → mod +3; level 5 → limit 8; in Prepared tab label
    expect(screen.getByText(/0\/8/)).toBeInTheDocument();
  });

  it('shows prepare count vs limit', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spellbook: ['Magic Missile', 'Shield'], prepared_spells: ['Shield'] }}
      level={3}
      section="spells"
      abilityScores={{ intelligence: 14 }}
      readOnly
    />);
    // INT 14 → mod +2; level 3 → limit 5; 1 prepared
    expect(screen.getByText(/1\/5/)).toBeInTheDocument();
  });

  it('renders spellbook spells as toggle chips', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spellbook: ['Magic Missile', 'Grease'], prepared_spells: [] }}
      level={3}
      section="spells"
    />);
    clickPrepareSpells();
    const chips = within(screen.getByTestId('prepared-spell-chips'));
    expect(chips.getByText('Magic Missile')).toBeInTheDocument();
    expect(chips.getByText('Grease')).toBeInTheDocument();
  });

  it('clicking an unprepared chip prepares it', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ spellbook: ['Magic Missile'], prepared_spells: [], hp_max: 8 }}
      level={3}
      section="spells"
      onChange={onChange}
    />);
    clickPrepareSpells();
    fireEvent.click(within(screen.getByTestId('prepared-spell-chips')).getByText('Magic Missile'));
    expect(onChange).toHaveBeenCalledWith({ prepared_spells: ['Magic Missile'] });
  });

  it('clicking a prepared chip unprepares it', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ spellbook: ['Magic Missile'], prepared_spells: ['Magic Missile'], hp_max: 8 }}
      level={3}
      section="spells"
      onChange={onChange}
    />);
    clickPrepareSpells();
    fireEvent.click(within(screen.getByTestId('prepared-spell-chips')).getByText('Magic Missile'));
    expect(onChange).toHaveBeenCalledWith({ prepared_spells: [] });
  });

  it('cannot add more chips when at the prepare limit', () => {
    render(<WizardSheet
      data={{ spellbook: ['Magic Missile', 'Grease'], prepared_spells: ['Magic Missile'], hp_max: 8 }}
      level={1}
      section="spells"
      abilityScores={{ intelligence: 10 }}
    />);
    clickPrepareSpells();
    // Level 1 + INT mod 0 = limit 1, already 1 prepared — Grease chip should be disabled
    const greaseBtn = within(screen.getByTestId('prepared-spell-chips')).getByText('Grease');
    expect(greaseBtn).toBeDisabled();
  });

  it('shows empty spellbook message when spellbook is empty', () => {
    render(<WizardSheet
      data={{ spellbook: [], prepared_spells: [], hp_max: 8 }}
      level={2}
      section="spells"
      readOnly
    />);
    clickPrepareSpells();
    expect(screen.getByText(/Add spells to your spellbook below/)).toBeInTheDocument();
  });

  it('shows non-spellbook prepared spells in Other Prepared Spells list', () => {
    render(<WizardSheet
      data={{ spellbook: ['Magic Missile'], prepared_spells: ['Fireball'], hp_max: 8 }}
      level={5}
      section="spells"
      readOnly
    />);
    clickPrepareSpells();
    expect(screen.getByText('Other Prepared Spells')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('defaults limit to level when no abilityScores provided', () => {
    render(<WizardSheet
      data={{ spellbook: ['Magic Missile'], prepared_spells: [], hp_max: 8 }}
      level={4}
      section="spells"
      readOnly
    />);
    // No abilityScores → INT defaults to 10, mod 0 → limit = 4
    expect(screen.getByText(/0\/4/)).toBeInTheDocument();
  });
});

describe('WizardSheet sub-tab navigation', () => {
  it('shows Prepared and Prepare Spells tab buttons in spells section', () => {
    sheet('spells');
    expect(screen.getByRole('button', { name: 'Prepared' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prepare Spells' })).toBeInTheDocument();
  });

  it('defaults to Prepared tab showing spell slots', () => {
    sheet('spells');
    expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    expect(screen.queryByTestId('prepared-spell-chips')).not.toBeInTheDocument();
  });

  it('switching to Prepare Spells tab shows chips and hides spell slots label', () => {
    sheet('spells');
    clickPrepareSpells();
    expect(screen.getByTestId('prepared-spell-chips')).toBeInTheDocument();
    expect(screen.queryByText('Spell Slots (Long Rest)')).not.toBeInTheDocument();
  });

  it('Prepared tab shows prepared spells as read-only SpellList', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_spells: ['Fireball'] }}
      level={5}
      section="spells"
      readOnly
    />);
    // Default Prepared tab — 'Fireball' should appear in the read-only list
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('encyclopedia link appears in Prepare Spells tab', () => {
    render(<WizardSheet
      data={BASE_DATA}
      level={3}
      section="spells"
      campaignId={42}
    />);
    clickPrepareSpells();
    const link = screen.getByText(/Browse all spells in the Encyclopedia/);
    expect(link).toBeInTheDocument();
  });

  it('sub-tab buttons not shown in features section', () => {
    sheet('features');
    expect(screen.queryByRole('button', { name: 'Prepared' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Prepare Spells' })).not.toBeInTheDocument();
  });
});

describe('WizardSheet lock/unlock mechanics', () => {
  it('shows lock banner when player is locked (prepared_locked=true, not GM)', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_locked: true }}
      level={3}
      section="spells"
      isGm={false}
    />);
    clickPrepareSpells();
    expect(screen.getByText(/Spells prepared for today/)).toBeInTheDocument();
  });

  it('shows Prepare for Today button when unlocked and not GM', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_locked: false }}
      level={3}
      section="spells"
      isGm={false}
      onChange={vi.fn()}
    />);
    clickPrepareSpells();
    expect(screen.getByRole('button', { name: /Prepare for Today/ })).toBeInTheDocument();
  });

  it('Prepare for Today button locks preparation', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_locked: false }}
      level={3}
      section="spells"
      isGm={false}
      onChange={onChange}
    />);
    clickPrepareSpells();
    fireEvent.click(screen.getByRole('button', { name: /Prepare for Today/ }));
    expect(onChange).toHaveBeenCalledWith({ prepared_locked: true });
  });

  it('shows GM unlock button when locked', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_locked: true }}
      level={3}
      section="spells"
      isGm={true}
      onChange={vi.fn()}
    />);
    clickPrepareSpells();
    expect(screen.getByRole('button', { name: /Unlock.*Long Rest/i })).toBeInTheDocument();
  });

  it('GM unlock button unlocks preparation', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_locked: true }}
      level={3}
      section="spells"
      isGm={true}
      onChange={onChange}
    />);
    clickPrepareSpells();
    fireEvent.click(screen.getByRole('button', { name: /Unlock.*Long Rest/i }));
    expect(onChange).toHaveBeenCalledWith({ prepared_locked: false });
  });

  it('chips are disabled when player is locked', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spellbook: ['Magic Missile', 'Grease'], prepared_spells: [], prepared_locked: true }}
      level={5}
      section="spells"
      isGm={false}
    />);
    clickPrepareSpells();
    const chips = within(screen.getByTestId('prepared-spell-chips'));
    expect(chips.getByText('Magic Missile')).toBeDisabled();
    expect(chips.getByText('Grease')).toBeDisabled();
  });

  it('Prepare for Today button not shown when GM', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_locked: false }}
      level={3}
      section="spells"
      isGm={true}
      onChange={vi.fn()}
    />);
    clickPrepareSpells();
    expect(screen.queryByRole('button', { name: /Prepare for Today/ })).not.toBeInTheDocument();
  });
});

describe('WizardSheet section routing', () => {
  describe('section="stats"', () => {
    it('renders HP fields', () => {
      sheet('stats');
      expect(screen.getByText('Current HP')).toBeInTheDocument();
    });

    it('does not render spell slot grid', () => {
      sheet('stats');
      expect(screen.queryByText('Spell Slots (Long Rest)')).not.toBeInTheDocument();
    });

    it('does not render cantrips list', () => {
      sheet('stats');
      expect(screen.queryByText('Cantrips Known')).not.toBeInTheDocument();
    });

    it('does not render spellbook list', () => {
      sheet('stats');
      expect(screen.queryByText('Spellbook (all known spells)')).not.toBeInTheDocument();
    });

    it('does not render class features', () => {
      sheet('stats');
      expect(screen.queryByText('Class Features')).not.toBeInTheDocument();
    });
  });

  describe('section="features"', () => {
    it('renders class features heading', () => {
      sheet('features');
      expect(screen.getByText('Class Features')).toBeInTheDocument();
    });

    it('does not render spell slot grid', () => {
      sheet('features');
      expect(screen.queryByText('Spell Slots (Long Rest)')).not.toBeInTheDocument();
    });

    it('does not render cantrips list', () => {
      sheet('features');
      expect(screen.queryByText('Cantrips Known')).not.toBeInTheDocument();
    });

    it('does not render spellbook list', () => {
      sheet('features');
      expect(screen.queryByText('Spellbook (all known spells)')).not.toBeInTheDocument();
    });

    it('does not render HP fields', () => {
      sheet('features');
      expect(screen.queryByText('Current HP')).not.toBeInTheDocument();
    });

    it('does not render Arcane Recovery tracker', () => {
      sheet('features');
      expect(screen.queryByText('Arcane Recovery (Short Rest)')).not.toBeInTheDocument();
    });
  });

  describe('section="spells"', () => {
    it('renders spell slot grid in Prepared tab', () => {
      sheet('spells');
      expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    });

    it('renders cantrips list in Prepared tab', () => {
      sheet('spells');
      expect(screen.getByText('Cantrips Known')).toBeInTheDocument();
    });

    it('renders spellbook list in Prepare Spells tab', () => {
      sheet('spells');
      clickPrepareSpells();
      expect(screen.getByText('Spellbook (all known spells)')).toBeInTheDocument();
    });

    it('renders Arcane Recovery tracker in Prepared tab', () => {
      sheet('spells');
      expect(screen.getByText('Arcane Recovery (Short Rest)')).toBeInTheDocument();
    });

    it('does not render class features heading', () => {
      sheet('spells');
      expect(screen.queryByText('Class Features')).not.toBeInTheDocument();
    });

    it('does not render HP fields', () => {
      sheet('spells');
      expect(screen.queryByText('Current HP')).not.toBeInTheDocument();
    });
  });

  describe('section="all" non-creation', () => {
    it('renders HP fields', () => {
      sheet('all');
      expect(screen.getByText('Current HP')).toBeInTheDocument();
    });

    it('renders class features heading', () => {
      sheet('all');
      expect(screen.getByText('Class Features')).toBeInTheDocument();
    });

    it('renders spell slot grid in Prepared tab', () => {
      sheet('all');
      expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    });
  });
});

describe('WizardSheet Arcane Recovery button', () => {
  it('shows "Use (Short Rest)" label when available', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 2, used: 1 } }, arcane_recovery_used: false }}
      level={3} section="spells" onChange={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: 'Use (Short Rest)' })).toBeInTheDocument();
  });

  it('is enabled when at least one slot is expended', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 2, used: 1 } }, arcane_recovery_used: false }}
      level={3} section="spells" onChange={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: 'Use (Short Rest)' })).not.toBeDisabled();
  });

  it('is disabled when no slots are expended', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 2, used: 0 } }, arcane_recovery_used: false }}
      level={3} section="spells" onChange={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: 'Use (Short Rest)' })).toBeDisabled();
  });

  it('shows "Used" label when arcane_recovery_used is true', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, arcane_recovery_used: true }}
      level={3} section="spells" onChange={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: 'Used' })).toBeInTheDocument();
  });

  it('clicking "Used" resets arcane_recovery_used to false', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, arcane_recovery_used: true }}
      level={3} section="spells" onChange={onChange}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Used' }));
    expect(onChange).toHaveBeenCalledWith({ arcane_recovery_used: false });
  });

  it('clicking "Use (Short Rest)" opens a confirm dialog instead of recovering immediately', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 4, used: 1 } }, arcane_recovery_used: false }}
      level={3} section="spells" onChange={onChange}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Use (Short Rest)' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/this can only be used once per short rest/i)).toBeInTheDocument();
    expect(screen.getByTestId('arcane-recovery-confirm-button')).toBeInTheDocument();
  });

  it('cancelling the Arcane Recovery confirm dialog does not recover slots', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 4, used: 1 } }, arcane_recovery_used: false }}
      level={3} section="spells" onChange={onChange}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Use (Short Rest)' }));
    fireEvent.click(screen.getByTestId('arcane-recovery-cancel-button'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('confirming Arcane Recovery recovers an expended slot and marks it used', () => {
    const onChange = vi.fn();
    // Level 3 wizard has four 1st-level slots; one is expended.
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 4, used: 1 } }, arcane_recovery_used: false }}
      level={3} section="spells" onChange={onChange}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Use (Short Rest)' }));
    fireEvent.click(screen.getByTestId('arcane-recovery-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({
      spell_slots: { 1: { total: 4, used: 0 } },
      arcane_recovery_used: true,
    });
  });

  it('recovers the highest-value slots first, up to the level/2 budget', () => {
    const onChange = vi.fn();
    // Level 4 wizard: budget = ceil(4/2) = 2 slot-levels. A 2nd-level slot is expended.
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 1: { total: 4, used: 1 }, 2: { total: 3, used: 1 } }, arcane_recovery_used: false }}
      level={4} section="spells" onChange={onChange}
    />);
    fireEvent.click(screen.getByRole('button', { name: 'Use (Short Rest)' }));
    fireEvent.click(screen.getByTestId('arcane-recovery-confirm-button'));
    // Budget 2 → recover the 2nd-level slot (costs 2), leaving the 1st-level slot expended.
    expect(onChange).toHaveBeenCalledWith({
      spell_slots: { 1: { total: 4, used: 1 }, 2: { total: 3, used: 0 } },
      arcane_recovery_used: true,
    });
  });

  it('is disabled when only a 6th-level-or-higher slot is expended', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spell_slots: { 6: { total: 1, used: 1 } }, arcane_recovery_used: false }}
      level={11} section="spells" onChange={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: 'Use (Short Rest)' })).toBeDisabled();
  });
});

describe('WizardSheet Cast button on prepared spells', () => {
  const SPELL_CATALOG = [
    { name: 'Magic Missile', level: 1 },
    { name: 'Fireball', level: 3 },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SPELL_CATALOG),
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows Cast button on a prepared spell when not readOnly and slot is available', async () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_spells: ['Magic Missile'], spell_slots: { 1: { total: 2, used: 0 } } }}
      level={5} section="spells" onChange={vi.fn()}
    />);
    await waitFor(() => expect(screen.getByTestId('cast-spell-Magic Missile')).toBeInTheDocument());
    expect(screen.getByTestId('cast-spell-Magic Missile')).not.toBeDisabled();
  });

  it('does not show Cast button when readOnly', async () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_spells: ['Magic Missile'], spell_slots: { 1: { total: 2, used: 0 } } }}
      level={5} section="spells" readOnly
    />);
    await waitFor(() => expect(screen.queryByTestId('cast-spell-Magic Missile')).not.toBeInTheDocument());
  });

  it('disables Cast button when all slots at that level are used', async () => {
    // Level 1 Wizard has exactly 2 level-1 slots; exhaust them both
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_spells: ['Magic Missile'], spell_slots: { 1: { total: 2, used: 2 } } }}
      level={1} section="spells" onChange={vi.fn()}
    />);
    await waitFor(() => {
      expect(screen.getByTestId('cast-spell-Magic Missile')).toBeDisabled();
    });
  });

  it('clicking Cast then confirming decrements the corresponding spell slot', async () => {
    const onChange = vi.fn();
    // Level 1 Wizard has 2 level-1 slots (total from class table)
    render(<WizardSheet
      data={{ ...BASE_DATA, prepared_spells: ['Magic Missile'], spell_slots: { 1: { total: 2, used: 0 } } }}
      level={1} section="spells" onChange={onChange}
    />);
    await waitFor(() => screen.getByTestId('cast-spell-Magic Missile'));
    fireEvent.click(screen.getByTestId('cast-spell-Magic Missile'));
    // Cast now requires confirmation before consuming a slot
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('cast-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 1: { total: 2, used: 1 } } });
  });
});

describe('WizardSheet Portent (Divination subclass)', () => {
  it('does not render Portent for a non-Divination subclass', () => {
    render(<WizardSheet data={BASE_DATA} level={5} section="features" readOnly />);
    expect(screen.queryByTestId('portent-tracker')).not.toBeInTheDocument();
  });

  it('renders Portent tracker in the Features section (subclass sub-tab) for a Divination Wizard', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, subclass: 'School of Divination' }}
      level={5} section="features" onChange={vi.fn()}
    />);
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    expect(screen.getByTestId('portent-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('portent-roll-btn')).toBeInTheDocument();
  });

  it('does not render Portent in the Spells section', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, subclass: 'School of Divination' }}
      level={5} section="spells" onChange={vi.fn()}
    />);
    expect(screen.queryByTestId('portent-tracker')).not.toBeInTheDocument();
  });

  it('rolls 2 d20s and saves them via onChange', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // → 11
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, subclass: 'School of Divination' }}
      level={5} section="features" onChange={onChange}
    />);
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    fireEvent.click(screen.getByTestId('portent-roll-btn'));
    expect(onChange).toHaveBeenCalledWith({
      portent_rolls: [{ value: 11, used: false }, { value: 11, used: false }],
    });
    vi.restoreAllMocks();
  });

  it('expends a saved Portent die on click', () => {
    const onChange = vi.fn();
    render(<WizardSheet
      data={{ ...BASE_DATA, subclass: 'School of Divination', portent_rolls: [{ value: 9, used: false }] }}
      level={5} section="features" onChange={onChange}
    />);
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    fireEvent.click(screen.getByTestId('portent-die-0'));
    expect(onChange).toHaveBeenCalledWith({ portent_rolls: [{ value: 9, used: true }] });
  });
});
