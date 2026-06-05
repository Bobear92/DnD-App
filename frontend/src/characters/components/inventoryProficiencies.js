// Gathers a character's weapon/armor/tool proficiencies for display in the Items
// tab: free-text from the class plus specific grants stored in character_data at
// creation (race weapon/armor/tool grants, chosen background/class/race tools).
import { CLASS_PROFICIENCIES_5E } from './classProficienciesData';

const dedup = (arr) => [...new Set((arr || []).filter(Boolean))];

export function gatherProficiencies({ charClass, characterData = {} } = {}) {
  const profs = CLASS_PROFICIENCIES_5E[charClass] || {};
  const cd = characterData || {};
  return {
    weapons: { text: profs.weapons || '', grants: dedup(cd.race_weapon_proficiencies) },
    armor: { text: profs.armor || '', grants: dedup(cd.race_armor_proficiencies) },
    tools: {
      text: profs.tools || '',
      grants: dedup([
        cd.race_tool_proficiency,
        ...(cd.race_tool_proficiencies || []),
        cd.background_tool_choice,
        cd.tool_choice,
      ]),
    },
  };
}
