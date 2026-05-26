// Static class progression tables for all 12 classes × 2 editions.
// `columns` defines extra columns after Level / Proficiency Bonus / Features.
// `data` is 20 rows (index 0 = level 1). Values: 0 renders as '—', numbers and strings as-is.
// Columns with `group` share a spanning header row.

// ─── Shared spell slot arrays ────────────────────────────────────────────────

// Full-caster slots (spell levels 1–9), levels 1–20
const FC = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
];

// Half-caster slots (spell levels 1–5), levels 1–20 (5e: slots start at level 2)
const HC = [
  [0,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],
  [4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],
  [4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],
  [4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],
  [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2],
];

// 2024 Paladin slots start at level 1
const HC_PAL_2024 = [
  [2,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],
  [4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],
  [4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],
  [4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],
  [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2],
];

// ─── Shared column definitions ────────────────────────────────────────────────

const G = 'Spell Slots per Spell Level';
const COLS_9 = [
  {key:'s1',label:'1st',group:G},{key:'s2',label:'2nd',group:G},{key:'s3',label:'3rd',group:G},
  {key:'s4',label:'4th',group:G},{key:'s5',label:'5th',group:G},{key:'s6',label:'6th',group:G},
  {key:'s7',label:'7th',group:G},{key:'s8',label:'8th',group:G},{key:'s9',label:'9th',group:G},
];
const COLS_5 = COLS_9.slice(0, 5);

// ─── 5e progressions ─────────────────────────────────────────────────────────

const BARBARIAN_5E = {
  columns: [
    {key:'rages',    label:'Rages'},
    {key:'rage_dmg', label:'Rage Dmg'},
  ],
  data: [
    [2,'+2'],[2,'+2'],[3,'+2'],[3,'+2'],[3,'+2'],
    [4,'+2'],[4,'+2'],[4,'+2'],[4,'+3'],[4,'+3'],
    [4,'+3'],[5,'+3'],[5,'+3'],[5,'+3'],[5,'+3'],
    [5,'+4'],[6,'+4'],[6,'+4'],[6,'+4'],['∞','+4'],
  ],
};

const BARD_5E = {
  columns: [
    {key:'cantrips', label:'Cantrips Known'},
    {key:'known',    label:'Spells Known'},
    ...COLS_9,
  ],
  data: [
    [2,4,...FC[0]],[2,5,...FC[1]],[2,6,...FC[2]],[3,7,...FC[3]],
    [3,8,...FC[4]],[3,9,...FC[5]],[3,10,...FC[6]],[3,11,...FC[7]],
    [3,12,...FC[8]],[4,14,...FC[9]],[4,15,...FC[10]],[4,15,...FC[11]],
    [4,16,...FC[12]],[4,18,...FC[13]],[4,19,...FC[14]],[4,19,...FC[15]],
    [4,20,...FC[16]],[4,22,...FC[17]],[4,22,...FC[18]],[4,22,...FC[19]],
  ],
};

const CLERIC_5E = {
  columns: [{key:'cantrips',label:'Cantrips Known'}, ...COLS_9],
  data: [
    [3,...FC[0]],[3,...FC[1]],[3,...FC[2]],[4,...FC[3]],
    [5,...FC[4]],[5,...FC[5]],[5,...FC[6]],[5,...FC[7]],
    [5,...FC[8]],[5,...FC[9]],[5,...FC[10]],[5,...FC[11]],
    [5,...FC[12]],[5,...FC[13]],[5,...FC[14]],[5,...FC[15]],
    [5,...FC[16]],[5,...FC[17]],[5,...FC[18]],[5,...FC[19]],
  ],
};

