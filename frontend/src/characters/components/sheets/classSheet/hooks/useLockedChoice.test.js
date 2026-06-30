import { describe, it, expect } from 'vitest';
import { useLockedChoice } from '@/characters/components/sheets/classSheet/hooks/useLockedChoice';

// useLockedChoice is a pure function (no React state), so we call it directly.
describe('useLockedChoice', () => {
  it('locks a chosen value outside creation when gmEdit is off', () => {
    expect(useLockedChoice({ value: 'Champion', creation: false, gmEdit: false }).locked).toBe(true);
  });

  it('does not lock during creation even with a value', () => {
    expect(useLockedChoice({ value: 'Champion', creation: true, gmEdit: false }).locked).toBe(false);
  });

  it('does not lock when gmEdit is on (GM override)', () => {
    expect(useLockedChoice({ value: 'Champion', creation: false, gmEdit: true }).locked).toBe(false);
  });

  it('does not lock when no value has been chosen yet', () => {
    expect(useLockedChoice({ value: '', creation: false, gmEdit: false }).locked).toBe(false);
    expect(useLockedChoice({ value: null, creation: false, gmEdit: false }).locked).toBe(false);
    expect(useLockedChoice({ value: undefined, creation: false, gmEdit: false }).locked).toBe(false);
  });

  it('always locks when readOnly, regardless of gmEdit/creation', () => {
    expect(useLockedChoice({ value: 'Champion', readOnly: true, gmEdit: true, creation: true }).locked).toBe(true);
    expect(useLockedChoice({ value: '', readOnly: true }).locked).toBe(true);
  });
});
