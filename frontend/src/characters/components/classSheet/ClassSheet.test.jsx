import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FighterSheet5e as FighterSheet, FighterSheet2024 } from './configs';

// Behavior tests for the data-driven ClassSheet via the Fighter (martial) config.
// Covers the Epic 0 / Epic 1 / Epic 3 primitives: locked choices + GM Edit, rest-resource
// use-buttons, section isolation. Wizard (caster) behavior is covered by WizardSheet.test.jsx.

const FIGHTER_DATA = {
  hp_max: 52,
  current_hp: 45,
  fighting_style: 'Defense',
  subclass: 'Champion',
  skill_proficiencies: ['Athletics'],
};

function fighter(extra = {}) {
  return render(<FighterSheet data={FIGHTER_DATA} level={5} section="features" {...extra} />);
}

describe('ClassSheet — martial section isolation', () => {
  it('renders nothing in the spells section for a non-caster', () => {
    const { container } = render(<FighterSheet data={FIGHTER_DATA} level={5} section="spells" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows Extra Attacks at level 5 in the features section', () => {
    fighter();
    expect(screen.getByText('Extra Attacks')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows class features in the features section', () => {
    fighter();
    expect(screen.getByText('Class Features')).toBeInTheDocument();
    expect(screen.getByText('Extra Attack (2 attacks)')).toBeInTheDocument();
  });
});

describe('ClassSheet — locked choices + GM Edit (Epic 1)', () => {
  it('locks Fighting Style to plain text outside creation when gmEdit is off', () => {
    fighter({ gmEdit: false });
    expect(screen.getByText('Defense')).toBeInTheDocument();
    // Picker would surface other style options like "Archery" — none should appear.
    expect(screen.queryByText('Archery')).not.toBeInTheDocument();
  });

  it('unlocks Fighting Style picker when gmEdit is on', () => {
    fighter({ gmEdit: true });
    expect(screen.getByText('Archery')).toBeInTheDocument();
  });

  it('keeps Fighting Style editable during creation regardless of gmEdit', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={1} section="all" creation gmEdit={false} />);
    expect(screen.getByText('Archery')).toBeInTheDocument();
  });

  it('locks subclass to SubclassDetails when gmEdit is off (no picker info buttons)', () => {
    fighter({ gmEdit: false });
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^subclass-info-/).length).toBe(0);
  });

  it('shows the subclass picker when gmEdit is on', () => {
    fighter({ gmEdit: true });
    expect(screen.getByTestId('subclass-info-Champion')).toBeInTheDocument();
  });
});

describe('ClassSheet — rest resources are use-buttons (Epic 3)', () => {
  it('shows Second Wind with a Use button in play mode', () => {
    fighter();
    const row = screen.getByTestId('rest-resource-second_wind_used');
    expect(within(row).getByText('Second Wind (Short Rest)')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /Use Second Wind/i })).toBeInTheDocument();
  });

  it('clicking Use opens a confirm dialog; confirming expends the resource', () => {
    const onChange = vi.fn();
    fighter({ onChange });
    fireEvent.click(within(screen.getByTestId('rest-resource-second_wind_used')).getByRole('button', { name: /Use Second Wind/i }));
    // Dialog explains it won't recharge until a rest — nothing expended yet.
    expect(screen.getByText(/won't come back until a short or long rest/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('rest-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ second_wind_used: 1 });
  });

  it('hides rest resources during creation (level 1)', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={1} section="all" creation />);
    expect(screen.queryByText('Second Wind (Short Rest)')).not.toBeInTheDocument();
  });

  it('hides use/recover buttons when readOnly', () => {
    fighter({ readOnly: true });
    const row = screen.getByTestId('rest-resource-second_wind_used');
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ClassSheet — 2024 Fighter extras', () => {
  it('renders Weapon Mastery and Tactical Mind note', () => {
    render(<FighterSheet2024 data={FIGHTER_DATA} level={5} section="features" />);
    // "Weapon Mastery" appears both as the picker field label and the class-feature name.
    expect(screen.getAllByText(/Weapon Mastery/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tactical Mind/).length).toBeGreaterThan(0);
  });
});
