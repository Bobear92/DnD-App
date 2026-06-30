import { describe, it, expect } from 'vitest';
import { isToolEntry, isGenericToolName, TOOL_NAMES } from '@/characters/components/inventory/toolsData';

describe('toolsData', () => {
  it('isToolEntry matches by item_category Tools', () => {
    expect(isToolEntry({ name: "Thieves' Tools", item_category: 'Tools' })).toBe(true);
    expect(isToolEntry({ name: 'Backpack', item_category: 'Gear' })).toBe(false);
  });

  it('isToolEntry matches known tool names case-insensitively (incl. chosen artisan tools)', () => {
    expect(isToolEntry({ name: "Mason's tools" })).toBe(true);   // lowercase, plain entry
    expect(isToolEntry({ name: "Smith's Tools" })).toBe(true);
    expect(isToolEntry({ name: 'Lute' })).toBe(true);
    expect(isToolEntry({ name: 'Dice Set' })).toBe(true);
    expect(isToolEntry({ name: 'Torch' })).toBe(false);
    expect(isToolEntry({ name: 'Rations' })).toBe(false);
  });

  it('isToolEntry is safe on empty input', () => {
    expect(isToolEntry(null)).toBe(false);
    expect(isToolEntry({})).toBe(false);
  });

  it('isGenericToolName flags the choose-one placeholders', () => {
    expect(isGenericToolName("Artisan's Tools")).toBe(true);
    expect(isGenericToolName('Musical Instrument')).toBe(true);
    expect(isGenericToolName('Gaming Set')).toBe(true);
    expect(isGenericToolName("Smith's Tools")).toBe(false);
  });

  it('TOOL_NAMES covers all 17 artisan tools', () => {
    expect(TOOL_NAMES).toContain("Smith's Tools");
    expect(TOOL_NAMES).toContain("Mason's Tools");
    expect(TOOL_NAMES.filter((t) => t.includes("'s Tools") || t.includes("'s Supplies") || t.includes("'s Utensils")).length).toBeGreaterThanOrEqual(17);
  });
});
