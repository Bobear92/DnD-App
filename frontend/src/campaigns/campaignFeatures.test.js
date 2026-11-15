import { campaignFeatures, isWorldbuilding } from './campaignFeatures';

const KEYS = ['characters', 'encounters', 'encyclopedia', 'ruleSettings', 'npcCombatStats', 'sessionCharacters'];

describe('campaignFeatures', () => {
  it('turns every rules feature on for a full campaign', () => {
    const f = campaignFeatures({ campaign_mode: 'full' });
    KEYS.forEach(k => expect(f[k]).toBe(true));
  });

  it('turns every rules feature off in world-building mode', () => {
    const f = campaignFeatures({ campaign_mode: 'worldbuilding' });
    KEYS.forEach(k => expect(f[k]).toBe(false));
  });

  it('treats a campaign stored before the setting existed as full', () => {
    expect(campaignFeatures({}).characters).toBe(true);
    expect(campaignFeatures(null).encyclopedia).toBe(true);
    expect(isWorldbuilding(undefined)).toBe(false);
  });
});
