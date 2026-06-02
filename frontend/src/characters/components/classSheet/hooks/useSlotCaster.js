/**
 * useSlotCaster — universal spell-slot model shared by every spellcasting class.
 *
 * Regardless of how a class learns/prepares spells, they all cast the same way: spend a
 * slot via a Cast button, and slots are restored only when the GM triggers the appropriate
 * rest (handled by the backend rest flow — this hook never resets slots itself).
 *
 * @param {object} opts
 * @param {number[]} opts.slots       per-spell-level totals for the current level, e.g. [4,3,2,0,...]
 * @param {object}   opts.data        character_data (reads `spell_slots`)
 * @param {function} opts.onChange    (patch) => void
 * @returns {{
 *   slots: number[],
 *   spellSlots: object,
 *   availableSlots: object,         // { [slotLevel]: remaining } for levels with total>0
 *   setSlotUsed: (slotLevel:number, used:number) => void,
 *   handleCastSpell: (name:string, slotLevel:number) => void,
 * }}
 */
export function useSlotCaster({ slots, data = {}, onChange }) {
  const spellSlots = data.spell_slots ?? {};

  const setSlotUsed = (slotLevel, used) => {
    const total = slots[slotLevel - 1];
    const clamped = Math.max(0, Math.min(total, used));
    onChange?.({ spell_slots: { ...spellSlots, [slotLevel]: { total, used: clamped } } });
  };

  const handleCastSpell = (_name, slotLevel) => {
    const used = spellSlots[slotLevel]?.used ?? 0;
    setSlotUsed(slotLevel, used + 1);
  };

  const availableSlots = {};
  slots.forEach((total, i) => {
    const sl = i + 1;
    if (total > 0) availableSlots[sl] = total - (spellSlots[sl]?.used ?? 0);
  });

  return { slots, spellSlots, availableSlots, setSlotUsed, handleCastSpell };
}

export default useSlotCaster;
