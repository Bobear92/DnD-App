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
