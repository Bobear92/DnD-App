import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FighterSheet5e as FighterSheet, FighterSheet2024 } from '@/characters/components/sheets/classSheet/configs';

// The Eldritch Knight known-caster block renders an encyclopedia Link.
// SubclassDetails and the class-features link read campaignId from the URL; default to no route
// (so those links are omitted) and let a test opt in by setting mockParams before rendering.
let mockParams = {};
vi.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));
beforeEach(() => { mockParams = {}; });

// The known-caster block fetches the spell catalog (via encyclopediaService) to build its unified
// level strip. Default to an empty catalog so every existing test sees the flat (un-tabbed) list;
// the level-strip tests set `mockSpellCatalog` to a catalog with levels before rendering.
let mockSpellCatalog = [];
vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: { getSpells: vi.fn(() => Promise.resolve(mockSpellCatalog)) },
}));
beforeEach(() => { mockSpellCatalog = []; });

// Spells are only ever added from the compendium, so the GM's add path IS this browser.
// Mock it to a single add button per category (the gm-*-browser test ids live on the
// wrapper in CasterSpellBlock, so they still assert independently of this mock).
vi.mock('@/characters/components/spells/ClassSpellBrowser', () => ({
  default: ({ schools, minSpellLevel, onAdd }) => {
    const kind = minSpellLevel === 0 ? 'cantrips' : schools ? 'restricted' : 'any';
    return (
      <button type="button" data-testid={`csb-add-${kind}`} onClick={() => onAdd?.('Absorb Elements')}>
        {`csb-add:${kind}`}
      </button>
    );
  },
  maxCastableLevel: (slots) => {
    let max = 0;
    slots.forEach((n, i) => { if (n > 0) max = i + 1; });
    return max;
  },
}));

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

  // The sheet no longer repeats the class's rules text — the encyclopedia class page has it at
  // every level, so the features section links there instead of carrying a dropdown of prose.
  it('links to the encyclopedia class page instead of listing the class features', () => {
    mockParams = { campaignId: '4' };
    fighter();
    expect(screen.getByTestId('class-encyclopedia-link')).toHaveAttribute(
      'href',
      '/campaigns/4/encyclopedia/classes/Fighter'
    );
    expect(screen.queryByTestId('class-features-toggle')).not.toBeInTheDocument();
    expect(screen.queryByText('Extra Attack (2 attacks)')).not.toBeInTheDocument();
  });

  it('omits the encyclopedia link when rendered outside a campaign route', () => {
    fighter();
    expect(screen.queryByTestId('class-encyclopedia-link')).not.toBeInTheDocument();
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

describe('ClassSheet — class feature text', () => {
  // At creation the level-1 features are what you're choosing between, so they're read inline;
  // the encyclopedia link belongs to the live sheet, where the full class is a click away.
  it('creation mode lists the level-1 descriptions instead of the encyclopedia link', () => {
    mockParams = { campaignId: '4' };
    render(<FighterSheet data={FIGHTER_DATA} level={1} section="all" creation />);
    expect(screen.getByText(/bonus action to regain hit points/i)).toBeInTheDocument();
    expect(screen.queryByTestId('class-encyclopedia-link')).not.toBeInTheDocument();
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

  // Samurai's Fighting Spirit had no tracker at all until the initiative work needed a pool for
  // Tireless Spirit to refill. Subclass-gated, so only a Samurai sees it.
  it('shows the Samurai Fighting Spirit pool, and only for a Samurai', () => {
    render(<FighterSheet data={{ ...FIGHTER_DATA, subclass: 'Samurai' }} level={10} section="features" />);
    const row = screen.getByTestId('rest-resource-fighting_spirit_used');
    expect(within(row).getByText('Fighting Spirit (Long Rest)')).toBeInTheDocument();
    expect(screen.getByTestId('rest-resource-desc-fighting_spirit_used'))
      .toHaveTextContent('advantage on your weapon attack rolls');
  });

  it('hides Fighting Spirit from a Champion', () => {
    render(<FighterSheet data={{ ...FIGHTER_DATA, subclass: 'Champion' }} level={10} section="features" />);
    expect(screen.queryByTestId('rest-resource-fighting_spirit_used')).not.toBeInTheDocument();
  });

  it('shows the Indomitable description once earned (L9)', () => {
    render(<FighterSheet data={FIGHTER_DATA} level={9} section="features" />);
    expect(screen.getByTestId('rest-resource-desc-indomitable_used'))
      .toHaveTextContent('Reroll a failed saving throw — you must use the new roll.');
  });

  // The Cavalier's two pools are the first sized by an ability modifier rather than by level,
  // so these assert the score actually reaches the tracker.
  describe('Cavalier ability-modifier pools', () => {
    const cavalier = (level, scores) => render(
      <FighterSheet
        data={{ ...FIGHTER_DATA, subclass: 'Cavalier' }}
        level={level}
        section="features"
        scores={scores}
      />
    );

    it('sizes Unwavering Mark by Strength, not by level', () => {
      cavalier(3, { strength: 18, constitution: 14 });
      expect(within(screen.getByTestId('rest-resource-unwavering_mark_used')).getByText('4 / 4 remaining'))
        .toBeInTheDocument();
    });

    it('sizes Warding Maneuver by Constitution once earned at L7', () => {
      cavalier(7, { strength: 18, constitution: 16 });
      expect(within(screen.getByTestId('rest-resource-warding_maneuver_used')).getByText('3 / 3 remaining'))
        .toBeInTheDocument();
    });

    it('floors both at one use so a low modifier still gets the feature', () => {
      cavalier(7, { strength: 8, constitution: 9 });
      expect(within(screen.getByTestId('rest-resource-unwavering_mark_used')).getByText('1 / 1 remaining'))
        .toBeInTheDocument();
      expect(within(screen.getByTestId('rest-resource-warding_maneuver_used')).getByText('1 / 1 remaining'))
        .toBeInTheDocument();
    });

    it('withholds Warding Maneuver until L7', () => {
      cavalier(6, { strength: 18, constitution: 16 });
      expect(screen.getByTestId('rest-resource-unwavering_mark_used')).toBeInTheDocument();
      expect(screen.queryByTestId('rest-resource-warding_maneuver_used')).not.toBeInTheDocument();
    });

    it('shows neither to a Champion', () => {
      render(<FighterSheet data={FIGHTER_DATA} level={7} section="features" scores={{ strength: 18, constitution: 16 }} />);
      expect(screen.queryByTestId('rest-resource-unwavering_mark_used')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rest-resource-warding_maneuver_used')).not.toBeInTheDocument();
    });
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

  it('a player sees Use but no − recover button (a use returns only from a rest)', () => {
    fighter({ data: { ...FIGHTER_DATA, second_wind_used: 1 } });
    const row = screen.getByTestId('rest-resource-second_wind_used');
    expect(within(row).getByRole('button', { name: /Use Second Wind/i })).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /Recover Second Wind/i })).not.toBeInTheDocument();
  });

  it('the GM (isGm) gets the − recover button to correct the count', () => {
    const onChange = vi.fn();
    fighter({ data: { ...FIGHTER_DATA, second_wind_used: 1 }, onChange, isGm: true });
    const row = screen.getByTestId('rest-resource-second_wind_used');
    fireEvent.click(within(row).getByRole('button', { name: /Recover Second Wind/i }));
    expect(onChange).toHaveBeenCalledWith({ second_wind_used: 0 });
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

describe('ClassSheet — Eldritch Knight subclass caster', () => {
  const EK_DATA = {
    ...FIGHTER_DATA,
    subclass: 'Eldritch Knight',
    cantrips: ['Fire Bolt', 'Blade Ward'],
    known_spells: ['Shield', 'Magic Missile', 'Burning Hands'],
    // 5e: 2 Abjuration/Evocation slots + the 1 any-school slot earned at L3.
    ek_spell_slots: { Shield: 'restricted', 'Magic Missile': 'restricted', 'Burning Hands': 'any' },
    spell_slots: { 1: { total: 2, used: 1 } },
  };

  it('renders the known-caster block in the spells section for an EK Fighter', () => {
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} />);
    expect(screen.getByTestId('known-caster-block')).toBeInTheDocument();
    // Third-caster slots at L3: 2 × L1 (one used → 1/2)
    expect(screen.getByText('Spell Slots (Long Rest)')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    // Known lists with count/limit labels. 5e splits the 3 leveled spells into the two
    // school categories: 2 Abjuration/Evocation + the 1 any-school slot earned at L3.
    expect(screen.getByText(/Cantrips Known — 2\/2/)).toBeInTheDocument();
    expect(screen.getByText(/Abjuration & Evocation Spells — 2\/2/)).toBeInTheDocument();
    expect(screen.getByText(/Any School — 1\/1/)).toBeInTheDocument();
    // The wizard-list / INT note
    expect(screen.getByText(/Wizard list/i)).toBeInTheDocument();
    // No prepare flow for a known caster
    expect(screen.queryByText('Prepare Spells')).not.toBeInTheDocument();
  });

  it('shows a spellcasting summary (ability · save DC · attack bonus) for an EK', () => {
    render(
      <FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1}
        abilityScores={{ intelligence: 16 }} />
    );
    const summary = screen.getByTestId('spell-casting-summary');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent(/intelligence/i);
    // pb 2 (L3) + INT mod +3 → DC 13, attack +5
    expect(screen.getByTestId('spell-save-dc')).toHaveTextContent('13');
    expect(screen.getByTestId('spell-attack-bonus')).toHaveTextContent('+5');
  });

  it('renders nothing in the spells section before the subclass caster unlocks (L2)', () => {
    const { container } = render(
      <FighterSheet data={{ ...FIGHTER_DATA, subclass: 'Eldritch Knight' }} level={2} section="spells" campaignId={1} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('still renders nothing in the spells section for a Champion at L3+', () => {
    const { container } = render(<FighterSheet data={FIGHTER_DATA} level={5} section="spells" campaignId={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('players cannot add/remove known spells or cantrips — lists change at level-up (note shown)', () => {
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} onChange={vi.fn()} />);
    expect(screen.queryByPlaceholderText('Add spell…')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add cantrip…')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gm-spell-browser')).not.toBeInTheDocument();
    expect(screen.getByTestId('known-lists-note')).toHaveTextContent(/level up/i);
  });

  it('the GM with GM Edit OFF sees locked lists too — no editors, just the toggle hint', () => {
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} onChange={vi.fn()} isGm />);
    expect(screen.queryByPlaceholderText('Add spell…')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gm-cantrip-browser')).not.toBeInTheDocument();
    expect(screen.queryByTestId('gm-spell-browser')).not.toBeInTheDocument();
    expect(screen.getByTestId('known-lists-note')).toHaveTextContent(/GM Edit/);
  });

  it('the GM with GM Edit ON edits the lists through the compendium browsers — no free-text add', () => {
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} onChange={vi.fn()} isGm gmEdit />);
    // A browse picker per school category (5e), plus the cantrip one.
    expect(screen.getByTestId('gm-cantrip-browser')).toBeInTheDocument();
    expect(screen.getByTestId('gm-spell-browser-restricted')).toBeInTheDocument();
    expect(screen.getByTestId('gm-spell-browser-any')).toBeInTheDocument();
    expect(screen.queryByTestId('known-lists-note')).not.toBeInTheDocument();
    // Spells only ever come from the compendium — there is no type-a-name input anywhere.
    expect(screen.queryByPlaceholderText('Add spell…')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Add cantrip…')).not.toBeInTheDocument();
  });

  it('5e: a spell shows in the slot it was recorded in, and a GM add records the slot', () => {
    const onChange = vi.fn();
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} onChange={onChange} isGm gmEdit />);
    // Burning Hands is an Evocation but was learned in the any-school slot — it stays there.
    expect(screen.getByTestId('ek-known-any')).toHaveTextContent('Burning Hands');
    expect(screen.getByTestId('ek-known-restricted')).toHaveTextContent('Shield');

    // Adding through the restricted category's compendium browser records that slot.
    fireEvent.click(screen.getByTestId('csb-add-restricted'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      known_spells: [...EK_DATA.known_spells, 'Absorb Elements'],
      ek_spell_slots: { ...EK_DATA.ek_spell_slots, 'Absorb Elements': 'restricted' },
    }));
  });

  it('2024 EK has no school split — one unrestricted Spells Known list', () => {
    render(<FighterSheet2024 data={EK_DATA} level={3} section="spells" campaignId={1} />);
    expect(screen.getByText(/Spells Known — 3\/3/)).toBeInTheDocument();
    expect(screen.queryByTestId('ek-known-restricted')).not.toBeInTheDocument();
  });

  it('players get NO slot steppers — slots are spent by casting and reset by GM rest', () => {
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} onChange={vi.fn()} />);
    expect(screen.queryByTestId('slot-inc-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('slot-dec-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('slot-tracker-note')).toBeInTheDocument();
  });

  it('the GM slot stepper persists via onChange (spell_slots patch, same semantics as the Wizard grid)', () => {
    const onChange = vi.fn();
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} onChange={onChange} isGm />);
    // The + button undoes one expended use (used 1 → 0); casting is what expends slots.
    fireEvent.click(screen.getByTestId('slot-inc-1'));
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 1: { total: 2, used: 0 } } });
  });

  it('readOnly hides the slot steppers and list controls', () => {
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} readOnly isGm />);
    expect(screen.queryByTestId('slot-inc-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '−' })).not.toBeInTheDocument();
  });

  it('with no catalog loaded, falls back to the flat stacked list (no level strip)', () => {
    // mockSpellCatalog stays [] → useTabs false → cantrips + both category lists render at once.
    render(<FighterSheet data={EK_DATA} level={3} section="spells" campaignId={1} />);
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
    expect(screen.getByTestId('ek-known-restricted')).toBeInTheDocument();
    expect(screen.getByTestId('ek-known-any')).toBeInTheDocument();
  });
});

