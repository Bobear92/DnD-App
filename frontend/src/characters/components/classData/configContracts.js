/**
 * Config contract validators — the "golden fixture" guard for the data-driven config tables.
 *
 * Four tables drive class/subclass mechanics as pure data (adding a class or subclass is meant
 * to be data entry, not new component code):
 *   • class configs    — sheets/classSheet/configs (the getClassConfig registry)
 *   • LEVEL_CHOICES     — class-scoped level-up pools (Metamagic, Eldritch Invocations)
 *   • SUBCLASS_GRANTS   — subclass level choices (Student of War, Additional Fighting Style)
 *   • SUBCLASS_CASTERS  — subclass spellcasting (Eldritch Knight)
 *
 * Each validator returns string[] of problems ([] = valid) and NEVER throws, so a malformed new
 * entry fails the co-located contract test with a locating message instead of crashing an
 * unrelated sheet at runtime. The test also feeds the validators deliberately-broken input, so
 * the guarantee is real rather than decorative.
 *
 * This module is intentionally dependency-free — it imports none of the tables. Consumers (the
 * test today, a CI script tomorrow) supply the data to the table-walkers. That keeps it reusable
 * outside a React/jsdom environment.
 */

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isFn = (v) => typeof v === 'function';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isInt = (v) => isNum(v) && Number.isInteger(v);
const isLevel = (v) => isNum(v) && v >= 1 && v <= 20;
const isArr = (v) => Array.isArray(v);
const nonEmptyArr = (v) => isArr(v) && v.length > 0;
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

export const EDITIONS = ['5e', '5.5e'];

// Call a level→value function across 1..20, collecting problems from `check(value, level)`.
function eachLevel(fn, label, check, errs) {
  if (!isFn(fn)) { errs.push(`${label} must be a function`); return; }
  for (let l = 1; l <= 20; l += 1) {
    let v;
    try { v = fn(l); } catch (err) { errs.push(`${label}(${l}) threw: ${err.message}`); return; }
    const msg = check(v, l);
    if (msg) { errs.push(`${label}(${l}): ${msg}`); return; }
  }
}

const nonNegNumber = (v) => (isNum(v) && v >= 0 ? null : 'must return a non-negative number');

// A spell-slot row is 9 wide (1st–9th level), every entry a non-negative number.
const slotRowProblem = (v) => {
  if (!isArr(v) || v.length !== 9) return 'must return a 9-length slot array';
  if (!v.every((n) => isNum(n) && n >= 0)) return 'slot counts must be non-negative numbers';
  return null;
};

// A cumulative "known at level" function: non-negative integers, non-decreasing across 0..20.
function validateKnownAtLevel(fn, label, errs) {
  if (!isFn(fn)) { errs.push(`${label} must be a function`); return; }
  let prev = -Infinity;
  for (let l = 0; l <= 20; l += 1) {
    let v;
    try { v = fn(l); } catch (err) { errs.push(`${label}(${l}) threw: ${err.message}`); return; }
    if (!isInt(v) || v < 0) { errs.push(`${label}(${l}) must be a non-negative integer`); return; }
    if (v < prev) {
      errs.push(`${label} decreased at level ${l} (${prev} → ${v}); cumulative counts must be non-decreasing`);
      return;
    }
    prev = v;
  }
}

// ── Per-entry validators ──────────────────────────────────────────────────────

