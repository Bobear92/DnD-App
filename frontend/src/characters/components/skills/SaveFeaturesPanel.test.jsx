import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SaveFeaturesPanel from './SaveFeaturesPanel';

const CAVALIER = { charClass: 'Fighter', subclass: 'Cavalier', level: 3, edition: '5e' };
const BORN = 'save-feature-fighter-cavalier-born-to-the-saddle';

describe('SaveFeaturesPanel', () => {
  it('lists the feature by name only — the description is hidden until clicked', () => {
    render(<SaveFeaturesPanel {...CAVALIER} />);
    expect(screen.getByTestId(BORN)).toHaveTextContent('Born to the Saddle');
    expect(screen.queryByTestId(`${BORN}-desc`)).toBeNull();
  });

  it('shows the full rules text when the name is clicked', () => {
    render(<SaveFeaturesPanel {...CAVALIER} />);
    fireEvent.click(screen.getByTestId(BORN));
    expect(screen.getByTestId(`${BORN}-desc`)).toHaveTextContent(/advantage on saving throws/i);
  });

  it('collapses again when the name is clicked a second time', () => {
    render(<SaveFeaturesPanel {...CAVALIER} />);
    fireEvent.click(screen.getByTestId(BORN));
    fireEvent.click(screen.getByTestId(BORN));
    expect(screen.queryByTestId(`${BORN}-desc`)).toBeNull();
  });

  it('reports its expanded state for assistive tech', () => {
    render(<SaveFeaturesPanel {...CAVALIER} />);
    expect(screen.getByTestId(BORN)).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByTestId(BORN));
    expect(screen.getByTestId(BORN)).toHaveAttribute('aria-expanded', 'true');
  });

  it('names the source the feature comes from', () => {
    render(<SaveFeaturesPanel {...CAVALIER} />);
    expect(screen.getByTestId(BORN)).toHaveTextContent('Cavalier');
  });

  // A feat's save clause had no route to this panel at all before — the registry has no
  // feat key — so War Caster's concentration advantage lived only in the Feats tab.
  describe('feat-sourced entries', () => {
    const WAR_CASTER = {
      id: 20, name: 'War Caster',
      effects: [{ kind: 'save_advantage', abilities: ['constitution'], situation: 'to maintain concentration' }],
    };
    const WC = 'save-feature-feat-war-caster';

    it('lists a feat by name, labelled as a Feat', () => {
      render(<SaveFeaturesPanel {...CAVALIER} characterData={{ feats: [WAR_CASTER] }} />);
      expect(screen.getByTestId(WC)).toHaveTextContent('War Caster');
      expect(screen.getByTestId(WC)).toHaveTextContent('Feat');
    });

    it('expands to the rules text built from the effect', () => {
      render(<SaveFeaturesPanel {...CAVALIER} characterData={{ feats: [WAR_CASTER] }} />);
      fireEvent.click(screen.getByTestId(WC));
      expect(screen.getByTestId(`${WC}-desc`))
        .toHaveTextContent('Advantage on Constitution saving throws to maintain concentration.');
    });

    // The panel exists for characters with no save-affecting class feature too — a Champion
    // with War Caster must still get one, or the feat is as buried as it was before.
    it('renders for a character whose ONLY save feature is a feat', () => {
      render(
        <SaveFeaturesPanel
          charClass="Fighter" subclass="Champion" level={20} edition="5e"
          characterData={{ feats: [WAR_CASTER] }}
        />,
      );
      expect(screen.getByTestId('save-features')).toBeInTheDocument();
      expect(screen.getByTestId(WC)).toHaveTextContent('War Caster');
    });

    it('ignores a feat with no save clause', () => {
      render(
        <SaveFeaturesPanel
          charClass="Fighter" subclass="Champion" level={20} edition="5e"
          characterData={{ feats: [{ id: 1, name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] }] }}
        />,
      );
      expect(screen.queryByTestId('save-features')).toBeNull();
    });
  });

  it('renders nothing when the character has no save features', () => {
    const { container } = render(<SaveFeaturesPanel charClass="Fighter" subclass="Champion" level={20} edition="5e" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('save-features')).toBeNull();
  });

  it('renders nothing below the unlock level', () => {
    render(<SaveFeaturesPanel {...CAVALIER} level={2} />);
    expect(screen.queryByTestId('save-features')).toBeNull();
  });
});
