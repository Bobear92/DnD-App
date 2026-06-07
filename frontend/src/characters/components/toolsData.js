// Tool identification for the character Items tab. Tools are stored as
// adventuring-gear inventory entries (the seed gives them item_category 'Tools'),
// but some chosen tools (e.g. "Mason's tools") are plain entries, so we also match
// against a known name list. All matching is case-insensitive.

export const ARTISAN_TOOLS = [
  "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools",
  "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools",
  "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
  "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
];
const OTHER_TOOLS = [
  "Thieves' Tools", "Navigator's Tools", "Disguise Kit", "Forgery Kit", "Herbalism Kit",
  "Poisoner's Kit", "Artisan's Tools",
];
const GAMING_SETS = ["Dice Set", "Dragonchess Set", "Playing Card Set", "Three-Dragon Ante Set", "Gaming Set"];
const INSTRUMENTS = [
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Horn", "Lute", "Lyre", "Pan Flute", "Shawm", "Viol", "Musical Instrument",
];

export const TOOL_NAMES = [...ARTISAN_TOOLS, ...OTHER_TOOLS, ...GAMING_SETS, ...INSTRUMENTS];

const TOOL_NAMES_LC = new Set(TOOL_NAMES.map((t) => t.toLowerCase()));

// Generic "pick one" tool placeholders granted by a background/class; the chosen
// tool name substitutes for these at character creation.
export const GENERIC_TOOL_PLACEHOLDERS = new Set(
  ["Artisan's Tools", "Musical Instrument", "Gaming Set"].map((t) => t.toLowerCase())
);

/** True if an inventory entry represents a tool (vs ordinary adventuring gear). */
export function isToolEntry(entry) {
  if (!entry) return false;
  if ((entry.item_category || '').toLowerCase() === 'tools') return true;
  return TOOL_NAMES_LC.has((entry.name || '').toLowerCase());
}

export function isGenericToolName(name) {
  return GENERIC_TOOL_PLACEHOLDERS.has((name || '').toLowerCase());
}