const DRUID_5E = {
  columns: [{key:'cantrips',label:'Cantrips Known'}, ...COLS_9],
  data: [
    [2,...FC[0]],[2,...FC[1]],[2,...FC[2]],[3,...FC[3]],
    [3,...FC[4]],[3,...FC[5]],[3,...FC[6]],[3,...FC[7]],
    [3,...FC[8]],[4,...FC[9]],[4,...FC[10]],[4,...FC[11]],
    [4,...FC[12]],[4,...FC[13]],[4,...FC[14]],[4,...FC[15]],
    [4,...FC[16]],[4,...FC[17]],[4,...FC[18]],[4,...FC[19]],
  ],
};

// Fighter has no class-specific extra columns in the 5e table
const FIGHTER_5E = { columns: [], data: Array.from({length:20}, () => []) };

const MONK_5E = {
  columns: [
    {key:'martial', label:'Martial Arts'},
    {key:'ki',      label:'Ki Points'},
    {key:'move',    label:'Unarmored Movement'},
  ],
  data: [
    ['1d4',0,0],['1d4',2,'+10 ft'],['1d4',3,'+10 ft'],['1d4',4,'+10 ft'],
    ['1d6',5,'+10 ft'],['1d6',6,'+15 ft'],['1d6',7,'+15 ft'],['1d6',8,'+15 ft'],
    ['1d6',9,'+15 ft'],['1d6',10,'+20 ft'],['1d8',11,'+20 ft'],['1d8',12,'+20 ft'],
    ['1d8',13,'+25 ft'],['1d8',14,'+25 ft'],['1d8',15,'+25 ft'],['1d8',16,'+25 ft'],
    ['1d10',17,'+25 ft'],['1d10',18,'+30 ft'],['1d10',19,'+30 ft'],['1d10',20,'+30 ft'],
  ],
};

const PALADIN_5E = {
  columns: COLS_5,
  data: HC.map(r => [...r]),
};

const RANGER_5E = {
  columns: [{key:'known',label:'Spells Known'}, ...COLS_5],
  data: [
    [0,...HC[0]],[2,...HC[1]],[3,...HC[2]],[3,...HC[3]],
    [4,...HC[4]],[4,...HC[5]],[5,...HC[6]],[5,...HC[7]],
    [6,...HC[8]],[6,...HC[9]],[7,...HC[10]],[7,...HC[11]],
    [8,...HC[12]],[8,...HC[13]],[9,...HC[14]],[9,...HC[15]],
    [10,...HC[16]],[10,...HC[17]],[11,...HC[18]],[11,...HC[19]],
  ],
};

const ROGUE_5E = {
  columns: [{key:'sneak', label:'Sneak Attack'}],
  data: [
    ['1d6'],['1d6'],['2d6'],['2d6'],['3d6'],['3d6'],['4d6'],['4d6'],['5d6'],['5d6'],
    ['6d6'],['6d6'],['7d6'],['7d6'],['8d6'],['8d6'],['9d6'],['9d6'],['10d6'],['10d6'],
  ],
};

const SORCERER_5E = {
  columns: [
    {key:'cantrips', label:'Cantrips Known'},
    {key:'known',    label:'Spells Known'},
    {key:'sorc_pts', label:'Sorc. Points'},
    ...COLS_9,
  ],
  data: [
    [4,2,0,...FC[0]],[4,3,2,...FC[1]],[4,4,3,...FC[2]],[5,5,4,...FC[3]],
    [5,6,5,...FC[4]],[5,7,6,...FC[5]],[5,8,7,...FC[6]],[5,9,8,...FC[7]],
    [5,10,9,...FC[8]],[6,11,10,...FC[9]],[6,12,11,...FC[10]],[6,12,12,...FC[11]],
    [6,13,13,...FC[12]],[6,13,14,...FC[13]],[6,14,15,...FC[14]],[6,14,16,...FC[15]],
    [6,15,17,...FC[16]],[6,15,18,...FC[17]],[6,15,19,...FC[18]],[6,15,20,...FC[19]],
  ],
};

