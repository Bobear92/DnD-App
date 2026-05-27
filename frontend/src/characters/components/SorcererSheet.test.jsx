import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SorcererSheet from './SorcererSheet';

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
