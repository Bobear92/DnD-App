// Feat effects resolver — turns a character's feats (with snapshotted `effects` arrays)
// into the mechanics the rest of the sheet consumes, so a feat is more than a description
// card. Effects are authored on the encyclopedia feat (backend `feats.effects`) and
// snapshotted onto each `character_data.feats[i].effects` when the feat is acquired
// (LevelUpWizard / Variant Human creation) — the same snapshot pattern as inventory items.
//
// Effect kinds (see backend players/feats/models.py for the authoritative list):
//   { kind: 'stat_mod',       stat, amount }                  passive modifier to a derived stat (e.g. initiative)
//   { kind: 'ability_score',  ability, amount }               fixed ability increase (applied at acquisition)
//   { kind: 'ability_choice', abilities:[...], amount }        player picks one of the abilities (half-feats)
//   { kind: 'attack_mod',     target:'unarmed', dice }         changes an attack (e.g. unarmed strike die)
//   { kind: 'action',         name, economy, description, trigger }  an Action Economy entry
//   { kind: 'note',           text }                           display-only rider (explicitly not a mechanic)

export const FEAT_EFFECT_KINDS = ['stat_mod', 'ability_score', 'ability_choice', 'attack_mod', 'action', 'note'];

/** All effect objects across a character's feats (each feat instance may carry a snapshot). */
export function allFeatEffects(feats = []) {
  return (feats ?? []).flatMap((f) => (f && Array.isArray(f.effects) ? f.effects.map((e) => ({ ...e, _featName: f.name })) : []));
}

// A stat_mod amount / resource total is a number, or the string 'pb' for proficiency-bonus
// scaling (2024 Alert's initiative, Lucky's luck points) — resolved with the pb passed by the
// consumer (CharacterDetail computes it; getRestSummary derives it from level). pb defaults to 0
// so a PB-scaled value that isn't given a pb simply contributes nothing rather than crashing.
const resolveAmount = (v, pb) => (v === 'pb' ? (Number(pb) || 0) : (Number(v) || 0));

/** Sum the `stat_mod` amounts for a given derived stat (e.g. 'initiative' → Alert's +5). */
export function getFeatStatMods(feats = [], stat, { pb } = {}) {
  return allFeatEffects(feats)
    .filter((e) => e.kind === 'stat_mod' && e.stat === stat)
    .reduce((sum, e) => sum + resolveAmount(e.amount, pb), 0);
}

/** Per-source breakdown of a stat's feat modifiers, e.g. [{ source:'Alert', amount:5 }]. */
export function getFeatStatModSources(feats = [], stat, { pb } = {}) {
  return allFeatEffects(feats)
    .filter((e) => e.kind === 'stat_mod' && e.stat === stat)
    .map((e) => ({ source: e._featName, amount: resolveAmount(e.amount, pb), label: e.label }));
}

/**
 * Conditional AC modifiers from feats (Defense +1 in armor, Dual Wielder +1 with two melee
 * weapons, Medium Armor Master's raised DEX cap). Returns the raw `ac_mod` effects; the
 * condition is evaluated by computeArmorClass, which has the equipment context.
 */
export function getFeatAcMods(feats = []) {
  return allFeatEffects(feats)
    .filter((e) => e.kind === 'ac_mod')
    .map((e) => ({ amount: Number(e.amount) || 0, condition: e.condition, dexCap: Number(e.dex_cap) || 0, source: e._featName }));
}

/** Action Economy entries contributed by feats (e.g. Tavern Brawler's bonus-action grapple). */
export function getFeatActions(feats = []) {
  return allFeatEffects(feats)
    .filter((e) => e.kind === 'action')
    .map((e) => ({
      key: `feat-${e._featName}-${e.name}`,
      name: e.name,
      economy: e.economy || 'action',     // bucket key: no_action|action|bonus|'action+bonus'|reaction
      description: e.description || '',
      trigger: e.trigger || '',
      source: e._featName,
    }));
}

/**
 * The unarmed-strike damage die granted by a feat, if any (e.g. Tavern Brawler '1d4').
 * Returns the largest die when multiple apply (compares by the die's face count).
 */
