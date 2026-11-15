// One resolution point for which app features a campaign has switched on.
// Every surface (sidebar, route guard, settings, page sections) asks this helper
// instead of comparing `campaign_mode` itself, so splitting the mode into finer
// per-feature toggles later only changes this file.

export const CAMPAIGN_MODES = {
  full: 'full',
  worldbuilding: 'worldbuilding',
};

export function isWorldbuilding(campaign) {
  return campaign?.campaign_mode === CAMPAIGN_MODES.worldbuilding;
}

/**
 * @returns {{
 *   characters: boolean,        // character sheets (list, create, detail)
 *   encounters: boolean,        // GM initiative tool
 *   encyclopedia: boolean,      // D&D rules compendium + campaign spell/item homebrew
 *   ruleSettings: boolean,      // edition, alignment, ability scores, leveling, currency, starting gear, ASI
 *   npcCombatStats: boolean,    // the NPC stat block
 *   sessionCharacters: boolean, // "Characters Present" on a session
 * }}
 */
export function campaignFeatures(campaign) {
  const rules = !isWorldbuilding(campaign);
  return {
    characters: rules,
    encounters: rules,
    encyclopedia: rules,
    ruleSettings: rules,
    npcCombatStats: rules,
    sessionCharacters: rules,
  };
}
