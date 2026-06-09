import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import LevelUpWizard from './LevelUpWizard';

// Simplify SubclassPickerWithDetail so each option is a plain button
vi.mock('./SubclassPickerWithDetail', () => ({
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
vi.mock('./SpellList', () => ({
  default: ({ label, spells = [], onAdd }) => (
    <div data-testid={`spelllist-${label}`}>
      <span data-testid={`spelllist-count-${label}`}>{spells.length}</span>
      <button type="button" onClick={() => onAdd?.(`${label} Pick`)}>{`add:${label}`}</button>
    </div>
  ),
}));

// FeatPicker uses a Radix dialog — mock it to a flat button list so we can assert which
// feats are offered (eligibility filtering) and pick one.
vi.mock('./FeatPicker', () => ({
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

// featService.getFeats is fetched on mount for ASI-feat levels.
vi.mock('../../encyclopedia/featService', () => ({
  default: { getFeats: vi.fn().mockResolvedValue([]) },
}));
import featService from '../../encyclopedia/featService';

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

    it('applies the manual roll + CON to hp_max in onComplete', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      renderFighter(onComplete);
      fireEvent.click(screen.getByTestId('hp-method-manual'));
      fireEvent.change(screen.getByTestId('hp-manual-input'), { target: { value: '6' } });
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));   // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i }));   // features → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      // Fighter L1 hp_max 26, CON 14 (+2): 26 + (6 + 2) = 34
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          2,
          expect.objectContaining({ hp_max: 34 })
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

    it('folds Dwarven Toughness into HP gained but NOT into the stored hp_max', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      renderChar(HILL_DWARF_FIGHTER_L1, onComplete);
      fireEvent.click(screen.getByTestId('hp-method-average')); // d10 avg 6, +2 CON, +1 dwarf = +9
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // hp → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → confirm
      // Confirm summary shows the effective new max: 26 + 8 stored + 2 (Toughness at L2) = 36
      expect(screen.getByText('36')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));
      // Stored hp_max excludes the passive bonus (sheet adds it): 26 + (6 + 2) = 34
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(2, expect.objectContaining({ hp_max: 34 }));
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
      fireEvent.click(screen.getByTestId('wizard-next')); // features → proficiencies
      expect(screen.getByText(/Student of War/i)).toBeInTheDocument();
      // Next blocked until a tool is picked
      expect(screen.getByTestId('wizard-next')).toBeDisabled();
      fireEvent.click(screen.getByTestId("prof-opt-student_of_war-Smith's Tools"));
      fireEvent.click(screen.getByTestId('wizard-next')); // proficiencies → maneuvers (Battle Master learns 3 at L3)
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

    it('does not add a Proficiencies step for a subclass without a choice grant (Champion)', () => {
      toSubclassStep();
      fireEvent.click(screen.getByText('Champion'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // subclass → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // features → confirm (no proficiencies)
      expect(screen.getByRole('button', { name: /Confirm Level Up/i })).toBeInTheDocument();
      expect(screen.queryByText(/Student of War/i)).not.toBeInTheDocument();
    });

    it('hides a tool the character already has from the Student of War options', () => {
      toSubclassStep({ ...FIGHTER_L2, character_data: { hp_max: 26, background_tool_choice: "Smith's Tools" } });
      fireEvent.click(screen.getByText('Battle Master'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → features
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → proficiencies
      expect(screen.queryByTestId("prof-opt-student_of_war-Smith's Tools")).not.toBeInTheDocument();
      expect(screen.getByTestId("prof-opt-student_of_war-Brewer's Supplies")).toBeInTheDocument();
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

    it('hides an already-taken non-repeatable feat', async () => {
      featService.getFeats.mockResolvedValueOnce(FEATS);
      const charWithAlert = { ...FIGHTER_L3, character_data: { hp_max: 26, feats: [{ id: 10, name: 'Alert' }] } };
      toChoiceStep(charWithAlert, CAMPAIGN_ASI_OR_FEAT);
      fireEvent.click(screen.getByTestId('asi-choice-feat'));
      fireEvent.click(screen.getByTestId('wizard-next')); // choice → feat
      await screen.findByTestId('pick-feat-11');
      expect(screen.queryByTestId('pick-feat-10')).not.toBeInTheDocument();
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
      expect(screen.getByText('add:Cantrips Known')).toBeInTheDocument();
      expect(screen.getByText('add:Spells Known')).toBeInTheDocument();
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
      fireEvent.click(screen.getByText('add:Cantrips Known'));
      fireEvent.click(screen.getByText('add:Spells Known'));
      fireEvent.click(screen.getByRole('button', { name: /Next/i })); // spells → confirm
      fireEvent.click(screen.getByRole('button', { name: /Confirm Level Up/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(
          2,
          expect.objectContaining({
            cantrips: expect.arrayContaining(['Fire Bolt', 'Cantrips Known Pick']),
            known_spells: expect.arrayContaining(['Magic Missile', 'Spells Known Pick']),
          })
        );
      });
    });
  });
});