export function getFeatUnarmedDice(feats = []) {
  const dice = allFeatEffects(feats)
    .filter((e) => e.kind === 'attack_mod' && e.target === 'unarmed' && e.dice)
    .map((e) => e.dice);
  if (dice.length === 0) return null;
  const faces = (d) => parseInt(String(d).split('d')[1] || '0', 10);
  return dice.sort((a, b) => faces(b) - faces(a))[0];
}

/**
 * Rest-rechargeable resource pools granted by feats (e.g. Lucky's 3 luck points, Martial
 * Adept's 1 superiority die). Returns [{ key, usedKey, label, total, recharge, source }],
 * deduped by key (largest total wins). The expended count lives in character_data as
 * `${key}_used`; reset on the matching rest by the backend (_compute_rest_patch).
 */
export function getFeatResources(feats = [], { pb } = {}) {
  const byKey = {};
  for (const e of allFeatEffects(feats)) {
    if (e.kind !== 'resource' || !e.key) continue;
    const total = resolveAmount(e.total, pb);
    const existing = byKey[e.key];
    if (!existing || total > existing.total) {
      byKey[e.key] = {
        key: e.key,
        usedKey: `${e.key}_used`,
        label: e.label || e.key,
        total,
        recharge: e.recharge === 'short' ? 'short' : 'long',
        source: e._featName,
      };
    }
  }
  return Object.values(byKey);
}

/**
 * Ability-score choices a feat requires the player to make at acquisition (half-feats).
 * Returns [{ abilities:[...], amount }] from the feat's `ability_choice` effects.
 * Pass a single feat object (the one being picked), not the whole list.
 */
export function featAbilityChoices(feat) {
  if (!feat || !Array.isArray(feat.effects)) return [];
  return feat.effects
    .filter((e) => e.kind === 'ability_choice' && Array.isArray(e.abilities) && e.abilities.length)
    .map((e) => ({ abilities: e.abilities, amount: Number(e.amount) || 1 }));
}

/**
 * Fixed proficiency grants from feats (those with an `items` list — no acquisition choice),
 * bucketed for the Items-tab proficiency banners + equip checks. Returns
 * { armor, weapons, tools, languages } of granted names. Choice grants (a `count` with no
 * `items`, e.g. Skilled) are NOT included here — they need an acquisition picker.
 */
export function getFeatProficiencyGrants(feats = []) {
  const out = { armor: [], weapons: [], tools: [], languages: [] };
  const bucket = { armor: 'armor', weapon: 'weapons', tool: 'tools', language: 'languages' };
  for (const e of allFeatEffects(feats)) {
    if (e.kind !== 'proficiency' || !Array.isArray(e.items)) continue;
    const b = bucket[e.prof_type];
    if (b) out[b].push(...e.items);
  }
  for (const k of Object.keys(out)) out[k] = [...new Set(out[k])];
  return out;
}

/**
 * Saving-throw proficiencies granted by feats (e.g. Resilient). Reads an explicit
 * `ability`, or the feat's resolved `choices.ability` when `from_ability_choice` is set.
 * Returns a deduped array of ability keys.
 */
export function getFeatSaveProficiencies(feats = []) {
  const out = [];
  for (const f of feats || []) {
    if (!f || !Array.isArray(f.effects)) continue;
    for (const e of f.effects) {
      if (e.kind !== 'proficiency' || e.prof_type !== 'saving_throw') continue;
      if (e.ability) out.push(e.ability);
      else if (e.from_ability_choice && f.choices?.ability) out.push(f.choices.ability);
    }
  }
  return [...new Set(out)];
}

/** Fixed ability increases a feat grants (no choice needed), e.g. [{ ability, amount }]. */
export function featFixedAbilityScores(feat) {
  if (!feat || !Array.isArray(feat.effects)) return [];
  return feat.effects
    .filter((e) => e.kind === 'ability_score' && e.ability)
    .map((e) => ({ ability: e.ability, amount: Number(e.amount) || 1 }));
}

/** True when the feat has at least one structured (non-note) effect. Drives the coverage report. */
export function isMechanized(feat) {
  return !!feat && Array.isArray(feat.effects)
    && feat.effects.some((e) => e.kind && e.kind !== 'note');
}
