import { describe, it, expect, vi } from 'vitest';
import { useSlotCaster } from '@/characters/components/sheets/classSheet/hooks/useSlotCaster';

const SLOTS = [4, 3, 2, 0, 0, 0, 0, 0, 0]; // level 5 full caster

describe('useSlotCaster', () => {
  it('computes availableSlots = total − used for levels with slots', () => {
    const { availableSlots } = useSlotCaster({
      slots: SLOTS,
      data: { spell_slots: { 1: { total: 4, used: 1 }, 2: { total: 3, used: 3 } } },
      onChange: vi.fn(),
    });
    expect(availableSlots).toEqual({ 1: 3, 2: 0, 3: 2 }); // level 4+ have 0 total → excluded
  });

  it('setSlotUsed clamps to [0, total] and merges into spell_slots', () => {
    const onChange = vi.fn();
    const { setSlotUsed } = useSlotCaster({ slots: SLOTS, data: { spell_slots: { 1: { total: 4, used: 0 } } }, onChange });
    setSlotUsed(1, 99);
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 1: { total: 4, used: 4 } } });
    onChange.mockClear();
    setSlotUsed(2, -5);
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 1: { total: 4, used: 0 }, 2: { total: 3, used: 0 } } });
  });

  it('handleCastSpell increments the used count for the slot level', () => {
    const onChange = vi.fn();
    const { handleCastSpell } = useSlotCaster({ slots: SLOTS, data: { spell_slots: { 3: { total: 2, used: 0 } } }, onChange });
    handleCastSpell('Fireball', 3);
    expect(onChange).toHaveBeenCalledWith({ spell_slots: { 3: { total: 2, used: 1 } } });
  });
});