export function validateClassConfig(config, label = 'class config') {
  const e = [];
  if (!isObj(config)) return [`${label}: not an object`];

  if (!isStr(config.className)) e.push(`${label}.className must be a non-empty string`);
  if (!EDITIONS.includes(config.edition)) e.push(`${label}.edition must be one of ${EDITIONS.join('/')}`);
  if (!isNum(config.hitDie) || config.hitDie <= 0) e.push(`${label}.hitDie must be a positive number`);
  if (!isObj(config.features)) e.push(`${label}.features must be a feature-table object`);

  if (config.extraAttacks != null) eachLevel(config.extraAttacks, `${label}.extraAttacks`, nonNegNumber, e);

  if (!isArr(config.lockedChoices)) e.push(`${label}.lockedChoices must be an array`);
  else config.lockedChoices.forEach((c, i) => {
    const L = `${label}.lockedChoices[${i}]`;
    if (!isStr(c?.key)) e.push(`${L}.key must be a string`);
    if (!isStr(c?.label)) e.push(`${L}.label must be a string`);
    if (!nonEmptyArr(c?.options)) e.push(`${L}.options must be a non-empty array`);
    if (!isLevel(c?.minLevel)) e.push(`${L}.minLevel must be a level 1..20`);
  });

  if (!isArr(config.restResources)) e.push(`${label}.restResources must be an array`);
  else config.restResources.forEach((r, i) => {
    const L = `${label}.restResources[${i}]`;
    if (!isStr(r?.key)) e.push(`${L}.key must be a string`);
    if (!isStr(r?.label)) e.push(`${L}.label must be a string`);
    if (!['short', 'long'].includes(r?.recharge)) e.push(`${L}.recharge must be 'short' or 'long'`);
    if (!isLevel(r?.minLevel)) e.push(`${L}.minLevel must be a level 1..20`);
    eachLevel(r?.total, `${L}.total`, nonNegNumber, e);
    if (r?.description != null && !isStr(r.description)) e.push(`${L}.description must be a string when present`);
  });

  if (!isArr(config.notes)) e.push(`${label}.notes must be an array`);

  const s = config.subclass;
  if (!isObj(s)) e.push(`${label}.subclass must be an object`);
  else {
    if (!isStr(s.label)) e.push(`${label}.subclass.label must be a string`);
    if (!nonEmptyArr(s.options)) e.push(`${label}.subclass.options must be a non-empty array`);
    if (!isLevel(s.unlockLevel)) e.push(`${label}.subclass.unlockLevel must be a level 1..20`);
    if (!EDITIONS.includes(s.subclassEdition)) e.push(`${label}.subclass.subclassEdition must be one of ${EDITIONS.join('/')}`);
  }

  if (!nonEmptyArr(config.asiLevels) || !config.asiLevels.every(isLevel)) {
    e.push(`${label}.asiLevels must be a non-empty array of levels 1..20`);
  }

  const sk = config.skill;
  if (!isObj(sk)) e.push(`${label}.skill must be an object`);
  else {
    if (!nonEmptyArr(sk.allowed) || !sk.allowed.every(isStr)) e.push(`${label}.skill.allowed must be a non-empty string array`);
    if (!isNum(sk.count) || sk.count < 0) e.push(`${label}.skill.count must be a non-negative number`);
  }

  if (config.caster != null) {
    const c = config.caster;
    if (!isObj(c)) e.push(`${label}.caster must be an object or null`);
    else {
      if (!isStr(c.spellcastingAbility)) e.push(`${label}.caster.spellcastingAbility must be a string`);
      eachLevel(c.slotsForLevel, `${label}.caster.slotsForLevel`, slotRowProblem, e);
      for (const key of ['cantrips', 'spellbook']) {
        if (c[key] != null) {
          const g = c[key];
          if (!isObj(g)) e.push(`${label}.caster.${key} must be an object`);
          else {
            if (!nonEmptyArr(g.options)) e.push(`${label}.caster.${key}.options must be a non-empty array`);
            if (!isNum(g.limit) || g.limit < 0) e.push(`${label}.caster.${key}.limit must be a non-negative number`);
          }
        }
      }
    }
  }

  if (config.weaponMastery != null) {
    const w = config.weaponMastery;
    if (!isObj(w)) e.push(`${label}.weaponMastery must be an object`);
    else {
      if (!isStr(w.label)) e.push(`${label}.weaponMastery.label must be a string`);
      eachLevel(w.max, `${label}.weaponMastery.max`, nonNegNumber, e);
    }
  }

  return e;
}

export function validateLevelChoice(choice, label = 'level choice') {
  const e = [];
  if (!isObj(choice)) return [`${label}: not an object`];
  if (!isStr(choice.key)) e.push(`${label}.key must be a string`);
  if (!isStr(choice.label)) e.push(`${label}.label must be a string`);
  if (!isStr(choice.storeField)) e.push(`${label}.storeField must be a string`);
  validateKnownAtLevel(choice.knownAtLevel, `${label}.knownAtLevel`, e);
  if (!nonEmptyArr(choice.pool)) e.push(`${label}.pool must be a non-empty array`);
  else choice.pool.forEach((o, i) => {
    const L = `${label}.pool[${i}]`;
    if (!isStr(o?.name)) e.push(`${L}.name must be a string`);
    if (!isStr(o?.description)) e.push(`${L}.description must be a string`);
    if (o?.minLevel != null && !isLevel(o.minLevel)) e.push(`${L}.minLevel must be a level 1..20 when present`);
  });
  return e;
}

