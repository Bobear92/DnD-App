import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import BardSheet from '@/characters/components/sheets/BardSheet';

/**
 * Regression: local state inside a sheet must survive a parent re-render.
 *
 * Every hand-written sheet used to declare `const Field = …` INSIDE its component body, making
 * it a new component type on each render — React remounted the whole Field subtree and threw
 * away the state underneath. In the app that meant a user typing a custom instrument lost the
 * keystrokes the moment anything re-rendered the sheet (a late races/backgrounds/feats response
 * during creation, an autosave on the live sheet). `Field` now lives at module scope.
 *
 * The static guard is src/test/noNestedComponents.test.js; this pins the behaviour it protects.
 */
function Harness() {
  const [tick, setTick] = useState(0);
  const [data, setData] = useState({});
  return (
    <div>
      <button type="button" onClick={() => setTick((t) => t + 1)}>force re-render</button>
      <span data-testid="tick">{tick}</span>
      <BardSheet
        data={data}
        onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
        creation
        level={1}
      />
    </div>
  );
}

describe('sheet state survives a parent re-render', () => {
  it('keeps half-typed input in the instrument picker', () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText('Other instrument…');
    fireEvent.change(input, { target: { value: 'Hurdy-Gurdy' } });

    fireEvent.click(screen.getByText('force re-render'));

    expect(screen.getByTestId('tick')).toHaveTextContent('1');
    // Re-query: a remount would have replaced the node and cleared its value.
    expect(screen.getByPlaceholderText('Other instrument…')).toHaveValue('Hurdy-Gurdy');
  });

  it('still commits the typed instrument after a re-render', () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText('Other instrument…');
    fireEvent.change(input, { target: { value: 'Hurdy-Gurdy' } });
    fireEvent.click(screen.getByText('force re-render'));
    fireEvent.keyDown(screen.getByPlaceholderText('Other instrument…'), { key: 'Enter' });

    expect(screen.getByRole('button', { name: 'Hurdy-Gurdy' })).toBeInTheDocument();
  });
});
