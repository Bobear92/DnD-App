import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import FeatChoiceFields from '@/characters/components/feats/FeatChoiceFields';
import { resolveFeatAcquisition, EMPTY_FEAT_CHOICES } from '@/characters/components/feats/featAcquisition';

// The two sub-pickers have their own test files (and fetch spells); stub them to their contract.
vi.mock('@/characters/components/feats/FeatSpellGrantPicker', () => ({
  default: ({ spec, value, onChange, campaignId, testIdPrefix }) => (
    <div data-testid={`${testIdPrefix}-stub`} data-campaign={String(campaignId)} data-cantrips={String(spec.cantrips)}>
      <span data-testid={`${testIdPrefix}-value`}>{JSON.stringify(value)}</span>
      <button type="button" data-testid={`${testIdPrefix}-fill`} onClick={() => onChange({ source: 'Wizard', cantrips: ['Light'] })}>fill</button>
    </div>
  ),
  spellGrantComplete: () => true,
  resolveSpellGrantValue: (_spec, value) => value,
}));
vi.mock('@/characters/components/feats/FeatManeuverPicker', () => ({
  default: ({ value, onChange, edition, knownManeuvers = [], testIdPrefix }) => (
    <div data-testid={`${testIdPrefix}-stub`} data-edition={edition} data-known={knownManeuvers.join(',')}>
      <span data-testid={`${testIdPrefix}-value`}>{value.join(',')}</span>
      <button type="button" data-testid={`${testIdPrefix}-fill`} onClick={() => onChange(['Riposte', 'Parry'])}>fill</button>
    </div>
  ),
}));

const ALERT = { id: 1, name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] };
const TAVERN_BRAWLER = { id: 3, name: 'Tavern Brawler', effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }] };
const LINGUIST = { id: 7, name: 'Linguist', effects: [{ kind: 'proficiency', prof_type: 'language', count: 2 }] };
const SKILL_EXPERT = {
  id: 8, name: 'Skill Expert',
  effects: [{ kind: 'proficiency', prof_type: 'skill', count: 1 }, { kind: 'expertise', count: 1 }],
};
const MAGIC_INITIATE = { id: 9, name: 'Magic Initiate', effects: [{ kind: 'spell_grant', source_kind: 'class', cantrips: 2, leveled: [{ level: 1, count: 1 }] }] };
const MARTIAL_ADEPT = { id: 10, name: 'Martial Adept', effects: [{ kind: 'maneuver_grant', count: 2, die: 'd6' }] };

// The surface owns `choices`; this is the smallest faithful one.
function Harness({ feat, onChoices, initial = EMPTY_FEAT_CHOICES, modelArgs = {}, ...props }) {
  const [choices, setChoices] = useState(initial);
  const model = resolveFeatAcquisition({ feat, choices, ...modelArgs });
  return (
    <div data-testid="harness" data-complete={String(model.complete.all)}>
      <FeatChoiceFields
        model={model}
        onChange={(next) => { setChoices(next); onChoices?.(next); }}
        {...props}
      />
    </div>
  );
}

