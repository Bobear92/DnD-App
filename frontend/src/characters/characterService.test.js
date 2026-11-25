import { describe, it, expect, vi, beforeEach } from 'vitest';

// axios.create() is called at import, so the mock must exist before characterService loads.
const put = vi.fn();
vi.mock('axios', () => ({
  default: { create: () => ({ put, interceptors: { request: { use: () => {} }, response: { use: () => {} } } }) },
}));

const { default: characterService, toUpdatePayload } = await import('./characterService');

beforeEach(() => {
  put.mockReset();
  put.mockResolvedValue({ data: { id: 1 } });
});

// The backend MERGES character_data (deploy ticket T5a): a missing key is kept, so a deliberate
// "clear this key" must be explicit. The sheet clears keys by setting them to undefined.
describe('toUpdatePayload', () => {
  it('turns top-level undefined character_data keys into character_data_remove', () => {
    const out = toUpdatePayload({ character_data: { current_hp: 5, hex_weapon_uid: undefined } });
    expect(out.character_data).toEqual({ current_hp: 5 });
    expect(out.character_data_remove).toEqual(['hex_weapon_uid']);
  });

  it('keeps null as a stored value (null is not a delete)', () => {
    const out = toUpdatePayload({ character_data: { subclass: null } });
    expect(out).toEqual({ character_data: { subclass: null } });
  });

  it('leaves nested undefined alone — nested values are replaced whole by the backend', () => {
    const inv = [{ uid: 'a', hand: undefined }];
    const out = toUpdatePayload({ character_data: { inventory: inv } });
    expect(out.character_data.inventory).toBe(inv);
    expect(out.character_data_remove).toBeUndefined();
  });

  it('passes updates without character_data through untouched', () => {
    const update = { level: 3 };
    expect(toUpdatePayload(update)).toBe(update);
  });

  it('merges with an explicit remove list and does not mutate the input', () => {
    const update = { character_data: { a: undefined, b: 1 }, character_data_remove: ['c', 'a'] };
    const out = toUpdatePayload(update);
    expect(out.character_data_remove.sort()).toEqual(['a', 'c']);
    expect(update.character_data).toHaveProperty('a');
  });
});

describe('characterService.updateCharacter', () => {
  it('sends the translated payload', async () => {
    await characterService.updateCharacter(7, { character_data: { x: undefined, y: 2 } });
    expect(put).toHaveBeenCalledWith('/7', { character_data: { y: 2 }, character_data_remove: ['x'] });
  });

  it('sends a plain update as-is', async () => {
    await characterService.updateCharacter(7, { level: 2 });
    expect(put).toHaveBeenCalledWith('/7', { level: 2 });
  });
});
