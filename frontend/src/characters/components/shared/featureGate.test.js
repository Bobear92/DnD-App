import { describe, it, expect, vi } from 'vitest';
import { matchesGate, normEdition, isEdition2024 } from './featureGate';
import { ATTACK_RIDERS, ENTRY_RIDERS } from '@/characters/components/combat/actionEconomyData';
import { EQUIPMENT_FEATURES } from '@/characters/components/inventory/equipmentFeatures';

const cavalier = { charClass: 'Fighter', subclass: 'Cavalier', level: 7, edition: '5e' };

describe('normEdition / isEdition2024', () => {
  it.each([['5.5e', '5.5e'], ['2024', '5.5e'], ['5e', '5e'], [undefined, '5e'], [null, '5e'], ['', '5e'], ['2014', '5e']])(
    '%s → %s', (input, expected) => {
      expect(normEdition(input)).toBe(expected);
    },
  );

  it('isEdition2024 accepts both spellings of the 2024 rules and nothing else', () => {
    expect(isEdition2024('5.5e')).toBe(true);
    expect(isEdition2024('2024')).toBe(true);
    expect(isEdition2024('5e')).toBe(false);
    expect(isEdition2024(undefined)).toBe(false);
  });
});

describe('matchesGate — class and subclass', () => {
  it('an entry with no gates matches everyone', () => {
    expect(matchesGate({}, cavalier)).toBe(true);
    expect(matchesGate({}, {})).toBe(true);
    expect(matchesGate({})).toBe(true);
  });

  it('charClass must match when declared', () => {
    expect(matchesGate({ charClass: 'Fighter' }, cavalier)).toBe(true);
    expect(matchesGate({ charClass: 'Wizard' }, cavalier)).toBe(false);
  });

  it('subclass must match when declared', () => {
    expect(matchesGate({ subclass: 'Cavalier' }, cavalier)).toBe(true);
    expect(matchesGate({ subclass: 'Samurai' }, cavalier)).toBe(false);
  });

  it('a subclass-gated entry never matches a character with no subclass yet', () => {
    expect(matchesGate({ charClass: 'Fighter', subclass: 'Cavalier' }, { charClass: 'Fighter', level: 2 })).toBe(false);
  });

  it('a subclass name on the wrong class does not match a class-gated entry', () => {
    expect(matchesGate({ charClass: 'Fighter', subclass: 'Cavalier' }, { charClass: 'Wizard', subclass: 'Cavalier', level: 10 })).toBe(false);
  });

  it('a class-only entry matches any subclass of that class', () => {
    expect(matchesGate({ charClass: 'Fighter' }, { ...cavalier, subclass: 'Samurai' })).toBe(true);
    expect(matchesGate({ charClass: 'Fighter' }, { charClass: 'Fighter', level: 1 })).toBe(true);
  });
});

describe('matchesGate — level', () => {
  it('matches at exactly minLevel and above, not below', () => {
    expect(matchesGate({ minLevel: 7 }, { level: 6 })).toBe(false);
    expect(matchesGate({ minLevel: 7 }, { level: 7 })).toBe(true);
    expect(matchesGate({ minLevel: 7 }, { level: 20 })).toBe(true);
  });

  it('no minLevel means level 1', () => {
    expect(matchesGate({}, { level: 1 })).toBe(true);
  });

  it('a missing or unusable level counts as level 1', () => {
    for (const level of [undefined, null, '', NaN]) {
      expect(matchesGate({ minLevel: 1 }, { level })).toBe(true);
      expect(matchesGate({ minLevel: 2 }, { level })).toBe(false);
    }
  });

  it('reads a numeric string level', () => {
    expect(matchesGate({ minLevel: 7 }, { level: '7' })).toBe(true);
    expect(matchesGate({ minLevel: 7 }, { level: '6' })).toBe(false);
  });
});