describe('FeatChoiceFields — nothing to ask', () => {
  it('renders nothing for a feat with no follow-up choices', () => {
    render(<Harness feat={ALERT} />);
    expect(screen.getByTestId('harness')).toBeEmptyDOMElement();
  });

  it('renders nothing when no feat is picked yet', () => {
    render(<Harness feat={null} />);
    expect(screen.getByTestId('harness')).toBeEmptyDOMElement();
  });

  it('renders nothing when handed no model at all', () => {
    const { container } = render(<FeatChoiceFields model={null} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('FeatChoiceFields — ability score', () => {
  it('offers each ability with the amount, and reports the pick', () => {
    const onChoices = vi.fn();
    render(<Harness feat={TAVERN_BRAWLER} onChoices={onChoices} />);
    expect(screen.getByTestId('feat-ability-choice')).toHaveTextContent('increases an ability score by 1');
    expect(screen.getByTestId('feat-ability-strength')).toHaveTextContent('+1 Strength');
    expect(screen.getByTestId('feat-ability-constitution')).toHaveTextContent('+1 Constitution');
    expect(screen.queryByTestId('feat-ability-dexterity')).toBeNull();

    fireEvent.click(screen.getByTestId('feat-ability-constitution'));
    expect(onChoices).toHaveBeenCalledWith({ ...EMPTY_FEAT_CHOICES, ability: 'constitution' });
  });

  it('completes once an ability is picked, and the pick can be changed', () => {
    render(<Harness feat={TAVERN_BRAWLER} />);
    expect(screen.getByTestId('harness')).toHaveAttribute('data-complete', 'false');
    fireEvent.click(screen.getByTestId('feat-ability-strength'));
    expect(screen.getByTestId('harness')).toHaveAttribute('data-complete', 'true');
    expect(screen.getByTestId('feat-ability-strength').className).toMatch(/border-primary/);
    fireEvent.click(screen.getByTestId('feat-ability-constitution'));
    expect(screen.getByTestId('feat-ability-constitution').className).toMatch(/border-primary/);
    expect(screen.getByTestId('feat-ability-strength').className).not.toMatch(/border-primary /);
  });

  it('uses the test id prefix each surface asks for', () => {
    render(<Harness feat={TAVERN_BRAWLER} testIdPrefix="human-feat" />);
    expect(screen.getByTestId('human-feat-ability-choice')).toBeInTheDocument();
    expect(screen.getByTestId('human-feat-ability-strength')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-ability-strength')).toBeNull();
  });
});

describe('FeatChoiceFields — proficiency picks', () => {
  it('shows the count and fills it as options are picked', () => {
    render(<Harness feat={LINGUIST} />);
    const grant = screen.getByTestId('feat-prof-grant-language');
    expect(grant).toHaveTextContent('0/2');
    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Elvish'));
    expect(grant).toHaveTextContent('1/2');
    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Giant'));
    expect(grant).toHaveTextContent('2/2');
    expect(screen.getByTestId('harness')).toHaveAttribute('data-complete', 'true');
  });

  it('disables the other options at the limit, but lets a pick be removed', () => {
    render(<Harness feat={LINGUIST} />);
    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Elvish'));
    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Giant'));
    expect(screen.getByTestId('feat-prof-opt-language-Orc')).toBeDisabled();
    expect(screen.getByTestId('feat-prof-opt-language-Elvish')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Elvish'));
    expect(screen.getByTestId('feat-prof-grant-language')).toHaveTextContent('1/2');
    expect(screen.getByTestId('feat-prof-opt-language-Orc')).not.toBeDisabled();
    expect(screen.getByTestId('harness')).toHaveAttribute('data-complete', 'false');
  });

  it('reports the picks under their grant type', () => {
    const onChoices = vi.fn();
    render(<Harness feat={LINGUIST} onChoices={onChoices} />);
    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Elvish'));
    expect(onChoices).toHaveBeenLastCalledWith({ ...EMPTY_FEAT_CHOICES, prof: { language: ['Elvish'] } });
  });

  it('does not offer what the character already has', () => {
    render(<Harness feat={LINGUIST} modelArgs={{ characterData: { race_languages: ['Elvish'] } }} />);
    expect(screen.queryByTestId('feat-prof-opt-language-Elvish')).toBeNull();
    expect(screen.getByTestId('feat-prof-opt-language-Giant')).toBeInTheDocument();
  });

  it('hides a grant with nothing pickable, then shows it once the feat itself supplies an option', () => {
    // Skill Expert: no proficient skill yet → no Expertise picker. Pick the feat's skill and the
    // Expertise picker appears, offering that very skill.
    render(<Harness feat={SKILL_EXPERT} />);
    expect(screen.getByTestId('feat-prof-grant-skill')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-prof-grant-expertise')).toBeNull();

    fireEvent.click(screen.getByTestId('feat-prof-opt-skill-Stealth'));
    const expertise = screen.getByTestId('feat-prof-grant-expertise');
    expect(within(expertise).getByTestId('feat-prof-opt-expertise-Stealth')).toBeInTheDocument();
  });
});

describe('FeatChoiceFields — spells and maneuvers', () => {
  it('hands the spell picker its spec, campaign and prefix, and stores what it returns', () => {
    const onChoices = vi.fn();
    render(<Harness feat={MAGIC_INITIATE} onChoices={onChoices} campaignId={7} spellTestIdPrefix="lvl-feat-spell" />);
    const stub = screen.getByTestId('lvl-feat-spell-stub');
    expect(stub).toHaveAttribute('data-campaign', '7');
    expect(stub).toHaveAttribute('data-cantrips', '2');

    fireEvent.click(screen.getByTestId('lvl-feat-spell-fill'));
    expect(onChoices).toHaveBeenLastCalledWith({ ...EMPTY_FEAT_CHOICES, spell: { source: 'Wizard', cantrips: ['Light'] } });
    expect(screen.getByTestId('lvl-feat-spell-value')).toHaveTextContent('Wizard');
  });

  it('hands the maneuver picker the edition and the maneuvers already known', () => {
    const onChoices = vi.fn();
    render(
      <Harness
        feat={MARTIAL_ADEPT} onChoices={onChoices} edition="5.5e"
        knownManeuvers={['Rally']} maneuverTestIdPrefix="lvl-feat-maneuver"
      />,
    );
    const stub = screen.getByTestId('lvl-feat-maneuver-stub');
    expect(stub).toHaveAttribute('data-edition', '5.5e');
    expect(stub).toHaveAttribute('data-known', 'Rally');

    fireEvent.click(screen.getByTestId('lvl-feat-maneuver-fill'));
    expect(onChoices).toHaveBeenLastCalledWith({ ...EMPTY_FEAT_CHOICES, maneuvers: ['Riposte', 'Parry'] });
    expect(screen.getByTestId('harness')).toHaveAttribute('data-complete', 'true');
  });

  it('shows no spell or maneuver picker for a feat that grants neither', () => {
    render(<Harness feat={TAVERN_BRAWLER} />);
    expect(screen.queryByTestId('feat-spell-stub')).toBeNull();
    expect(screen.queryByTestId('feat-maneuver-stub')).toBeNull();
  });
});

describe('FeatChoiceFields — one choice never disturbs another', () => {
  it('picking a proficiency keeps an earlier ability pick', () => {
    const BOTH = {
      id: 20, name: 'Both',
      effects: [
        { kind: 'ability_choice', abilities: ['strength', 'dexterity'], amount: 1 },
        { kind: 'proficiency', prof_type: 'language', count: 1 },
      ],
    };
    const onChoices = vi.fn();
    render(<Harness feat={BOTH} onChoices={onChoices} />);
    fireEvent.click(screen.getByTestId('feat-ability-dexterity'));
    fireEvent.click(screen.getByTestId('feat-prof-opt-language-Elvish'));
    expect(onChoices).toHaveBeenLastCalledWith({ ...EMPTY_FEAT_CHOICES, ability: 'dexterity', prof: { language: ['Elvish'] } });
    expect(screen.getByTestId('harness')).toHaveAttribute('data-complete', 'true');
  });
});
