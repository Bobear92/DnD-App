import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureNote from './FeatureNote';

const PROPS = { name: 'Warding Maneuver', text: 'Roll a d8 and add it to the AC.', testId: 'wm' };

describe('FeatureNote', () => {
  it('shows the name only — the rules text is hidden until asked for', () => {
    render(<FeatureNote {...PROPS} />);
    expect(screen.getByTestId('wm')).toHaveTextContent('Warding Maneuver');
    expect(screen.queryByTestId('wm-text')).toBeNull();
  });

  it('reveals the text on click and hides it again on a second click', () => {
    render(<FeatureNote {...PROPS} />);
    fireEvent.click(screen.getByTestId('wm'));
    expect(screen.getByTestId('wm-text')).toHaveTextContent('Roll a d8');
    fireEvent.click(screen.getByTestId('wm'));
    expect(screen.queryByTestId('wm-text')).toBeNull();
  });

  it('reports its expanded state for assistive tech', () => {
    render(<FeatureNote {...PROPS} />);
    expect(screen.getByTestId('wm')).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(screen.getByTestId('wm'));
    expect(screen.getByTestId('wm')).toHaveAttribute('aria-expanded', 'true');
  });

  it('colours the NAME by tone, so a benefit reads as one while collapsed', () => {
    const { rerender } = render(<FeatureNote {...PROPS} tone="emerald" />);
    expect(screen.getByTestId('wm').className).toContain('text-emerald-600');
    rerender(<FeatureNote {...PROPS} tone="violet" />);
    expect(screen.getByTestId('wm').className).toContain('text-violet-500');
  });

  it('falls back to the neutral tone for an unknown or missing one', () => {
    render(<FeatureNote {...PROPS} tone="chartreuse" />);
    expect(screen.getByTestId('wm').className).toContain('text-foreground');
  });

  it('renders no text block when there is nothing to expand', () => {
    render(<FeatureNote name="Bare" testId="b" />);
    fireEvent.click(screen.getByTestId('b'));
    expect(screen.queryByTestId('b-text')).toBeNull();
  });
});
