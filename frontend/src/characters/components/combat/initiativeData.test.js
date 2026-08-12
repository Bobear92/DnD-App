import { describe, it, expect } from 'vitest';
import {
  initiativeBreakdown,
  initiativeFeatNote,
  initiativeForCharacter,
  rollInitiative,
  REMARKABLE_ATHLETE_NOTE,
} from '@/characters/components/combat/initiativeData';

// A feat instance carries its effects snapshotted at acquisition (see featEffects.js).
const alert5e = { name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] };
const alert2024 = { name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 'pb' }] };
// Guards the filter: a stat_mod for something else must never reach initiative.
const mobile = { name: 'Mobile', effects: [{ kind: 'stat_mod', stat: 'speed', amount: 10 }] };

describe('initiativeBreakdown', () => {
  it('is the DEX modifier when nothing else applies', () => {
    const { total, featSources, advantage } = initiativeBreakdown({ dexterity: 16 });
    expect(total).toBe(3);
    expect(featSources).toEqual([]);
    expect(advantage).toBe(false);
  });

  it('handles a negative DEX modifier', () => {
    expect(initiativeBreakdown({ dexterity: 7 }).total).toBe(-2);
  });

  it('adds a flat feat bonus (5e Alert +5)', () => {
    const { total, featSources } = initiativeBreakdown({ dexterity: 14, feats: [alert5e] });
    expect(total).toBe(7); // +2 DEX, +5 Alert
    expect(featSources).toEqual([expect.objectContaining({ source: 'Alert', amount: 5 })]);
  });

  // 2024 Alert grants proficiency in initiative, authored as the shared 'pb' sentinel.
  it('resolves a PB-scaled feat bonus (2024 Alert)', () => {
    const { total } = initiativeBreakdown({ dexterity: 14, feats: [alert2024], pb: 4 });
    expect(total).toBe(6); // +2 DEX, +4 PB
  });

  it('ignores stat_mods for other stats', () => {
    const { total, featSources } = initiativeBreakdown({ dexterity: 14, feats: [mobile] });
    expect(total).toBe(2);
    expect(featSources).toEqual([]);
  });

  it('sums multiple feat sources', () => {
    const { total, featSources } = initiativeBreakdown({
      dexterity: 10, feats: [alert5e, alert2024], pb: 3,
    });
    expect(total).toBe(8); // +0 DEX, +5, +3
    expect(featSources).toHaveLength(2);
  });

  // Remarkable Athlete gives advantage, not a bonus — it must not move the number.
  it('flags Champion advantage without changing the total (2024 L3+)', () => {
    const { total, advantage, breakdown } = initiativeBreakdown({
      dexterity: 14, charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e',
    });
    expect(total).toBe(2);
    expect(advantage).toBe(true);
    expect(breakdown.notes).toContain(REMARKABLE_ATHLETE_NOTE);
  });

  it('does not flag advantage below the Champion unlock level', () => {
    expect(initiativeBreakdown({
      dexterity: 14, charClass: 'Fighter', subclass: 'Champion', level: 2, edition: '5.5e',
    }).advantage).toBe(false);
  });

  // The 5e Champion's Remarkable Athlete is a half-PB bonus to certain CHECKS — not initiative.
  it('does not flag advantage for the 5e Champion', () => {
    expect(initiativeBreakdown({
      dexterity: 14, charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5e',
    }).advantage).toBe(false);
  });

  it('does not flag advantage for a non-Champion', () => {
    expect(initiativeBreakdown({
      dexterity: 14, charClass: 'Fighter', subclass: 'Battle Master', level: 10, edition: '5.5e',
    }).advantage).toBe(false);
  });

  it('exposes a breakdown whose parts explain the total', () => {
    const { breakdown } = initiativeBreakdown({ dexterity: 18, feats: [alert5e] });
    expect(breakdown.total).toBe(9);
    expect(breakdown.parts.map((p) => p.value)).toEqual([4, 5]);
    expect(breakdown.parts[1].label).toBe('Alert');
  });

  // A half-loaded sheet calls this before the draft exists; it must return a usable 0, not NaN
  // (buildBreakdown coerces each part with `|| 0`), and must not throw.
  it('degrades to 0 when called with nothing', () => {
    const { total, featSources, advantage } = initiativeBreakdown();
    expect(total).toBe(0);
    expect(featSources).toEqual([]);
    expect(advantage).toBe(false);
  });
});

describe('initiativeFeatNote', () => {
  it('renders one source', () => {
    expect(initiativeFeatNote([{ source: 'Alert', amount: 5 }])).toBe('+5 Alert');
  });

  it('joins multiple sources', () => {
    expect(initiativeFeatNote([
      { source: 'Alert', amount: 5 },
      { source: 'Something', amount: 2 },
    ])).toBe('+5 Alert, +2 Something');
  });

  it('is empty when no feat applies', () => {
    expect(initiativeFeatNote()).toBe('');
  });
});

describe('rollInitiative', () => {
  it('is d20 + modifier', () => {
    // floor(0.5 * 20) + 1 = 11
    expect(rollInitiative(4, () => 0.5)).toEqual({ die: 11, total: 15 });
  });

  it('rolls 1 at the bottom of the range and 20 at the top', () => {
    expect(rollInitiative(0, () => 0).die).toBe(1);
    expect(rollInitiative(0, () => 0.999999).die).toBe(20);
  });

  it('applies a negative modifier', () => {
    expect(rollInitiative(-2, () => 0.5)).toEqual({ die: 11, total: 9 });
  });

  it('treats a missing modifier as 0', () => {
    expect(rollInitiative(undefined, () => 0.5).total).toBe(11);
  });
});

describe('initiativeForCharacter', () => {
  const archer = {
    name: 'Yaara', char_class: 'Fighter', level: 15, dexterity: 18,
    character_data: { subclass: 'Arcane Archer' },
  };

  it('reads the modifier off a character list row', () => {
    expect(initiativeForCharacter(archer).total).toBe(4);
  });

  it('picks up feats stored in character_data', () => {
    const alert = {
      ...archer,
      character_data: {
        feats: [{ name: 'Alert', effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5 }] }],
      },
    };
    expect(initiativeForCharacter(alert).total).toBe(9);
  });

  it('reads the subclass from character_data for the advantage flag', () => {
    const champion = { ...archer, level: 3, character_data: { subclass: 'Champion' } };
    expect(initiativeForCharacter(champion, { edition: '5.5e' }).advantage).toBe(true);
    expect(initiativeForCharacter(champion, { edition: '5e' }).advantage).toBe(false);
  });

  it('degrades to 0 for a missing character', () => {
    expect(initiativeForCharacter(undefined).total).toBe(0);
  });
});