export function validateSubclassGrant(grant, label = 'subclass grant') {
  const e = [];
  if (!isObj(grant)) return [`${label}: not an object`];
  if (!isLevel(grant.level)) e.push(`${label}.level must be a level 1..20`);
  if (!isStr(grant.key)) e.push(`${label}.key must be a string`);
  if (!isStr(grant.label)) e.push(`${label}.label must be a string`);
  if (!isNum(grant.count) || grant.count < 1) e.push(`${label}.count must be a number >= 1`);
  if (!isStr(grant.storeField)) e.push(`${label}.storeField must be a string`);
  if (!nonEmptyArr(grant.options)) e.push(`${label}.options must be a non-empty array`);
  else grant.options.forEach((o, i) => {
    const L = `${label}.options[${i}]`;
    if (!isStr(o?.value)) e.push(`${L}.value must be a string`);
    if (o?.description != null && !isStr(o.description)) e.push(`${L}.description must be a string when present`);
  });
  if (!isFn(grant.heldFrom)) e.push(`${label}.heldFrom must be a function`);
  if (grant.surface != null && !['sheet', 'banner'].includes(grant.surface)) {
    e.push(`${label}.surface must be 'sheet' or 'banner' when present`);
  }
  return e;
}

export function validateSubclassCaster(caster, label = 'subclass caster') {
  const e = [];
  if (!isObj(caster)) return [`${label}: not an object`];
  if (!isStr(caster.kind)) e.push(`${label}.kind must be a string`);
  if (!isStr(caster.spellcastingAbility)) e.push(`${label}.spellcastingAbility must be a string`);
  if (!isLevel(caster.unlockLevel)) e.push(`${label}.unlockLevel must be a level 1..20`);
  eachLevel(caster.slotsForLevel, `${label}.slotsForLevel`, slotRowProblem, e);
  eachLevel(caster.cantripsKnownAt, `${label}.cantripsKnownAt`, nonNegNumber, e);
  eachLevel(caster.spellsKnownAt, `${label}.spellsKnownAt`, nonNegNumber, e);
  if (!isStr(caster.spellList)) e.push(`${label}.spellList must be a string`);
  if (!isNum(caster.leveledSwapPerLevel) || caster.leveledSwapPerLevel < 0) {
    e.push(`${label}.leveledSwapPerLevel must be a non-negative number`);
  }
  if (caster.restrictedSchools != null) {
    if (!nonEmptyArr(caster.restrictedSchools) || !caster.restrictedSchools.every(isStr)) {
      e.push(`${label}.restrictedSchools must be a non-empty string array or null`);
    }
    eachLevel(caster.anySlotsAt, `${label}.anySlotsAt`, nonNegNumber, e);
    eachLevel(caster.restrictedSlotsAt, `${label}.restrictedSlotsAt`, nonNegNumber, e);
  }
  return e;
}

// ── Table walkers ─────────────────────────────────────────────────────────────
// Each iterates the LIVE table, so a newly-added class/pool/grant/caster is guarded
// automatically. Edition keys are checked here; class/edition self-consistency for
// class configs is checked in validateClassConfigRegistry.

// ── Caster descriptors (hand-written sheets delegating to the shared CasterSpellBlock) ────────
//
// Adding a class to CASTER_DESCRIPTORS is what switches its sheet onto the unified Spells-tab
// layout, so a malformed entry silently breaks that class's spells tab. These checks are the gate.

export const CASTER_KINDS = ['prepare', 'known', 'pact', 'spellbook'];

// Slot rows differ by caster: full casters are 9 wide (1st–9th), half casters 5 wide (1st–5th),
// and Pact Magic is a [slotCount, slotLevel] pair rather than a per-level row.
const casterSlotRowProblem = (kind) => (v) => {
  if (kind === 'pact') {
    if (!isArr(v) || v.length !== 2) return 'pact slots must return [slotCount, slotLevel]';
    if (!v.every((n) => isInt(n) && n >= 0)) return 'pact [slotCount, slotLevel] must be non-negative integers';
    if (v[1] > 9) return `pact slot level ${v[1]} exceeds 9`;
    return null;
  }
  if (!isArr(v) || (v.length !== 9 && v.length !== 5)) return 'must return a 9- or 5-length slot array';
  if (!v.every((n) => isNum(n) && n >= 0)) return 'slot counts must be non-negative numbers';
  return null;
};

