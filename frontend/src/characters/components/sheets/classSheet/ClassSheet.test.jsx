import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FighterSheet5e as FighterSheet, FighterSheet2024 } from '@/characters/components/sheets/classSheet/configs';

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

  it('shows class features in the features section (list collapsed until the header is clicked)', () => {
    fighter();
    expect(screen.getByText('Class Features')).toBeInTheDocument();
    // The whole list is collapsed by default (header shows the earned count)
    expect(screen.queryByText('Extra Attack (2 attacks)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('class-features-toggle'));
    expect(screen.getByText('Extra Attack (2 attacks)')).toBeInTheDocument();
    // Collapses again on re-click
    fireEvent.click(screen.getByTestId('class-features-toggle'));
    expect(screen.queryByText('Extra Attack (2 attacks)')).not.toBeInTheDocument();
  });

  it('folds a feat speed bonus (Mobile +10) into Total Speed in the stats section', () => {
    render(<FighterSheet
      data={{ ...FIGHTER_DATA, speed: 30, feats: [{ name: 'Mobile', effects: [{ kind: 'stat_mod', stat: 'speed', amount: 10 }] }] }}
      level={5} section="stats" />);
    expect(screen.getByTestId('total-speed')).toHaveTextContent('40'); // 30 + 10
    expect(screen.getByTestId('total-speed-feat-note')).toHaveTextContent('+10 Mobile');
  });

  it('subtracts the armor Strength-requirement penalty (−10 ft) from Total Speed', () => {
    const inventory = [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, strength_requirement: 13, equipped: true }];
    render(<FighterSheet
      data={{ ...FIGHTER_DATA, speed: 30, inventory }}
      level={5} section="stats" scores={{ strength: 11 }} />);
    expect(screen.getByTestId('total-speed')).toHaveTextContent('20'); // 30 − 10
    expect(screen.getByTestId('total-speed-armor-note')).toHaveTextContent('−10 ft Chain Mail (Str 13 required)');
  });

  it('shows no armor speed penalty once Strength meets the requirement', () => {
    const inventory = [{ uid: 'a1', category: 'armor', name: 'Chain Mail', armor_type: 'heavy', armor_class: 16, strength_requirement: 13, equipped: true }];
    render(<FighterSheet
      data={{ ...FIGHTER_DATA, speed: 30, inventory }}
      level={5} section="stats" scores={{ strength: 13 }} />);
    expect(screen.getByTestId('total-speed')).toHaveTextContent('30');
    expect(screen.queryByTestId('total-speed-armor-note')).not.toBeInTheDocument();
  });
});

describe('ClassSheet — collapsible class features', () => {
  it('hides a feature description until its name is clicked, and collapses on re-click', () => {
    fighter();
    fireEvent.click(screen.getByTestId('class-features-toggle')); // expand the section
    const desc = 'You can attack twice, instead of once, whenever you take the Attack action on your turn.';
    expect(screen.queryByText(desc)).not.toBeInTheDocument();
    const toggle = screen.getByTestId('class-feature-toggle-Extra Attack (2 attacks)');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByText(desc)).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(screen.queryByText(desc)).not.toBeInTheDocument();
  });

  it('features expand independently', () => {
    fighter();
    fireEvent.click(screen.getByTestId('class-features-toggle')); // expand the section
    fireEvent.click(screen.getByTestId('class-feature-toggle-Second Wind'));
    expect(screen.getByText(/bonus action to regain hit points/i)).toBeInTheDocument();
    // Extra Attack stays collapsed
    expect(screen.queryByText(/attack twice, instead of once/i)).not.toBeInTheDocument();
  });

  it('creation mode keeps level-1 descriptions expanded (no toggles)', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={1} section="all" creation />);
    expect(screen.getByText(/bonus action to regain hit points/i)).toBeInTheDocument();
    expect(screen.queryByTestId('class-feature-toggle-Second Wind')).not.toBeInTheDocument();
  });
});

