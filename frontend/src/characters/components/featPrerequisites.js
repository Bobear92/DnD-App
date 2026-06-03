// Parse a D&D feat's free-text prerequisite into structured requirements and
// check them against a character context. Built for the Variant Human feat
// picker at character creation, but flow-agnostic so it can drive ASI-level
// feat selection later.
//
// Prerequisites are stored as free text (feat.prerequisites.text). We recognize
// four buckets; anything we can't interpret is ignored (fail-open) so a novel
// homebrew phrasing never traps the user behind a rule we can't evaluate:
//   ability — "Strength 13 or higher", "Intelligence or Wisdom 13+"   (any listed ability ≥ N)
//   spell   — "The ability to cast at least one spell", "spellcasting or pact magic"
//   armor   — "Proficiency with medium armor", "Heavy armor training"
//   level   — "Level 4+", "Level 19+"

const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const ABIL_ALT = ABILITY_NAMES.join('|');

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Parse prerequisite text → array of requirement objects.
 *   { kind:'ability', abilities:['strength', …], min:13 }
 *   { kind:'spell' }
 *   { kind:'armor', armor:'medium' }
 *   { kind:'level', min:4 }
 * Returns [] for empty/unrecognized text.
 */
export function parsePrerequisite(text) {
  const reqs = [];
  if (!text || typeof text !== 'string') return reqs;
  const lower = text.toLowerCase();

  // Ability scores: "<ability>( or <ability>)* <N>" → met if ANY listed ability ≥ N
  const abilRe = new RegExp(`((?:${ABIL_ALT})(?:\\s+or\\s+(?:${ABIL_ALT}))*)\\s+(\\d{1,2})\\+?`, 'gi');
  let m;
  while ((m = abilRe.exec(lower)) !== null) {
    const abilities = m[1].split(/\s+or\s+/i).map(a => a.trim()).filter(a => ABILITY_NAMES.includes(a));
    if (abilities.length) reqs.push({ kind: 'ability', abilities, min: parseInt(m[2], 10) });
  }

  // Spellcasting (any of these phrasings imply "must be able to cast")
  if (/cast at least one spell|\bspellcasting\b|\bpact magic\b/.test(lower)) {
    reqs.push({ kind: 'spell' });
  }

  // Armor proficiency / training (one feat may name only one category)
  const armorRe = /\b(light|medium|heavy)\s+armor\b/gi;
  const armorSet = new Set();
  while ((m = armorRe.exec(lower)) !== null) armorSet.add(m[1].toLowerCase());
  armorSet.forEach(armor => reqs.push({ kind: 'armor', armor }));

  // Level
  const lvl = lower.match(/\blevel\s+(\d{1,2})\+?/);
  if (lvl) reqs.push({ kind: 'level', min: parseInt(lvl[1], 10) });

  return reqs;
}

/**
 * Check a feat's prerequisites against a character context.
 *
 * ctx fields (any left null/undefined means "not knowable yet" → that bucket is
 * skipped, keeping the gate fail-open until the data exists):
 *   level              — number (1 at creation)
 *   className          — string, used only for the spell reason text
 *   scores             — { strength, dexterity, … } FINAL scores incl. racial ASIs
 *   abilityScoresKnown — boolean; false → ability requirements are not yet evaluated
 *   spellcaster        — boolean; can the character cast a spell at this level?
 *   armorProficiencies — string[] of categories ['light','medium','heavy']
 *
 * Returns { met, unmet:[{ kind, dependsOn:'ability'|'class'|'level', reason }] }.
 * `dependsOn` lets a multi-step flow decide which Next button a failure gates:
 * 'class'/'level' are known up front; 'ability' needs assigned scores.
 */
export function checkFeatPrerequisite(feat, ctx = {}) {
  const reqs = parsePrerequisite(feat?.prerequisites?.text);
  const unmet = [];

  for (const req of reqs) {
    if (req.kind === 'ability') {
      if (!ctx.abilityScoresKnown || !ctx.scores) continue; // not assigned yet → skip
      const best = Math.max(...req.abilities.map(a => ctx.scores[a] ?? 0));
      if (best < req.min) {
        const label = req.abilities.map(cap).join(' or ');
        unmet.push({
          kind: 'ability',
          dependsOn: 'ability',
          reason: `requires ${label} ${req.min}+ (highest is ${best})`,
        });
      }
    } else if (req.kind === 'spell') {
      if (ctx.spellcaster == null) continue; // unknown → skip
      if (!ctx.spellcaster) {
        unmet.push({
          kind: 'spell',
          dependsOn: 'class',
          reason: `requires the ability to cast a spell — ${ctx.className ?? 'this class'} can't at level ${ctx.level ?? 1}`,
        });
      }
    } else if (req.kind === 'armor') {
      if (ctx.armorProficiencies == null) continue; // unknown → skip
      if (!ctx.armorProficiencies.includes(req.armor)) {
        unmet.push({
          kind: 'armor',
          dependsOn: 'class',
          reason: `requires proficiency with ${req.armor} armor`,
        });
      }
    } else if (req.kind === 'level') {
      if (ctx.level == null) continue;
      if (ctx.level < req.min) {
        unmet.push({ kind: 'level', dependsOn: 'level', reason: `requires level ${req.min}` });
      }
    }
  }

  return { met: unmet.length === 0, unmet };
}
