import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppearanceCard from './AppearanceCard';

const FILLED = {
  height: `6'2"`,
  eyes: 'pale grey',
  hairColor: 'black',
  markings: 'A burn across the left forearm.',
};

describe('AppearanceCard — read view', () => {
  it('shows an empty state when nothing has been written', () => {
    render(<AppearanceCard appearance={{}} canEdit={false} />);
    expect(screen.getByTestId('appearance-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('appearance-read')).not.toBeInTheDocument();
  });

  it('shows the values that were written', () => {
    render(<AppearanceCard appearance={FILLED} canEdit={false} />);
    expect(screen.getByTestId('appearance-value-eyes')).toHaveTextContent('pale grey');
    expect(screen.getByTestId('appearance-value-height')).toHaveTextContent(`6'2"`);
  });

  // A reader wants the description, not a form with holes in it.
  it('omits the fields that were left blank', () => {
    render(<AppearanceCard appearance={FILLED} canEdit={false} />);
    expect(screen.queryByTestId('appearance-value-scent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('appearance-value-voice')).not.toBeInTheDocument();
  });

  it('omits a group nobody filled in anything from', () => {
    render(<AppearanceCard appearance={{ eyes: 'grey' }} canEdit={false} />);
    expect(screen.getByTestId('appearance-group-features')).toBeInTheDocument();
    expect(screen.queryByTestId('appearance-group-presentation')).not.toBeInTheDocument();
  });

  it('renders no inputs at all for a reader', () => {
    render(<AppearanceCard appearance={FILLED} canEdit={false} />);
    expect(screen.queryByTestId('appearance-input-eyes')).not.toBeInTheDocument();
  });
});

describe('AppearanceCard — edit view', () => {
  // You cannot fill in a box you cannot see, so the editor shows the whole catalog even though
  // the read view hides blanks.
  it('shows every field, including the blank ones', () => {
    render(<AppearanceCard appearance={{}} canEdit onChange={vi.fn()} />);
    expect(screen.getByTestId('appearance-edit')).toBeInTheDocument();
    for (const k of ['age', 'height', 'eyes', 'hairStyle', 'voice', 'scent', 'description']) {
      expect(screen.getByTestId(`appearance-input-${k}`), k).toBeInTheDocument();
    }
  });

  it('reports each edit by field key', () => {
    const onChange = vi.fn();
    render(<AppearanceCard appearance={{}} canEdit onChange={onChange} />);
    fireEvent.change(screen.getByTestId('appearance-input-eyes'), { target: { value: 'amber' } });
    expect(onChange).toHaveBeenCalledWith('eyes', 'amber');
  });

  it('shows the values already stored', () => {
    render(<AppearanceCard appearance={FILLED} canEdit onChange={vi.fn()} />);
    expect(screen.getByTestId('appearance-input-eyes')).toHaveValue('pale grey');
  });

  // Suggestions must never become a closed menu — a Select here would be the app deciding what
  // colour a player's eyes may be.
  it('offers suggestions as a datalist on a free-text input', () => {
    render(<AppearanceCard appearance={{}} canEdit onChange={vi.fn()} />);
    expect(screen.getByTestId('appearance-suggestions-eyes')).toBeInTheDocument();
    expect(screen.getByTestId('appearance-input-eyes').tagName).toBe('INPUT');
    expect(screen.getByTestId('appearance-input-eyes'))
      .toHaveAttribute('list', 'appearance-suggestions-eyes');
  });

  it('uses a textarea for the long-form fields', () => {
    render(<AppearanceCard appearance={{}} canEdit onChange={vi.fn()} />);
    expect(screen.getByTestId('appearance-input-description').tagName).toBe('TEXTAREA');
    expect(screen.getByTestId('appearance-input-markings').tagName).toBe('TEXTAREA');
  });
});

describe('AppearanceCard — feature notes', () => {
  const runeKnight = (level) => ({
    charClass: 'Fighter', subclass: 'Rune Knight', level, edition: '5e',
  });

  it('notes Great Stature beside the height field for a Rune Knight who has it', () => {
    render(<AppearanceCard appearance={{}} canEdit onChange={vi.fn()} {...runeKnight(10)} />);
    const note = screen.getByTestId('appearance-note-height-great-stature');
    expect(note).toHaveTextContent(/3d4/);
    expect(note).toHaveTextContent(/size category is unchanged/i);
  });

  it('shows no note below the level that grants it, or for another subclass', () => {
    const { unmount } = render(
      <AppearanceCard appearance={{}} canEdit onChange={vi.fn()} {...runeKnight(9)} />);
    expect(screen.queryByTestId('appearance-note-height-great-stature')).not.toBeInTheDocument();
    unmount();

    render(<AppearanceCard appearance={{}} canEdit onChange={vi.fn()}
      charClass="Fighter" subclass="Champion" level={20} edition="5e" />);
    expect(screen.queryByTestId('appearance-note-height-great-stature')).not.toBeInTheDocument();
  });

  it('shows no notes at all for an ordinary character', () => {
    render(<AppearanceCard appearance={{}} canEdit onChange={vi.fn()}
      charClass="Rogue" level={5} edition="5e" />);
    expect(screen.queryByTestId(/^appearance-note-/)).not.toBeInTheDocument();
  });
});