describe('ClassSheet — rest resource descriptions', () => {
  it('shows a short "what it does" line under each rest resource', () => {
    fighter();
    expect(screen.getByTestId('rest-resource-desc-second_wind_used'))
      .toHaveTextContent('Bonus action: regain 1d10 + your Fighter level HP.');
    expect(screen.getByTestId('rest-resource-desc-action_surge_used'))
      .toHaveTextContent('Take one additional action on your turn.');
  });

  it('shows the Indomitable description once earned (L9)', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={9} section="features" />);
    expect(screen.getByTestId('rest-resource-desc-indomitable_used'))
      .toHaveTextContent('Reroll a failed saving throw — you must use the new roll.');
  });
});

describe('ClassSheet — Features tab sub-tabs', () => {
  it('shows General + subclass-named sub-tabs in the features section', () => {
    fighter();
    expect(screen.getByTestId('features-subtab-general')).toHaveTextContent('General Fighter Features');
    expect(screen.getByTestId('features-subtab-subclass')).toHaveTextContent('Champion Features');
  });

  it('defaults to General; subclass content appears only after clicking the subclass tab', () => {
    fighter({ gmEdit: false });
    expect(screen.getByText('Extra Attacks')).toBeInTheDocument(); // general content
    expect(screen.queryByText('Champion')).not.toBeInTheDocument(); // subclass hidden
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    expect(screen.getByText('Champion')).toBeInTheDocument();        // subclass shown
    expect(screen.queryByText('Extra Attacks')).not.toBeInTheDocument(); // general hidden
  });

  it('labels the subclass tab "Subclass Features" when none is chosen', () => {
    render(<FighterSheet data={{ ...FIGHTER_DATA, subclass: undefined }} level={5} section="features" />);
    expect(screen.getByTestId('features-subtab-subclass')).toHaveTextContent('Subclass Features');
  });

  it('renders the Battle Master panel under the subclass tab for a Battle Master', () => {
    render(<FighterSheet data={{ ...FIGHTER_DATA, subclass: 'Battle Master' }} level={5} section="features" />);
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    expect(screen.getByTestId('battle-master-panel')).toBeInTheDocument();
  });

  it('renders no subclass panel for a subclass without one (Champion)', () => {
    fighter(); // Champion
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    expect(screen.queryByTestId('battle-master-panel')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^subclass-info-/).length).toBe(0);
  });

  it('shows the subclass picker when gmEdit is on', () => {
    fighter({ gmEdit: true });
    fireEvent.click(screen.getByTestId('features-subtab-subclass'));
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

describe('ClassSheet — Champion Additional Fighting Style (subclass level choice)', () => {
  // The block lives in the subclass sub-tab of the Features section.
  const openSubclassTab = () => fireEvent.click(screen.getByTestId('features-subtab-subclass'));

  it('shows the chosen additional fighting style read-only at L10', () => {
    render(<FighterSheet
      data={{ ...FIGHTER_DATA, additional_fighting_styles: ['Archery'] }}
      level={10} section="features" readOnly />);
    openSubclassTab();
    const block = screen.getByTestId('subclass-grant-additional_fighting_style');
    expect(within(block).getByText('Archery')).toBeInTheDocument();
  });

  it('offers an owed-slot picker when nothing is chosen and editable', () => {
    const onChange = vi.fn();
    render(<FighterSheet data={FIGHTER_DATA} level={10} section="features" onChange={onChange} />);
    openSubclassTab();
    // Defense is the base style → excluded; Archery is offered.
    fireEvent.click(screen.getByText('Archery'));
    expect(onChange).toHaveBeenCalledWith({ additional_fighting_styles: ['Archery'] });
  });

  it('does not render the block before the grant level (L9)', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={9} section="features" />);
    openSubclassTab();
    expect(screen.queryByTestId('subclass-grant-additional_fighting_style')).not.toBeInTheDocument();
  });

  it('shows an em dash (no picker) when readOnly with no pick', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={10} section="features" readOnly />);
    openSubclassTab();
    const block = screen.getByTestId('subclass-grant-additional_fighting_style');
    expect(within(block).getByText('—')).toBeInTheDocument();
  });
});
