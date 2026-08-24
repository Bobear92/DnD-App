import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveEffectsBanner from '@/characters/components/effects/ActiveEffectsBanner';

const props = (characterData, extra = {}) => ({
  characterData,
  charClass: 'Fighter', subclass: 'Rune Knight', level: 10, edition: '5e',
  onChange: vi.fn(),
  ...extra,
});

describe('ActiveEffectsBanner', () => {
  it('renders NOTHING when no effect is running', () => {
    // A permanent "no effects active" card would be noise on every sheet in the app.
    const { container } = render(<ActiveEffectsBanner {...props({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a character who can never have one', () => {
    render(<ActiveEffectsBanner {...props({ active_effects: ['giants_might'] }, { subclass: 'Champion' })} />);
    expect(screen.queryByTestId('active-effects-banner')).not.toBeInTheDocument();
  });

  it('names the running effect and how long it lasts', () => {
    render(<ActiveEffectsBanner {...props({ active_effects: ['giants_might'] })} />);
    expect(screen.getByTestId('active-effect-giants_might')).toBeInTheDocument();
    expect(screen.getByText("Giant's Might")).toBeInTheDocument();
    expect(screen.getByText(/Lasts 1 minute/)).toBeInTheDocument();
  });

  it('shows the numbers the effect grants — including the SIZE, which has no other home', () => {
    // Creature size is computed for the Heavy-weapon rule but displayed nowhere else in the app,
    // so without this the character grew and nothing on the sheet said so.
    render(<ActiveEffectsBanner {...props({ active_effects: ['giants_might'] })} />);
    const summary = screen.getByTestId('active-effect-summary-giants_might');
    expect(summary).toHaveTextContent('Size Large');
    expect(summary).toHaveTextContent(/advantage on Strength checks and Strength saves/);
    expect(summary).toHaveTextContent(/extra 1d8/);
  });

  it('scales its summary with the later features', () => {
    render(<ActiveEffectsBanner {...props({ active_effects: ['giants_might'] }, { level: 18 })} />);
    const summary = screen.getByTestId('active-effect-summary-giants_might');
    expect(summary).toHaveTextContent('Size Huge');
    expect(summary).toHaveTextContent(/extra 1d10/);
    expect(summary).toHaveTextContent(/reach \+5 ft/);
  });

  it('ends the effect without refunding the use', () => {
    const onChange = vi.fn();
    render(<ActiveEffectsBanner {...props(
      { active_effects: ['giants_might'], giants_might_used: 1 }, { onChange },
    )} />);
    fireEvent.click(screen.getByTestId('active-effect-end-giants_might'));
    // Only the effect flag moves — the spent charge is untouched.
    expect(onChange).toHaveBeenCalledWith({ active_effects: [] });
  });

  it('offers no End control to a read-only viewer', () => {
    render(<ActiveEffectsBanner {...props({ active_effects: ['giants_might'] }, { readOnly: true })} />);
    expect(screen.getByTestId('active-effect-giants_might')).toBeInTheDocument();
    expect(screen.queryByTestId('active-effect-end-giants_might')).not.toBeInTheDocument();
  });
});
