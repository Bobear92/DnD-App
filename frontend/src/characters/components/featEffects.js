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
//   { kind: 'spell_grant',    source_kind, cantrips, leveled, fixed, free_cast, ability }  grants spells (Magic Initiate)
//   { kind: 'note',           text }                           display-only rider (explicitly not a mechanic)

export const FEAT_EFFECT_KINDS = ['stat_mod', 'ability_score', 'ability_choice', 'attack_mod', 'action', 'spell_grant', 'note'];

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

/** True when the feat's ability_choice also confers a saving-throw proficiency in the chosen
 *  ability (Resilient) — i.e. the choice picks WHICH save you gain, not just a +1 stat. */
export function abilityChoiceGrantsSave(feat) {
  return !!feat && Array.isArray(feat.effects) && feat.effects.some(
    (e) => e.kind === 'proficiency' && e.prof_type === 'saving_throw' && e.from_ability_choice,
  );
}

/**
 * The selectable abilities for a feat's half-feat ability choice, with options the character
 * can't benefit from removed. For a save-granting choice (Resilient), excludes abilities whose
 * saving throw the character already has — picking one would waste the proficiency. Non-save
 * choices (Tavern Brawler, etc.) return the full list unchanged. Pass the feat, its ability
 * choice (from featAbilityChoices), and the character's existing save-proficient ability keys.
 */