describe('matchesGate — edition', () => {
  it('no edition key means both editions', () => {
    expect(matchesGate({}, { edition: '5e' })).toBe(true);
    expect(matchesGate({}, { edition: '5.5e' })).toBe(true);
  });

  it('edition must match when declared', () => {
    expect(matchesGate({ edition: '5e' }, { edition: '5e' })).toBe(true);
    expect(matchesGate({ edition: '5e' }, { edition: '5.5e' })).toBe(false);
    expect(matchesGate({ edition: '5.5e' }, { edition: '5e' })).toBe(false);
  });

  it('treats "2024" and "5.5e" as the same edition on either side', () => {
    // The drift this replaced: tables that compared raw strings missed a row whenever the
    // campaign and the row spelled the 2024 rules differently.
    expect(matchesGate({ edition: '5.5e' }, { edition: '2024' })).toBe(true);
    expect(matchesGate({ edition: '2024' }, { edition: '5.5e' })).toBe(true);
    expect(matchesGate({ edition: '5e' }, { edition: '2024' })).toBe(false);
  });

  it('a missing campaign edition counts as 5e', () => {
    expect(matchesGate({ edition: '5e' }, {})).toBe(true);
    expect(matchesGate({ edition: '5.5e' }, {})).toBe(false);
  });

  it('the `editions` list form works and normalises too', () => {
    expect(matchesGate({ editions: ['5e'] }, { edition: '5e' })).toBe(true);
    expect(matchesGate({ editions: ['5e'] }, { edition: '2024' })).toBe(false);
    expect(matchesGate({ editions: ['5e', '5.5e'] }, { edition: '2024' })).toBe(true);
    expect(matchesGate({ editions: ['2024'] }, { edition: '5.5e' })).toBe(true);
    expect(matchesGate({ editions: [] }, { edition: '5e' })).toBe(false);
  });
});

describe('matchesGate — applies', () => {
  it('is consulted only after the declarative keys pass', () => {
    const applies = vi.fn(() => true);
    expect(matchesGate({ charClass: 'Wizard', applies }, cavalier)).toBe(false);
    expect(applies).not.toHaveBeenCalled();
    expect(matchesGate({ charClass: 'Fighter', applies }, cavalier)).toBe(true);
    expect(applies).toHaveBeenCalledTimes(1);
  });

  it('can veto an otherwise matching entry', () => {
    expect(matchesGate({ charClass: 'Fighter', applies: () => false }, cavalier)).toBe(false);
  });

  it('receives the caller ctx untouched, including extra fields', () => {
    const ctx = { ...cavalier, characterData: { runes: ['Hill Rune'] }, feats: ['Tough'] };
    const applies = vi.fn(() => true);
    matchesGate({ applies }, ctx);
    expect(applies).toHaveBeenCalledWith(ctx);
  });

  it('a falsy return of any kind is a veto', () => {
    for (const result of [false, 0, '', null, undefined]) {
      expect(matchesGate({ applies: () => result }, cavalier)).toBe(false);
    }
  });
});

describe('matchesGate — all gates together', () => {
  const entry = { charClass: 'Fighter', subclass: 'Samurai', minLevel: 15, edition: '5e' };
  const samurai = { charClass: 'Fighter', subclass: 'Samurai', level: 15, edition: '5e' };

  it('matches only when every gate passes', () => {
    expect(matchesGate(entry, samurai)).toBe(true);
    expect(matchesGate(entry, { ...samurai, charClass: 'Rogue' })).toBe(false);
    expect(matchesGate(entry, { ...samurai, subclass: 'Champion' })).toBe(false);
    expect(matchesGate(entry, { ...samurai, level: 14 })).toBe(false);
    expect(matchesGate(entry, { ...samurai, edition: '2024' })).toBe(false);
  });

  it('a missing entry never matches', () => {
    expect(matchesGate(null, samurai)).toBe(false);
    expect(matchesGate(undefined, samurai)).toBe(false);
  });
});