describe('ClassSheet — Eldritch Knight unified spell level strip', () => {
  // A richer EK with spells at cantrip / 1st / 2nd so the strip spans three tabs. 2nd level has
  // BOTH a restricted (Shatter) and any-school (Mirror Image, Misty Step) spell so a leveled tab
  // can show both category sections.
  const EK_MULTI = {
    hp_max: 52,
    subclass: 'Eldritch Knight',
    cantrips: ['Fire Bolt', 'Blade Ward'],
    known_spells: ['Shield', 'Burning Hands', 'Shatter', 'Mirror Image', 'Misty Step'],
    ek_spell_slots: {
      Shield: 'restricted', 'Burning Hands': 'restricted', Shatter: 'restricted',
      'Mirror Image': 'any', 'Misty Step': 'any',
    },
    spell_slots: { 1: { total: 4, used: 0 }, 2: { total: 2, used: 0 } },
  };
  const CATALOG = [
    { name: 'Fire Bolt', level: 0 }, { name: 'Blade Ward', level: 0 },
    { name: 'Shield', level: 1 }, { name: 'Burning Hands', level: 1 },
    { name: 'Shatter', level: 2 }, { name: 'Mirror Image', level: 2 }, { name: 'Misty Step', level: 2 },
  ];
  const renderMulti = (props = {}) =>
    render(<FighterSheet data={EK_MULTI} level={7} section="spells" campaignId={1} {...props} />);

  it('shows ONE level strip (Cantrips / 1st / 2nd) with per-level counts and no others', async () => {
    mockSpellCatalog = CATALOG;
    renderMulti();
    await screen.findByTestId('spell-level-tabs');
    expect(screen.getByTestId('spell-level-tab-0')).toHaveTextContent('Cantrips (2)');
    expect(screen.getByTestId('spell-level-tab-1')).toHaveTextContent('1st (2)');
    expect(screen.getByTestId('spell-level-tab-2')).toHaveTextContent('2nd (3)');
    expect(screen.queryByTestId('spell-level-tab-3')).not.toBeInTheDocument();
  });

  it('defaults to the Cantrips tab: cantrips shown in a tab, no category sections', async () => {
    mockSpellCatalog = CATALOG;
    renderMulti();
    await screen.findByTestId('spell-level-tabs');
    expect(screen.getByText('Fire Bolt')).toBeInTheDocument();
    expect(screen.getByText('Blade Ward')).toBeInTheDocument();
    expect(screen.queryByTestId('ek-known-restricted')).not.toBeInTheDocument();
    expect(screen.queryByText('Shield')).not.toBeInTheDocument();
  });

  it('the 1st-level tab shows only the Abj/Evo section (Any School hidden — no 1st-level spell)', async () => {
    mockSpellCatalog = CATALOG;
    renderMulti();
    await screen.findByTestId('spell-level-tabs');
    fireEvent.click(screen.getByTestId('spell-level-tab-1'));
    expect(screen.getByTestId('ek-known-restricted')).toHaveTextContent(/Abjuration & Evocation Spells/);
    expect(screen.getByText('Shield')).toBeInTheDocument();
    expect(screen.getByText('Burning Hands')).toBeInTheDocument();
    expect(screen.queryByText('Fire Bolt')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ek-known-any')).not.toBeInTheDocument();
  });

  it('the 2nd-level tab shows BOTH sections, each keeping its full x/y capacity label', async () => {
    mockSpellCatalog = CATALOG;
    renderMulti();
    await screen.findByTestId('spell-level-tabs');
    fireEvent.click(screen.getByTestId('spell-level-tab-2'));
    // Restricted section — only its 2nd-level spell (Shatter), but the label counts all 3 restricted.
    const restricted = screen.getByTestId('ek-known-restricted');
    expect(restricted).toHaveTextContent(/Abjuration & Evocation Spells — 3\//);
    expect(within(restricted).getByText('Shatter')).toBeInTheDocument();
    // Any-School section — both its 2nd-level spells, label counts the 2 any-school known.
    const any = screen.getByTestId('ek-known-any');
    expect(any).toHaveTextContent(/Any School — 2\//);
    expect(within(any).getByText('Mirror Image')).toBeInTheDocument();
    expect(within(any).getByText('Misty Step')).toBeInTheDocument();
    // 1st-level Abj/Evo spells are on the other tab.
    expect(screen.queryByText('Shield')).not.toBeInTheDocument();
  });

  it('does not show the strip when spells span only one level (cantrips only)', async () => {
    mockSpellCatalog = CATALOG;
    render(
      <FighterSheet
        data={{ ...EK_MULTI, known_spells: [], ek_spell_slots: {} }}
        level={7} section="spells" campaignId={1}
      />
    );
    await screen.findByText('Fire Bolt');
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
  });
});

describe('ClassSheet — EK spell strip folds Racial + Feat sources', () => {
  const EK = {
    hp_max: 52,
    subclass: 'Eldritch Knight',
    cantrips: ['Fire Bolt'],
    known_spells: ['Shield'],
    ek_spell_slots: { Shield: 'restricted' },
    spell_slots: { 1: { total: 2, used: 0 } },
  };
  const CATALOG = [{ name: 'Fire Bolt', level: 0 }, { name: 'Shield', level: 1 }];
  const FOLD_PROPS = {
    raceGrantedCantrips: ['Prestidigitation'],
    featSpells: { cantrips: ['Guidance'], leveled: [{ name: 'Bless', level: 1 }] },
    featTrackers: <div data-testid="feat-trackers-test">trackers</div>,
  };
  const renderFold = () =>
    render(<FighterSheet data={EK} level={7} section="spells" campaignId={1} {...FOLD_PROPS} />);

  it('Cantrips tab shows a Class/Racial/Feats source toggle; Class is the default', async () => {
    mockSpellCatalog = CATALOG;
    renderFold();
    await screen.findByTestId('spell-level-tabs');
    // Level counts fold in every source: 3 cantrips (Fire Bolt + Prestidigitation + Guidance).
    expect(screen.getByTestId('spell-level-tab-0')).toHaveTextContent('Cantrips (3)');
    const tabs = screen.getByTestId('spell-source-tabs');
    expect(within(tabs).getByTestId('spell-source-class')).toBeInTheDocument();
    expect(within(tabs).getByTestId('spell-source-racial')).toBeInTheDocument();
    expect(within(tabs).getByTestId('spell-source-feats')).toBeInTheDocument();
    // Class content is the default.
    expect(screen.getByText('Fire Bolt')).toBeInTheDocument();
    expect(screen.queryByText('Prestidigitation')).not.toBeInTheDocument();
  });

  it('switching to Racial shows the race-granted cantrips', async () => {
    mockSpellCatalog = CATALOG;
    renderFold();
    await screen.findByTestId('spell-source-racial');
    fireEvent.click(screen.getByTestId('spell-source-racial'));
    const racial = screen.getByTestId('spell-source-racial-content');
    expect(within(racial).getByText('Prestidigitation')).toBeInTheDocument();
    expect(screen.queryByText('Fire Bolt')).not.toBeInTheDocument();
  });

  it('switching to Feats shows the feat spells + the trackers node', async () => {
    mockSpellCatalog = CATALOG;
    renderFold();
    await screen.findByTestId('spell-source-feats');
    fireEvent.click(screen.getByTestId('spell-source-feats'));
    const feats = screen.getByTestId('spell-source-feats-content');
    expect(within(feats).getByText('Guidance')).toBeInTheDocument();
    expect(screen.getByTestId('feat-trackers-test')).toBeInTheDocument();
  });

  it('the 1st-level tab shows a Class/Feats toggle (no Racial — race grants only cantrips)', async () => {
    mockSpellCatalog = CATALOG;
    renderFold();
    await screen.findByTestId('spell-level-tabs');
    fireEvent.click(screen.getByTestId('spell-level-tab-1'));
    const tabs = screen.getByTestId('spell-source-tabs');
    expect(within(tabs).getByTestId('spell-source-class')).toBeInTheDocument();
    expect(within(tabs).getByTestId('spell-source-feats')).toBeInTheDocument();
    expect(within(tabs).queryByTestId('spell-source-racial')).not.toBeInTheDocument();
    // Class content by default → the restricted Shield.
    expect(screen.getByText('Shield')).toBeInTheDocument();
    // Feat leveled spell appears under the Feats source.
    fireEvent.click(screen.getByTestId('spell-source-feats'));
    expect(within(screen.getByTestId('spell-source-feats-content')).getByText('Bless')).toBeInTheDocument();
  });

  it('shows no source toggle at a level where only the class has spells', async () => {
    mockSpellCatalog = CATALOG;
    // No racial, no feats → class-only strip, no source toggle on any tab.
    render(<FighterSheet data={EK} level={7} section="spells" campaignId={1} />);
    await screen.findByText('Fire Bolt');
    expect(screen.queryByTestId('spell-source-tabs')).not.toBeInTheDocument();
  });
});
