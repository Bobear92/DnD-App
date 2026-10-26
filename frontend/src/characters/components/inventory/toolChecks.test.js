import { describe, it, expect } from 'vitest';
import { toolCheckProficiency } from '@/characters/components/inventory/toolChecks';

const AXE = { uid: 'w1', name: 'Battleaxe', category: 'weapons', equipped: true };

const rk = ({ equipped = true, carved = true, runes = ['Fire Rune', 'Cloud Rune'] } = {}) => ({
  subclass: 'Rune Knight',
  runes,
  rune_items: carved ? { 'Fire Rune': 'w1' } : {},
  inventory: [{ ...AXE, equipped }],
});

describe('toolCheckProficiency', () => {
  it('is the plain proficiency bonus for anyone without a doubling source', () => {
    expect(toolCheckProficiency({ characterData: {}, level: 5 }))
      .toEqual({ pb: 3, total: 3, doubled: false, sources: [] });
  });

  it('DOUBLES it while the Fire Rune is carved on an equipped object (RAW: doubled, not added)', () => {
    const t = toolCheckProficiency({ characterData: rk(), level: 5 });
    expect(t.total).toBe(6);
    expect(t.doubled).toBe(true);
    expect(t.sources).toEqual([{ source: 'Fire Rune', note: 'Carved on Battleaxe' }]);
  });

  it('does nothing when the Fire Rune is known but not carved', () => {
    expect(toolCheckProficiency({ characterData: rk({ carved: false }), level: 5 }).total).toBe(3);
  });

  it('does nothing once the bearing item is unequipped', () => {
    expect(toolCheckProficiency({ characterData: rk({ equipped: false }), level: 5 }).doubled).toBe(false);
  });

  it('ignores other carved runes — only the Fire Rune touches tools', () => {
    const cd = { ...rk(), rune_items: { 'Cloud Rune': 'w1' } };
    expect(toolCheckProficiency({ characterData: cd, level: 5 }).doubled).toBe(false);
  });
});
