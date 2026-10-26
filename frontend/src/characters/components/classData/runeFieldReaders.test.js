// PRODUCER / CONSUMER guard for the two Rune Knight data tables whose fields are applied by OTHER
// modules: a rune's `passive` (runesData.js) and an active effect's `grants` (activeEffects.js).
//
// Why: the fighter-subclass retro's biggest QA category was "computed correctly, shown nowhere".
// Giant's Might produced advantage fields nothing read; Runic Juggernaut's `reachBonus` and the
// Fire Rune's `toolBonus` sat unread for weeks while the tests that checked the PRODUCER passed.
// A field with no reader is a silent no-op, and the old rule saying so was prose.
//
// How: every field either table can produce must be listed in READERS, naming a source file that
// actually references it. A NEW field fails until a reader is named (or it's deleted), and a
// reader that stops using its field fails too. Scoped to these two tables on purpose — they are
// the ones whose fields are spread across subsystems; widen it when another such table appears.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNE_OPTIONS } from '@/characters/components/classData/runesData';
import { ACTIVE_EFFECTS } from '@/characters/components/effects/activeEffects';

const COMPONENTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(COMPONENTS, rel), 'utf8');

// field → the source file(s) that apply it. Each must mention the field by name.
const PASSIVE_READERS = {
  skills: ['skills/skillAdvantage.js'],
  resistances: ['defenses/defenses.js'],
  toolBonus: ['inventory/toolChecks.js'],
  vision: ['senses/senses.js'],
  text: ['inventory/RuneCarvingControl.jsx'],
};

const CHANNEL_READERS = {
  cost: ['combat/actionEconomyData.js'],
  tab: ['combat/actionEconomyData.js'],
  description: ['combat/actionEconomyData.js'],
  activeEffect: ['combat/actionEconomyData.js'],
};

// activeEffects.js's own helpers count as the reader when they are what the sheet calls
// (bonusParts reads checkBonus/saveBonus by name; activeEffectResistances reads resistances).
const GRANTS_READERS = {
  size: ['inventory/inventoryData.js'],
  advantageAbilities: ['skills/skillAdvantage.js'],
  advantageSaves: ['skills/saveFeatures.js'],
  reachBonus: ['inventory/inventoryData.js'],
  reachSource: ['inventory/inventoryData.js'],
  checkBonus: ['effects/activeEffects.js'],
  saveBonus: ['effects/activeEffects.js'],
  resistances: ['effects/activeEffects.js'],
};

const fieldsOf = (objs) => [...new Set(objs.flatMap((o) => Object.keys(o ?? {})))];

// Every level an effect could be evaluated at, so a field granted only at 18 is still seen.
const grantsFields = () => fieldsOf(ACTIVE_EFFECTS.flatMap((e) =>
  Array.from({ length: 20 }, (_, i) => e.grants(i + 1))));

function expectRead(field, readers) {
  expect(readers, `"${field}" has no reader listed — wire one or delete the field`).toBeTruthy();
  for (const rel of readers) {
    expect(new RegExp(`\\b${field}\\b`).test(read(rel)),
      `${rel} is listed as reading "${field}" but never mentions it`).toBe(true);
  }
}

describe('rune and active-effect fields all have a reader', () => {
  it.each(fieldsOf(RUNE_OPTIONS.map((r) => r.passive)))('rune passive.%s', (field) => {
    expectRead(field, PASSIVE_READERS[field]);
  });

  it.each(fieldsOf(RUNE_OPTIONS.map((r) => r.channel)))('rune channel.%s', (field) => {
    expectRead(field, CHANNEL_READERS[field]);
  });

  it.each(grantsFields())('active effect grants.%s', (field) => {
    expectRead(field, GRANTS_READERS[field]);
  });

  // Self-tests: the guard must actually fire, or a green run proves nothing.
  it('fails a field with no listed reader', () => {
    expect(() => expectRead('attackDie', GRANTS_READERS.attackDie)).toThrow(/no reader listed/);
  });

  it('fails a listed reader that never mentions the field', () => {
    expect(() => expectRead('toolBonus', ['skills/skillAdvantage.js'])).toThrow(/never mentions/);
  });
});
