import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
