/**
 * Registry of game-mechanic reference pages shown under the Encyclopedia
 * "Mechanics" tab. Each available entry has a routed static page
 * (/campaigns/:campaignId/encyclopedia/mechanics/:slug) AND, usually, a computed
 * surface elsewhere in the app (e.g. the Stats-tab JumpCard) that links back here.
 *
 * Adding a mechanic: author its page + (optionally) its computed surface, then
 * append an entry here. `available: false` renders a muted "Coming soon" card so
 * the planned set is visible without a live page.
 */
export const MECHANICS = [
  {
    slug: 'jump',
    title: 'Jumping',
    blurb: 'Long and high jumps, the running start, and how feats like Athlete change them.',
    available: true,
  },
  { slug: 'armor-class', title: 'Armor Class', blurb: 'How AC is built from armor, shields, DEX, and class features.', available: true },
  { slug: 'hit-dice', title: 'Hit Dice', blurb: 'Spending Hit Dice on a short rest and what you regain.', available: true },
  { slug: 'action-economy', title: 'Action Economy', blurb: 'Actions, bonus actions, reactions, and what falls outside them.', available: true },
  { slug: 'loading', title: 'Loading', blurb: 'Why a crossbow fires only once per turn, and how Crossbow Expert changes it.', available: true },
  // Roadmap — planned pages (render as muted "Coming soon" cards until built).
  { slug: 'conditions', title: 'Conditions', blurb: 'Blinded, prone, grappled, and the rest — what each status does to you.', available: false },
  { slug: 'concentration', title: 'Concentration', blurb: 'Keeping a spell going, the saving throw when you take damage, and what breaks it.', available: false },
];

export function getMechanic(slug) {
  return MECHANICS.find((m) => m.slug === slug) || null;
}
