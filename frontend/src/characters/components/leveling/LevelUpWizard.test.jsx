import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import LevelUpWizard from '@/characters/components/leveling/LevelUpWizard';

// Simplify SubclassPickerWithDetail so each option is a plain button
vi.mock('@/characters/components/subclass/SubclassPickerWithDetail', () => ({
  default: ({ options, value, onChange }) => (
    <div data-testid="subclass-picker">
      {(options ?? []).map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          data-testid={`subclass-option-${i}`}
          aria-pressed={value === opt.value}
        >
          {opt.value}
        </button>
      ))}
    </div>
  ),
}));

// SpellList reads CampaignContext + fetches the catalog — mock it to a single add button.
vi.mock('@/characters/components/spells/SpellList', () => ({
  // SpellList is display+remove only — there is no free-text add anywhere in the app, so the
  // mock has no add button either. Adds happen through the ClassSpellBrowser mock below.
  default: ({ label, spells = [], onRemove, lockedSpells = [] }) => (
    <div data-testid={`spelllist-${label}`}>
      <span data-testid={`spelllist-count-${label}`}>{spells.length}</span>
      <span data-testid={`spelllist-spells-${label}`}>{spells.join(',')}</span>
      {/* A locked spell renders NO remove button — the refusal is visible, not silent. */}
      {spells.filter((s) => !lockedSpells.includes(s)).map((s) => (
        <button key={s} type="button" onClick={() => onRemove?.(s)}>{`remove:${s}`}</button>
      ))}
    </div>
  ),
}));

// The browse picker in the New Spells step (fetches the spell catalog in the real component).
// The mock exposes the class list + level bounds it was given and an add button.
vi.mock('@/characters/components/spells/ClassSpellBrowser', () => ({
  default: ({ className, minSpellLevel, maxSpellLevel, onAdd, preparedSpells = [], grantedSpells = [], schools = null }) => {
    // A school-restricted browser (the 5e Eldritch Knight's Abjuration/Evocation slots) is a
    // distinct picker from the unrestricted one, so it gets its own test id.
    const kind = minSpellLevel === 0 ? 'cantrips' : schools ? 'restricted' : 'spells';
    const base = { cantrips: 'Browse Cantrip', restricted: 'Browse Restricted', spells: 'Browse Spell' }[kind];
    // Each click picks a DISTINCT spell (the real browser offers a whole catalog, not one
    // button), so a test can fill a page to its quota by clicking N times.
    const pick = `${base} ${preparedSpells.length + 1}`;
    return (
      <div data-testid={`csb-${kind}`}>
        <span data-testid={`csb-class-${kind}`}>{className}</span>
        <span data-testid={`csb-max-${kind}`}>{String(maxSpellLevel)}</span>
        <span data-testid={`csb-granted-${kind}`}>{grantedSpells.join(',')}</span>
        <span data-testid={`csb-schools-${kind}`}>{(schools ?? []).join(',')}</span>
        <button type="button" onClick={() => onAdd?.(pick)}>{`csb-add:${kind}`}</button>
      </div>
    );
  },
  maxCastableLevel: (slots) => {
    let max = 0;
    slots.forEach((n, i) => { if (n > 0) max = i + 1; });
    return max;
  },
}));

// FeatPicker uses a Radix dialog — mock it to a flat button list so we can assert which
// feats are offered (eligibility filtering) and pick one.
vi.mock('@/characters/components/feats/FeatPicker', () => ({
  default: ({ feats = [], onChange, getDisabledReason }) => (
    <div data-testid="feat-picker">
      {feats.map((f) => {
        const reason = getDisabledReason ? getDisabledReason(f) : null;
        return (
          <button
            key={f.id}
            type="button"
            disabled={!!reason}
            data-locked={String(!!reason)}
            data-testid={`pick-feat-${f.id}`}
            onClick={() => { if (!reason) onChange({ id: f.id, name: f.name }); }}
          >
            {f.name}{reason ? ` (locked: ${reason})` : ''}
          </button>
        );
      })}
    </div>
  ),
}));

// FeatSpellGrantPicker is unit-tested on its own; mock it here so the wizard integration test
// can fill a complete value without the spell catalogue. spellGrantComplete keeps the real shape.
vi.mock('@/characters/components/feats/FeatSpellGrantPicker', () => ({
  default: ({ onChange }) => (
    <div data-testid="spell-grant-picker">
      <button
        type="button"
        data-testid="spell-grant-fill"
        onClick={() => onChange({ source: 'Wizard', ability: 'intelligence', cantrips: ['Fire Bolt', 'Light'], leveled: [{ name: 'Mage Armor', level: 1 }], free_cast: 'Mage Armor' })}
      >Fill spells</button>
    </div>
  ),
  spellGrantComplete: (spec, v) => !!(v && v.source && (v.cantrips?.length || 0) === (spec?.cantrips || 0) && (v.leveled?.length || 0) === (spec?.leveled?.length || 0)),
  resolveSpellGrantValue: (spec, v) => ({
    ...(v || {}), fixed: spec?.fixed || [],
    free_casts: spec?.free_cast ? [...(spec.fixed || []).filter((s) => (s.level ?? 0) >= 1).map((s) => s.name), ...((v?.leveled) || []).map((s) => s.name)] : [],
  }),
}));

// featService.getFeats is fetched on mount for ASI-feat levels.
vi.mock('@/encyclopedia/featService', () => ({
  default: { getFeats: vi.fn().mockResolvedValue([]) },
}));
import featService from '@/encyclopedia/featService';

// ─── shared test characters ───────────────────────────────────────────────────

const WIZARD_L1 = {
  id: 1,
  name: 'Gandalf',
  char_class: 'Wizard',
  level: 1,
  constitution: 12,
  character_data: { hp_max: 7 },
};

// Fighter leveling 2 → 3 (unlock level for both editions)
const FIGHTER_L2 = {
  id: 2,
  name: 'Aldric',
  char_class: 'Fighter',
  level: 2,
  constitution: 14,
  character_data: { hp_max: 26 },
};

// Sorcerer is a known caster — picks spells on level-up. L1→2 has no subclass step.
const SORCERER_L1 = {
  id: 3,
  name: 'Raistlin',
  char_class: 'Sorcerer',
  level: 1,
  constitution: 12,
  character_data: { hp_max: 7, subclass: 'Draconic Bloodline', cantrips: ['Fire Bolt'], known_spells: ['Magic Missile'] },
};

const CAMPAIGN_5E = { id: 1, edition: '5e' };
const CAMPAIGN_2024 = { id: 1, edition: '5.5e' };
const CAMPAIGN_ASI_ONLY = { id: 1, edition: '5e', asi_feat_mode: 'asi_only' };
const CAMPAIGN_ASI_OR_FEAT = { id: 1, edition: '5e', asi_feat_mode: 'asi_or_feat' };
const CAMPAIGN_ASI_AND_FEAT = { id: 1, edition: '5e', asi_feat_mode: 'asi_and_feat' };

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Advance past the HP step by choosing average. */
function chooseTakeAverage() {
  fireEvent.click(screen.getByText('Take Average'));
  fireEvent.click(screen.getByRole('button', { name: /Next/i }));
}

function nextStep() {
  fireEvent.click(screen.getByTestId('wizard-next'));
}

/**
 * Pick from a page's compendium browser until its quota is met.
 * A spell page won't let you leave it part-filled, so a test that only wants to *reach* a
 * later page has to actually make this page's choices first — same as a real player.
 */
function fillSpellPage(kind) {
  for (let i = 0; i < 12 && screen.getByTestId('wizard-next').disabled; i++) {
    fireEvent.click(screen.getByText(`csb-add:${kind}`));
  }
}

/** Fill the active spell page to its quota, then move on. */
function advanceSpellPage(kind) {
  fillSpellPage(kind);
  nextStep();
}

