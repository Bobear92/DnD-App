/**
 * useLockedChoice — permanent character choices (subclass, fighting style, etc.)
 *
 * Permanent choices are set during character **creation** or **level up**, then become
 * read-only. The single override is the GM Edit toggle: when a GM turns it on, locked
 * controls become editable again. Players never receive `gmEdit=true`.
 *
 * A choice is editable when:
 *   - `creation` is true (always editable during character creation / level-up wizard), OR
 *   - `gmEdit` is true (GM opted in to edit everything), OR
 *   - no value has been chosen yet (you can always make the *first* choice).
 * Otherwise it is locked (read-only).
 *
 * Note: `readOnly` (player-view / non-owner) forces locked regardless — you cannot edit a
 * sheet you do not control.
 *
 * @param {object}  opts
 * @param {*}       opts.value     current stored value (e.g. data.subclass)
 * @param {boolean} opts.creation  rendering inside CharacterCreate / level-up
 * @param {boolean} opts.gmEdit    GM Edit toggle is on
 * @param {boolean} opts.readOnly  sheet is read-only (player view / non-owner)
 * @returns {{ locked: boolean }}
 */
export function useLockedChoice({ value, creation = false, gmEdit = false, readOnly = false }) {
  const hasValue = value !== undefined && value !== null && value !== '';
  const locked = readOnly || (!creation && !gmEdit && hasValue);
  return { locked };
}

export default useLockedChoice;