export function featAbilityChoiceOptions(feat, choice, { saveProficiencies = [] } = {}) {
  if (!choice) return [];
  if (!abilityChoiceGrantsSave(feat)) return choice.abilities;
  const held = new Set((saveProficiencies || []).map((s) => String(s).toLowerCase()));
  return choice.abilities.filter((a) => !held.has(String(a).toLowerCase()));
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

const _ARMOR_CATS = ['light', 'medium', 'heavy'];

/**
 * Reason a feat's proficiency grant is REDUNDANT for this character (so the picker can lock it),
 * or null if it still grants something new. These feats (Lightly/Moderately/Heavily Armored,
 * Weapon Master) are half-feats whose value is the proficiency — if the character already has it,
 * the feat only gives its +1 ability bump, strictly worse than a normal ASI, so it's a trap pick.
 * Pass a single feat object (the one being considered).
 *   ctx.armorProficiencies — the light/medium/heavy categories the character already has.
 *   ctx.hasAllWeapons      — true when the character is proficient with all simple + martial weapons.
 * Redundant only when EVERY proficiency grant on the feat is already covered (a grant that adds
 * anything new returns null). Non-proficiency effects (the +1 ASI) are ignored here.
 */
export function featGrantRedundant(feat, { armorProficiencies = [], weapons = {} } = {}) {
  if (!feat || !Array.isArray(feat.effects)) return null;
  const held = new Set(armorProficiencies.map((a) => String(a).toLowerCase()));
  const hasSimple = !!weapons.simple;
  const hasMartial = !!weapons.martial;
  const hasAllWeapons = hasSimple && hasMartial;
  const reasons = [];
  let sawProfGrant = false;
  for (const e of feat.effects) {
    if (e.kind !== 'proficiency') continue;
    if (e.prof_type === 'armor' && Array.isArray(e.items)) {
      sawProfGrant = true;
      const cats = e.items.map((i) => String(i).toLowerCase()).filter((i) => _ARMOR_CATS.includes(i));
      if (cats.length > 0 && cats.every((c) => held.has(c))) reasons.push(`already proficient with ${cats.join(' and ')} armor`);
      else return null; // grants armor the character lacks → not redundant
    } else if (e.prof_type === 'weapon' && e.count > 0 && !Array.isArray(e.items)) {
      // Count-choice weapon grant (Weapon Master) — pick any simple/martial, redundant only if ALL held.
      sawProfGrant = true;
      if (hasAllWeapons) reasons.push('already has all weapon proficiencies (simple and martial)');
      else return null;
    } else if (e.prof_type === 'weapon' && Array.isArray(e.items)) {
      // Fixed weapon-category grant (Martial Weapon Training → 'Martial weapons').
      sawProfGrant = true;
      const allHeld = e.items.every((it) => {
        const l = String(it).toLowerCase();
        if (l.includes('martial')) return hasMartial;
        if (l.includes('simple')) return hasSimple;
        return false; // a specific named weapon — can't tell it's held → not redundant
      });
      if (allHeld) reasons.push('already proficient with martial weapons');
      else return null;
    }
  }
  return sawProfGrant && reasons.length ? reasons.join('; ') : null;
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

/**
 * Spell-grant specs a feat asks the player to fulfil at acquisition (Magic Initiate, etc.).
 * Pass a single feat object (the one being picked). Returns
 * [{ source_kind, cantrips, leveled:[{level,count}], fixed:[{name,level}], free_cast, ability, label }].
 */
export function getSpellGrantSpecs(feat) {
  if (!feat || !Array.isArray(feat.effects)) return [];
  return feat.effects
    .filter((e) => e.kind === 'spell_grant')
    .map((e) => ({
      source_kind: e.source_kind || 'class',
      cantrips: Number(e.cantrips) || 0,
      leveled: Array.isArray(e.leveled) ? e.leveled : [],
      fixed: Array.isArray(e.fixed) ? e.fixed : [],
      free_cast: e.free_cast || null,
      ability: e.ability || 'choice',
      label: e.label || feat.name,
    }));
}

/**
 * Spells a character has gained from feats — read from each feat instance's
 * `choices.spell_grant` snapshot (recorded by the acquisition picker). Returns
 * { cantrips:[{name,level,source}], leveled:[{name,level,source}],
 *   freeCasts:[{name,level,source,ability}],
 *   ritualBooks:[{featIndex,source,spells:[names]}] }. The Spells-tab Feats section consumes
 * this; free casts are 1/long rest; ritual books (Ritual Caster) are cast as rituals only and
 * are editable (the `featIndex` locates the feat instance to persist add/remove).
 */
export function getFeatGrantedSpells(feats = []) {
  const cantrips = [];
  const leveled = [];
  const freeCasts = [];
  const ritualBooks = [];
  (feats ?? []).forEach((f, featIndex) => {
    const sg = f?.choices?.spell_grant;
    if (!sg) return;
    const source = f.name;
    // Ritual Caster: a growable, editable ritual book (cast as rituals only — no free cast).
    // `featIndex` lets the Feats tab persist add/remove back to the right feat instance.
    if (sg.ritual) {
      ritualBooks.push({ featIndex, source, spells: [...(sg.ritual_book || [])] });
      return;
    }
    for (const name of sg.cantrips || []) cantrips.push({ name, level: 0, source });
    for (const s of sg.leveled || []) leveled.push({ name: s.name, level: s.level ?? 1, source });
    // Always-granted spells (Telekinetic's Mage Hand, Telepathic's Detect Thoughts, …).
    for (const fx of sg.fixed || []) {
      ((fx.level ?? 0) === 0 ? cantrips : leveled).push({ name: fx.name, level: fx.level ?? 0, source });
    }
    // Free casts (each 1/long rest). New snapshots store a `free_casts` list; tolerate an older
    // singular `free_cast` name for safety.
    const fcNames = sg.free_casts || (sg.free_cast ? [sg.free_cast] : []);
    const all = [...(sg.leveled || []), ...(sg.fixed || [])];
    for (const name of fcNames) {
      const lv = all.find((s) => s.name === name);
      freeCasts.push({ name, level: lv?.level ?? 1, source, ability: sg.ability, usedKey: featFreeCastUsedKey(name) });
    }
  });
  return { cantrips, leveled, freeCasts, ritualBooks };
}

/**
 * character_data key tracking whether a feat-granted spell's 1/long-rest free cast has been used.
 * MUST stay in sync with the backend `_feat_freecast_used_key` (players/characters/service.py),
 * which resets it on a long rest.
 */
export function featFreeCastUsedKey(name) {
  const slug = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `feat_freecast_${slug}_used`;
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