describe('LevelUpWizard', () => {
  describe('step indicator — Subclass step visibility', () => {
    it('shows Subclass step label when leveling Wizard to level 2 (5e unlock)', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Subclass')).toBeInTheDocument();
    });

    it('shows Subclass step label when leveling Fighter to level 3 (5e unlock)', () => {
      render(
        <LevelUpWizard
          character={FIGHTER_L2}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Subclass')).toBeInTheDocument();
    });

    it('shows Subclass step label when leveling Fighter to level 3 (2024 unlock)', () => {
      render(
        <LevelUpWizard
          character={FIGHTER_L2}
          campaign={CAMPAIGN_2024}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Subclass')).toBeInTheDocument();
    });

    it('does NOT show Subclass step when leveling to a non-unlock level (Fighter 1→2)', () => {
      render(
        <LevelUpWizard
          character={{ ...FIGHTER_L2, level: 1 }}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('Subclass')).not.toBeInTheDocument();
    });

    it('does NOT show Subclass step when character already has a subclass', () => {
      render(
        <LevelUpWizard
          character={{
            ...WIZARD_L1,
            character_data: { hp_max: 7, subclass: 'School of Abjuration' },
          }}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('Subclass')).not.toBeInTheDocument();
    });
  });

  describe('subclass step — interaction', () => {
    it('Next button is disabled on the subclass step before a choice is made', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage(); // now on subclass step
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
    });

    it('Next button becomes enabled after selecting a subclass', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();
      fireEvent.click(screen.getByTestId('subclass-option-0'));
      expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();
    });

    it('subclass picker is rendered on the subclass step', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();
      expect(screen.getByTestId('subclass-picker')).toBeInTheDocument();
    });

    it('shows the permanent-choice warning on the subclass step', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();
      // More specific than /permanent/i to avoid matching "permanently" in the paragraph
      expect(screen.getByText(/This choice is permanent/)).toBeInTheDocument();
    });
  });

  describe('subclass step — confirm and save', () => {
    it('shows chosen subclass in the confirm step summary', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();

      const firstOpt = screen.getByTestId('subclass-option-0');
      const chosenName = firstOpt.textContent;
      fireEvent.click(firstOpt);
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // subclass → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → confirm

      expect(screen.getByText('Subclass chosen')).toBeInTheDocument();
      expect(screen.getByText(chosenName)).toBeInTheDocument();
    });

    it('calls onComplete with the chosen subclass included in character_data', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );

      chooseTakeAverage();

      const firstOpt = screen.getByTestId('subclass-option-0');
      const chosenName = firstOpt.textContent;
      fireEvent.click(firstOpt);
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          2, // newLevel: Wizard was level 1 → 2
          expect.objectContaining({ subclass: chosenName })
        );
      });
    });

    it('calls onComplete WITHOUT subclass key when no subclass step occurred', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(
        <LevelUpWizard
          character={{ ...FIGHTER_L2, level: 1 }} // Fighter 1→2, no subclass unlock
          campaign={CAMPAIGN_5E}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );

      chooseTakeAverage();
      // Only features step remains after HP (no subclass step)
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          2,
          expect.not.objectContaining({ subclass: expect.anything() })
        );
      });
    });
  });

  describe('HP step — methods and lock-in', () => {
    const FIGHTER_L1 = { ...FIGHTER_L2, level: 1 };

    function renderFighter(onComplete = vi.fn()) {
      render(
        <LevelUpWizard
          character={FIGHTER_L1}
          campaign={CAMPAIGN_5E}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );
    }

    it('renders all three HP methods (roll, average, roll at the table)', () => {
      renderFighter();
      expect(screen.getByTestId('hp-method-roll')).toBeInTheDocument();
      expect(screen.getByTestId('hp-method-average')).toBeInTheDocument();
      expect(screen.getByTestId('hp-method-manual')).toBeInTheDocument();
    });

    it('locks the other methods once Take Average is chosen', () => {
      renderFighter();
      fireEvent.click(screen.getByTestId('hp-method-average'));
      expect(screen.getByTestId('hp-method-roll')).toBeDisabled();
      expect(screen.getByTestId('hp-method-manual')).toBeDisabled();
      expect(screen.getByTestId('hp-method-average')).not.toBeDisabled();
    });

    it('locks the other methods once the dice are rolled (no roll-then-switch)', () => {
      renderFighter();
      fireEvent.click(screen.getByTestId('hp-method-roll'));
      expect(screen.getByTestId('hp-method-average')).toBeDisabled();
      expect(screen.getByTestId('hp-method-manual')).toBeDisabled();
    });

    it('shows a lock notice once a method is chosen', () => {
      renderFighter();
      expect(screen.queryByText(/locked in/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('hp-method-average'));
      expect(screen.getByText(/locked in/i)).toBeInTheDocument();
    });

    it('reveals a manual input only after Roll at the Table is chosen', () => {
      renderFighter();
      expect(screen.queryByTestId('hp-manual-input')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('hp-method-manual'));
      expect(screen.getByTestId('hp-manual-input')).toBeInTheDocument();
    });

    it('blocks Next until a valid manual value is entered', () => {
      renderFighter();
      fireEvent.click(screen.getByTestId('hp-method-manual'));
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
      // Out of range (Fighter d10) stays blocked
      fireEvent.change(screen.getByTestId('hp-manual-input'), { target: { value: '11' } });
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
      // Valid value enables Next
      fireEvent.change(screen.getByTestId('hp-manual-input'), { target: { value: '6' } });
      expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();
    });

    it('stores the CON-independent roll base (hp_rolls) in onComplete', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      renderFighter(onComplete);
      fireEvent.click(screen.getByTestId('hp-method-manual'));
      fireEvent.change(screen.getByTestId('hp-manual-input'), { target: { value: '6' } });
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));   // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));   // features → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      // Legacy hp_max 26 at L1, CON 14 (+2) → roll base 26 − 1×2 = 24; +6 die = 30 (effective L2 = 34).
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          2,
          expect.objectContaining({ hp_rolls: 30 })
        );
      });
    });
  });

  describe('HP step — per-level bonuses (Hill Dwarf / Tough)', () => {
    // Hill Dwarf Fighter: Dwarven Toughness grants +1 HP per level (display-only on the sheet).
    const HILL_DWARF_FIGHTER_L1 = {
      ...FIGHTER_L2,
      level: 1,
      character_data: { hp_max: 26, race_traits: ['Dwarven Toughness'] },
    };
    // Variant Human Fighter with the Tough feat: +2 HP per level.
    const TOUGH_FIGHTER_L1 = {
      ...FIGHTER_L2,
      level: 1,
      character_data: { hp_max: 26, feats: [{ id: 1, name: 'Tough' }] },
    };

    function renderChar(character, onComplete = vi.fn()) {
      render(
        <LevelUpWizard
          character={character}
          campaign={CAMPAIGN_5E}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );
    }

    it('shows the Dwarven Toughness +1 line for a Hill Dwarf', () => {
      renderChar(HILL_DWARF_FIGHTER_L1);
      fireEvent.click(screen.getByTestId('hp-method-average'));
      expect(screen.getByTestId('hp-bonus-Dwarven Toughness')).toHaveTextContent('+1');
    });

    it('folds Dwarven Toughness into HP gained but NOT into the stored roll base', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      renderChar(HILL_DWARF_FIGHTER_L1, onComplete);
      fireEvent.click(screen.getByTestId('hp-method-average')); // d10 avg 6, +2 CON, +1 dwarf = +9
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → confirm
      // Confirm summary shows the effective new max: 30 rolls + 4 CON + 2 (Toughness at L2) = 36
      expect(screen.getByText('36')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      // Stored roll base is CON-independent + excludes passives: (26 − 1×2 legacy) + 6 die = 30
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(2, expect.objectContaining({ hp_rolls: 30 }));
      });
    });

    it('shows the Tough +2 line for a character with the Tough feat', () => {
      renderChar(TOUGH_FIGHTER_L1);
      fireEvent.click(screen.getByTestId('hp-method-average'));
      expect(screen.getByTestId('hp-bonus-Tough')).toHaveTextContent('+2');
    });

    it('shows no bonus lines for a plain Fighter', () => {
      renderChar({ ...FIGHTER_L2, level: 1 });
      fireEvent.click(screen.getByTestId('hp-method-average'));
      expect(screen.queryByTestId('hp-bonus-Dwarven Toughness')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hp-bonus-Tough')).not.toBeInTheDocument();
    });
  });

  describe('subclass proficiency step (Battle Master — Student of War)', () => {
    // FIGHTER_L2 levels 2 → 3, the Fighter subclass-unlock level.
    function toSubclassStep(character = FIGHTER_L2, onComplete = vi.fn()) {
      render(<LevelUpWizard character={character} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // hp → subclass
    }

    it('adds a Proficiencies step for Battle Master and saves the chosen tool', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toSubclassStep(FIGHTER_L2, onComplete);
      fireEvent.click(screen.getByText('Battle Master'));
      fireEvent.click(screen.getByTestId('wizard-next')); // subclass → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → subclass-grants
      expect(screen.getByTestId('subclass-grant-student_of_war')).toBeInTheDocument();
      // Next blocked until a tool is picked
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId("subclass-grant-opt-student_of_war-Smith's Tools"));
      fireEvent.click(screen.getByTestId('wizard-next')); // subclass-grants → maneuvers (Battle Master learns 3 at L3)
      fireEvent.click(screen.getByTestId('lvl-maneuver-Trip Attack'));
      fireEvent.click(screen.getByTestId('lvl-maneuver-Riposte'));
      fireEvent.click(screen.getByTestId('lvl-maneuver-Parry'));
      fireEvent.click(screen.getByTestId('wizard-next')); // maneuvers → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(3, expect.objectContaining({
        subclass: 'Battle Master',
        subclass_tool_proficiencies: ["Smith's Tools"],
        maneuvers: ['Trip Attack', 'Riposte', 'Parry'],
      })));
    });

    it('does not add a subclass-grants step for a subclass without a grant at this level (Champion L3)', () => {
      toSubclassStep();
      fireEvent.click(screen.getByText('Champion'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // subclass → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → confirm (no subclass-grants at L3)
      expect(screen.getByRole('button', { name: /Confirm Level Up/i })).toBeInTheDocument();
      expect(screen.queryByText(/Student of War/i)).not.toBeInTheDocument();
    });

    it('hides a tool the character already has from the Student of War options', () => {
      toSubclassStep({ ...FIGHTER_L2, character_data: { hp_max: 26, background_tool_choice: "Smith's Tools" } });
      fireEvent.click(screen.getByText('Battle Master'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → subclass-grants
      expect(screen.queryByTestId("subclass-grant-opt-student_of_war-Smith's Tools")).not.toBeInTheDocument();
      expect(screen.getByTestId("subclass-grant-opt-student_of_war-Brewer's Supplies")).toBeInTheDocument();
    });
  });

  describe('subclass choices step (Champion — Additional Fighting Style)', () => {
    // Champion Fighter leveling 9 → 10 (the 5e Additional Fighting Style level). No subclass
    // step (already chosen), no ASI step (L10 isn't a Fighter ASI level): hp → features →
    // subclass-grants → confirm.
    const CHAMPION_L9 = {
      ...FIGHTER_L2, level: 9,
      character_data: { hp_max: 80, subclass: 'Champion', fighting_style: 'Defense' },
    };

    function toSubclassChoicesStep(character = CHAMPION_L9, onComplete = vi.fn(), campaign = CAMPAIGN_5E) {
      render(<LevelUpWizard character={character} campaign={campaign} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → subclass-grants
    }

    it('adds an Additional Fighting Style step at L10 and saves the pick', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toSubclassChoicesStep(CHAMPION_L9, onComplete);
      expect(screen.getByTestId('subclass-grant-additional_fighting_style')).toBeInTheDocument();
      // Next blocked until a style is chosen
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByText('Archery'));
      fireEvent.click(screen.getByTestId('wizard-next')); // subclass-grants → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(10, expect.objectContaining({
        additional_fighting_styles: ['Archery'],
      })));
    });

    it('excludes the fighting style the character already has', () => {
      toSubclassChoicesStep();
      // Base fighting style is Defense → not offered as the second pick
      expect(screen.queryByText('Archery')).toBeInTheDocument();
      expect(screen.queryByText('Defense')).not.toBeInTheDocument();
    });

    it('does not add the step for a Champion at a non-grant level (9 → 10 only)', () => {
      // Leveling 8 → 9: not the Additional Fighting Style level.
      render(<LevelUpWizard character={{ ...CHAMPION_L9, level: 8 }} campaign={CAMPAIGN_5E} onComplete={vi.fn()} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → confirm (no subclass-grants)
      expect(screen.getByRole('button', { name: /Confirm Level Up/i })).toBeInTheDocument();
      expect(screen.queryByTestId('subclass-grant-additional_fighting_style')).not.toBeInTheDocument();
    });

    it('fires at L7 for a 2024 Champion', () => {
      const champ2024 = { ...CHAMPION_L9, level: 6, character_data: { hp_max: 60, subclass: 'Champion', fighting_style: 'Defense' } };
      render(<LevelUpWizard character={champ2024} campaign={CAMPAIGN_2024} onComplete={vi.fn()} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → subclass-grants
      expect(screen.getByTestId('subclass-grant-additional_fighting_style')).toBeInTheDocument();
    });
  });

  describe('Features step — resolves subclass features', () => {
    // Champion Fighter leveling 14 → 15 gains the subclass feature Superior Critical.
    // The class table only carries a generic "Martial Archetype Feature" placeholder there;
    // the wizard should surface the real feature (name + description) from the chosen subclass.
    const CHAMPION_L14 = {
      ...FIGHTER_L2, level: 14,
      character_data: { hp_max: 120, subclass: 'Champion', fighting_style: 'Defense' },
    };

    function toFeaturesStep(character, campaign = CAMPAIGN_5E) {
      render(<LevelUpWizard character={character} campaign={campaign} onComplete={vi.fn()} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
    }

    it('shows the real subclass feature instead of the generic placeholder (5e Champion L15)', () => {
      toFeaturesStep(CHAMPION_L14);
      expect(screen.getByText('Superior Critical')).toBeInTheDocument();
      expect(screen.getByText(/critical hit on a roll of 18/i)).toBeInTheDocument();
      expect(screen.queryByText('Martial Archetype Feature')).not.toBeInTheDocument();
    });

    it('resolves the 2024 subclass feature too', () => {
      const champ2024 = { ...CHAMPION_L14, character_data: { hp_max: 120, subclass: 'Champion' } };
      toFeaturesStep(champ2024, CAMPAIGN_2024);
      expect(screen.getByText('Superior Critical')).toBeInTheDocument();
      expect(screen.queryByText('Martial Archetype Feature')).not.toBeInTheDocument();
    });

    it('keeps the generic placeholder when the subclass is unknown', () => {
      // No subclass stored → nothing to resolve, so the placeholder text remains.
      toFeaturesStep({ ...CHAMPION_L14, character_data: { hp_max: 120 } });
      expect(screen.getByText('Martial Archetype Feature')).toBeInTheDocument();
    });
  });

  describe('Ability Score Improvement step', () => {
    // Fighter 3 → 4 is an ASI level.
    const FIGHTER_L3 = { ...FIGHTER_L2, level: 3, strength: 15, dexterity: 14 };

    // asi_only mode → the ASI step appears directly (no ASI-or-Feat choice step).
    function toAsiStep(character = FIGHTER_L3, onComplete = vi.fn()) {
      render(<LevelUpWizard character={character} campaign={CAMPAIGN_ASI_ONLY} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → asi
    }

    it('does not add an Ability Scores step at a non-ASI level (Fighter 1→2)', () => {
      render(<LevelUpWizard character={{ ...FIGHTER_L2, level: 1 }} campaign={CAMPAIGN_ASI_ONLY} onComplete={vi.fn()} onClose={vi.fn()} />);
      expect(screen.queryByText('Ability Scores')).not.toBeInTheDocument();
    });

    it('adds an Ability Scores step at an ASI level and applies +1/+1', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toAsiStep(FIGHTER_L3, onComplete);
      expect(screen.getByText('Ability Scores')).toBeInTheDocument();
      // Next blocked until both points are spent
      expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
      fireEvent.click(screen.getByTestId('asi-inc-strength'));
      fireEvent.click(screen.getByTestId('asi-inc-dexterity'));
      expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));            // asi → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4, expect.any(Object), expect.objectContaining({ strength: 16, dexterity: 15 })
      ));
    });

    it('allows +2 to one score and caps it at 20', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toAsiStep({ ...FIGHTER_L3, strength: 18 }, onComplete);
      fireEvent.click(screen.getByTestId('asi-inc-strength')); // 18 → 19
      fireEvent.click(screen.getByTestId('asi-inc-strength')); // 19 → 20
      // can't go past 20
      expect(screen.getByTestId('asi-inc-strength')).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));            // asi → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4, expect.any(Object), expect.objectContaining({ strength: 20 })
      ));
    });

    // Raising CON so its modifier increases must add HP retroactively: +1 for every character
    // level (not just the new one). With the dynamic model this falls out of storing the roll
    // base + recomputing effective max from the new CON — no retroactive bookkeeping needed.
    it('surfaces retroactive HP in the confirm breakdown when an ASI raises the CON modifier', async () => {
      // Fighter 3 → 4, legacy hp_max 26, CON 13 (+1). Take Average d10 = 6.
      const CHAMP = { ...FIGHTER_L3, constitution: 13, character_data: { hp_max: 26 } };
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toAsiStep(CHAMP, onComplete);
      fireEvent.click(screen.getByTestId('asi-inc-constitution')); // 13 → 14 (+1 → +2 mod)
      fireEvent.click(screen.getByTestId('asi-inc-dexterity'));    // spend the 2nd point
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // asi → confirm

      // The confirm summary itemizes the post-increase CON and the retroactive top-up.
      expect(screen.getByTestId('confirm-hp-breakdown')).toHaveTextContent(/\+ 2 CON/);
      expect(screen.getByTestId('confirm-hp-breakdown')).toHaveTextContent(/\+ 3 retroactive CON/);
      // Effective new max: 29 rolls + 4×2 CON = 37 (was 26 → gained 11: die 6 + this level's CON + 3 retro).
      expect(screen.getByText('37')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      // Stored roll base is CON-independent: (26 − 3×1 legacy) + 6 die = 29. CON is layered dynamically.
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ hp_rolls: 29 }),
        expect.objectContaining({ constitution: 14 })
      ));
    });

    // No CON change → no retroactive top-up (guards against always-on retro HP).
    it('does not add retroactive HP when CON is unchanged', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      // FIGHTER_L3 CON 14 (+2), legacy hp_max 26. Put both points into STR/DEX.
      toAsiStep(FIGHTER_L3, onComplete);
      fireEvent.click(screen.getByTestId('asi-inc-strength'));
      fireEvent.click(screen.getByTestId('asi-inc-dexterity'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // asi → confirm
      expect(screen.getByTestId('confirm-hp-breakdown')).not.toHaveTextContent(/retroactive/);
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      // Roll base: (26 − 3×2 legacy) + 6 die = 26. Effective stays 34 (= 26 + 4×2 CON).
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4, expect.objectContaining({ hp_rolls: 26 }), expect.any(Object)
      ));
    });
  });

  describe('ASI / feat mode (campaign.asi_feat_mode)', () => {
    // Fighter 3 → 4 is an ASI level.
    const FIGHTER_L3 = { ...FIGHTER_L2, level: 3, strength: 15, dexterity: 14 };
    const FEATS = [
      { id: 10, name: 'Alert', prerequisites: {}, repeatable: false, description: 'Always on guard.' },
      { id: 11, name: 'Grappler', prerequisites: { text: 'Strength 13 or higher' }, repeatable: false, description: 'Grab on.' },
      { id: 12, name: 'Great Weapon Master', prerequisites: { text: 'Strength 16 or higher' }, repeatable: false, description: 'Big swing.' },
      { id: 13, name: 'Fey Touched', prerequisites: { text: 'The ability to cast at least one spell' }, repeatable: false, description: 'Misty step.' },
      { id: 14, name: 'Tavern Brawler', prerequisites: {}, repeatable: false, description: 'Brawl.', effects: [
        { kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 },
        { kind: 'attack_mod', target: 'unarmed', dice: '1d4' },
        { kind: 'action', name: 'Grapple (Tavern Brawler)', economy: 'bonus', description: 'Grapple.' },
      ] },
      { id: 15, name: 'Linguist', prerequisites: {}, repeatable: false, description: 'Languages.', effects: [
        { kind: 'ability_score', ability: 'intelligence', amount: 1 },
        { kind: 'proficiency', prof_type: 'language', count: 3, label: '3 languages' },
      ] },
      { id: 16, name: 'Skill Expert', prerequisites: {}, repeatable: false, description: 'Expert.', effects: [
        { kind: 'ability_choice', abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], amount: 1 },
        { kind: 'proficiency', prof_type: 'skill', count: 1, label: '1 skill' },
        { kind: 'expertise', count: 1, label: '1 skill for Expertise' },
      ] },
      { id: 17, name: 'Heavy Armor Master', prerequisites: { text: 'Proficiency with heavy armor' }, repeatable: false, description: 'Tank.' },
      { id: 18, name: 'Moderately Armored', prerequisites: { text: 'Proficiency with light armor' }, repeatable: false, description: 'Armored.', effects: [
        { kind: 'ability_choice', abilities: ['strength', 'dexterity'], amount: 1 },
        { kind: 'proficiency', prof_type: 'armor', items: ['Medium', 'Shields'] },
      ] },
      { id: 20, name: 'Weapon Master', prerequisites: {}, repeatable: false, description: 'Weapons.', effects: [
        { kind: 'ability_choice', abilities: ['strength', 'dexterity'], amount: 1 },
        { kind: 'proficiency', prof_type: 'weapon', count: 4, label: '4 weapons' },
      ] },
      { id: 21, name: 'Resilient', prerequisites: {}, repeatable: true, description: 'Save proficiency.', effects: [
        { kind: 'ability_choice', abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], amount: 1 },
        { kind: 'proficiency', prof_type: 'saving_throw', from_ability_choice: true },
      ] },
      { id: 19, name: 'Magic Initiate', prerequisites: {}, repeatable: true, description: 'Learn spells.', effects: [
        { kind: 'spell_grant', source_kind: 'class', cantrips: 2, leveled: [{ level: 1, count: 1 }], free_cast: 'long_rest', ability: 'class', label: 'Magic Initiate' },
      ] },
      { id: 22, name: 'Martial Adept', prerequisites: {}, repeatable: true, description: 'Maneuvers.', effects: [
        { kind: 'maneuver_grant', count: 2, die: 'd6', label: '2 maneuvers' },
        { kind: 'resource', key: 'martial_adept_superiority', label: 'Superiority Die (d6)', total: 1, recharge: 'short' },
      ] },
    ];

    function toChoiceStep(character = FIGHTER_L3, campaign = CAMPAIGN_ASI_OR_FEAT, onComplete = vi.fn()) {
      render(<LevelUpWizard character={character} campaign={campaign} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → asi_choice
    }

    it('asi_only mode shows no ASI-or-Feat choice and no Feat step', () => {
      render(<LevelUpWizard character={FIGHTER_L3} campaign={CAMPAIGN_ASI_ONLY} onComplete={vi.fn()} onClose={vi.fn()} />);
      expect(screen.queryByText('ASI or Feat')).not.toBeInTheDocument();
      expect(screen.queryByText('Feat')).not.toBeInTheDocument();
      expect(screen.getByText('Ability Scores')).toBeInTheDocument();
    });

    it('asi_or_feat mode shows an "ASI or Feat" step at an ASI level', () => {
      render(<LevelUpWizard character={FIGHTER_L3} campaign={CAMPAIGN_ASI_OR_FEAT} onComplete={vi.fn()} onClose={vi.fn()} />);
      expect(screen.getByText('ASI or Feat')).toBeInTheDocument();
    });

    it('blocks Next on the choice step until ASI or Feat is selected', () => {
      toChoiceStep();
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('asi-choice-asi'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
    });

    it('choosing ASI reveals the Ability Scores step and saves the increases', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-asi'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → asi
      expect(screen.getByTestId('asi-row-strength')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('asi-inc-strength'));
      fireEvent.click(screen.getByTestId('asi-inc-dexterity'));
      fireEvent.click(screen.getByTestId('wizard-next')); // asi → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4, expect.any(Object), expect.objectContaining({ strength: 16, dexterity: 15 })
      ));
    });

    it('choosing Feat reveals the Feat step and saves the chosen feat to character_data.feats', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      const grappler = await screen.findByTestId('pick-feat-11');
      expect(screen.getByTestId('wizard-next')).toBeDisabled(); // blocked until picked
      fireEvent.click(grappler);
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      expect(screen.getByTestId('confirm-feat')).toHaveTextContent('Grappler');
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ feats: expect.arrayContaining([expect.objectContaining({ id: 11, name: 'Grappler' })]) })
      ));
    });

    it('asi_and_feat mode shows both the Ability Scores and Feat steps and saves both', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={FIGHTER_L3} campaign={CAMPAIGN_ASI_AND_FEAT} onComplete={onComplete} onClose={vi.fn()} />);
      expect(screen.queryByText('ASI or Feat')).not.toBeInTheDocument();
      expect(screen.getByText('Ability Scores')).toBeInTheDocument();
      expect(screen.getByText('Feat')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → asi
      fireEvent.click(screen.getByTestId('asi-inc-strength'));
      fireEvent.click(screen.getByTestId('asi-inc-dexterity'));
      fireEvent.click(screen.getByTestId('wizard-next')); // asi → feat
      const grappler = await screen.findByTestId('pick-feat-11');
      fireEvent.click(grappler);
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ feats: expect.arrayContaining([expect.objectContaining({ name: 'Grappler' })]) }),
        expect.objectContaining({ strength: 16, dexterity: 15 })
      ));
    });

    it('shows a feat with an unmet prerequisite but locks it (not selectable)', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      const gwm = await screen.findByTestId('pick-feat-12'); // GWM — STR 16, unmet (15)
      expect(gwm).toBeDisabled();
      expect(gwm).toHaveAttribute('data-locked', 'true');
      expect(screen.getByTestId('pick-feat-11')).not.toBeDisabled(); // Grappler — STR 13, met (15)
    });

    it('locks redundant half-feats whose proficiency the class already has', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT); // Fighter — all armor + all weapons
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      const weaponMaster = await screen.findByTestId('pick-feat-20');
      expect(weaponMaster).toBeDisabled();
      expect(weaponMaster).toHaveTextContent(/all weapon proficiencies/i);
      const modArmored = screen.getByTestId('pick-feat-18'); // Moderately Armored — grants medium
      expect(modArmored).toBeDisabled();
      expect(modArmored).toHaveTextContent(/already proficient with medium armor/i);
    });

    it('Resilient only offers abilities whose save the class lacks', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT); // Fighter — STR + CON saves
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      fireEvent.click(await screen.findByTestId('pick-feat-21')); // Resilient
      // Held saves (STR, CON) are not offered; the other four are.
      expect(screen.queryByTestId('feat-ability-strength')).not.toBeInTheDocument();
      expect(screen.queryByTestId('feat-ability-constitution')).not.toBeInTheDocument();
      expect(screen.getByTestId('feat-ability-dexterity')).toBeInTheDocument();
      expect(screen.getByTestId('feat-ability-wisdom')).toBeInTheDocument();
    });

    it('locks a "cast a spell" feat for a non-caster (Battle Master Fighter)', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT); // Fighter, no spells in character_data
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      const feyTouched = await screen.findByTestId('pick-feat-13'); // requires spellcasting
      expect(feyTouched).toBeDisabled();
      expect(feyTouched).toHaveAttribute('data-locked', 'true');
    });

    it('does NOT lock a "cast a spell" feat for a caster (Eldritch Knight Fighter)', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const ekFighter = { ...FIGHTER_L3, character_data: { hp_max: 26, subclass: 'Eldritch Knight' } };
      toChoiceStep(ekFighter, CAMPAIGN_ASI_OR_FEAT);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      const feyTouched = await screen.findByTestId('pick-feat-13');
      expect(feyTouched).not.toBeDisabled();
    });

    it('half-feat (Tavern Brawler) requires an ability choice, applies it, and snapshots effects', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      fireEvent.click(await screen.findByTestId('pick-feat-14')); // Tavern Brawler
      // Ability choice required → Next blocked until chosen
      expect(screen.getByTestId('feat-ability-choice')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('feat-ability-strength'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ feats: expect.arrayContaining([expect.objectContaining({
          name: 'Tavern Brawler', level: 4, choices: { ability: 'strength' }, effects: expect.any(Array),
        })]) }),
        expect.objectContaining({ strength: 16 }), // 15 base + 1 from the half-feat
      ));
    });

    it('count-choice proficiency feat (Linguist) requires N picks and saves them', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      fireEvent.click(await screen.findByTestId('pick-feat-15')); // Linguist
      expect(screen.getByTestId('feat-prof-grant-language')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('feat-prof-opt-language-Draconic'));
      fireEvent.click(screen.getByTestId('feat-prof-opt-language-Giant'));
      expect(screen.getByTestId('wizard-next')).toBeDisabled(); // 2/3, still blocked
      fireEvent.click(screen.getByTestId('feat-prof-opt-language-Goblin'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ feat_languages: expect.arrayContaining(['Draconic', 'Giant', 'Goblin']) }),
        expect.objectContaining({ intelligence: 11 }), // Linguist's fixed +1 INT (10 → 11)
      ));
    });

    it('spell-grant feat (Magic Initiate) blocks Next until spells are chosen, then saves them on the feat', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      fireEvent.click(await screen.findByTestId('pick-feat-19')); // Magic Initiate
      expect(screen.getByTestId('spell-grant-picker')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-next')).toBeDisabled(); // spells not chosen yet
      fireEvent.click(screen.getByTestId('spell-grant-fill'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ feats: expect.arrayContaining([expect.objectContaining({
          name: 'Magic Initiate', level: 4,
          choices: expect.objectContaining({ spell_grant: expect.objectContaining({ source: 'Wizard', free_casts: ['Mage Armor'] }) }),
        })]) }),
      ));
    });

    it('Skill Expert: Expertise pool includes the skill picked from the same feat', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      fireEvent.click(await screen.findByTestId('pick-feat-16')); // Skill Expert
      fireEvent.click(screen.getByTestId('feat-ability-intelligence')); // +1 ability
      // Expertise picker is hidden until a proficient skill exists; pick the skill proficiency first.
      expect(screen.queryByTestId('feat-prof-grant-expertise')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('feat-prof-opt-skill-Stealth'));
      // Now Stealth is available to Expertise.
      fireEvent.click(await screen.findByTestId('feat-prof-opt-expertise-Stealth'));
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({
          skill_proficiencies: expect.arrayContaining(['Stealth']),
          expertise_skills: ['Stealth'],
        }),
        expect.objectContaining({ intelligence: 11 }), // chosen +1 INT (10 → 11)
      ));
    });

    it('locks an armor-prereq feat for a class without that armor proficiency (Wizard + Heavy Armor Master)', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const wizard = { ...FIGHTER_L3, char_class: 'Wizard', character_data: { hp_max: 26 } };
      toChoiceStep(wizard, CAMPAIGN_ASI_OR_FEAT);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      const ham = await screen.findByTestId('pick-feat-17'); // Heavy Armor Master (needs heavy armor)
      expect(ham).toBeDisabled();
      expect(ham).toHaveAttribute('data-locked', 'true');
    });

    it('does NOT lock an armor-prereq feat for a class with that proficiency (Fighter + Heavy Armor Master)', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT); // Fighter has heavy armor proficiency
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      expect(await screen.findByTestId('pick-feat-17')).not.toBeDisabled();
    });

    it('feat-granted armor satisfies an armor prereq (Lightly Armored → Moderately Armored unlocked)', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const wizard = { ...FIGHTER_L3, char_class: 'Wizard', character_data: { hp_max: 26,
        feats: [{ name: 'Lightly Armored', effects: [{ kind: 'proficiency', prof_type: 'armor', items: ['Light'] }] }] } };
      toChoiceStep(wizard, CAMPAIGN_ASI_OR_FEAT);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      // Moderately Armored needs light armor → satisfied by the feat-granted light proficiency.
      expect(await screen.findByTestId('pick-feat-18')).not.toBeDisabled();
      // Heavy Armor Master still locked (no heavy proficiency).
      expect(screen.getByTestId('pick-feat-17')).toBeDisabled();
    });

    it('hides an already-taken non-repeatable feat', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const charWithAlert = { ...FIGHTER_L3, character_data: { hp_max: 26, feats: [{ id: 10, name: 'Alert' }] } };
      toChoiceStep(charWithAlert, CAMPAIGN_ASI_OR_FEAT);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      await screen.findByTestId('pick-feat-11');
      expect(screen.queryByTestId('pick-feat-10')).not.toBeInTheDocument();
    });

    it('maneuver-grant feat (Martial Adept): blocks Next until 2 maneuvers chosen, saves them on the feat', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      fireEvent.click(await screen.findByTestId('pick-feat-22')); // Martial Adept
      expect(screen.getByTestId('lvl-feat-maneuver-picker')).toBeInTheDocument();
      expect(screen.getByTestId('wizard-next')).toBeDisabled(); // no maneuvers yet
      fireEvent.click(screen.getByTestId('lvl-feat-maneuver-Trip Attack'));
      expect(screen.getByTestId('wizard-next')).toBeDisabled(); // only 1 of 2
      fireEvent.click(screen.getByTestId('lvl-feat-maneuver-Riposte'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next')); // feat → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ feats: expect.arrayContaining([expect.objectContaining({
          name: 'Martial Adept', level: 4,
          choices: expect.objectContaining({ maneuvers: ['Trip Attack', 'Riposte'] }),
        })]) }),
      ));
    });

    it('a non-Battle-Master does NOT merge feat maneuvers into character_data.maneuvers', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      toChoiceStep(FIGHTER_L3, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(await screen.findByTestId('pick-feat-22'));
      fireEvent.click(screen.getByTestId('lvl-feat-maneuver-Trip Attack'));
      fireEvent.click(screen.getByTestId('lvl-feat-maneuver-Riposte'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalled());
      const cd = onComplete.mock.calls[0][1];
      expect(cd.maneuvers).toBeUndefined(); // not a Battle Master → maneuvers live on the feat only
    });

    it('a Battle Master taking Martial Adept merges the picks into character_data.maneuvers and excludes known ones', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const onComplete = vi.fn().mockResolvedValue(undefined);
      const bmFighter = { ...FIGHTER_L3, character_data: { hp_max: 26, subclass: 'Battle Master', maneuvers: ['Trip Attack'] } };
      toChoiceStep(bmFighter, CAMPAIGN_ASI_OR_FEAT, onComplete);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(await screen.findByTestId('pick-feat-22'));
      // Trip Attack is already known → not offered by the picker.
      expect(screen.queryByTestId('lvl-feat-maneuver-Trip Attack')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('lvl-feat-maneuver-Riposte'));
      fireEvent.click(screen.getByTestId('lvl-feat-maneuver-Parry'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalled());
      const cd = onComplete.mock.calls[0][1];
      expect(cd.maneuvers).toEqual(['Trip Attack', 'Riposte', 'Parry']); // existing + 2 feat picks
    });
  });

  describe('Battle Master maneuver step', () => {
    // Battle Master 6 → 7 learns 2 new maneuvers (3 → 5 known); subclass already set.
    const BM_L6 = {
      ...FIGHTER_L2, level: 6,
      character_data: { hp_max: 50, subclass: 'Battle Master', maneuvers: ['Trip Attack', 'Riposte', 'Parry'] },
    };

    it('does not add a Maneuvers step for a non-Battle-Master Fighter', () => {
      render(
        <LevelUpWizard
          character={{ ...BM_L6, character_data: { hp_max: 50, subclass: 'Champion' } }}
          campaign={CAMPAIGN_5E} onComplete={vi.fn()} onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('Maneuvers')).not.toBeInTheDocument();
    });

    it('prompts the new maneuvers at a learn level and appends them on confirm', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={BM_L6} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → maneuvers
      expect(screen.getByTestId('maneuvers-picked')).toHaveTextContent('0/2');
      // already-known maneuvers aren't offered again
      expect(screen.queryByTestId('lvl-maneuver-Trip Attack')).not.toBeInTheDocument();
      // Next blocked until 2 are chosen (use the test-id — maneuver descriptions contain "next")
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('lvl-maneuver-Precision Attack'));
      fireEvent.click(screen.getByTestId('lvl-maneuver-Menacing Attack'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next'));                        // maneuvers → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ maneuvers: ['Trip Attack', 'Riposte', 'Parry', 'Precision Attack', 'Menacing Attack'] })
      ));
    });

    it('lets a Battle Master replace one known maneuver when learning new ones (swap-on-level-up)', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={BM_L6} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → maneuvers
      // Swap out Trip Attack → the pick target rises to 3 (2 new + 1 to fill the freed slot).
      fireEvent.change(screen.getByTestId('maneuver-replace'), { target: { value: 'Trip Attack' } });
      expect(screen.getByTestId('maneuvers-picked')).toHaveTextContent('0/3');
      fireEvent.click(screen.getByTestId('lvl-maneuver-Precision Attack'));
      fireEvent.click(screen.getByTestId('lvl-maneuver-Menacing Attack'));
      fireEvent.click(screen.getByTestId('lvl-maneuver-Disarming Attack'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next')); // maneuvers → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        7,
        // Trip Attack swapped out; the other two kept + three picked = 5 known at L7.
        expect.objectContaining({ maneuvers: ['Riposte', 'Parry', 'Precision Attack', 'Menacing Attack', 'Disarming Attack'] })
      ));
    });
  });

  describe('level choices — Sorcerer Metamagic', () => {
    // Sorcerer L2→3 learns its first 2 Metamagic options; subclass already chosen at L1.
    const SORCERER_L2 = {
      id: 30, name: 'Raistlin', char_class: 'Sorcerer', level: 2, constitution: 12,
      character_data: { hp_max: 13, subclass: 'Draconic Bloodline', cantrips: ['Fire Bolt'], known_spells: ['Magic Missile'] },
    };
    // L9→10 learns 1 more (2 → 3 known); already knows two options.
    const SORCERER_L9 = {
      ...SORCERER_L2, level: 9,
      character_data: { ...SORCERER_L2.character_data, hp_max: 50, metamagic: ['Quickened Spell', 'Subtle Spell'] },
    };

    it('does not show a Metamagic step at a non-learn level (3 → 4)', () => {
      render(
        <LevelUpWizard
          character={{ ...SORCERER_L2, level: 3 }}
          campaign={CAMPAIGN_ASI_ONLY} onComplete={vi.fn()} onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('Metamagic')).not.toBeInTheDocument();
    });

    it('prompts the metamagic delta at L3, blocks Next until chosen, and appends on confirm', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={SORCERER_L2} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      chooseTakeAverage();                                 // hp → features
      fireEvent.click(screen.getByTestId('wizard-next'));  // features → spells
      fireEvent.click(screen.getByTestId('wizard-next'));  // spells → level-choices
      expect(screen.getByTestId('level-choice-count-metamagic')).toHaveTextContent('0/2');
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('level-choice-metamagic-Quickened Spell'));
      fireEvent.click(screen.getByTestId('level-choice-metamagic-Subtle Spell'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next'));  // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        3,
        expect.objectContaining({ metamagic: ['Quickened Spell', 'Subtle Spell'] }),
      ));
    });

    it('hides already-known options and appends to the existing list', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={SORCERER_L9} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      chooseTakeAverage();                                 // hp → features
      fireEvent.click(screen.getByTestId('wizard-next'));  // features → spells
      fireEvent.click(screen.getByTestId('wizard-next'));  // spells → level-choices
      expect(screen.getByTestId('level-choice-count-metamagic')).toHaveTextContent('0/1');
      expect(screen.queryByTestId('level-choice-metamagic-Quickened Spell')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('level-choice-metamagic-Twinned Spell'));
      fireEvent.click(screen.getByTestId('wizard-next'));  // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ metamagic: ['Quickened Spell', 'Subtle Spell', 'Twinned Spell'] }),
      ));
    });

    it('lets the player replace one known option when learning a new one (swap-on-level-up)', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={SORCERER_L9} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      chooseTakeAverage();                                 // hp → features
      fireEvent.click(screen.getByTestId('wizard-next'));  // features → spells
      fireEvent.click(screen.getByTestId('wizard-next'));  // spells → level-choices
      // Swap out Subtle Spell → required rises to 2 (the 1 new + 1 to replace it).
      fireEvent.change(screen.getByTestId('level-choice-replace-metamagic'), { target: { value: 'Subtle Spell' } });
      expect(screen.getByTestId('level-choice-count-metamagic')).toHaveTextContent('0/2');
      fireEvent.click(screen.getByTestId('level-choice-metamagic-Twinned Spell'));
      fireEvent.click(screen.getByTestId('level-choice-metamagic-Heightened Spell'));
      fireEvent.click(screen.getByTestId('wizard-next'));  // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        10,
        // Subtle Spell swapped out; Quickened kept + two picked = 3 known at L10.
        expect.objectContaining({ metamagic: ['Quickened Spell', 'Twinned Spell', 'Heightened Spell'] }),
      ));
    });
  });

  describe('level choices — Arcane Archer Arcane Shot (subclass-scoped pool)', () => {
    // The whole point of the `subclass` field: a pool that belongs to a SUBCLASS, offered even
    // when that subclass is picked during this same level-up run.
    const ARCHER_L6 = {
      ...FIGHTER_L2, level: 6,
      character_data: {
        hp_max: 52, subclass: 'Arcane Archer',
        arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow'],
      },
    };

    it('offers Arcane Shot at L3 to a Fighter who picks Arcane Archer in the same run', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={FIGHTER_L2} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → subclass
      fireEvent.click(screen.getByText('Arcane Archer'));
      fireEvent.click(screen.getByTestId('wizard-next')); // subclass → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → subclass-grants (Lore)
      // Both Lore grants carry descriptions, so they render as option cards (clicked by name).
      expect(screen.getByTestId('subclass-grant-arcane_archer_lore_skill')).toBeInTheDocument();
      expect(screen.getByTestId('subclass-grant-arcane_archer_lore_cantrip')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Nature'));
      fireEvent.click(screen.getByText('Druidcraft'));
      fireEvent.click(screen.getByTestId('wizard-next')); // subclass-grants → level-choices
      expect(screen.getByTestId('level-choice-count-arcane_shot')).toHaveTextContent('0/2');
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('level-choice-arcane_shot-Bursting Arrow'));
      fireEvent.click(screen.getByTestId('level-choice-arcane_shot-Shadow Arrow'));
      fireEvent.click(screen.getByTestId('wizard-next')); // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(3, expect.objectContaining({
        subclass: 'Arcane Archer',
        skill_proficiencies: expect.arrayContaining(['Nature']),
        subclass_cantrips: ['Druidcraft'],
        arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow'],
      })));
    });

    it('offers one more option at L7 and hides the ones already known', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={ARCHER_L6} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → level-choices
      expect(screen.getByTestId('level-choice-count-arcane_shot')).toHaveTextContent('0/1');
      expect(screen.queryByTestId('level-choice-arcane_shot-Bursting Arrow')).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId('level-choice-arcane_shot-Seeking Arrow'));
      fireEvent.click(screen.getByTestId('wizard-next')); // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(7, expect.objectContaining({
        arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow', 'Seeking Arrow'],
      })));
    });

    // RAW: each time you gain a Fighter level you can replace one option you know. The generic
    // level-choices swap covers it on the levels where a new option is also learned.
    it('lets the player swap one known option when learning a new one', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={ARCHER_L6} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → level-choices
      fireEvent.change(screen.getByTestId('level-choice-replace-arcane_shot'), { target: { value: 'Shadow Arrow' } });
      expect(screen.getByTestId('level-choice-count-arcane_shot')).toHaveTextContent('0/2');
      fireEvent.click(screen.getByTestId('level-choice-arcane_shot-Seeking Arrow'));
      fireEvent.click(screen.getByTestId('level-choice-arcane_shot-Piercing Arrow'));
      fireEvent.click(screen.getByTestId('wizard-next')); // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(7, expect.objectContaining({
        arcane_shot_options: ['Bursting Arrow', 'Seeking Arrow', 'Piercing Arrow'],
      })));
    });

    it('is never offered to another Fighter subclass', () => {
      render(
        <LevelUpWizard
          character={{ ...ARCHER_L6, character_data: { hp_max: 52, subclass: 'Champion' } }}
          campaign={CAMPAIGN_5E} onComplete={vi.fn()} onClose={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → confirm
      expect(screen.getByRole('button', { name: /Confirm Level Up/i })).toBeInTheDocument();
      expect(screen.queryByTestId('level-choice-count-arcane_shot')).not.toBeInTheDocument();
    });

    it('does not prompt at a Fighter level that grants no new option (7 → 8)', () => {
      render(
        <LevelUpWizard
          character={{ ...ARCHER_L6, level: 7 }}
          campaign={CAMPAIGN_5E} onComplete={vi.fn()} onClose={vi.fn()}
        />
      );
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → asi/confirm
      expect(screen.queryByTestId('level-choice-count-arcane_shot')).not.toBeInTheDocument();
    });
  });

  // The Cavalier's Bonus Proficiency is one picker with TWO destinations — picking a skill must
  // write skill_proficiencies, picking a language must write subclass_languages. Getting this
  // wrong would file a language as a bogus skill proficiency.
  describe('subclass grants — Cavalier Bonus Proficiency (skill or language)', () => {
    const FIGHTER_L2 = {
      id: 40, name: 'Alys', char_class: 'Fighter', level: 2, constitution: 14,
      character_data: { hp_max: 20 },
    };

    const toGrantStep = () => {
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next')); // hp → subclass
      fireEvent.click(screen.getByText('Cavalier'));
      fireEvent.click(screen.getByTestId('wizard-next')); // subclass → features
      fireEvent.click(screen.getByTestId('wizard-next')); // features → subclass-grants
    };

    it('files a chosen skill under skill_proficiencies', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={FIGHTER_L2} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      toGrantStep();
      expect(screen.getByTestId('subclass-grant-cavalier_bonus_proficiency')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Persuasion'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(3, expect.objectContaining({
        subclass: 'Cavalier',
        skill_proficiencies: expect.arrayContaining(['Persuasion']),
      })));
      expect(onComplete.mock.calls[0][1].subclass_languages).toBeUndefined();
    });

    it('files a chosen language under subclass_languages, not as a skill', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={FIGHTER_L2} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      toGrantStep();
      fireEvent.click(screen.getByText('Draconic'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(3, expect.objectContaining({
        subclass_languages: ['Draconic'],
      })));
      expect(onComplete.mock.calls[0][1].skill_proficiencies ?? []).not.toContain('Draconic');
    });

    it('is never offered to another Fighter subclass', () => {
      render(<LevelUpWizard character={FIGHTER_L2} campaign={CAMPAIGN_5E} onComplete={vi.fn()} onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Take Average'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(screen.getByText('Champion'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      fireEvent.click(screen.getByTestId('wizard-next'));
      expect(screen.queryByTestId('subclass-grant-cavalier_bonus_proficiency')).not.toBeInTheDocument();
    });
  });

  describe('level choices — Warlock Eldritch Invocations', () => {
    // Warlock L1→2 learns its first 2 invocations (5e: none before L2). Known caster + L1 subclass.
    const WARLOCK_L1 = {
      id: 31, name: 'Fox', char_class: 'Warlock', level: 1, constitution: 12,
      character_data: { hp_max: 9, subclass: 'The Fiend', cantrips: ['Eldritch Blast'], known_spells: ['Hex'] },
    };

    it('prompts the invocation delta at L2, level-gates the pool, and appends on confirm', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(<LevelUpWizard character={WARLOCK_L1} campaign={CAMPAIGN_5E} onComplete={onComplete} onClose={vi.fn()} />);
      chooseTakeAverage();                                 // hp → features
      fireEvent.click(screen.getByTestId('wizard-next'));  // features → spells
      fireEvent.click(screen.getByTestId('wizard-next'));  // spells → level-choices
      expect(screen.getByTestId('level-choice-count-eldritch_invocations')).toHaveTextContent('0/2');
      // a level-5 invocation is not offered at level 2
      expect(screen.queryByTestId('level-choice-eldritch_invocations-Thirsting Blade')).not.toBeInTheDocument();
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId('level-choice-eldritch_invocations-Agonizing Blast'));
      fireEvent.click(screen.getByTestId('level-choice-eldritch_invocations-Armor of Shadows'));
      expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
      fireEvent.click(screen.getByTestId('wizard-next'));  // level-choices → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      await waitFor(() => expect(onComplete).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ eldritch_invocations: ['Agonizing Blast', 'Armor of Shadows'] }),
      ));
    });
  });

  describe('spell step — known casters', () => {
    it('shows the New Spells step for a known caster (Sorcerer)', () => {
      render(
        <LevelUpWizard
          character={SORCERER_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('New Spells')).toBeInTheDocument();
    });

    it('does NOT show the New Spells step for a prepared caster (Wizard)', () => {
      render(
        <LevelUpWizard
          character={WIZARD_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('New Spells')).not.toBeInTheDocument();
    });

    it('does NOT show the New Spells step for a non-caster (Fighter)', () => {
      render(
        <LevelUpWizard
          character={{ ...FIGHTER_L2, level: 1 }}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('New Spells')).not.toBeInTheDocument();
    });

    it('renders cantrip and spell pickers on the spell step', () => {
      render(
        <LevelUpWizard
          character={SORCERER_L1}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();                                            // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → spells
      expect(screen.getByTestId('spelllist-Cantrips Known')).toBeInTheDocument();
      expect(screen.getByTestId('spelllist-Spells Known')).toBeInTheDocument();
    });

    it('includes chosen cantrips and spells in onComplete for a known caster', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      render(
        <LevelUpWizard
          character={SORCERER_L1}
          campaign={CAMPAIGN_5E}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();                                            // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → spells
      fireEvent.click(screen.getByText('csb-add:cantrips'));
      fireEvent.click(screen.getByText('csb-add:spells'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // spells → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          2,
          expect.objectContaining({
            cantrips: expect.arrayContaining(['Fire Bolt', 'Browse Cantrip 2']),
            known_spells: expect.arrayContaining(['Magic Missile', 'Browse Spell 2']),
          })
        );
      });
    });
  });

  describe('New Spells step — Eldritch Knight (caster subclass)', () => {
    it('choosing Eldritch Knight at L3 adds the New Spells step in the same wizard run', () => {
      render(
        <LevelUpWizard
          character={FIGHTER_L2}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      // No spell steps before the subclass is chosen. (A 5e EK gets three: Cantrips,
      // Abjuration & Evocation, Any School — the step labels, not one "New Spells".)
      expect(screen.queryByText('Any School')).not.toBeInTheDocument();
      chooseTakeAverage(); // hp → subclass
      fireEvent.click(screen.getByText('Eldritch Knight'));
      expect(screen.getByText('Cantrips')).toBeInTheDocument();
      expect(screen.getByText('Abjuration & Evocation')).toBeInTheDocument();
      expect(screen.getByText('Any School')).toBeInTheDocument();
      // Choosing a non-caster subclass instead removes them again.
      fireEvent.click(screen.getByText('Champion'));
      expect(screen.queryByText('Any School')).not.toBeInTheDocument();
    });

    it('shows the EK targets (2 cantrips / 3 spells at L3) from the subclass progression', () => {
      render(
        <LevelUpWizard
          character={FIGHTER_L2}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();                                            // hp → subclass
      fireEvent.click(screen.getByText('Eldritch Knight'));
      nextStep(); // subclass → features
      nextStep(); // features → spells: cantrips
      expect(screen.getByTestId('spelllist-Cantrips Known')).toBeInTheDocument();
      expect(screen.getByTestId('spelllist-count-Cantrips Known')).toHaveTextContent('0');
      // Each leveled category is its own page, and you must fill one to reach the next.
      advanceSpellPage('cantrips'); // → Abjuration & Evocation
      expect(screen.getByTestId('ek-count-restricted')).toHaveTextContent('0/2');
      expect(screen.queryByTestId('ek-count-any')).not.toBeInTheDocument();
      advanceSpellPage('restricted'); // → Any School
      expect(screen.getByTestId('ek-count-any')).toHaveTextContent('0/1');
      expect(screen.queryByTestId('ek-count-restricted')).not.toBeInTheDocument();
    });

    it('shows the New Spells step for an existing Eldritch Knight at a later level-up (L3→4)', () => {
      const ek = { ...FIGHTER_L2, level: 3, character_data: { hp_max: 30, subclass: 'Eldritch Knight' } };
      render(
        <LevelUpWizard
          character={ek}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Cantrips')).toBeInTheDocument();
      expect(screen.getByText('Any School')).toBeInTheDocument();
    });

    it('includes chosen cantrips and spells in onComplete for an EK Fighter (2024 too)', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      // L4→5 — not an ASI level, so the flow is hp → features → spells → confirm.
      const ek = {
        ...FIGHTER_L2,
        level: 4,
        character_data: { hp_max: 36, subclass: 'Eldritch Knight', cantrips: ['Fire Bolt'], known_spells: ['Shield'] },
      };
      render(
        <LevelUpWizard
          character={ek}
          campaign={CAMPAIGN_2024}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage(); // hp → features
      nextStep();          // features → spells (one combined page in 2024)
      // At L5 a 2024 EK knows 2 cantrips and 4 spells; it starts with 1 of each.
      fireEvent.click(screen.getByText('csb-add:cantrips'));
      fireEvent.click(screen.getByText('csb-add:spells'));
      fireEvent.click(screen.getByText('csb-add:spells'));
      fireEvent.click(screen.getByText('csb-add:spells'));
      nextStep();          // spells → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          5,
          expect.objectContaining({
            cantrips: expect.arrayContaining(['Fire Bolt', 'Browse Cantrip 2']),
            known_spells: expect.arrayContaining(['Shield', 'Browse Spell 2']),
          })
        );
      });
    });

    it('renders Wizard-list browse pickers (cantrips + spells up to level 1) for an EK at L3', () => {
      render(
        <LevelUpWizard
          character={FIGHTER_L2}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();                                            // hp → subclass
      fireEvent.click(screen.getByText('Eldritch Knight'));
      nextStep(); // subclass → features
      nextStep(); // features → cantrips page
      // EK learns from the Wizard list; third-caster slots at L3 = 2× L1 → max spell level 1.
      expect(screen.getByTestId('csb-class-cantrips')).toHaveTextContent('Wizard');
      advanceSpellPage('cantrips'); // → Abjuration & Evocation page
      expect(screen.getByTestId('csb-class-restricted')).toHaveTextContent('Wizard');
      expect(screen.getByTestId('csb-max-restricted')).toHaveTextContent('1');
      advanceSpellPage('restricted'); // → Any School page
      expect(screen.getByTestId('csb-class-spells')).toHaveTextContent('Wizard');
      expect(screen.getByTestId('csb-max-spells')).toHaveTextContent('1');
    });

    it('spells picked via the browser flow into onComplete', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      // L4→5 — not an ASI level, so the flow is hp → features → spells → confirm.
      const ek = { ...FIGHTER_L2, level: 4, character_data: { hp_max: 36, subclass: 'Eldritch Knight' } };
      render(
        <LevelUpWizard
          character={ek}
          campaign={CAMPAIGN_5E}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();          // hp → features
      nextStep();                   // features → cantrips page
      advanceSpellPage('cantrips');   // fill 2 cantrips → Abjuration & Evocation
      advanceSpellPage('restricted'); // fill 3 restricted → Any School
      advanceSpellPage('spells');     // fill the 1 any-school slot → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          5,
          expect.objectContaining({
            cantrips: expect.arrayContaining(['Browse Cantrip 1', 'Browse Cantrip 2']),
            known_spells: expect.arrayContaining(['Browse Restricted 1', 'Browse Spell 1']),
          })
        );
      });
    });

    it('race-granted cantrips are passed to the cantrip browser as non-selectable (High Elf Fire Bolt)', () => {
      // L4→5 — not an ASI level, so the flow is hp → features → spells.
      const ek = {
        ...FIGHTER_L2,
        level: 4,
        race: 'Elf',
        character_data: {
          hp_max: 36, subclass: 'Eldritch Knight',
          subrace: 'High Elf', high_elf_cantrip: 'Fire Bolt',
        },
      };
      render(
        <LevelUpWizard
          character={ek}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();          // hp → features
      nextStep();                   // features → cantrips page
      expect(screen.getByTestId('csb-granted-cantrips')).toHaveTextContent('Fire Bolt');
      // The leveled-spell browsers (later pages) get no race grants.
      advanceSpellPage('cantrips'); // → Abjuration & Evocation page
      expect(screen.getByTestId('csb-granted-restricted')).toHaveTextContent(/^$/);
    });

    it('a known-caster class (Sorcerer) gets a browser for its own class list', () => {
      const sorc = {
        id: 9, char_class: 'Sorcerer', level: 2, constitution: 10,
        character_data: { hp_max: 14, subclass: 'Draconic Bloodline' },
      };
      render(
        <LevelUpWizard
          character={sorc}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      chooseTakeAverage();                                            // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → spells
      expect(screen.getByTestId('csb-class-spells')).toHaveTextContent('Sorcerer');
      // Full caster at L3 → 2nd-level slots.
      expect(screen.getByTestId('csb-max-spells')).toHaveTextContent('2');
    });

    it('does NOT show the New Spells step for a Champion Fighter at L3→4', () => {
      const champ = { ...FIGHTER_L2, level: 3, character_data: { hp_max: 30, subclass: 'Champion' } };
      render(
        <LevelUpWizard
          character={champ}
          campaign={CAMPAIGN_5E}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByText('New Spells')).not.toBeInTheDocument();
    });
  });
});