const WARLOCK_5E = {
  columns: [
    {key:'cantrips',    label:'Cantrips Known'},
    {key:'known',       label:'Spells Known'},
    {key:'slots',       label:'Spell Slots'},
    {key:'slot_level',  label:'Slot Level'},
    {key:'invocations', label:'Invocations Known'},
  ],
  data: [
    [2,2,1,'1st',0],[2,3,2,'1st',2],[2,4,2,'2nd',2],[3,5,2,'2nd',2],
    [3,6,2,'3rd',3],[3,7,2,'3rd',3],[3,8,2,'4th',4],[3,9,2,'4th',4],
    [3,10,2,'5th',5],[4,10,2,'5th',5],[4,11,3,'5th',5],[4,11,3,'5th',6],
    [4,12,3,'5th',6],[4,12,3,'5th',6],[4,13,3,'5th',7],[4,13,3,'5th',7],
    [4,14,4,'5th',7],[4,14,4,'5th',8],[4,15,4,'5th',8],[4,15,4,'5th',8],
  ],
};

const WIZARD_5E = {
  columns: [{key:'cantrips',label:'Cantrips Known'}, ...COLS_9],
  data: [
    [3,...FC[0]],[3,...FC[1]],[3,...FC[2]],[4,...FC[3]],
    [4,...FC[4]],[4,...FC[5]],[4,...FC[6]],[4,...FC[7]],
    [4,...FC[8]],[5,...FC[9]],[5,...FC[10]],[5,...FC[11]],
    [5,...FC[12]],[5,...FC[13]],[5,...FC[14]],[5,...FC[15]],
    [5,...FC[16]],[5,...FC[17]],[5,...FC[18]],[5,...FC[19]],
  ],
};

// ─── 2024 progressions (override where rules differ) ─────────────────────────

// 2024 martial classes gain Weapon Mastery — column added
const WM_COL = {key:'wm', label:'Weapon Masteries'};

const BARBARIAN_2024 = {
  columns: [
    {key:'rages',    label:'Rages'},
    {key:'rage_dmg', label:'Rage Dmg'},
    WM_COL,
  ],
  data: [
    [2,'+2',2],[2,'+2',2],[3,'+2',2],[3,'+2',3],[3,'+2',3],
    [4,'+2',3],[4,'+2',3],[4,'+2',3],[4,'+3',3],[4,'+3',4],
    [4,'+3',4],[5,'+3',4],[5,'+3',4],[5,'+3',4],[5,'+3',4],
    [5,'+4',4],[6,'+4',4],[6,'+4',4],[6,'+4',4],['∞','+4',4],
  ],
};

// Bard/Cleric/Druid/Sorcerer/Wizard: same table as 5e
const BARD_2024    = BARD_5E;
const CLERIC_2024  = CLERIC_5E;
const DRUID_2024   = DRUID_5E;
const SORCERER_2024 = SORCERER_5E;
const WIZARD_2024  = WIZARD_5E;

const FIGHTER_2024 = {
  columns: [WM_COL],
  data: [
    [2],[2],[2],[3],[3],[3],[3],[3],[3],[4],[4],[4],
    [4],[4],[4],[5],[5],[5],[5],[5],
  ],
};

const MONK_2024 = {
  columns: [
    {key:'martial', label:'Martial Arts'},
    {key:'focus',   label:'Focus Points'},
    {key:'move',    label:'Unarmored Movement'},
    WM_COL,
  ],
  data: [
    ['1d6',2,'+10 ft',2],['1d6',2,'+10 ft',2],['1d6',3,'+10 ft',2],['1d6',4,'+10 ft',3],
    ['1d8',5,'+10 ft',3],['1d8',6,'+15 ft',3],['1d8',7,'+15 ft',3],['1d8',8,'+15 ft',3],
    ['1d8',9,'+15 ft',3],['1d8',10,'+20 ft',3],['1d10',11,'+20 ft',3],['1d10',12,'+20 ft',3],
    ['1d10',13,'+25 ft',4],['1d10',14,'+25 ft',4],['1d10',15,'+25 ft',4],['1d10',16,'+25 ft',4],
    ['1d12',17,'+25 ft',4],['1d12',18,'+30 ft',4],['1d12',19,'+30 ft',4],['1d12',20,'+30 ft',4],
  ],
};

