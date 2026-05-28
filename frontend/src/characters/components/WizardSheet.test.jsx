import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WizardSheet from './WizardSheet';

// Guards that each section only renders its own content.
// Use exact label text (not broad regex) to avoid false matches inside feature description prose.

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

describe('WizardSheet prepared spells', () => {
  it('shows prepare limit in spells section (level + INT mod)', () => {
    render(<WizardSheet
      data={{ ...BASE_DATA, spellbook: ['Magic Missile', 'Shield'], prepared_spells: [] }}
      level={5}
      section="spells"
      abilityScores={{ intelligence: 16 }}
      readOnly
    />);
    // INT 16 → mod +3; level 5 → limit 8
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
    expect(screen.getByText(/Add spells to your spellbook above/)).toBeInTheDocument();
  });

  it('shows non-spellbook prepared spells in Other Prepared Spells list', () => {
    render(<WizardSheet
      data={{ spellbook: ['Magic Missile'], prepared_spells: ['Fireball'], hp_max: 8 }}
      level={5}
      section="spells"
      readOnly
    />);
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
    it('renders spell slot grid', () => {
      sheet('spells');
      expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    });

    it('renders cantrips list', () => {
      sheet('spells');
      expect(screen.getByText('Cantrips Known')).toBeInTheDocument();
    });

    it('renders spellbook list', () => {
      sheet('spells');
      expect(screen.getByText('Spellbook (all known spells)')).toBeInTheDocument();
    });

    it('renders Arcane Recovery tracker', () => {
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

    it('renders spell slot grid', () => {
      sheet('all');
      expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    });
  });
});