// ── Eldritch Knight spell schools + swapping ─────────────────────────────────
// 5e: leveled spells must be Abjuration/Evocation, EXCEPT the spells learned at levels
// 3/8/14/20 (four "any school" slots). 2024 dropped the restriction. Both editions may
// swap one leveled spell per Fighter level; 2024 may swap a cantrip too, 5e may not.
// The slot a spell occupies is RECORDED (ek_spell_slots) — never inferred from its school.
describe('LevelUpWizard — Eldritch Knight spell schools', () => {
  /** A 5e EK at `level` with the given known spells + slot map. */
  const ek = (level, character_data = {}) => ({
    ...FIGHTER_L2, level,
    character_data: { hp_max: 36, subclass: 'Eldritch Knight', ...character_data },
  });

  const next = () => fireEvent.click(screen.getByTestId('wizard-next'));

  /** hp → features → the first spell page (none of these levels are ASI levels).
   *  A 5e EK splits the spell step into three pages: cantrips → restricted → any school.
   *  A page won't let you leave it part-filled, so reaching a later page means making the
   *  earlier page's choices — exactly what a player has to do. */
  const toSpellsStep = () => {
    chooseTakeAverage();
    next();
  };
  const toRestrictedPage = () => { toSpellsStep(); advanceSpellPage('cantrips'); };
  const toAnyPage = () => { toRestrictedPage(); advanceSpellPage('restricted'); };

  const renderWiz = (character, campaign, onComplete = vi.fn()) => {
    render(<LevelUpWizard character={character} campaign={campaign} onComplete={onComplete} onClose={vi.fn()} />);
    return onComplete;
  };

  it('5e gives each choice its own page — cantrips, then Abjuration & Evocation, then Any School', () => {
    renderWiz(ek(4), CAMPAIGN_5E);
    toSpellsStep();
    // Page 1: cantrips only — neither leveled category is on it.
    expect(screen.getByTestId('spelllist-Cantrips Known')).toBeInTheDocument();
    expect(screen.queryByTestId('ek-section-restricted')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ek-section-any')).not.toBeInTheDocument();
    // Page 2: the restricted slots alone. At L5 that's 3 of the 4 known spells.
    advanceSpellPage('cantrips');
    expect(screen.getByTestId('ek-section-restricted')).toBeInTheDocument();
    expect(screen.getByTestId('ek-count-restricted')).toHaveTextContent('0/3');
    expect(screen.queryByTestId('ek-section-any')).not.toBeInTheDocument();
    // Page 3: the any-school slot alone (the one earned at L3).
    advanceSpellPage('restricted');
    expect(screen.getByTestId('ek-section-any')).toBeInTheDocument();
    expect(screen.getByTestId('ek-count-any')).toHaveTextContent('0/1');
    expect(screen.queryByTestId('ek-section-restricted')).not.toBeInTheDocument();
  });

  it('5e offers only Abjuration/Evocation in the restricted browser, the whole list in the any-school one', () => {
    renderWiz(ek(4), CAMPAIGN_5E);
    toRestrictedPage();
    expect(screen.getByTestId('csb-schools-restricted')).toHaveTextContent('Abjuration,Evocation');
    expect(screen.getByTestId('csb-class-restricted')).toHaveTextContent('Wizard');
    // The any-school browser passes no school filter — every Wizard spell is legal there.
    advanceSpellPage('restricted');
    expect(screen.getByTestId('csb-schools-spells')).toHaveTextContent('');
  });

  it('5e records the slot each spell was learned under (not the spell school)', async () => {
    const onComplete = renderWiz(ek(4), CAMPAIGN_5E, vi.fn().mockResolvedValue(undefined));
    toRestrictedPage();
    advanceSpellPage('restricted'); // fill the 3 restricted slots → any-school page
    advanceSpellPage('spells');     // fill the 1 any-school slot → confirm
    fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(5, expect.objectContaining({
        known_spells: expect.arrayContaining(['Browse Restricted 1', 'Browse Spell 1']),
        // Every pick is filed under the slot whose page it was chosen on.
        ek_spell_slots: {
          'Browse Restricted 1': 'restricted',
          'Browse Restricted 2': 'restricted',
          'Browse Restricted 3': 'restricted',
          'Browse Spell 1': 'any',
        },
      }));
    });
  });

  it('2024 has no school split — one unrestricted list', () => {
    renderWiz(ek(4), CAMPAIGN_2024);
    toSpellsStep();
    expect(screen.queryByTestId('ek-section-restricted')).not.toBeInTheDocument();
    expect(screen.getByTestId('spelllist-Spells Known')).toBeInTheDocument();
    expect(screen.getByTestId('csb-schools-spells')).toHaveTextContent('');
  });

  it('2024 stores no slot map (nothing to restrict a later swap to)', async () => {
    const onComplete = renderWiz(ek(4), CAMPAIGN_2024, vi.fn().mockResolvedValue(undefined));
    toSpellsStep();
    // One combined page in 2024: fill both quotas (2 cantrips, 4 spells) to move on.
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getByText('csb-add:cantrips'));
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('csb-add:spells'));
    next();
    fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][1]).not.toHaveProperty('ek_spell_slots');
  });

  it('a spell shows in the slot it was RECORDED in, even when its school says otherwise', () => {
    // Shield is an Abjuration, but this EK learned it in the any-school slot at L3.
    renderWiz(ek(4, {
      known_spells: ['Shield', 'Magic Missile'],
      ek_spell_slots: { Shield: 'any', 'Magic Missile': 'restricted' },
    }), CAMPAIGN_5E);
    toRestrictedPage();
    expect(screen.getByTestId('spelllist-spells-Abjuration & Evocation Spells')).toHaveTextContent('Magic Missile');
    advanceSpellPage('restricted');
    expect(screen.getByTestId('spelllist-spells-Any School')).toHaveTextContent('Shield');
  });

  it('5e: swapping a restricted spell frees a slot in the restricted list only', () => {
    renderWiz(ek(4, {
      known_spells: ['Shield', 'Magic Missile'],
      ek_spell_slots: { Shield: 'any', 'Magic Missile': 'restricted' },
    }), CAMPAIGN_5E);
    toRestrictedPage();
    expect(screen.getByTestId('ek-count-restricted')).toHaveTextContent('1/3');
    fireEvent.click(screen.getByText('remove:Magic Missile'));
    // The freed slot reopens in the RESTRICTED category...
    expect(screen.getByTestId('ek-count-restricted')).toHaveTextContent('0/3');
    // ...and the any-school page is untouched (Shield still occupies its slot).
    advanceSpellPage('restricted'); // refill the restricted quota so Next is allowed
    expect(screen.getByTestId('ek-count-any')).toHaveTextContent('1/1');
  });

  it('allows only ONE leveled spell swap per level', () => {
    renderWiz(ek(4, {
      known_spells: ['Shield', 'Magic Missile'],
      ek_spell_slots: { Shield: 'restricted', 'Magic Missile': 'restricted' },
    }), CAMPAIGN_5E);
    toRestrictedPage();
    fireEvent.click(screen.getByText('remove:Shield'));
    expect(screen.getByTestId('ek-count-restricted')).toHaveTextContent('1/3');
    // The swap budget is spent, so the other spell you already knew LOSES its remove button —
    // a visible refusal, not a button that silently does nothing.
    expect(screen.queryByText('remove:Magic Missile')).not.toBeInTheDocument();
    expect(screen.getByTestId('ek-swap-spent-note')).toBeInTheDocument();
  });

  it('a spell picked during THIS level-up can still be changed after the swap is spent', () => {
    renderWiz(ek(4, {
      known_spells: ['Shield', 'Magic Missile', 'Thunderwave'],
      ek_spell_slots: { Shield: 'restricted', 'Magic Missile': 'restricted', Thunderwave: 'restricted' },
    }), CAMPAIGN_5E);
    toRestrictedPage();
    fireEvent.click(screen.getByText('remove:Shield'));      // spend the swap
    fireEvent.click(screen.getByText('csb-add:restricted')); // pick its replacement
    // The replacement is not a spell you "already knew", so it stays removable — you can
    // change your mind about this level's pick without it counting as a second swap.
    expect(screen.getByText('remove:Browse Restricted 3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('remove:Browse Restricted 3'));
    expect(screen.getByTestId('ek-count-restricted')).toHaveTextContent('2/3');
  });

  it('blocks Next on a half-finished swap (a spell removed and not replaced)', () => {
    // A FULL restricted list at L5 (3 of them), so the page starts complete and the only
    // thing that can break it is the swap itself.
    renderWiz(ek(4, {
      known_spells: ['Shield', 'Magic Missile', 'Thunderwave'],
      ek_spell_slots: { Shield: 'restricted', 'Magic Missile': 'restricted', Thunderwave: 'restricted' },
    }), CAMPAIGN_5E);
    toRestrictedPage();
    expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
    fireEvent.click(screen.getByText('remove:Shield'));
    // You can't leave this page mid-swap.
    expect(screen.getByTestId('wizard-next')).toBeDisabled();
    // Replacing it from the same category completes the swap.
    fireEvent.click(screen.getByText('csb-add:restricted'));
    expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
  });

  it('blocks Next until the page quota is met, and says how many are still missing', () => {
    renderWiz(ek(4), CAMPAIGN_5E);
    toSpellsStep(); // cantrips page — 0 of 2 chosen
    expect(screen.getByTestId('wizard-next')).toBeDisabled();
    expect(screen.getByTestId('spell-page-incomplete')).toHaveTextContent('Choose 2 more cantrips to continue.');

    fireEvent.click(screen.getByText('csb-add:cantrips'));
    expect(screen.getByTestId('wizard-next')).toBeDisabled(); // 1 of 2 — still short
    expect(screen.getByTestId('spell-page-incomplete')).toHaveTextContent('Choose 1 more cantrip to continue.');

    fireEvent.click(screen.getByText('csb-add:cantrips'));
    expect(screen.getByTestId('wizard-next')).not.toBeDisabled();
    expect(screen.queryByTestId('spell-page-incomplete')).not.toBeInTheDocument();

    // The same gate applies to the next page — the restricted picks can't be skipped either.
    nextStep();
    expect(screen.getByTestId('wizard-next')).toBeDisabled();
    expect(screen.getByTestId('spell-page-incomplete')).toHaveTextContent('Choose 3 more spells to continue.');
  });

  it('5e shows NO cantrip page on a level that grants no cantrip — they can never be swapped', () => {
    // L4→5: cantrips known stays 2, and 5e can't swap one, so the page would be a dead end.
    renderWiz(ek(4, { cantrips: ['Fire Bolt', 'Blade Ward'] }), CAMPAIGN_5E);
    expect(screen.queryByText('Cantrips')).not.toBeInTheDocument(); // no step label
    toSpellsStep(); // hp → features → straight to the first LEVELED page
    expect(screen.getByTestId('ek-section-restricted')).toBeInTheDocument();
    expect(screen.queryByTestId('spelllist-Cantrips Known')).not.toBeInTheDocument();
  });

  it('5e shows the cantrip page on a level that DOES grant one (L10), and old cantrips stay permanent', () => {
    // L9→10: cantrips known rises 2 → 3, so there is a real choice to make.
    renderWiz(ek(9, { cantrips: ['Fire Bolt', 'Blade Ward'] }), CAMPAIGN_5E);
    expect(screen.getByText('Cantrips')).toBeInTheDocument();
    toSpellsStep();
    expect(screen.getByTestId('spelllist-Cantrips Known')).toBeInTheDocument();
    expect(screen.getByTestId('ek-cantrip-permanent-note')).toBeInTheDocument();
    // The two already known can't be given up — they have no remove button at all.
    expect(screen.queryByText('remove:Fire Bolt')).not.toBeInTheDocument();
    expect(screen.queryByText('remove:Blade Ward')).not.toBeInTheDocument();
    expect(screen.getByTestId('spelllist-count-Cantrips Known')).toHaveTextContent('2');
    expect(screen.getByTestId('spell-page-incomplete')).toHaveTextContent('Choose 1 more cantrip to continue.');
  });

  it('5e still shows the cantrip page when the character is owed one it never picked', () => {
    renderWiz(ek(4, { cantrips: ['Fire Bolt'] }), CAMPAIGN_5E); // 1 of 2 known
    toSpellsStep();
    expect(screen.getByTestId('spelllist-Cantrips Known')).toBeInTheDocument();
    expect(screen.getByTestId('spell-page-incomplete')).toHaveTextContent('Choose 1 more cantrip to continue.');
  });

  it('2024 may swap one cantrip per level — but only one', () => {
    renderWiz(ek(4, { cantrips: ['Fire Bolt', 'Blade Ward'] }), CAMPAIGN_2024);
    toSpellsStep();
    expect(screen.queryByTestId('ek-cantrip-permanent-note')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('remove:Fire Bolt'));
    expect(screen.getByTestId('spelllist-count-Cantrips Known')).toHaveTextContent('1');
    // One cantrip swap per level — the other one is now locked (no remove button).
    expect(screen.queryByText('remove:Blade Ward')).not.toBeInTheDocument();
  });

  it('each spell page explains only its own budget', () => {
    renderWiz(ek(4), CAMPAIGN_5E);
    toSpellsStep();
    expect(screen.getByTestId('spell-step-intro')).toHaveTextContent(/cantrips are cast at will/i);
    advanceSpellPage('cantrips');
    expect(screen.getByTestId('spell-step-intro')).toHaveTextContent(/Abjuration and Evocation/i);
    advanceSpellPage('restricted');
    expect(screen.getByTestId('spell-step-intro')).toHaveTextContent(/any school/i);
  });

  it('the one-swap budget is shared ACROSS the two leveled pages, not one per page', () => {
    renderWiz(ek(4, {
      known_spells: ['Shield', 'Magic Missile', 'Burning Hands'],
      ek_spell_slots: { Shield: 'restricted', 'Magic Missile': 'restricted', 'Burning Hands': 'any' },
    }), CAMPAIGN_5E);
    toRestrictedPage();
    // Spend the swap on the restricted page, then refill so we can move on.
    fireEvent.click(screen.getByText('remove:Shield'));
    advanceSpellPage('restricted');
    // The any-school page must now refuse a second swap — the budget is one spell per level —
    // and it says so, rather than leaving a remove button that does nothing.
    expect(screen.getByTestId('ek-count-any')).toHaveTextContent('1/1');
    expect(screen.queryByText('remove:Burning Hands')).not.toBeInTheDocument();
    expect(screen.getByTestId('ek-swap-spent-note')).toBeInTheDocument();
  });

  it('a 2024 EK keeps ONE combined page (no split)', () => {
    renderWiz(ek(4), CAMPAIGN_2024);
    toSpellsStep();
    // Cantrips and the leveled list share the page, and there is no per-category page.
    expect(screen.getByTestId('spelllist-Cantrips Known')).toBeInTheDocument();
    expect(screen.getByTestId('spelllist-Spells Known')).toBeInTheDocument();
    expect(screen.queryByTestId('ek-section-restricted')).not.toBeInTheDocument();
  });

  it('L3→4: the any-school spell can be swapped out on its page', () => {
    // A real level-3 EK: 2 cantrips, 3 spells (2 restricted + the 1 any-school slot from L3).
    // At L4 the restricted quota rises to 3, so the restricted page is owed one pick — but the
    // any-school spell must still be swappable on its own page.
    renderWiz(ek(3, {
      cantrips: ['Fire Bolt', 'Blade Ward'],
      known_spells: ['Shield', 'Magic Missile', 'Burning Hands'],
      ek_spell_slots: { Shield: 'restricted', 'Magic Missile': 'restricted', 'Burning Hands': 'any' },
    }), CAMPAIGN_5E);

    // Level 4 is an ASI level for a Fighter, so the spell pages sit behind the ASI steps.
    chooseTakeAverage();                                  // hp → features
    nextStep();                                           // features → ASI-or-Feat choice
    fireEvent.click(screen.getByTestId('asi-choice-asi'));
    nextStep();                                           // → ability scores
    fireEvent.click(screen.getByTestId('asi-inc-strength'));
    fireEvent.click(screen.getByTestId('asi-inc-dexterity'));
    nextStep();                                           // → spells (no cantrip page at L4)

    expect(screen.getByTestId('ek-section-restricted')).toBeInTheDocument();
    advanceSpellPage('restricted'); // fill the owed 3rd restricted slot → any-school page

    expect(screen.getByTestId('ek-count-any')).toHaveTextContent('1/1');
    fireEvent.click(screen.getByText('remove:Burning Hands'));
    expect(screen.getByTestId('ek-count-any')).toHaveTextContent('0/1');
  });

  it('a known-caster CLASS (Sorcerer) is unaffected — no school split, no swap cap', () => {
    renderWiz(SORCERER_L1, CAMPAIGN_5E);
    toSpellsStep();
    expect(screen.queryByTestId('ek-section-restricted')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('remove:Magic Missile'));
    expect(screen.getByTestId('spelllist-count-Spells Known')).toHaveTextContent('0');
  });
});
