import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KnownOptionsBlock from '@/characters/components/sheets/classSheet/KnownOptionsBlock';
import { getEarnedLevelChoices } from '@/characters/components/classData/levelChoicesData';

// Driven off the real Arcane Shot entry — this is the pool-agnostic display that replaced
// forking a second BattleMasterPanel.
const arcaneShot = (level, subclass = 'Arcane Archer') =>
  getEarnedLevelChoices('Fighter', '5e', level, subclass);

const renderBlock = (props = {}) =>
  render(
    <KnownOptionsBlock
      choices={arcaneShot(props.level ?? 7)}
      data={{ arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow'], ...(props.data || {}) }}
      onChange={props.onChange ?? vi.fn()}
      level={props.level ?? 7}
      readOnly={props.readOnly ?? false}
      gmEdit={props.gmEdit ?? false}
      scores={props.scores ?? { intelligence: 14 }}
    />
  );

describe('KnownOptionsBlock', () => {
  it('renders nothing when there are no choices', () => {
    const { container } = render(<KnownOptionsBlock choices={[]} data={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the known options with their descriptions', () => {
    renderBlock();
    expect(screen.getByText('Bursting Arrow')).toBeInTheDocument();
    expect(screen.getByText('Shadow Arrow')).toBeInTheDocument();
    expect(screen.getByText(/detonates on impact/i)).toBeInTheDocument();
  });

  it('shows the derived save DC and its math', () => {
    renderBlock({ level: 7, scores: { intelligence: 14 } });
    // 8 + PB 3 + INT +2 = 13
    expect(screen.getByTestId('known-options-arcane_shot-derived')).toHaveTextContent('13');
    expect(screen.getByTestId('known-options-arcane_shot-derived-note'))
      .toHaveTextContent('8 + proficiency bonus (3) + Intelligence modifier (+2)');
  });

  it('shows the chosen count against the level target', () => {
    renderBlock({ level: 7 }); // knows 2, should know 3
    expect(screen.getByTestId('known-options-arcane_shot-count')).toHaveTextContent('2/3');
  });

  it('offers an owed slot when the character knows fewer than they should', () => {
    renderBlock({ level: 7 });
    expect(screen.getByTestId('known-options-arcane_shot-owed')).toHaveTextContent('Choose 1 more');
  });

  it('picking an owed option writes it to the storeField', () => {
    const onChange = vi.fn();
    renderBlock({ level: 7, onChange });
    fireEvent.click(screen.getByText('Seeking Arrow'));
    expect(onChange).toHaveBeenCalledWith({
      arcane_shot_options: ['Bursting Arrow', 'Shadow Arrow', 'Seeking Arrow'],
    });
  });

  it('never offers an option the character already knows', () => {
    renderBlock({ level: 7 });
    // The two known ones render as headings; the picker must not offer them again.
    expect(screen.getAllByText('Bursting Arrow')).toHaveLength(1);
    expect(screen.getAllByText('Shadow Arrow')).toHaveLength(1);
  });

  it('locks the list once the character knows their full allowance', () => {
    renderBlock({ level: 3 }); // knows 2, target 2
    expect(screen.getByTestId('known-options-arcane_shot-locked')).toBeInTheDocument();
    expect(screen.queryByTestId('known-options-arcane_shot-owed')).not.toBeInTheDocument();
    expect(screen.queryByText('Seeking Arrow')).not.toBeInTheDocument();
  });

  it('GM Edit can remove a chosen option', () => {
    const onChange = vi.fn();
    renderBlock({ level: 3, gmEdit: true, onChange });
    fireEvent.click(screen.getByTestId('known-options-arcane_shot-remove-Shadow Arrow'));
    expect(onChange).toHaveBeenCalledWith({ arcane_shot_options: ['Bursting Arrow'] });
  });

  it('a player sees no remove button', () => {
    renderBlock({ level: 3 });
    expect(screen.queryByTestId('known-options-arcane_shot-remove-Shadow Arrow')).not.toBeInTheDocument();
  });

  it('readOnly hides the count, the owed note and every control', () => {
    renderBlock({ level: 7, readOnly: true });
    expect(screen.queryByTestId('known-options-arcane_shot-count')).not.toBeInTheDocument();
    expect(screen.queryByTestId('known-options-arcane_shot-owed')).not.toBeInTheDocument();
    expect(screen.queryByText('Seeking Arrow')).not.toBeInTheDocument();
    expect(screen.getByText('Bursting Arrow')).toBeInTheDocument(); // still displayed
  });

  it('shows the base option text below the improvement level', () => {
    renderBlock({ level: 17 });
    expect(screen.queryByTestId('known-options-arcane_shot-improved-Shadow Arrow')).not.toBeInTheDocument();
    // Nothing anywhere in the block — known options or the picker below them — shows upgraded dice.
    const block = screen.getByTestId('known-options-arcane_shot');
    expect(block).toHaveTextContent(/extra 2d6 psychic damage/);
    expect(block).not.toHaveTextContent(/4d6/);
  });

  // The upgrade replaces the description rather than appending a clause to it — the player
  // reads one paragraph with the right dice, not a base effect plus "…increases to 4d6".
  it('shows the upgraded option text at the improvement level', () => {
    renderBlock({ level: 18 });
    const shadow = screen.getByTestId('known-options-arcane_shot-improved-Shadow Arrow');
    expect(shadow).toHaveTextContent(/extra 4d6 psychic damage/);
    expect(shadow).not.toHaveTextContent(/2d6/);
    expect(shadow).not.toHaveTextContent(/increases to/);
    expect(screen.getByTestId('known-options-arcane_shot-improved-Bursting Arrow'))
      .toHaveTextContent(/each take 4d6 force damage/);
    // The badge is what marks the text as the improved version.
    expect(screen.getAllByText('Improved').length).toBeGreaterThan(0);
  });

  it('shows an em dash when nothing is known and nothing is owed', () => {
    render(
      <KnownOptionsBlock choices={arcaneShot(3)} data={{}} level={3} readOnly onChange={vi.fn()} />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
