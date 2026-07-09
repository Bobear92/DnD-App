import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SorcererSheet from '@/characters/components/sheets/SorcererSheet';

// Guards that Sorcery Points tracker appears in the Spells tab, not the Features tab.

const BASE_DATA = {
  cantrips: ['Fire Bolt'],
  known_spells: ['Fireball'],
  spell_slots: { 1: { total: 2, used: 0 } },
  hp_max: 8,
  current_hp: 8,
  subclass: 'Wild Magic',
  sorcery_points_used: 0,
};

function sheet(section, level = 5, extraProps = {}) {
  return render(<SorcererSheet data={BASE_DATA} level={level} section={section} readOnly {...extraProps} />);
}

describe('SorcererSheet section routing', () => {
  describe('section="features"', () => {
    it('renders class features heading', () => {
      sheet('features');
      expect(screen.getByText('Class Features')).toBeInTheDocument();
    });

    it('does not render Sorcery Points tracker', () => {
      sheet('features');
      expect(screen.queryByText('Sorcery Points (Long Rest)')).not.toBeInTheDocument();
    });

    it('does not render spell slot grid', () => {
      sheet('features');
      expect(screen.queryByText('Spell Slots (Long Rest)')).not.toBeInTheDocument();
    });

    it('does not render HP fields', () => {
      sheet('features');
      expect(screen.queryByText('Current HP')).not.toBeInTheDocument();
    });
  });

  describe('section="spells"', () => {
    it('renders Sorcery Points tracker at L2+', () => {
      sheet('spells', 5);
      expect(screen.getByText('Sorcery Points (Long Rest)')).toBeInTheDocument();
    });

    it('does not render Sorcery Points tracker at L1', () => {
      sheet('spells', 1);
      expect(screen.queryByText('Sorcery Points (Long Rest)')).not.toBeInTheDocument();
    });

    it('renders spell slot grid', () => {
      sheet('spells');
      expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
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

    it('renders Sorcery Points tracker', () => {
      sheet('all');
      expect(screen.getByText('Sorcery Points (Long Rest)')).toBeInTheDocument();
    });

    it('renders spell slot grid', () => {
      sheet('all');
      expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    });
  });
});

describe('SorcererSheet Draconic Bloodline — Dragon Ancestor picker', () => {
  it('does not render the picker for non-draconic subclasses', () => {
    render(<SorcererSheet data={{ subclass: 'Wild Magic' }} level={5} section="features" readOnly />);
    expect(screen.queryByText('Draconic Ancestry (Dragon Ancestor)')).not.toBeInTheDocument();
  });

  it('renders the picker for Draconic Bloodline in features section', () => {
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline' }} level={5} section="features" readOnly />);
    expect(screen.getByText('Draconic Ancestry (Dragon Ancestor)')).toBeInTheDocument();
  });

  it('does not render the picker in the stats section', () => {
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline' }} level={5} section="stats" readOnly />);
    expect(screen.queryByText('Draconic Ancestry (Dragon Ancestor)')).not.toBeInTheDocument();
  });

  it('shows the chosen dragon as a badge when read-only', () => {
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline', draconic_bloodline: { name: 'Red', damage: 'Fire' } }} level={5} section="features" readOnly />);
    expect(screen.getByTestId('draconic-bloodline-badge')).toHaveTextContent('Red Dragon (Fire)');
  });

  it('shows empty-state text when no dragon chosen and read-only', () => {
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline' }} level={5} section="features" readOnly />);
    expect(screen.getByText('No dragon type chosen')).toBeInTheDocument();
  });

  it('calls onChange with {name, damage} when a dragon is picked', () => {
    const onChange = vi.fn();
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline' }} level={5} section="features" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('draconic-bloodline-Red'));
    expect(onChange).toHaveBeenCalledWith({ draconic_bloodline: { name: 'Red', damage: 'Fire' } });
  });

  it('deselects (null) when clicking the already-chosen dragon during creation', () => {
    // Deselect is only possible during creation; after creation the picker locks.
    const onChange = vi.fn();
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline', draconic_bloodline: { name: 'Red', damage: 'Fire' } }} level={1} section="features" creation onChange={onChange} />);
    fireEvent.click(screen.getByTestId('draconic-bloodline-Red'));
    expect(onChange).toHaveBeenCalledWith({ draconic_bloodline: null });
  });

  it('locks to a read-only badge after creation once a dragon is chosen (not editable on the fly)', () => {
    // Outside creation, with a chosen dragon and an editable sheet (readOnly=false):
    // the picker must lock — show the badge, hide the selectable buttons.
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline', draconic_bloodline: { name: 'Red', damage: 'Fire' } }} level={5} section="features" creation={false} onChange={vi.fn()} />);
    expect(screen.getByTestId('draconic-bloodline-badge')).toHaveTextContent('Red Dragon (Fire)');
    expect(screen.queryByTestId('draconic-bloodline-Red')).not.toBeInTheDocument();
  });

  it('stays editable during creation even after a dragon is chosen', () => {
    render(<SorcererSheet data={{ subclass: 'Draconic Bloodline', draconic_bloodline: { name: 'Red', damage: 'Fire' } }} level={1} section="features" creation onChange={vi.fn()} />);
    expect(screen.getByTestId('draconic-bloodline-Red')).toBeInTheDocument();
    expect(screen.queryByTestId('draconic-bloodline-badge')).not.toBeInTheDocument();
  });
});

describe('SorcererSheet spell slot controls (players cast, GM corrects)', () => {
  it('a player (non-GM, editable) gets NO slot steppers — only the casting note', () => {
    sheet('spells', 5, { readOnly: false });
    expect(screen.queryByTestId('slot-dec-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slot-inc-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('slot-tracker-note')).toBeInTheDocument();
  });

  it('the GM gets steppers that patch spell_slots', () => {
    const onChange = vi.fn();
    sheet('spells', 5, { readOnly: false, isGm: true, onChange });
    fireEvent.click(screen.getByTestId('slot-dec-1'));
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 1: { total: 4, used: 1 } } });
  });
});
