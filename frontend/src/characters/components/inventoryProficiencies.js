// Gathers a character's weapon/armor/tool proficiencies for display in the Items
// tab: free-text from the class plus specific grants stored in character_data at
// creation (race weapon/armor/tool grants, chosen background/class/race tools).
import { CLASS_PROFICIENCIES_5E } from './classProficienciesData';
import { getFeatProficiencyGrants } from './featEffects';

const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];

const labelArmor = (items) => (items || []).map((a) => (/armor|shield/i.test(a) ? a : `${a} armor`));

export function gatherProficiencies({ charClass, characterData = {} } = {}) {
  const profs = CLASS_PROFICIENCIES_5E[charClass] || {};
  const cd = characterData || {};
  // Fixed proficiency grants from feats (Heavily/Lightly/Moderately Armored, etc.).
  const feat = getFeatProficiencyGrants(cd.feats);
  return {
    weapons: { text: profs.weapons || '', grants: dedup([...(cd.race_weapon_proficiencies || []), ...feat.weapons]) },
    armor: { text: profs.armor || '', grants: dedup([...(cd.race_armor_proficiencies || []), ...labelArmor(feat.armor)]) },
    tools: {
      text: profs.tools || '',
      grants: dedup([
        cd.race_tool_proficiency,
        ...(cd.race_tool_proficiencies || []),
        cd.background_tool_choice,
        cd.tool_choice,
        ...(cd.subclass_tool_proficiencies || []), // tools chosen via subclass features (e.g. Student of War)
        ...feat.tools,
      ]),
    },
  };
}
