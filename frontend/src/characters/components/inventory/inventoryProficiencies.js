// Gathers a character's weapon/armor/tool proficiencies for display in the Items
// tab: free-text from the class plus specific grants stored in character_data at
// creation (race weapon/armor/tool grants, chosen background/class/race tools).
//
// Redundancy filtering: a specific grant is dropped from the display when it is
// already covered by a broader proficiency the character has — from the class
// text OR another (broader) grant. e.g. a Fighter proficient in "Simple weapons,
// martial weapons" doesn't also list a racial Longsword/Shortbow grant; a Fighter
// with "All armor" doesn't list a Dwarf "Light/Medium armor" grant. The specific
// proficiency only shows when nothing broader already grants it. Dropping is safe
// for the downstream proficiency math (isWeaponProficient/isArmorProficient) —
// those still detect proficiency via the broad category that covered the grant.
import { CLASS_PROFICIENCIES_5E } from '@/characters/components/classData/classProficienciesData';
import { getFeatProficiencyGrants } from '@/characters/components/feats/featEffects';

const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];

const labelArmor = (items) => (items || []).map((a) => (/armor|shield/i.test(a) ? a : `${a} armor`));

// Fixed (non-choice) proficiency grants conferred by a subclass feature. Choice-based
// subclass grants live in subclassGrants.js; these are automatic riders.
//   Hexblade "Hex Warrior" (5e Warlock, L1): medium armor, shields, and martial weapons.
const SUBCLASS_PROF_GRANTS_5E = {
  Warlock: {
    'The Hexblade': { weapons: ['Martial weapons'], armor: ['Medium armor', 'Shields'] },
  },
};

// Standard 5e weapon categories, used to tell whether a specific weapon grant
// (e.g. "Longbow") is already covered by a "simple weapons"/"martial weapons"
// category proficiency. Names are matched case-insensitively.
const SIMPLE_WEAPONS = new Set([
  'club', 'dagger', 'greatclub', 'handaxe', 'javelin', 'light hammer', 'mace',
  'quarterstaff', 'sickle', 'spear', 'light crossbow', 'dart', 'shortbow', 'sling',
]);
const MARTIAL_WEAPONS = new Set([
  'battleaxe', 'flail', 'glaive', 'greataxe', 'greatsword', 'halberd', 'lance',
  'longsword', 'maul', 'morningstar', 'pike', 'rapier', 'scimitar', 'shortsword',
  'trident', 'war pick', 'warhammer', 'whip', 'blowgun', 'hand crossbow',
  'heavy crossbow', 'longbow', 'net',
]);

function weaponCategoryOf(name) {
  const n = (name || '').toLowerCase().trim();
  const forms = [n, n.replace(/s$/, '')]; // accept "Longswords" as well as "Longsword"
  if (forms.some((f) => SIMPLE_WEAPONS.has(f))) return 'simple';
  if (forms.some((f) => MARTIAL_WEAPONS.has(f))) return 'martial';
  return null;
}

const isBroadWeaponLabel = (g) => /^(simple|martial) weapons$/.test((g || '').toLowerCase().trim());

// Drop weapon grants already covered by a broader proficiency (class text or another grant).
function filterWeaponGrants(grants, text) {
  const t = (text || '').toLowerCase();
  const simpleAllFromText = t.includes('simple weapons');
  const martialAllFromText = t.includes('martial weapons');
  const grantSimpleAll = grants.some((g) => /^simple weapons$/.test(g.toLowerCase().trim()));
  const grantMartialAll = grants.some((g) => /^martial weapons$/.test(g.toLowerCase().trim()));
  return grants.filter((g) => {
    const gl = g.toLowerCase().trim();
    if (isBroadWeaponLabel(g)) {
      // A broad grant ("Martial weapons") is redundant only if the class TEXT already
      // covers it — never let the grant cover itself.
      return !t.includes(gl);
    }
    if (t.includes(gl)) return false; // class text names the weapon (plural class lists contain the singular)
    const cat = weaponCategoryOf(g);
    if (cat === 'simple' && (simpleAllFromText || grantSimpleAll)) return false;
    if (cat === 'martial' && (martialAllFromText || grantMartialAll)) return false;
    return true;
  });
}

// Drop armor grants already covered by the class armor text (e.g. "All armor" or the
// same category). Handles raw ("Medium") and labeled ("Medium armor", "Shields") grants.
function filterArmorGrants(grants, text) {
  const t = (text || '').toLowerCase();
  const allArmor = t.includes('all armor');
  return grants.filter((g) => {
    const gl = g.toLowerCase().trim();
    if (gl.includes('shield')) return !t.includes('shield');
    const tier = (gl.match(/light|medium|heavy/) || [])[0];
    if (tier) return !(allArmor || t.includes(tier));
    return !t.includes(gl);
  });
}

// Drop tool grants the class text already lists (tools have no category hierarchy —
// a plain substring match suffices).
function filterToolGrants(grants, text) {
  const t = (text || '').toLowerCase();
  return grants.filter((g) => !t.includes(g.toLowerCase().trim()));
}

export function gatherProficiencies({ charClass, subclass, edition = '5e', characterData = {} } = {}) {
  const profs = CLASS_PROFICIENCIES_5E[charClass] || {};
  const cd = characterData || {};
  // Fixed proficiency grants from feats (Heavily/Lightly/Moderately Armored, etc.).
  const feat = getFeatProficiencyGrants(cd.feats);
  const is2024 = edition === '5.5e' || edition === '2024';
  const sub = (!is2024 && SUBCLASS_PROF_GRANTS_5E[charClass]?.[subclass || cd.subclass]) || {};
  const weaponText = profs.weapons || '';
  const armorText = profs.armor || '';
  const toolText = profs.tools || '';
  // feat.weapons/armor = fixed grants (Heavily Armored, …); feat_*_proficiencies = count-choice
  // picks chosen at acquisition (Weapon Master weapons, Skilled tools).
  const weaponGrants = dedup([...(cd.race_weapon_proficiencies || []), ...feat.weapons, ...(cd.feat_weapon_proficiencies || []), ...(sub.weapons || [])]);
  const armorGrants = dedup([...(cd.race_armor_proficiencies || []), ...labelArmor(feat.armor), ...(sub.armor || [])]);
  const toolGrants = dedup([
    cd.race_tool_proficiency,
    ...(cd.race_tool_proficiencies || []),
    cd.background_tool_choice,
    cd.tool_choice,
    ...(cd.subclass_tool_proficiencies || []), // tools chosen via subclass features (e.g. Student of War)
    ...feat.tools,
    ...(cd.feat_tool_proficiencies || []), // tools chosen via a feat (Skilled)
  ]);
  return {
    weapons: { text: weaponText, grants: filterWeaponGrants(weaponGrants, weaponText) },
    armor: { text: armorText, grants: filterArmorGrants(armorGrants, armorText) },
    tools: { text: toolText, grants: filterToolGrants(toolGrants, toolText) },
  };
}
