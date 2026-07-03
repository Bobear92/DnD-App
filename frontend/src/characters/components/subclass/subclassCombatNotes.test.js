import { describe, it, expect } from 'vitest';
import {
  hasSurvivor,
  survivorNote,
  hasHeroicWarrior,
  heroicWarriorNote,
  hasRemarkableAthleteMove,
  remarkableAthleteMoveNote,
} from './subclassCombatNotes';

describe('hasSurvivor', () => {
  it('is true for a Champion Fighter at L18+', () => {
    expect(hasSurvivor({ charClass: 'Fighter', subclass: 'Champion', level: 18 })).toBe(true);
    expect(hasSurvivor({ charClass: 'Fighter', subclass: 'Champion', level: 20 })).toBe(true);
  });

  it('is false below L18', () => {
    expect(hasSurvivor({ charClass: 'Fighter', subclass: 'Champion', level: 17 })).toBe(false);
  });

  it('is false for other subclasses / classes', () => {
    expect(hasSurvivor({ charClass: 'Fighter', subclass: 'Battle Master', level: 18 })).toBe(false);
    expect(hasSurvivor({ charClass: 'Barbarian', subclass: 'Champion', level: 18 })).toBe(false);
  });

  it('is safe with no args', () => {
    expect(hasSurvivor()).toBe(false);
  });
});

describe('survivorNote', () => {
  it('returns null when Survivor does not apply', () => {
    expect(survivorNote({ charClass: 'Fighter', subclass: 'Champion', level: 17 })).toBeNull();
    expect(survivorNote({ charClass: 'Fighter', subclass: 'Battle Master', level: 18 })).toBeNull();
    expect(survivorNote()).toBeNull();
  });

  it('folds the CON modifier into the regain amount (5 + CON)', () => {
    const note = survivorNote({ charClass: 'Fighter', subclass: 'Champion', level: 18, conMod: 3 });
    expect(note).toContain('regain 8 HP');
    expect(note).toContain('5 + CON modifier');
  });

  it('defaults the CON modifier to 0 → regains 5', () => {
    expect(survivorNote({ charClass: 'Fighter', subclass: 'Champion', level: 18 })).toContain('regain 5 HP');
  });

  it('floors the regain amount at 0 for a very negative CON', () => {
    expect(survivorNote({ charClass: 'Fighter', subclass: 'Champion', level: 18, conMod: -6 })).toContain('regain 0 HP');
  });

  it('adds the +3 death-save bonus only in 2024', () => {
    const note2024 = survivorNote({ charClass: 'Fighter', subclass: 'Champion', level: 18, edition: '5.5e', conMod: 2 });
    expect(note2024).toContain('regain 7 HP');
    expect(note2024).toContain('+3 bonus to death saving throws');

    const note5e = survivorNote({ charClass: 'Fighter', subclass: 'Champion', level: 18, edition: '5e', conMod: 2 });
    expect(note5e).not.toContain('death saving throws');
  });
});

describe('hasHeroicWarrior', () => {
  it('is true for a 2024 Champion Fighter at L10+', () => {
    expect(hasHeroicWarrior({ charClass: 'Fighter', subclass: 'Champion', level: 10, edition: '5.5e' })).toBe(true);
    expect(hasHeroicWarrior({ charClass: 'Fighter', subclass: 'Champion', level: 20, edition: '5.5e' })).toBe(true);
  });

  it('is false below L10', () => {
    expect(hasHeroicWarrior({ charClass: 'Fighter', subclass: 'Champion', level: 9, edition: '5.5e' })).toBe(false);
  });

  it('is false in 5e (feature is 2024-only)', () => {
    expect(hasHeroicWarrior({ charClass: 'Fighter', subclass: 'Champion', level: 20, edition: '5e' })).toBe(false);
  });

  it('is false for other subclasses / classes / no args', () => {
    expect(hasHeroicWarrior({ charClass: 'Fighter', subclass: 'Battle Master', level: 10, edition: '5.5e' })).toBe(false);
    expect(hasHeroicWarrior()).toBe(false);
  });
});

describe('heroicWarriorNote', () => {
  it('returns the note for a 2024 Champion at L10+', () => {
    const note = heroicWarriorNote({ charClass: 'Fighter', subclass: 'Champion', level: 10, edition: '5.5e' });
    expect(note).toContain('Heroic Warrior');
    expect(note).toContain('Heroic Inspiration');
  });

  it('returns null when it does not apply (5e, below L10, other subclass, no args)', () => {
    expect(heroicWarriorNote({ charClass: 'Fighter', subclass: 'Champion', level: 10, edition: '5e' })).toBeNull();
    expect(heroicWarriorNote({ charClass: 'Fighter', subclass: 'Champion', level: 9, edition: '5.5e' })).toBeNull();
    expect(heroicWarriorNote({ charClass: 'Fighter', subclass: 'Battle Master', level: 10, edition: '5.5e' })).toBeNull();
    expect(heroicWarriorNote()).toBeNull();
  });
});

describe('hasRemarkableAthleteMove', () => {
  it('is true for a 2024 Champion Fighter at L3+', () => {
    expect(hasRemarkableAthleteMove({ charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e' })).toBe(true);
    expect(hasRemarkableAthleteMove({ charClass: 'Fighter', subclass: 'Champion', level: 20, edition: '5.5e' })).toBe(true);
  });

  it('is false below L3', () => {
    expect(hasRemarkableAthleteMove({ charClass: 'Fighter', subclass: 'Champion', level: 2, edition: '5.5e' })).toBe(false);
  });

  it('is false in 5e (the post-crit move is a 2024-only rider)', () => {
    expect(hasRemarkableAthleteMove({ charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5e' })).toBe(false);
  });

  it('is false for other subclasses / classes / no args', () => {
    expect(hasRemarkableAthleteMove({ charClass: 'Fighter', subclass: 'Battle Master', level: 3, edition: '5.5e' })).toBe(false);
    expect(hasRemarkableAthleteMove({ charClass: 'Rogue', subclass: 'Champion', level: 3, edition: '5.5e' })).toBe(false);
    expect(hasRemarkableAthleteMove()).toBe(false);
  });
});

describe('remarkableAthleteMoveNote', () => {
  it('returns the note for a 2024 Champion at L3+', () => {
    const note = remarkableAthleteMoveNote({ charClass: 'Fighter', subclass: 'Champion', level: 3, edition: '5.5e' });
    expect(note).toContain('Remarkable Athlete');
    expect(note).toContain('critical hit');
    expect(note).toContain('half your Speed');
    expect(note).toContain('opportunity attacks');
  });

  it('returns null when it does not apply (5e, below L3, other subclass, no args)', () => {
    expect(remarkableAthleteMoveNote({ charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5e' })).toBeNull();
    expect(remarkableAthleteMoveNote({ charClass: 'Fighter', subclass: 'Champion', level: 2, edition: '5.5e' })).toBeNull();
    expect(remarkableAthleteMoveNote({ charClass: 'Fighter', subclass: 'Battle Master', level: 3, edition: '5.5e' })).toBeNull();
    expect(remarkableAthleteMoveNote()).toBeNull();
  });
});
