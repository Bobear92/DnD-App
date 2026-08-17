import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import DefensesPanel from './DefensesPanel';

const HAM_5E = {
  name: 'Heavy Armor Master',
  effects: [{
    kind: 'damage_reduction',
    amount: 3,
    damage_types: ['bludgeoning', 'piercing', 'slashing'],
    condition: 'heavy_armor',
    nonmagical_only: true,
  }],
};

describe('DefensesPanel — learn-more link', () => {
  it('links to the Taking Damage mechanics page when given a campaignId', () => {
    render(
      <MemoryRouter>
        <DefensesPanel
          charClass="Barbarian"
          level={5}
          edition="5e"
          characterData={{}}
          pb={3}
          campaignId="7"
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('defenses-learn-more'))
      .toHaveAttribute('href', '/campaigns/7/encyclopedia/mechanics/damage-mitigation');
  });

  it('renders no link (and needs no Router) without a campaignId', () => {
    render(<DefensesPanel charClass="Barbarian" level={5} edition="5e" characterData={{}} pb={3} />);
    expect(screen.queryByTestId('defenses-learn-more')).not.toBeInTheDocument();
  });
});

describe('DefensesPanel', () => {
  it('renders nothing for a character with no defenses', () => {
    const { container } = render(
      <DefensesPanel charClass="Fighter" level={5} edition="5e" characterData={{}} pb={3} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an always-on resistance under the Always on group', () => {
    render(
      <DefensesPanel
        charClass="Fighter"
        level={5}
        edition="5e"
        characterData={{ race_traits: ['Dwarven Resilience'] }}
        pb={3}
      />,
    );
    expect(screen.getByTestId('defenses-always-on')).toBeInTheDocument();
    expect(screen.queryByTestId('defenses-situational')).not.toBeInTheDocument();
    expect(screen.getByTestId('defense-race-dwarven-resilience-types')).toHaveTextContent('Poison');
    expect(screen.getByTestId('defense-race-dwarven-resilience-value')).toHaveTextContent('Resistance');
  });

  it('shows a conditional resistance under Situational WITH its condition spelled out', () => {
    render(
      <DefensesPanel charClass="Barbarian" level={5} edition="5e" characterData={{}} pb={3} />,
    );
    expect(screen.getByTestId('defenses-situational')).toBeInTheDocument();
    expect(screen.queryByTestId('defenses-always-on')).not.toBeInTheDocument();
    expect(screen.getByTestId('defense-barbarian-rage-condition')).toHaveTextContent('while raging');
  });

  it('never presents a conditional resistance as always on', () => {
    // The regression this whole panel is shaped around: with no active-effect model, a bare
    // "B / P / S" row would tell a Barbarian they always have the resistance.
    render(
      <DefensesPanel charClass="Barbarian" level={5} edition="5e" characterData={{}} pb={3} />,
    );
    const alwaysOn = screen.queryByTestId('defenses-always-on');
    expect(alwaysOn).not.toBeInTheDocument();
  });

  it('flags a feat reduction as nonmagical-only when the edition says so', () => {
    render(
      <DefensesPanel
        charClass="Fighter"
        level={12}
        edition="5e"
        characterData={{ feats: [HAM_5E] }}
        pb={4}
      />,
    );
    expect(screen.getByTestId('defense-feat-heavy-armor-master-value')).toHaveTextContent('−3');
    expect(screen.getByTestId('defense-feat-heavy-armor-master-qualifier'))
      .toHaveTextContent('from nonmagical attacks');
    expect(screen.getByTestId('defense-feat-heavy-armor-master-condition'))
      .toHaveTextContent('while wearing heavy armor');
  });

  it('expands a feature name to its full rules text on click', async () => {
    const user = userEvent.setup();
    render(
      <DefensesPanel
        charClass="Fighter"
        level={5}
        edition="5e"
        characterData={{ race_traits: ['Hellish Resistance'] }}
        pb={3}
      />,
    );
    const testId = 'defense-race-hellish-resistance-note';
    expect(screen.queryByTestId(`${testId}-text`)).not.toBeInTheDocument();
    await user.click(screen.getByTestId(testId));
    expect(screen.getByTestId(`${testId}-text`)).toHaveTextContent(/fire damage/i);
  });

  // Feat rows carry no rules prose (the compendium description isn't fetched here), and the
  // row already states the whole mechanic — amount, types, condition, qualifier. Found in QA:
  // it rendered a chevron that expanded nothing when clicked.
  it('gives a feat row a plain name, not a disclosure arrow that opens nothing', () => {
    render(
      <DefensesPanel
        charClass="Fighter"
        level={12}
        edition="5e"
        characterData={{ feats: [HAM_5E] }}
        pb={4}
      />,
    );
    const note = screen.getByTestId('defense-feat-heavy-armor-master-note');
    expect(note).toHaveTextContent('Heavy Armor Master');
    expect(note.tagName).not.toBe('BUTTON');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows both groups when a character has each kind', () => {
    render(
      <DefensesPanel
        charClass="Barbarian"
        level={12}
        edition="5e"
        characterData={{ race_traits: ['Dwarven Resilience'], feats: [HAM_5E] }}
        pb={4}
      />,
    );
    expect(screen.getByTestId('defenses-always-on')).toBeInTheDocument();
    expect(screen.getByTestId('defenses-situational')).toBeInTheDocument();
    expect(screen.getByTestId('defense-race-dwarven-resilience')).toBeInTheDocument();
    expect(screen.getByTestId('defense-barbarian-rage')).toBeInTheDocument();
    expect(screen.getByTestId('defense-feat-heavy-armor-master')).toBeInTheDocument();
  });
});
