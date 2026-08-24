import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SpellFocusProvider, useSpellFocus, useSpellFocusController, useFocusedSpell,
} from '@/characters/components/spells/SpellFocusContext';

/** A consumer that records every focus request it accepts. */
function Consumer({ has, log, label = 'consumer' }) {
  useFocusedSpell(has, (name) => log(`${label}:${name}`));
  return <div data-testid={label} />;
}

function Trigger({ name }) {
  const { focusSpell } = useSpellFocus();
  return <button type="button" data-testid={`focus-${name}`} onClick={() => focusSpell(name)}>go</button>;
}

describe('SpellFocusContext', () => {
  it('delivers a focus request to a surface that holds the spell', () => {
    const log = vi.fn();
    render(
      <SpellFocusProvider>
        <Trigger name="Fireball" />
        <Consumer has={(n) => n === 'Fireball'} log={log} />
      </SpellFocusProvider>
    );
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('focus-Fireball'));
    expect(log).toHaveBeenCalledWith('consumer:Fireball');
  });

  it('leaves the request alone for a surface that does NOT hold the spell', () => {
    // A character can hold the same spell under two sources; the strip without it must not steal
    // the jump from the one with it.
    const log = vi.fn();
    render(
      <SpellFocusProvider>
        <Trigger name="Fireball" />
        <Consumer has={(n) => n === 'Shield'} log={log} label="other" />
        <Consumer has={(n) => n === 'Fireball'} log={log} label="mine" />
      </SpellFocusProvider>
    );
    fireEvent.click(screen.getByTestId('focus-Fireball'));
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('mine:Fireball');
  });

  it('re-fires when the SAME spell is requested again', () => {
    // The reason focus carries a token: you may have moved off that level tab since the first
    // click, and a bare name would compare equal and do nothing the second time.
    const log = vi.fn();
    render(
      <SpellFocusProvider>
        <Trigger name="Fireball" />
        <Consumer has={() => true} log={log} />
      </SpellFocusProvider>
    );
    fireEvent.click(screen.getByTestId('focus-Fireball'));
    fireEvent.click(screen.getByTestId('focus-Fireball'));
    expect(log).toHaveBeenCalledTimes(2);
  });

  it('delivers a request that arrived BEFORE the surface knew it held the spell', () => {
    // SpellSourceLevelView learns a spell's level from a catalog it fetches; a click that lands
    // first must not be dropped against the empty list.
    const log = vi.fn();
    function Late() {
      const [loaded, setLoaded] = React.useState(false);
      useFocusedSpell((n) => loaded && n === 'Fireball', (n) => log(n));
      return <button type="button" data-testid="load" onClick={() => setLoaded(true)}>load</button>;
    }
    render(
      <SpellFocusProvider>
        <Trigger name="Fireball" />
        <Late />
      </SpellFocusProvider>
    );
    fireEvent.click(screen.getByTestId('focus-Fireball'));
    expect(log).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('load'));
    expect(log).toHaveBeenCalledWith('Fireball');
  });

  it('ignores an empty request', () => {
    const log = vi.fn();
    render(
      <SpellFocusProvider>
        <Trigger name="" />
        <Consumer has={() => true} log={log} />
      </SpellFocusProvider>
    );
    fireEvent.click(screen.getByTestId('focus-'));
    expect(log).not.toHaveBeenCalled();
  });

  it('renders consumers normally with NO provider at all', () => {
    // Every consumer is also rendered outside CharacterDetail (encyclopedia pages, creation).
    const log = vi.fn();
    render(<Consumer has={() => true} log={log} />);
    expect(screen.getByTestId('consumer')).toBeInTheDocument();
    expect(log).not.toHaveBeenCalled();
  });

  it('lets a parent own the state and hand it to the provider', () => {
    // CharacterDetail must set the outer tab in the same click, so it holds the controller.
    const log = vi.fn();
    function Owner() {
      const controller = useSpellFocusController();
      return (
        <SpellFocusProvider value={controller}>
          <button type="button" data-testid="owner-go" onClick={() => controller.focusSpell('Shield')}>go</button>
          <Consumer has={() => true} log={log} />
        </SpellFocusProvider>
      );
    }
    render(<Owner />);
    fireEvent.click(screen.getByTestId('owner-go'));
    expect(log).toHaveBeenCalledWith('consumer:Shield');
  });
});
