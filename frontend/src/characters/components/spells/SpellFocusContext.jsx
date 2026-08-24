import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';

/**
 * "Jump to this spell" — the deep-link the Action Economy tab needs when a spell card is clicked.
 *
 * Reaching a spell in the Spells tab means setting state owned by three different components (the
 * outer tab, a source toggle, and a level strip), across a tree that runs CharacterDetail →
 * ClassSheet → CasterSpellBlock → SpellSourceLevelView. Threading a `focusSpell` prop through
 * ClassSheet and CasterSpellBlock would put a pure UI-focus concern on two big generic components
 * that have nothing to do with it, so the level strips read it from context instead and the
 * components in between stay untouched.
 *
 * `token` is a monotonic counter, not just the name: clicking the SAME spell twice must re-fire
 * (you may have moved off that level tab in between), and a plain name would compare equal and do
 * nothing the second time. Consumers therefore key their effect on the token.
 */
const SpellFocusContext = createContext(null);

/**
 * The focus state plus the setter, for whichever component OWNS the jump. CharacterDetail holds it
 * (its handler must set the outer tab in the same click) and hands it to the provider, so the
 * token counter lives here rather than being re-implemented at the call site.
 */
export function useSpellFocusController() {
  const [focus, setFocus] = useState(null);
  const tokenRef = useRef(0);
  return useMemo(() => ({
    focus,
    focusSpell: (name) => {
      if (!name) return;
      tokenRef.current += 1;
      setFocus({ name, token: tokenRef.current });
    },
    clearSpellFocus: () => setFocus(null),
  }), [focus]);
}

/** Pass `value` from `useSpellFocusController()` when the parent drives the jump; omit it to let
 *  the provider own the state. */
export function SpellFocusProvider({ value, children }) {
  const own = useSpellFocusController();
  return <SpellFocusContext.Provider value={value ?? own}>{children}</SpellFocusContext.Provider>;
}

/**
 * The focus state, or an inert stand-in when there is no provider — every consumer is also
 * rendered outside CharacterDetail (the encyclopedia pages, the creation flow), and those should
 * render normally rather than crash on a missing provider.
 */
export function useSpellFocus() {
  return useContext(SpellFocusContext) ?? INERT;
}

const INERT = { focus: null, focusSpell: () => {}, clearSpellFocus: () => {} };

/**
 * Runs `onFocus(name)` whenever a NEW focus request names a spell this surface holds.
 *
 * `has` decides whether the request is ours — a level strip that doesn't contain the spell must
 * not steal it from the one that does (a character can hold the same spell under two sources).
 * It is evaluated during RENDER, not inside the effect, so the request survives arriving before
 * the data does: SpellSourceLevelView learns a spell's level from a catalog it fetches, so a click
 * that lands first would otherwise be tested against an empty list and silently dropped.
 * Keyed on the token as well, so re-clicking the same spell fires again — you may have moved off
 * that level tab in between, and a bare name would compare equal and do nothing.
 */
export function useFocusedSpell(has, onFocus) {
  const { focus } = useSpellFocus();
  const name = focus?.name ?? null;
  const mine = !!name && !!has(name);
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  useEffect(() => {
    if (mine) onFocusRef.current(name);
  }, [focus?.token, name, mine]);
  return focus;
}

export default SpellFocusContext;