export function validateCasterDescriptor(d, label = 'caster descriptor') {
  const e = [];
  if (!isObj(d)) return [`${label}: not an object`];
  if (!isStr(d.className)) e.push(`${label}.className must be a string`);
  if (!EDITIONS.includes(d.edition)) e.push(`${label}.edition must be one of ${EDITIONS.join(' | ')}`);
  if (!CASTER_KINDS.includes(d.kind)) e.push(`${label}.kind must be one of ${CASTER_KINDS.join(' | ')}`);
  if (!isStr(d.spellcastingAbility)) e.push(`${label}.spellcastingAbility must be a string`);
  if (!isStr(d.spellList)) e.push(`${label}.spellList must be a string`);
  // The character_data key the sheet reads/writes. Never inferred from `kind` — the 5e Ranger keeps
  // a spells-KNOWN list under `prepared_spells`, and a conversion must not migrate it.
  if (!isStr(d.listKey)) e.push(`${label}.listKey must be a string`);
  if (!isLevel(d.startsAtLevel)) e.push(`${label}.startsAtLevel must be a level 1..20`);
  eachLevel(d.slotsForLevel, `${label}.slotsForLevel`, casterSlotRowProblem(d.kind), e);
  // Only prepare-style casters have a preparation limit; it takes (level, abilityMod).
  if (d.prepareLimit != null) {
    if (!isFn(d.prepareLimit)) e.push(`${label}.prepareLimit must be a function`);
    else {
      const v = d.prepareLimit(5, 3);
      if (!isInt(v) || v < 1) e.push(`${label}.prepareLimit(5, 3) must return a positive integer`);
    }
  } else if (d.kind === 'prepare') {
    e.push(`${label}.prepareLimit is required for kind 'prepare'`);
  }
  if (d.cantripPicker != null && typeof d.cantripPicker !== 'boolean') {
    e.push(`${label}.cantripPicker must be a boolean`);
  }
  return e;
}

export function validateCasterDescriptorTable(table) {
  const e = [];
  if (!isArr(table)) return ['CASTER_DESCRIPTORS: not an array'];
  const seen = new Set();
  table.forEach((d, i) => {
    const label = isObj(d) && isStr(d.className) ? `${d.className}/${d.edition}` : `CASTER_DESCRIPTORS[${i}]`;
    e.push(...validateCasterDescriptor(d, label));
    // One descriptor per class+edition — a duplicate means getCasterDescriptor silently wins on the
    // first and the second entry is dead code.
    const key = `${d?.className}|${d?.edition}`;
    if (seen.has(key)) e.push(`${label}: duplicate descriptor for this class + edition`);
    seen.add(key);
  });
  return e;
}

export function validateClassConfigRegistry(registry) {
  const e = [];
  if (!isObj(registry)) return ['class config registry: not an object'];
  for (const edition of Object.keys(registry)) {
    if (!EDITIONS.includes(edition)) e.push(`class config registry: unexpected edition key '${edition}'`);
    const byClass = registry[edition] || {};
    for (const className of Object.keys(byClass)) {
      const config = byClass[className];
      const label = `${className}/${edition}`;
      e.push(...validateClassConfig(config, label));
      if (isObj(config)) {
        if (config.className !== className) e.push(`${label}: config.className '${config.className}' does not match registry key '${className}'`);
        if (config.edition !== edition) e.push(`${label}: config.edition '${config.edition}' does not match registry key '${edition}'`);
      }
    }
  }
  return e;
}

export function validateLevelChoicesTable(table) {
  const e = [];
  if (!isObj(table)) return ['LEVEL_CHOICES: not an object'];
  for (const className of Object.keys(table)) {
    for (const edition of Object.keys(table[className] || {})) {
      if (!EDITIONS.includes(edition)) e.push(`LEVEL_CHOICES.${className}: unexpected edition key '${edition}'`);
      const list = table[className][edition];
      if (!isArr(list)) { e.push(`LEVEL_CHOICES.${className}.${edition} must be an array`); continue; }
      list.forEach((choice, i) => e.push(...validateLevelChoice(choice, `${className}/${edition}/${choice?.key ?? i}`)));
    }
  }
  return e;
}

export function validateSubclassGrantsTable(table) {
  const e = [];
  if (!isObj(table)) return ['SUBCLASS_GRANTS: not an object'];
  for (const className of Object.keys(table)) {
    for (const edition of Object.keys(table[className] || {})) {
      if (!EDITIONS.includes(edition)) e.push(`SUBCLASS_GRANTS.${className}: unexpected edition key '${edition}'`);
      const bySub = table[className][edition] || {};
      for (const subclass of Object.keys(bySub)) {
        const list = bySub[subclass];
        if (!isArr(list)) { e.push(`SUBCLASS_GRANTS.${className}.${edition}.${subclass} must be an array`); continue; }
        list.forEach((grant, i) => e.push(...validateSubclassGrant(grant, `${className}/${edition}/${subclass}/${grant?.key ?? i}`)));
      }
    }
  }
  return e;
}

export function validateSubclassCastersTable(table) {
  const e = [];
  if (!isObj(table)) return ['SUBCLASS_CASTERS: not an object'];
  for (const className of Object.keys(table)) {
    for (const edition of Object.keys(table[className] || {})) {
      if (!EDITIONS.includes(edition)) e.push(`SUBCLASS_CASTERS.${className}: unexpected edition key '${edition}'`);
      const bySub = table[className][edition] || {};
      for (const subclass of Object.keys(bySub)) {
        e.push(...validateSubclassCaster(bySub[subclass], `${className}/${edition}/${subclass}`));
      }
    }
  }
  return e;
}