const PALADIN_2024 = {
  columns: COLS_5,
  data: HC_PAL_2024.map(r => [...r]),
};

const RANGER_2024 = {
  columns: [{key:'known',label:'Spells Known'}, ...COLS_5, WM_COL],
  data: [
    [0,...HC[0],2],[2,...HC[1],2],[3,...HC[2],2],[3,...HC[3],2],
    [4,...HC[4],3],[4,...HC[5],3],[5,...HC[6],3],[5,...HC[7],3],
    [6,...HC[8],3],[6,...HC[9],3],[7,...HC[10],4],[7,...HC[11],4],
    [8,...HC[12],4],[8,...HC[13],4],[9,...HC[14],4],[9,...HC[15],4],
    [10,...HC[16],4],[10,...HC[17],4],[11,...HC[18],4],[11,...HC[19],4],
  ],
};

const ROGUE_2024 = {
  columns: [{key:'sneak',label:'Sneak Attack'}, WM_COL],
  data: [
    ['1d6',2],['1d6',2],['2d6',2],['2d6',2],['3d6',3],['3d6',3],['4d6',3],['4d6',3],
    ['5d6',3],['5d6',3],['6d6',3],['6d6',3],['7d6',3],['8d6',4],['8d6',4],['9d6',4],
    ['9d6',4],['10d6',4],['10d6',4],['11d6',4],
  ],
};

const WARLOCK_2024 = {
  columns: [
    {key:'cantrips',    label:'Cantrips Known'},
    {key:'known',       label:'Spells Known'},
    {key:'slots',       label:'Spell Slots'},
    {key:'slot_level',  label:'Slot Level'},
    {key:'invocations', label:'Invocations Known'},
  ],
  data: [
    [2,2,1,'1st',2],[2,3,2,'1st',3],[2,4,2,'2nd',3],[3,5,2,'2nd',3],
    [3,6,2,'3rd',4],[3,7,2,'3rd',4],[3,8,2,'4th',5],[3,9,2,'4th',5],
    [3,10,2,'5th',6],[4,11,2,'5th',6],[4,11,3,'5th',6],[4,12,3,'5th',7],
    [4,12,3,'5th',7],[4,13,3,'5th',7],[4,13,3,'5th',8],[4,14,3,'5th',8],
    [4,14,4,'5th',8],[4,15,4,'5th',8],[4,15,4,'5th',9],[4,16,4,'5th',9],
  ],
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export const CLASS_PROGRESSION = {
  '5e': {
    Barbarian: BARBARIAN_5E,
    Bard:      BARD_5E,
    Cleric:    CLERIC_5E,
    Druid:     DRUID_5E,
    Fighter:   FIGHTER_5E,
    Monk:      MONK_5E,
    Paladin:   PALADIN_5E,
    Ranger:    RANGER_5E,
    Rogue:     ROGUE_5E,
    Sorcerer:  SORCERER_5E,
    Warlock:   WARLOCK_5E,
    Wizard:    WIZARD_5E,
  },
  '5.5e': {
    Barbarian: BARBARIAN_2024,
    Bard:      BARD_2024,
    Cleric:    CLERIC_2024,
    Druid:     DRUID_2024,
    Fighter:   FIGHTER_2024,
    Monk:      MONK_2024,
    Paladin:   PALADIN_2024,
    Ranger:    RANGER_2024,
    Rogue:     ROGUE_2024,
    Sorcerer:  SORCERER_2024,
    Warlock:   WARLOCK_2024,
    Wizard:    WIZARD_2024,
  },
};

export function profBonus(level) {
  return Math.ceil(level / 4) + 1;
}

export function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
