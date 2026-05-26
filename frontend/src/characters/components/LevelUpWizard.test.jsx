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

const CAMPAIGN_5E = { id: 1, edition: '5e' };
const CAMPAIGN_2024 = { id: 1, edition: '5.5e' };

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
});