describe('the rider and equipment tables declare their gates as data', () => {
  const rows = [
    ...ATTACK_RIDERS.map((r) => ['ATTACK_RIDERS', r]),
    ...ENTRY_RIDERS.map((r) => ['ENTRY_RIDERS', r]),
    ...EQUIPMENT_FEATURES.map((r) => ['EQUIPMENT_FEATURES', r]),
  ];

  it('every row is gated by declarative keys and/or an applies predicate', () => {
    // A row with neither would attach itself to every character.
    for (const [table, row] of rows) {
      const declarative = ['charClass', 'subclass', 'minLevel', 'edition', 'editions'].some((k) => row[k] != null);
      expect(declarative || typeof row.applies === 'function', `${table} › ${row.source} declares no gate`).toBe(true);
    }
  });

  it('a row that names a subclass also names its class', () => {
    // Subclass names are not unique across classes forever; the class makes the gate exact.
    for (const [table, row] of rows) {
      if (row.subclass) expect(row.charClass, `${table} › ${row.source}`).toBeTruthy();
    }
  });

  const rider = (source) => ATTACK_RIDERS.find((r) => r.source === source);

  it('Unwavering Mark: a Cavalier from 3rd, nobody else', () => {
    const mark = rider('Unwavering Mark');
    expect(matchesGate(mark, { charClass: 'Fighter', subclass: 'Cavalier', level: 3 })).toBe(true);
    expect(matchesGate(mark, { charClass: 'Fighter', subclass: 'Cavalier', level: 2 })).toBe(false);
    expect(matchesGate(mark, { charClass: 'Fighter', subclass: 'Samurai', level: 10 })).toBe(false);
  });

  it('Rapid Strike: a 5e Samurai from 15th — not in a 2024 campaign, however it is spelled', () => {
    const rapid = rider('Rapid Strike');
    const samurai = { charClass: 'Fighter', subclass: 'Samurai', level: 15, characterData: {} };
    expect(matchesGate(rapid, { ...samurai, edition: '5e' })).toBe(true);
    expect(matchesGate(rapid, { ...samurai, level: 14, edition: '5e' })).toBe(false);
    expect(matchesGate(rapid, { ...samurai, edition: '5.5e' })).toBe(false);
    expect(matchesGate(rapid, { ...samurai, edition: '2024' })).toBe(false);
  });

  it("Giant's Might: a Rune Knight from 3rd, and only while the effect is switched on", () => {
    const might = rider("Giant's Might");
    const knight = { charClass: 'Fighter', subclass: 'Rune Knight', level: 3 };
    expect(matchesGate(might, { ...knight, characterData: { active_effects: ['giants_might'] } })).toBe(true);
    expect(matchesGate(might, { ...knight, characterData: { active_effects: [] } })).toBe(false);
    expect(matchesGate(might, { ...knight, subclass: 'Champion', characterData: { active_effects: ['giants_might'] } })).toBe(false);
  });

  it('Arcane Charge and Hold the Line keep their subclass and level', () => {
    const entry = (source) => ENTRY_RIDERS.find((r) => r.source === source);
    expect(matchesGate(entry('Arcane Charge'), { charClass: 'Fighter', subclass: 'Eldritch Knight', level: 15 })).toBe(true);
    expect(matchesGate(entry('Arcane Charge'), { charClass: 'Fighter', subclass: 'Eldritch Knight', level: 14 })).toBe(false);
    expect(matchesGate(entry('Hold the Line'), { charClass: 'Fighter', subclass: 'Cavalier', level: 10 })).toBe(true);
    expect(matchesGate(entry('Hold the Line'), { charClass: 'Fighter', subclass: 'Cavalier', level: 9 })).toBe(false);
    expect(matchesGate(entry('Hold the Line'), { charClass: 'Fighter', subclass: 'Eldritch Knight', level: 15 })).toBe(false);
  });

  it('a feat-gated rider ignores class entirely', () => {
    const sentinel = ENTRY_RIDERS.find((r) => r.source === 'Sentinel');
    expect(matchesGate(sentinel, { charClass: 'Wizard', level: 1, feats: [{ name: 'Sentinel' }] })).toBe(true);
    expect(matchesGate(sentinel, { charClass: 'Fighter', level: 20, feats: [] })).toBe(false);
  });
});
